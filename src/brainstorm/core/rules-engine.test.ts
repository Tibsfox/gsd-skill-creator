/**
 * RulesEngine test suite.
 *
 * TDD RED phase: tests written before implementation.
 * Covers RULES-01 (phase rules), RULES-02 (Critic gate), RULES-06 (rule reminders).
 * Plan 02 adds: RULES-03 (evaluative detection), RULES-04 (Black Hat), RULES-05 (violations).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RulesEngine, DEFAULT_RULES_ENGINE_CONFIG } from './rules-engine.js';
import type { RuleViolation } from './rules-engine.js';

import type { BrainstormMessage, SessionPhase, AgentRole, HatColor } from '../shared/types.js';
import { randomUUID } from 'node:crypto';

// ============================================================================
// Test helpers
// ============================================================================

/**
 * Create a minimal valid BrainstormMessage for testing checkMessage().
 */
function createTestMessage(
  content: string,
  phase: SessionPhase,
  options?: { hatColor?: HatColor; from?: AgentRole | 'system'; sessionId?: string },
): BrainstormMessage {
  const payload: Record<string, unknown> = { content };
  if (options?.hatColor) {
    payload.hat_color = options.hatColor;
  }
  return {
    id: randomUUID(),
    from: options?.from ?? 'ideator',
    to: 'broadcast',
    type: 'idea',
    phase,
    payload,
    timestamp: Date.now(),
    session_id: options?.sessionId ?? randomUUID(),
    priority: 3,
  };
}

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

// ============================================================================
// Plan 02 tests: Evaluative Detection, Black Hat, Violations
// ============================================================================

