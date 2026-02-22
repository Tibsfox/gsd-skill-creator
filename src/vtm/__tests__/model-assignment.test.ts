/**
 * Tests for VTM model assignment classifier, signal registry, and scoring.
 *
 * Covers:
 * - SIGNAL_REGISTRY: signal registry structure with per-tier keyword/weight mappings
 * - createSignalRegistry(): deep copy factory with optional overrides
 * - scoreTask(): weighted keyword scoring with file pattern analysis
 * - assignModel(): model tier classification with confidence and override support
 *
 * All functions are pure functional API. Signal registry is data-driven and
 * extensible without modifying classifier logic.
 */

import { describe, it, expect } from 'vitest';
import type { ModelAssignment } from '../types.js';
import {
  SIGNAL_REGISTRY,
  createSignalRegistry,
  scoreTask,
  assignModel,
  type Signal,
  type SignalRegistry,
  type TierScores,
  type AssignmentInput,
  type AssignmentResult,
} from '../model-assignment.js';

// ---------------------------------------------------------------------------
// SIGNAL_REGISTRY -- signal registry structure
// ---------------------------------------------------------------------------

describe('SIGNAL_REGISTRY', () => {
  it('is an object with three keys: opus, sonnet, haiku', () => {
    expect(SIGNAL_REGISTRY).toHaveProperty('opus');
    expect(SIGNAL_REGISTRY).toHaveProperty('sonnet');
    expect(SIGNAL_REGISTRY).toHaveProperty('haiku');
    expect(Object.keys(SIGNAL_REGISTRY)).toHaveLength(3);
  });

  it('each tier value is an array of signal objects with pattern and weight', () => {
    for (const tier of ['opus', 'sonnet', 'haiku'] as const) {
      expect(Array.isArray(SIGNAL_REGISTRY[tier])).toBe(true);
      for (const signal of SIGNAL_REGISTRY[tier]) {
        expect(signal).toHaveProperty('pattern');
        expect(signal).toHaveProperty('weight');
        expect(typeof signal.pattern).toBe('string');
        expect(typeof signal.weight).toBe('number');
      }
    }
  });

  it('opus signals include baseline keywords from MODL-02', () => {
    const patterns = SIGNAL_REGISTRY.opus.map(s => s.pattern);
    expect(patterns).toContain('safety warden');
    expect(patterns).toContain('personality');
    expect(patterns).toContain('persona');
    expect(patterns).toContain('character');
    expect(patterns).toContain('architectural decision');
    expect(patterns).toContain('factory');
    expect(patterns).toContain('meta');
    expect(patterns).toContain('calibration');
    expect(patterns).toContain('cultural sensitivity');
  });

  it('sonnet signals include baseline keywords from MODL-03', () => {
    const patterns = SIGNAL_REGISTRY.sonnet.map(s => s.pattern);
    expect(patterns).toContain('schema');
    expect(patterns).toContain('type system');
    expect(patterns).toContain('interface');
    expect(patterns).toContain('pipeline');
    expect(patterns).toContain('registry');
    expect(patterns).toContain('test suite');
    expect(patterns).toContain('API surface');
    expect(patterns).toContain('documentation');
    expect(patterns).toContain('content generation');
  });

  it('haiku signals include baseline keywords from MODL-04', () => {
    const patterns = SIGNAL_REGISTRY.haiku.map(s => s.pattern);
    expect(patterns).toContain('directory structure');
    expect(patterns).toContain('configuration file');
    expect(patterns).toContain('type stub');
    expect(patterns).toContain('file template');
    expect(patterns).toContain('simple transformation');
  });

  it('multi-word signals have higher weight than single-word signals', () => {
    // "safety warden" (multi-word) should weigh more than "schema" (single)
    const safetyWarden = SIGNAL_REGISTRY.opus.find(s => s.pattern === 'safety warden');
    const schema = SIGNAL_REGISTRY.sonnet.find(s => s.pattern === 'schema');
    expect(safetyWarden).toBeDefined();
    expect(schema).toBeDefined();
    expect(safetyWarden!.weight).toBeGreaterThan(schema!.weight);
  });

  it('all weights are positive numbers', () => {
    for (const tier of ['opus', 'sonnet', 'haiku'] as const) {
      for (const signal of SIGNAL_REGISTRY[tier]) {
        expect(signal.weight).toBeGreaterThan(0);
      }
    }
  });

  it('createSignalRegistry() returns a deep copy (mutations do not affect the original)', () => {
    const copy = createSignalRegistry();
    copy.opus.push({ pattern: 'test-mutant', weight: 99 });
    expect(SIGNAL_REGISTRY.opus.find(s => s.pattern === 'test-mutant')).toBeUndefined();
  });

  it('createSignalRegistry() with custom overrides merges/replaces signals for specified tiers', () => {
    const customSignals: Signal[] = [{ pattern: 'custom-signal', weight: 10 }];
    const custom = createSignalRegistry({ opus: customSignals });
    expect(custom.opus).toEqual(customSignals);
    // Other tiers remain unchanged (deep copy of defaults)
    expect(custom.sonnet.length).toBe(SIGNAL_REGISTRY.sonnet.length);
    expect(custom.haiku.length).toBe(SIGNAL_REGISTRY.haiku.length);
  });
});

