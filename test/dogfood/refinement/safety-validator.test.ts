import { describe, it, expect } from 'vitest';
import type { SkillUpdate, KnowledgePatch } from '../../../src/dogfood/refinement/types.js';
import { validateSafety } from '../../../src/dogfood/refinement/safety-validator.js';
import type { SafetyValidationResult, TestRunResult, CheckpointState } from '../../../src/dogfood/refinement/safety-validator.js';

// --- Factories ---

function makeSkillUpdate(overrides: Partial<SkillUpdate> = {}): SkillUpdate {
  return {
    id: 'skill-001',
    skillName: 'fourier-transform',
    action: 'refine',
    currentDefinition: 'The Fourier transform converts signals between time and frequency domains.',
    proposedDefinition: 'The Fourier transform decomposes a function into its constituent frequency components.',
    triggerPatterns: ['Fourier Transform'],
    complexPlanePosition: { theta: Math.PI / 4, radius: 0.6 },
    evidenceFromTextbook: 'Chapter 5',
    evidenceFromEcosystem: 'skills/fourier-transform/SKILL.md',
    ...overrides,
  };
}

function makePatch(overrides: Partial<KnowledgePatch> = {}): KnowledgePatch {
  return {
    id: 'patch-001',
    targetDocument: 'skills/fourier/SKILL.md',
    targetSection: 'definition',
    gapId: 'gap-001',
    patchType: 'update',
    currentContent: 'Old content.',
    proposedContent: 'New content.',
    rationale: 'Evidence.',
    confidence: 0.85,
    requiresReview: true,
    reviewNotes: 'Check this.',
    ...overrides,
  };
}

function makeTestRunResult(overrides: Partial<TestRunResult> = {}): TestRunResult {
  return {
    total: 16790,
    passed: 16790,
    failed: 0,
    skipped: 0,
    ...overrides,
  };
}

function makeCheckpointState(overrides: Partial<CheckpointState> = {}): CheckpointState {
  const data = overrides.data ?? { missionId: 'v1.40', step: 42 };
  const crypto = require('crypto');
  const integrityHash = overrides.integrityHash ?? crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  return { data, integrityHash };
}

