/**
 * SkillCodebase — the high-level facade over Grove + SkillView + GroveNamespace.
 *
 * This is the one class `gsd-skill-creator` talks to. It hides the Grove
 * substrate, the arena, and the namespace chain behind an API that
 * matches how skill authors actually think about skills:
 *
 *     const codebase = new SkillCodebase({ cas });
 *     await codebase.define(spec);
 *     const resolved = await codebase.resolve('vision-to-mission');
 *     const deps = await codebase.dependencyGraph(resolved.hash);
 *     const history = await codebase.history('vision-to-mission');
 *
 * The facade is where the closed loop closes:
 *
 *   1. Caller invokes by name
 *   2. GroveNamespace resolves name → record hash
 *   3. ContentAddressedStore fetches the record bytes
 *   4. SkillView decodes the SkillSpec
 *   5. Optional dependency graph walk pulls transitive dependencies
 *   6. Caller gets a ready-to-execute SkillSpec
 *
 * It is also the minimal surface a user would wire into `SkillCreatorDeps`
 * to run the arena-backed codebase in production without knowing anything
 * about Grove or the arena itself.
 *
 * @module mesh/skill-codebase
 */

import type { GroveStore } from '../memory/grove-store.js';
import { GroveNamespace, type BindOptions } from './grove-namespace.js';
import {
  type SkillSpec,
  type BuildSkillOptions,
  buildSkillRecord,
  parseSkillRecordBytes,
  recordHashOf,
  serializeSkillRecord,
} from './skill-view.js';
import { type HashRef, hashRefEquals } from '../memory/grove-format.js';

// ─── Public types ───────────────────────────────────────────────────────────

export interface SkillCodebaseOptions {
  /** The content-addressed store backing all record storage. */
  cas: GroveStore;
  /** Optional preconstructed namespace. Otherwise one is created from `cas`. */
  namespace?: GroveNamespace;
}

/** A resolved skill lookup result with both the parsed spec and its hash. */
export interface ResolvedSkill {
  name: string;
  hash: HashRef;
  spec: SkillSpec;
  /** The full GroveRecord envelope for advanced callers. */
  record: ReturnType<typeof parseSkillRecordBytes>['record'];
}

/** A node in a dependency graph walk. */
export interface DependencyNode {
  hash: HashRef;
  spec: SkillSpec;
  record: ReturnType<typeof parseSkillRecordBytes>['record'];
  /** Depth from the root (root = 0). */
  depth: number;
}

/** Options for the `define` operation. */
export interface DefineOptions extends BuildSkillOptions {
  /** Bind the skill's name to the new record's hash. Defaults to true. */
  bindName?: boolean;
  /**
   * If the name is already bound to a different hash, record that old
   * hash in the new record's `parentHashes` so evolution is traceable.
   * Defaults to true.
   */
  linkParent?: boolean;
}

export interface DefineResult {
  /** The identity hash of the new skill record. */
  hash: HashRef;
  /** True if this record was newly written (vs. a byte-identical match). */
  created: boolean;
  /** True if the skill's name was bound to this hash. */
  bound: boolean;
  /** The hash of the previous record this name pointed to, if any. */
  previousHash: HashRef | null;
}

// ─── SkillCodebase ──────────────────────────────────────────────────────────

export class SkillCodebase {
  private readonly cas: GroveStore;
  private readonly namespace: GroveNamespace;

  constructor(options: SkillCodebaseOptions) {
    this.cas = options.cas;
    this.namespace = options.namespace ?? new GroveNamespace(options.cas);
  }

  /** Access the underlying namespace for advanced operations. */
  getNamespace(): GroveNamespace {
    return this.namespace;
  }

  /** Access the underlying content-addressed store. */
  getStore(): GroveStore {
    return this.cas;
  }

  // ─── Define / store ───────────────────────────────────────────────────────

  /**
   * Create a new skill record, store it, and (optionally) bind the
   * skill's name to its hash.
   *
   * If a record with byte-identical content+provenance already exists,
   * the store dedupes and `created: false` is reported. If the name was
   * previously bound to a different hash, that prior hash is carried
   * into the new record's `parentHashes` so you can walk evolution.
   */
  async define(spec: SkillSpec, opts: DefineOptions = {}): Promise<DefineResult> {
    const bindName = opts.bindName ?? true;
    const linkParent = opts.linkParent ?? true;

    // Look up the previous binding so we can record it as a parent.
    const previousHash = bindName ? await this.namespace.resolve(spec.name) : null;

    // Merge the caller's parentHashes with the prior-binding hash (if linkParent).
    const parentHashes: HashRef[] = [...(opts.parentHashes ?? [])];
    if (linkParent && previousHash) {
      // Avoid duplicating if the caller already included it.
      if (!parentHashes.some((p) => hashRefEquals(p, previousHash))) {
        parentHashes.push(previousHash);
      }
    }

    const record = buildSkillRecord(spec, {
      ...opts,
      parentHashes,
    });
    const hash = recordHashOf(record);
    const bytes = serializeSkillRecord(record);

    const { created } = await this.cas.put(hash.hash, bytes);

    let bound = false;
    if (bindName) {
      await this.namespace.bind(spec.name, hash, {
        author: opts.author,
        sessionId: opts.sessionId,
        toolVersion: opts.toolVersion,
        createdAtMs: opts.createdAtMs,
      });
      bound = true;
    }

    return { hash, created, bound, previousHash };
  }

