/**
 * Materials Department Definition
 *
 * Defines the CollegeDepartment object for the materials department,
 * including 5 wings derived from MFAB-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/materials/materials-department
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

const materialPropertiesWing: DepartmentWing = {
  id: 'material-properties',
  name: 'Material Properties & Testing',
  description:
    'Characterizing how materials behave under different conditions. ' +
    'Covers mechanical properties (strength, hardness, ductility), thermal properties, ' +
    'electrical and magnetic properties, optical properties, and standardized testing methods.',
  concepts: [], // Populated in Phase 23
};

const materialsFamiliesWing: DepartmentWing = {
  id: 'materials-families',
  name: 'Materials Families',
  description:
    'The four fundamental material families and their characteristics. ' +
    'Covers metals and alloys, polymers (plastics, elastomers), ceramics and glasses, ' +
    'and composites -- their structures, properties, advantages, and limitations.',
  concepts: [], // Populated in Phase 23
};

const fabricationProcessesWing: DepartmentWing = {
  id: 'fabrication-processes',
  name: 'Fabrication & Manufacturing Processes',
  description:
    'How raw materials are shaped and assembled into useful products. ' +
    'Covers casting, forging, machining, joining (welding, adhesives), ' +
    'additive manufacturing (3D printing), and surface finishing techniques.',
  concepts: [], // Populated in Phase 23
};

const designManufacturingWing: DepartmentWing = {
  id: 'design-manufacturing',
  name: 'Design for Manufacturing',
  description:
    'Designing products with fabrication constraints and efficiency in mind. ' +
    'Covers tolerances and fits, design for assembly, material cost considerations, ' +
    'design for reliability, and the relationship between design decisions and manufacturing costs.',
  concepts: [], // Populated in Phase 23
};

const sustainabilityLifecycleWing: DepartmentWing = {
  id: 'sustainability-lifecycle',
  name: 'Sustainability & Lifecycle',
  description:
    'The environmental and social impact of materials through their full lifecycle. ' +
    'Covers lifecycle assessment (LCA), embodied energy, recycling and end-of-life, ' +
    'material scarcity, sustainable material selection, and circular economy principles.',
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
 * The Materials department -- 5 wings from material properties through sustainability.
 *
 * Wings develop understanding from characterizing materials through families,
 * fabrication, design-for-manufacturing, and lifecycle sustainability.
 */
export const materialsDepartment: CollegeDepartment = {
  id: 'materials',
  name: 'Materials & Fabrication',
  wings: [
    materialPropertiesWing,
    materialsFamiliesWing,
    fabricationProcessesWing,
    designManufacturingWing,
    sustainabilityLifecycleWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in content phases
  calibrationModels: [] as CalibrationModel[], // Populated in Phase 27
  trySessions: [] as TrySession[], // Populated in Phase 23
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the materials department with a CollegeLoader.
 *
 * This is a no-op for the scaffold phase -- the CollegeLoader discovers
 * departments via DEPARTMENT.md on the filesystem.
 */
export function registerMaterialsDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
