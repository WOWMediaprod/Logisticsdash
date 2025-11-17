'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  Image,
  File,
  Search,
  Filter,
  Calendar,
  Eye,
  Trash2
} from 'lucide-react';
import { useCompany } from '../../../contexts/CompanyContext';
import { getApiUrl } from '../../../lib/api-config';

type DocumentType =
  | 'BOL'
  | 'INVOICE'
  | 'DELIVERY_NOTE'
  | 'GATE_PASS'
  | 'CUSTOMS'
  | 'INSURANCE'
  | 'PHOTO'
  | 'SIGNATURE'
  | 'RELEASE_ORDER'
  | 'CDN'
  | 'LOADING_PASS'
  | 'FCL_DOCUMENT'
  | 'OTHER';

interface Document {
  id: string;
  fileName: string;
  type: DocumentType;
  fileSize: number;
  mimeType: string;
  uploadedDate: string;
  jobId?: string;
  isOriginal: boolean;
  ocrData?: any;
  job?: {
    id: string;
    jobType: string;
    status: string;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function DocumentsPage() {
  const { companyId } = useCompany();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadDocuments = async () => {
      if (!companyId) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(getApiUrl(`/api/v1/documents`), {
          headers: { 'Accept': 'application/json' }
        });

        if (!cancelled) {
          const json = await response.json();
          if (json.success) {
            // Transform backend document data to match frontend interface
            const transformedDocs: Document[] = json.data.map((doc: any) => ({
              id: doc.id,
              fileName: doc.fileName,
              type: doc.type,
              fileSize: doc.fileSize,
              mimeType: doc.mimeType,
              uploadedDate: doc.createdAt,
              jobId: doc.jobId,
              isOriginal: doc.isOriginal,
              ocrData: doc.ocrData,
              job: doc.job,
              creator: doc.creator
            }));
            setDocuments(transformedDocs);
          }
        }
      } catch (error) {
        console.error('Failed to load documents', error);
        if (!cancelled) {
          setDocuments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.jobId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.job?.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;

    return matchesSearch && matchesType;
  });

  if (!companyId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="glass max-w-xl mx-auto p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Company not selected</h1>
          <p className="text-gray-600">
            Please select a company to view documents.
          </p>
        </div>
      </main>
    );
  }

  if (loading && documents.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading documents...</span>
        </div>
      </main>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string, type: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/client"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Portal
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
            <p className="text-gray-600">Manage your job-related documents and files</p>
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </button>
        </div>
      </motion.div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="RELEASE_ORDER">Release Order</option>
                <option value="CDN">CDN</option>
                <option value="LOADING_PASS">Loading Pass</option>
                <option value="FCL_DOCUMENT">FCL Document</option>
                <option value="BOL">Bill of Lading</option>
                <option value="INVOICE">Invoice</option>
                <option value="DELIVERY_NOTE">Delivery Note</option>
                <option value="GATE_PASS">Gate Pass</option>
                <option value="CUSTOMS">Customs</option>
                <option value="INSURANCE">Insurance</option>
                <option value="PHOTO">Photo</option>
                <option value="SIGNATURE">Signature</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-1">Total Documents</h3>
            <p className="text-2xl font-bold text-blue-700">{documents.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-1">Originals</h3>
            <p className="text-2xl font-bold text-green-700">
              {documents.filter(d => d.isOriginal).length}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-1">With OCR</h3>
            <p className="text-2xl font-bold text-purple-700">
              {documents.filter(d => d.ocrData).length}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {filteredDocuments.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
          {filteredDocuments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No documents found matching your search criteria.
            </div>
          )}
        </div>
      </div>

      {uploadOpen && (
        <UploadModal onClose={() => setUploadOpen(false)} />
      )}
    </div>
  );
}

function DocumentCard({ document }: { document: Document }) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RELEASE_ORDER': return 'bg-red-100 text-red-800';
      case 'CDN': return 'bg-orange-100 text-orange-800';
      case 'LOADING_PASS': return 'bg-yellow-100 text-yellow-800';
      case 'FCL_DOCUMENT': return 'bg-indigo-100 text-indigo-800';
      case 'BOL': return 'bg-blue-100 text-blue-800';
      case 'INVOICE': return 'bg-purple-100 text-purple-800';
      case 'DELIVERY_NOTE': return 'bg-green-100 text-green-800';
      case 'GATE_PASS': return 'bg-teal-100 text-teal-800';
      case 'CUSTOMS': return 'bg-pink-100 text-pink-800';
      case 'INSURANCE': return 'bg-cyan-100 text-cyan-800';
      case 'PHOTO': return 'bg-lime-100 text-lime-800';
      case 'SIGNATURE': return 'bg-violet-100 text-violet-800';
      case 'OTHER': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 text-gray-600 p-2 rounded-lg">
            {getFileIcon(document.mimeType)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{document.fileName}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{formatFileSize(document.fileSize)}</span>
              <span>•</span>
              <span>{new Date(document.uploadedDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(document.type)}`}>
            {document.type.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">
          {document.job && (
            <span>Job: {document.job.id} • {document.job.jobType}</span>
          )}
          {!document.job && document.jobId && (
            <span>Job: {document.jobId}</span>
          )}
        </div>
        {document.isOriginal ? (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
            Original
          </span>
        ) : (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">
            Copy
          </span>
        )}
      </div>

      {document.ocrData && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">OCR Available:</span> Text extracted from document
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={async () => {
              try {
                const response = await fetch(getApiUrl(`/api/v1/documents/${document.id}/download`));
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
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View document"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              try {
                const response = await fetch(getApiUrl(`/api/v1/documents/${document.id}/download`));
                const data = await response.json();
                if (data.success && data.data.url) {
                  const link = window.document.createElement('a');
                  link.href = data.data.url;
                  link.download = document.fileName;
                  link.click();
                } else {
                  alert('Failed to get document URL');
                }
              } catch (error) {
                console.error('Error downloading document:', error);
                alert('Failed to download document');
              }
            }}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Download document"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              if (!confirm('Are you sure you want to delete this document?')) return;
              try {
                const response = await fetch(getApiUrl(`/api/v1/documents/${document.id}`), {
                  method: 'DELETE'
                });
                const data = await response.json();
                if (data.success) {
                  alert('Document deleted successfully');
                  window.location.reload();
                } else {
                  alert('Failed to delete document');
                }
              } catch (error) {
                console.error('Error deleting document:', error);
                alert('Failed to delete document');
              }
            }}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-gray-500">
          Uploaded: {new Date(document.uploadedDate).toLocaleString()}
        </div>
      </div>
    </motion.div>
  );
}

function UploadModal({ onClose }: { onClose: () => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadType, setUploadType] = useState('RELEASE_ORDER');
  const [jobReference, setJobReference] = useState('');

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
    // Simulate upload
    console.log('Uploading files:', files);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Upload Documents</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="RELEASE_ORDER">Release Order</option>
                <option value="CDN">CDN (Container Delivery Note)</option>
                <option value="LOADING_PASS">Loading Pass</option>
                <option value="FCL_DOCUMENT">FCL Document</option>
                <option value="BOL">Bill of Lading</option>
                <option value="INVOICE">Invoice</option>
                <option value="DELIVERY_NOTE">Delivery Note</option>
                <option value="GATE_PASS">Gate Pass</option>
                <option value="CUSTOMS">Customs</option>
                <option value="INSURANCE">Insurance</option>
                <option value="PHOTO">Photo</option>
                <option value="SIGNATURE">Signature</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job/Request Reference
              </label>
              <input
                type="text"
                value={jobReference}
                onChange={(e) => setJobReference(e.target.value)}
                placeholder="e.g., JOB-2024-0156 or REQ-2024-0089"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

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
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Supports PDF, DOC, DOCX, JPG, JPEG, PNG files up to 10MB
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload-modal"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <label
              htmlFor="file-upload-modal"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
            >
              Choose Files
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Selected Files:</h4>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-600" />
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
              Upload {files.length} file{files.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}