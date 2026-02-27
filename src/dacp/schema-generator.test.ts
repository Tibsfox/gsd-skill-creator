/**
 * TDD tests for DACP JSON Schema generation and fixture validation.
 *
 * Tests that Zod schemas convert to JSON Schema draft 2020-12 format,
 * that valid fixtures pass validation, and that invalid fixtures are
 * rejected. Uses Ajv for JSON Schema validation.
 *
 * @module dacp/schema-generator.test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {
  generateDACPSchemas,
  SCHEMA_CONFIGS,
  generateSingleSchema,
} from './schema-generator.js';
import {
  BundleManifestSchema,
  HandoffOutcomeSchema,
  DriftScoreSchema,
  BundleTemplateSchema,
  FidelityDecisionSchema,
  ScriptCatalogEntrySchema,
  SchemaLibraryEntrySchema,
  HandoffPatternSchema,
  DACPStatusSchema,
} from './types.js';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ============================================================================
// Test Setup
// ============================================================================

let schemasDir: string;
const validators = new Map<string, (data: unknown) => boolean>();

/**
 * Get or create a compiled Ajv validator for a schema file.
 * Caches validators to avoid Ajv's duplicate $id error.
 */
function getValidator(filename: string): (data: unknown) => boolean {
  let validate = validators.get(filename);
  if (!validate) {
    const schema = JSON.parse(readFileSync(join(schemasDir, filename), 'utf-8'));
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    validate = ajv.compile(schema) as (data: unknown) => boolean;
    validators.set(filename, validate);
  }
  return validate;
}

beforeAll(() => {
  schemasDir = mkdtempSync(join(tmpdir(), 'dacp-schemas-'));
  generateDACPSchemas(schemasDir);
});

// ============================================================================
// Test Fixtures
// ============================================================================

const validBundleManifest = {
  version: '1.0.0',
  fidelity_level: 2,
  source_agent: 'orchestrator',
  target_agent: 'executor-01',
  opcode: 'EXEC',
  intent_summary: 'Execute phase 5 foundation tasks',
  human_origin: {
    vision_doc: '.planning/PROJECT.md',
    planning_phase: '5',
    user_directive: 'Build the storage layer',
  },
  data_manifest: {
    'config.json': {
      purpose: 'Phase configuration',
      source: '.planning/phases/05/config.json',
    },
  },
  code_manifest: {
    'setup.sh': {
      purpose: 'Initialize directories',
      language: 'bash',
      source_skill: 'project-scaffold',
      deterministic: true,
    },
  },
  assembly_rationale: {
    level_justification: 'Structured data with scripts needed for complex phase',
    skills_used: ['project-scaffold', 'test-runner'],
    generated_artifacts: ['config.json'],
    reused_artifacts: ['setup.sh'],
  },
  provenance: {
    assembled_by: 'dacp-assembler',
    assembled_at: '2026-02-27T10:00:00.000Z',
    skill_versions: { 'project-scaffold': '1.2.0', 'test-runner': '2.0.1' },
  },
};

const validHandoffOutcome = {
  bundle_id: 'bundle-abc-123',
  fidelity_level: 2,
  intent_alignment: 0.85,
  rework_required: false,
  tokens_spent_interpreting: 1200,
  code_modifications: 2,
  verification_pass: true,
  timestamp: '2026-02-27T12:00:00.000Z',
};

const validDriftScore = {
  score: 0.45,
  components: {
    intent_miss: 0.3,
    rework_penalty: 0.0,
    verification_penalty: 0.4,
    modification_penalty: 0.2,
  },
  recommendation: 'maintain',
};

const validBundleTemplate = {
  id: 'tmpl-skill-handoff',
  name: 'Skill Handoff',
  handoff_type: 'skill-handoff',
  description: 'Template for handing off skill execution context',
  default_fidelity: 2,
  data_schema_refs: ['schemas/skill-context.schema.json'],
  code_script_refs: ['scripts/skill-executor.sh'],
  test_fixture_refs: ['fixtures/skill-handoff-valid.json'],
};

