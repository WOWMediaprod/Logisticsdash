'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  Clock,
  Navigation,
  Package,
  FileText,
  AlertTriangle,
  ChevronRight,
  Truck,
  User,
  Calendar,
  DollarSign,
  Upload,
  Camera,
  ExternalLink,
  Play,
  Square,
  Loader2,
  X,
  Download,
  FileDown,
  Weight,
  Anchor,
  Phone,
} from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import { CollapsibleSection } from '@/components/driver/CollapsibleSection';
import { CountdownTimer } from '@/components/driver/CountdownTimer';
import { ContactCard } from '@/components/driver/ContactCard';

type WaypointType = 'PICKUP' | 'DELIVERY' | 'CHECKPOINT' | 'REST_STOP' | 'YARD' | 'PORT';

interface Waypoint {
  id: string;
  jobId: string;
  name: string;
  type: WaypointType;
  sequence: number;
  lat: number | null;
  lng: number | null;
  address: string | null;
  radiusM: number;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
}

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  type: string;
  createdAt: string;
}

interface Earning {
  id: string;
  baseAmount: number;
  distanceBonus: number | null;
  timeBonus: number | null;
  nightShiftBonus: number | null;
  totalAmount: number;
  currency: string;
  status: string;
  paidAt: string | null;
}

interface Job {
  id: string;
  status: string;
  priority: string;
  pickupTs: string | null;
  etaTs: string | null;
  dropTs: string | null;
  specialNotes: string | null;
  // Shipment Details (17 fields)
  releaseOrderUrl?: string;
  loadingLocation?: string;
  loadingLocationLat?: number;
  loadingLocationLng?: number;
  loadingContactName?: string;
  loadingContactPhone?: string;
  containerNumber?: string;
  sealNumber?: string;
  containerYardLocation?: string;
  cargoDescription?: string;
  cargoWeight?: number;
  blCutoffRequired?: boolean;
  blCutoffDateTime?: string;
  wharfName?: string;
  wharfContact?: string;
  deliveryAddress?: string;
  deliveryContactName?: string;
  deliveryContactPhone?: string;
  client?: {
    id: string;
    name: string;
  };
  vehicle?: {
    regNo: string;
  };
  container?: {
    iso: string;
    size: string;
  };
  documents?: Document[];
  waypoints?: Waypoint[];
  earnings?: Earning[];
}

