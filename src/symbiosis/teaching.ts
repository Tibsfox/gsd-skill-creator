/**
 * M8 Symbiosis — Teaching Ledger (developer → system)
 *
 * Append-only JSONL ledger at `.planning/symbiosis/teaching.jsonl`.
 * Five fixed categories enforce scope. Free-text bounded at 10 KiB per entry.
 * Provides a public API for M3 trace-linkage by entry ID.
 *
 * Sources: Foxglove 2026, *The Space Between* pp. xxv–xxxii;
 * component spec 08-m8-symbiosis.md §Teaching ledger.
 *
 * @module symbiosis/teaching
 */

import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
import type { TeachCategory, TeachEntry } from '../types/symbiosis.js';
import { recordExplicitCorrection } from '../reinforcement/channel-sources.js';
import { classifyExpectedEffect } from './expected-effect.js';

/** Maximum byte length of `content` per entry. */
export const TEACH_CONTENT_MAX_BYTES = 10 * 1024; // 10 KiB

/** All valid teaching categories (mirrors TeachCategory union). */
export const TEACH_CATEGORIES: ReadonlySet<TeachCategory> = new Set([
  'correction',
  'clarification',
  'constraint',
  'pattern',
  'preference',
]);

export interface AppendTeachOptions {
  /** Override the ledger path (default: `.planning/symbiosis/teaching.jsonl`). */
  ledgerPath?: string;
  /** Override timestamp (useful in tests). */
  now?: number;
  /**
   * MA-6 hook: suppress the `explicit_correction` reinforcement emission.
   * Defaults to true (emit).  Tests that should not touch the reinforcement
   * log set this to false.
   */
  emitReinforcement?: boolean;
  /**
   * MA-6 hook: override the reinforcement log path (tests / alternate storage).
   */
  reinforcementLogPath?: string;
  /**
   * ME-4: Raw `output_structure` frontmatter value for the target skill.
   * When provided, `classifyExpectedEffect()` derives `expected_effect` from
   * the ME-1 tractability classification.  When omitted the field defaults to
   * 'low' (conservative fallback, identical to unknown-tractability path).
   *
   * Callers that have already resolved the skill frontmatter should pass this
   * directly.  The teach CLI passes the value looked up from the skill registry.
   */
  rawOutputStructure?: unknown;
  /**
   * ME-4: Directly supply the `expected_effect` level, bypassing ME-1 lookup.
   * Takes precedence over `rawOutputStructure` when both are supplied.
   * Intended for scripted / test use; the teach CLI always uses ME-1.
   */
  expectedEffect?: 'low' | 'medium' | 'high';
}

export interface TeachResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Validate a raw category string against the fixed taxonomy.
 */
export function isValidCategory(value: unknown): value is TeachCategory {
  return typeof value === 'string' && TEACH_CATEGORIES.has(value as TeachCategory);
}

/**
 * Validate a raw TeachEntry object against the schema.
 * Returns an array of error strings; empty array means valid.
 */
export function validateTeachEntry(entry: unknown): string[] {
  const errors: string[] = [];
  if (typeof entry !== 'object' || entry === null) {
    return ['Entry must be a non-null object'];
  }
  const e = entry as Record<string, unknown>;

  if (typeof e['id'] !== 'string' || e['id'].length === 0) {
    errors.push('id must be a non-empty string');
  }
  if (typeof e['ts'] !== 'number' || !Number.isFinite(e['ts'])) {
    errors.push('ts must be a finite number');
  }
  if (!isValidCategory(e['category'])) {
    errors.push(
      `category must be one of: ${[...TEACH_CATEGORIES].join(', ')}; got ${String(e['category'])}`,
    );
  }
  if (typeof e['content'] !== 'string' || e['content'].length === 0) {
    errors.push('content must be a non-empty string');
  } else {
    const bytes = Buffer.byteLength(e['content'] as string, 'utf8');
    if (bytes > TEACH_CONTENT_MAX_BYTES) {
      errors.push(
        `content exceeds 10 KiB limit (${bytes} bytes)`,
      );
    }
  }
  if (!Array.isArray(e['refs'])) {
    errors.push('refs must be an array');
  } else {
    for (const r of e['refs'] as unknown[]) {
      if (typeof r !== 'string') {
        errors.push('each ref must be a string');
        break;
      }
    }
  }
  return errors;
}