const validFidelityDecision = {
  handoff_type: 'phase-transition',
  data_complexity: 'structured',
  historical_drift_rate: 0.35,
  available_skills: 5,
  token_budget_remaining: 50000,
  safety_critical: false,
};

const validScriptCatalogEntry = {
  id: 'cat-001',
  skill_source: 'test-runner',
  skill_version: '2.0.1',
  script_path: 'scripts/run-tests.sh',
  script_hash: 'sha256:abc123def456',
  function_type: 'validator',
  data_types: ['test-result', 'coverage-report'],
  deterministic: true,
  last_used: '2026-02-27T12:00:00.000Z',
  use_count: 42,
  success_rate: 0.95,
  avg_execution_ms: 1500,
};

const validSchemaLibraryEntry = {
  id: 'schema-001',
  name: 'TestResult',
  schema_path: 'schemas/test-result.schema.json',
  data_type: 'test-result',
  source_skill: 'test-runner',
  version: '2.0.1',
  fields: ['passed', 'failed', 'skipped', 'duration'],
  last_updated: '2026-02-27T12:00:00.000Z',
  reference_count: 15,
};

const validHandoffPattern = {
  id: 'pattern-001',
  type: 'phase-transition',
  source_agent_type: 'orchestrator',
  target_agent_type: 'executor',
  opcode: 'EXEC',
  observed_count: 12,
  avg_drift_score: 0.25,
  max_drift_score: 0.6,
  current_fidelity: 1,
  recommended_fidelity: 2,
  last_observed: '2026-02-27T12:00:00.000Z',
  promotion_history: [
    {
      from: 0,
      to: 1,
      reason: 'Drift exceeded threshold',
      timestamp: '2026-02-20T10:00:00.000Z',
    },
  ],
  contributing_bundles: ['bundle-001', 'bundle-002', 'bundle-003'],
};

const validDACPStatus = {
  total_handoffs: 100,
  total_bundles_assembled: 85,
  avg_drift_score: 0.3,
  fidelity_distribution: { '0': 10, '1': 30, '2': 35, '3': 10 },
  active_patterns: 8,
  template_count: 5,
  script_catalog_size: 25,
  schema_library_size: 12,
  pending_promotions: [],
  pending_demotions: [],
  last_retrospective: '2026-02-27T10:00:00.000Z',
};

// ============================================================================
// Schema Generation Tests
// ============================================================================

