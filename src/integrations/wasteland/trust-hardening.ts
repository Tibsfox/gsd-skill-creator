/**
 * Trust Hardening — w-wl-harden
 *
 * Safety and lifecycle mechanisms for the trust system:
 *   - Privacy guard: prevents pushing private tables to upstream
 *   - Visibility enforcement: checks who can see what
 *   - Heartbeat scheduler: auto-renews expiring contracts
 *
 * These functions are the immune system of the trust network.
 * They don't create trust — they protect it.
 *
 * @module trust-hardening
 */

import type {
  TrustRelationship,
} from './trust-relationship.js';
import {
  isContractActive,
  contractTimeRemaining,
  renewContract,
} from './trust-relationship.js';

// ============================================================================
// Privacy Guard
// ============================================================================

/**
 * Tables that contain private data and must NEVER be pushed upstream.
 *
 * The schema (DDL) can be shared. The data cannot.
 * This list is the canonical source of truth for Dolt pre-push validation.
 */
export const PRIVATE_TABLES: readonly string[] = [
  'trust_relationships',
  'trust_contracts',
  'character_sheets',
  'welcome_badges',
];

/**
 * Validate whether a Dolt push is safe.
 *
 * Checks the list of tables being pushed against PRIVATE_TABLES.
 * If any private table has modified rows, the push MUST be blocked.
 *
 * This is the application-layer check. The Dolt pre-push hook calls
 * this function and aborts if allowed === false.
 */
export function validateDoltPush(
  tables: string[],
): { allowed: boolean; blocked: string[] } {
  const blocked = tables.filter(t => PRIVATE_TABLES.includes(t));
  return {
    allowed: blocked.length === 0,
    blocked,
  };
}

// ============================================================================
// Visibility Enforcement
// ============================================================================

/**
 * Check whether a viewer can see a specific trust relationship.
 *
 * Rules:
 *   'private' — only the two participants (from/to) can see it
 *   'mutual'  — participants + rigs that appear in BOTH participants'
 *               active trust networks (the intersection)
 *
 * @param viewer — the handle of the rig requesting access
 * @param rel — the relationship to check
 * @param viewerConnections — handles the viewer is directly connected to
 *   (needed only for 'mutual' visibility; for 'private', ignored)
 */
export function canViewRelationship(
  viewer: string,
  rel: TrustRelationship,
  viewerConnections?: Set<string>,
): boolean {
  // Participants always see their own relationships
  if (viewer === rel.from || viewer === rel.to) return true;

  // Private: only participants
  if (rel.visibility === 'private') return false;

  // Mutual: viewer must be connected to BOTH participants
  if (rel.visibility === 'mutual') {
    if (!viewerConnections) return false;
    return viewerConnections.has(rel.from) && viewerConnections.has(rel.to);
  }

  return false;
}

// ============================================================================
// Heartbeat Scheduler
// ============================================================================

/** Result of a single contract renewal attempt. */
export interface RenewalAttempt {
  contractId: string;
  from: string;
  to: string;
  renewed: boolean;
  /** New expiry if renewed, or reason if not. */
  detail: string;
}

/** Summary of a heartbeat cycle run. */
export interface HeartbeatResult {
  /** Total relationships checked. */
  checked: number;
  /** Contracts successfully renewed. */
  renewed: number;
  /** Contracts that were eligible but renewal failed. */
  failed: number;
  /** Individual renewal attempts. */
  attempts: RenewalAttempt[];
  /** When the cycle ran. */
  cycleAt: string;
}

/**
 * Find contracts that are eligible for heartbeat renewal.
 *
 * A contract is eligible if:
 *   1. autoRenew is true
 *   2. It has a finite TTL (not permanent)
 *   3. It is still active (not yet expired)
 *   4. It is within the renewal window (remaining time < TTL / 10)
 *
 * The TTL/10 window (Owl's recommendation) ensures renewal happens
 * before expiry but not too eagerly. A 1-hour ephemeral contract
 * renews in the last 6 minutes. A 7-day event contract renews in
 * the last ~17 hours.
 */
export function findRenewableContracts(
  relationships: TrustRelationship[],
  now: Date = new Date(),
): TrustRelationship[] {
  return relationships.filter(rel => {
    const c = rel.contract;
    if (!c.autoRenew) return false;
    if (c.ttl === null) return false;
    if (!isContractActive(c, now)) return false;

    const remaining = contractTimeRemaining(c, now);
    const window = c.ttl / 10;
    return remaining <= window;
  });
}

/**
 * Execute a heartbeat renewal cycle.
 *
 * For each renewable contract found, creates the renewed contract
 * and returns it for the caller to persist. This function is pure —
 * it does not write to storage. The caller (the scheduler or CLI)
 * decides whether to save.
 */
export function executeHeartbeatCycle(
  relationships: TrustRelationship[],
  now: Date = new Date(),
): { renewed: TrustRelationship[]; result: HeartbeatResult } {
  const renewable = findRenewableContracts(relationships, now);
  const attempts: RenewalAttempt[] = [];
  const renewed: TrustRelationship[] = [];

  for (const rel of renewable) {
    const newContract = renewContract(rel.contract, now);
    if (newContract) {
      renewed.push({ ...rel, contract: newContract });
      attempts.push({
        contractId: rel.contract.id,
        from: rel.from,
        to: rel.to,
        renewed: true,
        detail: `renewed → expires ${newContract.expiresAt}`,
      });
    } else {
      attempts.push({
        contractId: rel.contract.id,
        from: rel.from,
        to: rel.to,
        renewed: false,
        detail: 'renewal returned null (contract not renewable)',
      });
    }
  }

  return {
    renewed,
    result: {
      checked: relationships.length,
      renewed: renewed.length,
      failed: renewable.length - renewed.length,
      attempts,
      cycleAt: now.toISOString(),
    },
  };
}
