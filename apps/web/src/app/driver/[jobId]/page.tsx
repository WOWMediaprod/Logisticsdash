'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://logistics-api-d93v.onrender.com/api/v1';

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
      }
    } catch (err) {
      console.error('Failed to fetch job details:', err);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/driver/login`, {
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
      </div>
    </div>
  );
}