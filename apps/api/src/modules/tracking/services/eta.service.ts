import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ETAService {
  private readonly logger = new Logger(ETAService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  async calculateETA(
    jobId: string,
    currentLat: number,
    currentLng: number,
    destinationLat: number,
    destinationLng: number
  ) {
    try {
      // For now, use simple distance-based calculation
      // TODO: Integrate with Google Maps API for real traffic data
      const distance = this.calculateDistance(currentLat, currentLng, destinationLat, destinationLng);

      // Estimate time based on average speed (assuming 50 km/h average)
      const averageSpeedKmh = 50;
      const estimatedTimeMinutes = Math.round((distance / 1000) / averageSpeedKmh * 60);

      // Apply traffic factor (1.0 = no traffic, 1.5 = heavy traffic)
      const trafficFactor = await this.getTrafficFactor();
      const adjustedTimeMinutes = Math.round(estimatedTimeMinutes * trafficFactor);

      // Store ETA calculation
      const etaCalculation = await this.prisma.eTACalculation.create({
        data: {
          jobId,
          currentLat,
          currentLng,
          destinationLat,
          destinationLng,
          estimatedTimeMinutes: adjustedTimeMinutes,
          estimatedDistance: distance,
          trafficFactor,
          calculationMethod: 'SIMPLE_DISTANCE',
          confidence: 0.7, // Lower confidence for simple calculation
          metadata: {
            averageSpeedKmh,
            originalTimeMinutes: estimatedTimeMinutes,
            trafficAdjustment: trafficFactor
          }
        }
      });

      this.logger.log(`ETA calculated for job ${jobId}: ${adjustedTimeMinutes} minutes`);

      return {
        estimatedTimeMinutes: adjustedTimeMinutes,
        estimatedDistance: distance,
        confidence: 0.7,
        method: 'SIMPLE_DISTANCE',
        calculationId: etaCalculation.id
      };
    } catch (error) {
      this.logger.error(`Failed to calculate ETA: ${error.message}`, error.stack);
      throw error;
    }
  }

  async calculateETAWithGoogleMaps(
    jobId: string,
    currentLat: number,
    currentLng: number,
    destinationLat: number,
    destinationLng: number
  ) {
    try {
      const apiKey = this.configService.get('GOOGLE_MAPS_API_KEY');
      if (!apiKey) {
        this.logger.warn('Google Maps API key not configured, falling back to simple calculation');
        return this.calculateETA(jobId, currentLat, currentLng, destinationLat, destinationLng);
      }

      // TODO: Implement Google Maps Distance Matrix API call
      const response = await this.callGoogleMapsAPI(
        currentLat,
        currentLng,
        destinationLat,
        destinationLng,
        apiKey
      );

      if (response.success) {
        const etaCalculation = await this.prisma.eTACalculation.create({
          data: {
            jobId,
            currentLat,
            currentLng,
            destinationLat,
            destinationLng,
            estimatedTimeMinutes: response.duration,
            estimatedDistance: response.distance,
            trafficFactor: response.trafficFactor || 1.0,
            calculationMethod: 'GOOGLE_MAPS',
            confidence: 0.9,
            metadata: {
              googleResponse: response.rawData,
              trafficConditions: response.trafficStatus
            }
          }
        });

        return {
          estimatedTimeMinutes: response.duration,
          estimatedDistance: response.distance,
          confidence: 0.9,
          method: 'GOOGLE_MAPS',
          trafficStatus: response.trafficStatus,
          calculationId: etaCalculation.id
        };
      } else {
        // Fallback to simple calculation
        return this.calculateETA(jobId, currentLat, currentLng, destinationLat, destinationLng);
      }
    } catch (error) {
      this.logger.error(`Google Maps ETA calculation failed: ${error.message}`, error.stack);
      // Fallback to simple calculation
      return this.calculateETA(jobId, currentLat, currentLng, destinationLat, destinationLng);
    }
  }

  private async callGoogleMapsAPI(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    apiKey: string
  ) {
    try {
      // Placeholder for Google Maps API integration
      // In real implementation, use Google Maps Distance Matrix API
      const trimmedApiKey = apiKey.trim();
      const sanitizedApiKey = trimmedApiKey.replace(/\+/g, '%2B');
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${originLat},${originLng}&destinations=${destLat},${destLng}&departure_time=now&traffic_model=best_guess&key=${sanitizedApiKey}`;

      // TODO: Implement actual HTTP call
      // const response = await fetch(url);
      // const data = await response.json();

      // For now, return mock data
      const distance = this.calculateDistance(originLat, originLng, destLat, destLng);
      const estimatedTime = Math.round((distance / 1000) / 45 * 60); // 45 km/h average

      return {
        success: true,
        duration: estimatedTime,
        distance: distance,
        trafficFactor: 1.2,
        trafficStatus: 'MODERATE',
        rawData: { mock: true }
      };
    } catch (error) {
      this.logger.error(`Google Maps API call failed: ${error.message}`);
      return { success: false };
    }
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

  private async getTrafficFactor(): Promise<number> {
    // Simple time-based traffic factor
    const hour = new Date().getHours();

    // Rush hour traffic
    if ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20)) {
      return 1.5; // 50% slower during rush hours
    }

    // Night time - lighter traffic
    if (hour >= 22 || hour <= 6) {
      return 0.8; // 20% faster at night
    }

    // Normal daytime traffic
    return 1.0;
  }

  async getETAHistory(jobId: string, limit: number = 10) {
    return await this.prisma.eTACalculation.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async updateJobETA(jobId: string, etaMinutes: number) {
    try {
      const newETA = new Date(Date.now() + (etaMinutes * 60 * 1000));

      await this.prisma.job.update({
        where: { id: jobId },
        data: { etaTs: newETA }
      });

      this.logger.log(`Updated job ${jobId} ETA to ${newETA.toISOString()}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update job ETA: ${error.message}`, error.stack);
      return false;
    }
  }
}