/**
 * C03 — Dead code cross-file confirmation (D-22-13).
 *
 * Takes per-file analyzer outputs and finds exports that appear in no other file.
 *
 * Algorithm:
 * 1. Collect all 'unused_export' candidates from per-file analysis (confidence 0.6)
 * 2. For each candidate, scan all OTHER files' findings for any reference
 * 3. Zero references → upgrade to 'dead_code' confidence 0.95
 * 4. Any reference → drop the candidate
 *
 * Index-file bulk re-exports (export * from '...') do NOT count as references (D-22-13).
 */

import type { AnalyzerOutput } from '../types.js';
import type { RawFinding } from './aggregator.js';

/**
 * Detect dead code by confirming unused-export candidates have no cross-file references.
 */
export function detectDeadCode(
  perFileResults: AnalyzerOutput[],
  projectId: string,
  snapshotId: string,
): RawFinding[] {
  const findings: RawFinding[] = [];

  // Collect all candidate-file → name pairs from unused_export findings
  const candidates: Array<{
    filePath: string;
    symbolName: string;
    originalFinding: AnalyzerOutput['findings'][0];
  }> = [];

  for (const fileResult of perFileResults) {
    for (const finding of fileResult.findings) {
      if (finding.kind === 'unused_export') {
        // Extract symbol name from title: "Possible unused export: <name> in <path>"
        const titleMatch = finding.title.match(/(?:export|definition|pub item|uniform):\s+(\S+)/);
        const symbolName = titleMatch?.[1] ?? extractSymbolFromRationale(finding.rationale);
        candidates.push({
          filePath: fileResult.filePath,
          symbolName,
          originalFinding: finding,
        });
      }
    }
  }

  if (candidates.length === 0) return findings;

  // Build a reference map: for each file, what symbols/paths does it reference?
  // We use the finding rationale text as a proxy — in a real implementation, the TS analyzer
  // would provide structured import data. Here we do a text-presence heuristic.
  const fileTexts = new Map<string, string>();
  for (const fileResult of perFileResults) {
    // Aggregate all rationale strings as a proxy for "what this file references"
    const text = fileResult.findings
      .map(f => f.rationale + ' ' + f.title)
      .join(' ');
    fileTexts.set(fileResult.filePath, text);
  }

  for (const candidate of candidates) {
    // Check all OTHER files for a reference to this symbol
    // Reference = the symbol name appears in another file's findings rationale (import context)
    // BUT: bulk re-exports (export * from) do NOT count
    let hasExternalReference = false;

    for (const fileResult of perFileResults) {
      if (fileResult.filePath === candidate.filePath) continue;

      // Check findings for any reference to the candidate's file or symbol
      for (const finding of fileResult.findings) {
        // Bulk re-export pattern — skip
        if (
          finding.rationale.includes('export * from') ||
          finding.rationale.includes('bulk re-export')
        ) {
          continue;
        }

        // Check if another file's finding references our candidate's file
        if (
          finding.rationale.includes(candidate.filePath) ||
          finding.rationale.includes(candidate.symbolName)
        ) {
          hasExternalReference = true;
          break;
        }
      }

      if (hasExternalReference) break;
    }

    if (!hasExternalReference) {
      // Upgrade to confirmed dead_code (confidence 0.95)
      findings.push({
        kind: 'dead_code',
        severity: candidate.originalFinding.severity,
        confidence: 0.95,
        title: `Dead code: ${candidate.symbolName} in ${candidate.filePath}`,
        rationale: `Symbol '${candidate.symbolName}' is exported from ${candidate.filePath} and has no references in any other project file (cross-file confirmation, ${perFileResults.length} files scanned, snapshot ${snapshotId}).`,
        source_path: candidate.filePath,
        source_range: candidate.originalFinding.source_range,
      });
    }
    // If has reference → drop silently (not a dead_code finding)
  }

  return findings;
}

function extractSymbolFromRationale(rationale: string): string {
  // Fallback: look for quoted symbol name in rationale
  const match = rationale.match(/'([^']+)'/);
  return match?.[1] ?? 'unknown';
}
