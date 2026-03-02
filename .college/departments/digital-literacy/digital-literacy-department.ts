/**
 * Digital Literacy Department Definition
 *
 * Defines the CollegeDepartment object for the digital-literacy department,
 * including all 5 wings derived from DIGLIT-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/digital-literacy/digital-literacy-department
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

const digitalFoundationsWing: DepartmentWing = {
  id: 'digital-foundations',
  name: 'Digital Foundations',
  description:
    'Understanding how digital systems work: hardware components and their functions, ' +
    'operating systems, networks and internet connectivity, digital information ' +
    'representation, and troubleshooting basics.',
  concepts: [], // Populated in Task 2
};

const informationLiteracyWing: DepartmentWing = {
  id: 'information-literacy',
  name: 'Information Literacy & Research',
  description:
    'Finding reliable information using strategic search techniques, evaluating source ' +
    'credibility using multiple criteria, applying fact-checking techniques, recognizing ' +
    'misinformation tactics, and synthesizing information from multiple sources.',
  concepts: [], // Populated in Task 2
};

const digitalCommunicationWing: DepartmentWing = {
  id: 'digital-communication',
  name: 'Digital Communication & Creation',
  description:
    'Composing clear professional digital communication, collaborating using shared ' +
    'documents, creating digital content with attention to audience, understanding ' +
    'copyright principles, and practicing citation and attribution.',
  concepts: [], // Populated in Task 2
};

const onlineSafetyWing: DepartmentWing = {
  id: 'online-safety',
  name: 'Online Safety & Digital Citizenship',
  description:
    'Creating secure passwords with multi-factor authentication, managing privacy settings, ' +
    'recognizing and responding to cyberbullying, understanding digital footprint permanence, ' +
    'and recognizing online scams and phishing attacks.',
  concepts: [], // Populated in Task 2
};

const algorithmicAwarenessWing: DepartmentWing = {
  id: 'algorithmic-awareness',
  name: 'Data, Algorithms & AI Awareness',
  description:
    'Understanding what personal data is collected and how it is used, explaining how ' +
    'algorithms make decisions and personalize content, understanding AI capabilities and ' +
    'limitations, and recognizing how algorithmic bias causes unfair outcomes.',
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
 * The Digital Literacy department -- 5 wings of critical digital thinking.
 *
 * Wings progress from infrastructure understanding (digital foundations) through
 * algorithmic awareness, building competency for a data-saturated world.
 */
export const digitalLiteracyDepartment: CollegeDepartment = {
  id: 'digital-literacy',
  name: 'Digital Literacy & Information Science',
  wings: [
    digitalFoundationsWing,
    informationLiteracyWing,
    digitalCommunicationWing,
    onlineSafetyWing,
    algorithmicAwarenessWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in Task 2
  calibrationModels: [] as CalibrationModel[], // Populated in future phases
  trySessions: [] as TrySession[], // Populated in Task 2
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the digital literacy department with a CollegeLoader.
 *
 * CollegeLoader auto-discovers departments via DEPARTMENT.md on the filesystem.
 * This function provides a programmatic registration hook for future loader integration.
 */
export function registerDigitalLiteracyDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
  // This function provides a programmatic registration hook for future use.
}
