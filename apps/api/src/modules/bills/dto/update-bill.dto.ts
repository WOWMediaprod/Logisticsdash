import { PartialType } from '@nestjs/swagger';
import { CreateBillDto } from './create-bill.dto';
import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBillDto extends PartialType(CreateBillDto) {
  @ApiPropertyOptional({ description: 'Date bill was paid' })
  @IsOptional()
  @IsDateString()
  paidDate?: string;
}
