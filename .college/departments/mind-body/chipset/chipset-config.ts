/**
 * Mind-Body Chipset Configuration.
 *
 * Defines the complete chipset for the Mind-Body department:
 * 10 skills covering all 8 discipline wings plus practice-builder and safety-warden,
 * 3 agents with skill routing, and the token budget for session management.
 *
 * @module departments/mind-body/chipset/chipset-config
 */

import type { ChipsetSkill, AgentDefinition } from './agent-definitions.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Token budget configuration for Mind-Body sessions */
export interface TokenBudget {
  /** Maximum tokens per session */
  sessionCeiling: number;

  /** Tokens reserved for safety warden checks */
  safetyWardenReserve: number;

  /** Tokens reserved for journal overhead */
  journalOverhead: number;
}

/** Complete chipset configuration */
export interface ChipsetConfig {
  /** Chipset name */
  name: string;

  /** Chipset version */
  version: string;

  /** Human-readable description */
  description: string;

  /** All skills in this chipset */
  skills: ChipsetSkill[];

  /** All agents in this chipset */
  agents: AgentDefinition[];

  /** Token budget for session management */
  tokenBudget: TokenBudget;
}

// ─── Skills ──────────────────────────────────────────────────────────────────

const skills: ChipsetSkill[] = [
  {
    id: 'breath-guide',
    domain: 'breath',
    description:
      'Guides diaphragmatic breathing, box breathing, ujjayi, breath counting, and martial breath. The universal foundation shared by every discipline.',
  },
  {
    id: 'meditation-guide',
    domain: 'meditation',
    description:
      'Guides mindfulness (vipassana), concentration (samatha), zazen, body scan, walking meditation, and metta practice.',
  },
  {
    id: 'yoga-guide',
    domain: 'yoga',
    description:
      'Guides foundation poses, sun salutation, breath-movement linking, and style exploration across Hatha, Vinyasa, Ashtanga, Yin, and Restorative.',
  },
  {
    id: 'pilates-guide',
    domain: 'pilates',
    description:
      'Guides powerhouse activation, the six principles, mat work progressions, alignment cueing, and rehabilitation applications.',
  },
  {
    id: 'martial-arts-guide',
    domain: 'martial-arts',
    description:
      'Guides stances, strikes, blocks, forms, and style overviews spanning Chinese, Japanese, Korean, Southeast Asian, and Brazilian traditions.',
  },
  {
    id: 'tai-chi-guide',
    domain: 'tai-chi',
    description:
      'Guides tai chi principles, qigong foundations, the Beijing 24 Form, standing meditation, and the yin-yang interplay in movement.',
  },
  {
    id: 'recovery-guide',
    domain: 'relaxation',
    description:
      'Guides progressive muscle relaxation, yoga nidra, myofascial release, stretching protocols, and nervous system regulation.',
  },
  {
    id: 'philosophy-guide',
    domain: 'philosophy',
    description:
      'Guides exploration of Zen philosophy, Taoism, Yoga Sutras, Bushido and martial virtues, mindfulness in daily life, and beginner\'s mind.',
  },
  {
    id: 'practice-builder',
    domain: 'practice-builder',
    description:
      'Assembles sessions from any combination of the 8 Mind-Body wings at 4 time commitments (5, 15, 30, 60 minutes) with progressive structure.',
  },
  {
    id: 'safety-warden',
    domain: 'safety',
    description:
      'Enforces physical safety through annotation, gating, and redirection. Checks medical contraindications and maintains the partner-technique boundary.',
  },
];

// ─── Agents (imported from agent-definitions) ───────────────────────────────

import { senseiAgent, instructorAgent, builderAgent } from './agent-definitions.js';

// ─── Chipset Config ──────────────────────────────────────────────────────────

/**
 * The complete Mind-Body chipset configuration.
 *
 * 10 skills, 3 agents, token budget for session management.
 */
export const chipsetConfig: ChipsetConfig = {
  name: 'mind-body',
  version: '1.0.0',
  description:
    'Mind-Body Practice Pack -- teaches interconnected disciplines of breathwork, meditation, ' +
    'yoga, pilates, martial arts, tai chi, relaxation, and philosophy as practical, buildable skills.',
  skills,
  agents: [senseiAgent, instructorAgent, builderAgent],
  tokenBudget: {
    sessionCeiling: 8000,
    safetyWardenReserve: 500,
    journalOverhead: 200,
  },
};
