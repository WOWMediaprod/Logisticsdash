import { IsString, IsNumber, IsOptional, IsNotEmpty, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LocationUpdateV2Dto {
  @ApiProperty({
    description: 'Job ID (optional, required for job tracking)',
    required: false,
  })
  @IsString()
  @IsOptional()
  jobId?: string;

  @ApiProperty({
    description: 'Latitude',
    example: 6.927079,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'Longitude',
    example: 79.861244,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({
    description: 'Current speed in km/h',
    example: 45.5,
  })
  @IsNumber()
  @Min(0)
  speed: number;

  @ApiProperty({
    description: 'Heading/bearing in degrees (0-360)',
    example: 180,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiProperty({
    description: 'GPS accuracy in meters',
    example: 10,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  accuracy?: number;

  @ApiProperty({
    description: 'Altitude in meters',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  altitude?: number;

  @ApiProperty({
    description: 'Battery level percentage',
    example: 75,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  batteryLevel?: number;

  @ApiProperty({
    description: 'Network type (4G, 3G, WiFi)',
    example: '4G',
    required: false,
  })
  @IsString()
  @IsOptional()
  networkType?: string;

  @ApiProperty({
    description: 'ISO timestamp',
    example: '2024-10-21T12:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  timestamp: string;

  @ApiProperty({
    description: 'Is device charging',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isCharging?: boolean;
}

export class LocationHistoryQueryDto {
  @ApiProperty({
    description: 'Job ID to filter by',
    required: false,
  })
  @IsString()
  @IsOptional()
  jobId?: string;

  @ApiProperty({
    description: 'Limit number of results',
    default: 100,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: 'Start date for history',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for history',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}