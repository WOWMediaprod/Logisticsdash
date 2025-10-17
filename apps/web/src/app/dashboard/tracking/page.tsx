"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCompany } from "../../../contexts/CompanyContext";
import { useSocket } from "../../../contexts/SocketContext";

type TrackingJob = {
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
  etaTs?: string;
  estimatedTimeMinutes?: number;
};

type TrackingResponse = {
  success: boolean;
  data: TrackingJob[];
  summary: {
    totalJobs: number;
    withLocation: number;
    staleLocations: number;
  };
};

type LiveDriver = {
  trackerId: string;
  name: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: string;
  timeSinceUpdate: number;
  isStale: boolean;
};

type LiveDriverResponse = {
  success: boolean;
  data: LiveDriver[];
  summary: {
    totalTrackers: number;
    activeTrackers: number;
    staleTrackers: number;
  };
};

const statusColors: Record<string, string> = {
  ASSIGNED: "bg-blue-500",
  IN_TRANSIT: "bg-green-500",
  AT_PICKUP: "bg-yellow-500",
  LOADED: "bg-purple-500",
  AT_DELIVERY: "bg-orange-500",
};

const mapStatusColor = (status: string) => statusColors[status] || "#6B7280";

const formatEta = (etaTs?: string, estimatedTimeMinutes?: number) => {
  if (etaTs) {
    const etaDate = new Date(etaTs);
    const diffMinutes = Math.round((etaDate.getTime() - Date.now()) / (1000 * 60));
    if (diffMinutes <= 0) {
      return "Overdue";
    }
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  if (estimatedTimeMinutes !== undefined && estimatedTimeMinutes !== null) {
    const hours = Math.floor(estimatedTimeMinutes / 60);
    const minutes = estimatedTimeMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  return null;
};

const SummaryCard = ({ title, value, accent }: { title: string; value: number; accent: string }) => (
  <div className={`glass rounded-2xl px-5 py-4 border border-white/60 ${accent}`}>
    <p className="text-sm text-gray-600">{title}</p>
    <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
  </div>
);

export default function TrackingPage() {
  const { companyId } = useCompany();
  const { socket, isConnected, joinTracking } = useSocket();

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const driverMarkersRef = useRef<google.maps.Marker[]>([]);

  const [trackingData, setTrackingData] = useState<TrackingJob[]>([]);
  const [summary, setSummary] = useState<TrackingResponse["summary"] | null>(null);
  const [selectedJob, setSelectedJob] = useState<TrackingJob | null>(null);
  const [liveDrivers, setLiveDrivers] = useState<LiveDriver[]>([]);
  const [driverSummary, setDriverSummary] = useState<LiveDriverResponse["summary"] | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    return () => {
      // Cleanup map instance and markers on unmount
      if (mapInstanceRef.current) {
        markersRef.current.forEach((marker) => marker.setMap(null));
        driverMarkersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];
        driverMarkersRef.current = [];
        mapInstanceRef.current = null;
      }
      setMapLoaded(false);
      setMapError(null);
    };
  }, []);

  useEffect(() => {
    if (!companyId) {
      setTrackingData([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`/api/v1/tracking/active/${companyId}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        const data: TrackingResponse = await response.json();
        if (data.success) {
          setTrackingData(data.data);
          setSummary(data.summary);
          setSelectedJob((prev) => (prev ? prev : data.data[0] ?? null));
        } else {
          setTrackingData([]);
          setSummary(null);
        }
      } catch (err) {
        console.error("Failed to fetch tracking data", err);
        setTrackingData([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) {
      setLiveDrivers([]);
      setDriverSummary(null);
      return;
    }

    const fetchLiveDrivers = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`/api/v1/tracking/live-drivers/${companyId}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        const data: LiveDriverResponse = await response.json();
        if (data.success) {
          setLiveDrivers(data.data);
          setDriverSummary(data.summary);
        } else {
          setLiveDrivers([]);
          setDriverSummary(null);
        }
      } catch (err) {
        console.error("Failed to fetch live drivers data", err);
        setLiveDrivers([]);
        setDriverSummary(null);
      }
    };

    fetchLiveDrivers();
    const interval = setInterval(fetchLiveDrivers, 10000);
    return () => clearInterval(interval);
  }, [companyId]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    // Reset map state on fresh mount
    if (mapLoaded && !mapInstanceRef.current) {
      setMapLoaded(false);
      setMapError(null);
    }

    if (mapLoaded && mapInstanceRef.current) {
      return;
    }

    let cancelled = false;
    let rafId: number | null = null;

    const loadMap = async () => {
      if (mapLoaded || cancelled) {
        return;
      }

      if (!mapRef.current) {
        rafId = requestAnimationFrame(loadMap);
        return;
      }

      try {
        const rawApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        const trimmedApiKey = rawApiKey?.trim();
        if (!trimmedApiKey) {
          setMapError("Google Maps API key is not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.");
          setMapLoaded(true);
          return;
        }

        const apiKey = trimmedApiKey.replace(/\+/g, "%2B");
        const loader = new Loader({
          apiKey,
          version: "weekly",
        });

        console.log('🗺️ Loading Google Maps...');
        await loader.load();

        if (!mapRef.current || cancelled) {
          return;
        }

        console.log('🗺️ Creating map instance...');
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 19.076, lng: 72.8777 },
          zoom: 10,
          styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
        setMapError(null);
        console.log('✅ Google Maps loaded successfully');
      } catch (err) {
        console.error("❌ Failed to load Google Maps", err);
        setMapError("Unable to load Google Maps. Check your API key or network connection.");
        setMapLoaded(true);
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(loadMap, 100);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [mounted, mapLoaded]);

  useEffect(() => {
    if (!socket || !isConnected || !companyId) {
      return;
    }

    joinTracking(companyId);

    const handleLocationUpdate = (payload: { data: any }) => {
      setTrackingData((prev) =>
        prev.map((job) =>
          job.jobId === payload.data.jobId
            ? {
                ...job,
                lastLocation: {
                  lat: payload.data.lat,
                  lng: payload.data.lng,
                  timestamp: payload.data.timestamp,
                  speed: payload.data.speed,
                  timeSinceUpdate: 0,
                  isStale: false,
                },
              }
            : job
        )
      );
    };

    const handleStatusUpdate = (payload: { data: { jobId: string; status: string } }) => {
      setTrackingData((prev) => prev.map((job) => (job.jobId === payload.data.jobId ? { ...job, status: payload.data.status } : job)));
    };

    const handleLiveDriverUpdate = (payload: { data: LiveDriver }) => {
      setLiveDrivers((prev) => {
        const exists = prev.find((driver) => driver.trackerId === payload.data.trackerId);
        if (exists) {
          return prev.map((driver) =>
            driver.trackerId === payload.data.trackerId
              ? {
                  ...driver,
                  lat: payload.data.lat,
                  lng: payload.data.lng,
                  speed: payload.data.speed,
                  heading: payload.data.heading,
                  accuracy: payload.data.accuracy,
                  timestamp: payload.data.timestamp,
                  timeSinceUpdate: 0,
                  isStale: false,
                }
              : driver
          );
        }
        return [...prev, { ...payload.data, timeSinceUpdate: 0, isStale: false }];
      });
    };

    socket.on("location-update", handleLocationUpdate);
    socket.on("job-status-update", handleStatusUpdate);
    socket.on("live-driver-update", handleLiveDriverUpdate);

    return () => {
      socket.off("location-update", handleLocationUpdate);
      socket.off("job-status-update", handleStatusUpdate);
      socket.off("live-driver-update", handleLiveDriverUpdate);
    };
  }, [socket, isConnected, companyId, joinTracking]);

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) {
      return;
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    driverMarkersRef.current.forEach((marker) => marker.setMap(null));
    driverMarkersRef.current = [];

    trackingData.forEach((job) => {
      if (!job.lastLocation) {
        return;
      }

      const { lat, lng } = job.lastLocation;
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return;
      }

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current!,
        title: `${job.driver.name} - ${job.vehicle.regNo}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: mapStatusColor(job.status),
          fillOpacity: 0.85,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      const etaText = formatEta(job.etaTs, job.estimatedTimeMinutes);
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: sans-serif; font-size: 12px;">
            <strong>${job.driver.name}</strong><br />
            ${job.vehicle.regNo}<br />
            ${job.client.name}<br />
            Speed: ${job.lastLocation.speed} km/h<br />
            Updated: ${job.lastLocation.timeSinceUpdate} min ago<br />
            ${etaText ? `ETA: ${etaText}` : ""}
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(mapInstanceRef.current!, marker);
        setSelectedJob(job);
      });

      markersRef.current.push(marker);
    });

    liveDrivers.forEach((driver) => {
      const { lat, lng } = driver;
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return;
      }

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current!,
        title: `Live: ${driver.name}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: driver.isStale ? "#f59e0b" : "#dc2626",
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: sans-serif; font-size: 12px;">
            <strong>${driver.name}</strong><br />
            <em>Live driver</em><br />
            Speed: ${driver.speed ? Math.round(driver.speed * 3.6) : 0} km/h<br />
            Accuracy: ${driver.accuracy ? Math.round(driver.accuracy) : "N/A"} meters<br />
            Updated: ${driver.timeSinceUpdate} min ago<br />
            ${driver.isStale ? '<span style="color: orange;">Stale</span>' : '<span style="color: green;">Active</span>'}
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(mapInstanceRef.current!, marker);
      });

      driverMarkersRef.current.push(marker);
    });

    const allMarkers = [...markersRef.current, ...driverMarkersRef.current];
    if (allMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      allMarkers.forEach((marker) => bounds.extend(marker.getPosition()!));
      mapInstanceRef.current!.fitBounds(bounds);
    }
  }, [trackingData, liveDrivers, mapLoaded]);

  const trackingSummary = useMemo(() => {
    const totalJobs = summary?.totalJobs || 0;
    const withLocation = summary?.withLocation || 0;
    const staleLocations = summary?.staleLocations || 0;
    const totalTrackers = driverSummary?.totalTrackers || 0;
    const activeTrackers = driverSummary?.activeTrackers || 0;
    const staleTrackers = driverSummary?.staleTrackers || 0;

    return {
      totalJobs,
      withLocation,
      staleLocations,
      totalTrackers,
      activeTrackers,
      staleTrackers,
    };
  }, [summary, driverSummary]);

  if (!companyId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="glass max-w-xl mx-auto p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Company not selected</h1>
          <p className="text-gray-600">
            Choose a company to view tracking information. Provide a company identifier via the CompanyProvider or environment variable NEXT_PUBLIC_COMPANY_ID.
          </p>
        </div>
      </main>
    );
  }

  if (!mounted || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading live tracking...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live tracking</h1>
            <p className="text-gray-600">Real-time location monitoring for active jobs</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
              <span className="text-sm text-gray-600">{isConnected ? "Live" : "Offline"}</span>
            </div>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="grid md:grid-cols-5 gap-6">
          <SummaryCard title="Active jobs" value={trackingSummary.totalJobs} accent="bg-blue-50" />
          <SummaryCard title="With location" value={trackingSummary.withLocation} accent="bg-green-50" />
          <SummaryCard title="Stale jobs" value={trackingSummary.staleLocations} accent="bg-orange-50" />
          <SummaryCard title="Live drivers" value={trackingSummary.totalTrackers} accent="bg-red-50" />
          <SummaryCard title="Active drivers" value={trackingSummary.activeTrackers} accent="bg-emerald-50" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Live map</h2>
              <p className="text-sm text-gray-600">Real-time vehicle positions</p>
            </div>
            <div className="relative">
              <div ref={mapRef} className="w-full h-96 bg-gray-200" style={{ minHeight: "400px" }} />
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading map...</p>
                  </div>
                </div>
              )}
              {mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                  <div className="text-center p-4">
                    <p className="text-red-600 font-semibold mb-2">{mapError}</p>
                    <p className="text-sm text-red-500">Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the live map.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass rounded-2xl p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Active jobs</h2>
              <div className="space-y-3 max-h-[520px] overflow-y-auto">
                {trackingData.length === 0 && (
                  <p className="text-sm text-gray-500">No active jobs found.</p>
                )}
                {trackingData.map((job) => (
                  <motion.button
                    key={job.jobId}
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedJob(job)}
                    className={`w-full text-left p-4 rounded-xl border transition shadow-sm ${selectedJob?.jobId === job.jobId ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-white"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{job.client.name}</p>
                        <p className="text-base font-semibold text-gray-900">{job.route.origin} ? {job.route.destination}</p>
                      </div>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-900 text-white">
                        {job.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>Driver: <strong className="text-gray-800">{job.driver.name}</strong></span>
                      <span>Vehicle: <strong className="text-gray-800">{job.vehicle.regNo}</strong></span>
                    </div>
                    {job.lastLocation && (
                      <div className="mt-2 text-xs text-gray-500">
                        Updated {job.lastLocation.timeSinceUpdate} min ago � {job.lastLocation.speed} km/h
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Live drivers</h2>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {liveDrivers.length === 0 && (
                  <p className="text-sm text-gray-500">No live driver telemetry yet.</p>
                )}
                {liveDrivers.map((driver) => (
                  <div key={driver.trackerId} className="border border-gray-200 rounded-xl p-3 bg-white">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">{driver.name}</p>
                      <span className={`text-xs font-medium ${driver.isStale ? "text-orange-600" : "text-green-600"}`}>
                        {driver.isStale ? "Stale" : "Active"}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Updated {driver.timeSinceUpdate} min ago � Speed {driver.speed ? Math.round(driver.speed * 3.6) : 0} km/h
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


