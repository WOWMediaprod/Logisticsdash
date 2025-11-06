import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsBoolean,
  ValidateIf,
  IsDecimal
} from 'class-validator';
import { Priority, JobType, ShipmentType } from '@prisma/client';

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

  // =============== LEGACY FIELDS (kept for backward compatibility) ===============
  @ApiProperty({ description: 'Legacy job type', enum: JobType, required: false })
  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @ApiProperty({ description: 'Legacy pickup timestamp', required: false })
  @IsOptional()
  @IsDateString()
  requestedPickupTs?: string;

  @ApiProperty({ description: 'Legacy drop/delivery timestamp', required: false })
  @IsOptional()
  @IsDateString()
  requestedDropTs?: string;

  @ApiProperty({ description: 'Legacy pickup address', required: false })
  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @ApiProperty({ description: 'Legacy pickup latitude', required: false })
  @IsOptional()
  @IsNumber()
  pickupLat?: number;

  @ApiProperty({ description: 'Legacy pickup longitude', required: false })
  @IsOptional()
  @IsNumber()
  pickupLng?: number;

  @ApiProperty({ description: 'Legacy container type', required: false })
  @IsOptional()
  @IsString()
  containerType?: string;

  // =============== NEW WORKFLOW FIELDS ===============

  @ApiProperty({ description: 'Shipment type (Export/Import/LCL)', enum: ShipmentType, required: false })
  @IsOptional()
  @IsEnum(ShipmentType)
  shipmentType?: ShipmentType;

  @ApiProperty({ description: 'Release order document URL', required: false })
  @IsOptional()
  @IsString()
  releaseOrderUrl?: string;

  // Loading Information
  @ApiProperty({ description: 'Loading location (goods location)' })
  @IsString()
  loadingLocation: string;

  @ApiProperty({ description: 'Loading location latitude', required: false })
  @IsOptional()
  @IsNumber()
  loadingLocationLat?: number;

  @ApiProperty({ description: 'Loading location longitude', required: false })
  @IsOptional()
  @IsNumber()
  loadingLocationLng?: number;

  @ApiProperty({ description: 'Loading contact name' })
  @IsString()
  loadingContactName: string;

  @ApiProperty({ description: 'Loading contact phone' })
  @IsString()
  loadingContactPhone: string;

  @ApiProperty({ description: 'Loading date', required: false })
  @IsOptional()
  @IsDateString()
  loadingDate?: string;

  @ApiProperty({ description: 'Loading time', required: false })
  @IsOptional()
  @IsString()
  loadingTime?: string;

  // Container Reservation (conditional)
  @ApiProperty({ description: 'Container reservation required', default: false })
  @IsOptional()
  @IsBoolean()
  containerReservation?: boolean;

  @ApiProperty({ description: 'Container number (required if containerReservation = true)', required: false })
  @ValidateIf(o => o.containerReservation === true)
  @IsString()
  containerNumber?: string;

  @ApiProperty({ description: 'Seal number (required if containerReservation = true)', required: false })
  @ValidateIf(o => o.containerReservation === true)
  @IsString()
  sealNumber?: string;

  @ApiProperty({ description: 'Container reserved yard location', required: false })
  @ValidateIf(o => o.containerReservation === true)
  @IsString()
  containerYardLocation?: string;

  @ApiProperty({ description: 'Container yard location latitude', required: false })
  @IsOptional()
  @IsNumber()
  containerYardLocationLat?: number;

  @ApiProperty({ description: 'Container yard location longitude', required: false })
  @IsOptional()
  @IsNumber()
  containerYardLocationLng?: number;

  // Cargo Details
  @ApiProperty({ description: 'Cargo description', required: false })
  @IsOptional()
  @IsString()
  cargoDescription?: string;

  @ApiProperty({ description: 'Cargo weight', required: false })
  @IsOptional()
  @IsNumber()
  cargoWeight?: number;

  @ApiProperty({ description: 'Cargo weight unit (kg/tons)', default: 'kg', required: false })
  @IsOptional()
  @IsString()
  cargoWeightUnit?: string;

  // BL Cutoff (conditional)
  @ApiProperty({ description: 'BL cutoff required', default: false })
  @IsOptional()
  @IsBoolean()
  blCutoffRequired?: boolean;

  @ApiProperty({ description: 'BL cutoff date and time (required if blCutoffRequired = true)', required: false })
  @ValidateIf(o => o.blCutoffRequired === true)
  @IsDateString()
  blCutoffDateTime?: string;

  // Wharf Information
  @ApiProperty({ description: 'Wharf name', required: false })
  @IsOptional()
  @IsString()
  wharfName?: string;

  @ApiProperty({ description: 'Wharf contact (name and phone)', required: false })
  @IsOptional()
  @IsString()
  wharfContact?: string;

  // Delivery Information
  @ApiProperty({ description: 'Delivery address' })
  @IsString()
  deliveryAddress: string;

  @ApiProperty({ description: 'Delivery latitude', required: false })
  @IsOptional()
  @IsNumber()
  deliveryLat?: number;

  @ApiProperty({ description: 'Delivery longitude', required: false })
  @IsOptional()
  @IsNumber()
  deliveryLng?: number;

  @ApiProperty({ description: 'Delivery contact name' })
  @IsString()
  deliveryContactName: string;

  @ApiProperty({ description: 'Delivery contact phone' })
  @IsString()
  deliveryContactPhone: string;

  // Additional Notes
  @ApiProperty({ description: 'Special requirements/instructions', required: false })
  @IsOptional()
  @IsString()
  specialRequirements?: string;
}
