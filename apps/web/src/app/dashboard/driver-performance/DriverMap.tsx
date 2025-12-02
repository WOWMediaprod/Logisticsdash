"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DriverPerformance } from "../../../types/driver-performance";

interface DriverMapProps {
  drivers: DriverPerformance[];
}

// Create custom marker icons
const createMarkerIcon = (isOnline: boolean) => {
  const color = isOnline ? "#22c55e" : "#94a3b8";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 24 16 24s16-12 16-24C32 7.164 24.836 0 16 0z" fill="${color}"/>
      <circle cx="16" cy="14" r="8" fill="white"/>
      <circle cx="16" cy="14" r="5" fill="${color}"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: "custom-marker",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

export default function DriverMap({ drivers }: DriverMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter drivers with valid locations
  const driversWithLocation = drivers.filter(
    (d) => d.lastLocation?.lat && d.lastLocation?.lng
  );

  // Calculate map center based on driver locations
  const getMapCenter = (): [number, number] => {
    if (driversWithLocation.length === 0) {
      // Default to Sri Lanka center if no drivers have locations
      return [7.8731, 80.7718];
    }

    const avgLat =
      driversWithLocation.reduce((sum, d) => sum + (d.lastLocation?.lat || 0), 0) /
      driversWithLocation.length;
    const avgLng =
      driversWithLocation.reduce((sum, d) => sum + (d.lastLocation?.lng || 0), 0) /
      driversWithLocation.length;

    return [avgLat, avgLng];
  };

  const formatLastUpdate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown";
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  if (!isMounted) {
    return (
      <div className="h-full bg-slate-100 flex items-center justify-center">
        <div className="text-slate-400">Loading map...</div>
      </div>
    );
  }

  if (driversWithLocation.length === 0) {
    return (
      <div className="h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400">
        <svg
          className="w-12 h-12 mb-3 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="font-medium">No driver locations available</p>
        <p className="text-sm mt-1">Drivers will appear here when they share their location</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={getMapCenter()}
      zoom={8}
      style={{ height: "100%", width: "100%" }}
      className="rounded-b-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {driversWithLocation.map((driver) => (
        <Marker
          key={driver.id}
          position={[driver.lastLocation!.lat, driver.lastLocation!.lng]}
          icon={createMarkerIcon(driver.isOnline)}
        >
          <Popup>
            <div className="min-w-[200px]">
              <div className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                {driver.name}
                {driver.isOnline ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                    Online
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500">
                    Offline
                  </span>
                )}
              </div>

              {driver.phone && (
                <div className="text-sm text-slate-600 mb-1">
                  <span className="text-slate-400">Phone:</span> {driver.phone}
                </div>
              )}

              <div className="text-sm text-slate-600 mb-1">
                <span className="text-slate-400">Jobs:</span>{" "}
                {driver.stats.completedJobs}/{driver.stats.totalJobs} completed
              </div>

              <div className="text-sm text-slate-600 mb-1">
                <span className="text-slate-400">Completion:</span>{" "}
                <span
                  className={
                    driver.stats.completionRate >= 85
                      ? "text-green-600"
                      : driver.stats.completionRate >= 70
                      ? "text-yellow-600"
                      : "text-red-600"
                  }
                >
                  {driver.stats.completionRate}%
                </span>
              </div>

              <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">
                Last update: {formatLastUpdate(driver.lastLocation?.updatedAt || null)}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
