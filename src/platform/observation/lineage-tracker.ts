// ============================================================================
// lineage-tracker.ts — Data Lifecycle: Provenance Tracking
// ============================================================================
//
// WHAT THIS MODULE DOES
// ---------------------
// LineageTracker maintains a full provenance chain across the 6-stage promotion
// pipeline. Every artifact — observations, patterns, candidates, decisions,
// scripts, drift events — can be traced upstream to what produced it and
// downstream to what it produced.
//
// WHY LINEAGE MATTERS
// -------------------
// The promotion pipeline transforms raw execution data through multiple stages:
//   ExecutionCapture → DeterminismAnalyzer → PromotionDetector
//   → PromotionGatekeeper → ScriptGenerator → DriftMonitor
//
// Without lineage, a promoted script that produces wrong output has no way to
// trace back to: which observation batch caused it, which pattern scored it,
// which gatekeeper decision approved it. Debugging requires reconstructing
// this chain from raw storage entries — tedious and error-prone.
//
// With LineageTracker, any artifact can be asked: "what made you?" (upstream)
// and "what did you make?" (downstream). This is the full provenance chain.
//
// HOW LINEAGE CONNECTS TO LEARNING
// ---------------------------------
// From CENTERCAMP-PERSONAL-JOURNAL, "Showing Your Work Is the Gift":
// "When we show our work, others can verify, build on it, or find the error."
//
// LineageTracker embodies this principle for automated systems. When a script
// fails drift validation, the failure can be explained:
//   "This script was generated from pattern X, which was approved by gate
//    decision Y, which was based on observation batch Z from session W."
//
// That explanation lets a human understand and correct the system. Lineage is
// the machine-readable form of "showing your work."
//
// BIDIRECTIONAL QUERYING
// ----------------------
// Two traversal directions serve different debugging needs:
//
//   getUpstream(artifactId)  — "how did this artifact come to exist?"
//     Finds entries that produced this artifact via two strategies:
//     Strategy 1: entries whose outputs[] contains this artifactId
//     Strategy 2: entries listed in this artifact's inputs[]
//     Both strategies are merged and deduplicated. This dual approach handles
//     the case where the producing entry omits the consumer from outputs[], or
//     the consumer entry omits the producer from inputs[].
//
//   getDownstream(artifactId) — "what did this artifact enable?"
//     Mirror of upstream: finds entries that consumed this artifact.
//     Strategy 1: entries whose inputs[] contains this artifactId
//     Strategy 2: entries listed in this artifact's outputs[]
//
// getChain(artifactId) returns both directions: the artifact itself, its full
// upstream tree, and its full downstream tree. This is the complete lineage.
//
// RECURSIVE TRAVERSAL WITH CYCLE PREVENTION
// ------------------------------------------
// Both traceUpstream() and traceDownstream() are recursive. A visited set
// prevents infinite loops in case of cyclic references (should not occur in
// a linear pipeline, but guard exists for safety).
//
// The recursion terminates when no new unvisited entries are found at a level.
// For a linear pipeline, each stage has at most one parent and one child —
// the depth is bounded by the number of pipeline stages (6).
//
// STORAGE FORMAT
// --------------
// Lineage entries are stored in PatternStore 'lineage' category.
// Each entry has: artifactId, artifactType, stage, inputs[], outputs[],
// metadata (any key-value pairs), timestamp.
//
// artifactType (from ArtifactType enum) distinguishes observations from patterns
// from scripts etc., enabling getByArtifactType() filtering.
//
// The 'lineage' category is separate from 'executions', 'patterns', 'feedback',
// 'decisions'. It's the meta-layer: records about the pipeline, not pipeline outputs.
//
// PIPELINE STAGE NAMES
// --------------------
// Stage names are string identifiers matching the producing component:
//   'execution-capture'    — ExecutionCapture records observation pairs
//   'determinism-analyzer' — DeterminismAnalyzer classifies patterns
//   'promotion-detector'   — PromotionDetector scores candidates
//   'promotion-gatekeeper' — PromotionGatekeeper approves/rejects
//   'script-generator'     — ScriptGenerator generates scripts
//   'drift-monitor'        — DriftMonitor records post-deployment checks
//
// Consistent stage names across the pipeline enable filtering by stage
// and understanding which component produced what artifact.
//
// LINEAGE CHAIN TYPE
// ------------------
// LineageChain groups { artifact, upstream, downstream } into a single
// query result. This is what callers receive from getChain(). The artifact
// field is the entry for the queried artifactId — the "self" entry.
//
// SATISFIES
// ---------
// LINE-01: Full provenance chain across all 6 pipeline stages
// LINE-02: Stage input/output/metadata recording per entry
// LINE-03: Bidirectional querying (upstream and downstream traversal)
//
// @see ExecutionCapture (execution-capture.ts) — first stage, records observations
// @see PromotionGatekeeper (promotion-gatekeeper.ts) — records decision artifacts
// @see ScriptGenerator (script-generator.ts) — records generated script artifacts
// @see DriftMonitor (drift-monitor.ts) — records post-deployment drift artifacts

