import { describe, it, expect } from 'vitest';
import {
  DescriptionQualityValidator,
  CAPABILITY_PATTERNS,
  ANTI_CAPABILITY_PATTERNS,
  USE_WHEN_PATTERN,
} from './description-quality.js';
import type { ValidateDescriptionOptions } from './description-quality.js';

describe('DescriptionQualityValidator', () => {
  const validator = new DescriptionQualityValidator();

  describe('capability statement detection', () => {
    it('should detect "Guides" as capability statement', () => {
      const result = validator.validate('Guides TypeScript project setup and configuration.');
      expect(result.hasCapabilityStatement).toBe(true);
    });

    it('should detect "Manages" as capability statement', () => {
      const result = validator.validate('Manages database migration workflows.');
      expect(result.hasCapabilityStatement).toBe(true);
    });

    it('should detect "Validates" as capability statement', () => {
      const result = validator.validate('Validates API response schemas.');
      expect(result.hasCapabilityStatement).toBe(true);
    });

    it('should not detect capability in bare text without action verbs', () => {
      const result = validator.validate('my skill');
      expect(result.hasCapabilityStatement).toBe(false);
    });

    it('should not detect capability in text without action verbs', () => {
      const result = validator.validate('just some text without action verbs');
      expect(result.hasCapabilityStatement).toBe(false);
    });
  });

  describe('Use when clause detection', () => {
    it('should detect "Use when" at start of description', () => {
      const result = validator.validate('Use when creating new React components');
      expect(result.hasUseWhenClause).toBe(true);
    });

    it('should detect "Use when" after capability statement', () => {
      const result = validator.validate('Guides setup. Use when starting a new project.');
      expect(result.hasUseWhenClause).toBe(true);
    });

    it('should not detect Use when clause in text without it', () => {
      const result = validator.validate('Handles TypeScript patterns');
      expect(result.hasUseWhenClause).toBe(false);
    });
  });

  describe('quality score calculation', () => {
    it('should score high for capability + Use when + activation', () => {
      const result = validator.validate('Guides TypeScript setup. Use when creating projects.');
      expect(result.qualityScore).toBeGreaterThanOrEqual(0.8);
    });

    it('should score ~0.6 for Use when + activation without capability', () => {
      const result = validator.validate('Use when working with databases');
      expect(result.qualityScore).toBeGreaterThanOrEqual(0.5);
      expect(result.qualityScore).toBeLessThanOrEqual(0.7);
    });

    it('should score low for generic description', () => {
      const result = validator.validate('Generic skill description.');
      expect(result.qualityScore).toBeLessThanOrEqual(0.2);
    });

    it('should score ~0.4 for capability only', () => {
      const result = validator.validate('Manages workflows.');
      expect(result.qualityScore).toBeGreaterThanOrEqual(0.3);
      expect(result.qualityScore).toBeLessThanOrEqual(0.5);
    });
  });

  describe('suggestions generation', () => {
    it('should suggest adding capability when missing', () => {
      const result = validator.validate('Use when working with databases');
      expect(result.suggestions.some(s => s.includes('Start with what this skill does'))).toBe(true);
    });

    it('should suggest adding Use when clause when missing', () => {
      const result = validator.validate('Manages workflows.');
      expect(result.suggestions.some(s => s.includes('Use when'))).toBe(true);
    });

    it('should have no suggestions when both present', () => {
      const result = validator.validate('Guides TypeScript setup. Use when creating projects.');
      expect(result.suggestions).toHaveLength(0);
    });
  });

  describe('warning generation', () => {
    it('should produce warning when qualityScore < 0.6', () => {
      const result = validator.validate('Generic skill description.');
      expect(result.qualityScore).toBeLessThan(0.6);
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('capability + Use when...');
    });

    it('should not produce warning when qualityScore >= 0.6', () => {
      const result = validator.validate('Guides TypeScript setup. Use when creating projects.');
      expect(result.qualityScore).toBeGreaterThanOrEqual(0.6);
      expect(result.warning).toBeUndefined();
    });
  });

  describe('exported patterns', () => {
    it('should export CAPABILITY_PATTERNS as array', () => {
      expect(Array.isArray(CAPABILITY_PATTERNS)).toBe(true);
      expect(CAPABILITY_PATTERNS.length).toBeGreaterThan(0);
    });

    it('should export USE_WHEN_PATTERN as RegExp', () => {
      expect(USE_WHEN_PATTERN).toBeInstanceOf(RegExp);
    });

    it('should export ANTI_CAPABILITY_PATTERNS as array of RegExp', () => {
      expect(Array.isArray(ANTI_CAPABILITY_PATTERNS)).toBe(true);
      expect(ANTI_CAPABILITY_PATTERNS.length).toBeGreaterThan(0);
      for (const p of ANTI_CAPABILITY_PATTERNS) {
        expect(p).toBeInstanceOf(RegExp);
      }
    });
  });

  // ==========================================================================
  // CSO discipline additions (Phase B)
  // ==========================================================================

  describe('anti-capability detection on descriptions (CSO discipline)', () => {
    it('flags "manages" as anti-capability hit', () => {
      const result = validator.validate('Manages TypeScript project workflows.');
      expect(result.antiCapabilityHits).toBeDefined();
      expect(result.antiCapabilityHits).toContain('manages');
    });

    it('flags "validates" as anti-capability hit', () => {
      const result = validator.validate('Validates API responses automatically.');
      expect(result.antiCapabilityHits).toBeDefined();
      expect(result.antiCapabilityHits).toContain('validates');
    });

    it('flags "orchestrates" as anti-capability hit', () => {
      const result = validator.validate('Orchestrates microservice deployments.');
      expect(result.antiCapabilityHits).toBeDefined();
      expect(result.antiCapabilityHits).toContain('orchestrates');
    });

    it('deduplicates repeated verbs', () => {
      const result = validator.validate('Manages state and manages effects.');
      expect(result.antiCapabilityHits).toBeDefined();
      expect(result.antiCapabilityHits?.filter(v => v === 'manages')).toHaveLength(1);
    });

    it('returns empty array when description is clean', () => {
      const result = validator.validate('Use when working with databases or schema migrations.');
      expect(result.antiCapabilityHits).toEqual([]);
    });
  });

  describe('trigger purity scoring', () => {
    it('scores high (>= 0.8) for Use-when phrasing without capability verbs', () => {
      const result = validator.validate('Use when debugging failing tests or tracking flaky CI runs.');
      expect(result.triggerPurity).toBeDefined();
      expect(result.triggerPurity!).toBeGreaterThanOrEqual(0.8);
    });

    it('scores low (<= 0.4) when anti-capability verbs present', () => {
      const result = validator.validate('Manages database migrations.');
      expect(result.triggerPurity).toBeDefined();
      expect(result.triggerPurity!).toBeLessThanOrEqual(0.4);
    });

    it('scores medium when no anti-capability verbs but no Use-when phrasing', () => {
      const result = validator.validate('A skill for debugging failing tests.');
      expect(result.triggerPurity).toBeDefined();
      expect(result.triggerPurity!).toBeGreaterThan(0.4);
      expect(result.triggerPurity!).toBeLessThan(0.8);
    });
  });

  describe('word count + budget enforcement', () => {
    it('reports wordCount for a short description', () => {
      const result = validator.validate('Use when creating React components.');
      // Whitespace split: ["Use", "when", "creating", "React", "components."] = 5
      expect(result.wordCount).toBe(5);
    });

    it('reports wordCount for a longer description', () => {
      const words = Array.from({ length: 50 }, (_, i) => `word${i}`).join(' ');
      const result = validator.validate(words);
      expect(result.wordCount).toBe(50);
    });

    it('fires wordCountBudgetExceeded at >200 words for frequency: always', () => {
      const words = Array.from({ length: 210 }, (_, i) => `word${i}`).join(' ');
      const result = validator.validate(words, { frequency: 'always' });
      expect(result.wordCountBudgetExceeded).toBeDefined();
      expect(result.wordCountBudgetExceeded?.budget).toBe(200);
      expect(result.wordCountBudgetExceeded?.actual).toBe(210);
      expect(result.wordCountBudgetExceeded?.frequency).toBe('always');
    });

    it('does not fire at exactly 200 words for frequency: always', () => {
      const words = Array.from({ length: 200 }, (_, i) => `word${i}`).join(' ');
      const result = validator.validate(words, { frequency: 'always' });
      expect(result.wordCountBudgetExceeded).toBeUndefined();
    });

    it('fires wordCountBudgetExceeded at >500 words for frequency: on-demand', () => {
      const words = Array.from({ length: 510 }, (_, i) => `word${i}`).join(' ');
      const result = validator.validate(words, { frequency: 'on-demand' });
      expect(result.wordCountBudgetExceeded).toBeDefined();
      expect(result.wordCountBudgetExceeded?.budget).toBe(500);
      expect(result.wordCountBudgetExceeded?.frequency).toBe('on-demand');
    });

    it('defaults to on-demand budget when no options given', () => {
      const words = Array.from({ length: 510 }, (_, i) => `word${i}`).join(' ');
      const result = validator.validate(words);
      expect(result.wordCountBudgetExceeded?.budget).toBe(500);
      expect(result.wordCountBudgetExceeded?.frequency).toBe('on-demand');
    });

    it('does not fire when 200 < wordCount <= 500 for on-demand', () => {
      const words = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ');
      const result = validator.validate(words, { frequency: 'on-demand' });
      expect(result.wordCountBudgetExceeded).toBeUndefined();
    });
  });

  describe('CSO rewrite suggestions', () => {
    it('suggests rewriting capability verbs found in description', () => {
      const result = validator.validate('Manages database migration workflows.');
      const hasRewriteHint = result.suggestions.some(s =>
        /Use when|Move .* out of description/i.test(s),
      );
      expect(hasRewriteHint).toBe(true);
    });

    it('suggests trimming when budget exceeded', () => {
      const words = Array.from({ length: 210 }, (_, i) => `word${i}`).join(' ');
      const result = validator.validate(words, { frequency: 'always' });
      const hasTrimHint = result.suggestions.some(s => /Trim to under 200/i.test(s));
      expect(hasTrimHint).toBe(true);
    });
  });
});