describe('RulesEngine -- Evaluative Content Detection (RULES-03)', () => {
  let engine: RulesEngine;

  beforeEach(() => {
    engine = new RulesEngine(DEFAULT_RULES_ENGINE_CONFIG);
  });

  describe('checkMessage -- diverge phase', () => {
    it('blocks message with "that won\'t work" during diverge', () => {
      const msg = createTestMessage("that won't work", 'diverge');
      const result = engine.checkMessage(msg, 'diverge');
      expect(result.allowed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].rule).toBe('no-criticism');
    });

    it('blocks message with "bad idea" during diverge', () => {
      const msg = createTestMessage('This is a bad idea, let\'s drop it', 'diverge');
      const result = engine.checkMessage(msg, 'diverge');
      expect(result.allowed).toBe(false);
    });

    it('blocks message with "terrible idea" during diverge', () => {
      const msg = createTestMessage('That is a terrible idea', 'diverge');
      const result = engine.checkMessage(msg, 'diverge');
      expect(result.allowed).toBe(false);
    });

    it('blocks message with "not feasible" during diverge', () => {
      const msg = createTestMessage('Not feasible given our constraints', 'diverge');
      const result = engine.checkMessage(msg, 'diverge');
      expect(result.allowed).toBe(false);
    });

    it('blocks message with "unrealistic" during diverge', () => {
      const msg = createTestMessage('This is completely unrealistic', 'diverge');
      const result = engine.checkMessage(msg, 'diverge');
      expect(result.allowed).toBe(false);
    });

    it('blocks message with "we already tried" during diverge', () => {
      const msg = createTestMessage('We already tried this last year', 'diverge');
      const result = engine.checkMessage(msg, 'diverge');
      expect(result.allowed).toBe(false);
    });

    it('blocks message with "everyone knows" during diverge', () => {
      const msg = createTestMessage("Everyone knows this doesn't scale", 'diverge');
      const result = engine.checkMessage(msg, 'diverge');
      expect(result.allowed).toBe(false);
    });

    it('blocks message with "that\'s wrong" during diverge', () => {
      const msg = createTestMessage("That's wrong, we need a different approach", 'diverge');
      const result = engine.checkMessage(msg, 'diverge');
      expect(result.allowed).toBe(false);
    });

    it('allows message with "and we could also" during diverge', () => {
      const msg = createTestMessage('And we could also try a new approach', 'diverge');
      const result = engine.checkMessage(msg, 'diverge');
      expect(result.allowed).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('allows message with "what if we combined that with" during diverge', () => {
      const msg = createTestMessage('What if we combined that with sensor data?', 'diverge');
      const result = engine.checkMessage(msg, 'diverge');
      expect(result.allowed).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('allows all messages during non-diverge phases', () => {
      const phases: SessionPhase[] = ['explore', 'organize', 'converge', 'act'];
      for (const phase of phases) {
        const msg = createTestMessage("that won't work", phase);
        const result = engine.checkMessage(msg, phase);
        expect(result.allowed).toBe(true);
        expect(result.violations).toEqual([]);
      }
    });

    it('allows constructive context: "won\'t work in isolation but combined with..."', () => {
      const msg = createTestMessage(
        "this won't work in isolation but combined with the previous idea it becomes powerful",
        'diverge',
      );
      const result = engine.checkMessage(msg, 'diverge');
      expect(result.allowed).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('allows constructive context: "not feasible unless we automate..."', () => {
      const msg = createTestMessage(
        'Not feasible right now unless we automate the manual steps',
        'diverge',
      );
      const result = engine.checkMessage(msg, 'diverge');
      expect(result.allowed).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('allows message with no content payload gracefully', () => {
      const msg: BrainstormMessage = {
        id: randomUUID(),
        from: 'ideator',
        to: 'broadcast',
        type: 'idea',
        phase: 'diverge',
        payload: {},
        timestamp: Date.now(),
        session_id: randomUUID(),
        priority: 3,
      };
      const result = engine.checkMessage(msg, 'diverge');
      expect(result.allowed).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('violation has violation_type: content for evaluative text', () => {
      const msg = createTestMessage("that won't work", 'diverge');
      const result = engine.checkMessage(msg, 'diverge');
      expect(result.violations[0].violation_type).toBe('content');
    });
  });
});

describe('RulesEngine -- Black Hat Constraint (RULES-04)', () => {
  let engine: RulesEngine;

  beforeEach(() => {
    engine = new RulesEngine(DEFAULT_RULES_ENGINE_CONFIG);
  });

  it('blocks message with hat_color: black during diverge phase', () => {
    const msg = createTestMessage('Looking at risks here', 'diverge', { hatColor: 'black' });
    const result = engine.checkMessage(msg, 'diverge');
    expect(result.allowed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('allows message with hat_color: black during converge phase', () => {
    const msg = createTestMessage('Looking at risks here', 'converge', { hatColor: 'black' });
    const result = engine.checkMessage(msg, 'converge');
    expect(result.allowed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('allows message with hat_color: green during diverge phase', () => {
    const msg = createTestMessage('New creative idea', 'diverge', { hatColor: 'green' });
    const result = engine.checkMessage(msg, 'diverge');
    expect(result.allowed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('violation from Black Hat has violation_type: timing', () => {
    const msg = createTestMessage('Assessing risks', 'diverge', { hatColor: 'black' });
    const result = engine.checkMessage(msg, 'diverge');
    expect(result.violations[0].violation_type).toBe('timing');
    expect(result.violations[0].rule).toBe('no-criticism');
  });

  it('Black Hat check takes priority over evaluative content check', () => {
    // Message has BOTH black hat AND evaluative content -- should be caught as 'timing', not 'content'
    const msg = createTestMessage("that won't work at all", 'diverge', { hatColor: 'black' });
    const result = engine.checkMessage(msg, 'diverge');
    expect(result.allowed).toBe(false);
    expect(result.violations[0].violation_type).toBe('timing');
  });
});

describe('RulesEngine -- Violation Logging (RULES-05)', () => {
  let engine: RulesEngine;

  beforeEach(() => {
    engine = new RulesEngine(DEFAULT_RULES_ENGINE_CONFIG);
  });

  it('getViolations returns empty array for unknown session_id', () => {
    const violations = engine.getViolations(randomUUID());
    expect(violations).toEqual([]);
  });

  it('blocked message is logged to getViolations for its session_id', () => {
    const sessionId = randomUUID();
    const msg = createTestMessage("that won't work", 'diverge', { sessionId });
    engine.checkMessage(msg, 'diverge');

    const violations = engine.getViolations(sessionId);
    expect(violations.length).toBe(1);
    expect(violations[0].message_id).toBe(msg.id);
  });

  it('multiple blocked messages accumulate in violation history', () => {
    const sessionId = randomUUID();
    const msg1 = createTestMessage("that won't work", 'diverge', { sessionId });
    const msg2 = createTestMessage('bad idea, stop', 'diverge', { sessionId });
    const msg3 = createTestMessage('totally unrealistic plan', 'diverge', { sessionId });

    engine.checkMessage(msg1, 'diverge');
    engine.checkMessage(msg2, 'diverge');
    engine.checkMessage(msg3, 'diverge');

    const violations = engine.getViolations(sessionId);
    expect(violations.length).toBe(3);
  });

  it('violations from different sessions are stored separately', () => {
    const session1 = randomUUID();
    const session2 = randomUUID();

    const msg1 = createTestMessage("that won't work", 'diverge', { sessionId: session1 });
    const msg2 = createTestMessage('bad idea', 'diverge', { sessionId: session2 });

    engine.checkMessage(msg1, 'diverge');
    engine.checkMessage(msg2, 'diverge');

    expect(engine.getViolations(session1).length).toBe(1);
    expect(engine.getViolations(session2).length).toBe(1);
  });

  it('violation record has all required fields', () => {
    const sessionId = randomUUID();
    const msg = createTestMessage("that won't work", 'diverge', {
      sessionId,
      from: 'ideator',
    });
    engine.checkMessage(msg, 'diverge');

    const violations = engine.getViolations(sessionId);
    expect(violations.length).toBe(1);

    const v: RuleViolation = violations[0];
    expect(v.rule).toBe('no-criticism');
    expect(v.agent).toBe('ideator');
    expect(v.message_id).toBe(msg.id);
    expect(['content', 'activation', 'timing']).toContain(v.violation_type);
    expect(typeof v.description).toBe('string');
    expect(v.description.length).toBeGreaterThan(0);
    expect(typeof v.timestamp).toBe('number');
    expect(v.phase).toBe('diverge');
    expect(v.action_taken).toBe('blocked');
  });

  it('allowed messages do NOT log violations', () => {
    const sessionId = randomUUID();
    const msg = createTestMessage('Great new idea for the product', 'diverge', { sessionId });
    engine.checkMessage(msg, 'diverge');

    expect(engine.getViolations(sessionId)).toEqual([]);
  });

  it('violation agent field falls back to facilitator for system sender', () => {
    const sessionId = randomUUID();
    const msg = createTestMessage("that won't work", 'diverge', {
      sessionId,
      from: 'system',
    });
    engine.checkMessage(msg, 'diverge');

    const violations = engine.getViolations(sessionId);
    expect(violations.length).toBe(1);
    expect(violations[0].agent).toBe('facilitator');
  });
});

describe('RulesEngine -- 50-Sentence Corpus (RULES-03 false positive verification)', () => {
  let engine: RulesEngine;

  beforeEach(() => {
    engine = new RulesEngine(DEFAULT_RULES_ENGINE_CONFIG);
  });

  // 25 sentences that SHOULD be blocked (true positives)
  const TRUE_POSITIVES: string[] = [
    "that won't work",
    "bad idea, let's drop it",
    "this is completely unrealistic",
    "not feasible given our constraints",
    "we already tried this last year",
    "that's a terrible approach",
    "everyone knows this doesn't scale",
    "this is clearly wrong",
    "we should not do this",
    "too risky, abandon it",
    "that will not work in practice",
    "terrible idea from the start",
    "that's incorrect and misleading",
    "we already tried something similar and it failed",
    "everyone knows that approach is outdated",
    "that won't work for our use case",
    "this is not feasible with our budget",
    "bad idea overall",
    "unrealistic timeline for this scope",
    "that's wrong on multiple levels",
    "we should not do this project",
    "too risky, abandon the whole concept",
    "that's a terrible idea to pursue",
    "not feasible at this scale",
    "we've already tried that exact approach",
  ];

  // 25 sentences that SHOULD pass (true negatives / constructive context)
  const TRUE_NEGATIVES: string[] = [
    "this won't work in isolation but combined with the previous idea it becomes powerful",
    "what if we took the thing that doesn't work about approach A and inverted it?",
    "building on that -- and we could also expand into neighboring markets",
    "unrealistic on its own but could become feasible if we partner with a vendor",
    "bad for solo use but combined with the team format it gains value",
    "not feasible right now unless we automate the manual steps",
    "we already tried a version but what if we made it intentionally extreme?",
    "that seems unlikely at first but what if we combined it with technique B?",
    "everyone knows the old way fails but if we reverse the sequence it might work",
    "that won't work alone but combined with caching it solves the latency issue",
    "terrible as a standalone but building on the modular design it fits perfectly",
    "not feasible today unless we introduce incremental rollout",
    "we already tried it once but what if we added a feedback loop?",
    "unrealistic without partners but could become the standard with the right alliance",
    "bad idea if centralized but combined with edge computing it transforms",
    "that's incorrect by itself but if we adjust the parameters it works",
    "too risky on its own but could become safe with proper guardrails",
    "that will not work unless we change the underlying protocol",
    "everyone knows the limitation but what if we turn it into a feature?",
    "this won't work for large datasets but combined with sharding it scales",
    "terrible first impression but building on the feedback we can pivot",
    "not feasible without automation unless we introduce batch processing",
    "we've already tried the naive approach but what if we added ML pre-filtering?",
    "that's wrong in the current context but if we expand the scope it holds",
    "bad idea for v1 but combined with the API redesign in v2 it shines",
  ];

  it('blocks >= 90% of evaluative sentences (true positive rate)', () => {
    let blocked = 0;
    for (const sentence of TRUE_POSITIVES) {
      const msg = createTestMessage(sentence, 'diverge');
      const result = engine.checkMessage(msg, 'diverge');
      if (!result.allowed) blocked++;
    }

    const truePositiveRate = blocked / TRUE_POSITIVES.length;
    expect(truePositiveRate).toBeGreaterThanOrEqual(0.9);
  });

  it('allows >= 95% of constructive sentences (false positive rate < 5%)', () => {
    let allowed = 0;
    for (const sentence of TRUE_NEGATIVES) {
      const msg = createTestMessage(sentence, 'diverge');
      const result = engine.checkMessage(msg, 'diverge');
      if (result.allowed) allowed++;
    }

    const trueNegativeRate = allowed / TRUE_NEGATIVES.length;
    expect(trueNegativeRate).toBeGreaterThanOrEqual(0.95);
  });
});
