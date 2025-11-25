import { IsString, IsOptional, IsEnum, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocumentType {
  BOL = 'BOL',
  INVOICE = 'INVOICE',
  DELIVERY_NOTE = 'DELIVERY_NOTE',
  GATE_PASS = 'GATE_PASS',
  CUSTOMS = 'CUSTOMS',
  INSURANCE = 'INSURANCE',
  PHOTO = 'PHOTO',
  SIGNATURE = 'SIGNATURE',
  RELEASE_ORDER = 'RELEASE_ORDER',
  CDN = 'CDN',
  LOADING_PASS = 'LOADING_PASS',
  FCL_DOCUMENT = 'FCL_DOCUMENT',
  OTHER = 'OTHER',
}

export class CreateDocumentDto {
  @ApiProperty({ enum: DocumentType, description: 'Type of document' })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({ description: 'Original file name' })
  @IsString()
  fileName: string;

  @ApiPropertyOptional({ description: 'Job ID to associate with document' })
  @IsOptional()
  @Matches(/^c[a-z0-9]{23,24}$/, { message: 'jobId must be a valid CUID' })
  jobId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}