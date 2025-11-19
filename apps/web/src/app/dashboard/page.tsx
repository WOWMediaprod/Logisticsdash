"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Briefcase, Clock, CheckCircle, Trophy } from "lucide-react";
import { useCompany } from "../../contexts/CompanyContext";
import { getApiUrl } from "../../lib/api-config";

interface JobStats {
  summary: {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    successRate: number;
  };
  statusBreakdown: Record<string, number>;
  recentJobs: Job[];
}

interface Job {
  id: string;
  status: string;
  jobType: string;
  priority: string;
  specialNotes?: string;
  pickupTs?: string;
  etaTs?: string;
  client?: {
    name: string;
    code: string;
  };
  container?: {
    iso: string;
    size: string;
    owner: string;
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
}

const statusColors: Record<string, string> = {
  CREATED: "bg-gray-100 text-gray-800 border-gray-200",
  ASSIGNED: "bg-blue-100 text-blue-800 border-blue-200",
  IN_TRANSIT: "bg-yellow-100 text-yellow-800 border-yellow-200",
  AT_PICKUP: "bg-purple-100 text-purple-800 border-purple-200",
  LOADED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  AT_DELIVERY: "bg-orange-100 text-orange-800 border-orange-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-50 text-gray-600",
  NORMAL: "bg-blue-50 text-blue-600",
  HIGH: "bg-orange-50 text-orange-600",
  URGENT: "bg-red-50 text-red-600",
};

const STATUS_FILTERS = ["ALL", "CREATED", "ASSIGNED", "IN_TRANSIT", "COMPLETED"];

const jobTypeIcons: Record<string, string> = {
  ONE_WAY: "→",
  ROUND_TRIP: "↔",
  MULTI_STOP: "⋯",
  EXPORT: "↑",
  IMPORT: "↓",
};

const CARD_STYLES = {
  total: {
    icon: "bg-blue-500/10 text-blue-600",
    chip: "bg-blue-50 text-blue-600",
    chipText: "Total",
    iconComponent: Briefcase,
  },
  active: {
    icon: "bg-yellow-500/10 text-yellow-600",
    chip: "bg-yellow-50 text-yellow-600",
    chipText: "Active",
    iconComponent: Clock,
  },
  completed: {
    icon: "bg-emerald-500/10 text-emerald-600",
    chip: "bg-emerald-50 text-emerald-600",
    chipText: "Completed",
    iconComponent: CheckCircle,
  },
  success: {
    icon: "bg-purple-500/10 text-purple-600",
    chip: "bg-purple-50 text-purple-600",
    chipText: "Success",
    iconComponent: Trophy,
  },
} as const;

type SummaryVariant = keyof typeof CARD_STYLES;

type SummaryCardProps = {
  title: string;
  value: number | string;
  variant: SummaryVariant;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) {
    return "-";
  }

  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function DashboardPage() {
  const { companyId } = useCompany();
  const [stats, setStats] = useState<JobStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch wrapper with timeout and retry logic for handling Render cold starts
  const fetchWithRetry = async (url: string, options: RequestInit = {}, attempt: number = 0): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);

