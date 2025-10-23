import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AutocompleteSuggestion, PlaceDetails } from './interfaces/geocoding.interface';

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
      // Using NEW Places API endpoint (POST request)
      const requestBody: any = {
        input: query,
        includedRegionCodes: [country.toUpperCase()],
        languageCode: 'en',
      };

      // Add location bias if coordinates provided
      if (latitude && longitude) {
        requestBody.locationBias = {
          circle: {
            center: {
              latitude,
              longitude,
            },
            radius: 50000, // 50km radius
          },
        };
      }

      const response = await axios.post(
        `https://places.googleapis.com/v1/places:autocomplete`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': 'suggestions.placePrediction.place,suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
          },
        }
      );

      if (!response.data.suggestions) {
        return [];
      }

      return response.data.suggestions
        .filter((suggestion: any) => suggestion.placePrediction)
        .map((suggestion: any) => {
          const prediction = suggestion.placePrediction;
          return {
            placeId: prediction.placeId || prediction.place,
            name: prediction.structuredFormat?.mainText?.text || prediction.text?.text || '',
            address: prediction.text?.text || '',
            distance: undefined, // New API doesn't provide distance in autocomplete
          };
        });
    } catch (error) {
      console.error('Autocomplete error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to fetch autocomplete suggestions');
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    if (!this.apiKey) {
      throw new BadRequestException('Google Maps API key not configured');
    }

    try {
      // Using NEW Places API endpoint for place details
      const response = await axios.get(
        `https://places.googleapis.com/v1/${placeId}`,
        {
          headers: {
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
          },
        }
      );

      if (!response.data) {
        throw new BadRequestException('Place not found');
      }

      const place = response.data;

      return {
        placeId: place.id || placeId,
        name: place.displayName?.text || '',
        address: place.formattedAddress || '',
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0,
      };
    } catch (error) {
      console.error('Place details error:', error.response?.data || error.message);
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
