'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Package, Clock, AlertCircle, Upload, X, Route, FileText, Download, Eye, Building2, Plus } from 'lucide-react';
import { getApiUrl } from '../../lib/api-config';
import { getCompanies, addCompany, getDefaultCompany, type BillingCompany } from '../../lib/companies-storage';

interface AcceptanceDetailsFormProps {
  request: any;
  companyId: string;
  onComplete: (data: any) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export default function AcceptanceDetailsForm({
  request,
  companyId,
  onComplete,
  onCancel,
  isProcessing = false
}: AcceptanceDetailsFormProps) {
  const [routes, setRoutes] = useState<Array<{id: string; label: string}>>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [companies, setCompanies] = useState<BillingCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    taxId: '',
  });
  const [newCompanyErrors, setNewCompanyErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    // Route selection (REQUIRED)
    routeId: request.routeId || '',

    // Company selection (REQUIRED)
    companyId: companyId || '',

    // Job ID will be generated automatically
    releaseOrderUrl: request.releaseOrderUrl || '',

    // Loading information
    loadingLocation: request.loadingLocation || '',
    loadingLocationLat: request.loadingLocationLat || null,
    loadingLocationLng: request.loadingLocationLng || null,
    loadingContactName: request.loadingContactName || '',
    loadingContactPhone: request.loadingContactPhone || '',
    loadingDate: request.loadingDate ? new Date(request.loadingDate).toISOString().split('T')[0] : '',
    loadingTime: request.loadingTime || '',

    // Container reservation
    containerReservation: request.containerReservation || false,
    containerNumber: request.containerNumber || '',
    sealNumber: request.sealNumber || '',
    containerYardLocation: request.containerYardLocation || '',
    containerYardLocationLat: request.containerYardLocationLat || null,
    containerYardLocationLng: request.containerYardLocationLng || null,

    // Cargo details
    cargoDescription: request.cargoDescription || '',
    cargoWeight: request.cargoWeight || '',
    cargoWeightUnit: request.cargoWeightUnit || 'kg',

    // BL Cutoff
    blCutoffRequired: request.blCutoffRequired || false,
    blCutoffDateTime: request.blCutoffDateTime ? new Date(request.blCutoffDateTime).toISOString().slice(0, 16) : '',

    // Tracking and visibility
    locationSharingEnabled: request.locationSharingEnabled !== false, // Default true
    heldUpFreeTime: request.heldUpFreeTime || '24',

    // Additional fields from request
    specialInstructions: request.specialInstructions || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [existingReleaseOrder, setExistingReleaseOrder] = useState<any>(null);
  const [showReplaceUpload, setShowReplaceUpload] = useState(false);

  // Fetch routes on component mount
  useEffect(() => {
    const fetchRoutes = async () => {
      if (!companyId) return;

      setLoadingRoutes(true);
      try {
        const clientParam = request.clientId ? `&clientId=${request.clientId}` : '';
        const response = await fetch(getApiUrl(`/api/v1/routes?companyId=${companyId}${clientParam}`));
        const result = await response.json();

        if (result.success && result.data) {
          const routeOptions = result.data.map((route: any) => ({
            id: route.id,
            label: `${route.code} - ${route.origin} → ${route.destination}`
          }));
          setRoutes(routeOptions);
        }
      } catch (error) {
        console.error('Failed to fetch routes:', error);
      } finally {
        setLoadingRoutes(false);
      }
    };

    fetchRoutes();
  }, [companyId, request.clientId]);

  // Load companies from localStorage
  useEffect(() => {
    setLoadingCompanies(true);
    try {
      const savedCompanies = getCompanies();
      setCompanies(savedCompanies);

      // Auto-select default company if no company is selected
      if (!formData.companyId) {
        const defaultCompany = getDefaultCompany();
        if (defaultCompany) {
          setFormData(prev => ({ ...prev, companyId: defaultCompany.id }));
        }
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  // Find existing release order document
  useEffect(() => {
    if (request.attachedDocuments && request.attachedDocuments.length > 0) {
      const releaseOrder = request.attachedDocuments.find(
        (doc: any) => doc.type === 'RELEASE_ORDER' || doc.category === 'RELEASE_ORDER'
      );
      if (releaseOrder) {
        setExistingReleaseOrder(releaseOrder);
      }
    }
  }, [request.attachedDocuments]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const formDataFile = new FormData();
    formDataFile.append('file', file);
    formDataFile.append('type', 'RELEASE_ORDER');
    formDataFile.append('jobId', ''); // No job ID yet

    try {
      const response = await fetch(getApiUrl('/api/v1/documents/upload'), {
        method: 'POST',
        body: formDataFile,
      });

      const result = await response.json();
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          releaseOrderUrl: result.data.fileUrl
        }));
      } else {
        alert('Failed to upload release order');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload release order');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleViewDocument = async (documentId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/v1/documents/${documentId}/download`));
      const result = await response.json();
      if (result.success && result.data.url) {
        window.open(result.data.url, '_blank');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Failed to view document');
    }
  };

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/v1/documents/${documentId}/download`));
      const result = await response.json();
      if (result.success && result.data.url) {
        const link = document.createElement('a');
        link.href = result.data.url;
        link.download = fileName;
        link.click();
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const handleReplaceDocument = () => {
    setShowReplaceUpload(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleNewCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCompanyData(prev => ({ ...prev, [name]: value }));
    setNewCompanyErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateNewCompany = () => {
    const errors: Record<string, string> = {};
    if (!newCompanyData.name.trim()) {
      errors.name = 'Company name is required';
    }
    setNewCompanyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCompany = () => {
    if (!validateNewCompany()) return;

    try {
      const newCompany = addCompany({
        ...newCompanyData,
        isDefault: companies.length === 0, // First company becomes default
      });

      // Update companies list
      const updatedCompanies = getCompanies();
      setCompanies(updatedCompanies);

      // Auto-select the newly created company
      setFormData(prev => ({ ...prev, companyId: newCompany.id }));

      // Reset form
      setNewCompanyData({
        name: '',
        address: '',
        phone: '',
        email: '',
        taxId: '',
      });
      setShowNewCompanyForm(false);
    } catch (error) {
      console.error('Failed to create company:', error);
      alert('Failed to create company. Please try again.');
    }
  };

  const handleCancelNewCompany = () => {
    setShowNewCompanyForm(false);
    setNewCompanyData({
      name: '',
      address: '',
      phone: '',
      email: '',
      taxId: '',
    });
    setNewCompanyErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Route selection validation (CRITICAL)
    if (!formData.routeId) newErrors.routeId = 'Please select a route';

    // Company selection validation (REQUIRED)
    if (!formData.companyId) newErrors.companyId = 'Please select a company';

    // Required fields validation
    if (!formData.loadingLocation) newErrors.loadingLocation = 'Loading location is required';
    if (!formData.loadingContactName) newErrors.loadingContactName = 'Loading contact name is required';
    if (!formData.loadingContactPhone) newErrors.loadingContactPhone = 'Loading contact phone is required';
    if (!formData.loadingDate) newErrors.loadingDate = 'Loading date is required';
    if (!formData.loadingTime) newErrors.loadingTime = 'Loading time is required';
    if (!formData.cargoDescription) newErrors.cargoDescription = 'Cargo description is required';

    // Conditional validations
    if (formData.containerReservation) {
      if (!formData.containerNumber) newErrors.containerNumber = 'Container number is required when reservation is enabled';
      if (!formData.containerYardLocation) newErrors.containerYardLocation = 'Container yard location is required';
    }

    if (formData.blCutoffRequired && !formData.blCutoffDateTime) {
      newErrors.blCutoffDateTime = 'BL cutoff date and time is required when enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      loadingDate: formData.loadingDate ? new Date(formData.loadingDate).toISOString() : null,
      blCutoffDateTime: formData.blCutoffDateTime ? new Date(formData.blCutoffDateTime).toISOString() : null,
      cargoWeight: formData.cargoWeight ? parseFloat(formData.cargoWeight) : null,
    };

    onComplete(submitData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">Complete Job Details</h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isProcessing}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Please provide the following information to complete the job acceptance process.
          </p>
          <div className="mt-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">Job Request ID:</span>
              <code className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono text-sm">
                {request.id}
              </code>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          {/* Route Selection - CRITICAL REQUIRED FIELD */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Route className="w-5 h-5" />
              Route Selection
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Route <span className="text-red-500">*</span>
              </label>
              <select
                name="routeId"
                value={formData.routeId}
                onChange={handleChange}
                disabled={loadingRoutes || isProcessing}
                className={`w-full px-3 py-2 border ${errors.routeId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="">
                  {loadingRoutes ? 'Loading routes...' : '-- Select a route --'}
                </option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.label}
                  </option>
                ))}
              </select>
              {errors.routeId && (
                <p className="mt-1 text-sm text-red-600">{errors.routeId}</p>
              )}
              {routes.length === 0 && !loadingRoutes && (
                <p className="mt-2 text-sm text-yellow-600">
                  ⚠️ No routes available. Please create a route first.
                </p>
              )}
            </div>
          </div>

          {/* Release Order Upload */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Release Order
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Release Order Document
                </label>

                {/* Show existing document if available and not replacing */}
                {existingReleaseOrder && !showReplaceUpload ? (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <FileText className="w-10 h-10 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {existingReleaseOrder.fileName || 'Release Order Document'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {existingReleaseOrder.fileSize ? formatFileSize(existingReleaseOrder.fileSize) : 'Unknown size'}
                            {existingReleaseOrder.createdAt && (
                              <span className="ml-2">
                                • Uploaded {new Date(existingReleaseOrder.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleViewDocument(existingReleaseOrder.id)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                          title="View document"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadDocument(existingReleaseOrder.id, existingReleaseOrder.fileName)}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600"
                          title="Download document"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleReplaceDocument}
                          className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Show upload input if no document exists or user wants to replace */
                  <div>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={uploadingFile || isProcessing}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {formData.releaseOrderUrl && (
                        <span className="text-sm text-green-600">✓ Uploaded</span>
                      )}
                    </div>
                    {showReplaceUpload && existingReleaseOrder && (
                      <button
                        type="button"
                        onClick={() => setShowReplaceUpload(false)}
                        className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                      >
                        ← Cancel replacement
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Loading Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Loading Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loading Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="loadingLocation"
                  value={formData.loadingLocation}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.loadingLocation ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  disabled={isProcessing}
                />
                {errors.loadingLocation && (
                  <p className="mt-1 text-sm text-red-600">{errors.loadingLocation}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="loadingContactName"
                  value={formData.loadingContactName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.loadingContactName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  disabled={isProcessing}
                />
                {errors.loadingContactName && (
                  <p className="mt-1 text-sm text-red-600">{errors.loadingContactName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="loadingContactPhone"
                  value={formData.loadingContactPhone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.loadingContactPhone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  disabled={isProcessing}
                />
                {errors.loadingContactPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.loadingContactPhone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loading Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="loadingDate"
                  value={formData.loadingDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.loadingDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  disabled={isProcessing}
                />
                {errors.loadingDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.loadingDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loading Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="loadingTime"
                  value={formData.loadingTime}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.loadingTime ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  disabled={isProcessing}
                />
                {errors.loadingTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.loadingTime}</p>
                )}
              </div>
            </div>
          </div>

          {/* Container Reservation */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Container Reservation
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="containerReservation"
                  name="containerReservation"
                  checked={formData.containerReservation}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isProcessing}
                />
                <label htmlFor="containerReservation" className="text-sm font-medium text-gray-700">
                  Container Reservation Required
                </label>
              </div>

              {formData.containerReservation && (
                <div className="grid grid-cols-2 gap-4 pl-7">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Container Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="containerNumber"
                      value={formData.containerNumber}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${errors.containerNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      disabled={isProcessing}
                    />
                    {errors.containerNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.containerNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seal Number
                    </label>
                    <input
                      type="text"
                      name="sealNumber"
                      value={formData.sealNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Container Yard Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="containerYardLocation"
                      value={formData.containerYardLocation}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${errors.containerYardLocation ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      disabled={isProcessing}
                    />
                    {errors.containerYardLocation && (
                      <p className="mt-1 text-sm text-red-600">{errors.containerYardLocation}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cargo Details */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Cargo Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="cargoDescription"
                  value={formData.cargoDescription}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-3 py-2 border ${errors.cargoDescription ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  disabled={isProcessing}
                />
                {errors.cargoDescription && (
                  <p className="mt-1 text-sm text-red-600">{errors.cargoDescription}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo Weight
                </label>
                <input
                  type="number"
                  name="cargoWeight"
                  value={formData.cargoWeight}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight Unit
                </label>
                <select
                  name="cargoWeightUnit"
                  value={formData.cargoWeightUnit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isProcessing}
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="ton">Tons</option>
                  <option value="lb">Pounds (lb)</option>
                </select>
              </div>
            </div>
          </div>

          {/* BL Cutoff */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              BL Cutoff
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="blCutoffRequired"
                  name="blCutoffRequired"
                  checked={formData.blCutoffRequired}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isProcessing}
                />
                <label htmlFor="blCutoffRequired" className="text-sm font-medium text-gray-700">
                  BL Cutoff Required
                </label>
              </div>

              {formData.blCutoffRequired && (
                <div className="pl-7">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    BL Cutoff Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="blCutoffDateTime"
                    value={formData.blCutoffDateTime}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${errors.blCutoffDateTime ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    disabled={isProcessing}
                  />
                  {errors.blCutoffDateTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.blCutoffDateTime}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tracking and Visibility */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Tracking & Visibility
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Sharing
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="locationSharingEnabled"
                    name="locationSharingEnabled"
                    checked={formData.locationSharingEnabled}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isProcessing}
                  />
                  <label htmlFor="locationSharingEnabled" className="text-sm text-gray-700">
                    Enable location details sharing
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Held Up Free Time
                </label>
                <select
                  name="heldUpFreeTime"
                  value={formData.heldUpFreeTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isProcessing}
                >
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Additional Information
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isProcessing}
                placeholder="Any additional notes or instructions..."
              />
            </div>
          </div>

          {/* Company Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Selection
              </span>
              {!showNewCompanyForm && (
                <button
                  type="button"
                  onClick={() => setShowNewCompanyForm(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={isProcessing}
                >
                  <Plus className="w-4 h-4" />
                  New Company
                </button>
              )}
            </h3>

            {showNewCompanyForm ? (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Create New Company</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newCompanyData.name}
                      onChange={handleNewCompanyChange}
                      className={`w-full px-3 py-2 border ${newCompanyErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="e.g., IWF Logistics"
                      disabled={isProcessing}
                    />
                    {newCompanyErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{newCompanyErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={newCompanyData.address}
                      onChange={handleNewCompanyChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Company address"
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={newCompanyData.phone}
                        onChange={handleNewCompanyChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+1 (555) 000-0000"
                        disabled={isProcessing}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={newCompanyData.email}
                        onChange={handleNewCompanyChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="contact@company.com"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax ID / Business Registration
                    </label>
                    <input
                      type="text"
                      name="taxId"
                      value={newCompanyData.taxId}
                      onChange={handleNewCompanyChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tax ID or registration number"
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelNewCompany}
                      className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                      disabled={isProcessing}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCompany}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={isProcessing}
                    >
                      Create & Select
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Company <span className="text-red-500">*</span>
                </label>
                {loadingCompanies ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Loading companies...
                  </div>
                ) : companies.length === 0 ? (
                  <div className="w-full px-3 py-2 border border-yellow-300 bg-yellow-50 rounded-lg text-yellow-800">
                    No companies found. Click "New Company" above to create one for billing purposes.
                  </div>
                ) : (
                  <select
                    name="companyId"
                    value={formData.companyId}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${errors.companyId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    disabled={isProcessing}
                  >
                    <option value="">Select a company...</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} {company.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                )}
                {errors.companyId && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyId}</p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  This company will appear on billing documents for this job.
                </p>
              </div>
            )}
          </div>
        </form>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Complete & Create Job'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}