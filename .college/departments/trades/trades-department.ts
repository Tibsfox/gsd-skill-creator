/**
 * Trades Department Definition
 *
 * Defines the CollegeDepartment object for the trades department,
 * including all 5 wings, token budget configuration, and the
 * registration function for the CollegeLoader.
 *
 * @module departments/trades/trades-department
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

const toolsSafetyWing: DepartmentWing = {
  id: 'tools-safety',
  name: 'Tools, Safety & Workshop -- The Foundation of All Trades',
  description:
    'Tool identification, proper use, maintenance, safety protocols, personal protective ' +
    'equipment (PPE), workshop organization, and safety culture. The foundation for all ' +
    'trades work: understanding what tools do, how to use them correctly, and why safety ' +
    'rules exist -- not as bureaucratic requirements but as codified wisdom from injury history.',
  concepts: [],
};

const woodworkingWing: DepartmentWing = {
  id: 'woodworking',
  name: 'Woodworking & Fabrication -- Working with Wood',
  description:
    'Wood identification, grain direction, measurement and marking, cutting techniques, ' +
    'joining methods (nails, screws, dowels, mortise and tenon), and finishing with sanding ' +
    'and staining. From simple repairs to multi-step project planning and execution. ' +
    'Woodworking teaches precision, problem-solving, and patience.',
  concepts: [],
};

const electricalBasicsWing: DepartmentWing = {
  id: 'electrical-basics',
  name: 'Electrical Basics -- Understanding Circuits',
  description:
    'Electrical safety fundamentals, basic circuit concepts (voltage, current, resistance, ' +
    'Ohm\'s law), reading electrical diagrams, common repairs (replacing outlets, switches, ' +
    'light fixtures), and understanding the home electrical system. Strict safety first: ' +
    'always de-energize before working, test before touching.',
  concepts: [],
};

const plumbingHvacWing: DepartmentWing = {
  id: 'plumbing-hvac',
  name: 'Plumbing & HVAC -- Water and Air Systems',
  description:
    'Understanding residential water supply and drain systems, common plumbing repairs ' +
    '(fixing leaks, replacing faucets, unclogging drains), HVAC basics (filter maintenance, ' +
    'thermostat programming, ventilation), and energy efficiency in home systems. ' +
    'Knowing when to DIY and when to call a professional.',
  concepts: [],
};

const projectManagementWing: DepartmentWing = {
  id: 'project-management',
  name: 'Project Management -- Making Things Happen',
  description:
    'Planning and executing trades projects from conception to completion: scope definition, ' +
    'materials estimation, budgeting, scheduling, quality control, and troubleshooting when ' +
    'plans meet reality. Covers drawing up plans, creating cut lists, sequencing operations, ' +
    'and the discipline of measuring twice and cutting once.',
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
 * The Trades department -- 5 wings of applied trades and skills.
 */
export const tradesDepartment: CollegeDepartment = {
  id: 'trades',
  name: 'Trades & Applied Skills',
  wings: [
    toolsSafetyWing,
    woodworkingWing,
    electricalBasicsWing,
    plumbingHvacWing,
    projectManagementWing,
  ],
  concepts: [] as RosettaConcept[],
  calibrationModels: [] as CalibrationModel[],
  trySessions: [] as TrySession[],
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the trades department with a CollegeLoader.
 */
export function registerTradesDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
