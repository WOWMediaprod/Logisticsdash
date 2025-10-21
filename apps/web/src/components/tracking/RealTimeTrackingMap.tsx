'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User,
  Truck,
  Navigation,
  Battery,
  Wifi,
  MapPin,
  Clock,
  Package,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import io, { Socket } from 'socket.io-client';

interface ActiveDriver {
  driverId: string;
  name: string;
  phone: string;
  isOnline: boolean;
  location: {
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    lastUpdate: string;
    isStale: boolean;
  };
  currentJob?: {
    id: string;
    status: string;
    client: { name: string };
    route: {
      origin: string;
      destination: string;
      kmEstimate: number;
    };
  };
  stats?: {
    totalDistance: number;
    totalDuration: number;
    averageSpeed: number;
    isMoving: boolean;
  };
}

interface JobTracking {
  job: {
    id: string;
    status: string;
    client: any;
    route: any;
    vehicle: any;
  };
  driver: {
    id: string;
    name: string;
    phone: string;
    isOnline: boolean;
  };
  currentLocation: {
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    lastUpdate: string;
    isMoving: boolean;
  };
  stats: {
    totalDistance: number;
    totalDuration: number;
    averageSpeed: number;
    maxSpeed: number;
  };
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

const defaultCenter = {
  lat: 6.927079,
  lng: 79.861244, // Colombo, Sri Lanka
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

export default function RealTimeTrackingMap({ companyId }: { companyId: string }) {
  const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<ActiveDriver | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobTracking | null>(null);
  const [showDriverList, setShowDriverList] = useState(true);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(12);

  const socketRef = useRef<Socket | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    fetchActiveDrivers();
    connectWebSocket();

    const interval = isAutoRefresh ? setInterval(fetchActiveDrivers, 30000) : null;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [companyId, isAutoRefresh]);

  const fetchActiveDrivers = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tracking-v2/active-drivers/${companyId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setActiveDrivers(data);
      }
    } catch (error) {
      console.error('Error fetching active drivers:', error);
    }
  };

  const fetchJobTracking = async (jobId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tracking-v2/job/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedJob(data);

        // Center map on driver location
        if (data.currentLocation) {
          setMapCenter({
            lat: data.currentLocation.lat,
            lng: data.currentLocation.lng,
          });
          setMapZoom(15);
        }
      }
    } catch (error) {
      console.error('Error fetching job tracking:', error);
    }
  };

  const connectWebSocket = () => {
    socketRef.current = io(`${process.env.NEXT_PUBLIC_API_URL}`, {
      auth: {
        token: localStorage.getItem('accessToken'),
      },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to tracking server');

      // Join company room for updates
      socketRef.current?.emit('join_company_room', { companyId });
    });

    socketRef.current.on('driver_location_update', (data) => {
      console.log('Received driver location update:', data);

      // Update driver in list
      setActiveDrivers((prev) => {
        const updated = [...prev];
        const index = updated.findIndex((d) => d.driverId === data.driverId);

        if (index >= 0) {
          updated[index] = {
            ...updated[index],
            location: {
              lat: data.lat,
              lng: data.lng,
              speed: data.speed,
              heading: data.heading,
              lastUpdate: new Date().toISOString(),
              isStale: false,
            },
            stats: data.trackingState ? {
              totalDistance: data.trackingState.totalDistance,
              totalDuration: data.trackingState.totalDuration,
              averageSpeed: data.trackingState.averageSpeed,
              isMoving: data.isMoving,
            } : updated[index].stats,
          };
        }

        return updated;
      });

      // Update selected job if it matches
      if (selectedJob && selectedJob.driver.id === data.driverId) {
        setSelectedJob((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            currentLocation: {
              lat: data.lat,
              lng: data.lng,
              speed: data.speed,
              heading: data.heading,
              lastUpdate: new Date().toISOString(),
              isMoving: data.isMoving,
            },
            stats: data.trackingState ? {
              totalDistance: data.trackingState.totalDistance,
              totalDuration: data.trackingState.totalDuration,
              averageSpeed: data.trackingState.averageSpeed,
              maxSpeed: data.trackingState.maxSpeed,
            } : prev.stats,
          };
        });
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from tracking server');
    });
  };

  const handleDriverClick = (driver: ActiveDriver) => {
    setSelectedDriver(driver);

    if (driver.currentJob) {
      fetchJobTracking(driver.currentJob.id);
    }

    // Center map on driver
    if (driver.location) {
      setMapCenter({
        lat: driver.location.lat,
        lng: driver.location.lng,
      });
      setMapZoom(15);
    }
  };

  const getDriverIcon = (driver: ActiveDriver) => {
    const isMoving = driver.stats?.isMoving || driver.location?.speed > 5;
    const isStale = driver.location?.isStale;

    return {
      url: isMoving
        ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiMzQjgyRjYiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMyIvPgo8cGF0aCBkPSJNMjAgMTBMMjYgMjRIMTRMMjAgMTBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4='
        : isStale
        ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiM5Q0EzQUYiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMyIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI2IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4='
        : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiMxMEI5ODEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMyIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI2IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 20),
    };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={showDriverList ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowDriverList(!showDriverList)}
          >
            {showDriverList ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            Driver List
          </Button>
          <Button
            variant={isAutoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isAutoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">{activeDrivers.filter(d => d.isOnline).length} Online</Badge>
          <Badge variant="secondary">{activeDrivers.filter(d => d.stats?.isMoving).length} Moving</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <div className={showDriverList ? 'lg:col-span-3' : 'lg:col-span-4'}>
          <Card>
            <CardContent className="p-0">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={mapZoom}
                options={mapOptions}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
              >
                {/* Driver Markers */}
                {activeDrivers.map((driver) => {
                  if (!driver.location) return null;

                  return (
                    <Marker
                      key={driver.driverId}
                      position={{ lat: driver.location.lat, lng: driver.location.lng }}
                      icon={getDriverIcon(driver)}
                      onClick={() => handleDriverClick(driver)}
                    />
                  );
                })}

                {/* Selected Driver Info Window */}
                {selectedDriver && selectedDriver.location && (
                  <InfoWindow
                    position={{ lat: selectedDriver.location.lat, lng: selectedDriver.location.lng }}
                    onCloseClick={() => setSelectedDriver(null)}
                  >
                    <div className="p-2 min-w-[200px]">
                      <p className="font-semibold">{selectedDriver.name}</p>
                      <p className="text-sm text-gray-600">{selectedDriver.phone}</p>
                      {selectedDriver.currentJob && (
                        <div className="mt-2 text-sm">
                          <p className="font-medium">Current Job:</p>
                          <p className="text-gray-600">{selectedDriver.currentJob.client.name}</p>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        <p>Speed: {selectedDriver.location.speed.toFixed(0)} km/h</p>
                        <p>Updated: {formatTime(selectedDriver.location.lastUpdate)}</p>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </CardContent>
          </Card>
        </div>

        {/* Driver List */}
        {showDriverList && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Active Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[550px]">
                  <div className="space-y-3">
                    {activeDrivers.map((driver) => (
                      <Card
                        key={driver.driverId}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          selectedDriver?.driverId === driver.driverId ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleDriverClick(driver)}
                      >
                        <CardContent className="p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-600" />
                              <div>
                                <p className="font-medium text-sm">{driver.name}</p>
                                <p className="text-xs text-gray-500">{driver.phone}</p>
                              </div>
                            </div>
                            {driver.isOnline ? (
                              <Badge variant="default" className="text-xs">
                                Online
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Offline
                              </Badge>
                            )}
                          </div>

                          {driver.currentJob && (
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                <span className="font-medium">{driver.currentJob.client.name}</span>
                              </div>
                              <div className="text-gray-500">
                                {driver.currentJob.route.origin} → {driver.currentJob.route.destination}
                              </div>
                            </div>
                          )}

                          {driver.location && (
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <Navigation className="h-3 w-3" />
                                {driver.location.speed.toFixed(0)} km/h
                              </div>
                              {driver.stats && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {driver.stats.totalDistance.toFixed(1)} km
                                </div>
                              )}
                            </div>
                          )}

                          <div className="text-xs text-gray-400">
                            {driver.location
                              ? `Updated ${formatTime(driver.location.lastUpdate)}`
                              : 'No location data'}
                            {driver.location?.isStale && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Stale
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {activeDrivers.length === 0 && (
                      <div className="text-center py-8">
                        <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No active drivers</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Selected Job Details */}
      {selectedJob && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job Tracking Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Driver</p>
                <p className="font-medium">{selectedJob.driver.name}</p>
                <p className="text-sm text-gray-600">{selectedJob.driver.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium">{selectedJob.job.client?.name}</p>
                <Badge variant={getStatusColor(selectedJob.job.status)} className="mt-1">
                  {selectedJob.job.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Route</p>
                <p className="font-medium text-sm">{selectedJob.job.route?.origin}</p>
                <p className="text-xs text-gray-600">to</p>
                <p className="font-medium text-sm">{selectedJob.job.route?.destination}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Stats</p>
                <div className="space-y-1 text-sm">
                  <p>Distance: {selectedJob.stats?.totalDistance.toFixed(1)} km</p>
                  <p>Avg Speed: {selectedJob.stats?.averageSpeed.toFixed(0)} km/h</p>
                  <p>Duration: {Math.round((selectedJob.stats?.totalDuration || 0) / 60)} min</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'default' as const;
    case 'IN_TRANSIT':
    case 'AT_PICKUP':
    case 'LOADED':
    case 'AT_DELIVERY':
      return 'secondary' as const;
    case 'CANCELLED':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}