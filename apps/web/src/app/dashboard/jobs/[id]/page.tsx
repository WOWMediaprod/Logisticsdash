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
  trackingEnabled?: boolean;
  shareTrackingLink?: string;
  createdAt: string;
  updatedAt: string;
  client?: RelatedEntity;
  container?: ContainerInfo;
  driver?: DriverInfo;
  vehicle?: VehicleInfo;
  statusEvents?: StatusEvent[];
  // Job Request Details
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

  const [amendmentModalOpen, setAmendmentModalOpen] = useState(false);
  const [amendmentData, setAmendmentData] = useState({
    pickupTs: "",
    dropTs: "",
    etaTs: "",
    priority: "",
    jobType: "",
    status: "",
    specialNotes: "",
    clientId: "",
    containerId: "",
    vehicleId: "",
    driverId: "",
    trackingEnabled: undefined as boolean | undefined,
    shareTrackingLink: "",
    // Job Request Details
    releaseOrderUrl: "",
    loadingLocation: "",
    loadingContactName: "",
    loadingContactPhone: "",
    containerNumber: "",
    sealNumber: "",
    containerYardLocation: "",
    cargoDescription: "",
    cargoWeight: undefined as number | undefined,
    blCutoffRequired: undefined as boolean | undefined,
    blCutoffDateTime: "",
    wharfName: "",
    wharfContact: "",
    deliveryAddress: "",
    deliveryContactName: "",
    deliveryContactPhone: "",
    amendmentReason: "",
    notifyDriver: true,
    notifyClient: true,
  });
  const [clients, setClients] = useState<OptionItem[]>([]);
  const [amendmentHistory, setAmendmentHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [submittingAmendment, setSubmittingAmendment] = useState(false);

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
      const [vehiclesRes, driversRes, containersRes, clientsRes] = await Promise.all([
        fetch(getApiUrl(`/api/v1/vehicles?companyId=${companyId}`)),
        fetch(getApiUrl(`/api/v1/drivers?companyId=${companyId}`)),
        fetch(getApiUrl(`/api/v1/containers?companyId=${companyId}`)),
        fetch(getApiUrl(`/api/v1/clients?companyId=${companyId}`)),
      ]);

      const [vehiclesData, driversData, containersData, clientsData] = await Promise.all([
        vehiclesRes.json(),
        driversRes.json(),
        containersRes.json(),
        clientsRes.json(),
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

      if (clientsData.success) {
        setClients(
          clientsData.data.map((item: any) => ({
            id: item.id,
            label: item.code ? `${item.name} (${item.code})` : item.name,
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

  const openAmendmentModal = async () => {
    if (!job) return;

    // Pre-populate with current job data
    setAmendmentData({
      pickupTs: job.pickupTs ? new Date(job.pickupTs).toISOString().slice(0, 16) : "",
      dropTs: job.dropTs ? new Date(job.dropTs).toISOString().slice(0, 16) : "",
      etaTs: job.etaTs ? new Date(job.etaTs).toISOString().slice(0, 16) : "",
      priority: job.priority || "",
      jobType: job.jobType || "",
      status: job.status || "",
      specialNotes: job.specialNotes || "",
      clientId: job.client?.id || "",
      containerId: job.container?.id || "",
      vehicleId: job.vehicle?.id || "",
      driverId: job.driver?.id || "",
      trackingEnabled: job.trackingEnabled,
      shareTrackingLink: job.shareTrackingLink || "",
      // Job Request Details
      releaseOrderUrl: job.releaseOrderUrl || "",
      loadingLocation: job.loadingLocation || "",
      loadingContactName: job.loadingContactName || "",
      loadingContactPhone: job.loadingContactPhone || "",
      containerNumber: job.containerNumber || "",
      sealNumber: job.sealNumber || "",
      containerYardLocation: job.containerYardLocation || "",
      cargoDescription: job.cargoDescription || "",
      cargoWeight: job.cargoWeight,
      blCutoffRequired: job.blCutoffRequired,
      blCutoffDateTime: job.blCutoffDateTime ? new Date(job.blCutoffDateTime).toISOString().slice(0, 16) : "",
      wharfName: job.wharfName || "",
      wharfContact: job.wharfContact || "",
      deliveryAddress: job.deliveryAddress || "",
      deliveryContactName: job.deliveryContactName || "",
      deliveryContactPhone: job.deliveryContactPhone || "",
      amendmentReason: "",
      notifyDriver: true,
      notifyClient: true,
    });

    // Load options if needed
    await loadAssignmentOptions();

    // Fetch amendment history
    await fetchAmendmentHistory();

    setAmendmentModalOpen(true);
  };

  const fetchAmendmentHistory = async () => {
    if (!companyId || !jobId) return;

    setHistoryLoading(true);
    try {
      const response = await fetch(
        getApiUrl(`/api/v1/jobs/${jobId}/history?companyId=${companyId}`),
        { headers: { 'Accept': 'application/json' } }
      );
      const data = await response.json();

      if (data.success) {
        setAmendmentHistory(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch amendment history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmitAmendment = async () => {
    if (!job || !companyId || !amendmentData.amendmentReason.trim()) {
      alert("Please provide a reason for the amendment");
      return;
    }

    setSubmittingAmendment(true);
    try {
      const response = await fetch(getApiUrl(`/api/v1/jobs/${job.id}/amend`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          pickupTs: amendmentData.pickupTs || undefined,
          dropTs: amendmentData.dropTs || undefined,
          etaTs: amendmentData.etaTs || undefined,
          priority: amendmentData.priority || undefined,
          jobType: amendmentData.jobType || undefined,
          status: amendmentData.status || undefined,
          specialNotes: amendmentData.specialNotes || undefined,
          clientId: amendmentData.clientId || undefined,
          containerId: amendmentData.containerId || undefined,
          vehicleId: amendmentData.vehicleId || undefined,
          driverId: amendmentData.driverId || undefined,
          trackingEnabled: amendmentData.trackingEnabled,
          shareTrackingLink: amendmentData.shareTrackingLink || undefined,
          // Job Request Details
          releaseOrderUrl: amendmentData.releaseOrderUrl || undefined,
          loadingLocation: amendmentData.loadingLocation || undefined,
          loadingContactName: amendmentData.loadingContactName || undefined,
          loadingContactPhone: amendmentData.loadingContactPhone || undefined,
          containerNumber: amendmentData.containerNumber || undefined,
          sealNumber: amendmentData.sealNumber || undefined,
          containerYardLocation: amendmentData.containerYardLocation || undefined,
          cargoDescription: amendmentData.cargoDescription || undefined,
          cargoWeight: amendmentData.cargoWeight,
          blCutoffRequired: amendmentData.blCutoffRequired,
          blCutoffDateTime: amendmentData.blCutoffDateTime || undefined,
          wharfName: amendmentData.wharfName || undefined,
          wharfContact: amendmentData.wharfContact || undefined,
          deliveryAddress: amendmentData.deliveryAddress || undefined,
          deliveryContactName: amendmentData.deliveryContactName || undefined,
          deliveryContactPhone: amendmentData.deliveryContactPhone || undefined,
          amendmentReason: amendmentData.amendmentReason,
          amendedBy: "admin-user", // TODO: Get from auth context
          notifyDriver: amendmentData.notifyDriver,
          notifyClient: amendmentData.notifyClient,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update job with amended data
        setJob(result.data.job);

        // Refresh amendment history
        await fetchAmendmentHistory();

        // Close modal
        setAmendmentModalOpen(false);

        // Reset form
        setAmendmentData({
          pickupTs: "",
          dropTs: "",
          etaTs: "",
          priority: "",
          jobType: "",
          status: "",
          specialNotes: "",
          clientId: "",
          containerId: "",
          vehicleId: "",
          driverId: "",
          trackingEnabled: undefined,
          shareTrackingLink: "",
          // Job Request Details
          releaseOrderUrl: "",
          loadingLocation: "",
          loadingContactName: "",
          loadingContactPhone: "",
          containerNumber: "",
          sealNumber: "",
          containerYardLocation: "",
          cargoDescription: "",
          cargoWeight: undefined,
          blCutoffRequired: undefined,
          blCutoffDateTime: "",
          wharfName: "",
          wharfContact: "",
          deliveryAddress: "",
          deliveryContactName: "",
          deliveryContactPhone: "",
          amendmentReason: "",
          notifyDriver: true,
          notifyClient: true,
        });

        alert("Job amended successfully! Notifications sent.");
      } else {
        alert(`Failed to amend job: ${result.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to submit amendment", err);
      alert("Failed to submit amendment");
    } finally {
      setSubmittingAmendment(false);
    }
  };

  // Helper: check if job can be amended
  const canAmendJob = useMemo(() => {
    if (!job) return false;
    const nonAmendableStatuses = ["COMPLETED", "CANCELLED"];
    return !nonAmendableStatuses.includes(job.status);
  }, [job]);


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

              {/* Shipment Details Section */}
              {(job.releaseOrderUrl || job.loadingLocation || job.containerNumber || job.cargoDescription || job.wharfName || job.deliveryAddress) && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="text-sm font-bold text-blue-900 mb-3">Shipment Details</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {job.releaseOrderUrl && (
                      <div>
                        <p className="text-blue-600 font-semibold">Release Order</p>
                        <a href={job.releaseOrderUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                          View Document
                        </a>
                      </div>
                    )}

                    {job.loadingLocation && (
                      <div>
                        <p className="text-blue-600 font-semibold">Loading Location</p>
                        <p className="text-blue-800">{job.loadingLocation}</p>
                        {job.loadingContactName && (
                          <p className="text-blue-700 text-xs mt-1">
                            Contact: {job.loadingContactName}
                            {job.loadingContactPhone && ` (${job.loadingContactPhone})`}
                          </p>
                        )}
                      </div>
                    )}

                    {job.containerNumber && (
                      <div>
                        <p className="text-blue-600 font-semibold">Container Details</p>
                        <p className="text-blue-800">Number: {job.containerNumber}</p>
                        {job.sealNumber && <p className="text-blue-800 text-xs">Seal: {job.sealNumber}</p>}
                        {job.containerYardLocation && <p className="text-blue-700 text-xs mt-1">Yard: {job.containerYardLocation}</p>}
                      </div>
                    )}

                    {job.cargoDescription && (
                      <div>
                        <p className="text-blue-600 font-semibold">Cargo</p>
                        <p className="text-blue-800">{job.cargoDescription}</p>
                        {job.cargoWeight && <p className="text-blue-700 text-xs mt-1">Weight: {job.cargoWeight} kg</p>}
                      </div>
                    )}

                    {job.blCutoffRequired && (
                      <div>
                        <p className="text-blue-600 font-semibold">BL Cutoff</p>
                        <p className="text-blue-800">{job.blCutoffDateTime ? formatDateTime(job.blCutoffDateTime) : 'Required'}</p>
                      </div>
                    )}

                    {job.wharfName && (
                      <div>
                        <p className="text-blue-600 font-semibold">Wharf</p>
                        <p className="text-blue-800">{job.wharfName}</p>
                        {job.wharfContact && <p className="text-blue-700 text-xs mt-1">Contact: {job.wharfContact}</p>}
                      </div>
                    )}

                    {job.deliveryAddress && (
                      <div>
                        <p className="text-blue-600 font-semibold">Delivery Location</p>
                        <p className="text-blue-800">{job.deliveryAddress}</p>
                        {job.deliveryContactName && (
                          <p className="text-blue-700 text-xs mt-1">
                            Contact: {job.deliveryContactName}
                            {job.deliveryContactPhone && ` (${job.deliveryContactPhone})`}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
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

                {canAmendJob && (
                  <motion.button
                    onClick={openAmendmentModal}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 rounded-lg font-semibold transition-all bg-orange-600 text-white hover:bg-orange-700"
                  >
                    Amend Job
                  </motion.button>
                )}
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

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-2xl">
              <WaypointManagement jobId={job.id} />
            </motion.div>
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

      {amendmentModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4 overflow-y-auto py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-6 rounded-2xl w-full max-w-2xl space-y-4 my-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Amend Job</h3>
              <button
                onClick={() => setAmendmentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                <strong>Note:</strong> Changes will be notified to relevant parties (driver/client) and tracked in the amendment history.
              </p>
            </div>

            {!submittingAmendment && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Core Details Section */}
                <div className="pb-3 border-b">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Core Details</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Job Type
                      <select
                        value={amendmentData.jobType}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, jobType: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        disabled={["IN_TRANSIT", "AT_PICKUP", "LOADED", "AT_DELIVERY"].includes(job.status)}
                      >
                        <option value="">Keep current</option>
                        <option value="ONE_WAY">One Way</option>
                        <option value="ROUND_TRIP">Round Trip</option>
                        <option value="MULTI_STOP">Multi Stop</option>
                        <option value="EXPORT">Export</option>
                        <option value="IMPORT">Import</option>
                      </select>
                      {["IN_TRANSIT", "AT_PICKUP", "LOADED", "AT_DELIVERY"].includes(job.status) && (
                        <p className="text-xs text-gray-500 mt-1">Cannot change type after transit starts</p>
                      )}
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Priority
                      <select
                        value={amendmentData.priority}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, priority: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      >
                        <option value="">Keep current</option>
                        <option value="LOW">Low</option>
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Status <span className="text-orange-600">(Admin Override)</span>
                      <select
                        value={amendmentData.status}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, status: e.target.value }))}
                        className="mt-1 w-full p-3 border border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-orange-50"
                      >
                        <option value="">Keep current</option>
                        <option value="CREATED">Created</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="IN_TRANSIT">In Transit</option>
                        <option value="AT_PICKUP">At Pickup</option>
                        <option value="LOADED">Loaded</option>
                        <option value="AT_DELIVERY">At Delivery</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="ON_HOLD">On Hold</option>
                      </select>
                      <p className="text-xs text-orange-600 mt-1">⚠️ Use with caution</p>
                    </label>
                  </div>
                </div>

                {/* Assignments Section */}
                <div className="pb-3 border-b">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Assignments</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Driver
                      <select
                        value={amendmentData.driverId}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, driverId: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        disabled={["AT_DELIVERY", "DELIVERED"].includes(job.status)}
                      >
                        <option value="">Keep current</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.label}
                          </option>
                        ))}
                      </select>
                      {["AT_DELIVERY", "DELIVERED"].includes(job.status) && (
                        <p className="text-xs text-gray-500 mt-1">Cannot reassign driver at this stage</p>
                      )}
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Client
                      <select
                        value={amendmentData.clientId}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, clientId: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      >
                        <option value="">Keep current</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Vehicle
                      <select
                        value={amendmentData.vehicleId}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, vehicleId: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        disabled={["IN_TRANSIT", "LOADED", "AT_DELIVERY", "DELIVERED"].includes(job.status)}
                      >
                        <option value="">Keep current</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.label}
                          </option>
                        ))}
                      </select>
                      {["IN_TRANSIT", "LOADED", "AT_DELIVERY", "DELIVERED"].includes(job.status) && (
                        <p className="text-xs text-gray-500 mt-1">Cannot change vehicle after transit starts</p>
                      )}
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Container
                      <select
                        value={amendmentData.containerId}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, containerId: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        disabled={["LOADED", "AT_DELIVERY", "DELIVERED"].includes(job.status)}
                      >
                        <option value="">Keep current</option>
                        {containers.map((container) => (
                          <option key={container.id} value={container.id}>
                            {container.label}
                          </option>
                        ))}
                      </select>
                      {["LOADED", "AT_DELIVERY", "DELIVERED"].includes(job.status) && (
                        <p className="text-xs text-gray-500 mt-1">Cannot change container after loading</p>
                      )}
                    </label>
                  </div>
                </div>

                {/* Schedule Section */}
                <div className="pb-3 border-b">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Schedule</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Pickup Time
                    <input
                      type="datetime-local"
                      value={amendmentData.pickupTs}
                      onChange={(e) => setAmendmentData((prev) => ({ ...prev, pickupTs: e.target.value }))}
                      className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      disabled={["LOADED", "AT_DELIVERY", "DELIVERED"].includes(job.status)}
                    />
                    {["LOADED", "AT_DELIVERY", "DELIVERED"].includes(job.status) && (
                      <p className="text-xs text-gray-500 mt-1">Cannot change after loading</p>
                    )}
                  </label>

                  <label className="block text-sm font-semibold text-gray-700">
                    ETA
                    <input
                      type="datetime-local"
                      value={amendmentData.etaTs}
                      onChange={(e) => setAmendmentData((prev) => ({ ...prev, etaTs: e.target.value }))}
                      className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    />
                  </label>

                  <label className="block text-sm font-semibold text-gray-700">
                    Delivery Time
                    <input
                      type="datetime-local"
                      value={amendmentData.dropTs}
                      onChange={(e) => setAmendmentData((prev) => ({ ...prev, dropTs: e.target.value }))}
                      className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    />
                  </label>
                  </div>
                </div>

                {/* Tracking Configuration Section */}
                <div className="pb-3 border-b">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Tracking Configuration</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-xl bg-white cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={amendmentData.trackingEnabled === true}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, trackingEnabled: e.target.checked }))}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="block text-sm font-semibold text-gray-700">Enable GPS Tracking</span>
                        <span className="block text-xs text-gray-500">Real-time location updates from driver</span>
                      </div>
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Public Tracking Link
                      <input
                        type="text"
                        value={amendmentData.shareTrackingLink}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, shareTrackingLink: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="e.g., abc123xyz"
                      />
                      <p className="text-xs text-gray-500 mt-1">Share this code for public tracking</p>
                    </label>
                  </div>
                </div>

                {/* Shipment Details Section */}
                <div className="pb-3 border-b">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Shipment Details</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Release Order URL
                      <input
                        type="url"
                        value={amendmentData.releaseOrderUrl}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, releaseOrderUrl: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="https://..."
                      />
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Loading Location
                      <input
                        type="text"
                        value={amendmentData.loadingLocation}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, loadingLocation: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="Loading address..."
                      />
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Loading Contact Name
                      <input
                        type="text"
                        value={amendmentData.loadingContactName}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, loadingContactName: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="Contact name..."
                      />
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Loading Contact Phone
                      <input
                        type="tel"
                        value={amendmentData.loadingContactPhone}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, loadingContactPhone: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="Phone number..."
                      />
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Container Number
                      <input
                        type="text"
                        value={amendmentData.containerNumber}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, containerNumber: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="Container no..."
                      />
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Seal Number
                      <input
                        type="text"
                        value={amendmentData.sealNumber}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, sealNumber: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="Seal no..."
                      />
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Container Yard Location
                      <input
                        type="text"
                        value={amendmentData.containerYardLocation}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, containerYardLocation: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="Yard location..."
                      />
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Cargo Weight (kg)
                      <input
                        type="number"
                        value={amendmentData.cargoWeight ?? ""}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, cargoWeight: e.target.value ? Number(e.target.value) : undefined }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="Weight in kg..."
                      />
                    </label>

                    <label className="block text-sm font-semibold text-gray-700 md:col-span-2">
                      Cargo Description
                      <textarea
                        value={amendmentData.cargoDescription}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, cargoDescription: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        rows={2}
                        placeholder="Cargo details..."
                      />
                    </label>

                    <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-xl bg-white cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={amendmentData.blCutoffRequired === true}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, blCutoffRequired: e.target.checked }))}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="block text-sm font-semibold text-gray-700">BL Cutoff Required</span>
                        <span className="block text-xs text-gray-500">Mark if BL cutoff date is required</span>
                      </div>
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      BL Cutoff Date/Time
                      <input
                        type="datetime-local"
                        value={amendmentData.blCutoffDateTime}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, blCutoffDateTime: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      />
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Wharf Name
                      <input
                        type="text"
                        value={amendmentData.wharfName}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, wharfName: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="Wharf name..."
                      />
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Wharf Contact
                      <input
                        type="text"
                        value={amendmentData.wharfContact}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, wharfContact: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="Contact info..."
                      />
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Delivery Address
                      <input
                        type="text"
                        value={amendmentData.deliveryAddress}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="Delivery address..."
                      />
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Delivery Contact Name
                      <input
                        type="text"
                        value={amendmentData.deliveryContactName}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, deliveryContactName: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="Contact name..."
                      />
                    </label>

                    <label className="block text-sm font-semibold text-gray-700">
                      Delivery Contact Phone
                      <input
                        type="tel"
                        value={amendmentData.deliveryContactPhone}
                        onChange={(e) => setAmendmentData((prev) => ({ ...prev, deliveryContactPhone: e.target.value }))}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="Phone number..."
                      />
                    </label>
                  </div>
                </div>

                {/* Notes & Reason Section */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Notes & Reason</h4>
                  <label className="block text-sm font-semibold text-gray-700">
                    Special Notes
                  <textarea
                    value={amendmentData.specialNotes}
                    onChange={(e) => setAmendmentData((prev) => ({ ...prev, specialNotes: e.target.value }))}
                    className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    rows={3}
                    placeholder="Update special notes or instructions..."
                  />
                </label>

                <label className="block text-sm font-semibold text-gray-700">
                  Amendment Reason *
                  <textarea
                    value={amendmentData.amendmentReason}
                    onChange={(e) => setAmendmentData((prev) => ({ ...prev, amendmentReason: e.target.value }))}
                    className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    rows={2}
                    placeholder="Required: Why are you amending this job?"
                    required
                  />
                </label>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={amendmentData.notifyDriver}
                      onChange={(e) => setAmendmentData((prev) => ({ ...prev, notifyDriver: e.target.checked }))}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Notify Driver</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={amendmentData.notifyClient}
                      onChange={(e) => setAmendmentData((prev) => ({ ...prev, notifyClient: e.target.checked }))}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Notify Client</span>
                  </label>
                </div>

                {/* Amendment History */}
                {amendmentHistory.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Amendment History</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {amendmentHistory.map((amendment: any) => (
                        <div key={amendment.id} className="p-2 bg-gray-50 rounded-lg text-xs">
                          <p className="font-semibold text-gray-900">{amendment.amendmentReason}</p>
                          <p className="text-gray-600">By: {amendment.amendedBy} · {formatDateTime(amendment.createdAt)}</p>
                          {amendment.changes && (
                            <div className="mt-1 text-gray-500">
                              {Object.entries(amendment.changes as Record<string, any>).map(([key, value]) => (
                                <p key={key}>• {key}: {JSON.stringify(value)}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>
            )}

            {submittingAmendment && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Submitting amendment...</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setAmendmentModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                disabled={submittingAmendment}
              >
                Cancel
              </button>
              <motion.button
                onClick={handleSubmitAmendment}
                whileHover={{ scale: submittingAmendment || !amendmentData.amendmentReason.trim() ? 1 : 1.02 }}
                whileTap={{ scale: submittingAmendment || !amendmentData.amendmentReason.trim() ? 1 : 0.98 }}
                disabled={submittingAmendment || !amendmentData.amendmentReason.trim()}
                className={`px-4 py-2 rounded-lg font-semibold text-sm text-white transition-all ${
                  submittingAmendment || !amendmentData.amendmentReason.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                Submit Amendment
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

    </main>
  );
}
