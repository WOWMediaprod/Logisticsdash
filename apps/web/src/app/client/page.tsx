'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Truck,
  Package,
  Clock,
  FileText,
  User,
  Phone,
  Mail,
  Building,
  LayoutDashboard,
  LogOut
} from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { useCompany } from '../../contexts/CompanyContext';

export default function ClientPortalPage() {
  const { isAuthenticated } = useClientAuth();

  if (!isAuthenticated) {
    return <ClientLogin />;
  }

  return <ClientDashboard />;
}

function ClientLogin() {
  const { login } = useClientAuth();
  const { companyId } = useCompany();
  const [formData, setFormData] = useState({
    clientCode: '',
    contactEmail: '',
    companyName: ''
  });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');

    try {
      // Fetch all clients for this company and find matching client code
      const response = await fetch(`/api/v1/clients?companyId=${companyId}`);
      const result = await response.json();

      if (result.success && result.data) {
        const client = result.data.find(
          (c: any) => c.code?.toLowerCase() === formData.clientCode.toLowerCase()
        );

        if (client) {
          // Store client info in context
          login(client.id, client.name, client.code);
        } else {
          setLoginError('Invalid client code. Please check and try again.');
        }
      } else {
        setLoginError('Unable to verify client. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Login failed. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 w-full max-w-md shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Client Portal</h1>
          <p className="text-gray-600">Access your logistics dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Code
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.clientCode}
                onChange={(e) => setFormData({ ...formData, clientCode: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your client code"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@company.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your Company Ltd"
              />
            </div>
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loggingIn ? 'Verifying...' : 'Access Portal'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact support at{' '}
            <a href="tel:+27123456789" className="text-blue-600 hover:underline">
              +27 12 345 6789
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function ClientDashboard() {
  const { clientName, clientId, logout } = useClientAuth();
  const { companyId } = useCompany();
  const [activeJobs, setActiveJobs] = useState<any[]>([]);

  useEffect(() => {
    if (!companyId || !clientId) return;

    const fetchActiveJobs = async () => {
      try {
        const response = await fetch(`/api/v1/jobs?companyId=${companyId}&clientId=${clientId}&limit=10`);
        const result = await response.json();

        if (result.success && result.data) {
          // Filter only active jobs
          const active = result.data.filter((job: any) =>
            ['ASSIGNED', 'IN_TRANSIT', 'AT_PICKUP', 'LOADED', 'AT_DELIVERY'].includes(job.status)
          );
          setActiveJobs(active);
        }
      } catch (error) {
        console.error('Failed to load active jobs:', error);
      }
    };

    fetchActiveJobs();
  }, [companyId, clientId]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, {clientName}
            </h1>
            <p className="text-gray-600">Manage your logistics requests and track shipments</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          icon={<Package className="w-6 h-6" />}
          title="Active Jobs"
          value="12"
          change="+2 this week"
          color="blue"
        />
        <DashboardCard
          icon={<Clock className="w-6 h-6" />}
          title="Pending Requests"
          value="3"
          change="2 under review"
          color="orange"
        />
        <DashboardCard
          icon={<FileText className="w-6 h-6" />}
          title="Documents"
          value="24"
          change="5 recent uploads"
          color="green"
        />
        <DashboardCard
          icon={<Truck className="w-6 h-6" />}
          title="Completed"
          value="156"
          change="98% success rate"
          color="purple"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/client/dashboard"
              className="flex items-center p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors group"
            >
              <LayoutDashboard className="w-5 h-5 text-indigo-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700">My Dashboard</h3>
                <p className="text-sm text-gray-600">View all jobs and requests</p>
              </div>
            </Link>
            <Link
              href="/client/request"
              className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <Package className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">New Job Request</h3>
                <p className="text-sm text-gray-600">Submit a new logistics request</p>
              </div>
            </Link>
            <Link
              href="/client/track"
              className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <Truck className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-green-700">Track Shipments</h3>
                <p className="text-sm text-gray-600">Monitor your active jobs</p>
              </div>
            </Link>
            <Link
              href="/client/documents"
              className="flex items-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <FileText className="w-5 h-5 text-purple-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-700">Documents</h3>
                <p className="text-sm text-gray-600">View and upload documents</p>
              </div>
            </Link>
            <Link
              href="/client/billing"
              className="flex items-center p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors group"
            >
              <FileText className="w-5 h-5 text-amber-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-amber-700">Billing & Invoices</h3>
                <p className="text-sm text-gray-600">View bills and payment history</p>
              </div>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Live Activity</h2>
          <div className="space-y-3">
            {activeJobs.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No active jobs at the moment</p>
            ) : (
              activeJobs.map((job) => (
                <Link key={job.id} href={`/client/jobs/${job.id}`}>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {job.route ? `${job.route.origin} → ${job.route.destination}` : `Job ${job.id.slice(-8)}`}
                      </p>
                      <p className="text-xs text-gray-500">ETA: {formatDate(job.etaTs)}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      job.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                      job.status === 'AT_PICKUP' ? 'bg-purple-100 text-purple-800' :
                      job.status === 'LOADED' ? 'bg-indigo-100 text-indigo-800' :
                      job.status === 'AT_DELIVERY' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DashboardCard({
  icon,
  title,
  value,
  change,
  color
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: string;
  color: 'blue' | 'orange' | 'green' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-xs text-gray-500">{change}</p>
    </motion.div>
  );
}