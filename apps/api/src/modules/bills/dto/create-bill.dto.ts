import { IsString, IsNumber, IsOptional, IsEnum, IsUUID, IsArray, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BillStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export class CreateBillDto {
  @ApiProperty({ description: 'Job ID associated with this bill' })
  @IsString()
  jobId: string;

  @ApiProperty({ description: 'Bill amount' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'LKR' })
  @IsOptional()
  @IsString()
  currency?: string = 'LKR';

  @ApiPropertyOptional({ description: 'Bill status', enum: BillStatus, default: BillStatus.DRAFT })
  @IsOptional()
  @IsEnum(BillStatus)
  status?: BillStatus = BillStatus.DRAFT;

  @ApiPropertyOptional({ description: 'Date bill was issued' })
  @IsOptional()
  @IsDateString()
  issuedDate?: string;

  @ApiPropertyOptional({ description: 'Payment due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Array of document IDs attached to this bill' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachedDocumentIds?: string[];

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (e.g., CDN details)' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
