/**
 * Spatial Computing Department Definition
 *
 * Defines the CollegeDepartment object for the spatial-computing department,
 * including all 5 wings and token budget configuration.
 *
 * Content is derived from domain knowledge of Minecraft as a spatial computing
 * and engineering education platform -- no source YAML pack exists.
 *
 * @module departments/spatial-computing/spatial-computing-department
 */

import type {
  CollegeDepartment,
  DepartmentWing,
  TrySession,
  TokenBudgetConfig,
  CalibrationModel,
  RosettaConcept,
} from '../../rosetta-core/types.js';

// ─── Wing Definitions ───────────────────────────────────────────────────────

const spatialFoundationsWing: DepartmentWing = {
  id: 'spatial-foundations',
  name: 'Spatial Foundations',
  description:
    'Coordinate systems, 3D navigation, spatial reasoning, and geometric structures in block space. ' +
    'Covers X/Y/Z axes, F3 debug overlay, chunk boundaries, and voxel geometry.',
  concepts: ['spatial-coordinate-navigation', 'spatial-reasoning-3d', 'spatial-geometric-structures'],
};

const buildingArchitectureWing: DepartmentWing = {
  id: 'building-architecture',
  name: 'Building & Architecture',
  description:
    'Structural principles, material selection, blueprint-to-build translation, and aesthetic design. ' +
    'Covers pillar spacing, arch construction, block hardness, blast resistance, and schematic planning.',
  concepts: ['spatial-structural-principles', 'spatial-material-properties', 'spatial-blueprint-design'],
};

const redstoneEngineeringWing: DepartmentWing = {
  id: 'redstone-engineering',
  name: 'Redstone Engineering',
  description:
    'Boolean logic via redstone dust, combinational circuits, timing, repeaters, comparators, and pistons. ' +
    'Covers AND/OR/NOT gates, signal strength 0-15, monostable circuits, and clock designs.',
  concepts: ['spatial-logic-gates-redstone', 'spatial-circuit-timing', 'spatial-signal-propagation'],
};

const systemsAutomationWing: DepartmentWing = {
  id: 'systems-automation',
  name: 'Systems & Automation',
  description:
    'Automated farms, item sorting networks, transportation systems, production chains, and resource flows. ' +
    'Covers hopper chains, dropper arrays, comparator-based item sorters, and smelting arrays.',
  concepts: ['spatial-automated-farms', 'spatial-item-transport-sorting', 'spatial-resource-production-chains'],
};

const collaborativeDesignWing: DepartmentWing = {
  id: 'collaborative-design',
  name: 'Collaborative Design',
  description:
    'Server project planning, role specialization, iterative build cycles, and community construction. ' +
    'Covers town planning, district zoning, architect/engineer/decorator roles, and build iteration.',
  concepts: ['spatial-server-project-planning', 'spatial-role-specialization', 'spatial-iterative-build-process'],
};

// ─── Token Budget ───────────────────────────────────────────────────────────

const tokenBudget: TokenBudgetConfig = {
  summaryLimit: 3000,
  activeLimit: 12000,
  deepLimit: 50000,
};

// ─── Department Definition ──────────────────────────────────────────────────

/**
 * The Spatial Computing department -- 5 wings of spatial reasoning and engineering.
 *
 * Wings progress from concrete hands-on navigation through abstract systems thinking
 * and collaborative project management. Minecraft serves as the medium for teaching
 * spatial reasoning, Boolean logic, and engineering design principles.
 */
export const spatialComputingDepartment: CollegeDepartment = {
  id: 'spatial-computing',
  name: 'Spatial Computing',
  wings: [
    spatialFoundationsWing,
    buildingArchitectureWing,
    redstoneEngineeringWing,
    systemsAutomationWing,
    collaborativeDesignWing,
  ],
  concepts: [] as RosettaConcept[],
  calibrationModels: [] as CalibrationModel[],
  trySessions: [] as TrySession[],
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the spatial-computing department.
 *
 * No-op: CollegeLoader uses filesystem discovery via DEPARTMENT.md.
 */
export function registerSpatialComputingDepartment(): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
