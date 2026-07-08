/**
 * Relation Store — durable persistence for memory relations (MEM-5).
 *
 * `MemoryService.relate()` previously pushed relations into an in-process
 * array that vanished on restart and was never queried. This sidecar persists
 * the `MemoryRelation` graph as a single JSON file next to the LOD-300 memory
 * files, so relations survive restarts even in the default FileStore-only
 * deployment (no PostgreSQL required). When a PgStore LOD-400 tier is present
 * the service additionally mirrors relations into its `memory_relations`
 * table, but this sidecar is the backend-independent source of truth for the
 * read path.
 *
 * The file is a plain JSON array of relations with ISO-8601 date strings.
 * Writes are atomic (temp file + rename) so an interrupted write never leaves
 * a truncated graph.
 *
 * @module memory/relation-store
 */

import { readFile, writeFile, rename, mkdir, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { MemoryRelation, RelationType } from './types.js';
import { ensureAllowed, type LoaderContext } from '../security/loader-context.js';

const LOADER_SOURCE = 'memory/relation-store';

/** On-disk shape — dates serialized as ISO strings. */
interface SerializedRelation {
  id: string;
  subjectId: string;
  predicate: RelationType;
  objectId: string;
  validFrom: string;
  validTo: string | null;
  confidence: number;
  createdAt: string;
}

function serialize(r: MemoryRelation): SerializedRelation {
  return {
    id: r.id,
    subjectId: r.subjectId,
    predicate: r.predicate,
    objectId: r.objectId,
    validFrom: r.validFrom.toISOString(),
    validTo: r.validTo ? r.validTo.toISOString() : null,
    confidence: r.confidence,
    createdAt: r.createdAt.toISOString(),
  };
}

function deserialize(s: SerializedRelation): MemoryRelation {
  return {
    id: s.id,
    subjectId: s.subjectId,
    predicate: s.predicate,
    objectId: s.objectId,
    validFrom: new Date(s.validFrom),
    validTo: s.validTo ? new Date(s.validTo) : null,
    confidence: s.confidence,
    createdAt: new Date(s.createdAt),
  };
}

/**
 * File-backed durable store for memory relations.
 *
 * LoaderContext chokepoint (Tier-E, v1.49.782): the basename ends in `store`
 * so the audit test requires an `ensureAllowed()` gate. Read methods gate on
 * `this.filePath`; the write-side `persist()` is out of scope per the
 * read-side design (#10457).
 */
export class FileRelationStore {
  /** In-memory copy, shared by reference across reads so concurrent adds
   * accumulate rather than clobber. Built lazily on first access. */
  private cache: MemoryRelation[] | null = null;

  /** Monotonic per-instance counter for unique temp-file names. */
  private tmpCounter = 0;

  private readonly ctx?: LoaderContext;

  constructor(private readonly filePath: string, ctx?: LoaderContext) {
    this.ctx = ctx;
  }

  /** All persisted relations (cached after the first read). */
  async all(): Promise<MemoryRelation[]> {
    ensureAllowed(this.ctx, LOADER_SOURCE, 'read-file', this.filePath);
    if (!this.cache) {
      this.cache = await this.load();
    }
    return this.cache;
  }

  /**
   * Persist a relation. Idempotent: a relation whose `id`, or whose active
   * `(subjectId, predicate, objectId)` tuple, already exists is not
   * duplicated. Returns true when newly added.
   */
  async add(relation: MemoryRelation): Promise<boolean> {
    const relations = await this.all();
    const duplicate = relations.some(
      (r) =>
        r.id === relation.id ||
        (r.validTo === null &&
          r.subjectId === relation.subjectId &&
          r.predicate === relation.predicate &&
          r.objectId === relation.objectId),
    );
    if (duplicate) return false;

    relations.push(relation);
    await this.persist(relations);
    return true;
  }

  /** Active relations where the memory is the subject or the object. */
  async getForMemory(memoryId: string): Promise<MemoryRelation[]> {
    const relations = await this.all();
    return relations.filter(
      (r) =>
        r.validTo === null &&
        (r.subjectId === memoryId || r.objectId === memoryId),
    );
  }

  /**
   * One-hop neighbor IDs — the opposite endpoint of every active relation
   * touching `memoryId`. Self-relations are excluded.
   */
  async getRelatedIds(memoryId: string): Promise<string[]> {
    const relations = await this.getForMemory(memoryId);
    const ids = new Set<string>();
    for (const r of relations) {
      ids.add(r.subjectId === memoryId ? r.objectId : r.subjectId);
    }
    ids.delete(memoryId);
    return [...ids];
  }

  // ─── Private ──────────────────────────────────────────────────────────

  private async load(): Promise<MemoryRelation[]> {
    try {
      const raw = await readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as SerializedRelation[];
      if (!Array.isArray(parsed)) return [];
      return parsed.map(deserialize);
    } catch {
      // Missing or unreadable file → empty graph.
      return [];
    }
  }

  /**
   * Atomically write the full relation set. Write-side, so intentionally
   * out of the LoaderContext read-side chokepoint (#10457). Temp file +
   * rename means an interrupted write never truncates the live file.
   */
  private async persist(relations: MemoryRelation[]): Promise<void> {
    this.cache = relations;
    await mkdir(dirname(this.filePath), { recursive: true }).catch(() => {});

    const body = JSON.stringify(relations.map(serialize), null, 2);
    const tmp = `${this.filePath}.tmp-${process.pid}-${++this.tmpCounter}`;
    try {
      await writeFile(tmp, body, 'utf-8');
      await rename(tmp, this.filePath);
    } catch (err) {
      await unlink(tmp).catch(() => {});
      throw err;
    }
  }
}
