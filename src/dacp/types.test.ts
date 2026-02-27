/**
 * TDD tests for DACP types, Zod schemas, and DriftScore calculation.
 *
 * RED phase: all tests import from ./types.js which does not exist yet.
 *
 * @module dacp/types.test
 */

import { describe, it, expect } from 'vitest';
import {
  DACP_VERSION,
  FIDELITY_NAMES,
  isCompatible,
  FidelityLevelSchema,
  BusOpcodeSchema,
  ScriptFunctionSchema,
  HumanOriginSchema,
  DataManifestEntrySchema,
  CodeManifestEntrySchema,
  AssemblyRationaleSchema,
  ProvenanceSchema,
  BundleManifestSchema,
  HandoffOutcomeSchema,
  DriftScoreComponentsSchema,
  DriftScoreSchema,
  calculateDriftScore,
  ScriptCatalogEntrySchema,
  SchemaLibraryEntrySchema,
  FidelityChangeSchema,
  HandoffPatternSchema,
  DACPStatusSchema,
  BundleTemplateSchema,
  FidelityDecisionSchema,
  ValidationErrorSchema,
  ValidationWarningSchema,
  BundleValidationResultSchema,
} from './types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const validBundleManifest = {
  version: '1.0.0',
  fidelity_level: 2 as const,
  source_agent: 'orchestrator',
  target_agent: 'executor-01',
  opcode: 'EXEC' as const,
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
  fidelity_level: 2 as const,
  intent_alignment: 0.85,
  rework_required: false,
  tokens_spent_interpreting: 1200,
  code_modifications: 2,
  verification_pass: true,
  timestamp: '2026-02-27T12:00:00.000Z',
};

