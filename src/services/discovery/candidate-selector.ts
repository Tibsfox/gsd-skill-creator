/**
 * Interactive candidate selection for the skill discovery pipeline.
 *
 * Presents scored/ranked candidates in a formatted table and allows the
 * user to select which candidates to generate skills from via @clack/prompts
 * multiselect. Cancel gracefully returns an empty array.
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { RankedCandidate } from './pattern-scorer.js';

// ============================================================================
// Type abbreviations for display
// ============================================================================

const TYPE_ABBREVIATIONS: Record<RankedCandidate['type'], string> = {
  'tool-bigram': 'tool-bi',
  'tool-trigram': 'tool-tri',
  'bash-pattern': 'bash',
};

// ============================================================================
// formatCandidateTable
// ============================================================================

/**
 * Format ranked candidates as an aligned display table.
 *
 * Columns: #, Score, Type, Label, Projects, Sessions
 *
 * @param candidates - Scored candidates to display
 * @returns Formatted string with one line per candidate, empty string for empty array
 */
export function formatCandidateTable(candidates: RankedCandidate[]): string {
  if (candidates.length === 0) return '';

  // Calculate column widths
  const typeCol = Math.max(
    4, // "Type" header length
    ...candidates.map(c => TYPE_ABBREVIATIONS[c.type].length),
  );
  const labelCol = Math.max(
    5, // "Label" header length
    ...candidates.map(c => c.label.length),
  );

  const lines: string[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const idx = pc.dim(String(i + 1).padStart(2));
    const score = pc.cyan(c.score.toFixed(3).padStart(6));
    const type = pc.dim(TYPE_ABBREVIATIONS[c.type].padEnd(typeCol));
    const label = c.label.padEnd(labelCol);
    const projects = pc.dim(`${c.evidence.projects.length}p`);
    const sessions = pc.dim(`${c.evidence.sessions.length}s`);

    lines.push(`  ${idx}  ${score}  ${type}  ${label}  ${projects}  ${sessions}`);
  }

  return lines.join('\n');
}

// ============================================================================
// selectCandidates
// ============================================================================

/**
 * Present candidates to the user and let them select which to generate skills from.
 *
 * Uses @clack/prompts multiselect for interactive selection. Cancel (Ctrl+C)
 * returns an empty array rather than throwing.
 *
 * @param candidates - Ranked candidates to present
 * @returns Selected candidates (empty array if cancelled or nothing selected)
 */
export async function selectCandidates(
  candidates: RankedCandidate[],
): Promise<RankedCandidate[]> {
  if (candidates.length === 0) return [];

  // Display header and table
  p.log.message(pc.bold('Discovered Skill Candidates:'));
  p.log.message(formatCandidateTable(candidates));
  p.log.message('');

  // Present multiselect
  const selected = await p.multiselect({
    message: 'Select patterns to generate skills from (space to toggle):',
    options: candidates.map((c, i) => ({
      value: i,
      label: c.label,
      hint: `score: ${c.score.toFixed(3)} | ${c.evidence.projects.length} projects`,
    })),
    required: false,
  });

  if (p.isCancel(selected)) {
    return [];
  }

  const selectedIndices = selected as number[];
  return selectedIndices.map(i => candidates[i]);
}
