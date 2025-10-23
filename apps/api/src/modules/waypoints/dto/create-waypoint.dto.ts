import { IsString, IsNumber, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WaypointType } from '@prisma/client';

export class CreateWaypointDto {
  @ApiProperty({ description: 'Job ID' })
  @IsString()
  jobId: string;

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

  @ApiPropertyOptional({ description: 'Geofence radius in meters', default: 150 })
  @IsOptional()
  @IsInt()
  radiusM?: number;
}
