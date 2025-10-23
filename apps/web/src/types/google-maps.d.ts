/// <reference types="google.maps" />

// This file ensures Google Maps types are available throughout the application
declare global {
  interface Window {
    google: typeof google;
  }
}

export {};
