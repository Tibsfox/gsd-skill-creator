/**
 * Living Sensoria M1–M5 shared types — semantic graph, hybrid memory,
 * decision-trace ledger, branch-context, agentic orchestration.
 *
 * Wave 0.1 of the Living Sensoria milestone (v1.49.561). Types only;
 * implementations land in Wave 1 Track D (phases 642–646).
 *
 * @module types/memory
 */

// ─── M1 Semantic Memory Graph ───────────────────────────────────────────

export type EntityKind =
  | 'skill'
  | 'command'
  | 'file'
  | 'session'
  | 'decision'
  | 'outcome';

export interface Entity {
  id: string;
  kind: EntityKind;
  attrs: Record<string, unknown>;
}

export interface Edge {
  src: string;
  dst: string;
  relation: string;
  weight: number;
}

export interface Community {
  id: string;
  level: number;
  members: string[];
  summary?: string;
}

// ─── M2 Hierarchical Hybrid Memory ──────────────────────────────────────

export interface MemoryEntry {
  id: string;
  content: string;
  ts: number;
  alpha: number;
  beta: number;
  gamma: number;
  score: number;
}

export interface ReflectionBatch {
  inputIds: string[];
  summaryId: string;
  ts: number;
}

// ─── M3 Decision-Trace Ledger (AMTP-compatible) ─────────────────────────

export interface DecisionTrace {
  id: string;
  ts: number;
  actor: string;
  intent: string;
  reasoning: string;
  constraints: string[];
  alternatives: string[];
  outcome?: string;
  refs: {
    teachId?: string;
    entityIds?: string[];
  };
}

// ─── M4 Branch-Context Experimentation ──────────────────────────────────

export type BranchState = 'open' | 'committed' | 'aborted';

export interface LivingSensoriaBranch {
  id: string;
  parent: string | null;
  ts: number;
  state: BranchState;
  delta: {
    files: string[];
    bytes: number;
  };
}

// ─── M5 Agentic Orchestration + Prefix Cache ────────────────────────────

export interface PrefixCacheHit {
  prefixId: string;
  skillIds: string[];
  hitCount: number;
}

export interface StepGraphNode {
  id: string;
  predictedNext: string[];
  confidence: number;
}
