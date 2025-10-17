import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class UpdateDriverDto {
  @ApiProperty({ description: 'Driver name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'License number', required: false })
  @IsOptional()
  @IsString()
  licenseNo?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Whether driver is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
