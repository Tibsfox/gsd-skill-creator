/**
 * Problem Solving Department Definition
 *
 * Defines the CollegeDepartment object for the problem-solving department,
 * including 5 wings derived from PROB-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/problem-solving/problem-solving-department
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

const understandingProblemsWing: DepartmentWing = {
  id: 'understanding-problems',
  name: 'Understanding Problems',
  description:
    'The first step in solving any problem: understanding it deeply. ' +
    'Covers problem representation (restating in own words), identifying ' +
    'what is known and unknown, distinguishing constraints from goals, ' +
    'and recognizing problem types.',
  concepts: [], // Populated in Phase 23
};

const solvingStrategiesWing: DepartmentWing = {
  id: 'solving-strategies',
  name: 'Problem-Solving Strategies',
  description:
    'A toolkit of strategies applicable across problem domains. ' +
    'Covers working backwards, drawing diagrams, looking for patterns, ' +
    'simplifying to a similar problem, systematic listing, and trial-and-error.',
  concepts: [], // Populated in Phase 23
};

const creativeThinkingWing: DepartmentWing = {
  id: 'creative-thinking',
  name: 'Creative & Lateral Thinking',
  description:
    'Breaking out of conventional thinking to find novel solutions. ' +
    'Covers brainstorming, lateral thinking techniques, analogical reasoning, ' +
    'reframing problems, challenging assumptions, and combining ideas in new ways.',
  concepts: [], // Populated in Phase 23
};

const collaborativeSolvingWing: DepartmentWing = {
  id: 'collaborative-solving',
  name: 'Collaborative Problem Solving',
  description:
    'Working with others to tackle shared challenges. ' +
    'Covers group problem-solving processes, dividing cognitive work, ' +
    'managing disagreement, building on teammates\' ideas, and achieving ' +
    'solutions that no individual could reach alone.',
  concepts: [], // Populated in Phase 23
};

const complexProblemsWing: DepartmentWing = {
  id: 'complex-problems',
  name: 'Complex & Wicked Problems',
  description:
    'Navigating problems with no clear solution, competing stakeholder interests, ' +
    'and incomplete information. Covers systems thinking, adaptive management, ' +
    'dealing with uncertainty, and ethical dimensions of complex problem-solving.',
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
 * The Problem Solving department -- 5 wings from understanding through complex problems.
 *
 * Wings develop the full problem-solving cycle from comprehension through creative,
 * collaborative, and systems-level approaches, with concepts by content Phase 23.
 */
export const problemSolvingDepartment: CollegeDepartment = {
  id: 'problem-solving',
  name: 'Problem Solving',
  wings: [
    understandingProblemsWing,
    solvingStrategiesWing,
    creativeThinkingWing,
    collaborativeSolvingWing,
    complexProblemsWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in content phases
  calibrationModels: [] as CalibrationModel[], // Populated in Phase 27
  trySessions: [] as TrySession[], // Populated in Phase 23
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the problem-solving department with a CollegeLoader.
 *
 * This is a no-op for the scaffold phase -- the CollegeLoader discovers
 * departments via DEPARTMENT.md on the filesystem.
 */
export function registerProblemSolvingDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
