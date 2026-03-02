/**
 * Data Science Department Definition
 *
 * Defines the CollegeDepartment object for the data-science department,
 * including all 5 wings derived from DATA-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/data-science/data-science-department
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

const dataCollectionWing: DepartmentWing = {
  id: 'data-collection',
  name: 'Data Collection & Organization',
  description:
    'Understanding data sources, sampling methods, bias in collection, data quality, ' +
    'and organizing data in tables and spreadsheets. How data gets from the world ' +
    'into a form we can analyze.',
  concepts: [], // Populated in Task 2
};

const exploratoryAnalysisWing: DepartmentWing = {
  id: 'exploratory-analysis',
  name: 'Exploratory Data Analysis',
  description:
    'Summarizing data with measures of center and spread, identifying outliers, ' +
    'creating frequency distributions, and exploring relationships between variables. ' +
    'The art of getting to know your data before drawing conclusions.',
  concepts: [], // Populated in Task 2
};

const visualizationWing: DepartmentWing = {
  id: 'visualization-communication',
  name: 'Data Visualization & Communication',
  description:
    'Choosing appropriate visualization types, creating accurate and honest graphs, ' +
    'interpreting and critiquing visualizations, and telling clear stories with data. ' +
    'Turning analysis into understanding.',
  concepts: [], // Populated in Task 2
};

const statisticalInferenceWing: DepartmentWing = {
  id: 'statistical-inference',
  name: 'Statistical Inference & Reasoning',
  description:
    'Applying probability concepts, understanding the normal distribution, conducting ' +
    'hypothesis tests, and interpreting confidence intervals. Reasoning under uncertainty ' +
    'with mathematical rigor.',
  concepts: [], // Populated in Task 2
};

const dataEthicsWing: DepartmentWing = {
  id: 'data-ethics',
  name: 'Data Ethics & Real-World Applications',
  description:
    'Privacy and consent, recognizing algorithmic bias, data ownership and rights, ' +
    'and evaluating data claims critically. The responsibilities that come with ' +
    'working with information about people.',
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
 * The Data Science department -- 5 wings of data literacy and analysis.
 *
 * Wings progress from collection (how data enters analysis) through ethics
 * (responsibility in data work), with quantitative calibration models.
 */
export const dataScienceDepartment: CollegeDepartment = {
  id: 'data-science',
  name: 'Data Science & Analysis',
  wings: [
    dataCollectionWing,
    exploratoryAnalysisWing,
    visualizationWing,
    statisticalInferenceWing,
    dataEthicsWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in Task 2
  calibrationModels: [] as CalibrationModel[], // Statistical models populated in Task 2
  trySessions: [] as TrySession[], // Populated in Task 2
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the data science department with a CollegeLoader.
 *
 * CollegeLoader auto-discovers departments via DEPARTMENT.md on the filesystem.
 * This function provides a programmatic registration hook for future loader integration.
 */
export function registerDataScienceDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
  // This function provides a programmatic registration hook for future use.
}
