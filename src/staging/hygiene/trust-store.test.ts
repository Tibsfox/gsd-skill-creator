/**
 * Tests for trust decay store.
 *
 * Verifies trust progression (session -> 7-day -> 30-day -> 90-day),
 * rejection resets, critical pattern restrictions, auto-approval checks,
 * and expiry pruning.
 *
 * @module staging/hygiene/trust-store.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTrustStore,
  TRUST_LEVELS,
  TRUST_DURATIONS,
  type TrustStore,
  type TrustEntry,
  type TrustLevel,
} from './trust-store.js';

describe('trust-store', () => {
  describe('TRUST_LEVELS', () => {
    it('has exactly 4 entries', () => {
      expect(TRUST_LEVELS).toHaveLength(4);
    });

    it('contains session, 7-day, 30-day, 90-day in order', () => {
      expect(TRUST_LEVELS).toEqual(['session', '7-day', '30-day', '90-day']);
    });
  });

  describe('TRUST_DURATIONS', () => {
    it('session duration is 0', () => {
      expect(TRUST_DURATIONS['session']).toBe(0);
    });

    it('7-day duration is 7 days in ms', () => {
      expect(TRUST_DURATIONS['7-day']).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('30-day duration is 30 days in ms', () => {
      expect(TRUST_DURATIONS['30-day']).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it('90-day duration is 90 days in ms', () => {
      expect(TRUST_DURATIONS['90-day']).toBe(90 * 24 * 60 * 60 * 1000);
    });
  });

  describe('createTrustStore', () => {
    let store: TrustStore;
    const now = new Date('2026-02-13T12:00:00Z');

    beforeEach(() => {
      store = createTrustStore();
    });

    describe('approve', () => {
      it('first approval creates session-level entry with approvalCount 1', () => {
        const entry = store.approve('test-pattern', now);
        expect(entry.patternId).toBe('test-pattern');
        expect(entry.level).toBe('session');
        expect(entry.approvalCount).toBe(1);
        expect(entry.isCritical).toBe(false);
        expect(entry.expiresAt).toBeNull();
      });

      it('second approval progresses to 7-day level', () => {
        store.approve('test-pattern', now);
        const entry = store.approve('test-pattern', now);
        expect(entry.level).toBe('7-day');
        expect(entry.approvalCount).toBe(2);
        expect(entry.expiresAt).not.toBeNull();
      });

      it('third approval progresses to 30-day level', () => {
        store.approve('test-pattern', now);
        store.approve('test-pattern', now);
        const entry = store.approve('test-pattern', now);
        expect(entry.level).toBe('30-day');
        expect(entry.approvalCount).toBe(3);
      });

      it('fourth approval progresses to 90-day level', () => {
        store.approve('test-pattern', now);
        store.approve('test-pattern', now);
        store.approve('test-pattern', now);
        const entry = store.approve('test-pattern', now);
        expect(entry.level).toBe('90-day');
        expect(entry.approvalCount).toBe(4);
      });

      it('fifth+ approval stays at 90-day level', () => {
        for (let i = 0; i < 4; i++) store.approve('test-pattern', now);
        const entry = store.approve('test-pattern', now);
        expect(entry.level).toBe('90-day');
        expect(entry.approvalCount).toBe(5);
      });

      it('sets grantedAt to now ISO string', () => {
        const entry = store.approve('test-pattern', now);
        expect(entry.grantedAt).toBe(now.toISOString());
      });

      it('computes expiresAt from duration for non-session levels', () => {
        store.approve('test-pattern', now);
        const entry = store.approve('test-pattern', now);
        const expected = new Date(now.getTime() + TRUST_DURATIONS['7-day']);
        expect(entry.expiresAt).toBe(expected.toISOString());
      });

      it('critical pattern always stays at session level regardless of approvalCount', () => {
        // 'yaml-code-execution' is in CRITICAL_PATTERN_IDS
        store.approve('yaml-code-execution', now);
        store.approve('yaml-code-execution', now);
        store.approve('yaml-code-execution', now);
        const entry = store.approve('yaml-code-execution', now);
        expect(entry.level).toBe('session');
        expect(entry.isCritical).toBe(true);
        expect(entry.approvalCount).toBe(4);
        expect(entry.expiresAt).toBeNull();
      });

      it('marks critical patterns with isCritical true', () => {
        const entry = store.approve('path-traversal', now);
        expect(entry.isCritical).toBe(true);
      });
    });

    describe('reject', () => {
      it('resets to session level and approvalCount 0', () => {
        store.approve('test-pattern', now);
        store.approve('test-pattern', now);
        store.approve('test-pattern', now);
        store.reject('test-pattern');
        const entry = store.getEntry('test-pattern');
        expect(entry).toBeDefined();
        expect(entry!.level).toBe('session');
        expect(entry!.approvalCount).toBe(0);
        expect(entry!.expiresAt).toBeNull();
      });

      it('is a no-op for unknown patterns', () => {
        // Should not throw
        expect(() => store.reject('unknown-pattern')).not.toThrow();
      });
    });

    describe('isAutoApproved', () => {
      it('returns false for unknown pattern', () => {
        expect(store.isAutoApproved('unknown', now)).toBe(false);
      });

      it('returns false for session level', () => {
        store.approve('test-pattern', now);
        expect(store.isAutoApproved('test-pattern', now)).toBe(false);
      });

      it('returns true for 7-day level within window', () => {
        store.approve('test-pattern', now);
        store.approve('test-pattern', now);
        const withinWindow = new Date(now.getTime() + 1000);
        expect(store.isAutoApproved('test-pattern', withinWindow)).toBe(true);
      });

      it('returns false for expired 7-day entry', () => {
        store.approve('test-pattern', now);
        store.approve('test-pattern', now);
        const afterExpiry = new Date(
          now.getTime() + TRUST_DURATIONS['7-day'] + 1,
        );
        expect(store.isAutoApproved('test-pattern', afterExpiry)).toBe(false);
      });

      it('returns true for 30-day level within window', () => {
        store.approve('test-pattern', now);
        store.approve('test-pattern', now);
        store.approve('test-pattern', now);
        const withinWindow = new Date(now.getTime() + 1000);
        expect(store.isAutoApproved('test-pattern', withinWindow)).toBe(true);
      });

      it('returns false for critical pattern even with high approvalCount', () => {
        for (let i = 0; i < 5; i++) store.approve('yaml-code-execution', now);
        expect(store.isAutoApproved('yaml-code-execution', now)).toBe(false);
      });
    });

    describe('getEntry', () => {
      it('returns undefined for unknown pattern', () => {
        expect(store.getEntry('unknown')).toBeUndefined();
      });

      it('returns the trust entry for a known pattern', () => {
        store.approve('test-pattern', now);
        const entry = store.getEntry('test-pattern');
        expect(entry).toBeDefined();
        expect(entry!.patternId).toBe('test-pattern');
      });
    });

    describe('getAllEntries', () => {
      it('returns empty array when no entries', () => {
        expect(store.getAllEntries()).toEqual([]);
      });

      it('returns all stored entries', () => {
        store.approve('pattern-a', now);
        store.approve('pattern-b', now);
        const entries = store.getAllEntries();
        expect(entries).toHaveLength(2);
        const ids = entries.map((e) => e.patternId);
        expect(ids).toContain('pattern-a');
        expect(ids).toContain('pattern-b');
      });
    });

    describe('pruneExpired', () => {
      it('removes expired entries and returns count', () => {
        store.approve('pattern-a', now);
        store.approve('pattern-a', now); // 7-day level
        store.approve('pattern-b', now);
        store.approve('pattern-b', now); // 7-day level

        const afterExpiry = new Date(
          now.getTime() + TRUST_DURATIONS['7-day'] + 1,
        );
        const pruned = store.pruneExpired(afterExpiry);
        expect(pruned).toBe(2);
        expect(store.getAllEntries()).toHaveLength(0);
      });

      it('does not remove non-expired entries', () => {
        store.approve('pattern-a', now);
        store.approve('pattern-a', now); // 7-day level
        const beforeExpiry = new Date(now.getTime() + 1000);
        const pruned = store.pruneExpired(beforeExpiry);
        expect(pruned).toBe(0);
        expect(store.getAllEntries()).toHaveLength(1);
      });

      it('does not remove session-level entries (no expiresAt)', () => {
        store.approve('pattern-a', now);
        const pruned = store.pruneExpired(now);
        expect(pruned).toBe(0);
        expect(store.getAllEntries()).toHaveLength(1);
      });

      it('returns 0 when no entries exist', () => {
        expect(store.pruneExpired(now)).toBe(0);
      });
    });
  });
});
