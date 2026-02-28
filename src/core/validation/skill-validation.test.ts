import { describe, it, expect } from 'vitest';
import {
  suggestFixedName,
  validateSkillNameStrict,
  OfficialSkillNameSchema,
  hasActivationPattern,
  validateDescriptionQuality,
  SkillInputSchema,
  SkillMetadataSchema,
} from './skill-validation.js';
import { validateSkillName, OFFICIAL_NAME_PATTERN } from '../types/skill.js';

describe('Skill Name Validation', () => {
  describe('OFFICIAL_NAME_PATTERN', () => {
    it('should match single character names', () => {
      expect(OFFICIAL_NAME_PATTERN.test('a')).toBe(true);
      expect(OFFICIAL_NAME_PATTERN.test('0')).toBe(true);
    });

    it('should match typical skill names', () => {
      expect(OFFICIAL_NAME_PATTERN.test('my-skill')).toBe(true);
      expect(OFFICIAL_NAME_PATTERN.test('skill123')).toBe(true);
      expect(OFFICIAL_NAME_PATTERN.test('a-b-c-d')).toBe(true);
    });

    it('should reject names starting with hyphen', () => {
      expect(OFFICIAL_NAME_PATTERN.test('-my-skill')).toBe(false);
    });

    it('should reject names ending with hyphen', () => {
      expect(OFFICIAL_NAME_PATTERN.test('my-skill-')).toBe(false);
    });
  });

  describe('validateSkillName', () => {
    describe('valid names (should pass)', () => {
      it('should accept single character name', () => {
        expect(validateSkillName('a')).toBe(true);
        expect(validateSkillName('x')).toBe(true);
        expect(validateSkillName('9')).toBe(true);
      });

      it('should accept typical skill name', () => {
        expect(validateSkillName('my-skill')).toBe(true);
      });

      it('should accept name with numbers', () => {
        expect(validateSkillName('skill123')).toBe(true);
        expect(validateSkillName('v2-api')).toBe(true);
        expect(validateSkillName('3d-render')).toBe(true);
      });

      it('should accept name with multiple non-consecutive hyphens', () => {
        expect(validateSkillName('a-b-c-d')).toBe(true);
        expect(validateSkillName('foo-bar-baz')).toBe(true);
      });

      it('should accept 64-char name (max length)', () => {
        const maxLengthName = 'a'.repeat(64);
        expect(validateSkillName(maxLengthName)).toBe(true);
      });
    });

    describe('invalid names (should fail)', () => {
      it('should reject name with leading hyphen', () => {
        expect(validateSkillName('-my-skill')).toBe(false);
      });

      it('should reject name with trailing hyphen', () => {
        expect(validateSkillName('my-skill-')).toBe(false);
      });

      it('should reject name with consecutive hyphens', () => {
        expect(validateSkillName('my--skill')).toBe(false);
        expect(validateSkillName('a---b')).toBe(false);
      });

      it('should reject name with uppercase letters', () => {
        expect(validateSkillName('MySkill')).toBe(false);
        expect(validateSkillName('SKILL')).toBe(false);
        expect(validateSkillName('mySkill')).toBe(false);
      });

      it('should reject name with underscore', () => {
        expect(validateSkillName('my_skill')).toBe(false);
      });

      it('should reject name with space', () => {
        expect(validateSkillName('my skill')).toBe(false);
      });

      it('should reject name exceeding 64 chars', () => {
        const tooLongName = 'a'.repeat(65);
        expect(validateSkillName(tooLongName)).toBe(false);
      });

      it('should reject empty name', () => {
        expect(validateSkillName('')).toBe(false);
      });

      it('should reject name with special characters', () => {
        expect(validateSkillName('my@skill')).toBe(false);
        expect(validateSkillName('my.skill')).toBe(false);
        expect(validateSkillName('my/skill')).toBe(false);
      });
    });
  });

  describe('suggestFixedName', () => {
    it('should return null for already-valid names', () => {
      expect(suggestFixedName('my-skill')).toBeNull();
      expect(suggestFixedName('a')).toBeNull();
      expect(suggestFixedName('skill123')).toBeNull();
    });

    it('should return null for empty input', () => {
      expect(suggestFixedName('')).toBeNull();
    });

    it('should return null for null/undefined-like input', () => {
      expect(suggestFixedName(null as unknown as string)).toBeNull();
      expect(suggestFixedName(undefined as unknown as string)).toBeNull();
    });

    it('should fix leading hyphen', () => {
      expect(suggestFixedName('-my-skill')).toBe('my-skill');
      expect(suggestFixedName('--my-skill')).toBe('my-skill');
    });

    it('should fix trailing hyphen', () => {
      expect(suggestFixedName('my-skill-')).toBe('my-skill');
      expect(suggestFixedName('my-skill--')).toBe('my-skill');
    });

    it('should fix consecutive hyphens', () => {
      expect(suggestFixedName('my--skill')).toBe('my-skill');
      expect(suggestFixedName('a---b---c')).toBe('a-b-c');
    });

    it('should lowercase input', () => {
      expect(suggestFixedName('MySkill')).toBe('myskill');
      expect(suggestFixedName('SKILL')).toBe('skill');
      expect(suggestFixedName('mySkill')).toBe('myskill');
    });

    it('should replace underscore with hyphen', () => {
      expect(suggestFixedName('my_skill')).toBe('my-skill');
      expect(suggestFixedName('a_b_c')).toBe('a-b-c');
    });

    it('should replace space with hyphen', () => {
      expect(suggestFixedName('my skill')).toBe('my-skill');
      expect(suggestFixedName('foo bar baz')).toBe('foo-bar-baz');
    });

    it('should replace other invalid chars with hyphen', () => {
      expect(suggestFixedName('my@skill')).toBe('my-skill');
      expect(suggestFixedName('my.skill')).toBe('my-skill');
      expect(suggestFixedName('my/skill')).toBe('my-skill');
    });

    it('should handle complex transformations', () => {
      expect(suggestFixedName('  My_Skill++  ')).toBe('my-skill');
      expect(suggestFixedName('--FOO__BAR--')).toBe('foo-bar');
    });

    it('should truncate names over 64 chars', () => {
      const longName = 'a'.repeat(70);
      const suggestion = suggestFixedName(longName);
      expect(suggestion).not.toBeNull();
      expect(suggestion!.length).toBeLessThanOrEqual(64);
    });

    it('should remove trailing hyphen from truncated names', () => {
      // Create a name that would have a hyphen at position 64 after truncation
      const longName = 'a'.repeat(63) + '-b';
      const suggestion = suggestFixedName(longName);
      expect(suggestion).not.toBeNull();
      expect(suggestion).not.toMatch(/-$/);
    });
  });

  describe('OfficialSkillNameSchema', () => {
    describe('valid names', () => {
      it('should accept valid names', () => {
        expect(OfficialSkillNameSchema.safeParse('a').success).toBe(true);
        expect(OfficialSkillNameSchema.safeParse('my-skill').success).toBe(true);
        expect(OfficialSkillNameSchema.safeParse('skill123').success).toBe(true);
        expect(OfficialSkillNameSchema.safeParse('a-b-c-d').success).toBe(true);
      });
    });

    describe('invalid names with suggestions', () => {
      it('should reject leading hyphen with suggestion', () => {
        const result = OfficialSkillNameSchema.safeParse('-my-skill');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('my-skill');
        }
      });

      it('should reject trailing hyphen with suggestion', () => {
        const result = OfficialSkillNameSchema.safeParse('my-skill-');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('my-skill');
        }
      });

      it('should reject consecutive hyphens with suggestion', () => {
        const result = OfficialSkillNameSchema.safeParse('my--skill');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('my-skill');
        }
      });

      it('should reject uppercase with suggestion', () => {
        const result = OfficialSkillNameSchema.safeParse('MySkill');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('myskill');
        }
      });

      it('should reject empty name', () => {
        const result = OfficialSkillNameSchema.safeParse('');
        expect(result.success).toBe(false);
      });

      it('should reject name over 64 chars with truncation suggestion', () => {
        const longName = 'a'.repeat(65);
        const result = OfficialSkillNameSchema.safeParse(longName);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('64');
        }
      });
    });
  });

  describe('validateSkillNameStrict', () => {
    it('should return valid for valid names', () => {
      const result = validateSkillNameStrict('my-skill');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.suggestion).toBeUndefined();
    });

    it('should return errors and suggestion for invalid names', () => {
      const result = validateSkillNameStrict('-my-skill');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.suggestion).toBe('my-skill');
    });

    it('should return multiple errors for multiple issues', () => {
      // This name has uppercase AND invalid chars, but the first regex failure stops it
      const result = validateSkillNameStrict('-MySkill');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.suggestion).toBe('myskill');
    });

    it('should handle consecutive hyphens', () => {
      const result = validateSkillNameStrict('my--skill');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('consecutive'))).toBe(true);
      expect(result.suggestion).toBe('my-skill');
    });

    it('should handle empty string', () => {
      const result = validateSkillNameStrict('');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Empty input has no suggestion
    });
  });
});

