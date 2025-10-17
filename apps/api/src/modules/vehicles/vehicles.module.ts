import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}