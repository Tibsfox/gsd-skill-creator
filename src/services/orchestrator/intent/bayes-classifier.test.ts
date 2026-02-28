/**
 * Tests for the GsdBayesClassifier wrapper.
 *
 * Verifies training on discovered commands, classification with
 * normalized confidence scoring, lifecycle filtering via allowedLabels,
 * and edge case handling.
 */

import { describe, it, expect } from 'vitest';
import { GsdBayesClassifier } from './bayes-classifier.js';
import type { GsdCommandMetadata } from '../discovery/types.js';

// ============================================================================
// Fixtures
// ============================================================================

const COMMANDS: GsdCommandMetadata[] = [
  {
    name: 'gsd:plan-phase',
    description: 'Create a detailed plan for a phase',
    argumentHint: '[phase] [--research]',
    objective: 'Break a phase into executable tasks with verification criteria',
    filePath: '/home/user/.claude/commands/gsd/plan-phase.md',
  },
  {
    name: 'gsd:progress',
    description: 'Show current project progress',
    objective: 'Display where you are in the roadmap',
    filePath: '/home/user/.claude/commands/gsd/progress.md',
  },
  {
    name: 'gsd:debug',
    description: 'Start systematic debugging',
    argumentHint: '"description"',
    objective: 'Debug issues with persistent state tracking',
    filePath: '/home/user/.claude/commands/gsd/debug.md',
  },
  {
    name: 'gsd:execute-phase',
    description: 'Execute plans for a phase',
    argumentHint: '[phase]',
    objective: 'Run phase plans with fresh context and atomic commits',
    filePath: '/home/user/.claude/commands/gsd/execute-phase.md',
  },
  {
    name: 'gsd:verify-work',
    description: 'Verify completed work against acceptance criteria',
    objective: 'Run user acceptance testing on phase output',
    filePath: '/home/user/.claude/commands/gsd/verify-work.md',
  },
];

// ============================================================================
// Tests
// ============================================================================

describe('GsdBayesClassifier', () => {
  it('classifies matching input to correct top label after training', () => {
    const classifier = new GsdBayesClassifier();
    classifier.train(COMMANDS);
    const results = classifier.classify('plan the next phase');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toBe('gsd:plan-phase');
  });

  it('normalizes confidence scores to sum to approximately 1.0', () => {
    const classifier = new GsdBayesClassifier();
    classifier.train(COMMANDS);
    const results = classifier.classify('show my progress');
    const sum = results.reduce((acc, r) => acc + r.confidence, 0);
    expect(sum).toBeCloseTo(1.0, 1);
  });

  it('returns scores sorted descending by confidence', () => {
    const classifier = new GsdBayesClassifier();
    classifier.train(COMMANDS);
    const results = classifier.classify('create a plan');
    for (let i = 1; i < results.length; i++) {
      expect(results[i].confidence).toBeLessThanOrEqual(results[i - 1].confidence);
    }
  });

  it('returns empty array when not trained', () => {
    const classifier = new GsdBayesClassifier();
    const results = classifier.classify('plan phase');
    expect(results).toEqual([]);
  });

  it('filters results by allowedLabels', () => {
    const classifier = new GsdBayesClassifier();
    classifier.train(COMMANDS);
    const allowed = new Set(['gsd:plan-phase', 'gsd:progress']);
    const results = classifier.classify('plan the phase', allowed);
    for (const r of results) {
      expect(allowed.has(r.label)).toBe(true);
    }
  });

  it('normalizes filtered results to sum to approximately 1.0', () => {
    const classifier = new GsdBayesClassifier();
    classifier.train(COMMANDS);
    const allowed = new Set(['gsd:plan-phase', 'gsd:progress']);
    const results = classifier.classify('plan the phase', allowed);
    const sum = results.reduce((acc, r) => acc + r.confidence, 0);
    expect(sum).toBeCloseTo(1.0, 1);
  });

  it('handles empty string input without crashing', () => {
    const classifier = new GsdBayesClassifier();
    classifier.train(COMMANDS);
    const results = classifier.classify('');
    expect(Array.isArray(results)).toBe(true);
    // Should still return results (even if confidence is spread evenly)
  });

  it('does not crash when training with duplicate commands', () => {
    const classifier = new GsdBayesClassifier();
    const duplicated = [...COMMANDS, ...COMMANDS];
    expect(() => classifier.train(duplicated)).not.toThrow();
    const results = classifier.classify('plan phase');
    expect(results.length).toBeGreaterThan(0);
  });

  it('reports isTrained as false before train(), true after', () => {
    const classifier = new GsdBayesClassifier();
    expect(classifier.isTrained).toBe(false);
    classifier.train(COMMANDS);
    expect(classifier.isTrained).toBe(true);
  });

  it('classifies debug-related input correctly', () => {
    const classifier = new GsdBayesClassifier();
    classifier.train(COMMANDS);
    const results = classifier.classify('debug the issue');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toBe('gsd:debug');
  });

  it('classifies execution-related input correctly', () => {
    const classifier = new GsdBayesClassifier();
    classifier.train(COMMANDS);
    const results = classifier.classify('build and execute the phase');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toBe('gsd:execute-phase');
  });
});
