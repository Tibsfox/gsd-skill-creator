/**
 * Learning Department Definition
 *
 * Defines the CollegeDepartment object for the learning department,
 * including all 5 wings, token budget configuration, and the
 * registration function for the CollegeLoader.
 *
 * @module departments/learning/learning-department
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

const learningBrainWing: DepartmentWing = {
  id: 'learning-brain',
  name: 'Your Learning Brain -- Neuroscience of Learning',
  description:
    'How memory works, attention, sleep and learning, and brain myths debunked. ' +
    'Understanding the biological foundations of learning: encoding, storage, retrieval, ' +
    'working memory limits, the forgetting curve, sleep consolidation, and what ' +
    'neuroscience actually says versus popular misconceptions like learning styles.',
  concepts: [],
};

const studyStrategiesWing: DepartmentWing = {
  id: 'study-strategies',
  name: 'Study Strategies That Work -- Evidence-Based Learning',
  description:
    'Retrieval practice, spaced repetition, interleaving, elaboration, and concept mapping. ' +
    'Evidence-based strategies that build lasting knowledge, contrasted with common but ' +
    'ineffective approaches like re-reading, highlighting, and massed practice. ' +
    'The science of why some strategies feel hard but work better.',
  concepts: [],
};

const mindsetMotivationWing: DepartmentWing = {
  id: 'mindset-motivation',
  name: 'Mindset & Motivation -- The Psychology of Learning',
  description:
    'Growth versus fixed mindset, intrinsic and extrinsic motivation, procrastination, ' +
    'fear of failure, and building resilience as a learner. Covers Dweck\'s mindset research, ' +
    'self-determination theory, implementation intentions, and the psychology of ' +
    'staying motivated when learning is difficult.',
  concepts: [],
};

const metacognitionWing: DepartmentWing = {
  id: 'metacognition',
  name: 'Metacognition -- Thinking About Thinking',
  description:
    'The ability to monitor and regulate your own thinking and learning processes. ' +
    'Covers calibration (knowing what you know and don\'t know), self-explanation, ' +
    'error analysis, planning and monitoring strategies, and the Dunning-Kruger effect. ' +
    'Expert learners are metacognitive -- they know when they understand and when they don\'t.',
  concepts: [],
};

const learningEnvironmentsWing: DepartmentWing = {
  id: 'learning-environments',
  name: 'Learning Environments -- Setting Up for Success',
  description:
    'Creating physical and temporal environments that support focused learning: managing ' +
    'distractions, the Pomodoro technique, environmental design, reading and note-taking ' +
    'systems, and learning in digital versus physical contexts. How context shapes cognition ' +
    'and what research says about multitasking, music while studying, and optimal study duration.',
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
 * The Learning department -- 5 wings of learning science and metacognition.
 */
export const learningDepartment: CollegeDepartment = {
  id: 'learning',
  name: 'Learning to Learn',
  wings: [
    learningBrainWing,
    studyStrategiesWing,
    mindsetMotivationWing,
    metacognitionWing,
    learningEnvironmentsWing,
  ],
  concepts: [] as RosettaConcept[],
  calibrationModels: [] as CalibrationModel[],
  trySessions: [] as TrySession[],
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the learning department with a CollegeLoader.
 */
export function registerLearningDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
