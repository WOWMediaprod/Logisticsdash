"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCompany } from "../../../../contexts/CompanyContext";
import { getApiUrl } from "../../../../lib/api-config";
import WaypointManagement from "../../../../components/WaypointManagement";

type RelatedEntity = {
  id: string;
  name: string;
  code?: string;
};

type RouteInfo = {
  code: string;
  origin: string;
  destination: string;
  kmEstimate: number;
};

type VehicleInfo = {
  id: string;
  regNo: string;
  make?: string;
  model?: string;
  class?: string;
};

type DriverInfo = {
  id: string;
  name: string;
  phone?: string;
  licenseNo?: string;
};

type ContainerInfo = {
  id: string;
  iso: string;
  size: string;
  owner: string;
  checkOk: boolean;
};

type StatusEvent = {
  id: string;
  code: string;
  timestamp: string;
  note?: string;
  source: string;
};

type DocumentInfo = {
  id: string;
  fileName: string;
  fileUrl: string;
  type: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  creator?: {
    firstName: string;
    lastName: string;
  } | null;
};

type JobDetail = {
  id: string;
  status: string;
  jobType: string;
  priority: string;
  specialNotes?: string;
  pickupTs?: string;
  etaTs?: string;
  dropTs?: string;
  createdAt: string;
  updatedAt: string;
  routeId?: string;
  client?: RelatedEntity;
  route?: RouteInfo;
  container?: ContainerInfo;
  driver?: DriverInfo;
  vehicle?: VehicleInfo;
  statusEvents?: StatusEvent[];
};

