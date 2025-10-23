import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GeocodingService } from './geocoding.service';
import { AutocompleteQueryDto, PlaceDetailsDto } from './dto/autocomplete-query.dto';
import { AutocompleteSuggestion, PlaceDetails } from './interfaces/geocoding.interface';

@ApiTags('Geocoding')
@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Get('autocomplete')
  @ApiOperation({ summary: 'Get address autocomplete suggestions' })
  @ApiResponse({ status: 200, description: 'Autocomplete suggestions returned successfully' })
  async autocomplete(@Query() query: AutocompleteQueryDto) {
    const suggestions = await this.geocodingService.autocomplete(
      query.query,
      query.country || 'lk',
      query.latitude,
      query.longitude,
    );

    return {
      success: true,
      data: suggestions,
    };
  }

  @Post('place-details')
  @ApiOperation({ summary: 'Get detailed place information including GPS coordinates' })
  @ApiResponse({ status: 200, description: 'Place details returned successfully' })
  async getPlaceDetails(@Body() body: PlaceDetailsDto) {
    const details = await this.geocodingService.getPlaceDetails(body.placeId);

    return {
      success: true,
      data: details,
    };
  }

  @Get('geocode')
  @ApiOperation({ summary: 'Geocode an address to get GPS coordinates' })
  @ApiResponse({ status: 200, description: 'Address geocoded successfully' })
  async geocode(@Query('address') address: string, @Query('country') country?: string) {
    const result = await this.geocodingService.geocode(address, country || 'lk');

    return {
      success: true,
      data: result,
    };
  }
}
