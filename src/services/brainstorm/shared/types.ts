/**
 * Brainstorm session type system.
 *
 * Zod schemas and inferred TypeScript types for the brainstorm session support
 * system. This is the foundation type module -- every brainstorm component
 * imports from here.
 *
 * Defines: Agent roles (8), session phases (5), techniques (16),
 * pathways (5), message types (14), and all core data structures
 * (Idea, Question, Cluster, Evaluation, ActionItem, SessionState, etc.).
 *
 * Only allowed import: zod. No imports from den/, vtm/, knowledge/,
 * or any other project module.
 */

import { z } from 'zod';

// ============================================================================
// Enum schemas (string literal unions via z.enum)
// ============================================================================

/**
 * Agent roles in the brainstorm system.
 *
 * Eight specialized cognitive agents, each with distinct responsibilities:
 * facilitator, ideator, questioner, analyst, mapper, critic, persona, scribe.
 */
export const AgentRoleSchema = z.enum([
  'facilitator',
  'ideator',
  'questioner',
  'analyst',
  'mapper',
  'critic',
  'persona',
  'scribe',
]);
export type AgentRole = z.infer<typeof AgentRoleSchema>;

/**
 * Session phases -- strict ordering from exploration to action.
 *
 * explore -> diverge -> organize -> converge -> act
 */
export const SessionPhaseSchema = z.enum([
  'explore',
  'diverge',
  'organize',
  'converge',
  'act',
]);
export type SessionPhase = z.infer<typeof SessionPhaseSchema>;

/**
 * Technique taxonomy categories.
 *
 * Each brainstorming technique belongs to exactly one category.
 */
export const TechniqueCategorySchema = z.enum([
  'individual',
  'collaborative',
  'analytical',
  'visual',
]);
export type TechniqueCategory = z.infer<typeof TechniqueCategorySchema>;

/**
 * All 16 brainstorming technique identifiers.
 *
 * Individual (4): freewriting, mind-mapping, rapid-ideation, question-brainstorming
 * Collaborative (5): brainwriting-635, round-robin, brain-netting, rolestorming, figure-storming
 * Analytical (4): scamper, six-thinking-hats, starbursting, five-whys
 * Visual (3): storyboarding, affinity-mapping, lotus-blossom
 */
export const TechniqueIdSchema = z.enum([
  'freewriting',
  'mind-mapping',
  'rapid-ideation',
  'question-brainstorming',
  'brainwriting-635',
  'round-robin',
  'brain-netting',
  'rolestorming',
  'figure-storming',
  'scamper',
  'six-thinking-hats',
  'starbursting',
  'five-whys',
  'storyboarding',
  'affinity-mapping',
  'lotus-blossom',
]);
export type TechniqueId = z.infer<typeof TechniqueIdSchema>;

/**
 * Educational pathway identifiers.
 *
 * Each pathway defines a guided sequence of techniques for a specific
 * brainstorming scenario.
 */
export const PathwayIdSchema = z.enum([
  'creative-exploration',
  'problem-solving',
  'product-innovation',
  'decision-making',
  'free-form',
]);
export type PathwayId = z.infer<typeof PathwayIdSchema>;

/**
 * Six Thinking Hats color values.
 *
 * Each hat represents a distinct thinking mode (de Bono method).
 */
export const HatColorSchema = z.enum([
  'white',
  'red',
  'black',
  'yellow',
  'green',
  'blue',
]);
export type HatColor = z.infer<typeof HatColorSchema>;

/**
 * SCAMPER creative thinking lenses.
 *
 * Seven lenses for systematic idea generation and transformation.
 */
export const ScamperLensSchema = z.enum([
  'substitute',
  'combine',
  'adapt',
  'modify',
  'put-to-another-use',
  'eliminate',
  'reverse',
]);
export type ScamperLens = z.infer<typeof ScamperLensSchema>;

/**
 * Osborn's four rules of brainstorming.
 *
 * Enforced architecturally -- the Critic agent is not instantiated
 * during the Diverge phase to uphold the no-criticism rule.
 */
export const OsbornRuleSchema = z.enum([
  'quantity',
  'no-criticism',
  'wild-ideas',
  'build-combine',
]);
export type OsbornRule = z.infer<typeof OsbornRuleSchema>;

/**
 * Session energy level tracking.
 *
 * Used to detect flagging engagement and trigger technique switches.
 */
