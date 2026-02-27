/**
 * Validation types for accuracy checking and tutorial replay.
 * Phase 406 Plan 03 -- types for verifying generated skill correctness.
 */

/** Detailed accuracy report for a generated skill against source material. */
export interface AccuracyReport {
  apiAccuracy: {
    methodsClaimed: number;
    methodsVerified: number;
    methodsMissing: number;
    signatureMatches: number;
    signatureMismatches: string[];
  };
  algorithmAccuracy: {
    variantsClaimed: number;
    variantsVerified: number;
    purposeCorrect: number;
    parameterCorrect: number;
  };
  decisionTreeAccuracy: {
    totalPaths: number;
    pathsValidated: number;
    pathsIncorrect: string[];
  };
  codeExampleAccuracy: {
    examplesTested: number;
    examplesRunnable: number;
    examplesCorrectOutput: number;
    examplesWithErrors: string[];
  };
  coverageMetrics: {
    apiCoverage: number;
    variantCoverage: number;
    tutorialCoverage: number;
  };
  overallScore: number;
}

/** Result of replaying a single tutorial against the generated skill. */
export interface ReplayResult {
  tutorialNumber: number;
  objective: string;
  correctVariant: boolean;
  correctWorkflow: boolean;
  correctParameters: boolean;
  producesResults: boolean;
  qualitativeMatch: boolean;
  score: number; // 0-5
  gaps: string[];
}

/** Aggregate report for all tutorial replays. */
export interface ReplayReport {
  results: ReplayResult[];
  totalScore: number;
  maxScore: number;
  passRate: number;
  identifiedGaps: string[];
}

/** Configuration for the validation pipeline. */
export interface ValidationConfig {
  scenariosPath: string;
  strictMode: boolean;
  minApiCoverage: number;
  minOverallScore: number;
}

/** A single DMD test scenario for decision tree validation. */
export interface DMDScenario {
  id: string;
  description: string;
  characteristics: Record<string, boolean | string>;
  expected_variant: string;
  reasoning: string;
}
