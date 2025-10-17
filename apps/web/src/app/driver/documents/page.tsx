'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Shield,
  Users,
  Calendar,
  Clock,
  Search,
  Filter
} from 'lucide-react';

interface DriverDocument {
  id: string;
  fileName: string;
  category: 'driver-instructions' | 'permits' | 'route-maps' | 'safety' | 'rate-cards' | 'insurance' | 'other';
  fileSize: number;
  isRequired: boolean;
  isAcknowledged: boolean;
  jobId?: string;
  uploadedAt: string;
  description?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// Mock data for driver documents
const mockDriverDocuments: DriverDocument[] = [
  {
    id: 'driver-doc-001',
    fileName: 'Driver_Route_Instructions_JOB156.pdf',
    category: 'driver-instructions',
    fileSize: 524288,
    isRequired: true,
    isAcknowledged: false,
    jobId: 'JOB-2024-0156',
    uploadedAt: '2024-09-21T15:30:00Z',
    description: 'Specific route instructions and contact details for Job #156',
    priority: 'urgent'
  },
  {
    id: 'driver-doc-002',
    fileName: 'Transport_Permit_GP_to_WC.pdf',
    category: 'permits',
    fileSize: 1048576,
    isRequired: true,
    isAcknowledged: true,
    uploadedAt: '2024-09-21T16:00:00Z',
    description: 'Provincial transport permit for Gauteng to Western Cape',
    priority: 'high'
  },
  {
    id: 'driver-doc-003',
    fileName: 'Emergency_Contact_List.pdf',
    category: 'safety',
    fileSize: 256000,
    isRequired: true,
    isAcknowledged: true,
    uploadedAt: '2024-09-20T10:00:00Z',
    description: 'Emergency contacts along the route',
    priority: 'high'
  },
  {
    id: 'driver-doc-004',
    fileName: 'Route_Map_N3_Durban.pdf',
    category: 'route-maps',
    fileSize: 2048000,
    isRequired: false,
    isAcknowledged: false,
    uploadedAt: '2024-09-21T14:00:00Z',
    description: 'Detailed route map with truck stops and facilities',
    priority: 'normal'
  },
  {
    id: 'driver-doc-005',
    fileName: 'Vehicle_Inspection_Checklist.pdf',
    category: 'safety',
    fileSize: 512000,
    isRequired: true,
    isAcknowledged: false,
    uploadedAt: '2024-09-22T08:00:00Z',
    description: 'Pre-trip inspection checklist for vehicle GP123456',
    priority: 'urgent'
  }
];

export default function DriverDocumentsPage() {
  const [documents] = useState<DriverDocument[]>(mockDriverDocuments);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.jobId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'required' && doc.isRequired) ||
                         (filterStatus === 'acknowledged' && doc.isAcknowledged) ||
                         (filterStatus === 'pending' && doc.isRequired && !doc.isAcknowledged);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const requiredDocuments = documents.filter(doc => doc.isRequired);
  const acknowledgedDocuments = documents.filter(doc => doc.isAcknowledged);
  const pendingDocuments = documents.filter(doc => doc.isRequired && !doc.isAcknowledged);

  const handleAcknowledge = (docId: string) => {
    // In a real app, this would make an API call
    console.log('Acknowledging document:', docId);
  };

  const handleDownload = (doc: DriverDocument) => {
    // In a real app, this would trigger a download
    console.log('Downloading document:', doc.fileName);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <Link
              href="/driver"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Portal
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Job Documents</h1>
            <p className="text-gray-600">Company provided documents for your current jobs</p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total"
            value={documents.length}
            icon={<FileText className="w-5 h-5" />}
            color="blue"
          />
          <StatsCard
            title="Required"
            value={requiredDocuments.length}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="orange"
          />
          <StatsCard
            title="Pending"
            value={pendingDocuments.length}
            icon={<Clock className="w-5 h-5" />}
            color="red"
          />
          <StatsCard
            title="Completed"
            value={acknowledgedDocuments.length}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
          />
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-4"
        >
          <div className="flex flex-col space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documents..."
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-4">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="driver-instructions">Driver Instructions</option>
                <option value="permits">Permits</option>
                <option value="route-maps">Route Maps</option>
                <option value="safety">Safety</option>
                <option value="rate-cards">Rate Cards</option>
                <option value="insurance">Insurance</option>
                <option value="other">Other</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="required">Required</option>
                <option value="pending">Pending Review</option>
                <option value="acknowledged">Acknowledged</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Documents List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredDocuments.map((doc, index) => (
            <DriverDocumentCard
              key={doc.id}
              document={doc}
              onAcknowledge={handleAcknowledge}
              onDownload={handleDownload}
              delay={index * 0.05}
            />
          ))}
          {filteredDocuments.length === 0 && (
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No documents found matching your criteria.</p>
            </div>
          )}
        </motion.div>

        {/* Footer space for mobile navigation */}
        <div className="h-20" />
      </div>
    </main>
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
  color: 'blue' | 'orange' | 'red' | 'green';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-4"
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600">{title}</p>
        </div>
      </div>
    </motion.div>
  );
}

function DriverDocumentCard({
  document,
  onAcknowledge,
  onDownload,
  delay
}: {
  document: DriverDocument;
  onAcknowledge: (docId: string) => void;
  onDownload: (doc: DriverDocument) => void;
  delay: number;
}) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'driver-instructions': return <Users className="w-5 h-5 text-blue-600" />;
      case 'permits': return <Shield className="w-5 h-5 text-purple-600" />;
      case 'route-maps': return <MapPin className="w-5 h-5 text-red-600" />;
      case 'safety': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'rate-cards': return <FileText className="w-5 h-5 text-green-600" />;
      case 'insurance': return <Shield className="w-5 h-5 text-orange-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`bg-white/80 backdrop-blur-sm border rounded-2xl p-4 hover:shadow-lg transition-all ${
        document.isRequired && !document.isAcknowledged
          ? 'border-orange-200 bg-orange-50/50'
          : 'border-gray-200'
      }`}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {getCategoryIcon(document.category)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-gray-900 truncate">{document.fileName}</h3>
            {document.isRequired && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded flex-shrink-0">
                Required
              </span>
            )}
            <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(document.priority)} flex-shrink-0`}>
              {document.priority.toUpperCase()}
            </span>
          </div>

          {document.description && (
            <p className="text-sm text-gray-600 mb-3">{document.description}</p>
          )}

          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
            <span className="capitalize">{document.category.replace('-', ' ')}</span>
            <span>•</span>
            <span>{formatFileSize(document.fileSize)}</span>
            <span>•</span>
            <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
            {document.jobId && (
              <>
                <span>•</span>
                <span className="font-medium text-blue-600">{document.jobId}</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {document.isAcknowledged ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Acknowledged</span>
                </div>
              ) : document.isRequired ? (
                <div className="flex items-center space-x-1 text-orange-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Review Required</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">Optional</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onDownload(document)}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
              {document.isRequired && !document.isAcknowledged && (
                <button
                  onClick={() => onAcknowledge(document.id)}
                  className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}