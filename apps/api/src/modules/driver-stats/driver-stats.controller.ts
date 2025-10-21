import { Controller, Get, Post, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DriverStatsService } from './driver-stats.service';
import { DriverAuthGuard } from '../driver-auth/guards/driver-auth.guard';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Driver Stats')
@Controller('api/v1/driver-stats')
export class DriverStatsController {
  constructor(private readonly statsService: DriverStatsService) {}

  @Post('calculate-earnings/:jobId')
  @UseGuards(DriverAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate earnings for a completed job' })
  @ApiResponse({ status: 200, description: 'Earnings calculated successfully' })
  async calculateJobEarnings(
    @Request() req: any,
    @Param('jobId') jobId: string,
  ) {
    return this.statsService.calculateJobEarnings(jobId, req.user.id);
  }

  @Get('my-stats')
  @UseGuards(DriverAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get driver stats' })
  @ApiQuery({ name: 'period', enum: ['daily', 'weekly', 'monthly', 'all'], required: false })
  @ApiResponse({ status: 200, description: 'Driver stats retrieved' })
  async getMyStats(
    @Request() req: any,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly' | 'all',
  ) {
    return this.statsService.getDriverStats(req.user.id, period || 'monthly');
  }

  @Get('my-earnings')
  @UseGuards(DriverAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get driver earnings history' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Earnings history retrieved' })
  async getMyEarnings(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.statsService.getEarningsHistory(req.user.id, limitNum);
  }

  // Admin endpoints
  @Get('driver/:driverId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get stats for a specific driver (admin)' })
  @ApiQuery({ name: 'period', enum: ['daily', 'weekly', 'monthly', 'all'], required: false })
  @ApiResponse({ status: 200, description: 'Driver stats retrieved' })
  async getDriverStats(
    @Param('driverId') driverId: string,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly' | 'all',
  ) {
    return this.statsService.getDriverStats(driverId, period || 'monthly');
  }

  @Get('driver/:driverId/earnings')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get earnings history for a specific driver (admin)' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Earnings history retrieved' })
  async getDriverEarnings(
    @Param('driverId') driverId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.statsService.getEarningsHistory(driverId, limitNum);
  }

  @Get('leaderboard/:companyId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get driver leaderboard for a company' })
  @ApiQuery({ name: 'period', enum: ['daily', 'weekly', 'monthly'], required: false })
  @ApiResponse({ status: 200, description: 'Leaderboard retrieved' })
  async getLeaderboard(
    @Param('companyId') companyId: string,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
  ) {
    return this.statsService.getDriverLeaderboard(companyId, period || 'monthly');
  }
}