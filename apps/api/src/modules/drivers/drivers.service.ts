import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async create(createDriverDto: CreateDriverDto) {
    const driver = await this.prisma.driver.create({
      data: {
        companyId: createDriverDto.companyId,
        name: createDriverDto.name,
        licenseNo: createDriverDto.licenseNo,
        phone: createDriverDto.phone,
        email: createDriverDto.email,
        isActive: createDriverDto.isActive !== undefined ? createDriverDto.isActive : true,
      },
    });

    return {
      success: true,
      data: driver,
    };
  }

  async findAll(companyId: string, isActive?: boolean) {
    const where: any = { companyId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const drivers = await this.prisma.driver.findMany({
      where,
      select: {
        id: true,
        name: true,
        licenseNo: true,
        phone: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: drivers,
    };
  }

  async findOne(id: string, companyId: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { id, companyId },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return {
      success: true,
      data: driver,
    };
  }

  async update(id: string, companyId: string, updateDriverDto: UpdateDriverDto) {
    const driver = await this.prisma.driver.findFirst({
      where: { id, companyId },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const updatedDriver = await this.prisma.driver.update({
      where: { id },
      data: {
        name: updateDriverDto.name,
        licenseNo: updateDriverDto.licenseNo,
        phone: updateDriverDto.phone,
        email: updateDriverDto.email,
        isActive: updateDriverDto.isActive,
      },
    });

    return {
      success: true,
      data: updatedDriver,
    };
  }

  async remove(id: string, companyId: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { id, companyId },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    await this.prisma.driver.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Driver deleted successfully',
    };
  }

  async getDriverJobs(driverId: string, companyId: string, status?: string) {
    // Verify driver exists and belongs to company
    const driver = await this.prisma.driver.findFirst({
      where: { id: driverId, companyId },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const where: any = {
      driverId,
      companyId,
    };

    if (status) {
      where.status = status;
    }

    const jobs = await this.prisma.job.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, code: true },
        },
        route: {
          select: { id: true, code: true, origin: true, destination: true, kmEstimate: true },
        },
        vehicle: {
          select: { id: true, regNo: true, class: true },
        },
        container: {
          select: { id: true, iso: true, size: true },
        },
        documents: {
          select: { id: true, fileName: true, fileUrl: true, type: true, createdAt: true },
        },
        waypoints: {
          select: { id: true, name: true, type: true, sequence: true, isCompleted: true, completedAt: true, address: true },
          orderBy: { sequence: 'asc' },
        },
        earnings: {
          where: { driverId },
          select: {
            id: true,
            baseAmount: true,
            distanceBonus: true,
            timeBonus: true,
            nightShiftBonus: true,
            totalAmount: true,
            currency: true,
            status: true,
            paidAt: true,
          },
        },
        pod: {
          select: {
            id: true,
            recipientName: true,
            signatureUrl: true,
            photoUrls: true,
            deliveryNotes: true,
            deliveredAt: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // Active jobs first
        { createdAt: 'desc' },
      ],
    });

    return {
      success: true,
      data: jobs,
      meta: {
        total: jobs.length,
        active: jobs.filter(j => ['ASSIGNED', 'IN_TRANSIT', 'AT_PICKUP', 'LOADED', 'AT_DELIVERY'].includes(j.status)).length,
        completed: jobs.filter(j => j.status === 'COMPLETED').length,
      },
    };
  }
}
