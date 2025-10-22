'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Loader2, MapPin } from 'lucide-react';

interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (result: PlaceResult) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
}

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = 'Start typing an address...',
  required = false,
  className = '',
  label,
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured');
      setIsLoading(false);
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    loader
      .load()
      .then(() => {
        if (!inputRef.current) return;

        // Initialize autocomplete with Sri Lanka restriction
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'lk' }, // Restrict to Sri Lanka
          fields: ['formatted_address', 'geometry', 'name'],
          types: ['geocode', 'establishment'], // Allow both addresses and places
        });

        autocompleteRef.current = autocomplete;

        // Listen for place selection
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();

          if (!place.geometry || !place.geometry.location) {
            setError('Please select a valid address from the dropdown');
            return;
          }

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || place.name || '';

          // Call onChange with the full place result
          onChange({
            address,
            lat,
            lng,
          });

          setError(null);
        });

        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err);
        setError('Failed to load address autocomplete');
        setIsLoading(false);
      });

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange]);

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="inline w-4 h-4 mr-1" />
          {label} {required && '*'}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            // Update the value immediately for typing experience
            onChange({ address: e.target.value, lat: 0, lng: 0 });
          }}
          placeholder={isLoading ? 'Loading...' : placeholder}
          required={required}
          disabled={isLoading || !!error}
          className={`w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        )}

        {!isLoading && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <MapPin className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {!error && !isLoading && (
        <p className="mt-1 text-sm text-gray-500">
          Start typing to search for addresses in Sri Lanka
        </p>
      )}
    </div>
  );
}
