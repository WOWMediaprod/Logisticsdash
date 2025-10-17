'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  File,
} from 'lucide-react';

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

interface UploadFormData {
  file: File | null;
  type: DocumentType;
  isOriginal: boolean;
  jobId: string;
  notes: string;
}

export default function DriverUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UploadFormData>({
    file: null,
    type: 'CDN',
    isOriginal: true,
    jobId: '',
    notes: '',
  });

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, JPEG, PNG, or TIFF files.');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit.');
      return;
    }

    setFormData(prev => ({ ...prev, file }));
    setError(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.file || !formData.jobId) {
      setError('Please select a file and enter a job ID.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', formData.file);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('isOriginal', formData.isOriginal.toString());
      formDataToSend.append('jobId', formData.jobId);
      if (formData.notes) {
        formDataToSend.append('metadata', JSON.stringify({ notes: formData.notes }));
      }

      const response = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/driver/documents');
        }, 2000);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload document. Please check your connection.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-sm border border-green-200 rounded-2xl p-8 max-w-md mx-4 text-center"
        >
          <div className="bg-green-100 p-4 rounded-full inline-block mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your document has been uploaded and is being processed.
          </p>
          <p className="text-sm text-gray-500">Redirecting to documents...</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/driver"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portal
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
          <p className="text-gray-600">Upload job-related documents for processing</p>
        </motion.div>

        {/* Upload Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* File Upload Area */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Document File *
            </label>

            {!formData.file ? (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Drag and drop your file here, or
                </p>
                <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                  Browse Files
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.tiff"
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-3">
                  Supported: PDF, JPEG, PNG, TIFF (Max 50MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <File className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{formData.file.name}</p>
                    <p className="text-sm text-gray-600">{formatFileSize(formData.file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Document Type */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Document Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as DocumentType }))}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
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

          {/* Original/Copy Toggle */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Document Status
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.isOriginal === true}
                  onChange={() => setFormData(prev => ({ ...prev, isOriginal: true }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">Original</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.isOriginal === false}
                  onChange={() => setFormData(prev => ({ ...prev, isOriginal: false }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">Copy</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Indicate whether this is an original document or a copy
            </p>
          </div>

          {/* Job ID */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Job ID *
            </label>
            <input
              type="text"
              value={formData.jobId}
              onChange={(e) => setFormData(prev => ({ ...prev, jobId: e.target.value }))}
              placeholder="e.g., JOB001, JOB-2024-0156"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Enter the job ID this document is related to
            </p>
          </div>

          {/* Notes */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional notes about this document..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-4">
            <Link
              href="/driver"
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={uploading || !formData.file || !formData.jobId}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 ${
                uploading || !formData.file || !formData.jobId
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-2xl p-4"
        >
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Document Upload Guidelines:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Upload CDN after container delivery</li>
                <li>Upload FCL documents at yard return</li>
                <li>Ensure documents are clear and readable</li>
                <li>Mark originals correctly for compliance</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
