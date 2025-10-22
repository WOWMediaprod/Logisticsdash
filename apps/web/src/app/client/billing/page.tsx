'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Eye,
  CreditCard
} from 'lucide-react';
import { useCompany } from '../../../contexts/CompanyContext';
import { getApiUrl } from '../../../lib/api-config';

interface Bill {
  id: string;
  billNumber: string;
  amount: number;
  currency: string;
  status: 'DRAFT' | 'ISSUED' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issuedDate: string | null;
  dueDate: string | null;
  paidDate: string | null;
  sentAt: string | null;
  job: {
    id: string;
    status: string;
    jobType: string;
    client: {
      name: string;
      code: string;
    };
    route: {
      origin: string;
      destination: string;
      kmEstimate: number;
    };
  };
  notes?: string;
}

interface BillStats {
  totalBills: number;
  draftBills: number;
  issuedBills: number;
  paidBills: number;
  overdueBills: number;
  totalRevenue: number;
  pendingAmount: number;
}

export default function ClientBillingPage() {
  const { companyId } = useCompany();
  const [bills, setBills] = useState<Bill[]>([]);
  const [stats, setStats] = useState<BillStats>({
    totalBills: 0,
    draftBills: 0,
    issuedBills: 0,
    paidBills: 0,
    overdueBills: 0,
    totalRevenue: 0,
    pendingAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadBillingData = async () => {
      if (!companyId) {
        setBills([]);
        setStats({
          totalBills: 0,
          draftBills: 0,
          issuedBills: 0,
          paidBills: 0,
          overdueBills: 0,
          totalRevenue: 0,
          pendingAmount: 0
        });
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Note: companyId is handled by @CurrentCompany() decorator in backend (demo mode)
        const [statsResponse, billsResponse] = await Promise.all([
          fetch(getApiUrl(`/api/v1/bills/stats`), {
            headers: { 'Accept': 'application/json' }
          }),
          fetch(getApiUrl(`/api/v1/bills?limit=50`), {
            headers: { 'Accept': 'application/json' }
          })
        ]);

        if (!cancelled) {
          const statsJson = await statsResponse.json();
          const billsJson = await billsResponse.json();

          if (statsJson.success) {
            // Calculate pending amount from unpaid bills
            const pendingAmount = billsJson.success ?
              billsJson.data
                .filter((bill: Bill) => ['ISSUED', 'SENT', 'OVERDUE'].includes(bill.status))
                .reduce((sum: number, bill: Bill) => sum + bill.amount, 0) : 0;

            setStats({
              ...statsJson.data,
              pendingAmount
            });
          }

          if (billsJson.success) {
            setBills(billsJson.data);
          }
        }
      } catch (error) {
        console.error('Failed to load billing data', error);
        if (!cancelled) {
          setBills([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBillingData();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const filteredBills = bills.filter(bill => {
    const matchesSearch =
      bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.job.route.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.job.route.destination.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || bill.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number, currency: string = 'LKR') => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-LK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PAID':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600'
        };
      case 'ISSUED':
      case 'SENT':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: FileText,
          iconColor: 'text-blue-600'
        };
      case 'OVERDUE':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertCircle,
          iconColor: 'text-red-600'
        };
      case 'DRAFT':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock,
          iconColor: 'text-gray-600'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: FileText,
          iconColor: 'text-gray-600'
        };
    }
  };

  if (!companyId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="glass max-w-xl mx-auto p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Company not selected</h1>
          <p className="text-gray-600">
            Please select a company to view billing information.
          </p>
        </div>
      </main>
    );
  }

  if (loading && bills.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading billing data...</span>
        </div>
      </main>
    );
  }

  if (selectedBill) {
    return <BillDetailView bill={selectedBill} onBack={() => setSelectedBill(null)} />;
  }

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Invoices</h1>
        <p className="text-gray-600">View and manage your bills and payment history</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={FileText}
          label="Total Bills"
          value={stats.totalBills.toString()}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Paid"
          value={stats.paidBills.toString()}
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={stats.issuedBills.toString()}
          color="orange"
        />
        <StatCard
          icon={AlertCircle}
          label="Overdue"
          value={stats.overdueBills.toString()}
          color="red"
        />
      </div>

      {/* Amount Summary */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Total Paid</p>
              <p className="text-3xl font-bold text-green-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700 mb-1">Pending Amount</p>
              <p className="text-3xl font-bold text-orange-900">
                {formatCurrency(stats.pendingAmount)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bills List */}
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Invoice History</h2>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search bills..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="ISSUED">Issued</option>
                <option value="SENT">Sent</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredBills.map((bill, index) => (
            <BillCard
              key={bill.id}
              bill={bill}
              index={index}
              onClick={() => setSelectedBill(bill)}
            />
          ))}

          {filteredBills.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No bills found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: any;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'orange' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
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
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
    </motion.div>
  );
}

