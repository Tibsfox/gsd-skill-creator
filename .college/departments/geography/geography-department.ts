/**
 * Geography Department Definition
 *
 * Defines the CollegeDepartment object for the geography department,
 * including 5 wings derived from GEO-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/geography/geography-department
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

const earthSystemsWing: DepartmentWing = {
  id: 'earth-systems',
  name: 'Earth Systems & Physical Geography',
  description:
    'The physical systems that shape Earth\'s surface and environments. ' +
    'Covers plate tectonics, landforms, hydrosphere, biomes, soils, ' +
    'and the interactions among lithosphere, hydrosphere, atmosphere, and biosphere.',
  concepts: [], // Populated in Phase 23
};

const humanGeographyWing: DepartmentWing = {
  id: 'human-geography',
  name: 'Human Geography & Cultural Landscapes',
  description:
    'How human populations, cultures, economies, and activities shape and are ' +
    'shaped by Earth\'s surface. Covers population dynamics, migration, cultural ' +
    'diffusion, urbanization, economic geography, and geopolitics.',
  concepts: [], // Populated in Phase 23
};

const mapsSpatialGisWing: DepartmentWing = {
  id: 'maps-spatial-gis',
  name: 'Maps, Spatial Analysis & GIS',
  description:
    'Reading, making, and analyzing maps and spatial data. ' +
    'Covers map projections, scale, coordinates (latitude/longitude), ' +
    'thematic mapping, remote sensing, and Geographic Information Systems (GIS).',
  concepts: [], // Populated in Phase 23
};

const astronomyWing: DepartmentWing = {
  id: 'astronomy',
  name: 'Astronomy & Our Place in Space',
  description:
    'Earth\'s position in the solar system and beyond. ' +
    'Covers the solar system, seasons and tides, lunar cycles, stellar evolution, ' +
    'galaxies, and humanity\'s exploration of space.',
  concepts: [], // Populated in Phase 23
};

const climateWeatherWing: DepartmentWing = {
  id: 'climate-weather',
  name: 'Climate, Weather & Environmental Change',
  description:
    'The atmosphere, weather patterns, and long-term climate dynamics. ' +
    'Covers weather systems, atmospheric circulation, ocean currents, ' +
    'climate zones, climate change science, and environmental impacts.',
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
 * The Geography department -- 5 wings from Earth systems through climate change.
 *
 * Wings span physical geography, human geography, spatial analysis, astronomy,
 * and climate science, with concepts populated by content Phase 23.
 */
export const geographyDepartment: CollegeDepartment = {
  id: 'geography',
  name: 'Geography',
  wings: [
    earthSystemsWing,
    humanGeographyWing,
    mapsSpatialGisWing,
    astronomyWing,
    climateWeatherWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in content phases
  calibrationModels: [] as CalibrationModel[], // Populated in Phase 27
  trySessions: [] as TrySession[], // Populated in Phase 23
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the geography department with a CollegeLoader.
 *
 * This is a no-op for the scaffold phase -- the CollegeLoader discovers
 * departments via DEPARTMENT.md on the filesystem.
 */
export function registerGeographyDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
