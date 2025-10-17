import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateJobRequestDto } from './dto/create-job-request.dto';
import { UpdateJobRequestDto } from './dto/update-job-request.dto';
import { JobRequestQueryDto } from './dto/job-request-query.dto';

@Injectable()
export class JobRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(createJobRequestDto: CreateJobRequestDto) {
    const jobRequest = await this.prisma.jobRequest.create({
      data: {
        companyId: createJobRequestDto.companyId,
        clientId: createJobRequestDto.clientId,
        routeId: createJobRequestDto.routeId,
        requestedBy: createJobRequestDto.requestedBy,
        title: createJobRequestDto.title,
        description: createJobRequestDto.description,
        priority: createJobRequestDto.priority || 'NORMAL',
        jobType: createJobRequestDto.jobType || 'ONE_WAY',
        requestedPickupTs: createJobRequestDto.requestedPickupTs
          ? new Date(createJobRequestDto.requestedPickupTs)
          : null,
        requestedDropTs: createJobRequestDto.requestedDropTs
          ? new Date(createJobRequestDto.requestedDropTs)
          : null,
        pickupAddress: createJobRequestDto.pickupAddress,
        deliveryAddress: createJobRequestDto.deliveryAddress,
        pickupLat: createJobRequestDto.pickupLat,
        pickupLng: createJobRequestDto.pickupLng,
        deliveryLat: createJobRequestDto.deliveryLat,
        deliveryLng: createJobRequestDto.deliveryLng,
        containerType: createJobRequestDto.containerType,
        specialRequirements: createJobRequestDto.specialRequirements,
        estimatedValue: createJobRequestDto.estimatedValue,
      },
      include: {
        client: true,
        company: true,
      },
    });

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
          documents: true,
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
    const jobRequest = await this.prisma.jobRequest.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        documents: true,
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
      throw new NotFoundException('Job request not found');
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
        requestedPickupTs: updateJobRequestDto.requestedPickupTs
          ? new Date(updateJobRequestDto.requestedPickupTs)
          : undefined,
        requestedDropTs: updateJobRequestDto.requestedDropTs
          ? new Date(updateJobRequestDto.requestedDropTs)
          : undefined,
        pickupAddress: updateJobRequestDto.pickupAddress,
        deliveryAddress: updateJobRequestDto.deliveryAddress,
        pickupLat: updateJobRequestDto.pickupLat,
        pickupLng: updateJobRequestDto.pickupLng,
        deliveryLat: updateJobRequestDto.deliveryLat,
        deliveryLng: updateJobRequestDto.deliveryLng,
        containerType: updateJobRequestDto.containerType,
        specialRequirements: updateJobRequestDto.specialRequirements,
        estimatedValue: updateJobRequestDto.estimatedValue,
      },
      include: {
        client: true,
        documents: true,
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
      include: { client: true },
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

    if (!jobRequest.routeId) {
      throw new Error('Cannot create job: Job request must have a route assigned. Please assign a route to this request first.');
    }

    // Create the job from the job request using the saved routeId and jobType
    const job = await this.prisma.job.create({
      data: {
        companyId,
        clientId: jobRequest.clientId!,
        routeId: jobRequest.routeId!,
        containerId: null, // Will be assigned later
        vehicleId: null, // Will be assigned later
        driverId: null, // Will be assigned later
        status: 'CREATED',
        jobType: jobRequest.jobType, // Use the jobType from the request
        priority: jobRequest.priority,
        pickupTs: jobRequest.requestedPickupTs,
        etaTs: jobRequest.requestedDropTs,
        specialNotes: jobRequest.specialRequirements || jobRequest.description,
      },
      include: {
        client: true,
        route: true,
      },
    });

    // Update the job request with acceptance info and link to job
    const updatedJobRequest = await this.prisma.jobRequest.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        reviewedBy: null, // TODO: Use actual user ID from auth context
        reviewedAt: new Date(),
        reviewNotes,
        jobId: job.id,
      },
      include: {
        client: true,
        documents: true,
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
        documents: true,
      },
    });

    return {
      success: true,
      data: updatedJobRequest,
      message: 'Job request declined successfully',
    };
  }
}