// ---------------------------------------------------------------------------
// scoreTask -- signal scoring function
// ---------------------------------------------------------------------------

describe('scoreTask', () => {
  it('text containing "safety warden module": opus score > sonnet and haiku', () => {
    const scores = scoreTask('implement safety warden module', [], SIGNAL_REGISTRY);
    expect(scores.opus).toBeGreaterThan(scores.sonnet);
    expect(scores.opus).toBeGreaterThan(scores.haiku);
  });

  it('text containing "schema validation pipeline": sonnet score > opus and haiku', () => {
    const scores = scoreTask('build schema validation pipeline', [], SIGNAL_REGISTRY);
    expect(scores.sonnet).toBeGreaterThan(scores.opus);
    expect(scores.sonnet).toBeGreaterThan(scores.haiku);
  });

  it('text containing "directory structure template": haiku score > opus and sonnet', () => {
    const scores = scoreTask('create directory structure template', [], SIGNAL_REGISTRY);
    expect(scores.haiku).toBeGreaterThan(scores.opus);
    expect(scores.haiku).toBeGreaterThan(scores.sonnet);
  });

  it('text containing both "safety" and "schema": scores both opus and sonnet, opus wins', () => {
    const scores = scoreTask('safety warden with schema validation', [], SIGNAL_REGISTRY);
    expect(scores.opus).toBeGreaterThan(0);
    expect(scores.sonnet).toBeGreaterThan(0);
    expect(scores.opus).toBeGreaterThan(scores.sonnet);
  });

  it('text containing no matching keywords: all scores are 0', () => {
    const scores = scoreTask('nothing relevant here at all', [], SIGNAL_REGISTRY);
    expect(scores.opus).toBe(0);
    expect(scores.sonnet).toBe(0);
    expect(scores.haiku).toBe(0);
  });

  it('returns an object with opus, sonnet, haiku number scores', () => {
    const scores = scoreTask('test text', [], SIGNAL_REGISTRY);
    expect(typeof scores.opus).toBe('number');
    expect(typeof scores.sonnet).toBe('number');
    expect(typeof scores.haiku).toBe('number');
  });

  it('filesModified containing test files (*.test.ts, *.spec.ts): adds sonnet bias', () => {
    const withoutFiles = scoreTask('some task', [], SIGNAL_REGISTRY);
    const withTestFiles = scoreTask('some task', ['foo.test.ts', 'bar.spec.ts'], SIGNAL_REGISTRY);
    expect(withTestFiles.sonnet).toBeGreaterThan(withoutFiles.sonnet);
  });

  it('filesModified containing config files (*.config.*, *.json, *.yaml): adds haiku bias', () => {
    const withoutFiles = scoreTask('some task', [], SIGNAL_REGISTRY);
    const withConfigFiles = scoreTask('some task', ['app.config.ts', 'data.json', 'settings.yaml'], SIGNAL_REGISTRY);
    expect(withConfigFiles.haiku).toBeGreaterThan(withoutFiles.haiku);
  });

  it('scores are case-insensitive ("Safety Warden" matches "safety warden")', () => {
    const lower = scoreTask('safety warden module', [], SIGNAL_REGISTRY);
    const mixed = scoreTask('Safety Warden Module', [], SIGNAL_REGISTRY);
    expect(lower.opus).toBe(mixed.opus);
  });

  it('multi-word phrases match as complete phrases, not individual words', () => {
    // "safety warden" should match "safety warden" but not just "safety" alone
    // (though "safety" is also a signal, "safety warden" gives additional score)
    const withPhrase = scoreTask('safety warden module', [], SIGNAL_REGISTRY);
    const withPartial = scoreTask('safety module', [], SIGNAL_REGISTRY);
    // "safety warden" has weight 5, "safety" alone has weight 3
    // The phrase match gives a higher opus score
    expect(withPhrase.opus).toBeGreaterThan(withPartial.opus);
  });
});

