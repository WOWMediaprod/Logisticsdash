'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, GripVertical, CheckCircle, Circle } from 'lucide-react';
import AddressAutocomplete from './AddressAutocomplete';
import { getApiUrl } from '../lib/api-config';

interface Waypoint {
  id: string;
  jobId: string;
  name: string;
  type: 'PICKUP' | 'DELIVERY' | 'CHECKPOINT' | 'REST_STOP' | 'YARD' | 'PORT';
  sequence: number;
  lat: number | null;
  lng: number | null;
  address: string | null;
  radiusM: number;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
}

interface WaypointManagerProps {
  jobId: string;
  readOnly?: boolean;
  onWaypointsChange?: (waypoints: Waypoint[]) => void;
}

const WAYPOINT_TYPE_LABELS = {
  PICKUP: 'Pickup',
  DELIVERY: 'Delivery',
  CHECKPOINT: 'Checkpoint',
  REST_STOP: 'Rest Stop',
  YARD: 'Container Yard',
  PORT: 'Port',
};

const WAYPOINT_TYPE_COLORS = {
  PICKUP: 'bg-green-100 text-green-800 border-green-200',
  DELIVERY: 'bg-red-100 text-red-800 border-red-200',
  CHECKPOINT: 'bg-blue-100 text-blue-800 border-blue-200',
  REST_STOP: 'bg-gray-100 text-gray-800 border-gray-200',
  YARD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PORT: 'bg-purple-100 text-purple-800 border-purple-200',
};

