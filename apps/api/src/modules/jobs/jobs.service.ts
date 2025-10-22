import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { JobStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CreateJobDto } from "./dto/create-job.dto";
import { JobQueryDto } from "./dto/job-query.dto";
import { UpdateJobDto } from "./dto/update-job.dto";

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async create(createJobDto: CreateJobDto) {
    const { companyId, clientId, routeId, containerId, specialNotes, jobType } = createJobDto;

    await this.verifyRelatedEntities(companyId, { clientId, routeId, containerId });

    const job = await this.prisma.job.create({
      data: {
        companyId,
        clientId,
        routeId,
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
        route: true,
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
      },
    });

    if (!job) {
      throw new NotFoundException("Job not found");
    }

    return { success: true, data: job };
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

  async assignJob(id: string, companyId: string, assignDto: { driverId: string; vehicleId: string; assignedBy: string }) {
    await this.ensureJobExists(id, companyId);

    const [driver, vehicle] = await Promise.all([
      this.prisma.driver.findFirst({ where: { id: assignDto.driverId, companyId } }),
      this.prisma.vehicle.findFirst({ where: { id: assignDto.vehicleId, companyId } }),
    ]);

    if (!driver) {
      throw new BadRequestException("Driver not found or does not belong to your company");
    }
    if (!vehicle) {
      throw new BadRequestException("Vehicle not found or does not belong to your company");
    }

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        driverId: assignDto.driverId,
        vehicleId: assignDto.vehicleId,
        assignedBy: assignDto.assignedBy,
        status: JobStatus.ASSIGNED,
      },
      include: this.defaultJobInclude(),
    });

    await this.prisma.statusEvent.create({
      data: {
        jobId: id,
        code: "JOB_ASSIGNED",
        note: `Job assigned to ${driver.name} with vehicle ${vehicle.regNo}`,
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

    return { success: true, data: updatedJob };
  }

  async remove(id: string, companyId: string) {
    await this.ensureJobExists(id, companyId);
    await this.prisma.job.delete({ where: { id } });

    return { success: true, message: "Job deleted successfully" };
  }

  private async verifyRelatedEntities(companyId: string, ids: { clientId?: string | null; routeId?: string | null; containerId?: string | null }) {
    if (ids.clientId) {
      const client = await this.prisma.client.findFirst({ where: { id: ids.clientId, companyId } });
      if (!client) {
        throw new BadRequestException("Client not found or does not belong to your company");
      }
    }

    if (ids.routeId) {
      const route = await this.prisma.route.findFirst({ where: { id: ids.routeId, companyId } });
      if (!route) {
        throw new BadRequestException("Route not found or does not belong to your company");
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
      route: true,
      container: true,
      vehicle: true,
      driver: true,
      assignedByUser: { select: { id: true, firstName: true, lastName: true } },
    };
  }
}
