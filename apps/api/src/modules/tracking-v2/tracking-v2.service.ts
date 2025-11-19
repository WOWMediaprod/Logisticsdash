import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LocationUpdateV2Dto } from './dto/location-update-v2.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TrackingV2Service {
  private readonly logger = new Logger(TrackingV2Service.name);
  private readonly STALE_THRESHOLD_MINUTES = 5;
  private readonly SPEED_THRESHOLD_KMH = 5; // Consider moving if speed > 5 km/h

  constructor(private prisma: PrismaService) {}

  async processLocationUpdate(data: LocationUpdateV2Dto & { driverId: string; companyId: string }) {
    const { driverId, jobId, lat, lng, speed, heading, accuracy, batteryLevel, networkType, timestamp } = data;

    // Validate job assignment if jobId provided
    let job = null;
    if (jobId) {
      job = await this.prisma.job.findFirst({
        where: {
          id: jobId,
          driverId,
          status: {
            in: ['ASSIGNED', 'IN_TRANSIT', 'AT_PICKUP', 'LOADED', 'AT_DELIVERY'],
          },
        },
        include: {
          client: true,
          vehicle: true,
        },
      });

      if (!job) {
        throw new NotFoundException('Job not found or not assigned to driver');
      }
    }

    // Get or create tracking state
    let trackingState = await this.prisma.trackingState.findUnique({
      where: { driverId },
    });

    const isMoving = speed > this.SPEED_THRESHOLD_KMH;
    let distanceTraveled = 0;

    // Calculate distance if we have previous location
    if (trackingState?.currentLat && trackingState?.currentLng) {
      distanceTraveled = this.calculateDistance(
        Number(trackingState.currentLat),
        Number(trackingState.currentLng),
        lat,
        lng,
      );
    }

    // Update or create tracking state
    if (trackingState) {
      const timeDiff = (new Date(timestamp).getTime() - trackingState.lastUpdateAt.getTime()) / 1000; // seconds
      const newTotalDistance = Number(trackingState.totalDistance) + distanceTraveled;
      const newTotalDuration = (trackingState.totalDuration || 0) + timeDiff;
      const newAverageSpeed = newTotalDistance / (newTotalDuration / 3600); // km/h

      trackingState = await this.prisma.trackingState.update({
        where: { driverId },
        data: {
          jobId,
          currentLat: new Decimal(lat),
          currentLng: new Decimal(lng),
          currentSpeed: new Decimal(speed),
          currentHeading: heading ? new Decimal(heading) : null,
          currentAccuracy: accuracy ? new Decimal(accuracy) : null,
          lastUpdateAt: new Date(timestamp),
          isMoving,
          totalDistance: new Decimal(newTotalDistance),
          totalDuration: Math.round(newTotalDuration),
          averageSpeed: new Decimal(newAverageSpeed),
          maxSpeed: new Decimal(Math.max(Number(trackingState.maxSpeed || 0), speed)),
          metadata: {
            batteryLevel,
            networkType,
            lastUpdate: timestamp,
          },
        },
      });
    } else {
      trackingState = await this.prisma.trackingState.create({
        data: {
          driverId,
          jobId,
          companyId: data.companyId,
          currentLat: new Decimal(lat),
          currentLng: new Decimal(lng),
          currentSpeed: new Decimal(speed),
          currentHeading: heading ? new Decimal(heading) : null,
          currentAccuracy: accuracy ? new Decimal(accuracy) : null,
          lastUpdateAt: new Date(timestamp),
          isMoving,
          totalDistance: new Decimal(0),
          totalDuration: 0,
          averageSpeed: new Decimal(speed),
          maxSpeed: new Decimal(speed),
          metadata: {
            batteryLevel,
            networkType,
            lastUpdate: timestamp,
          },
        },
      });
    }

    // Store location history if job tracking
    if (jobId) {
      await this.prisma.locationTracking.create({
        data: {
          jobId,
          driverId,
          vehicleId: job?.vehicleId,
          lat: new Decimal(lat),
          lng: new Decimal(lng),
          accuracy: accuracy ? new Decimal(accuracy) : null,
          speed: speed ? new Decimal(speed) : null,
          heading: heading ? new Decimal(heading) : null,
          timestamp: new Date(timestamp),
          batteryPercentage: batteryLevel,
          networkType,
          isCharging: false,
          source: 'MOBILE_GPS',
          metadata: {
            isMoving,
            distanceTraveled,
          },
        },
      });

      // Update job with last known location
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          lastKnownLat: new Decimal(lat),
          lastKnownLng: new Decimal(lng),
          lastKnownAddress: null, // Will be geocoded if needed
        },
      });
    }

    // Update driver location
    await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        lastLocationLat: new Decimal(lat),
        lastLocationLng: new Decimal(lng),
        lastLocationUpdate: new Date(timestamp),
        currentJobId: jobId || undefined,
      },
    });

    // Calculate ETA if job has destination
    let eta = null;
    // ETA calculation removed - route model no longer exists

    // Get driver info
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        name: true,
        phone: true,
        licenseNo: true,
      },
    });

    return {
      success: true,
      trackingState,
      job,
      driver,
      eta,
      distanceTraveled,
      isMoving,
    };
  }

  async startJobTracking(driverId: string, jobId: string) {
    // Verify job assignment
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        driverId,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found or not assigned to driver');
    }

    // Update job status to IN_TRANSIT if it was ASSIGNED
    if (job.status === 'ASSIGNED') {
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'IN_TRANSIT',
          trackingStartedAt: new Date(),
          trackingEnabled: true,
        },
      });

      // Create status event
      await this.prisma.statusEvent.create({
        data: {
          jobId,
          code: 'JOB_STARTED',
          timestamp: new Date(),
          source: 'SYSTEM',
          metadata: { driverId },
        },
      });
    }

    // Update driver's current job
    await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        currentJobId: jobId,
        isOnline: true,
      },
    });

    // Reset tracking state for new job
    await this.prisma.trackingState.upsert({
      where: { driverId },
      create: {
        driverId,
        jobId,
        companyId: job.companyId,
        lastUpdateAt: new Date(),
        isMoving: false,
        totalDistance: new Decimal(0),
        totalDuration: 0,
        averageSpeed: new Decimal(0),
        maxSpeed: new Decimal(0),
      },
      update: {
        jobId,
        totalDistance: new Decimal(0),
        totalDuration: 0,
        averageSpeed: new Decimal(0),
        maxSpeed: new Decimal(0),
        isMoving: false,
      },
    });

    this.logger.log(`Tracking started for job ${jobId} by driver ${driverId}`);

    return {
      success: true,
      jobId,
      status: 'IN_TRANSIT',
      trackingStarted: true,
    };
  }

  async stopJobTracking(driverId: string, jobId: string) {
    // Get tracking state
    const trackingState = await this.prisma.trackingState.findUnique({
      where: { driverId },
    });

    if (!trackingState || trackingState.jobId !== jobId) {
      throw new BadRequestException('No active tracking for this job');
    }

    // Update job
    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        trackingEnabled: false,
      },
    });

    // Clear driver's current job
    await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        currentJobId: null,
      },
    });

    // Store final tracking stats
    const finalStats = {
      totalDistance: Number(trackingState.totalDistance),
      totalDuration: trackingState.totalDuration,
      averageSpeed: Number(trackingState.averageSpeed),
      maxSpeed: Number(trackingState.maxSpeed),
    };

    // Clear tracking state
    await this.prisma.trackingState.update({
      where: { driverId },
      data: {
        jobId: null,
        isMoving: false,
      },
    });

    this.logger.log(`Tracking stopped for job ${jobId} by driver ${driverId}`);

    return {
      success: true,
      jobId,
      trackingStopped: true,
      finalStats,
    };
  }

  async getActiveDrivers(companyId: string) {
    const drivers = await this.prisma.driver.findMany({
      where: {
        companyId,
        isOnline: true,
      },
      include: {
        trackingState: true,
        jobs: {
          where: {
            status: {
              in: ['IN_TRANSIT', 'AT_PICKUP', 'LOADED', 'AT_DELIVERY'],
            },
          },
          include: {
            client: true,
            vehicle: true,
          },
        },
      },
    });

    return drivers.map((driver) => {
      const currentJob = driver.jobs[0];
      const isStale = driver.trackingState
        ? this.isLocationStale(driver.trackingState.lastUpdateAt)
        : true;

      return {
        driverId: driver.id,
        name: driver.name,
        phone: driver.phone,
        isOnline: driver.isOnline,
        location: driver.trackingState
          ? {
              lat: Number(driver.trackingState.currentLat),
              lng: Number(driver.trackingState.currentLng),
              speed: Number(driver.trackingState.currentSpeed),
              heading: Number(driver.trackingState.currentHeading),
              lastUpdate: driver.trackingState.lastUpdateAt,
              isStale,
            }
          : null,
        currentJob,
        stats: driver.trackingState
          ? {
              totalDistance: Number(driver.trackingState.totalDistance),
              totalDuration: driver.trackingState.totalDuration,
              averageSpeed: Number(driver.trackingState.averageSpeed),
              isMoving: driver.trackingState.isMoving,
            }
          : null,
      };
    });
  }

  async getDriverLocationHistory(driverId: string, jobId?: string, limit = 100) {
    const where: any = { driverId };
    if (jobId) {
      where.jobId = jobId;
    }

    const locations = await this.prisma.locationTracking.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return locations.map((loc) => ({
      lat: Number(loc.lat),
      lng: Number(loc.lng),
      speed: Number(loc.speed),
      heading: Number(loc.heading),
      accuracy: Number(loc.accuracy),
      timestamp: loc.timestamp,
      metadata: loc.metadata,
    }));
  }

  async getJobTracking(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        driver: {
          include: {
            trackingState: true,
          },
        },
        client: true,
        vehicle: true,
        locationTracks: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const latestLocation = job.locationTracks[0];
    const trackingState = job.driver?.trackingState;

    return {
      job: {
        id: job.id,
        status: job.status,
        client: job.client,
        vehicle: job.vehicle,
      },
      driver: job.driver
        ? {
            id: job.driver.id,
            name: job.driver.name,
            phone: job.driver.phone,
            isOnline: job.driver.isOnline,
          }
        : null,
      currentLocation: trackingState
        ? {
            lat: Number(trackingState.currentLat),
            lng: Number(trackingState.currentLng),
            speed: Number(trackingState.currentSpeed),
            heading: Number(trackingState.currentHeading),
            lastUpdate: trackingState.lastUpdateAt,
            isMoving: trackingState.isMoving,
          }
        : latestLocation
        ? {
            lat: Number(latestLocation.lat),
            lng: Number(latestLocation.lng),
            speed: Number(latestLocation.speed),
            heading: Number(latestLocation.heading),
            lastUpdate: latestLocation.timestamp,
            isMoving: false,
          }
        : null,
      stats: trackingState
        ? {
            totalDistance: Number(trackingState.totalDistance),
            totalDuration: trackingState.totalDuration,
            averageSpeed: Number(trackingState.averageSpeed),
            maxSpeed: Number(trackingState.maxSpeed),
          }
        : null,
      trackingEnabled: job.trackingEnabled,
      shareTrackingLink: job.shareTrackingLink,
    };
  }

  // Helper methods
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private isLocationStale(lastUpdate: Date): boolean {
    const now = new Date();
    const diffMinutes = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;
    return diffMinutes > this.STALE_THRESHOLD_MINUTES;
  }

  private calculateSimpleETA(
    currentLat: number,
    currentLng: number,
    destination: string,
    currentSpeed: number,
  ): { minutes: number; distance: number; confidence: number } | null {
    // This is a simplified ETA calculation
    // In production, integrate with Google Maps Distance Matrix API

    // For now, return a simple estimate based on straight-line distance
    // Parse destination (assuming format "lat,lng" for simplicity)
    const [destLat, destLng] = destination.split(',').map(Number);
    if (!destLat || !destLng) return null;

    const distance = this.calculateDistance(currentLat, currentLng, destLat, destLng);
    const avgSpeed = currentSpeed > 0 ? currentSpeed : 40; // Default 40 km/h if stationary
    const minutes = Math.round((distance / avgSpeed) * 60);

    return {
      minutes,
      distance,
      confidence: 0.7, // Low confidence for simple calculation
    };
  }
}