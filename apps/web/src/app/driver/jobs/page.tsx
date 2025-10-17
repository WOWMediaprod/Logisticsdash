"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin, Package, Truck, Phone, User } from "lucide-react";

type Job = {
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
  route?: {
    code: string;
    origin: string;
    destination: string;
    kmEstimate: number;
  };
  container?: {
    iso: string;
    size: string;
    owner: string;
  };
  vehicle?: {
    regNo: string;
    make: string;
    model: string;
  };
};

const statusColors: Record<string, string> = {
  ASSIGNED: "bg-blue-100 text-blue-800 border-blue-200",
  IN_TRANSIT: "bg-yellow-100 text-yellow-800 border-yellow-200",
  AT_PICKUP: "bg-purple-100 text-purple-800 border-purple-200",
  LOADED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  AT_DELIVERY: "bg-orange-100 text-orange-800 border-orange-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function DriverJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverName, setDriverName] = useState("");

  useEffect(() => {
    // For demo purposes, we'll show some sample jobs
    // In a real app, this would fetch jobs assigned to the specific driver
    const sampleJobs: Job[] = [
      {
        id: "JOB001",
        status: "ASSIGNED",
        jobType: "ONE_WAY",
        priority: "HIGH",
        specialNotes: "Handle with care - fragile items",
        pickupTs: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        etaTs: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        client: {
          name: "Mumbai Port Trust",
          code: "MPT001"
        },
        route: {
          code: "MUM-DEL-001",
          origin: "Mumbai Port",
          destination: "Delhi ICD",
          kmEstimate: 1450
        },
        container: {
          iso: "MSKU7832106",
          size: "40HC",
          owner: "Maersk"
        },
        vehicle: {
          regNo: "MH12AB1234",
          make: "Tata",
          model: "Prima"
        }
      },
      {
        id: "JOB002",
        status: "IN_TRANSIT",
        jobType: "ROUND_TRIP",
        priority: "NORMAL",
        pickupTs: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        etaTs: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        client: {
          name: "JNPT Container Terminal",
          code: "JNPT001"
        },
        route: {
          code: "JNPT-PUN-002",
          origin: "JNPT Terminal",
          destination: "Pune Industrial Area",
          kmEstimate: 120
        },
        container: {
          iso: "HLBU1234567",
          size: "20GP",
          owner: "Hapag Lloyd"
        },
        vehicle: {
          regNo: "MH14CD5678",
          make: "Ashok Leyland",
          model: "Ecomet"
        }
      }
    ];

    setTimeout(() => {
      setJobs(sampleJobs);
      setLoading(false);
    }, 1000);

    // Get driver name from localStorage or prompt
    const savedName = localStorage.getItem("driverName");
    if (savedName) {
      setDriverName(savedName);
    } else {
      const name = prompt("Enter your name:");
      if (name) {
        setDriverName(name);
        localStorage.setItem("driverName", name);
      }
    }
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading jobs...</span>
        </div>
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
          className="flex items-center justify-between mb-6"
        >
          <Link
            href="/driver"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">My Jobs</h1>
            {driverName && (
              <p className="text-sm text-gray-600">Welcome, {driverName}</p>
            )}
          </div>
          <div className="w-16"></div> {/* Spacer for centering */}
        </motion.div>

        {/* Jobs List */}
        <div className="space-y-4">
          {jobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg p-6"
            >
              {/* Job Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500/10 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{job.id}</h3>
                    <p className="text-sm text-gray-600">{job.client?.name}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[job.status] || statusColors.ASSIGNED}`}>
                  {job.status.replace("_", " ")}
                </div>
              </div>

              {/* Route Info */}
              {job.route && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-900">Route</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>{job.route.origin} → {job.route.destination}</p>
                    <p className="text-xs mt-1">{job.route.kmEstimate} km • {job.route.code}</p>
                  </div>
                </div>
              )}

              {/* Container Info */}
              {job.container && (
                <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-900">Container</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">ISO:</span> {job.container.iso}</p>
                    <p><span className="font-medium">Size:</span> {job.container.size} • <span className="font-medium">Owner:</span> {job.container.owner}</p>
                  </div>
                </div>
              )}

              {/* Vehicle Info */}
              {job.vehicle && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Truck className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-900">Vehicle</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>{job.vehicle.regNo} • {job.vehicle.make} {job.vehicle.model}</p>
                  </div>
                </div>
              )}

              {/* Timing */}
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div>
                  <span className="text-gray-500">Pickup:</span>
                  <span className="ml-1 font-semibold text-gray-900">{formatDate(job.pickupTs)}</span>
                </div>
                <div>
                  <span className="text-gray-500">ETA:</span>
                  <span className="ml-1 font-semibold text-gray-900">{formatDate(job.etaTs)}</span>
                </div>
              </div>

              {/* Special Notes */}
              {job.specialNotes && (
                <div className="mb-4 p-3 bg-yellow-50 rounded-xl">
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-800">Special Notes</span>
                  </div>
                  <p className="text-sm text-yellow-700">{job.specialNotes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={`/driver/tracking?jobId=${job.id}`}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-xl text-sm font-semibold text-center transition-colors"
                >
                  Start Tracking
                </Link>
                <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-xl text-sm font-semibold transition-colors">
                  Update Status
                </button>
                <Link
                  href="/driver/upload"
                  className="col-span-2 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-xl text-sm font-semibold text-center transition-colors"
                >
                  Upload Document
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Emergency Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-red-50/80 backdrop-blur-sm rounded-2xl border border-red-200/60 shadow-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Phone className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-900">Emergency Contact</h4>
          </div>
          <div className="text-sm text-red-800">
            <p>Dispatch Center: <span className="font-semibold">+91-9876543210</span></p>
            <p>Emergency: <span className="font-semibold">108</span></p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 text-xs text-gray-500"
        >
          <p>Logistics Platform • Driver Portal</p>
          <p>Keep this app updated for latest job information</p>
        </motion.div>
      </div>
    </main>
  );
}