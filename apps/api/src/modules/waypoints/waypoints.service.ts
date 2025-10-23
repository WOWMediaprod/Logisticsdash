import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWaypointDto } from './dto/create-waypoint.dto';
import { UpdateWaypointDto } from './dto/update-waypoint.dto';
import { ReorderWaypointsDto } from './dto/reorder-waypoints.dto';

@Injectable()
export class WaypointsService {
  constructor(private prisma: PrismaService) {}

  async create(createWaypointDto: CreateWaypointDto) {
    const { instructions, requiredDocuments, ...data } = createWaypointDto;

    const metadata: any = {};
    if (instructions) metadata.instructions = instructions;
    if (requiredDocuments) metadata.requiredDocuments = requiredDocuments;

    const waypoint = await this.prisma.routeWaypoint.create({
      data: {
        ...data,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
    });

    return {
      success: true,
      data: waypoint,
      message: 'Waypoint created successfully',
    };
  }

  async findAllByJob(jobId: string) {
    const waypoints = await this.prisma.routeWaypoint.findMany({
      where: { jobId },
      orderBy: { sequence: 'asc' },
    });

    return {
      success: true,
      data: waypoints,
    };
  }

  async findOne(id: string) {
    const waypoint = await this.prisma.routeWaypoint.findUnique({
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
    const { instructions, requiredDocuments, ...data } = updateWaypointDto;

    // Check if waypoint exists
    await this.findOne(id);

    const metadata: any = {};
    if (instructions !== undefined) metadata.instructions = instructions;
    if (requiredDocuments !== undefined) metadata.requiredDocuments = requiredDocuments;

    const waypoint = await this.prisma.routeWaypoint.update({
      where: { id },
      data: {
        ...data,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
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

    await this.prisma.routeWaypoint.delete({
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
        this.prisma.routeWaypoint.update({
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
    const waypoint = await this.prisma.routeWaypoint.update({
      where: { id },
      data: {
        isCompleted: true,
        actualArrival: new Date(),
      },
    });

    return {
      success: true,
      data: waypoint,
      message: 'Waypoint marked as completed',
    };
  }
}
