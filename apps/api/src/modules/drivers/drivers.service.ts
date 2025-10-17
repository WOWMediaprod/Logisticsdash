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
}