// =============================================================================
// Phase B PLAN-contract tests (locked field names from PLAN.md must_haves)
// These test the additive PLAN-specified aliases alongside the existing fields.
// =============================================================================

describe('ANTI_CAPABILITY_PATTERNS (Phase B)', () => {
  it('matches "manages" in a description', () => {
    expect(ANTI_CAPABILITY_PATTERNS.some(p => p.test('Manages workflow state.'))).toBe(true);
  });

  it('matches "validates" in a description', () => {
    expect(ANTI_CAPABILITY_PATTERNS.some(p => p.test('Validates GSD artifacts.'))).toBe(true);
  });

  it('matches "handles" in a description', () => {
    expect(ANTI_CAPABILITY_PATTERNS.some(p => p.test('Handles auth flows.'))).toBe(true);
  });

  it('does not match text with no capability verbs', () => {
    expect(ANTI_CAPABILITY_PATTERNS.some(p => p.test('Use when the user asks for help.'))).toBe(false);
  });
});

describe('triggerPurity + antiCapabilityMatches (Phase B PLAN contract)', () => {
  const v = new DescriptionQualityValidator();

  it('scores low when description starts with capability verb', () => {
    const r = v.validate('Manages workflow state and orchestrates handoffs.');
    expect(r.triggerPurity).toBeLessThan(0.5);
    expect(r.antiCapabilityMatches?.length).toBeGreaterThan(0);
  });

  it('scores high when description starts with "Use when..."', () => {
    const r = v.validate('Use when the user asks to clean up legacy code before refactor.');
    expect(r.triggerPurity).toBeGreaterThanOrEqual(0.5);
  });

  it('emits triggerPurityWarning when triggerPurity < 0.5', () => {
    const r = v.validate('Manages and orchestrates and configures.');
    expect(r.triggerPurityWarning).toBeDefined();
  });

  it('does not emit triggerPurityWarning when triggerPurity >= 0.5', () => {
    const r = v.validate('Use when the user asks for help before proceeding.');
    expect(r.triggerPurityWarning).toBeUndefined();
  });
});

