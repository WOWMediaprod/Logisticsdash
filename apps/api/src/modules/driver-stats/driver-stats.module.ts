import { Module } from '@nestjs/common';
import { DriverStatsService } from './driver-stats.service';
import { DriverStatsController } from './driver-stats.controller';
import { PrismaService } from '../../database/prisma.service';
import { DriverAuthModule } from '../driver-auth/driver-auth.module';

@Module({
  imports: [DriverAuthModule],
  controllers: [DriverStatsController],
  providers: [DriverStatsService, PrismaService],
  exports: [DriverStatsService],
})
export class DriverStatsModule {}