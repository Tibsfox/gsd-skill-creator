/**
 * Home Economics Department Definition
 *
 * Defines the CollegeDepartment object for the home-economics department,
 * including all 5 wings, token budget configuration, and the
 * registration function for the CollegeLoader.
 *
 * @module departments/home-economics/home-economics-department
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

const kitchenCookingWing: DepartmentWing = {
  id: 'kitchen-cooking',
  name: 'Kitchen Skills & Cooking -- Feeding Yourself Well',
  description:
    'From boiling water to meal planning: kitchen safety, basic cooking techniques, ' +
    'following and adapting recipes, meal planning, food safety, cooking on a budget, ' +
    'and cultural foodways. Connects to culinary-arts department for deeper food science ' +
    'and culinary technique knowledge.',
  concepts: [],
};

const textilesClothingWing: DepartmentWing = {
  id: 'textiles-clothing',
  name: 'Textiles, Clothing & Care -- Dressed for Life',
  description:
    'Hand sewing, mending, laundry from sorting to folding, care labels, stain treatment, ' +
    'wardrobe management, and sustainable fashion awareness. The skills that keep you ' +
    'dressed well without waste, with attention to fabric types, garment construction, ' +
    'and the environmental impact of fast fashion.',
  concepts: [],
};

const homeManagementWing: DepartmentWing = {
  id: 'home-management',
  name: 'Home Management -- Creating a Functional Space',
  description:
    'Cleaning systems and routines, home maintenance basics (changing light bulbs, ' +
    'unclogging drains, patching drywall), organization principles, energy efficiency, ' +
    'and creating a living environment that supports wellbeing. Covers the Marie Kondo ' +
    'philosophy, daily/weekly/seasonal task rhythms, and basic tool use for home repair.',
  concepts: [],
};

const financialLiteracyWing: DepartmentWing = {
  id: 'financial-literacy',
  name: 'Financial Literacy -- Managing Money',
  description:
    'Personal budgeting, banking and credit basics, saving and investing principles, ' +
    'cost-per-use thinking, avoiding common financial traps, and the psychology of money. ' +
    'Covers the 50/30/20 budget framework, compound interest, the true cost of consumer debt, ' +
    'and building an emergency fund as the foundation of financial stability.',
  concepts: [],
};

const childcareCommunityWing: DepartmentWing = {
  id: 'childcare-community',
  name: 'Childcare & Community -- Caring for Others',
  description:
    'Child development basics, age-appropriate activities, safe supervision, first aid, ' +
    'and community care. Extends beyond the nuclear family to community support, elder care, ' +
    'volunteering, and the social fabric of mutual aid. The skills of caring for others ' +
    'at all life stages.',
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
 * The Home Economics department -- 5 wings of practical life skills.
 */
export const homeEconomicsDepartment: CollegeDepartment = {
  id: 'home-economics',
  name: 'Home Economics & Life Skills',
  wings: [
    kitchenCookingWing,
    textilesClothingWing,
    homeManagementWing,
    financialLiteracyWing,
    childcareCommunityWing,
  ],
  concepts: [] as RosettaConcept[],
  calibrationModels: [] as CalibrationModel[],
  trySessions: [] as TrySession[],
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the home-economics department with a CollegeLoader.
 */
export function registerHomeEconomicsDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
