import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AutocompleteQueryDto {
  @ApiProperty({ description: 'Search query text' })
  @IsString()
  query: string;

  @ApiProperty({ description: 'Country code (e.g., "lk" for Sri Lanka)', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Latitude for location bias', required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude for location bias', required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class PlaceDetailsDto {
  @ApiProperty({ description: 'Google Place ID' })
  @IsString()
  placeId: string;
}
