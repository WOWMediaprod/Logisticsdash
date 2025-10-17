import { PartialType } from '@nestjs/swagger';
import { CreateJobRequestDto } from './create-job-request.dto';

export class UpdateJobRequestDto extends PartialType(CreateJobRequestDto) {}
