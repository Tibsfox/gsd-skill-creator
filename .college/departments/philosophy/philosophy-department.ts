/**
 * Philosophy Department Definition
 *
 * Defines the CollegeDepartment object for the philosophy department,
 * including all 5 wings, token budget configuration, and the
 * registration function for the CollegeLoader.
 *
 * @module departments/philosophy/philosophy-department
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

const wonderQuestioningWing: DepartmentWing = {
  id: 'wonder-questioning',
  name: 'Wonder & Questioning -- The Philosophical Impulse',
  description:
    'Developing the habit of philosophical inquiry: asking why, challenging assumptions, ' +
    'Socratic method, maintaining intellectual curiosity and humility. Covers the art of ' +
    'asking meaningful questions, distinguishing philosophical from factual questions, ' +
    'thought experiments, and the tradition of philosophical dialogue.',
  concepts: [],
};

const logicReasoningWing: DepartmentWing = {
  id: 'logic-reasoning',
  name: 'Logic & Reasoning -- The Architecture of Arguments',
  description:
    'Building sound arguments, identifying premises and conclusions, deductive and ' +
    'inductive reasoning, and common fallacies. Covers argument structure, validity versus ' +
    'soundness, formal logic basics, informal fallacies, argument mapping, and the ' +
    'difference between convincing and correct.',
  concepts: [],
};

const ethicsWing: DepartmentWing = {
  id: 'ethics',
  name: 'Ethics & Moral Reasoning -- How to Live Well',
  description:
    'Exploring what makes actions right or wrong, what kind of person to be, and ' +
    'how to think through moral dilemmas. Covers consequentialism, deontology, virtue ' +
    'ethics, care ethics, and applied ethics in real situations including justice, ' +
    'animal rights, environmental ethics, and technology ethics.',
  concepts: [],
};

const epistemologyWing: DepartmentWing = {
  id: 'epistemology',
  name: 'Epistemology -- The Nature of Knowledge',
  description:
    'Asking how we know what we know, what the limits of knowledge are, and whether ' +
    'we can trust our senses, memory, and reasoning. Covers the justified true belief ' +
    'framework, skepticism, the problem of induction, scientific knowledge versus other ' +
    'forms of knowing, and the social dimensions of knowledge.',
  concepts: [],
};

const aestheticsWing: DepartmentWing = {
  id: 'aesthetics',
  name: 'Aesthetics & Meaning -- Beauty and Expression',
  description:
    'Exploring questions of beauty, taste, artistic value, and the nature of aesthetic ' +
    'experience. Covers the nature of art, aesthetic experience, subjective versus ' +
    'objective standards of beauty, the relationship between ethics and aesthetics, ' +
    'and the philosophy of music, literature, and visual art.',
  concepts: [],
};

// ─── Token Budget ───────────────────────────────────────────────────────────

const tokenBudget: TokenBudgetConfig = {
  summaryLimit: 3000,
  activeLimit: 12000,
  deepLimit: 50000,
};

// ─── Department Definition ──────────────────────────────────────────────────

/**
 * The Philosophy department -- 5 wings of philosophical inquiry.
 */
export const philosophyDepartment: CollegeDepartment = {
  id: 'philosophy',
  name: 'Philosophy',
  wings: [
    wonderQuestioningWing,
    logicReasoningWing,
    ethicsWing,
    epistemologyWing,
    aestheticsWing,
  ],
  concepts: [] as RosettaConcept[],
  calibrationModels: [] as CalibrationModel[],
  trySessions: [] as TrySession[],
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the philosophy department with a CollegeLoader.
 */
export function registerPhilosophyDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
