/**
 * Level of Detail (LOD) — Dynamic detail scaling for content generation.
 *
 * Inspired by BIM (Building Information Modeling) LOD specification:
 *   LOD 100 → Concept: boundaries and orientation
 *   LOD 200 → Schematic: approximate quantities, shape, location
 *   LOD 300 → Detailed: precise assemblies, exact dimensions
 *   LOD 350 → Construction: system integration, graphic definitions
 *   LOD 400 → Fabrication: complete assembly/detailing/installation info
 *   LOD 500 → As-Built: actual state, maintenance, operations
 *
 * Applied to GSD workflows:
 *   LOD 100 → Project overview, roadmap summaries
 *   LOD 200 → Phase discussion, approximate scope
 *   LOD 300 → Phase planning, precise tasks/dependencies
 *   LOD 350 → Cross-phase integration, system connections
 *   LOD 400 → Execution, complete implementation
 *   LOD 500 → Verification, deployed/as-built state
 *
 * Works alongside the Magic system (desktop/src/magic/):
 *   Magic controls OUTPUT verbosity (what the user sees).
 *   LOD controls CONTENT depth (what gets generated).
 *
 * @module lod/types
 */

// ─── LOD Levels ──────────────────────────────────────────────────────────────

/**
 * The six BIM-derived levels of detail.
 * Each level defines what KIND of information is included, not just how much.
 */
export enum LodLevel {
  /** Concept: boundaries, orientation, existence. "What is this?" */
  CONCEPT = 100,

  /** Schematic: approximate quantities, shape, location. "How big/where?" */
  SCHEMATIC = 200,

  /** Detailed: precise assemblies, exact specs. "Exactly what?" */
  DETAILED = 300,

  /** Construction: system integration, cross-references. "How does it connect?" */
  CONSTRUCTION = 350,

  /** Fabrication: complete implementation details. "Build this." */
  FABRICATION = 400,

  /** As-Built: actual deployed state, maintenance info. "What was built." */
  AS_BUILT = 500,
}

export const DEFAULT_LOD = LodLevel.DETAILED;

// ─── LOD Descriptors ─────────────────────────────────────────────────────────

/** Human-readable metadata for each LOD level. */
export interface LodDescriptor {
  level: LodLevel;
  name: string;
  bimAnalog: string;
  gsdAnalog: string;
  contentStrategy: string;
  /** What to include at this level. */
  includes: string[];
  /** What to exclude at this level (included at higher LODs). */
  excludes: string[];
}

export const LOD_DESCRIPTORS: Record<LodLevel, LodDescriptor> = {
  [LodLevel.CONCEPT]: {
    level: LodLevel.CONCEPT,
    name: 'Concept',
    bimAnalog: 'Concept Design — area, height, volume, boundary, orientation',
    gsdAnalog: 'Project overview, roadmap summary, milestone boundaries',
    contentStrategy: 'One-paragraph summaries. Names and boundaries only.',
    includes: ['title', 'purpose', 'boundary'],
    excludes: ['quantities', 'specifications', 'code', 'configuration', 'verification'],
  },
  [LodLevel.SCHEMATIC]: {
    level: LodLevel.SCHEMATIC,
    name: 'Schematic',
    bimAnalog: 'Schematic Design — approximate quantities, size, shape, location, non-geometric info',
    gsdAnalog: 'Phase discussion, approximate scope, approach selection',
    contentStrategy: 'Section headers with 2-3 sentence descriptions. Approximate scope.',
    includes: ['title', 'purpose', 'boundary',
               'approach', 'approximate-scope', 'key-decisions'],
    excludes: ['exact-specs', 'code', 'configuration', 'test-cases', 'verification-steps'],
  },
  [LodLevel.DETAILED]: {
    level: LodLevel.DETAILED,
    name: 'Detailed',
    bimAnalog: 'Detailed Design — specific assemblies, precise quantity, size, shape, location',
    gsdAnalog: 'Phase planning, precise tasks, dependencies, acceptance criteria',
    contentStrategy: 'Full section content with subsections. Precise specifications.',
    includes: ['title', 'purpose', 'boundary',
               'approach', 'approximate-scope', 'key-decisions',
               'precise-tasks', 'dependencies', 'acceptance-criteria', 'risk-notes'],
    excludes: ['implementation-code', 'full-configuration', 'deployment-steps', 'maintenance-notes'],
  },
  [LodLevel.CONSTRUCTION]: {
    level: LodLevel.CONSTRUCTION,
    name: 'Construction',
    bimAnalog: 'Construction Documentation — system integration, graphic and written definitions',
    gsdAnalog: 'Cross-phase integration, API contracts, data flow diagrams',
    contentStrategy: 'Detailed + integration points, cross-references, interface definitions.',
    includes: ['title', 'purpose', 'boundary',
               'approach', 'approximate-scope', 'key-decisions',
               'precise-tasks', 'dependencies', 'acceptance-criteria', 'risk-notes',
               'integration-points', 'api-contracts', 'cross-references', 'data-flow'],
    excludes: ['implementation-code', 'deployment-steps', 'maintenance-notes'],
  },
  [LodLevel.FABRICATION]: {
    level: LodLevel.FABRICATION,
    name: 'Fabrication',
    bimAnalog: 'Fabrication & Assembly — complete fabrication, assembly, detailing, installation',
    gsdAnalog: 'Execution, complete implementation, code, configuration, tests',
    contentStrategy: 'Everything needed to build. Code, configs, test cases, deployment steps.',
    includes: ['title', 'purpose', 'boundary',
               'approach', 'approximate-scope', 'key-decisions',
               'precise-tasks', 'dependencies', 'acceptance-criteria', 'risk-notes',
               'integration-points', 'api-contracts', 'cross-references', 'data-flow',
               'implementation-code', 'configuration', 'test-cases', 'deployment-steps'],
    excludes: ['maintenance-notes', 'operational-metrics', 'as-built-verification'],
  },
  [LodLevel.AS_BUILT]: {
    level: LodLevel.AS_BUILT,
    name: 'As-Built',
    bimAnalog: 'As-Built — constructed assemblies, maintenance, operations, actual and accurate',
    gsdAnalog: 'Verification, deployed state, operational metrics, maintenance procedures',
    contentStrategy: 'Complete record of what was built. Verification results, operational state.',
    includes: ['title', 'purpose', 'boundary',
               'approach', 'approximate-scope', 'key-decisions',
               'precise-tasks', 'dependencies', 'acceptance-criteria', 'risk-notes',
               'integration-points', 'api-contracts', 'cross-references', 'data-flow',
               'implementation-code', 'configuration', 'test-cases', 'deployment-steps',
               'verification-results', 'operational-metrics', 'maintenance-notes', 'as-built-diff'],
    excludes: [],
  },
};

