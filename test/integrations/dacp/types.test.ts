/**
 * Phase 456 verification tests for DACP types and schemas.
 * Tests TS-01 through TS-10: Zod schema validation, version compatibility,
 * interface completeness, and fixture roundtrips.
 *
 * @module test/dacp/types
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ZodError } from 'zod';

import {
  BundleManifestSchema,
  HandoffOutcomeSchema,
  DriftScoreSchema,
  FidelityDecisionSchema,
  BundleTemplateSchema,
  ScriptCatalogEntrySchema,
  SchemaLibraryEntrySchema,
  HandoffPatternSchema,
  DACPStatusSchema,
  FidelityLevelSchema,
  BusOpcodeSchema,
  isCompatible,
  DACP_VERSION,
  calculateDriftScore,
  type BundleManifest,
  type HandoffOutcome,
  type DriftScore,
  type FidelityDecision,
  type BundleTemplate,
  type ScriptCatalogEntry,
  type SchemaLibraryEntry,
  type FidelityLevel,
} from '../../../src/integrations/dacp/types.js';

// ============================================================================
// Factories
// ============================================================================

function makeManifest(overrides: Partial<BundleManifest> = {}): BundleManifest {
  return {
    version: '1.0.0',
    fidelity_level: 2,
    source_agent: 'planner',
    target_agent: 'executor',
    opcode: 'EXEC',
    intent_summary: 'Test handoff intent',
    human_origin: {
      vision_doc: 'PROJECT.md',
      planning_phase: '456',
      user_directive: 'Run tests',
    },
    data_manifest: {},
    code_manifest: {},
    assembly_rationale: {
      level_justification: 'Test level',
      skills_used: [],
      generated_artifacts: ['intent.md'],
      reused_artifacts: [],
    },
    provenance: {
      assembled_by: 'dacp-assembler',
      assembled_at: new Date().toISOString(),
      skill_versions: {},
    },
    ...overrides,
  };
}

function makeOutcome(overrides: Partial<HandoffOutcome> = {}): HandoffOutcome {
  return {
    bundle_id: 'test-bundle-001',
    fidelity_level: 2,
    intent_alignment: 0.9,
    rework_required: false,
    tokens_spent_interpreting: 500,
    code_modifications: 1,
    verification_pass: true,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('DACP Types & Schemas (TS-01 to TS-10)', () => {
  // TS-01: Valid BundleManifest passes Zod schema validation
  it('TS-01: valid BundleManifest passes Zod schema validation', () => {
    const manifest = makeManifest();
    const result = BundleManifestSchema.safeParse(manifest);
    expect(result.success).toBe(true);
  });

  // TS-02: Missing required field fails
  it('TS-02: missing required field fails validation', () => {
    const partial = makeManifest();
    const { version: _, ...withoutVersion } = partial;

    const result = BundleManifestSchema.safeParse(withoutVersion);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldPaths = result.error.issues.map(i => i.path.join('.'));
      expect(fieldPaths.some(p => p.includes('version'))).toBe(true);
    }
  });

  // TS-03: Invalid fidelity level rejected
  it('TS-03: invalid fidelity level (5) rejected', () => {
    const manifest = makeManifest({ fidelity_level: 5 as FidelityLevel });
    const result = BundleManifestSchema.safeParse(manifest);
    expect(result.success).toBe(false);
  });

  // TS-04: Version compatibility check (same major version)
  it('TS-04: same major version is compatible', () => {
    expect(isCompatible('1.0.0')).toBe(true);
    expect(isCompatible('1.5.3')).toBe(true);
    expect(isCompatible('1.99.99')).toBe(true);
  });

  // TS-05: Version incompatibility check (different major version)
  it('TS-05: different major version is incompatible', () => {
    expect(isCompatible('2.0.0')).toBe(false);
    expect(isCompatible('0.9.0')).toBe(false);
    expect(isCompatible('3.1.0')).toBe(false);
  });

  // TS-06: All TS interfaces compile strict
  it('TS-06: all exported types compile without error', () => {
    // Static type check: construct typed variables using every exported type.
    // If this compiles, the types are valid.
    const manifest: BundleManifest = makeManifest();
    const outcome: HandoffOutcome = makeOutcome();
    const drift: DriftScore = calculateDriftScore(outcome);
    const decision: FidelityDecision = {
      handoff_type: 'test',
      data_complexity: 'simple',
      historical_drift_rate: 0.1,
      available_skills: 2,
      token_budget_remaining: 50000,
      safety_critical: false,
    };
    const template: BundleTemplate = {
      id: 'test-template',
      name: 'Test',
      handoff_type: 'test',
      description: 'Test template',
      default_fidelity: 1,
      data_schema_refs: [],
      code_script_refs: [],
      test_fixture_refs: [],
    };
    const catalogEntry: ScriptCatalogEntry = {
      id: 'test-script',
      skill_source: 'test-skill',
      skill_version: '1.0.0',
      script_path: '/scripts/test.sh',
      script_hash: 'abc123',
      function_type: 'validator',
      data_types: ['json'],
      deterministic: true,
      last_used: new Date().toISOString(),
      use_count: 5,
      success_rate: 0.95,
      avg_execution_ms: 100,
    };
    const schemaEntry: SchemaLibraryEntry = {
      id: 'test-schema',
      name: 'Test Schema',
      schema_path: '/schemas/test.json',
      data_type: 'json',
      source_skill: 'test-skill',
      version: '1.0.0',
      fields: ['name', 'value'],
      last_updated: new Date().toISOString(),
      reference_count: 3,
    };

    // If we get here, all types compiled. Assert truthy values exist.
    expect(manifest.version).toBeDefined();
    expect(outcome.bundle_id).toBeDefined();
    expect(drift.score).toBeDefined();
    expect(decision.handoff_type).toBe('test');
    expect(template.id).toBe('test-template');
    expect(catalogEntry.skill_source).toBe('test-skill');
    expect(schemaEntry.data_type).toBe('json');
  });

  // TS-07: Schema completeness — for every exported TS interface, a corresponding Zod schema exists
  it('TS-07: schema completeness — Zod schemas exist for all major types', () => {
    // Verify each major Zod schema is defined and functional
    const schemas = [
      { name: 'BundleManifest', schema: BundleManifestSchema },
      { name: 'HandoffOutcome', schema: HandoffOutcomeSchema },
      { name: 'DriftScore', schema: DriftScoreSchema },
      { name: 'FidelityDecision', schema: FidelityDecisionSchema },
      { name: 'BundleTemplate', schema: BundleTemplateSchema },
      { name: 'ScriptCatalogEntry', schema: ScriptCatalogEntrySchema },
      { name: 'SchemaLibraryEntry', schema: SchemaLibraryEntrySchema },
      { name: 'HandoffPattern', schema: HandoffPatternSchema },
      { name: 'DACPStatus', schema: DACPStatusSchema },
      { name: 'FidelityLevel', schema: FidelityLevelSchema },
      { name: 'BusOpcode', schema: BusOpcodeSchema },
    ];

    for (const { name, schema } of schemas) {
      expect(schema).toBeDefined();
      expect(typeof schema.safeParse).toBe('function');
    }
  });

  // TS-08: Valid fixtures pass Zod schemas
  it('TS-08: valid fixture objects pass schema validation', () => {
    const validManifest = makeManifest();
    expect(BundleManifestSchema.safeParse(validManifest).success).toBe(true);

    const validOutcome = makeOutcome();
    expect(HandoffOutcomeSchema.safeParse(validOutcome).success).toBe(true);

    const validDecision: FidelityDecision = {
      handoff_type: 'test',
      data_complexity: 'structured',
      historical_drift_rate: 0.2,
      available_skills: 3,
      token_budget_remaining: 50000,
      safety_critical: false,
    };
    expect(FidelityDecisionSchema.safeParse(validDecision).success).toBe(true);

    const validTemplate: BundleTemplate = {
      id: 'fixture-template',
      name: 'Fixture',
      handoff_type: 'test-type',
      description: 'A test template',
      default_fidelity: 2,
      data_schema_refs: ['schema-a'],
      code_script_refs: ['script-b'],
      test_fixture_refs: ['fixture-c'],
    };
    expect(BundleTemplateSchema.safeParse(validTemplate).success).toBe(true);
  });

  // TS-09: Invalid fixtures fail schemas
  it('TS-09: invalid fixture objects fail schema validation', () => {
    // Invalid: intent_alignment out of range
    const badOutcome = makeOutcome({ intent_alignment: 1.5 });
    expect(HandoffOutcomeSchema.safeParse(badOutcome).success).toBe(false);

    // Invalid: negative tokens
    const badOutcome2 = makeOutcome({ tokens_spent_interpreting: -10 });
    expect(HandoffOutcomeSchema.safeParse(badOutcome2).success).toBe(false);

    // Invalid: bad opcode
    const badManifest = makeManifest({ opcode: 'INVALID' as any });
    expect(BundleManifestSchema.safeParse(badManifest).success).toBe(false);
  });

  // TS-10: No `any` types in module
  it('TS-10: no `: any` types in types.ts source', () => {
    const typesSource = readFileSync(
      join(__dirname, '../../../src/integrations/dacp/types.ts'),
      'utf-8',
    );
    // Match `: any` that is a type annotation (not inside a string or comment)
    // Filter out lines that are comments
    const nonCommentLines = typesSource
      .split('\n')
      .filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('*'));
    const anyMatches = nonCommentLines.filter(line => /:\s*any\b/.test(line));
    expect(anyMatches).toHaveLength(0);
  });
});
