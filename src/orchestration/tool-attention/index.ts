/**
 * HB-01 — Tool Attention lazy schema loader (v1.49.575 Half B).
 *
 * Source paper: arXiv:2604.21816 — "Tool Attention".
 * Spec: `.planning/missions/cs25-26-sweep/work/synthesis/specs/HB-01-tool-attention.md`.
 * ADR: `.planning/missions/cs25-26-sweep/work/modules/M4/ADR-2604.21816.md`.
 *
 * The substrate composes four pieces:
 *   1. ISO score — cosine-similarity-of-embeddings ranking.
 *   2. State-aware gate — phase-conditional top-k budget.
 *   3. Lazy loader — compact pool + full schemas only for top-k.
 *   4. Budget monitor — 70% context-fracture alert.
 *
 * All four pieces sit *above* the planning-bridge MCP dispatch boundary; no
 * existing dispatch code path is rewritten. The flag
 * `cs25-26-sweep.tool-attention` defaults off and the load path is
 * byte-identical to v1.49.574 baseline when off.
 *
 * @module orchestration/tool-attention
 */

export type {
  ToolAttentionConfig,
  ToolAttentionModule,
} from './settings.js';
export {
  DEFAULT_TOOL_ATTENTION_CONFIG,
  isToolAttentionEnabled,
  readToolAttentionConfig,
} from './settings.js';

export type {
  CompactToolEntry,
  FullToolEntry,
  TaskPhase,
  EmbeddingVector,
  ToolEmbeddingSidecar,
  IsoScoreEntry,
  IsoScoreOutput,
  IsoScoreDisabled,
  StateGateConfig,
  GateOutput,
  GateDisabled,
  LazyLoadOutput,
  LazyLoadDisabled,
  BudgetMonitorOutput,
  BudgetMonitorDisabled,
} from './types.js';

export {
  cosineSimilarity,
  hashingEmbedding,
  computeIsoScore,
} from './iso-score.js';

export {
  applyStateGate,
  DEFAULT_GATE_CONFIG,
} from './state-gate.js';

export {
  lazyLoadSchemas,
  truncateDescription,
  type SchemaResolver,
} from './lazy-loader.js';

export {
  checkBudget,
  DEFAULT_FRACTURE_THRESHOLD,
  type BudgetMonitorInput,
} from './budget-monitor.js';

import { computeIsoScore } from './iso-score.js';
import { applyStateGate, DEFAULT_GATE_CONFIG } from './state-gate.js';
import { lazyLoadSchemas, type SchemaResolver } from './lazy-loader.js';
import { checkBudget } from './budget-monitor.js';
import { isToolAttentionEnabled } from './settings.js';
import type {
  CompactToolEntry,
  EmbeddingVector,
  GateDisabled,
  GateOutput,
  IsoScoreDisabled,
  IsoScoreOutput,
  LazyLoadDisabled,
  LazyLoadOutput,
  BudgetMonitorDisabled,
  BudgetMonitorOutput,
  StateGateConfig,
  TaskPhase,
  ToolEmbeddingSidecar,
} from './types.js';

export interface ComposedPipelineInput {
  sidecars: readonly ToolEmbeddingSidecar[];
  compactCorpus: readonly CompactToolEntry[];
  intentEmbedding: EmbeddingVector;
  phase: TaskPhase;
  resolveFullSchema: SchemaResolver;
  gateConfig?: StateGateConfig;
  contextWindowTokens?: number;
  fractureThreshold?: number;
  settingsPath?: string;
}

export interface ComposedPipelineOutput {
  iso: IsoScoreOutput | IsoScoreDisabled;
  gate: GateOutput | GateDisabled;
  load: LazyLoadOutput | LazyLoadDisabled;
  budget: BudgetMonitorOutput | BudgetMonitorDisabled;
  disabled: boolean;
}

/**
 * Run the full Tool Attention pipeline. Composes the four substrate primitives
 * in declaration order (ISO → gate → lazy-load → budget). When the flag is
 * off every stage returns its disabled-result sentinel and `disabled` is true.
 */
export function runToolAttentionPipeline(
  input: ComposedPipelineInput,
): ComposedPipelineOutput {
  const enabled = isToolAttentionEnabled(input.settingsPath);
  const iso = computeIsoScore(
    input.sidecars,
    input.intentEmbedding,
    input.phase,
    input.settingsPath,
  );
  const gate = applyStateGate(
    iso,
    input.phase,
    input.gateConfig ?? DEFAULT_GATE_CONFIG,
    input.settingsPath,
  );
  const load = lazyLoadSchemas(
    input.compactCorpus,
    gate,
    input.resolveFullSchema,
    input.settingsPath,
  );
  const occupancyTokens = (load as LazyLoadOutput).totalTokens ?? 0;
  const budget = checkBudget(
    {
      occupancyTokens,
      contextWindowTokens: input.contextWindowTokens ?? 0,
      fractureThreshold: input.fractureThreshold,
    },
    input.settingsPath,
  );
  return { iso, gate, load, budget, disabled: !enabled };
}
