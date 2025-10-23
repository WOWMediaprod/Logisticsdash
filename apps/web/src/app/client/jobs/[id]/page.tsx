"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader } from "@googlemaps/js-api-loader";
import { useCompany } from "../../../../contexts/CompanyContext";
import { useClientAuth } from "../../../../contexts/ClientAuthContext";
import { ArrowLeft, MapPin, Clock, Package, FileText, Receipt, Download, ExternalLink, X } from "lucide-react";
import WaypointManager from "../../../../components/WaypointManager";
import RouteProgressTimeline from "../../../../components/RouteProgressTimeline";
import { getApiUrl } from "../../../../lib/api-config";

type JobDetail = {
  id: string;
  status: string;
  jobType: string;
  priority: string;
  pickupTs?: string;
  etaTs?: string;
  dropTs?: string;
  createdAt: string;
  client?: {
    name: string;
    code: string;
  };
  route?: {
    code: string;
    origin: string;
    destination: string;
    kmEstimate: number;
  };
  container?: {
    id: string;
    iso: string;
    size: string;
    owner: string;
  };
  driver?: {
    name: string;
  };
  vehicle?: {
    regNo: string;
    make?: string;
    model?: string;
  };
  statusEvents?: Array<{
    id: string;
    code: string;
    timestamp: string;
    note?: string;
  }>;
  lastLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
    speed: number;
  };
  documents?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: string;
  }>;
  bill?: {
    id: string;
    invoiceNo: string;
    amount: number;
    tax: number;
    total: number;
    status: string;
    dueDate?: string;
    paidAt?: string;
    createdAt: string;
  };
};

