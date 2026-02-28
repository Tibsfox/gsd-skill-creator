/**
 * Epsilon auto-tuner for DBSCAN using the k-NN knee method.
 *
 * Finds optimal epsilon by detecting the "knee" (point of maximum curvature)
 * in the sorted k-nearest-neighbor distance plot. This eliminates the need
 * for a hardcoded epsilon parameter.
 *
 * Algorithm:
 * 1. Compute each point's distance to its k-th nearest neighbor
 * 2. Sort k-distances in ascending order
 * 3. Find the knee using maximum perpendicular distance from the line
 *    connecting the first and last points of the sorted curve
 * 4. Return the k-distance at the knee, clamped to configurable bounds
 */

const DEFAULT_BOUNDS = { min: 0.05, max: 0.5 };
const FLAT_CURVE_THRESHOLD = 0.01;
const FLAT_CURVE_FALLBACK = 0.3;

/**
 * Compute the k-th nearest neighbor distance for a given point.
 * Returns the distance to the k-th closest point (0-indexed: k=1 means closest).
 * If k >= number of other points, returns the distance to the farthest point.
 */
function kthNearestDistance(
  points: number[][],
  idx: number,
  k: number,
  distanceFn: (a: number[], b: number[]) => number,
): number {
  const distances: number[] = [];
  for (let i = 0; i < points.length; i++) {
    if (i === idx) continue;
    distances.push(distanceFn(points[idx], points[i]));
  }
  distances.sort((a, b) => a - b);

  // Clamp k to available distances
  const effectiveK = Math.min(k, distances.length);
  return effectiveK > 0 ? distances[effectiveK - 1] : 0;
}

/**
 * Find the knee point using the maximum perpendicular distance method.
 *
 * Draws a line from (0, sortedValues[0]) to (n-1, sortedValues[n-1]),
 * then finds the index with maximum perpendicular distance from this line.
 *
 * @returns Object with kneeIdx and maxDistance, or null if data is degenerate
 */
function findKnee(sortedValues: number[]): { kneeIdx: number; maxDistance: number } | null {
  const n = sortedValues.length;
  if (n < 2) return null;

  // Line from first point to last point
  const x1 = 0;
  const y1 = sortedValues[0];
  const x2 = n - 1;
  const y2 = sortedValues[n - 1];

  const dx = x2 - x1;
  const dy = y2 - y1;
  const lineLen = Math.sqrt(dx * dx + dy * dy);

  if (lineLen === 0) return null;

  // Find point with maximum perpendicular distance
  let maxDist = -1;
  let kneeIdx = 0;

  for (let i = 0; i < n; i++) {
    // Perpendicular distance from point (i, sortedValues[i]) to the line
    const dist = Math.abs(dy * i - dx * sortedValues[i] + x2 * y1 - y2 * x1) / lineLen;
    if (dist > maxDist) {
      maxDist = dist;
      kneeIdx = i;
    }
  }

  return { kneeIdx, maxDistance: maxDist };
}

/**
 * Auto-tune DBSCAN epsilon using the k-NN knee method.
 *
 * @param points - Array of feature vectors
 * @param k - Number of nearest neighbors to consider (typically minPts - 1 or minPts)
 * @param distanceFn - Distance function between two points
 * @param bounds - Optional min/max bounds for epsilon (default: { min: 0.05, max: 0.5 })
 * @returns Optimal epsilon value, clamped to bounds
 */
export function tuneEpsilon(
  points: number[][],
  k: number,
  distanceFn: (a: number[], b: number[]) => number,
  bounds: { min: number; max: number } = DEFAULT_BOUNDS,
): number {
  const n = points.length;

  // Edge case: too few points
  if (n < 2) {
    return bounds.min;
  }

  // Step 1: Compute k-th nearest neighbor distance for each point
  const kDistances: number[] = [];
  for (let i = 0; i < n; i++) {
    kDistances.push(kthNearestDistance(points, i, k, distanceFn));
  }

  // Step 2: Sort in ascending order
  kDistances.sort((a, b) => a - b);

  // Edge case: all k-distances near zero (identical or near-identical points)
  // Max k-distance below bounds.min means no meaningful clustering distance
  if (kDistances[kDistances.length - 1] < bounds.min) {
    return bounds.min;
  }

  // Edge case: only 2 points -- knee method degenerates (line through 2 points)
  // Return the k-distance directly, clamped to bounds
  if (n === 2) {
    return Math.max(bounds.min, Math.min(bounds.max, kDistances[kDistances.length - 1]));
  }

  // Step 3: Find knee
  const knee = findKnee(kDistances);

  if (knee === null) {
    // Degenerate case (e.g., lineLen === 0 means all k-distances identical)
    return bounds.min;
  }

  // Step 4: Check for flat curve
  if (knee.maxDistance < FLAT_CURVE_THRESHOLD) {
    return Math.max(bounds.min, Math.min(bounds.max, FLAT_CURVE_FALLBACK));
  }

  // Step 5: Epsilon is the k-distance at the knee
  const epsilon = kDistances[knee.kneeIdx];

  // Step 6: Clamp to bounds
  return Math.max(bounds.min, Math.min(bounds.max, epsilon));
}
