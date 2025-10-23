'use client';

/// <reference types="google.maps" />

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const autocompleteWidgetRef = useRef<any>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured');
      setIsLoading(false);
      return;
    }

    const initAutocomplete = async () => {
      try {
        if (!containerRef.current) return;

        // Load the Google Maps script dynamically
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=Function.prototype`;
        script.async = true;
        script.defer = true;

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          if (!document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"]`)) {
            document.head.appendChild(script);
          } else {
            resolve(null);
          }
        });

        // Wait for google object to be available
        if (typeof google === 'undefined') {
          throw new Error('Google Maps not loaded');
        }

        // Use the NEW PlaceAutocompleteElement (required for new customers as of March 2025)
        const { PlaceAutocompleteElement } = await google.maps.importLibrary('places') as any;

        // Create the autocomplete widget with options
        const autocomplete = new PlaceAutocompleteElement({
          componentRestrictions: { country: ['lk'] }, // Restrict to Sri Lanka
        });

        autocompleteWidgetRef.current = autocomplete;

        // Add to DOM
        containerRef.current.appendChild(autocomplete);

        // Listen for place selection
        autocomplete.addEventListener('gmp-placeselect', async (event: any) => {
          const place = event.place;

          // Fetch additional place details
          await place.fetchFields({
            fields: ['displayName', 'formattedAddress', 'location'],
          });

          if (!place.location) {
            setError('Please select a valid address from the dropdown');
            return;
          }

          const lat = place.location.lat();
          const lng = place.location.lng();
          const address = place.formattedAddress || place.displayName || '';

          // Call onChange with the full place result
          onChange({
            address,
            lat,
            lng,
          });

          setError(null);
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load Google Maps:', err);
        setError('Failed to load address autocomplete');
        setIsLoading(false);
      }
    };

    initAutocomplete();

    // Cleanup
    return () => {
      if (autocompleteWidgetRef.current && containerRef.current) {
        containerRef.current.innerHTML = '';
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

      {isLoading && (
        <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="text-gray-500">Loading address search...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div>
          {/* Google PlaceAutocompleteElement will be inserted here */}
          <div
            ref={containerRef}
            className={`google-places-autocomplete ${className}`}
            style={{
              width: '100%',
            }}
          />
          <p className="mt-1 text-sm text-gray-500">
            Start typing to search for addresses in Sri Lanka
          </p>
        </div>
      )}
    </div>
  );
}
