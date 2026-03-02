/**
 * Logic Department Definition
 *
 * Defines the CollegeDepartment object for the logic department,
 * including all 5 wings derived from LOG-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/logic/logic-department
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

const logicalThinkingFoundationsWing: DepartmentWing = {
  id: 'logical-thinking-foundations',
  name: 'Logical Thinking Foundations',
  description:
    'Developing foundational logic skills through sorting and classifying, understanding ' +
    'if-then relationships, pattern recognition, and reasoning about rules. The concrete ' +
    'entry point to formal logic for all ages.',
  concepts: [], // Populated in Task 2
};

const argumentsReasoningWing: DepartmentWing = {
  id: 'arguments-reasoning',
  name: 'Arguments & Reasoning',
  description:
    'Understanding argument structure by identifying premises and conclusions, distinguishing ' +
    'deductive validity from inductive strength, and evaluating the quality of reasoning ' +
    'in arguments from everyday to scientific contexts.',
  concepts: [], // Populated in Task 2
};

const fallaciesCriticalThinkingWing: DepartmentWing = {
  id: 'fallacies-critical-thinking',
  name: 'Fallacies & Critical Thinking',
  description:
    'Recognizing common informal fallacies (ad hominem, straw man, false dichotomy), ' +
    'cognitive biases that distort reasoning, propaganda techniques, and applying ' +
    'structured evaluation criteria to distinguish good from bad arguments.',
  concepts: [], // Populated in Task 2
};

const formalLogicWing: DepartmentWing = {
  id: 'formal-logic',
  name: 'Formal Logic',
  description:
    'Propositional logic with truth tables, predicate logic with quantifiers, symbolic ' +
    'notation, and formal proof techniques including direct proof, proof by contradiction, ' +
    'and mathematical induction.',
  concepts: [], // Populated in Task 2
};

const appliedLogicWing: DepartmentWing = {
  id: 'applied-logic',
  name: 'Applied Logic',
  description:
    'Logic applied across domains: mathematics (theorem structure), programming (Boolean ' +
    'expressions, loop invariants), law (burden of proof), everyday decisions, and the ' +
    'boundaries of formal systems through paradoxes.',
  concepts: [], // Populated in Task 2
};

// ─── Token Budget ───────────────────────────────────────────────────────────

const tokenBudget: TokenBudgetConfig = {
  summaryLimit: 3000,
  activeLimit: 12000,
  deepLimit: 50000,
};

// ─── Department Definition ──────────────────────────────────────────────────

/**
 * The Logic department -- 5 wings of valid reasoning and formal systems.
 *
 * Wings progress from concrete logical thinking (sorting, patterns) through
 * formal logic and applications, bridging everyday reasoning to mathematical proof.
 */
export const logicDepartment: CollegeDepartment = {
  id: 'logic',
  name: 'Logic & Formal Systems',
  wings: [
    logicalThinkingFoundationsWing,
    argumentsReasoningWing,
    fallaciesCriticalThinkingWing,
    formalLogicWing,
    appliedLogicWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in Task 2
  calibrationModels: [] as CalibrationModel[], // Populated in future phases
  trySessions: [] as TrySession[], // Populated in Task 2
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the logic department with a CollegeLoader.
 *
 * CollegeLoader auto-discovers departments via DEPARTMENT.md on the filesystem.
 * This function provides a programmatic registration hook for future loader integration.
 */
export function registerLogicDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
  // This function provides a programmatic registration hook for future use.
}