type OptionItem = {
  id: string;
  label: string;
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

const jobTypeLabels: Record<string, string> = {
  ONE_WAY: "One way",
  ROUND_TRIP: "Round trip",
  MULTI_STOP: "Multi stop",
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getDocumentIcon = (mimeType: string) => {
  if (mimeType.includes('pdf')) {
    return (
      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  if (mimeType.includes('image')) {
    return (
      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
};

export default function JobDetailPage() {
  const params = useParams();
  const { companyId } = useCompany();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [assignProgress, setAssignProgress] = useState(0);
  const [isAssigning, setIsAssigning] = useState(false);

  const [vehicles, setVehicles] = useState<OptionItem[]>([]);
  const [drivers, setDrivers] = useState<OptionItem[]>([]);
  const [containers, setContainers] = useState<OptionItem[]>([]);

  const [assignmentData, setAssignmentData] = useState({
    vehicleId: "",
    driverId: "",
    containerId: "",
  });

  useEffect(() => {
    if (!companyId || !jobId) {
      setLoading(false);
      return;
    }

    const fetchJob = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(getApiUrl(`/api/v1/jobs/${jobId}?companyId=${companyId}`), {
          headers: { 'Accept': 'application/json' }
        });
        const data = await response.json();

        if (data.success) {
          setJob(data.data);
          setAssignmentData({
            vehicleId: data.data.vehicleId || "",
            driverId: data.data.driverId || "",
            containerId: data.data.containerId || "",
          });
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

    fetchJob();
  }, [companyId, jobId]);

  useEffect(() => {
    if (!companyId || !jobId) {
      return;
    }

    const fetchDocuments = async () => {
      try {
        setDocumentsLoading(true);
        setDocumentsError(null);

        const response = await fetch(
          getApiUrl(`/api/v1/documents?companyId=${companyId}&jobId=${jobId}`),
          { headers: { 'Accept': 'application/json' } }
        );
        const data = await response.json();

        if (data.success) {
          setDocuments(data.data || []);
        } else {
          setDocumentsError(data.error || "Failed to load documents");
        }
      } catch (err) {
        console.error("Failed to fetch documents", err);
        setDocumentsError("Failed to load documents");
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchDocuments();
  }, [companyId, jobId]);

  const loadAssignmentOptions = async () => {
    if (!companyId) {
      return;
    }

    try {
      const [vehiclesRes, driversRes, containersRes] = await Promise.all([
        fetch(getApiUrl(`/api/v1/vehicles?companyId=${companyId}`)),
        fetch(getApiUrl(`/api/v1/drivers?companyId=${companyId}`)),
        fetch(getApiUrl(`/api/v1/containers?companyId=${companyId}`)),
      ]);

      const [vehiclesData, driversData, containersData] = await Promise.all([
        vehiclesRes.json(),
        driversRes.json(),
        containersRes.json(),
      ]);

      if (vehiclesData.success) {
        setVehicles(
          vehiclesData.data.map((item: any) => ({
            id: item.id,
            label: `${item.regNo} - ${[item.make, item.model].filter(Boolean).join(" ")}`.trim(),
          }))
        );
      }

      if (driversData.success) {
        setDrivers(
          driversData.data.map((item: any) => ({
            id: item.id,
            label: item.phone ? `${item.name} (${item.phone})` : item.name,
          }))
        );
      }

      if (containersData.success) {
        setContainers(
          containersData.data.map((item: any) => ({
            id: item.id,
            label: `${item.iso} - ${item.size} (${item.owner})${item.checkOk ? "" : " [check pending]"}`,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch assignment data", err);
    }
  };


  const handleAssignmentUpdate = async () => {
    if (!job || !companyId) {
      return;
    }

    setIsAssigning(true);
    setAssignProgress(0);

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setAssignProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    setUpdating(true);
    try {
      const response = await fetch(getApiUrl(`/api/v1/jobs/${job.id}/assign`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          vehicleId: assignmentData.vehicleId || null,
          driverId: assignmentData.driverId || null,
          containerId: assignmentData.containerId || null,
        }),
      });

      const result = await response.json();

      clearInterval(progressInterval);
      setAssignProgress(100);

      if (result.success) {
        setTimeout(() => {
          setJob(result.data);
          setAssignmentModalOpen(false);
          setIsAssigning(false);
          setAssignProgress(0);
        }, 500);
      } else {
        console.error("Failed to update assignment", result.error);
        setIsAssigning(false);
        setAssignProgress(0);
      }
    } catch (err) {
      console.error("Failed to update assignment", err);
      clearInterval(progressInterval);
      setIsAssigning(false);
      setAssignProgress(0);
    } finally {
      setUpdating(false);
    }
  };


  if (!companyId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="glass max-w-xl mx-auto p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Company not selected</h1>
          <p className="text-gray-600">
            Choose a company to view job details. Provide a company identifier via the CompanyProvider or environment variable NEXT_PUBLIC_COMPANY_ID.
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading job...</span>
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="glass max-w-xl mx-auto p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Job unavailable</h1>
          <p className="text-gray-600 mb-6">{error || "We could not find this job for the selected company."}</p>
          <Link href="/dashboard" className="text-blue-600 font-semibold hover:underline">
            Back to dashboard
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
            <h1 className="text-3xl font-bold text-gray-900">Job {job.id.slice(-8)}</h1>
            <p className="text-gray-600">Manage job progress, assignments, and supporting documents.</p>
          </div>
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
            Back to dashboard
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-2xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold border ${statusColors[job.status] || statusColors.CREATED}`}>
                    {job.status.replace("_", " ")}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${priorityColors[job.priority] || priorityColors.NORMAL}`}>
                    {job.priority}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <div className="px-3 py-1 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700">
                    {jobTypeLabels[job.jobType] || job.jobType}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Client</p>
                  <p className="font-semibold text-gray-900">
                    {job.client?.name || "Not assigned"}
                    {job.client?.code ? ` (${job.client.code})` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Route</p>
                  <p className="font-semibold text-gray-900">
                    {job.route ? `${job.route.origin} -> ${job.route.destination}` : "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Container</p>
                  <p className="font-semibold text-gray-900">{job.container?.iso || "Not assigned"}</p>
                </div>
              </div>

              <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Pickup</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(job.pickupTs)}</p>
                </div>
                <div>
                  <p className="text-gray-500">ETA</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(job.etaTs)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Delivered</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(job.dropTs)}</p>
                </div>
              </div>

              {job.specialNotes && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-sm font-semibold text-yellow-700">Special notes</p>
                  <p className="text-sm text-yellow-800 mt-1 whitespace-pre-line">{job.specialNotes}</p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <motion.button
                  onClick={async () => {
                    if (!job.driver) {
                      await loadAssignmentOptions();
                      setAssignmentModalOpen(true);
                    }
                  }}
                  whileHover={{ scale: job.driver ? 1 : 1.02 }}
                  whileTap={{ scale: job.driver ? 1 : 0.98 }}
                  disabled={!!job.driver}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    job.driver
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {job.driver ? 'Driver Assigned' : 'Assign to driver'}
                </motion.button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-2xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-3">
                {job.statusEvents && job.statusEvents.length > 0 ? (
                  job.statusEvents.map((event) => (
                    <div key={event.id} className="flex items-start justify-between p-3 bg-white/70 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{event.code.replace("_", " ")}</p>
                        {event.note && <p className="text-xs text-gray-600 mt-1">{event.note}</p>}
                        <p className="text-xs text-gray-400 mt-1">Source: {event.source}</p>
                      </div>
                      <p className="text-xs text-gray-500">{formatDateTime(event.timestamp)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No status events yet.</p>
                )}
              </div>
            </motion.div>

            {job.routeId && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-2xl">
                <WaypointManagement jobId={job.id} routeId={job.routeId} />
              </motion.div>
            )}
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-2xl space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Driver</h2>
              {job.driver ? (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-900">{job.driver.name}</p>
                  {job.driver.phone && <p className="text-sm text-gray-600">{job.driver.phone}</p>}
                  {job.driver.licenseNo && <p className="text-xs text-gray-500 mt-1">License: {job.driver.licenseNo}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No driver assigned.</p>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Vehicle</h2>
              {job.vehicle ? (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-900">{job.vehicle.regNo}</p>
                  <p className="text-sm text-gray-600">{[job.vehicle.make, job.vehicle.model].filter(Boolean).join(" ")}</p>
                  {job.vehicle.class && <p className="text-xs text-gray-500 mt-1">Class: {job.vehicle.class}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No vehicle assigned.</p>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Documents</h2>

              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600">Loading documents...</span>
                  </div>
                </div>
              ) : documentsError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700">{documentsError}</p>
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-3 bg-white/70 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {getDocumentIcon(doc.mimeType)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(doc.fileSize)} · {doc.type}
                              {doc.creator && ` · ${doc.creator.firstName} ${doc.creator.lastName}`}
                            </p>
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
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap ml-2"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-600 font-medium">No documents uploaded yet</p>
                  <p className="text-xs text-gray-500 mt-1">Documents will appear here once uploaded</p>
                </div>
              )}
            </div>

            {/* Assignment Panel - Inline After Documents */}
            {!job.driver && (
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Assign to Driver</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Assign a driver, vehicle, and container to this job. The driver will receive all trip details once assigned.
                </p>

                {isAssigning && (
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Sending details to driver...</span>
                      <span className="font-semibold text-blue-600">{assignProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${assignProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Preparing trip details, route information, and documents...
                    </p>
                  </div>
                )}

                {!isAssigning && (
                  <>
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Vehicle
                        <select
                          value={assignmentData.vehicleId}
                          onChange={(event) => {
                            if (vehicles.length === 0) {
                              loadAssignmentOptions();
                            }
                            setAssignmentData((prev) => ({ ...prev, vehicleId: event.target.value }));
                          }}
                          onFocus={() => {
                            if (vehicles.length === 0) {
                              loadAssignmentOptions();
                            }
                          }}
                          className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select vehicle</option>
                          {vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block text-sm font-semibold text-gray-700">
                        Driver *
                        <select
                          value={assignmentData.driverId}
                          onChange={(event) => {
                            if (drivers.length === 0) {
                              loadAssignmentOptions();
                            }
                            setAssignmentData((prev) => ({ ...prev, driverId: event.target.value }));
                          }}
                          onFocus={() => {
                            if (drivers.length === 0) {
                              loadAssignmentOptions();
                            }
                          }}
                          className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select driver</option>
                          {drivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block text-sm font-semibold text-gray-700">
                        Container
                        <select
                          value={assignmentData.containerId}
                          onChange={(event) => {
                            if (containers.length === 0) {
                              loadAssignmentOptions();
                            }
                            setAssignmentData((prev) => ({ ...prev, containerId: event.target.value }));
                          }}
                          onFocus={() => {
                            if (containers.length === 0) {
                              loadAssignmentOptions();
                            }
                          }}
                          className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select container</option>
                          {containers.map((container) => (
                            <option key={container.id} value={container.id}>
                              {container.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {/* Trip Details Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Trip Details to be Sent:</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        {job.route && (
                          <p>• Route: {job.route.origin} → {job.route.destination} ({job.route.kmEstimate} km)</p>
                        )}
                        {job.pickupTs && <p>• Pickup: {formatDateTime(job.pickupTs)}</p>}
                        {job.etaTs && <p>• ETA: {formatDateTime(job.etaTs)}</p>}
                        {job.container && <p>• Container: {job.container.iso}</p>}
                        {job.specialNotes && <p>• Special instructions included</p>}
                      </div>
                    </div>

                    <motion.button
                      onClick={handleAssignmentUpdate}
                      whileHover={{ scale: updating || !assignmentData.driverId ? 1 : 1.02 }}
                      whileTap={{ scale: updating || !assignmentData.driverId ? 1 : 0.98 }}
                      disabled={updating || !assignmentData.driverId}
                      className={`w-full mt-4 px-4 py-3 rounded-xl font-semibold text-sm text-white transition-all ${
                        updating || !assignmentData.driverId
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700"
                      }`}
                    >
                      {updating ? "Assigning..." : "Assign Job to Driver"}
                    </motion.button>
                  </>
                )}
              </div>
            )}

          </motion.div>
        </div>
      </div>

      {assignmentModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass p-6 rounded-2xl w-full max-w-lg space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Assign to Driver</h3>

            {isAssigning && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Sending details to driver...</span>
                  <span className="font-semibold text-blue-600">{assignProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${assignProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Preparing trip details, route information, and documents...
                </p>
              </div>
            )}

            {!isAssigning && (
              <>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Vehicle
                    <select
                      value={assignmentData.vehicleId}
                      onChange={(event) => setAssignmentData((prev) => ({ ...prev, vehicleId: event.target.value }))}
                      className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">No vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-gray-700">
                    Driver
                    <select
                      value={assignmentData.driverId}
                      onChange={(event) => setAssignmentData((prev) => ({ ...prev, driverId: event.target.value }))}
                      className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">No driver</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-gray-700">
                    Container
                    <select
                      value={assignmentData.containerId}
                      onChange={(event) => setAssignmentData((prev) => ({ ...prev, containerId: event.target.value }))}
                      className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">No container</option>
                      {containers.map((container) => (
                        <option key={container.id} value={container.id}>
                          {container.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Trip Details Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Trip Details to be Sent:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    {job.route && (
                      <p>• Route: {job.route.origin} → {job.route.destination} ({job.route.kmEstimate} km)</p>
                    )}
                    {job.pickupTs && <p>• Pickup: {formatDateTime(job.pickupTs)}</p>}
                    {job.etaTs && <p>• ETA: {formatDateTime(job.etaTs)}</p>}
                    {job.container && <p>• Container: {job.container.iso}</p>}
                    {job.specialNotes && <p>• Special instructions included</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button onClick={() => setAssignmentModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleAssignmentUpdate}
                    whileHover={{ scale: updating ? 1 : 1.02 }}
                    whileTap={{ scale: updating ? 1 : 0.98 }}
                    disabled={updating}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm text-white transition-all ${
                      updating ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    Assign & Send Details
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

    </main>
  );
}
