/**
 * M8 Symbiosis — Co-Evolution Ledger (system → developer)
 *
 * Periodic scanner that emits observations in four offering types:
 *   - trajectory:   directional drift in a tracked metric
 *   - consistency:  divergence between branches or patterns
 *   - pattern:      recurring behavioural regularity
 *   - opportunity:  recurring task that may warrant a skill
 *
 * Entries land in `.planning/symbiosis/co-evolution.jsonl` (append-only).
 * Default cadence: once per 20 sessions. Opt-in gate (SC-CONSENT):
 * zero offerings emitted unless `enabled: true` in settings.
 *
 * All offering content passes through the parasocial-guard before emission.
 * Language is engineering-observational only; no emotion, no first-person plural.
 *
 * Sources: Foxglove 2026, *The Space Between*; component spec §Co-evolution pass.
 *
 * @module symbiosis/coEvolution
 */

import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
import type { OfferingKind, CoEvolutionOffering } from '../types/symbiosis.js';
import { validateOffering } from './parasocial-guard.js';

export const CO_EVOLUTION_LEDGER_DEFAULT = '.planning/symbiosis/co-evolution.jsonl';
export const DEFAULT_CADENCE_SESSIONS = 20;

// ─── Settings / opt-in gate ──────────────────────────────────────────────────

export interface CoEvolutionSettings {
  /** Master opt-in gate. Default false (SC-CONSENT). */
  enabled: boolean;
  /** Cadence: emit at most one batch every N sessions. Default 20. */
  cadenceSessionCount: number;
  /** Override ledger path for testing. */
  ledgerPath?: string;
}

export const DEFAULT_SETTINGS: CoEvolutionSettings = {
  enabled: false,
  cadenceSessionCount: DEFAULT_CADENCE_SESSIONS,
};

// ─── Session fixture / source data ──────────────────────────────────────────

/**
 * Minimal session record consumed by the scanner. Real data comes from M1–M7
 * module outputs; this interface defines the intersection the scanner needs.
 */
export interface SessionRecord {
  /** Sequential session index (0-based). */
  index: number;
  /** ISO date string for day-of-week / temporal analysis. */
  date: string;
  /** Skills activated this session (M5 output). */
  activatedSkills: string[];
  /** Did a test-first commit occur in this session? */
  testFirstCommit: boolean;
  /** Branch name: 'trunk' | '<feature>'. */
  branch: string;
  /** Free-form task description (used for recurring-task detection). */
  taskDescription: string;
}

// ─── Scanner ────────────────────────────────────────────────────────────────

export interface ScanResult {
  offerings: CoEvolutionOffering[];
  /** Number of offerings blocked by the parasocial guard. */
  guardRejections: number;
}

/**
 * Scan a session fixture and produce offerings.
 * Respects the opt-in gate: returns empty result when `settings.enabled` is false.
 *
 * The scanner analyses the last `cadenceSessionCount` sessions and emits at
 * most one offering per type per call (trajectory, consistency, pattern,
 * opportunity). Each finding is phrased in engineering-observational language
 * and validated by the parasocial guard before inclusion.
 */
