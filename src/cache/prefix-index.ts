/**
 * M5 — Prefix-Aware Radix-Tree Cache.
 *
 * Keys an insertion-order (FIFO) cache by skill-prefix hash. Given a sequence
 * of recently-fired skills (`prefix`), returns the set of skill ids that
 * have historically appeared next. Backed by a compact radix-tree where each
 * edge carries a label (one skill-id hop) and each internal node carries an
 * optional `PrefixCacheHit` payload.
 *
 * Eviction: FIFO on payload count — entries are evicted in insertion order
 * once `maxEntries` is exceeded. Radix-tree nodes with no payload and no
 * descendant payloads are pruned.
 *
 * NEW-LAYER discipline: no Grove, no filesystem, no side effects. This module
 * is an in-memory lookup structure only.
 *
 * @module cache/prefix-index
 */

import type { PrefixCacheHit } from '../types/memory.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PrefixIndexOptions {
  /**
   * Maximum number of distinct prefix entries retained. Excess entries are
   * evicted in insertion (FIFO) order. Default: 2048.
   */
  maxEntries?: number;

  /**
   * Maximum prefix length (in hops) that the tree will index. Longer prefixes
   * are truncated (rightmost `maxPrefixLen` skills retained) to bound tree
   * depth. Default: 8.
   */
  maxPrefixLen?: number;
}

interface RadixNode {
  /** Children keyed by next skill-id hop. */
  children: Map<string, RadixNode>;
  /** Payload at this path, if any. */
  hit: PrefixCacheHit | null;
  /** Insertion order counter for FIFO eviction. */
  insertionSeq: number;
}

// ─── PrefixIndex ────────────────────────────────────────────────────────────

/**
 * Radix-tree backed prefix cache, insertion-order (FIFO) evicted.
 */
export class PrefixIndex {
  private readonly maxEntries: number;
  private readonly maxPrefixLen: number;
  private readonly root: RadixNode;
  private seqCounter = 0;

  /** Track (prefixId -> node ref) to support eviction without re-walking. */
  private readonly entries = new Map<string, { node: RadixNode; path: string[] }>();

  /** Track insertion-order FIFO for eviction. */
  private readonly insertionOrder: string[] = [];

  /** Total lookup attempts. */
  private lookups = 0;
  /** Lookups that found a payload. */
  private hits = 0;

  constructor(opts: PrefixIndexOptions = {}) {
    this.maxEntries = opts.maxEntries ?? 2048;
    this.maxPrefixLen = opts.maxPrefixLen ?? 8;
    if (this.maxEntries <= 0) {
      throw new RangeError(`maxEntries must be > 0, got ${this.maxEntries}`);
    }
    if (this.maxPrefixLen <= 0) {
      throw new RangeError(`maxPrefixLen must be > 0, got ${this.maxPrefixLen}`);
    }
    this.root = this._makeNode();
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Record that `skillIds` appeared in execution after `prefix`. Merges into
   * any existing payload at the prefix path. Returns the stored payload.
   */
  record(prefix: string[], skillIds: string[]): PrefixCacheHit {
    const path = this._truncatePrefix(prefix);
    const prefixId = this._prefixId(path);

    let node = this.root;
    for (const hop of path) {
      let child = node.children.get(hop);
      if (!child) {
        child = this._makeNode();
        node.children.set(hop, child);
      }
      node = child;
    }

    if (node.hit === null) {
      node.hit = { prefixId, skillIds: [...new Set(skillIds)], hitCount: 0 };
      node.insertionSeq = this.seqCounter++;
      this.entries.set(prefixId, { node, path });
      this.insertionOrder.push(prefixId);
      this._evictIfNeeded();
    } else {
      // Merge new skillIds into existing payload (dedup).
      const merged = new Set(node.hit.skillIds);
      for (const s of skillIds) merged.add(s);
      node.hit.skillIds = [...merged];
    }

    return node.hit;
  }

  /**
   * Look up predicted skills for a prefix. Returns null if the prefix has no
   * payload. Increments `hitCount` on the stored payload.
   */
  lookup(prefix: string[]): PrefixCacheHit | null {
    this.lookups++;
    const path = this._truncatePrefix(prefix);
    let node = this.root;
    for (const hop of path) {
      const child = node.children.get(hop);
      if (!child) return null;
      node = child;
    }
    if (node.hit === null) return null;
    node.hit.hitCount++;
    this.hits++;
    // Return a shallow copy so callers cannot mutate internal state.
    return { ...node.hit, skillIds: [...node.hit.skillIds] };
  }

  /** Hit-rate over the life of this cache. */
  hitRate(): number {
    if (this.lookups === 0) return 0;
    return this.hits / this.lookups;
  }

  /** Number of distinct prefix entries currently stored. */
  size(): number {
    return this.entries.size;
  }

  /** Total lookup attempts. */
  get lookupCount(): number {
    return this.lookups;
  }

  /** Total successful lookups. */
  get hitCount(): number {
    return this.hits;
  }

  /** Reset all state (useful for tests and between sessions). */
  clear(): void {
    this.root.children.clear();
    this.root.hit = null;
    this.entries.clear();
    this.insertionOrder.length = 0;
    this.seqCounter = 0;
    this.lookups = 0;
    this.hits = 0;
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private _makeNode(): RadixNode {
    return {
      children: new Map(),
      hit: null,
      insertionSeq: -1,
    };
  }

  private _truncatePrefix(prefix: string[]): string[] {
    if (prefix.length <= this.maxPrefixLen) return prefix;
    return prefix.slice(prefix.length - this.maxPrefixLen);
  }

  private _prefixId(path: string[]): string {
    // Simple, deterministic. Use a separator unlikely to appear in skill ids.
    return path.join('\u0001');
  }

  private _evictIfNeeded(): void {
    while (this.entries.size > this.maxEntries && this.insertionOrder.length > 0) {
      const victim = this.insertionOrder.shift();
      if (victim === undefined) break;
      const record = this.entries.get(victim);
      if (!record) continue;
      this.entries.delete(victim);
      // Clear the payload in the tree but leave structural nodes — they may
      // be shared with live prefixes.
      record.node.hit = null;
      this._prune(this.root, record.path, 0);
    }
  }

  /**
   * Walk back down the path; drop nodes that have no payload and no children
   * to keep the tree compact.
   */
  private _prune(node: RadixNode, path: string[], depth: number): boolean {
    if (depth === path.length) {
      return node.hit === null && node.children.size === 0;
    }
    const hop = path[depth];
    const child = node.children.get(hop);
    if (!child) return node.hit === null && node.children.size === 0;
    const childEmpty = this._prune(child, path, depth + 1);
    if (childEmpty) {
      node.children.delete(hop);
    }
    return node.hit === null && node.children.size === 0;
  }
}
