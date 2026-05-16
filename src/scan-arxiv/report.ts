// === scan-arxiv markdown report renderer ===
//
// Converts a RunOutput bundle into a human-readable markdown report.
// Called by the bridge after buildBridge assembles the RunOutput.

import type { RunOutput } from './types.js';
import { RELEVANCE_DOMAINS } from './types.js';

/**
 * Render a complete markdown run report from a RunOutput.
 * Returns the full markdown string (no file I/O here — bridge handles that).
 */
export function renderRunReport(run: RunOutput): string {
  const lines: string[] = [];

  // === Header ===
  lines.push('# arxiv-may-funnel — Run Report');
  lines.push('');
  lines.push(`**Run ID:** ${run.runId}`);
  lines.push(`**Invoked:** ${run.invokedAt}`);
  lines.push(`**Month:** ${run.options.month}`);
  lines.push(`**Runtime:** ${run.runtimeMs} ms`);
  lines.push(`**Fetched:** ${run.fetchedCount} papers`);
  lines.push(`**Ranked:** ${run.rankedCount} papers (above min-score)`);
  lines.push(`**Dedup skipped:** ${run.dedupSkipCount} papers (already in seen-ids.json)`);
  lines.push('');

  // === Per-category counts ===
  lines.push('## Per-category counts');
  lines.push('');
  lines.push('| Category | Fetched |');
  lines.push('|---|---|');
  for (const [category, count] of Object.entries(run.totalsByCategory)) {
    lines.push(`| ${escapeCell(category)} | ${count} |`);
  }
  lines.push('');

  // === Per-domain candidate counts ===
  lines.push('## Per-domain candidate counts');
  lines.push('');
  lines.push('(Number of papers where `subscores[domain] >= 0.5`. A paper can appear in multiple rows.)');
  lines.push('');
  lines.push('| Domain | Count |');
  lines.push('|---|---|');
  for (const domain of RELEVANCE_DOMAINS) {
    const count = run.totalsByDomain[domain] ?? 0;
    lines.push(`| ${escapeCell(domain)} | ${count} |`);
  }
  lines.push('');

  // === Top-K queue ===
  lines.push('## Top-K queue');
  lines.push('');
  lines.push('| # | Score | arxivId | Title | Rationale |');
  lines.push('|---|---|---|---|---|');
  for (const entry of run.queue) {
    const score = entry.relevance.aggregate.toFixed(2);
    const arxivId = escapeCell(entry.paper.arxivId);
    const title = escapeCell(entry.paper.title);
    const rationale = truncateRationale(entry.relevance.rationale);
    lines.push(`| ${entry.rank} | ${score} | ${arxivId} | ${title} | ${escapeCell(rationale)} |`);
  }
  lines.push('');

  // === Next step ===
  const runDir = deriveRunDir(run);
  lines.push('## Next step');
  lines.push('');
  lines.push('```bash');
  lines.push(`bash ${runDir}/run-ingestion.sh`);
  lines.push('# or for unattended runs:');
  lines.push(`AUTO_CONFIRM=1 bash ${runDir}/run-ingestion.sh`);
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

// === Internal helpers ===

/**
 * Escape pipe characters in a table cell value so markdown tables render correctly.
 */
function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|');
}

/**
 * Truncate a rationale string to 120 characters, appending '…' if trimmed.
 */
function truncateRationale(rationale: string): string {
  if (rationale.length <= 120) return rationale;
  return rationale.slice(0, 120) + '…';
}

/**
 * Derive the run directory path from run metadata.
 * The bridge uses outputDir + runId; we reconstruct it here for the "Next step" section.
 */
function deriveRunDir(run: RunOutput): string {
  return `${run.options.outputDir}/${run.runId}`;
}
