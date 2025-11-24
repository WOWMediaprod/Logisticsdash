'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getApiUrl } from '../../../lib/api-config';

// Demo company ID (in real app, this would come from auth)
const COMPANY_ID = 'cmfmbojit0000vj0ch078cnbu';

interface Document {
  id: string;
  type: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  ocrData?: any;
  job?: {
    id: string;
    status: string;
    client: { name: string; code: string };
    route: { code: string; origin: string; destination: string };
  };
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

const documentTypeColors = {
  BOL: 'bg-blue-100 text-blue-800 border-blue-200',
  INVOICE: 'bg-green-100 text-green-800 border-green-200',
  DELIVERY_NOTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  GATE_PASS: 'bg-purple-100 text-purple-800 border-purple-200',
  CUSTOMS: 'bg-red-100 text-red-800 border-red-200',
  INSURANCE: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PHOTO: 'bg-pink-100 text-pink-800 border-pink-200',
  SIGNATURE: 'bg-teal-100 text-teal-800 border-teal-200',
  OTHER: 'bg-gray-100 text-gray-800 border-gray-200',
};

const documentTypeIcons = {
  BOL: '📋',
  INVOICE: '💰',
  DELIVERY_NOTE: '📦',
  GATE_PASS: '🎫',
  CUSTOMS: '🛂',
  INSURANCE: '🛡️',
  PHOTO: '📸',
  SIGNATURE: '✍️',
  OTHER: '📄',
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string>('ALL');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('OTHER');
  const [uploadJobId, setUploadJobId] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [selectedJobId]);

  const fetchDocuments = async () => {
    try {
      const jobParam = selectedJobId === 'ALL' ? '' : `&jobId=${selectedJobId}`;
      const response = await fetch(getApiUrl(`/api/v1/documents?companyId=${COMPANY_ID}${jobParam}`));
      const data = await response.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadDocType); // Use selected type
      formData.append('enableOcr', 'true');

      // Associate with job if ID provided
      if (uploadJobId && uploadJobId.trim()) {
        formData.append('jobId', uploadJobId.trim());
      }

      // Add metadata about the upload
      const metadata = JSON.stringify({
        uploadedBy: 'admin',
        uploadedVia: 'admin-dashboard',
        jobReference: uploadJobId || 'none'
      });
      formData.append('metadata', metadata);

      const response = await fetch(getApiUrl('/api/v1/documents/upload'), {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully uploaded ${file.name}!`);
        fetchDocuments(); // Refresh the list
        // Reset the input
        event.target.value = '';
        // Reset form
        setUploadDocType('OTHER');
        setUploadJobId('');
      } else {
        alert(`Upload failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-LK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/v1/documents/${documentId}/download`));
      const data = await response.json();
      if (data.success && data.data.url) {
        const link = document.createElement('a');
        link.href = data.data.url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(getApiUrl(`/api/v1/documents/${documentId}`), {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        fetchDocuments(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading Documents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
              <p className="text-gray-600 mt-1">Manage job documents with OCR processing</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all shadow-lg"
                >
                  ← Back to Dashboard
                </motion.button>
              </Link>

              {/* Document Type Selector */}
              <select
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
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

              {/* Optional Job ID Input */}
              <input
                type="text"
                value={uploadJobId}
                onChange={(e) => setUploadJobId(e.target.value)}
                placeholder="Job ID (optional)"
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
              />

              <div className="relative">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.tiff"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                />
                <label htmlFor="file-upload">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg cursor-pointer flex items-center space-x-2"
                  >
                    {uploadingFile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <span>📁</span>
                        <span>Upload Document</span>
                      </>
                    )}
                  </motion.div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Documents</p>
                <p className="text-3xl font-bold text-gray-900">{documents.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-blue-600 text-xl">📄</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">OCR Processed</p>
                <p className="text-3xl font-bold text-green-600">
                  {documents.filter(doc => doc.ocrData).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-green-600 text-xl">🔍</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Storage Used</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatFileSize(documents.reduce((acc, doc) => acc + doc.fileSize, 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-purple-600 text-xl">💾</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Documents Grid */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {documents.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass p-6 rounded-2xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {documentTypeIcons[doc.type as keyof typeof documentTypeIcons] || documentTypeIcons.OTHER}
                  </div>
                  <div>
                    <div className={`px-3 py-1 rounded-lg text-sm font-semibold border ${documentTypeColors[doc.type as keyof typeof documentTypeColors] || documentTypeColors.OTHER}`}>
                      {doc.type.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {doc.ocrData && (
                    <div className="w-3 h-3 bg-green-500 rounded-full" title="OCR Processed"></div>
                  )}
                </div>
              </div>

              {/* File Info */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 truncate" title={doc.fileName}>
                  {doc.fileName}
                </h3>
                <p className="text-sm text-gray-600">
                  {formatFileSize(doc.fileSize)} • {doc.mimeType}
                </p>
              </div>

              {/* Job Info */}
              {doc.job && (
                <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-blue-600 text-sm font-semibold">Job:</span>
                    <span className="text-gray-900 font-mono text-sm">{doc.job.client.code}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {doc.job.route.origin} → {doc.job.route.destination}
                  </div>
                </div>
              )}

              {/* Creator & Date */}
              <div className="mb-4 text-sm text-gray-600">
                <p>Uploaded by {doc.creator.firstName} {doc.creator.lastName}</p>
                <p>{formatDate(doc.createdAt)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => downloadDocument(doc.id, doc.fileName)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  📥 Download
                </motion.button>

                {doc.ocrData && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      alert(`OCR Text: ${JSON.stringify(doc.ocrData, null, 2)}`);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                  >
                    🔍
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => deleteDocument(doc.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  🗑️
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {documents.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600">Upload your first document to get started with document management.</p>
          </div>
        )}
      </div>
    </div>
  );
}