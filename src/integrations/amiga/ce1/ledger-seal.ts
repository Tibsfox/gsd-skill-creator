/**
 * CE-1 ledger seal guard.
 *
 * The immutability enforcer that seals the attribution ledger and its
 * distribution plan after mission close, preventing any retroactive
 * modifications.
 *
 * Sealing produces:
 * - A SHA-256 content hash of all ledger entries for tamper evidence
 * - A SHA-256 hash of the distribution plan for integrity verification
 * - A deeply frozen distribution plan (immutable object graph)
 * - A seal record documenting the event for audit purposes
 *
 * After sealing:
 * - The underlying AttributionLedger is sealed (no appends)
 * - The distribution plan is deeply frozen (no modifications)
 * - Reads (query, getAll, count) continue to work
 * - Re-sealing is rejected
 */

import { createHash } from 'node:crypto';
import { AttributionLedger } from './attribution-ledger.js';
import type { LedgerEntry } from './attribution-ledger.js';
import type { DistributionPlan } from './dividend-calculator.js';

// ============================================================================
// Types
// ============================================================================

/** Record documenting the seal event for audit purposes. */
export interface SealRecord {
  /** Mission this seal applies to. */
  missionId: string;
  /** ISO 8601 timestamp when the seal was applied. */
  sealedAt: string;
  /** Number of entries in the ledger at seal time. */
  entryCount: number;
  /** SHA-256 hex digest of all ledger entry contents. */
  contentHash: string;
  /** SHA-256 hex digest of the distribution plan. */
  distributionPlanHash: string;
  /** The frozen, immutable distribution plan. */
  sealedDistributionPlan: DistributionPlan;
}

/** Result of a seal operation. */
export interface SealResult {
  /** Whether the seal was successful. */
  success: boolean;
  /** The seal record (present on success). */
  sealRecord: SealRecord;
}

// ============================================================================
// LedgerSealGuard
// ============================================================================

/**
 * Enforces post-mission-close immutability with hash-based tamper evidence.
 *
 * Wraps an AttributionLedger and, upon sealing, locks both the ledger
 * and the associated distribution plan.
 */
export class LedgerSealGuard {
  private readonly ledger: AttributionLedger;
  private sealed: boolean;
  private record: SealRecord | null;

  constructor(ledger: AttributionLedger) {
    if (ledger.isSealed()) {
      throw new Error('Ledger is already sealed');
    }
    this.ledger = ledger;
    this.sealed = false;
    this.record = null;
  }

  /** Whether this guard has sealed the ledger. */
  isSealed(): boolean {
    return this.sealed;
  }

  /** Get the seal record (null if not sealed). */
  getSealRecord(): SealRecord | null {
    return this.record;
  }

  /**
   * Seal the ledger and freeze the distribution plan.
   *
   * After sealing:
   * - The underlying AttributionLedger is sealed (no appends)
   * - The distribution plan is deeply frozen
   * - A content hash provides tamper evidence
   * - A seal record documents the event
   *
   * @param distributionPlan - The distribution plan to freeze alongside the ledger
   * @returns SealResult with success status and seal record
   * @throws If already sealed or if mission IDs don't match
   */
  seal(distributionPlan: DistributionPlan): SealResult {
    if (this.sealed) {
      throw new Error('Mission already sealed');
    }

    // Get all entries for validation and hashing
    const entries = this.ledger.getAll();

    // Validate mission ID consistency
    if (entries.length > 0) {
      const missionIds = new Set(entries.map((e) => e.mission_id));
      const ledgerMissionId = [...missionIds][0];
      if (distributionPlan.missionId !== ledgerMissionId) {
        throw new Error(
          'Distribution plan mission ID does not match ledger entries',
        );
      }
    }

    // Compute content hash (SHA-256 of all ledger entries)
    const contentHash = this.computeContentHash(entries);

    // Compute distribution plan hash before mutation
    const distributionPlanHash = this.computePlanHash(distributionPlan);

    // Seal the underlying ledger (no more appends)
    this.ledger.seal();

    // Mark the distribution plan as sealed
    distributionPlan.sealed = true;

    // Deep freeze the distribution plan
    this.deepFreeze(distributionPlan);

    // Create seal record
    const sealRecord: SealRecord = {
      missionId: distributionPlan.missionId,
      sealedAt: new Date().toISOString(),
      entryCount: entries.length,
      contentHash,
      distributionPlanHash,
      sealedDistributionPlan: distributionPlan,
    };

    // Store record and mark sealed
    this.record = sealRecord;
    this.sealed = true;

    return { success: true, sealRecord };
  }

  /**
   * Compute SHA-256 hex digest of all ledger entries.
   *
   * Each entry is serialized with sorted keys for deterministic output.
   */
  private computeContentHash(entries: readonly LedgerEntry[]): string {
    const hash = createHash('sha256');
    for (const entry of entries) {
      const sorted = JSON.stringify(entry, Object.keys(entry).sort());
      hash.update(sorted);
    }
    return hash.digest('hex');
  }

  /**
   * Compute SHA-256 hex digest of a distribution plan.
   */
  private computePlanHash(plan: DistributionPlan): string {
    const hash = createHash('sha256');
    hash.update(JSON.stringify(plan));
    return hash.digest('hex');
  }

  /**
   * Recursively freeze an object and all nested objects.
   */
  private deepFreeze<T extends object>(obj: T): T {
    Object.freeze(obj);
    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object' && !Object.isFrozen(value)) {
        this.deepFreeze(value as object);
      }
    }
    return obj;
  }
}
