'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useCompany } from '../../../contexts/CompanyContext';
import { getApiUrl } from '../../../lib/api-config';
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Download,
  Eye,
  Plus,
  TrendingUp,
  Calendar,
  Filter,
  ArrowLeft,
} from 'lucide-react';

type BillStatus = 'DRAFT' | 'ISSUED' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

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
  job: {
    id: string;
    status: string;
    loadingLocation: string | null;
    deliveryAddress: string | null;
    client: {
      name: string;
      code: string;
    };
  };
  createdAt: string;
}

interface BillStats {
  totalBills: number;
  draftBills: number;
  issuedBills: number;
  paidBills: number;
  overdueBills: number;
  totalRevenue: number;
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

export default function BillingPage() {
  const { companyId } = useCompany();
  const [bills, setBills] = useState<Bill[]>([]);
  const [stats, setStats] = useState<BillStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [billsRes, statsRes] = await Promise.all([
          fetch(getApiUrl(`/api/v1/bills?limit=50`)),
          fetch(getApiUrl(`/api/v1/bills/stats`)),
        ]);

        const [billsData, statsData] = await Promise.all([
          billsRes.json(),
          statsRes.json(),
        ]);

        if (billsData.success) {
          setBills(billsData.data);
        }

        if (statsData.success) {
          setStats(statsData.data);
        }
      } catch (err) {
        console.error('Failed to fetch billing data:', err);
        setError('Failed to load billing information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  const filteredBills = bills.filter(bill =>
    filterStatus === 'all' || bill.status === filterStatus
  );

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
      month: 'short',
      year: 'numeric',
    });
  };

  const handleMarkAsSent = async (billId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/v1/bills/${billId}/send`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      if (result.success) {
        setBills(prev => prev.map(bill =>
          bill.id === billId ? { ...bill, status: 'SENT', sentToClient: true, sentAt: new Date().toISOString() } : bill
        ));
      }
    } catch (err) {
      console.error('Failed to mark bill as sent:', err);
    }
  };

  const handleMarkAsPaid = async (billId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/v1/bills/${billId}/paid`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paidDate: new Date().toISOString() }),
      });

      const result = await response.json();
      if (result.success) {
        setBills(prev => prev.map(bill =>
          bill.id === billId ? { ...bill, status: 'PAID', paidDate: new Date().toISOString() } : bill
        ));
      }
    } catch (err) {
      console.error('Failed to mark bill as paid:', err);
    }
  };

  if (!companyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="glass max-w-xl mx-auto p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Company not selected</h1>
          <p className="text-gray-600">Please select a company to view billing.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading billing data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
              <p className="text-gray-600 mt-1">Manage bills and track payments</p>
            </div>
            <Link
              href="/dashboard/billing/create"
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Bill</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          >
            <StatsCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              icon={<DollarSign className="w-6 h-6" />}
              color="green"
              trend="+12.5%"
            />
            <StatsCard
              title="Paid Bills"
              value={`${stats.paidBills} / ${stats.totalBills}`}
              icon={<CheckCircle className="w-6 h-6" />}
              color="blue"
            />
            <StatsCard
              title="Overdue"
              value={stats.overdueBills}
              icon={<AlertCircle className="w-6 h-6" />}
              color="red"
              alert={stats.overdueBills > 0}
            />
          </motion.div>
        )}

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-4 rounded-2xl mb-6"
        >
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Bills</option>
              <option value="DRAFT">Draft</option>
              <option value="ISSUED">Issued</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </motion.div>

        {/* Bills List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredBills.length === 0 ? (
            <div className="glass p-12 rounded-2xl text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No bills found</h3>
              <p className="text-gray-600 mb-6">
                {filterStatus === 'all'
                  ? 'Create your first bill to get started'
                  : `No bills with status: ${filterStatus}`}
              </p>
              <Link
                href="/dashboard/billing/create"
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Bill</span>
              </Link>
            </div>
          ) : (
            filteredBills.map((bill, index) => (
              <BillCard
                key={bill.id}
                bill={bill}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onMarkAsSent={handleMarkAsSent}
                onMarkAsPaid={handleMarkAsPaid}
                delay={index * 0.05}
              />
            ))
          )}
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 mt-6"
          >
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  color,
  trend,
  alert,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'red';
  trend?: string;
  alert?: boolean;
}) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className={`glass p-6 rounded-2xl ${alert ? 'ring-2 ring-red-500' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center space-x-1 text-green-600 text-sm font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-gray-600">{title}</p>
      </div>
    </div>
  );
}

function BillCard({
  bill,
  formatCurrency,
  formatDate,
  onMarkAsSent,
  onMarkAsPaid,
  delay,
}: {
  bill: Bill;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (date: string | null) => string;
  onMarkAsSent: (billId: string) => void;
  onMarkAsPaid: (billId: string) => void;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="glass p-6 rounded-2xl hover:shadow-xl transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900">{bill.billNumber}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 ${statusColors[bill.status]}`}>
              {statusIcons[bill.status]}
              <span>{bill.status}</span>
            </span>
          </div>
          <p className="text-gray-600">
            {bill.job.client.name} • {bill.job.loadingLocation || 'N/A'} → {bill.job.deliveryAddress || 'N/A'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(bill.amount, bill.currency)}</p>
          <p className="text-sm text-gray-600">{bill.currency}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-500 flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>Issued</span>
          </p>
          <p className="font-semibold text-gray-900">{formatDate(bill.issuedDate)}</p>
        </div>
        <div>
          <p className="text-gray-500 flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>Due</span>
          </p>
          <p className="font-semibold text-gray-900">{formatDate(bill.dueDate)}</p>
        </div>
        <div>
          <p className="text-gray-500 flex items-center space-x-1">
            <CheckCircle className="w-4 h-4" />
            <span>Paid</span>
          </p>
          <p className="font-semibold text-gray-900">{formatDate(bill.paidDate)}</p>
        </div>
      </div>

      {bill.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
          <p className="text-sm text-yellow-800">{bill.notes}</p>
        </div>
      )}

      <div className="flex items-center space-x-3">
        <Link
          href={`/dashboard/billing/${bill.id}`}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>View</span>
        </Link>
        {bill.status === 'DRAFT' || bill.status === 'ISSUED' && (
          <button
            onClick={() => onMarkAsSent(bill.id)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        )}
        {bill.status === 'SENT' && (
          <button
            onClick={() => onMarkAsPaid(bill.id)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Mark as Paid</span>
          </button>
        )}
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
      </div>
    </motion.div>
  );
}
