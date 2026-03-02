/**
 * Psychology Department Definition
 *
 * Defines the CollegeDepartment object for the psychology department,
 * including all 5 wings derived from PSYCH-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/psychology/psychology-department
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

const brainCognitionWing: DepartmentWing = {
  id: 'brain-cognition',
  name: 'Brain, Perception & Cognition',
  description:
    'How the brain processes sensory information to construct perception, the selective ' +
    'nature of attention, memory systems and forgetting, cognitive biases that systematically ' +
    'distort reasoning, and the relationship between brain structure and behavior.',
  concepts: [], // Populated in Task 2
};

const emotionMotivationWing: DepartmentWing = {
  id: 'emotion-motivation',
  name: 'Emotion & Motivation',
  description:
    'Theories of emotional experience, strategies for emotional regulation and their ' +
    'long-term effects, motivation models from Maslow to self-determination theory, ' +
    'and the physiological and psychological dimensions of stress.',
  concepts: [], // Populated in Task 2
};

const developmentWing: DepartmentWing = {
  id: 'development',
  name: 'Human Development Across the Lifespan',
  description:
    'Cognitive and psychosocial development from prenatal through aging: Piaget\'s stages, ' +
    'Erikson\'s identity crises, Bowlby and Ainsworth\'s attachment theory, language ' +
    'acquisition, and the neurological changes of adolescence.',
  concepts: [], // Populated in Task 2
};

const socialPsychologyWing: DepartmentWing = {
  id: 'social-psychology',
  name: 'Social Psychology',
  description:
    'How situations and social context shape behavior: obedience (Milgram), conformity ' +
    '(Asch), implicit bias and stereotype threat, the bystander effect, and attribution ' +
    'errors including the fundamental attribution error.',
  concepts: [], // Populated in Task 2
};

const behaviorMentalHealthWing: DepartmentWing = {
  id: 'behavior-mental-health',
  name: 'Behavior & Mental Health',
  description:
    'Learning theory from Pavlov to Skinner, reinforcement schedules and behavior ' +
    'modification, the biopsychosocial model of psychological disorders, evidence-based ' +
    'treatment approaches, and reducing mental health stigma.',
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
 * The Psychology department -- 5 wings of psychological science.
 *
 * Wings progress from individual cognition and emotion through development,
 * social behavior, and mental health -- the science of why people do what they do.
 */
export const psychologyDepartment: CollegeDepartment = {
  id: 'psychology',
  name: 'Psychology & Human Development',
  wings: [
    brainCognitionWing,
    emotionMotivationWing,
    developmentWing,
    socialPsychologyWing,
    behaviorMentalHealthWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in Task 2
  calibrationModels: [] as CalibrationModel[], // Populated in future phases
  trySessions: [] as TrySession[], // Populated in Task 2
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the psychology department with a CollegeLoader.
 *
 * CollegeLoader auto-discovers departments via DEPARTMENT.md on the filesystem.
 * This function provides a programmatic registration hook for future loader integration.
 */
export function registerPsychologyDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
  // This function provides a programmatic registration hook for future use.
}
