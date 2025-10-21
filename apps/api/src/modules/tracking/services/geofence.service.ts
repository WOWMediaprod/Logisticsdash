import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class GeofenceService {
  private readonly logger = new Logger(GeofenceService.name);

  constructor(private prisma: PrismaService) {}

  async checkGeofences(
    lat: number,
    lng: number,
    jobId: string,
    driverId: string,
    companyId: string
  ) {
    try {
      // Get all active geofences for the company
      const geofences = await this.prisma.geofence.findMany({
        where: {
          companyId,
          isActive: true
        }
      });

      const events = [];

      for (const geofence of geofences) {
        const isInside = this.isPointInGeofence(lat, lng, geofence);

        // Check if driver was previously inside this geofence
        const lastEvent = await this.prisma.geofenceEvent.findFirst({
          where: {
            jobId,
            driverId,
            geofenceId: geofence.id
          },
          orderBy: { timestamp: 'desc' }
        });

        const wasInside = lastEvent?.eventType === 'ENTER';

        // Determine if we need to create an event
        if (isInside && !wasInside) {
          // Driver entered geofence
          const event = await this.createGeofenceEvent(
            jobId,
            driverId,
            geofence.id,
            'ENTER',
            lat,
            lng
          );
          events.push(event);
          this.logger.log(`Driver ${driverId} entered geofence ${geofence.name}`);
        } else if (!isInside && wasInside) {
          // Driver exited geofence
          const event = await this.createGeofenceEvent(
            jobId,
            driverId,
            geofence.id,
            'EXIT',
            lat,
            lng
          );
          events.push(event);
          this.logger.log(`Driver ${driverId} exited geofence ${geofence.name}`);
        }
      }

      return events;
    } catch (error) {
      this.logger.error(`Failed to check geofences: ${error.message}`, error.stack);
      return [];
    }
  }

  private isPointInGeofence(lat: number, lng: number, geofence: any): boolean {
    if (geofence.type === 'CIRCLE') {
      return this.isPointInCircle(
        lat,
        lng,
        Number(geofence.lat), // Changed from centerLat
        Number(geofence.lng), // Changed from centerLng
        Number(geofence.radiusM) // Changed from radius
      );
    } else if (geofence.type === 'POLYGON' && geofence.polygon) {
      return this.isPointInPolygon(lat, lng, geofence.polygon.coordinates);
    }
    return false;
  }

  private isPointInCircle(
    pointLat: number,
    pointLng: number,
    centerLat: number,
    centerLng: number,
    radiusMeters: number
  ): boolean {
    const distance = this.calculateDistance(pointLat, pointLng, centerLat, centerLng);
    return distance <= radiusMeters;
  }

  private isPointInPolygon(lat: number, lng: number, polygon: number[][]): boolean {
    let inside = false;
    const x = lng;
    const y = lat;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private async createGeofenceEvent(
    jobId: string,
    driverId: string,
    geofenceId: string,
    eventType: string,
    lat: number,
    lng: number
  ) {
    return await this.prisma.geofenceEvent.create({
      data: {
        jobId,
        driverId,
        geofenceId,
        eventType,
        lat,
        lng,
        timestamp: new Date(),
        autoDetected: true,
        metadata: {
          detectionMethod: 'GPS_TRACKING',
          accuracy: 'HIGH'
        }
      }
    });
  }

  async createGeofence(companyId: string, geofenceData: {
    name: string;
    description?: string;
    type: 'CIRCLE' | 'POLYGON';
    centerLat?: number;
    centerLng?: number;
    radius?: number;
    polygon?: any;
  }) {
    try {
      const geofence = await this.prisma.geofence.create({
        data: {
          companyId,
          name: geofenceData.name,
          // description: geofenceData.description, // Commented out - field doesn't exist in current schema
          type: geofenceData.type,
          lat: geofenceData.centerLat || 0, // Changed from centerLat
          lng: geofenceData.centerLng || 0, // Changed from centerLng
          radiusM: geofenceData.radius || 100, // Changed from radius
          polygon: geofenceData.polygon,
          isActive: true
        }
      });

      this.logger.log(`Created geofence: ${geofence.name} (${geofence.id})`);
      return geofence;
    } catch (error) {
      this.logger.error(`Failed to create geofence: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getCompanyGeofences(companyId: string) {
    return await this.prisma.geofence.findMany({
      where: { companyId },
      include: {
        events: {
          take: 10,
          orderBy: { timestamp: 'desc' },
          include: {
            job: { select: { id: true, status: true } },
            driver: { select: { name: true } }
          }
        }
      }
    });
  }
}