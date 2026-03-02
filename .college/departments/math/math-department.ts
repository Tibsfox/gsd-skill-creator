/**
 * Math Department Definition
 *
 * Defines the CollegeDepartment object for the math department,
 * including 5 wings derived from MATH-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * Note: MATH-101 has 4 source modules. Module 4 (Data, Probability &
 * Statistics) is split into two wings -- Data & Probability and
 * Statistics & Inference -- to meet the 5-wing department structure.
 *
 * @module departments/math/math-department
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

const numberOperationsWing: DepartmentWing = {
  id: 'number-operations',
  name: 'Number & Operations',
  description:
    'Understanding quantity, place value, and how to combine and separate quantities. ' +
    'Covers subitizing, counting principles, number composition, all four operations, ' +
    'and developing computational fluency from foundations through multi-digit arithmetic.',
  concepts: [], // Populated in Phase 23
};

const patternsAlgebraWing: DepartmentWing = {
  id: 'patterns-algebra',
  name: 'Patterns & Algebraic Thinking',
  description:
    'Recognizing patterns, generalizing rules, using variables, and solving equations. ' +
    'Spans pattern recognition and extension, understanding variables as unknowns and ' +
    'varying quantities, functional relationships, expressions, equations, and systems.',
  concepts: [], // Populated in Phase 23
};

const geometrySpatialWing: DepartmentWing = {
  id: 'geometry-spatial',
  name: 'Geometry & Spatial Thinking',
  description:
    'Understanding shapes, space, transformations, and geometric measurement. ' +
    'Covers shape properties and classification, symmetry, transformations, ' +
    'congruence and similarity, area, perimeter, volume, coordinate geometry, ' +
    'trigonometry, and 3D visualization.',
  concepts: [], // Populated in Phase 23
};

const dataProbabilityWing: DepartmentWing = {
  id: 'data-probability',
  name: 'Data & Probability',
  description:
    'Collecting, organizing, and representing data alongside probability foundations. ' +
    'Covers data collection methods, graphical representations, experimental versus ' +
    'theoretical probability, the law of large numbers, and reasoning about uncertainty.',
  concepts: [], // Populated in Phase 23
};

const statisticsInferenceWing: DepartmentWing = {
  id: 'statistics-inference',
  name: 'Statistics & Inference',
  description:
    'Analyzing data to draw conclusions using statistical reasoning. ' +
    'Covers measures of center and spread, sampling and bias, confidence intervals, ' +
    'hypothesis testing, correlation versus causation, and statistical modeling.',
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
 * The Math department -- 5 wings covering the full K-12 mathematics curriculum.
 *
 * Wings are ordered from foundational (number sense) to integrative (statistical
 * inference), with concepts populated progressively by content Phase 23.
 */
export const mathDepartment: CollegeDepartment = {
  id: 'math',
  name: 'Mathematics',
  wings: [
    numberOperationsWing,
    patternsAlgebraWing,
    geometrySpatialWing,
    dataProbabilityWing,
    statisticsInferenceWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in content phases
  calibrationModels: [] as CalibrationModel[], // Populated in Phase 27
  trySessions: [] as TrySession[], // Populated in Phase 23
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the math department with a CollegeLoader.
 *
 * This is a no-op for the scaffold phase -- the CollegeLoader discovers
 * departments via DEPARTMENT.md on the filesystem. This function exists
 * for programmatic registration patterns and future loader integration.
 */
export function registerMathDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
  // This function provides a programmatic registration hook for future use.
  // The department definition above is the canonical source of truth.
}