// ---------------------------------------------------------------------------
// assignModel -- model assignment classifier
// ---------------------------------------------------------------------------

describe('assignModel', () => {
  it('safety-heavy text: returns model opus with confidence and scores', () => {
    const result = assignModel({
      objective: 'implement safety warden with cultural sensitivity calibration',
      produces: ['safety-module.ts'],
      context: 'safety-critical personality engine',
    });
    expect(result.model).toBe('opus');
    expect(typeof result.confidence).toBe('number');
    expect(result.scores).toHaveProperty('opus');
    expect(result.scores).toHaveProperty('sonnet');
    expect(result.scores).toHaveProperty('haiku');
  });

  it('schema-heavy text: returns model sonnet', () => {
    const result = assignModel({
      objective: 'build schema validation pipeline with type system',
      produces: ['schema-validator.ts'],
      context: 'test suite for API surface documentation',
    });
    expect(result.model).toBe('sonnet');
  });

  it('config-heavy text: returns model haiku', () => {
    const result = assignModel({
      objective: 'create directory structure with configuration file and type stub',
      produces: ['config.json'],
      context: 'file template for simple transformation boilerplate scaffold',
    });
    expect(result.model).toBe('haiku');
  });

  it('when opus and sonnet tie: returns opus (ambiguous defaults to higher tier)', () => {
    // Use a custom registry with exact equal weights to force a tie
    const tiedRegistry = createSignalRegistry({
      opus: [{ pattern: 'tiebreaker', weight: 5 }],
      sonnet: [{ pattern: 'tiebreaker', weight: 5 }],
      haiku: [],
    });
    const result = assignModel(
      { objective: 'tiebreaker', produces: [], context: '' },
      tiedRegistry,
    );
    expect(result.model).toBe('opus');
  });

  it('when sonnet and haiku tie: returns sonnet (ambiguous defaults to higher tier)', () => {
    const tiedRegistry = createSignalRegistry({
      opus: [],
      sonnet: [{ pattern: 'tiebreaker', weight: 5 }],
      haiku: [{ pattern: 'tiebreaker', weight: 5 }],
    });
    const result = assignModel(
      { objective: 'tiebreaker', produces: [], context: '' },
      tiedRegistry,
    );
    expect(result.model).toBe('sonnet');
  });

  it('all scores 0 (no signal match): returns sonnet as default with low confidence', () => {
    const result = assignModel({
      objective: 'nothing relevant here',
      produces: [],
      context: 'no matching keywords at all',
    });
    expect(result.model).toBe('sonnet');
    expect(result.lowConfidence).toBe(true);
  });

  it('confidence is a number between 0 and 1', () => {
    const result = assignModel({
      objective: 'safety warden with cultural sensitivity',
      produces: [],
      context: '',
    });
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('confidence < 0.4 is flagged as lowConfidence: true', () => {
    // Use a registry where signals are evenly spread to produce low confidence
    const spreadRegistry = createSignalRegistry({
      opus: [{ pattern: 'spread', weight: 1 }],
      sonnet: [{ pattern: 'spread', weight: 1 }],
      haiku: [{ pattern: 'spread', weight: 1 }],
    });
    const result = assignModel(
      { objective: 'spread signal text', produces: [], context: '' },
      spreadRegistry,
    );
    // Confidence = 1/3 = 0.333... < 0.4
    expect(result.confidence).toBeLessThan(0.4);
    expect(result.lowConfidence).toBe(true);
  });

  it('confidence >= 0.4 is flagged as lowConfidence: false', () => {
    const result = assignModel({
      objective: 'implement safety warden with cultural sensitivity calibration and personality',
      produces: [],
      context: '',
    });
    expect(result.confidence).toBeGreaterThanOrEqual(0.4);
    expect(result.lowConfidence).toBe(false);
  });

  it('accepts a ComponentSpec-like input with filesModified', () => {
    const result = assignModel({
      objective: 'implement module',
      produces: ['output.ts'],
      context: 'context',
      filesModified: ['src/safety/module.ts'],
    });
    expect(result).toHaveProperty('model');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('scores');
  });

  it('pinned model override: returns pinned model with pinnedOverride and classifierRecommendation', () => {
    const result = assignModel({
      objective: 'implement safety warden with cultural sensitivity',
      produces: [],
      context: '',
      pinnedModel: 'haiku',
    });
    expect(result.model).toBe('haiku');
    expect(result.pinnedOverride).toBe(true);
    expect(result.confidence).toBe(1);
    expect(result.lowConfidence).toBe(false);
    // Classifier would have recommended opus, not haiku
    expect(result.classifierRecommendation).toBeDefined();
    expect(result.classifierRecommendation).not.toBe('haiku');
  });
});

// ---------------------------------------------------------------------------
// file pattern analysis -- files_modified signal boost
// ---------------------------------------------------------------------------

describe('file pattern analysis', () => {
  it('files ending in .test.ts or .spec.ts boost sonnet score', () => {
    const base = scoreTask('some task', [], SIGNAL_REGISTRY);
    const boosted = scoreTask('some task', ['foo.test.ts'], SIGNAL_REGISTRY);
    expect(boosted.sonnet).toBeGreaterThan(base.sonnet);

    const specBoosted = scoreTask('some task', ['bar.spec.ts'], SIGNAL_REGISTRY);
    expect(specBoosted.sonnet).toBeGreaterThan(base.sonnet);
  });

  it('files ending in .config.ts, .config.js, .json, .yaml, .yml boost haiku score', () => {
    const base = scoreTask('some task', [], SIGNAL_REGISTRY);

    for (const file of ['app.config.ts', 'app.config.js', 'data.json', 'settings.yaml', 'settings.yml']) {
      const boosted = scoreTask('some task', [file], SIGNAL_REGISTRY);
      expect(boosted.haiku).toBeGreaterThan(base.haiku);
    }
  });

  it('files with "safety" in path boost opus score', () => {
    const base = scoreTask('some task', [], SIGNAL_REGISTRY);
    const boosted = scoreTask('some task', ['src/safety/warden.ts'], SIGNAL_REGISTRY);
    expect(boosted.opus).toBeGreaterThan(base.opus);
  });

  it('file pattern boosts are additive with keyword signal scores', () => {
    const keywordsOnly = scoreTask('schema validation', [], SIGNAL_REGISTRY);
    const keywordsAndFiles = scoreTask('schema validation', ['foo.test.ts'], SIGNAL_REGISTRY);
    // Both should have sonnet > 0, but files add on top
    expect(keywordsAndFiles.sonnet).toBeGreaterThan(keywordsOnly.sonnet);
  });

  it('files with no recognized pattern contribute no additional score', () => {
    const base = scoreTask('some task', [], SIGNAL_REGISTRY);
    const withUnknown = scoreTask('some task', ['random-file.ts', 'another.tsx'], SIGNAL_REGISTRY);
    expect(withUnknown.opus).toBe(base.opus);
    expect(withUnknown.sonnet).toBe(base.sonnet);
    expect(withUnknown.haiku).toBe(base.haiku);
  });
});
