import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from './create-document.dto';
import { Transform } from 'class-transformer';

export class UploadDocumentDto {
  @ApiProperty({ enum: DocumentType, description: 'Type of document' })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiPropertyOptional({ description: 'Job ID to associate with document' })
  @IsOptional()
  @Transform(({ value }) => value?.trim()) // Trim whitespace before validation
  @IsUUID()
  jobId?: string;

  @ApiPropertyOptional({ description: 'Whether this is an original document (true) or a copy (false)', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isOriginal?: boolean = true;

  @ApiPropertyOptional({ description: 'Enable OCR processing for this document' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  enableOcr?: boolean = true;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}