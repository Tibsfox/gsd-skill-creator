/**
 * Languages Department Definition
 *
 * Defines the CollegeDepartment object for the languages department,
 * including all 5 wings derived from LANG-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/languages/languages-department
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

const soundSystemsWing: DepartmentWing = {
  id: 'sound-systems',
  name: 'Sound Systems & Phonetics',
  description:
    'How languages use sound to make meaning: phoneme inventories, the International ' +
    'Phonetic Alphabet, ear training for non-native sounds, pronunciation accuracy, ' +
    'and suprasegmental features like tone, stress, and intonation.',
  concepts: [], // Populated in Task 2
};

const grammarPatternsWing: DepartmentWing = {
  id: 'grammar-patterns',
  name: 'Grammar Patterns & Sentence Structure',
  description:
    'Understanding grammar as systematic pattern, not arbitrary rules: word order ' +
    'typology across languages, morphology and agreement systems, syntactic structures, ' +
    'and recognizing patterns across language families.',
  concepts: [], // Populated in Task 2
};

const vocabularyReadingWing: DepartmentWing = {
  id: 'vocabulary-reading',
  name: 'Vocabulary & Reading Comprehension',
  description:
    'Efficient vocabulary acquisition using high-frequency word lists and spaced repetition, ' +
    'recognizing cognates and word families across languages, and progressing from ' +
    'controlled readers to authentic texts in the target language.',
  concepts: [], // Populated in Task 2
};

const speakingListeningWing: DepartmentWing = {
  id: 'speaking-listening',
  name: 'Speaking & Listening',
  description:
    'Developing listening comprehension for natural speech, using conversation strategies ' +
    'for turn-taking and repair, producing intelligible speech, understanding register ' +
    'and formality, and sustaining real conversation.',
  concepts: [], // Populated in Task 2
};

const languageCultureWing: DepartmentWing = {
  id: 'language-culture',
  name: 'Language, Culture & Identity',
  description:
    'Understanding how language reflects culture, exploring linguistic relativity and how ' +
    'language shapes thought, appreciating multilingual identity and code-switching, and ' +
    'recognizing language diversity and power dynamics across 7000 living languages.',
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
 * The Languages department -- 5 wings of language learning as meta-skill.
 *
 * Wings address the universal principles of language acquisition applicable
 * to learning any of the world's 7000 languages.
 */
export const languagesDepartment: CollegeDepartment = {
  id: 'languages',
  name: 'World Languages',
  wings: [
    soundSystemsWing,
    grammarPatternsWing,
    vocabularyReadingWing,
    speakingListeningWing,
    languageCultureWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in Task 2
  calibrationModels: [] as CalibrationModel[], // Populated in future phases
  trySessions: [] as TrySession[], // Populated in Task 2
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the languages department with a CollegeLoader.
 *
 * CollegeLoader auto-discovers departments via DEPARTMENT.md on the filesystem.
 * This function provides a programmatic registration hook for future loader integration.
 */
export function registerLanguagesDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
  // This function provides a programmatic registration hook for future use.
}
