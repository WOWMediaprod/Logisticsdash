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

    const distance = trackingState ? Number(trackingState.totalDistance) : 0;
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
          },
        },
      },
    });

    return earnings.map((earning) => ({
      id: earning.id,
      jobId: earning.jobId,
      job: {
        client: earning.job.client?.name,
        route: null,
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

  /**
   * Get comprehensive driver performance overview for admin dashboard
   * Includes all drivers with stats, trends, and intelligent alerts
   */
  async getDriverOverview(companyId: string, period: 'today' | 'week' | 'month' | '30days' = 'week') {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = now;
    let previousStart: Date;
    let previousEnd: Date;
    let periodLabel: string;

    // Calculate current and previous period date ranges
    switch (period) {
      case 'today':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStart = new Date(periodStart);
        previousStart.setDate(previousStart.getDate() - 1);
        previousEnd = new Date(periodStart);
        periodLabel = 'Today';
        break;
      case 'week':
        periodStart = new Date(now);
        periodStart.setDate(periodStart.getDate() - 7);
        previousStart = new Date(periodStart);
        previousStart.setDate(previousStart.getDate() - 7);
        previousEnd = periodStart;
        periodLabel = 'This Week';
        break;
      case 'month':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = periodStart;
        periodLabel = 'This Month';
        break;
      case '30days':
      default:
        periodStart = new Date(now);
        periodStart.setDate(periodStart.getDate() - 30);
        previousStart = new Date(periodStart);
        previousStart.setDate(previousStart.getDate() - 30);
        previousEnd = periodStart;
        periodLabel = 'Last 30 Days';
        break;
    }

    // Get all active drivers for the company
    const drivers = await this.prisma.driver.findMany({
      where: {
        companyId,
        isActive: true,
      },
      include: {
        jobs: {
          where: {
            OR: [
              // Jobs in current period
              { createdAt: { gte: previousStart, lte: periodEnd } },
            ],
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            completedAt: true,
            updatedAt: true,
          },
        },
        earnings: {
          where: {
            earnedAt: { gte: previousStart, lte: periodEnd },
          },
          select: {
            totalAmount: true,
            earnedAt: true,
          },
        },
      },
    });

    // Calculate days in period (excluding weekends for jobs/day calculation)
    const daysInPeriod = this.countWorkingDays(periodStart, periodEnd);
    const daysInPreviousPeriod = this.countWorkingDays(previousStart, previousEnd);

    // Process each driver's stats
    const driverStats = drivers.map((driver) => {
      // Current period stats
      const currentJobs = driver.jobs.filter(
        (j) => j.createdAt >= periodStart && j.createdAt <= periodEnd
      );
      const currentCompletedJobs = currentJobs.filter((j) => j.status === 'COMPLETED');
      const currentEarnings = driver.earnings.filter(
        (e) => e.earnedAt >= periodStart && e.earnedAt <= periodEnd
      );

      // Previous period stats
      const previousJobs = driver.jobs.filter(
        (j) => j.createdAt >= previousStart && j.createdAt < previousEnd
      );
      const previousCompletedJobs = previousJobs.filter((j) => j.status === 'COMPLETED');
      const previousEarnings = driver.earnings.filter(
        (e) => e.earnedAt >= previousStart && e.earnedAt < previousEnd
      );

      // Calculate current period metrics
      const totalJobs = currentJobs.length;
      const completedJobs = currentCompletedJobs.length;
      const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
      const totalEarnings = currentEarnings.reduce(
        (sum, e) => sum + Number(e.totalAmount),
        0
      );
      const jobsPerDay = daysInPeriod > 0 ? totalJobs / daysInPeriod : 0;

      // Calculate active days (unique days with jobs)
      const activeDays = new Set(
        currentJobs.map((j) => j.createdAt.toISOString().split('T')[0])
      ).size;
      const idleDays = Math.max(0, daysInPeriod - activeDays);

      // Calculate previous period metrics for trends
      const prevTotalJobs = previousJobs.length;
      const prevCompletedJobs = previousCompletedJobs.length;
      const prevCompletionRate = prevTotalJobs > 0 ? (prevCompletedJobs / prevTotalJobs) * 100 : 0;
      const prevTotalEarnings = previousEarnings.reduce(
        (sum, e) => sum + Number(e.totalAmount),
        0
      );

      // Calculate trend percentages
      const jobsChange = this.calculatePercentChange(totalJobs, prevTotalJobs);
      const earningsChange = this.calculatePercentChange(totalEarnings, prevTotalEarnings);
      const completionRateChange = completionRate - prevCompletionRate;

      // Check for idle streak (last 3 days with no jobs)
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const recentJobs = driver.jobs.filter((j) => j.createdAt >= threeDaysAgo);
      const hasIdleStreak = recentJobs.length === 0;

      // Check if new driver (first job less than 7 days ago)
      const firstJobDate = driver.jobs.length > 0
        ? driver.jobs.reduce((min, j) => (j.createdAt < min ? j.createdAt : min), driver.jobs[0].createdAt)
        : null;
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const isNewDriver = firstJobDate ? firstJobDate > sevenDaysAgo : true;

      return {
        id: driver.id,
        name: driver.name,
        phone: driver.phone || '',
        isOnline: driver.isOnline,
        lastLocation: driver.lastLocationLat && driver.lastLocationLng
          ? {
              lat: Number(driver.lastLocationLat),
              lng: Number(driver.lastLocationLng),
              updatedAt: driver.lastLocationUpdate,
            }
          : null,
        stats: {
          totalJobs,
          completedJobs,
          completionRate: Math.round(completionRate * 10) / 10,
          totalEarnings: Math.round(totalEarnings * 100) / 100,
          jobsPerDay: Math.round(jobsPerDay * 10) / 10,
          activeDays,
          idleDays,
        },
        trends: {
          jobsChange: Math.round(jobsChange * 10) / 10,
          earningsChange: Math.round(earningsChange * 10) / 10,
          completionRateChange: Math.round(completionRateChange * 10) / 10,
        },
        alerts: {
          isTopPerformer: false, // Will be calculated after company averages
          isUnderperforming: false, // Will be calculated after company averages
          hasIdleStreak,
          isNewDriver,
        },
        lastActive: driver.lastLocationUpdate || driver.updatedAt,
      };
    });

    // Calculate company averages
    const driversWithJobs = driverStats.filter((d) => d.stats.totalJobs > 0);
    const companyAverages = {
      completionRate:
        driversWithJobs.length > 0
          ? driversWithJobs.reduce((sum, d) => sum + d.stats.completionRate, 0) / driversWithJobs.length
          : 0,
      jobsPerDay:
        driversWithJobs.length > 0
          ? driversWithJobs.reduce((sum, d) => sum + d.stats.jobsPerDay, 0) / driversWithJobs.length
          : 0,
      avgEarnings:
        driversWithJobs.length > 0
          ? driversWithJobs.reduce((sum, d) => sum + d.stats.totalEarnings, 0) / driversWithJobs.length
          : 0,
    };

    // Set performance alerts based on company averages
    let topPerformers = 0;
    let needsAttention = 0;

    driverStats.forEach((driver) => {
      if (driver.stats.totalJobs > 0 && companyAverages.completionRate > 0) {
        // Top performer: > 120% of company average completion rate
        if (driver.stats.completionRate >= companyAverages.completionRate * 1.2) {
          driver.alerts.isTopPerformer = true;
          topPerformers++;
        }
        // Underperforming: < 80% of company average completion rate
        else if (driver.stats.completionRate <= companyAverages.completionRate * 0.8) {
          driver.alerts.isUnderperforming = true;
          needsAttention++;
        }
      }
      // Also flag drivers with idle streak as needing attention
      if (driver.alerts.hasIdleStreak && !driver.alerts.isNewDriver) {
        needsAttention++;
      }
    });

    // Summary counts
    const summary = {
      totalDrivers: driverStats.length,
      onlineNow: driverStats.filter((d) => d.isOnline).length,
      topPerformers,
      needsAttention,
    };

    return {
      success: true,
      data: {
        period: {
          start: periodStart,
          end: periodEnd,
          label: periodLabel,
        },
        previousPeriod: {
          start: previousStart,
          end: previousEnd,
        },
        companyAverages: {
          completionRate: Math.round(companyAverages.completionRate * 10) / 10,
          jobsPerDay: Math.round(companyAverages.jobsPerDay * 10) / 10,
          avgEarnings: Math.round(companyAverages.avgEarnings * 100) / 100,
        },
        drivers: driverStats,
        summary,
      },
    };
  }

  /**
   * Calculate working days between two dates (excludes weekends)
   */
  private countWorkingDays(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return Math.max(count, 1); // At least 1 to avoid division by zero
  }

  /**
   * Calculate percent change between current and previous values
   */
  private calculatePercentChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }
}