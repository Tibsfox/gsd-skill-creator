/**
 * Reading Department Definition
 *
 * Defines the CollegeDepartment object for the reading department,
 * including 5 wings derived from READ-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/reading/reading-department
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

const foundationsReadingWing: DepartmentWing = {
  id: 'foundations-reading',
  name: 'Foundations of Reading',
  description:
    'The building blocks of literacy: phonological awareness, phonics, decoding, ' +
    'sight words, and fluency. The mechanics that enable all other reading, ' +
    'from letter-sound correspondence through reading connected text smoothly.',
  concepts: [], // Populated in Phase 23
};

const vocabularyLanguageWing: DepartmentWing = {
  id: 'vocabulary-language',
  name: 'Vocabulary & Language',
  description:
    'Building word knowledge and understanding how language works. ' +
    'Covers word learning strategies, morphology, context clues, academic vocabulary, ' +
    'figurative language, and the relationship between vocabulary and comprehension.',
  concepts: [], // Populated in Phase 23
};

const comprehensionWing: DepartmentWing = {
  id: 'comprehension',
  name: 'Comprehension & Meaning-Making',
  description:
    'Constructing meaning from text through active engagement. ' +
    'Covers main idea and supporting details, inferencing, text structure, ' +
    'summarizing, questioning, monitoring understanding, and making connections.',
  concepts: [], // Populated in Phase 23
};

const criticalReadingWing: DepartmentWing = {
  id: 'critical-reading',
  name: 'Critical Reading & Analysis',
  description:
    'Reading to evaluate, analyze, and think critically about texts. ' +
    'Covers author purpose and perspective, argument analysis, identifying bias, ' +
    'evaluating evidence, literary analysis, and reading across multiple texts.',
  concepts: [], // Populated in Phase 23
};

const readingAcrossCurriculumWing: DepartmentWing = {
  id: 'reading-across-curriculum',
  name: 'Reading Across the Curriculum',
  description:
    'Applying reading skills in content-area contexts. ' +
    'Covers reading informational and technical texts, discipline-specific vocabulary, ' +
    'reading primary sources, digital reading, and navigating complex documents.',
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
 * The Reading department -- 5 wings from foundations through cross-curricular application.
 *
 * Wings are ordered from decoding mechanics to sophisticated analytical reading,
 * with concepts populated progressively by content Phase 23.
 */
export const readingDepartment: CollegeDepartment = {
  id: 'reading',
  name: 'Reading',
  wings: [
    foundationsReadingWing,
    vocabularyLanguageWing,
    comprehensionWing,
    criticalReadingWing,
    readingAcrossCurriculumWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in content phases
  calibrationModels: [] as CalibrationModel[], // Populated in Phase 27
  trySessions: [] as TrySession[], // Populated in Phase 23
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the reading department with a CollegeLoader.
 *
 * This is a no-op for the scaffold phase -- the CollegeLoader discovers
 * departments via DEPARTMENT.md on the filesystem.
 */
export function registerReadingDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
