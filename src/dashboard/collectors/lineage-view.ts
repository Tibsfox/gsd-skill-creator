import { PatternStore } from '../../storage/pattern-store.js';
import { LineageTracker } from '../../observation/lineage-tracker.js';
import type {
  LineageViewData,
  LineageGraphEntry,
  LineageNode,
  DashboardArtifactType,
} from '../../types/dashboard.js';
import type { LineageEntry } from '../../types/observation.js';

/**
 * Collects lineage graph data for all promoted artifacts by combining
 * PatternStore decisions with LineageTracker provenance chains.
 *
 * Satisfies DASH-03: Lineage graph view traces the promotion path for
 * any promoted artifact from observation through to current state.
 */
export class LineageViewCollector {
  private tracker: LineageTracker;
  private store: PatternStore;

  constructor(tracker: LineageTracker, store: PatternStore) {
    this.tracker = tracker;
    this.store = store;
  }

  /**
   * Collect lineage graphs for all promoted artifacts.
   * Reads decisions from PatternStore, finds matching lineage entries,
   * and builds full provenance chains.
   */
  async collect(): Promise<LineageViewData> {
    // Step 1: Find promoted artifacts from decisions category
    const decisions = await this.store.read('decisions');
    const promotedDecisions = decisions.filter(d => {
      const data = d.data as Record<string, unknown>;
      return data.approved === true;
    });

    if (promotedDecisions.length === 0) {
      return {
        graphs: [],
        totalPromoted: 0,
        collectedAt: new Date().toISOString(),
      };
    }

    // Step 2: Read all lineage entries to find matching decision artifacts
    const lineageEntries = await this.loadLineageEntries();

    // Step 3: For each promoted decision, find its lineage and build a graph
    const graphs: LineageGraphEntry[] = [];

    for (const decision of promotedDecisions) {
      const data = decision.data as Record<string, unknown>;
      const toolName = data.candidateToolName as string;
      const inputHash = data.candidateInputHash as string;
      const operationId = `${toolName}:${inputHash}`;

      // Find the decision artifact in lineage data
      const decisionArtifactId = this.findDecisionArtifactId(
        lineageEntries,
        operationId,
        toolName,
      );

      if (!decisionArtifactId) {
        // No lineage data for this promoted artifact -- skip gracefully
        continue;
      }

      // Build graph from lineage chain
      const graph = await this.buildGraph(decisionArtifactId, toolName);
      if (graph) {
        graphs.push(graph);
      }
    }

    return {
      graphs,
      totalPromoted: graphs.length,
      collectedAt: new Date().toISOString(),
    };
  }

  /**
   * Get the lineage graph for a specific artifact ID.
   */
  async getArtifactChain(artifactId: string): Promise<LineageGraphEntry | null> {
    try {
      const chain = await this.tracker.getChain(artifactId);
      const allEntries = [...chain.upstream, chain.artifact, ...chain.downstream];

      // Sort chronologically
      allEntries.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      // Extract toolName from metadata
      const toolName = this.extractToolName(allEntries);

      const nodes = allEntries.map(entry => this.toLineageNode(entry));

      return {
        promotedArtifactId: artifactId,
        toolName,
        chain: nodes,
        depth: nodes.length,
      };
    } catch {
      // Artifact not found in lineage
      return null;
    }
  }

  /**
   * Load all lineage entries from PatternStore.
   */
  private async loadLineageEntries(): Promise<LineageEntry[]> {
    const patterns = await this.store.read('lineage');
    return patterns.map(p => p.data as unknown as LineageEntry);
  }

  /**
   * Find the decision artifact ID in lineage data for a given operation.
   * Scans lineage entries for decision-type artifacts matching the operation.
   */
  private findDecisionArtifactId(
    lineageEntries: LineageEntry[],
    operationId: string,
    toolName: string,
  ): string | null {
    // Strategy 1: Look for decision artifacts whose ID contains the operation ID
    const decisionEntries = lineageEntries.filter(
      e => e.artifactType === 'decision' && e.artifactId.includes(operationId),
    );

    if (decisionEntries.length > 0) {
      return decisionEntries[0].artifactId;
    }

    // Strategy 2: Look for decision artifacts whose metadata matches
    const byMetadata = lineageEntries.filter(
      e =>
        e.artifactType === 'decision' &&
        e.metadata &&
        (e.metadata as Record<string, unknown>).toolName === toolName,
    );

    if (byMetadata.length > 0) {
      return byMetadata[0].artifactId;
    }

    return null;
  }

  /**
   * Build a LineageGraphEntry from a lineage chain starting at an artifact ID.
   */
  private async buildGraph(
    artifactId: string,
    toolName: string,
  ): Promise<LineageGraphEntry | null> {
    try {
      const chain = await this.tracker.getChain(artifactId);
      const allEntries = [...chain.upstream, chain.artifact, ...chain.downstream];

      // Sort chronologically
      allEntries.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      const nodes = allEntries.map(entry => this.toLineageNode(entry));

      return {
        promotedArtifactId: artifactId,
        toolName,
        chain: nodes,
        depth: nodes.length,
      };
    } catch {
      return null;
    }
  }

  /**
   * Convert a LineageEntry to a LineageNode for dashboard display.
   */
  private toLineageNode(entry: LineageEntry): LineageNode {
    return {
      artifactId: entry.artifactId,
      artifactType: entry.artifactType as DashboardArtifactType,
      stage: entry.stage,
      timestamp: entry.timestamp,
      metadata: entry.metadata ?? {},
    };
  }

  /**
   * Extract toolName from lineage entries metadata.
   */
  private extractToolName(entries: LineageEntry[]): string {
    for (const entry of entries) {
      if (entry.metadata && typeof (entry.metadata as Record<string, unknown>).toolName === 'string') {
        return (entry.metadata as Record<string, unknown>).toolName as string;
      }
    }
    return 'unknown';
  }
}
