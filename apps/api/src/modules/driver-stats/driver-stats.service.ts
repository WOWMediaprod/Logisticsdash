import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DriverStatsService {
  private readonly logger = new Logger(DriverStatsService.name);

  constructor(private prisma: PrismaService) {}

  async calculateJobEarnings(jobId: string, driverId: string) {
    // Get job details
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        route: true,
        vehicle: true,
      },
    });

    if (!job || job.driverId !== driverId) {
      throw new Error('Job not found or not assigned to driver');
    }

    // Base rate calculation (simplified - in production use rate cards)
    const BASE_RATE_PER_KM = 50; // LKR per km
    const NIGHT_SHIFT_MULTIPLIER = 1.5;
    const URGENT_JOB_BONUS = 500; // LKR

    // Get tracking data for distance calculation
    const trackingState = await this.prisma.trackingState.findUnique({
      where: { driverId },
    });

    const distance = trackingState ? Number(trackingState.totalDistance) : (job.route?.kmEstimate || 0);
    const baseAmount = distance * BASE_RATE_PER_KM;

    // Calculate bonuses
    let distanceBonus = 0;
    if (distance > 50) {
      distanceBonus = (distance - 50) * 10; // Extra 10 LKR per km over 50km
    }

    let nightShiftBonus = 0;
    if (job.pickupTs) {
      const hour = new Date(job.pickupTs).getHours();
      if (hour < 6 || hour >= 20) {
        nightShiftBonus = baseAmount * (NIGHT_SHIFT_MULTIPLIER - 1);
      }
    }

    let timeBonus = 0;
    if (job.priority === 'URGENT') {
      timeBonus = URGENT_JOB_BONUS;
    }

    const totalAmount = baseAmount + distanceBonus + nightShiftBonus + timeBonus;

    // Create or update earnings record
    // First check if earning record exists
    const existingEarning = await this.prisma.driverEarning.findFirst({
      where: {
        driverId,
        jobId,
      },
    });

    let earnings;
    if (existingEarning) {
      // Update existing record
      earnings = await this.prisma.driverEarning.update({
        where: { id: existingEarning.id },
        data: {
          baseAmount: new Decimal(baseAmount),
          distanceBonus: new Decimal(distanceBonus),
          timeBonus: new Decimal(timeBonus),
          nightShiftBonus: new Decimal(nightShiftBonus),
          totalAmount: new Decimal(totalAmount),
        },
      });
    } else {
      // Create new record
      earnings = await this.prisma.driverEarning.create({
        data: {
          driverId,
          jobId,
          companyId: job.companyId,
          baseAmount: new Decimal(baseAmount),
          distanceBonus: new Decimal(distanceBonus),
          timeBonus: new Decimal(timeBonus),
          nightShiftBonus: new Decimal(nightShiftBonus),
          totalAmount: new Decimal(totalAmount),
          currency: 'LKR',
          status: 'PENDING',
          earnedAt: new Date(),
        },
      });
    }

    // Update driver total earnings
    await this.updateDriverTotalEarnings(driverId);

    this.logger.log(`Calculated earnings for job ${jobId}: ${totalAmount} LKR`);

    return earnings;
  }

  async updateDriverTotalEarnings(driverId: string) {
    // Calculate total earnings
    const totalEarnings = await this.prisma.driverEarning.aggregate({
      where: {
        driverId,
        status: { in: ['PENDING', 'APPROVED', 'PAID'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Calculate monthly earnings
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyEarnings = await this.prisma.driverEarning.aggregate({
      where: {
        driverId,
        earnedAt: { gte: startOfMonth },
        status: { in: ['PENDING', 'APPROVED', 'PAID'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Update driver record
    await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        totalEarnings: totalEarnings._sum.totalAmount || new Decimal(0),
        monthlyEarnings: monthlyEarnings._sum.totalAmount || new Decimal(0),
      },
    });
  }

  async getDriverStats(driverId: string, period: 'daily' | 'weekly' | 'monthly' | 'all' = 'monthly') {
    let startDate: Date;
    const now = new Date();

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo;
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0); // Beginning of time
    }

    // Get job stats
    const completedJobs = await this.prisma.job.count({
      where: {
        driverId,
        status: 'COMPLETED',
        updatedAt: { gte: startDate },
      },
    });

    const totalJobs = await this.prisma.job.count({
      where: {
        driverId,
        createdAt: { gte: startDate },
      },
    });

    // Get earnings
    const earnings = await this.prisma.driverEarning.aggregate({
      where: {
        driverId,
        earnedAt: { gte: startDate },
      },
      _sum: {
        totalAmount: true,
        baseAmount: true,
        distanceBonus: true,
        timeBonus: true,
        nightShiftBonus: true,
      },
      _avg: {
        totalAmount: true,
      },
      _count: true,
    });

    // Get distance stats from location tracking
    const trackingData = await this.prisma.locationTracking.findMany({
      where: {
        driverId,
        timestamp: { gte: startDate },
      },
      select: {
        metadata: true,
      },
    });

    let totalDistance = 0;
    trackingData.forEach((track) => {
      if (track.metadata && typeof track.metadata === 'object' && 'distanceTraveled' in track.metadata) {
        totalDistance += (track.metadata as any).distanceTraveled || 0;
      }
    });

    // Get performance metrics
    const avgCompletionTime = await this.calculateAverageCompletionTime(driverId, startDate);

    return {
      period,
      startDate,
      jobs: {
        completed: completedJobs,
        total: totalJobs,
        completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      },
      earnings: {
        total: Number(earnings._sum.totalAmount) || 0,
        average: Number(earnings._avg.totalAmount) || 0,
        count: earnings._count,
        breakdown: {
          base: Number(earnings._sum.baseAmount) || 0,
          distanceBonus: Number(earnings._sum.distanceBonus) || 0,
          timeBonus: Number(earnings._sum.timeBonus) || 0,
          nightShiftBonus: Number(earnings._sum.nightShiftBonus) || 0,
        },
      },
      distance: {
        total: totalDistance,
        average: completedJobs > 0 ? totalDistance / completedJobs : 0,
      },
      performance: {
        avgCompletionTime,
        onTimeRate: 0, // Calculate based on ETA vs actual
        rating: 0, // For future rating system
      },
    };
  }

  async getEarningsHistory(driverId: string, limit = 50) {
    const earnings = await this.prisma.driverEarning.findMany({
      where: { driverId },
      orderBy: { earnedAt: 'desc' },
      take: limit,
      include: {
        job: {
          include: {
            client: true,
            route: true,
          },
        },
      },
    });

    return earnings.map((earning) => ({
      id: earning.id,
      jobId: earning.jobId,
      job: {
        client: earning.job.client?.name,
        route: earning.job.route ? `${earning.job.route.origin} → ${earning.job.route.destination}` : null,
        status: earning.job.status,
      },
      amount: Number(earning.totalAmount),
      breakdown: {
        base: Number(earning.baseAmount),
        distanceBonus: Number(earning.distanceBonus),
        timeBonus: Number(earning.timeBonus),
        nightShiftBonus: Number(earning.nightShiftBonus),
      },
      status: earning.status,
      earnedAt: earning.earnedAt,
      paidAt: earning.paidAt,
    }));
  }

  async getDriverLeaderboard(companyId: string, period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get all drivers with their stats
    const drivers = await this.prisma.driver.findMany({
      where: {
        companyId,
        isActive: true,
      },
      include: {
        jobs: {
          where: {
            status: 'COMPLETED',
            updatedAt: { gte: startDate },
          },
        },
        earnings: {
          where: {
            earnedAt: { gte: startDate },
          },
        },
      },
    });

    const leaderboard = drivers.map((driver) => ({
      driverId: driver.id,
      name: driver.name,
      completedJobs: driver.jobs.length,
      totalEarnings: driver.earnings.reduce((sum, e) => sum + Number(e.totalAmount), 0),
      averageEarnings: driver.jobs.length > 0
        ? driver.earnings.reduce((sum, e) => sum + Number(e.totalAmount), 0) / driver.jobs.length
        : 0,
    }));

    // Sort by total earnings
    leaderboard.sort((a, b) => b.totalEarnings - a.totalEarnings);

    return {
      period,
      startDate,
      leaderboard: leaderboard.slice(0, 10), // Top 10 drivers
    };
  }

  private async calculateAverageCompletionTime(driverId: string, startDate: Date): Promise<number> {
    const jobs = await this.prisma.job.findMany({
      where: {
        driverId,
        status: 'COMPLETED',
        updatedAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    if (jobs.length === 0) return 0;

    const totalMinutes = jobs.reduce((sum, job) => {
      const duration = job.updatedAt.getTime() - job.createdAt.getTime();
      return sum + duration / 1000 / 60; // Convert to minutes
    }, 0);

    return Math.round(totalMinutes / jobs.length);
  }
}