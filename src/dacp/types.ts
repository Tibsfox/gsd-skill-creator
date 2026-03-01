/**
 * DACP (Deterministic Agent Communication Protocol) type definitions.
 *
 * Defines all DACP data structures as Zod schemas with inferred TypeScript
 * types. This is the foundation module for the entire DACP system -- every
 * other component (assembler, interpreter, retrospective analyzer, templates,
 * CLI, dashboard) imports from here.
 *
 * Pattern: Zod schema first, inferred type second (single source of truth).
 *
 * @module dacp/types
 */

import { z } from 'zod';

// ============================================================================
// Constants & Version
// ============================================================================

/** Current DACP protocol version. */
export const DACP_VERSION = '1.0.0';

/**
 * Check whether a bundle version is compatible with this DACP implementation.
 * Compatibility is determined by major version only (semver major match).
 */
export function isCompatible(bundleVersion: string): boolean {
  const major = bundleVersion.split('.')[0];
  const currentMajor = DACP_VERSION.split('.')[0];
  return major === currentMajor;
}

/**
 * Fidelity level schema. Levels 0-4 represent increasing bundle complexity:
 * - 0: PROSE (markdown-only intent)
 * - 1: PROSE_DATA (markdown + structured JSON data)
 * - 2: PROSE_DATA_SCHEMA (markdown + data + JSON Schema validation)
 * - 3: PROSE_DATA_CODE (markdown + data + executable scripts)
 * - 4: PROSE_DATA_CODE_TESTS (full bundle with test fixtures)
 */
export const FidelityLevelSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

/** Inferred TypeScript type for FidelityLevel. */
export type FidelityLevel = z.infer<typeof FidelityLevelSchema>;

/** Human-readable names for each fidelity level. */
export const FIDELITY_NAMES: Record<FidelityLevel, string> = {
  0: 'PROSE',
  1: 'PROSE_DATA',
  2: 'PROSE_DATA_SCHEMA',
  3: 'PROSE_DATA_CODE',
  4: 'PROSE_DATA_CODE_TESTS',
};

/**
 * Bus opcode schema. Defines the operation type for the GSD filesystem bus.
 * These match the existing ISA encoding opcodes.
 */
export const BusOpcodeSchema = z.enum([
  'EXEC',
  'VERIFY',
  'TRANSFORM',
  'CONFIG',
  'RESEARCH',
  'REPORT',
  'QUESTION',
  'PATCH',
  'ALERT',
]);

/** Inferred TypeScript type for BusOpcode. */
export type BusOpcode = z.infer<typeof BusOpcodeSchema>;

/**
 * Script function type schema. Categorizes scripts by their role in
 * the data processing pipeline.
 */
export const ScriptFunctionSchema = z.enum([
  'parser',
  'validator',
  'transformer',
  'formatter',
  'analyzer',
  'generator',
]);

/** Inferred TypeScript type for ScriptFunction. */
export type ScriptFunction = z.infer<typeof ScriptFunctionSchema>;

// ============================================================================
// Bundle Manifest
// ============================================================================

/**
 * Human origin metadata tracking how the handoff traces back to user intent.
 * Links every bundle to the original vision document, planning phase, and
 * user directive that initiated the work.
 */
export const HumanOriginSchema = z.object({
  /** Path to the vision/project document */
  vision_doc: z.string(),

  /** Phase number or identifier */
  planning_phase: z.string(),

  /** The user's original directive or request */
  user_directive: z.string(),
});

/** Inferred TypeScript type for HumanOrigin. */
export type HumanOrigin = z.infer<typeof HumanOriginSchema>;

/**
 * Data manifest entry describing a single data file in the bundle.
 * Each entry records what the data is for and where it came from.
 */
export const DataManifestEntrySchema = z.object({
  /** What this data file is used for */
  purpose: z.string(),

  /** Source path or origin of this data */
  source: z.string(),

  /** Optional reference to a JSON Schema for validation */
  schema_ref: z.string().optional(),
});

/** Inferred TypeScript type for DataManifestEntry. */
export type DataManifestEntry = z.infer<typeof DataManifestEntrySchema>;

/**
 * Code manifest entry describing a single script in the bundle.
 * Scripts always have provenance (source_skill) and a determinism flag
 * indicating whether they produce identical output for identical input.
 */
export const CodeManifestEntrySchema = z.object({
  /** What this script does */
  purpose: z.string(),

  /** Programming language (e.g., 'bash', 'python', 'typescript') */
  language: z.string(),

  /** Skill that provided this script (provenance) */
  source_skill: z.string(),

  /** Whether the script produces identical output for identical input */
  deterministic: z.boolean(),
});

