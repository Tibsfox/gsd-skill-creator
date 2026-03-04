import { describe, it, expect } from 'vitest';
import { VisibilityEngine } from './muse-visibility-engine.js';
import type { VisibilityContext } from './muse-visibility.js';
import type { MuseActivation } from './muse-plane-types.js';

const MUSE_IDS = ['foxy', 'lex', 'hemlock', 'sam', 'cedar', 'willow'] as const;

function makeContext(overrides: Partial<VisibilityContext> = {}): VisibilityContext {
  return {
    userInput: '',
    taskDescription: '',
    activeMuses: [],
    conversationDepth: 1,
    ...overrides,
  };
}

function makeActivation(id: string, score: number): MuseActivation {
  return { museId: id as typeof MUSE_IDS[number], score, reason: 'test' };
}

describe('VisibilityEngine', () => {
  describe('detectDirectInvocation', () => {
    it('"ask Foxy" returns foxy', () => {
      const engine = new VisibilityEngine(VisibilityEngine.defaultRules());
      expect(engine.detectDirectInvocation('ask Foxy')).toBe('foxy');
    });

    it('"invoke Cedar" returns cedar (case insensitive)', () => {
      const engine = new VisibilityEngine(VisibilityEngine.defaultRules());
      expect(engine.detectDirectInvocation('invoke cedar')).toBe('cedar');
    });

    it('"what would Lex say" returns lex', () => {
      const engine = new VisibilityEngine(VisibilityEngine.defaultRules());
      expect(engine.detectDirectInvocation('what would Lex say')).toBe('lex');
    });

    it('returns null for unknown muse name', () => {
      const engine = new VisibilityEngine(VisibilityEngine.defaultRules());
      expect(engine.detectDirectInvocation('ask Zeus')).toBeNull();
    });

    it('returns null for non-invocation input', () => {
      const engine = new VisibilityEngine(VisibilityEngine.defaultRules());
      expect(engine.detectDirectInvocation('fix the bug in login')).toBeNull();
    });
  });

  describe('decide', () => {
    it('direct invocation overrides all other rules', () => {
      const engine = new VisibilityEngine(VisibilityEngine.defaultRules());
      const ctx = makeContext({
        userInput: 'ask Foxy about the design',
        activeMuses: [makeActivation('foxy', 0.9)],
      });
      const decisions = engine.decide(ctx);
      const foxyDecision = decisions.find(d => d.museId === 'foxy');
      expect(foxyDecision).toBeDefined();
      expect(foxyDecision!.level).toBe('direct-invocation');
    });

    it('default is invisible when no special conditions', () => {
      const engine = new VisibilityEngine(VisibilityEngine.defaultRules());
      const ctx = makeContext({
        activeMuses: [makeActivation('lex', 0.6), makeActivation('foxy', 0.2)],
      });
      const decisions = engine.decide(ctx);
      expect(decisions.every(d => d.level === 'invisible')).toBe(true);
    });

    it('returns empty array when no active muses', () => {
      const engine = new VisibilityEngine(VisibilityEngine.defaultRules());
      const ctx = makeContext();
      expect(engine.decide(ctx)).toHaveLength(0);
    });
  });

  describe('defaultRules', () => {
    it('returns rules sorted by priority descending', () => {
      const rules = VisibilityEngine.defaultRules();
      expect(rules.length).toBeGreaterThan(0);
      for (let i = 1; i < rules.length; i++) {
        expect(rules[i - 1].priority).toBeGreaterThanOrEqual(rules[i].priority);
      }
    });
  });
});
