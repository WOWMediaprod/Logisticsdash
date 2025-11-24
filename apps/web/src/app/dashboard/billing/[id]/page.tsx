'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useCompany } from '../../../../contexts/CompanyContext';
import { getApiUrl } from '../../../../lib/api-config';
import {
  FileText,
  ArrowLeft,
  Download,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  MapPin,
  Truck,
  Loader2,
} from 'lucide-react';

type BillStatus = 'DRAFT' | 'ISSUED' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

interface CDNDetails {
  originLocation?: string;
  destinationLocation?: string;
  vehicleNo?: string;
  driverName?: string;
  dateOfHire?: string;
  hasDelay?: boolean;
  delayFactoryName?: string;
  timeEnteredFactory?: string;
  timeUnloadedAtPort?: string;
  delayDurationHours?: number;
  detentionCharges?: number;
  delayReason?: string;
  cdnDocumentId?: string;
}

interface Bill {
  id: string;
  billNumber: string;
  amount: number;
  currency: string;
  status: BillStatus;
  issuedDate: string | null;
  dueDate: string | null;
  paidDate: string | null;
  sentToClient: boolean;
  sentAt: string | null;
  notes: string | null;
  metadata?: {
    cdnDetails?: CDNDetails;
  };
  job: {
    id: string;
    status: string;
    client: {
      name: string;
      code: string;
    };
    route: {
      code: string;
      origin: string;
      destination: string;
      kmEstimate: number;
    };
    driver?: {
      name: string;
      phone: string;
    };
    vehicle?: {
      regNo: string;
      make: string;
      model: string;
    };
  };
  createdAt: string;
}

const statusColors: Record<BillStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
  ISSUED: 'bg-blue-100 text-blue-800 border-blue-200',
  SENT: 'bg-purple-100 text-purple-800 border-purple-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  OVERDUE: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusIcons: Record<BillStatus, React.ReactNode> = {
  DRAFT: <FileText className="w-4 h-4" />,
  ISSUED: <Send className="w-4 h-4" />,
  SENT: <Clock className="w-4 h-4" />,
  PAID: <CheckCircle className="w-4 h-4" />,
  OVERDUE: <AlertCircle className="w-4 h-4" />,
  CANCELLED: <FileText className="w-4 h-4" />,
};