const statusColors: Record<string, string> = {
  CREATED: "bg-gray-100 text-gray-800 border-gray-200",
  ASSIGNED: "bg-blue-100 text-blue-800 border-blue-200",
  IN_TRANSIT: "bg-yellow-100 text-yellow-800 border-yellow-200",
  AT_PICKUP: "bg-purple-100 text-purple-800 border-purple-200",
  LOADED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  AT_DELIVERY: "bg-orange-100 text-orange-800 border-orange-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-50 text-gray-600",
  NORMAL: "bg-blue-50 text-blue-600",
  HIGH: "bg-orange-50 text-orange-600",
  URGENT: "bg-red-50 text-red-600",
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-LK", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ClientJobDetailPage() {
  const params = useParams();
  const { companyId } = useCompany();
  const { clientId } = useClientAuth();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waypoints, setWaypoints] = useState<any[]>([]);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    setMounted(true);

    return () => {
      // Cleanup map instance and markers on unmount
      if (mapInstanceRef.current) {
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }
        mapInstanceRef.current = null;
      }
      setMapLoaded(false);
      setMapError(null);
    };
  }, []);

  useEffect(() => {
    if (!companyId || !clientId || !jobId) {
      setLoading(false);
      return;
    }

    const fetchJob = async () => {
      try {
        setLoading(true);
        setError(null);

        const backendUrl = process.env.NEXT_PUBLIC_API_URL_HTTPS || 'https://192.168.1.20:3004';
        const response = await fetch(`${backendUrl}/api/v1/jobs/${jobId}?companyId=${companyId}`, {
          headers: { 'Accept': 'application/json' }
        });
        const data = await response.json();

        if (data.success && data.data) {
          // Verify this job belongs to the client
          if (data.data.clientId === clientId) {
            setJob(data.data);
            // Fetch waypoints after job is loaded
            fetchWaypoints(data.data.id);
          } else {
            setError("You don't have access to this job");
          }
        } else {
          setError(data.error || "Unable to load job");
        }
      } catch (err) {
        console.error("Failed to fetch job", err);
        setError("Unable to load job");
      } finally {
        setLoading(false);
      }
    };

    const fetchWaypoints = async (jobId: string) => {
      try {
        const response = await fetch(getApiUrl(`/api/v1/waypoints?jobId=${jobId}`));
        const data = await response.json();
        if (data.success) {
          setWaypoints(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch waypoints", err);
      }
    };

    fetchJob();
  }, [companyId, clientId, jobId]);

  // Load Google Maps
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
          setMapError("Map tracking unavailable - API key missing");
          setMapLoaded(true);
          return;
        }

        const apiKey = trimmedApiKey.replace(/\+/g, "%2B");
        const loader = new Loader({
          apiKey,
          version: "weekly",
        });

        console.log('🗺️ Loading Google Maps for client...');
        await loader.load();

        if (!mapRef.current || cancelled) {
          return;
        }

        console.log('🗺️ Creating map instance...');
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 6.9271, lng: 79.8612 }, // Colombo, Sri Lanka
          zoom: 10,
          styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
        setMapError(null);
        console.log('✅ Google Maps loaded successfully');
      } catch (err) {
        console.error("❌ Failed to load Google Maps", err);
        setMapError("Unable to load map. Check your connection.");
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

  // Update marker when job location changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !job?.lastLocation) return;

    // Clear existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    const { lat, lng } = job.lastLocation;
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    // Create new marker
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: mapInstanceRef.current,
      title: job.vehicle?.regNo || "Vehicle location",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#3B82F6",
        fillOpacity: 0.9,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="font-family: sans-serif; font-size: 12px;">
          <strong>${job.vehicle?.regNo || "Vehicle"}</strong><br />
          Speed: ${job.lastLocation.speed} km/h<br />
          ${job.route ? `Route: ${job.route.origin} → ${job.route.destination}` : ""}
        </div>
      `,
    });

    marker.addListener("click", () => {
      infoWindow.open(mapInstanceRef.current!, marker);
    });

    markerRef.current = marker;

    // Center map on marker
    mapInstanceRef.current.setCenter({ lat, lng });
    mapInstanceRef.current.setZoom(12);
  }, [mapLoaded, job]);

  if (!companyId || !clientId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="glass max-w-xl mx-auto p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Access Required</h1>
          <p className="text-gray-600">Please log in to view job details.</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading job details...</span>
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="glass max-w-xl mx-auto p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Job unavailable</h1>
          <p className="text-gray-600 mb-6">{error || "We could not find this job."}</p>
          <Link href="/client" className="text-blue-600 font-semibold hover:underline">
            Back to client portal
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/client" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Portal
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Job Details</h1>
            <p className="text-gray-600">Track your shipment progress and details</p>
          </div>
        </div>

        {/* Route Progress Timeline - Animated Truck Progress */}
        {waypoints.length > 0 && (
          <RouteProgressTimeline
            waypoints={waypoints}
            currentLocation={job.lastLocation}
            jobStatus={job.status}
          />
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status and Info Card */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-2xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold border ${statusColors[job.status] || statusColors.CREATED}`}>
                    {job.status.replace("_", " ")}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Priority</p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${priorityColors[job.priority] || priorityColors.NORMAL}`}>
                    {job.priority}
                  </div>
                </div>
              </div>

              {/* Route Information */}
              {job.route && (
                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 mb-2">Route</p>
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-medium">{job.route.origin}</span>
                        <span>→</span>
                        <span className="font-medium">{job.route.destination}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{job.route.kmEstimate} km • {job.route.code}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 mb-1">Pickup</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(job.pickupTs)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 mb-1">Expected Delivery</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(job.etaTs)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 mb-1">Delivered</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(job.dropTs)}</p>
                </div>
              </div>

              {/* Container Info */}
              {job.container && (
                <div className="mt-4 bg-purple-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">Container</p>
                      <p className="text-sm text-gray-700">{job.container.iso} • {job.container.size}</p>
                      <p className="text-xs text-gray-600 mt-1">Owner: {job.container.owner}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Live Tracking Map */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-2xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Live Tracking
              </h2>
              <div className="relative bg-gray-100 rounded-xl overflow-hidden" style={{ height: '400px' }}>
                <div ref={mapRef} className="w-full h-full" />
                {!mapLoaded && !mapError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading map...</p>
                    </div>
                  </div>
                )}
                {mapError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <div className="text-center p-4">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">{mapError}</p>
                      {job.route && (
                        <p className="text-xs text-gray-400 mt-1">
                          {job.route.origin} → {job.route.destination}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {mapLoaded && !mapError && !job.lastLocation && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-none">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Waiting for location update...</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Timeline/Status Events */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-2xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Shipment Timeline
              </h2>
              <div className="space-y-3">
                {job.statusEvents && job.statusEvents.length > 0 ? (
                  job.statusEvents.map((event) => (
                    <div key={event.id} className="flex items-start justify-between p-3 bg-white/70 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{event.code.replace("_", " ")}</p>
                        {event.note && <p className="text-xs text-gray-600 mt-1">{event.note}</p>}
                      </div>
                      <p className="text-xs text-gray-500">{formatDateTime(event.timestamp)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No updates yet.</p>
                )}
              </div>
            </motion.div>

            {/* Route Waypoints - Read-only view for client */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-2xl">
              <WaypointManager jobId={job.id} readOnly={true} />
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-2xl space-y-6">
            {/* Driver & Vehicle Info */}
            {(job.driver || job.vehicle) && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Assignment Details</h2>
                {job.driver && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-3">
                    <p className="text-xs text-gray-600 mb-1">Driver</p>
                    <p className="text-sm font-semibold text-gray-900">{job.driver.name}</p>
                  </div>
                )}
                {job.vehicle && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-600 mb-1">Vehicle</p>
                    <p className="text-sm font-semibold text-gray-900">{job.vehicle.regNo}</p>
                    {(job.vehicle.make || job.vehicle.model) && (
                      <p className="text-xs text-gray-600 mt-1">
                        {[job.vehicle.make, job.vehicle.model].filter(Boolean).join(" ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Documents */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documents
              </h2>
              <div className="space-y-2">
                {job.documents && job.documents.length > 0 ? (
                  job.documents.map((doc) => (
                    <div key={doc.id} className="p-3 bg-white/70 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium flex-shrink-0 ml-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">No documents available yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* View Invoice Button */}
            <div>
              {job.bill ? (
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  <Receipt className="w-5 h-5" />
                  View Invoice
                </button>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 bg-gray-300 text-gray-500 px-4 py-3 rounded-lg font-semibold cursor-not-allowed">
                  <Receipt className="w-5 h-5" />
                  Invoice Not Generated
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Invoice Modal */}
        {showInvoiceModal && job.bill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowInvoiceModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Invoice Number */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Invoice Number:</span>
                  <span className="font-semibold text-gray-900">{job.bill.invoiceNo}</span>
                </div>

                {/* Status */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    job.bill.status === 'PAID'
                      ? 'bg-green-100 text-green-800'
                      : job.bill.status === 'OVERDUE'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {job.bill.status}
                  </span>
                </div>

                {/* Amount */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="font-semibold text-gray-900">LKR {Number(job.bill.amount).toLocaleString()}</span>
                </div>

                {/* Tax */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Tax:</span>
                  <span className="font-semibold text-gray-900">LKR {Number(job.bill.tax).toLocaleString()}</span>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4">
                  <span className="text-base font-semibold text-green-900">Total:</span>
                  <span className="text-xl font-bold text-green-900">LKR {Number(job.bill.total).toLocaleString()}</span>
                </div>

                {/* Due Date */}
                {job.bill.dueDate && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Due Date:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(job.bill.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {/* Paid Date */}
                {job.bill.paidAt && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Paid On:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(job.bill.paidAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {/* Created Date */}
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm text-gray-500">
                    {new Date(job.bill.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Print
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
}