export const EnergyLevelSchema = z.enum([
  'high',
  'medium',
  'low',
  'flagging',
]);
export type EnergyLevel = z.infer<typeof EnergyLevelSchema>;

/**
 * Session lifecycle status.
 */
export const SessionStatusSchema = z.enum([
  'created',
  'active',
  'paused',
  'completed',
  'abandoned',
]);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

/**
 * Message types for the brainstorm communication bus.
 *
 * 14 distinct message types covering ideas, questions, phase transitions,
 * technique switches, timer events, and agent lifecycle.
 */
export const MessageTypeSchema = z.enum([
  'idea',
  'question',
  'cluster',
  'evaluation',
  'phase_transition',
  'technique_switch',
  'timer_event',
  'hat_color',
  'energy_signal',
  'rule_violation',
  'user_input',
  'artifact_ready',
  'agent_activated',
  'agent_deactivated',
]);
export type MessageType = z.infer<typeof MessageTypeSchema>;

// ============================================================================
// Object schemas (core data structures)
// ============================================================================

/**
 * A brainstorming idea captured during a session.
 *
 * Ideas are append-only -- once captured, they are never modified or deleted.
 * This enforces Osborn's Rule 1 (quantity over quality).
 */
export const IdeaSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1),
  source_agent: AgentRoleSchema,
  source_technique: TechniqueIdSchema,
  phase: SessionPhaseSchema,
  parent_id: z.string().uuid().optional(),
  perspective: z.string().optional(),
  cluster_id: z.string().uuid().optional(),
  priority: z.number().int().min(0).max(10).optional(),
  scamper_lens: ScamperLensSchema.optional(),
  hat_color: HatColorSchema.optional(),
  tags: z.array(z.string()),
  timestamp: z.number().int().positive(),
});
export type Idea = z.infer<typeof IdeaSchema>;

/**
 * A question generated during brainstorming.
 *
 * Used by Starbursting, Five Whys, and Question Brainstorming techniques.
 */
export const QuestionSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1),
  category: z.enum(['who', 'what', 'where', 'when', 'why', 'how', 'root-cause']),
  source_technique: TechniqueIdSchema,
  depth: z.number().int().min(0).optional(),
  parent_id: z.string().uuid().optional(),
  timestamp: z.number().int().positive(),
});
export type Question = z.infer<typeof QuestionSchema>;

/**
 * A cluster of related ideas, produced during the Organize phase.
 */
export const ClusterSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  idea_ids: z.array(z.string().uuid()),
  theme: z.string().optional(),
  priority: z.number().int().min(0).max(10).optional(),
});
export type Cluster = z.infer<typeof ClusterSchema>;

/**
 * An evaluation of an idea on four dimensions, produced during Converge.
 *
 * Scores: 1-5 for feasibility, impact, alignment, risk.
 */
export const EvaluationSchema = z.object({
  idea_id: z.string().uuid(),
  feasibility: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  alignment: z.number().int().min(1).max(5),
  risk: z.number().int().min(1).max(5),
  notes: z.string().optional(),
  evaluator: AgentRoleSchema,
  timestamp: z.number().int().positive(),
});
export type Evaluation = z.infer<typeof EvaluationSchema>;

/**
 * An actionable item derived from ideas during the Act phase.
 */
export const ActionItemSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1),
  source_idea_ids: z.array(z.string().uuid()),
  owner: z.string().optional(),
  deadline: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['proposed', 'accepted', 'in-progress', 'complete']),
});
export type ActionItem = z.infer<typeof ActionItemSchema>;

/**
 * Timer state for technique and session timing.
 *
 * technique_timer is null when no technique is actively timed.
 */
export const TimerStateSchema = z.object({
  technique_timer: z.object({
    remaining_ms: z.number().int().min(0),
    total_ms: z.number().int().positive(),
  }).nullable(),
  session_timer: z.object({
    elapsed_ms: z.number().int().min(0),
    max_ms: z.number().int().positive().optional(),
  }),
  is_paused: z.boolean(),
});
export type TimerState = z.infer<typeof TimerStateSchema>;

/**
 * Complete session state.
 *
 * The single source of truth for a brainstorming session. Persisted to
 * state.json in the session directory. All arrays are append-only during
 * the session (ideas, questions are never removed).
 */
