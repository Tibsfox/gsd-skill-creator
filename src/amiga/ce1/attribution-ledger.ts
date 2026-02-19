/**
 * CE-1 attribution ledger.
 *
 * The core data structure for the Commons Engine (CE-1) that stores
 * ICD-02 conforming contribution records with machine-queryable access
 * and post-mission immutability.
 *
 * The ledger is the single source of truth for who contributed what to a
 * mission. Every downstream calculation (weighting, dividends) reads from
 * this ledger. Once a mission closes, the ledger is sealed and becomes
 * immutable -- reads continue, but no new entries can be appended.
 *
 * Query dimensions:
 * - mission_id: all entries for a given mission
 * - contributor_id: all entries for a given contributor across missions
 * - phase: all entries recorded during a given phase
 * - time range (from_timestamp, to_timestamp): entries between timestamps
 * - combined: any combination of the above (AND logic)
 */

import { LedgerEntryPayloadSchema } from '../icd/icd-02.js';
import type { LedgerEntryPayload } from '../icd/icd-02.js';

// ============================================================================
// Types
// ============================================================================

/** A ledger entry enriched with the unique entry_id assigned on append. */
export interface LedgerEntry extends LedgerEntryPayload {
  /** Unique entry identifier assigned by the ledger on append. */
  entry_id: string;
}

/** Query filters for the attribution ledger. All filters are AND-combined. */
export interface LedgerQuery {
  /** Filter by mission ID. */
  mission_id?: string;
  /** Filter by contributor ID. */
  contributor_id?: string;
  /** Filter by phase status. */
  phase?: string;
  /** Inclusive start of time range filter. */
  from_timestamp?: string;
  /** Inclusive end of time range filter. */
  to_timestamp?: string;
}

// ============================================================================
// AttributionLedger
// ============================================================================

/**
 * In-memory attribution ledger with ICD-02 validation and seal support.
 *
 * Entries are validated against LedgerEntryPayloadSchema on append. Each
 * entry receives a unique `entry_id` in the format `le-NNNNNN`. The ledger
 * can be sealed after mission close, making it immutable.
 */
export class AttributionLedger {
  private readonly entries: LedgerEntry[];
  private sealed_: boolean;
  private nextId: number;

  constructor() {
    this.entries = [];
    this.sealed_ = false;
    this.nextId = 1;
  }

  /** Number of entries in the ledger. */
  count(): number {
    return this.entries.length;
  }

  /** Whether the ledger has been sealed (immutable). */
  isSealed(): boolean {
    return this.sealed_;
  }

  /**
   * Append a contribution record to the ledger.
   *
   * Validates the payload against ICD-02 LedgerEntryPayloadSchema.
   * Assigns a unique entry_id.
   *
   * @param payload - The ICD-02 conforming contribution record
   * @returns The assigned entry_id
   * @throws If ledger is sealed
   * @throws If payload fails ICD-02 validation
   */
  append(payload: LedgerEntryPayload): string {
    if (this.sealed_) {
      throw new Error('Cannot append: ledger is sealed');
    }

    // Validate against ICD-02 schema (throws ZodError on invalid data)
    const validated = LedgerEntryPayloadSchema.parse(payload);

    // Assign unique entry_id
    const entryId = 'le-' + String(this.nextId++).padStart(6, '0');

    // Create enriched LedgerEntry
    const entry: LedgerEntry = {
      ...validated,
      entry_id: entryId,
    };

    this.entries.push(entry);
    return entryId;
  }

  /**
   * Query the ledger with optional filters.
   *
   * All filters are AND-combined. Empty query returns all entries.
   * Time range is inclusive on both ends.
   *
   * @param q - Query filters
   * @returns Matching entries (defensive copy)
   */
  query(q: LedgerQuery): readonly LedgerEntry[] {
    let results = [...this.entries];

    if (q.mission_id !== undefined) {
      results = results.filter((e) => e.mission_id === q.mission_id);
    }
    if (q.contributor_id !== undefined) {
      results = results.filter((e) => e.contributor_id === q.contributor_id);
    }
    if (q.phase !== undefined) {
      results = results.filter((e) => e.phase === q.phase);
    }
    if (q.from_timestamp !== undefined) {
      results = results.filter((e) => e.timestamp >= q.from_timestamp!);
    }
    if (q.to_timestamp !== undefined) {
      results = results.filter((e) => e.timestamp <= q.to_timestamp!);
    }

    return results;
  }

  /** Get all entries (defensive copy). */
  getAll(): readonly LedgerEntry[] {
    return [...this.entries];
  }

  /**
   * Seal the ledger. After sealing, no mutations are allowed.
   * Reads (query, getAll, count) continue to work.
   *
   * @throws If already sealed
   */
  seal(): void {
    if (this.sealed_) {
      throw new Error('Ledger already sealed');
    }
    this.sealed_ = true;
  }
}
