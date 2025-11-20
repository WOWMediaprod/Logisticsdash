import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTrailerDto } from './dto/create-trailer.dto';
import { UpdateTrailerDto } from './dto/update-trailer.dto';

@Injectable()
export class TrailersService {
  constructor(private prisma: PrismaService) {}

  async create(createTrailerDto: CreateTrailerDto) {
    const trailer = await this.prisma.trailer.create({
      data: {
        companyId: createTrailerDto.companyId,
        regNo: createTrailerDto.regNo,
        type: createTrailerDto.type,
        make: createTrailerDto.make,
        model: createTrailerDto.model,
        year: createTrailerDto.year,
        capacity: createTrailerDto.capacity,
        axles: createTrailerDto.axles,
        leasePerDay: createTrailerDto.leasePerDay,
        maintPerKm: createTrailerDto.maintPerKm,
        isActive: createTrailerDto.isActive !== undefined ? createTrailerDto.isActive : true,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    return { success: true, data: trailer };
  }

  async findAll(companyId: string, isActive?: string) {
    const where: any = { companyId };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const trailers = await this.prisma.trailer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { jobs: true, maintenance: true },
        },
      },
    });

    return { success: true, data: trailers };
  }

  async findOne(id: string, companyId: string) {
    const trailer = await this.prisma.trailer.findFirst({
      where: { id, companyId },
      include: {
        company: {
          select: { id: true, name: true },
        },
        _count: {
          select: { jobs: true, maintenance: true },
        },
        jobs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            createdAt: true,
            client: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!trailer) {
      throw new NotFoundException('Trailer not found');
    }

    return { success: true, data: trailer };
  }

  async update(id: string, companyId: string, updateTrailerDto: UpdateTrailerDto) {
    const trailer = await this.prisma.trailer.findFirst({
      where: { id, companyId },
    });

    if (!trailer) {
      throw new NotFoundException('Trailer not found');
    }

    const updatedTrailer = await this.prisma.trailer.update({
      where: { id },
      data: {
        regNo: updateTrailerDto.regNo,
        type: updateTrailerDto.type,
        make: updateTrailerDto.make,
        model: updateTrailerDto.model,
        year: updateTrailerDto.year,
        capacity: updateTrailerDto.capacity,
        axles: updateTrailerDto.axles,
        leasePerDay: updateTrailerDto.leasePerDay,
        maintPerKm: updateTrailerDto.maintPerKm,
        isActive: updateTrailerDto.isActive,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    return { success: true, data: updatedTrailer };
  }

  async remove(id: string, companyId: string) {
    const trailer = await this.prisma.trailer.findFirst({
      where: { id, companyId },
    });

    if (!trailer) {
      throw new NotFoundException('Trailer not found');
    }

    // Soft delete by setting isActive to false
    const deletedTrailer = await this.prisma.trailer.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true, data: deletedTrailer, message: 'Trailer deactivated successfully' };
  }

  async getAvailableTrailers(companyId: string) {
    // Get trailers that are active and not currently assigned to an in-progress job
    const trailers = await this.prisma.trailer.findMany({
      where: {
        companyId,
        isActive: true,
        jobs: {
          none: {
            status: {
              in: ['IN_TRANSIT', 'AT_PICKUP', 'LOADED', 'AT_DELIVERY'],
            },
          },
        },
      },
      orderBy: { regNo: 'asc' },
      select: {
        id: true,
        regNo: true,
        type: true,
        capacity: true,
        make: true,
        model: true,
      },
    });

    return { success: true, data: trailers };
  }

  async getStats(companyId: string) {
    const [total, active, inactive, inUse] = await Promise.all([
      this.prisma.trailer.count({ where: { companyId } }),
      this.prisma.trailer.count({ where: { companyId, isActive: true } }),
      this.prisma.trailer.count({ where: { companyId, isActive: false } }),
      this.prisma.trailer.count({
        where: {
          companyId,
          jobs: {
            some: {
              status: {
                in: ['IN_TRANSIT', 'AT_PICKUP', 'LOADED', 'AT_DELIVERY'],
              },
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        total,
        active,
        inactive,
        inUse,
        available: active - inUse,
      },
    };
  }
}