describe('Description Quality Validation', () => {
  describe('hasActivationPattern', () => {
    it('should detect "Use when" pattern', () => {
      expect(hasActivationPattern('Guide for TypeScript. Use when setting up a new project.')).toBe(true);
      expect(hasActivationPattern('USE WHEN working with databases.')).toBe(true);
    });

    it('should detect "when user/working/editing" patterns', () => {
      expect(hasActivationPattern('Activates when user mentions TypeScript.')).toBe(true);
      expect(hasActivationPattern('Runs when working with config files.')).toBe(true);
      expect(hasActivationPattern('Helps when editing package.json.')).toBe(true);
      expect(hasActivationPattern('When creating new components.')).toBe(true);
      expect(hasActivationPattern('Applied when reviewing PRs.')).toBe(true);
      expect(hasActivationPattern('Used when debugging issues.')).toBe(true);
    });

    it('should detect "activate when" pattern', () => {
      expect(hasActivationPattern('Activate when deploying to production.')).toBe(true);
    });

    it('should detect "for handling/processing" patterns', () => {
      expect(hasActivationPattern('For handling database migrations.')).toBe(true);
      expect(hasActivationPattern('For processing API responses.')).toBe(true);
      expect(hasActivationPattern('For working with Docker containers.')).toBe(true);
      expect(hasActivationPattern('For managing environment variables.')).toBe(true);
    });

    it('should detect "helps with/to" patterns', () => {
      expect(hasActivationPattern('Helps with TypeScript configuration.')).toBe(true);
      expect(hasActivationPattern('Helps to set up testing.')).toBe(true);
      expect(hasActivationPattern('This skill help with debugging.')).toBe(true);
    });

    it('should detect "asks/mentions/says" patterns', () => {
      expect(hasActivationPattern('When user asks "how do I deploy?"')).toBe(true);
      expect(hasActivationPattern('Triggered when user mentions "docker".')).toBe(true);
      expect(hasActivationPattern('Activates when user says something about testing.')).toBe(true);
    });

    it('should return false for generic descriptions without triggers', () => {
      expect(hasActivationPattern('Guide for TypeScript patterns.')).toBe(false);
      expect(hasActivationPattern('A skill for database operations.')).toBe(false);
      expect(hasActivationPattern('Handles code review workflows.')).toBe(false);
      expect(hasActivationPattern('Documentation generator tool.')).toBe(false);
    });
  });

  describe('validateDescriptionQuality', () => {
    it('should return success for activation-friendly descriptions', () => {
      const result = validateDescriptionQuality('Guide for git workflows. Use when committing changes or reviewing PRs.');
      expect(result.hasActivationTriggers).toBe(true);
      expect(result.warning).toBeUndefined();
      expect(result.suggestions).toBeUndefined();
    });

    it('should return warning for descriptions lacking triggers', () => {
      const result = validateDescriptionQuality('Guide for TypeScript patterns (seen 5 times).');
      expect(result.hasActivationTriggers).toBe(false);
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('trigger phrases');
    });

    it('should include suggestions for improving descriptions', () => {
      const result = validateDescriptionQuality('Generic skill description.');
      expect(result.hasActivationTriggers).toBe(false);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      expect(result.suggestions!.some(s => s.includes('Use when'))).toBe(true);
    });

    it('should accept various activation pattern formats', () => {
      const goodDescriptions = [
        'Use when working with React components.',
        'Helps with database query optimization.',
        'For handling API authentication.',
        'Activates when user debugging performance issues.',
        'When creating new microservices.',
      ];

      for (const desc of goodDescriptions) {
        const result = validateDescriptionQuality(desc);
        expect(result.hasActivationTriggers).toBe(true);
      }
    });

    // New tests for enriched description quality fields (backward compatible)
    it('should include new quality fields in result', () => {
      const result = validateDescriptionQuality('Guides setup. Use when testing.');
      expect(result).toHaveProperty('hasCapabilityStatement');
      expect(result).toHaveProperty('hasUseWhenClause');
      expect(result).toHaveProperty('qualityScore');
    });

    it('should preserve existing behavior when new fields are present', () => {
      // Existing tests expect hasActivationTriggers, warning, suggestions to work identically
      const result = validateDescriptionQuality('Generic skill description.');
      expect(result.hasActivationTriggers).toBe(false);
      expect(result.warning).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });

    it('should return enriched result for high-quality description', () => {
      const result = validateDescriptionQuality('Guides TypeScript project setup. Use when creating new TypeScript projects.');
      expect(result.hasCapabilityStatement).toBe(true);
      expect(result.hasUseWhenClause).toBe(true);
      expect(result.qualityScore).toBeGreaterThanOrEqual(0.8);
      expect(result.hasActivationTriggers).toBe(true);
    });
  });
});

