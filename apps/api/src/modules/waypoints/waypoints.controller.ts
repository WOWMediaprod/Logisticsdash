import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WaypointsService } from './waypoints.service';
import { CreateWaypointDto } from './dto/create-waypoint.dto';
import { UpdateWaypointDto } from './dto/update-waypoint.dto';
import { ReorderWaypointsDto } from './dto/reorder-waypoints.dto';

@ApiTags('Waypoints')
@Controller('waypoints')
@ApiBearerAuth()
export class WaypointsController {
  constructor(private readonly waypointsService: WaypointsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new waypoint' })
  @ApiResponse({ status: 201, description: 'Waypoint created successfully' })
  create(@Body() createWaypointDto: CreateWaypointDto) {
    return this.waypointsService.create(createWaypointDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all waypoints for a job' })
  @ApiResponse({ status: 200, description: 'Waypoints retrieved successfully' })
  findAllByJob(@Query('jobId') jobId: string) {
    return this.waypointsService.findAllByJob(jobId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get waypoint by ID' })
  @ApiResponse({ status: 200, description: 'Waypoint retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Waypoint not found' })
  findOne(@Param('id') id: string) {
    return this.waypointsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a waypoint' })
  @ApiResponse({ status: 200, description: 'Waypoint updated successfully' })
  @ApiResponse({ status: 404, description: 'Waypoint not found' })
  update(@Param('id') id: string, @Body() updateWaypointDto: UpdateWaypointDto) {
    return this.waypointsService.update(id, updateWaypointDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a waypoint' })
  @ApiResponse({ status: 200, description: 'Waypoint deleted successfully' })
  @ApiResponse({ status: 404, description: 'Waypoint not found' })
  remove(@Param('id') id: string) {
    return this.waypointsService.remove(id);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorder waypoints' })
  @ApiResponse({ status: 200, description: 'Waypoints reordered successfully' })
  reorder(@Query('jobId') jobId: string, @Body() reorderDto: ReorderWaypointsDto) {
    return this.waypointsService.reorder(jobId, reorderDto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark waypoint as completed' })
  @ApiResponse({ status: 200, description: 'Waypoint marked as completed' })
  @ApiResponse({ status: 404, description: 'Waypoint not found' })
  markAsCompleted(@Param('id') id: string) {
    return this.waypointsService.markAsCompleted(id);
  }
}
