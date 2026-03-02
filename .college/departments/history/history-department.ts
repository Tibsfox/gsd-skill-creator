/**
 * History Department Definition
 *
 * Defines the CollegeDepartment object for the history department,
 * including 5 wings derived from HIST-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/history/history-department
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

const sourcesEvidenceWing: DepartmentWing = {
  id: 'sources-evidence',
  name: 'Sources & Evidence',
  description:
    'Historians\' tools for reconstructing the past. ' +
    'Covers primary and secondary sources, sourcing (who, when, why), ' +
    'corroboration, contextualizing documents, and evaluating reliability.',
  concepts: [], // Populated in Phase 23
};

const causationConsequenceWing: DepartmentWing = {
  id: 'causation-consequence',
  name: 'Causation & Consequence',
  description:
    'Understanding why historical events happen and what they set in motion. ' +
    'Covers immediate versus underlying causes, chains of causation, ' +
    'intended and unintended consequences, and counterfactual reasoning.',
  concepts: [], // Populated in Phase 23
};

const continuityChangeWing: DepartmentWing = {
  id: 'continuity-change',
  name: 'Continuity & Change',
  description:
    'Tracing what changes and what persists across time. ' +
    'Covers periodization, turning points, rates of change, patterns and trends, ' +
    'and the tension between continuity and revolution in history.',
  concepts: [], // Populated in Phase 23
};

const perspectivesEmpathyWing: DepartmentWing = {
  id: 'perspectives-empathy',
  name: 'Perspectives & Empathy',
  description:
    'Understanding the past through the eyes of its participants. ' +
    'Covers historical empathy, multiple perspectives, whose voices are ' +
    'included or excluded in historical narratives, and avoiding presentism.',
  concepts: [], // Populated in Phase 23
};

const historicalArgumentationWing: DepartmentWing = {
  id: 'historical-argumentation',
  name: 'Historical Argumentation',
  description:
    'Constructing and defending historical interpretations. ' +
    'Covers thesis development, using evidence to support claims, ' +
    'acknowledging counterarguments, and the conventions of historical writing.',
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
 * The History department -- 5 wings covering historical thinking skills.
 *
 * Wings develop the disciplinary skills of historians: sourcing, causation,
 * continuity, perspective, and argumentation, with concepts by content Phase 23.
 */
export const historyDepartment: CollegeDepartment = {
  id: 'history',
  name: 'History',
  wings: [
    sourcesEvidenceWing,
    causationConsequenceWing,
    continuityChangeWing,
    perspectivesEmpathyWing,
    historicalArgumentationWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in content phases
  calibrationModels: [] as CalibrationModel[], // Populated in Phase 27
  trySessions: [] as TrySession[], // Populated in Phase 23
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the history department with a CollegeLoader.
 *
 * This is a no-op for the scaffold phase -- the CollegeLoader discovers
 * departments via DEPARTMENT.md on the filesystem.
 */
export function registerHistoryDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
