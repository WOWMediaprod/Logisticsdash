import { Module, forwardRef } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { QrCodeService } from './services/qr-code.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { TrackingV2Module } from '../tracking-v2/tracking-v2.module';

@Module({
  imports: [NotificationsModule, forwardRef(() => TrackingV2Module)],
  controllers: [JobsController],
  providers: [JobsService, QrCodeService],
  exports: [JobsService, QrCodeService],
})
export class JobsModule {}