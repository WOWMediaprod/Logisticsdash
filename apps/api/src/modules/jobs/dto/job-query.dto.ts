import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { JobStatus } from '@prisma/client';

export class JobQueryDto {
  @ApiProperty({ description: 'Company ID' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Client ID filter', required: false })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: 'Job status filter', required: false })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiProperty({ description: 'Page number', default: 1, required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', default: 10, required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ description: 'Search query', required: false })
  @IsOptional()
  @IsString()
  search?: string;
}