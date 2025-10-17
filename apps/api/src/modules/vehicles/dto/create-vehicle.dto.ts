import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsInt } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ description: 'Company ID' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Registration number' })
  @IsString()
  regNo: string;

  @ApiProperty({ description: 'Vehicle class (e.g., Truck, Van)' })
  @IsString()
  class: string;

  @ApiProperty({ description: 'Vehicle make', required: false })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiProperty({ description: 'Vehicle model', required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ description: 'Manufacturing year', required: false })
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiProperty({ description: 'Kilometers per liter', default: 8.0, required: false })
  @IsOptional()
  @IsNumber()
  kmpl?: number;

  @ApiProperty({ description: 'Lease cost per day', required: false })
  @IsOptional()
  @IsNumber()
  leasePerDay?: number;

  @ApiProperty({ description: 'Maintenance cost per kilometer', required: false })
  @IsOptional()
  @IsNumber()
  maintPerKm?: number;

  @ApiProperty({ description: 'Current odometer reading', default: 0, required: false })
  @IsOptional()
  @IsInt()
  currentOdo?: number;

  @ApiProperty({ description: 'Whether vehicle is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
