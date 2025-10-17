import { Module } from '@nestjs/common';
import { JobRequestsService } from './job-requests.service';
import { JobRequestsController } from './job-requests.controller';

@Module({
  controllers: [JobRequestsController],
  providers: [JobRequestsService],
  exports: [JobRequestsService],
})
export class JobRequestsModule {}
