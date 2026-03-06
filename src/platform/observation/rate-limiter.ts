// ============================================================================
// rate-limiter.ts — Session Tracking: Intake Protection
// ============================================================================
//
// WHAT THIS FILE DOES
// -------------------
// Two utilities for protecting the observation system from data accumulation
// problems:
//
//   ObservationRateLimiter — enforces per-session and per-hour write limits.
//   detectAnomalies()      — flags suspicious entries in a batch of observations.
//
// WHY THESE EXIST
// ---------------
// The observation system writes to disk at every session end. Without protection,
// misbehaving test loops, broken hooks, or replay attacks could generate thousands
// of writes per hour, bloating the sessions.jsonl file and slowing pattern queries.
//
// Rate limiting is the first line of defense. Anomaly detection is the second.
// Together they implement INT-03 and INT-04 from the observation system requirements.
//
// Rate limiting reflects a design principle from Hemlock's thinking in
// CENTERCAMP-PERSONAL-JOURNAL: "Check the Foundation."
// "It is better to spend an hour validating the foundation than weeks fixing the collapse."
// Rate limiting validates that the observation pipeline is within safe operating bounds
// before allowing writes. Better to reject a session observation than corrupt the store.
//
// RATE LIMITER DESIGN
// -------------------
// Two limits enforced independently:
//
//   maxPerSession (default 50):
//     How many observations a single session ID can generate.
//     Prevents a single long-running session from flooding storage.
//     Counters are in-memory — reset when the process restarts.
//
//   maxPerHour (default 200):
//     How many observations total (across all sessions) per hour.
//     Uses a sliding window: timestamps older than 1 hour are pruned before check.
//     Prevents a burst of short sessions from flooding storage.
//
// Both limits are checked on every checkLimit() call. The hourly global limit
// is checked first — if it triggers, per-session doesn't matter.
//
// Idiomatic usage:
//   const result = limiter.checkLimit(sessionId);
//   if (!result.allowed) return null; // Silently drop the observation
//
// ANOMALY DETECTION DESIGN
// ------------------------
// detectAnomalies() checks each SessionObservation for structural problems:
//
//   duplicate-timestamp: Two observations share the same startTime.
//     Possible causes: clock skew, replay of an old observation, test data.
//     Action: warn. May be legitimate (e.g., two concurrent processes).
//
//   impossible-duration: endTime < startTime.
//     Possible causes: clock change, time zone error, data corruption.
//     Action: warn. Data should not be trusted for duration analysis.
//
//   duration-mismatch: Reported durationMinutes differs from computed by > 2 minutes.
//     Possible causes: rounding error (acceptable), data manipulation (not).
//     Tolerance: 2 minutes (DURATION_TOLERANCE_MINUTES) allows for rounding.
//     Action: warn. Minor mismatches are likely rounding; large mismatches are suspicious.
//
// Anomalies are reported via AnomalyReport, not thrown. The observation system
// logs them as warnings and continues — anomalous data can still be stored
// (the caller decides what to do with the report). This design prevents
// an edge-case observation from blocking the entire observation pipeline.
//
// DESIGN PHILOSOPHY
// -----------------
// "The most rigorous thing is reality. If it works, it works. Honor that."
// (CENTERCAMP-PERSONAL-JOURNAL, Foxy's teaching)
//
// Rate limiting and anomaly detection are not about preventing all bad data —
// they're about making normal operation clean while flagging genuine problems.
// The thresholds are generous enough to not interfere with real sessions
// (50 per session, 200 per hour) while catching runaway scenarios.
//
// See also:
// @see SessionObserver (session-observer.ts) — wires both utilities into session lifecycle
// @see DEFAULT_RATE_LIMIT_CONFIG — default threshold values
// @see BATCH-3-RETROSPECTIVE.md — Hemlock's "Safety Gates Calibrated" on threshold design

import type { SessionObservation } from '../../core/types/observation.js';

// ============================================================================
// Rate Limiting & Anomaly Detection
// ============================================================================
// Per-session and per-time-window rate limiting to prevent runaway data
// accumulation (INT-03). Anomaly detection flags suspicious observation
// entries (INT-04). Both are pure utilities wired into SessionObserver later.

// ---- Config & Types ----

/**
 * Rate limit configuration for observation writes.
 * maxPerSession: prevents any single session ID from writing more than N observations.
 * maxPerHour: sliding-window cap across all sessions combined.
 */
export interface RateLimitConfig {
  maxPerSession: number; // Max entries per session ID
  maxPerHour: number; // Max entries per hour (across all sessions)
}

