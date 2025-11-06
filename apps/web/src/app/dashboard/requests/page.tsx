'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getApiUrl } from '../../../lib/api-config';
import {
  ArrowLeft,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  MapPin,
  Package,
  FileText,
  Phone,
  Mail,
  Calendar,
  Eye,
  Check,
  X,
  MessageSquare,
  Plus,
  Download,
  Upload,
  Paperclip,
  Shield,
  Users,
  Building,
  Trash2
} from 'lucide-react';
import { useCompany } from '../../../contexts/CompanyContext';
import WaypointManager from '../../../components/WaypointManager';

interface JobRequest {
  id: string;
  companyId: string;
  clientId: string;
  requestedBy?: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

  // Legacy fields
  pickupAddress?: string;
  deliveryAddress?: string;
  requestedPickupTs?: string;
  requestedDropTs?: string;
  containerType?: string;
  specialRequirements?: string;
  estimatedValue?: string;

  // New workflow fields
  shipmentType?: 'EXPORT' | 'IMPORT' | 'LCL';
  releaseOrderUrl?: string;

  // Loading information
  loadingLocation?: string;
  loadingLocationLat?: number;
  loadingLocationLng?: number;
  loadingContact?: string;
  loadingDate?: string;
  loadingTime?: string;

  // Container reservation
  containerReservation?: boolean;
  containerNumber?: string;
  sealNumber?: string;
  containerYardLocation?: string;
  containerYardLocationLat?: number;
  containerYardLocationLng?: number;

  // Cargo details
  cargoDescription?: string;
  cargoWeight?: number;
  cargoWeightUnit?: string;

  // BL Cutoff
  blCutoffRequired?: boolean;
  blCutoffDateTime?: string;

  // Wharf information
  wharfName?: string;
  wharfContact?: string;

  // Delivery information (enhanced)
  deliveryContact?: string;

