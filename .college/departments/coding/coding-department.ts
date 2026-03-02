/**
 * Coding Department Definition
 *
 * Defines the CollegeDepartment object for the coding department,
 * including all 5 wings derived from CODE-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/coding/coding-department
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

const computationalThinkingWing: DepartmentWing = {
  id: 'computational-thinking',
  name: 'Computational Thinking',
  description:
    'Sequential thinking, algorithm design, pattern recognition, abstraction, and the ' +
    'debugging mindset. The foundation of all programming -- thinking clearly before ' +
    'writing a single line of code.',
  concepts: [], // Populated in Task 2
};

const programmingFundamentalsWing: DepartmentWing = {
  id: 'programming-fundamentals',
  name: 'Programming Fundamentals',
  description:
    'Variables, data types, control flow (if/else, loops, functions), input/output, ' +
    'syntax and grammar, and the transition from block-based to text-based programming. ' +
    'The core vocabulary of every programming language.',
  concepts: [], // Populated in Task 2
};

const buildingProjectsWing: DepartmentWing = {
  id: 'building-projects',
  name: 'Building Projects',
  description:
    'Project planning and scoping, iterative development, data analysis and visualization, ' +
    'game development fundamentals, testing and debugging tools, code organization, ' +
    'peer review, and documentation. Where theory becomes working software.',
  concepts: [], // Populated in Task 2
};

const algorithmsEfficiencyWing: DepartmentWing = {
  id: 'algorithms-efficiency',
  name: 'Algorithms & Efficiency',
  description:
    'Sorting and searching algorithms, Big-O time and space complexity analysis, greedy ' +
    'algorithms, dynamic programming concepts, graph algorithms, and algorithm trade-offs. ' +
    'Understanding why some solutions are fundamentally better than others.',
  concepts: [], // Populated in Task 2
};

const computingSocietyWing: DepartmentWing = {
  id: 'computing-society',
  name: 'Computing & Society',
  description:
    'Computing ethics and responsibility, artificial intelligence and machine learning basics, ' +
    'cybersecurity and privacy, digital citizenship, open source philosophy, accessibility ' +
    'in software, environmental impact of computing, and bias in algorithms.',
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
 * The Coding department -- 5 wings of computer science and programming.
 *
 * Wings are ordered from foundational (computational thinking) to applied
 * (computing & society), with concepts populated in Task 2.
 */
export const codingDepartment: CollegeDepartment = {
  id: 'coding',
  name: 'Computer Science & Coding',
  wings: [
    computationalThinkingWing,
    programmingFundamentalsWing,
    buildingProjectsWing,
    algorithmsEfficiencyWing,
    computingSocietyWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in Task 2
  calibrationModels: [] as CalibrationModel[], // Populated in future phases
  trySessions: [] as TrySession[], // Populated in Task 2
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the coding department with a CollegeLoader.
 *
 * CollegeLoader auto-discovers departments via DEPARTMENT.md on the filesystem.
 * This function provides a programmatic registration hook for future loader integration.
 */
export function registerCodingDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
  // This function provides a programmatic registration hook for future use.
}
