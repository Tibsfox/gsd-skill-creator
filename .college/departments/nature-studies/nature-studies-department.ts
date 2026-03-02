/**
 * Nature Studies Department Definition
 *
 * Defines the CollegeDepartment object for the nature-studies department,
 * including all 5 wings, token budget configuration, and the
 * registration function for the CollegeLoader.
 *
 * @module departments/nature-studies/nature-studies-department
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

const outdoorObservationWing: DepartmentWing = {
  id: 'outdoor-observation',
  name: 'Outdoor Observation -- The Naturalist\'s Eye',
  description:
    'Field skills, nature journaling, using all senses systematically, weather awareness, ' +
    'and the discipline of patient outdoor observation. Covers the sit spot practice, ' +
    'seasonal phenology, orientation, and the transition from looking to truly seeing the ' +
    'natural world around us.',
  concepts: [],
};

const plantsFungiWing: DepartmentWing = {
  id: 'plants-fungi',
  name: 'Plants & Fungi -- The Green World',
  description:
    'Identification of trees, wildflowers, grasses, and fungi; understanding life cycles, ' +
    'seasonal changes, seed dispersal, and the ecological roles of the plant kingdom and ' +
    'fungal networks. Covers leaf identification keys, bark patterns, flower structure, ' +
    'mycorrhizal relationships, and forest succession.',
  concepts: [],
};

const animalsBirdsWing: DepartmentWing = {
  id: 'animals-birds',
  name: 'Animals & Birds -- Tracking and Identification',
  description:
    'Identification of birds by sight and sound, mammal tracking, reptile and amphibian ' +
    'ecology, and insect natural history. Covers birding by ear, track identification, ' +
    'behavioral ecology, migration patterns, and the art of reading animal signs in the landscape.',
  concepts: [],
};

const ecologyHabitatsWing: DepartmentWing = {
  id: 'ecology-habitats',
  name: 'Ecology & Habitats -- Webs of Life',
  description:
    'Understanding how species interact within ecosystems: food webs, energy flow, ' +
    'nutrient cycling, succession, and the ecology of specific habitat types (forest, ' +
    'wetland, grassland, coast). Covers keystone species, trophic cascades, invasive ' +
    'species dynamics, and habitat restoration principles.',
  concepts: [],
};

const citizenScienceWing: DepartmentWing = {
  id: 'citizen-science',
  name: 'Citizen Science -- Contributing to Knowledge',
  description:
    'Using naturalist skills to contribute to scientific databases and conservation projects. ' +
    'Covers iNaturalist, eBird, community phenology monitoring, water quality testing, ' +
    'and the ethics and methods of responsible citizen science. Students become ' +
    'contributors to real research, not just consumers of knowledge.',
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
 * The Nature Studies department -- 5 wings of naturalist education.
 */
export const natureStudiesDepartment: CollegeDepartment = {
  id: 'nature-studies',
  name: 'Nature Studies & Naturalism',
  wings: [
    outdoorObservationWing,
    plantsFungiWing,
    animalsBirdsWing,
    ecologyHabitatsWing,
    citizenScienceWing,
  ],
  concepts: [] as RosettaConcept[],
  calibrationModels: [] as CalibrationModel[],
  trySessions: [] as TrySession[],
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the nature-studies department with a CollegeLoader.
 */
export function registerNatureStudiesDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
