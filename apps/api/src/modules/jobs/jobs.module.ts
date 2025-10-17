import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { QrCodeService } from './services/qr-code.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, QrCodeService],
  exports: [JobsService, QrCodeService],
})
export class JobsModule {}