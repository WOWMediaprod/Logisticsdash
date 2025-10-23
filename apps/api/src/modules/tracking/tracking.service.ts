import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LocationUpdateDto, LocationQueryDto, LiveDriverLocationDto } from './dto/location-update.dto';
import { TrackingGateway } from './tracking.gateway';
import { ETAService } from './services/eta.service';
import { GeofenceService } from './services/geofence.service';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private prisma: PrismaService,
    private trackingGateway?: TrackingGateway,
    private etaService?: ETAService,
    private geofenceService?: GeofenceService
  ) {}

  async updateLocation(locationData: LocationUpdateDto) {
    try {
      this.logger.log(`Updating location for job ${locationData.jobId}, driver ${locationData.driverId}`);

      // Verify job and driver exist
      const job = await this.prisma.job.findUnique({
        where: { id: locationData.jobId },
        include: { driver: true, vehicle: true }
      });

      if (!job) {
        throw new NotFoundException(`Job ${locationData.jobId} not found`);
      }

      if (job.driverId !== locationData.driverId) {
        throw new NotFoundException(`Driver ${locationData.driverId} not assigned to job ${locationData.jobId}`);
      }

      // Create location tracking record
      const locationTrack = await this.prisma.locationTracking.create({
        data: {
          jobId: locationData.jobId,
          driverId: locationData.driverId,
          vehicleId: locationData.vehicleId || job.vehicleId,
          lat: locationData.lat,
          lng: locationData.lng,
          accuracy: locationData.accuracy,
          altitude: locationData.altitude,
          speed: locationData.speed,
          heading: locationData.heading,
          timestamp: new Date(locationData.timestamp),
          batteryLevel: locationData.batteryLevel,
          isManual: locationData.isManual || false,
          source: locationData.source || 'MOBILE_GPS',
          metadata: locationData.metadata || {}
        }
      });

      // Emit real-time location update
      if (this.trackingGateway) {
        this.trackingGateway.emitLocationUpdate(job.companyId, {
          jobId: locationData.jobId,
          driverId: locationData.driverId,
          lat: locationData.lat,
          lng: locationData.lng,
          speed: locationData.speed || 0,
          heading: locationData.heading || 0,
          timestamp: locationData.timestamp,
          accuracy: locationData.accuracy || 0
        });
      }

      // Check geofences and trigger events
      if (this.geofenceService) {
        await this.geofenceService.checkGeofences(
          locationData.lat,
          locationData.lng,
          locationData.jobId,
          locationData.driverId,
          job.companyId
        );
      }

      // Calculate ETA updates
      if (this.etaService) {
        // Get the delivery waypoint for destination coordinates
        const deliveryWaypoint = await this.prisma.routeWaypoint.findFirst({
          where: {
            jobId: locationData.jobId,
            type: 'DELIVERY'
          },
          orderBy: { sequence: 'desc' } // Get the final delivery point
        });

        if (deliveryWaypoint) {
          const etaResult = await this.etaService.calculateETA(
            locationData.jobId,
            locationData.lat,
            locationData.lng,
            Number(deliveryWaypoint.lat),
            Number(deliveryWaypoint.lng)
          );

          // Update job with new ETA
          await this.etaService.updateJobETA(locationData.jobId, etaResult.estimatedTimeMinutes);

          this.logger.log(`ETA updated for job ${locationData.jobId}: ${etaResult.estimatedTimeMinutes} minutes to ${deliveryWaypoint.name}`);
        }
      }

      this.logger.log(`Location updated successfully: ${locationTrack.id}`);

      return {
        success: true,
        data: {
          id: locationTrack.id,
          timestamp: locationTrack.timestamp,
          message: 'Location updated successfully'
        }
      };
    } catch (error) {
      this.logger.error(`Failed to update location: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getLocationHistory(query: LocationQueryDto) {
    try {
      const where: any = {};

      if (query.jobId) where.jobId = query.jobId;
      if (query.driverId) where.driverId = query.driverId;
      if (query.vehicleId) where.vehicleId = query.vehicleId;

      if (query.startTime || query.endTime) {
        where.timestamp = {};
        if (query.startTime) where.timestamp.gte = new Date(query.startTime);
        if (query.endTime) where.timestamp.lte = new Date(query.endTime);
      }

      const locations = await this.prisma.locationTracking.findMany({
        where,
        include: {
          job: {
            select: { id: true, status: true, client: { select: { name: true } } }
          },
          driver: {
            select: { id: true, name: true }
          },
          vehicle: {
            select: { id: true, regNo: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: query.limit || 100
      });

      return {
        success: true,
        data: locations,
        count: locations.length
      };
    } catch (error) {
      this.logger.error(`Failed to get location history: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getCurrentLocation(jobId: string) {
    try {
      const location = await this.prisma.locationTracking.findFirst({
        where: { jobId },
        include: {
          job: {
            include: {
              client: { select: { name: true, code: true } },
              route: { select: { origin: true, destination: true } },
              driver: { select: { name: true, phone: true } },
              vehicle: { select: { regNo: true, make: true, model: true } }
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      if (!location) {
        return {
          success: false,
          message: 'No location data found for this job'
        };
      }

      // Calculate time since last update
      const timeSinceUpdate = Date.now() - location.timestamp.getTime();
      const minutesSinceUpdate = Math.floor(timeSinceUpdate / (1000 * 60));

      return {
        success: true,
        data: {
          ...location,
          timeSinceUpdate: minutesSinceUpdate,
          isStale: minutesSinceUpdate > 30 // Consider stale after 30 minutes
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get current location: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getActiveTracking(companyId: string) {
    try {
      // Get all LIVE active jobs with recent location data
      // Include ASSIGNED so jobs show up as soon as GPS tracking starts
      const activeJobs = await this.prisma.job.findMany({
        where: {
          companyId,
          status: {
            in: ['ASSIGNED', 'IN_TRANSIT', 'AT_PICKUP', 'LOADED', 'AT_DELIVERY']
          },
          // Include jobs with assigned drivers (isOnline not required since GPS tracking proves they're active)
          driver: {
            isNot: null
          }
        },
        include: {
          client: { select: { name: true, code: true } },
          route: { select: { origin: true, destination: true, kmEstimate: true } },
          driver: { select: { name: true, phone: true, isOnline: true } },
          vehicle: { select: { regNo: true, make: true, model: true } },
          locationTracks: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        }
      });

      // Filter and map tracking data
      const trackingData = activeJobs
        .map(job => {
          const lastLocation = job.locationTracks[0];
          const timeSinceUpdate = lastLocation
            ? Date.now() - lastLocation.timestamp.getTime()
            : null;

          return {
            jobId: job.id,
            status: job.status,
            client: job.client,
            route: job.route,
            driver: job.driver,
            vehicle: job.vehicle,
            lastLocation: lastLocation ? {
              lat: lastLocation.lat,
              lng: lastLocation.lng,
              timestamp: lastLocation.timestamp,
              speed: lastLocation.speed,
              timeSinceUpdate: timeSinceUpdate ? Math.floor(timeSinceUpdate / (1000 * 60)) : null,
              isStale: timeSinceUpdate ? timeSinceUpdate > (5 * 60 * 1000) : true // 5 minutes instead of 30
            } : null,
            timeSinceUpdateMs: timeSinceUpdate
          };
        })
        // Only show jobs with GPS data received in the last 5 minutes
        .filter(job => {
          if (!job.lastLocation) return false;
          if (!job.timeSinceUpdateMs) return false;
          return job.timeSinceUpdateMs <= (5 * 60 * 1000); // 5 minutes in milliseconds
        })
        // Remove the temporary timeSinceUpdateMs field
        .map(({ timeSinceUpdateMs, ...job }) => job);

      return {
        success: true,
        data: trackingData,
        summary: {
          totalJobs: trackingData.length,
          withLocation: trackingData.filter(t => t.lastLocation).length,
          staleLocations: trackingData.filter(t => t.lastLocation?.isStale).length
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get active tracking: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Add a private Map to store live driver locations
  private liveDrivers = new Map<string, {
    trackerId: string;
    name: string;
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    timestamp: string;
    companyId?: string;
  }>();

  async updateLiveDriverLocation(locationData: LiveDriverLocationDto) {
    try {
      this.logger.log(`Updating live driver location for tracker ${locationData.trackerId}`);

      // Store the live driver location in memory
      this.liveDrivers.set(locationData.trackerId, {
        trackerId: locationData.trackerId,
        name: locationData.name,
        lat: locationData.lat,
        lng: locationData.lng,
        speed: locationData.speed,
        heading: locationData.heading,
        accuracy: locationData.accuracy,
        timestamp: locationData.timestamp,
        companyId: locationData.companyId
      });

      // Emit real-time update to clients if gateway is available
      if (this.trackingGateway && locationData.companyId) {
        this.trackingGateway.emitLiveDriverUpdate(locationData.companyId, {
          trackerId: locationData.trackerId,
          name: locationData.name,
          lat: locationData.lat,
          lng: locationData.lng,
          speed: locationData.speed || 0,
          heading: locationData.heading || 0,
          accuracy: locationData.accuracy || 0,
          timestamp: locationData.timestamp
        });
      }

      this.logger.log(`Live driver location updated successfully: ${locationData.trackerId}`);

      return {
        success: true,
        data: {
          trackerId: locationData.trackerId,
          timestamp: locationData.timestamp,
          message: 'Live location updated successfully'
        }
      };
    } catch (error) {
      this.logger.error(`Failed to update live driver location: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getLiveDrivers(companyId: string) {
    try {
      // Filter live drivers by company ID and calculate stale status
      const driverArray = Array.from(this.liveDrivers.values())
        .filter(driver => !companyId || driver.companyId === companyId)
        .map(driver => {
          const timeSinceUpdate = Date.now() - new Date(driver.timestamp).getTime();
          const minutesSinceUpdate = Math.floor(timeSinceUpdate / (1000 * 60));

          return {
            ...driver,
            timeSinceUpdate: minutesSinceUpdate,
            isStale: minutesSinceUpdate > 10 // Consider stale after 10 minutes for live tracking
          };
        });

      // Clean up stale drivers (older than 30 minutes)
      for (const [trackerId, driver] of this.liveDrivers.entries()) {
        const timeSinceUpdate = Date.now() - new Date(driver.timestamp).getTime();
        const minutesSinceUpdate = Math.floor(timeSinceUpdate / (1000 * 60));

        if (minutesSinceUpdate > 30) {
          this.liveDrivers.delete(trackerId);
          this.logger.log(`Removed stale live driver: ${trackerId}`);
        }
      }

      return {
        success: true,
        data: driverArray,
        summary: {
          totalTrackers: driverArray.length,
          activeTrackers: driverArray.filter(d => !d.isStale).length,
          staleTrackers: driverArray.filter(d => d.isStale).length
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get live drivers: ${error.message}`, error.stack);
      throw error;
    }
  }
}