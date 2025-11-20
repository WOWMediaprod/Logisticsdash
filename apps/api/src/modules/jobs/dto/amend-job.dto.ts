import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsNumber } from 'class-validator';
import { JobType, Priority, JobStatus } from '@prisma/client';

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

  @ApiProperty({ description: 'Trailer ID', required: false })
  @IsOptional()
  @IsString()
  trailerId?: string;

  @ApiProperty({ description: 'Driver ID', required: false })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiProperty({ description: 'Job type', enum: JobType, required: false })
  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @ApiProperty({ description: 'Job status', enum: JobStatus, required: false })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

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

  @ApiProperty({ description: 'Enable/disable GPS tracking', required: false })
  @IsOptional()
  @IsBoolean()
  trackingEnabled?: boolean;

  @ApiProperty({ description: 'Public tracking link/code for sharing', required: false })
  @IsOptional()
  @IsString()
  shareTrackingLink?: string;

  // Job Request Details (amendable fields)
  @ApiProperty({ description: 'Release order document URL', required: false })
  @IsOptional()
  @IsString()
  releaseOrderUrl?: string;

  @ApiProperty({ description: 'Loading/pickup location address', required: false })
  @IsOptional()
  @IsString()
  loadingLocation?: string;

  @ApiProperty({ description: 'Loading location latitude', required: false })
  @IsOptional()
  @IsNumber()
  loadingLocationLat?: number;

  @ApiProperty({ description: 'Loading location longitude', required: false })
  @IsOptional()
  @IsNumber()
  loadingLocationLng?: number;

  @ApiProperty({ description: 'Loading contact person name', required: false })
  @IsOptional()
  @IsString()
  loadingContactName?: string;

  @ApiProperty({ description: 'Loading contact phone number', required: false })
  @IsOptional()
  @IsString()
  loadingContactPhone?: string;

  @ApiProperty({ description: 'Container number', required: false })
  @IsOptional()
  @IsString()
  containerNumber?: string;

  @ApiProperty({ description: 'Seal number', required: false })
  @IsOptional()
  @IsString()
  sealNumber?: string;

  @ApiProperty({ description: 'Container yard location', required: false })
  @IsOptional()
  @IsString()
  containerYardLocation?: string;

  @ApiProperty({ description: 'Cargo description', required: false })
  @IsOptional()
  @IsString()
  cargoDescription?: string;

  @ApiProperty({ description: 'Cargo weight', required: false })
  @IsOptional()
  @IsNumber()
  cargoWeight?: number;

  @ApiProperty({ description: 'Is BL cutoff required', required: false })
  @IsOptional()
  @IsBoolean()
  blCutoffRequired?: boolean;

  @ApiProperty({ description: 'BL cutoff date and time', required: false })
  @IsOptional()
  @IsDateString()
  blCutoffDateTime?: string;

  @ApiProperty({ description: 'Wharf name', required: false })
  @IsOptional()
  @IsString()
  wharfName?: string;

  @ApiProperty({ description: 'Wharf contact', required: false })
  @IsOptional()
  @IsString()
  wharfContact?: string;

  @ApiProperty({ description: 'Delivery address', required: false })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiProperty({ description: 'Delivery contact person name', required: false })
  @IsOptional()
  @IsString()
  deliveryContactName?: string;

  @ApiProperty({ description: 'Delivery contact phone number', required: false })
  @IsOptional()
  @IsString()
  deliveryContactPhone?: string;

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
