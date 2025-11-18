import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Company name', example: 'Acme Logistics' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'User ID who is creating/linking this company', required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: 'Set as default company for the user', default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ description: 'User role in this company', default: 'ADMIN', required: false })
  @IsString()
  @IsOptional()
  role?: string;
}