/** Inferred TypeScript type for CodeManifestEntry. */
export type CodeManifestEntry = z.infer<typeof CodeManifestEntrySchema>;

/**
 * Assembly rationale recording WHY the assembler chose this fidelity level
 * and WHAT skills/artifacts were used. Provides an audit trail for every
 * bundle composition decision.
 */
export const AssemblyRationaleSchema = z.object({
  /** Explanation for why this fidelity level was chosen */
  level_justification: z.string(),

  /** Skills consulted or used during assembly */
  skills_used: z.array(z.string()),

  /** Artifacts generated fresh for this bundle */
  generated_artifacts: z.array(z.string()),

  /** Artifacts reused from previous bundles or the skill library */
  reused_artifacts: z.array(z.string()),
});

/** Inferred TypeScript type for AssemblyRationale. */
export type AssemblyRationale = z.infer<typeof AssemblyRationaleSchema>;

/**
 * Provenance metadata recording who assembled the bundle, when, and
 * which skill versions were used. Ensures every bundle has a traceable
 * origin for debugging and retrospective analysis.
 */
export const ProvenanceSchema = z.object({
  /** Identifier of the assembler that created this bundle */
  assembled_by: z.string(),

  /** ISO 8601 timestamp of assembly */
  assembled_at: z.string(),

  /** Map of skill name to version used during assembly */
  skill_versions: z.record(z.string(), z.string()),
});

/** Inferred TypeScript type for Provenance. */
export type Provenance = z.infer<typeof ProvenanceSchema>;

/**
 * Bundle manifest: the top-level descriptor for a DACP bundle directory.
 * Contains the three-part composition (intent + data + code) plus metadata
 * about fidelity, provenance, and assembly rationale.
 */
export const BundleManifestSchema = z.object({
  /** DACP protocol version */
  version: z.string(),

  /** Fidelity level of this bundle (0-4) */
  fidelity_level: FidelityLevelSchema,

  /** Agent that assembled/sent this bundle */
  source_agent: z.string(),

  /** Agent that will receive/interpret this bundle */
  target_agent: z.string(),

  /** GSD bus operation code */
  opcode: BusOpcodeSchema,

  /** Human-readable summary of the handoff intent */
  intent_summary: z.string(),

  /** Trace back to the original human directive */
  human_origin: HumanOriginSchema,

  /** Data files included in the bundle, keyed by filename */
  data_manifest: z.record(z.string(), DataManifestEntrySchema),

  /** Script files included in the bundle, keyed by filename */
  code_manifest: z.record(z.string(), CodeManifestEntrySchema),

  /** Why this fidelity level and these artifacts were chosen */
  assembly_rationale: AssemblyRationaleSchema,

  /** Who assembled this bundle, when, and with what */
  provenance: ProvenanceSchema,
});

/** Inferred TypeScript type for BundleManifest. */
export type BundleManifest = z.infer<typeof BundleManifestSchema>;

// ============================================================================
// Handoff Outcome & Drift Score
// ============================================================================

/**
 * Handoff outcome: the result of a receiving agent processing a bundle.
 * Captures alignment, rework, verification, and modification metrics
 * that feed into drift score calculation.
 */
export const HandoffOutcomeSchema = z.object({
  /** Unique identifier of the bundle that was processed */
  bundle_id: z.string(),

  /** Fidelity level of the processed bundle */
  fidelity_level: FidelityLevelSchema,

  /** How well the bundle's intent matched what was actually done (0.0-1.0) */
  intent_alignment: z.number().min(0).max(1),

  /** Whether the receiving agent had to rework any part of the handoff */
  rework_required: z.boolean(),

  /** Tokens spent interpreting the bundle before starting work */
  tokens_spent_interpreting: z.number().int().nonnegative(),

  /** Number of code modifications made beyond what the bundle specified */
  code_modifications: z.number().int().nonnegative(),

  /** Whether verification passed on the first attempt */
  verification_pass: z.boolean(),

  /** ISO 8601 timestamp of when the outcome was recorded */
  timestamp: z.string(),
});

/** Inferred TypeScript type for HandoffOutcome. */
export type HandoffOutcome = z.infer<typeof HandoffOutcomeSchema>;

/**
 * Components of a drift score, broken down by source of drift.
 * Each component is a 0.0-1.0 penalty value.
 */
