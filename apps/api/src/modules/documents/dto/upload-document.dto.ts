import { IsString, IsOptional, IsEnum, IsBoolean, Matches } from 'class-validator';
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
  @Matches(/^c[a-z0-9]{23,24}$/, { message: 'jobId must be a valid CUID' })
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

  @ApiPropertyOptional({ description: 'Additional metadata (JSON object or string)' })
  @IsOptional()
  @Transform(({ value }) => {
    // If it's already an object, return as-is
    if (typeof value === 'object' && value !== null) {
      return value;
    }
    // If it's a string, try to parse it as JSON
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        // If parsing fails, return empty object
        return {};
      }
    }
    return value;
  })
  metadata?: Record<string, any>;
}