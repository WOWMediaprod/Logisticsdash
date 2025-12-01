import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString, IsArray } from 'class-validator';
import { JobType, Priority, ShipmentType } from '@prisma/client';

export class CreateJobDto {
  @ApiProperty({ description: 'Company ID' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Client ID', required: false })
  @IsOptional()
  @IsString()
  clientId?: string;

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

  // Job Request Details (from original job request)
  @ApiProperty({ description: 'Job title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Shipment type', enum: ShipmentType, required: false })
  @IsOptional()
  @IsEnum(ShipmentType)
  shipmentType?: ShipmentType;

  @ApiProperty({ description: 'Supporting document IDs', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportingDocumentIds?: string[];

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

  @ApiProperty({ description: 'Container yard latitude', required: false })
  @IsOptional()
  @IsNumber()
  containerYardLocationLat?: number;

  @ApiProperty({ description: 'Container yard longitude', required: false })
  @IsOptional()
  @IsNumber()
  containerYardLocationLng?: number;

  @ApiProperty({ description: 'Cargo description', required: false })
  @IsOptional()
  @IsString()
  cargoDescription?: string;

  @ApiProperty({ description: 'Cargo weight', required: false })
  @IsOptional()
  @IsNumber()
  cargoWeight?: number;

  @ApiProperty({ description: 'Cargo weight unit', required: false, default: 'kg' })
  @IsOptional()
  @IsString()
  cargoWeightUnit?: string;

  @ApiProperty({ description: 'Is BL cutoff required', required: false, default: false })
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

  @ApiProperty({ description: 'Delivery latitude', required: false })
  @IsOptional()
  @IsNumber()
  deliveryLat?: number;

  @ApiProperty({ description: 'Delivery longitude', required: false })
  @IsOptional()
  @IsNumber()
  deliveryLng?: number;

  @ApiProperty({ description: 'Delivery contact person name', required: false })
  @IsOptional()
  @IsString()
  deliveryContactName?: string;

  @ApiProperty({ description: 'Delivery contact phone number', required: false })
  @IsOptional()
  @IsString()
  deliveryContactPhone?: string;
}