export const DriftScoreComponentsSchema = z.object({
  /** Penalty from intent misalignment (1 - intent_alignment) */
  intent_miss: z.number().min(0).max(1),

  /** Penalty from rework being required (0.3 if true, 0.0 if false) */
  rework_penalty: z.number().min(0).max(1),

  /** Penalty from verification failure (0.4 if failed, 0.0 if passed) */
  verification_penalty: z.number().min(0).max(1),

  /** Penalty from code modifications (modifications / 10, capped at 1.0) */
  modification_penalty: z.number().min(0).max(1),
});

/** Inferred TypeScript type for DriftScoreComponents. */
export type DriftScoreComponents = z.infer<typeof DriftScoreComponentsSchema>;

/**
 * Composite drift score with component breakdown and fidelity recommendation.
 * Score range: 0.0 (no drift) to 1.0 (maximum drift).
 * Recommendation: promote (increase fidelity), demote (decrease), or maintain.
 */
export const DriftScoreSchema = z.object({
  /** Composite drift score (0.0-1.0) */
  score: z.number().min(0).max(1),

  /** Breakdown by drift source */
  components: DriftScoreComponentsSchema,

  /** Fidelity adjustment recommendation based on score */
  recommendation: z.enum(['promote', 'demote', 'maintain']),

  /** Recommended fidelity level (only present when promoting or demoting) */
  recommended_level: FidelityLevelSchema.optional(),
});

/** Inferred TypeScript type for DriftScore. */
export type DriftScore = z.infer<typeof DriftScoreSchema>;

/**
 * General-purpose DriftScore calculation for the bundle assembler context.
 *
 * @justification Type: Accepted heuristic (intentionally different from retrospective/drift.ts)
 * Weight set: 35/25/25/15 -- balanced for prospective assembly decisions
 * where all four signals contribute more equally. Compared to the
 * retrospective analyzer (40/30/20/10), the assembler:
 * - Gives less weight to intent_miss (35% vs 40%) because assembly
 *   happens before outcomes are known
 * - Equalizes rework and verification penalties (25% each) because
 *   both are predictive signals during assembly
 * - Gives more weight to modification_penalty (15% vs 10%) because
 *   modification count is measurable at assembly time
 *
 * Thresholds: promote > 0.6, demote < 0.2 (wider band than retrospective
 * because prospective decisions should be more conservative about level changes)
 *
 * @see src/dacp/retrospective/drift.ts for the retrospective-tuned variant
 */
export function calculateDriftScore(outcome: HandoffOutcome): DriftScore {
  const intent_miss = 1 - outcome.intent_alignment;
  const rework_penalty = outcome.rework_required ? 0.3 : 0.0;
  const verification_penalty = outcome.verification_pass ? 0.0 : 0.4;
  const modification_penalty = Math.min(outcome.code_modifications / 10, 1.0);

  const rawScore =
    0.35 * intent_miss +
    0.25 * rework_penalty +
    0.25 * verification_penalty +
    0.15 * modification_penalty;

  const score = Math.max(0, Math.min(1, rawScore));

  let recommendation: 'promote' | 'demote' | 'maintain';
  if (score > 0.6) {
    recommendation = 'promote';
  } else if (score < 0.2) {
    recommendation = 'demote';
  } else {
    recommendation = 'maintain';
  }

  return {
    score,
    components: {
      intent_miss,
      rework_penalty,
      verification_penalty,
      modification_penalty,
    },
    recommendation,
  };
}

// ============================================================================
// Catalog & Library Types
// ============================================================================

/**
 * Script catalog entry: indexes a single skill script with provenance,
 * function classification, and usage tracking. The catalog enables the
 * assembler to find relevant scripts for a given handoff type.
 */
export const ScriptCatalogEntrySchema = z.object({
  /** Unique catalog entry identifier */
  id: z.string(),

  /** Skill that provided this script */
  skill_source: z.string(),

  /** Version of the source skill */
  skill_version: z.string(),

  /** Filesystem path to the script */
  script_path: z.string(),

  /** Content hash for integrity verification */
  script_hash: z.string(),

  /** Functional classification of the script */
  function_type: ScriptFunctionSchema,

  /** Data types this script operates on */
  data_types: z.array(z.string()),

  /** Optional reference to the input data schema */
  input_schema_ref: z.string().optional(),

  /** Optional reference to the output data schema */
  output_schema_ref: z.string().optional(),

  /** Whether the script produces identical output for identical input */
  deterministic: z.boolean(),

  /** ISO 8601 timestamp of last use */
  last_used: z.string(),

  /** Total number of times this script has been used */
  use_count: z.number().int().nonnegative(),

  /** Success rate across all uses (0.0-1.0) */
  success_rate: z.number().min(0).max(1),

  /** Average execution time in milliseconds */
  avg_execution_ms: z.number().nonnegative(),
});

