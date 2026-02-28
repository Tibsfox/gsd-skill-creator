/**
 * Trust decay store for approved hygiene patterns.
 *
 * Manages a trust progression lifecycle where approved patterns advance
 * from session-scoped approval through time-based auto-approval tiers:
 * session -> 7-day -> 30-day -> 90-day.
 *
 * Critical patterns (from CRITICAL_PATTERN_IDS) never progress beyond
 * session level regardless of approval count. Rejection instantly
 * resets a pattern back to session with zero approvals.
 *
 * @module staging/hygiene/trust-store
 */

import { CRITICAL_PATTERN_IDS } from './trust-types.js';

/** Trust levels in the decay chain (session is most restrictive, 90-day is most permissive). */
export type TrustLevel = 'session' | '7-day' | '30-day' | '90-day';

/** All trust levels as a const array for runtime use. */
export const TRUST_LEVELS: readonly TrustLevel[] = [
  'session',
  '7-day',
  '30-day',
  '90-day',
] as const;

/** Duration in milliseconds for each trust level. */
export const TRUST_DURATIONS: Record<TrustLevel, number> = {
  session: 0, // Expires at end of session (caller manages session lifecycle)
  '7-day': 7 * 24 * 60 * 60 * 1000,
  '30-day': 30 * 24 * 60 * 60 * 1000,
  '90-day': 90 * 24 * 60 * 60 * 1000,
};

/** A trust entry for an approved pattern. */
export interface TrustEntry {
  /** Pattern ID that was approved. */
  patternId: string;
  /** Current trust level. */
  level: TrustLevel;
  /** When this trust level was granted (ISO 8601). */
  grantedAt: string;
  /** When this trust level expires (ISO 8601), null for session-scoped. */
  expiresAt: string | null;
  /** Number of times this pattern has been approved (drives level progression). */
  approvalCount: number;
  /** Whether this pattern is critical (never auto-approves). */
  isCritical: boolean;
}

/** In-memory trust store interface. */
export interface TrustStore {
  /** Record an approval for a pattern. Progresses trust level if appropriate. */
  approve(patternId: string, now?: Date): TrustEntry;
  /** Record a rejection. Instantly resets to session level. */
  reject(patternId: string): void;
  /** Check if a pattern is currently auto-approved (not expired). */
  isAutoApproved(patternId: string, now?: Date): boolean;
  /** Get the trust entry for a pattern. */
  getEntry(patternId: string): TrustEntry | undefined;
  /** Get all trust entries. */
  getAllEntries(): TrustEntry[];
  /** Remove expired entries. */
  pruneExpired(now?: Date): number;
}

/**
 * Compute the trust level based on approval count.
 * 1 -> session, 2 -> 7-day, 3 -> 30-day, 4+ -> 90-day.
 */
function levelForCount(count: number): TrustLevel {
  if (count <= 1) return 'session';
  if (count === 2) return '7-day';
  if (count === 3) return '30-day';
  return '90-day';
}

/**
 * Compute expiresAt from level and grantedAt time.
 * Session level returns null (no expiry -- managed externally).
 */
function computeExpiresAt(level: TrustLevel, grantedAt: Date): string | null {
  const duration = TRUST_DURATIONS[level];
  if (duration === 0) return null;
  return new Date(grantedAt.getTime() + duration).toISOString();
}

/**
 * Create a new in-memory trust decay store.
 *
 * The store tracks approved patterns and their trust levels.
 * Non-critical patterns progress through the trust ladder as
 * they accumulate approvals. Critical patterns are always
 * locked at session level.
 */
export function createTrustStore(): TrustStore {
  const entries = new Map<string, TrustEntry>();

  return {
    approve(patternId: string, now: Date = new Date()): TrustEntry {
      const isCritical = CRITICAL_PATTERN_IDS.has(patternId);
      const existing = entries.get(patternId);
      const approvalCount = (existing?.approvalCount ?? 0) + 1;

      // Critical patterns never progress beyond session
      const level = isCritical ? 'session' : levelForCount(approvalCount);
      const grantedAt = now.toISOString();
      const expiresAt = isCritical ? null : computeExpiresAt(level, now);

      const entry: TrustEntry = {
        patternId,
        level,
        grantedAt,
        expiresAt,
        approvalCount,
        isCritical,
      };

      entries.set(patternId, entry);
      return entry;
    },

    reject(patternId: string): void {
      const existing = entries.get(patternId);
      if (!existing) return;

      existing.level = 'session';
      existing.approvalCount = 0;
      existing.expiresAt = null;
    },

    isAutoApproved(patternId: string, now: Date = new Date()): boolean {
      const entry = entries.get(patternId);
      if (!entry) return false;
      if (entry.level === 'session') return false;
      if (entry.expiresAt === null) return false;
      if (now.getTime() > new Date(entry.expiresAt).getTime()) return false;
      return true;
    },

    getEntry(patternId: string): TrustEntry | undefined {
      return entries.get(patternId);
    },

    getAllEntries(): TrustEntry[] {
      return Array.from(entries.values());
    },

    pruneExpired(now: Date = new Date()): number {
      let pruned = 0;
      for (const [id, entry] of entries) {
        if (
          entry.expiresAt !== null &&
          now.getTime() > new Date(entry.expiresAt).getTime()
        ) {
          entries.delete(id);
          pruned++;
        }
      }
      return pruned;
    },
  };
}
