import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WaypointType {
  PICKUP = 'PICKUP',
  CONTAINER_PICKUP = 'CONTAINER_PICKUP',
  DOCUMENT_PICKUP = 'DOCUMENT_PICKUP',
  CHECKPOINT = 'CHECKPOINT',
  DELIVERY = 'DELIVERY',
  DOCUMENT_DROPOFF = 'DOCUMENT_DROPOFF',
  RETURN = 'RETURN',
}

export class CreateWaypointDto {
  @ApiProperty({ description: 'Job ID' })
  @IsString()
  jobId: string;

  @ApiProperty({ description: 'Route ID' })
  @IsString()
  routeId: string;

  @ApiProperty({ description: 'Waypoint name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Waypoint type', enum: WaypointType })
  @IsEnum(WaypointType)
  type: WaypointType;

  @ApiProperty({ description: 'Full address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  lat: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  lng: number;

  @ApiProperty({ description: 'Sequence order' })
  @IsInt()
  @Min(1)
  sequence: number;

  @ApiPropertyOptional({ description: 'Estimated arrival time' })
  @IsOptional()
  @IsDateString()
  estimatedArrival?: string;

  @ApiPropertyOptional({ description: 'Special instructions' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ description: 'Required documents/photos' })
  @IsOptional()
  requiredDocuments?: string[];
}
