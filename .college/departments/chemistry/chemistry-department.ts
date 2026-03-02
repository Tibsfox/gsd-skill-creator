/**
 * Chemistry Department Definition
 *
 * Defines the CollegeDepartment object for the chemistry department,
 * including 5 wings derived from CHEM-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/chemistry/chemistry-department
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

const matterPropertiesWing: DepartmentWing = {
  id: 'matter-properties',
  name: 'Matter & Properties',
  description:
    'Understanding what matter is and how to describe and classify it. ' +
    'Covers states of matter, physical and chemical properties, mixtures ' +
    'and pure substances, density, and changes of state.',
  concepts: [], // Populated in Phase 23
};

const atomsPeriodicTableWing: DepartmentWing = {
  id: 'atoms-periodic-table',
  name: 'Atoms & the Periodic Table',
  description:
    'The atomic theory of matter and the organization of elements. ' +
    'Covers atomic structure (protons, neutrons, electrons), electron ' +
    'configuration, the periodic table organization, periodic trends, ' +
    'and isotopes and radioactivity.',
  concepts: [], // Populated in Phase 23
};

const bondsMolecularStructureWing: DepartmentWing = {
  id: 'bonds-molecular-structure',
  name: 'Bonds & Molecular Structure',
  description:
    'How atoms join to form molecules and how structure determines properties. ' +
    'Covers ionic, covalent, and metallic bonding, Lewis structures, molecular ' +
    'geometry (VSEPR theory), polarity, and intermolecular forces.',
  concepts: [], // Populated in Phase 23
};

const chemicalReactionsWing: DepartmentWing = {
  id: 'chemical-reactions',
  name: 'Chemical Reactions & Energy',
  description:
    'Understanding how chemicals react and the energy changes involved. ' +
    'Covers chemical equations, balancing, reaction types, stoichiometry, ' +
    'acids and bases, oxidation-reduction, and thermochemistry.',
  concepts: [], // Populated in Phase 23
};

const appliedChemistryWing: DepartmentWing = {
  id: 'applied-chemistry',
  name: 'Applied Chemistry',
  description:
    'Chemistry in action: industrial processes, biochemistry, environmental chemistry, ' +
    'and everyday applications. Covers polymers, pharmaceuticals, atmospheric chemistry, ' +
    'green chemistry, and chemistry in food and materials.',
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
 * The Chemistry department -- 5 wings from matter properties through applied chemistry.
 *
 * Wings progress from observable properties through atomic theory, bonding, reactions,
 * and real-world applications, with concepts populated by content Phase 23.
 */
export const chemistryDepartment: CollegeDepartment = {
  id: 'chemistry',
  name: 'Chemistry',
  wings: [
    matterPropertiesWing,
    atomsPeriodicTableWing,
    bondsMolecularStructureWing,
    chemicalReactionsWing,
    appliedChemistryWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in content phases
  calibrationModels: [] as CalibrationModel[], // Populated in Phase 27
  trySessions: [] as TrySession[], // Populated in Phase 23
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the chemistry department with a CollegeLoader.
 *
 * This is a no-op for the scaffold phase -- the CollegeLoader discovers
 * departments via DEPARTMENT.md on the filesystem.
 */
export function registerChemistryDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