describe('safety-validator', () => {
  describe('bounded learning (SAFETY-01)', () => {
    it('passes when skill change is <= 20%', () => {
      // Current and proposed are similar (small edit)
      const skill = makeSkillUpdate({
        currentDefinition: 'The Fourier transform converts signals between time and frequency domains.',
        proposedDefinition: 'The Fourier transform converts signals between time and frequency domains effectively.',
      });
      const result = validateSafety({ skillUpdates: [skill] });

      expect(result.checks.boundedLearning).toBe(true);
      expect(result.violations.filter(v => v.includes('Bounded learning'))).toHaveLength(0);
    });

    it('fails when skill change exceeds 20%', () => {
      const skill = makeSkillUpdate({
        currentDefinition: 'Short original.',
        proposedDefinition: 'A completely different and much longer replacement text that shares almost nothing with the original definition whatsoever.',
      });
      const result = validateSafety({ skillUpdates: [skill] });

      expect(result.checks.boundedLearning).toBe(false);
      expect(result.violations.some(v => v.includes('Bounded learning violation'))).toBe(true);
      expect(result.violations.some(v => v.includes('fourier-transform'))).toBe(true);
    });

    it('create actions are exempt from 20% check', () => {
      const skill = makeSkillUpdate({
        action: 'create',
        currentDefinition: undefined,
        proposedDefinition: 'Entirely new skill definition that is completely novel.',
      });
      const result = validateSafety({ skillUpdates: [skill] });

      expect(result.checks.boundedLearning).toBe(true);
    });

    it('passes by default when no skill updates provided', () => {
      const result = validateSafety({});
      expect(result.checks.boundedLearning).toBe(true);
    });
  });

  describe('checkpoint integrity (SAFETY-02)', () => {
    it('passes with valid checkpoint matching hash', () => {
      const checkpoint = makeCheckpointState();
      const result = validateSafety({ checkpoint });

      expect(result.checks.checkpointIntegrity).toBe(true);
    });

    it('fails with mismatched hash', () => {
      const checkpoint = makeCheckpointState({
        integrityHash: 'deadbeef0000000000000000000000000000000000000000000000000000dead',
      });
      const result = validateSafety({ checkpoint });

      expect(result.checks.checkpointIntegrity).toBe(false);
      expect(result.violations.some(v => v.includes('Checkpoint integrity violation'))).toBe(true);
    });

    it('passes when checkpoint is null', () => {
      const result = validateSafety({ checkpoint: null });
      expect(result.checks.checkpointIntegrity).toBe(true);
    });

    it('passes when checkpoint is undefined', () => {
      const result = validateSafety({});
      expect(result.checks.checkpointIntegrity).toBe(true);
    });
  });

  describe('no auto-application (SAFETY-03)', () => {
    it('passes when all patches have requiresReview=true', () => {
      const patches = [
        makePatch({ id: 'p1', requiresReview: true }),
        makePatch({ id: 'p2', requiresReview: true }),
      ];
      const result = validateSafety({ patches });

      expect(result.checks.noAutoApplication).toBe(true);
    });

    it('fails when any patch has requiresReview=false', () => {
      const patches = [
        makePatch({ id: 'p1', requiresReview: true }),
        makePatch({ id: 'p2', requiresReview: false }),
      ];
      const result = validateSafety({ patches });

      expect(result.checks.noAutoApplication).toBe(false);
      expect(result.violations.some(v => v.includes('Auto-application violation'))).toBe(true);
      expect(result.violations.some(v => v.includes('p2'))).toBe(true);
    });

    it('passes by default when no patches provided', () => {
      const result = validateSafety({});
      expect(result.checks.noAutoApplication).toBe(true);
    });
  });

  describe('regression test gate (SAFETY-04)', () => {
    it('passes when all tests pass with sufficient count', () => {
      const result = validateSafety({
        testRunResult: makeTestRunResult({ total: 16790, passed: 16790, failed: 0 }),
      });

      expect(result.checks.regressionPassing).toBe(true);
    });

    it('fails when any test fails', () => {
      const result = validateSafety({
        testRunResult: makeTestRunResult({ total: 16790, passed: 16789, failed: 1 }),
      });

      expect(result.checks.regressionPassing).toBe(false);
      expect(result.violations.some(v => v.includes('Regression detected: 1 test(s) failed'))).toBe(true);
    });

    it('fails when test count is below minimum', () => {
      const result = validateSafety({
        testRunResult: makeTestRunResult({ total: 100, passed: 100, failed: 0 }),
      });

      expect(result.checks.regressionPassing).toBe(false);
      expect(result.violations.some(v => v.includes('Test count mismatch'))).toBe(true);
      expect(result.violations.some(v => v.includes('100'))).toBe(true);
    });

    it('passes by default when no test result provided', () => {
      const result = validateSafety({});
      expect(result.checks.regressionPassing).toBe(true);
    });
  });

  describe('combined validation', () => {
    it('returns passed=true when all checks pass', () => {
      const result = validateSafety({
        skillUpdates: [makeSkillUpdate({
          currentDefinition: 'Original text here.',
          proposedDefinition: 'Original text here slightly modified.',
        })],
        patches: [makePatch({ requiresReview: true })],
        checkpoint: null,
        testRunResult: makeTestRunResult(),
      });

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.checks.boundedLearning).toBe(true);
      expect(result.checks.checkpointIntegrity).toBe(true);
      expect(result.checks.noAutoApplication).toBe(true);
      expect(result.checks.regressionPassing).toBe(true);
    });

    it('returns passed=false with multiple violations', () => {
      const result = validateSafety({
        skillUpdates: [makeSkillUpdate({
          currentDefinition: 'Short.',
          proposedDefinition: 'A completely different and much longer text that is nothing like the original.',
        })],
        patches: [makePatch({ requiresReview: false })],
        testRunResult: makeTestRunResult({ total: 16790, passed: 16780, failed: 10 }),
      });

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(3);
    });

    it('SafetyValidationResult has correct shape', () => {
      const result = validateSafety({});

      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('boundedLearning');
      expect(result.checks).toHaveProperty('checkpointIntegrity');
      expect(result.checks).toHaveProperty('noAutoApplication');
      expect(result.checks).toHaveProperty('regressionPassing');
      expect(typeof result.passed).toBe('boolean');
      expect(Array.isArray(result.violations)).toBe(true);
    });
  });
});
