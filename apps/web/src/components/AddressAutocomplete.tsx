'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Navigation } from 'lucide-react';

interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
}

interface AddressSuggestion {
  placeId: string;
  name: string;
  address: string;
  distance?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (result: PlaceResult) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Start typing an address...',
  required = false,
  className = '',
  label,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${apiUrl}/geocoding/autocomplete?query=${encodeURIComponent(searchQuery)}&country=lk`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data.data || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedIndex(-1);

    // Update parent with text only (no coordinates yet)
    onChange({ address: newQuery, lat: 0, lng: 0 });

    // Debounce API call
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newQuery);
    }, 300);
  };

  // Handle suggestion selection
  const handleSelect = async (suggestion: AddressSuggestion) => {
    setQuery(suggestion.address);
    setShowDropdown(false);
    setSuggestions([]);
    setIsLoading(true);

    try {
      // Fetch detailed place information with GPS coordinates
      const response = await fetch(`${apiUrl}/geocoding/place-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placeId: suggestion.placeId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch place details');
      }

      const data = await response.json();
      const details = data.data;

      onChange({
        address: details.address,
        lat: details.lat,
        lng: details.lng,
      });
    } catch (error) {
      console.error('Error fetching place details:', error);
      // Fallback to just the address
      onChange({ address: suggestion.address, lat: 0, lng: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="inline w-4 h-4 mr-1" />
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${className}`}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <MapPin className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown - Uber Style */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placeId}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Navigation className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.address}
                  </div>
                </div>
                {suggestion.distance && (
                  <div className="flex-shrink-0 text-xs text-gray-400 mt-1">
                    {suggestion.distance}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Helper Text */}
      {!showDropdown && !isLoading && query.length === 0 && (
        <p className="mt-1 text-sm text-gray-500">
          Start typing to search for addresses in Sri Lanka
        </p>
      )}

      {query.length > 0 && query.length < 2 && (
        <p className="mt-1 text-sm text-gray-500">
          Type at least 2 characters to search
        </p>
      )}
    </div>
  );
}
