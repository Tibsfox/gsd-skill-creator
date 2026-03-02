/**
 * Environmental Department Definition
 *
 * Defines the CollegeDepartment object for the environmental department,
 * including all 5 wings derived from ENVR-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/environmental/environmental-department
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

const ecosystemsBiodiversityWing: DepartmentWing = {
  id: 'ecosystems-biodiversity',
  name: 'Ecosystems & Biodiversity',
  description:
    'Understanding how living systems are organized: energy flow through food webs, ' +
    'trophic pyramids, how biodiversity provides ecosystem resilience, species interactions ' +
    '(predation, competition, symbiosis), and succession after disturbance.',
  concepts: [], // Populated in Task 2
};

const earthSystemsWing: DepartmentWing = {
  id: 'earth-systems',
  name: 'Earth Systems & Biogeochemical Cycles',
  description:
    'The interconnected Earth systems -- atmosphere, hydrosphere, lithosphere, biosphere -- ' +
    'and how matter cycles through them: the carbon, water, and nitrogen cycles that ' +
    'sustain life on Earth.',
  concepts: [], // Populated in Task 2
};

const humanImpactsWing: DepartmentWing = {
  id: 'human-impacts',
  name: 'Human Impacts on the Environment',
  description:
    'Evidence-based examination of how human activities affect Earth systems: pollution ' +
    'across media, habitat destruction and fragmentation, invasive species introduction, ' +
    'and the measured forcing effects of greenhouse gas emissions.',
  concepts: [], // Populated in Task 2
};

const climateScienceWing: DepartmentWing = {
  id: 'climate-science',
  name: 'Climate Science',
  description:
    'The physical mechanisms of climate: the greenhouse effect, radiative forcing, ' +
    'positive and negative feedback loops, converging lines of evidence for climate ' +
    'change, and the science of attribution -- linking specific events to forcing.',
  concepts: [], // Populated in Task 2
};

const sustainabilitySolutionsWing: DepartmentWing = {
  id: 'sustainability-solutions',
  name: 'Sustainability & Solutions',
  description:
    'Evidence-based approaches to environmental challenges: renewable energy systems ' +
    'and their tradeoffs, conservation strategies including protected areas and corridors, ' +
    'sustainable agriculture, and lifecycle analysis for evaluating environmental impacts.',
  concepts: [], // Populated in Task 2
};

// ─── Token Budget ───────────────────────────────────────────────────────────

const tokenBudget: TokenBudgetConfig = {
  summaryLimit: 3000,
  activeLimit: 12000,
  deepLimit: 50000,
};

// ─── Department Definition ──────────────────────────────────────────────────

/**
 * The Environmental department -- 5 wings of environmental science and sustainability.
 *
 * Wings progress from ecosystem fundamentals through Earth systems, human impacts,
 * climate science, and evidence-based sustainability solutions.
 */
export const environmentalDepartment: CollegeDepartment = {
  id: 'environmental',
  name: 'Environmental Science & Sustainability',
  wings: [
    ecosystemsBiodiversityWing,
    earthSystemsWing,
    humanImpactsWing,
    climateScienceWing,
    sustainabilitySolutionsWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in Task 2
  calibrationModels: [] as CalibrationModel[], // Populated in future phases
  trySessions: [] as TrySession[], // Populated in Task 2
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the environmental department with a CollegeLoader.
 *
 * CollegeLoader auto-discovers departments via DEPARTMENT.md on the filesystem.
 * This function provides a programmatic registration hook for future loader integration.
 */
export function registerEnvironmentalDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
  // This function provides a programmatic registration hook for future use.
}
