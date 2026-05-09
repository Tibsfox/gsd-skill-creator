/**
 * Test-fixture types for the SCRIBE sample-provenance corpus.
 *
 * Substrate source-of-truth:
 *   .planning/missions/v1-49-621-scribe/t5-retrieval-provenance/sample-provenance/seed.sql
 *   .planning/missions/v1-49-621-scribe/t5-retrieval-provenance/sample-provenance/commits-sample.json
 *
 * The corpus is the 32-node sample T4 dashboard + T5 PROV-O share. Component 09's
 * integration tests build on this corpus shape; cartridge consumers (Components
 * 02, 05) load fixtures matching these shapes for hermetic test runs.
 *
 * @module scribe/types/test-fixtures
 */

import type { ProvNode, ProvEdge, NodeType, ProvRelation } from './prov.js';

/**
 * The shape of a single sample-provenance corpus loaded from `seed.sql` rows.
 *
 * Mirrors what `pg.query('SELECT * FROM prov_node, prov_edge')` returns when
 * applied against a freshly-seeded scribe-demo schema. Used by:
 *   - Component 02 unit tests (mock corpus for upstream/downstream)
 *   - Component 05 integration tests (round-trip event POST + verify)
 *   - Component 09 integration tests (cross-component flow validation)
 */
export interface SampleProvenanceCorpus {
  readonly nodes: ReadonlyArray<ProvNode>;
  readonly edges: ReadonlyArray<ProvEdge>;
  /** Total node count in the seed corpus. Substrate target = 32 nodes. */
  readonly nodeCount: number;
  /** Total edge count. */
  readonly edgeCount: number;
  /** Optional metadata about the corpus origin. */
  readonly origin?: SampleCorpusOrigin;
}

export interface SampleCorpusOrigin {
  /** Where seed.sql lives relative to repo root. */
  readonly seedSqlPath: string;
  /** Where commits-sample.json lives relative to repo root. */
  readonly commitsSamplePath: string;
  /** Date the corpus was generated (ISO-8601 day). */
  readonly generatedAt?: string;
}

/**
 * Histogram of node counts grouped by `node_type`. Useful for assertions like
 * "the seed corpus contains exactly N agents and M activities."
 */
export type NodeTypeHistogram = Readonly<Record<NodeType, number>>;

/**
 * Histogram of edge counts grouped by `relation`.
 */
export type RelationHistogram = Readonly<Partial<Record<ProvRelation, number>>>;

/**
 * Optional shape for the `commits-sample.json` companion file. The seeder reads
 * this and emits the `seed.sql` INSERTs. Tests that want to verify the seeder
 * is round-trippable load this shape and compare against `SampleProvenanceCorpus`.
 */
export interface CommitsSample {
  readonly version: '1.0.0';
  readonly generatedAt: string;
  readonly commits: ReadonlyArray<CommitsSampleEntry>;
  readonly sessions?: ReadonlyArray<CommitsSessionEntry>;
}

export interface CommitsSampleEntry {
  readonly sha: string;
  readonly subject: string;
  readonly body?: string;
  readonly author: string;
  readonly authoredAt: string;
  readonly linesChanged?: number;
  readonly missionTag?: string;
}

export interface CommitsSessionEntry {
  readonly sessionId: string;
  readonly mission: string;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly commits: ReadonlyArray<string>;
  readonly eventCount?: number;
  readonly synthesized?: boolean;
}

/**
 * Helper type used by the substrate-conformance test: maps a
 * `SampleProvenanceCorpus` to the histograms above for invariant assertions.
 */
export interface CorpusHistogram {
  readonly byNodeType: NodeTypeHistogram;
  readonly byRelation: RelationHistogram;
  readonly totalNodes: number;
  readonly totalEdges: number;
}

/**
 * Compute a histogram from a corpus. Pure function; no I/O. Used by tests.
 */
export function computeCorpusHistogram(
  corpus: SampleProvenanceCorpus,
): CorpusHistogram {
  const byNodeType: Record<NodeType, number> = {
    Entity: 0,
    Activity: 0,
    Agent: 0,
    Plan: 0,
    Bundle: 0,
    Collection: 0,
  };
  const byRelation: Partial<Record<ProvRelation, number>> = {};

  for (const n of corpus.nodes) {
    byNodeType[n.node_type] = (byNodeType[n.node_type] ?? 0) + 1;
  }
  for (const e of corpus.edges) {
    byRelation[e.relation] = (byRelation[e.relation] ?? 0) + 1;
  }

  return Object.freeze({
    byNodeType: Object.freeze(byNodeType),
    byRelation: Object.freeze(byRelation),
    totalNodes: corpus.nodes.length,
    totalEdges: corpus.edges.length,
  });
}
