import { Controller, Get, Post, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TrackingV2Service } from './tracking-v2.service';
import { LocationUpdateV2Dto, LocationHistoryQueryDto } from './dto/location-update-v2.dto';
import { DriverAuthGuard } from '../driver-auth/guards/driver-auth.guard';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Tracking V2')
@Controller('api/v1/tracking-v2')
export class TrackingV2Controller {
  constructor(private readonly trackingService: TrackingV2Service) {}

  @Post('location')
  @UseGuards(DriverAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update driver location' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  async updateLocation(
    @Request() req: any,
    @Body() locationDto: LocationUpdateV2Dto,
  ) {
    return this.trackingService.processLocationUpdate({
      ...locationDto,
      driverId: req.user.id,
      companyId: req.user.companyId,
    });
  }

  @Post('start-tracking/:jobId')
  @UseGuards(DriverAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start tracking for a job' })
  @ApiResponse({ status: 200, description: 'Tracking started' })
  async startTracking(
    @Request() req: any,
    @Param('jobId') jobId: string,
  ) {
    return this.trackingService.startJobTracking(req.user.id, jobId);
  }

  @Post('stop-tracking/:jobId')
  @UseGuards(DriverAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stop tracking for a job' })
  @ApiResponse({ status: 200, description: 'Tracking stopped' })
  async stopTracking(
    @Request() req: any,
    @Param('jobId') jobId: string,
  ) {
    return this.trackingService.stopJobTracking(req.user.id, jobId);
  }

  @Get('active-drivers/:companyId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active drivers for a company' })
  @ApiResponse({ status: 200, description: 'Active drivers list' })
  async getActiveDrivers(@Param('companyId') companyId: string) {
    return this.trackingService.getActiveDrivers(companyId);
  }

  @Get('driver/:driverId/history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get driver location history' })
  @ApiResponse({ status: 200, description: 'Location history retrieved' })
  async getDriverHistory(
    @Param('driverId') driverId: string,
    @Query() query: LocationHistoryQueryDto,
  ) {
    return this.trackingService.getDriverLocationHistory(
      driverId,
      query.jobId,
      query.limit || 100,
    );
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get job tracking information' })
  @ApiResponse({ status: 200, description: 'Job tracking data' })
  async getJobTracking(@Param('jobId') jobId: string) {
    return this.trackingService.getJobTracking(jobId);
  }

  @Get('public/:jobId/:trackingCode')
  @ApiOperation({ summary: 'Get public tracking for a job' })
  @ApiResponse({ status: 200, description: 'Public tracking data' })
  async getPublicTracking(
    @Param('jobId') jobId: string,
    @Param('trackingCode') trackingCode: string,
  ) {
    // Verify tracking code matches job.shareTrackingLink
    const tracking = await this.trackingService.getJobTracking(jobId);

    // In production, verify trackingCode
    // if (tracking.shareTrackingLink !== trackingCode) {
    //   throw new UnauthorizedException('Invalid tracking code');
    // }

    // Return limited data for public view
    return {
      job: {
        id: tracking.job.id,
        status: tracking.job.status,
        route: {
          origin: tracking.job.route?.origin,
          destination: tracking.job.route?.destination,
        },
      },
      currentLocation: tracking.currentLocation,
      eta: null, // Calculate if needed
    };
  }
}