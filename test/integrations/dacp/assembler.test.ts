/**
 * Phase 456 verification tests for DACP assembler.
 * Tests AS-01 through AS-10: fidelity level composition at all levels,
 * no-skill fallback, token budget constraints, drift escalation,
 * data complexity classification, and assembly logging.
 *
 * @module test/dacp/assembler
 */

import { describe, it, expect } from 'vitest';

import { DACPAssembler, type AssemblyRequest } from '../../../src/dacp/assembler/assembler.js';
import { CatalogQuery } from '../../../src/dacp/assembler/catalog-query.js';
import { assessDataComplexity } from '../../../src/dacp/fidelity/decision.js';
import type { ScriptCatalogEntry, SchemaLibraryEntry } from '../../../src/dacp/types.js';

// ============================================================================
// Factories
// ============================================================================

function makeScriptEntry(overrides: Partial<ScriptCatalogEntry> = {}): ScriptCatalogEntry {
  return {
    id: 'test-script-1',
    skill_source: 'test-skill',
    skill_version: '1.0.0',
    script_path: '/skills/test/script.sh',
    script_hash: 'abc123',
    function_type: 'validator',
    data_types: ['json'],
    deterministic: true,
    last_used: new Date().toISOString(),
    use_count: 10,
    success_rate: 0.95,
    avg_execution_ms: 50,
    ...overrides,
  };
}

function makeSchemaEntry(overrides: Partial<SchemaLibraryEntry> = {}): SchemaLibraryEntry {
  return {
    id: 'test-schema-1',
    name: 'Test Schema',
    schema_path: '/schemas/test.json',
    data_type: 'json',
    source_skill: 'test-skill',
    version: '1.0.0',
    fields: ['name', 'value'],
    last_updated: new Date().toISOString(),
    reference_count: 5,
    ...overrides,
  };
}

function makeRequest(overrides: Partial<AssemblyRequest> = {}): AssemblyRequest {
  return {
    source_agent: 'planner',
    target_agent: 'executor',
    opcode: 'EXEC',
    intent: 'Execute the task as described',
    handoff_type: 'task-assignment',
    historical_drift_rate: 0.1,
    token_budget_remaining: 50000,
    safety_critical: false,
    ...overrides,
  };
}

function makeAssembler(
  scripts: ScriptCatalogEntry[] = [],
  schemas: SchemaLibraryEntry[] = [],
): DACPAssembler {
  const catalog = new CatalogQuery(scripts, schemas);
  return new DACPAssembler(catalog);
}

// ============================================================================
// Tests
// ============================================================================

