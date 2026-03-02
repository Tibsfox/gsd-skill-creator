/**
 * Engineering Department Definition
 *
 * Defines the CollegeDepartment object for the engineering department,
 * including 5 wings derived from ENGR-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/engineering/engineering-department
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

const designProcessWing: DepartmentWing = {
  id: 'design-process',
  name: 'The Engineering Design Process',
  description:
    'The iterative cycle at the heart of engineering. ' +
    'Covers defining problems, researching constraints, ideating solutions, ' +
    'prototyping, testing and evaluating, and communicating the design.',
  concepts: [], // Populated in Phase 23
};

const materialsStructuresWing: DepartmentWing = {
  id: 'materials-structures',
  name: 'Materials & Structures',
  description:
    'How materials behave under loads and how structural systems distribute forces. ' +
    'Covers stress and strain, material selection, beams and columns, ' +
    'trusses, bridges, and structural failure modes.',
  concepts: [], // Populated in Phase 23
};

const mechanismsSystemsWing: DepartmentWing = {
  id: 'mechanisms-systems',
  name: 'Mechanisms & Systems',
  description:
    'How mechanical systems transmit and transform force and motion. ' +
    'Covers simple machines, gear trains, linkages, hydraulics and pneumatics, ' +
    'feedback and control systems, and system modeling.',
  concepts: [], // Populated in Phase 23
};

const prototypingTestingWing: DepartmentWing = {
  id: 'prototyping-testing',
  name: 'Prototyping & Testing',
  description:
    'Building and evaluating physical and digital prototypes. ' +
    'Covers rapid prototyping techniques, model making, testing methodologies, ' +
    'data collection from experiments, design iteration, and failure analysis.',
  concepts: [], // Populated in Phase 23
};

const ethicsImpactWing: DepartmentWing = {
  id: 'ethics-impact',
  name: 'Engineering Ethics & Impact',
  description:
    'The responsibilities and societal consequences of engineering decisions. ' +
    'Covers engineering codes of ethics, safety and risk, environmental impact, ' +
    'inclusive design, and the role of engineers in shaping society.',
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
 * The Engineering department -- 5 wings from design process through ethics and impact.
 *
 * Wings develop engineering thinking from problem framing through materials science,
 * mechanical systems, prototyping, and ethical responsibility.
 */
export const engineeringDepartment: CollegeDepartment = {
  id: 'engineering',
  name: 'Engineering',
  wings: [
    designProcessWing,
    materialsStructuresWing,
    mechanismsSystemsWing,
    prototypingTestingWing,
    ethicsImpactWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in content phases
  calibrationModels: [] as CalibrationModel[], // Populated in Phase 27
  trySessions: [] as TrySession[], // Populated in Phase 23
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the engineering department with a CollegeLoader.
 *
 * This is a no-op for the scaffold phase -- the CollegeLoader discovers
 * departments via DEPARTMENT.md on the filesystem.
 */
export function registerEngineeringDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
