/**
 * Music Department Definition
 *
 * Defines the CollegeDepartment object for the music department,
 * including all 5 wings, token budget configuration, and the
 * registration function for the CollegeLoader.
 *
 * @module departments/music/music-department
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

const rhythmMovementWing: DepartmentWing = {
  id: 'rhythm-movement',
  name: 'Rhythm & Movement -- Music in Time',
  description:
    'How sound is organized in time through rhythm, pulse, meter, and body movement. ' +
    'Understanding the steady beat that underlies all music, rhythmic notation, meter ' +
    'signatures, syncopation, polyrhythm, and the mathematical relationships between ' +
    'note values. Rhythm is the mathematical skeleton of music.',
  concepts: [],
};

const melodyVoiceWing: DepartmentWing = {
  id: 'melody-voice',
  name: 'Melody & Voice -- Music in Pitch',
  description:
    'How to think in pitches and express melodies through singing. Develops vocal ' +
    'control, scale understanding (major, minor, pentatonic), interval recognition, ' +
    'melodic contour, and the relationship between melody and emotion. Covers solfege, ' +
    'basic sight-singing, and vocal care.',
  concepts: [],
};

const harmonyStructureWing: DepartmentWing = {
  id: 'harmony-structure',
  name: 'Harmony & Structure -- Music in Depth',
  description:
    'How chords are built and progress through a piece, creating tension and resolution. ' +
    'Covers chord construction (intervals, triads, seventh chords), common chord progressions, ' +
    'tonality, key signatures, modulation, and the large-scale formal structures of music ' +
    '(verse-chorus, rondo, sonata form).',
  concepts: [],
};

const instrumentsEnsembleWing: DepartmentWing = {
  id: 'instruments-ensemble',
  name: 'Instruments & Ensemble -- Making Sound Together',
  description:
    'The physics of how instruments produce sound, families of instruments ' +
    '(strings, woodwinds, brass, percussion, keyboard, voice, electronic), and the ' +
    'skills of ensemble playing: listening, blending, following a conductor, balancing ' +
    'volume, and the social dynamics of making music together.',
  concepts: [],
};

const musicHistoryCultureWing: DepartmentWing = {
  id: 'music-history-culture',
  name: 'Music History & Culture -- Music Across Time',
  description:
    'How music has evolved from ancient traditions to contemporary practice across ' +
    'cultures and genres. Covers Western classical periods (Baroque, Classical, Romantic, ' +
    'Modern), the African and African-American roots of jazz and blues, world music ' +
    'traditions, and the social and political roles of music as protest, identity, and healing.',
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
 * The Music department -- 5 wings of music education.
 */
export const musicDepartment: CollegeDepartment = {
  id: 'music',
  name: 'Music & Sound',
  wings: [
    rhythmMovementWing,
    melodyVoiceWing,
    harmonyStructureWing,
    instrumentsEnsembleWing,
    musicHistoryCultureWing,
  ],
  concepts: [] as RosettaConcept[],
  calibrationModels: [] as CalibrationModel[],
  trySessions: [] as TrySession[],
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the music department with a CollegeLoader.
 */
export function registerMusicDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
