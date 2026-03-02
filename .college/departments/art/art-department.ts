/**
 * Art Department Definition
 *
 * Defines the CollegeDepartment object for the art department,
 * including all 5 wings, token budget configuration, and the
 * registration function for the CollegeLoader.
 *
 * @module departments/art/art-department
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

const seeingDrawingWing: DepartmentWing = {
  id: 'seeing-drawing',
  name: 'Seeing & Drawing -- The Trained Eye',
  description:
    'Learning to observe carefully and develop foundational drawing skills. ' +
    'Observation drawing trains the eye and hand to work together, builds ' +
    'confidence, and reveals that drawing is a learnable skill, not innate talent. ' +
    'Covers contour drawing, gesture drawing, proportion, shading, and spatial reasoning.',
  concepts: [],
};

const colorCompositionWing: DepartmentWing = {
  id: 'color-composition',
  name: 'Color, Value & Composition -- The Orchestrated Image',
  description:
    'Understanding how color, light/dark contrast, and compositional strategies ' +
    'guide the viewer\'s eye and convey emotion. Students learn color theory, ' +
    'value relationships, and arrangement of elements to create visual impact. ' +
    'Covers hue, saturation, temperature, balance, emphasis, and movement.',
  concepts: [],
};

const materialsMakingWing: DepartmentWing = {
  id: 'materials-making',
  name: 'Materials & Making -- The Creative Workshop',
  description:
    'Exploring diverse media and techniques: drawing, painting, sculpture, ' +
    'printmaking, mixed media, and digital art. Students discover that art is ' +
    'broader than they thought and find media that resonate with their interests. ' +
    'Covers pencil, charcoal, watercolor, acrylic, clay, printmaking, and collage.',
  concepts: [],
};

const artInContextWing: DepartmentWing = {
  id: 'art-in-context',
  name: 'Art in Context -- History and Culture',
  description:
    'Understanding art as a response to history, culture, and human experience. ' +
    'Students study artworks as primary sources, learn about diverse cultural ' +
    'traditions, and recognize art as a form of social commentary. Covers ' +
    'art movements, cultural traditions from African to Asian to Indigenous, ' +
    'artists\' biographies, and art as activism.',
  concepts: [],
};

const creativeProcessWing: DepartmentWing = {
  id: 'creative-process',
  name: 'Creative Process & Portfolio -- The Artist\'s Practice',
  description:
    'Developing the habits and practices of artists: brainstorming, iteration, ' +
    'critique, revision, and reflection. Students create a portfolio -- a curated ' +
    'collection of work -- that represents their artistic growth. Covers ideation, ' +
    'sketchbooks, critique circles, self-assessment, artist statements, and curation.',
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
 * The Art department -- 5 wings of visual arts education.
 *
 * Wings span from foundational observation skills (seeing-drawing) to
 * professional portfolio practice (creative-process), with concepts
 * populated progressively by content phases.
 */
export const artDepartment: CollegeDepartment = {
  id: 'art',
  name: 'Visual Arts',
  wings: [
    seeingDrawingWing,
    colorCompositionWing,
    materialsMakingWing,
    artInContextWing,
    creativeProcessWing,
  ],
  concepts: [] as RosettaConcept[],
  calibrationModels: [] as CalibrationModel[],
  trySessions: [] as TrySession[],
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the art department with a CollegeLoader.
 *
 * The CollegeLoader auto-discovers departments via DEPARTMENT.md on the
 * filesystem. This function provides a programmatic registration hook.
 */
export function registerArtDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
  // This function provides a programmatic registration hook for future use.
}