import { PatternStore } from '../../core/storage/pattern-store.js';
import type { LineageEntry, LineageChain, ArtifactType } from '../../core/types/observation.js';

/**
 * Provides full provenance tracking across all 6 pipeline stages.
 *
 * Each stage records a LineageEntry containing artifact ID, type, stage,
 * inputs, outputs, and metadata. Entries are stored to PatternStore 'lineage'
 * category. Bidirectional querying enables tracing any artifact upstream or
 * downstream through the full pipeline chain.
 *
 * Lineage answers two questions:
 *   - "How did this artifact come to exist?" (upstream traversal)
 *   - "What did this artifact enable?" (downstream traversal)
 *
 * Satisfies: LINE-01 (full provenance chain), LINE-02 (stage input/output/metadata
 * recording), LINE-03 (bidirectional querying).
 */
class LineageTracker {
  private store: PatternStore;

  constructor(store: PatternStore) {
    this.store = store;
  }

  /**
   * Record a lineage entry to the 'lineage' category in PatternStore.
   *
   * Called by each pipeline stage when it produces a new artifact.
   * The entry captures what went in (inputs), what came out (outputs),
   * and which stage was responsible (stage).
   *
   * @param entry - The lineage entry to persist
   */
  async record(entry: LineageEntry): Promise<void> {
    await this.store.append('lineage', {
      artifactId: entry.artifactId,
      artifactType: entry.artifactType,
      stage: entry.stage,
      inputs: entry.inputs,
      outputs: entry.outputs,
      metadata: entry.metadata,
      timestamp: entry.timestamp,
    });
  }

  /**
   * Load all lineage entries from PatternStore and convert to LineageEntry objects.
   *
   * Called internally by all query methods. Each query reads the full store
   * because lineage traversal requires the complete picture — partial reads
   * could miss upstream or downstream connections.
   *
   * Returns raw data cast to LineageEntry — PatternStore wraps data in an
   * envelope; the inner data matches the LineageEntry structure as written by record().
   */
  private async loadAll(): Promise<LineageEntry[]> {
    const patterns = await this.store.read('lineage');
    return patterns.map(p => p.data as unknown as LineageEntry);
  }

  /**
   * Trace backwards from an artifact to find everything that produced it.
   *
   * "What made this artifact?" — follows the chain back through all pipeline
   * stages that contributed to this artifact's existence.
   *
   * Uses dual-strategy matching to handle incomplete records:
   *   - Finds entries whose outputs[] contain this artifactId (producer recorded consumer)
   *   - Finds entries that this artifact's inputs[] point to (consumer recorded producer)
   * Both sets are merged and deduplicated via the visited set.
   *
   * Result is the complete ancestor tree, not just the immediate parent.
   * Recursion follows each found entry upstream until the chain is exhausted.
   *
   * @param artifactId - The artifact to trace upstream from
   * @returns All lineage entries that contributed (directly or transitively) to this artifact
   */
  async getUpstream(artifactId: string): Promise<LineageEntry[]> {
    const all = await this.loadAll();
    const result: LineageEntry[] = [];
    const visited = new Set<string>([artifactId]);
    this.traceUpstream(artifactId, all, result, visited);
    return result;
  }

  /**
   * Trace forwards from an artifact to find everything it enabled.
   *
   * "What did this artifact produce?" — follows the chain forward through all
   * pipeline stages that consumed this artifact as input.
   *
   * Mirror of getUpstream(), but in the forward direction:
   *   - Finds entries whose inputs[] contain this artifactId (consumer recorded producer)
   *   - Finds entries that this artifact's outputs[] point to (producer recorded consumer)
   *
   * Recursion follows each found entry downstream until the chain is exhausted.
   *
   * @param artifactId - The artifact to trace downstream from
   * @returns All lineage entries that were enabled (directly or transitively) by this artifact
   */
  async getDownstream(artifactId: string): Promise<LineageEntry[]> {
    const all = await this.loadAll();
    const result: LineageEntry[] = [];
    const visited = new Set<string>([artifactId]);
    this.traceDownstream(artifactId, all, result, visited);
    return result;
  }

  /**
   * Get all lineage entries of a specific artifact type.
   *
   * ArtifactType filters the lineage store to a single class of artifact:
   * only observations, only patterns, only scripts, only decisions, etc.
   *
   * Useful for answering: "show me all promoted scripts in the lineage record"
   * or "show me all gatekeeper decisions that were made."
   *
   * Does not perform recursive traversal — returns flat list of matching entries.
   *
   * @param artifactType - The artifact type to filter by (from ArtifactType enum)
   * @returns All lineage entries matching the specified artifact type
   */
  async getByArtifactType(artifactType: ArtifactType): Promise<LineageEntry[]> {
    const all = await this.loadAll();
    return all.filter(e => e.artifactType === artifactType);
  }