  // ─── Resolve / read ───────────────────────────────────────────────────────

  /**
   * Resolve a skill by name to its current record. Returns null if the
   * name is not bound or the bound record can't be fetched.
   */
  async resolve(name: string): Promise<ResolvedSkill | null> {
    const hash = await this.namespace.resolve(name);
    if (!hash) return null;
    return this.getByHash(name, hash);
  }

  /**
   * Fetch a skill record by hash regardless of any name binding. The
   * `name` argument is informational — used to populate `ResolvedSkill.name`.
   * Returns null if the hash is not present in the store.
   */
  async getByHash(name: string, hash: HashRef): Promise<ResolvedSkill | null> {
    const bytes = await this.cas.getByHash(hash.hash);
    if (!bytes) return null;
    const { spec, record } = parseSkillRecordBytes(bytes);
    return { name, hash, spec, record };
  }

  /**
   * Return every currently-bound skill name along with its resolved record.
   * Records that fail to resolve are skipped (warning path, not error).
   */
  async listActive(): Promise<ResolvedSkill[]> {
    const bindings = await this.namespace.listBindings();
    const results: ResolvedSkill[] = [];
    for (const [name, hash] of Object.entries(bindings)) {
      const resolved = await this.getByHash(name, hash);
      if (resolved) results.push(resolved);
    }
    results.sort((a, b) => a.name.localeCompare(b.name));
    return results;
  }

  /** Convenience: list the currently-bound names. */
  async listNames(): Promise<string[]> {
    const bindings = await this.namespace.listBindings();
    return Object.keys(bindings).sort();
  }

  // ─── Dependency graph ─────────────────────────────────────────────────────

  /**
   * Walk a skill's dependency graph starting from `root` using BFS.
   * Returns every reachable node, including the root, with its depth.
   * Cycles are detected by hash and visited nodes are only emitted once.
   * Missing dependencies are returned in the `missing` array — the walk
   * does not throw on dangling refs.
   */
  async dependencyGraph(
    root: HashRef,
    options: { maxDepth?: number } = {},
  ): Promise<{ nodes: DependencyNode[]; missing: HashRef[] }> {
    const maxDepth = options.maxDepth ?? Infinity;
    const nodes: DependencyNode[] = [];
    const missing: HashRef[] = [];
    const seen = new Set<string>();

    const queue: Array<{ hash: HashRef; depth: number }> = [{ hash: root, depth: 0 }];

    while (queue.length > 0) {
      const { hash, depth } = queue.shift()!;
      if (depth > maxDepth) continue;
      const key = hashKey(hash);
      if (seen.has(key)) continue;
      seen.add(key);

      const bytes = await this.cas.getByHash(hash.hash);
      if (!bytes) {
        missing.push(hash);
        continue;
      }
      const { spec, record } = parseSkillRecordBytes(bytes);
      nodes.push({ hash, spec, record, depth });

      for (const dep of spec.dependencies) {
        if (!seen.has(hashKey(dep))) {
          queue.push({ hash: dep, depth: depth + 1 });
        }
      }
    }

    return { nodes, missing };
  }

  /**
   * Typecheck-lite: verify that every transitive dependency of a skill
   * actually exists in the store. Returns `{ ok: true }` if all reachable
   * records resolve, otherwise `{ ok: false, missing: [...] }`.
   */
  async typecheck(root: HashRef): Promise<{ ok: boolean; missing: HashRef[] }> {
    const { missing } = await this.dependencyGraph(root);
    return { ok: missing.length === 0, missing };
  }

  // ─── History ──────────────────────────────────────────────────────────────

  /**
   * Walk a skill name's binding history. Returns newest-first list of
   * (namespace hash, skill hash, author, timestamp) entries. Unbinds
   * show up as `hash: null` steps.
   */
  async history(name: string) {
    return this.namespace.nameHistory(name);
  }

  /**
   * Walk a skill record's parent lineage — from the given hash backwards
   * through `parentHashes` — to reconstruct the evolution chain.
   * Returns newest-first, stopping on a dangling ref. Each step is a
   * ResolvedSkill with the same name as the root.
   */
  async lineage(name: string, hash: HashRef, maxSteps = 100): Promise<ResolvedSkill[]> {
    const out: ResolvedSkill[] = [];
    let cursor: HashRef | null = hash;
    let steps = 0;
    while (cursor && steps < maxSteps) {
      const resolved: ResolvedSkill | null = await this.getByHash(name, cursor);
      if (!resolved) break;
      out.push(resolved);
      // Follow the first parent. Branching parents are rare in skill
      // evolution; callers who need a full DAG should use
      // dependencyGraph + walkHistory directly.
      cursor = resolved.record.provenance.parentHashes[0] ?? null;
      steps++;
    }
    return out;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashKey(hash: HashRef): string {
  let out = `${hash.algoId}:`;
  for (let i = 0; i < hash.hash.length; i++) {
    out += hash.hash[i].toString(16).padStart(2, '0');
  }
  return out;
}
