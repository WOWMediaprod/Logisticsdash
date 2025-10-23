/**
 * Distance calculation utilities for route tracking
 * Uses Haversine formula for GPS coordinate distance calculation
 */

export interface GPSCoordinate {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param coord1 First coordinate {lat, lng}
 * @param coord2 Second coordinate {lat, lng}
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: GPSCoordinate, coord2: GPSCoordinate): number {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) *
    Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate cumulative distances along a route
 * @param waypoints Array of waypoints with lat/lng
 * @returns Array of cumulative distances from start (in km)
 */
export function calculateCumulativeDistances(waypoints: GPSCoordinate[]): number[] {
  const distances: number[] = [0]; // Start at 0

  for (let i = 1; i < waypoints.length; i++) {
    const segmentDistance = calculateDistance(waypoints[i - 1], waypoints[i]);
    const cumulativeDistance = distances[i - 1] + segmentDistance;
    distances.push(cumulativeDistance);
  }

  return distances;
}

/**
 * Calculate progress percentage along a route
 * @param currentPosition Current GPS position
 * @param waypoints Array of waypoints
 * @returns Progress percentage (0-100)
 */
export function calculateRouteProgress(
  currentPosition: GPSCoordinate,
  waypoints: GPSCoordinate[]
): number {
  if (waypoints.length < 2) return 0;

  // Calculate total route distance
  const cumulativeDistances = calculateCumulativeDistances(waypoints);
  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];

  if (totalDistance === 0) return 0;

  // Find the closest segment to current position
  let closestSegmentIndex = 0;
  let minDistance = Infinity;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const distanceToSegmentStart = calculateDistance(currentPosition, waypoints[i]);
    const distanceToSegmentEnd = calculateDistance(currentPosition, waypoints[i + 1]);
    const segmentDistance = calculateDistance(waypoints[i], waypoints[i + 1]);

    // Check if point is close to this segment
    const avgDistanceToSegment = (distanceToSegmentStart + distanceToSegmentEnd) / 2;

    if (avgDistanceToSegment < minDistance && avgDistanceToSegment <= segmentDistance * 1.2) {
      minDistance = avgDistanceToSegment;
      closestSegmentIndex = i;
    }
  }

  // Calculate distance traveled up to the closest segment
  const distanceToSegmentStart = cumulativeDistances[closestSegmentIndex];
  const distanceWithinSegment = calculateDistance(waypoints[closestSegmentIndex], currentPosition);
  const totalTraveled = distanceToSegmentStart + distanceWithinSegment;

  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (totalTraveled / totalDistance) * 100));

  return percentage;
}

/**
 * Find the index of the next pending waypoint
 * @param waypoints Array of waypoints with completion status
 * @returns Index of next pending waypoint, or -1 if all complete
 */
export function findNextWaypoint(waypoints: Array<{ isCompleted: boolean }>): number {
  return waypoints.findIndex(wp => !wp.isCompleted);
}

/**
 * Calculate position percentage along route based on last completed waypoint
 * Fallback when GPS is not available
 * @param waypoints Array of waypoints
 * @param lastCompletedIndex Index of last completed waypoint
 * @returns Progress percentage (0-100)
 */
export function calculateProgressByWaypoint(
  waypoints: GPSCoordinate[],
  lastCompletedIndex: number
): number {
  if (waypoints.length === 0) return 0;
  if (lastCompletedIndex < 0) return 0;

  const cumulativeDistances = calculateCumulativeDistances(waypoints);
  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];

  if (totalDistance === 0) return 0;

  const completedDistance = cumulativeDistances[Math.min(lastCompletedIndex, waypoints.length - 1)];
  const percentage = (completedDistance / totalDistance) * 100;

  return Math.min(100, Math.max(0, percentage));
}
