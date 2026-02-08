/**
 * Tests for CapabilityValidator.
 *
 * Validates that capability references (use/after/adapt) are checked against
 * a manifest, create verbs bypass validation, and unknown capabilities
 * produce structured warnings.
 */

import { describe, it, expect } from 'vitest';
import { CapabilityValidator } from './capability-validator.js';
import type { CapabilityManifest, CapabilityRef } from './types.js';

/**
 * Build a minimal manifest for testing.
 */
function buildManifest(
  overrides: Partial<CapabilityManifest> = {}
): CapabilityManifest {
  return {
    version: 1,
    generatedAt: '2026-01-01T00:00:00Z',
    contentHash: 'abc123',
    skills: [
      { name: 'beautiful-commits', description: 'Commit formatting', scope: 'user', contentHash: 'a1' },
      { name: 'typescript-patterns', description: 'TS patterns', scope: 'project', contentHash: 'a2' },
    ],
    agents: [
      { name: 'gsd-executor', description: 'Executes plans', scope: 'project', contentHash: 'b1' },
    ],
    teams: [
      { name: 'devops-team', scope: 'project', memberCount: 3, contentHash: 'c1' },
    ],
    ...overrides,
  };
}

describe('CapabilityValidator', () => {
  const manifest = buildManifest();
  const validator = new CapabilityValidator(manifest);

  it('known capabilities pass validation', () => {
    const declarations: CapabilityRef[] = [
      { verb: 'use', type: 'skill', name: 'beautiful-commits' },
      { verb: 'after', type: 'agent', name: 'gsd-executor' },
      { verb: 'adapt', type: 'team', name: 'devops-team' },
    ];

    const result = validator.validateDeclarations(declarations, 'Phase 55');
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it('unknown capability produces a warning', () => {
    const declarations: CapabilityRef[] = [
      { verb: 'use', type: 'skill', name: 'nonexistent' },
    ];

    const result = validator.validateDeclarations(declarations, 'Phase 55');
    expect(result.valid).toBe(false);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toEqual({
      capability: 'skill/nonexistent',
      verb: 'use',
      source: 'Phase 55',
      message: expect.stringContaining('nonexistent'),
    });
  });

  it('create verb bypasses validation', () => {
    const declarations: CapabilityRef[] = [
      { verb: 'create', type: 'agent', name: 'new-agent' },
    ];

    const result = validator.validateDeclarations(declarations, '55-01-PLAN.md');
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it('mixed valid and invalid produces warnings for invalid only', () => {
    const declarations: CapabilityRef[] = [
      { verb: 'use', type: 'skill', name: 'beautiful-commits' },
      { verb: 'use', type: 'agent', name: 'gsd-executor' },
      { verb: 'use', type: 'skill', name: 'unknown-skill' },
    ];

    const result = validator.validateDeclarations(declarations, 'Phase 55');
    expect(result.valid).toBe(false);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].capability).toBe('skill/unknown-skill');
    expect(result.warnings[0].verb).toBe('use');
    expect(result.warnings[0].source).toBe('Phase 55');
  });

  it('all three types validated against manifest', () => {
    const declarations: CapabilityRef[] = [
      { verb: 'use', type: 'skill', name: 'missing-skill' },
      { verb: 'after', type: 'agent', name: 'missing-agent' },
      { verb: 'adapt', type: 'team', name: 'missing-team' },
    ];

    const result = validator.validateDeclarations(declarations, 'Phase 99');
    expect(result.valid).toBe(false);
    expect(result.warnings).toHaveLength(3);

    const capabilityNames = result.warnings.map((w) => w.capability);
    expect(capabilityNames).toContain('skill/missing-skill');
    expect(capabilityNames).toContain('agent/missing-agent');
    expect(capabilityNames).toContain('team/missing-team');
  });

  it('empty declarations are always valid', () => {
    const result = validator.validateDeclarations([], 'Phase 1');
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual([]);
  });
});
