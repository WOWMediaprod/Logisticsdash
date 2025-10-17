import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateContainerDto {
  @ApiProperty({ description: 'ISO container number', required: false })
  @IsOptional()
  @IsString()
  iso?: string;

  @ApiProperty({ description: 'Container size', required: false })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty({ description: 'Container owner', required: false })
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiProperty({ description: 'Whether container is inspected and ready', required: false })
  @IsOptional()
  @IsBoolean()
  checkOk?: boolean;
}
