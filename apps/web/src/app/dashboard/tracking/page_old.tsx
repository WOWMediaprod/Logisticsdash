'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader } from '@googlemaps/js-api-loader';
import Link from 'next/link';

const COMPANY_ID = 'cmfmbojit0000vj0ch078cnbu';

interface TrackingJob {
  jobId: string;
  status: string;
  client: {
    name: string;
    code: string;
  };
  route: {
    origin: string;
    destination: string;
    kmEstimate: number;
  };
  driver: {
    name: string;
    phone: string;
  };
  vehicle: {
    regNo: string;
    make: string;
    model: string;
  };
  lastLocation: {
    lat: number;
    lng: number;
    timestamp: string;
    speed: number;
    timeSinceUpdate: number;
    isStale: boolean;
  } | null;
}

interface TrackingResponse {
  success: boolean;
  data: TrackingJob[];
  summary: {
    totalJobs: number;
    withLocation: number;
    staleLocations: number;
  };
}

const statusColors = {
  CREATED: 'bg-gray-100 text-gray-800 border-gray-200',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_TRANSIT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  AT_PICKUP: 'bg-purple-100 text-purple-800 border-purple-200',
  LOADED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  AT_DELIVERY: 'bg-orange-100 text-orange-800 border-orange-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

const priorityColors = {
  LOW: 'bg-gray-50 text-gray-600',
  NORMAL: 'bg-blue-50 text-blue-600',
  HIGH: 'bg-orange-50 text-orange-600',
  URGENT: 'bg-red-50 text-red-600',
};

const jobTypeIcons = {
  ONE_WAY: '→',
  ROUND_TRIP: '↔',
  MULTI_STOP: '⚡',
};

export default function TrackingPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [trackingData, setTrackingData] = useState<TrackingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedJob, setSelectedJob] = useState<TrackingJob | null>(null);
  const [summary, setSummary] = useState<any>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        const rawApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        const trimmedApiKey = rawApiKey?.trim();
        const apiKey = trimmedApiKey ? trimmedApiKey.replace(/\+/g, '%2B') : 'DEMO_KEY';

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['maps']
        });

        await loader.load();

        if (!mapRef.current) return;

        // Initialize map centered on Mumbai, India
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 19.0760, lng: 72.8777 },
          zoom: 10,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        // For demo purposes, set mapLoaded to true even if API key is missing
        setMapLoaded(true);
      }
    };

    initMap();
  }, []);

  // Fetch tracking data
  useEffect(() => {
    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Update map markers when tracking data changes
  useEffect(() => {
    if (mapLoaded && trackingData.length > 0) {
      updateMapMarkers();
    }
  }, [mapLoaded, trackingData]);

  const fetchTrackingData = async () => {
    try {
      const response = await fetch(`/api/v1/tracking/active/${COMPANY_ID}`);
      const data: TrackingResponse = await response.json();

      if (data.success) {
        setTrackingData(data.data);
        setSummary(data.summary);

        // Select first job if none selected
        if (data.data.length > 0 && !selectedJob) {
          setSelectedJob(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tracking data:', error);
      // For demo purposes, set mock data
      const mockData = [
        {
          jobId: 'job-001',
          status: 'IN_TRANSIT',
          client: { name: 'ABC Corp', code: 'ABC' },
          route: { origin: 'Mumbai Port', destination: 'Delhi Warehouse', kmEstimate: 1450 },
          driver: { name: 'Raj Kumar', phone: '+91-9876543210' },
          vehicle: { regNo: 'MH-01-AB-1234', make: 'Tata', model: 'Prima' },
          lastLocation: {
            lat: 19.0760,
            lng: 72.8777,
            timestamp: new Date().toISOString(),
            speed: 65,
            timeSinceUpdate: 2,
            isStale: false
          }
        },
        {
          jobId: 'job-002',
          status: 'AT_PICKUP',
          client: { name: 'XYZ Ltd', code: 'XYZ' },
          route: { origin: 'Pune Factory', destination: 'Bangalore Hub', kmEstimate: 850 },
          driver: { name: 'Suresh Patil', phone: '+91-9876543211' },
          vehicle: { regNo: 'MH-12-CD-5678', make: 'Ashok Leyland', model: 'Dost' },
          lastLocation: {
            lat: 18.5204,
            lng: 73.8567,
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            speed: 0,
            timeSinceUpdate: 10,
            isStale: false
          }
        }
      ];
      setTrackingData(mockData);
      setSummary({ totalJobs: 2, withLocation: 2, staleLocations: 0 });
      if (!selectedJob) setSelectedJob(mockData[0]);
    } finally {
      setLoading(false);
    }
  };

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add markers for each job with location
    trackingData.forEach(job => {
      if (!job.lastLocation) return;

      const marker = new google.maps.Marker({
        position: {
          lat: job.lastLocation.lat,
          lng: job.lastLocation.lng
        },
        map: mapInstanceRef.current,
        title: `${job.driver.name} - ${job.vehicle.regNo}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: getStatusColor(job.status),
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-3">
            <h3 class="font-semibold text-gray-900">${job.driver.name}</h3>
            <p class="text-sm text-gray-600">${job.vehicle.regNo}</p>
            <p class="text-sm text-gray-600">${job.client.name}</p>
            <p class="text-xs text-gray-500">Speed: ${job.lastLocation.speed} km/h</p>
            <p class="text-xs text-gray-500">Updated: ${job.lastLocation.timeSinceUpdate} min ago</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        setSelectedJob(job);
      });

      markersRef.current.push(marker);
    });

    // Auto-fit map to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getPosition()!);
      });
      mapInstanceRef.current!.fitBounds(bounds);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      ASSIGNED: '#3B82F6',
      IN_TRANSIT: '#10B981',
      AT_PICKUP: '#F59E0B',
      LOADED: '#8B5CF6',
      AT_DELIVERY: '#F97316',
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const MapPlaceholder = ({ job }: { job: TrackingJob }) => {
    const lastLocation = job.lastLocation;

    return (
      <div className="h-96 bg-gradient-to-br from-blue-100 to-green-100 rounded-2xl flex items-center justify-center relative overflow-hidden">
        <div className="text-center z-10">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Route Visualization</h3>
          {job.route && (
            <div className="flex items-center justify-center space-x-4 text-gray-600">
              <span className="font-medium">{job.route.origin}</span>
              <span className="text-2xl">→</span>
              <span className="font-medium">{job.route.destination}</span>
            </div>
          )}
          {lastLocation && (
            <p className="text-sm text-gray-500 mt-2">
              Last update: {formatDateTime(lastLocation.timestamp)}
            </p>
          )}
          <p className="text-sm text-gray-400 mt-4">
            Mapbox integration coming soon
          </p>
        </div>

        {/* Decorative route line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-yellow-400 to-green-400 opacity-30"></div>

        {/* Mock location pins */}
        <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-blue-500 rounded-full shadow-lg animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-green-500 rounded-full shadow-lg animate-pulse"></div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading Live Tracking...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
              <p className="text-gray-600 mt-1">Real-time location monitoring for active jobs</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchTrackingData}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all"
              >
                🔄 Refresh
              </button>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">📍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Shipments</h3>
            <p className="text-gray-600 mb-4">All jobs are either completed or cancelled.</p>
            <Link
              href="/dashboard/create"
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all"
            >
              Create New Job
            </Link>
          </motion.div>
        ) : (
          <div className={`grid ${viewMode === 'map' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-8`}>
            {/* Jobs List */}
            <div className={`space-y-4 ${viewMode === 'map' ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Active Jobs ({jobs.length})
                </h2>
                <button
                  onClick={fetchTrackingJobs}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  🔄 Refresh
                </button>
              </div>

              {jobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedJob(job)}
                  className={`glass p-6 rounded-2xl cursor-pointer transition-all ${
                    selectedJob?.id === job.id
                      ? 'ring-2 ring-blue-500 ring-opacity-50'
                      : 'hover:shadow-lg'
                  }`}
                >
                  {/* Status & Priority */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`px-3 py-1 rounded-lg text-sm font-semibold border ${statusColors[job.status] || statusColors.CREATED}`}>
                        {job.status.replace('_', ' ')}
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${priorityColors[job.priority] || priorityColors.NORMAL}`}>
                        {job.priority}
                      </div>
                    </div>
                    <div className="text-2xl">{jobTypeIcons[job.jobType] || '→'}</div>
                  </div>

                  {/* Client & Route */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {job.client?.name || 'No Client'}
                    </h3>
                    {job.route && (
                      <div className="flex items-center text-gray-600 text-sm space-x-2">
                        <span className="font-medium">{job.route.origin}</span>
                        <span>→</span>
                        <span className="font-medium">{job.route.destination}</span>
                        <span className="text-gray-400">({job.route.kmEstimate} km)</span>
                      </div>
                    )}
                  </div>

                  {/* Driver & Vehicle */}
                  {(job.driver || job.vehicle) && (
                    <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-xl">
                      {job.driver && (
                        <div>
                          <p className="font-semibold text-gray-900">{job.driver.name}</p>
                          <p className="text-sm text-gray-600">{job.driver.phone}</p>
                        </div>
                      )}
                      {job.vehicle && (
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{job.vehicle.regNo}</p>
                          <p className="text-sm text-gray-600">{job.vehicle.make} {job.vehicle.model}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Schedule */}
                  <div className="flex items-center justify-between text-sm">
                    {job.pickupTs && (
                      <div>
                        <span className="text-gray-500">Pickup:</span>
                        <span className="font-semibold text-gray-900 ml-1">{formatDateTime(job.pickupTs)}</span>
                      </div>
                    )}
                    {job.etaTs && (
                      <div>
                        <span className="text-gray-500">ETA:</span>
                        <span className="font-semibold text-gray-900 ml-1">{formatDateTime(job.etaTs)}</span>
                      </div>
                    )}
                  </div>

                  {/* Last Update */}
                  {job.statusEvents && job.statusEvents.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Last Update:</span>
                        <span className="text-gray-600">
                          {formatDateTime(job.statusEvents[0].timestamp)}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Map View */}
            {viewMode === 'map' && (
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass p-6 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedJob ? `Route: ${selectedJob.client?.name}` : 'Select a Job'}
                    </h2>
                    {selectedJob && (
                      <Link
                        href={`/dashboard/jobs/${selectedJob.id}`}
                        className="text-blue-600 hover:text-blue-700 transition-colors text-sm"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>

                  {selectedJob ? (
                    <div className="space-y-6">
                      <MapPlaceholder job={selectedJob} />

                      {/* Status Events Timeline */}
                      {selectedJob.statusEvents && selectedJob.statusEvents.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-4">Recent Updates</h3>
                          <div className="space-y-3 max-h-48 overflow-y-auto">
                            {selectedJob.statusEvents.slice(0, 5).map((event, index) => (
                              <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-900">{event.code}</span>
                                    <span className="text-sm text-gray-500">{formatDateTime(event.timestamp)}</span>
                                  </div>
                                  {event.note && (
                                    <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                                  )}
                                  {event.lat && event.lng && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      📍 {event.lat.toFixed(4)}, {event.lng.toFixed(4)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-96 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <div className="text-6xl mb-4">👈</div>
                        <p>Select a job from the list to view tracking details</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}