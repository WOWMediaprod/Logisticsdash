"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../contexts/SocketContext";

interface LocationData {
  trackerId: string;
  name: string;
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
  companyId?: string;
}

export default function MobileTrackerPage() {
  const { socket, isConnected } = useSocket();

  const [trackerName, setTrackerName] = useState<string>("Driver");
  const [trackerId, setTrackerId] = useState<string>("");
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' }>({
    message: 'Ready to start tracking',
    type: 'info'
  });
  const [mounted, setMounted] = useState(false);

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Generate a unique tracker ID based on timestamp
    const generatedId = `tracker_${Date.now()}`;
    setTrackerId(generatedId);
  }, [mounted]);

  const showStatus = (message: string, type: 'info' | 'success' | 'error') => {
    setStatus({ message, type });
  };

  const testLocationAccess = () => {
    showStatus('Testing location access...', 'info');

    if (!navigator.geolocation) {
      showStatus('Geolocation is not supported by this browser', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        showStatus(`✅ Location access works! Accuracy: ${Math.round(position.coords.accuracy)}m`, 'success');
      },
      (error) => {
        let errorMsg = 'Location access failed: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += 'Permission denied. Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg += 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg += 'Location request timed out.';
            break;
          default:
            errorMsg += 'Unknown error.';
            break;
        }
        showStatus(errorMsg, 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const startTracking = () => {
    if (!trackerName.trim()) {
      showStatus('Please enter your name', 'error');
      return;
    }

    if (!navigator.geolocation) {
      showStatus('Geolocation is not supported by this browser', 'error');
      return;
    }

    if (!socket || !isConnected) {
      showStatus('Not connected to server. Please check connection.', 'error');
      return;
    }

    showStatus('Starting location tracking...', 'info');

    // Identify this tracker to the server
    socket.emit('identify-tracker', {
      trackerId,
      name: trackerName,
      companyId: process.env.NEXT_PUBLIC_DEV_COMPANY_ID || undefined
    });

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          trackerId,
          name: trackerName,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
          timestamp: new Date().toISOString(),
          companyId: process.env.NEXT_PUBLIC_DEV_COMPANY_ID || undefined
        };

        // Send live driver location update
        socket.emit('live-driver-location', locationData);

        if (!isTracking) {
          setIsTracking(true);
          showStatus('✅ Tracking active - Updates every 10 seconds', 'success');
        }
      },
      (error) => {
        let errorMsg = 'Location tracking failed: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += 'Permission denied. Please allow location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg += 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg += 'Location request timed out.';
            break;
          default:
            errorMsg += 'Unknown error.';
            break;
        }
        showStatus(errorMsg, 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setIsTracking(false);
    showStatus('Tracking stopped', 'info');
  };

  useEffect(() => {
    if (!socket) return;

    const handleLocationAck = (data: any) => {
      if (data.success) {
        console.log('Location update acknowledged:', data);
      } else {
        showStatus(`Location update failed: ${data.error}`, 'error');
      }
    };

    const handleIdentifyAck = (data: any) => {
      if (data.success) {
        console.log('Tracker identified successfully:', data);
      } else {
        showStatus(`Tracker identification failed: ${data.error}`, 'error');
      }
    };

    socket.on('location-ack', handleLocationAck);
    socket.on('identify-ack', handleIdentifyAck);

    return () => {
      socket.off('location-ack', handleLocationAck);
      socket.off('identify-ack', handleIdentifyAck);
    };
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading tracker...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container max-w-md mx-auto px-6 py-8">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">📍 Live Driver Tracker</h1>
            <p className="text-gray-600">Share your live location with dispatch</p>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className="text-sm text-gray-600">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>

          {!isTracking ? (
            <div className="space-y-6">
              {/* Driver Name Input */}
              <div>
                <label htmlFor="driver-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Driver Name
                </label>
                <input
                  type="text"
                  id="driver-name"
                  value={trackerName}
                  onChange={(e) => setTrackerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={startTracking}
                  disabled={!isConnected}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  🚀 Start Live Tracking
                </button>

                <button
                  onClick={testLocationAccess}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  🧪 Test Location Access
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tracking Active Status */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-green-800 font-semibold mb-1">✅ Tracking Active</div>
                <div className="text-green-600 text-sm">
                  Driver: {trackerName}
                </div>
                <div className="text-green-600 text-sm">
                  Updates every 10 seconds
                </div>
              </div>

              {/* Stop Button */}
              <button
                onClick={stopTracking}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                ⏹️ Stop Tracking
              </button>
            </div>
          )}

          {/* Status Message */}
          {status.message && (
            <div className={`mt-6 p-4 rounded-lg text-center font-medium ${
              status.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
              status.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
              'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {status.message}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">📋 Instructions</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Enter your driver name or vehicle ID</li>
              <li>• Tap "Start Live Tracking" button</li>
              <li>• Allow location permissions</li>
              <li>• Keep this page open while driving</li>
              <li>• Your location updates every 10 seconds</li>
              <li>• View live tracking on the main dashboard</li>
            </ul>
          </div>

          {/* Tracker ID */}
          <div className="mt-6 text-center">
            <div className="text-xs text-gray-500">
              Tracker ID: {trackerId.slice(-8)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}