const WAYPOINT_TYPE_CONFIG: Record<WaypointType, { label: string; icon: React.ReactNode; color: string }> = {
  PICKUP: { label: 'Pickup', icon: <MapPin className="w-4 h-4" />, color: 'bg-green-500' },
  DELIVERY: { label: 'Delivery', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-red-500' },
  CHECKPOINT: { label: 'Checkpoint', icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-yellow-500' },
  REST_STOP: { label: 'Rest Stop', icon: <Clock className="w-4 h-4" />, color: 'bg-gray-500' },
  YARD: { label: 'Container Yard', icon: <Package className="w-4 h-4" />, color: 'bg-blue-500' },
  PORT: { label: 'Port', icon: <Package className="w-4 h-4" />, color: 'bg-purple-500' },
};

export default function DriverJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [driver, setDriver] = useState<any>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState<string>('');
  const [locationCount, setLocationCount] = useState(0);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [showEarningsModal, setShowEarningsModal] = useState(false);

  useEffect(() => {
    // Check if driver is logged in
    const driverSession = localStorage.getItem('driver_session');
    if (!driverSession) {
      router.push('/driver');
      return;
    }

    const parsedDriver = JSON.parse(driverSession);
    setDriver(parsedDriver);

    // Fetch job details
    fetchJobDetails(parsedDriver.companyId);
  }, [jobId]);

  const fetchJobDetails = async (companyId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/v1/jobs/${jobId}?companyId=${companyId}`));
      const result = await response.json();

      if (result.success) {
        setJob(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (waypointId: string) => {
    setCheckingIn(waypointId);
    try {
      const response = await fetch(getApiUrl(`/api/v1/waypoints/${waypointId}/complete`), {
        method: 'PATCH',
      });

      const result = await response.json();

      if (result.success && driver) {
        // Refresh job details
        fetchJobDetails(driver.companyId);
      }
    } catch (error) {
      console.error('Failed to check in:', error);
    } finally {
      setCheckingIn(null);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    if (!driver) {
      alert('Driver information not available');
      return;
    }

    setTracking(true);
    setLocationCount(0);

    // Get location every 30 seconds
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const locationData = {
          jobId,
          driverId: driver.id,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0,
          timestamp: new Date().toISOString(),
          source: 'MOBILE_GPS',
        };

        try {
          const response = await fetch(getApiUrl('/api/v1/tracking/location'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(locationData),
          });

          if (response.ok) {
            setLocationCount(prev => prev + 1);
            setLastLocation(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)} @ ${new Date().toLocaleTimeString()}`);
          }
        } catch (error) {
          console.error('Failed to send location:', error);
        }
      },
      (error) => {
        console.error('GPS Error:', error.message);
        setTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    (window as any).gpsWatchId = watchId;
  };

  const stopTracking = () => {
    if ((window as any).gpsWatchId) {
      navigator.geolocation.clearWatch((window as any).gpsWatchId);
    }
    setTracking(false);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setPhotos(prev => [...prev, ...files]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPODPhotos = async () => {
    if (photos.length === 0) {
      alert('Please select at least one photo');
      return;
    }

    setUploadingPhotos(true);

    try {
      const formData = new FormData();
      photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      // TODO: Implement actual upload endpoint
      // const response = await fetch(getApiUrl(`/api/v1/jobs/${jobId}/pod-photos`), {
      //   method: 'POST',
      //   body: formData,
      // });

      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      alert('Photos uploaded successfully!');
      setPhotos([]);
    } catch (error) {
      console.error('Failed to upload photos:', error);
      alert('Failed to upload photos');
    } finally {
      setUploadingPhotos(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Job not found</p>
          <button
            onClick={() => router.push('/driver/dashboard')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const nextWaypoint = job.waypoints?.find(w => !w.isCompleted);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/driver/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Job Details</h1>
              <p className="text-sm text-gray-600">Job ID: {jobId.substring(0, 8)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Job Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">{job.client?.name || 'Unknown Client'}</h2>
              </div>
              {/* Route information removed - using waypoints instead */}
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {job.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            {job.pickupTs && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Pickup</p>
                  <p className="font-semibold">{new Date(job.pickupTs).toLocaleString('en-LK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            )}
            {job.vehicle && (
              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Vehicle</p>
                  <p className="font-semibold">{job.vehicle.regNo}</p>
                </div>
              </div>
            )}
            {job.container && (
              <div className="flex items-center gap-2 text-sm col-span-2">
                <Package className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Container</p>
                  <p className="font-semibold">{job.container.iso} ({job.container.size})</p>
                </div>
              </div>
            )}
          </div>

          {job.specialNotes && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800"><strong>Special Notes:</strong> {job.specialNotes}</p>
            </div>
          )}
        </div>

        {/* Release Order Section - Always show at top */}
        {(() => {
          const releaseOrderDoc = job.documents?.find(doc => doc.type === 'RELEASE_ORDER');
          if (!releaseOrderDoc) return null;

          return (
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 bg-red-50">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(getApiUrl(`/api/v1/documents/${releaseOrderDoc.id}/download`));
                    const data = await response.json();
                    if (data.success && data.data.url) {
                      window.open(data.data.url, '_blank');
                    } else {
                      alert('Failed to get release order URL');
                    }
                  } catch (error) {
                    console.error('Error fetching release order:', error);
                    alert('Failed to load release order');
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileDown className="w-5 h-5" />
                  View Release Order
                </span>
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>
          );
        })()}

        {/* BL Cutoff Warning - Show prominently if applicable and urgent */}
        {job.blCutoffRequired && job.blCutoffDateTime && (
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <div className="space-y-3">
              <CountdownTimer
                targetDate={job.blCutoffDateTime}
                urgentThresholdHours={24}
              />
              <div className="pt-2 border-t border-red-100">
                <p className="text-sm text-gray-700">
                  <strong>BL Cutoff Date & Time:</strong> {new Date(job.blCutoffDateTime).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Details Section */}
        <CollapsibleSection
          title="Loading Details"
          icon={<MapPin className="w-5 h-5" />}
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
          defaultOpen={true}
        >
          <div className="space-y-3">
            {job.loadingLocation && (
              <div>
                <p className="text-gray-600 font-medium mb-1">📍 Loading Location</p>
                <p className="text-gray-800">{job.loadingLocation}</p>
                {job.loadingLocationLat && job.loadingLocationLng && (
                  <p className="text-xs text-gray-500 mt-1">
                    Coordinates: {job.loadingLocationLat.toFixed(4)}, {job.loadingLocationLng.toFixed(4)}
                  </p>
                )}
              </div>
            )}
            <ContactCard
              name={job.loadingContactName}
              phone={job.loadingContactPhone}
              type="loading"
            />
            {job.pickupTs && (
              <div>
                <p className="text-gray-600 font-medium mb-1">📅 Loading Date</p>
                <p className="text-gray-800">{new Date(job.pickupTs).toLocaleDateString()}</p>
              </div>
            )}
            {job.pickupTs && (
              <div>
                <p className="text-gray-600 font-medium mb-1">⏰ Loading Time</p>
                <p className="text-gray-800">{new Date(job.pickupTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Container & Cargo Details Section */}
        {(job.containerNumber || job.cargoDescription || job.cargoWeight) && (
          <CollapsibleSection
            title="Container & Cargo Details"
            icon={<Package className="w-5 h-5" />}
            bgColor="bg-purple-50"
            borderColor="border-purple-200"
            defaultOpen={true}
          >
            <div className="space-y-3">
              {job.containerNumber && (
                <div>
                  <p className="text-gray-600 font-medium mb-1">📦 Container Number</p>
                  <p className="text-gray-800 font-mono">{job.containerNumber}</p>
                </div>
              )}
              {job.sealNumber && (
                <div>
                  <p className="text-gray-600 font-medium mb-1">🔒 Seal Number</p>
                  <p className="text-gray-800 font-mono">{job.sealNumber}</p>
                </div>
              )}
              {job.containerYardLocation && (
                <div>
                  <p className="text-gray-600 font-medium mb-1">🏭 Yard Location</p>
                  <p className="text-gray-800">{job.containerYardLocation}</p>
                </div>
              )}
              {job.cargoDescription && (
                <div>
                  <p className="text-gray-600 font-medium mb-1">📋 Cargo Description</p>
                  <p className="text-gray-800">{job.cargoDescription}</p>
                </div>
              )}
              {job.cargoWeight && (
                <div className="flex items-center gap-2">
                  <Weight className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-gray-600 font-medium">Cargo Weight</p>
                    <p className="text-gray-800">{job.cargoWeight} kg</p>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Wharf Details Section */}
        {(job.wharfName || job.wharfContact) && (
          <CollapsibleSection
            title="Wharf Details"
            icon={<Anchor className="w-5 h-5" />}
            bgColor="bg-cyan-50"
            borderColor="border-cyan-200"
            defaultOpen={false}
          >
            <div className="space-y-3">
              {job.wharfName && (
                <div>
                  <p className="text-gray-600 font-medium mb-1">🚢 Wharf Name</p>
                  <p className="text-gray-800">{job.wharfName}</p>
                </div>
              )}
              {job.wharfContact && (
                <div>
                  <p className="text-gray-600 font-medium mb-1">Wharf Contact</p>
                  <a
                    href={`tel:${job.wharfContact}`}
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    {job.wharfContact}
                  </a>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Delivery Details Section */}
        {(job.deliveryAddress || job.deliveryContactName || job.deliveryContactPhone) && (
          <CollapsibleSection
            title="Delivery Details"
            icon={<CheckCircle className="w-5 h-5" />}
            bgColor="bg-gray-50"
            borderColor="border-gray-200"
            defaultOpen={false}
          >
            <div className="space-y-3">
              {job.deliveryAddress && (
                <div>
                  <p className="text-gray-600 font-medium mb-1">📍 Delivery Address</p>
                  <p className="text-gray-800">{job.deliveryAddress}</p>
                </div>
              )}
              <ContactCard
                name={job.deliveryContactName}
                phone={job.deliveryContactPhone}
                type="delivery"
              />
              {job.dropTs && (
                <div>
                  <p className="text-gray-600 font-medium mb-1">Expected Delivery</p>
                  <p className="text-gray-800">{new Date(job.dropTs).toLocaleString()}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* GPS Tracking Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            GPS Tracking
          </h3>

          <div className="space-y-4">
            {!tracking ? (
              <button
                onClick={startTracking}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start GPS Tracking
              </button>
            ) : (
              <button
                onClick={stopTracking}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Square className="w-5 h-5" />
                Stop Tracking
              </button>
            )}

            {locationCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <div className="font-medium text-blue-800">Location Updates Sent: {locationCount}</div>
                {lastLocation && (
                  <div className="text-blue-700 font-mono text-xs mt-1">{lastLocation}</div>
                )}
              </div>
            )}

            {tracking && (
              <div className="text-xs text-gray-500 space-y-1">
                <div>• Location updates sent automatically</div>
                <div>• Keep this page open while driving</div>
                <div>• Ensure GPS is enabled on your device</div>
              </div>
            )}
          </div>
        </div>

        {/* Waypoints */}
        {job.waypoints && job.waypoints.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Route Waypoints ({job.waypoints.filter(w => w.isCompleted).length}/{job.waypoints.length} completed)
            </h3>

            <div className="space-y-3">
              {job.waypoints.map((waypoint, index) => {
                const isCurrent = nextWaypoint?.id === waypoint.id;

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
                    {index < job.waypoints!.length - 1 && (
                      <div className="absolute left-6 top-full h-3 w-0.5 bg-gray-300 z-0" />
                    )}

                    <div className="p-4 relative z-10">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 font-bold text-lg ${
                            waypoint.isCompleted
                              ? 'bg-green-500 border-green-600 text-white'
                              : isCurrent
                              ? 'bg-blue-500 border-blue-600 text-white animate-pulse'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          {waypoint.isCompleted ? <CheckCircle className="w-6 h-6" /> : waypoint.sequence}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-gray-900">{waypoint.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{waypoint.address}</p>
                            </div>
                            <div
                              className={`px-2 py-1 rounded-md text-xs font-medium text-white ${WAYPOINT_TYPE_CONFIG[waypoint.type].color} flex items-center gap-1`}
                            >
                              {WAYPOINT_TYPE_CONFIG[waypoint.type].icon}
                              <span className="hidden sm:inline">{WAYPOINT_TYPE_CONFIG[waypoint.type].label}</span>
                            </div>
                          </div>

                          {waypoint.isCompleted && waypoint.completedAt && (
                            <div className="mt-2 flex items-center gap-1 text-sm text-green-700">
                              <CheckCircle className="w-4 h-4" />
                              Completed: {new Date(waypoint.completedAt).toLocaleString('en-LK')}
                            </div>
                          )}

                          {isCurrent && !waypoint.isCompleted && (
                            <div className="mt-3">
                              <button
                                onClick={() => handleCheckIn(waypoint.id)}
                                disabled={checkingIn === waypoint.id}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                              >
                                {checkingIn === waypoint.id ? (
                                  <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Checking In...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-5 h-5" />
                                    Check In at This Location
                                  </>
                                )}
                              </button>
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
            </div>
          </div>
        )}

        {/* Documents */}
        {job.documents && job.documents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Documents
            </h3>
            <div className="space-y-2">
              {job.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.fileName}</p>
                      <p className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString('en-LK')}</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(getApiUrl(`/api/v1/documents/${doc.id}/download`));
                        const data = await response.json();
                        if (data.success && data.data.url) {
                          window.open(data.data.url, '_blank');
                        } else {
                          alert('Failed to get document URL');
                        }
                      } catch (error) {
                        console.error('Error fetching document:', error);
                        alert('Failed to load document');
                      }
                    }}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proof of Delivery Photos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Proof of Delivery
          </h3>

          <div className="space-y-4">
            <input
              type="file"
              id="photo-upload"
              multiple
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            <label
              htmlFor="photo-upload"
              className="block w-full py-3 px-6 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm text-gray-600">Tap to take/upload photos</span>
            </label>

            {photos.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`POD ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={uploadPODPhotos}
                  disabled={uploadingPhotos}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  {uploadingPhotos ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload {photos.length} Photo{photos.length > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Earnings */}
        {job.earnings && job.earnings.length > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Your Earnings
            </h3>

            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-green-100 text-sm">Total Amount</p>
                <p className="text-4xl font-bold">
                  {job.earnings[0].currency} {job.earnings[0].totalAmount.toLocaleString()}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                job.earnings[0].status === 'PAID' ? 'bg-white text-green-600' : 'bg-green-400 text-white'
              }`}>
                {job.earnings[0].status}
              </div>
            </div>

            <button
              onClick={() => setShowEarningsModal(true)}
              className="w-full bg-white/20 backdrop-blur-sm text-white py-2 px-4 rounded-lg font-semibold hover:bg-white/30 transition-colors"
            >
              View Breakdown
            </button>
          </div>
        )}
      </div>

      {/* Earnings Breakdown Modal */}
      {showEarningsModal && job.earnings && job.earnings.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowEarningsModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Earnings Breakdown</h2>
              <button onClick={() => setShowEarningsModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600">Base Amount</span>
                <span className="font-semibold text-gray-900">{job.earnings[0].currency} {job.earnings[0].baseAmount.toLocaleString()}</span>
              </div>

              {job.earnings[0].distanceBonus !== null && job.earnings[0].distanceBonus > 0 && (
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Distance Bonus</span>
                  <span className="font-semibold text-green-600">+{job.earnings[0].currency} {job.earnings[0].distanceBonus.toLocaleString()}</span>
                </div>
              )}

              {job.earnings[0].timeBonus !== null && job.earnings[0].timeBonus > 0 && (
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Time Bonus</span>
                  <span className="font-semibold text-green-600">+{job.earnings[0].currency} {job.earnings[0].timeBonus.toLocaleString()}</span>
                </div>
              )}

              {job.earnings[0].nightShiftBonus !== null && job.earnings[0].nightShiftBonus > 0 && (
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Night Shift Bonus</span>
                  <span className="font-semibold text-green-600">+{job.earnings[0].currency} {job.earnings[0].nightShiftBonus.toLocaleString()}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t-2 border-gray-300">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-green-600">{job.earnings[0].currency} {job.earnings[0].totalAmount.toLocaleString()}</span>
              </div>

              {job.earnings[0].paidAt && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  <strong>Paid on:</strong> {new Date(job.earnings[0].paidAt).toLocaleDateString('en-LK', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
