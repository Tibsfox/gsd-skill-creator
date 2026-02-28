/**
 * TDD rhythm calculator and renderer for the velocity metrics section.
 *
 * Extracts RED-GREEN cycle times by pairing test commits with subsequent
 * feat commits within the same phase. Renders per-phase and overall
 * average cycle time summaries.
 *
 * Pure renderer: typed data in, HTML string out. No IO or side effects.
 *
 * @module dashboard/metrics/velocity/tdd-rhythm
 */

import type { GitCommitMetric } from '../../collectors/types.js';
import type { PhaseStats } from './types.js';
import { formatDuration } from './types.js';
import { escapeHtml } from '../../renderer.js';

// ============================================================================
// Types
// ============================================================================

/** A single RED-GREEN TDD cycle extracted from commit history. */
export interface TddCycle {
  /** Phase number containing this cycle. */
  phase: number;
  /** Short SHA of the test (RED) commit. */
  testCommitHash: string;
  /** Short SHA of the implementation (GREEN) commit. */
  implCommitHash: string;
  /** ISO 8601 timestamp of the test commit. */
  testTimestamp: string;
  /** ISO 8601 timestamp of the implementation commit. */
  implTimestamp: string;
  /** Duration in ms from test commit to impl commit. */
  cycleTimeMs: number;
}

// ============================================================================
// Extraction
// ============================================================================

/**
 * Extract TDD RED-GREEN cycles from a list of git commits.
 *
 * A TDD cycle is a `test` commit followed chronologically by the next
 * `feat` commit within the same phase. Non-TDD commit types between
 * the pair are ignored. Each test commit pairs with at most one feat.
 *
 * Commits with `phase === null` are excluded.
 *
 * @param commits - Array of parsed git commit metrics
 * @returns Extracted TDD cycles sorted by timestamp
 */
export function extractTddCycles(commits: GitCommitMetric[]): TddCycle[] {
  // Sort by timestamp ascending (do not mutate input)
  const sorted = [...commits]
    .filter((c) => c.phase !== null)
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

  const cycles: TddCycle[] = [];
  const consumed = new Set<number>(); // indices of consumed feat commits

  for (let i = 0; i < sorted.length; i++) {
    const testCommit = sorted[i];
    if (testCommit.type !== 'test') continue;

    // Scan forward for the next feat commit in the same phase
    for (let j = i + 1; j < sorted.length; j++) {
      if (consumed.has(j)) continue;

      const candidate = sorted[j];
      if (candidate.phase !== testCommit.phase) continue;
      if (candidate.type !== 'feat') continue;

      // Found a matching feat commit
      const testTs = new Date(testCommit.timestamp).getTime();
      const implTs = new Date(candidate.timestamp).getTime();

      cycles.push({
        phase: testCommit.phase!,
        testCommitHash: testCommit.hash,
        implCommitHash: candidate.hash,
        testTimestamp: testCommit.timestamp,
        implTimestamp: candidate.timestamp,
        cycleTimeMs: implTs - testTs,
      });

      consumed.add(j);
      break;
    }
  }

  return cycles;
}

// ============================================================================
// Renderer
// ============================================================================

/**
 * Render TDD RED-GREEN cycle time summary.
 *
 * Shows per-phase breakdown (cycle count, avg/min/max times) and an
 * overall average across all phases.
 *
 * @param cycles - Extracted TDD cycles
 * @param _phases - PhaseStats (reserved for future enrichment)
 * @returns HTML string for the TDD rhythm section
 */
export function renderTddRhythm(
  cycles: TddCycle[],
  _phases: PhaseStats[],
): string {
  if (cycles.length === 0) {
    return '<div class="velocity-tdd-empty">No TDD cycles detected</div>';
  }

  // Group cycles by phase
  const byPhase = new Map<number, TddCycle[]>();
  for (const cycle of cycles) {
    const existing = byPhase.get(cycle.phase);
    if (existing) {
      existing.push(cycle);
    } else {
      byPhase.set(cycle.phase, [cycle]);
    }
  }

  // Sort phases ascending
  const phaseNums = [...byPhase.keys()].sort((a, b) => a - b);

  const rows = phaseNums.map((phaseNum) => {
    const phaseCycles = byPhase.get(phaseNum)!;
    const times = phaseCycles.map((c) => c.cycleTimeMs);
    const avg = Math.round(times.reduce((s, t) => s + t, 0) / times.length);
    const min = Math.min(...times);
    const max = Math.max(...times);
    const count = phaseCycles.length;

    return `<div class="velocity-tdd-phase">
  <span class="velocity-tdd-label">${escapeHtml('Phase ' + String(phaseNum))}</span>:
  ${escapeHtml(String(count))} cycle${count !== 1 ? 's' : ''},
  avg ${escapeHtml(formatDuration(avg))},
  min ${escapeHtml(formatDuration(min))},
  max ${escapeHtml(formatDuration(max))}
</div>`;
  });

  // Overall summary
  const allTimes = cycles.map((c) => c.cycleTimeMs);
  const overallAvg = Math.round(
    allTimes.reduce((s, t) => s + t, 0) / allTimes.length,
  );

  const overall = `<div class="velocity-tdd-overall">
  Overall: ${escapeHtml(String(cycles.length))} cycles, avg ${escapeHtml(formatDuration(overallAvg))}
</div>`;

  return `<div class="velocity-tdd-rhythm">
${rows.join('\n')}
${overall}
</div>`;
}
