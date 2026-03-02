/**
 * Tests for gate template loader.
 *
 * Validates that all three gate templates (pedagogical, implementation,
 * validation) load successfully, pass GateConfigSchema validation,
 * and include the required SUMMARY.md verification gate.
 */

import { describe, it, expect } from 'vitest';
import { loadGateTemplate, GATE_TEMPLATE_NAMES } from './gate-templates.js';

// ============================================================================
// Template loading tests
// ============================================================================

describe('loadGateTemplate', () => {
  it('should load pedagogical template with correct milestone_type', async () => {
    const result = await loadGateTemplate('pedagogical');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.milestone_type).toBe('pedagogical');
    }
  });

  it('should load implementation template with correct milestone_type', async () => {
    const result = await loadGateTemplate('implementation');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.milestone_type).toBe('implementation');
    }
  });

  it('should load validation template with correct milestone_type', async () => {
    const result = await loadGateTemplate('validation');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.milestone_type).toBe('validation');
    }
  });

  it('should reject unknown template name with error', async () => {
    const result = await loadGateTemplate('unknown');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain('Unknown gate template');
      expect(result.errors[0]).toContain('unknown');
    }
  });
});

// ============================================================================
// Template content validation tests
// ============================================================================

describe('gate template content', () => {
  it('should have non-empty per_subversion gates in pedagogical template', async () => {
    const result = await loadGateTemplate('pedagogical');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.gates.per_subversion.length).toBeGreaterThanOrEqual(2);
      const names = result.config.gates.per_subversion.map((g) => g.name);
      expect(names).toContain('teaching-note');
      expect(names).toContain('learning-journal');
    }
  });

  it('should have per_subversion gates in implementation template', async () => {
    const result = await loadGateTemplate('implementation');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.gates.per_subversion.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have per_subversion gates in validation template', async () => {
    const result = await loadGateTemplate('validation');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.gates.per_subversion.length).toBeGreaterThanOrEqual(1);
      const names = result.config.gates.per_subversion.map((g) => g.name);
      expect(names).toContain('verification-report');
    }
  });
});

// ============================================================================
// SUMMARY.md gate tests (RCFX-05 / RC-11 fix)
// ============================================================================

describe('SUMMARY.md gate in all templates', () => {
  for (const templateName of GATE_TEMPLATE_NAMES) {
    it(`should have summary-md gate in ${templateName} template`, async () => {
      const result = await loadGateTemplate(templateName);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.config.gates.summary.length).toBeGreaterThanOrEqual(1);
        const summaryGate = result.config.gates.summary.find((g) => g.name === 'summary-md');
        expect(summaryGate).toBeDefined();
      }
    });

    it(`should have blocking summary gate in ${templateName} template`, async () => {
      const result = await loadGateTemplate(templateName);
      expect(result.success).toBe(true);
      if (result.success) {
        const summaryGate = result.config.gates.summary.find((g) => g.name === 'summary-md');
        expect(summaryGate).toBeDefined();
        expect(summaryGate!.blocking).toBe(true);
      }
    });

    it(`should have min_size_bytes >= 500 on summary gate in ${templateName} template`, async () => {
      const result = await loadGateTemplate(templateName);
      expect(result.success).toBe(true);
      if (result.success) {
        const summaryGate = result.config.gates.summary.find((g) => g.name === 'summary-md');
        expect(summaryGate).toBeDefined();
        expect(summaryGate!.min_size_bytes).toBeGreaterThanOrEqual(500);
      }
    });

    it(`should have required content checks on summary gate in ${templateName} template`, async () => {
      const result = await loadGateTemplate(templateName);
      expect(result.success).toBe(true);
      if (result.success) {
        const summaryGate = result.config.gates.summary.find((g) => g.name === 'summary-md');
        expect(summaryGate).toBeDefined();
        const requiredChecks = summaryGate!.content_checks.filter((c) => c.required);
        expect(requiredChecks.length).toBeGreaterThanOrEqual(2);
      }
    });
  }
});

// ============================================================================
// Advisory gate tests (Phase 529 - behavioral evidence and deviations)
// ============================================================================

describe('advisory gates in validation template', () => {
  it('should have behavioral-evidence gate with blocking: false', async () => {
    const result = await loadGateTemplate('validation');
    expect(result.success).toBe(true);
    if (result.success) {
      const gate = result.config.gates.per_subversion.find(
        (g) => g.name === 'behavioral-evidence',
      );
      expect(gate).toBeDefined();
      expect(gate!.blocking).toBe(false);
      expect(gate!.content_checks.length).toBeGreaterThanOrEqual(1);
      expect(gate!.content_checks[0].required).toBe(true);
    }
  });

  it('should have deviations gate with blocking: false', async () => {
    const result = await loadGateTemplate('validation');
    expect(result.success).toBe(true);
    if (result.success) {
      const gate = result.config.gates.per_subversion.find(
        (g) => g.name === 'deviations',
      );
      expect(gate).toBeDefined();
      expect(gate!.blocking).toBe(false);
      expect(gate!.content_checks.length).toBeGreaterThanOrEqual(1);
      expect(gate!.content_checks[0].required).toBe(true);
    }
  });

  it('should have behavioral-evidence pattern matching verification language', async () => {
    const result = await loadGateTemplate('validation');
    expect(result.success).toBe(true);
    if (result.success) {
      const gate = result.config.gates.per_subversion.find(
        (g) => g.name === 'behavioral-evidence',
      );
      expect(gate).toBeDefined();
      const pattern = gate!.content_checks[0].pattern;
      // Pattern should match common verification evidence language
      const regex = new RegExp(pattern);
      expect(regex.test('Behavioral evidence confirms')).toBe(true);
      expect(regex.test('Functional test passes')).toBe(true);
      expect(regex.test('Verification complete')).toBe(true);
    }
  });

  it('should have deviations pattern matching acknowledgment language', async () => {
    const result = await loadGateTemplate('validation');
    expect(result.success).toBe(true);
    if (result.success) {
      const gate = result.config.gates.per_subversion.find(
        (g) => g.name === 'deviations',
      );
      expect(gate).toBeDefined();
      const pattern = gate!.content_checks[0].pattern;
      const regex = new RegExp(pattern);
      expect(regex.test('No gaps found')).toBe(true);
      expect(regex.test('DEVIATION: requirement changed')).toBe(true);
      expect(regex.test('None identified')).toBe(true);
    }
  });
});
