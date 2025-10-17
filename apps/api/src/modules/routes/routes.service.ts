import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async create(createRouteDto: CreateRouteDto) {
    const route = await this.prisma.route.create({
      data: {
        companyId: createRouteDto.companyId,
        code: createRouteDto.code,
        origin: createRouteDto.origin,
        destination: createRouteDto.destination,
        kmEstimate: createRouteDto.kmEstimate,
        clientId: createRouteDto.clientId || null,
        isActive: createRouteDto.isActive !== undefined ? createRouteDto.isActive : true,
      },
    });

    return {
      success: true,
      data: route,
    };
  }

  async findAll(companyId: string, clientId?: string, isActive?: boolean) {
    const where: any = { companyId };

    // If clientId is provided, return routes for that client OR general routes (clientId = null)
    if (clientId !== undefined && clientId !== '') {
      where.OR = [
        { clientId: clientId },
        { clientId: null }
      ];
    } else if (clientId === '') {
      // If clientId is explicitly empty string, only return general routes
      where.clientId = null;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const routes = await this.prisma.route.findMany({
      where,
      select: {
        id: true,
        code: true,
        origin: true,
        destination: true,
        kmEstimate: true,
        clientId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { code: 'asc' },
    });

    return {
      success: true,
      data: routes,
    };
  }

  async findOne(id: string, companyId: string) {
    const route = await this.prisma.route.findFirst({
      where: { id, companyId },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    return {
      success: true,
      data: route,
    };
  }

  async update(id: string, companyId: string, updateRouteDto: UpdateRouteDto) {
    const route = await this.prisma.route.findFirst({
      where: { id, companyId },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    const updatedRoute = await this.prisma.route.update({
      where: { id },
      data: {
        code: updateRouteDto.code,
        origin: updateRouteDto.origin,
        destination: updateRouteDto.destination,
        kmEstimate: updateRouteDto.kmEstimate,
        clientId: updateRouteDto.clientId !== undefined ? updateRouteDto.clientId || null : undefined,
        isActive: updateRouteDto.isActive,
      },
    });

    return {
      success: true,
      data: updatedRoute,
    };
  }

  async remove(id: string, companyId: string) {
    const route = await this.prisma.route.findFirst({
      where: { id, companyId },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    await this.prisma.route.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Route deleted successfully',
    };
  }
}
