'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  MapPin,
  Navigation,
  TrendingUp,
  DollarSign,
  Package,
  LogOut,
  Play,
  Square,
  Battery,
  Wifi,
  AlertCircle,
  Clock,
  Truck,
  User
} from 'lucide-react';
import io, { Socket } from 'socket.io-client';

interface CurrentJob {
  id: string;
  status: string;
  client: { name: string };
  route: {
    origin: string;
    destination: string;
    kmEstimate: number;
  };
  priority: string;
  pickupTs: string;
  deliveryTs: string;
}

interface DriverStats {
  jobs: {
    completed: number;
    total: number;
    completionRate: number;
  };
  earnings: {
    total: number;
    average: number;
    breakdown: {
      base: number;
      distanceBonus: number;
      timeBonus: number;
      nightShiftBonus: number;
    };
  };
  distance: {
    total: number;
    average: number;
  };
}

interface LocationUpdate {
  jobId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  accuracy: number;
  batteryLevel: number;
  networkType: string;
  timestamp: string;
  isCharging: boolean;
}

export default function DriverDashboardPage() {
  const [currentJob, setCurrentJob] = useState<CurrentJob | null>(null);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [networkType, setNetworkType] = useState('Unknown');
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const router = useRouter();

  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('driverToken');
    if (!token) {
      router.push('/driver-v2/login');
      return;
    }

    fetchCurrentJob();
    fetchDriverStats();
    connectWebSocket();

    // Get battery status
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    // Get network information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setNetworkType(connection.effectiveType || 'Unknown');
      connection.addEventListener('change', () => {
        setNetworkType(connection.effectiveType || 'Unknown');
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [router]);

  const fetchCurrentJob = async () => {
    try {
      const driverId = localStorage.getItem('driverId');
      const token = localStorage.getItem('driverToken');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/jobs/driver/${driverId}/current`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCurrentJob(data);

        // Check if job is being tracked
        if (data && ['IN_TRANSIT', 'AT_PICKUP', 'LOADED', 'AT_DELIVERY'].includes(data.status)) {
          setIsTracking(true);
          startLocationTracking(data.id);
        }
      }
    } catch (error) {
      console.error('Error fetching current job:', error);
    }
  };

  const fetchDriverStats = async () => {
    try {
      const token = localStorage.getItem('driverToken');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/driver-stats/my-stats?period=daily`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching driver stats:', error);
    }
  };

  const connectWebSocket = () => {
    const token = localStorage.getItem('driverToken');
    const driverId = localStorage.getItem('driverId');

    socketRef.current = io(`${process.env.NEXT_PUBLIC_API_URL}`, {
      auth: {
        token,
        driverId,
      },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to tracking server');
      setIsOnline(true);

      // Join driver room
      if (driverId) {
        socketRef.current?.emit('join_driver_room', { driverId });
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from tracking server');
      setIsOnline(false);
    });

    socketRef.current.on('location_update_success', (data) => {
      console.log('Location updated successfully:', data);
      if (data.distanceTraveled) {
        distanceRef.current += data.distanceTraveled;
        setTotalDistance(distanceRef.current);
      }
    });

    socketRef.current.on('location_update_error', (error) => {
      console.error('Location update error:', error);
    });
  };

  const startLocationTracking = useCallback((jobId: string) => {
    if (!navigator.geolocation) {
      toast({
        title: 'Error',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive',
      });
      return;
    }

    // High accuracy GPS tracking options
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading, accuracy } = position.coords;

        // Update current location
        setLastLocation({ lat: latitude, lng: longitude });
        setCurrentSpeed(speed ? Math.round(speed * 3.6) : 0); // Convert m/s to km/h

        // Calculate distance
        if (lastPositionRef.current) {
          const distance = calculateDistance(
            lastPositionRef.current.lat,
            lastPositionRef.current.lng,
            latitude,
            longitude
          );
          distanceRef.current += distance;
          setTotalDistance(distanceRef.current);
        }
        lastPositionRef.current = { lat: latitude, lng: longitude };

        // Send location update via WebSocket
        const locationUpdate: LocationUpdate = {
          jobId,
          lat: latitude,
          lng: longitude,
          speed: speed || 0,
          heading: heading || 0,
          accuracy: accuracy || 0,
          batteryLevel,
          networkType,
          timestamp: new Date().toISOString(),
          isCharging: false,
        };

        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('location_update', locationUpdate);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: 'Location Error',
          description: 'Unable to get your location. Please check permissions.',
          variant: 'destructive',
        });
      },
      options
    );
  }, [batteryLevel, networkType]);

  const handleStartTracking = async () => {
    if (!currentJob) {
      toast({
        title: 'No Job',
        description: 'No job assigned to start tracking',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('driverToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tracking-v2/start-tracking/${currentJob.id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setIsTracking(true);
        distanceRef.current = 0;
        setTotalDistance(0);
        startLocationTracking(currentJob.id);

        toast({
          title: 'Tracking Started',
          description: 'Your location is now being tracked',
        });

        // Refresh job status
        fetchCurrentJob();
      } else {
        throw new Error('Failed to start tracking');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start tracking',
        variant: 'destructive',
      });
    }
  };

  const handleStopTracking = async () => {
    if (!currentJob) return;

    try {
      const token = localStorage.getItem('driverToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tracking-v2/stop-tracking/${currentJob.id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setIsTracking(false);

        // Stop GPS tracking
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }

        toast({
          title: 'Tracking Stopped',
          description: `Total distance: ${totalDistance.toFixed(2)} km`,
        });
      } else {
        throw new Error('Failed to stop tracking');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to stop tracking',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('driverToken');
    localStorage.removeItem('driverId');
    localStorage.removeItem('driverName');
    localStorage.removeItem('driverPhone');

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    router.push('/driver-v2/login');
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">{localStorage.getItem('driverName')}</p>
              <div className="flex items-center gap-2">
                <Badge variant={isOnline ? 'default' : 'secondary'} className="text-xs">
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
                {isTracking && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    Tracking
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-blue-600 text-white px-4 py-2">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1">
            <Battery className="h-3 w-3" />
            <span>{batteryLevel}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Navigation className="h-3 w-3" />
            <span>{currentSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            <span>{networkType}</span>
          </div>
        </div>
      </div>

      {/* Current Job Card */}
      {currentJob ? (
        <Card className="mx-4 mt-4">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Current Job</CardTitle>
                <CardDescription>#{currentJob.id.slice(0, 8)}</CardDescription>
              </div>
              <Badge variant={currentJob.priority === 'URGENT' ? 'destructive' : 'default'}>
                {currentJob.priority}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-green-600 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">From</p>
                  <p className="text-sm font-medium">{currentJob.route.origin}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-red-600 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">To</p>
                  <p className="text-sm font-medium">{currentJob.route.destination}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div>
                <p className="text-xs text-gray-500">Client</p>
                <p className="text-sm font-medium">{currentJob.client.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Distance</p>
                <p className="text-sm font-medium">{currentJob.route.kmEstimate} km</p>
              </div>
            </div>

            {isTracking && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">Session Distance</p>
                <p className="text-sm font-medium">{totalDistance.toFixed(2)} km</p>
              </div>
            )}

            <div className="flex gap-2">
              {!isTracking ? (
                <Button
                  onClick={handleStartTracking}
                  className="flex-1"
                  variant="default"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Tracking
                </Button>
              ) : (
                <Button
                  onClick={handleStopTracking}
                  className="flex-1"
                  variant="destructive"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Tracking
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mx-4 mt-4">
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active job assigned</p>
            <p className="text-sm text-gray-400 mt-1">Check back later for new assignments</p>
          </CardContent>
        </Card>
      )}

      {/* Today's Stats */}
      {stats && (
        <div className="px-4 mt-4 space-y-3">
          <h3 className="font-semibold text-sm">Today's Performance</h3>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="bg-green-100 p-1.5 rounded">
                    <Package className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Jobs</p>
                    <p className="text-lg font-bold">{stats.jobs.completed}/{stats.jobs.total}</p>
                    <p className="text-xs text-gray-400">{stats.jobs.completionRate.toFixed(0)}% complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="bg-blue-100 p-1.5 rounded">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Earnings</p>
                    <p className="text-lg font-bold">{formatCurrency(stats.earnings.total)}</p>
                    <p className="text-xs text-gray-400">Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="bg-purple-100 p-1.5 rounded">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Distance</p>
                    <p className="text-lg font-bold">{stats.distance.total.toFixed(1)} km</p>
                    <p className="text-xs text-gray-400">Traveled</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="bg-orange-100 p-1.5 rounded">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Avg Earnings</p>
                    <p className="text-lg font-bold">{formatCurrency(stats.earnings.average)}</p>
                    <p className="text-xs text-gray-400">Per job</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="grid grid-cols-3 gap-0">
          <Button
            variant="ghost"
            className="rounded-none h-14 flex flex-col gap-1"
            onClick={() => router.push('/driver-v2/dashboard')}
          >
            <Truck className="h-5 w-5" />
            <span className="text-xs">Dashboard</span>
          </Button>
          <Button
            variant="ghost"
            className="rounded-none h-14 flex flex-col gap-1"
            onClick={() => router.push('/driver-v2/jobs')}
          >
            <Package className="h-5 w-5" />
            <span className="text-xs">Jobs</span>
          </Button>
          <Button
            variant="ghost"
            className="rounded-none h-14 flex flex-col gap-1"
            onClick={() => router.push('/driver-v2/earnings')}
          >
            <DollarSign className="h-5 w-5" />
            <span className="text-xs">Earnings</span>
          </Button>
        </div>
      </div>
    </div>
  );
}