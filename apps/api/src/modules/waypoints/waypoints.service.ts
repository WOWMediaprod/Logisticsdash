import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWaypointDto } from './dto/create-waypoint.dto';
import { UpdateWaypointDto } from './dto/update-waypoint.dto';
import { ReorderWaypointsDto } from './dto/reorder-waypoints.dto';

@Injectable()
export class WaypointsService {
  constructor(private prisma: PrismaService) {}

  async create(createWaypointDto: CreateWaypointDto) {
    const waypoint = await this.prisma.waypoint.create({
      data: {
        jobId: createWaypointDto.jobId,
        name: createWaypointDto.name,
        type: createWaypointDto.type,
        sequence: createWaypointDto.sequence,
        address: createWaypointDto.address,
        lat: createWaypointDto.lat,
        lng: createWaypointDto.lng,
      },
    });

    return {
      success: true,
      data: waypoint,
      message: 'Waypoint created successfully',
    };
  }

  async findAllByJob(jobId: string) {
    const waypoints = await this.prisma.waypoint.findMany({
      where: { jobId },
      orderBy: { sequence: 'asc' },
    });

    return {
      success: true,
      data: waypoints,
    };
  }

  async findOne(id: string) {
    const waypoint = await this.prisma.waypoint.findUnique({
      where: { id },
    });

    if (!waypoint) {
      throw new NotFoundException(`Waypoint with ID ${id} not found`);
    }

    return {
      success: true,
      data: waypoint,
    };
  }

  async update(id: string, updateWaypointDto: UpdateWaypointDto) {
    // Check if waypoint exists
    await this.findOne(id);

    const waypoint = await this.prisma.waypoint.update({
      where: { id },
      data: updateWaypointDto,
    });

    return {
      success: true,
      data: waypoint,
      message: 'Waypoint updated successfully',
    };
  }

  async remove(id: string) {
    // Check if waypoint exists
    await this.findOne(id);

    await this.prisma.waypoint.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Waypoint deleted successfully',
    };
  }

  async reorder(jobId: string, reorderDto: ReorderWaypointsDto) {
    // Update sequences in a transaction
    await this.prisma.$transaction(
      reorderDto.waypoints.map((wp) =>
        this.prisma.waypoint.update({
          where: { id: wp.id },
          data: { sequence: wp.sequence },
        })
      )
    );

    return {
      success: true,
      message: 'Waypoints reordered successfully',
    };
  }

  async markAsCompleted(id: string) {
    const waypoint = await this.prisma.waypoint.update({
      where: { id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    return {
      success: true,
      data: waypoint,
      message: 'Waypoint marked as completed',
    };
  }
}
