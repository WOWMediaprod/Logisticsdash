import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { JobType, Priority } from '@prisma/client';

export class CreateJobDto {
  @ApiProperty({ description: 'Company ID' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Client ID', required: false })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: 'Route ID', required: false })
  @IsOptional()
  @IsString()
  routeId?: string;

  @ApiProperty({ description: 'Container ID', required: false })
  @IsOptional()
  @IsString()
  containerId?: string;

  @ApiProperty({ description: 'Job type', enum: JobType, default: JobType.ONE_WAY })
  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType = JobType.ONE_WAY;

  @ApiProperty({ description: 'Job priority', enum: Priority, default: Priority.NORMAL })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority = Priority.NORMAL;

  @ApiProperty({ description: 'Special notes', required: false })
  @IsOptional()
  @IsString()
  specialNotes?: string;

  @ApiProperty({ description: 'Expected pickup time', required: false })
  @IsOptional()
  pickupTs?: Date;

  @ApiProperty({ description: 'Expected delivery time', required: false })
  @IsOptional()
  dropTs?: Date;
}