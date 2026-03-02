/**
 * Theology Department Definition
 *
 * Defines the CollegeDepartment object for the theology department,
 * including all 5 wings, token budget configuration, and the
 * registration function for the CollegeLoader.
 *
 * @module departments/theology/theology-department
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

const storiesTraditionsWing: DepartmentWing = {
  id: 'stories-traditions',
  name: 'Stories & Traditions -- Sacred Narratives',
  description:
    'Sacred narratives, creation stories, moral tales, and mythological traditions across ' +
    'cultures. The stories that shape how people understand the world, convey moral wisdom, ' +
    'and transmit identity across generations. Covers hero and prophet narratives, parables, ' +
    'flood narratives, trickster tales, and oral tradition.',
  concepts: [],
};

const worldReligionsWing: DepartmentWing = {
  id: 'world-religions',
  name: 'World Religions Survey -- The Human Response to the Sacred',
  description:
    'The world\'s major religious traditions -- their origins, core beliefs, practices, ' +
    'and global presence. Understanding the diversity of human responses to questions about ' +
    'the sacred, the divine, and the meaning of existence. Covers Christianity, Islam, ' +
    'Judaism, Hinduism, Buddhism, Sikhism, and indigenous traditions with equal respect.',
  concepts: [],
};

const sacredPracticesWing: DepartmentWing = {
  id: 'sacred-practices',
  name: 'Sacred Practices -- Ritual, Prayer & Devotion',
  description:
    'How religious communities structure their spiritual lives through ritual, prayer, ' +
    'meditation, pilgrimage, fasting, and communal worship. Covers the function of ritual ' +
    'in marking transitions and creating community, comparative prayer forms, sacred space, ' +
    'and the relationship between inner experience and outer practice.',
  concepts: [],
};

const ethicsJusticeWing: DepartmentWing = {
  id: 'ethics-justice',
  name: 'Ethics & Justice -- Living Well Together',
  description:
    'How religious and ethical traditions address questions of justice, human dignity, ' +
    'care for the poor, environmental responsibility, and social transformation. Covers ' +
    'liberation theology, Buddhist social ethics, Islamic jurisprudence, Jewish tikkun olam, ' +
    'and the prophetic traditions of social justice within major religions.',
  concepts: [],
};

const ultimateQuestionsWing: DepartmentWing = {
  id: 'ultimate-questions',
  name: 'Ultimate Questions -- Meaning, Death & Transcendence',
  description:
    'The deepest questions human beings face: What happens after death? Does God exist? ' +
    'What is the meaning of suffering? What makes a life meaningful? Covers theodicy ' +
    '(problem of evil), afterlife traditions across cultures, mysticism and direct experience ' +
    'of the sacred, and philosophical arguments for and against religious belief.',
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
 * The Theology department -- 5 wings of religion and theological inquiry.
 */
export const theologyDepartment: CollegeDepartment = {
  id: 'theology',
  name: 'Theology & Religion Studies',
  wings: [
    storiesTraditionsWing,
    worldReligionsWing,
    sacredPracticesWing,
    ethicsJusticeWing,
    ultimateQuestionsWing,
  ],
  concepts: [] as RosettaConcept[],
  calibrationModels: [] as CalibrationModel[],
  trySessions: [] as TrySession[],
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the theology department with a CollegeLoader.
 */
export function registerTheologyDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