/** Inferred TypeScript type for ScriptCatalogEntry. */
export type ScriptCatalogEntry = z.infer<typeof ScriptCatalogEntrySchema>;

/**
 * Schema library entry: indexes a single JSON Schema with provenance and
 * usage tracking. The library enables the assembler and interpreter to find
 * relevant schemas for data validation.
 */
export const SchemaLibraryEntrySchema = z.object({
  /** Unique library entry identifier */
  id: z.string(),

  /** Human-readable schema name */
  name: z.string(),

  /** Filesystem path to the JSON Schema file */
  schema_path: z.string(),

  /** Data type this schema validates */
  data_type: z.string(),

  /** Skill that provided this schema */
  source_skill: z.string(),

  /** Version of the source skill */
  version: z.string(),

  /** Top-level field names in the schema */
  fields: z.array(z.string()),

  /** ISO 8601 timestamp of last update */
  last_updated: z.string(),

  /** Number of bundles referencing this schema */
  reference_count: z.number().int().nonnegative(),
});

/** Inferred TypeScript type for SchemaLibraryEntry. */
export type SchemaLibraryEntry = z.infer<typeof SchemaLibraryEntrySchema>;

// ============================================================================
// Retrospective Types
// ============================================================================

/**
 * Fidelity change record: captures a single promotion or demotion event
 * in a handoff pattern's history. Used for cooldown enforcement and trend
 * analysis.
 */
export const FidelityChangeSchema = z.object({
  /** Previous fidelity level */
  from: FidelityLevelSchema,

  /** New fidelity level */
  to: FidelityLevelSchema,

  /** Human-readable reason for the change */
  reason: z.string(),

  /** ISO 8601 timestamp of the change */
  timestamp: z.string(),
});

/** Inferred TypeScript type for FidelityChange. */
export type FidelityChange = z.infer<typeof FidelityChangeSchema>;

/**
 * Handoff pattern: identifies a recurring handoff type with aggregated drift
 * statistics and fidelity recommendations. Patterns are identified by the
 * combination of source/target agent types and opcode.
 */
export const HandoffPatternSchema = z.object({
  /** Unique pattern identifier */
  id: z.string(),

  /** Pattern type label */
  type: z.string(),

  /** Type of the sending agent */
  source_agent_type: z.string(),

  /** Type of the receiving agent */
  target_agent_type: z.string(),

  /** GSD bus opcode for this pattern */
  opcode: BusOpcodeSchema,

  /** Number of times this pattern has been observed */
  observed_count: z.number().int().nonnegative(),

  /** Average drift score across all observations (0.0-1.0) */
  avg_drift_score: z.number().min(0).max(1),

  /** Maximum drift score observed (0.0-1.0) */
  max_drift_score: z.number().min(0).max(1),

  /** Current fidelity level assigned to this pattern */
  current_fidelity: FidelityLevelSchema,

  /** Recommended fidelity level based on drift analysis */
  recommended_fidelity: FidelityLevelSchema,

  /** ISO 8601 timestamp of the most recent observation */
  last_observed: z.string(),

  /** History of fidelity level changes */
  promotion_history: z.array(FidelityChangeSchema),

  /** Bundle IDs that contributed to this pattern */
  contributing_bundles: z.array(z.string()),
});

/** Inferred TypeScript type for HandoffPattern. */
export type HandoffPattern = z.infer<typeof HandoffPatternSchema>;

/**
 * DACP system status: aggregate view of the entire DACP system's state.
 * Used by the CLI `status` command and the dashboard panel.
 */
export const DACPStatusSchema = z.object({
  /** Total number of handoffs processed */
  total_handoffs: z.number().int().nonnegative(),

  /** Total number of bundles assembled */
  total_bundles_assembled: z.number().int().nonnegative(),

  /** Average drift score across all handoffs (0.0-1.0) */
  avg_drift_score: z.number().min(0).max(1),

  /** Distribution of bundles across fidelity levels */
  fidelity_distribution: z.record(z.string(), z.number()),

  /** Number of active handoff patterns */
  active_patterns: z.number().int().nonnegative(),

  /** Number of registered bundle templates */
  template_count: z.number().int().nonnegative(),

  /** Number of scripts in the catalog */
  script_catalog_size: z.number().int().nonnegative(),

  /** Number of schemas in the library */
  schema_library_size: z.number().int().nonnegative(),

  /** Patterns with pending promotion recommendations */
  pending_promotions: z.array(HandoffPatternSchema),

  /** Patterns with pending demotion recommendations */
  pending_demotions: z.array(HandoffPatternSchema),

  /** ISO 8601 timestamp of the last retrospective analysis */
  last_retrospective: z.string(),
});

