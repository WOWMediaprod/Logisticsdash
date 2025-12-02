"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Users,
  Wifi,
  Star,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronUp,
  ChevronDown,
  MapPin,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useCompany } from "../../../contexts/CompanyContext";
import { getApiUrl } from "../../../lib/api-config";
import type {
  DriverOverviewResponse,
  DriverPerformance,
  PerformancePeriod,
  SortField,
  SortDirection,
  SortConfig,
} from "../../../types/driver-performance";

// Dynamically import Leaflet map to avoid SSR issues
const DriverMap = dynamic(() => import("./DriverMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-slate-100 rounded-xl flex items-center justify-center">
      <div className="text-slate-400">Loading map...</div>
    </div>
  ),
});

const PERIOD_OPTIONS: { value: PerformancePeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "30days", label: "Last 30 Days" },
];

export default function DriverPerformancePage() {
  const { companyId } = useCompany();
  const [period, setPeriod] = useState<PerformancePeriod>("week");
  const [data, setData] = useState<DriverOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "completionRate",
    direction: "desc",
  });

  // Fetch data
  const fetchData = async () => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        getApiUrl(`api/v1/driver-stats/overview?companyId=${companyId}&period=${period}`)
      );

      if (!response.ok) {
        throw new Error("Failed to fetch driver performance data");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId, period]);

  // Sort drivers
  const sortedDrivers = useMemo(() => {
    if (!data?.data?.drivers) return [];

    const drivers = [...data.data.drivers];

    drivers.sort((a, b) => {
      let aValue: string | number | boolean | null;
      let bValue: string | number | boolean | null;

      switch (sortConfig.field) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "status":
          aValue = a.isOnline ? 1 : 0;
          bValue = b.isOnline ? 1 : 0;
          break;
        case "totalJobs":
          aValue = a.stats.totalJobs;
          bValue = b.stats.totalJobs;
          break;
        case "completionRate":
          aValue = a.stats.completionRate;
          bValue = b.stats.completionRate;
          break;
        case "jobsChange":
          aValue = a.trends.jobsChange;
          bValue = b.trends.jobsChange;
          break;
        case "jobsPerDay":
          aValue = a.stats.jobsPerDay;
          bValue = b.stats.jobsPerDay;
          break;
        case "activeDays":
          aValue = a.stats.activeDays;
          bValue = b.stats.activeDays;
          break;
        case "lastActive":
          aValue = a.lastActive ? new Date(a.lastActive).getTime() : 0;
          bValue = b.lastActive ? new Date(b.lastActive).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return drivers;
  }, [data?.data?.drivers, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) {
      return <ChevronUp className="w-4 h-4 text-slate-300" />;
    }
    return sortConfig.direction === "desc" ? (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    );
  };

  const TrendIndicator = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span>+{value}%</span>
        </span>
      );
    }
    if (value < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-red-600">
          <TrendingDown className="w-4 h-4" />
          <span>{value}%</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-slate-400">
        <Minus className="w-4 h-4" />
        <span>0%</span>
      </span>
    );
  };

  const CompletionBadge = ({ rate }: { rate: number }) => {
    let colorClass = "bg-red-100 text-red-700";
    if (rate >= 85) {
      colorClass = "bg-green-100 text-green-700";
    } else if (rate >= 70) {
      colorClass = "bg-yellow-100 text-yellow-700";
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {rate}%
      </span>
    );
  };

  const AlertBadge = ({ driver }: { driver: DriverPerformance }) => {
    if (driver.alerts.isTopPerformer) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
          <Star className="w-3 h-3" /> Top
        </span>
      );
    }
    if (driver.alerts.isUnderperforming) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
          <AlertTriangle className="w-3 h-3" /> Attention
        </span>
      );
    }
    if (driver.alerts.hasIdleStreak && !driver.alerts.isNewDriver) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
          <Clock className="w-3 h-3" /> Idle
        </span>
      );
    }
    if (driver.alerts.isNewDriver) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
          New
        </span>
      );
    }
    return null;
  };

  const formatLastActive = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!companyId) {
    return (
      <div className="p-8 text-center text-slate-500">
        Please select a company to view driver performance.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Driver Performance</h1>
          <p className="text-slate-500 mt-1">
            Bird&apos;s eye view of all driver metrics and insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Filters */}
          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  period === option.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
          <button onClick={fetchData} className="ml-4 underline">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-20 mb-2" />
                <div className="h-8 bg-slate-200 rounded w-16" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm h-96 animate-pulse" />
        </div>
      )}

      {/* Content */}
      {data?.data && (
        <>
          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Total Drivers */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">Total Drivers</span>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {data.data.summary.totalDrivers}
              </div>
              <div className="text-xs text-slate-400 mt-1">Active drivers in system</div>
            </div>

            {/* Online Now */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">Online Now</span>
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {data.data.summary.onlineNow}
              </div>
              <div className="text-xs text-slate-400 mt-1">Currently tracking</div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">Top Performers</span>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {data.data.summary.topPerformers}
              </div>
              <div className="text-xs text-slate-400 mt-1">&gt;120% of avg completion</div>
            </div>

            {/* Needs Attention */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">Needs Attention</span>
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {data.data.summary.needsAttention}
              </div>
              <div className="text-xs text-slate-400 mt-1">Low performance or idle</div>
            </div>
          </motion.div>

          {/* Company Averages Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 text-white shadow-lg"
          >
            <div className="flex flex-wrap items-center justify-around gap-4 text-center">
              <div>
                <div className="text-blue-200 text-xs uppercase tracking-wider mb-1">
                  Avg Completion Rate
                </div>
                <div className="text-2xl font-bold">{data.data.companyAverages.completionRate}%</div>
              </div>
              <div className="hidden sm:block w-px h-10 bg-blue-400/30" />
              <div>
                <div className="text-blue-200 text-xs uppercase tracking-wider mb-1">
                  Avg Jobs/Day
                </div>
                <div className="text-2xl font-bold">{data.data.companyAverages.jobsPerDay}</div>
              </div>
              <div className="hidden sm:block w-px h-10 bg-blue-400/30" />
              <div>
                <div className="text-blue-200 text-xs uppercase tracking-wider mb-1">Period</div>
                <div className="text-2xl font-bold">{data.data.period.label}</div>
              </div>
            </div>
          </motion.div>

          {/* Drivers Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        Driver
                        <SortIcon field="name" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Status
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort("totalJobs")}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Jobs
                        <SortIcon field="totalJobs" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort("completionRate")}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Rate
                        <SortIcon field="completionRate" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort("jobsChange")}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Trend
                        <SortIcon field="jobsChange" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort("jobsPerDay")}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Jobs/Day
                        <SortIcon field="jobsPerDay" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort("activeDays")}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Active
                        <SortIcon field="activeDays" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort("lastActive")}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Last Seen
                        <SortIcon field="lastActive" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedDrivers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                        No drivers found for this period
                      </td>
                    </tr>
                  ) : (
                    sortedDrivers.map((driver) => (
                      <tr
                        key={driver.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900">
                                  {driver.name}
                                </span>
                                <AlertBadge driver={driver} />
                              </div>
                              {driver.phone && (
                                <span className="text-sm text-slate-400">{driver.phone}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {driver.isOnline ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              Offline
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-semibold text-slate-900">
                            {driver.stats.completedJobs}
                          </span>
                          <span className="text-slate-400">/{driver.stats.totalJobs}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <CompletionBadge rate={driver.stats.completionRate} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <TrendIndicator value={driver.trends.jobsChange} />
                        </td>
                        <td className="px-4 py-4 text-center text-slate-600">
                          {driver.stats.jobsPerDay}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-slate-900">{driver.stats.activeDays}</span>
                          <span className="text-slate-400">
                            /{driver.stats.activeDays + driver.stats.idleDays}d
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-slate-500">
                          {formatLastActive(driver.lastActive)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Map Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-400" />
                <h3 className="font-semibold text-slate-900">Driver Locations</h3>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-slate-500">Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-400" />
                  <span className="text-slate-500">Offline</span>
                </div>
              </div>
            </div>
            <div className="h-80">
              <DriverMap drivers={data.data.drivers} />
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
