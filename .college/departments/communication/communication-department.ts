/**
 * Communication Department Definition
 *
 * Defines the CollegeDepartment object for the communication department,
 * including 5 wings derived from COMM-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/communication/communication-department
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

const speakingListeningWing: DepartmentWing = {
  id: 'speaking-listening',
  name: 'Foundations of Speaking & Listening',
  description:
    'Core oral communication skills: active listening, clear speaking, turn-taking, ' +
    'and the basics of conversation. Covers articulation, volume, pace, tone, ' +
    'listening comprehension, and respectful dialogue.',
  concepts: [], // Populated in Phase 23
};

const nonverbalCommunicationWing: DepartmentWing = {
  id: 'nonverbal-communication',
  name: 'Nonverbal Communication & Presence',
  description:
    'The unspoken dimensions of communication: body language, facial expression, ' +
    'gesture, eye contact, proxemics, and vocal paralanguage. How presence and ' +
    'physicality amplify or undermine spoken messages.',
  concepts: [], // Populated in Phase 23
};

const structuredPresentationWing: DepartmentWing = {
  id: 'structured-presentation',
  name: 'Structured Presentation',
  description:
    'Planning and delivering organized spoken presentations. ' +
    'Covers speech structure, introduction and conclusion techniques, transitions, ' +
    'using visual aids, managing nerves, and adapting to different audiences and purposes.',
  concepts: [], // Populated in Phase 23
};

const discussionDebateWing: DepartmentWing = {
  id: 'discussion-debate',
  name: 'Discussion, Debate & Collaboration',
  description:
    'Engaging productively in group communication: facilitated discussion, ' +
    'structured debate, collaborative problem-solving, consensus-building, ' +
    'and the skills of respectful disagreement and persuasion.',
  concepts: [], // Populated in Phase 23
};

const communicationContextsWing: DepartmentWing = {
  id: 'communication-contexts',
  name: 'Communication Across Contexts',
  description:
    'Adapting communication to different settings, audiences, and media. ' +
    'Covers formal versus informal registers, intercultural communication, ' +
    'digital and written communication, professional contexts, and media literacy.',
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
 * The Communication department -- 5 wings from speaking/listening through contextual adaptation.
 *
 * Wings progress from foundational oral skills through sophisticated situational
 * communication, with concepts populated progressively by content Phase 23.
 */
export const communicationDepartment: CollegeDepartment = {
  id: 'communication',
  name: 'Communication',
  wings: [
    speakingListeningWing,
    nonverbalCommunicationWing,
    structuredPresentationWing,
    discussionDebateWing,
    communicationContextsWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in content phases
  calibrationModels: [] as CalibrationModel[], // Populated in Phase 27
  trySessions: [] as TrySession[], // Populated in Phase 23
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the communication department with a CollegeLoader.
 *
 * This is a no-op for the scaffold phase -- the CollegeLoader discovers
 * departments via DEPARTMENT.md on the filesystem.
 */
export function registerCommunicationDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
