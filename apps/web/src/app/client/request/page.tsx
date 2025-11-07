'use client';

import { useState, useEffect } from 'react';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCompany } from '../../../contexts/CompanyContext';
import { useClientAuth } from '../../../contexts/ClientAuthContext';
import { getApiUrl } from '../../../lib/api-config';
import AddressAutocomplete from '../../../components/AddressAutocomplete';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Calendar,
  Package,
  FileText,
  Upload,
  CheckCircle,
  Truck,
  Ship,
  AlertTriangle,
  X,
  Clock,
  Paperclip
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface JobRequestFormData {
  // Basic info
  title: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  // New: Shipment type
  shipmentType: 'EXPORT' | 'IMPORT' | 'LCL';

  // Documents
  releaseOrderFile: File | null;
  supportingDocuments: File[];

  // Loading information
  loadingLocation: string;
  loadingLocationLat: number;
  loadingLocationLng: number;
  loadingContactName: string;
  loadingContactPhone: string;
  loadingDate: string;
  loadingTime: string;

  // Container reservation (conditional)
  containerReservation: boolean;
  containerNumber: string;
  sealNumber: string;
  containerYardLocation: string;
  containerYardLocationLat: number;
  containerYardLocationLng: number;

  // Cargo details
  cargoDescription: string;
  cargoWeight: string;
  cargoWeightUnit: 'kg' | 'tons';

  // BL Cutoff (conditional)
  blCutoffRequired: boolean;
  blCutoffDate: string;
  blCutoffTime: string;

  // Wharf information
  wharfName: string;
  wharfContact: string;

  // Delivery information
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  deliveryContactName: string;
  deliveryContactPhone: string;

  // Additional notes
  specialRequirements: string;
}

