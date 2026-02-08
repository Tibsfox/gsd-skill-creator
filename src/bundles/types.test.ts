/**
 * Tests for bundle Zod schemas and types.
 *
 * Covers:
 * - BundleSkillEntrySchema validates name + required + status with defaults
 * - BundleSkillEntrySchema rejects empty name
 * - BundleSkillEntrySchema preserves unknown fields via .passthrough()
 * - BundleDefinitionSchema validates full bundle with name, skills (min 1)
 * - BundleDefinitionSchema rejects missing name, empty skills array
 * - BundleDefinitionSchema defaults: version=1, status on entries
 * - BundleDefinitionSchema preserves unknown fields via .passthrough()
 */

import { describe, it, expect } from 'vitest';
import { BundleSkillEntrySchema, BundleDefinitionSchema } from './types.js';

// ============================================================================
// BundleSkillEntrySchema
// ============================================================================

describe('BundleSkillEntrySchema', () => {
  it('validates a skill entry with name and required', () => {
    const result = BundleSkillEntrySchema.safeParse({
      name: 'ts',
      required: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('ts');
      expect(result.data.required).toBe(true);
    }
  });

  it('defaults required to true and status to pending', () => {
    const result = BundleSkillEntrySchema.safeParse({
      name: 'react',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.required).toBe(true);
      expect(result.data.status).toBe('pending');
    }
  });

  it('rejects empty name', () => {
    const result = BundleSkillEntrySchema.safeParse({
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('preserves unknown fields via passthrough', () => {
    const result = BundleSkillEntrySchema.safeParse({
      name: 'ts',
      custom_priority: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).custom_priority).toBe(10);
    }
  });
});

// ============================================================================
// BundleDefinitionSchema
// ============================================================================

describe('BundleDefinitionSchema', () => {
  it('validates a full bundle with all fields', () => {
    const result = BundleDefinitionSchema.safeParse({
      name: 'frontend-dev',
      description: 'Frontend development bundle',
      version: 2,
      phase: 'implementation',
      skills: [
        { name: 'ts', required: true },
        { name: 'react', required: false },
      ],
      created_at: '2026-02-08',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('frontend-dev');
      expect(result.data.description).toBe('Frontend development bundle');
      expect(result.data.version).toBe(2);
      expect(result.data.phase).toBe('implementation');
      expect(result.data.skills).toHaveLength(2);
      expect(result.data.skills[0].name).toBe('ts');
      expect(result.data.skills[1].required).toBe(false);
      expect(result.data.created_at).toBe('2026-02-08');
    }
  });

  it('defaults version to 1 for minimal bundle', () => {
    const result = BundleDefinitionSchema.safeParse({
      name: 'minimal',
      skills: [{ name: 'ts' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(1);
      expect(result.data.description).toBeUndefined();
      expect(result.data.phase).toBeUndefined();
    }
  });

  it('rejects missing name', () => {
    const result = BundleDefinitionSchema.safeParse({
      skills: [{ name: 'ts' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty skills array', () => {
    const result = BundleDefinitionSchema.safeParse({
      name: 'empty-skills',
      skills: [],
    });
    expect(result.success).toBe(false);
  });

  it('preserves unknown fields via passthrough', () => {
    const result = BundleDefinitionSchema.safeParse({
      name: 'extended',
      skills: [{ name: 'ts' }],
      custom_field: 'hello',
      priority: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).custom_field).toBe('hello');
      expect((result.data as Record<string, unknown>).priority).toBe(5);
    }
  });
});
