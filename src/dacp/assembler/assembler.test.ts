/**
 * Tests for the DACP Assembler core engine.
 *
 * @module dacp/assembler/assembler.test
 */

import { describe, it, expect } from 'vitest';
import type { ScriptCatalogEntry, SchemaLibraryEntry, FidelityLevel } from '../types.js';
import { CatalogQuery } from './catalog-query.js';
import { DACPAssembler } from './assembler.js';
import type { AssemblyRequest } from './assembler.js';

// ============================================================================
// Test Data Factories
// ============================================================================

function createScriptEntry(
  overrides: Partial<ScriptCatalogEntry> = {},
): ScriptCatalogEntry {
  return {
    id: 'script-001',
    skill_source: 'test-skill',
    skill_version: '1.0.0',
    script_path: '/scripts/test.sh',
    script_hash: 'abc123',
    function_type: 'parser',
    data_types: ['task-data'],
    input_schema_ref: undefined,
    output_schema_ref: undefined,
    deterministic: true,
    last_used: '2026-02-20T00:00:00Z',
    use_count: 10,
    success_rate: 0.9,
    avg_execution_ms: 50,
    ...overrides,
  };
}

function createSchemaEntry(
  overrides: Partial<SchemaLibraryEntry> = {},
): SchemaLibraryEntry {
  return {
    id: 'schema-001',
    name: 'Test Schema',
    schema_path: '/schemas/test.json',
    data_type: 'task-data',
    source_skill: 'test-skill',
    version: '1.0.0',
    fields: ['name', 'value'],
    last_updated: '2026-02-20T00:00:00Z',
    reference_count: 5,
    ...overrides,
  };
}

function makeRequest(overrides: Partial<AssemblyRequest> = {}): AssemblyRequest {
  return {
    source_agent: 'orchestrator',
    target_agent: 'executor',
    opcode: 'EXEC',
    intent: 'Execute the planned task.',
    handoff_type: 'task-assignment',
    historical_drift_rate: 0,
    token_budget_remaining: 100_000,
    safety_critical: false,
    ...overrides,
  };
}

// ============================================================================
// Level 0: Intent-only assembly
// ============================================================================

describe('DACPAssembler — Level 0 (prose-only)', () => {
  it('produces intent only with empty data and code files', () => {
    const catalog = new CatalogQuery([], []);
    const assembler = new DACPAssembler(catalog);

    const result = assembler.assemble(makeRequest({
      intent: 'Status report: all systems nominal.',
      data: undefined,
      handoff_type: 'status-report',
    }));

    expect(result.manifest.fidelity_level).toBe(0);
    expect(result.intent_markdown).toBe('Status report: all systems nominal.');
    expect(Object.keys(result.data_files)).toHaveLength(0);
    expect(Object.keys(result.code_files)).toHaveLength(0);
  });

  it('includes intent.md in generated artifacts', () => {
    const catalog = new CatalogQuery([], []);
    const assembler = new DACPAssembler(catalog);

    const result = assembler.assemble(makeRequest({
      data: undefined,
      handoff_type: 'status-report',
    }));

    expect(result.rationale.generated_artifacts).toContain('intent.md');
  });
});

// ============================================================================
// Level 1: Intent + data
// ============================================================================

describe('DACPAssembler — Level 1 (prose + data)', () => {
  it('includes data payload as JSON file', () => {
    const catalog = new CatalogQuery([], []);
    const assembler = new DACPAssembler(catalog);

    const data = { key: 'value', count: 42 };
    const result = assembler.assemble(makeRequest({
      data,
      handoff_type: 'configuration-update',
      data_types: ['config-data'],
    }));

    expect(result.manifest.fidelity_level).toBe(1);
    expect(result.data_files['payload.json']).toEqual(data);
    expect(Object.keys(result.code_files)).toHaveLength(0);
  });
});

// ============================================================================
// Level 2: Intent + data + schemas
// ============================================================================

describe('DACPAssembler — Level 2 (prose + data + schema)', () => {
  it('includes data and schema references', () => {
    const schemas = [
      createSchemaEntry({ data_type: 'task-data', source_skill: 'schema-skill' }),
    ];
    const catalog = new CatalogQuery([], schemas);
    const assembler = new DACPAssembler(catalog);

    const data = { task: 'build', priority: 1, assignee: 'agent-a', details: { nested: true }, metadata: { extra: 'info' }, tags: ['a'] };
    const result = assembler.assemble(makeRequest({
      data,
      handoff_type: 'task-assignment',
      data_types: ['task-data'],
      historical_drift_rate: 0.1,
    }));

    expect(result.manifest.fidelity_level).toBe(2);
    expect(result.data_files['payload.json']).toEqual(data);
    expect(result.data_files['schema-task-data.json']).toBeDefined();
    expect(result.rationale.reused_artifacts).toContain('data/schema-task-data.json');
  });

  it('records skills used from schema matches', () => {
    const schemas = [
      createSchemaEntry({ source_skill: 'my-schema-skill', data_type: 'task-data' }),
    ];
    const catalog = new CatalogQuery([], schemas);
    const assembler = new DACPAssembler(catalog);

    const result = assembler.assemble(makeRequest({
      data: { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 },
      data_types: ['task-data'],
    }));

    expect(result.rationale.skills_used).toContain('my-schema-skill');
  });
});

// ============================================================================
// Level 3: Intent + data + schemas + scripts
// ============================================================================