const initialFormData: JobRequestFormData = {
  title: '',
  priority: 'NORMAL',
  shipmentType: 'EXPORT',
  releaseOrderFile: null,
  supportingDocuments: [],
  loadingLocation: '',
  loadingLocationLat: 0,
  loadingLocationLng: 0,
  loadingContactName: '',
  loadingContactPhone: '',
  loadingDate: '',
  loadingTime: '',
  containerReservation: false,
  containerNumber: '',
  sealNumber: '',
  containerYardLocation: '',
  containerYardLocationLat: 0,
  containerYardLocationLng: 0,
  cargoDescription: '',
  cargoWeight: '',
  cargoWeightUnit: 'kg',
  blCutoffRequired: false,
  blCutoffDate: '',
  blCutoffTime: '',
  wharfName: '',
  wharfContact: '',
  deliveryAddress: '',
  deliveryLat: 0,
  deliveryLng: 0,
  deliveryContactName: '',
  deliveryContactPhone: '',
  specialRequirements: ''
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function JobRequestPage() {
  const { companyId } = useCompany();
  const { clientId, clientName, clientCode } = useClientAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [formData, setFormData] = useState<JobRequestFormData>(initialFormData);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const uploadFile = async (file: File, type: string): Promise<{id: string; fileUrl: string}> => {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('type', type);
    uploadFormData.append('enableOcr', 'false');

    // Add client tracking metadata
    if (clientId) {
      const metadata = JSON.stringify({
        uploadedBy: 'client',
        clientId: clientId,
        clientName: clientName || 'Unknown'
      });
      uploadFormData.append('metadata', metadata);
    }

    const response = await fetch(getApiUrl('/api/v1/documents/upload'), {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${file.name}`);
    }

    const result = await response.json();
    return {
      id: result.data.id,
      fileUrl: result.data.fileUrl
    };
  };

  const handleSubmit = async () => {
    if (!companyId || !clientId) {
      alert('Missing company or client information');
      return;
    }

    setSubmitting(true);

    try {
      // Upload release order if provided
      let releaseOrderUrl = '';
      let releaseOrderDocId = '';
      if (formData.releaseOrderFile) {
        setUploadProgress({ releaseOrder: 0 });
        const result = await uploadFile(formData.releaseOrderFile, 'RELEASE_ORDER');
        releaseOrderUrl = result.fileUrl;
        releaseOrderDocId = result.id;
        setUploadProgress({ releaseOrder: 100 });
      }

      // Upload supporting documents if provided
      const supportingDocIds: string[] = [];

      // Include release order document if uploaded
      if (releaseOrderDocId) {
        supportingDocIds.push(releaseOrderDocId);
        console.log('[Client Request] Added release order document to supportingDocIds:', releaseOrderDocId);
      }

      if (formData.supportingDocuments.length > 0) {
        for (let i = 0; i < formData.supportingDocuments.length; i++) {
          const doc = formData.supportingDocuments[i];
          setUploadProgress(prev => ({ ...prev, [`doc_${i}`]: 0 }));
          const result = await uploadFile(doc, 'OTHER');
          supportingDocIds.push(result.id);
          setUploadProgress(prev => ({ ...prev, [`doc_${i}`]: 100 }));
        }
      }

      console.log('[Client Request] Total supporting documents:', supportingDocIds.length, supportingDocIds);

      // Combine date and time fields
      const loadingDateTime = formData.loadingDate && formData.loadingTime
        ? new Date(`${formData.loadingDate}T${formData.loadingTime}`).toISOString()
        : undefined;

      const blCutoffDateTime = formData.blCutoffRequired && formData.blCutoffDate && formData.blCutoffTime
        ? new Date(`${formData.blCutoffDate}T${formData.blCutoffTime}`).toISOString()
        : undefined;

      const payload = {
        companyId,
        clientId,
        title: formData.title,
        priority: formData.priority,
        shipmentType: formData.shipmentType,
        releaseOrderUrl: releaseOrderUrl || undefined,
        supportingDocumentIds: supportingDocIds.length > 0 ? supportingDocIds : undefined,
        loadingLocation: formData.loadingLocation,
        loadingLocationLat: formData.loadingLocationLat || undefined,
        loadingLocationLng: formData.loadingLocationLng || undefined,
        loadingContactName: formData.loadingContactName,
        loadingContactPhone: formData.loadingContactPhone,
        loadingDate: loadingDateTime,
        loadingTime: formData.loadingTime,
        containerReservation: formData.containerReservation,
        containerNumber: formData.containerReservation ? formData.containerNumber : undefined,
        sealNumber: formData.containerReservation ? formData.sealNumber : undefined,
        containerYardLocation: formData.containerReservation ? formData.containerYardLocation : undefined,
        containerYardLocationLat: formData.containerReservation ? formData.containerYardLocationLat : undefined,
        containerYardLocationLng: formData.containerReservation ? formData.containerYardLocationLng : undefined,
        cargoDescription: formData.cargoDescription,
        cargoWeight: formData.cargoWeight ? parseFloat(formData.cargoWeight) : undefined,
        cargoWeightUnit: formData.cargoWeightUnit,
        blCutoffRequired: formData.blCutoffRequired,
        blCutoffDateTime: blCutoffDateTime,
        wharfName: formData.wharfName,
        wharfContact: formData.wharfContact,
        deliveryAddress: formData.deliveryAddress,
        deliveryLat: formData.deliveryLat || undefined,
        deliveryLng: formData.deliveryLng || undefined,
        deliveryContactName: formData.deliveryContactName,
        deliveryContactPhone: formData.deliveryContactPhone,
        specialRequirements: formData.specialRequirements || undefined,
      };

      const response = await fetch(getApiUrl('/api/v1/job-requests'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setRequestId(result.data.id);
        setSubmitted(true);
      } else {
        alert(`Failed to submit request: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting job request:', error);
      alert(`Failed to submit request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
      setUploadProgress({});
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl p-12 text-center shadow-lg"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Request Submitted!</h1>
          <p className="text-gray-600 mb-2">Your job request has been submitted for review.</p>
          <p className="text-sm text-gray-500 mb-8">Request ID: <span className="font-mono font-semibold">{requestId}</span></p>
          <div className="space-y-3">
            <Link
              href="/client/dashboard"
              className="block w-full bg-blue-600 text-white rounded-xl py-3 px-6 hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </Link>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData(initialFormData);
                setStep(1);
              }}
              className="block w-full bg-gray-100 text-gray-700 rounded-xl py-3 px-6 hover:bg-gray-200 transition-colors"
            >
              Submit Another Request
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/client/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">New Job Request</h1>
            <p className="text-gray-600">Submit a new logistics request for review</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Client</p>
            <p className="font-semibold text-gray-900">{clientName}</p>
            <p className="text-sm text-gray-500">{clientCode}</p>
          </div>
        </div>
      </motion.div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-8 shadow-lg">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="flex items-center flex-1">
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step >= num
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {num}
                  </div>
                  <span className="text-xs mt-2 font-medium text-gray-600 absolute top-12 whitespace-nowrap">
                    {num === 1 && 'Basic Info'}
                    {num === 2 && 'Loading & Cargo'}
                    {num === 3 && 'Container & BL'}
                    {num === 4 && 'Wharf & Delivery'}
                    {num === 5 && 'Review'}
                  </span>
                </div>
                {num < 5 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-colors ${
                      step > num ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <Step1BasicInfo
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
            />
          )}
          {step === 2 && (
            <Step2LoadingCargo
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
          {step === 3 && (
            <Step3ContainerBL
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
          {step === 4 && (
            <Step4WharfDelivery
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
          {step === 5 && (
            <Step5Review
              formData={formData}
              onSubmit={handleSubmit}
              onPrevious={handlePrevious}
              submitting={submitting}
              onEdit={(stepNum) => setStep(stepNum)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 1: BASIC INFO
// ============================================================================

interface StepProps {
  formData: JobRequestFormData;
  setFormData: React.Dispatch<React.SetStateAction<JobRequestFormData>>;
  onNext: () => void;
  onPrevious?: () => void;
}

function Step1BasicInfo({ formData, setFormData, onNext }: StepProps) {
  const canProceed = formData.title && formData.shipmentType;
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, JPG, or PNG file');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setFormData({ ...formData, releaseOrderFile: file });
    }
  };

  const removeFile = () => {
    setFormData({ ...formData, releaseOrderFile: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>

      {/* Job Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Job Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Container Export to Colombo Port"
          required
        />
      </div>

      {/* Priority Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Priority Level
        </label>
        <div className="grid grid-cols-4 gap-3">
          {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).map((priority) => (
            <button
              key={priority}
              type="button"
              onClick={() => setFormData({ ...formData, priority })}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                formData.priority === priority
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {priority}
            </button>
          ))}
        </div>
      </div>

      {/* Shipment Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Shipment Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-4">
          {(['EXPORT', 'IMPORT', 'LCL'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({ ...formData, shipmentType: type })}
              className={`py-4 px-6 rounded-xl font-medium transition-all flex flex-col items-center gap-2 ${
                formData.shipmentType === type
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Ship className="w-6 h-6" />
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Release Order Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Release Order Document
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-500 transition-colors">
          {!formData.releaseOrderFile ? (
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">Upload Release Order</p>
              <p className="text-xs text-gray-500 mb-4">PDF, JPG, or PNG (max 10MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                id="release-order-upload"
              />
              <label
                htmlFor="release-order-upload"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 cursor-pointer transition-colors"
              >
                Choose File
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{formData.releaseOrderFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(formData.releaseOrderFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// STEP 2: LOADING & CARGO
// ============================================================================

function Step2LoadingCargo({ formData, setFormData, onNext, onPrevious }: StepProps) {
  const canProceed = formData.loadingLocation && formData.cargoDescription && formData.loadingContactName && formData.loadingContactPhone;

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Loading & Cargo Details</h2>

      {/* Loading Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loading Location (Goods) <span className="text-red-500">*</span>
        </label>
        <AddressAutocomplete
          value={formData.loadingLocation}
          onChange={(result) => {
            setFormData({
              ...formData,
              loadingLocation: result.address,
              loadingLocationLat: result.lat || 0,
              loadingLocationLng: result.lng || 0
            });
          }}
          placeholder="Enter loading location address"
        />
      </div>

      {/* Loading Contact - Split into Name and Phone */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loading Contact Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.loadingContactName}
            onChange={(e) => setFormData({ ...formData, loadingContactName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., John Doe"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loading Contact Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.loadingContactPhone}
            onChange={(e) => setFormData({ ...formData, loadingContactPhone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., +94 77 123 4567"
            required
          />
        </div>
      </div>

      {/* Loading Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loading Date
          </label>
          <input
            type="date"
            value={formData.loadingDate}
            onChange={(e) => setFormData({ ...formData, loadingDate: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loading Time
          </label>
          <input
            type="time"
            value={formData.loadingTime}
            onChange={(e) => setFormData({ ...formData, loadingTime: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Cargo Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cargo Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.cargoDescription}
          onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Describe the cargo contents"
          required
        />
      </div>

      {/* Cargo Weight */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cargo Weight
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.cargoWeight}
            onChange={(e) => setFormData({ ...formData, cargoWeight: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter weight"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unit
          </label>
          <select
            value={formData.cargoWeightUnit}
            onChange={(e) => setFormData({ ...formData, cargoWeightUnit: e.target.value as 'kg' | 'tons' })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="kg">kg</option>
            <option value="tons">tons</option>
          </select>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrevious}
          className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// STEP 3: CONTAINER & BL CUTOFF
// ============================================================================

function Step3ContainerBL({ formData, setFormData, onNext, onPrevious }: StepProps) {
  const canProceed = !formData.containerReservation || (
    formData.containerReservation &&
    formData.containerNumber &&
    formData.sealNumber &&
    formData.containerYardLocation
  );

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Container & BL Cutoff</h2>

      {/* Container Reservation Toggle */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Container Reservation</h3>
            <p className="text-sm text-gray-600">Do you have a reserved container?</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, containerReservation: !formData.containerReservation })}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              formData.containerReservation ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                formData.containerReservation ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Conditional Container Fields */}
        <AnimatePresence>
          {formData.containerReservation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 mt-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Container Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.containerNumber}
                    onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., MSCU1234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seal Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sealNumber}
                    onChange={(e) => setFormData({ ...formData, sealNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., SEAL123456"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Container Reserved Yard Location <span className="text-red-500">*</span>
                </label>
                <AddressAutocomplete
                  value={formData.containerYardLocation}
                  onChange={(result) => {
                    setFormData({
                      ...formData,
                      containerYardLocation: result.address,
                      containerYardLocationLat: result.lat || 0,
                      containerYardLocationLng: result.lng || 0
                    });
                  }}
                  placeholder="Enter container yard location"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BL Cutoff Toggle */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">BL Cutoff</h3>
            <p className="text-sm text-gray-600">Is there a Bill of Lading cutoff deadline?</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, blCutoffRequired: !formData.blCutoffRequired })}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              formData.blCutoffRequired ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                formData.blCutoffRequired ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Conditional BL Cutoff Fields */}
        <AnimatePresence>
          {formData.blCutoffRequired && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-4 mt-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cutoff Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.blCutoffDate}
                  onChange={(e) => setFormData({ ...formData, blCutoffDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cutoff Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.blCutoffTime}
                  onChange={(e) => setFormData({ ...formData, blCutoffTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrevious}
          className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// STEP 4: WHARF & DELIVERY
// ============================================================================

function Step4WharfDelivery({ formData, setFormData, onNext, onPrevious }: StepProps) {
  const canProceed = formData.deliveryAddress && formData.deliveryContactName && formData.deliveryContactPhone;
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Validate each file
      const validFiles: File[] = [];
      for (const file of files) {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
          alert(`${file.name}: Please upload PDF, JPG, or PNG files only`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name}: File size must be less than 10MB`);
          continue;
        }
        validFiles.push(file);
      }
      setFormData({
        ...formData,
        supportingDocuments: [...formData.supportingDocuments, ...validFiles]
      });
    }
  };

  const removeDocument = (index: number) => {
    const newDocs = formData.supportingDocuments.filter((_, i) => i !== index);
    setFormData({ ...formData, supportingDocuments: newDocs });
  };

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Wharf & Delivery</h2>

      {/* Wharf Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Wharf Name
        </label>
        <input
          type="text"
          value={formData.wharfName}
          onChange={(e) => setFormData({ ...formData, wharfName: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Colombo Port Wharf 3"
        />
      </div>

      {/* Wharf Contact */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Wharf Contact (Name & Phone)
        </label>
        <input
          type="text"
          value={formData.wharfContact}
          onChange={(e) => setFormData({ ...formData, wharfContact: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Jane Smith - +94 77 987 6543"
        />
      </div>

      <div className="border-t border-gray-200 my-6 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>
      </div>

      {/* Delivery Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Delivery Address <span className="text-red-500">*</span>
        </label>
        <AddressAutocomplete
          value={formData.deliveryAddress}
          onChange={(result) => {
            setFormData({
              ...formData,
              deliveryAddress: result.address,
              deliveryLat: result.lat || 0,
              deliveryLng: result.lng || 0
            });
          }}
          placeholder="Enter delivery destination address"
        />
      </div>

      {/* Delivery Contact - Split into Name and Phone */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Contact Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.deliveryContactName}
            onChange={(e) => setFormData({ ...formData, deliveryContactName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Mike Johnson"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Contact Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.deliveryContactPhone}
            onChange={(e) => setFormData({ ...formData, deliveryContactPhone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., +94 77 555 1234"
            required
          />
        </div>
      </div>

      {/* Special Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Special Requirements / Notes
        </label>
        <textarea
          value={formData.specialRequirements}
          onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Any special handling instructions, requirements, or notes..."
        />
      </div>

      {/* Supporting Documents Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Supporting Documents
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-500 transition-colors">
          <div className="text-center mb-4">
            <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">Upload Additional Documents</p>
            <p className="text-xs text-gray-500 mb-4">PDF, JPG, or PNG (max 10MB each)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              onChange={handleFilesSelect}
              className="hidden"
              id="supporting-docs-upload"
            />
            <label
              htmlFor="supporting-docs-upload"
              className="inline-block bg-gray-600 text-white px-6 py-2 rounded-xl hover:bg-gray-700 cursor-pointer transition-colors"
            >
              Choose Files
            </label>
          </div>

          {formData.supportingDocuments.length > 0 && (
            <div className="space-y-2">
              {formData.supportingDocuments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrevious}
          className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          Review Request
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// STEP 5: REVIEW & SUBMIT
// ============================================================================

interface Step5Props extends Omit<StepProps, 'onNext' | 'setFormData'> {
  onSubmit: () => void;
  submitting: boolean;
  onEdit: (step: number) => void;
}

function Step5Review({ formData, onSubmit, onPrevious, submitting, onEdit }: Step5Props) {
  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Request</h2>

      {/* Section: Basic Info */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Basic Information</h3>
          <button
            onClick={() => onEdit(1)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Job Title:</span>
            <p className="font-medium">{formData.title}</p>
          </div>
          <div>
            <span className="text-gray-600">Priority:</span>
            <p className="font-medium">{formData.priority}</p>
          </div>
          <div>
            <span className="text-gray-600">Shipment Type:</span>
            <p className="font-medium">{formData.shipmentType}</p>
          </div>
        </div>
      </div>

      {/* Section: Loading & Cargo */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Loading & Cargo</h3>
          <button
            onClick={() => onEdit(2)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Edit
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-gray-600">Loading Location:</span>
            <p className="font-medium">{formData.loadingLocation}</p>
          </div>
          {(formData.loadingContactName || formData.loadingContactPhone) && (
            <div>
              <span className="text-gray-600">Loading Contact:</span>
              <p className="font-medium">
                {formData.loadingContactName}
                {formData.loadingContactName && formData.loadingContactPhone && ' - '}
                {formData.loadingContactPhone}
              </p>
            </div>
          )}
          {formData.loadingDate && (
            <div>
              <span className="text-gray-600">Loading Date & Time:</span>
              <p className="font-medium">{formData.loadingDate} {formData.loadingTime}</p>
            </div>
          )}
          <div>
            <span className="text-gray-600">Cargo Description:</span>
            <p className="font-medium">{formData.cargoDescription}</p>
          </div>
          {formData.cargoWeight && (
            <div>
              <span className="text-gray-600">Cargo Weight:</span>
              <p className="font-medium">{formData.cargoWeight} {formData.cargoWeightUnit}</p>
            </div>
          )}
        </div>
      </div>

      {/* Section: Container & BL */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Container & BL Cutoff</h3>
          <button
            onClick={() => onEdit(3)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Edit
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-gray-600">Container Reservation:</span>
            <p className="font-medium">{formData.containerReservation ? 'Yes' : 'No'}</p>
          </div>
          {formData.containerReservation && (
            <>
              <div>
                <span className="text-gray-600">Container Number:</span>
                <p className="font-medium">{formData.containerNumber}</p>
              </div>
              <div>
                <span className="text-gray-600">Seal Number:</span>
                <p className="font-medium">{formData.sealNumber}</p>
              </div>
              <div>
                <span className="text-gray-600">Yard Location:</span>
                <p className="font-medium">{formData.containerYardLocation}</p>
              </div>
            </>
          )}
          <div>
            <span className="text-gray-600">BL Cutoff Required:</span>
            <p className="font-medium">{formData.blCutoffRequired ? 'Yes' : 'No'}</p>
          </div>
          {formData.blCutoffRequired && (
            <div>
              <span className="text-gray-600">BL Cutoff Date & Time:</span>
              <p className="font-medium">{formData.blCutoffDate} {formData.blCutoffTime}</p>
            </div>
          )}
        </div>
      </div>

      {/* Section: Wharf & Delivery */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Wharf & Delivery</h3>
          <button
            onClick={() => onEdit(4)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Edit
          </button>
        </div>
        <div className="space-y-3 text-sm">
          {formData.wharfName && (
            <div>
              <span className="text-gray-600">Wharf Name:</span>
              <p className="font-medium">{formData.wharfName}</p>
            </div>
          )}
          {formData.wharfContact && (
            <div>
              <span className="text-gray-600">Wharf Contact:</span>
              <p className="font-medium">{formData.wharfContact}</p>
            </div>
          )}
          <div>
            <span className="text-gray-600">Delivery Address:</span>
            <p className="font-medium">{formData.deliveryAddress}</p>
          </div>
          {(formData.deliveryContactName || formData.deliveryContactPhone) && (
            <div>
              <span className="text-gray-600">Delivery Contact:</span>
              <p className="font-medium">
                {formData.deliveryContactName}
                {formData.deliveryContactName && formData.deliveryContactPhone && ' - '}
                {formData.deliveryContactPhone}
              </p>
            </div>
          )}
          {formData.specialRequirements && (
            <div>
              <span className="text-gray-600">Special Requirements:</span>
              <p className="font-medium">{formData.specialRequirements}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrevious}
          className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
          disabled={submitting}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="bg-green-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {submitting ? (
            <>
              <span className="animate-spin">⏳</span>
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Submit Request
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