const validScriptCatalogEntry = {
  id: 'cat-001',
  skill_source: 'test-runner',
  skill_version: '2.0.1',
  script_path: 'scripts/run-tests.sh',
  script_hash: 'sha256:abc123def456',
  function_type: 'validator' as const,
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

const validBundleTemplate = {
  id: 'tmpl-skill-handoff',
  name: 'Skill Handoff',
  handoff_type: 'skill-handoff',
  description: 'Template for handing off skill execution context',
  default_fidelity: 2 as const,
  data_schema_refs: ['schemas/skill-context.schema.json'],
  code_script_refs: ['scripts/skill-executor.sh'],
  test_fixture_refs: ['fixtures/skill-handoff-valid.json'],
};

const validFidelityDecision = {
  handoff_type: 'phase-transition',
  data_complexity: 'structured' as const,
  historical_drift_rate: 0.35,
  available_skills: 5,
  token_budget_remaining: 50000,
  safety_critical: false,
};

const validHandoffPattern = {
  id: 'pattern-001',
  type: 'phase-transition',
  source_agent_type: 'orchestrator',
  target_agent_type: 'executor',
  opcode: 'EXEC' as const,
  observed_count: 12,
  avg_drift_score: 0.25,
  max_drift_score: 0.6,
  current_fidelity: 1 as const,
  recommended_fidelity: 2 as const,
  last_observed: '2026-02-27T12:00:00.000Z',
  promotion_history: [
    {
      from: 0 as const,
      to: 1 as const,
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
// FidelityLevel & Constants
// ============================================================================

describe('DACP Constants', () => {
  it('DACP_VERSION equals 1.0.0', () => {
    expect(DACP_VERSION).toBe('1.0.0');
  });

  it('FIDELITY_NAMES maps 0-4 to correct string names', () => {
    expect(FIDELITY_NAMES[0]).toBe('PROSE');
    expect(FIDELITY_NAMES[1]).toBe('PROSE_DATA');
    expect(FIDELITY_NAMES[2]).toBe('PROSE_DATA_SCHEMA');
    expect(FIDELITY_NAMES[3]).toBe('PROSE_DATA_CODE');
    expect(FIDELITY_NAMES[4]).toBe('PROSE_DATA_CODE_TESTS');
  });

  it('isCompatible returns true for same major version', () => {
    expect(isCompatible('1.2.0')).toBe(true);
    expect(isCompatible('1.0.0')).toBe(true);
    expect(isCompatible('1.99.99')).toBe(true);
  });

  it('isCompatible returns false for different major version', () => {
    expect(isCompatible('2.0.0')).toBe(false);
    expect(isCompatible('0.9.0')).toBe(false);
  });
});

// ============================================================================
// FidelityLevel Schema
// ============================================================================

describe('FidelityLevelSchema', () => {
  it('accepts valid levels 0-4', () => {
    for (const level of [0, 1, 2, 3, 4]) {
      expect(FidelityLevelSchema.parse(level)).toBe(level);
    }
  });

  it('rejects invalid levels', () => {
    expect(() => FidelityLevelSchema.parse(5)).toThrow();
    expect(() => FidelityLevelSchema.parse(-1)).toThrow();
    expect(() => FidelityLevelSchema.parse(1.5)).toThrow();
  });
});

// ============================================================================
// BundleManifestSchema
// ============================================================================

describe('BundleManifestSchema', () => {
  it('validates correct manifest with all required fields', () => {
    const result = BundleManifestSchema.parse(validBundleManifest);
    expect(result.version).toBe('1.0.0');
    expect(result.fidelity_level).toBe(2);
  });

  it('rejects manifest missing version field', () => {
    const invalid = { ...validBundleManifest };
    delete (invalid as Record<string, unknown>).version;
    expect(() => BundleManifestSchema.parse(invalid)).toThrow();
  });

  it('rejects invalid fidelity_level', () => {
    expect(() =>
      BundleManifestSchema.parse({ ...validBundleManifest, fidelity_level: 5 })
    ).toThrow();
    expect(() =>
      BundleManifestSchema.parse({ ...validBundleManifest, fidelity_level: -1 })
    ).toThrow();
  });

  it('rejects invalid opcode', () => {
    expect(() =>
      BundleManifestSchema.parse({ ...validBundleManifest, opcode: 'INVALID' })
    ).toThrow();
  });

  it('validates data_manifest entries shape', () => {
    const result = BundleManifestSchema.parse(validBundleManifest);
    const entry = result.data_manifest['config.json'];
    expect(entry).toBeDefined();
    expect(entry.purpose).toBe('Phase configuration');
    expect(entry.source).toBe('.planning/phases/05/config.json');
  });

  it('validates code_manifest entries shape', () => {
    const result = BundleManifestSchema.parse(validBundleManifest);
    const entry = result.code_manifest['setup.sh'];
    expect(entry).toBeDefined();
    expect(entry.source_skill).toBe('project-scaffold');
    expect(entry.deterministic).toBe(true);
  });

  it('validates assembly_rationale shape', () => {
    const result = BundleManifestSchema.parse(validBundleManifest);
    expect(result.assembly_rationale.level_justification).toBeTruthy();
    expect(Array.isArray(result.assembly_rationale.skills_used)).toBe(true);
    expect(Array.isArray(result.assembly_rationale.generated_artifacts)).toBe(true);
    expect(Array.isArray(result.assembly_rationale.reused_artifacts)).toBe(true);
  });

  it('validates provenance shape', () => {
    const result = BundleManifestSchema.parse(validBundleManifest);
    expect(result.provenance.assembled_by).toBe('dacp-assembler');
    expect(result.provenance.assembled_at).toBeTruthy();
    expect(result.provenance.skill_versions['project-scaffold']).toBe('1.2.0');
  });
});

// ============================================================================
// HandoffOutcomeSchema
// ============================================================================

describe('HandoffOutcomeSchema', () => {
  it('validates correct outcome with all fields', () => {
    const result = HandoffOutcomeSchema.parse(validHandoffOutcome);
    expect(result.bundle_id).toBe('bundle-abc-123');
    expect(result.intent_alignment).toBe(0.85);
  });

  it('rejects intent_alignment out of range', () => {
    expect(() =>
      HandoffOutcomeSchema.parse({ ...validHandoffOutcome, intent_alignment: 1.5 })
    ).toThrow();
    expect(() =>
      HandoffOutcomeSchema.parse({ ...validHandoffOutcome, intent_alignment: -0.1 })
    ).toThrow();
  });

  it('rejects negative code_modifications', () => {
    expect(() =>
      HandoffOutcomeSchema.parse({ ...validHandoffOutcome, code_modifications: -1 })
    ).toThrow();
  });

  it('rejects missing bundle_id', () => {
    const invalid = { ...validHandoffOutcome };
    delete (invalid as Record<string, unknown>).bundle_id;
    expect(() => HandoffOutcomeSchema.parse(invalid)).toThrow();
  });
});

// ============================================================================
// DriftScore Calculation
// ============================================================================

describe('calculateDriftScore', () => {
  it('returns score 0.0 and recommendation maintain for zero drift', () => {
    const outcome = {
      ...validHandoffOutcome,
      intent_alignment: 1.0,
      rework_required: false,
      verification_pass: true,
      code_modifications: 0,
    };
    const result = calculateDriftScore(outcome);
    expect(result.score).toBe(0.0);
    expect(result.recommendation).toBe('demote');
  });

  it('produces non-zero intent_miss when intent_alignment is low', () => {
    const outcome = {
      ...validHandoffOutcome,
      intent_alignment: 0.3,
      rework_required: false,
      verification_pass: true,
      code_modifications: 0,
    };
    const result = calculateDriftScore(outcome);
    expect(result.components.intent_miss).toBeCloseTo(0.7, 5);
    expect(result.score).toBeGreaterThan(0);
  });

  it('produces rework_penalty when rework_required is true', () => {
    const outcome = {
      ...validHandoffOutcome,
      intent_alignment: 1.0,
      rework_required: true,
      verification_pass: true,
      code_modifications: 0,
    };
    const result = calculateDriftScore(outcome);
    expect(result.components.rework_penalty).toBe(0.3);
    expect(result.score).toBeGreaterThan(0);
  });

  it('produces verification_penalty when verification_pass is false', () => {
    const outcome = {
      ...validHandoffOutcome,
      intent_alignment: 1.0,
      rework_required: false,
      verification_pass: false,
      code_modifications: 0,
    };
    const result = calculateDriftScore(outcome);
    expect(result.components.verification_penalty).toBe(0.4);
    expect(result.score).toBeGreaterThan(0);
  });

  it('produces modification_penalty proportional to code_modifications', () => {
    const outcome = {
      ...validHandoffOutcome,
      intent_alignment: 1.0,
      rework_required: false,
      verification_pass: true,
      code_modifications: 5,
    };
    const result = calculateDriftScore(outcome);
    expect(result.components.modification_penalty).toBeCloseTo(0.5, 5);
    expect(result.score).toBeGreaterThan(0);
  });

  it('caps modification_penalty at 1.0', () => {
    const outcome = {
      ...validHandoffOutcome,
      intent_alignment: 1.0,
      rework_required: false,
      verification_pass: true,
      code_modifications: 20,
    };
    const result = calculateDriftScore(outcome);
    expect(result.components.modification_penalty).toBe(1.0);
  });

  it('calculates composite score as weighted sum clamped to [0, 1]', () => {
    // intent_miss = 1 - 0.3 = 0.7, rework = 0.3, verif = 0.4, mod = 0.5
    // score = 0.35*0.7 + 0.25*0.3 + 0.25*0.4 + 0.15*0.5 = 0.245 + 0.075 + 0.1 + 0.075 = 0.495
    const outcome = {
      ...validHandoffOutcome,
      intent_alignment: 0.3,
      rework_required: true,
      verification_pass: false,
      code_modifications: 5,
    };
    const result = calculateDriftScore(outcome);
    expect(result.score).toBeCloseTo(0.495, 3);
  });

  it('recommends promote when score > 0.6', () => {
    const outcome = {
      ...validHandoffOutcome,
      intent_alignment: 0.0,
      rework_required: true,
      verification_pass: false,
      code_modifications: 10,
    };
    const result = calculateDriftScore(outcome);
    expect(result.score).toBeGreaterThan(0.6);
    expect(result.recommendation).toBe('promote');
  });

  it('recommends demote when score < 0.2', () => {
    const outcome = {
      ...validHandoffOutcome,
      intent_alignment: 1.0,
      rework_required: false,
      verification_pass: true,
      code_modifications: 0,
    };
    const result = calculateDriftScore(outcome);
    expect(result.score).toBeLessThan(0.2);
    expect(result.recommendation).toBe('demote');
  });

  it('recommends maintain when score is between 0.2 and 0.6', () => {
    const outcome = {
      ...validHandoffOutcome,
      intent_alignment: 0.5,
      rework_required: true,
      verification_pass: true,
      code_modifications: 2,
    };
    const result = calculateDriftScore(outcome);
    expect(result.score).toBeGreaterThanOrEqual(0.2);
    expect(result.score).toBeLessThanOrEqual(0.6);
    expect(result.recommendation).toBe('maintain');
  });
});

// ============================================================================
// DriftScoreSchema
// ============================================================================

describe('DriftScoreSchema', () => {
  it('validates a correct drift score object', () => {
    const valid = {
      score: 0.45,
      components: {
        intent_miss: 0.3,
        rework_penalty: 0.0,
        verification_penalty: 0.4,
        modification_penalty: 0.2,
      },
      recommendation: 'maintain' as const,
    };
    expect(() => DriftScoreSchema.parse(valid)).not.toThrow();
  });

  it('rejects score out of range', () => {
    const invalid = {
      score: 1.5,
      components: {
        intent_miss: 0.0,
        rework_penalty: 0.0,
        verification_penalty: 0.0,
        modification_penalty: 0.0,
      },
      recommendation: 'maintain' as const,
    };
    expect(() => DriftScoreSchema.parse(invalid)).toThrow();
  });
});

// ============================================================================
// Catalog & Library Schemas
// ============================================================================

describe('ScriptCatalogEntrySchema', () => {
  it('validates correct entry', () => {
    expect(() => ScriptCatalogEntrySchema.parse(validScriptCatalogEntry)).not.toThrow();
  });

  it('rejects invalid function_type', () => {
    expect(() =>
      ScriptCatalogEntrySchema.parse({ ...validScriptCatalogEntry, function_type: 'invalid' })
    ).toThrow();
  });
});

describe('SchemaLibraryEntrySchema', () => {
  it('validates correct entry', () => {
    expect(() => SchemaLibraryEntrySchema.parse(validSchemaLibraryEntry)).not.toThrow();
  });

  it('rejects missing name', () => {
    const invalid = { ...validSchemaLibraryEntry };
    delete (invalid as Record<string, unknown>).name;
    expect(() => SchemaLibraryEntrySchema.parse(invalid)).toThrow();
  });
});

// ============================================================================
// Retrospective Types
// ============================================================================

describe('FidelityChangeSchema', () => {
  it('validates correct change', () => {
    const valid = {
      from: 0 as const,
      to: 1 as const,
      reason: 'Drift exceeded threshold',
      timestamp: '2026-02-27T10:00:00.000Z',
    };
    expect(() => FidelityChangeSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid fidelity level in from', () => {
    expect(() =>
      FidelityChangeSchema.parse({
        from: 5,
        to: 1,
        reason: 'test',
        timestamp: '2026-02-27T10:00:00.000Z',
      })
    ).toThrow();
  });
});

describe('HandoffPatternSchema', () => {
  it('validates correct pattern', () => {
    expect(() => HandoffPatternSchema.parse(validHandoffPattern)).not.toThrow();
  });

  it('rejects avg_drift_score out of range', () => {
    expect(() =>
      HandoffPatternSchema.parse({ ...validHandoffPattern, avg_drift_score: 1.5 })
    ).toThrow();
  });
});

describe('DACPStatusSchema', () => {
  it('validates correct status', () => {
    expect(() => DACPStatusSchema.parse(validDACPStatus)).not.toThrow();
  });

  it('rejects negative total_handoffs', () => {
    expect(() =>
      DACPStatusSchema.parse({ ...validDACPStatus, total_handoffs: -1 })
    ).toThrow();
  });
});

// ============================================================================
// Template & Decision Types
// ============================================================================

describe('BundleTemplateSchema', () => {
  it('validates correct template', () => {
    expect(() => BundleTemplateSchema.parse(validBundleTemplate)).not.toThrow();
  });

  it('rejects missing name', () => {
    const invalid = { ...validBundleTemplate };
    delete (invalid as Record<string, unknown>).name;
    expect(() => BundleTemplateSchema.parse(invalid)).toThrow();
  });
});

describe('FidelityDecisionSchema', () => {
  it('validates correct decision', () => {
    expect(() => FidelityDecisionSchema.parse(validFidelityDecision)).not.toThrow();
  });

  it('rejects invalid data_complexity value', () => {
    expect(() =>
      FidelityDecisionSchema.parse({ ...validFidelityDecision, data_complexity: 'extreme' })
    ).toThrow();
  });
});

// ============================================================================
// Validation Types
// ============================================================================

describe('BundleValidationResultSchema', () => {
  it('validates correct result with errors and warnings', () => {
    const valid = {
      valid: false,
      errors: [
        { field: 'version', message: 'Missing required field', severity: 'fatal' as const },
      ],
      warnings: [
        { field: 'description', message: 'Empty description', suggestion: 'Add a description' },
      ],
      fidelity_verified: false,
      schema_coverage: 0.8,
    };
    expect(() => BundleValidationResultSchema.parse(valid)).not.toThrow();
  });

  it('validates result with empty arrays', () => {
    const valid = {
      valid: true,
      errors: [],
      warnings: [],
      fidelity_verified: true,
      schema_coverage: 1.0,
    };
    expect(() => BundleValidationResultSchema.parse(valid)).not.toThrow();
  });

  it('rejects error with invalid severity', () => {
    const invalid = {
      valid: false,
      errors: [
        { field: 'version', message: 'Missing', severity: 'minor' },
      ],
      warnings: [],
      fidelity_verified: false,
      schema_coverage: 0.0,
    };
    expect(() => BundleValidationResultSchema.parse(invalid)).toThrow();
  });

  it('rejects warning without suggestion field', () => {
    const invalid = {
      valid: false,
      errors: [],
      warnings: [
        { field: 'description', message: 'Empty' },
      ],
      fidelity_verified: false,
      schema_coverage: 0.0,
    };
    expect(() => BundleValidationResultSchema.parse(invalid)).toThrow();
  });
});