export const SessionStateSchema = z.object({
  id: z.string().uuid(),
  status: SessionStatusSchema,
  phase: SessionPhaseSchema,
  problem_statement: z.string().min(1),
  active_technique: TechniqueIdSchema.nullable(),
  active_pathway: PathwayIdSchema.nullable(),
  technique_queue: z.array(TechniqueIdSchema),
  active_agents: z.array(AgentRoleSchema),
  ideas: z.array(IdeaSchema),
  questions: z.array(QuestionSchema),
  clusters: z.array(ClusterSchema),
  evaluations: z.array(EvaluationSchema),
  action_items: z.array(ActionItemSchema),
  timer: TimerStateSchema,
  energy_level: EnergyLevelSchema,
  rules_active: z.array(OsbornRuleSchema),
  hat_color: HatColorSchema.optional(),
  metadata: z.object({
    created_at: z.number().int().positive(),
    updated_at: z.number().int().positive(),
    total_ideas: z.number().int().min(0),
    total_questions: z.number().int().min(0),
    techniques_used: z.array(TechniqueIdSchema),
    phase_history: z.array(z.object({
      phase: SessionPhaseSchema,
      entered_at: z.number().int().positive(),
      exited_at: z.number().int().positive().optional(),
    })),
  }),
});
export type SessionState = z.infer<typeof SessionStateSchema>;

/**
 * A message on the brainstorm communication bus.
 *
 * Messages flow between agents and the system via the filesystem bus.
 * Priority 0 = highest (rules violations, user input), 7 = lowest (heartbeat).
 */
export const BrainstormMessageSchema = z.object({
  id: z.string().uuid(),
  from: z.union([AgentRoleSchema, z.literal('system')]),
  to: z.union([AgentRoleSchema, z.literal('broadcast')]),
  type: MessageTypeSchema,
  phase: SessionPhaseSchema,
  payload: z.record(z.string(), z.unknown()),
  timestamp: z.number().int().positive(),
  session_id: z.string().uuid(),
  priority: z.number().int().min(0).max(7),
});
export type BrainstormMessage = z.infer<typeof BrainstormMessageSchema>;

// ============================================================================
// Configuration schemas
// ============================================================================

/**
 * Configuration for a brainstorming technique.
 *
 * Defines the technique's identity, timing constraints, agent requirements,
 * valid phases, and applicable Osborn rules.
 */
export const TechniqueConfigSchema = z.object({
  id: TechniqueIdSchema,
  name: z.string(),
  category: TechniqueCategorySchema,
  description: z.string(),
  default_duration_ms: z.number().int().positive(),
  min_duration_ms: z.number().int().positive(),
  max_duration_ms: z.number().int().positive(),
  required_agents: z.array(AgentRoleSchema),
  optional_agents: z.array(AgentRoleSchema),
  valid_phases: z.array(SessionPhaseSchema),
  osborn_rules: z.array(OsbornRuleSchema),
  parameters: z.record(z.string(), z.unknown()),
});
export type TechniqueConfig = z.infer<typeof TechniqueConfigSchema>;

/**
 * Configuration for an educational pathway.
 *
 * Defines a guided sequence of techniques for a specific brainstorming
 * scenario (e.g., creative exploration, problem solving).
 */
export const PathwayConfigSchema = z.object({
  id: PathwayIdSchema,
  name: z.string(),
  description: z.string(),
  situation: z.string(),
  technique_sequence: z.array(z.object({
    technique: TechniqueIdSchema,
    duration_ms: z.number().int().positive(),
    notes: z.string(),
  })),
  required_agents: z.array(AgentRoleSchema),
  recommended_for: z.array(z.string()),
});
export type PathwayConfig = z.infer<typeof PathwayConfigSchema>;

/**
 * Agent activation contract.
 *
 * Defines which phases an agent is active in, its behavioral constraints,
 * and required skills.
 */
export const AgentActivationSchema = z.object({
  role: AgentRoleSchema,
  active_phases: z.array(SessionPhaseSchema),
  behavioral_constraints: z.array(z.string()),
  skills_required: z.array(z.string()),
});
export type AgentActivation = z.infer<typeof AgentActivationSchema>;

/**
 * Session configuration -- the BusConfig equivalent for brainstorm.
 *
 * All filesystem functions take this as their first parameter.
 * brainstormDir is required (no default) to prevent accidental
 * production path usage in tests.
 */
export const SessionConfigSchema = z.object({
  brainstormDir: z.string().min(1),
  sessionId: z.string().uuid(),
});
export type SessionConfig = z.infer<typeof SessionConfigSchema>;
