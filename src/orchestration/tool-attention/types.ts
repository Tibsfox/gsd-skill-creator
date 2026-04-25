/**
 * HB-01 tool-attention — shared TS types.
 *
 * Public typed surface for ISO score, state-aware gating, lazy loader, and
 * budget monitor. Substrate-only: no runtime side effects, no MCP wire calls.
 *
 * @module orchestration/tool-attention/types
 */

/**
 * Compact form of a tool exposed to the model: name + 1-line description.
 * The full JSON schema is fetched lazily via the loader's `loadFullSchema`.
 */
export interface CompactToolEntry {
  /** Stable, unique tool identifier (e.g. "planning-bridge.add_phase"). */
  name: string;
  /** ≤80-char one-line description for the compact pool. */
  shortDescription: string;
  /** Approximate token weight of the *full* schema. Used by budget-monitor. */
  fullSchemaTokens: number;
  /** Approximate token weight of the compact entry itself. */
  compactTokens: number;
}

/**
 * Full tool entry — compact form plus the actual JSON schema. Returned by
 * the lazy loader for tools selected into the top-k.
 */
export interface FullToolEntry extends CompactToolEntry {
  /** The JSON schema object the model needs for actual invocation. */
  schema: Record<string, unknown>;
}

/**
 * Phase of the running task (drives the state-aware gate). Different phases
 * tolerate different top-k schemas — verifying needs more read-tools, planning
 * needs more search-tools, executing tolerates a tighter set.
 */
export type TaskPhase =
  | 'planning'
  | 'executing'
  | 'verifying'
  | 'unknown';

/**
 * Embedding vector. Approximate / dense; project-internal embedding utilities
 * may emit either sentence-transformer outputs or the hashing-vector substitute
 * implemented locally for substrate use (see `iso-score.ts`).
 */
export type EmbeddingVector = readonly number[];

/**
 * Per-tool sidecar metadata used by the ISO score: a precomputed embedding
 * for the tool's name+description, and (optionally) declared phase pins.
 */
export interface ToolEmbeddingSidecar {
  name: string;
  embedding: EmbeddingVector;
  /** Phases under which this tool is *always* included regardless of ISO rank. */
  phasePins?: readonly TaskPhase[];
}

/**
 * ISO score result: per-tool cosine-similarity score against intent.
 */
export interface IsoScoreEntry {
  name: string;
  score: number;
  pinned: boolean;
}

export interface IsoScoreOutput {
  /** Tools sorted by score desc; pinned tools always appear first. */
  ranked: IsoScoreEntry[];
  /** Original intent embedding, echoed for caller introspection. */
  intentEmbedding: EmbeddingVector;
}

/**
 * Parameters governing the state-aware gate.
 */
export interface StateGateConfig {
  /** Per-phase top-k overrides; falls back to `defaultTopK` if absent. */
  perPhaseTopK?: Partial<Record<TaskPhase, number>>;
  /** Floor when phase is unknown / not declared. */
  defaultTopK: number;
  /** Hard ceiling regardless of phase override (defense-in-depth). */
  maxTopK: number;
}

/**
 * Output of the gate: which tools survive into the top-k after pinning.
 */
export interface GateOutput {
  /** Final selected tool names, in score-desc order with pins first. */
  selected: string[];
  /** Effective top-k applied (after caps + pin reservation). */
  effectiveTopK: number;
  /** Tools that survived purely because they were phase-pinned. */
  pinnedSurvivors: string[];
}

/**
 * Output of the lazy loader.
 */
export interface LazyLoadOutput {
  /** Compact-only entries (name + shortDescription) for *all* tools. */
  compactPool: CompactToolEntry[];
  /** Full schemas for the gated top-k tools. */
  fullSchemas: FullToolEntry[];
  /** Total approximate tokens occupied (compact pool + full schemas). */
  totalTokens: number;
}

/**
 * Output of the budget monitor.
 */
export interface BudgetMonitorOutput {
  /** Current schema token occupancy. */
  occupancyTokens: number;
  /** Effective context window (tokens). */
  contextWindowTokens: number;
  /** occupancyTokens / contextWindowTokens. */
  occupancyRatio: number;
  /** True iff occupancyRatio ≥ fractureThreshold (default 0.70). */
  fractureAlert: boolean;
  /** Threshold the alert is checked against. */
  fractureThreshold: number;
}

/**
 * Disabled-result sentinels (returned with flag off; byte-identical surface).
 */
export interface IsoScoreDisabled {
  ranked: never[];
  intentEmbedding: never[];
  disabled: true;
}

export interface GateDisabled {
  selected: never[];
  effectiveTopK: 0;
  pinnedSurvivors: never[];
  disabled: true;
}

export interface LazyLoadDisabled {
  compactPool: never[];
  fullSchemas: never[];
  totalTokens: 0;
  disabled: true;
}

export interface BudgetMonitorDisabled {
  occupancyTokens: 0;
  contextWindowTokens: 0;
  occupancyRatio: 0;
  fractureAlert: false;
  fractureThreshold: 0;
  disabled: true;
}
