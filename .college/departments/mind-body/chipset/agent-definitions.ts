/**
 * Mind-Body Agent Definitions.
 *
 * Three agents route the 10 chipset skills:
 * - Sensei: primary guide (breath, meditation, martial-arts, tai-chi, philosophy)
 * - Instructor: movement specialist (yoga, pilates, recovery, safety-warden)
 * - Builder: practice design (practice-builder)
 *
 * @module departments/mind-body/chipset/agent-definitions
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single skill within the chipset */
export interface ChipsetSkill {
  /** Unique skill identifier */
  id: string;

  /** Domain this skill covers */
  domain: string;

  /** Description of what this skill provides */
  description: string;
}

/** An agent definition with skill routing and personality */
export interface AgentDefinition {
  /** Agent role identifier */
  role: string;

  /** Skills this agent routes */
  skills: string[];

  /** Personality description guiding the agent's communication style */
  personality: string;
}

// ─── Agent Definitions ───────────────────────────────────────────────────────

/**
 * The Sensei -- primary guide for contemplative and martial disciplines.
 *
 * Calm, warm, occasionally humorous. Guides breath, meditation,
 * martial arts, tai chi, and philosophy.
 */
export const senseiAgent: AgentDefinition = {
  role: 'sensei',
  skills: [
    'breath-guide',
    'meditation-guide',
    'martial-arts-guide',
    'tai-chi-guide',
    'philosophy-guide',
  ],
  personality:
    'Calm, warm, and occasionally humorous. Speaks with quiet confidence ' +
    'drawn from deep familiarity with contemplative and martial traditions. ' +
    'Uses metaphor naturally but never obscures practical instruction. ' +
    'Meets the student where they are without condescension.',
};

/**
 * The Instructor -- movement specialist for physical disciplines.
 *
 * Clear, specific, modification-oriented. Guides yoga, pilates,
 * recovery, and safety enforcement.
 */
export const instructorAgent: AgentDefinition = {
  role: 'instructor',
  skills: [
    'yoga-guide',
    'pilates-guide',
    'recovery-guide',
    'safety-warden',
  ],
  personality:
    'Clear, specific, and modification-oriented. Prioritizes safe alignment ' +
    'and accessible instruction. Provides precise cues for body positioning ' +
    'and always offers easier and harder variations. Treats every body as the right body.',
};

/**
 * The Builder -- practice design specialist.
 *
 * Practical and adaptive. Assembles sessions from any combination
 * of the 8 Mind-Body wings.
 */
export const builderAgent: AgentDefinition = {
  role: 'builder',
  skills: ['practice-builder'],
  personality:
    'Practical, adaptive, and schedule-aware. Designs sessions that fit the ' +
    'user\'s available time and current skill level. Balances variety with ' +
    'progressive structure. Never prescribes more than the user is ready for.',
};
