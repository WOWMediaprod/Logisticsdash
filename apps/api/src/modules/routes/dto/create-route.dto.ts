import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateRouteDto {
  @ApiProperty({ description: 'Company ID' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Route code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Origin location' })
  @IsString()
  origin: string;

  @ApiProperty({ description: 'Destination location' })
  @IsString()
  destination: string;

  @ApiProperty({ description: 'Distance in kilometers' })
  @IsNumber()
  kmEstimate: number;

  @ApiProperty({ description: 'Client ID (optional, leave empty for general route)', required: false })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: 'Whether route is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
