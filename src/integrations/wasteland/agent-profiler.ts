/**
 * Agent Profiler — Layer 1, Wave 0
 *
 * Builds capability vectors for agents from observation events.
 * Uses exponential decay weighting (lambda=0.95/week) to prioritize
 * recent behavior. Vectors are normalized to unit length for comparison.
 *
 * Safety: pseudonymous IDs only, opt-in transparent, queryable profiles.
 */

import type {
  ObservationEvent,
  CapabilityVector,
  AgentProfile,
  TaskHistoryEntry,
} from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Exponential decay rate per week (lambda=0.95 means 5% decay per week) */
const DECAY_LAMBDA = 0.95;

/** Milliseconds in one week */
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/** Maximum task history entries to retain per agent */
const MAX_HISTORY_ENTRIES = 1000;

/** Data retention limit in days — aggregate beyond this */
const RETENTION_DAYS = 90;

// ============================================================================
// Capability Vector Operations
// ============================================================================

/**
 * Calculate the exponential decay weight for a timestamp.
 * More recent events have weight closer to 1.0.
 */
export function decayWeight(eventTimestamp: string, now: string = new Date().toISOString()): number {
  const elapsed = new Date(now).getTime() - new Date(eventTimestamp).getTime();
  const weeks = elapsed / MS_PER_WEEK;
  return Math.pow(DECAY_LAMBDA, weeks);
}

/**
 * Compute the magnitude (L2 norm) of a dimension map.
 */
export function vectorMagnitude(dimensions: Record<string, number>): number {
  const sumSquares = Object.values(dimensions).reduce((sum, v) => sum + v * v, 0);
  return Math.sqrt(sumSquares);
}

/**
 * Normalize a dimension map to unit length.
 * Returns zero vector if magnitude is 0.
 */
export function normalizeVector(dimensions: Record<string, number>): Record<string, number> {
  const mag = vectorMagnitude(dimensions);
  if (mag === 0) return { ...dimensions };
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(dimensions)) {
    result[key] = val / mag;
  }
  return result;
}

/**
 * Compute cosine similarity between two capability vectors.
 * Returns value in [-1, 1], with 1 being identical directions.
 */
export function cosineSimilarity(a: Record<string, number>, b: Record<string, number>): number {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;
  for (const key of allKeys) {
    const va = a[key] ?? 0;
    const vb = b[key] ?? 0;
    dotProduct += va * vb;
    magA += va * va;
    magB += vb * vb;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;
  return dotProduct / denom;
}

// ============================================================================
// Profile Store
// ============================================================================

/** In-memory profile store for agent profiles */
export interface ProfileStore {
  getProfile(agentId: string): AgentProfile | undefined;
  updateFromEvent(event: ObservationEvent): AgentProfile;
  getAllProfiles(): AgentProfile[];
  getVector(agentId: string): CapabilityVector | undefined;
  pruneRetention(now?: string): number;
}

/**
 * Create a profile store that maintains agent profiles from observation events.
 */
export function createProfileStore(): ProfileStore {
  const profiles = new Map<string, AgentProfile>();

  function ensureProfile(agentId: string): AgentProfile {
    let profile = profiles.get(agentId);
    if (!profile) {
      profile = {
        agentId,
        vector: {
          agentId,
          dimensions: {},
          magnitude: 0,
          lastUpdated: new Date().toISOString(),
          totalTasks: 0,
          successRate: 0,
        },
        taskHistory: [],
        specializations: [],
        gaps: [],
      };
      profiles.set(agentId, profile);
    }
    return profile;
  }

  function rebuildVector(profile: AgentProfile, now: string = new Date().toISOString()): void {
    const weightedSuccesses: Record<string, number> = {};
    const weightedTotals: Record<string, number> = {};

    for (const entry of profile.taskHistory) {
      const weight = decayWeight(entry.timestamp, now);
      const taskType = entry.taskType;
      weightedTotals[taskType] = (weightedTotals[taskType] ?? 0) + weight;
      if (entry.outcome === 'completed') {
        weightedSuccesses[taskType] = (weightedSuccesses[taskType] ?? 0) + weight;
      }
    }

    const dimensions: Record<string, number> = {};
    let totalSuccess = 0;
    let totalWeight = 0;

    for (const [taskType, total] of Object.entries(weightedTotals)) {
      const success = weightedSuccesses[taskType] ?? 0;
      dimensions[taskType] = total > 0 ? success / total : 0;
      totalSuccess += success;
      totalWeight += total;
    }

    const normalized = normalizeVector(dimensions);

    profile.vector = {
      agentId: profile.agentId,
      dimensions: normalized,
      magnitude: vectorMagnitude(dimensions),
      lastUpdated: now,
      totalTasks: profile.taskHistory.length,
      successRate: totalWeight > 0 ? totalSuccess / totalWeight : 0,
    };

    // Update specializations (dimensions > 0.5 in raw) and gaps (< 0.2)
    profile.specializations = Object.entries(dimensions)
      .filter(([, v]) => v > 0.5)
      .map(([k]) => k);
    profile.gaps = Object.entries(dimensions)
      .filter(([, v]) => v < 0.2 && v > 0)
      .map(([k]) => k);
  }

  return {
    getProfile(agentId: string): AgentProfile | undefined {
      return profiles.get(agentId);
    },

    updateFromEvent(event: ObservationEvent): AgentProfile {
      const profile = ensureProfile(event.agentId);

      if (event.eventType === 'task-completed' || event.eventType === 'task-failed') {
        const entry: TaskHistoryEntry = {
          taskId: event.taskId,
          taskType: (event.metadata?.taskType as string) ?? event.taskId.split('-')[0] ?? 'unknown',
          townId: event.townId,
          outcome: event.eventType === 'task-completed' ? 'completed' : 'failed',
          quality: event.metadata?.quality as number | undefined,
          durationMs: event.metadata?.duration as number | undefined,
          timestamp: event.timestamp,
        };

        profile.taskHistory.push(entry);

        // Trim to max history
        if (profile.taskHistory.length > MAX_HISTORY_ENTRIES) {
          profile.taskHistory = profile.taskHistory.slice(-MAX_HISTORY_ENTRIES);
        }

        rebuildVector(profile);
      }

      return profile;
    },

    getAllProfiles(): AgentProfile[] {
      return Array.from(profiles.values());
    },

    getVector(agentId: string): CapabilityVector | undefined {
      return profiles.get(agentId)?.vector;
    },

    pruneRetention(now: string = new Date().toISOString()): number {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
      const cutoffStr = cutoff.toISOString();
      let pruned = 0;

      for (const profile of profiles.values()) {
        const before = profile.taskHistory.length;
        profile.taskHistory = profile.taskHistory.filter(e => e.timestamp >= cutoffStr);
        pruned += before - profile.taskHistory.length;
        if (profile.taskHistory.length !== before) {
          rebuildVector(profile, now);
        }
      }

      return pruned;
    },
  };
}