      // Retry logic with exponential backoff
      if (attempt < 3) {
        setRetryCount(attempt + 1);
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, attempt + 1);
      }

      throw err;
    }
  };

  const loadData = async () => {
    if (!companyId) {
      setStats(null);
      setJobs([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setRetryCount(0);

    try {
      const statusParam = selectedStatus === "ALL" ? "" : `&status=${selectedStatus}`;
      const [statsResponse, jobsResponse] = await Promise.all([
        fetchWithRetry(getApiUrl(`/api/v1/jobs/stats?companyId=${companyId}`), {
          headers: { 'Accept': 'application/json' }
        }),
        fetchWithRetry(getApiUrl(`/api/v1/jobs?companyId=${companyId}&limit=20${statusParam}`), {
          headers: { 'Accept': 'application/json' }
        }),
      ]);

      const statsJson = await statsResponse.json();
      const jobsJson = await jobsResponse.json();

      setStats(statsJson.success ? statsJson.data : null);
      setJobs(jobsJson.success ? jobsJson.data : []);
      setError(null);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
      setStats(null);
      setJobs([]);
      setError("Failed to connect to server. The server might be waking up from sleep mode.");
    } finally {
      setLoading(false);
      setRetryCount(0);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId, selectedStatus]);

  const summaryItems = useMemo<SummaryCardProps[]>(() => {
    if (!stats) {
      return [];
    }

    return [
      { title: "Total jobs", value: stats.summary.totalJobs, variant: "total" },
      { title: "Active jobs", value: stats.summary.activeJobs, variant: "active" },
      { title: "Completed", value: stats.summary.completedJobs, variant: "completed" },
      { title: "Success rate", value: `${stats.summary.successRate}%`, variant: "success" },
    ];
  }, [stats]);

  if (!companyId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="glass max-w-xl mx-auto p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Company not selected</h1>
          <p className="text-gray-600">
            Choose a company to view dashboard metrics. Provide a company identifier via the CompanyProvider
            or the <code className="font-mono">NEXT_PUBLIC_COMPANY_ID</code> environment variable.
          </p>
        </div>
      </main>
    );
  }

  if (loading && jobs.length === 0) {
    const loadingMessage = retryCount === 0
      ? "Loading dashboard..."
      : retryCount === 1
        ? "Connecting to server..."
        : "Server is waking up, please wait...";

    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg font-semibold text-gray-700">{loadingMessage}</span>
          </div>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500">
              This may take up to a minute if the server was sleeping...
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-12 space-y-10">
        <header className="text-center max-w-4xl mx-auto space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Job Management Dashboard</h1>
          <p className="text-lg text-gray-700">
            Monitor live job activity, track progress, and follow up on logistics execution in real time.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard/create"
              className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
            >
              + Create new job
            </Link>
            <Link
              href="/dashboard/requests"
              className="inline-flex h-11 items-center justify-center rounded-full bg-purple-500 px-5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5 hover:bg-purple-400"
            >
              Job Requests
            </Link>
            <Link
              href="/dashboard/tracking"
              className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-500 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-400"
            >
              Live tracking
            </Link>
            <Link
              href="/dashboard/billing"
              className="inline-flex h-11 items-center justify-center rounded-full bg-amber-500 px-5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-amber-400"
            >
              Billing & Invoices
            </Link>
            <Link
              href="/dashboard/resources"
              className="inline-flex h-11 items-center justify-center rounded-full bg-cyan-500 px-5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-400"
            >
              Manage Resources
            </Link>
          </div>
        </header>

        {summaryItems.length > 0 && (
          <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {summaryItems.map((item) => (
              <SummaryCard key={item.title} {...item} />
            ))}
          </section>
        )}

        <section className="glass p-6 rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Job status</h2>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedStatus === status
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "bg-white/80 text-gray-600 hover:bg-white"
                  }`}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          {jobs.map((job, index) => (
            <Link href={`/dashboard/jobs/${job.id}`} key={job.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="glass p-6 rounded-2xl cursor-pointer border border-white/50 bg-white/80 shadow-lg shadow-black/5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[job.status] || statusColors.CREATED}`}>
                      {job.status.replace("_", " ")}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityColors[job.priority] || priorityColors.NORMAL}`}>
                      {job.priority}
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-gray-500">
                    {jobTypeIcons[job.jobType] || job.jobType}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {job.client?.name || "No client"}
                    {job.client?.code && <span className="text-sm font-normal text-gray-500 ml-2">({job.client.code})</span>}
                  </h3>
                  <div className="flex items-center text-gray-600 text-sm space-x-2">
                    <span className="font-medium">Job ID: {job.id.substring(0, 8)}</span>
                  </div>
                </div>

                {job.container && (
                  <div className="flex flex-wrap items-center gap-4 mb-4 rounded-xl bg-gray-50 p-3">
                    <span className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900">Container:</span> {job.container.iso}
                    </span>
                    <span className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900">Size:</span> {job.container.size}
                    </span>
                    <span className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900">Owner:</span> {job.container.owner}
                    </span>
                  </div>
                )}

                {(job.driver || job.vehicle) && (
                  <div className="flex items-center justify-between rounded-xl bg-blue-50 p-3">
                    {job.driver && (
                      <div>
                        <p className="font-semibold text-gray-900">{job.driver.name}</p>
                        <p className="text-sm text-gray-600">{job.driver.phone}</p>
                      </div>
                    )}
                    {job.vehicle && (
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{job.vehicle.regNo}</p>
                        <p className="text-sm text-gray-600">{job.vehicle.make} {job.vehicle.model}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <div>
                    <span className="text-gray-500">Pickup:</span>
                    <span className="ml-1 font-semibold text-gray-900">{formatDate(job.pickupTs)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">ETA:</span>
                    <span className="ml-1 font-semibold text-gray-900">{formatDate(job.etaTs)}</span>
                  </div>
                </div>

                {job.specialNotes && (
                  <div className="mt-3 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                    {job.specialNotes}
                  </div>
                )}
              </motion.div>
            </Link>
          ))}
        </section>

        {error && (
          <div className="text-center py-16">
            <div className="glass max-w-xl mx-auto p-8 rounded-2xl">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => loadData()}
                className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {jobs.length === 0 && !loading && !error && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">No jobs yet</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Create your first job to get started with logistics management.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryCard({ title, value, variant }: SummaryCardProps) {
  const styles = CARD_STYLES[variant];
  const IconComponent = styles.iconComponent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-black/5 backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <span className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${styles.icon}`}>
          <IconComponent size={32} />
        </span>
      </div>
    </motion.div>
  );
}
