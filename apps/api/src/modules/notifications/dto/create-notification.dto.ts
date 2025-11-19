import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Company ID' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Recipient user/driver/client ID' })
  @IsString()
  recipientId: string;

  @ApiProperty({ description: 'Recipient type (USER, DRIVER, CLIENT)', default: 'USER' })
  @IsOptional()
  @IsString()
  recipientType?: string = 'USER';

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Action URL (optional)', required: false })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiProperty({ description: 'Related job ID (optional)', required: false })
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiProperty({ description: 'Related job update ID (optional)', required: false })
  @IsOptional()
  @IsString()
  jobUpdateId?: string;

  @ApiProperty({ description: 'Notification channels (app, email, sms)', required: false })
  @IsOptional()
  @IsObject()
  channels?: {
    app?: boolean;
    email?: boolean;
    sms?: boolean;
  };

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
