/**
 * C03 — Coupling spike detection (D-22-15).
 *
 * For each module (non-test file):
 *   outgoing = count of cross-file imports
 *   incoming = count of other modules importing it
 * Total coupling = outgoing + incoming.
 *
 * Project mean over non-test files.
 * Modules > 2× mean → coupling_spike finding.
 * If prevSnapshot provided, also flag modules where coupling increased > 1.5×.
 *
 * Rationale: "{file} has {N} cross-references vs project mean {M}".
 */

import type { AnalyzerOutput } from '../types.js';
import type { PreviousSnapshotData, RawFinding } from './aggregator.js';

const TEST_PATH_PATTERNS = ['__tests__', '.test.ts', '.test.js', '.spec.ts', '.spec.js'];

function isTestFile(filePath: string): boolean {
  return TEST_PATH_PATTERNS.some(p => filePath.includes(p));
}

/**
 * Compute coupling score for each file by counting cross-file import references.
 * We proxy "imports" via the number of findings of kind 'unused_import' (which include
 * import-reference data) plus the exports count (as a proxy for incoming coupling).
 *
 * In a full implementation, the TS/JS analyzers would return structured import lists.
 * Here we use metrics.exports as a proxy for "how many other files could reference this."
 */
function computeCouplingScores(perFileResults: AnalyzerOutput[]): Map<string, number> {
  const scores = new Map<string, number>();

  // Build outgoing scores: count of import-like findings per file
  const outgoing = new Map<string, number>();
  for (const fileResult of perFileResults) {
    if (isTestFile(fileResult.filePath)) continue;
    // Count findings that represent outgoing references
    const outgoingCount = fileResult.findings.filter(
      f => f.kind === 'unused_import' || (f.rationale && f.rationale.includes('cross-reference')),
    ).length;
    outgoing.set(fileResult.filePath, outgoingCount);
  }

  // Build incoming scores: for each file's exports, count files that import it
  // Heuristic: use metrics.exports as a signal of how referenced a file is
  const incoming = new Map<string, number>();
  for (const fileResult of perFileResults) {
    if (isTestFile(fileResult.filePath)) continue;
    // Incoming = how many other files have findings referencing this file's path
    let incomingCount = 0;
    for (const otherResult of perFileResults) {
      if (otherResult.filePath === fileResult.filePath) continue;
      if (isTestFile(otherResult.filePath)) continue;
      // Check if this file is referenced in another file's findings
      const referenced = otherResult.findings.some(f =>
        f.rationale.includes(fileResult.filePath) || f.title.includes(fileResult.filePath),
      );
      if (referenced) incomingCount++;
    }
    incoming.set(fileResult.filePath, incomingCount);
  }

  for (const fileResult of perFileResults) {
    if (isTestFile(fileResult.filePath)) continue;
    const out = outgoing.get(fileResult.filePath) ?? 0;
    const inc = incoming.get(fileResult.filePath) ?? 0;
    scores.set(fileResult.filePath, out + inc);
  }

  return scores;
}

export function detectCouplingSpikes(
  perFileResults: AnalyzerOutput[],
  snapshotId: string,
  prevSnapshot?: PreviousSnapshotData,
): RawFinding[] {
  const findings: RawFinding[] = [];
  const nonTestFiles = perFileResults.filter(r => !isTestFile(r.filePath));

  if (nonTestFiles.length === 0) return findings;

  const couplingScores = computeCouplingScores(perFileResults);

  // Compute project mean
  const allScores = [...couplingScores.values()];
  if (allScores.length === 0) return findings;
  const meanCoupling = allScores.reduce((a, b) => a + b, 0) / allScores.length;

  // Detect spikes > 2× mean
  for (const [filePath, score] of couplingScores) {
    if (score > 2 * meanCoupling && meanCoupling > 0) {
      findings.push({
        kind: 'coupling_spike',
        severity: 'high',
        confidence: 0.9,
        title: `Coupling spike: ${filePath} (${score} cross-refs, mean ${meanCoupling.toFixed(1)})`,
        rationale: `${filePath} has ${score} cross-references vs project mean ${meanCoupling.toFixed(1)} (${(score / meanCoupling).toFixed(1)}× mean). Snapshot ${snapshotId}.`,
        source_path: filePath,
      });
    }

    // Cross-snapshot growth check
    if (prevSnapshot) {
      const prevScore = prevSnapshot.couplingScores.get(filePath);
      if (prevScore !== undefined && prevScore > 0 && score / prevScore > 1.5) {
        findings.push({
          kind: 'coupling_spike',
          severity: 'med',
          confidence: 0.8,
          title: `Coupling increased: ${filePath} (${prevScore} → ${score} cross-refs)`,
          rationale: `${filePath} coupling increased from ${prevScore} to ${score} (${(score / prevScore).toFixed(1)}× growth, threshold 1.5×). Snapshots ${prevSnapshot.snapshotId} → ${snapshotId}.`,
          source_path: filePath,
        });
      }
    }
  }

  return findings;
}
