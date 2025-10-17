import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { Priority } from '@prisma/client';

export enum JobRequestStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED'
}

export class JobRequestQueryDto {
  @ApiProperty({ description: 'Company ID', required: true })
  @IsString({ message: 'companyId must be a string' })
  @IsNotEmpty({ message: 'companyId is required' })
  @MinLength(10, { message: 'companyId must be at least 10 characters' })
  companyId: string;

  @ApiProperty({ description: 'Filter by status', required: false, enum: JobRequestStatus })
  @IsOptional()
  @IsEnum(JobRequestStatus)
  status?: JobRequestStatus;

  @ApiProperty({ description: 'Filter by priority', required: false, enum: Priority })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiProperty({ description: 'Filter by client ID', required: false })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false, default: 10 })
  @IsOptional()
  limit?: number;
}