describe('Spec Alignment (SPEC-01, SPEC-04, SPEC-06)', () => {
  /** Helper to build a minimal valid skill input object */
  function validSkill(overrides: Record<string, unknown> = {}) {
    return {
      name: 'test-skill',
      description: 'Use when testing spec alignment features.',
      ...overrides,
    };
  }

  describe('allowed-tools dual-format parsing', () => {
    it('should accept allowed-tools as array', () => {
      const result = SkillInputSchema.safeParse(validSkill({ 'allowed-tools': ['Read', 'Grep'] }));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data['allowed-tools']).toEqual(['Read', 'Grep']);
      }
    });

    it('should accept allowed-tools as space-delimited string and normalize to array', () => {
      const result = SkillInputSchema.safeParse(validSkill({ 'allowed-tools': 'Read Grep' }));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data['allowed-tools']).toEqual(['Read', 'Grep']);
      }
    });

    it('should accept single tool string and normalize to array', () => {
      const result = SkillInputSchema.safeParse(validSkill({ 'allowed-tools': 'Read' }));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data['allowed-tools']).toEqual(['Read']);
      }
    });

    it('should accept empty string and normalize to empty array', () => {
      const result = SkillInputSchema.safeParse(validSkill({ 'allowed-tools': '' }));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data['allowed-tools']).toEqual([]);
      }
    });

    it('should accept empty array', () => {
      const result = SkillInputSchema.safeParse(validSkill({ 'allowed-tools': [] }));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data['allowed-tools']).toEqual([]);
      }
    });

    it('should also work on SkillMetadataSchema', () => {
      const result = SkillMetadataSchema.safeParse(validSkill({ 'allowed-tools': 'Read Grep Bash' }));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data['allowed-tools']).toEqual(['Read', 'Grep', 'Bash']);
      }
    });
  });

  describe('license field', () => {
    it('should accept license: MIT', () => {
      const result = SkillInputSchema.safeParse(validSkill({ license: 'MIT' }));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.license).toBe('MIT');
      }
    });

    it('should accept license: Apache-2.0', () => {
      const result = SkillInputSchema.safeParse(validSkill({ license: 'Apache-2.0' }));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.license).toBe('Apache-2.0');
      }
    });

    it('should allow skill without license field', () => {
      const result = SkillInputSchema.safeParse(validSkill());
      expect(result.success).toBe(true);
    });
  });

  describe('compatibility field', () => {
    it('should accept compatibility string', () => {
      const result = SkillInputSchema.safeParse(validSkill({ compatibility: 'Requires Node.js 18+' }));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.compatibility).toBe('Requires Node.js 18+');
      }
    });

    it('should reject compatibility over 500 chars', () => {
      const result = SkillInputSchema.safeParse(validSkill({ compatibility: 'x'.repeat(501) }));
      expect(result.success).toBe(false);
    });

    it('should allow skill without compatibility field', () => {
      const result = SkillInputSchema.safeParse(validSkill());
      expect(result.success).toBe(true);
    });
  });

  describe('name validation edge cases (SPEC-06)', () => {
    it('should reject name with only hyphens ---', () => {
      expect(validateSkillName('---')).toBe(false);
    });

    it('should reject single-char hyphen -', () => {
      expect(validateSkillName('-')).toBe(false);
    });
  });

  describe('description validation (SPEC-06)', () => {
    it('should reject empty description', () => {
      const result = SkillInputSchema.safeParse({ name: 'test-skill', description: '' });
      expect(result.success).toBe(false);
    });

    it('should reject description over 1024 chars', () => {
      const result = SkillInputSchema.safeParse({ name: 'test-skill', description: 'x'.repeat(1025) });
      expect(result.success).toBe(false);
    });
  });
});