export default function WaypointManager({ jobId, readOnly = false, onWaypointsChange }: WaypointManagerProps) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [newWaypoint, setNewWaypoint] = useState({
    name: '',
    type: 'CHECKPOINT' as Waypoint['type'],
    address: '',
    lat: 0,
    lng: 0,
  });

  // Load waypoints
  useEffect(() => {
    loadWaypoints();
  }, [jobId]);

  const loadWaypoints = async () => {
    try {
      const response = await fetch(getApiUrl(`/api/v1/waypoints?jobId=${jobId}`));
      const data = await response.json();

      if (data.success) {
        setWaypoints(data.data);
        onWaypointsChange?.(data.data);
      }
    } catch (error) {
      console.error('Failed to load waypoints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWaypoint = async () => {
    if (!newWaypoint.name || !newWaypoint.address) {
      alert('Please provide waypoint name and address');
      return;
    }

    try {
      const sequence = waypoints.length + 1;

      const response = await fetch(getApiUrl('/api/v1/waypoints'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          name: newWaypoint.name,
          type: newWaypoint.type,
          address: newWaypoint.address,
          lat: newWaypoint.lat,
          lng: newWaypoint.lng,
          sequence,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadWaypoints();
        setShowAddForm(false);
        setNewWaypoint({
          name: '',
          type: 'CHECKPOINT',
          address: '',
          lat: 0,
          lng: 0,
        });
      }
    } catch (error) {
      console.error('Failed to add waypoint:', error);
      alert('Failed to add waypoint');
    }
  };

  const handleDeleteWaypoint = async (waypointId: string) => {
    if (!confirm('Are you sure you want to delete this waypoint?')) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/api/v1/waypoints/${waypointId}`), {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadWaypoints();
      }
    } catch (error) {
      console.error('Failed to delete waypoint:', error);
      alert('Failed to delete waypoint');
    }
  };

  const handleMarkComplete = async (waypointId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/v1/waypoints/${waypointId}/complete`), {
        method: 'PATCH',
      });

      const data = await response.json();

      if (data.success) {
        await loadWaypoints();
      }
    } catch (error) {
      console.error('Failed to mark waypoint complete:', error);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    const waypoint = waypoints[index];
    // Don't allow dragging PICKUP or DELIVERY waypoints
    if (waypoint.type === 'PICKUP' || waypoint.type === 'DELIVERY') {
      return;
    }
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const waypoint = waypoints[index];
    // Don't allow dropping on PICKUP or DELIVERY waypoints
    if (waypoint.type === 'PICKUP' || waypoint.type === 'DELIVERY') {
      return;
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const dropWaypoint = waypoints[dropIndex];
    // Don't allow dropping on PICKUP or DELIVERY waypoints
    if (dropWaypoint.type === 'PICKUP' || dropWaypoint.type === 'DELIVERY') {
      setDraggedIndex(null);
      return;
    }

    // Reorder waypoints array
    const newWaypoints = [...waypoints];
    const [draggedWaypoint] = newWaypoints.splice(draggedIndex, 1);
    newWaypoints.splice(dropIndex, 0, draggedWaypoint);

    // Update sequences
    const reorderedWaypoints = newWaypoints.map((wp, idx) => ({
      id: wp.id,
      sequence: idx + 1,
    }));

    try {
      // Call reorder API
      const response = await fetch(getApiUrl('/api/v1/waypoints/reorder'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          waypoints: reorderedWaypoints,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadWaypoints();
      } else {
        alert('Failed to reorder waypoints');
      }
    } catch (error) {
      console.error('Failed to reorder waypoints:', error);
      alert('Failed to reorder waypoints');
    }

    setDraggedIndex(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Route Waypoints</h3>
        {!readOnly && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Waypoint
          </button>
        )}
      </div>

      {/* Add Waypoint Form */}
      {showAddForm && !readOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-gray-900">Add New Waypoint</h4>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waypoint Name *
              </label>
              <input
                type="text"
                value={newWaypoint.name}
                onChange={(e) => setNewWaypoint({ ...newWaypoint, name: e.target.value })}
                placeholder="e.g., Container Yard, Fuel Stop"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waypoint Type
              </label>
              <select
                value={newWaypoint.type}
                onChange={(e) => setNewWaypoint({ ...newWaypoint, type: e.target.value as Waypoint['type'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="CHECKPOINT">Checkpoint</option>
                <option value="YARD">Container Yard</option>
                <option value="PORT">Port</option>
                <option value="REST_STOP">Rest Stop</option>
              </select>
            </div>
          </div>

          <AddressAutocomplete
            label="Location"
            value={newWaypoint.address}
            onChange={(result) => setNewWaypoint({
              ...newWaypoint,
              address: result.address,
              lat: result.lat,
              lng: result.lng,
            })}
            placeholder="Search for location..."
            required
          />

          <div className="flex gap-2">
            <button
              onClick={handleAddWaypoint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Add Waypoint
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Waypoints Timeline */}
      {waypoints.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No waypoints yet. {!readOnly && 'Add the first waypoint to start planning the route.'}
        </div>
      ) : (
        <div className="space-y-3">
          {waypoints.map((waypoint, index) => {
            const isDraggable = !readOnly && waypoint.type !== 'PICKUP' && waypoint.type !== 'DELIVERY';

            return (
              <div
                key={waypoint.id}
                draggable={isDraggable}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
                  isDraggable ? 'cursor-move' : ''
                } ${draggedIndex === index ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle Icon */}
                  {isDraggable && (
                    <div className="flex-shrink-0 pt-1">
                      <GripVertical className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    </div>
                  )}

                  {/* Sequence Number */}
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>

                {/* Waypoint Details */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-900">{waypoint.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${WAYPOINT_TYPE_COLORS[waypoint.type]}`}>
                        {WAYPOINT_TYPE_LABELS[waypoint.type]}
                      </span>
                      {waypoint.isCompleted && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Completed
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {!readOnly && (
                      <div className="flex items-center gap-2">
                        {!waypoint.isCompleted && waypoint.type !== 'PICKUP' && waypoint.type !== 'DELIVERY' && (
                          <button
                            onClick={() => handleMarkComplete(waypoint.id)}
                            className="text-green-600 hover:text-green-700"
                            title="Mark as completed"
                          >
                            <Circle className="w-5 h-5" />
                          </button>
                        )}
                        {waypoint.type !== 'PICKUP' && waypoint.type !== 'DELIVERY' && (
                          <button
                            onClick={() => handleDeleteWaypoint(waypoint.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete waypoint"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="break-all">{waypoint.address || 'No address'}</span>
                  </div>

                  {waypoint.completedAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Completed: {new Date(waypoint.completedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