describe('generateDACPSchemas', () => {
  it('produces 9 schema files', () => {
    const expectedFiles = [
      'bundle-manifest.schema.json',
      'handoff-outcome.schema.json',
      'drift-score.schema.json',
      'bundle-template.schema.json',
      'fidelity-decision.schema.json',
      'script-catalog-entry.schema.json',
      'schema-library-entry.schema.json',
      'handoff-pattern.schema.json',
      'dacp-status.schema.json',
    ];
    for (const file of expectedFiles) {
      expect(existsSync(join(schemasDir, file))).toBe(true);
    }
  });

  it('each schema has $schema set to JSON Schema draft 2020-12', () => {
    for (const config of SCHEMA_CONFIGS) {
      const schema = JSON.parse(readFileSync(join(schemasDir, config.filename), 'utf-8'));
      expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    }
  });

  it('each schema has $id', () => {
    for (const config of SCHEMA_CONFIGS) {
      const schema = JSON.parse(readFileSync(join(schemasDir, config.filename), 'utf-8'));
      expect(schema.$id).toBe(`https://gsd.tools/schemas/dacp/${config.filename}`);
    }
  });

  it('each schema has type: object at root', () => {
    for (const config of SCHEMA_CONFIGS) {
      const schema = JSON.parse(readFileSync(join(schemasDir, config.filename), 'utf-8'));
      expect(schema.type).toBe('object');
    }
  });

  it('each schema has additionalProperties: false', () => {
    for (const config of SCHEMA_CONFIGS) {
      const schema = JSON.parse(readFileSync(join(schemasDir, config.filename), 'utf-8'));
      expect(schema.additionalProperties).toBe(false);
    }
  });

  it('each schema has a description field', () => {
    for (const config of SCHEMA_CONFIGS) {
      const schema = JSON.parse(readFileSync(join(schemasDir, config.filename), 'utf-8'));
      expect(schema.description).toBeTruthy();
    }
  });

  it('each schema has a required array', () => {
    for (const config of SCHEMA_CONFIGS) {
      const schema = JSON.parse(readFileSync(join(schemasDir, config.filename), 'utf-8'));
      expect(Array.isArray(schema.required)).toBe(true);
      expect(schema.required.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// SCHEMA_CONFIGS Tests
// ============================================================================

describe('SCHEMA_CONFIGS', () => {
  const expectedNames = [
    'bundle-manifest',
    'handoff-outcome',
    'drift-score',
    'bundle-template',
    'fidelity-decision',
    'script-catalog-entry',
    'schema-library-entry',
    'handoff-pattern',
    'dacp-status',
  ];

  it('has entries for all 9 DACP types', () => {
    const names = SCHEMA_CONFIGS.map((c) => c.name);
    for (const name of expectedNames) {
      expect(names).toContain(name);
    }
  });

  it('each config has name, schema, filename, and description', () => {
    for (const config of SCHEMA_CONFIGS) {
      expect(config.name).toBeTruthy();
      expect(config.schema).toBeDefined();
      expect(config.filename).toMatch(/\.schema\.json$/);
      expect(config.description).toBeTruthy();
    }
  });
});

// ============================================================================
// generateSingleSchema Tests
// ============================================================================

describe('generateSingleSchema', () => {
  it('returns a JSON Schema object with required metadata', () => {
    const config = SCHEMA_CONFIGS[0];
    const result = generateSingleSchema(config);
    expect(result.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(result.$id).toBeTruthy();
    expect(result.type).toBe('object');
  });
});

// ============================================================================
// Valid Fixture Tests
// ============================================================================

describe('Valid fixture validation', () => {
  it('valid BundleManifest fixture passes', () => {
    expect(getValidator('bundle-manifest.schema.json')(validBundleManifest)).toBe(true);
  });

  it('valid HandoffOutcome fixture passes', () => {
    expect(getValidator('handoff-outcome.schema.json')(validHandoffOutcome)).toBe(true);
  });

  it('valid DriftScore fixture passes', () => {
    expect(getValidator('drift-score.schema.json')(validDriftScore)).toBe(true);
  });

  it('valid BundleTemplate fixture passes', () => {
    expect(getValidator('bundle-template.schema.json')(validBundleTemplate)).toBe(true);
  });

  it('valid FidelityDecision fixture passes', () => {
    expect(getValidator('fidelity-decision.schema.json')(validFidelityDecision)).toBe(true);
  });

  it('valid ScriptCatalogEntry fixture passes', () => {
    expect(getValidator('script-catalog-entry.schema.json')(validScriptCatalogEntry)).toBe(true);
  });

  it('valid SchemaLibraryEntry fixture passes', () => {
    expect(getValidator('schema-library-entry.schema.json')(validSchemaLibraryEntry)).toBe(true);
  });

  it('valid HandoffPattern fixture passes', () => {
    expect(getValidator('handoff-pattern.schema.json')(validHandoffPattern)).toBe(true);
  });

  it('valid DACPStatus fixture passes', () => {
    expect(getValidator('dacp-status.schema.json')(validDACPStatus)).toBe(true);
  });
});

// ============================================================================
// Invalid Fixture Tests
// ============================================================================

describe('Invalid fixture rejection', () => {
  it('BundleManifest missing version field rejected', () => {
    const invalid = { ...validBundleManifest };
    delete (invalid as Record<string, unknown>).version;
    expect(getValidator('bundle-manifest.schema.json')(invalid)).toBe(false);
  });

  it('HandoffOutcome with intent_alignment out of range rejected', () => {
    const invalid = { ...validHandoffOutcome, intent_alignment: 1.5 };
    expect(getValidator('handoff-outcome.schema.json')(invalid)).toBe(false);
  });

  it('DriftScore with score out of range rejected', () => {
    const invalid = {
      ...validDriftScore,
      score: -0.1,
    };
    expect(getValidator('drift-score.schema.json')(invalid)).toBe(false);
  });

  it('BundleTemplate missing name rejected', () => {
    const invalid = { ...validBundleTemplate };
    delete (invalid as Record<string, unknown>).name;
    expect(getValidator('bundle-template.schema.json')(invalid)).toBe(false);
  });

  it('FidelityDecision with invalid data_complexity rejected', () => {
    const invalid = { ...validFidelityDecision, data_complexity: 'extreme' };
    expect(getValidator('fidelity-decision.schema.json')(invalid)).toBe(false);
  });
});

// ============================================================================
// Round-Trip Consistency Tests
// ============================================================================

describe('Round-trip consistency', () => {
  function roundTrip(
    zodSchema: { parse: (v: unknown) => unknown },
    jsonSchemaFilename: string,
    fixture: Record<string, unknown>,
  ): { zodValid: boolean; jsonSchemaValid: boolean } {
    let zodValid = false;
    try {
      zodSchema.parse(fixture);
      zodValid = true;
    } catch {
      zodValid = false;
    }

    const jsonSchemaValid = getValidator(jsonSchemaFilename)(fixture);

    return { zodValid, jsonSchemaValid };
  }

  it('BundleManifest: Zod and JSON Schema agree on valid fixture', () => {
    const result = roundTrip(BundleManifestSchema, 'bundle-manifest.schema.json', validBundleManifest);
    expect(result.zodValid).toBe(true);
    expect(result.jsonSchemaValid).toBe(true);
  });

  it('HandoffOutcome: Zod and JSON Schema agree on valid fixture', () => {
    const result = roundTrip(HandoffOutcomeSchema, 'handoff-outcome.schema.json', validHandoffOutcome);
    expect(result.zodValid).toBe(true);
    expect(result.jsonSchemaValid).toBe(true);
  });

  it('DriftScore: Zod and JSON Schema agree on valid fixture', () => {
    const result = roundTrip(DriftScoreSchema, 'drift-score.schema.json', validDriftScore);
    expect(result.zodValid).toBe(true);
    expect(result.jsonSchemaValid).toBe(true);
  });

  it('BundleTemplate: Zod and JSON Schema agree on valid fixture', () => {
    const result = roundTrip(BundleTemplateSchema, 'bundle-template.schema.json', validBundleTemplate);
    expect(result.zodValid).toBe(true);
    expect(result.jsonSchemaValid).toBe(true);
  });

  it('FidelityDecision: Zod and JSON Schema agree on valid fixture', () => {
    const result = roundTrip(FidelityDecisionSchema, 'fidelity-decision.schema.json', validFidelityDecision);
    expect(result.zodValid).toBe(true);
    expect(result.jsonSchemaValid).toBe(true);
  });

  it('ScriptCatalogEntry: Zod and JSON Schema agree on valid fixture', () => {
    const result = roundTrip(ScriptCatalogEntrySchema, 'script-catalog-entry.schema.json', validScriptCatalogEntry);
    expect(result.zodValid).toBe(true);
    expect(result.jsonSchemaValid).toBe(true);
  });

  it('SchemaLibraryEntry: Zod and JSON Schema agree on valid fixture', () => {
    const result = roundTrip(SchemaLibraryEntrySchema, 'schema-library-entry.schema.json', validSchemaLibraryEntry);
    expect(result.zodValid).toBe(true);
    expect(result.jsonSchemaValid).toBe(true);
  });

  it('HandoffPattern: Zod and JSON Schema agree on valid fixture', () => {
    const result = roundTrip(HandoffPatternSchema, 'handoff-pattern.schema.json', validHandoffPattern);
    expect(result.zodValid).toBe(true);
    expect(result.jsonSchemaValid).toBe(true);
  });

  it('DACPStatus: Zod and JSON Schema agree on valid fixture', () => {
    const result = roundTrip(DACPStatusSchema, 'dacp-status.schema.json', validDACPStatus);
    expect(result.zodValid).toBe(true);
    expect(result.jsonSchemaValid).toBe(true);
  });
});
