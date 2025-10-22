import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { DriverLoginDto } from './dto/driver-login.dto';
import { DriverSessionDto } from './dto/driver-session.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DriverAuthService {
  private readonly logger = new Logger(DriverAuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: DriverLoginDto, ipAddress?: string, userAgent?: string): Promise<DriverSessionDto> {
    const { companyId, licenseNo, pin, deviceId, deviceInfo } = loginDto;

    // Find driver by company and license number
    const driver = await this.prisma.driver.findFirst({
      where: {
        companyId,
        licenseNo,
        isActive: true,
      },
      include: {
        company: true,
      },
    });

    if (!driver) {
      throw new UnauthorizedException('Invalid driver credentials');
    }

    // Verify PIN
    if (driver.pin !== pin) {
      throw new UnauthorizedException('Invalid driver credentials');
    }

    // Update driver status
    await this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        lastLoginAt: new Date(),
        isOnline: true,
        deviceInfo: deviceInfo || undefined,
      },
    });

    // Create JWT token
    const payload = {
      sub: driver.id,
      driverId: driver.id,
      companyId: driver.companyId,
      name: driver.name,
      licenseNo: driver.licenseNo,
      type: 'driver',
    };

    const token = this.jwtService.sign(payload);

    // Create session record
    const session = await this.prisma.driverSession.create({
      data: {
        driverId: driver.id,
        companyId: driver.companyId,
        token,
        deviceId,
        deviceInfo,
        ipAddress,
        userAgent,
        loginAt: new Date(),
        lastActiveAt: new Date(),
        isActive: true,
      },
    });

    this.logger.log(`Driver ${driver.name} logged in successfully from ${ipAddress}`);

    // Get current job if any
    const currentJob = driver.currentJobId ? await this.prisma.job.findUnique({
      where: { id: driver.currentJobId },
      include: {
        client: true,
        route: true,
        vehicle: true,
        container: true,
      },
    }) : null;

    // Get earnings summary
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyEarnings = await this.prisma.driverEarning.aggregate({
      where: {
        driverId: driver.id,
        earnedAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEarnings = await this.prisma.driverEarning.aggregate({
      where: {
        driverId: driver.id,
        earnedAt: {
          gte: todayStart,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get job stats
    const completedJobs = await this.prisma.job.count({
      where: {
        driverId: driver.id,
        status: 'COMPLETED',
      },
    });

    const activeJobs = await this.prisma.job.count({
      where: {
        driverId: driver.id,
        status: {
          in: ['ASSIGNED', 'IN_TRANSIT', 'AT_PICKUP', 'LOADED', 'AT_DELIVERY'],
        },
      },
    });

    return {
      token,
      sessionId: session.id,
      driver: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        licenseNo: driver.licenseNo,
        companyId: driver.companyId,
        companyName: driver.company.name,
        totalEarnings: Number(driver.totalEarnings) || 0,
        monthlyEarnings: Number(monthlyEarnings._sum.totalAmount) || 0,
        todayEarnings: Number(todayEarnings._sum.totalAmount) || 0,
        isOnline: true,
      },
      currentJob,
      stats: {
        completedJobs,
        activeJobs,
        totalDistance: 0, // Will be calculated from tracking data
        averageRating: 0, // For future rating system
      },
    };
  }

  async logout(driverId: string): Promise<void> {
    // Update driver status
    await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        isOnline: false,
        lastLocationUpdate: new Date(),
      },
    });

    // Deactivate all sessions
    await this.prisma.driverSession.updateMany({
      where: {
        driverId,
        isActive: true,
      },
      data: {
        isActive: false,
        logoutAt: new Date(),
      },
    });

    // Clear tracking state
    await this.prisma.trackingState.deleteMany({
      where: { driverId },
    });

    this.logger.log(`Driver ${driverId} logged out`);
  }

  async validateSession(token: string): Promise<any> {
    const session = await this.prisma.driverSession.findFirst({
      where: {
        token,
        isActive: true,
      },
      include: {
        driver: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Update last active time
    await this.prisma.driverSession.update({
      where: { id: session.id },
      data: {
        lastActiveAt: new Date(),
      },
    });

    return session.driver;
  }

  async changePin(driverId: string, oldPin: string, newPin: string): Promise<void> {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new BadRequestException('Driver not found');
    }

    if (driver.pin !== oldPin) {
      throw new UnauthorizedException('Invalid current PIN');
    }

    // Validate new PIN (must be 6 digits)
    if (!/^\d{6}$/.test(newPin)) {
      throw new BadRequestException('PIN must be exactly 6 digits');
    }

    await this.prisma.driver.update({
      where: { id: driverId },
      data: { pin: newPin },
    });

    this.logger.log(`Driver ${driverId} changed PIN successfully`);
  }

  async getDriverProfile(driverId: string): Promise<any> {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        company: true,
        trackingState: true,
      },
    });

    if (!driver) {
      throw new BadRequestException('Driver not found');
    }

    // Get current month earnings
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyEarnings = await this.prisma.driverEarning.aggregate({
      where: {
        driverId,
        earnedAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get recent jobs
    const recentJobs = await this.prisma.job.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        client: true,
        route: true,
        earnings: {
          where: { driverId },
        },
      },
    });

    return {
      ...driver,
      monthlyEarnings: Number(monthlyEarnings._sum.totalAmount) || 0,
      recentJobs,
    };
  }

  async updateDeviceInfo(driverId: string, deviceInfo: any): Promise<void> {
    await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        deviceInfo,
        lastLocationUpdate: new Date(),
      },
    });
  }

  async loginByJob(jobId: string, pin: string): Promise<{ success: boolean; token?: string; driverId?: string; message?: string }> {
    try {
      // Find the job
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        include: {
          driver: true,
          company: true,
        },
      });

      if (!job) {
        return { success: false, message: 'Job not found' };
      }

      if (!job.driver) {
        return { success: false, message: 'No driver assigned to this job' };
      }

      // Verify PIN
      if (job.driver.pin !== pin) {
        return { success: false, message: 'Invalid PIN' };
      }

      // Update driver status
      await this.prisma.driver.update({
        where: { id: job.driver.id },
        data: {
          lastLoginAt: new Date(),
          isOnline: true,
        },
      });

      // Create JWT token
      const payload = {
        sub: job.driver.id,
        driverId: job.driver.id,
        companyId: job.driver.companyId,
        name: job.driver.name,
        licenseNo: job.driver.licenseNo,
        type: 'driver',
      };

      const token = this.jwtService.sign(payload);

      this.logger.log(`Driver ${job.driver.name} logged in via job ${jobId}`);

      return {
        success: true,
        token,
        driverId: job.driver.id,
      };
    } catch (error) {
      this.logger.error(`Job-based login error: ${error.message}`);
      return { success: false, message: 'Login failed' };
    }
  }
}