/**
 * Critical Thinking Department Definition
 *
 * Defines the CollegeDepartment object for the critical-thinking department,
 * including 5 wings derived from CRIT-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/critical-thinking/critical-thinking-department
 */

import type {
  CollegeDepartment,
  DepartmentWing,
  TrySession,
  TokenBudgetConfig,
  CalibrationModel,
  RosettaConcept,
} from '../../rosetta-core/types.js';
import type { CollegeLoader } from '../../college/college-loader.js';

// ─── Wing Definitions ───────────────────────────────────────────────────────

const claimsEvidenceWing: DepartmentWing = {
  id: 'claims-evidence',
  name: 'Claims & Evidence',
  description:
    'The foundational unit of critical thinking: identifying claims and evaluating ' +
    'the evidence that supports or undermines them. Covers types of claims, ' +
    'evidence quality, sourcing, and the difference between opinions and facts.',
  concepts: [], // Populated in Phase 23
};

const argumentsReasoningWing: DepartmentWing = {
  id: 'arguments-reasoning',
  name: 'Arguments & Logical Reasoning',
  description:
    'Constructing and evaluating structured arguments. ' +
    'Covers deductive and inductive reasoning, argument structure, validity ' +
    'versus soundness, common argument patterns, and charitable interpretation.',
  concepts: [], // Populated in Phase 23
};

const fallaciesBiasesWing: DepartmentWing = {
  id: 'fallacies-biases',
  name: 'Fallacies & Biases',
  description:
    'Recognizing flawed reasoning and cognitive distortions. ' +
    'Covers common logical fallacies (ad hominem, straw man, false dichotomy), ' +
    'cognitive biases (confirmation bias, anchoring, availability heuristic), ' +
    'and strategies for overcoming them.',
  concepts: [], // Populated in Phase 23
};

const appliedThinkingWing: DepartmentWing = {
  id: 'applied-thinking',
  name: 'Applied Critical Thinking',
  description:
    'Putting critical thinking skills to work on real problems. ' +
    'Covers media literacy, evaluating news and advertising, scientific literacy, ' +
    'decision-making frameworks, and applying critical thinking in daily life.',
  concepts: [], // Populated in Phase 23
};

const metacognitionWing: DepartmentWing = {
  id: 'metacognition',
  name: 'Metacognition & Intellectual Humility',
  description:
    'Thinking about one\'s own thinking. ' +
    'Covers self-regulation of reasoning, intellectual virtues, open-mindedness, ' +
    'calibrated confidence, beginner\'s mind, and the ongoing project of ' +
    'becoming a better thinker.',
  concepts: [], // Populated in Phase 23
};

// ─── Token Budget ───────────────────────────────────────────────────────────

const tokenBudget: TokenBudgetConfig = {
  summaryLimit: 3000,
  activeLimit: 12000,
  deepLimit: 50000,
};

// ─── Department Definition ──────────────────────────────────────────────────

/**
 * The Critical Thinking department -- 5 wings from claims through metacognition.
 *
 * Wings progress from foundational evidence evaluation through applied reasoning
 * and self-reflective thinking, with concepts populated progressively by content Phase 23.
 */
export const criticalThinkingDepartment: CollegeDepartment = {
  id: 'critical-thinking',
  name: 'Critical Thinking',
  wings: [
    claimsEvidenceWing,
    argumentsReasoningWing,
    fallaciesBiasesWing,
    appliedThinkingWing,
    metacognitionWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in content phases
  calibrationModels: [] as CalibrationModel[], // Populated in Phase 27
  trySessions: [] as TrySession[], // Populated in Phase 23
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the critical-thinking department with a CollegeLoader.
 *
 * This is a no-op for the scaffold phase -- the CollegeLoader discovers
 * departments via DEPARTMENT.md on the filesystem.
 */
export function registerCriticalThinkingDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