// ─── LOD Context ─────────────────────────────────────────────────────────────

/** Signals that inform automatic LOD selection. */
export interface LodContext {
  /** Current GSD workflow phase. */
  phase?: 'discuss' | 'plan' | 'execute' | 'verify' | 'ship';

  /** Available token budget (lower budget → lower LOD). */
  tokenBudget?: number;

  /** Agent effort level from dispatch. */
  effort?: 'minimal' | 'standard' | 'thorough' | 'exhaustive';

  /** How many times this content has been generated (iteration → higher LOD). */
  iteration?: number;

  /** Explicit override from user or skill. */
  override?: LodLevel;

  /** Content type being generated. */
  contentType?: 'research' | 'plan' | 'code' | 'documentation' | 'review' | 'report';
}

// ─── LOD ↔ Magic Mapping ────────────────────────────────────────────────────

/**
 * Maps Magic levels (output verbosity) to recommended LOD levels (content depth).
 *
 * Magic controls what the USER SEES.
 * LOD controls what gets GENERATED.
 *
 * They are independent axes but correlate: a user at Magic Level 1 (visual only)
 * probably doesn't want LOD 500 content generated either.
 */
export const MAGIC_TO_LOD_DEFAULT: Record<number, LodLevel> = {
  1: LodLevel.CONCEPT,       // FULL_MAGIC → Concept (minimal generation)
  2: LodLevel.SCHEMATIC,     // GUIDED → Schematic (summaries)
  3: LodLevel.DETAILED,      // ANNOTATED → Detailed (default)
  4: LodLevel.FABRICATION,   // VERBOSE → Fabrication (full detail)
  5: LodLevel.AS_BUILT,      // NO_MAGIC → As-Built (everything)
};

// ─── Content Scaling Rules ───────────────────────────────────────────────────

/** Scaling parameters derived from LOD level. */
export interface LodScaling {
  /** Target word count multiplier (1.0 = standard). */
  wordCountMultiplier: number;

  /** Maximum h-tag depth (2 = h2 only, 4 = h2+h3+h4). */
  maxHeadingDepth: number;

  /** Include code blocks? */
  includeCode: boolean;

  /** Include tables? */
  includeTables: boolean;

  /** Include cross-references? */
  includeCrossRefs: boolean;

  /** Include bibliography? */
  includeBibliography: boolean;

  /** Max refinement passes for co-processor. */
  maxPasses: number;

  /** Target sections per module. */
  targetSections: number;

  /** Agent token budget multiplier. */
  tokenBudgetMultiplier: number;
}

export const LOD_SCALING: Record<LodLevel, LodScaling> = {
  [LodLevel.CONCEPT]: {
    wordCountMultiplier: 0.1,
    maxHeadingDepth: 2,
    includeCode: false,
    includeTables: false,
    includeCrossRefs: false,
    includeBibliography: false,
    maxPasses: 1,
    targetSections: 1,
    tokenBudgetMultiplier: 0.2,
  },
  [LodLevel.SCHEMATIC]: {
    wordCountMultiplier: 0.25,
    maxHeadingDepth: 2,
    includeCode: false,
    includeTables: true,
    includeCrossRefs: false,
    includeBibliography: false,
    maxPasses: 2,
    targetSections: 3,
    tokenBudgetMultiplier: 0.4,
  },
  [LodLevel.DETAILED]: {
    wordCountMultiplier: 0.5,
    maxHeadingDepth: 3,
    includeCode: false,
    includeTables: true,
    includeCrossRefs: true,
    includeBibliography: true,
    maxPasses: 4,
    targetSections: 6,
    tokenBudgetMultiplier: 0.7,
  },
  [LodLevel.CONSTRUCTION]: {
    wordCountMultiplier: 0.7,
    maxHeadingDepth: 3,
    includeCode: true,
    includeTables: true,
    includeCrossRefs: true,
    includeBibliography: true,
    maxPasses: 6,
    targetSections: 8,
    tokenBudgetMultiplier: 0.85,
  },
  [LodLevel.FABRICATION]: {
    wordCountMultiplier: 1.0,
    maxHeadingDepth: 4,
    includeCode: true,
    includeTables: true,
    includeCrossRefs: true,
    includeBibliography: true,
    maxPasses: 8,
    targetSections: 10,
    tokenBudgetMultiplier: 1.0,
  },
  [LodLevel.AS_BUILT]: {
    wordCountMultiplier: 1.2,
    maxHeadingDepth: 4,
    includeCode: true,
    includeTables: true,
    includeCrossRefs: true,
    includeBibliography: true,
    maxPasses: 8,
    targetSections: 12,
    tokenBudgetMultiplier: 1.0,
  },
};
