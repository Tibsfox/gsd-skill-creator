import { PatternStore } from '../storage/pattern-store.js';
import type { LineageEntry, LineageChain, ArtifactType } from '../types/observation.js';

/**
 * Provides full provenance tracking across all 6 pipeline stages.
 *
 * Each stage records a LineageEntry containing artifact ID, type, stage,
 * inputs, outputs, and metadata. Entries are stored to PatternStore 'lineage'
 * category. Bidirectional querying enables tracing any artifact upstream or
 * downstream through the full pipeline chain.
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
   * Store a lineage entry to PatternStore 'lineage' category.
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
   * Read all lineage entries from the store and convert to LineageEntry objects.
   */
  private async loadAll(): Promise<LineageEntry[]> {
    const patterns = await this.store.read('lineage');
    return patterns.map(p => p.data as unknown as LineageEntry);
  }

  /**
   * Trace backwards recursively from an artifact to find what produced it.
   *
   * An entry is upstream of `artifactId` if:
   * - Its outputs array contains `artifactId`, OR
   * - The entry for `artifactId` lists it in its inputs array
   */
  async getUpstream(artifactId: string): Promise<LineageEntry[]> {
    const all = await this.loadAll();
    const result: LineageEntry[] = [];
    const visited = new Set<string>([artifactId]);
    this.traceUpstream(artifactId, all, result, visited);
    return result;
  }

  /**
   * Trace forwards recursively from an artifact to find what it produced.
   *
   * An entry is downstream of `artifactId` if:
   * - Its inputs array contains `artifactId`, OR
   * - The entry for `artifactId` lists it in its outputs array
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
   * Useful for filtering entries to show only observations, patterns, scripts, etc.
   *
   * @param artifactType - The artifact type to filter by
   * @returns All lineage entries matching the specified type
   */
  async getByArtifactType(artifactType: ArtifactType): Promise<LineageEntry[]> {
    const all = await this.loadAll();
    return all.filter(e => e.artifactType === artifactType);
  }

  /**
   * Get the full lineage chain for an artifact: upstream + downstream.
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
