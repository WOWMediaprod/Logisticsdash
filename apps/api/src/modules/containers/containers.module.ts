import { Module } from '@nestjs/common';
import { ContainersController } from './containers.controller';
import { ContainersService } from './containers.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ContainersController],
  providers: [ContainersService],
})
export class ContainersModule {}