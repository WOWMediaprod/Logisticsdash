import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async create(createVehicleDto: CreateVehicleDto) {
    const vehicle = await this.prisma.vehicle.create({
      data: {
        companyId: createVehicleDto.companyId,
        regNo: createVehicleDto.regNo,
        class: createVehicleDto.class,
        make: createVehicleDto.make,
        model: createVehicleDto.model,
        year: createVehicleDto.year,
        kmpl: createVehicleDto.kmpl !== undefined ? createVehicleDto.kmpl : 8.0,
        leasePerDay: createVehicleDto.leasePerDay !== undefined ? createVehicleDto.leasePerDay : 0,
        maintPerKm: createVehicleDto.maintPerKm !== undefined ? createVehicleDto.maintPerKm : 0,
        currentOdo: createVehicleDto.currentOdo !== undefined ? createVehicleDto.currentOdo : 0,
        isActive: createVehicleDto.isActive !== undefined ? createVehicleDto.isActive : true,
      },
    });

    return {
      success: true,
      data: vehicle,
    };
  }

  async findAll(companyId: string, isActive?: boolean) {
    const where: any = { companyId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      select: {
        id: true,
        regNo: true,
        class: true,
        make: true,
        model: true,
        year: true,
        kmpl: true,
        leasePerDay: true,
        maintPerKm: true,
        currentOdo: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { regNo: 'asc' },
    });

    return {
      success: true,
      data: vehicles,
    };
  }

  async findOne(id: string, companyId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, companyId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return {
      success: true,
      data: vehicle,
    };
  }

  async update(id: string, companyId: string, updateVehicleDto: UpdateVehicleDto) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, companyId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        regNo: updateVehicleDto.regNo,
        class: updateVehicleDto.class,
        make: updateVehicleDto.make,
        model: updateVehicleDto.model,
        year: updateVehicleDto.year,
        kmpl: updateVehicleDto.kmpl,
        leasePerDay: updateVehicleDto.leasePerDay,
        maintPerKm: updateVehicleDto.maintPerKm,
        currentOdo: updateVehicleDto.currentOdo,
        isActive: updateVehicleDto.isActive,
      },
    });

    return {
      success: true,
      data: updatedVehicle,
    };
  }

  async remove(id: string, companyId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, companyId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    await this.prisma.vehicle.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Vehicle deleted successfully',
    };
  }
}
