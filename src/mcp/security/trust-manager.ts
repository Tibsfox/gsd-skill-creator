/**
 * Trust state lifecycle manager for MCP servers.
 *
 * Tracks and transitions server trust states through the quarantine -> provisional -> trusted
 * lifecycle. Enforces inactivity decay (SECR-05) and immediate reset on tool definition
 * changes (SECR-06). New servers always enter quarantine (SECR-04).
 */

import type { TrustState, HashRecord } from '../../types/mcp.js';
import type { HashDriftResult } from './hash-gate.js';

// ============================================================================
// Types
// ============================================================================

/** Configuration for the trust manager. */
export interface TrustManagerConfig {
  /** Inactivity period before trust decays to quarantine (default: 30 days). */
  inactivityDecayMs: number;
}

/** Record of a trust state transition. */
export interface TrustTransition {
  serverId: string;
  from: TrustState;
  to: TrustState;
  reason: string;
  timestamp: number;
}

/** Internal trust record for a server. */
interface ServerTrustRecord {
  state: TrustState;
  lastActivity: number;
  lastHashRecord: HashRecord | undefined;
  lastTools: import('../../types/mcp.js').Tool[] | undefined;
  transitions: TrustTransition[];
}

// ============================================================================
// Constants
// ============================================================================

/** Default inactivity decay period: 30 days in milliseconds. */
const DEFAULT_INACTIVITY_DECAY_MS = 30 * 24 * 60 * 60 * 1000;

// ============================================================================
// TrustManager
// ============================================================================

/**
 * Manages trust state lifecycle for MCP servers.
 *
 * All new servers start in quarantine. Trust can be promoted through manual approval,
 * but decays after inactivity and resets immediately on tool definition changes.
 */
export class TrustManager {
  private readonly config: TrustManagerConfig;
  private readonly servers: Map<string, ServerTrustRecord> = new Map();

  constructor(config?: Partial<TrustManagerConfig>) {
    this.config = {
      inactivityDecayMs: config?.inactivityDecayMs ?? DEFAULT_INACTIVITY_DECAY_MS,
    };
  }

  /**
   * Register a new server. Always enters quarantine (SECR-04).
   */
  registerServer(serverId: string): TrustTransition {
    const now = Date.now();
    const transition: TrustTransition = {
      serverId,
      from: 'quarantine',
      to: 'quarantine',
      reason: 'New server registered -- entering quarantine',
      timestamp: now,
    };

    this.servers.set(serverId, {
      state: 'quarantine',
      lastActivity: now,
      lastHashRecord: undefined,
      lastTools: undefined,
      transitions: [transition],
    });

    return transition;
  }

  /**
   * Get the current trust state of a server.
   * Returns 'quarantine' for unknown servers.
   */
  getTrustState(serverId: string): TrustState {
    const record = this.servers.get(serverId);
    return record?.state ?? 'quarantine';
  }

  /**
   * Manually set the trust state of a server.
   */
  setTrustState(serverId: string, state: TrustState, reason: string): TrustTransition {
    const record = this.getOrCreateRecord(serverId);
    const transition: TrustTransition = {
      serverId,
      from: record.state,
      to: state,
      reason,
      timestamp: Date.now(),
    };

    record.state = state;
    record.transitions.push(transition);

    return transition;
  }

  /**
   * Record activity for a server, updating its last activity timestamp.
   */
  recordActivity(serverId: string): void {
    const record = this.getOrCreateRecord(serverId);
    record.lastActivity = Date.now();
  }

  /**
   * Handle a hash drift event. If drifted, immediately reset to quarantine (SECR-06).
   */
  onHashChange(serverId: string, drift: HashDriftResult): TrustTransition | null {
    const record = this.getOrCreateRecord(serverId);

    // Update stored hash record
    record.lastHashRecord = drift.current;

    if (!drift.drifted) {
      return null;
    }

    // Tool definitions changed -- reset to quarantine regardless of current state (SECR-06)
    const transition: TrustTransition = {
      serverId,
      from: record.state,
      to: 'quarantine',
      reason: `Tool definition change detected: ${formatDriftReason(drift)}`,
      timestamp: Date.now(),
    };

    record.state = 'quarantine';
    record.transitions.push(transition);

    return transition;
  }

  /**
   * Check if a server's trust has decayed due to inactivity (SECR-05).
   *
   * Only affects servers in 'trusted' or 'provisional' state. Already-quarantined
   * or suspended servers are not affected.
   */
  checkDecay(serverId: string): TrustTransition | null {
    const record = this.servers.get(serverId);
    if (!record) return null;

    // Only decay active trust states
    if (record.state !== 'trusted' && record.state !== 'provisional') {
      return null;
    }

    const elapsed = Date.now() - record.lastActivity;
    if (elapsed < this.config.inactivityDecayMs) {
      return null;
    }

    const transition: TrustTransition = {
      serverId,
      from: record.state,
      to: 'quarantine',
      reason: `Trust decayed after ${Math.round(elapsed / (24 * 60 * 60 * 1000))} days of inactivity`,
      timestamp: Date.now(),
    };

    record.state = 'quarantine';
    record.transitions.push(transition);

    return transition;
  }

  /**
   * Check if a server requires human approval for invocations.
   * Returns true for quarantine state (SECR-04).
   */
  requiresApproval(serverId: string): boolean {
    return this.getTrustState(serverId) === 'quarantine';
  }

  /**
   * Get the full transition history for a server.
   */
  getTransitionHistory(serverId: string): TrustTransition[] {
    const record = this.servers.get(serverId);
    return record?.transitions ?? [];
  }

  /**
   * Store the last known tools for a server (used for hash drift diffing).
   */
  storeTools(serverId: string, tools: import('../../types/mcp.js').Tool[]): void {
    const record = this.getOrCreateRecord(serverId);
    record.lastTools = tools;
  }

  /**
   * Get the last known tools for a server.
   */
  getLastTools(serverId: string): import('../../types/mcp.js').Tool[] | undefined {
    return this.servers.get(serverId)?.lastTools;
  }

  /**
   * Get the last hash record for a server.
   */
  getLastHashRecord(serverId: string): HashRecord | undefined {
    return this.servers.get(serverId)?.lastHashRecord;
  }

  /**
   * Directly set the lastActivity for a server (for testing purposes).
   */
  setLastActivity(serverId: string, timestamp: number): void {
    const record = this.getOrCreateRecord(serverId);
    record.lastActivity = timestamp;
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  private getOrCreateRecord(serverId: string): ServerTrustRecord {
    let record = this.servers.get(serverId);
    if (!record) {
      record = {
        state: 'quarantine',
        lastActivity: Date.now(),
        lastHashRecord: undefined,
        lastTools: undefined,
        transitions: [],
      };
      this.servers.set(serverId, record);
    }
    return record;
  }
}

// ============================================================================
// Helpers
// ============================================================================

/** Format drift information into a human-readable reason string. */
function formatDriftReason(drift: HashDriftResult): string {
  const parts: string[] = [];
  if (drift.addedTools.length > 0) {
    parts.push(`added: ${drift.addedTools.join(', ')}`);
  }
  if (drift.removedTools.length > 0) {
    parts.push(`removed: ${drift.removedTools.join(', ')}`);
  }
  if (drift.modifiedTools.length > 0) {
    parts.push(`modified: ${drift.modifiedTools.join(', ')}`);
  }
  if (parts.length === 0) {
    parts.push('hash changed');
  }
  return parts.join('; ');
}
