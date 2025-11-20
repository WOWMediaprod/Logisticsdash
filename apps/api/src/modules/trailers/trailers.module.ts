import { Module } from '@nestjs/common';
import { TrailersController } from './trailers.controller';
import { TrailersService } from './trailers.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [TrailersController],
  providers: [TrailersService, PrismaService],
  exports: [TrailersService],
})
export class TrailersModule {}