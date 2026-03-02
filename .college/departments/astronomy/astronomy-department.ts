/**
 * Astronomy Department Definition
 *
 * Defines the CollegeDepartment object for the astronomy department,
 * including all 5 wings, token budget configuration, and the
 * registration function for the CollegeLoader.
 *
 * @module departments/astronomy/astronomy-department
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

const observingSkyWing: DepartmentWing = {
  id: 'observing-sky',
  name: 'Observing the Sky -- The Naked-Eye Universe',
  description:
    'Learning to find constellations, navigate by stars, track celestial objects, and ' +
    'understand how the night sky changes throughout the year. Covers celestial coordinates, ' +
    'the planisphere, stellar magnitude, planet identification, and the techniques of ' +
    'systematic sky observation.',
  concepts: [],
};

const earthMoonSunWing: DepartmentWing = {
  id: 'earth-moon-sun',
  name: 'Earth-Moon-Sun System -- The Geometry of Space',
  description:
    'The geometry of nearby space: how Earth\'s rotation creates day and night, revolution ' +
    'creates seasons, why the Moon has phases, and how eclipses and tides work. Covers ' +
    'orbital mechanics, gravitational interactions, tidal locking, and the three-body problem.',
  concepts: [],
};

const stellarPhysicsWing: DepartmentWing = {
  id: 'stellar-physics',
  name: 'Stellar Physics -- The Lives of Stars',
  description:
    'How stars form, shine, and die: the Hertzsprung-Russell diagram, stellar classification, ' +
    'nuclear fusion, stellar evolution from main sequence to red giant to white dwarf or ' +
    'neutron star or black hole. Covers spectroscopy, the cosmic distance ladder, binary ' +
    'star systems, and stellar nucleosynthesis.',
  concepts: [],
};

const solarSystemWing: DepartmentWing = {
  id: 'solar-system',
  name: 'Solar System -- Our Cosmic Neighborhood',
  description:
    'The structure and history of our solar system: planetary science, the asteroid belt, ' +
    'comets and Kuiper Belt objects, planetary atmospheres, and the search for habitable ' +
    'worlds. Covers Kepler\'s laws, comparative planetology, space exploration milestones, ' +
    'and the formation of the solar system from a protostellar disk.',
  concepts: [],
};

const cosmologyWing: DepartmentWing = {
  id: 'cosmology',
  name: 'Cosmology -- The Origin and Fate of the Universe',
  description:
    'The large-scale structure and history of the universe: the Big Bang, cosmic microwave ' +
    'background, dark matter and dark energy, galaxy formation, and the ultimate fate of the ' +
    'universe. Covers Hubble\'s law, the expanding universe, inflation theory, and the ' +
    'deepest questions in modern physics.',
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
 * The Astronomy department -- 5 wings of astronomy and cosmology.
 */
export const astronomyDepartment: CollegeDepartment = {
  id: 'astronomy',
  name: 'Astronomy & Cosmology',
  wings: [
    observingSkyWing,
    earthMoonSunWing,
    stellarPhysicsWing,
    solarSystemWing,
    cosmologyWing,
  ],
  concepts: [] as RosettaConcept[],
  calibrationModels: [] as CalibrationModel[],
  trySessions: [] as TrySession[],
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the astronomy department with a CollegeLoader.
 */
export function registerAstronomyDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
