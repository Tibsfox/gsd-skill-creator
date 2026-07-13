/**
 * Dev-Session Observation Types and Schemas
 *
 * Zod schemas for observations emitted by a Claude Code DEV session — the
 * dev-domain sibling of {@link ./observation-types.ts} (the education
 * `LearnerObservation` schema). A dev coding session has no learner, pack,
 * module, or mastery, so forcing it onto the education schema would fabricate
 * that entire axis (see `.planning/HANDOFF-2026-07-13-learner-observation-
 * producer-decision.md`). This schema instead carries ONLY dev-native facts.
 *
 * HONESTY BOUNDARY: every member schema is `.strict()`, so a record carrying an
 * education field (learnerId/packId/moduleId/score/rubricLevel) FAILS to
 * validate. Education semantics can never leak into the dev-memory corpus.
 *
 * All observations share:
 * - id:        stable id (content-derived by the source reader)
 * - timestamp: ISO 8601 string
 * - sessionId: the dev session identifier
 * - repo:      the repository/project the session ran in
 * - kind:      discriminant field
 */

import { z } from 'zod';

// ============================================================================
// DevObservationKind
// ============================================================================

/**
 * The dev-native observation kinds. Sourced from the real on-disk streams
 * (session-retro events, the tool-trace flight recorder, session summaries) —
 * NOT from any education vocabulary.
 */
export const DevObservationKind = [
  'friction',
  'win',
  'correction',
  'decision',
  'gap',
  'tool_use',
  'checkpoint',
  'session_summary',
] as const;

export type DevObservationKind = (typeof DevObservationKind)[number];

// ============================================================================
// BaseDevObservationSchema
// ============================================================================

const BaseDevObservationSchema = z.object({
  id: z.string().min(1).describe('Stable id (content-derived by the source reader)'),
  timestamp: z.string().describe('ISO 8601 timestamp'),
  sessionId: z.string().min(1).describe('Dev session identifier'),
  repo: z.string().min(1).describe('Repository/project the session ran in'),
  kind: z.enum(DevObservationKind).describe('Dev observation type discriminant'),
});

const Severity = z.enum(['low', 'medium', 'high']);

// ============================================================================
// Per-kind schemas (all .strict() — no education fields permitted)
// ============================================================================

/** Workflow inefficiency — a slow/failed step, retry, or dead-end. */
export const FrictionObservationSchema = BaseDevObservationSchema.extend({
  kind: z.literal('friction'),
  summary: z.string().min(1).describe('What was inefficient'),
  file: z.string().min(1).optional().describe('File the friction touched'),
  command: z.string().min(1).optional().describe('Command the friction touched'),
  severity: Severity.optional().describe('Rough severity'),
}).strict();

/** A step that went well — a clean pass, a resolution, a shortcut that worked. */
export const WinObservationSchema = BaseDevObservationSchema.extend({
  kind: z.literal('win'),
  summary: z.string().min(1).describe('What went well'),
  file: z.string().min(1).optional().describe('File the win touched'),
}).strict();

/** The user corrected Claude's direction (workflow correction, NOT a mastery deficit). */
export const CorrectionObservationSchema = BaseDevObservationSchema.extend({
  kind: z.literal('correction'),
  summary: z.string().min(1).describe('What was corrected'),
  file: z.string().min(1).optional().describe('File the correction touched'),
}).strict();

/** A judgment call made during the session. */
export const DecisionObservationSchema = BaseDevObservationSchema.extend({
  kind: z.literal('decision'),
  summary: z.string().min(1).describe('The decision'),
}).strict();

/** A missing capability (skill/agent/tool) surfaced during the session. */
export const GapObservationSchema = BaseDevObservationSchema.extend({
  kind: z.literal('gap'),
  summary: z.string().min(1).describe('The gap'),
  missing: z.string().min(1).optional().describe('The missing skill/agent/tool name'),
}).strict();

/** A single tool invocation from the flight-recorder trace. */
export const ToolUseObservationSchema = BaseDevObservationSchema.extend({
  kind: z.literal('tool_use'),
  tool: z.string().min(1).describe('Tool name (Bash, Edit, Read, …)'),
  file: z.string().min(1).optional().describe('File the tool touched'),
  command: z.string().min(1).optional().describe('Command run (for Bash)'),
  durationMs: z.number().nonnegative().optional().describe('Tool duration in ms'),
}).strict();

/** A session-progress marker. */
export const CheckpointObservationSchema = BaseDevObservationSchema.extend({
  kind: z.literal('checkpoint'),
  summary: z.string().min(1).describe('The checkpoint'),
}).strict();

/** A whole-session roll-up derived from the transcript summary. */
export const SessionSummaryObservationSchema = BaseDevObservationSchema.extend({
  kind: z.literal('session_summary'),
  summary: z.string().min(1).optional().describe('Free-text session summary'),
  durationMinutes: z.number().nonnegative().optional().describe('Wall-clock minutes'),
  activeSkills: z.array(z.string()).optional().describe('Skills that fired this session'),
  reason: z.string().min(1).optional().describe('Exit reason (clear/logout/other)'),
  toolCalls: z.number().nonnegative().optional().describe('Total tool calls'),
  filesTouched: z.number().nonnegative().optional().describe('Distinct files read/written'),
}).strict();

// ============================================================================
// DevSessionObservationSchema (Discriminated Union)
// ============================================================================

/**
 * Discriminated union of all dev-session observation kinds. The `kind` field
 * narrows the type; every member is strict, so education fields are rejected.
 */
export const DevSessionObservationSchema = z.discriminatedUnion('kind', [
  FrictionObservationSchema,
  WinObservationSchema,
  CorrectionObservationSchema,
  DecisionObservationSchema,
  GapObservationSchema,
  ToolUseObservationSchema,
  CheckpointObservationSchema,
  SessionSummaryObservationSchema,
]);

export type DevSessionObservation = z.infer<typeof DevSessionObservationSchema>;
