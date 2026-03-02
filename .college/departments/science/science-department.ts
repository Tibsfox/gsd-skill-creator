/**
 * Science Department Definition
 *
 * Defines the CollegeDepartment object for the science department,
 * including 5 wings derived from SCI-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/science/science-department
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

const observationInquiryWing: DepartmentWing = {
  id: 'observation-inquiry',
  name: 'Observation & Inquiry',
  description:
    'The first skills of science: careful observation, asking questions, and developing ' +
    'scientific curiosity. Covers sensory observation, qualitative and quantitative data, ' +
    'scientific questions, variables, and the nature of scientific investigation.',
  concepts: [], // Populated in Phase 23
};

const hypothesisDesignWing: DepartmentWing = {
  id: 'hypothesis-design',
  name: 'Hypothesis & Experimental Design',
  description:
    'Forming testable predictions and designing fair experiments to test them. ' +
    'Covers hypothesis formation, controlled experiments, independent and dependent ' +
    'variables, experimental controls, and the importance of replication.',
  concepts: [], // Populated in Phase 23
};

const dataAnalysisWing: DepartmentWing = {
  id: 'data-analysis',
  name: 'Data Collection & Analysis',
  description:
    'Gathering, recording, and making sense of scientific data. ' +
    'Covers data collection methods, measurement and units, data tables, ' +
    'graphs and visualizations, error analysis, and drawing conclusions from evidence.',
  concepts: [], // Populated in Phase 23
};

const scientificCommunicationWing: DepartmentWing = {
  id: 'scientific-communication',
  name: 'Scientific Communication & Argumentation',
  description:
    'Sharing scientific ideas clearly and arguing from evidence. ' +
    'Covers scientific writing, lab reports, claims-evidence-reasoning, ' +
    'peer review, scientific vocabulary, and evaluating scientific sources.',
  concepts: [], // Populated in Phase 23
};

const natureOfScienceWing: DepartmentWing = {
  id: 'nature-of-science',
  name: 'History & Nature of Science',
  description:
    'Understanding science as a human endeavor with a rich history. ' +
    'Covers the development of scientific theories, landmark discoveries, ' +
    'scientific paradigms, the role of creativity, and science in society.',
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
 * The Science department -- 5 wings covering scientific inquiry skills.
 *
 * Wings follow the scientific method from observation through communication,
 * with concepts populated progressively by content Phase 23.
 */
export const scienceDepartment: CollegeDepartment = {
  id: 'science',
  name: 'Science',
  wings: [
    observationInquiryWing,
    hypothesisDesignWing,
    dataAnalysisWing,
    scientificCommunicationWing,
    natureOfScienceWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in content phases
  calibrationModels: [] as CalibrationModel[], // Populated in Phase 27
  trySessions: [] as TrySession[], // Populated in Phase 23
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the science department with a CollegeLoader.
 *
 * This is a no-op for the scaffold phase -- the CollegeLoader discovers
 * departments via DEPARTMENT.md on the filesystem.
 */
export function registerScienceDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
