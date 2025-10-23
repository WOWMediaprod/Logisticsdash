'use client';

import { useEffect, useState } from 'react';
import { Truck, MapPin, CheckCircle, Circle } from 'lucide-react';
import {
  calculateRouteProgress,
  calculateProgressByWaypoint,
  calculateCumulativeDistances,
  findNextWaypoint
} from '../lib/distance-utils';

interface Waypoint {
  id: string;
  name: string;
  type: 'PICKUP' | 'DELIVERY' | 'CHECKPOINT' | 'REST_STOP' | 'YARD' | 'PORT';
  sequence: number;
  lat: number | null;
  lng: number | null;
  address: string | null;
  isCompleted: boolean;
  completedAt: string | null;
}

interface RouteProgressTimelineProps {
  waypoints: Waypoint[];
  currentLocation?: { lat: number; lng: number } | null;
  jobStatus?: string;
}

const WAYPOINT_TYPE_COLORS = {
  PICKUP: 'bg-green-500 border-green-600',
  DELIVERY: 'bg-red-500 border-red-600',
  CHECKPOINT: 'bg-blue-500 border-blue-600',
  REST_STOP: 'bg-gray-500 border-gray-600',
  YARD: 'bg-yellow-500 border-yellow-600',
  PORT: 'bg-purple-500 border-purple-600',
};

const WAYPOINT_TYPE_LABELS = {
  PICKUP: 'Pickup',
  DELIVERY: 'Delivery',
  CHECKPOINT: 'Checkpoint',
  REST_STOP: 'Rest Stop',
  YARD: 'Container Yard',
  PORT: 'Port',
};

export default function RouteProgressTimeline({
  waypoints,
  currentLocation,
  jobStatus
}: RouteProgressTimelineProps) {
  const [progressPercent, setProgressPercent] = useState(0);
  const [activeWaypointIndex, setActiveWaypointIndex] = useState(-1);

  // Sort waypoints by sequence
  const sortedWaypoints = [...waypoints].sort((a, b) => a.sequence - b.sequence);

  // Filter waypoints with valid coordinates
  const validWaypoints = sortedWaypoints.filter(wp => wp.lat !== null && wp.lng !== null);

  useEffect(() => {
    if (validWaypoints.length === 0) return;

    // Find last completed waypoint
    const lastCompletedIndex = validWaypoints.reduce((lastIdx, wp, idx) => {
      return wp.isCompleted ? idx : lastIdx;
    }, -1);

    // Find next pending waypoint
    const nextWaypointIndex = findNextWaypoint(validWaypoints);
    setActiveWaypointIndex(nextWaypointIndex >= 0 ? nextWaypointIndex : validWaypoints.length - 1);

    // Calculate progress
    let progress = 0;

    if (currentLocation && currentLocation.lat && currentLocation.lng) {
      // Use GPS-based progress calculation
      const coords = validWaypoints.map(wp => ({ lat: wp.lat!, lng: wp.lng! }));
      progress = calculateRouteProgress(currentLocation, coords);
    } else if (lastCompletedIndex >= 0) {
      // Fallback: Use last completed waypoint
      const coords = validWaypoints.map(wp => ({ lat: wp.lat!, lng: wp.lng! }));
      progress = calculateProgressByWaypoint(coords, lastCompletedIndex);
    } else if (jobStatus === 'IN_TRANSIT' || jobStatus === 'LOADED') {
      // If in transit but no completed waypoints, show some progress
      progress = 15;
    }

    setProgressPercent(Math.min(100, Math.max(0, progress)));
  }, [validWaypoints, currentLocation, jobStatus]);

  if (validWaypoints.length === 0) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-6">
        <p className="text-center text-gray-600">No waypoints available for this route</p>
      </div>
    );
  }

  // Calculate cumulative distances for positioning
  const coords = validWaypoints.map(wp => ({ lat: wp.lat!, lng: wp.lng! }));
  const cumulativeDistances = calculateCumulativeDistances(coords);
  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];

  // Calculate waypoint positions on the timeline (0-100%)
  const waypointPositions = cumulativeDistances.map(distance =>
    totalDistance > 0 ? (distance / totalDistance) * 100 : 0
  );

  return (
    <div className="bg-gradient-to-r from-blue-50 via-white to-cyan-50 rounded-2xl p-6 mb-6 shadow-md border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Route Progress</h3>
          <p className="text-sm text-gray-600">
            {totalDistance > 0 ? `${totalDistance.toFixed(1)} km total distance` : 'Calculating distance...'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">{progressPercent.toFixed(0)}%</div>
          <p className="text-xs text-gray-500">Complete</p>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative px-4 py-8">
        {/* Background Line */}
        <div className="absolute top-1/2 left-4 right-4 h-2 bg-gray-200 rounded-full transform -translate-y-1/2">
          {/* Progress Fill */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out shadow-lg"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Waypoints */}
        <div className="relative flex justify-between items-center">
          {validWaypoints.map((waypoint, index) => {
            const position = waypointPositions[index];
            const isCompleted = waypoint.isCompleted;
            const isActive = index === activeWaypointIndex;

            return (
              <div
                key={waypoint.id}
                className="relative flex flex-col items-center"
                style={{
                  position: 'absolute',
                  left: `${position}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {/* Waypoint Marker */}
                <div className="relative z-10 mb-3">
                  <div
                    className={`
                      w-8 h-8 rounded-full border-4 flex items-center justify-center shadow-lg
                      transition-all duration-300 transform
                      ${isCompleted
                        ? WAYPOINT_TYPE_COLORS[waypoint.type]
                        : 'bg-white border-gray-300'}
                      ${isActive ? 'scale-125 animate-pulse' : 'scale-100'}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Waypoint Label */}
                <div className="text-center min-w-[100px] max-w-[120px]">
                  <p className="text-xs font-semibold text-gray-900 mb-1 truncate">
                    {waypoint.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {WAYPOINT_TYPE_LABELS[waypoint.type]}
                  </p>
                  {waypoint.completedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {new Date(waypoint.completedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Animated Truck Icon */}
        <div
          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 transition-all duration-1000 ease-out z-20"
          style={{ left: `calc(1rem + ${progressPercent}% * (100% - 2rem) / 100%)` }}
        >
          <div className="relative">
            {/* Truck Icon with Glow */}
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white animate-bounce-slow">
              <Truck className="w-6 h-6 text-white" />
            </div>
            {/* Pulse Ring */}
            {progressPercent > 0 && progressPercent < 100 && (
              <div className="absolute inset-0 w-12 h-12 bg-blue-400 rounded-full animate-ping opacity-20"></div>
            )}
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          {progressPercent === 0 && <span>Ready to start journey</span>}
          {progressPercent > 0 && progressPercent < 100 && (
            <span>
              In transit - {activeWaypointIndex >= 0 ? `Next: ${validWaypoints[activeWaypointIndex]?.name}` : 'En route'}
            </span>
          )}
          {progressPercent >= 100 && <span className="text-green-600 font-semibold">Journey completed!</span>}
        </div>
      </div>

      {/* Mobile Responsive: Vertical Timeline for small screens */}
      <style jsx>{`
        @media (max-width: 768px) {
          .relative.flex.justify-between {
            flex-direction: column;
            align-items: flex-start;
            gap: 2rem;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(-5px);
          }
          50% {
            transform: translateY(5px);
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
