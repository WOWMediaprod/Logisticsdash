import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ description: 'Company ID' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Client name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Client code for portal access', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: 'Payment terms', required: false })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiProperty({ description: 'Whether client is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
