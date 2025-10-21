'use client';

import { useEffect, useState, useRef } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow, useLoadScript } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Truck,
  Clock,
  Package,
  Navigation,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Share2,
  Phone,
  User,
  Calendar,
} from 'lucide-react';
import io, { Socket } from 'socket.io-client';
import { toast } from '@/components/ui/use-toast';

interface JobTracking {
  job: {
    id: string;
    status: string;
    priority: string;
    createdAt: string;
    pickupTs?: string;
    deliveryTs?: string;
    completedAt?: string;
    shareTrackingLink?: string;
  };
  client: {
    name: string;
    phone?: string;
  };
  route: {
    origin: string;
    destination: string;
    kmEstimate: number;
  };
  driver?: {
    name: string;
    phone: string;
  };
  vehicle?: {
    registrationNo: string;
    type: string;
  };
  currentLocation?: {
    lat: number;
    lng: number;
    speed: number;
    lastUpdate: string;
    isMoving: boolean;
  };
  eta?: {
    minutes: number;
    distance: number;
    confidence: number;
  };
}

interface TrackingEvent {
  code: string;
  timestamp: string;
  source: string;
  description?: string;
  metadata?: any;
}

const libraries: ('places' | 'drawing' | 'geometry')[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 6.927079,
  lng: 79.861244,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

export default function ClientTrackingView() {
  const [trackingCode, setTrackingCode] = useState('');
  const [jobId, setJobId] = useState('');
  const [trackingData, setTrackingData] = useState<JobTracking | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  useEffect(() => {
    // Check if there's a tracking code in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const id = urlParams.get('jobId');

    if (code) setTrackingCode(code);
    if (id) setJobId(id);

    if (code && id) {
      handleTrack(id, code);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleTrack = async (jobIdParam?: string, codeParam?: string) => {
    const finalJobId = jobIdParam || jobId;
    const finalCode = codeParam || trackingCode;

    if (!finalJobId || !finalCode) {
      setError('Please enter both Job ID and Tracking Code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch tracking data
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tracking-v2/public/${finalJobId}/${finalCode}`
      );

      if (!response.ok) {
        throw new Error('Invalid tracking code or job not found');
      }

      const data = await response.json();
      setTrackingData(data);

      // Connect to WebSocket for real-time updates
      connectWebSocket(finalJobId);

      // Fetch tracking events if available
      fetchTrackingEvents(finalJobId);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tracking information');
      setTrackingData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = (jobId: string) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    socketRef.current = io(`${process.env.NEXT_PUBLIC_API_URL}`, {
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to tracking server');
      // Join job room for updates
      socketRef.current?.emit('join_job_tracking', { jobId });
    });

    socketRef.current.on('location_update', (data) => {
      if (data.jobId === jobId) {
        setTrackingData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            currentLocation: {
              lat: data.lat,
              lng: data.lng,
              speed: data.speed,
              lastUpdate: new Date().toISOString(),
              isMoving: data.isMoving,
            },
          };
        });

        // Update marker on map
        if (markerRef.current) {
          markerRef.current.setPosition({ lat: data.lat, lng: data.lng });
        }
      }
    });

    socketRef.current.on('job_status_update', (data) => {
      if (data.jobId === jobId) {
        setTrackingData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            job: {
              ...prev.job,
              status: data.status,
            },
          };
        });
      }
    });
  };

  const fetchTrackingEvents = async (jobId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/jobs/${jobId}/events`
      );

      if (response.ok) {
        const events = await response.json();
        setTrackingEvents(events);
      }
    } catch (err) {
      console.error('Failed to fetch tracking events:', err);
    }
  };

  const shareTracking = () => {
    const url = `${window.location.origin}/client/track?jobId=${jobId}&code=${trackingCode}`;

    if (navigator.share) {
      navigator.share({
        title: 'Track Your Shipment',
        text: `Track shipment #${jobId}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: 'Link Copied',
        description: 'Tracking link copied to clipboard',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default';
      case 'IN_TRANSIT':
      case 'AT_PICKUP':
      case 'LOADED':
      case 'AT_DELIVERY':
        return 'secondary';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'CANCELLED':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Truck className="h-5 w-5 text-blue-600" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateETA = () => {
    if (trackingData?.eta) {
      const hours = Math.floor(trackingData.eta.minutes / 60);
      const minutes = trackingData.eta.minutes % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    return null;
  };

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading map. Please check your connection and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Shipment</h1>
          <p className="text-gray-600">Enter your tracking details to see real-time updates</p>
        </div>

        {/* Tracking Form */}
        {!trackingData && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job ID
                  </label>
                  <Input
                    placeholder="Enter Job ID"
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Code
                  </label>
                  <Input
                    placeholder="Enter Tracking Code"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={() => handleTrack()}
                disabled={isLoading}
                className="w-full mt-4"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Track Shipment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tracking Results */}
        {trackingData && (
          <>
            {/* Status Overview */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(trackingData.job.status)}
                    <div>
                      <CardTitle className="text-xl">Shipment #{trackingData.job.id.slice(0, 8)}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Created {formatDate(trackingData.job.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(trackingData.job.status)}>
                      {trackingData.job.status.replace(/_/g, ' ')}
                    </Badge>
                    {trackingData.job.priority === 'URGENT' && (
                      <Badge variant="destructive">Urgent</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">From</p>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                        <p className="font-medium">{trackingData.route.origin}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">To</p>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
                        <p className="font-medium">{trackingData.route.destination}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Distance</p>
                      <p className="font-medium">{trackingData.route.kmEstimate} km</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {trackingData.driver && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Driver</p>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <p className="font-medium">{trackingData.driver.name}</p>
                        </div>
                      </div>
                    )}
                    {trackingData.vehicle && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Vehicle</p>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-gray-600" />
                          <p className="font-medium">
                            {trackingData.vehicle.type} - {trackingData.vehicle.registrationNo}
                          </p>
                        </div>
                      </div>
                    )}
                    {calculateETA() && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Estimated Time</p>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-600" />
                          <p className="font-medium">{calculateETA()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareTracking}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Tracking
                  </Button>
                  {trackingData.driver && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `tel:${trackingData.driver?.phone}`}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Driver
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Live Map */}
            {isLoaded && trackingData.currentLocation && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Live Location
                  </CardTitle>
                  {trackingData.currentLocation && (
                    <p className="text-sm text-gray-500">
                      Speed: {trackingData.currentLocation.speed.toFixed(0)} km/h
                      {' • '}
                      Updated {formatDate(trackingData.currentLocation.lastUpdate)}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={
                      trackingData.currentLocation
                        ? {
                            lat: trackingData.currentLocation.lat,
                            lng: trackingData.currentLocation.lng,
                          }
                        : defaultCenter
                    }
                    zoom={14}
                    options={mapOptions}
                    onLoad={(map) => {
                      mapRef.current = map;
                    }}
                  >
                    {trackingData.currentLocation && (
                      <Marker
                        position={{
                          lat: trackingData.currentLocation.lat,
                          lng: trackingData.currentLocation.lng,
                        }}
                        icon={{
                          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiMzQjgyRjYiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMyIvPgo8cGF0aCBkPSJNMjAgMTBMMjYgMjRIMTRMMjAgMTBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
                          scaledSize: new google.maps.Size(40, 40),
                          anchor: new google.maps.Point(20, 20),
                        }}
                        onLoad={(marker) => {
                          markerRef.current = marker;
                        }}
                      />
                    )}
                  </GoogleMap>
                </CardContent>
              </Card>
            )}

            {/* Timeline Events */}
            {trackingEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Tracking Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trackingEvents.map((event, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{event.description || event.code}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(event.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Back to Search */}
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setTrackingData(null);
                  setTrackingCode('');
                  setJobId('');
                  setError(null);
                  if (socketRef.current) {
                    socketRef.current.disconnect();
                  }
                }}
              >
                Track Another Shipment
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}