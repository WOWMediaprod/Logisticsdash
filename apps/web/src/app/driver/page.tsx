'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Truck, LogIn, Loader2 } from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';

export default function DriverLoginPage() {
  const router = useRouter();
  const [driverId, setDriverId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!driverId.trim()) {
      setError('Please enter your Driver ID');
      setLoading(false);
      return;
    }

    try {
      // Get driver by ID
      const response = await fetch(getApiUrl(`/api/v1/drivers/${driverId}`));

      if (!response.ok) {
        setError('Driver ID not found. Please check and try again.');
        setLoading(false);
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        const driver = result.data;

        // Store driver session in localStorage
        const driverSession = {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          email: driver.email,
          companyId: driver.companyId,
          licenseNo: driver.licenseNo,
          loginTime: new Date().toISOString(),
        };

        localStorage.setItem('driver_session', JSON.stringify(driverSession));

        // Redirect to dashboard
        router.push('/driver/dashboard');
      } else {
        setError('Driver ID not found. Please check and try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg"
          >
            <Truck className="w-10 h-10 text-blue-600" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">Driver Portal</h1>
          <p className="text-white text-xl font-semibold">Welcome Back!</p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="driverId" className="block text-sm font-semibold text-gray-700 mb-2">
                Driver ID
              </label>
              <input
                id="driverId"
                type="text"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                placeholder="Enter your Driver ID"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                autoFocus
                disabled={loading}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2"
              >
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || !driverId.trim()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Login
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Need help? Contact your fleet manager
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-blue-100 text-sm mt-6">
          Logistics Management System © {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}
