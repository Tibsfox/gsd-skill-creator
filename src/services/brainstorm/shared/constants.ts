/**
 * Brainstorm session constants.
 *
 * Runtime constants for technique defaults, agent phase rules,
 * hat descriptions, SCAMPER prompts, and message priorities.
 *
 * All lookup objects use `as const` -- no TypeScript enums.
 * Record<T, ...> types enforce exhaustive coverage at compile time.
 *
 * Only import: ./types.js (type-only). No imports from den/, vtm/, knowledge/.
 */

import type {
  AgentRole,
  HatColor,
  ScamperLens,
  SessionPhase,
  TechniqueId,
} from './types.js';

// ============================================================================
// Phase ordering
// ============================================================================

/**
 * Canonical phase order: explore -> diverge -> organize -> converge -> act.
 *
 * Used by the Rules Engine to validate phase transitions and by the
 * Session Manager to determine next phase.
 */
export const PHASE_ORDER: SessionPhase[] = [
  'explore',
  'diverge',
  'organize',
  'converge',
  'act',
];

// ============================================================================
// Technique defaults
// ============================================================================

/**
 * Default duration and agent assignments for all 16 techniques.
 *
 * Record<TechniqueId, ...> ensures exhaustive coverage -- a missing
 * technique produces a compile error.
 */
export const TECHNIQUE_DEFAULTS: Record<TechniqueId, {
  duration_ms: number;
  agents: AgentRole[];
}> = {
  'freewriting':            { duration_ms: 600_000,   agents: ['ideator'] },
  'mind-mapping':           { duration_ms: 900_000,   agents: ['mapper'] },
  'rapid-ideation':         { duration_ms: 60_000,    agents: ['ideator'] },
  'question-brainstorming': { duration_ms: 600_000,   agents: ['questioner'] },
  'brainwriting-635':       { duration_ms: 1_800_000, agents: ['ideator'] },
  'round-robin':            { duration_ms: 900_000,   agents: ['ideator'] },
  'brain-netting':          { duration_ms: 1_200_000, agents: ['ideator'] },
  'rolestorming':           { duration_ms: 900_000,   agents: ['persona', 'ideator'] },
  'figure-storming':        { duration_ms: 900_000,   agents: ['persona', 'ideator'] },
  'scamper':                { duration_ms: 1_800_000, agents: ['analyst', 'ideator'] },
  'six-thinking-hats':      { duration_ms: 2_100_000, agents: ['analyst'] },
  'starbursting':           { duration_ms: 900_000,   agents: ['questioner'] },
  'five-whys':              { duration_ms: 600_000,   agents: ['questioner'] },
  'storyboarding':          { duration_ms: 900_000,   agents: ['mapper'] },
  'affinity-mapping':       { duration_ms: 900_000,   agents: ['mapper'] },
  'lotus-blossom':          { duration_ms: 900_000,   agents: ['mapper', 'ideator'] },
} as const;

// ============================================================================
// Six Thinking Hats descriptions
// ============================================================================

/**
 * Hat color descriptions for the Six Thinking Hats technique (de Bono).
 *
 * Each hat defines a thinking mode and focus area.
 */
export const HAT_DESCRIPTIONS: Record<HatColor, {
  mode: string;
  focus: string;
}> = {
  'white':  { mode: 'Facts and Data',         focus: 'Objective information analysis' },
  'red':    { mode: 'Emotions and Intuition',  focus: 'Gut reactions without justification' },
  'black':  { mode: 'Critical Judgment',       focus: 'Risks, weaknesses, problems' },
  'yellow': { mode: 'Optimistic Thinking',     focus: 'Benefits, value, opportunities' },
  'green':  { mode: 'Creative Thinking',       focus: 'New ideas, alternatives, possibilities' },
  'blue':   { mode: 'Process Control',         focus: 'Managing the discussion itself' },
} as const;

// ============================================================================
// SCAMPER prompts
// ============================================================================

/**
 * Prompt questions for each SCAMPER lens.
 *
 * Used by the analyst agent to guide systematic idea transformation.
 */
export const SCAMPER_PROMPTS: Record<ScamperLens, string[]> = {
  'substitute':         ['What materials, components, or people could be swapped?'],
  'combine':            ['What features, functions, or ideas could be merged?'],
  'adapt':              ['What could be borrowed or adapted from other domains?'],
  'modify':             ['What could be made bigger, smaller, or changed in form?'],
  'put-to-another-use': ['How else could this be used? Who else could use it?'],
  'eliminate':          ['What could be removed or simplified?'],
  'reverse':            ['What would happen if you reversed the order or process?'],
} as const;

// ============================================================================
// Agent phase rules
// ============================================================================

/**
 * Agent activation rules -- which phases each agent is active in and
 * what behavioral constraints apply.
 *
 * Critical invariant: critic.active contains ONLY ['converge'].
 * The Critic agent must NEVER activate during the Diverge phase
 * (Osborn's Rule 2: no criticism during ideation).
 */
export const AGENT_PHASE_RULES: Record<AgentRole, {
  active: SessionPhase[];
  constraints: string[];
}> = {
  'facilitator': {
    active: ['explore', 'diverge', 'organize', 'converge', 'act'],
    constraints: ['Never evaluate ideas directly'],
  },
  'ideator': {
    active: ['diverge'],
    constraints: ['Never evaluate own output', 'Never filter ideas'],
  },
  'questioner': {
    active: ['explore', 'diverge'],
    constraints: ['Generate questions only, never answers'],
  },
  'analyst': {
    active: ['diverge', 'organize'],
    constraints: ['Follow framework structure strictly'],
  },
  'mapper': {
    active: ['diverge', 'organize'],
    constraints: ['Organize without evaluating quality'],
  },
  'critic': {
    active: ['converge'],
    constraints: ['NEVER activate during diverge phase'],
  },
  'persona': {
    active: ['diverge'],
    constraints: ['Maintain perspective consistently', 'Constructive personas only'],
  },
  'scribe': {
    active: ['explore', 'diverge', 'organize', 'converge', 'act'],
    constraints: ['Capture only, never generate ideas'],
  },
} as const;

// ============================================================================
// Message priorities
// ============================================================================

/**
 * Named priority levels for brainstorm bus messages.
 *
 * Lower number = higher priority. Maps to filesystem priority directories.
 * 0 = highest (rules violations, user input), 7 = lowest (heartbeat).
 */
export const MESSAGE_PRIORITIES = {
  RULES_VIOLATION: 0,
  USER_INPUT: 0,
  PHASE_TRANSITION: 1,
  HAT_COLOR_CHANGE: 1,
  TECHNIQUE_SWITCH: 2,
  IDEA_CAPTURE: 3,
  ENERGY_SIGNAL: 4,
  TIMER_EVENT: 5,
  AGENT_LIFECYCLE: 6,
  HEARTBEAT: 7,
} as const;
