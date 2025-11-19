import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { JobType, Priority } from '@prisma/client';

export class AmendJobDto {
  @ApiProperty({ description: 'Client ID', required: false })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: 'Container ID', required: false })
  @IsOptional()
  @IsString()
  containerId?: string;

  @ApiProperty({ description: 'Vehicle ID', required: false })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiProperty({ description: 'Job type', enum: JobType, required: false })
  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @ApiProperty({ description: 'Job priority', enum: Priority, required: false })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiProperty({ description: 'Special notes', required: false })
  @IsOptional()
  @IsString()
  specialNotes?: string;

  @ApiProperty({ description: 'Expected pickup time', required: false })
  @IsOptional()
  @IsDateString()
  pickupTs?: string;

  @ApiProperty({ description: 'Expected delivery time', required: false })
  @IsOptional()
  @IsDateString()
  dropTs?: string;

  @ApiProperty({ description: 'ETA timestamp', required: false })
  @IsOptional()
  @IsDateString()
  etaTs?: string;

  @ApiProperty({ description: 'Reason for amendment' })
  @IsString()
  amendmentReason: string;

  @ApiProperty({ description: 'User ID who is making the amendment' })
  @IsString()
  amendedBy: string;

  @ApiProperty({ description: 'Should notify driver', required: false, default: true })
  @IsOptional()
  notifyDriver?: boolean = true;

  @ApiProperty({ description: 'Should notify client', required: false, default: true })
  @IsOptional()
  notifyClient?: boolean = true;
}
