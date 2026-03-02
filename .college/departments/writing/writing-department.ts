/**
 * Writing Department Definition
 *
 * Defines the CollegeDepartment object for the writing department,
 * including all 5 wings derived from WRIT-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/writing/writing-department
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

const readingDiscoveryWing: DepartmentWing = {
  id: 'reading-discovery',
  name: 'Reading as Discovery',
  description:
    'Developing close reading skills: slowing down, attending to authorial choices, ' +
    'supporting interpretations with textual evidence, and recognizing that multiple ' +
    'valid interpretations can coexist within a single text.',
  concepts: [], // Populated in Task 2
};

const storyNarrativeWing: DepartmentWing = {
  id: 'story-narrative',
  name: 'Story & Narrative',
  description:
    'Understanding narrative craft -- character development and motivation, point of view, ' +
    'external and internal conflict, dialogue, imagery, and pacing. Analyzing how authors ' +
    'shape reader experience and creating original fiction.',
  concepts: [], // Populated in Task 2
};

const poetryLanguageWing: DepartmentWing = {
  id: 'poetry-language',
  name: 'Poetry & Language',
  description:
    'Appreciating poetry across forms from haiku to free verse, understanding how sound ' +
    'and form contribute to meaning, working with figurative language, sensory imagery, ' +
    'and writing original poetry experimenting with forms.',
  concepts: [], // Populated in Task 2
};

const writingProcessWing: DepartmentWing = {
  id: 'writing-process',
  name: 'The Writing Process',
  description:
    'Understanding writing as recursive: drafting and discovery, peer workshopping and ' +
    'feedback, substantial revision, editing and publishing, and the long-term development ' +
    'of an authentic, distinctive personal voice.',
  concepts: [], // Populated in Task 2
};

const literaryAnalysisWing: DepartmentWing = {
  id: 'literary-analysis',
  name: 'Literary Analysis & Critical Response',
  description:
    'Moving beyond plot summary to interpret meaning, using thematic analysis and ' +
    'symbol recognition, contextualizing texts within history and culture, and applying ' +
    'multiple interpretive frameworks to the same text.',
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
 * The Writing department -- 5 wings of literature and creative writing.
 *
 * Wings progress from foundational reading skills through literary analysis,
 * treating writing and reading as inseparable companion practices.
 */
export const writingDepartment: CollegeDepartment = {
  id: 'writing',
  name: 'Literature & Creative Writing',
  wings: [
    readingDiscoveryWing,
    storyNarrativeWing,
    poetryLanguageWing,
    writingProcessWing,
    literaryAnalysisWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in Task 2
  calibrationModels: [] as CalibrationModel[], // Populated in future phases
  trySessions: [] as TrySession[], // Populated in Task 2
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the writing department with a CollegeLoader.
 *
 * CollegeLoader auto-discovers departments via DEPARTMENT.md on the filesystem.
 * This function provides a programmatic registration hook for future loader integration.
 */
export function registerWritingDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
  // This function provides a programmatic registration hook for future use.
}
