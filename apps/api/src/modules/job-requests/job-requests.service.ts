import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateJobRequestDto } from './dto/create-job-request.dto';
import { UpdateJobRequestDto } from './dto/update-job-request.dto';
import { JobRequestQueryDto } from './dto/job-request-query.dto';

@Injectable()
export class JobRequestsService {
  private readonly logger = new Logger(JobRequestsService.name);

  constructor(private prisma: PrismaService) {}

  async create(createJobRequestDto: CreateJobRequestDto) {
    const jobRequest = await this.prisma.jobRequest.create({
      data: {
        companyId: createJobRequestDto.companyId,
        clientId: createJobRequestDto.clientId,
        requestedBy: createJobRequestDto.requestedBy,
        title: createJobRequestDto.title,
        description: createJobRequestDto.description,
        priority: createJobRequestDto.priority || 'NORMAL',

        // Legacy fields (for backward compatibility)
        jobType: createJobRequestDto.jobType || 'ONE_WAY',
        requestedPickupTs: createJobRequestDto.requestedPickupTs
          ? new Date(createJobRequestDto.requestedPickupTs)
          : null,
        requestedDeliveryTs: createJobRequestDto.requestedDropTs
          ? new Date(createJobRequestDto.requestedDropTs)
          : null,
        pickupAddress: createJobRequestDto.pickupAddress,
        pickupLat: createJobRequestDto.pickupLat,
        pickupLng: createJobRequestDto.pickupLng,
        containerSize: createJobRequestDto.containerType,

        // New workflow fields
        shipmentType: createJobRequestDto.shipmentType,
        releaseOrderUrl: createJobRequestDto.releaseOrderUrl,

        // Loading information
        loadingLocation: createJobRequestDto.loadingLocation,
        loadingLocationLat: createJobRequestDto.loadingLocationLat,
        loadingLocationLng: createJobRequestDto.loadingLocationLng,
        loadingContactName: createJobRequestDto.loadingContactName,
        loadingContactPhone: createJobRequestDto.loadingContactPhone,
        loadingDate: createJobRequestDto.loadingDate
          ? new Date(createJobRequestDto.loadingDate)
          : null,
        loadingTime: createJobRequestDto.loadingTime,

        // Container reservation
        containerReservation: createJobRequestDto.containerReservation || false,
        containerNumber: createJobRequestDto.containerNumber,
        sealNumber: createJobRequestDto.sealNumber,
        containerYardLocation: createJobRequestDto.containerYardLocation,
        containerYardLocationLat: createJobRequestDto.containerYardLocationLat,
        containerYardLocationLng: createJobRequestDto.containerYardLocationLng,

        // Cargo details
        cargoDescription: createJobRequestDto.cargoDescription,
        cargoWeight: createJobRequestDto.cargoWeight,
        cargoWeightUnit: createJobRequestDto.cargoWeightUnit || 'kg',

        // BL Cutoff
        blCutoffRequired: createJobRequestDto.blCutoffRequired || false,
        blCutoffDateTime: createJobRequestDto.blCutoffDateTime
          ? new Date(createJobRequestDto.blCutoffDateTime)
          : null,

        // Wharf information
        wharfName: createJobRequestDto.wharfName,
        wharfContact: createJobRequestDto.wharfContact,

        // Delivery information
        deliveryAddress: createJobRequestDto.deliveryAddress,
        deliveryLat: createJobRequestDto.deliveryLat,
        deliveryLng: createJobRequestDto.deliveryLng,
        deliveryContactName: createJobRequestDto.deliveryContactName,
        deliveryContactPhone: createJobRequestDto.deliveryContactPhone,

        // Additional notes
        specialInstructions: createJobRequestDto.specialInstructions,
        locationSharingEnabled: createJobRequestDto.locationSharingEnabled,
        heldUpFreeTime: createJobRequestDto.heldUpFreeTime,
      },
      include: {
        client: true,
        company: true,
        attachedDocuments: true, // Include attachedDocuments in initial creation
      },
    });

    // Link uploaded documents to this job request
    if (createJobRequestDto.supportingDocumentIds && createJobRequestDto.supportingDocumentIds.length > 0) {
      console.log(`[JobRequest Create] Linking ${createJobRequestDto.supportingDocumentIds.length} documents to job request ${jobRequest.id}`);
      console.log('[JobRequest Create] Document IDs:', createJobRequestDto.supportingDocumentIds);

      const updateResult = await this.prisma.document.updateMany({
        where: {
          id: { in: createJobRequestDto.supportingDocumentIds },
          companyId: createJobRequestDto.companyId,
        },
        data: {
          jobRequestId: jobRequest.id,
        },
      });

      console.log(`[JobRequest Create] Updated ${updateResult.count} documents with jobRequestId`);

      // Re-fetch the job request to include the newly linked documents
      const updatedJobRequest = await this.prisma.jobRequest.findUnique({
        where: { id: jobRequest.id },
        include: {
          client: true,
          company: true,
          attachedDocuments: true, // This will now include the linked documents
        },
      });

      console.log(`[JobRequest Create] Re-fetched job request has ${updatedJobRequest?.attachedDocuments?.length || 0} attached documents`);

      return { success: true, data: updatedJobRequest };
    }

    console.log('[JobRequest Create] No supporting documents to link');
    return { success: true, data: jobRequest };
  }

