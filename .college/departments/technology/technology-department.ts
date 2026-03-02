/**
 * Technology Department Definition
 *
 * Defines the CollegeDepartment object for the technology department,
 * including 5 wings derived from TECH-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/technology/technology-department
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

const toolsSimpleMachinesWing: DepartmentWing = {
  id: 'tools-simple-machines',
  name: 'Tools & Simple Machines',
  description:
    'How humans extend their physical capabilities through tools and machines. ' +
    'Covers hand tools and power tools, the six simple machines, mechanical ' +
    'advantage, and the historical development of tool use.',
  concepts: [], // Populated in Phase 23
};

const systemsProcessesWing: DepartmentWing = {
  id: 'systems-processes',
  name: 'Systems & Processes',
  description:
    'Understanding technological systems as collections of interacting parts. ' +
    'Covers system components (inputs, processes, outputs, feedback), ' +
    'system modeling, process flow, and the concept of optimization in systems.',
  concepts: [], // Populated in Phase 23
};

const designEngineeringWing: DepartmentWing = {
  id: 'design-engineering',
  name: 'Design & Engineering Process',
  description:
    'The technology-specific design cycle for creating solutions. ' +
    'Covers needs assessment, design brief, concept development, modeling, ' +
    'prototype building, testing, and the interplay between design constraints and criteria.',
  concepts: [], // Populated in Phase 23
};

const digitalFoundationsWing: DepartmentWing = {
  id: 'digital-foundations',
  name: 'Digital Technology Foundations',
  description:
    'The principles underlying modern digital technology. ' +
    'Covers binary and data representation, how computers work (CPU, memory, storage), ' +
    'networking basics (internet, protocols), software concepts, and information security fundamentals.',
  concepts: [], // Populated in Phase 23
};

const technologySocietyWing: DepartmentWing = {
  id: 'technology-society',
  name: 'Technology & Society',
  description:
    'The relationship between technological change and human culture, economy, and ethics. ' +
    'Covers the history of transformative technologies, technology adoption and resistance, ' +
    'digital rights and privacy, environmental impacts, and responsible innovation.',
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
 * The Technology department -- 5 wings from tools through technology and society.
 *
 * Wings span the full arc of technological literacy from physical tools through
 * digital systems, design process, and societal impact.
 */
export const technologyDepartment: CollegeDepartment = {
  id: 'technology',
  name: 'Technology',
  wings: [
    toolsSimpleMachinesWing,
    systemsProcessesWing,
    designEngineeringWing,
    digitalFoundationsWing,
    technologySocietyWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in content phases
  calibrationModels: [] as CalibrationModel[], // Populated in Phase 27
  trySessions: [] as TrySession[], // Populated in Phase 23
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the technology department with a CollegeLoader.
 *
 * This is a no-op for the scaffold phase -- the CollegeLoader discovers
 * departments via DEPARTMENT.md on the filesystem.
 */
export function registerTechnologyDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
