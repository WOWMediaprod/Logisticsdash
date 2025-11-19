'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCompany } from '../../../contexts/CompanyContext';
import { getApiUrl } from '../../../lib/api-config';

interface Client {
  id: string;
  name: string;
  code: string;
}

interface Vehicle {
  id: string;
  regNo: string;
  make: string;
  model: string;
  class: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNo: string;
}

interface Container {
  id: string;
  iso: string;
  size: string;
  owner: string;
  checkOk: boolean;
}

interface CreateJobData {
  clientId: string;
  containerId?: string;
  vehicleId?: string;
  driverId?: string;
  jobType: 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_STOP' | 'EXPORT' | 'IMPORT';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  pickupTs?: string;
  etaTs?: string;
  specialNotes?: string;
}

export default function CreateJobPage() {
  const router = useRouter();
  const { companyId } = useCompany();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);

  const [formData, setFormData] = useState<CreateJobData>({
    clientId: '',
    jobType: 'ONE_WAY',
    priority: 'NORMAL',
  });

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadFormData = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = `companyId=${companyId}`;
        const [clientsRes, vehiclesRes, driversRes, containersRes] = await Promise.all([
          fetch(getApiUrl(`/api/v1/clients?${query}`)),
          fetch(getApiUrl(`/api/v1/vehicles?${query}`)),
          fetch(getApiUrl(`/api/v1/drivers?${query}`)),
          fetch(getApiUrl(`/api/v1/containers?${query}`)),
        ]);

        if (cancelled) {
          return;
        }

        const [clientsJson, vehiclesJson, driversJson, containersJson] = await Promise.all([
          clientsRes.json(),
          vehiclesRes.json(),
          driversRes.json(),
          containersRes.json(),
        ]);

        setClients(clientsJson.success ? clientsJson.data : []);
        setVehicles(vehiclesJson.success ? vehiclesJson.data : []);
        setDrivers(driversJson.success ? driversJson.data : []);
        setContainers(containersJson.success ? containersJson.data : []);
      } catch (err) {
        console.error('Failed to fetch form data', err);
        if (!cancelled) {
          setError('Unable to load reference data. Please retry.');
          setClients([]);
          setVehicles([]);
          setDrivers([]);
          setContainers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFormData();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const updateFormData = (field: keyof CreateJobData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!companyId || !formData.clientId) {
      setError('Client is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const url = '/api/v1/jobs';
      const payload = { ...formData, companyId };

      console.log('🚀 CREATE JOB - URL:', url);
      console.log('🚀 CREATE JOB - Method:', 'POST');
      console.log('🚀 CREATE JOB - Payload:', payload);

      const response = await fetch(getApiUrl(url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('✅ CREATE JOB - Response status:', response.status);
      console.log('✅ CREATE JOB - Response URL:', response.url);

      const result = await response.json();

      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Failed to create job.');
      }
    } catch (err) {
      console.error('Failed to create job', err);
      setError('Unexpected error while creating job.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!companyId) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="glass max-w-xl mx-auto p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Company not selected</h1>
          <p className="text-gray-600">
            Choose a company to create new jobs. Provide a company identifier via the CompanyProvider or the
            <code className="font-mono">NEXT_PUBLIC_COMPANY_ID</code> environment variable.
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading form...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create new job</h1>
              <p className="text-gray-600 mt-1">Set up a new logistics operation</p>
            </div>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="glass p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Job details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Client</label>
                  <select
                    value={formData.clientId}
                    onChange={(event) => updateFormData('clientId', event.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.code ? `(${client.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Job type</label>
                  <select
                    value={formData.jobType}
                    onChange={(event) => updateFormData('jobType', event.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ONE_WAY">One way</option>
                    <option value="ROUND_TRIP">Round trip</option>
                    <option value="MULTI_STOP">Multi stop</option>
                    <option value="EXPORT">Export (Yard → Port/Customer)</option>
                    <option value="IMPORT">Import (Port → Yard)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(event) => updateFormData('priority', event.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="glass p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Assignments</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Container (optional)</label>
                  <select
                    value={formData.containerId || ''}
                    onChange={(event) => updateFormData('containerId', event.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No container</option>
                    {containers.map((container) => (
                      <option key={container.id} value={container.id}>
                        {container.iso} - {container.size} ({container.owner})
                        {!container.checkOk ? ' (check pending)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle</label>
                  <select
                    value={formData.vehicleId || ''}
                    onChange={(event) => updateFormData('vehicleId', event.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No vehicle assigned</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.regNo} - {vehicle.make} {vehicle.model} ({vehicle.class})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Driver</label>
                  <select
                    value={formData.driverId || ''}
                    onChange={(event) => updateFormData('driverId', event.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No driver assigned</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                        {driver.phone ? ` (${driver.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="glass p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Schedule (optional)</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup time</label>
                  <input
                    type="datetime-local"
                    value={formData.pickupTs || ''}
                    onChange={(event) => updateFormData('pickupTs', event.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expected delivery (ETA)</label>
                  <input
                    type="datetime-local"
                    value={formData.etaTs || ''}
                    onChange={(event) => updateFormData('etaTs', event.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            <section className="glass p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Special instructions</h2>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Special notes</label>
              <textarea
                value={formData.specialNotes || ''}
                onChange={(event) => updateFormData('specialNotes', event.target.value)}
                rows={3}
                placeholder="Add handling instructions, delivery notes, or other important information"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </section>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
            )}

            <div className="flex items-center justify-center space-x-4">
              <Link href="/dashboard" className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all">
                Cancel
              </Link>
              <motion.button
                type="submit"
                disabled={submitting || !formData.clientId}
                whileHover={{ scale: submitting ? 1 : 1.02 }}
                whileTap={{ scale: submitting ? 1 : 0.98 }}
                className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                  submitting || !formData.clientId
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                }`}
              >
                {submitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating job...</span>
                  </div>
                ) : (
                  'Create job'
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