function BillCard({
  bill,
  index,
  onClick
}: {
  bill: Bill;
  index: number;
  onClick: () => void;
}) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PAID':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600'
        };
      case 'ISSUED':
      case 'SENT':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: FileText,
          iconColor: 'text-blue-600'
        };
      case 'OVERDUE':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertCircle,
          iconColor: 'text-red-600'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock,
          iconColor: 'text-gray-600'
        };
    }
  };

  const formatCurrency = (amount: number, currency: string = 'LKR') => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-LK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const statusConfig = getStatusConfig(bill.status);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${statusConfig.color}`}>
            <StatusIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{bill.billNumber}</h3>
            <p className="text-sm text-gray-600">Job: {bill.job.id}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(bill.amount, bill.currency)}
          </p>
          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${statusConfig.color} mt-1`}>
            {bill.status}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Route</p>
          <p className="text-sm text-gray-600">
            {bill.job.route.origin} → {bill.job.route.destination}
          </p>
          <p className="text-xs text-gray-500">{bill.job.route.kmEstimate} km</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Job Type</p>
          <p className="text-sm text-gray-600">{bill.job.jobType}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Issued: {formatDate(bill.issuedDate)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>Due: {formatDate(bill.dueDate)}</span>
          </div>
        </div>
        <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
          <Eye className="w-4 h-4 mr-1" />
          View Details
        </button>
      </div>
    </motion.div>
  );
}

function BillDetailView({ bill, onBack }: { bill: Bill; onBack: () => void }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PAID':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600'
        };
      case 'ISSUED':
      case 'SENT':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: FileText,
          iconColor: 'text-blue-600'
        };
      case 'OVERDUE':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertCircle,
          iconColor: 'text-red-600'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock,
          iconColor: 'text-gray-600'
        };
    }
  };

  const formatCurrency = (amount: number, currency: string = 'LKR') => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-LK', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleString('en-LK', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusConfig = getStatusConfig(bill.status);
  const StatusIcon = statusConfig.icon;

  return (
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
          Back to Bills
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{bill.billNumber}</h1>
            <p className="text-gray-600">Invoice Details</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
            {bill.status !== 'PAID' && (
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Now
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Bill Summary */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Bill Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-700">Amount</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatCurrency(bill.amount, bill.currency)}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-lg border ${statusConfig.color}`}>
                  <div className="flex items-center space-x-2">
                    <StatusIcon className="w-5 h-5" />
                    <span className="font-semibold">{bill.status}</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Issued Date</p>
                  <p className="text-gray-900 mt-1">{formatDate(bill.issuedDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Due Date</p>
                  <p className="text-gray-900 mt-1">{formatDate(bill.dueDate)}</p>
                </div>
                {bill.paidDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Paid Date</p>
                    <p className="text-gray-900 mt-1">{formatDate(bill.paidDate)}</p>
                  </div>
                )}
              </div>

              {bill.notes && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-1">Notes</p>
                  <p className="text-sm text-yellow-700">{bill.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Associated Job</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Job ID</p>
                  <p className="text-gray-900 mt-1">{bill.job.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Job Type</p>
                  <p className="text-gray-900 mt-1">{bill.job.jobType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Job Status</p>
                  <p className="text-gray-900 mt-1">{bill.job.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Client</p>
                  <p className="text-gray-900 mt-1">{bill.job.client.name}</p>
                  <p className="text-sm text-gray-600">{bill.job.client.code}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Route</p>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{bill.job.route.origin}</p>
                    <p className="text-xs text-gray-600">Origin</p>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="flex-1 text-right">
                    <p className="font-medium text-gray-900">{bill.job.route.destination}</p>
                    <p className="text-xs text-gray-600">Destination</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Distance: {bill.job.route.kmEstimate} km
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Status */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Status</h2>
            <div className="space-y-3">
              {bill.sentAt && (
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Bill Sent</p>
                    <p className="text-xs text-gray-600">{formatDateTime(bill.sentAt)}</p>
                  </div>
                </div>
              )}
              {bill.paidDate ? (
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Payment Received</p>
                    <p className="text-xs text-gray-600">{formatDateTime(bill.paidDate)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Payment Pending</p>
                    <p className="text-xs text-gray-600">Due: {formatDate(bill.dueDate)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          {bill.status !== 'PAID' && (
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Methods</h2>
              <div className="space-y-3">
                <button className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">Credit/Debit Card</span>
                    </div>
                    <span className="text-sm text-gray-600">→</span>
                  </div>
                </button>
                <button className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-900">Bank Transfer</span>
                    </div>
                    <span className="text-sm text-gray-600">→</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Support */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-2">Need Help?</h2>
            <p className="text-sm text-blue-700 mb-4">
              Contact our billing support team for any questions about this invoice.
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
