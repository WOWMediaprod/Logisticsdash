'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  MapPin,
  CheckCircle,
  Clock,
  Navigation,
  Package,
  FileText,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

// Ensure API URL always includes /api/v1
const getApiUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://logistics-api-d93v.onrender.com';
  // Remove trailing slash if present
  const cleanUrl = baseUrl.replace(/\/$/, '');
  // Add /api/v1 if not already present
  return cleanUrl.includes('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
};

const API_URL = getApiUrl();

type WaypointType =
  | 'PICKUP'
  | 'CONTAINER_PICKUP'
  | 'DOCUMENT_PICKUP'
  | 'CHECKPOINT'
  | 'DELIVERY'
  | 'DOCUMENT_DROPOFF'
  | 'RETURN';

interface Waypoint {
  id: string;
  jobId: string;
  routeId: string;
  name: string;
  type: WaypointType;
  lat: number;
  lng: number;
  sequence: number;
  estimatedArrival?: string;
  isCompleted: boolean;
  actualArrival?: string;
  metadata?: {
    address?: string;
    instructions?: string;
    requiredDocuments?: string[];
  };
  createdAt: string;
}

const waypointTypeConfig: Record<WaypointType, { label: string; icon: React.ReactNode; color: string }> = {
  PICKUP: { label: 'Initial Pickup', icon: <MapPin className="w-4 h-4" />, color: 'bg-blue-500' },
  CONTAINER_PICKUP: { label: 'Container Pickup', icon: <Package className="w-4 h-4" />, color: 'bg-purple-500' },
  DOCUMENT_PICKUP: { label: 'Document Pickup', icon: <FileText className="w-4 h-4" />, color: 'bg-cyan-500' },
  CHECKPOINT: { label: 'Checkpoint', icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-yellow-500' },
  DELIVERY: { label: 'Final Delivery', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-500' },
  DOCUMENT_DROPOFF: { label: 'Document Drop-off', icon: <FileText className="w-4 h-4" />, color: 'bg-indigo-500' },
  RETURN: { label: 'Return/Empty Return', icon: <Navigation className="w-4 h-4" />, color: 'bg-gray-500' },
};

export default function DriverJobPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState<string>('');
  const [locationCount, setLocationCount] = useState(0);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  // Check if already authenticated
  useEffect(() => {
    const token = localStorage.getItem(`driver_token_${jobId}`);
    const savedDriverId = localStorage.getItem(`driver_id_${jobId}`);
    if (token && savedDriverId) {
      setIsAuthenticated(true);
      setDriverId(savedDriverId);
      fetchJobDetails(token);
    }
  }, [jobId]);

  const fetchJobDetails = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setJob(data);
        // Fetch waypoints after getting job details
        fetchWaypoints();
      }
    } catch (err) {
      console.error('Failed to fetch job details:', err);
    }
  };

  const fetchWaypoints = async () => {
    try {
      const response = await fetch(`${API_URL}/waypoints?jobId=${jobId}`);
      const result = await response.json();
      if (result.success) {
        setWaypoints(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch waypoints:', err);
    }
  };

  const handleCheckIn = async (waypointId: string) => {
    setCheckingIn(waypointId);
    try {
      const response = await fetch(`${API_URL}/waypoints/${waypointId}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem(`driver_token_${jobId}`)}`
        }
      });

      const result = await response.json();

      if (result.success) {
        // Refresh waypoints
        fetchWaypoints();
      } else {
        setError(result.message || 'Failed to check in at waypoint');
      }
    } catch (err) {
      console.error('Failed to check in:', err);
      setError('Failed to check in at waypoint');
    } finally {
      setCheckingIn(null);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/driver-auth/login-by-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, pin })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem(`driver_token_${jobId}`, data.token);
        localStorage.setItem(`driver_id_${jobId}`, data.driverId);
        setDriverId(data.driverId);
        setIsAuthenticated(true);
        fetchJobDetails(data.token);
      } else {
        setError(data.message || 'Invalid PIN. Please try again.');
      }
    } catch (err) {
      setError('Failed to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (!driverId) {
      setError('Driver ID not available');
      return;
    }

    setTracking(true);
    setError('');
    setLocationCount(0);

    // Get location every 30 seconds
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const locationData = {
          jobId,
          driverId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0,
          timestamp: new Date().toISOString(),
          source: 'MOBILE_GPS'
        };

        try {
          const response = await fetch(`${API_URL}/tracking/location`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem(`driver_token_${jobId}`)}`
            },
            body: JSON.stringify(locationData)
          });

          if (response.ok) {
            setLocationCount(prev => prev + 1);
            setLastLocation(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)} @ ${new Date().toLocaleTimeString()}`);
          } else {
            console.error('Failed to send location:', await response.text());
          }
        } catch (err) {
          console.error('Failed to send location:', err);
        }
      },
      (err) => {
        setError(`GPS Error: ${err.message}`);
        setTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    // Store watch ID for cleanup
    (window as any).gpsWatchId = watchId;
  };

  const stopTracking = () => {
    if ((window as any).gpsWatchId) {
      navigator.geolocation.clearWatch((window as any).gpsWatchId);
    }
    setTracking(false);
  };

  const handleLogout = () => {
    if (tracking) {
      stopTracking();
    }
    localStorage.removeItem(`driver_token_${jobId}`);
    localStorage.removeItem(`driver_id_${jobId}`);
    setIsAuthenticated(false);
    setDriverId(null);
    setJob(null);
    setPin('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Driver Authentication</CardTitle>
            <CardDescription>Enter your PIN to access job {jobId}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  inputMode="numeric"
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  className="text-2xl text-center tracking-widest"
                  autoFocus
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading || pin.length !== 4}>
                {loading ? 'Verifying...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Job: {jobId}</CardTitle>
                <CardDescription>Driver GPS Tracking V2</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Job Details */}
        {job && (
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Status:</div>
                <div>{job.status}</div>
                <div className="font-medium">Client:</div>
                <div>{job.client?.name || 'N/A'}</div>
                <div className="font-medium">Vehicle:</div>
                <div>{job.vehicle?.regNo || 'N/A'}</div>
                <div className="font-medium">Route:</div>
                <div>{job.route?.origin || 'N/A'} → {job.route?.destination || 'N/A'}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* GPS Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>GPS Tracking</CardTitle>
            <CardDescription>
              {tracking ? '🟢 Tracking Active' : '⚪ Tracking Inactive'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!tracking ? (
              <Button onClick={startTracking} className="w-full" size="lg">
                Start GPS Tracking
              </Button>
            ) : (
              <Button onClick={stopTracking} variant="destructive" className="w-full" size="lg">
                Stop Tracking
              </Button>
            )}

            {locationCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                <div className="font-medium text-blue-800">Location Updates Sent: {locationCount}</div>
              </div>
            )}

            {lastLocation && (
              <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                <div className="font-medium text-green-800">Last Location Sent:</div>
                <div className="text-green-700 font-mono text-xs mt-1">{lastLocation}</div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <div>• Location updates sent automatically while tracking</div>
              <div>• Keep this page open while driving</div>
              <div>• Ensure GPS is enabled on your device</div>
            </div>
          </CardContent>
        </Card>

        {/* Waypoints / Route Stops */}
        {waypoints.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Route Waypoints</CardTitle>
              <CardDescription>
                {waypoints.filter(w => w.isCompleted).length} of {waypoints.length} completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {waypoints.map((waypoint, index) => {
                const nextIncomplete = waypoints.find(w => !w.isCompleted);
                const isCurrent = nextIncomplete?.id === waypoint.id;

                return (
                  <div
                    key={waypoint.id}
                    className={`relative rounded-lg border-2 transition-all ${
                      waypoint.isCompleted
                        ? 'bg-green-50 border-green-200'
                        : isCurrent
                        ? 'bg-blue-50 border-blue-400 shadow-md'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {/* Connection Line */}
                    {index < waypoints.length - 1 && (
                      <div className="absolute left-6 top-full h-3 w-0.5 bg-gray-300 z-0" />
                    )}

                    <div className="p-4 relative z-10">
                      <div className="flex items-start gap-3">
                        {/* Sequence Number */}
                        <div
                          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 font-bold text-lg ${
                            waypoint.isCompleted
                              ? 'bg-green-500 border-green-600 text-white'
                              : isCurrent
                              ? 'bg-blue-500 border-blue-600 text-white animate-pulse'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          {waypoint.isCompleted ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            waypoint.sequence
                          )}
                        </div>

                        {/* Waypoint Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-gray-900">{waypoint.name}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {waypoint.metadata?.address}
                              </p>
                            </div>
                            <div className={`px-2 py-1 rounded-md text-xs font-medium text-white ${waypointTypeConfig[waypoint.type].color} flex items-center gap-1`}>
                              {waypointTypeConfig[waypoint.type].icon}
                              <span className="hidden sm:inline">{waypointTypeConfig[waypoint.type].label}</span>
                            </div>
                          </div>

                          {waypoint.metadata?.instructions && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                              <strong>Instructions:</strong> {waypoint.metadata.instructions}
                            </div>
                          )}

                          {waypoint.isCompleted && waypoint.actualArrival && (
                            <div className="mt-2 flex items-center gap-1 text-sm text-green-700">
                              <CheckCircle className="w-4 h-4" />
                              Completed: {new Date(waypoint.actualArrival).toLocaleString('en-LK')}
                            </div>
                          )}

                          {isCurrent && !waypoint.isCompleted && (
                            <div className="mt-3">
                              <Button
                                onClick={() => handleCheckIn(waypoint.id)}
                                disabled={checkingIn === waypoint.id}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                size="lg"
                              >
                                {checkingIn === waypoint.id ? (
                                  'Checking In...'
                                ) : (
                                  <>
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Check In at This Location
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                          {!isCurrent && !waypoint.isCompleted && (
                            <div className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Complete previous waypoints first
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}