describe('DACPAssembler — Level 3 (full bundle)', () => {
  it('includes scripts from catalog at Level 3', () => {
    const scripts = [
      createScriptEntry({
        id: 'parse-task',
        skill_source: 'task-parser-skill',
        skill_version: '2.0.0',
        function_type: 'parser',
        data_types: ['task-data'],
        deterministic: true,
      }),
    ];
    const schemas = [
      createSchemaEntry({ data_type: 'task-data', source_skill: 'task-schema-skill' }),
    ];
    const catalog = new CatalogQuery(scripts, schemas);
    const assembler = new DACPAssembler(catalog);

    const result = assembler.assemble(makeRequest({
      data: { level1: { level2: { level3: { level4: { deep: true } } } } },
      handoff_type: 'task-assignment',
      data_types: ['task-data'],
      historical_drift_rate: 0.5,
      safety_critical: false,
    }));

    expect(result.manifest.fidelity_level).toBe(3);
    const codeFileNames = Object.keys(result.code_files);
    expect(codeFileNames.length).toBeGreaterThan(0);

    // Scripts include source header
    const firstCode = Object.values(result.code_files)[0];
    expect(firstCode).toContain('# Source: task-parser-skill v2.0.0');
  });

  it('safety_critical always produces Level 3', () => {
    const catalog = new CatalogQuery([], []);
    const assembler = new DACPAssembler(catalog);

    const result = assembler.assemble(makeRequest({
      data: { simple: true },
      safety_critical: true,
    }));

    expect(result.manifest.fidelity_level).toBe(3);
  });
});

// ============================================================================
// SAFE-02: Fidelity bounding
// ============================================================================

describe('DACPAssembler — SAFE-02 (bounded fidelity changes)', () => {
  it('clamps from Level 0 when model wants Level 3', () => {
    const scripts = [
      createScriptEntry({ data_types: ['task-data'], skill_source: 'skill-a' }),
      createScriptEntry({ id: 's2', data_types: ['task-data'], skill_source: 'skill-b' }),
      createScriptEntry({ id: 's3', data_types: ['task-data'], skill_source: 'skill-c' }),
    ];
    const catalog = new CatalogQuery(scripts, []);
    const assembler = new DACPAssembler(catalog);

    const result = assembler.assemble(makeRequest({
      data: { deep: { nested: { value: true } } },
      handoff_type: 'task-assignment',
      data_types: ['task-data'],
      historical_drift_rate: 0.5,
      current_fidelity: 0 as FidelityLevel,
    }));

    // Would be Level 3 without clamping, but bounded to Level 1
    expect(result.manifest.fidelity_level).toBe(1);
  });
});

// ============================================================================
// Rationale recording
// ============================================================================

describe('DACPAssembler — rationale', () => {
  it('records level justification with human-readable explanation', () => {
    const catalog = new CatalogQuery([], []);
    const assembler = new DACPAssembler(catalog);

    const result = assembler.assemble(makeRequest({
      data: undefined,
      handoff_type: 'status-report',
    }));

    expect(result.rationale.level_justification).toContain('Level 0');
    expect(result.rationale.level_justification.length).toBeGreaterThan(10);
  });

  it('records skills used and artifact lists', () => {
    const scripts = [
      createScriptEntry({
        skill_source: 'my-skill',
        data_types: ['task-data'],
      }),
    ];
    const schemas = [
      createSchemaEntry({ source_skill: 'schema-skill', data_type: 'task-data' }),
    ];
    const catalog = new CatalogQuery(scripts, schemas);
    const assembler = new DACPAssembler(catalog);

    const result = assembler.assemble(makeRequest({
      data: { task: 'do thing' },
      handoff_type: 'task-assignment',
      data_types: ['task-data'],
      historical_drift_rate: 0.5,
    }));

    expect(result.rationale.skills_used.length).toBeGreaterThan(0);
    expect(result.rationale.generated_artifacts).toContain('intent.md');
  });

  it('safety-critical justification mentions safety', () => {
    const catalog = new CatalogQuery([], []);
    const assembler = new DACPAssembler(catalog);

    const result = assembler.assemble(makeRequest({
      safety_critical: true,
    }));

    expect(result.rationale.level_justification.toLowerCase()).toContain('safety');
  });
});

// ============================================================================
// Token budget constraint
// ============================================================================

describe('DACPAssembler — token budget', () => {
  it('caps at Level 1 when token budget is low', () => {
    const schemas = [
      createSchemaEntry({ data_type: 'task-data' }),
    ];
    const catalog = new CatalogQuery([], schemas);
    const assembler = new DACPAssembler(catalog);

    const result = assembler.assemble(makeRequest({
      data: { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: { nested: true } },
      data_types: ['task-data'],
      token_budget_remaining: 15_000,
    }));

    expect(result.manifest.fidelity_level).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// Manifest structure
// ============================================================================

describe('DACPAssembler — manifest', () => {
  it('includes correct provenance metadata', () => {
    const catalog = new CatalogQuery([], []);
    const assembler = new DACPAssembler(catalog);

    const result = assembler.assemble(makeRequest());

    expect(result.manifest.provenance.assembled_by).toBe('dacp-assembler');
    expect(result.manifest.provenance.assembled_at).toBeTruthy();
    expect(result.manifest.version).toBe('1.0.0');
  });

  it('includes source and target agents', () => {
    const catalog = new CatalogQuery([], []);
    const assembler = new DACPAssembler(catalog);

    const result = assembler.assemble(makeRequest({
      source_agent: 'planner',
      target_agent: 'builder',
    }));

    expect(result.manifest.source_agent).toBe('planner');
    expect(result.manifest.target_agent).toBe('builder');
  });

  it('includes opcode from request', () => {
    const catalog = new CatalogQuery([], []);
    const assembler = new DACPAssembler(catalog);

    const result = assembler.assemble(makeRequest({
      opcode: 'VERIFY',
    }));

    expect(result.manifest.opcode).toBe('VERIFY');
  });
});
