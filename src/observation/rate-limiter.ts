import type { SessionObservation } from '../types/observation.js';

// ============================================================================
// Rate Limiting & Anomaly Detection
// ============================================================================
// Per-session and per-time-window rate limiting to prevent runaway data
// accumulation (INT-03). Anomaly detection flags suspicious observation
// entries (INT-04). Both are pure utilities wired into SessionObserver later.

// ---- Config & Types ----

export interface RateLimitConfig {
  maxPerSession: number; // Max entries per session ID
  maxPerHour: number; // Max entries per hour (across all sessions)
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxPerSession: 50,
  maxPerHour: 200,
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: string };

export interface AnomalyReport {
  anomalies: Array<{ type: string; message: string; entryIndex: number }>;
}

// ---- Rate Limiter ----

const ONE_HOUR_MS = 3600000;

/**
 * Observation rate limiter enforcing per-session and per-time-window caps.
 * Prevents runaway data accumulation from misbehaving sessions or bursts.
 */
export class ObservationRateLimiter {
  private config: RateLimitConfig;
  private sessionCounts: Map<string, number> = new Map();
  private hourlyTimestamps: number[] = [];

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config };
  }

  /**
   * Check if a new observation is allowed for the given session.
   * Enforces both per-session and hourly rate limits.
   *
   * @param sessionId - The session requesting to record an observation
   * @returns Allowed or rejection with descriptive reason
   */
  checkLimit(sessionId: string): RateLimitResult {
    const now = Date.now();

    // Prune timestamps older than 1 hour
    this.hourlyTimestamps = this.hourlyTimestamps.filter(
      (ts) => now - ts < ONE_HOUR_MS,
    );

    // Check hourly limit first (global across all sessions)
    if (this.hourlyTimestamps.length >= this.config.maxPerHour) {
      return {
        allowed: false,
        reason: `Hourly rate limit exceeded (max ${this.config.maxPerHour} per hour)`,
      };
    }

    // Check per-session limit
    const sessionCount = this.sessionCounts.get(sessionId) ?? 0;
    if (sessionCount >= this.config.maxPerSession) {
      return {
        allowed: false,
        reason: `Session rate limit exceeded (max ${this.config.maxPerSession} per session)`,
      };
    }

    // Allow: increment both counters
    this.sessionCounts.set(sessionId, sessionCount + 1);
    this.hourlyTimestamps.push(now);

    return { allowed: true };
  }

  /**
   * Reset the counter for a specific session.
   *
   * @param sessionId - The session to reset
   */
  reset(sessionId: string): void {
    this.sessionCounts.delete(sessionId);
  }
}

// ---- Anomaly Detection ----

/** Duration mismatch tolerance in minutes */
const DURATION_TOLERANCE_MINUTES = 2;

/**
 * Detect anomalies in a list of session observations.
 * Checks for duplicate timestamps, impossible durations, and duration mismatches.
 *
 * @param entries - Session observations to analyze
 * @returns Report with detected anomalies, sorted by entry index
 */
export function detectAnomalies(entries: SessionObservation[]): AnomalyReport {
  const anomalies: AnomalyReport['anomalies'] = [];

  // Build startTime frequency map for duplicate detection
  const startTimeIndices = new Map<number, number[]>();
  for (let i = 0; i < entries.length; i++) {
    const st = entries[i].startTime;
    const indices = startTimeIndices.get(st);
    if (indices) {
      indices.push(i);
    } else {
      startTimeIndices.set(st, [i]);
    }
  }

  // Flag duplicate timestamps
  for (const [, indices] of startTimeIndices) {
    if (indices.length > 1) {
      for (const idx of indices) {
        anomalies.push({
          type: 'duplicate-timestamp',
          message: `Duplicate timestamps detected at index ${idx}`,
          entryIndex: idx,
        });
      }
    }
  }

  // Per-entry checks
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Impossible duration: endTime before startTime
    if (entry.endTime < entry.startTime) {
      anomalies.push({
        type: 'impossible-duration',
        message: `Impossible duration: endTime before startTime at index ${i}`,
        entryIndex: i,
      });
    }

    // Duration mismatch: reported durationMinutes doesn't match computed
    const computedMinutes = (entry.endTime - entry.startTime) / 60000;
    if (Math.abs(entry.durationMinutes - computedMinutes) > DURATION_TOLERANCE_MINUTES) {
      anomalies.push({
        type: 'duration-mismatch',
        message: `Duration mismatch at index ${i}: reported ${entry.durationMinutes}min, computed ${computedMinutes.toFixed(1)}min`,
        entryIndex: i,
      });
    }
  }

  // Sort by entry index for deterministic output
  anomalies.sort((a, b) => a.entryIndex - b.entryIndex);

  return { anomalies };
}
