// === Mathematical Foundations Engine — Type System ===
//
// Core type definitions for the MFE. Every downstream component depends on these:
// domain extraction, graph engine, navigator, composition engine, proof composer,
// verification engine, and skill-creator integration.

// === Plane Position ===

export interface PlanePosition {
  real: number;      // -1.0 (pure logic) to +1.0 (pure creativity)
  imaginary: number; // -1.0 (pure embodied) to +1.0 (pure abstract)
}

export interface PlaneRegion {
  center: PlanePosition;
  radius: number;    // Region of relevance
}

// === Primitive Types ===

export type PrimitiveType =
  | 'axiom'       // Fundamental assumption (Peano axioms, ZFC)
  | 'definition'  // Named concept (vector space, group)
  | 'theorem'     // Proven relationship (Pythagorean, FTC)
  | 'algorithm'   // Computational procedure (FFT, Gaussian elimination)
  | 'technique'   // Problem-solving method (proof by contradiction)
  | 'identity';   // Algebraic equivalence (Euler's formula, trig identities)

export interface MathematicalPrimitive {
  id: string;                    // Unique ID: "domain-concept" e.g. "perception-pythagorean-theorem"
  name: string;                  // Human-readable: "Pythagorean Theorem"
  type: PrimitiveType;
  domain: DomainId;              // Which of the 10 domains
  chapter: number;               // Chapter in The Space Between (1-33)
  section: string;               // Section reference (e.g., "3.1")
  planePosition: PlanePosition;  // Position on the Complex Plane

  // Mathematical content
  formalStatement: string;       // Precise mathematical statement
  computationalForm: string;     // How to compute or apply it
  prerequisites: string[];       // Natural language: what must be understood first

  // Graph edges
  dependencies: DependencyEdge[];     // What this primitive requires
  enables: string[];                   // PrimitiveIds this unlocks
  compositionRules: CompositionRule[]; // How this composes with others

  // Activation & matching
  applicabilityPatterns: string[];     // Natural language patterns that trigger this primitive
  keywords: string[];                  // Search keywords

  // Metadata
  tags: string[];                      // Categorical tags
  buildLabs: string[];                 // Related Build Lab references from the book
}

// === Dependency Edges ===

export type DependencyType =
  | 'requires'     // Cannot be stated without
  | 'generalizes'  // Extends to broader domain
  | 'specializes'  // Restricts to specific case
  | 'motivates'    // Historically/pedagogically precedes
  | 'applies'      // Uses as a tool
  | 'equivalent';  // Same concept, different formulation

export interface DependencyEdge {
  target: string;            // PrimitiveId of the dependency
  type: DependencyType;
  strength: number;          // 0.0-1.0, how essential (1.0 = cannot exist without)
  description: string;       // Why this dependency exists
}

// === Composition Rules ===

export type CompositionType = 'sequential' | 'parallel' | 'nested';

export interface CompositionRule {
  with: string;              // PrimitiveId to compose with
  yields: string;            // What the composition produces (PrimitiveId or description)
  type: CompositionType;
  conditions: string[];      // When this composition is valid
  example: string;           // Concrete example from the book
}

// === Domains ===

export type DomainId =
  | 'perception'    // Part I: Seeing (Ch 1-3)
  | 'waves'         // Part II: Hearing (Ch 4-7)
  | 'change'        // Part III: Moving (Ch 8-10)
  | 'structure'     // Part IV: Expanding (Ch 11-14)
  | 'reality'       // Part V: Grounding (Ch 15-17)
  | 'foundations'   // Part VI: Defining (Ch 18-21)
  | 'mapping'       // Part VII: Mapping (Ch 22-25)
  | 'unification'   // Part VIII: Converging (Ch 26-27)
  | 'emergence'     // Part IX: Growing (Ch 28-31)
  | 'synthesis';    // Part X: Being (Ch 32-33)

export interface DomainDefinition {
  id: DomainId;
  name: string;                    // "Perception", "Waves", etc.
  part: string;                    // "Part I: Seeing"
  chapters: number[];              // [1, 2, 3] for Perception
  planeRegion: PlaneRegion;        // Where this domain lives on the plane
  activationPatterns: string[];    // What problem types activate this domain
  compatibleWith: DomainId[];      // Which domains compose well with this one
  primaryPrimitiveTypes: PrimitiveType[]; // What types of primitives dominate
  description: string;
}

// === Navigation & Problem Analysis ===

export interface ProblemAnalysis {
  rawInput: string;                // Original problem statement
  planePosition: PlanePosition;    // Classified position
  activatedDomains: DomainId[];    // Domains activated (ordered by relevance)
  relevantPrimitives: string[];    // PrimitiveIds identified as relevant
  confidence: number;              // 0.0-1.0 classification confidence
}

export interface CompositionPath {
  steps: CompositionStep[];
  totalCost: number;
  domainsSpanned: DomainId[];
  verified: boolean;
}

export interface CompositionStep {
  stepNumber: number;
  primitive: string;               // PrimitiveId
  action: string;                  // What is being done at this step
  justification: string;           // Why (cites primitive formal statement)
  inputType: string;               // What this step receives
  outputType: string;              // What this step produces
  verificationStatus: 'passed' | 'failed' | 'skipped';
}

// === Observation & Learning ===

export interface MFEObservation {
  problemHash: string;
  planePosition: PlanePosition;
  domainsActivated: DomainId[];
  primitivesUsed: string[];
  compositionPath: CompositionStep[];
  verificationResult: 'passed' | 'failed' | 'partial' | 'skipped';
  userFeedback: 'positive' | 'negative' | 'none';
  timestamp: string;
  sessionId: string;
}

// === Tiered Knowledge ===

export interface DomainSummary {
  id: DomainId;
  name: string;
  primitiveCount: number;
  topPrimitives: string[];         // Top 5 most-used primitive IDs
  activationPatterns: string[];
  planeRegion: PlaneRegion;
}

export interface RegistrySummary {
  version: string;
  totalPrimitives: number;
  totalEdges: number;
  totalCompositionRules: number;
  domains: DomainSummary[];
  graphDepth: number;              // Longest path in the DAG
}
