/** Shared type definitions for the PyDMD dogfood pipeline (v1.44). */

export interface ClassNode {
  name: string;
  parent: string | null;
  module: string;
  methods: string[];
  isAbstract: boolean;
}

export interface APIMethod {
  class: string;
  name: string;
  signature: string;
  returnType: string;
  docstring: string;
  isInherited: boolean;
}

export interface ModuleNode {
  path: string;
  classes: string[];
  imports: string[];
  linesOfCode: number;
}

export interface Concept {
  name: string;
  category: string;
  description: string;
  relatedConcepts: string[];
  sourceFiles: string[];
}

export interface Parameter {
  name: string;
  type: string;
  default: string | null;
  description: string;
}

export interface UsagePattern {
  name: string;
  steps: string[];
  codeExample: string;
  variants: string[];
}

export interface Pitfall {
  description: string;
  symptom: string;
  cause: string;
  solution: string;
  affectsVariants: string[];
}

export interface TutorialSummary {
  index: number;
  title: string;
  variant: string;
  dataType: string;
  keyInsight: string;
  codePatterns: string[];
}

export interface Connection {
  from: string;
  to: string;
  relationship: string;
  strength: number;
}

export interface RepoManifest {
  url: string;
  localPath: string;
  language: "python";
  buildSystem: "pyproject.toml" | "setup.py" | "setup.cfg";
  pythonVersion: string;
  dependencies: { core: string[]; test: string[]; dev: string[]; };
  testFramework: "pytest" | "unittest" | "nose";
  healthCheck: { passed: number; failed: number; skipped: number; errors: string[]; };
  structure: { sourceDir: string; testDir: string; tutorialDir: string; docsDir: string; };
  entryPoints: string[];
  timestamp: string;
}

export interface KnowledgeGraph {
  project: { name: string; version: string; description: string; license: string; };
  architecture: { classHierarchy: ClassNode[]; apiSurface: APIMethod[]; moduleMap: ModuleNode[]; };
  concepts: { mathematical: Concept[]; algorithmic: AlgorithmVariant[]; domain: Concept[]; };
  patterns: { usage: UsagePattern[]; selection: DecisionNode[]; pitfalls: Pitfall[]; };
  tutorials: TutorialSummary[];
  crossReferences: { complexPlane: Connection[]; skillCreator: Connection[]; };
}

export interface AlgorithmVariant {
  name: string;
  class: string;
  purpose: string;
  distinguishing: string[];
  parameters: Parameter[];
  mathBasis: string;
  tutorial: number | null;
}

export interface DecisionNode {
  question: string;
  yes: string | DecisionNode;
  no: string | DecisionNode;
}

export interface GeneratedSkill {
  skillMdPath: string;
  referencePaths: string[];
  scriptPaths: string[];
  wordCount: number;
  decisionTree: DecisionNode;
  algorithmsCovered: string[];
  apiCoverage: number;
  timestamp: string;
}

export interface TutorialReplayResult {
  tutorialIndex: number;
  title: string;
  reproductionScore: number;
  missedSteps: string[];
  incorrectGuidance: string[];
}

export interface ClaimVerification {
  claim: string;
  source: string;
  verified: boolean;
  notes: string;
}

export interface ValidationReport {
  skillPath: string;
  accuracyScore: number;
  apiCoveragePercent: number;
  decisionTreeAccuracy: number;
  tutorialReplayScores: TutorialReplayResult[];
  claimVerifications: ClaimVerification[];
  timestamp: string;
}
