import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { LocationUpdateDto, LocationQueryDto, LiveDriverLocationDto } from './dto/location-update.dto';

@ApiTags('Tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('location')
  @ApiOperation({ summary: 'Update driver location for a job' })
  @ApiResponse({ status: 201, description: 'Location updated successfully' })
  @ApiResponse({ status: 404, description: 'Job or driver not found' })
  updateLocation(@Body() locationData: LocationUpdateDto) {
    return this.trackingService.updateLocation(locationData);
  }

  @Get('location/history')
  @ApiOperation({ summary: 'Get location history with filters' })
  @ApiResponse({ status: 200, description: 'Location history retrieved successfully' })
  getLocationHistory(@Query() query: LocationQueryDto) {
    return this.trackingService.getLocationHistory(query);
  }

  @Get('location/:jobId/current')
  @ApiOperation({ summary: 'Get current location for a specific job' })
  @ApiResponse({ status: 200, description: 'Current location retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found or no location data' })
  getCurrentLocation(@Param('jobId') jobId: string) {
    return this.trackingService.getCurrentLocation(jobId);
  }

  @Get('active/:companyId')
  @ApiOperation({ summary: 'Get all active job tracking for a company' })
  @ApiResponse({
    status: 200,
    description: 'Active tracking data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              jobId: { type: 'string' },
              status: { type: 'string' },
              client: { type: 'object' },
              driver: { type: 'object' },
              vehicle: { type: 'object' },
              lastLocation: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                  timestamp: { type: 'string' },
                  speed: { type: 'number' },
                  timeSinceUpdate: { type: 'number' },
                  isStale: { type: 'boolean' }
                }
              }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalJobs: { type: 'number' },
            withLocation: { type: 'number' },
            staleLocations: { type: 'number' }
          }
        }
      }
    }
  })
  getActiveTracking(@Param('companyId') companyId: string) {
    return this.trackingService.getActiveTracking(companyId);
  }

  @Post('location/:jobId/manual')
  @ApiOperation({ summary: 'Manually update location for a job (for testing)' })
  @ApiResponse({ status: 201, description: 'Manual location updated successfully' })
  manualLocationUpdate(
    @Param('jobId') jobId: string,
    @Body() manualData: {
      lat: number;
      lng: number;
      driverId: string;
      note?: string;
    }
  ) {
    const locationUpdate: LocationUpdateDto = {
      jobId,
      driverId: manualData.driverId,
      lat: manualData.lat,
      lng: manualData.lng,
      timestamp: new Date().toISOString(),
      isManual: true,
      source: 'MANUAL_ENTRY',
      metadata: {
        note: manualData.note || 'Manual location entry',
        entryMethod: 'ADMIN_PANEL'
      }
    };

    return this.trackingService.updateLocation(locationUpdate);
  }

  @Post('live-location')
  @ApiOperation({ summary: 'Update live driver location (for simple tracking)' })
  @ApiResponse({ status: 201, description: 'Live location updated successfully' })
  updateLiveDriverLocation(@Body() locationData: LiveDriverLocationDto) {
    return this.trackingService.updateLiveDriverLocation(locationData);
  }

  @Get('live-drivers/:companyId')
  @ApiOperation({ summary: 'Get all live driver locations for a company' })
  @ApiResponse({
    status: 200,
    description: 'Live driver locations retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trackerId: { type: 'string' },
              name: { type: 'string' },
              lat: { type: 'number' },
              lng: { type: 'number' },
              speed: { type: 'number' },
              heading: { type: 'number' },
              accuracy: { type: 'number' },
              timestamp: { type: 'string' },
              timeSinceUpdate: { type: 'number' },
              isStale: { type: 'boolean' }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalTrackers: { type: 'number' },
            activeTrackers: { type: 'number' },
            staleTrackers: { type: 'number' }
          }
        }
      }
    }
  })
  getLiveDrivers(@Param('companyId') companyId: string) {
    return this.trackingService.getLiveDrivers(companyId);
  }
}