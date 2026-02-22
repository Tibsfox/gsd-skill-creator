/**
 * RulesEngine test suite.
 *
 * TDD RED phase: tests written before implementation.
 * Covers RULES-01 (phase rules), RULES-02 (Critic gate), RULES-06 (rule reminders).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RulesEngine, DEFAULT_RULES_ENGINE_CONFIG } from './rules-engine.js';

import type { SessionPhase } from '../shared/types.js';

describe('RulesEngine -- Critic Gate (RULES-02)', () => {
  let engine: RulesEngine;

  beforeEach(() => {
    engine = new RulesEngine(DEFAULT_RULES_ENGINE_CONFIG);
  });

  describe('canActivateAgent', () => {
    it('blocks critic during diverge phase', () => {
      const result = engine.canActivateAgent('critic', 'diverge');
      expect(result.allowed).toBe(false);
    });

    it('blocks critic during explore phase', () => {
      const result = engine.canActivateAgent('critic', 'explore');
      expect(result.allowed).toBe(false);
    });

    it('blocks critic during organize phase', () => {
      const result = engine.canActivateAgent('critic', 'organize');
      expect(result.allowed).toBe(false);
    });

    it('blocks critic during act phase', () => {
      const result = engine.canActivateAgent('critic', 'act');
      expect(result.allowed).toBe(false);
    });

    it('allows critic during converge phase', () => {
      const result = engine.canActivateAgent('critic', 'converge');
      expect(result.allowed).toBe(true);
    });

    it('includes correct reason string when blocking critic', () => {
      const result = engine.canActivateAgent('critic', 'diverge');
      expect(result.reason).toContain('Critic agent cannot activate during diverge phase');
      expect(result.reason).toContain('Osborn Rule 2');
      expect(result.reason).toContain('Converge phase');
    });
  });
});

describe('RulesEngine -- Phase Rules (RULES-01)', () => {
  let engine: RulesEngine;

  beforeEach(() => {
    engine = new RulesEngine(DEFAULT_RULES_ENGINE_CONFIG);
  });

  describe('canActivateAgent', () => {
    it('allows ideator during diverge', () => {
      const result = engine.canActivateAgent('ideator', 'diverge');
      expect(result.allowed).toBe(true);
    });

    it('blocks ideator during converge', () => {
      const result = engine.canActivateAgent('ideator', 'converge');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('ideator');
      expect(result.reason).toContain('converge');
    });

    it('allows facilitator in all phases', () => {
      const phases: SessionPhase[] = ['explore', 'diverge', 'organize', 'converge', 'act'];
      for (const phase of phases) {
        const result = engine.canActivateAgent('facilitator', phase);
        expect(result.allowed).toBe(true);
      }
    });

    it('allows scribe in all phases', () => {
      const phases: SessionPhase[] = ['explore', 'diverge', 'organize', 'converge', 'act'];
      for (const phase of phases) {
        const result = engine.canActivateAgent('scribe', phase);
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe('getActiveRules', () => {
    it('returns all 4 rules during diverge phase', () => {
      const rules = engine.getActiveRules('diverge');
      expect(rules).toEqual(['quantity', 'no-criticism', 'wild-ideas', 'build-combine']);
    });

    it('returns only build-combine during organize phase', () => {
      const rules = engine.getActiveRules('organize');
      expect(rules).toEqual(['build-combine']);
    });

    it('returns empty array during explore phase', () => {
      const rules = engine.getActiveRules('explore');
      expect(rules).toEqual([]);
    });

    it('returns empty array during converge phase', () => {
      const rules = engine.getActiveRules('converge');
      expect(rules).toEqual([]);
    });

    it('returns empty array during act phase', () => {
      const rules = engine.getActiveRules('act');
      expect(rules).toEqual([]);
    });
  });
});

describe('RulesEngine -- Rule Reminders (RULES-06)', () => {
  let engine: RulesEngine;

  beforeEach(() => {
    engine = new RulesEngine(DEFAULT_RULES_ENGINE_CONFIG);
  });

  describe('generateRuleReminder', () => {
    it('returns non-empty string for diverge phase', () => {
      const reminder = engine.generateRuleReminder('diverge');
      expect(reminder.length).toBeGreaterThan(0);
    });

    it('diverge reminder references quantity rule', () => {
      const reminder = engine.generateRuleReminder('diverge');
      expect(reminder.toLowerCase()).toContain('quantity');
    });

    it('diverge reminder references no-criticism rule', () => {
      const reminder = engine.generateRuleReminder('diverge');
      expect(reminder.toLowerCase()).toContain('no-criticism');
    });

    it('diverge reminder references wild-ideas rule', () => {
      const reminder = engine.generateRuleReminder('diverge');
      expect(reminder.toLowerCase()).toContain('wild-ideas');
    });

    it('diverge reminder references build-combine rule', () => {
      const reminder = engine.generateRuleReminder('diverge');
      expect(reminder.toLowerCase()).toContain('build-combine');
    });

    it('returns non-empty string for organize phase', () => {
      const reminder = engine.generateRuleReminder('organize');
      expect(reminder.length).toBeGreaterThan(0);
    });

    it('returns non-empty string for converge phase', () => {
      const reminder = engine.generateRuleReminder('converge');
      expect(reminder.length).toBeGreaterThan(0);
    });

    it('returns non-empty string for explore phase', () => {
      const reminder = engine.generateRuleReminder('explore');
      expect(reminder.length).toBeGreaterThan(0);
    });

    it('returns non-empty string for act phase', () => {
      const reminder = engine.generateRuleReminder('act');
      expect(reminder.length).toBeGreaterThan(0);
    });
  });
});
