import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { JobStatus } from '@prisma/client';

@Injectable()
export class AutogateService {
  private readonly logger = new Logger(AutogateService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Check if driver has entered any waypoint geofences and auto-update job status
   */
  async checkWaypointProximity(
    lat: number,
    lng: number,
    jobId: string,
    driverId: string
  ) {
    try {
      // Get job with waypoints
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        include: {
          waypoints: {
            where: {
              isCompleted: false,
              lat: { not: null },
              lng: { not: null }
            },
            orderBy: { sequence: 'asc' }
          }
        }
      });

      if (!job || job.waypoints.length === 0) {
        return null;
      }

      // Check each incomplete waypoint
      for (const waypoint of job.waypoints) {
        const distance = this.calculateDistance(
          lat,
          lng,
          Number(waypoint.lat),
          Number(waypoint.lng)
        );

        const radius = waypoint.radiusM || 150; // Default 150m radius

        // Driver is inside waypoint geofence
        if (distance <= radius) {
          this.logger.log(
            `🎯 Driver ${driverId} entered waypoint "${waypoint.name}" ` +
            `(${Math.round(distance)}m from center, radius ${radius}m)`
          );

          // Determine new job status based on waypoint type
          const newStatus = this.getStatusForWaypointType(waypoint.type, job.status);

          if (newStatus && newStatus !== job.status) {
            // Auto-update job status
            await this.updateJobStatus(jobId, newStatus, waypoint, driverId);
          }

          // Mark waypoint as completed
          await this.completeWaypoint(waypoint.id);

          return {
            waypointReached: waypoint,
            newStatus,
            distance: Math.round(distance)
          };
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to check waypoint proximity: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Map waypoint type to job status
   */
  private getStatusForWaypointType(
    waypointType: string,
    currentStatus: JobStatus
  ): JobStatus | null {
    // Status progression rules
    const statusMap: Record<string, JobStatus | null> = {
      'PICKUP': JobStatus.AT_PICKUP,
      'DELIVERY': JobStatus.AT_DELIVERY,
      'CHECKPOINT': JobStatus.IN_TRANSIT,
      'YARD': JobStatus.IN_TRANSIT,
      'PORT': JobStatus.IN_TRANSIT,
      'REST_STOP': null // Don't change status for rest stops
    };

    const newStatus = statusMap[waypointType];

    // Don't downgrade status (e.g., don't go from LOADED back to AT_PICKUP)
    if (newStatus === JobStatus.AT_PICKUP &&
        (currentStatus === JobStatus.LOADED ||
         currentStatus === JobStatus.AT_DELIVERY ||
         currentStatus === JobStatus.DELIVERED ||
         currentStatus === JobStatus.COMPLETED)) {
      return null;
    }

    // Don't go back to AT_DELIVERY if already delivered
    if (newStatus === JobStatus.AT_DELIVERY &&
        (currentStatus === JobStatus.DELIVERED || currentStatus === JobStatus.COMPLETED)) {
      return null;
    }

    return newStatus;
  }

  /**
   * Update job status with autogate event
   */
  private async updateJobStatus(
    jobId: string,
    newStatus: JobStatus,
    waypoint: any,
    driverId: string
  ) {
    try {
      // Update job status
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: newStatus,
          ...(newStatus === JobStatus.COMPLETED && { dropTs: new Date() })
        }
      });

      // Create status event
      await this.prisma.statusEvent.create({
        data: {
          jobId,
          code: `AUTOGATE_${newStatus}`,
          note: `Auto-updated to ${newStatus} upon entering waypoint "${waypoint.name}" (GPS-based)`,
          source: 'SYSTEM',
          metadata: {
            waypointId: waypoint.id,
            waypointName: waypoint.name,
            waypointType: waypoint.type,
            driverId,
            autoDetected: true,
            autogateTriggered: true
          }
        }
      });

      this.logger.log(
        `✅ Auto-updated job ${jobId} status: ${newStatus} ` +
        `(waypoint: ${waypoint.name})`
      );
    } catch (error) {
      this.logger.error(`Failed to update job status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark waypoint as completed
   */
  private async completeWaypoint(waypointId: string) {
    try {
      await this.prisma.waypoint.update({
        where: { id: waypointId },
        data: {
          isCompleted: true,
          completedAt: new Date()
        }
      });

      this.logger.log(`✓ Marked waypoint ${waypointId} as completed`);
    } catch (error) {
      this.logger.error(`Failed to complete waypoint: ${error.message}`, error.stack);
    }
  }

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   */
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

  /**
   * Get waypoint completion progress for a job
   */
  async getWaypointProgress(jobId: string) {
    const waypoints = await this.prisma.waypoint.findMany({
      where: { jobId },
      orderBy: { sequence: 'asc' }
    });

    const total = waypoints.length;
    const completed = waypoints.filter(w => w.isCompleted).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      remaining: total - completed,
      percentage,
      waypoints: waypoints.map(w => ({
        id: w.id,
        name: w.name,
        type: w.type,
        sequence: w.sequence,
        isCompleted: w.isCompleted,
        completedAt: w.completedAt
      }))
    };
  }
}
