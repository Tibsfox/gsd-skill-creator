/**
 * Nutrition Department Definition
 *
 * Defines the CollegeDepartment object for the nutrition department,
 * including all 5 wings derived from NUTR-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * Distinct from the culinary-arts nutrition wing: this department covers
 * nutritional science comprehensively (digestion, food systems, critical
 * literacy). Cross-references to culinary-arts established in Phase 25.
 *
 * @module departments/nutrition/nutrition-department
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

const nutrientsFunctionsWing: DepartmentWing = {
  id: 'nutrients-functions',
  name: 'Nutrients & Their Functions',
  description:
    'Macronutrients (proteins, carbohydrates, fats) and micronutrients (vitamins, minerals) ' +
    'and their essential roles in the body. Water and electrolytes, nutrient interactions, ' +
    'reading nutrition labels, and understanding that different foods have different nutrient profiles.',
  concepts: [], // Populated in Task 2
};

const digestionBodySystemsWing: DepartmentWing = {
  id: 'digestion-body-systems',
  name: 'Digestion & Body Systems',
  description:
    'Digestive system anatomy from mouth to large intestine, mechanical and chemical ' +
    'digestion of each macronutrient, nutrient absorption mechanisms, the gut microbiome ' +
    'and its role in health, and how cells extract energy through metabolic pathways.',
  concepts: [], // Populated in Task 2
};

const foodSourcesSystemsWing: DepartmentWing = {
  id: 'food-sources-systems',
  name: 'Food Sources & Systems',
  description:
    'Where food comes from: whole foods vs. processed foods and their nutrient density, ' +
    'how food processing affects nutrients, the full farm-to-fork food system, and the ' +
    'equity dimensions of food access and food insecurity.',
  concepts: [], // Populated in Task 2
};

const nutritionalLiteracyWing: DepartmentWing = {
  id: 'nutritional-literacy',
  name: 'Nutritional Literacy',
  description:
    'Evaluating nutritional claims critically: study design hierarchy, correlation vs. ' +
    'causation, the limitations of single studies, diet culture vs. evidence-based ' +
    'frameworks, food marketing tactics, and what dietary guidelines actually support.',
  concepts: [], // Populated in Task 2
};

const healthIntegrationWing: DepartmentWing = {
  id: 'health-integration',
  name: 'Health Integration',
  description:
    'Applying nutritional science to health outcomes: changing nutrient needs across the ' +
    'lifespan, sports nutrition for performance, diet-disease relationships in chronic ' +
    'conditions, and the evidence base for therapeutic dietary approaches.',
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
 * The Nutrition department -- 5 wings of nutritional science and food literacy.
 *
 * Wings progress from fundamental nutrients through digestion, food systems,
 * critical literacy, and health integration -- evidence-based nutrition without
 * diet culture messaging.
 */
export const nutritionDepartment: CollegeDepartment = {
  id: 'nutrition',
  name: 'Nutrition & Health Sciences',
  wings: [
    nutrientsFunctionsWing,
    digestionBodySystemsWing,
    foodSourcesSystemsWing,
    nutritionalLiteracyWing,
    healthIntegrationWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in Task 2
  calibrationModels: [] as CalibrationModel[], // Populated in future phases
  trySessions: [] as TrySession[], // Populated in Task 2
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the nutrition department with a CollegeLoader.
 *
 * CollegeLoader auto-discovers departments via DEPARTMENT.md on the filesystem.
 * This function provides a programmatic registration hook for future loader integration.
 */
export function registerNutritionDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
  // This function provides a programmatic registration hook for future use.
}
