'use client';

import { useEffect, useRef, useState } from 'react';
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
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured');
      setIsLoading(false);
      return;
    }

    const loadGoogleMapsScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if already loaded
        if (window.google && window.google.maps) {
          resolve();
          return;
        }

        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve());
          existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
          return;
        }

        // Create and load script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps'));
        document.head.appendChild(script);
      });
    };

    const initAutocomplete = async () => {
      try {
        // Load Google Maps
        await loadGoogleMapsScript();

        // Wait a bit for google object to be fully available
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!window.google || !window.google.maps || !window.google.maps.places) {
          throw new Error('Google Maps Places library not available');
        }

        if (!inputRef.current) {
          throw new Error('Input ref not available');
        }

        // Create autocomplete using the legacy API (but with new options format)
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'lk' },
          fields: ['formatted_address', 'geometry', 'name'],
          types: ['address'],
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

          onChange({
            address,
            lat,
            lng,
          });

          setError(null);
        });

        setIsLoading(false);
        setError(null);
      } catch (err: any) {
        console.error('Failed to initialize autocomplete:', err);
        setError(err.message || 'Failed to load address search');
        setIsLoading(false);
      }
    };

    initAutocomplete();

    // Cleanup
    return () => {
      if (autocompleteRef.current && window.google && window.google.maps) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
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
            // Allow typing but don't update coordinates until place is selected
            onChange({ address: e.target.value, lat: 0, lng: 0 });
          }}
          placeholder={isLoading ? 'Loading...' : error || placeholder}
          required={required}
          disabled={isLoading}
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
