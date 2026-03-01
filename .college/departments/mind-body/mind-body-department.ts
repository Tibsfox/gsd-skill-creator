/**
 * Mind-Body Department Definition
 *
 * Defines the CollegeDepartment object for the mind-body department,
 * including all 8 wings (stubs for content phases 12-15), token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/mind-body/mind-body-department
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

const breathWing: DepartmentWing = {
  id: 'breath',
  name: 'Breath -- The Universal Foundation',
  description:
    'Breathing techniques spanning diaphragmatic breathing, box breathing, ujjayi, ' +
    'counting methods, and martial breath control. The foundation shared by every ' +
    'discipline in the department.',
  concepts: [], // Populated in Phase 12
};

const meditationWing: DepartmentWing = {
  id: 'meditation',
  name: 'Stillness -- Meditation and Mindfulness',
  description:
    'Mindfulness, concentration, zazen, body scan, walking meditation, and metta ' +
    '(loving-kindness). Practices for training attention and awareness.',
  concepts: [], // Populated in Phase 12
};

const yogaWing: DepartmentWing = {
  id: 'yoga',
  name: 'Flow -- Yoga',
  description:
    'Poses (asanas), sequences (vinyasa), breath-movement linking (pranayama), ' +
    'and styles from Hatha to Ashtanga. Rooted in the Vedic tradition.',
  concepts: [], // Populated in Phase 13
};

const pilatesWing: DepartmentWing = {
  id: 'pilates',
  name: 'Strength -- Pilates',
  description:
    'Powerhouse activation, the six principles, mat work progressions, ' +
    'alignment cueing, and rehabilitation applications. Joseph Pilates\' method.',
  concepts: [], // Populated in Phase 13
};

const martialArtsWing: DepartmentWing = {
  id: 'martial-arts',
  name: 'The Fighting Arts -- Martial Arts',
  description:
    'History, stances, strikes, forms, and style overviews spanning Kung Fu, ' +
    'Karate, Judo, Taekwondo, and more. The warrior arts of many cultures.',
  concepts: [], // Populated in Phase 14
};

const taiChiWing: DepartmentWing = {
  id: 'tai-chi',
  name: 'Moving Meditation -- Tai Chi and Qigong',
  description:
    'Tai chi principles, qigong energy cultivation, Beijing 24 form, and ' +
    'push hands concepts. Where martial arts meets meditation.',
  concepts: [], // Populated in Phase 14
};

const relaxationWing: DepartmentWing = {
  id: 'relaxation',
  name: 'Release -- Relaxation and Recovery',
  description:
    'Progressive muscle relaxation, yoga nidra, myofascial release, stretching, ' +
    'sleep hygiene, and nervous system regulation. The art of letting go.',
  concepts: [], // Populated in Phase 15
};

const philosophyWing: DepartmentWing = {
  id: 'philosophy',
  name: 'The Zen of Practice -- Philosophy and Integration',
  description:
    'Zen philosophy, Taoism, Yoga Sutras, Bushido/wude, mindfulness in daily life, ' +
    'and shoshin (beginner\'s mind). The philosophical ground beneath the practice.',
  concepts: [], // Populated in Phase 15
};

// ─── Token Budget ───────────────────────────────────────────────────────────

const tokenBudget: TokenBudgetConfig = {
  summaryLimit: 3000,
  activeLimit: 12000,
  deepLimit: 50000,
};

// ─── Department Definition ──────────────────────────────────────────────────

/**
 * The Mind-Body department -- 8 wings of mind-body practice.
 *
 * Wings are ordered from foundational (breath) to integrative (philosophy),
 * with concepts populated progressively by content phases 12-15.
 */
export const mindBodyDepartment: CollegeDepartment = {
  id: 'mind-body',
  name: 'Mind-Body Arts',
  wings: [
    breathWing,
    meditationWing,
    yogaWing,
    pilatesWing,
    martialArtsWing,
    taiChiWing,
    relaxationWing,
    philosophyWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in content phases
  calibrationModels: [] as CalibrationModel[], // Populated in Phase 19
  trySessions: [] as TrySession[], // Populated in Phase 16
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the mind-body department with a CollegeLoader.
 *
 * This is a no-op for the scaffold phase -- the CollegeLoader discovers
 * departments via DEPARTMENT.md on the filesystem. This function exists
 * for programmatic registration patterns and future loader integration.
 */
export function registerMindBodyDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
  // This function provides a programmatic registration hook for future use.
  // The department definition above is the canonical source of truth.
}
