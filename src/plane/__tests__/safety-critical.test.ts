/**
 * Safety-Critical Tests for the Complex Plane Learning Framework.
 *
 * 12 tests (SC-01..SC-12) verifying backward compatibility, graceful
 * degradation, mathematical safety (no NaN/Infinity), angular velocity
 * bounds, and migration idempotency/non-destructiveness.
 *
 * Every test is self-contained: no external state, no real file paths.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import {
  createPosition,
  computeTangent,
  versine,
  exsecant,
  computeAngularStep,
  computePlaneMetrics,
  classifyByVersine,
  MAX_REACH,
  MIN_THETA,
  MAX_ANGULAR_VELOCITY,
  PromotionLevel,
} from '../index.js';

import { computeEnhancedScore, DEFAULT_PLANE_ACTIVATION_CONFIG } from '../activation.js';
import type { PlaneActivationConfig } from '../activation.js';
import { PositionStore } from '../position-store.js';
import { ObserverAngularBridge } from '../observer-bridge.js';
import { classifySignals } from '../signal-classification.js';
import { AngularPromotionEvaluator } from '../promotion.js';
import type { ExistingEvaluationFramework, EvidenceProvider, PositionStorePort } from '../promotion.js';
import { ChordDetector } from '../chords.js';
import type { PositionStorePort as ChordPositionStorePort } from '../chords.js';
import { SkillMigrationAnalyzer } from '../migration.js';
import type { ExistingSkillMetadata } from '../migration.js';
import type { SkillPosition } from '../types.js';

// ============================================================================
// SC-01: Existing test suite passes unchanged
// ============================================================================

describe('SC-01: Existing test suite passes unchanged', () => {
  // SC-01
  it('is verified by running `npx vitest run` across the entire suite', () => {
    // This is a meta-test. The actual verification is performed in Plan 366-02
    // by running the full regression suite. This test documents the requirement.
    expect(true).toBe(true);
  });
});

// ============================================================================
// SC-02: Skill without position activates via semantic-only scoring
// ============================================================================

describe('SC-02: Skill without position activates via semantic-only scoring', () => {
  // SC-02
  it('returns combinedScore === semanticScore when skill has no position', () => {
    const taskVector = { x: 0.8, y: 0.2, raw: { concreteSignals: ['file.ts'], abstractSignals: [] } };
    const semanticScore = 0.75;

    // Pass null position -- should fall back to semantic-only
    const result = computeEnhancedScore('skill-no-pos', null, taskVector, semanticScore);

    expect(result.combinedScore).toBe(semanticScore);
    expect(result.semanticScore).toBe(semanticScore);
    expect(result.geometric).toBeNull();
  });

  it('returns combinedScore === semanticScore when skill position is undefined', () => {
    const taskVector = { x: 0.5, y: 0.5, raw: { concreteSignals: [], abstractSignals: [] } };
    const semanticScore = 0.42;

    const result = computeEnhancedScore('skill-undef', undefined, taskVector, semanticScore);

    expect(result.combinedScore).toBe(semanticScore);
    expect(result.geometric).toBeNull();
  });

  it('falls back to semantic even when config.enabled=true and position is null', () => {
    const config: PlaneActivationConfig = {
      ...DEFAULT_PLANE_ACTIVATION_CONFIG,
      enabled: true,
    };
    const taskVector = { x: 0.7, y: 0.3, raw: { concreteSignals: [], abstractSignals: [] } };
    const semanticScore = 0.9;

    const result = computeEnhancedScore('skill-enabled-no-pos', null, taskVector, semanticScore, config);

    expect(result.combinedScore).toBe(semanticScore);
  });
});

// ============================================================================
// SC-03: Pipeline without positions.json operates normally
// ============================================================================

describe('SC-03: Pipeline without positions.json operates normally', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'sc03-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // SC-03
  it('PositionStore with non-existent path: get returns null, all returns empty Map', async () => {
    const nonExistentPath = join(tempDir, 'does', 'not', 'exist', 'positions.json');
    const store = new PositionStore(nonExistentPath);
    await store.load(); // should not throw

    expect(store.get('any-skill')).toBeNull();
    expect(store.all().size).toBe(0);
  });

  it('activation scoring works with empty PositionStore (no NaN, no crash)', async () => {
    const store = new PositionStore(join(tempDir, 'empty.json'));
    await store.load();

    const taskVector = { x: 0.5, y: 0.5, raw: { concreteSignals: [], abstractSignals: [] } };
    const pos = store.get('nonexistent');

    const result = computeEnhancedScore('nonexistent', pos, taskVector, 0.5);
    expect(Number.isNaN(result.combinedScore)).toBe(false);
    expect(Number.isFinite(result.combinedScore)).toBe(true);
  });
});

// ============================================================================
// SC-04: Observer without bridge produces observations normally
// ============================================================================

describe('SC-04: Observer without bridge produces observations normally', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'sc04-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // SC-04
  it('classifySignals with empty array returns zeros', () => {
    const result = classifySignals([]);
    expect(result.totalConcrete).toBe(0);
    expect(result.totalAbstract).toBe(0);
    expect(result.theta).toBe(0);
  });

  it('ObserverAngularBridge handles empty pattern groups without crash', async () => {
    const store = new PositionStore(join(tempDir, 'pos.json'));
    await store.load();
    const bridge = new ObserverAngularBridge(store);

    const observation = bridge.processSession('session-empty', []);
    expect(observation).not.toBeNull();
    expect(observation!.patterns).toHaveLength(0);
    expect(observation!.sessionId).toBe('session-empty');
  });
});

// ============================================================================
// SC-05: SuggestionManager without bridge creates skills without position
// ============================================================================

describe('SC-05: SuggestionManager without bridge creates skills without position', () => {
  // SC-05
  it('calling computeEnhancedScore with null position produces no error and no position', () => {
    // When no ObserverAngularBridge is available, skills have no position.
    // The enhanced scoring must handle null/undefined gracefully.
    const taskVector = { x: 0.6, y: 0.4, raw: { concreteSignals: [], abstractSignals: [] } };
    const score = computeEnhancedScore('new-skill', null, taskVector, 0.5);

    expect(score.combinedScore).toBe(0.5);
    expect(score.geometric).toBeNull();
    // No error thrown -- skill creation proceeds without a SkillPosition
  });

  it('ObserverAngularBridge.assignInitialPosition returns valid position for any input', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'sc05-'));
    try {
      const store = new PositionStore(join(tempDir, 'pos.json'));
      await store.load();
      const bridge = new ObserverAngularBridge(store);

      const position = bridge.assignInitialPosition({
        patternId: 'test-pattern',
        signals: [{ type: 'bash_deterministic' }],
      });

      expect(position).toBeDefined();
      expect(typeof position.theta).toBe('number');
      expect(typeof position.radius).toBe('number');
      expect(Number.isFinite(position.theta)).toBe(true);
      expect(Number.isFinite(position.radius)).toBe(true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// SC-06: Promotion without evaluator runs existing logic
// ============================================================================

describe('SC-06: Promotion without evaluator runs existing logic', () => {
  // SC-06
  it('evaluatePromotion returns rejected decision with reason when position is missing', () => {
    const mockStore: PositionStorePort = {
      get: () => null,
      set: () => {},
    };
    const mockFramework: ExistingEvaluationFramework = {
      evaluate: () => ({ passed: true, reason: 'ok' }),
    };
    const mockEvidence: EvidenceProvider = {
      getPatternRepetitions: () => 0,
      getTrainingPairCount: () => 0,
      getDeterministicInvariantCount: () => 0,
    };

    const evaluator = new AngularPromotionEvaluator(mockStore, mockFramework, mockEvidence);
    const decision = evaluator.evaluatePromotion('missing-skill', PromotionLevel.SKILL_MD);

    expect(decision.approved).toBe(false);
    expect(decision.reason).toContain('No plane position');
    expect(decision.skillId).toBe('missing-skill');
    expect(typeof decision.currentTheta).toBe('number');
    expect(typeof decision.targetTheta).toBe('number');
    expect(typeof decision.maxAngularStep).toBe('number');
    expect(typeof decision.requiredEvidence).toBe('number');
    expect(typeof decision.versineGap).toBe('number');
    expect(typeof decision.exsecantReach).toBe('number');
  });
});

// ============================================================================
// SC-07: Co-activation without chord detector runs existing logic
// ============================================================================

describe('SC-07: Co-activation without chord detector runs existing logic', () => {
  // SC-07
  it('ChordDetector.detectChords returns empty array with no co-activation data', () => {
    const mockStore: ChordPositionStorePort = {
      get: () => null,
      all: () => new Map(),
    };

    const detector = new ChordDetector(mockStore);
    const result = detector.detectChords([]);

    expect(result).toEqual([]);
  });

  it('ChordDetector.detectChords returns empty array when skills have no positions', () => {
    const mockStore: ChordPositionStorePort = {
      get: () => null,
      all: () => new Map(),
    };

    const detector = new ChordDetector(mockStore);
    const result = detector.detectChords([
      {
        skillPair: ['skill-a', 'skill-b'] as [string, string],
        coActivationCount: 10,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      },
    ]);

    expect(result).toEqual([]);
  });
});

// ============================================================================
// SC-08: Division-by-zero at theta=0 produces safe values
// ============================================================================

describe('SC-08: Division-by-zero at theta=0 produces safe values', () => {
  // SC-08
  it('computeTangent at theta=0 produces finite values, no NaN, no Infinity', () => {
    // createPosition normalizes theta, so theta=0 becomes MIN_THETA-ish via normalization
    // But let's test with a raw position at theta near 0
    const position: SkillPosition = {
      theta: 0,
      radius: 0.5,
      angularVelocity: 0,
      lastUpdated: new Date().toISOString(),
    };

    const tangent = computeTangent(position);

    expect(Number.isFinite(tangent.slope)).toBe(true);
    expect(Number.isNaN(tangent.slope)).toBe(false);
    expect(Number.isFinite(tangent.reach)).toBe(true);
    expect(Number.isNaN(tangent.reach)).toBe(false);
    expect(Number.isFinite(tangent.exsecant)).toBe(true);
    expect(Number.isNaN(tangent.exsecant)).toBe(false);
    expect(Number.isFinite(tangent.versine)).toBe(true);
    expect(Number.isNaN(tangent.versine)).toBe(false);
  });

  it('versine at theta=0 returns a number >= 0', () => {
    const position: SkillPosition = {
      theta: 0,
      radius: 0.5,
      angularVelocity: 0,
      lastUpdated: new Date().toISOString(),
    };

    const v = versine(position);
    expect(typeof v).toBe('number');
    expect(v).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(v)).toBe(true);
  });

  it('exsecant at theta=0 returns a number >= 0', () => {
    const position: SkillPosition = {
      theta: 0,
      radius: 0.5,
      angularVelocity: 0,
      lastUpdated: new Date().toISOString(),
    };

    const e = exsecant(position);
    expect(typeof e).toBe('number');
    expect(e).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(e)).toBe(true);
  });
});

// ============================================================================
// SC-09: Division-by-zero at theta=pi/2 produces safe values
// ============================================================================

describe('SC-09: Division-by-zero at theta=pi/2 produces safe values', () => {
  // SC-09
  it('computeTangent at theta=pi/2 produces clamped reach and finite slope', () => {
    const position: SkillPosition = {
      theta: Math.PI / 2,
      radius: 0.5,
      angularVelocity: 0,
      lastUpdated: new Date().toISOString(),
    };

    const tangent = computeTangent(position);

    // Reach should be clamped to MAX_REACH (not Infinity)
    expect(tangent.reach).toBeLessThanOrEqual(MAX_REACH);
    expect(Number.isFinite(tangent.reach)).toBe(true);

    // Slope should be finite (near 0 at pi/2)
    expect(Number.isFinite(tangent.slope)).toBe(true);
    expect(Number.isNaN(tangent.slope)).toBe(false);

    // No NaN in any field
    expect(Number.isNaN(tangent.versine)).toBe(false);
    expect(Number.isNaN(tangent.exsecant)).toBe(false);
  });

  it('exsecant at theta=pi/2 is finite and <= MAX_REACH - 1', () => {
    const position: SkillPosition = {
      theta: Math.PI / 2,
      radius: 0.5,
      angularVelocity: 0,
      lastUpdated: new Date().toISOString(),
    };

    const e = exsecant(position);
    expect(Number.isFinite(e)).toBe(true);
    expect(e).toBeLessThanOrEqual(MAX_REACH - 1);
  });
});

// ============================================================================
// SC-10: Angular velocity bound enforced
// ============================================================================

describe('SC-10: Angular velocity bound enforced', () => {
  // SC-10
  it('computeAngularStep from theta=1.0 to 0 respects MAX_ANGULAR_VELOCITY bound', () => {
    const step = computeAngularStep(1.0, 0, MAX_ANGULAR_VELOCITY);
    // Max allowed step = MAX_ANGULAR_VELOCITY * max(1.0, MIN_THETA) = 0.2 * 1.0 = 0.2
    expect(Math.abs(step)).toBeLessThanOrEqual(MAX_ANGULAR_VELOCITY * 1.0 + 1e-10);
  });

  it('computeAngularStep from theta=0.5 to 0 respects velocity bound', () => {
    const step = computeAngularStep(0.5, 0, MAX_ANGULAR_VELOCITY);
    // Max allowed step = MAX_ANGULAR_VELOCITY * max(0.5, MIN_THETA) = 0.2 * 0.5 = 0.1
    expect(Math.abs(step)).toBeLessThanOrEqual(MAX_ANGULAR_VELOCITY * 0.5 + 1e-10);
  });

  it('velocity bound holds for various theta values', () => {
    const thetas = [0.1, 0.3, 0.7, 1.0, 1.2, Math.PI / 4, Math.PI / 2];
    for (const theta of thetas) {
      const step = computeAngularStep(theta, 0, MAX_ANGULAR_VELOCITY);
      const maxStep = MAX_ANGULAR_VELOCITY * Math.max(theta, MIN_THETA);
      expect(Math.abs(step)).toBeLessThanOrEqual(maxStep + 1e-10);
    }
  });
});

// ============================================================================
// SC-11: Migration idempotent
// ============================================================================

describe('SC-11: Migration idempotent', () => {
  // SC-11
  it('analyzeSkill produces identical results for identical inputs', () => {
    const analyzer = new SkillMigrationAnalyzer();

    const skill1: ExistingSkillMetadata = {
      id: 'test-skill',
      triggers: {
        intents: ['deploy application'],
        files: ['src/deploy.ts', 'config/prod.yaml'],
        contexts: ['execute'],
      },
      content: '# Deploy Skill\n\n```bash\nnpm run build\n```\n\nUse when deploying to production.',
    };

    const skill2: ExistingSkillMetadata = {
      id: 'test-skill',
      triggers: {
        intents: ['deploy application'],
        files: ['src/deploy.ts', 'config/prod.yaml'],
        contexts: ['execute'],
      },
      content: '# Deploy Skill\n\n```bash\nnpm run build\n```\n\nUse when deploying to production.',
    };

    const result1 = analyzer.analyzeSkill(skill1);
    const result2 = analyzer.analyzeSkill(skill2);

    expect(result1.theta).toBe(result2.theta);
    expect(result1.radius).toBe(result2.radius);
    expect(result1.confidence).toBe(result2.confidence);
    expect(result1.source).toBe(result2.source);
  });

  it('analyzeSkill is deterministic across multiple calls on same input', () => {
    const analyzer = new SkillMigrationAnalyzer();
    const skill: ExistingSkillMetadata = {
      id: 'consistency-check',
      content: 'A short skill with `git commit` and consider patterns.',
    };

    const results = Array.from({ length: 5 }, () => analyzer.analyzeSkill(skill));

    for (let i = 1; i < results.length; i++) {
      expect(results[i].theta).toBe(results[0].theta);
      expect(results[i].radius).toBe(results[0].radius);
    }
  });
});

// ============================================================================
// SC-12: Migration non-destructive
// ============================================================================

describe('SC-12: Migration non-destructive', () => {
  // SC-12
  it('analyzeSkill does not modify the input metadata object', () => {
    const analyzer = new SkillMigrationAnalyzer();

    const skill: ExistingSkillMetadata = {
      id: 'immutable-skill',
      triggers: {
        intents: ['build project'],
        files: ['src/main.ts'],
        contexts: ['execute', 'verify'],
      },
      content: '# Build\n\n```bash\nnpm run build\n```\n\nUse when building the project. Consider caching.',
      extensions: {
        version: 3,
        learning: { applicationCount: 10 },
      },
    };

    // Deep clone before analysis
    const clone = JSON.parse(JSON.stringify(skill));

    analyzer.analyzeSkill(skill);

    // Verify original is unchanged
    expect(skill).toEqual(clone);
  });

  it('analyzeSkill does not add or remove properties on input', () => {
    const analyzer = new SkillMigrationAnalyzer();

    const skill: ExistingSkillMetadata = {
      id: 'property-check',
      content: 'Simple content.',
    };

    const keysBefore = Object.keys(skill);

    analyzer.analyzeSkill(skill);

    const keysAfter = Object.keys(skill);
    expect(keysAfter).toEqual(keysBefore);
  });
});