describe('Assembler (AS-01 to AS-10)', () => {
  // AS-01: Level 0 assembly
  it('AS-01: simple status handoff with no skills produces prose-only bundle', () => {
    const assembler = makeAssembler();
    const result = assembler.assemble(
      makeRequest({
        data: undefined,
        handoff_type: 'status-report',
        historical_drift_rate: 0.0,
      }),
    );

    expect(result.manifest.fidelity_level).toBe(0);
    expect(Object.keys(result.data_files)).toHaveLength(0);
    expect(Object.keys(result.code_files)).toHaveLength(0);
    expect(result.intent_markdown).toBeDefined();
  });

  // AS-02: Level 3 assembly
  it('AS-02: complex task with matching skills produces full bundle', () => {
    const scripts = [
      makeScriptEntry({ id: 's1', skill_source: 'skill-a', function_type: 'parser', data_types: ['json'] }),
      makeScriptEntry({ id: 's2', skill_source: 'skill-b', function_type: 'validator', data_types: ['json'] }),
      makeScriptEntry({ id: 's3', skill_source: 'skill-c', function_type: 'transformer', data_types: ['json'] }),
    ];
    const schemas = [
      makeSchemaEntry({ data_type: 'json', source_skill: 'skill-d' }),
    ];
    const assembler = makeAssembler(scripts, schemas);

    const result = assembler.assemble(
      makeRequest({
        data: { nested: { deep: { value: 42 } }, items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
        data_types: ['json'],
        historical_drift_rate: 0.4,
        safety_critical: false,
      }),
    );

    expect(result.manifest.fidelity_level).toBeGreaterThanOrEqual(3);
    expect(Object.keys(result.code_files).length).toBeGreaterThan(0);
  });

  // AS-03: Level 4 assembly (safety-critical)
  it('AS-03: safety-critical handoff produces Level 3 bundle', () => {
    const assembler = makeAssembler();
    const result = assembler.assemble(
      makeRequest({
        data: { config: 'important' },
        safety_critical: true,
      }),
    );

    // Safety-critical always gets Level 3 from the decision model
    expect(result.manifest.fidelity_level).toBe(3);
  });

  // AS-04: No-skill fallback
  it('AS-04: complex handoff with empty skill library falls to Level 1 or 2', () => {
    const assembler = makeAssembler([], []);
    const result = assembler.assemble(
      makeRequest({
        data: { a: { b: { c: { d: 1 } } } },
        data_types: ['json'],
        historical_drift_rate: 0.05,
      }),
    );

    // Complex data with no skills = Level 2 (rule 8 in decision model)
    expect(result.manifest.fidelity_level).toBeGreaterThanOrEqual(1);
    expect(result.manifest.fidelity_level).toBeLessThanOrEqual(2);
  });

  // AS-05: Token budget constraint
  it('AS-05: token budget <20K caps fidelity at Level 1', () => {
    const scripts = [
      makeScriptEntry({ data_types: ['json'] }),
      makeScriptEntry({ id: 's2', data_types: ['json'], function_type: 'parser' }),
    ];
    const assembler = makeAssembler(scripts, []);
    const result = assembler.assemble(
      makeRequest({
        data: { config: 'value' },
        data_types: ['json'],
        token_budget_remaining: 15000,
      }),
    );

    expect(result.manifest.fidelity_level).toBeLessThanOrEqual(1);
  });

  // AS-06: High drift escalation
  it('AS-06: drift rate >0.3 raises fidelity to at least Level 2', () => {
    const scripts = [makeScriptEntry({ data_types: ['json'] })];
    const assembler = makeAssembler(scripts, []);
    const result = assembler.assemble(
      makeRequest({
        data: { simple: 'data' },
        data_types: ['json'],
        historical_drift_rate: 0.35,
      }),
    );

    expect(result.manifest.fidelity_level).toBeGreaterThanOrEqual(2);
  });

  // AS-07: Data complexity 'none'
  it('AS-07: null payload classifies as complexity none', () => {
    const complexity = assessDataComplexity(null);
    expect(complexity).toBe('none');
  });

  // AS-08: Data complexity 'simple'
  it('AS-08: flat object classifies as complexity simple', () => {
    const complexity = assessDataComplexity({ name: 'test' });
    expect(complexity).toBe('simple');
  });

  // AS-09: Data complexity 'complex'
  it('AS-09: deeply nested object classifies as complexity complex', () => {
    const deepNested = {
      level1: {
        level2: {
          level3: {
            level4: {
              value: 'deep',
            },
          },
        },
        extra: Array.from({ length: 25 }, (_, i) => ({ id: i })),
      },
    };
    const complexity = assessDataComplexity(deepNested);
    expect(complexity).toBe('complex');
  });

  // AS-10: Assembly produces rationale
  it('AS-10: assembly result includes rationale with level justification', () => {
    const assembler = makeAssembler();
    const result = assembler.assemble(makeRequest());

    expect(result.rationale).toBeDefined();
    expect(result.rationale.level_justification).toBeTruthy();
    expect(Array.isArray(result.rationale.skills_used)).toBe(true);
    expect(Array.isArray(result.rationale.generated_artifacts)).toBe(true);
    expect(Array.isArray(result.rationale.reused_artifacts)).toBe(true);
  });
});
