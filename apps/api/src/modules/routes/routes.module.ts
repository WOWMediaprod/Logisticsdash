import { Module } from '@nestjs/common';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RoutesController],
  providers: [RoutesService],
})
export class RoutesModule {}