/**
 * Finding → memory mirror — the intelligence KB's write path into pgvector.
 *
 * The intelligence-investigator writes per-project findings (severity,
 * confidence, rationale, source_path) into per-project SQLite KBStores. Those
 * findings are invisible to the cross-project memory corpus. This module mirrors
 * an open finding into the unified memory store as a first-class 'finding'
 * MemoryRecord: embedded via an EmbeddingService-shaped embedder and written
 * through a PgStore-shaped writer, making it semantically recallable via
 * MemoryService.query and federatable across repos (each record carries its
 * project provenance, so findings from different repos coexist and co-recall).
 *
 * HARD BOUNDARY: this path only ever produces a recallable memory record. It
 * never mutates a skill, agent, or the finding's own status. The finding stays
 * the source of truth in its project KB; the memory is a mirror.
 *
 * Embedding is done here (the writer's `store` does not embed a MemoryRecord):
 * the record is stored, then its vector is written via `storeEmbedding`. An
 * optional per-finding embedding cache lets an unchanged finding skip
 * re-embedding on a later mirror pass.
 */

import { createHash } from 'node:crypto';
import type { Finding } from './types.js';
import type { MemoryRecord } from '../memory/types.js';

/** Namespace UUID for deriving stable memory IDs from finding ids. */
const FINDING_MEMORY_NAMESPACE = 'b6e4d3f2-0000-5000-8000-66696e64696e';

/**
 * Derive a stable, valid v5-shaped UUID from a key so re-mirroring the same
 * finding overwrites its memory rather than duplicating it (idempotent).
 */
function deterministicId(key: string): string {
  const h = createHash('sha1')
    .update(FINDING_MEMORY_NAMESPACE)
    .update(key)
    .digest('hex');
  const variant = ((parseInt(h.slice(16, 17), 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** The text embedded for a finding — the semantically meaningful surface. */
export function findingText(finding: Finding): string {
  return [finding.title, finding.rationale, finding.source_path ?? '']
    .filter((s) => s.length > 0)
    .join('\n');
}

/**
 * Convert an intelligence finding into a recallable memory record.
 *
 * Pure: given the same finding + project it yields the same record (stable id,
 * timestamps derived from the finding's own `produced_at`). The record is a
 * 'finding' — project-scoped, internal, seasonal (findings decay as a project
 * moves on). Kind and severity ride in tags so a federated recall can rebuild
 * the finding facets without a second lookup.
 */
export function findingToMemoryRecord(
  finding: Finding,
  opts: { project: string; branch?: string },
): MemoryRecord {
  const producedAt = new Date(finding.produced_at);
  const validFrom = Number.isNaN(producedAt.getTime()) ? new Date() : producedAt;

  const content = [
    finding.rationale,
    '',
    `Kind: ${finding.kind}`,
    `Severity: ${finding.severity}`,
    `Confidence: ${finding.confidence.toFixed(3)}`,
    finding.source_path ? `Source: ${finding.source_path}` : '',
    `Produced by: ${finding.produced_by}`,
  ]
    .filter((line) => line.length > 0)
    .join('\n');

  return {
    id: deterministicId(finding.id),
    type: 'finding',
    name: finding.title,
    description: finding.title,
    content,
    lodCurrent: 400,
    tags: [
      'intelligence-finding',
      `finding:${finding.kind}`,
      `severity:${finding.severity}`,
    ],
    confidence: finding.confidence,
    validFrom,
    validTo: null,
    createdAt: validFrom,
    updatedAt: validFrom,
    lastAccessed: validFrom,
    accessCount: 0,
    provenance: {
      scope: 'project',
      visibility: 'internal',
      project: opts.project,
      branch: opts.branch,
      domains: [],
    },
    temporalClass: 'seasonal',
    sourceFile: finding.source_path,
    relatedTo: [],
  };
}

/** Read surface for open findings — KBStore satisfies this structurally. */
export interface FindingSource {
  listOpenFindings(projectId: string): Promise<Finding[]>;
}

/**
 * Optional per-finding embedding cache — KBStore satisfies this structurally
 * once the v4 `findings.embedding` column exists. When supplied, an unchanged
 * finding's cached vector is reused instead of re-embedding it every pass.
 */
export interface FindingEmbeddingCache {
  getFindingEmbedding(projectId: string, findingId: string): Promise<number[] | null>;
  setFindingEmbedding(projectId: string, findingId: string, embedding: number[]): Promise<void>;
}

/** Embedding surface — EmbeddingService.embed satisfies this structurally. */
export interface FindingEmbedder {
  embed(text: string): Promise<{ embedding: number[] }>;
}

/**
 * Write surface — PgStore satisfies this structurally (`store` returns void,
 * MemoryService returns the record; both are accepted). `storeEmbedding`
 * persists the finding's vector for pgvector similarity search.
 */
export interface FindingMemoryWriter {
  store(record: MemoryRecord): Promise<unknown>;
  storeEmbedding(id: string, embedding: number[]): Promise<void>;
}

export interface FindingMemorySyncDeps {
  source: FindingSource;
  embedder: FindingEmbedder;
  writer: FindingMemoryWriter;
  /** Optional local embedding cache (the SQLite `findings.embedding` column). */
  cache?: FindingEmbeddingCache;
}

export interface SyncResult {
  /** Memory records mirrored into the store. */
  mirrored: MemoryRecord[];
  /** Findings whose embedding was served from the cache (not recomputed). */
  cacheHits: number;
  /** Findings that were embedded fresh this pass. */
  embedded: number;
}

/**
 * Mirrors open intelligence findings into the unified memory store.
 *
 * Opt-in wiring: nothing constructs this by default, so the KBStore→pgvector
 * bridge is an explicit call. Default runtime behavior (and DB requirements)
 * are unchanged until a caller builds one.
 */
export class FindingMemorySync {
  constructor(private readonly deps: FindingMemorySyncDeps) {}

  /**
   * Mirror every open finding for a project into the memory store.
   *
   * @param projectId — the KBStore project id (source key)
   * @param projectName — the repo/project name stamped as memory provenance
   *   (the cross-project recall join key); defaults to `projectId`.
   */
  async syncProject(projectId: string, projectName?: string): Promise<SyncResult> {
    const findings = await this.deps.source.listOpenFindings(projectId);
    const result: SyncResult = { mirrored: [], cacheHits: 0, embedded: 0 };

    for (const finding of findings) {
      const record = findingToMemoryRecord(finding, {
        project: projectName ?? projectId,
      });

      let embedding: number[] | null = null;
      if (this.deps.cache) {
        embedding = await this.deps.cache.getFindingEmbedding(projectId, finding.id);
        if (embedding && embedding.length > 0) result.cacheHits++;
        else embedding = null;
      }

      if (!embedding) {
        const res = await this.deps.embedder.embed(findingText(finding));
        embedding = res.embedding;
        result.embedded++;
        if (this.deps.cache && embedding.length > 0) {
          await this.deps.cache.setFindingEmbedding(projectId, finding.id, embedding);
        }
      }

      await this.deps.writer.store(record);
      if (embedding.length > 0) {
        await this.deps.writer.storeEmbedding(record.id, embedding);
      }
      result.mirrored.push(record);
    }

    return result;
  }
}

/** Factory mirroring the createMemorySink opt-in wiring convention. */
export function createFindingMemorySync(deps: FindingMemorySyncDeps): FindingMemorySync {
  return new FindingMemorySync(deps);
}
