import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ClientsModule } from './modules/clients/clients.module';
import { RoutesModule } from './modules/routes/routes.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { ContainersModule } from './modules/containers/containers.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { BillsModule } from './modules/bills/bills.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { JobRequestsModule } from './modules/job-requests/job-requests.module';
import { DriverAuthModule } from './modules/driver-auth/driver-auth.module';
import { TrackingV2Module } from './modules/tracking-v2/tracking-v2.module';
import { DriverStatsModule } from './modules/driver-stats/driver-stats.module';
import { WaypointsModule } from './modules/waypoints/waypoints.module';
import { GeocodingModule } from './modules/geocoding/geocoding.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.RATE_LIMIT_TTL) || 60000,
      limit: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    }]),

    // Database
    DatabaseModule,

    // Feature modules
    JobsModule,
    JobRequestsModule,
    ClientsModule,
    RoutesModule,
    VehiclesModule,
    DriversModule,
    ContainersModule,
    DocumentsModule,
    BillsModule,
    TrackingModule,

    // New V2 modules
    DriverAuthModule,
    TrackingV2Module,
    DriverStatsModule,
    WaypointsModule,
    GeocodingModule,
    // AuthModule,
    // EconomicsModule,
    // MaintenanceModule,
    // RagModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}