import { describe, it, expect } from 'vitest';
import { DescriptionQualityValidator, CAPABILITY_PATTERNS, USE_WHEN_PATTERN } from './description-quality.js';

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
  });
});
