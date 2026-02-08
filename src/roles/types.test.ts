/**
 * Tests for role Zod schemas and types.
 *
 * Covers:
 * - Valid RoleDefinition with all fields parses successfully
 * - Minimal role (name only) gets defaults: extends=null, skills=[], constraints=[]
 * - Extra unknown fields pass through (.passthrough() forward-compat)
 * - Invalid name (empty string) fails validation
 * - model must be one of: 'sonnet', 'opus', 'haiku', 'inherit'
 * - tools must be string (not array)
 */

import { describe, it, expect } from 'vitest';
import { RoleDefinitionSchema } from './types.js';

// ============================================================================
// RoleDefinitionSchema
// ============================================================================

describe('RoleDefinitionSchema', () => {
  it('parses a valid role with all fields', () => {
    const result = RoleDefinitionSchema.safeParse({
      name: 'security-reviewer',
      description: 'Reviews code for security issues',
      extends: 'base-reviewer',
      skills: ['code-review', 'security-scan'],
      constraints: ['Never modify files', 'Read-only access'],
      tools: 'Bash,Read,Grep',
      model: 'opus',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('security-reviewer');
      expect(result.data.description).toBe('Reviews code for security issues');
      expect(result.data.extends).toBe('base-reviewer');
      expect(result.data.skills).toEqual(['code-review', 'security-scan']);
      expect(result.data.constraints).toEqual(['Never modify files', 'Read-only access']);
      expect(result.data.tools).toBe('Bash,Read,Grep');
      expect(result.data.model).toBe('opus');
    }
  });

  it('defaults extends=null, skills=[], constraints=[] for minimal role', () => {
    const result = RoleDefinitionSchema.safeParse({
      name: 'minimal-role',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('minimal-role');
      expect(result.data.extends).toBeNull();
      expect(result.data.skills).toEqual([]);
      expect(result.data.constraints).toEqual([]);
      expect(result.data.description).toBeUndefined();
      expect(result.data.tools).toBeUndefined();
      expect(result.data.model).toBeUndefined();
    }
  });

  it('allows unknown fields via passthrough', () => {
    const result = RoleDefinitionSchema.safeParse({
      name: 'extended-role',
      custom_field: 'hello',
      priority: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).custom_field).toBe('hello');
      expect((result.data as Record<string, unknown>).priority).toBe(5);
    }
  });

  it('rejects empty name string', () => {
    const result = RoleDefinitionSchema.safeParse({
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid model values', () => {
    for (const model of ['sonnet', 'opus', 'haiku', 'inherit'] as const) {
      const result = RoleDefinitionSchema.safeParse({
        name: `role-${model}`,
        model,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe(model);
      }
    }
  });

  it('rejects unknown model value', () => {
    const result = RoleDefinitionSchema.safeParse({
      name: 'bad-model',
      model: 'gpt-4',
    });
    expect(result.success).toBe(false);
  });

  it('rejects array for tools field (must be string)', () => {
    const result = RoleDefinitionSchema.safeParse({
      name: 'bad-tools',
      tools: ['Bash', 'Read'],
    });
    expect(result.success).toBe(false);
  });
});
