/**
 * Physics Department Definition
 *
 * Defines the CollegeDepartment object for the physics department,
 * including 5 wings derived from PHYS-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/physics/physics-department
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

const motionForcesWing: DepartmentWing = {
  id: 'motion-forces',
  name: 'Motion & Forces',
  description:
    'Describing and predicting how objects move and what causes changes in motion. ' +
    'Covers kinematics (position, velocity, acceleration), Newton\'s three laws, ' +
    'projectile motion, circular motion, and universal gravitation.',
  concepts: [], // Populated in Phase 23
};

const energyWorkWing: DepartmentWing = {
  id: 'energy-work',
  name: 'Energy & Work',
  description:
    'Understanding energy as the capacity to do work and how it transforms between forms. ' +
    'Covers kinetic and potential energy, work and power, conservation of energy, ' +
    'mechanical advantage, thermodynamics, and heat transfer.',
  concepts: [], // Populated in Phase 23
};

const wavesSoundLightWing: DepartmentWing = {
  id: 'waves-sound-light',
  name: 'Waves, Sound & Light',
  description:
    'The physics of oscillations, waves, and the electromagnetic spectrum. ' +
    'Covers wave properties (frequency, amplitude, wavelength), sound production ' +
    'and propagation, the speed of light, reflection, refraction, and optics.',
  concepts: [], // Populated in Phase 23
};

const electricityMagnetismWing: DepartmentWing = {
  id: 'electricity-magnetism',
  name: 'Electricity & Magnetism',
  description:
    'Charge, fields, circuits, and the unification of electricity and magnetism. ' +
    'Covers electric charge and force, current, voltage and resistance (Ohm\'s law), ' +
    'circuits, magnetic fields, electromagnetic induction, and motors.',
  concepts: [], // Populated in Phase 23
};

const modernPhysicsWing: DepartmentWing = {
  id: 'modern-physics',
  name: 'Modern Physics & Cosmology',
  description:
    'The physics of the very fast, very small, and very large. ' +
    'Covers special relativity, quantum mechanics basics, atomic structure, ' +
    'nuclear physics, the Big Bang, and the structure of the universe.',
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
 * The Physics department -- 5 wings from classical mechanics to modern physics.
 *
 * Wings progress from observable motion through electromagnetic theory and into
 * the frontiers of modern physics, with concepts populated by content Phase 23.
 */
export const physicsDepartment: CollegeDepartment = {
  id: 'physics',
  name: 'Physics',
  wings: [
    motionForcesWing,
    energyWorkWing,
    wavesSoundLightWing,
    electricityMagnetismWing,
    modernPhysicsWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in content phases
  calibrationModels: [] as CalibrationModel[], // Populated in Phase 27
  trySessions: [] as TrySession[], // Populated in Phase 23
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the physics department with a CollegeLoader.
 *
 * This is a no-op for the scaffold phase -- the CollegeLoader discovers
 * departments via DEPARTMENT.md on the filesystem.
 */
export function registerPhysicsDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
