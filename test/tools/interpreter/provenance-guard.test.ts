/**
 * Tests for the DACP provenance guard.
 *
 * Covers: basic provenance validation, batch validation, version format
 * validation, and provenance chain completeness checks.
 */

import { describe, it, expect } from 'vitest';
import { validateProvenance, type ProvenanceResult } from '../../../src/tools/interpreter/provenance-guard.js';
import type { BundleScript } from '../../../src/tools/interpreter/types.js';
import type { Provenance } from '../../../src/dacp/types.js';

// ============================================================================
// Test Helpers
// ============================================================================

function makeScript(overrides: Partial<BundleScript> = {}): BundleScript {
  return {
    name: 'process.sh',
    path: '/tmp/bundle/code/process.sh',
    purpose: 'Process test data',
    language: 'bash',
    sourceSkill: 'test-skill',
    deterministic: true,
    content: '#!/bin/bash\necho hello',
    sizeBytes: 22,
    ...overrides,
  };
}

function makeProvenance(overrides: Partial<Provenance> = {}): Provenance {
  return {
    assembled_by: 'test-assembler',
    assembled_at: '2026-02-27T00:00:00Z',
    skill_versions: { 'test-skill': '1.0.0' },
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('validateProvenance', () => {
  // --------------------------------------------------------------------------
  // 1. Basic provenance validation (SAFE-06)
  // --------------------------------------------------------------------------
  describe('basic provenance validation', () => {
    it('should return valid:true for script with valid source_skill and matching version', () => {
      const scripts = [makeScript()];
      const provenance = makeProvenance();
      const results = validateProvenance(scripts, provenance);
      expect(results).toHaveLength(1);
      expect(results[0].valid).toBe(true);
    });

    it('should return valid:false for script with empty source_skill', () => {
      const scripts = [makeScript({ sourceSkill: '' })];
      const provenance = makeProvenance();
      const results = validateProvenance(scripts, provenance);
      expect(results).toHaveLength(1);
      expect(results[0].valid).toBe(false);
      expect(results[0].reason).toMatch(/missing source skill/i);
    });

    it('should return valid:false for script with source_skill not in skill_versions', () => {
      const scripts = [makeScript({ sourceSkill: 'unknown-skill' })];
      const provenance = makeProvenance({ skill_versions: { 'other-skill': '1.0.0' } });
      const results = validateProvenance(scripts, provenance);
      expect(results).toHaveLength(1);
      expect(results[0].valid).toBe(false);
      expect(results[0].reason).toMatch(/not registered/i);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Batch validation
  // --------------------------------------------------------------------------
  describe('batch validation', () => {
    it('should return all valid for multiple valid scripts', () => {
      const scripts = [
        makeScript({ name: 'a.sh', sourceSkill: 'test-skill' }),
        makeScript({ name: 'b.sh', sourceSkill: 'test-skill' }),
      ];
      const provenance = makeProvenance();
      const results = validateProvenance(scripts, provenance);
      expect(results).toHaveLength(2);
      expect(results.every(r => r.valid)).toBe(true);
    });

    it('should return mixed results for 3 scripts with 1 invalid', () => {
      const scripts = [
        makeScript({ name: 'a.sh', sourceSkill: 'test-skill' }),
        makeScript({ name: 'b.sh', sourceSkill: '' }),
        makeScript({ name: 'c.sh', sourceSkill: 'test-skill' }),
      ];
      const provenance = makeProvenance();
      const results = validateProvenance(scripts, provenance);
      expect(results).toHaveLength(3);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(false);
      expect(results[2].valid).toBe(true);
    });

    it('should return empty results for empty scripts array', () => {
      const results = validateProvenance([], makeProvenance());
      expect(results).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Version format validation
  // --------------------------------------------------------------------------
  describe('version format validation', () => {
    it('should accept valid semver in skill_versions', () => {
      const scripts = [makeScript()];
      const provenance = makeProvenance({ skill_versions: { 'test-skill': '1.2.3' } });
      const results = validateProvenance(scripts, provenance);
      expect(results[0].valid).toBe(true);
      expect(results[0].warnings).toHaveLength(0);
    });

    it('should add warning for non-semver version format but still be valid', () => {
      const scripts = [makeScript()];
      const provenance = makeProvenance({ skill_versions: { 'test-skill': 'latest' } });
      const results = validateProvenance(scripts, provenance);
      expect(results[0].valid).toBe(true);
      expect(results[0].warnings.length).toBeGreaterThan(0);
      expect(results[0].warnings.some(w => w.includes('semver'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Provenance chain completeness
  // --------------------------------------------------------------------------
  describe('provenance chain completeness', () => {
    it('should pass with complete chain (assembled_by, assembled_at, skill_versions)', () => {
      const scripts = [makeScript()];
      const provenance = makeProvenance();
      const results = validateProvenance(scripts, provenance);
      expect(results[0].valid).toBe(true);
      const chainWarnings = results[0].warnings.filter(w => w.includes('chain'));
      expect(chainWarnings).toHaveLength(0);
    });

    it('should add warning when assembled_by is empty', () => {
      const scripts = [makeScript()];
      const provenance = makeProvenance({ assembled_by: '' });
      const results = validateProvenance(scripts, provenance);
      // Script itself may still be valid (provenance source_skill is present)
      expect(results[0].warnings.some(w => w.includes('assembled_by'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Script name in result
  // --------------------------------------------------------------------------
  describe('result metadata', () => {
    it('should include scriptName in each result', () => {
      const scripts = [makeScript({ name: 'my-script.sh' })];
      const provenance = makeProvenance();
      const results = validateProvenance(scripts, provenance);
      expect(results[0].scriptName).toBe('my-script.sh');
    });
  });
});
