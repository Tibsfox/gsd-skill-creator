/**
 * Shared type definitions for the Rosetta Core, Calibration Engine,
 * College Structure, and Safety systems.
 *
 * These types form the canonical contract that every downstream component
 * in Waves 1-4 builds against. Pure type definitions only -- no implementation.
 *
 * @module rosetta-core/types
 */

// ─── Panel Identification ────────────────────────────────────────────────────

/**
 * Identifier for a language panel in the Rosetta Core system.
 *
 * Includes the 9 initial panels (Python, C++, Java, Lisp, Pascal, Fortran,
 * Perl, ALGOL, Unison), plus 'vhdl' for future extensibility and 'natural'
 * for natural language output.
 */
export type PanelId =
  | 'python'
  | 'cpp'
  | 'java'
  | 'lisp'
  | 'pascal'
  | 'fortran'
  | 'perl'
  | 'algol'
  | 'unison'
  | 'vhdl'
  | 'natural';

// ─── Core Interfaces ─────────────────────────────────────────────────────────

/**
 * A panel-specific expression of a concept.
 *
 * Each panel translates a canonical RosettaConcept into its own expression
 * format, including code, explanation, examples, and pedagogical notes.
 */
export interface PanelExpression {
  /** Which panel produced this expression */
  panelId: PanelId;

  /** Code expression in the panel's language (if applicable) */
  code?: string;

  /** Natural language explanation of the concept in this panel's context */
  explanation?: string;

  /** Usage examples demonstrating the concept */
  examples?: string[];

  /** Teaching annotations -- what exploring this expression teaches */
  pedagogicalNotes?: string;
}

/**
 * Position on the Complex Plane of Experience.
 *
 * Maps concepts to a 2D plane where the real axis represents concreteness
 * (concrete applications to abstract theory) and the imaginary axis represents
 * complexity (simple to advanced). Magnitude and angle provide polar coordinates.
 */
export interface ComplexPosition {
  /** Real axis value -- concreteness (negative = abstract, positive = concrete) */
  real: number;

  /** Imaginary axis value -- complexity (negative = simple, positive = advanced) */
  imaginary: number;

  /** Distance from origin -- overall "weight" of the concept */
  magnitude: number;

  /** Angle in radians -- quadrant determines concept character */
  angle: number;
}

/**
 * A relationship between two concepts in the Rosetta Core.
 *
 * Enables navigation between related concepts across departments and domains.
 */
export interface ConceptRelationship {
  /** Type of relationship between concepts */
  type: 'dependency' | 'analogy' | 'cross-reference';

  /** ID of the target concept this relationship points to */
  targetId: string;

  /** Human-readable description of the relationship */
  description: string;
}

/**
 * Accumulated calibration data for a specific domain.
 *
 * Tracks all calibration deltas and derives a confidence score
 * representing the system's understanding of the user's context.
 */
export interface CalibrationProfile {
  /** Domain this profile applies to (e.g., 'cooking', 'mathematics') */
  domain: string;

  /** Historical calibration deltas for this domain */
  deltas: CalibrationDelta[];

  /** Overall confidence score derived from accumulated deltas (0-1 range) */
  confidenceScore: number;

  /** Timestamp of most recent calibration update */
  lastUpdated: Date;
}

/**
 * Canonical concept definition in the Rosetta Core system.
 *
 * A RosettaConcept is the universal representation of a concept that can be
 * translated across multiple language panels. It maintains concept identity
 * while allowing panel-specific expressions.
 */
export interface RosettaConcept {
  /** Canonical concept identifier (unique across the system) */
  id: string;

  /** Human-readable name */
  name: string;

  /** Department/domain identifier (e.g., 'mathematics', 'culinary-arts') */
  domain: string;

  /** Canonical description of the concept */
  description: string;

  /** Panel-specific expressions keyed by PanelId */
  panels: Map<PanelId, PanelExpression>;

  /** Relationships to other concepts (dependencies, analogies, cross-references) */
  relationships: ConceptRelationship[];

  /** Domain-specific calibration data (optional, populated after user interaction) */
  calibration?: CalibrationProfile;

  /** Position on the Complex Plane of Experience (optional) */
  complexPlanePosition?: ComplexPosition;
}

// ─── Calibration Types ───────────────────────────────────────────────────────

