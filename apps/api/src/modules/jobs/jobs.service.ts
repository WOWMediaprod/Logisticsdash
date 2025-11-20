import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef } from "@nestjs/common";
import { JobStatus, NotificationType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CreateJobDto } from "./dto/create-job.dto";
import { JobQueryDto } from "./dto/job-query.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import { AmendJobDto } from "./dto/amend-job.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { TrackingV2Gateway } from "../tracking-v2/tracking-v2.gateway";

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => TrackingV2Gateway))
    private trackingGateway: TrackingV2Gateway
  ) {}

  async create(createJobDto: CreateJobDto) {
    const { companyId, clientId, containerId, specialNotes, jobType } = createJobDto;

    await this.verifyRelatedEntities(companyId, { clientId, containerId });

    const job = await this.prisma.job.create({
      data: {
        companyId,
        clientId,
        containerId,
        specialNotes,
        jobType: jobType || 'ONE_WAY',
        status: JobStatus.CREATED,
      },
      include: this.defaultJobInclude(),
    });

    // Auto-create waypoints based on job type
    if (jobType === 'EXPORT' || jobType === 'IMPORT') {
      await this.createWorkflowWaypoints(job.id, jobType);
    }

    return { success: true, data: job };
  }

  // Auto-create waypoints for EXPORT/IMPORT workflows
  private async createWorkflowWaypoints(jobId: string, jobType: 'EXPORT' | 'IMPORT') {
    const waypoints = [];

    if (jobType === 'EXPORT') {
      // EXPORT: Yard (pickup) → Customer/Port (delivery)
      waypoints.push(
        {
          jobId,
          name: 'Yard - Container Pickup',
          type: 'YARD',
          sequence: 1,
        },
        {
          jobId,
          name: 'Port/Customer - Delivery',
          type: 'DELIVERY',
          sequence: 2,
        }
      );
    } else if (jobType === 'IMPORT') {
      // IMPORT: Port (pickup) → Yard (delivery)
      waypoints.push(
        {
          jobId,
          name: 'Port - Container Pickup',
          type: 'PORT',
          sequence: 1,
        },
        {
          jobId,
          name: 'Yard - Container Return',
          type: 'YARD',
          sequence: 2,
        }
      );
    }

    if (waypoints.length > 0) {
      await this.prisma.waypoint.createMany({ data: waypoints });
    }
  }

  async findAll(query: JobQueryDto) {
    try {
      const { companyId, clientId, status, page = 1, limit = 10 } = query;
      const skip = (page - 1) * limit;

      const where = {
        companyId,
        ...(clientId && { clientId }),
        ...(status && { status }),
      };

      const [jobs, total] = await Promise.all([
        this.prisma.job.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            ...this.defaultJobInclude(),
            statusEvents: { orderBy: { timestamp: "desc" }, take: 1 },
          },
        }),
        this.prisma.job.count({ where }),
      ]);

      return {
        success: true,
        data: jobs,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('❌ [JobsService.findAll] Error:', error);
      console.error('❌ Query params:', JSON.stringify(query, null, 2));
      throw error;
    }
  }

  async getStats(companyId: string) {
    const [totalJobs, activeJobs, completedJobs, statusBreakdown] = await Promise.all([
      this.prisma.job.count({ where: { companyId } }),
      this.prisma.job.count({
        where: {
          companyId,
          status: {
            in: [JobStatus.ASSIGNED, JobStatus.IN_TRANSIT, JobStatus.AT_PICKUP, JobStatus.LOADED, JobStatus.AT_DELIVERY],
          },
        },
      }),
      this.prisma.job.count({ where: { companyId, status: JobStatus.COMPLETED } }),
      this.prisma.job.groupBy({ by: ["status"], where: { companyId }, _count: { status: true } }),
    ]);

    const recentJobs = await this.prisma.job.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        client: true,
        container: true,
        driver: true,
      },
    });

    return {
      success: true,
      data: {
        summary: {
          totalJobs,
          activeJobs,
          completedJobs,
          successRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
        },
        statusBreakdown: statusBreakdown.reduce<Record<string, number>>((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {}),
        recentJobs,
      },
    };
  }

  async findOne(id: string, companyId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, companyId },
      include: {
        ...this.defaultJobInclude(),
        waypoints: true,
        statusEvents: { orderBy: { timestamp: "desc" } },
        documents: true,
        tripPack: true,
        pod: true,
        economics: true,
        locationTracks: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
    });

    if (!job) {
      throw new NotFoundException("Job not found");
    }

    // Map location tracking data to lastLocation field (same format as tracking API)
    const jobWithLocation = {
      ...job,
      lastLocation: job.locationTracks && job.locationTracks.length > 0 ? {
        lat: job.locationTracks[0].lat,
        lng: job.locationTracks[0].lng,
        timestamp: job.locationTracks[0].timestamp,
        speed: job.locationTracks[0].speed,
        heading: job.locationTracks[0].heading,
        accuracy: job.locationTracks[0].accuracy,
      } : null
    };

    return { success: true, data: jobWithLocation };
  }

  async update(id: string, companyId: string, updateJobDto: UpdateJobDto) {
    await this.ensureJobExists(id, companyId);

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: updateJobDto,
      include: this.defaultJobInclude(),
    });

    return { success: true, data: updatedJob };
  }

  async assignJob(id: string, companyId: string, assignDto: { driverId: string; vehicleId: string; trailerId?: string; assignedBy: string }) {
    await this.ensureJobExists(id, companyId);

    const [driver, vehicle, trailer] = await Promise.all([
      this.prisma.driver.findFirst({ where: { id: assignDto.driverId, companyId } }),
      this.prisma.vehicle.findFirst({ where: { id: assignDto.vehicleId, companyId } }),
      assignDto.trailerId ? this.prisma.trailer.findFirst({ where: { id: assignDto.trailerId, companyId } }) : null,
    ]);

    if (!driver) {
      throw new BadRequestException("Driver not found or does not belong to your company");
    }
    if (!vehicle) {
      throw new BadRequestException("Vehicle not found or does not belong to your company");
    }
    if (assignDto.trailerId && !trailer) {
      throw new BadRequestException("Trailer not found or does not belong to your company");
    }

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        driverId: assignDto.driverId,
        vehicleId: assignDto.vehicleId,
        trailerId: assignDto.trailerId || null,
        assignedBy: assignDto.assignedBy,
        status: JobStatus.ASSIGNED,
      },
      include: this.defaultJobInclude(),
    });

    const noteText = trailer
      ? `Job assigned to ${driver.name} with vehicle ${vehicle.regNo} and trailer ${trailer.regNo}`
      : `Job assigned to ${driver.name} with vehicle ${vehicle.regNo}`;

    await this.prisma.statusEvent.create({
      data: {
        jobId: id,
        code: "JOB_ASSIGNED",
        note: noteText,
        source: "MANUAL",
      },
    });

    return { success: true, data: updatedJob };
  }

  async updateStatus(id: string, companyId: string, statusDto: { status: string; note?: string }) {
    await this.ensureJobExists(id, companyId);

    const validStatuses = Object.values(JobStatus);
    if (!validStatuses.includes(statusDto.status as JobStatus)) {
      throw new BadRequestException("Invalid job status");
    }

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        status: statusDto.status as JobStatus,
        ...(statusDto.status === JobStatus.COMPLETED && { dropTs: new Date() }),
      },
      include: this.defaultJobInclude(),
    });

    await this.prisma.statusEvent.create({
      data: {
        jobId: id,
        code: `STATUS_${statusDto.status}`,
        note: statusDto.note || `Status updated to ${statusDto.status}`,
        source: "MANUAL",
      },
    });

    // Broadcast status change to client via WebSocket
    if (updatedJob.clientId) {
      this.trackingGateway.broadcastToClient(updatedJob.clientId, 'job-status-update', {
        jobId: id,
        status: statusDto.status,
        timestamp: new Date().toISOString(),
        note: statusDto.note,
      });
    }

    return { success: true, data: updatedJob };
  }

  /**
   * Amend a job with change tracking and notifications
   */
  async amendJob(id: string, companyId: string, amendDto: AmendJobDto) {
    // 1. Get current job state
    const currentJob = await this.prisma.job.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        driver: true,
        vehicle: true,
        container: true,
      },
    });

    if (!currentJob) {
      throw new NotFoundException("Job not found");
    }

    // 2. Validate amendments based on job status
    this.validateAmendments(currentJob.status, amendDto);

    // 3. Detect changes
    const changes = this.detectChanges(currentJob, amendDto);

    if (changes.length === 0) {
      throw new BadRequestException("No changes detected");
    }

    // 4. Update the job
    const updatedData: any = {};
    if (amendDto.clientId !== undefined) updatedData.clientId = amendDto.clientId;
    if (amendDto.containerId !== undefined) updatedData.containerId = amendDto.containerId;
    if (amendDto.vehicleId !== undefined) updatedData.vehicleId = amendDto.vehicleId;
    if (amendDto.driverId !== undefined) updatedData.driverId = amendDto.driverId;
    if (amendDto.jobType !== undefined) updatedData.jobType = amendDto.jobType;
    if (amendDto.status !== undefined) updatedData.status = amendDto.status;
    if (amendDto.priority !== undefined) updatedData.priority = amendDto.priority;
    if (amendDto.specialNotes !== undefined) updatedData.specialNotes = amendDto.specialNotes;
    if (amendDto.pickupTs !== undefined) updatedData.pickupTs = new Date(amendDto.pickupTs);
    if (amendDto.dropTs !== undefined) updatedData.dropTs = new Date(amendDto.dropTs);
    if (amendDto.etaTs !== undefined) updatedData.etaTs = new Date(amendDto.etaTs);
    if (amendDto.trackingEnabled !== undefined) updatedData.trackingEnabled = amendDto.trackingEnabled;
    if (amendDto.shareTrackingLink !== undefined) updatedData.shareTrackingLink = amendDto.shareTrackingLink;

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: updatedData,
      include: this.defaultJobInclude(),
    });

    // 5. Create JobUpdate record for audit trail
    const jobUpdate = await this.prisma.jobUpdate.create({
      data: {
        jobId: id,
        updateType: 'AMENDMENT',
        title: 'Job Amended',
        description: amendDto.amendmentReason,
        status: updatedJob.status,
        updatedBy: amendDto.amendedBy,
        isVisibleToClient: true,
        metadata: {
          changes,
          amendedAt: new Date(),
        },
      },
    });

    // 6. Send notifications to driver if changes are relevant
    if (amendDto.notifyDriver !== false && currentJob.driverId) {
      const driverChanges = this.getDriverRelevantChanges(changes);
      if (driverChanges.length > 0) {
        await this.notificationsService.sendToDriver(
          currentJob.driverId,
          companyId,
          'Job Updated',
          `Job ${id.substring(0, 8)} has been updated: ${this.formatChangesForDriver(driverChanges)}`,
          id,
          { changes: driverChanges, jobUpdateId: jobUpdate.id }
        );
      }
    }

    // 7. Send notifications to client if changes are visible
    if (amendDto.notifyClient !== false && currentJob.clientId) {
      const clientChanges = this.getClientRelevantChanges(changes);
      if (clientChanges.length > 0) {
        await this.notificationsService.sendToClient(
          currentJob.clientId,
          companyId,
          'Job Updated',
          `Your job has been updated: ${this.formatChangesForClient(clientChanges)}`,
          id,
          { changes: clientChanges, jobUpdateId: jobUpdate.id }
        );
      }
    }

    // 8. Create status event for the amendment
    await this.prisma.statusEvent.create({
      data: {
        jobId: id,
        code: 'JOB_AMENDED',
        note: `Job amended: ${amendDto.amendmentReason}`,
        source: 'MANUAL',
      },
    });

    // 9. Broadcast amendment via WebSocket for real-time updates
    this.trackingGateway.broadcastJobAmendment({
      jobId: id,
      companyId,
      driverId: currentJob.driverId || undefined,
      clientId: currentJob.clientId || undefined,
      changes,
      amendedBy: amendDto.amendedBy,
      amendmentReason: amendDto.amendmentReason,
    });

    return {
      success: true,
      data: {
        job: updatedJob,
        amendment: jobUpdate,
        changes,
      },
    };
  }

  /**
   * Get job amendment history
   */
  async getJobHistory(id: string, companyId: string) {
    await this.ensureJobExists(id, companyId);

    const history = await this.prisma.jobUpdate.findMany({
      where: { jobId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: history,
    };
  }

  /**
   * Validate amendments based on job status
   */
  private validateAmendments(status: JobStatus, amendDto: AmendJobDto) {
    // Define which fields can be amended at each status
    const restrictions: Record<JobStatus, string[]> = {
      [JobStatus.CREATED]: [], // All fields allowed
      [JobStatus.ASSIGNED]: [], // All fields allowed
      [JobStatus.IN_TRANSIT]: ['containerId', 'vehicleId', 'jobType'], // Cannot change these during transit
      [JobStatus.AT_PICKUP]: ['containerId', 'pickupTs', 'jobType'], // Cannot change container, pickup time, or type at pickup
      [JobStatus.LOADED]: ['containerId', 'vehicleId', 'pickupTs', 'jobType'], // Cannot change these after loading
      [JobStatus.AT_DELIVERY]: ['containerId', 'vehicleId', 'pickupTs', 'dropTs', 'jobType', 'driverId'], // Very limited changes
      [JobStatus.DELIVERED]: Object.keys(amendDto).filter(k => k !== 'status'), // Only status can be changed (admin override)
      [JobStatus.COMPLETED]: Object.keys(amendDto).filter(k => k !== 'status'), // Only status can be changed
      [JobStatus.CANCELLED]: Object.keys(amendDto).filter(k => k !== 'status'), // Only status can be changed
      [JobStatus.ON_HOLD]: [], // All fields allowed while on hold
    };

    const restrictedFields = restrictions[status] || [];
    const attemptedFields = Object.keys(amendDto).filter(
      (key) => amendDto[key as keyof AmendJobDto] !== undefined
    );

    const violations = attemptedFields.filter((field) => restrictedFields.includes(field));

    if (violations.length > 0) {
      throw new BadRequestException(
        `Cannot amend ${violations.join(', ')} when job status is ${status}`
      );
    }
  }

  /**
   * Detect changes between current and amended data
   */
  private detectChanges(currentJob: any, amendDto: AmendJobDto) {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    const fieldMap: Record<string, string> = {
      clientId: 'Client',
      containerId: 'Container',
      vehicleId: 'Vehicle',
      driverId: 'Driver',
      jobType: 'Job Type',
      status: 'Status',
      priority: 'Priority',
      specialNotes: 'Special Notes',
      pickupTs: 'Pickup Time',
      dropTs: 'Delivery Time',
      etaTs: 'ETA',
      trackingEnabled: 'GPS Tracking',
      shareTrackingLink: 'Tracking Link',
    };

    Object.keys(amendDto).forEach((key) => {
      if (
        key !== 'amendmentReason' &&
        key !== 'amendedBy' &&
        key !== 'notifyDriver' &&
        key !== 'notifyClient'
      ) {
        const newValue = amendDto[key as keyof AmendJobDto];
        const oldValue = currentJob[key];

        if (newValue !== undefined && newValue !== oldValue) {
          changes.push({
            field: fieldMap[key] || key,
            oldValue: oldValue instanceof Date ? oldValue.toISOString() : oldValue,
            newValue: (newValue as any) instanceof Date ? (newValue as unknown as Date).toISOString() : newValue,
          });
        }
      }
    });

    return changes;
  }

  /**
   * Get changes relevant to driver
   */
  private getDriverRelevantChanges(changes: any[]) {
    const relevantFields = ['Pickup Time', 'Delivery Time', 'Priority', 'Special Notes', 'Container', 'Vehicle', 'Driver', 'Job Type', 'Status'];
    return changes.filter((c) => relevantFields.includes(c.field));
  }

  /**
   * Get changes relevant to client
   */
  private getClientRelevantChanges(changes: any[]) {
    const relevantFields = ['Delivery Time', 'ETA', 'Priority'];
    return changes.filter((c) => relevantFields.includes(c.field));
  }

  /**
   * Format changes for driver notification
   */
  private formatChangesForDriver(changes: any[]): string {
    return changes.map((c) => `${c.field} changed`).join(', ');
  }

  /**
   * Format changes for client notification
   */
  private formatChangesForClient(changes: any[]): string {
    return changes.map((c) => `${c.field} updated`).join(', ');
  }

  async remove(id: string, companyId: string) {
    await this.ensureJobExists(id, companyId);
    await this.prisma.job.delete({ where: { id } });

    return { success: true, message: "Job deleted successfully" };
  }

  private async verifyRelatedEntities(companyId: string, ids: { clientId?: string | null; containerId?: string | null }) {
    if (ids.clientId) {
      const client = await this.prisma.client.findFirst({ where: { id: ids.clientId, companyId } });
      if (!client) {
        throw new BadRequestException("Client not found or does not belong to your company");
      }
    }

    if (ids.containerId) {
      const container = await this.prisma.container.findFirst({ where: { id: ids.containerId, companyId } });
      if (!container) {
        throw new BadRequestException("Container not found or does not belong to your company");
      }
    }
  }

  private async ensureJobExists(id: string, companyId: string) {
    const job = await this.prisma.job.findFirst({ where: { id, companyId } });
    if (!job) {
      throw new NotFoundException("Job not found");
    }
    return job;
  }

  private defaultJobInclude() {
    return {
      client: true,
      container: true,
      vehicle: true,
      trailer: true,
      driver: true,
      assignedByUser: { select: { id: true, firstName: true, lastName: true } },
    };
  }
}
