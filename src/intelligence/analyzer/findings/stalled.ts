/**
 * C03 — Stalled mission detection (T8).
 *
 * A decision with `emitted_at` older than 7 days is considered stalled
 * unless git shows commits on the associated emission path within that window.
 *
 * Safety contract (D-22-07): never throws; returns [] on any error.
 * git unavailability: silently returns empty — never crashes the analyzer.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { IntelligenceKB } from '../../types.js';
import type { RawFinding } from './aggregator.js';

const execFileAsync = promisify(execFile);

const STALL_THRESHOLD_DAYS = 7;
const STALL_THRESHOLD_MS = STALL_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

/**
 * Check if a given file path has any commits in the last N days via git log.
 * Returns true if recent commits found, false if not or if git is unavailable.
 */
async function hasRecentGitActivity(filePath: string, sinceMs: number): Promise<boolean> {
  try {
    const sinceDate = new Date(Date.now() - sinceMs).toISOString();
    const { stdout } = await execFileAsync(
      'git',
      ['log', '--since', sinceDate, '--oneline', '--', filePath],
      { timeout: 5000 },
    );
    return stdout.trim().length > 0;
  } catch {
    // git unavailable or not in a repo — skip silently
    return false;
  }
}

export async function detectStalledMissions(
  kb: IntelligenceKB,
  projectId: string,
  snapshotId: string,
): Promise<RawFinding[]> {
  const findings: RawFinding[] = [];

  let inFlight: Awaited<ReturnType<IntelligenceKB['listInFlightWork']>>;
  try {
    inFlight = await kb.listInFlightWork(projectId);
  } catch {
    // KB unavailable (e.g. git not initialised) — return empty, never throw
    return findings;
  }

  const { decisions } = inFlight;
  if (!decisions || decisions.length === 0) {
    return findings;
  }

  const cutoff = Date.now() - STALL_THRESHOLD_MS;

  for (const decision of decisions) {
    // Only consider decisions that have been emitted
    if (!decision.emitted_at) continue;

    const emittedTime = new Date(decision.emitted_at).getTime();
    if (isNaN(emittedTime)) continue;

    // Not old enough to be stalled
    if (emittedTime >= cutoff) continue;

    // Check if there has been recent git activity on the emission path
    const emissionPath = decision.emission_path;
    if (emissionPath) {
      const hasActivity = await hasRecentGitActivity(emissionPath, STALL_THRESHOLD_MS);
      if (hasActivity) continue; // activity found — not stalled
    }

    const ageDays = Math.floor((Date.now() - emittedTime) / (24 * 60 * 60 * 1000));
    findings.push({
      kind: 'stalled_mission',
      severity: 'high',
      confidence: 0.95,
      title: `Stalled mission: decision ${decision.id} (${ageDays} days since emission)`,
      rationale: `Decision ${decision.id} (kind: ${decision.kind}) was emitted ${ageDays} days ago at ${decision.emitted_at} with no detected git activity in the last ${STALL_THRESHOLD_DAYS} days on emission path "${emissionPath ?? 'unknown'}". Project: ${projectId}. Snapshot: ${snapshotId}. Threshold: ${STALL_THRESHOLD_DAYS} days.`,
      source_path: emissionPath ?? undefined,
    });
  }

  return findings;
}