export default function BillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { companyId } = useCompany();
  const billId = params.id as string;

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!companyId || !billId) return;

    const fetchBill = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(getApiUrl(`/api/v1/bills/${billId}`));
        const result = await response.json();

        if (result.success) {
          setBill(result.data);
        } else {
          setError('Bill not found');
        }
      } catch (err) {
        console.error('Failed to fetch bill:', err);
        setError('Failed to load bill details');
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [companyId, billId]);

  const formatCurrency = (amount: number, currency: string = 'LKR') => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-LK', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-LK', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMarkAsSent = async () => {
    if (!bill) return;

    setActionLoading(true);
    try {
      const response = await fetch(getApiUrl(`/api/v1/bills/${bill.id}/send`), {
        method: 'PATCH',
      });

      const result = await response.json();
      if (result.success) {
        setBill({ ...bill, sentToClient: true, sentAt: new Date().toISOString(), status: 'SENT' });
      }
    } catch (err) {
      console.error('Failed to mark as sent:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!bill) return;

    setActionLoading(true);
    try {
      const response = await fetch(getApiUrl(`/api/v1/bills/${bill.id}/paid`), {
        method: 'PATCH',
      });

      const result = await response.json();
      if (result.success) {
        setBill({ ...bill, paidDate: new Date().toISOString(), status: 'PAID' });
      }
    } catch (err) {
      console.error('Failed to mark as paid:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading bill details...</span>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Billing
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">Bill Not Found</h2>
            <p className="text-red-700">{error || 'The requested bill could not be found.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Billing
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Bill #{bill.billNumber}</h1>
                <p className="text-slate-600">Created on {formatDateTime(bill.createdAt)}</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 ${statusColors[bill.status]}`}>
              {statusIcons[bill.status]}
              {bill.status}
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Amount Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            >
              <div className="flex items-center gap-2 text-slate-600 mb-4">
                <DollarSign className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Amount</h2>
              </div>
              <p className="text-4xl font-bold text-slate-900">
                {formatCurrency(bill.amount, bill.currency)}
              </p>
              <p className="text-sm text-slate-500 mt-2">Currency: {bill.currency}</p>
            </motion.div>

            {/* Client & Job Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            >
              <div className="flex items-center gap-2 text-slate-600 mb-4">
                <User className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Client & Job Information</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Client</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {bill.job.client.name} ({bill.job.client.code})
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">Route</p>
                    <p className="text-lg font-medium text-slate-900">
                      {bill.job.route.origin} → {bill.job.route.destination}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {bill.job.route.code} • {bill.job.route.kmEstimate} km
                    </p>
                  </div>
                </div>
                {bill.job.driver && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Driver</p>
                      <p className="text-lg font-medium text-slate-900">{bill.job.driver.name}</p>
                      <p className="text-sm text-slate-500">{bill.job.driver.phone}</p>
                    </div>
                  </div>
                )}
                {bill.job.vehicle && (
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Vehicle</p>
                      <p className="text-lg font-medium text-slate-900">{bill.job.vehicle.regNo}</p>
                      <p className="text-sm text-slate-500">
                        {bill.job.vehicle.make} {bill.job.vehicle.model}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Notes */}
            {bill.notes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
              >
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Notes</h2>
                <p className="text-slate-600 whitespace-pre-wrap">{bill.notes}</p>
              </motion.div>
            )}

            {/* CDN & Detention Details */}
            {bill.metadata?.cdnDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-blue-50 rounded-2xl shadow-sm border border-blue-200 p-6"
              >
                <div className="flex items-center gap-2 text-blue-700 mb-4">
                  <FileText className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">CDN & Detention Details</h2>
                </div>

                <div className="bg-white rounded-lg p-4 space-y-4">
                  {/* Basic Route & Hire Info */}
                  <div className="grid grid-cols-2 gap-4">
                    {bill.metadata.cdnDetails.originLocation && (
                      <div>
                        <p className="text-sm text-slate-500">Origin</p>
                        <p className="text-base font-medium text-slate-900">{bill.metadata.cdnDetails.originLocation}</p>
                      </div>
                    )}
                    {bill.metadata.cdnDetails.destinationLocation && (
                      <div>
                        <p className="text-sm text-slate-500">Destination</p>
                        <p className="text-base font-medium text-slate-900">{bill.metadata.cdnDetails.destinationLocation}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {bill.metadata.cdnDetails.vehicleNo && (
                      <div>
                        <p className="text-sm text-slate-500">Vehicle No.</p>
                        <p className="text-base font-medium text-slate-900">{bill.metadata.cdnDetails.vehicleNo}</p>
                      </div>
                    )}
                    {bill.metadata.cdnDetails.driverName && (
                      <div>
                        <p className="text-sm text-slate-500">Driver</p>
                        <p className="text-base font-medium text-slate-900">{bill.metadata.cdnDetails.driverName}</p>
                      </div>
                    )}
                  </div>

                  {bill.metadata.cdnDetails.dateOfHire && (
                    <div>
                      <p className="text-sm text-slate-500">Date of Hire</p>
                      <p className="text-base font-medium text-slate-900">
                        {new Date(bill.metadata.cdnDetails.dateOfHire).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* CDN Document Link */}
                  {bill.metadata.cdnDetails.cdnDocumentId && (
                    <div className="border-t border-slate-200 pt-4">
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(getApiUrl(`/api/v1/documents/${bill.metadata?.cdnDetails?.cdnDocumentId}/download`));
                            const data = await response.json();
                            if (data.success && data.data.url) {
                              window.open(data.data.url, '_blank');
                            }
                          } catch (error) {
                            console.error('Failed to open CDN:', error);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm underline"
                      >
                        View CDN Document
                      </button>
                    </div>
                  )}

                  {/* Delay/Detention Details */}
                  {bill.metadata.cdnDetails.hasDelay && (
                    <div className="border-t border-red-200 pt-4 mt-4 bg-red-50 -m-4 p-4 rounded-lg">
                      <h3 className="font-semibold text-red-800 mb-3">Detention Charges</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {bill.metadata.cdnDetails.delayFactoryName && (
                          <div>
                            <p className="text-sm text-red-600">Factory Name</p>
                            <p className="text-base font-medium text-slate-900">{bill.metadata.cdnDetails.delayFactoryName}</p>
                          </div>
                        )}
                        {bill.metadata.cdnDetails.delayDurationHours && (
                          <div>
                            <p className="text-sm text-red-600">Duration</p>
                            <p className="text-base font-medium text-slate-900">{bill.metadata.cdnDetails.delayDurationHours} hours</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        {bill.metadata.cdnDetails.timeEnteredFactory && (
                          <div>
                            <p className="text-sm text-red-600">Time Entered Factory</p>
                            <p className="text-base font-medium text-slate-900">
                              {new Date(bill.metadata.cdnDetails.timeEnteredFactory).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {bill.metadata.cdnDetails.timeUnloadedAtPort && (
                          <div>
                            <p className="text-sm text-red-600">Time Delivered</p>
                            <p className="text-base font-medium text-slate-900">
                              {new Date(bill.metadata.cdnDetails.timeUnloadedAtPort).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {bill.metadata.cdnDetails.detentionCharges && (
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <p className="text-sm text-red-600">Detention Charges</p>
                          <p className="text-2xl font-bold text-red-700">
                            LKR {bill.metadata.cdnDetails.detentionCharges.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {bill.metadata.cdnDetails.delayReason && (
                        <div className="mt-3">
                          <p className="text-sm text-red-600">Reason</p>
                          <p className="text-base text-slate-700">{bill.metadata.cdnDetails.delayReason}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Dates */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            >
              <div className="flex items-center gap-2 text-slate-600 mb-4">
                <Calendar className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Important Dates</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Issued Date</p>
                  <p className="text-base font-medium text-slate-900">{formatDate(bill.issuedDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Due Date</p>
                  <p className="text-base font-medium text-slate-900">{formatDate(bill.dueDate)}</p>
                </div>
                {bill.sentAt && (
                  <div>
                    <p className="text-sm text-slate-500">Sent to Client</p>
                    <p className="text-base font-medium text-slate-900">{formatDateTime(bill.sentAt)}</p>
                  </div>
                )}
                {bill.paidDate && (
                  <div>
                    <p className="text-sm text-slate-500">Paid Date</p>
                    <p className="text-base font-medium text-green-700">{formatDate(bill.paidDate)}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download / Print
                </button>
                {bill.status !== 'SENT' && bill.status !== 'PAID' && !bill.sentToClient && (
                  <button
                    onClick={handleMarkAsSent}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:bg-slate-300"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Mark as Sent
                  </button>
                )}
                {bill.status !== 'PAID' && (
                  <button
                    onClick={handleMarkAsPaid}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-slate-300"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Mark as Paid
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
