/**
 * M2 Hierarchical Hybrid Memory — Long-Term Store
 *
 * JSONL append-only store persisted under `.planning/memory/long-term.jsonl`.
 * Entries are written one per line as JSON. The file is gitignored (runtime
 * state only — not a source artifact).
 *
 * Properties:
 *   - Append-only: lines are never modified, only appended.
 *   - FIFO eviction: entries older than `maxAgeMs` are pruned on `compact()`.
 *   - Summarisation: `summarize()` produces a single merged summary entry
 *     from a batch, preserving the referenced-entity set.
 *
 * This module is wired to the warm (ChromaDB) and cold (pg-store) tiers at
 * the read-write-reflect layer; the JSONL file is the primary durable store.
 *
 * @module memory/long-term
 */

import { appendFile, readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { MemoryEntry } from '../types/memory.js';

// ─── Config ───────────────────────────────────────────────────────────────────

export interface LongTermConfig {
  /**
   * Absolute or CWD-relative path to the JSONL file.
   * Default: `.planning/memory/long-term.jsonl`
   */
  path?: string;
  /**
   * Maximum age of entries in milliseconds before they can be pruned via
   * `compact()`. Default: 30 days.
   */
  maxAgeMs?: number;
  /**
   * Maximum number of entries before `compact()` also prunes oldest excess.
   * Default: 10_000.
   */
  maxEntries?: number;
}

const DEFAULT_PATH        = '.planning/memory/long-term.jsonl';
const DEFAULT_MAX_AGE_MS  = 30 * 24 * 60 * 60 * 1000; // 30 days
const DEFAULT_MAX_ENTRIES = 10_000;

// ─── LongTermMemory ───────────────────────────────────────────────────────────

/**
 * Append-only JSONL long-term memory store.
 *
 * @example
 * ```ts
 * const ltm = new LongTermMemory();
 * await ltm.append(entry);
 * const all = await ltm.load();
 * const summary = ltm.summarize(batch, 'refactoring session');
 * ```
 */
export class LongTermMemory {
  readonly path: string;
  readonly maxAgeMs: number;
  readonly maxEntries: number;

  constructor(config: LongTermConfig = {}) {
    this.path        = config.path        ?? DEFAULT_PATH;
    this.maxAgeMs    = config.maxAgeMs    ?? DEFAULT_MAX_AGE_MS;
    this.maxEntries  = config.maxEntries  ?? DEFAULT_MAX_ENTRIES;
  }

  // ─── Write ──────────────────────────────────────────────────────────────────

  /**
   * Append a single entry to the JSONL file.
   * Creates the file (and parent directories) if they do not exist.
   */
  async append(entry: MemoryEntry): Promise<void> {
    await this._ensureDir();
    const line = JSON.stringify(entry) + '\n';
    await appendFile(this.path, line, 'utf-8');
  }

  /**
   * Append multiple entries in a single write (one line per entry).
   */
  async appendMany(entries: MemoryEntry[]): Promise<void> {
    if (entries.length === 0) return;
    await this._ensureDir();
    const lines = entries.map((e) => JSON.stringify(e) + '\n').join('');
    await appendFile(this.path, lines, 'utf-8');
  }

  // ─── Read ────────────────────────────────────────────────────────────────────

  /**
   * Load all entries from disk. Returns empty array if the file does not exist.
   * Skips malformed lines (best-effort parse).
   */
  async load(): Promise<MemoryEntry[]> {
    let text: string;
    try {
      text = await readFile(this.path, 'utf-8');
    } catch {
      return [];
    }

    const entries: MemoryEntry[] = [];
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const entry = JSON.parse(trimmed) as MemoryEntry;
        entries.push(entry);
      } catch {
        // Skip malformed lines
      }
    }
    return entries;
  }

  // ─── Summarise ───────────────────────────────────────────────────────────────

  /**
   * Produce a single summary MemoryEntry from a batch of raw entries.
   *
   * The summary preserves the referenced-entity set (CF-M2-03) by
   * concatenating all unique content fragments into the `content` field,
   * using the label as a theme tag.
   *
   * The summary entry carries:
   *   - `id`      : fresh UUID
   *   - `content` : newline-joined unique content sentences
   *   - `ts`      : max(batch ts) — most recent observation time
   *   - `alpha`   : mean(batch alpha)
   *   - `beta`    : mean(batch beta)
   *   - `gamma`   : mean(batch gamma) — summary inherits the importance signal
   *   - `score`   : 0 (to be recomputed by scorer on read)
   *
   * This is a pure function — no IO.
   */
  summarize(entries: MemoryEntry[], label = 'reflection'): MemoryEntry {
    if (entries.length === 0) {
      return {
        id: randomUUID(),
        content: `[${label}] empty batch`,
        ts: Date.now(),
        alpha: DEFAULT_ALPHA_HINT,
        beta: DEFAULT_BETA_HINT,
        gamma: DEFAULT_GAMMA_HINT,
        score: 0,
      };
    }

    // Collect unique content sentences (preserves referenced-entity set).
    const seen = new Set<string>();
    const lines: string[] = [];
    for (const e of entries) {
      for (const sentence of e.content.split(/[.!?\n]+/)) {
        const s = sentence.trim();
        if (s.length > 0 && !seen.has(s)) {
          seen.add(s);
          lines.push(s);
        }
      }
    }

    const content = `[${label}] ` + lines.join('. ');
    const ts      = Math.max(...entries.map((e) => e.ts));
    const alpha   = mean(entries.map((e) => e.alpha));
    const beta    = mean(entries.map((e) => e.beta));
    const gamma   = mean(entries.map((e) => e.gamma));

    return {
      id: randomUUID(),
      content,
      ts,
      alpha,
      beta,
      gamma,
      score: 0,
    };
  }

  // ─── Compaction ──────────────────────────────────────────────────────────────

  /**
   * Remove entries older than `maxAgeMs` and prune if over `maxEntries`.
   * Rewrites the file (full-rewrite pattern — safe because JSONL is
   * append-only from the callers' perspective; compaction is maintenance).
   *
   * Returns the number of entries removed.
   */
  async compact(): Promise<number> {
    const all = await this.load();
    if (all.length === 0) return 0;

    const cutoffTs = Date.now() - this.maxAgeMs;
    let filtered = all.filter((e) => e.ts >= cutoffTs);

    // Also enforce maxEntries (FIFO — keep the most recent).
    if (filtered.length > this.maxEntries) {
      filtered = filtered.slice(filtered.length - this.maxEntries);
    }

    const removed = all.length - filtered.length;
    if (removed > 0) {
      const lines = filtered.map((e) => JSON.stringify(e) + '\n').join('');
      await this._ensureDir();
      await writeFile(this.path, lines, 'utf-8');
    }

    return removed;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async _ensureDir(): Promise<void> {
    try {
      await mkdir(dirname(this.path), { recursive: true });
    } catch {
      // Already exists or can't create — let append surface the real error.
    }
  }
}

// ─── Internal defaults (matches scorer defaults) ─────────────────────────────

const DEFAULT_ALPHA_HINT = 0.4;
const DEFAULT_BETA_HINT  = 0.4;
const DEFAULT_GAMMA_HINT = 0.2;

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}
