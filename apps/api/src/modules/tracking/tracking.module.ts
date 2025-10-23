import { Module, forwardRef } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { TrackingGateway } from './tracking.gateway';
import { GeofenceService } from './services/geofence.service';
import { ETAService } from './services/eta.service';
import { AutogateService } from './services/autogate.service';

@Module({
  controllers: [TrackingController],
  providers: [TrackingService, TrackingGateway, GeofenceService, ETAService, AutogateService],
  exports: [TrackingService, TrackingGateway, GeofenceService, ETAService, AutogateService],
})
export class TrackingModule {}