  /**
   * Get the complete lineage chain for an artifact: self + upstream + downstream.
   *
   * Returns a LineageChain with three fields:
   *   artifact:   the entry for this artifactId itself (the "self" node)
   *   upstream:   all entries that contributed to this artifact (ancestors)
   *   downstream: all entries this artifact enabled (descendants)
   *
   * This is the full picture: where it came from and where it went.
   *
   * Throws if the artifactId is not found in the lineage store — callers
   * must handle this case (the artifact may not have been recorded yet,
   * or was from a stage that doesn't record lineage).
   *
   * @param artifactId - The artifact to get the full chain for
   * @returns LineageChain with artifact, upstream tree, and downstream tree
   * @throws Error if the artifact is not found in the lineage store
   */
  async getChain(artifactId: string): Promise<LineageChain> {
    const all = await this.loadAll();
    const selfEntry = all.find(e => e.artifactId === artifactId);

    if (!selfEntry) {
      throw new Error(`Artifact not found: ${artifactId}`);
    }

    const upstream: LineageEntry[] = [];
    const upVisited = new Set<string>([artifactId]);
    this.traceUpstream(artifactId, all, upstream, upVisited);

    const downstream: LineageEntry[] = [];
    const downVisited = new Set<string>([artifactId]);
    this.traceDownstream(artifactId, all, downstream, downVisited);

    return {
      artifact: selfEntry,
      upstream,
      downstream,
    };
  }

  /**
   * Recursive upstream traversal — finds all ancestors of an artifact.
   *
   * Dual-strategy matching prevents gaps when either side of a relationship
   * omits the other in its record:
   *
   *   Strategy 1 (producer-recorded): entries whose outputs[] contain artifactId
   *     "I know what I produced — and I produced you"
   *
   *   Strategy 2 (consumer-recorded): entries listed in this artifact's inputs[]
   *     "I know where I came from — and I came from you"
   *
   * The visited set prevents cycles and duplicate entries when both strategies
   * match the same entry. Recursion depth is bounded by pipeline stage count (6).
   *
   * @param artifactId - Current artifact being traced
   * @param all - All lineage entries (full store snapshot)
   * @param result - Accumulator for found ancestors
   * @param visited - Cycle guard and deduplication set
   */
  private traceUpstream(
    artifactId: string,
    all: LineageEntry[],
    result: LineageEntry[],
    visited: Set<string>,
  ): void {
    // Strategy 1: Find entries whose outputs contain this artifactId
    const producersViaOutputs = all.filter(
      e => e.outputs.includes(artifactId) && !visited.has(e.artifactId)
    );

    // Strategy 2: Find the entry for this artifactId and trace its inputs
    const selfEntry = all.find(e => e.artifactId === artifactId);
    const inputIds = selfEntry?.inputs ?? [];
    const producersViaInputs = all.filter(
      e => inputIds.includes(e.artifactId) && !visited.has(e.artifactId)
    );

    // Merge both sets (deduplicate via visited set)
    const combined = [...producersViaOutputs, ...producersViaInputs];
    for (const entry of combined) {
      if (visited.has(entry.artifactId)) continue;
      visited.add(entry.artifactId);
      result.push(entry);
      this.traceUpstream(entry.artifactId, all, result, visited);
    }
  }

  /**
   * Recursive downstream traversal — finds all descendants of an artifact.
   *
   * Mirror of traceUpstream() but in the forward direction.
   * Same dual-strategy matching ensures completeness across incomplete records:
   *
   *   Strategy 1 (consumer-recorded): entries whose inputs[] contain artifactId
   *     "I know where I came from — I came from you"
   *
   *   Strategy 2 (producer-recorded): entries listed in this artifact's outputs[]
   *     "I know what I produced — I produced you"
   *
   * @param artifactId - Current artifact being traced
   * @param all - All lineage entries (full store snapshot)
   * @param result - Accumulator for found descendants
   * @param visited - Cycle guard and deduplication set
   */
  private traceDownstream(
    artifactId: string,
    all: LineageEntry[],
    result: LineageEntry[],
    visited: Set<string>,
  ): void {
    // Strategy 1: Find entries whose inputs contain this artifactId
    const consumersViaInputs = all.filter(
      e => e.inputs.includes(artifactId) && !visited.has(e.artifactId)
    );

    // Strategy 2: Find the entry for this artifactId and trace its outputs
    const selfEntry = all.find(e => e.artifactId === artifactId);
    const outputIds = selfEntry?.outputs ?? [];
    const consumersViaOutputs = all.filter(
      e => outputIds.includes(e.artifactId) && !visited.has(e.artifactId)
    );

    // Merge both sets
    const combined = [...consumersViaInputs, ...consumersViaOutputs];
    for (const entry of combined) {
      if (visited.has(entry.artifactId)) continue;
      visited.add(entry.artifactId);
      result.push(entry);
      this.traceDownstream(entry.artifactId, all, result, visited);
    }
  }
}

export { LineageTracker };