/**
 * Append a single teaching entry to the ledger.
 * Never modifies existing records. Returns the generated entry ID on success.
 */
export function appendTeachEntry(
  category: TeachCategory,
  content: string,
  refs: string[] = [],
  opts: AppendTeachOptions = {},
): TeachResult {
  const ledgerPath = opts.ledgerPath ?? '.planning/symbiosis/teaching.jsonl';

  if (!isValidCategory(category)) {
    return { ok: false, error: `Invalid category: ${category}` };
  }

  const bytes = Buffer.byteLength(content, 'utf8');
  if (bytes > TEACH_CONTENT_MAX_BYTES) {
    return { ok: false, error: `content exceeds 10 KiB limit (${bytes} bytes)` };
  }
  if (content.length === 0) {
    return { ok: false, error: 'content must not be empty' };
  }

  // ME-4: resolve expected_effect — caller-supplied value wins; otherwise
  // consult ME-1 via rawOutputStructure; fall back to 'low' (conservative).
  let expectedEffect: 'low' | 'medium' | 'high';
  if (opts.expectedEffect !== undefined) {
    expectedEffect = opts.expectedEffect;
  } else {
    const effect = classifyExpectedEffect(opts.rawOutputStructure);
    expectedEffect = effect.level;
  }

  const entry: TeachEntry = {
    id: randomUUID(),
    ts: opts.now ?? Date.now(),
    category,
    content,
    refs,
    expected_effect: expectedEffect,
  };

  try {
    mkdirSync(dirname(ledgerPath), { recursive: true });
    appendFileSync(ledgerPath, JSON.stringify(entry) + '\n', 'utf8');
  } catch (err) {
    return { ok: false, error: String(err) };
  }

  // MA-6: emit explicit_correction reinforcement event.  Fire-and-forget so
  // the synchronous contract of appendTeachEntry is preserved; fail-open on
  // emission errors is already handled inside recordExplicitCorrection.
  if (opts.emitReinforcement !== false) {
    void recordExplicitCorrection(
      {
        actor: 'symbiosis:teaching',
        metadata: {
          teachEntryId: entry.id,
          category,
        },
        ts: entry.ts,
      },
      { logPath: opts.reinforcementLogPath },
    );
  }

  return { ok: true, id: entry.id };
}

/**
 * Read all valid entries from the ledger.
 * Malformed lines are skipped with a warning (EC-06 guard).
 */
export function readTeachEntries(
  ledgerPath = '.planning/symbiosis/teaching.jsonl',
): TeachEntry[] {
  if (!existsSync(ledgerPath)) return [];

  const raw = readFileSync(ledgerPath, 'utf8');
  const entries: TeachEntry[] = [];

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed: unknown = JSON.parse(trimmed);
      const errors = validateTeachEntry(parsed);
      if (errors.length === 0) {
        entries.push(parsed as TeachEntry);
      } else {
        console.warn('[symbiosis/teaching] skipping malformed entry:', errors.join('; '));
      }
    } catch {
      console.warn('[symbiosis/teaching] skipping non-JSON line');
    }
  }

  return entries;
}

/**
 * Look up a single teaching entry by ID.
 * Returns undefined when not found (M3-trace integration point — CF-M8-03).
 * M3 callers use this to resolve teach-entry references embedded in traces.
 */
export function getTeachEntryById(
  id: string,
  ledgerPath = '.planning/symbiosis/teaching.jsonl',
): TeachEntry | undefined {
  return readTeachEntries(ledgerPath).find((e) => e.id === id);
}