describe('word count budget via ValidateDescriptionOptions (Phase B PLAN contract)', () => {
  const v = new DescriptionQualityValidator();
  const longDesc = (n: number) => Array(n).fill('word').join(' ');

  it('wordCountViolation set for always-on description > 200 words', () => {
    const opts: ValidateDescriptionOptions = { descriptionFrequency: 'always' };
    const r = v.validate(longDesc(201), opts);
    expect(r.wordCountViolation).toBeDefined();
    expect(r.wordCountViolation).toContain('200');
  });

  it('wordCountViolation set for on-demand description > 500 words', () => {
    const opts: ValidateDescriptionOptions = { descriptionFrequency: 'on-demand' };
    const r = v.validate(longDesc(501), opts);
    expect(r.wordCountViolation).toBeDefined();
    expect(r.wordCountViolation).toContain('500');
  });

  it('no wordCountViolation when within budget', () => {
    const opts: ValidateDescriptionOptions = { descriptionFrequency: 'always' };
    const r = v.validate('Use when the user needs help.', opts);
    expect(r.wordCountViolation).toBeUndefined();
  });

  it('no wordCountViolation when description-frequency not specified (defaults on-demand)', () => {
    const r = v.validate(longDesc(450));
    expect(r.wordCountViolation).toBeUndefined();
  });
});

describe('backward compatibility guard (Phase B)', () => {
  const v = new DescriptionQualityValidator();

  it('existing qualityScore remains a number 0..1', () => {
    const r = v.validate('Use when the user asks. Manages workflow.');
    expect(typeof r.qualityScore).toBe('number');
    expect(r.qualityScore).toBeGreaterThanOrEqual(0);
    expect(r.qualityScore).toBeLessThanOrEqual(1);
  });

  it('existing hasCapabilityStatement still populated', () => {
    const r = v.validate('Manages workflow.');
    expect(r.hasCapabilityStatement).toBe(true);
  });

  it('existing suggestions still generated as array', () => {
    const r = v.validate('short');
    expect(Array.isArray(r.suggestions)).toBe(true);
  });

  it('CAPABILITY_PATTERNS export still present and unchanged', async () => {
    const mod = await import('./description-quality.js');
    expect(mod.CAPABILITY_PATTERNS).toBeDefined();
    expect(mod.CAPABILITY_PATTERNS.length).toBeGreaterThan(0);
  });

  it('USE_WHEN_PATTERN export still present and unchanged', async () => {
    const mod = await import('./description-quality.js');
    expect(mod.USE_WHEN_PATTERN).toBeDefined();
    expect(mod.USE_WHEN_PATTERN.test('Use when foo')).toBe(true);
  });
});
