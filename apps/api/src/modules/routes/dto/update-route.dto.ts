import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class UpdateRouteDto {
  @ApiProperty({ description: 'Route code', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: 'Origin location', required: false })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiProperty({ description: 'Destination location', required: false })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiProperty({ description: 'Distance in kilometers', required: false })
  @IsOptional()
  @IsNumber()
  kmEstimate?: number;

  @ApiProperty({ description: 'Client ID', required: false })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: 'Whether route is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
