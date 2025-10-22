'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';
import { getApiUrl } from '../lib/api-config';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  CheckCircle,
  Clock,
  Navigation,
  Package,
  FileText,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';

type WaypointType =
  | 'PICKUP'
  | 'CONTAINER_PICKUP'
  | 'DOCUMENT_PICKUP'
  | 'CHECKPOINT'
  | 'DELIVERY'
  | 'DOCUMENT_DROPOFF'
  | 'RETURN';

interface Waypoint {
  id: string;
  jobId: string;
  routeId: string;
  name: string;
  type: WaypointType;
  lat: number;
  lng: number;
  sequence: number;
  estimatedArrival?: string;
  isCompleted: boolean;
  actualArrival?: string;
  metadata?: {
    address?: string;
    instructions?: string;
    requiredDocuments?: string[];
  };
  createdAt: string;
}

interface WaypointManagementProps {
  jobId: string;
  routeId: string;
}

const waypointTypeConfig: Record<WaypointType, { label: string; icon: React.ReactNode; color: string }> = {
  PICKUP: { label: 'Initial Pickup', icon: <MapPin className="w-4 h-4" />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  CONTAINER_PICKUP: { label: 'Container Pickup', icon: <Package className="w-4 h-4" />, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  DOCUMENT_PICKUP: { label: 'Document Pickup', icon: <FileText className="w-4 h-4" />, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  CHECKPOINT: { label: 'Checkpoint', icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  DELIVERY: { label: 'Final Delivery', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-50 text-green-700 border-green-200' },
  DOCUMENT_DROPOFF: { label: 'Document Drop-off', icon: <FileText className="w-4 h-4" />, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  RETURN: { label: 'Return/Empty Return', icon: <Navigation className="w-4 h-4" />, color: 'bg-gray-50 text-gray-700 border-gray-200' },
};

export default function WaypointManagement({ jobId, routeId }: WaypointManagementProps) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWaypoint, setEditingWaypoint] = useState<Waypoint | null>(null);

  useEffect(() => {
    fetchWaypoints();
  }, [jobId]);

  const fetchWaypoints = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl(`/api/v1/waypoints?jobId=${jobId}`));
      const result = await response.json();
      if (result.success) {
        setWaypoints(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch waypoints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this waypoint?')) return;

    try {
      const response = await fetch(getApiUrl(`/api/v1/waypoints/${id}`), {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        fetchWaypoints();
      }
    } catch (error) {
      console.error('Failed to delete waypoint:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading waypoints...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Route Waypoints</h3>
          <p className="text-sm text-gray-600">Manage stops and checkpoints for this job</p>
        </div>
        <button
          onClick={() => {
            setEditingWaypoint(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Waypoint
        </button>
      </div>

      {waypoints.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No waypoints added yet</p>
          <p className="text-sm text-gray-500 mt-1">Add stops, checkpoints, or delivery locations for this route</p>
        </div>
      ) : (
        <div className="space-y-3">
          {waypoints.map((waypoint, index) => (
            <motion.div
              key={waypoint.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`border rounded-lg p-4 ${waypoint.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-semibold ${
                    waypoint.isCompleted
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}>
                    {waypoint.isCompleted ? <CheckCircle className="w-5 h-5" /> : waypoint.sequence}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{waypoint.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{waypoint.metadata?.address}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${waypointTypeConfig[waypoint.type].color} flex items-center gap-1 whitespace-nowrap`}>
                      {waypointTypeConfig[waypoint.type].icon}
                      {waypointTypeConfig[waypoint.type].label}
                    </span>
                  </div>

                  {waypoint.metadata?.instructions && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      📝 {waypoint.metadata.instructions}
                    </p>
                  )}

                  {waypoint.isCompleted && waypoint.actualArrival && (
                    <p className="text-sm text-green-700 mt-2 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Completed: {new Date(waypoint.actualArrival).toLocaleString('en-LK')}
                    </p>
                  )}
                </div>

                {!waypoint.isCompleted && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingWaypoint(waypoint);
                        setShowAddModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(waypoint.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <WaypointModal
            jobId={jobId}
            routeId={routeId}
            waypoint={editingWaypoint}
            onClose={() => {
              setShowAddModal(false);
              setEditingWaypoint(null);
            }}
            onSuccess={() => {
              setShowAddModal(false);
              setEditingWaypoint(null);
              fetchWaypoints();
            }}
            nextSequence={waypoints.length + 1}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface WaypointModalProps {
  jobId: string;
  routeId: string;
  waypoint: Waypoint | null;
  onClose: () => void;
  onSuccess: () => void;
  nextSequence: number;
}

function WaypointModal({ jobId, routeId, waypoint, onClose, onSuccess, nextSequence }: WaypointModalProps) {
  const [formData, setFormData] = useState({
    name: waypoint?.name || '',
    type: (waypoint?.type || 'CHECKPOINT') as WaypointType,
    address: waypoint?.metadata?.address || '',
    lat: waypoint?.lat || 0,
    lng: waypoint?.lng || 0,
    sequence: waypoint?.sequence || nextSequence,
    instructions: waypoint?.metadata?.instructions || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.address || formData.lat === 0 || formData.lng === 0) {
      setError('Please select a valid address from the autocomplete');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        jobId,
        routeId,
        name: formData.name,
        type: formData.type,
        address: formData.address,
        lat: formData.lat,
        lng: formData.lng,
        sequence: formData.sequence,
        instructions: formData.instructions || undefined,
      };

      const url = waypoint
        ? getApiUrl(`/api/v1/waypoints/${waypoint.id}`)
        : getApiUrl('/api/v1/waypoints');

      const response = await fetch(url, {
        method: waypoint ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Failed to save waypoint');
      }
    } catch (error) {
      console.error('Failed to save waypoint:', error);
      setError('Failed to save waypoint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {waypoint ? 'Edit Waypoint' : 'Add New Waypoint'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Waypoint Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Container Pickup - Colombo Port"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Waypoint Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as WaypointType })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(waypointTypeConfig).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <GooglePlacesAutocomplete
            label="Location"
            value={formData.address}
            onChange={(result) => setFormData({
              ...formData,
              address: result.address,
              lat: result.lat,
              lng: result.lng,
            })}
            placeholder="Search for address in Sri Lanka"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={3}
              placeholder="e.g., Collect documents from security office, Gate #5"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sequence Order
            </label>
            <input
              type="number"
              value={formData.sequence}
              onChange={(e) => setFormData({ ...formData, sequence: parseInt(e.target.value) })}
              min="1"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Order in which this waypoint should be visited
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {waypoint ? 'Update Waypoint' : 'Add Waypoint'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
