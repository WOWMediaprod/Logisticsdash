import { IsString, IsNotEmpty, Length, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DriverLoginDto {
  @ApiProperty({
    description: 'Company ID',
    example: 'cmfmbojit0000vj0ch078cnbu',
  })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({
    description: 'Driver license number',
    example: 'DL123456',
  })
  @IsString()
  @IsNotEmpty()
  licenseNo: string;

  @ApiProperty({
    description: 'Driver 6-digit PIN',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'PIN must be exactly 6 digits' })
  pin: string;

  @ApiProperty({
    description: 'Device ID for tracking',
    example: 'device-12345',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiProperty({
    description: 'Device information',
    example: {
      platform: 'iOS',
      version: '15.0',
      model: 'iPhone 12',
      browser: 'Safari',
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  deviceInfo?: any;
}