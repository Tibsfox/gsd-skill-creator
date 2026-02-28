/**
 * Dashboard Metrics Computation & Snapshot Persistence.
 *
 * Bridges PositionStore and ChordStore data into the aggregate PlaneMetrics
 * type. Provides save/load for timestamped metric snapshots to enable
 * historical tracking.
 *
 * Three exported functions:
 * - computeDashboardMetrics: computes versine distribution, avg exsecant,
 *   angular velocity warnings from store data
 * - saveMetricsSnapshot: writes timestamped JSON to disk
 * - loadMetricsSnapshot: reads snapshot JSON (or null if missing)
 *
 * Imports: types.ts (type definitions, constants), arithmetic.ts (pure math).
 * Uses duck-typed interfaces for stores to enable testing without I/O.
 */

import type { SkillPosition, PlaneMetrics, ChordCandidate } from './types.js';
import { MAX_ANGULAR_VELOCITY } from './types.js';
import { exsecant, classifyByVersine } from './arithmetic.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

// ============================================================================
// Duck-typed store interfaces (for testability)
// ============================================================================

/** Minimal interface for PositionStore (duck-typed for testability). */
interface PositionStoreReader {
  all(): Map<string, SkillPosition>;
}

/** Minimal interface for ChordStore (duck-typed for testability). */
interface ChordStoreReader {
  getAll(): ChordCandidate[];
}

// ============================================================================
// computeDashboardMetrics
// ============================================================================

/**
 * Compute aggregate dashboard metrics from position and chord stores.
 *
 * Iterates all positioned skills to compute:
 * - Versine distribution (grounded / working / frontier bucket counts)
 * - Average exsecant (mean external reach across all skills)
 * - Angular velocity warnings (skills exceeding half of MAX_ANGULAR_VELOCITY)
 * - Total skill count
 * - Active chord candidates
 *
 * Returns safe zero-initialized defaults when the position store is empty.
 */
export function computeDashboardMetrics(
  positionStore: PositionStoreReader,
  chordStore: ChordStoreReader,
): PlaneMetrics {
  const positions = positionStore.all();
  const chordCandidates = chordStore.getAll();

  if (positions.size === 0) {
    return {
      totalSkills: 0,
      versineDistribution: { grounded: 0, working: 0, frontier: 0 },
      avgExsecant: 0,
      angularVelocityWarnings: [],
      chordCandidates,
    };
  }

  const distribution = { grounded: 0, working: 0, frontier: 0 };
  const warnings: string[] = [];
  let totalExsecant = 0;
  const velocityThreshold = MAX_ANGULAR_VELOCITY / 2;

  for (const [id, pos] of positions) {
    // Classify by versine bucket
    const zone = classifyByVersine(pos);
    distribution[zone]++;

    // Accumulate exsecant
    totalExsecant += exsecant(pos);

    // Check angular velocity against half-maximum threshold
    if (Math.abs(pos.angularVelocity) > velocityThreshold) {
      warnings.push(
        `${id}: angular velocity ${pos.angularVelocity.toFixed(3)} (threshold: ${velocityThreshold.toFixed(3)})`,
      );
    }
  }

  return {
    totalSkills: positions.size,
    versineDistribution: distribution,
    avgExsecant: totalExsecant / positions.size,
    angularVelocityWarnings: warnings,
    chordCandidates,
  };
}

// ============================================================================
// Snapshot Persistence
// ============================================================================

/**
 * Save a timestamped metrics snapshot to disk as JSON.
 *
 * Creates parent directories if they do not exist. The snapshot includes
 * all PlaneMetrics fields plus a `timestamp` ISO 8601 string.
 *
 * @param metrics - The metrics to persist
 * @param filePath - Destination path (default: .claude/plane/metrics-snapshot.json)
 */
export async function saveMetricsSnapshot(
  metrics: PlaneMetrics,
  filePath: string,
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const snapshot = { ...metrics, timestamp: new Date().toISOString() };
  await writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
}

/**
 * Load a metrics snapshot from disk.
 *
 * @param filePath - Path to the snapshot JSON file
 * @returns The snapshot (PlaneMetrics + timestamp), or null if the file
 *          does not exist or is invalid.
 */
export async function loadMetricsSnapshot(
  filePath: string,
): Promise<(PlaneMetrics & { timestamp: string }) | null> {
  try {
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}
