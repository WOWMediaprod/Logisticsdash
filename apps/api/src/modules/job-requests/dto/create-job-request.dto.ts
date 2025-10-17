import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { Priority, JobType } from '@prisma/client';

export class CreateJobRequestDto {
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

  @ApiProperty({ description: 'User who requested this', required: false })
  @IsOptional()
  @IsString()
  requestedBy?: string;

  @ApiProperty({ description: 'Request title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Request description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Priority level', enum: Priority, default: Priority.NORMAL })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiProperty({ description: 'Job type', enum: JobType, default: JobType.ONE_WAY })
  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @ApiProperty({ description: 'Requested pickup timestamp', required: false })
  @IsOptional()
  @IsDateString()
  requestedPickupTs?: string;

  @ApiProperty({ description: 'Requested drop/delivery timestamp', required: false })
  @IsOptional()
  @IsDateString()
  requestedDropTs?: string;

  @ApiProperty({ description: 'Pickup address' })
  @IsString()
  pickupAddress: string;

  @ApiProperty({ description: 'Delivery address' })
  @IsString()
  deliveryAddress: string;

  @ApiProperty({ description: 'Pickup latitude', required: false })
  @IsOptional()
  @IsNumber()
  pickupLat?: number;

  @ApiProperty({ description: 'Pickup longitude', required: false })
  @IsOptional()
  @IsNumber()
  pickupLng?: number;

  @ApiProperty({ description: 'Delivery latitude', required: false })
  @IsOptional()
  @IsNumber()
  deliveryLat?: number;

  @ApiProperty({ description: 'Delivery longitude', required: false })
  @IsOptional()
  @IsNumber()
  deliveryLng?: number;

  @ApiProperty({ description: 'Container type', required: false })
  @IsOptional()
  @IsString()
  containerType?: string;

  @ApiProperty({ description: 'Special requirements', required: false })
  @IsOptional()
  @IsString()
  specialRequirements?: string;

  @ApiProperty({ description: 'Estimated value', required: false })
  @IsOptional()
  @IsNumber()
  estimatedValue?: number;
}
