/**
 * Tests for Gastown chipset YAML validator.
 *
 * Validates that the chipset validator correctly:
 * - Parses and validates YAML against the JSON schema
 * - Checks token budget constraints (sum <= 1.0 = 10k tokens)
 * - Enforces agent topology rules (exactly 1 mayor, >= 1 polecat, >= 1 witness)
 * - Verifies communication channel sender/receiver validity
 * - Reports structured validation results
 */

import { describe, it, expect } from 'vitest';
import { validateChipset, type ValidationResult } from './validate-chipset.js';
import * as yaml from 'js-yaml';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Helper: load the real chipset YAML as a baseline, then mutate for tests
// ---------------------------------------------------------------------------

const CHIPSET_PATH = path.resolve(
  import.meta.dirname ?? __dirname,
  '../../../data/chipset/gastown-orchestration/gastown-orchestration.yaml',
);

const SCHEMA_PATH = path.resolve(
  import.meta.dirname ?? __dirname,
  '../../../data/chipset/schema/gastown-chipset-schema.json',
);

function loadValidYaml(): string {
  return fs.readFileSync(CHIPSET_PATH, 'utf8');
}

function loadValidData(): Record<string, unknown> {
  return yaml.load(loadValidYaml()) as Record<string, unknown>;
}

/** Dump data back to YAML string for the validator. */
function toYaml(data: Record<string, unknown>): string {
  return yaml.dump(data);
}

// ===========================================================================
// Test Suite
// ===========================================================================

describe('validateChipset', () => {
  // -------------------------------------------------------------------------
  // 1. Valid chipset passes all checks
  // -------------------------------------------------------------------------

  it('validates the real gastown-orchestration.yaml successfully', () => {
    const yamlContent = loadValidYaml();
    const result = validateChipset(yamlContent, SCHEMA_PATH);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.sections.length).toBeGreaterThan(0);

    // Every section should pass
    for (const section of result.sections) {
      expect(section.valid).toBe(true);
    }
  });

  it('returns structured validation results with section details', () => {
    const yamlContent = loadValidYaml();
    const result = validateChipset(yamlContent, SCHEMA_PATH);

    // Should have sections for: schema, token_budget, agent_topology, communication
    const sectionNames = result.sections.map((s) => s.name);
    expect(sectionNames).toContain('schema');
    expect(sectionNames).toContain('token_budget');
    expect(sectionNames).toContain('agent_topology');
    expect(sectionNames).toContain('communication');
  });

  // -------------------------------------------------------------------------
  // 2. Missing skill reference produces error
  // -------------------------------------------------------------------------

  it('produces error when an agent references a non-existent skill', () => {
    const data = loadValidData();
    const agents = data.agents as Record<string, unknown>;
    const agentList = agents.agents as Array<Record<string, unknown>>;

    // Add a fake skill to the mayor
    agentList[0].skills = ['agent-topology', 'nonexistent-skill-xyz'];

    const result = validateChipset(toYaml(data), SCHEMA_PATH);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('nonexistent-skill-xyz'))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 3. Token budget > 1.0 (10k) produces error
  // -------------------------------------------------------------------------

  it('produces error when total token budget weight exceeds 1.0', () => {
    const data = loadValidData();
    const skills = data.skills as Record<string, unknown>;
    const required = skills.required as Array<Record<string, unknown>>;

    // Inflate all weights to exceed 1.0 total
    for (const skill of required) {
      skill.token_budget_weight = 0.5;
    }

    const result = validateChipset(toYaml(data), SCHEMA_PATH);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('token budget'))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 4. Zero mayors produces topology error
  // -------------------------------------------------------------------------

  it('produces topology error when there are 0 mayors', () => {
    const data = loadValidData();
    const agents = data.agents as Record<string, unknown>;
    const agentList = agents.agents as Array<Record<string, unknown>>;

    // Remove all mayors by changing their role
    for (const agent of agentList) {
      if (agent.role === 'mayor') {
        agent.role = 'crew';
      }
    }

    const result = validateChipset(toYaml(data), SCHEMA_PATH);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('mayor'))).toBe(true);
  });

  it('produces topology error when there are 2 mayors', () => {
    const data = loadValidData();
    const agents = data.agents as Record<string, unknown>;
    const agentList = agents.agents as Array<Record<string, unknown>>;

    // Add a second mayor
    agentList.push({
      name: 'mayor-2',
      role: 'mayor',
      skills: ['agent-topology'],
    });

    const result = validateChipset(toYaml(data), SCHEMA_PATH);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('mayor'))).toBe(true);
  });

  it('produces topology error when there are 0 polecats', () => {
    const data = loadValidData();
    const agents = data.agents as Record<string, unknown>;
    const agentList = agents.agents as Array<Record<string, unknown>>;

    // Remove all polecats
    agents.agents = agentList.filter((a) => a.role !== 'polecat');

    const result = validateChipset(toYaml(data), SCHEMA_PATH);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('polecat'))).toBe(true);
  });

  it('produces topology error when there are 0 witnesses', () => {
    const data = loadValidData();
    const agents = data.agents as Record<string, unknown>;
    const agentList = agents.agents as Array<Record<string, unknown>>;

    // Remove all witnesses
    agents.agents = agentList.filter((a) => a.role !== 'witness');

    const result = validateChipset(toYaml(data), SCHEMA_PATH);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('witness'))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 5. Malformed YAML produces parse error
  // -------------------------------------------------------------------------

  it('produces parse error for malformed YAML', () => {
    const badYaml = '{{ not: valid: yaml: [[[';
    const result = validateChipset(badYaml, SCHEMA_PATH);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('parse'))).toBe(true);
  });

  it('produces error for YAML that is not an object', () => {
    const result = validateChipset('just a string', SCHEMA_PATH);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // 6. Missing optional section applies defaults with no error
  // -------------------------------------------------------------------------

  it('treats missing recommended skills as valid (empty array)', () => {
    const data = loadValidData();
    const skills = data.skills as Record<string, unknown>;
    skills.recommended = [];

    const result = validateChipset(toYaml(data), SCHEMA_PATH);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Additional edge cases
  // -------------------------------------------------------------------------

  it('reports warnings array (may be empty for valid chipset)', () => {
    const yamlContent = loadValidYaml();
    const result = validateChipset(yamlContent, SCHEMA_PATH);

    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('validates token budget at exactly 1.0 as passing', () => {
    const data = loadValidData();
    const skills = data.skills as Record<string, unknown>;
    const required = skills.required as Array<Record<string, unknown>>;
    const recommended = skills.recommended as Array<Record<string, unknown>>;

    // Set weights to exactly 1.0 total
    // 4 required at 0.2 each = 0.8, 2 recommended at 0.1 each = 0.2, total = 1.0
    for (const skill of required) {
      skill.token_budget_weight = 0.2;
    }
    for (const skill of recommended) {
      skill.token_budget_weight = 0.1;
    }

    const result = validateChipset(toYaml(data), SCHEMA_PATH);

    // Token budget should pass at exactly 1.0
    const budgetSection = result.sections.find((s) => s.name === 'token_budget');
    expect(budgetSection?.valid).toBe(true);
  });
});
