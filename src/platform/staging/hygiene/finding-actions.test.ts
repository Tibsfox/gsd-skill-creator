/**
 * Tests for finding actions.
 *
 * Verifies the five finding actions (approve, suppress, cleanup, skip,
 * observe) and their interactions with the trust store.
 *
 * @module staging/hygiene/finding-actions.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  FINDING_ACTIONS,
  applyFindingAction,
  type FindingAction,
  type FindingActionResult,
} from './finding-actions.js';
import { createTrustStore, type TrustStore } from './trust-store.js';

describe('finding-actions', () => {
  describe('FINDING_ACTIONS', () => {
    it('has exactly 5 entries', () => {
      expect(FINDING_ACTIONS).toHaveLength(5);
    });

    it('contains approve, suppress, cleanup, skip, observe', () => {
      expect(FINDING_ACTIONS).toEqual([
        'approve',
        'suppress',
        'cleanup',
        'skip',
        'observe',
      ]);
    });
  });

  describe('applyFindingAction', () => {
    let store: TrustStore;

    beforeEach(() => {
      store = createTrustStore();
    });

    describe('approve', () => {
      it('returns resolved=true and trustUpdated=true', () => {
        const result = applyFindingAction('approve', 'test-pattern', store);
        expect(result.resolved).toBe(true);
        expect(result.trustUpdated).toBe(true);
      });

      it('calls trustStore.approve for the pattern', () => {
        applyFindingAction('approve', 'test-pattern', store);
        const entry = store.getEntry('test-pattern');
        expect(entry).toBeDefined();
        expect(entry!.approvalCount).toBe(1);
      });

      it('returns correct patternId', () => {
        const result = applyFindingAction('approve', 'my-pattern', store);
        expect(result.patternId).toBe('my-pattern');
      });

      it('returns action=approve', () => {
        const result = applyFindingAction('approve', 'test-pattern', store);
        expect(result.action).toBe('approve');
      });

      it('sets enhancedLogging to false', () => {
        const result = applyFindingAction('approve', 'test-pattern', store);
        expect(result.enhancedLogging).toBe(false);
      });

      it('includes message about pattern approval', () => {
        const result = applyFindingAction('approve', 'test-pattern', store);
        expect(result.message).toContain('approved');
      });

      it('appends critical note for critical patterns', () => {
        const result = applyFindingAction(
          'approve',
          'yaml-code-execution',
          store,
        );
        expect(result.message).toContain('critical pattern');
        expect(result.message).toContain('will always surface');
      });
    });

    describe('suppress', () => {
      it('returns resolved=true and trustUpdated=true', () => {
        const result = applyFindingAction('suppress', 'test-pattern', store);
        expect(result.resolved).toBe(true);
        expect(result.trustUpdated).toBe(true);
      });

      it('calls trustStore.approve for the pattern', () => {
        applyFindingAction('suppress', 'test-pattern', store);
        const entry = store.getEntry('test-pattern');
        expect(entry).toBeDefined();
        expect(entry!.approvalCount).toBe(1);
      });

      it('returns action=suppress', () => {
        const result = applyFindingAction('suppress', 'test-pattern', store);
        expect(result.action).toBe('suppress');
      });

      it('includes message about suppression', () => {
        const result = applyFindingAction('suppress', 'test-pattern', store);
        expect(result.message).toContain('suppressed');
      });

      it('appends critical note for critical patterns', () => {
        const result = applyFindingAction(
          'suppress',
          'path-traversal',
          store,
        );
        expect(result.message).toContain('critical pattern');
      });
    });

    describe('cleanup', () => {
      it('returns resolved=true and trustUpdated=false', () => {
        const result = applyFindingAction('cleanup', 'test-pattern', store);
        expect(result.resolved).toBe(true);
        expect(result.trustUpdated).toBe(false);
      });

      it('does not create trust entry', () => {
        applyFindingAction('cleanup', 'test-pattern', store);
        expect(store.getEntry('test-pattern')).toBeUndefined();
      });

      it('returns action=cleanup', () => {
        const result = applyFindingAction('cleanup', 'test-pattern', store);
        expect(result.action).toBe('cleanup');
      });

      it('sets enhancedLogging to false', () => {
        const result = applyFindingAction('cleanup', 'test-pattern', store);
        expect(result.enhancedLogging).toBe(false);
      });

      it('includes message about cleanup', () => {
        const result = applyFindingAction('cleanup', 'test-pattern', store);
        expect(result.message).toContain('cleanup');
      });
    });

    describe('skip', () => {
      it('returns resolved=true and trustUpdated=false', () => {
        const result = applyFindingAction('skip', 'test-pattern', store);
        expect(result.resolved).toBe(true);
        expect(result.trustUpdated).toBe(false);
      });

      it('does not create trust entry', () => {
        applyFindingAction('skip', 'test-pattern', store);
        expect(store.getEntry('test-pattern')).toBeUndefined();
      });

      it('returns action=skip', () => {
        const result = applyFindingAction('skip', 'test-pattern', store);
        expect(result.action).toBe('skip');
      });

      it('sets enhancedLogging to false', () => {
        const result = applyFindingAction('skip', 'test-pattern', store);
        expect(result.enhancedLogging).toBe(false);
      });

      it('includes message about skip', () => {
        const result = applyFindingAction('skip', 'test-pattern', store);
        expect(result.message).toContain('skipped');
      });
    });

    describe('observe', () => {
      it('returns resolved=false and enhancedLogging=true', () => {
        const result = applyFindingAction('observe', 'test-pattern', store);
        expect(result.resolved).toBe(false);
        expect(result.enhancedLogging).toBe(true);
      });

      it('returns trustUpdated=false', () => {
        const result = applyFindingAction('observe', 'test-pattern', store);
        expect(result.trustUpdated).toBe(false);
      });

      it('does not create trust entry', () => {
        applyFindingAction('observe', 'test-pattern', store);
        expect(store.getEntry('test-pattern')).toBeUndefined();
      });

      it('returns action=observe', () => {
        const result = applyFindingAction('observe', 'test-pattern', store);
        expect(result.action).toBe('observe');
      });

      it('includes message about enhanced logging', () => {
        const result = applyFindingAction('observe', 'test-pattern', store);
        expect(result.message).toContain('logging');
      });
    });

    describe('patternId preservation', () => {
      it('all actions return the correct patternId', () => {
        for (const action of FINDING_ACTIONS) {
          const result = applyFindingAction(action, 'unique-id-123', store);
          expect(result.patternId).toBe('unique-id-123');
        }
      });
    });
  });
});
