import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface AutocompleteSuggestion {
  placeId: string;
  name: string;
  address: string;
  distance?: string;
}

interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

@Injectable()
export class GeocodingService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');

    if (!this.apiKey) {
      console.warn('⚠️  GOOGLE_MAPS_API_KEY not configured in environment variables');
    }
  }

  async autocomplete(
    query: string,
    country: string = 'lk',
    latitude?: number,
    longitude?: number,
  ): Promise<AutocompleteSuggestion[]> {
    if (!this.apiKey) {
      throw new BadRequestException('Google Maps API key not configured');
    }

    try {
      const params: any = {
        input: query,
        key: this.apiKey,
        components: `country:${country}`,
      };

      // Add location bias if coordinates provided
      if (latitude && longitude) {
        params.location = `${latitude},${longitude}`;
        params.radius = 50000; // 50km radius
      }

      const response = await axios.get(
        `${this.baseUrl}/place/autocomplete/json`,
        { params }
      );

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API error:', response.data);
        throw new BadRequestException(`Google Places API error: ${response.data.status}`);
      }

      if (response.data.status === 'ZERO_RESULTS') {
        return [];
      }

      return response.data.predictions.map((prediction: any) => ({
        placeId: prediction.place_id,
        name: prediction.structured_formatting?.main_text || prediction.description,
        address: prediction.description,
        distance: prediction.distance_meters
          ? `${(prediction.distance_meters / 1000).toFixed(1)} km`
          : undefined,
      }));
    } catch (error) {
      console.error('Autocomplete error:', error.message);
      throw new BadRequestException('Failed to fetch autocomplete suggestions');
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    if (!this.apiKey) {
      throw new BadRequestException('Google Maps API key not configured');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/place/details/json`,
        {
          params: {
            place_id: placeId,
            fields: 'place_id,name,formatted_address,geometry',
            key: this.apiKey,
          },
        }
      );

      if (response.data.status !== 'OK') {
        console.error('Google Place Details API error:', response.data);
        throw new BadRequestException(`Google Place Details API error: ${response.data.status}`);
      }

      const result = response.data.result;

      return {
        placeId: result.place_id,
        name: result.name,
        address: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      };
    } catch (error) {
      console.error('Place details error:', error.message);
      throw new BadRequestException('Failed to fetch place details');
    }
  }

  async geocode(address: string, country: string = 'lk'): Promise<PlaceDetails> {
    if (!this.apiKey) {
      throw new BadRequestException('Google Maps API key not configured');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/geocode/json`,
        {
          params: {
            address,
            components: `country:${country}`,
            key: this.apiKey,
          },
        }
      );

      if (response.data.status !== 'OK') {
        console.error('Google Geocoding API error:', response.data);
        throw new BadRequestException(`Address not found: ${response.data.status}`);
      }

      const result = response.data.results[0];

      return {
        placeId: result.place_id,
        name: result.address_components[0]?.long_name || address,
        address: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      };
    } catch (error) {
      console.error('Geocoding error:', error.message);
      throw new BadRequestException('Failed to geocode address');
    }
  }
}