/** Inferred TypeScript type for DACPStatus. */
export type DACPStatus = z.infer<typeof DACPStatusSchema>;

// ============================================================================
// Template & Decision Types
// ============================================================================

/**
 * Bundle template: a reusable structure for common handoff types.
 * Templates specify default fidelity levels, data schema references,
 * code script references, and test fixture references.
 */
export const BundleTemplateSchema = z.object({
  /** Unique template identifier */
  id: z.string(),

  /** Human-readable template name */
  name: z.string(),

  /** Handoff type this template covers */
  handoff_type: z.string(),

  /** Description of when and how to use this template */
  description: z.string(),

  /** Default fidelity level for bundles using this template */
  default_fidelity: FidelityLevelSchema,

  /** References to JSON Schemas for data validation */
  data_schema_refs: z.array(z.string()),

  /** References to scripts in the catalog */
  code_script_refs: z.array(z.string()),

  /** References to test fixtures for validation */
  test_fixture_refs: z.array(z.string()),
});

/** Inferred TypeScript type for BundleTemplate. */
export type BundleTemplate = z.infer<typeof BundleTemplateSchema>;

/**
 * Fidelity decision input: the factors the fidelity model evaluates to
 * determine the appropriate fidelity level for a handoff.
 */
export const FidelityDecisionSchema = z.object({
  /** Type of handoff being assembled */
  handoff_type: z.string(),

  /** Complexity of the data being handed off */
  data_complexity: z.enum(['none', 'simple', 'structured', 'complex']),

  /** Historical drift rate for this handoff type (0.0-1.0) */
  historical_drift_rate: z.number().min(0).max(1),

  /** Number of relevant skills available in the catalog */
  available_skills: z.number().int().nonnegative(),

  /** Remaining token budget for this session */
  token_budget_remaining: z.number().nonnegative(),

  /** Whether this handoff involves safety-critical operations */
  safety_critical: z.boolean(),
});

/** Inferred TypeScript type for FidelityDecision. */
export type FidelityDecision = z.infer<typeof FidelityDecisionSchema>;

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation error: a fatal or blocking issue found during bundle validation.
 * Fatal errors prevent the bundle from being used. Blocking errors require
 * resolution before the handoff can proceed.
 */
export const ValidationErrorSchema = z.object({
  /** Field or path where the error was found */
  field: z.string(),

  /** Human-readable error description */
  message: z.string(),

  /** Error severity: fatal (unusable) or blocking (fixable) */
  severity: z.enum(['fatal', 'blocking']),
});

/** Inferred TypeScript type for ValidationError. */
export type ValidationError = z.infer<typeof ValidationErrorSchema>;

/**
 * Validation warning: a non-blocking issue found during bundle validation.
 * Warnings suggest improvements but do not prevent the handoff.
 */
export const ValidationWarningSchema = z.object({
  /** Field or path where the warning applies */
  field: z.string(),

  /** Human-readable warning description */
  message: z.string(),

  /** Suggested fix or improvement */
  suggestion: z.string(),
});

/** Inferred TypeScript type for ValidationWarning. */
export type ValidationWarning = z.infer<typeof ValidationWarningSchema>;

/**
 * Bundle validation result: the complete output of validating a DACP bundle.
 * Includes all errors, warnings, and coverage metrics.
 */
export const BundleValidationResultSchema = z.object({
  /** Whether the bundle passes validation (no fatal or blocking errors) */
  valid: z.boolean(),

  /** All validation errors found */
  errors: z.array(ValidationErrorSchema),

  /** All validation warnings found */
  warnings: z.array(ValidationWarningSchema),

  /** Whether the declared fidelity level matches actual content */
  fidelity_verified: z.boolean(),

  /** Proportion of data covered by JSON Schemas (0.0-1.0) */
  schema_coverage: z.number().min(0).max(1),
});

/** Inferred TypeScript type for BundleValidationResult. */
export type BundleValidationResult = z.infer<typeof BundleValidationResultSchema>;