export function scanSessions(
  sessions: SessionRecord[],
  settings: Partial<CoEvolutionSettings> = {},
): ScanResult {
  const cfg: CoEvolutionSettings = { ...DEFAULT_SETTINGS, ...settings };

  // SC-CONSENT: zero offerings unless explicitly enabled
  if (!cfg.enabled) {
    return { offerings: [], guardRejections: 0 };
  }

  const window = sessions.slice(-cfg.cadenceSessionCount);
  if (window.length === 0) {
    return { offerings: [], guardRejections: 0 };
  }

  const candidates: Array<{ kind: OfferingKind; content: string; pointers: string[] }> = [];

  // ── trajectory: test-first drift ────────────────────────────────────────
  const testFirstCount = window.filter((s) => s.testFirstCommit).length;
  const testFirstRatio = testFirstCount / window.length;

  if (testFirstRatio < 0.5) {
    const pct = (testFirstRatio * 100).toFixed(0);
    candidates.push({
      kind: 'trajectory',
      content: `Test-first commit ratio: ${pct}% across the last ${window.length} sessions (below 50% threshold).`,
      pointers: [`sessions[${sessions.length - window.length}..${sessions.length - 1}].testFirstCommit`],
    });
  }

  // ── consistency: branch divergence ──────────────────────────────────────
  const branchCounts = new Map<string, number>();
  for (const s of window) {
    branchCounts.set(s.branch, (branchCounts.get(s.branch) ?? 0) + 1);
  }
  const uniqueBranches = [...branchCounts.keys()].filter((b) => b !== 'trunk');
  if (uniqueBranches.length >= 2) {
    const topBranches = uniqueBranches.slice(0, 3).join(', ');
    candidates.push({
      kind: 'consistency',
      content: `${uniqueBranches.length} non-trunk branches active in the last ${window.length} sessions: ${topBranches}.`,
      pointers: [`sessions[${sessions.length - window.length}..${sessions.length - 1}].branch`],
    });
  }

  // ── pattern: day-of-week regularity ─────────────────────────────────────
  const dayCountMap = new Map<string, number>();
  for (const s of window) {
    const day = new Date(s.date).toLocaleDateString('en-US', { weekday: 'long' });
    dayCountMap.set(day, (dayCountMap.get(day) ?? 0) + 1);
  }
  let peakDay = '';
  let peakCount = 0;
  for (const [day, count] of dayCountMap.entries()) {
    if (count > peakCount) {
      peakCount = count;
      peakDay = day;
    }
  }
  if (peakCount >= 3 && peakDay) {
    candidates.push({
      kind: 'pattern',
      content: `${peakCount} sessions recorded on ${peakDay}s across the last ${window.length} sessions.`,
      pointers: [`sessions[*].date`],
    });
  }

  // ── opportunity: recurring task description ──────────────────────────────
  const taskFreq = new Map<string, number>();
  for (const s of window) {
    if (!s.taskDescription) continue;
    const normalised = s.taskDescription.trim().toLowerCase();
    taskFreq.set(normalised, (taskFreq.get(normalised) ?? 0) + 1);
  }
  let maxTask = '';
  let maxTaskCount = 0;
  for (const [task, count] of taskFreq.entries()) {
    if (count > maxTaskCount) {
      maxTaskCount = count;
      maxTask = task;
    }
  }
  if (maxTaskCount >= 3 && maxTask) {
    candidates.push({
      kind: 'opportunity',
      content: `Task pattern detected ${maxTaskCount} times in ${window.length} sessions: "${maxTask}". Candidate for skill extraction.`,
      pointers: [`sessions[*].taskDescription`],
    });
  }

  // ── emit; validate each via parasocial guard ─────────────────────────────
  const offerings: CoEvolutionOffering[] = [];
  let guardRejections = 0;

  for (const c of candidates) {
    const guardResult = validateOffering(c.content);
    if (!guardResult.ok) {
      guardRejections += 1;
      console.warn(
        `[symbiosis/coEvolution] guard rejected ${c.kind} offering:`,
        guardResult.rejected,
      );
      continue;
    }
    offerings.push({
      id: randomUUID(),
      ts: Date.now(),
      kind: c.kind,
      content: c.content,
      sourcePointers: c.pointers,
    });
  }

  return { offerings, guardRejections };
}

// ─── Ledger writers / readers ────────────────────────────────────────────────

/**
 * Append a batch of offerings to the co-evolution ledger.
 * Append-only: never modifies existing records.
 */
export function appendOfferings(
  offerings: CoEvolutionOffering[],
  ledgerPath = CO_EVOLUTION_LEDGER_DEFAULT,
): void {
  if (offerings.length === 0) return;
  mkdirSync(dirname(ledgerPath), { recursive: true });
  const lines = offerings.map((o) => JSON.stringify(o)).join('\n') + '\n';
  appendFileSync(ledgerPath, lines, 'utf8');
}

/**
 * Read all offerings from the ledger, skipping malformed lines.
 */
export function readOfferings(
  ledgerPath = CO_EVOLUTION_LEDGER_DEFAULT,
): CoEvolutionOffering[] {
  if (!existsSync(ledgerPath)) return [];
  const raw = readFileSync(ledgerPath, 'utf8');
  const results: CoEvolutionOffering[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      results.push(JSON.parse(trimmed) as CoEvolutionOffering);
    } catch {
      console.warn('[symbiosis/coEvolution] skipping malformed JSONL line');
    }
  }
  return results;
}

/**
 * High-level entry point: scan sessions and append any new offerings to disk.
 * Respects opt-in gate. Returns the list of newly appended offerings.
 */
export function runCoEvolutionPass(
  sessions: SessionRecord[],
  settings: Partial<CoEvolutionSettings> = {},
  ledgerPath = CO_EVOLUTION_LEDGER_DEFAULT,
): CoEvolutionOffering[] {
  const result = scanSessions(sessions, settings);
  appendOfferings(result.offerings, ledgerPath);
  return result.offerings;
}