  // System fields
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  jobId?: string;
  convertedToJobId?: string;
  convertedToJob?: {
    id: string;
    driverId: string | null;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
  client: {
    name: string;
    code: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  requestedByUser?: {
    name: string;
    email: string;
  };
  documents: Array<{
    id: string;
    fileName: string;
    type: string;
    fileSize: number;
    uploadedBy: string;
  }>;
  updates: Array<{
    id: string;
    updateType: string;
    title: string;
    description?: string;
    updatedBy: string;
    createdAt: string;
  }>;
}

// Mock data
const mockRequests: JobRequest[] = [
  {
    id: 'REQ-2024-0089',
    companyId: 'cmfmbojit0000vj0ch078cnbu',
    clientId: 'client-001',
    title: 'Equipment transport to Cape Town',
    description: 'Urgent transport of manufacturing equipment from Pretoria to Cape Town port for export shipment.',
    priority: 'HIGH',
    status: 'UNDER_REVIEW',
    pickupAddress: 'Industrial Park, Block 5, Pretoria West, GP 0183',
    deliveryAddress: 'Port of Cape Town, Container Terminal A, Cape Town, WC 8001',
    requestedPickupTs: '2024-09-25T08:00:00Z',
    requestedDropTs: '2024-09-26T14:00:00Z',
    containerType: '40ft',
    specialRequirements: 'Heavy machinery, requires crane assistance at both ends. Fragile equipment, minimize vibration.',
    estimatedValue: '850000',
    createdAt: '2024-09-21T09:30:00Z',
    updatedAt: '2024-09-21T14:15:00Z',
    client: {
      name: 'Precision Manufacturing Ltd',
      code: 'PM001',
      contactEmail: 'logistics@precisionmfg.co.za',
      contactPhone: '+27 11 555 0123'
    },
    requestedByUser: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@precisionmfg.co.za'
    },
    documents: [
      {
        id: 'doc-001',
        fileName: 'Equipment_Manifest.pdf',
        type: 'manifest',
        fileSize: 2457600,
        uploadedBy: 'Sarah Johnson'
      },
      {
        id: 'doc-002',
        fileName: 'Insurance_Certificate.pdf',
        type: 'insurance',
        fileSize: 1048576,
        uploadedBy: 'Sarah Johnson'
      }
    ],
    updates: [
      {
        id: 'update-001',
        updateType: 'STATUS_CHANGE',
        title: 'Request submitted',
        description: 'Job request submitted for review',
        updatedBy: 'Sarah Johnson',
        createdAt: '2024-09-21T09:30:00Z'
      }
    ]
  },
  {
    id: 'REQ-2024-0090',
    companyId: 'cmfmbojit0000vj0ch078cnbu',
    clientId: 'client-002',
    title: 'Container delivery to Durban',
    description: 'Standard container delivery from warehouse to Durban port.',
    priority: 'NORMAL',
    status: 'PENDING',
    pickupAddress: 'Warehouse Complex, Johannesburg South, GP 2190',
    deliveryAddress: 'Durban Container Terminal, Durban, KZN 4001',
    requestedPickupTs: '2024-09-28T10:00:00Z',
    requestedDropTs: '2024-09-29T12:00:00Z',
    containerType: '20ft',
    estimatedValue: '125000',
    createdAt: '2024-09-22T11:20:00Z',
    updatedAt: '2024-09-22T11:20:00Z',
    client: {
      name: 'Global Trade Solutions',
      code: 'GTS002',
      contactEmail: 'operations@globalts.com',
      contactPhone: '+27 31 555 0456'
    },
    requestedByUser: {
      name: 'Michael Chen',
      email: 'michael.chen@globalts.com'
    },
    documents: [
      {
        id: 'doc-003',
        fileName: 'Shipping_Invoice.pdf',
        type: 'invoice',
        fileSize: 1536000,
        uploadedBy: 'Michael Chen'
      }
    ],
    updates: [
      {
        id: 'update-002',
        updateType: 'STATUS_CHANGE',
        title: 'Request submitted',
        description: 'Job request awaiting initial review',
        updatedBy: 'Michael Chen',
        createdAt: '2024-09-22T11:20:00Z'
      }
    ]
  }
];

export default function RequestsPage() {
  const { companyId } = useCompany();
  const [requests, setRequests] = useState<JobRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<JobRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadRequests = async () => {
      // Debug logging
      console.log('🔍 Job Requests - loadRequests called with companyId:', companyId, 'Type:', typeof companyId, 'Length:', companyId?.length);

      // More robust check for valid companyId
      if (!companyId || typeof companyId !== 'string' || companyId.length < 10) {
        console.log('⚠️ Invalid companyId, skipping request');
        setRequests([]);
        setLoading(false);
        return;
      }

      console.log('✅ Valid companyId, making request...');
      setLoading(true);

      try {
        const url = `/api/v1/job-requests?companyId=${encodeURIComponent(companyId)}`;
        console.log('📡 Fetching:', url);

        const response = await fetch(getApiUrl(url), {
          headers: { 'Accept': 'application/json' }
        });

        if (!cancelled) {
          const json = await response.json();
          console.log('📥 Response:', json);

          if (json.success) {
            setRequests(json.data);
          } else {
            console.error('Failed to load requests:', json.message);
            setRequests([]);
          }
        }
      } catch (error) {
        console.error('Failed to load job requests', error);
        if (!cancelled) {
          setRequests([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRequests();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const filteredRequests = requests.filter(request => {
    // Hide accepted requests that have been converted to jobs (have a jobId or convertedToJobId)
    if (request.status === 'ACCEPTED' && (request.jobId || request.convertedToJobId)) {
      return false;
    }

    // Hide job requests where the associated job has been assigned to a driver
    if (request.convertedToJob && request.convertedToJob.driverId) {
      return false;
    }

    const matchesSearch = request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusStats = () => {
    return {
      pending: requests.filter(r => r.status === 'PENDING').length,
      underReview: requests.filter(r => r.status === 'UNDER_REVIEW').length,
      accepted: requests.filter(r => r.status === 'ACCEPTED' && !r.jobId).length,
      declined: requests.filter(r => r.status === 'DECLINED').length
    };
  };

  const stats = getStatusStats();

  if (selectedRequest) {
    return (
      <RequestDetailView
        request={selectedRequest}
        onBack={() => setSelectedRequest(null)}
        onUpdate={(updatedRequest) => {
          setRequests(requests.map(r => r.id === updatedRequest.id ? updatedRequest : r));
          setSelectedRequest(updatedRequest);
        }}
      />
    );
  }

  // Show loading when companyId is not ready yet
  if (!companyId || typeof companyId !== 'string' || companyId.length < 10) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Initializing...</span>
        </div>
      </div>
    );
  }

  if (loading && requests.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading job requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Requests</h1>
          <p className="text-gray-600">Review and manage incoming job requests from clients</p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Pending Review"
            value={stats.pending}
            icon={<Clock className="w-6 h-6" />}
            color="orange"
          />
          <StatsCard
            title="Under Review"
            value={stats.underReview}
            icon={<Eye className="w-6 h-6" />}
            color="blue"
          />
          <StatsCard
            title="Accepted"
            value={stats.accepted}
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
          />
          <StatsCard
            title="Declined"
            value={stats.declined}
            icon={<XCircle className="w-6 h-6" />}
            color="red"
          />
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search requests..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="DECLINED">Declined</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onClick={() => setSelectedRequest(request)}
              />
            ))}
            {filteredRequests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No requests found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  color
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'orange' | 'blue' | 'green' | 'red';
}) {
  const colorClasses = {
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm font-medium text-gray-600">{title}</p>
    </motion.div>
  );
}

function RequestCard({
  request,
  onClick
}: {
  request: JobRequest;
  onClick: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-100 text-green-800 border-green-200';
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DECLINED': return 'bg-red-100 text-red-800 border-red-200';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'NORMAL': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{request.id}</h3>
            <p className="text-sm text-gray-600">{request.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(request.priority)}`}>
            {request.priority}
          </span>
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
            {request.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-start space-x-2">
          <User className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-gray-900">{request.client?.name || 'No client'}</p>
            <p className="text-gray-600">{request.client?.code || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-gray-900">Route</p>
            <p className="text-gray-600 truncate">
              {request.pickupAddress?.split(',')[0] || 'Not specified'} → {request.deliveryAddress?.split(',')[0] || 'Not specified'}
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <Package className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-gray-900">Container</p>
            <p className="text-gray-600">{request.containerType || 'Not specified'}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Submitted: {formatDateTime(request.createdAt)}</span>
          {request.estimatedValue && (
            <span>Value: R{request.estimatedValue}</span>
          )}
          <span>{request.documents.length} documents</span>
        </div>
        {request.requestedPickupTs && (
          <span>
            Pickup: {new Date(request.requestedPickupTs).toLocaleDateString()}
          </span>
        )}
      </div>

      {request.specialRequirements && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <AlertTriangle className="inline w-4 h-4 mr-1" />
            <span className="font-medium">Special Requirements:</span> {request.specialRequirements}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function RequestDetailView({
  request,
  onBack,
  onUpdate
}: {
  request: JobRequest;
  onBack: () => void;
  onUpdate: (request: JobRequest) => void;
}) {
  const { companyId } = useCompany();
  const [reviewNotes, setReviewNotes] = useState(request.reviewNotes || '');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'decline' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Driver assignment states
  const [vehicles, setVehicles] = useState<Array<{id: string; label: string}>>([]);
  const [drivers, setDrivers] = useState<Array<{id: string; label: string}>>([]);
  const [containers, setContainers] = useState<Array<{id: string; label: string}>>([]);
  const [assignmentData, setAssignmentData] = useState({
    vehicleId: '',
    driverId: '',
    containerId: '',
  });
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignProgress, setAssignProgress] = useState(0);
  const [jobHasDriver, setJobHasDriver] = useState(false);
  const [showAssignConfirmation, setShowAssignConfirmation] = useState(false);

  const handleAccept = async () => {
    if (!companyId) {
      setError('Company ID is required');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl(`/api/v1/job-requests/${request.id}/accept`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          reviewedBy: 'Admin User', // TODO: Get from auth context
          reviewNotes: reviewNotes || 'Request accepted'
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update the request with the new data
        onUpdate({
          ...request,
          ...result.data.jobRequest,
          jobId: result.data.job.id
        });
        setShowReviewModal(false);
        alert(`Job request accepted! Job ${result.data.job.id} created successfully.`);
      } else {
        setError(result.message || 'Failed to accept job request');
      }
    } catch (err) {
      console.error('Failed to accept job request', err);
      setError('Failed to accept job request');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!companyId) {
      setError('Company ID is required');
      return;
    }

    if (!reviewNotes.trim()) {
      setError('Please provide a reason for declining');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl(`/api/v1/job-requests/${request.id}/decline`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          reviewedBy: 'Admin User', // TODO: Get from auth context
          reviewNotes
        })
      });

      const result = await response.json();

      if (result.success) {
        onUpdate({
          ...request,
          ...result.data
        });
        setShowReviewModal(false);
        alert('Job request declined successfully.');
      } else {
        setError(result.message || 'Failed to decline job request');
      }
    } catch (err) {
      console.error('Failed to decline job request', err);
      setError('Failed to decline job request');
    } finally {
      setProcessing(false);
    }
  };

  // Load assignment options (drivers, vehicles, containers)
  const loadAssignmentOptions = async () => {
    if (!companyId) return;

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

  // Handle job assignment
  const handleAssignmentUpdate = async () => {
    if (!request.jobId || !companyId) return;

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

    try {
      const response = await fetch(getApiUrl(`/api/v1/jobs/${request.jobId}/assign`), {
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
          setJobHasDriver(true);
          setIsAssigning(false);
          setAssignProgress(0);
          alert('Job assigned successfully!');
        }, 500);
      } else {
        console.error("Failed to update assignment", result.error);
        setIsAssigning(false);
        setAssignProgress(0);
        alert('Failed to assign job');
      }
    } catch (err) {
      console.error("Failed to update assignment", err);
      clearInterval(progressInterval);
      setIsAssigning(false);
      setAssignProgress(0);
      alert('Failed to assign job');
    }
  };

  const handleSubmitReview = () => {
    if (actionType === 'accept') {
      handleAccept();
    } else if (actionType === 'decline') {
      handleDecline();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={onBack}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{request.id}</h1>
              <p className="text-gray-600">{request.title}</p>
            </div>
            <div className="flex items-center space-x-3">
              {request.status === 'PENDING' || request.status === 'UNDER_REVIEW' ? (
                <>
                  <button
                    onClick={() => {
                      setActionType('decline');
                      setShowReviewModal(true);
                    }}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Decline
                  </button>
                  <button
                    onClick={() => {
                      setActionType('accept');
                      setShowReviewModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Accept
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Request Details */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Request Details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Description</h4>
                    <p className="text-gray-600">{request.description || 'No description provided'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Container Type</h4>
                    <p className="text-gray-600">{request.containerType || 'Not specified'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Estimated Value</h4>
                    <p className="text-gray-600">
                      {request.estimatedValue ? `R${request.estimatedValue}` : 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Priority</h4>
                    <span className={`px-2 py-1 text-sm font-medium rounded ${
                      request.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                      request.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      request.priority === 'NORMAL' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.priority}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Status</h4>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${
                      request.status === 'ACCEPTED' ? 'bg-green-100 text-green-800 border-green-200' :
                      request.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      request.status === 'DECLINED' ? 'bg-red-100 text-red-800 border-red-200' :
                      'bg-orange-100 text-orange-800 border-orange-200'
                    }`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                  {request.jobId && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Created Job</h4>
                      <Link
                        href={`/dashboard/jobs/${request.jobId}`}
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        {request.jobId}
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {request.specialRequirements && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Special Requirements
                  </h4>
                  <p className="text-yellow-800">{request.specialRequirements}</p>
                </div>
              )}
            </div>

            {/* Route Information */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Route Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 text-green-600 mr-2" />
                    Pickup Location
                  </h4>
                  <p className="text-gray-600 mb-2">{request.pickupAddress}</p>
                  {request.requestedPickupTs && (
                    <p className="text-sm text-gray-500">
                      Requested: {new Date(request.requestedPickupTs).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 text-red-600 mr-2" />
                    Delivery Location
                  </h4>
                  <p className="text-gray-600 mb-2">{request.deliveryAddress}</p>
                  {request.requestedDropTs && (
                    <p className="text-sm text-gray-500">
                      Requested: {new Date(request.requestedDropTs).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Waypoint Management - Only show if job has been created */}
            {request.jobId && (
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
                <WaypointManager jobId={request.jobId} isJobAssigned={jobHasDriver} />
              </div>
            )}

            {/* Documents */}
            <DocumentsSection
              request={request}
              onUpdate={(updatedRequest) => onUpdate(updatedRequest)}
            />

            {/* Driver Assignment Panel - Show after documents, after job is created and driver not yet assigned */}
            {request.jobId && !jobHasDriver && (
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Assign to Driver</h2>
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

                    <motion.button
                      onClick={() => setShowAssignConfirmation(true)}
                      whileHover={{ scale: !assignmentData.driverId ? 1 : 1.02 }}
                      whileTap={{ scale: !assignmentData.driverId ? 1 : 0.98 }}
                      disabled={!assignmentData.driverId}
                      className={`w-full mt-4 px-4 py-3 rounded-xl font-semibold text-sm text-white transition-all ${
                        !assignmentData.driverId
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700"
                      }`}
                    >
                      Assign Job to Driver
                    </motion.button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Information */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Client Information</h2>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900">Company</h4>
                  <p className="text-gray-600">{request.client?.name || 'No client'}</p>
                  <p className="text-sm text-gray-500">Code: {request.client?.code || 'N/A'}</p>
                </div>
                {(request.client?.contactEmail || request.client?.contactPhone) && (
                  <div>
                    <h4 className="font-semibold text-gray-900">Contact</h4>
                    {request.client.contactEmail && (
                      <a
                        href={`mailto:${request.client.contactEmail}`}
                        className="flex items-center text-blue-600 hover:text-blue-700 mb-1"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {request.client.contactEmail}
                      </a>
                    )}
                    {request.client.contactPhone && (
                      <a
                        href={`tel:${request.client.contactPhone}`}
                        className="flex items-center text-blue-600 hover:text-blue-700"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {request.client.contactPhone}
                      </a>
                    )}
                  </div>
                )}
                {request.requestedByUser && (
                  <div>
                    <h4 className="font-semibold text-gray-900">Requested By</h4>
                    <p className="text-gray-600">{request.requestedByUser.name}</p>
                    <p className="text-sm text-gray-500">{request.requestedByUser.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Submitted</p>
                  <p>{new Date(request.createdAt).toLocaleString()}</p>
                </div>
                {request.reviewedAt && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Reviewed</p>
                    <p>{new Date(request.reviewedAt).toLocaleString()}</p>
                    {request.reviewedBy && (
                      <p>by {request.reviewedBy}</p>
                    )}
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Last Updated</p>
                  <p>{new Date(request.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              {request.reviewNotes && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-1">Review Notes</h4>
                  <p className="text-sm text-blue-700">{request.reviewNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {actionType === 'accept' ? 'Accept Request' : 'Decline Request'}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes {actionType === 'decline' && <span className="text-red-600">*</span>}
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={actionType === 'accept' ? 'Optional notes about the acceptance...' : 'Please provide a reason for declining...'}
                  required={actionType === 'decline'}
                />
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setError(null);
                  }}
                  disabled={processing}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={processing || (actionType === 'decline' && !reviewNotes.trim())}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                    actionType === 'accept'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {processing ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{actionType === 'accept' ? 'Accepting...' : 'Declining...'}</span>
                    </div>
                  ) : (
                    actionType === 'accept' ? 'Accept & Create Job' : 'Decline Request'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Assignment Confirmation Dialog */}
        {showAssignConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Driver Assignment</h3>
                  <p className="text-sm text-gray-600">
                    You are about to assign this job to a driver. Please confirm that everything is ready:
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900 mb-2">Assignment Details:</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  {assignmentData.vehicleId && vehicles.find(v => v.id === assignmentData.vehicleId) && (
                    <p>• Vehicle: {vehicles.find(v => v.id === assignmentData.vehicleId)?.label}</p>
                  )}
                  {assignmentData.driverId && drivers.find(d => d.id === assignmentData.driverId) && (
                    <p>• Driver: {drivers.find(d => d.id === assignmentData.driverId)?.label}</p>
                  )}
                  {assignmentData.containerId && containers.find(c => c.id === assignmentData.containerId) && (
                    <p>• Container: {containers.find(c => c.id === assignmentData.containerId)?.label}</p>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Once assigned, the driver will receive all trip details and the job will be visible to the client.
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowAssignConfirmation(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAssignConfirmation(false);
                    handleAssignmentUpdate();
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Yes, Assign Job
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentsSection({
  request,
  onUpdate
}: {
  request: JobRequest;
  onUpdate: (request: JobRequest) => void;
}) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [adminDocuments, setAdminDocuments] = useState<Array<{
    id: string;
    fileName: string;
    type: string;
    fileSize: number;
    uploadedBy: string;
    uploadedByRole: 'client' | 'admin';
    visibility: 'client' | 'driver' | 'internal' | 'all';
    category: 'driver-instructions' | 'permits' | 'rate-cards' | 'insurance' | 'route-maps' | 'safety' | 'other';
    isRequired: boolean;
    createdAt: string;
  }>>([
    {
      id: 'admin-doc-001',
      fileName: 'Driver_Route_Instructions.pdf',
      type: 'driver-instructions',
      fileSize: 524288,
      uploadedBy: 'Admin User',
      uploadedByRole: 'admin',
      visibility: 'driver',
      category: 'driver-instructions',
      isRequired: true,
      createdAt: '2024-09-21T15:30:00Z'
    },
    {
      id: 'admin-doc-002',
      fileName: 'Transport_Permit_GP_to_WC.pdf',
      type: 'permits',
      fileSize: 1048576,
      uploadedBy: 'Admin User',
      uploadedByRole: 'admin',
      visibility: 'all',
      category: 'permits',
      isRequired: true,
      createdAt: '2024-09-21T16:00:00Z'
    }
  ]);

  const allDocuments = [
    ...request.documents.map(doc => ({
      ...doc,
      uploadedByRole: 'client' as const,
      visibility: 'all' as const,
      category: doc.type as any,
      isRequired: false,
      createdAt: '2024-09-21T09:30:00Z'
    })),
    ...adminDocuments
  ];

  const clientDocuments = allDocuments.filter(doc => doc.uploadedByRole === 'client');
  const companyDocuments = allDocuments.filter(doc => doc.uploadedByRole === 'admin');

  const getDocumentIcon = (category: string) => {
    switch (category) {
      case 'driver-instructions': return <Users className="w-5 h-5 text-blue-600" />;
      case 'permits': return <Shield className="w-5 h-5 text-purple-600" />;
      case 'rate-cards': return <FileText className="w-5 h-5 text-green-600" />;
      case 'insurance': return <Shield className="w-5 h-5 text-orange-600" />;
      case 'route-maps': return <MapPin className="w-5 h-5 text-red-600" />;
      case 'safety': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'client': return 'bg-blue-100 text-blue-800';
      case 'driver': return 'bg-green-100 text-green-800';
      case 'internal': return 'bg-gray-100 text-gray-800';
      case 'all': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Documents ({allDocuments.length})
        </h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Documents</span>
        </button>
      </div>

      {/* Document Categories Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        <button className="flex-1 px-4 py-2 bg-white rounded-md shadow-sm font-medium text-gray-900">
          All ({allDocuments.length})
        </button>
        <button className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium">
          Client ({clientDocuments.length})
        </button>
        <button className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium">
          Company ({companyDocuments.length})
        </button>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {allDocuments.map((doc) => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
        {allDocuments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No documents uploaded yet.
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <AdminUploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={(newDocs) => {
            setAdminDocuments([...adminDocuments, ...newDocs]);
            setShowUploadModal(false);
          }}
          requestId={request.id}
        />
      )}
    </div>
  );
}

function DocumentCard({ document }: { document: any }) {
  const getDocumentIcon = (category: string) => {
    switch (category) {
      case 'driver-instructions': return <Users className="w-5 h-5 text-blue-600" />;
      case 'permits': return <Shield className="w-5 h-5 text-purple-600" />;
      case 'rate-cards': return <FileText className="w-5 h-5 text-green-600" />;
      case 'insurance': return <Shield className="w-5 h-5 text-orange-600" />;
      case 'route-maps': return <MapPin className="w-5 h-5 text-red-600" />;
      case 'safety': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'client': return 'bg-blue-100 text-blue-800';
      case 'driver': return 'bg-green-100 text-green-800';
      case 'internal': return 'bg-gray-100 text-gray-800';
      case 'all': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-center space-x-3">
        {getDocumentIcon(document.category || document.type)}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <p className="font-medium text-gray-900">{document.fileName}</p>
            {document.isRequired && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                Required
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <span>{document.type}</span>
            <span>•</span>
            <span>{(document.fileSize / 1024 / 1024).toFixed(2)} MB</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              {document.uploadedByRole === 'admin' ? (
                <Building className="w-3 h-3" />
              ) : (
                <User className="w-3 h-3" />
              )}
              <span>{document.uploadedBy}</span>
            </span>
            {document.visibility && (
              <>
                <span>•</span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getVisibilityColor(document.visibility)}`}>
                  {document.visibility}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
          <Eye className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
          <Download className="w-4 h-4" />
        </button>
        {document.uploadedByRole === 'admin' && (
          <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function AdminUploadModal({
  onClose,
  onUpload,
  requestId
}: {
  onClose: () => void;
  onUpload: (documents: any[]) => void;
  requestId: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadConfig, setUploadConfig] = useState({
    category: 'driver-instructions',
    visibility: 'driver',
    isRequired: false,
    notes: ''
  });

  const documentCategories = [
    { value: 'driver-instructions', label: 'Driver Instructions', icon: Users },
    { value: 'permits', label: 'Transport Permits', icon: Shield },
    { value: 'rate-cards', label: 'Rate Cards & Pricing', icon: FileText },
    { value: 'insurance', label: 'Insurance Documents', icon: Shield },
    { value: 'route-maps', label: 'Route Maps & Contacts', icon: MapPin },
    { value: 'safety', label: 'Safety Protocols', icon: AlertTriangle },
    { value: 'other', label: 'Other Documents', icon: FileText }
  ];

  const visibilityOptions = [
    { value: 'all', label: 'Everyone (Client, Driver, Internal)' },
    { value: 'driver', label: 'Driver Only' },
    { value: 'client', label: 'Client Only' },
    { value: 'internal', label: 'Internal Only' }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    const newDocuments = files.map((file, index) => ({
      id: `admin-doc-${Date.now()}-${index}`,
      fileName: file.name,
      type: uploadConfig.category,
      fileSize: file.size,
      uploadedBy: 'Admin User',
      uploadedByRole: 'admin' as const,
      visibility: uploadConfig.visibility,
      category: uploadConfig.category,
      isRequired: uploadConfig.isRequired,
      createdAt: new Date().toISOString(),
      notes: uploadConfig.notes
    }));

    onUpload(newDocuments);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Upload Company Documents</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Document Configuration */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Category
              </label>
              <select
                value={uploadConfig.category}
                onChange={(e) => setUploadConfig({ ...uploadConfig, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {documentCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <select
                value={uploadConfig.visibility}
                onChange={(e) => setUploadConfig({ ...uploadConfig, visibility: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {visibilityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="required"
              checked={uploadConfig.isRequired}
              onChange={(e) => setUploadConfig({ ...uploadConfig, isRequired: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="required" className="text-sm font-medium text-gray-700">
              Mark as required for job completion
            </label>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop company documents here or click to upload
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Supports PDF, DOC, DOCX, JPG, JPEG, PNG files up to 10MB
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="admin-file-upload"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <label
              htmlFor="admin-file-upload"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
            >
              Choose Files
            </label>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Selected Files:</h4>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Paperclip className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={uploadConfig.notes}
              onChange={(e) => setUploadConfig({ ...uploadConfig, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any notes about these documents..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={files.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload {files.length} Document{files.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}