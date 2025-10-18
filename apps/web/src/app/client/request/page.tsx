'use client';

import { useState } from 'react';
import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useCompany } from '../../../contexts/CompanyContext';
import { useClientAuth } from '../../../contexts/ClientAuthContext';
import { getApiUrl } from '../../../lib/api-config';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Package,
  AlertTriangle,
  FileText,
  Upload,
  CheckCircle
} from 'lucide-react';

interface JobRequestForm {
  clientId: string;
  routeId: string;
  title: string;
  description: string;
  jobType: 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_STOP' | 'EXPORT' | 'IMPORT';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  pickupAddress: string;
  deliveryAddress: string;
  requestedPickupDate: string;
  requestedPickupTime: string;
  requestedDropDate: string;
  requestedDropTime: string;
  containerType: string;
  specialRequirements: string;
  estimatedValue: string;
  documents: File[];
}

interface Client {
  id: string;
  name: string;
  code: string;
}

interface Route {
  id: string;
  code: string;
  origin: string;
  destination: string;
  kmEstimate: number | null;
}

export default function JobRequestPage() {
  const { companyId } = useCompany();
  const { clientId, clientName, clientCode } = useClientAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [formData, setFormData] = useState<JobRequestForm>({
    clientId: '',
    routeId: '',
    title: '',
    description: '',
    jobType: 'ONE_WAY',
    priority: 'NORMAL',
    pickupAddress: '',
    deliveryAddress: '',
    requestedPickupDate: '',
    requestedPickupTime: '',
    requestedDropDate: '',
    requestedDropTime: '',
    containerType: '',
    specialRequirements: '',
    estimatedValue: '',
    documents: []
  });

  // Auto-populate client from authenticated client
  React.useEffect(() => {
    if (clientId) {
      setFormData(prev => ({ ...prev, clientId }));
    }
  }, [clientId]);

  // Load routes when client is selected
  React.useEffect(() => {
    if (!companyId || !formData.clientId) {
      setRoutes([]);
      return;
    }

    fetch(getApiUrl(`/api/v1/routes?companyId=${companyId}&clientId=${formData.clientId}&isActive=true`))
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRoutes(data.data);
        }
      })
      .catch(err => console.error('Failed to load routes:', err));
  }, [companyId, formData.clientId]);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!companyId) {
      alert('Please select a company first');
      return;
    }

    setSubmitting(true);

    try {
      // Combine date and time fields into ISO timestamps
      const requestedPickupTs = formData.requestedPickupDate && formData.requestedPickupTime
        ? new Date(`${formData.requestedPickupDate}T${formData.requestedPickupTime}`).toISOString()
        : undefined;

      const requestedDropTs = formData.requestedDropDate && formData.requestedDropTime
        ? new Date(`${formData.requestedDropDate}T${formData.requestedDropTime}`).toISOString()
        : undefined;

      const payload = {
        companyId,
        clientId: formData.clientId || undefined,
        routeId: formData.routeId || undefined,
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        jobType: formData.jobType,
        pickupAddress: formData.pickupAddress,
        deliveryAddress: formData.deliveryAddress,
        requestedPickupTs,
        requestedDropTs,
        containerType: formData.containerType || undefined,
        specialRequirements: formData.specialRequirements || undefined,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
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
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return <SuccessPage requestId={requestId} />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/client/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Job Request</h1>
        <p className="text-gray-600">Submit a new logistics request for review</p>
      </motion.div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8">
        <ProgressBar currentStep={step} />

        <div className="mt-8">
          {step === 1 && (
            <BasicDetailsStep
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              clientName={clientName}
              clientCode={clientCode}
              routes={routes}
            />
          )}
          {step === 2 && (
            <LocationTimeStep
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
          {step === 3 && (
            <RequirementsStep
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
          {step === 4 && (
            <ReviewStep
              formData={formData}
              onSubmit={handleSubmit}
              onPrevious={handlePrevious}
              submitting={submitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, title: 'Basic Details' },
    { number: 2, title: 'Location & Time' },
    { number: 3, title: 'Requirements' },
    { number: 4, title: 'Review & Submit' }
  ];

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
            currentStep >= step.number
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-gray-300 text-gray-500'
          }`}>
            {currentStep > step.number ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              step.number
            )}
          </div>
          <span className={`ml-2 text-sm font-medium ${
            currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
          }`}>
            {step.title}
          </span>
          {index < steps.length - 1 && (
            <div className={`mx-4 h-0.5 w-16 ${
              currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

function BasicDetailsStep({
  formData,
  setFormData,
  onNext,
  clientName,
  clientCode,
  routes
}: {
  formData: JobRequestForm;
  setFormData: (data: JobRequestForm) => void;
  onNext: () => void;
  clientName: string | null;
  clientCode: string | null;
  routes: Route[];
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Client *
        </label>
        <div className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-900 font-medium">
          {clientName} ({clientCode})
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Your client account
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Route *
        </label>
        <select
          value={formData.routeId}
          onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          disabled={!formData.clientId}
        >
          <option value="">Select a route</option>
          {routes.map((route) => (
            <option key={route.id} value={route.id}>
              {route.code} - {route.origin} → {route.destination} ({route.kmEstimate || '?'} km)
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          {!formData.clientId
            ? 'Please select a client first'
            : routes.length === 0
              ? 'No active routes available for this client'
              : 'Select the route for this job request'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Job Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Container delivery to Durban Port"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Provide details about your logistics requirements..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Job Type *
        </label>
        <select
          value={formData.jobType}
          onChange={(e) => setFormData({ ...formData, jobType: e.target.value as any })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="ONE_WAY">One Way</option>
          <option value="ROUND_TRIP">Round Trip</option>
          <option value="MULTI_STOP">Multi Stop</option>
          <option value="EXPORT">Export (Yard → Port/Customer)</option>
          <option value="IMPORT">Import (Port → Yard)</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Select the type of logistics operation
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority Level
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: 'LOW', label: 'Low', color: 'green' },
            { value: 'NORMAL', label: 'Normal', color: 'blue' },
            { value: 'HIGH', label: 'High', color: 'orange' },
            { value: 'URGENT', label: 'Urgent', color: 'red' }
          ].map((priority) => (
            <button
              key={priority.value}
              type="button"
              onClick={() => setFormData({ ...formData, priority: priority.value as any })}
              className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                formData.priority === priority.value
                  ? `border-${priority.color}-500 bg-${priority.color}-50 text-${priority.color}-700`
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {priority.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Next Step
        </button>
      </div>
    </motion.form>
  );
}

function LocationTimeStep({
  formData,
  setFormData,
  onNext,
  onPrevious
}: {
  formData: JobRequestForm;
  setFormData: (data: JobRequestForm) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            Pickup Address *
          </label>
          <textarea
            value={formData.pickupAddress}
            onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Full pickup address including GPS coordinates if available"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            Delivery Address *
          </label>
          <textarea
            value={formData.deliveryAddress}
            onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Full delivery address including GPS coordinates if available"
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Requested Pickup
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={formData.requestedPickupDate}
              onChange={(e) => setFormData({ ...formData, requestedPickupDate: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="time"
              value={formData.requestedPickupTime}
              onChange={(e) => setFormData({ ...formData, requestedPickupTime: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Requested Delivery
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={formData.requestedDropDate}
              onChange={(e) => setFormData({ ...formData, requestedDropDate: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="time"
              value={formData.requestedDropTime}
              onChange={(e) => setFormData({ ...formData, requestedDropTime: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Next Step
        </button>
      </div>
    </motion.form>
  );
}

function RequirementsStep({
  formData,
  setFormData,
  onNext,
  onPrevious
}: {
  formData: JobRequestForm;
  setFormData: (data: JobRequestForm) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData({ ...formData, documents: [...formData.documents, ...newFiles] });
    }
  };

  const removeFile = (index: number) => {
    const newDocuments = formData.documents.filter((_, i) => i !== index);
    setFormData({ ...formData, documents: newDocuments });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Package className="inline w-4 h-4 mr-1" />
          Container Type
        </label>
        <select
          value={formData.containerType}
          onChange={(e) => setFormData({ ...formData, containerType: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select container type</option>
          <option value="20ft">20ft Standard</option>
          <option value="40ft">40ft Standard</option>
          <option value="40ft-hc">40ft High Cube</option>
          <option value="45ft">45ft High Cube</option>
          <option value="refrigerated">Refrigerated Container</option>
          <option value="open-top">Open Top</option>
          <option value="flat-rack">Flat Rack</option>
          <option value="other">Other (specify in requirements)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estimated Value (ZAR)
        </label>
        <input
          type="number"
          value={formData.estimatedValue}
          onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., 250000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <AlertTriangle className="inline w-4 h-4 mr-1" />
          Special Requirements
        </label>
        <textarea
          value={formData.specialRequirements}
          onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Any special handling requirements, hazardous materials, temperature control, etc."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="inline w-4 h-4 mr-1" />
          Supporting Documents
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Upload invoices, manifests, or other supporting documents
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <label
            htmlFor="file-upload"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
          >
            Choose Files
          </label>
        </div>

        {formData.documents.length > 0 && (
          <div className="mt-4 space-y-2">
            {formData.documents.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Review Request
        </button>
      </div>
    </motion.form>
  );
}

function ReviewStep({
  formData,
  onSubmit,
  onPrevious,
  submitting
}: {
  formData: JobRequestForm;
  onSubmit: () => void;
  onPrevious: () => void;
  submitting: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Review Your Request</h3>
        <p className="text-sm text-blue-700">
          Please review all details before submitting. Once submitted, your request will be reviewed by our logistics team.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Basic Details</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Title:</span> {formData.title}</p>
              <p><span className="font-medium">Job Type:</span> {formData.jobType.replace('_', ' ')}</p>
              <p><span className="font-medium">Priority:</span> {formData.priority}</p>
              {formData.description && (
                <p><span className="font-medium">Description:</span> {formData.description}</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
            <div className="space-y-1 text-sm">
              {formData.containerType && (
                <p><span className="font-medium">Container:</span> {formData.containerType}</p>
              )}
              {formData.estimatedValue && (
                <p><span className="font-medium">Value:</span> R{formData.estimatedValue}</p>
              )}
              {formData.specialRequirements && (
                <p><span className="font-medium">Special Requirements:</span> {formData.specialRequirements}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Locations</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Pickup:</span> {formData.pickupAddress}</p>
              <p><span className="font-medium">Delivery:</span> {formData.deliveryAddress}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Timeline</h4>
            <div className="space-y-1 text-sm">
              {formData.requestedPickupDate && (
                <p><span className="font-medium">Pickup:</span> {formData.requestedPickupDate} {formData.requestedPickupTime}</p>
              )}
              {formData.requestedDropDate && (
                <p><span className="font-medium">Delivery:</span> {formData.requestedDropDate} {formData.requestedDropTime}</p>
              )}
            </div>
          </div>

          {formData.documents.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Documents</h4>
              <div className="space-y-1 text-sm">
                {formData.documents.map((file, index) => (
                  <p key={index}>• {file.name}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </motion.div>
  );
}

function SuccessPage({ requestId }: { requestId: string | null }) {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8"
      >
        <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">Request Submitted!</h1>
        <p className="text-gray-600 mb-6">
          Your job request has been successfully submitted. Our logistics team will review it and get back to you within 2-4 business hours.
        </p>

        {requestId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Request ID:</span> {requestId}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/client"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Portal
          </Link>
          <Link
            href="/client/track"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Track Request
          </Link>
        </div>
      </motion.div>
    </div>
  );
}