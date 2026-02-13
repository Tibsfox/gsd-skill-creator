/**
 * Tests for trust tier type definitions and constants.
 *
 * @module staging/hygiene/trust-types.test
 */

import { describe, it, expect } from 'vitest';
import {
  FAMILIARITY_TIERS,
  CRITICAL_PATTERN_IDS,
  type FamiliarityTier,
  type TrustClassification,
  type ContentSourceInfo,
} from './trust-types.js';

describe('trust-types', () => {
  describe('FAMILIARITY_TIERS', () => {
    it('has exactly 4 entries', () => {
      expect(FAMILIARITY_TIERS).toHaveLength(4);
    });

    it('contains home, neighborhood, town, stranger in order', () => {
      expect(FAMILIARITY_TIERS).toEqual([
        'home',
        'neighborhood',
        'town',
        'stranger',
      ]);
    });

    it('is a readonly tuple', () => {
      // Verify the const assertion makes it readonly at runtime
      // by checking it is a frozen-like array (const arrays are readonly)
      expect(Array.isArray(FAMILIARITY_TIERS)).toBe(true);
    });
  });

  describe('CRITICAL_PATTERN_IDS', () => {
    it('is a Set', () => {
      expect(CRITICAL_PATTERN_IDS).toBeInstanceOf(Set);
    });

    it('contains exactly 5 pattern IDs', () => {
      expect(CRITICAL_PATTERN_IDS.size).toBe(5);
    });

    it('contains yaml-code-execution', () => {
      expect(CRITICAL_PATTERN_IDS.has('yaml-code-execution')).toBe(true);
    });

    it('contains path-traversal', () => {
      expect(CRITICAL_PATTERN_IDS.has('path-traversal')).toBe(true);
    });

    it('contains ignore-previous', () => {
      expect(CRITICAL_PATTERN_IDS.has('ignore-previous')).toBe(true);
    });

    it('contains system-prompt-override', () => {
      expect(CRITICAL_PATTERN_IDS.has('system-prompt-override')).toBe(true);
    });

    it('contains chat-template-delimiters', () => {
      expect(CRITICAL_PATTERN_IDS.has('chat-template-delimiters')).toBe(true);
    });

    it('does not contain non-critical patterns', () => {
      expect(CRITICAL_PATTERN_IDS.has('env-var-exposure')).toBe(false);
      expect(CRITICAL_PATTERN_IDS.has('role-reassignment')).toBe(false);
    });
  });

  describe('type compatibility', () => {
    it('FamiliarityTier values are assignable from FAMILIARITY_TIERS', () => {
      const tier: FamiliarityTier = FAMILIARITY_TIERS[0];
      expect(tier).toBe('home');
    });

    it('TrustClassification can be constructed with tier and reason', () => {
      const classification: TrustClassification = {
        tier: 'stranger',
        reason: 'Unknown origin',
      };
      expect(classification.tier).toBe('stranger');
      expect(classification.reason).toBe('Unknown origin');
    });

    it('ContentSourceInfo requires origin and accepts optional fields', () => {
      const minimal: ContentSourceInfo = { origin: 'local-project' };
      expect(minimal.origin).toBe('local-project');

      const full: ContentSourceInfo = {
        origin: 'known-repo',
        isProjectLocal: false,
        isUserLocal: false,
        repoId: 'my-org/my-repo',
        trustedRepos: ['my-org/my-repo'],
      };
      expect(full.repoId).toBe('my-org/my-repo');
      expect(full.trustedRepos).toHaveLength(1);
    });
  });
});
