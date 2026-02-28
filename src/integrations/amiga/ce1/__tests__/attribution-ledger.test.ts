/**
 * Tests for CE-1 attribution ledger.
 *
 * Covers: append with ICD-02 validation, multi-dimensional queries,
 * seal/immutability enforcement, entry_id assignment, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AttributionLedger } from '../attribution-ledger.js';
import type { LedgerEntry, LedgerQuery } from '../attribution-ledger.js';
import type { LedgerEntryPayload } from '../../icd/icd-02.js';

// ============================================================================
// Test Fixture
// ============================================================================

function makeLedgerEntry(overrides?: Partial<LedgerEntryPayload>): LedgerEntryPayload {
  return {
    mission_id: 'mission-2026-02-18-001',
    contributor_id: 'contrib-skill-author-abc',
    agent_id: 'CE-1',
    skill_name: 'test-skill',
    phase: 'EXECUTION',
    timestamp: '2026-02-18T10:00:00Z',
    context_weight: 0.8,
    dependency_tree: [
      { contributor_id: 'contrib-dep-one', depth: 0, decay_factor: 1.0 },
      { contributor_id: 'contrib-dep-two', depth: 1, decay_factor: 0.5 },
    ],
    ...overrides,
  };
}

// ============================================================================
// Constructor Tests
// ============================================================================

describe('AttributionLedger', () => {
  let ledger: AttributionLedger;

  beforeEach(() => {
    ledger = new AttributionLedger();
  });

  describe('constructor', () => {
    it('creates an empty ledger', () => {
      expect(ledger).toBeInstanceOf(AttributionLedger);
    });

    it('count() returns 0 on a fresh ledger', () => {
      expect(ledger.count()).toBe(0);
    });

    it('isSealed() returns false on a fresh ledger', () => {
      expect(ledger.isSealed()).toBe(false);
    });
  });

  // ==========================================================================
  // Append Tests
  // ==========================================================================

  describe('append', () => {
    it('accepts a valid ICD-02 LedgerEntryPayload and returns an entry_id string', () => {
      const entryId = ledger.append(makeLedgerEntry());
      expect(typeof entryId).toBe('string');
      expect(entryId.length).toBeGreaterThan(0);
    });

    it('increments count after append', () => {
      ledger.append(makeLedgerEntry());
      expect(ledger.count()).toBe(1);
    });

    it('getAll() returns array with appended entry enriched with entry_id', () => {
      ledger.append(makeLedgerEntry());
      const all = ledger.getAll();
      expect(all).toHaveLength(1);
      expect(all[0]).toHaveProperty('entry_id');
      expect(all[0].mission_id).toBe('mission-2026-02-18-001');
    });

    it('increments count correctly for multiple entries', () => {
      ledger.append(makeLedgerEntry());
      ledger.append(makeLedgerEntry({ contributor_id: 'contrib-second-person' }));
      ledger.append(makeLedgerEntry({ contributor_id: 'contrib-third-person' }));
      expect(ledger.count()).toBe(3);
    });

    it('assigns unique entry_id to each appended entry', () => {
      const id1 = ledger.append(makeLedgerEntry());
      const id2 = ledger.append(makeLedgerEntry());
      const id3 = ledger.append(makeLedgerEntry());
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('throws on invalid mission_id format', () => {
      expect(() => ledger.append(makeLedgerEntry({ mission_id: 'bad-mission' }))).toThrow();
    });

    it('throws on invalid contributor_id format', () => {
      expect(() => ledger.append(makeLedgerEntry({ contributor_id: 'bad-id' }))).toThrow();
    });

    it('throws on context_weight outside 0-1 range', () => {
      expect(() => ledger.append(makeLedgerEntry({ context_weight: 1.5 }))).toThrow();
      expect(() => ledger.append(makeLedgerEntry({ context_weight: -0.1 }))).toThrow();
    });
  });

  // ==========================================================================
  // Query by Mission Tests
  // ==========================================================================

  describe('query by mission', () => {
    it('returns entries matching the given mission_id', () => {
      ledger.append(makeLedgerEntry({ mission_id: 'mission-2026-02-18-001' }));
      ledger.append(makeLedgerEntry({ mission_id: 'mission-2026-02-18-002' }));
      const results = ledger.query({ mission_id: 'mission-2026-02-18-001' });
      expect(results).toHaveLength(1);
      expect(results[0].mission_id).toBe('mission-2026-02-18-001');
    });

    it('returns empty array for non-existent mission', () => {
      ledger.append(makeLedgerEntry());
      const results = ledger.query({ mission_id: 'mission-2099-01-01-999' });
      expect(results).toHaveLength(0);
    });

    it('returns all entries for the same mission', () => {
      ledger.append(makeLedgerEntry({ contributor_id: 'contrib-alice-one' }));
      ledger.append(makeLedgerEntry({ contributor_id: 'contrib-bob-two' }));
      const results = ledger.query({ mission_id: 'mission-2026-02-18-001' });
      expect(results).toHaveLength(2);
    });
  });

  // ==========================================================================
  // Query by Contributor Tests
  // ==========================================================================

  describe('query by contributor', () => {
    it('returns entries for the given contributor_id', () => {
      ledger.append(makeLedgerEntry({ contributor_id: 'contrib-skill-author-abc' }));
      ledger.append(makeLedgerEntry({ contributor_id: 'contrib-other-person' }));
      const results = ledger.query({ contributor_id: 'contrib-skill-author-abc' });
      expect(results).toHaveLength(1);
      expect(results[0].contributor_id).toBe('contrib-skill-author-abc');
    });

    it('returns entries across different missions for the same contributor', () => {
      ledger.append(makeLedgerEntry({ mission_id: 'mission-2026-02-18-001' }));
      ledger.append(makeLedgerEntry({ mission_id: 'mission-2026-02-18-002' }));
      const results = ledger.query({ contributor_id: 'contrib-skill-author-abc' });
      expect(results).toHaveLength(2);
    });
  });

  // ==========================================================================
  // Query by Phase Tests
  // ==========================================================================

  describe('query by phase', () => {
    it('returns entries from the given phase', () => {
      ledger.append(makeLedgerEntry({ phase: 'EXECUTION' }));
      ledger.append(makeLedgerEntry({ phase: 'PLANNING', contributor_id: 'contrib-planner-one' }));
      const results = ledger.query({ phase: 'EXECUTION' });
      expect(results).toHaveLength(1);
      expect(results[0].phase).toBe('EXECUTION');
    });

    it('returns empty array when no entries match the phase', () => {
      ledger.append(makeLedgerEntry({ phase: 'EXECUTION' }));
      const results = ledger.query({ phase: 'PLANNING' });
      expect(results).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Query by Time Range Tests
  // ==========================================================================

  describe('query by time range', () => {
    it('returns entries within the time range', () => {
      ledger.append(makeLedgerEntry({ timestamp: '2026-02-18T10:00:00Z' }));
      ledger.append(makeLedgerEntry({
        timestamp: '2026-02-18T12:00:00Z',
        contributor_id: 'contrib-afternoon-one',
      }));
      const results = ledger.query({
        from_timestamp: '2026-02-18T09:00:00Z',
        to_timestamp: '2026-02-18T11:00:00Z',
      });
      expect(results).toHaveLength(1);
      expect(results[0].timestamp).toBe('2026-02-18T10:00:00Z');
    });

    it('excludes entries outside the time range', () => {
      ledger.append(makeLedgerEntry({ timestamp: '2026-02-18T08:00:00Z' }));
      const results = ledger.query({
        from_timestamp: '2026-02-18T09:00:00Z',
        to_timestamp: '2026-02-18T11:00:00Z',
      });
      expect(results).toHaveLength(0);
    });

    it('includes entry exactly at from_timestamp (inclusive start)', () => {
      ledger.append(makeLedgerEntry({ timestamp: '2026-02-18T09:00:00Z' }));
      const results = ledger.query({
        from_timestamp: '2026-02-18T09:00:00Z',
        to_timestamp: '2026-02-18T11:00:00Z',
      });
      expect(results).toHaveLength(1);
    });

    it('includes entry exactly at to_timestamp (inclusive end)', () => {
      ledger.append(makeLedgerEntry({ timestamp: '2026-02-18T11:00:00Z' }));
      const results = ledger.query({
        from_timestamp: '2026-02-18T09:00:00Z',
        to_timestamp: '2026-02-18T11:00:00Z',
      });
      expect(results).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Combined Query Tests
  // ==========================================================================

  describe('combined queries', () => {
    it('filters by both mission and phase', () => {
      ledger.append(makeLedgerEntry({ mission_id: 'mission-2026-02-18-001', phase: 'EXECUTION' }));
      ledger.append(makeLedgerEntry({
        mission_id: 'mission-2026-02-18-001',
        phase: 'PLANNING',
        contributor_id: 'contrib-planner-one',
      }));
      ledger.append(makeLedgerEntry({
        mission_id: 'mission-2026-02-18-002',
        phase: 'EXECUTION',
        contributor_id: 'contrib-other-person',
      }));
      const results = ledger.query({ mission_id: 'mission-2026-02-18-001', phase: 'EXECUTION' });
      expect(results).toHaveLength(1);
      expect(results[0].mission_id).toBe('mission-2026-02-18-001');
      expect(results[0].phase).toBe('EXECUTION');
    });

    it('filters by contributor and time range', () => {
      ledger.append(makeLedgerEntry({
        contributor_id: 'contrib-skill-author-abc',
        timestamp: '2026-02-18T10:00:00Z',
      }));
      ledger.append(makeLedgerEntry({
        contributor_id: 'contrib-skill-author-abc',
        timestamp: '2026-02-18T14:00:00Z',
      }));
      ledger.append(makeLedgerEntry({
        contributor_id: 'contrib-other-person',
        timestamp: '2026-02-18T10:00:00Z',
      }));
      const results = ledger.query({
        contributor_id: 'contrib-skill-author-abc',
        from_timestamp: '2026-02-18T09:00:00Z',
        to_timestamp: '2026-02-18T11:00:00Z',
      });
      expect(results).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Seal and Immutability Tests
  // ==========================================================================

  describe('seal and immutability', () => {
    it('seal() marks the ledger as sealed', () => {
      ledger.seal();
      expect(ledger.isSealed()).toBe(true);
    });

    it('append() throws after seal', () => {
      ledger.seal();
      expect(() => ledger.append(makeLedgerEntry())).toThrow('Cannot append: ledger is sealed');
    });

    it('query() still works after seal', () => {
      ledger.append(makeLedgerEntry());
      ledger.seal();
      const results = ledger.query({ mission_id: 'mission-2026-02-18-001' });
      expect(results).toHaveLength(1);
    });

    it('getAll() still works after seal', () => {
      ledger.append(makeLedgerEntry());
      ledger.seal();
      expect(ledger.getAll()).toHaveLength(1);
    });

    it('count() still works after seal', () => {
      ledger.append(makeLedgerEntry());
      ledger.seal();
      expect(ledger.count()).toBe(1);
    });

    it('double seal throws', () => {
      ledger.seal();
      expect(() => ledger.seal()).toThrow('Ledger already sealed');
    });
  });

  // ==========================================================================
  // Edge Case Tests
  // ==========================================================================

  describe('edge cases', () => {
    it('accepts entry with empty dependency tree', () => {
      const id = ledger.append(makeLedgerEntry({ dependency_tree: [] }));
      expect(typeof id).toBe('string');
      expect(ledger.count()).toBe(1);
    });

    it('preserves optional invocation_id field', () => {
      ledger.append(makeLedgerEntry({ invocation_id: 'inv-abc-123' }));
      const all = ledger.getAll();
      expect(all[0].invocation_id).toBe('inv-abc-123');
    });

    it('preserves optional notes field', () => {
      ledger.append(makeLedgerEntry({ notes: 'Test note for attribution' }));
      const all = ledger.getAll();
      expect(all[0].notes).toBe('Test note for attribution');
    });

    it('query({}) with no filters returns all entries', () => {
      ledger.append(makeLedgerEntry());
      ledger.append(makeLedgerEntry({ contributor_id: 'contrib-second-person' }));
      const results = ledger.query({});
      expect(results).toHaveLength(2);
    });
  });
});
