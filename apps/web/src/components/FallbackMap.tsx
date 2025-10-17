'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  status: string;
  speed: number;
}

interface FallbackMapProps {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

export default function FallbackMap({ markers, center = { lat: 19.0760, lng: 72.8777 }, zoom = 10 }: FallbackMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: string) => {
    const colors = {
      ASSIGNED: '#3B82F6',
      IN_TRANSIT: '#10B981',
      AT_PICKUP: '#F59E0B',
      LOADED: '#8B5CF6',
      AT_DELIVERY: '#F97316',
      DELIVERED: '#059669',
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  };

  if (!mapLoaded) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
          <p className="text-xs text-gray-500 mt-2">Demo mode - Add Google Maps API key for real maps</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg relative overflow-hidden border-2 border-gray-200">
      {/* Map Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-green-50 to-blue-100 opacity-40"></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="border border-gray-300"></div>
          ))}
        </div>
      </div>

      {/* Demo Map Label */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm">
        <p className="text-sm font-semibold text-gray-700">Live Vehicle Tracking</p>
        <p className="text-xs text-gray-500">Demo Mode - Mumbai Region</p>
      </div>

      {/* Vehicle Markers */}
      {markers.map((marker, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.2 }}
          className="absolute"
          style={{
            left: `${30 + (index * 25)}%`,
            top: `${40 + (index * 10)}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Vehicle Marker */}
          <div
            className="w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: getStatusColor(marker.status) }}
          >
            <div className="w-full h-full rounded-full animate-pulse opacity-30"
                 style={{ backgroundColor: getStatusColor(marker.status) }}></div>
          </div>

          {/* Speed Indicator */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-gray-800 shadow-md">
            {marker.speed} km/h
          </div>

          {/* Info Popup */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 min-w-40 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <h3 className="font-semibold text-sm text-gray-900">{marker.title}</h3>
            <p className="text-xs text-gray-600">Status: {marker.status}</p>
            <p className="text-xs text-gray-600">Speed: {marker.speed} km/h</p>
            <p className="text-xs text-gray-500">Lat: {marker.lat.toFixed(4)}</p>
            <p className="text-xs text-gray-500">Lng: {marker.lng.toFixed(4)}</p>
          </div>
        </motion.div>
      ))}

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        <button className="bg-white shadow-md rounded p-2 hover:bg-gray-50 transition-colors">
          <span className="text-gray-600 text-sm">+</span>
        </button>
        <button className="bg-white shadow-md rounded p-2 hover:bg-gray-50 transition-colors">
          <span className="text-gray-600 text-sm">-</span>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Vehicle Status</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-600">In Transit</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-gray-600">At Pickup</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-xs text-gray-600">Loaded</span>
          </div>
        </div>
      </div>

      {/* API Key Notice */}
      <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-2 max-w-64">
        <p className="text-xs text-yellow-800">
          <strong>Demo Mode:</strong> Add <code className="bg-yellow-200 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to .env.local for real Google Maps
        </p>
      </div>
    </div>
  );
}