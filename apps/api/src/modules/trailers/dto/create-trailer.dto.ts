import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

export class CreateTrailerDto {
  @ApiProperty({ description: 'Company ID' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Registration number' })
  @IsString()
  @IsNotEmpty()
  regNo: string;

  @ApiProperty({
    description: 'Trailer type',
    example: 'Flatbed',
    enum: ['Flatbed', 'Container Chassis', 'Lowbed', 'Refrigerated', 'Tanker', 'Curtainsider', 'Other']
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Trailer make', required: false })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiProperty({ description: 'Trailer model', required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ description: 'Year of manufacture', required: false })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiProperty({
    description: 'Capacity (e.g., "40ft", "20ft", "45000kg")',
    required: false
  })
  @IsOptional()
  @IsString()
  capacity?: string;

  @ApiProperty({ description: 'Number of axles', required: false })
  @IsOptional()
  @IsNumber()
  axles?: number;

  @ApiProperty({ description: 'Lease cost per day', required: false })
  @IsOptional()
  @IsNumber()
  leasePerDay?: number;

  @ApiProperty({ description: 'Maintenance cost per km', required: false })
  @IsOptional()
  @IsNumber()
  maintPerKm?: number;

  @ApiProperty({
    description: 'Whether the trailer is active',
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}