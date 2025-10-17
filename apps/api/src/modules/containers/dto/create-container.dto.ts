import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateContainerDto {
  @ApiProperty({ description: 'Company ID' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'ISO container number' })
  @IsString()
  iso: string;

  @ApiProperty({ description: 'Container size (e.g., 20ft, 40ft)' })
  @IsString()
  size: string;

  @ApiProperty({ description: 'Container owner', required: false })
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiProperty({ description: 'Whether container is inspected and ready', default: false })
  @IsOptional()
  @IsBoolean()
  checkOk?: boolean;
}
