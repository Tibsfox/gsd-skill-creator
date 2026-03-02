/**
 * Physical Education Department Definition
 *
 * Defines the CollegeDepartment object for the physical-education department,
 * including all 5 wings, token budget configuration, and the
 * registration function for the CollegeLoader.
 *
 * @module departments/physical-education/physical-education-department
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

const movementFoundationsWing: DepartmentWing = {
  id: 'movement-foundations',
  name: 'Movement Foundations -- The Building Blocks',
  description:
    'Fundamental motor skills -- locomotor, non-locomotor, and manipulative -- plus ' +
    'spatial awareness, body awareness, and movement concepts that form the building ' +
    'blocks of all physical activity. Covers running, jumping, throwing, catching, ' +
    'balance, coordination, and spatial relationships.',
  concepts: [],
};

const fitnessBodyScienceWing: DepartmentWing = {
  id: 'fitness-body-science',
  name: 'Fitness & Body Science -- Understanding the Machine',
  description:
    'Understanding how muscles, heart, and lungs work during exercise, the components ' +
    'of health-related fitness, training principles, and the FITT framework. Covers ' +
    'cardiovascular fitness, muscular strength and endurance, flexibility, body composition, ' +
    'warm-up and cool-down science, and the physiological basis of training adaptation.',
  concepts: [],
};

const sportsGamesWing: DepartmentWing = {
  id: 'sports-games',
  name: 'Sports & Games -- Teamwork in Motion',
  description:
    'Applying movement skills in structured games and sports contexts: individual sports ' +
    '(swimming, tennis, track), team sports (basketball, soccer, volleyball), and ' +
    'cooperative games. Covers rules, strategies, positioning, sportsmanship, and the ' +
    'transferable movement competencies that cross sport boundaries.',
  concepts: [],
};

const wellnessLifetimeFitnessWing: DepartmentWing = {
  id: 'wellness-lifetime-fitness',
  name: 'Wellness & Lifetime Fitness -- The Long Game',
  description:
    'Building habits, attitudes, and self-knowledge that support lifelong physical ' +
    'activity. Covers personal fitness goal setting, stress management through movement, ' +
    'sleep and recovery, nutrition basics, injury prevention, and the psychological ' +
    'benefits of regular physical activity.',
  concepts: [],
};

const outdoorAdventureWing: DepartmentWing = {
  id: 'outdoor-adventure',
  name: 'Outdoor & Adventure -- Movement in Nature',
  description:
    'Physical education beyond the gymnasium: hiking, climbing, swimming, cycling, ' +
    'orienteering, and outdoor leadership. Covers Leave No Trace principles, navigation, ' +
    'risk assessment, outdoor safety, and the unique physical and psychological benefits ' +
    'of movement in natural environments.',
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
 * The Physical Education department -- 5 wings of physical education and movement.
 */
export const physicalEducationDepartment: CollegeDepartment = {
  id: 'physical-education',
  name: 'Physical Education & Movement',
  wings: [
    movementFoundationsWing,
    fitnessBodyScienceWing,
    sportsGamesWing,
    wellnessLifetimeFitnessWing,
    outdoorAdventureWing,
  ],
  concepts: [] as RosettaConcept[],
  calibrationModels: [] as CalibrationModel[],
  trySessions: [] as TrySession[],
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the physical-education department with a CollegeLoader.
 */
export function registerPhysicalEducationDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