  async findAll(query: JobRequestQueryDto) {
    const { companyId, status, priority, clientId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const [jobRequests, total] = await Promise.all([
      this.prisma.jobRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: { id: true, name: true, code: true },
          },
          attachedDocuments: true,
          convertedToJob: {
            select: { id: true, driverId: true, status: true },
          },
        },
      }),
      this.prisma.jobRequest.count({ where }),
    ]);

    return {
      success: true,
      data: jobRequests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, companyId: string) {
    console.log(`[JobRequest FindOne] Fetching job request ${id} for company ${companyId}`);

    const jobRequest = await this.prisma.jobRequest.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        attachedDocuments: true,
        updates: {
          include: {
            updatedByUser: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!jobRequest) {
      console.log(`[JobRequest FindOne] Job request ${id} not found`);
      throw new NotFoundException('Job request not found');
    }

    console.log(`[JobRequest FindOne] Found job request with ${jobRequest.attachedDocuments?.length || 0} attached documents`);
    if (jobRequest.attachedDocuments && jobRequest.attachedDocuments.length > 0) {
      console.log('[JobRequest FindOne] Document IDs:', jobRequest.attachedDocuments.map(d => d.id));
    }

    return { success: true, data: jobRequest };
  }

  async update(id: string, companyId: string, updateJobRequestDto: UpdateJobRequestDto) {
    const jobRequest = await this.prisma.jobRequest.findFirst({
      where: { id, companyId },
    });

    if (!jobRequest) {
      throw new NotFoundException('Job request not found');
    }

    const updatedJobRequest = await this.prisma.jobRequest.update({
      where: { id },
      data: {
        title: updateJobRequestDto.title,
        description: updateJobRequestDto.description,
        priority: updateJobRequestDto.priority,

        // Legacy fields
        requestedPickupTs: updateJobRequestDto.requestedPickupTs
          ? new Date(updateJobRequestDto.requestedPickupTs)
          : undefined,
        requestedDeliveryTs: updateJobRequestDto.requestedDropTs
          ? new Date(updateJobRequestDto.requestedDropTs)
          : undefined,
        pickupAddress: updateJobRequestDto.pickupAddress,
        pickupLat: updateJobRequestDto.pickupLat,
        pickupLng: updateJobRequestDto.pickupLng,
        containerSize: updateJobRequestDto.containerType,

        // New workflow fields
        shipmentType: updateJobRequestDto.shipmentType,
        releaseOrderUrl: updateJobRequestDto.releaseOrderUrl,

        // Loading information
        loadingLocation: updateJobRequestDto.loadingLocation,
        loadingLocationLat: updateJobRequestDto.loadingLocationLat,
        loadingLocationLng: updateJobRequestDto.loadingLocationLng,
        loadingContactName: updateJobRequestDto.loadingContactName,
        loadingContactPhone: updateJobRequestDto.loadingContactPhone,
        loadingDate: updateJobRequestDto.loadingDate
          ? new Date(updateJobRequestDto.loadingDate)
          : undefined,
        loadingTime: updateJobRequestDto.loadingTime,

        // Container reservation
        containerReservation: updateJobRequestDto.containerReservation,
        containerNumber: updateJobRequestDto.containerNumber,
        sealNumber: updateJobRequestDto.sealNumber,
        containerYardLocation: updateJobRequestDto.containerYardLocation,
        containerYardLocationLat: updateJobRequestDto.containerYardLocationLat,
        containerYardLocationLng: updateJobRequestDto.containerYardLocationLng,

        // Cargo details
        cargoDescription: updateJobRequestDto.cargoDescription,
        cargoWeight: updateJobRequestDto.cargoWeight,
        cargoWeightUnit: updateJobRequestDto.cargoWeightUnit,

        // BL Cutoff
        blCutoffRequired: updateJobRequestDto.blCutoffRequired,
        blCutoffDateTime: updateJobRequestDto.blCutoffDateTime
          ? new Date(updateJobRequestDto.blCutoffDateTime)
          : undefined,

        // Wharf information
        wharfName: updateJobRequestDto.wharfName,
        wharfContact: updateJobRequestDto.wharfContact,

        // Delivery information
        deliveryAddress: updateJobRequestDto.deliveryAddress,
        deliveryLat: updateJobRequestDto.deliveryLat,
        deliveryLng: updateJobRequestDto.deliveryLng,
        deliveryContactName: updateJobRequestDto.deliveryContactName,
        deliveryContactPhone: updateJobRequestDto.deliveryContactPhone,

        // Additional notes
        specialInstructions: updateJobRequestDto.specialInstructions,
        locationSharingEnabled: updateJobRequestDto.locationSharingEnabled,
        heldUpFreeTime: updateJobRequestDto.heldUpFreeTime,
      },
      include: {
        client: true,
        attachedDocuments: true,
      },
    });

    return { success: true, data: updatedJobRequest };
  }

  async remove(id: string, companyId: string) {
    const jobRequest = await this.prisma.jobRequest.findFirst({
      where: { id, companyId },
    });

    if (!jobRequest) {
      throw new NotFoundException('Job request not found');
    }

    await this.prisma.jobRequest.delete({ where: { id } });

    return { success: true, message: 'Job request deleted successfully' };
  }

  async getStats(companyId: string) {
    const [total, pending, underReview, accepted, declined] = await Promise.all([
      this.prisma.jobRequest.count({ where: { companyId } }),
      this.prisma.jobRequest.count({ where: { companyId, status: 'PENDING' } }),
      this.prisma.jobRequest.count({ where: { companyId, status: 'UNDER_REVIEW' } }),
      this.prisma.jobRequest.count({ where: { companyId, status: 'ACCEPTED' } }),
      this.prisma.jobRequest.count({ where: { companyId, status: 'DECLINED' } }),
    ]);

    return {
      success: true,
      data: {
        total,
        pending,
        underReview,
        accepted,
        declined,
      },
    };
  }

  async acceptAndCreateJob(
    id: string,
    companyId: string,
    reviewedBy: string,
    reviewNotes?: string,
  ) {
    // Find the job request
    const jobRequest = await this.prisma.jobRequest.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        attachedDocuments: true,
      },
    });

    if (!jobRequest) {
      throw new NotFoundException('Job request not found');
    }

    if (jobRequest.status === 'ACCEPTED') {
      throw new Error('Job request has already been accepted');
    }

    if (jobRequest.status === 'DECLINED' || jobRequest.status === 'CANCELLED') {
      throw new Error(`Cannot accept a ${jobRequest.status.toLowerCase()} job request`);
    }

    if (!jobRequest.clientId) {
      throw new Error('Cannot create job: Job request must have a client assigned. Please assign a client to this request first.');
    }

    // Create the job from the job request
    const job = await this.prisma.job.create({
      data: {
        companyId,
        clientId: jobRequest.clientId!,
        containerId: null, // Will be assigned later
        vehicleId: null, // Will be assigned later
        driverId: null, // Will be assigned later
        status: 'CREATED',
        jobType: jobRequest.jobType, // Use the jobType from the request
        priority: jobRequest.priority,
        pickupTs: jobRequest.requestedPickupTs,
        etaTs: jobRequest.requestedDeliveryTs, // Changed from requestedDropTs
        specialNotes: jobRequest.specialInstructions || jobRequest.description, // Changed from specialRequirements

        // Copy JobRequest details
        releaseOrderUrl: jobRequest.releaseOrderUrl,
        loadingLocation: jobRequest.loadingLocation,
        loadingLocationLat: jobRequest.loadingLocationLat,
        loadingLocationLng: jobRequest.loadingLocationLng,
        loadingContactName: jobRequest.loadingContactName,
        loadingContactPhone: jobRequest.loadingContactPhone,
        containerNumber: jobRequest.containerNumber,
        sealNumber: jobRequest.sealNumber,
        containerYardLocation: jobRequest.containerYardLocation,
        cargoDescription: jobRequest.cargoDescription,
        cargoWeight: jobRequest.cargoWeight,
        blCutoffRequired: jobRequest.blCutoffRequired,
        blCutoffDateTime: jobRequest.blCutoffDateTime,
        wharfName: jobRequest.wharfName,
        wharfContact: jobRequest.wharfContact,
        deliveryAddress: jobRequest.deliveryAddress,
        deliveryContactName: jobRequest.deliveryContactName,
        deliveryContactPhone: jobRequest.deliveryContactPhone,
      },
      include: {
        client: true,
      },
    });

    // Auto-create PICKUP/LOADING and DELIVERY waypoints from job request addresses
    const waypointsToCreate: any[] = [];

    // Use new loading location if available, otherwise fall back to legacy pickup address
    const pickupLocation = jobRequest.loadingLocation || jobRequest.pickupAddress;
    const pickupLat = jobRequest.loadingLocationLat || jobRequest.pickupLat;
    const pickupLng = jobRequest.loadingLocationLng || jobRequest.pickupLng;

    if (pickupLocation && pickupLat && pickupLng) {
      waypointsToCreate.push({
        jobId: job.id,
        name: jobRequest.loadingLocation ? 'Loading Location' : 'Pickup Location',
        type: 'PICKUP',
        sequence: 1,
        address: pickupLocation,
        lat: pickupLat,
        lng: pickupLng,
        radiusM: 150,
      });
    }

    if (jobRequest.deliveryAddress && jobRequest.deliveryLat && jobRequest.deliveryLng) {
      waypointsToCreate.push({
        jobId: job.id,
        name: 'Delivery Location',
        type: 'DELIVERY',
        sequence: waypointsToCreate.length + 1,
        address: jobRequest.deliveryAddress,
        lat: jobRequest.deliveryLat,
        lng: jobRequest.deliveryLng,
        radiusM: 150,
      });
    }

    // Create waypoints if any exist
    if (waypointsToCreate.length > 0) {
      await this.prisma.waypoint.createMany({
        data: waypointsToCreate,
      });
    }

    // Transfer documents from job request to job
    if (jobRequest.attachedDocuments && jobRequest.attachedDocuments.length > 0) {
      this.logger.log(
        `[Job Create] Linking ${jobRequest.attachedDocuments.length} documents from job request ${jobRequest.id} to job ${job.id}`,
      );

      await this.prisma.document.updateMany({
        where: {
          jobRequestId: jobRequest.id,
          companyId,
        },
        data: {
          jobId: job.id,
          // Keep jobRequestId for audit trail
        },
      });

      this.logger.log(`[Job Create] Documents successfully linked to job ${job.id}`);
    }

    // Update the job request with acceptance info and link to job
    const updatedJobRequest = await this.prisma.jobRequest.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        reviewedBy: null, // TODO: Use actual user ID from auth context
        reviewedAt: new Date(),
        reviewNotes,
        convertedToJobId: job.id, // Changed from jobId
      },
      include: {
        client: true,
        attachedDocuments: true,
      },
    });

    return {
      success: true,
      data: {
        jobRequest: updatedJobRequest,
        job,
      },
      message: `Job request accepted and job ${job.id} created successfully`,
    };
  }

  async declineRequest(
    id: string,
    companyId: string,
    reviewedBy: string,
    reviewNotes: string,
  ) {
    const jobRequest = await this.prisma.jobRequest.findFirst({
      where: { id, companyId },
    });

    if (!jobRequest) {
      throw new NotFoundException('Job request not found');
    }

    if (jobRequest.status === 'ACCEPTED' || jobRequest.status === 'DECLINED') {
      throw new Error(`Job request has already been ${jobRequest.status.toLowerCase()}`);
    }

    const updatedJobRequest = await this.prisma.jobRequest.update({
      where: { id },
      data: {
        status: 'DECLINED',
        reviewedBy: null, // TODO: Use actual user ID from auth context
        reviewedAt: new Date(),
        reviewNotes,
      },
      include: {
        client: true,
        attachedDocuments: true,
      },
    });

    return {
      success: true,
      data: updatedJobRequest,
      message: 'Job request declined successfully',
    };
  }
}
