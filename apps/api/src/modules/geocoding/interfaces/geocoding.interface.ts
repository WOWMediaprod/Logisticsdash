export interface AutocompleteSuggestion {
  placeId: string;
  name: string;
  address: string;
  distance?: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}
