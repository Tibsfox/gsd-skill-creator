import { describe, it, expect } from 'vitest';
import { InheritanceValidator, MAX_INHERITANCE_DEPTH } from './inheritance-validator.js';
import { SkillMetadata } from '../types/skill.js';

describe('InheritanceValidator', () => {
  const validator = new InheritanceValidator();

  describe('MAX_INHERITANCE_DEPTH', () => {
    it('should be 3', () => {
      expect(MAX_INHERITANCE_DEPTH).toBe(3);
    });
  });

  describe('validateChain', () => {
    it('should return valid for skills with no extends', () => {
      const skills = new Map<string, SkillMetadata>([
        ['skill-a', { name: 'skill-a', description: 'Skill A' }],
        ['skill-b', { name: 'skill-b', description: 'Skill B' }],
      ]);

      const result = validator.validateChain(skills);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should return valid for linear chain (no cycle)', () => {
      const skills = new Map<string, SkillMetadata>([
        ['skill-a', { name: 'skill-a', description: 'Base' }],
        ['skill-b', { name: 'skill-b', description: 'Extends A', extends: 'skill-a' }],
        ['skill-c', { name: 'skill-c', description: 'Extends B', extends: 'skill-b' }],
      ]);

      const result = validator.validateChain(skills);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return error for direct cycle (A extends B, B extends A)', () => {
      const skills = new Map<string, SkillMetadata>([
        ['skill-a', { name: 'skill-a', description: 'A', extends: 'skill-b' }],
        ['skill-b', { name: 'skill-b', description: 'B', extends: 'skill-a' }],
      ]);

      const result = validator.validateChain(skills);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Circular dependency detected');
    });

    it('should return error for indirect cycle (A->B->C->A)', () => {
      const skills = new Map<string, SkillMetadata>([
        ['skill-a', { name: 'skill-a', description: 'A', extends: 'skill-b' }],
        ['skill-b', { name: 'skill-b', description: 'B', extends: 'skill-c' }],
        ['skill-c', { name: 'skill-c', description: 'C', extends: 'skill-a' }],
      ]);

      const result = validator.validateChain(skills);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Circular dependency detected');
    });

    it('should return error for self-reference', () => {
      const skills = new Map<string, SkillMetadata>([
        ['skill-a', { name: 'skill-a', description: 'A', extends: 'skill-a' }],
      ]);

      const result = validator.validateChain(skills);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Circular dependency detected');
      expect(result.errors[0]).toContain('skill-a');
    });

    it('should include cycle path in error message', () => {
      const skills = new Map<string, SkillMetadata>([
        ['skill-a', { name: 'skill-a', description: 'A', extends: 'skill-b' }],
        ['skill-b', { name: 'skill-b', description: 'B', extends: 'skill-a' }],
      ]);

      const result = validator.validateChain(skills);

      expect(result.valid).toBe(false);
      // Should include both skills in the error path
      expect(result.errors[0]).toContain('skill-a');
      expect(result.errors[0]).toContain('skill-b');
    });

    it('should handle nested metadata.extensions format', () => {
      const skills = new Map<string, SkillMetadata>([
        ['skill-a', { name: 'skill-a', description: 'Base' }],
        ['skill-b', {
          name: 'skill-b',
          description: 'Extends A via nested format',
          metadata: {
            extensions: {
              'gsd-skill-creator': { extends: 'skill-a' },
            },
          },
        }],
      ]);

      const result = validator.validateChain(skills);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('validateDepth', () => {
    it('should return valid for depth 0 (no parent)', () => {
      const skills = new Map<string, SkillMetadata>([
        ['skill-a', { name: 'skill-a', description: 'Standalone' }],
      ]);

      const result = validator.validateDepth(skills);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return valid for depth 1', () => {
      const skills = new Map<string, SkillMetadata>([
        ['parent', { name: 'parent', description: 'Parent' }],
        ['child', { name: 'child', description: 'Child', extends: 'parent' }],
      ]);

      const result = validator.validateDepth(skills);

      expect(result.valid).toBe(true);
    });

    it('should return valid for depth 2', () => {
      const skills = new Map<string, SkillMetadata>([
        ['grandparent', { name: 'grandparent', description: 'GP' }],
        ['parent', { name: 'parent', description: 'P', extends: 'grandparent' }],
        ['child', { name: 'child', description: 'C', extends: 'parent' }],
      ]);

      const result = validator.validateDepth(skills);

      expect(result.valid).toBe(true);
    });

    it('should return valid for depth 3 (exactly at limit)', () => {
      const skills = new Map<string, SkillMetadata>([
        ['great-grandparent', { name: 'great-grandparent', description: 'GGP' }],
        ['grandparent', { name: 'grandparent', description: 'GP', extends: 'great-grandparent' }],
        ['parent', { name: 'parent', description: 'P', extends: 'grandparent' }],
        ['child', { name: 'child', description: 'C', extends: 'parent' }],
      ]);

      const result = validator.validateDepth(skills);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return error for depth 4 (exceeds limit)', () => {
      const skills = new Map<string, SkillMetadata>([
        ['root', { name: 'root', description: 'Root' }],
        ['level1', { name: 'level1', description: 'L1', extends: 'root' }],
        ['level2', { name: 'level2', description: 'L2', extends: 'level1' }],
        ['level3', { name: 'level3', description: 'L3', extends: 'level2' }],
        ['level4', { name: 'level4', description: 'L4', extends: 'level3' }],
      ]);

      const result = validator.validateDepth(skills);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('too deep');
      expect(result.errors[0]).toContain('4');
      expect(result.errors[0]).toContain('Maximum is 3');
    });

    it('should include chain names in depth error message', () => {
      const skills = new Map<string, SkillMetadata>([
        ['root', { name: 'root', description: 'Root' }],
        ['level1', { name: 'level1', description: 'L1', extends: 'root' }],
        ['level2', { name: 'level2', description: 'L2', extends: 'level1' }],
        ['level3', { name: 'level3', description: 'L3', extends: 'level2' }],
        ['level4', { name: 'level4', description: 'L4', extends: 'level3' }],
      ]);

      const result = validator.validateDepth(skills);

      // Error should include the chain of skill names
      expect(result.errors[0]).toContain('root');
      expect(result.errors[0]).toContain('level4');
    });
  });

  describe('checkImpactWarnings', () => {
    it('should return no warnings for skill with 0 dependents', () => {
      const skills = new Map<string, SkillMetadata>([
        ['leaf', { name: 'leaf', description: 'Leaf' }],
      ]);

      const result = validator.checkImpactWarnings(skills, 'leaf');

      expect(result.valid).toBe(true);
      expect(result.warnings).toEqual([]);
    });

    it('should return no warnings for skill with 1 dependent', () => {
      const skills = new Map<string, SkillMetadata>([
        ['base', { name: 'base', description: 'Base' }],
        ['child', { name: 'child', description: 'Child', extends: 'base' }],
      ]);

      const result = validator.checkImpactWarnings(skills, 'base');

      expect(result.valid).toBe(true);
      expect(result.warnings).toEqual([]);
    });

    it('should return warning for skill with 2+ dependents', () => {
      const skills = new Map<string, SkillMetadata>([
        ['base', { name: 'base', description: 'Base' }],
        ['child1', { name: 'child1', description: 'C1', extends: 'base' }],
        ['child2', { name: 'child2', description: 'C2', extends: 'base' }],
      ]);

      const result = validator.checkImpactWarnings(skills, 'base');

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('base');
      expect(result.warnings[0]).toContain('2');
    });

    it('should return warning with correct count for 3+ dependents', () => {
      const skills = new Map<string, SkillMetadata>([
        ['base', { name: 'base', description: 'Base' }],
        ['child1', { name: 'child1', description: 'C1', extends: 'base' }],
        ['child2', { name: 'child2', description: 'C2', extends: 'base' }],
        ['child3', { name: 'child3', description: 'C3', extends: 'base' }],
      ]);

      const result = validator.checkImpactWarnings(skills, 'base');

      expect(result.valid).toBe(true);
      expect(result.warnings[0]).toContain('3');
    });
  });

  describe('validate', () => {
    it('should merge cycle errors and depth errors', () => {
      // A valid set of skills with no issues
      const skills = new Map<string, SkillMetadata>([
        ['base', { name: 'base', description: 'Base' }],
        ['child', { name: 'child', description: 'Child', extends: 'base' }],
      ]);

      const result = validator.validate(skills);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return early on cycles (skip depth check)', () => {
      const skills = new Map<string, SkillMetadata>([
        ['skill-a', { name: 'skill-a', description: 'A', extends: 'skill-b' }],
        ['skill-b', { name: 'skill-b', description: 'B', extends: 'skill-a' }],
      ]);

      const result = validator.validate(skills);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Circular dependency detected');
      // Should NOT have depth errors since cycles make depth check meaningless
    });

    it('should catch depth errors when no cycles exist', () => {
      const skills = new Map<string, SkillMetadata>([
        ['root', { name: 'root', description: 'Root' }],
        ['level1', { name: 'level1', description: 'L1', extends: 'root' }],
        ['level2', { name: 'level2', description: 'L2', extends: 'level1' }],
        ['level3', { name: 'level3', description: 'L3', extends: 'level2' }],
        ['level4', { name: 'level4', description: 'L4', extends: 'level3' }],
      ]);

      const result = validator.validate(skills);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('too deep');
    });

    it('should work with both legacy and nested metadata formats', () => {
      const skills = new Map<string, SkillMetadata>([
        ['base', { name: 'base', description: 'Base' }],
        // Legacy format
        ['child-legacy', { name: 'child-legacy', description: 'Legacy', extends: 'base' }],
        // Nested format
        ['child-nested', {
          name: 'child-nested',
          description: 'Nested',
          metadata: {
            extensions: {
              'gsd-skill-creator': { extends: 'base' },
            },
          },
        }],
      ]);

      const result = validator.validate(skills);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});