/**
 * Default rate limits — generous enough for real sessions, catches runaway loops.
 * 50 per session: most sessions end in 1 observation. 50 covers pathological cases.
 * 200 per hour: covers a burst of 200 short sessions, which is unusual but real.
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxPerSession: 50,
  maxPerHour: 200,
};

/** Result of a rate limit check — either allowed or rejected with a reason string. */
export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Anomaly report from detectAnomalies().
 * anomalies array is sorted by entryIndex for deterministic output.
 */
export interface AnomalyReport {
  anomalies: Array<{ type: string; message: string; entryIndex: number }>;
}

// ---- Rate Limiter ----

const ONE_HOUR_MS = 3600000;

/**
 * Observation rate limiter enforcing per-session and per-time-window caps.
 * Prevents runaway data accumulation from misbehaving sessions or bursts.
 *
 * In-memory state — counters reset on process restart. This is intentional:
 * persistent rate limiting would require storage and complex state recovery.
 * The 1-hour window and per-session caps are sufficient for the use case.
 */
export class ObservationRateLimiter {
  private config: RateLimitConfig;
  /** Per-session write counts. Key: sessionId. Value: count of writes this session. */
  private sessionCounts: Map<string, number> = new Map();
  /** Timestamps of all hourly writes. Pruned to last 1 hour on each checkLimit call. */
  private hourlyTimestamps: number[] = [];

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config };
  }

  /**
   * Check if a new observation is allowed for the given session.
   * Enforces both per-session and hourly rate limits.
   *
   * On success (allowed: true), increments both counters immediately.
   * On failure (allowed: false), counters are not modified.
   *
   * The hourly sliding window is pruned on every call — timestamps older
   * than 1 hour are removed before the hourly check. This ensures the window
   * truly slides rather than being a fixed 1-hour window from process start.
   *
   * @param sessionId - The session requesting to record an observation
   * @returns Allowed or rejection with descriptive reason
   */
  checkLimit(sessionId: string): RateLimitResult {
    const now = Date.now();

    // Prune timestamps older than 1 hour — sliding window maintenance
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

    // Allow: increment both counters before returning
    this.sessionCounts.set(sessionId, sessionCount + 1);
    this.hourlyTimestamps.push(now);

    return { allowed: true };
  }

  /**
   * Reset the counter for a specific session.
   * Used in testing to reset state between test cases.
   * Also useful if a session is restarted and should get a fresh limit.
   *
   * @param sessionId - The session to reset
   */
  reset(sessionId: string): void {
    this.sessionCounts.delete(sessionId);
  }
}

// ---- Anomaly Detection ----

/**
 * Duration mismatch tolerance in minutes.
 * Mismatches within this range are normal rounding artifacts.
 * Mismatches beyond this range suggest data manipulation or corruption.
 */
const DURATION_TOLERANCE_MINUTES = 2;

/**
 * Detect anomalies in a list of session observations.
 * Checks for duplicate timestamps, impossible durations, and duration mismatches.
 *
 * All three checks are applied to all entries — a single entry can trigger
 * multiple anomaly types. Results are sorted by entry index for deterministic output.
 *
 * Designed to be called on a small batch (1-10 entries), not the full sessions file.
 * SessionObserver calls this on the current session's summary before storing.
 *
 * @param entries - Session observations to analyze
 * @returns Report with detected anomalies, sorted by entry index
 */
export function detectAnomalies(entries: SessionObservation[]): AnomalyReport {
  const anomalies: AnomalyReport['anomalies'] = [];

  // Build startTime frequency map for duplicate detection
  // Multiple entries with the same startTime suggest replay or clock issues
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

  // Flag duplicate timestamps — each duplicate entry gets its own anomaly
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

  // Per-entry checks: impossible duration and duration mismatch
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Impossible duration: endTime before startTime
    // Causes: clock change, timezone error, data corruption
    if (entry.endTime < entry.startTime) {
      anomalies.push({
        type: 'impossible-duration',
        message: `Impossible duration: endTime before startTime at index ${i}`,
        entryIndex: i,
      });
    }

    // Duration mismatch: reported vs computed differ beyond tolerance
    // Minor mismatches (< 2 min) are normal rounding; larger mismatches are suspicious
    const computedMinutes = (entry.endTime - entry.startTime) / 60000;
    if (Math.abs(entry.durationMinutes - computedMinutes) > DURATION_TOLERANCE_MINUTES) {
      anomalies.push({
        type: 'duration-mismatch',
        message: `Duration mismatch at index ${i}: reported ${entry.durationMinutes}min, computed ${computedMinutes.toFixed(1)}min`,
        entryIndex: i,
      });
    }
  }

  // Sort by entry index for deterministic output — makes test assertions reliable
  anomalies.sort((a, b) => a.entryIndex - b.entryIndex);

  return { anomalies };
}
