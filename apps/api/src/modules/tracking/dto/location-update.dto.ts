import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, IsJSON } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LocationUpdateDto {
  @ApiProperty({ description: 'Job ID being tracked' })
  @IsString()
  jobId: string;

  @ApiProperty({ description: 'Driver ID' })
  @IsString()
  driverId: string;

  @ApiProperty({ description: 'Vehicle ID', required: false })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiProperty({ description: 'Latitude coordinate', example: 19.0760 })
  @IsNumber()
  lat: number;

  @ApiProperty({ description: 'Longitude coordinate', example: 72.8777 })
  @IsNumber()
  lng: number;

  @ApiProperty({ description: 'GPS accuracy in meters', required: false })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiProperty({ description: 'Altitude in meters', required: false })
  @IsOptional()
  @IsNumber()
  altitude?: number;

  @ApiProperty({ description: 'Speed in km/h', required: false })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiProperty({ description: 'Heading/bearing in degrees', required: false })
  @IsOptional()
  @IsNumber()
  heading?: number;

  @ApiProperty({ description: 'Timestamp of location capture' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ description: 'Device battery level percentage', required: false })
  @IsOptional()
  @IsNumber()
  batteryLevel?: number;

  @ApiProperty({ description: 'Whether location was manually entered', required: false })
  @IsOptional()
  @IsBoolean()
  isManual?: boolean;

  @ApiProperty({ description: 'Location source', required: false, default: 'MOBILE_GPS' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: any;
}

export class LiveDriverLocationDto {
  @ApiProperty({ description: 'Driver/Tracker name or ID' })
  @IsString()
  trackerId: string;

  @ApiProperty({ description: 'Driver/Tracker display name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Latitude coordinate', example: 6.9271 })
  @IsNumber()
  lat: number;

  @ApiProperty({ description: 'Longitude coordinate', example: 79.8612 })
  @IsNumber()
  lng: number;

  @ApiProperty({ description: 'GPS accuracy in meters', required: false })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiProperty({ description: 'Speed in m/s', required: false })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiProperty({ description: 'Heading/bearing in degrees', required: false })
  @IsOptional()
  @IsNumber()
  heading?: number;

  @ApiProperty({ description: 'Timestamp of location capture' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ description: 'Company ID for filtering', required: false })
  @IsOptional()
  @IsString()
  companyId?: string;
}

export class LocationQueryDto {
  @ApiProperty({ description: 'Job ID to filter by', required: false })
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiProperty({ description: 'Driver ID to filter by', required: false })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiProperty({ description: 'Vehicle ID to filter by', required: false })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiProperty({ description: 'Start timestamp for range', required: false })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiProperty({ description: 'End timestamp for range', required: false })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiProperty({ description: 'Limit number of results', required: false, default: 100 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}