/**
 * A single calibration observation capturing the delta between
 * expected and observed results.
 *
 * Part of the universal Observe->Compare->Adjust->Record feedback loop.
 */
export interface CalibrationDelta {
  /** What actually happened (user-reported or system-observed) */
  observedResult: string;

  /** What was intended or predicted */
  expectedResult: string;

  /** Parameter adjustments derived from the delta. Keys are parameter names,
   *  values are numeric adjustments. No single adjustment should exceed 20%
   *  of the parameter's current value. */
  adjustment: Record<string, number>;

  /** Confidence in this calibration adjustment (0-1 range, where 1 = certain) */
  confidence: number;

  /** Which science/domain model was applied to derive the adjustment */
  domainModel: string;

  /** When this calibration was recorded */
  timestamp: Date;
}

/**
 * Safety boundary defining absolute or warning limits for a parameter.
 *
 * Absolute boundaries can never be overridden by calibration.
 * Warning boundaries flag concerns but allow override with acknowledgment.
 */
export interface SafetyBoundary {
  /** The parameter this boundary constrains (e.g., 'poultry_internal_temp') */
  parameter: string;

  /** The limit value (numeric for temperatures, string for descriptive limits) */
  limit: number | string;

  /** Whether this boundary is absolute (never override) or a warning (flag only) */
  type: 'absolute' | 'warning';

  /** Human-readable explanation of why this boundary exists */
  reason: string;
}

/**
 * A domain-specific calibration model defining what parameters can be
 * adjusted and the scientific basis for adjustments.
 */
export interface CalibrationModel {
  /** Domain this model applies to (e.g., 'temperature', 'timing', 'seasoning') */
  domain: string;

  /** Parameters that can be adjusted by calibration */
  parameters: string[];

  /** Underlying scientific model justifying the calibration approach */
  science: string;

  /** Absolute limits that calibration must never exceed */
  safetyBoundaries: SafetyBoundary[];
}

// ─── College Structure Types ─────────────────────────────────────────────────

/**
 * A wing within a department -- a thematic grouping of concepts.
 *
 * Wings organize concepts into coherent sub-topics within a department
 * (e.g., "Food Science" wing within the Culinary Arts department).
 */
export interface DepartmentWing {
  /** Unique wing identifier within the department */
  id: string;

  /** Human-readable wing name */
  name: string;

  /** Brief description of the wing's focus area */
  description: string;

  /** IDs of concepts belonging to this wing */
  concepts: string[];
}

/**
 * An interactive entry point for exploring a department's concepts.
 *
 * Try-sessions provide guided, hands-on learning experiences that
 * demonstrate concepts through practice.
 */
export interface TrySession {
  /** Unique session identifier */
  id: string;

  /** Human-readable session name */
  name: string;

  /** Description of what the session covers and teaches */
  description: string;

  /** Entry point file or function for starting the session */
  entryPoint: string;

  /** Estimated time to complete the session (e.g., '15 min', '1 hour') */
  estimatedDuration: string;
}

/**
 * Token budget configuration for progressive disclosure loading.
 *
 * Controls how much content is loaded at each tier to stay within
 * the 2-5% token budget ceiling.
 */
export interface TokenBudgetConfig {
  /** Maximum tokens for summary tier (~3K always loaded) */
  summaryLimit: number;

  /** Maximum tokens for active tier (~12K on demand per wing) */
  activeLimit: number;

  /** Maximum tokens for deep tier (~50K+ on explicit request) */
  deepLimit: number;
}

/**
 * A department in the College Structure.
 *
 * Departments are the top-level organizational unit containing wings,
 * concepts, calibration models, try-sessions, and token budget configuration.
 * They are explorable as code -- a developer navigates departments like
 * navigating a source tree.
 */
export interface CollegeDepartment {
  /** Unique department identifier (e.g., 'mathematics', 'culinary-arts') */
  id: string;

  /** Human-readable department name */
  name: string;

  /** Thematic wings organizing concepts within this department */
  wings: DepartmentWing[];

  /** All concepts belonging to this department */
  concepts: RosettaConcept[];

  /** Domain-specific calibration models for this department */
  calibrationModels: CalibrationModel[];

  /** Interactive learning sessions for this department */
  trySessions: TrySession[];

  /** Token budget limits for progressive disclosure loading */
  tokenBudget: TokenBudgetConfig;
}
