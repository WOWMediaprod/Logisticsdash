"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Power, Smartphone, Clock, User, ArrowLeft, Zap, AlertTriangle, Settings, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSocket } from "../../../contexts/SocketContext";

type LocationData = {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
  speed?: number;
  heading?: number;
};

type DriverInfo = {
  name: string;
  phone: string;
  vehicleRegNo: string;
};

export default function DriverTracking() {
  const { socket, isConnected } = useSocket();
  const [isTracking, setIsTracking] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [jobId, setJobId] = useState<string>("");
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [locationPermission, setLocationPermission] = useState<PermissionState | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");
  const [locationHistory, setLocationHistory] = useState<Array<{
    timestamp: string;
    lat: number;
    lng: number;
    accuracy: number;
    transmitted: boolean;
  }>>([]);
  const [errorHistory, setErrorHistory] = useState<string[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<string>("");
  const [showManualEntry, setShowManualEntry] = useState<boolean>(false);
  const [manualLat, setManualLat] = useState<string>("");
  const [manualLng, setManualLng] = useState<string>("");
  const watchId = useRef<number | null>(null);
  const lastUpdateTime = useRef<Date>(new Date());

  // Device and browser detection with iOS Safari specifics
  const detectDeviceAndBrowser = () => {
    const ua = navigator.userAgent;
    const platform = navigator.platform || 'Unknown';

    let device = 'Desktop';
    let browser = 'Unknown';
    let isIOS = false;
    let isIOSSafari = false;
    let isStandalone = false;

    // Device detection
    if (/iPhone|iPad|iPod/.test(ua)) {
      device = 'iOS';
      isIOS = true;

      // Check if it's standalone mode (PWA)
      isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                    (window.navigator as any).standalone === true;
    } else if (/Android/.test(ua)) {
      device = 'Android';
    } else if (/Mobile|Tablet/.test(ua)) {
      device = 'Mobile';
    }

    // Browser detection with iOS Safari specifics
    if (isIOS && ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('CriOS')) {
      browser = 'Safari';
      isIOSSafari = true;
    } else if (ua.includes('Chrome') || ua.includes('CriOS')) {
      browser = 'Chrome';
    } else if (ua.includes('Firefox') || ua.includes('FxiOS')) {
      browser = 'Firefox';
    } else if (ua.includes('Edge')) {
      browser = 'Edge';
    } else if (isIOS && !ua.includes('Safari')) {
      browser = 'iOS WebView';
    }

    const info = `${device} - ${browser} (Platform: ${platform})`;
    setDeviceInfo(info);

    return { device, browser, isIOS, isIOSSafari, isStandalone, info };
  };

  // Utility functions for debugging
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setDebugInfo(prev => prev + logMessage + '\n');
    console.log(logMessage);
  };

  const addErrorLog = (error: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const errorMessage = `[${timestamp}] ERROR: ${error}`;
    setErrorHistory(prev => [...prev.slice(-9), errorMessage]); // Keep last 10 errors
    console.error(errorMessage);
  };

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
    const deviceInfo = detectDeviceAndBrowser();
    addDebugLog(`Component mounted: ${deviceInfo.info}`);
    checkLocationPermission();
  }, []);

  // Monitor socket connection status
  useEffect(() => {
    if (!socket) {
      setConnectionStatus("No socket instance");
      addDebugLog("Socket instance not available");
      return;
    }

    if (!isConnected) {
      setConnectionStatus("Socket disconnected");
      addDebugLog("Socket not connected");
      return;
    }

    setConnectionStatus("Socket connected");
    addDebugLog("Socket connected and ready");

    const handleConnect = () => {
      setConnectionStatus("Socket connected");
      addDebugLog("Socket connected successfully");
    };

    const handleDisconnect = (reason: string) => {
      setConnectionStatus(`Disconnected: ${reason}`);
      addErrorLog(`Socket disconnected: ${reason}`);
    };

    const handleConnectError = (error: any) => {
      setConnectionStatus("Connection error");
      addErrorLog(`Socket connection error: ${error?.message || 'Unknown error'}`);
    };

    const handleLocationAck = (data: any) => {
      addDebugLog(`Location update acknowledged by server`);
      setLocationHistory(prev =>
        prev.map(loc =>
          loc.timestamp === data.timestamp
            ? { ...loc, transmitted: true }
            : loc
        )
      );
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("location-update-ack", handleLocationAck);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("location-update-ack", handleLocationAck);
    };
  }, [socket, isConnected]);

  // Check location permission status with fallback and timeout
  const checkLocationPermission = async () => {
    if (!mounted || typeof navigator === 'undefined') return;

    addDebugLog('Starting permission check...');

    // Add timeout to prevent infinite checking
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Permission check timeout')), 5000);
    });

    try {
      // Try Permissions API first (with timeout)
      if ('permissions' in navigator && 'query' in navigator.permissions) {
        try {
          addDebugLog('Trying Permissions API...');
          const permissionPromise = navigator.permissions.query({ name: 'geolocation' });
          const permission = await Promise.race([permissionPromise, timeoutPromise]);

          setLocationPermission(permission.state);
          addDebugLog(`Permission API result: ${permission.state}`);

          permission.addEventListener('change', () => {
            setLocationPermission(permission.state);
            addDebugLog(`Permission changed: ${permission.state}`);
          });
          return;
        } catch (permApiError) {
          const errorMsg = permApiError instanceof Error ? permApiError.message : String(permApiError);
          addDebugLog(`Permission API failed: ${errorMsg}`);
        }
      }

      // Fallback: Try direct geolocation test
      addDebugLog('Using geolocation fallback test...');
      await testGeolocationDirectly();

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addErrorLog(`All permission checks failed: ${errorMsg}`);
      // Set unknown state but allow user to try manual request
      setLocationPermission('prompt');
      addDebugLog('Permission status unknown - user can try manual request');
    }
  };

  // iOS Safari-specific permission request
  const requestIOSSafariPermission = async (): Promise<boolean> => {
    addDebugLog('Initiating iOS Safari permission request...');

    return new Promise<boolean>((resolve) => {
      // iOS Safari requires user interaction and specific settings
      const options: PositionOptions = {
        enableHighAccuracy: false, // Start with low accuracy for permission
        timeout: 30000, // Very long timeout for iOS Safari
        maximumAge: 10000 // Allow cached position
      };

      let permissionGranted = false;

      const successCallback = (position: GeolocationPosition) => {
        addDebugLog(`iOS Safari permission granted! Initial position: ${position.coords.latitude}, ${position.coords.longitude}`);
        setLocationPermission('granted');
        setError(null);
        permissionGranted = true;
        resolve(true);
      };

      const errorCallback = (error: GeolocationPositionError) => {
        addDebugLog(`iOS Safari permission error: Code ${error.code} - ${error.message}`);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            addErrorLog('iOS Safari: User denied location or site not authorized');
            setLocationPermission('denied');
            setError('Location access denied. Please check Safari settings for this website.');
            break;
          case error.POSITION_UNAVAILABLE:
            addDebugLog('iOS Safari: Position unavailable but permission might be granted');
            setLocationPermission('granted'); // Permission granted but GPS unavailable
            permissionGranted = true;
            resolve(true);
            return;
          case error.TIMEOUT:
            addErrorLog('iOS Safari: Timeout waiting for location');
            setError('Location request timed out. Please try again.');
            break;
          default:
            addErrorLog(`iOS Safari: Unknown error - ${error.message}`);
            setError('Unknown location error occurred.');
            break;
        }
        resolve(permissionGranted);
      };

      // Make the request
      try {
        navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
        addDebugLog('iOS Safari getCurrentPosition request initiated...');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        addErrorLog(`iOS Safari geolocation request failed: ${errorMsg}`);
        resolve(false);
      }
    });
  };

  // Direct geolocation test as fallback
  const testGeolocationDirectly = async (): Promise<void> => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Geolocation test timeout'));
      }, 8000);

      // Test current position to determine permission state
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          addDebugLog(`Geolocation test successful: ${position.coords.accuracy}m accuracy`);
          setLocationPermission('granted');
          resolve();
        },
        (error) => {
          clearTimeout(timeoutId);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              addDebugLog('Geolocation test: permission denied');
              setLocationPermission('denied');
              break;
            case error.POSITION_UNAVAILABLE:
              addDebugLog('Geolocation test: position unavailable');
              setLocationPermission('granted'); // Permission is granted but GPS unavailable
              break;
            case error.TIMEOUT:
              addDebugLog('Geolocation test: timeout');
              setLocationPermission('prompt'); // Unclear state, let user decide
              break;
            default:
              addDebugLog(`Geolocation test error: ${error.message}`);
              setLocationPermission('prompt');
              break;
          }
          resolve();
        },
        {
          enableHighAccuracy: false,
          timeout: 7000,
          maximumAge: 60000 // Accept cached position for permission test
        }
      );
    });
  };

  // Request location permission explicitly
  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      addErrorLog("Geolocation API not available");
      return false;
    }

    const deviceInfo = detectDeviceAndBrowser();
    setPermissionRequested(true);
    setError(null);
    addDebugLog(`Requesting location permission on ${deviceInfo.device} - ${deviceInfo.browser}`);

    // Use iOS Safari-specific handling
    if (deviceInfo.isIOSSafari) {
      addDebugLog("iOS Safari detected - using specialized permission flow");
      return await requestIOSSafariPermission();
    }

    return new Promise<boolean>((resolve) => {
      const options = {
        enableHighAccuracy: false, // Start with low accuracy for faster permission request
        timeout: 15000, // Longer timeout for mobile
        maximumAge: 5000, // Allow slightly cached position
      };

      // For other iOS browsers, use longer timeout
      if (deviceInfo.isIOS) {
        addDebugLog("iOS (non-Safari) detected - using iOS-optimized settings");
        options.timeout = 25000; // Even longer timeout for iOS
      }

      const successCallback = (position: GeolocationPosition) => {
        addDebugLog(`Permission granted! Accuracy: ${position.coords.accuracy}m, Speed: ${position.coords.speed || 0}`);
        setLocationPermission('granted');
        setError(null);
        resolve(true);
      };

      const errorCallback = (error: GeolocationPositionError) => {
        let errorMessage = "";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            setLocationPermission('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
          default:
            errorMessage = "Unknown location error";
            break;
        }
        setDebugInfo(`Error: ${errorMessage} (Code: ${error.code})`);
        setError(errorMessage);
        resolve(false);
      };

      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    });
  };

  // Get battery level if available
  useEffect(() => {
    if (!mounted) return;

    if (typeof window !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }
  }, [mounted]);

  const startTracking = async () => {
    if (!jobId.trim()) {
      setError("Please enter your Job ID before starting tracking");
      addErrorLog("Job ID required but not provided");
      return;
    }

    const deviceInfo = detectDeviceAndBrowser();
    addDebugLog(`Starting tracking on ${deviceInfo.device} with job: ${jobId.trim()}`);

    // Check and request permission first
    if (locationPermission !== 'granted') {
      addDebugLog("Permission not granted, requesting...");
      const granted = await requestLocationPermission();
      if (!granted) {
        addErrorLog("Permission request failed, cannot start tracking");
        return;
      }
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000, // 30 seconds
    };

    const successCallback = (position: GeolocationPosition) => {
      const location: LocationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0, // Convert m/s to km/h
        heading: position.coords.heading || 0,
        timestamp: new Date().toISOString(),
      };

      setLocationData(location);
      setError(null);
      lastUpdateTime.current = new Date();

      // Add to location history for debugging
      const locationEntry = {
        timestamp: new Date().toISOString(),
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        transmitted: false
      };
      setLocationHistory(prev => [...prev.slice(-19), locationEntry]); // Keep last 20 locations

      addDebugLog(`Location updated: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)} (±${Math.round(position.coords.accuracy)}m)`);

      // Send location to server via WebSocket
      if (socket && isConnected && jobId) {
        const payload = {
          jobId: jobId.trim(),
          driverId: "driver-" + Date.now(), // Temporary driver ID
          ...location,
        };

        addDebugLog(`Sending location via WebSocket to server`);
        socket.emit("location-update", payload);

        // Mark as transmitted in history
        setLocationHistory(prev =>
          prev.map(loc =>
            loc.timestamp === locationEntry.timestamp
              ? { ...loc, transmitted: true }
              : loc
          )
        );
      } else {
        const issue = !socket ? 'No socket instance' :
                     !isConnected ? 'Socket disconnected' :
                     'No job ID provided';
        addErrorLog(`Cannot send location: ${issue}`);
      }
    };

    const errorCallback = (error: GeolocationPositionError) => {
      let errorMessage = "";
      let debugDetails = "";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access denied. Please enable location permissions in your browser settings.";
          debugDetails = "User denied location permission or browser blocked access";
          setLocationPermission('denied');
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable. Check your GPS signal and internet connection.";
          debugDetails = "GPS/network positioning failed - device may be indoors or have weak signal";
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out. Please check your GPS signal and try again.";
          debugDetails = "Geolocation API timeout exceeded (60s limit)";
          break;
        default:
          errorMessage = "An unknown error occurred while getting location.";
          debugDetails = `Unknown geolocation error code: ${error.code}`;
          break;
      }

      addErrorLog(`Geolocation error: ${debugDetails} (${error.message || 'No additional details'})`);
      setError(errorMessage);
      setIsTracking(false);
    };

    watchId.current = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      options
    );

    setIsTracking(true);
    setError(null);
  };

  // Manual location entry as fallback
  const useManualLocation = () => {
    if (!manualLat.trim() || !manualLng.trim()) {
      setError("Please enter both latitude and longitude");
      return;
    }

    const lat = parseFloat(manualLat.trim());
    const lng = parseFloat(manualLng.trim());

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError("Please enter valid coordinates (Lat: -90 to 90, Lng: -180 to 180)");
      return;
    }

    // Create manual location data
    const manualLocation: LocationData = {
      lat,
      lng,
      accuracy: 1000, // 1km accuracy estimate for manual entry
      timestamp: new Date().toISOString(),
      speed: 0,
      heading: 0,
    };

    setLocationData(manualLocation);
    setLocationPermission('granted');
    setError(null);
    setShowManualEntry(false);
    addDebugLog(`Manual location set: ${lat}, ${lng}`);

    // Send to server if connected
    if (socket && isConnected && jobId.trim()) {
      const payload = {
        jobId: jobId.trim(),
        driverId: "driver-manual-" + Date.now(),
        ...manualLocation,
        isManual: true,
        source: 'MANUAL_ENTRY'
      };

      addDebugLog('Sending manual location to server');
      socket.emit("location-update", payload);
    }
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
    setLocationData(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
  };

  const formatSpeed = (speed?: number) => {
    if (!speed) return "0 km/h";
    return `${Math.round(speed * 3.6)} km/h`; // Convert m/s to km/h
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <Link
            href="/driver"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Live Tracking</h1>
          <div className={`flex items-center space-x-1 text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isConnected ? 'Online' : 'Offline'}</span>
          </div>
        </motion.div>

        {/* Job ID Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg p-4"
        >
          <label htmlFor="jobId" className="block text-sm font-semibold text-gray-700 mb-2">
            Job ID
          </label>
          <input
            id="jobId"
            type="text"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="Enter your assigned Job ID"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isTracking}
          />
        </motion.div>

        {/* Permission Status Card */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  locationPermission === 'granted' ? 'bg-green-500/10' :
                  locationPermission === 'denied' ? 'bg-red-500/10' :
                  'bg-yellow-500/10'
                }`}>
                  {locationPermission === 'granted' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : locationPermission === 'denied' ? (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Settings className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    Location Permission: {locationPermission || 'Checking...'}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {locationPermission === 'granted' ? 'Location access enabled - ready to track' :
                     locationPermission === 'denied' ? 'Location blocked - please enable in browser settings' :
                     locationPermission === 'prompt' ? 'Tap "Start Tracking" to request permission' :
                     'Checking permission status...'}
                  </p>
                  {/* iOS Safari-specific instructions */}
                  {deviceInfo.includes('iOS - Safari') && locationPermission === 'denied' && (
                    <div className="text-xs text-blue-600 mt-2 space-y-1">
                      <p className="font-semibold">iOS Safari Location Setup:</p>
                      <p>1. Tap the 🛡️ icon in address bar → Website Settings</p>
                      <p>2. Tap "Location" → Allow</p>
                      <p>3. Or: Settings → Safari → Location Services → Allow</p>
                      <p>4. Refresh this page</p>
                    </div>
                  )}
                  {/* Other mobile instructions */}
                  {deviceInfo.includes('Android') && locationPermission === 'denied' && (
                    <p className="text-xs text-blue-600 mt-1">
                      Android: Browser settings → Site permissions → Location → Allow
                    </p>
                  )}
                  {deviceInfo.includes('iOS') && !deviceInfo.includes('Safari') && locationPermission === 'denied' && (
                    <p className="text-xs text-blue-600 mt-1">
                      iOS: Settings → Privacy → Location Services → Enable for browser
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(locationPermission === 'denied' || locationPermission === 'prompt') && (
                  <button
                    onClick={requestLocationPermission}
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Request Permission
                  </button>
                )}
                {/* Manual override for stubborn cases */}
                {locationPermission !== 'granted' && (
                  <button
                    onClick={() => {
                      setLocationPermission('granted');
                      addDebugLog('Manual override: Permission set to granted by user');
                    }}
                    className="px-3 py-1 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 transition-colors"
                    title="Use if you've already granted permission but it's not detected"
                  >
                    Manual Override
                  </button>
                )}
              </div>
            </div>

            {/* iOS Safari-specific help panel */}
            {deviceInfo.includes('iOS - Safari') && locationPermission !== 'granted' && (
              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="text-blue-600 text-lg">🛡️</div>
                  <div>
                    <h5 className="font-semibold text-blue-900 text-sm">iOS Safari Location Access</h5>
                    <p className="text-xs text-blue-800 mt-1">
                      Safari requires explicit permission for location access. Follow these steps:
                    </p>
                    <ol className="text-xs text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                      <li>Look for the 🛡️ or "aA" icon in your address bar</li>
                      <li>Tap it → Website Settings → Location → Allow</li>
                      <li>Alternatively: iOS Settings → Safari → Location Services → While Using App</li>
                      <li>Tap "Request Permission" below after enabling</li>
                    </ol>

                    {/* HTTPS Alternative */}
                    <div className="mt-3 p-2 bg-white rounded border">
                      <p className="text-xs text-blue-800 font-semibold">Alternative: Use HTTPS</p>
                      <p className="text-xs text-blue-700 mt-1">iOS Safari works better with secure connections:</p>
                      <button
                        onClick={() => {
                          const httpsUrl = window.location.href.replace('http://', 'https://');
                          addDebugLog(`Attempting HTTPS redirect to: ${httpsUrl}`);
                          window.location.href = httpsUrl;
                        }}
                        className="mt-2 px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                      >
                        🔒 Switch to HTTPS
                      </button>
                    </div>

                    {/* Manual Location Entry */}
                    <div className="mt-3 p-2 bg-orange-50 rounded border border-orange-200">
                      <p className="text-xs text-orange-800 font-semibold">Last Resort: Manual Location</p>
                      <p className="text-xs text-orange-700 mt-1">Enter your current location manually:</p>
                      <button
                        onClick={() => setShowManualEntry(!showManualEntry)}
                        className="mt-2 px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
                      >
                        📍 Enter Location Manually
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Location Entry Form */}
            {showManualEntry && (
              <div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h5 className="font-semibold text-orange-900 text-sm mb-3">📍 Manual Location Entry</h5>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-orange-800">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 19.0760"
                        value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-orange-800">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 72.8777"
                        value={manualLng}
                        onChange={(e) => setManualLng(e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
                    <p>💡 <strong>How to get your coordinates:</strong></p>
                    <p>• Open Maps app → Find your location → Tap & hold → Copy coordinates</p>
                    <p>• Or search "what is my location coordinates" in Safari</p>
                    <p>• Mumbai example: Lat: 19.0760, Lng: 72.8777</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={useManualLocation}
                      className="px-4 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors"
                    >
                      ✅ Use This Location
                    </button>
                    <button
                      onClick={() => setShowManualEntry(false)}
                      className="px-4 py-2 bg-gray-400 text-white text-sm rounded hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {locationPermission === 'denied' && !deviceInfo.includes('iOS - Safari') && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>To enable location:</strong><br/>
                  1. Click the location icon in your browser's address bar<br/>
                  2. Select "Allow" for location access<br/>
                  3. Refresh this page
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full ${isTracking ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
                <MapPin className={`w-6 h-6 ${isTracking ? 'text-green-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {isTracking ? 'Tracking Active' : 'Tracking Stopped'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isTracking ? 'Location sharing in progress' : 'Ready to start tracking'}
                </p>
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
          </div>

          {/* Location Info */}
          {locationData && (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Speed:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {formatSpeed(locationData.speed)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Accuracy:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {Math.round(locationData.accuracy)}m
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Last Update:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {formatTime(lastUpdateTime.current)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                  {error.includes('denied') && (
                    <p className="text-xs text-red-600 mt-1">
                      Click the location icon (🌐) in your browser's address bar and select "Allow"
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Comprehensive Debug Panel */}
          {(debugInfo || errorHistory.length > 0 || locationHistory.length > 0 || deviceInfo) && (
            <div className="mt-4 space-y-3">
              {/* Device Info */}
              {deviceInfo && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 mb-2 block">Device & Browser</span>
                  <p className="text-xs text-gray-600">{deviceInfo}</p>
                </div>
              )}

              {/* Connection Status */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Connection Status</span>
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <p className="text-xs text-blue-800">{connectionStatus}</p>
              </div>

              {/* Debug Log */}
              {debugInfo && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 mb-2 block">Debug Log</span>
                  <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">{debugInfo}</pre>
                </div>
              )}

              {/* Error History */}
              {errorHistory.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-sm font-medium text-red-700 mb-2 block">Recent Errors</span>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {errorHistory.map((error, index) => (
                      <p key={index} className="text-xs text-red-600 font-mono">{error}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Location History */}
              {locationHistory.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm font-medium text-green-700 mb-2 block">Location History (Last 5)</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {locationHistory.slice(-5).map((loc, index) => (
                      <div key={index} className="text-xs text-green-600 font-mono flex items-center justify-between">
                        <span>{new Date(loc.timestamp).toLocaleTimeString()}</span>
                        <span>±{loc.accuracy}m</span>
                        <div className={`w-2 h-2 rounded-full ${loc.transmitted ? 'bg-green-500' : 'bg-yellow-500'}`} title={loc.transmitted ? 'Sent' : 'Pending'}></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Battery Status */}
        {batteryLevel !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className={`w-5 h-5 ${batteryLevel > 20 ? 'text-green-600' : 'text-red-600'}`} />
                <span className="text-sm font-semibold text-gray-700">Battery</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-12 h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      batteryLevel > 20 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${batteryLevel}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{batteryLevel}%</span>
              </div>
            </div>
            {batteryLevel < 20 && (
              <p className="text-xs text-red-600 mt-2">Low battery! Consider charging your device.</p>
            )}
          </motion.div>
        )}

        {/* Control Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <button
            onClick={isTracking ? stopTracking : startTracking}
            disabled={!isConnected || (!jobId.trim() && !isTracking) || (locationPermission === 'denied' && !isTracking)}
            className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              isTracking
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                : locationPermission === 'granted'
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20'
                : 'bg-gray-400 text-white'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {isTracking ? (
                <>
                  <Power className="w-6 h-6" />
                  <span>Stop Tracking</span>
                </>
              ) : (
                <>
                  <Navigation className="w-6 h-6" />
                  <span>Start Tracking</span>
                </>
              )}
            </div>
          </button>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-50/80 backdrop-blur-sm rounded-2xl border border-blue-200/60 shadow-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Instructions</h4>
          </div>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• Enter your Job ID provided by dispatch</p>
            <p>• Allow location access when prompted</p>
            <p>• Keep this page open while driving</p>
            <p>• Contact dispatch if you experience issues</p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 text-xs text-gray-500"
        >
          <p>Your location is only shared during active tracking</p>
          <p>Logistics Platform • Driver App</p>
        </motion.div>
      </div>
    </main>
  );
}