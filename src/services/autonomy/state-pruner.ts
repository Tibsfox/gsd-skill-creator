/**
 * STATE.md auto-pruner.
 *
 * Keeps STATE.md under 100 lines by archiving stale entries to a separate
 * dated file. Uses soft (80 lines) and hard (100 lines) thresholds.
 *
 * Fixes RC-09: STATE.md grew to 200+ lines in v1.50, causing unnecessary
 * context overhead. The pruner runs after each phase completion and moves
 * older entries to an archive path.
 *
 * All I/O is injectable via callbacks for testability.
 *
 * @module autonomy/state-pruner
 */

import type { ExecutionState } from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Lines at which soft pruning triggers (archive stale entries) */
const SOFT_LIMIT = 80;

/** Lines at which hard pruning triggers (force prune with warning) */
const HARD_LIMIT = 100;

/** Section headers that are structural and never pruned */
const STRUCTURAL_SECTIONS = [
  'Project Reference',
  'Current Position',
  'Session Continuity',
];

// ============================================================================
// Types
// ============================================================================

/** Result of a prune operation */
export interface PruneResult {
  /** Whether any pruning occurred */
  pruned: boolean;
  /** Line count before pruning */
  linesBefore: number;
  /** Line count after pruning (same as linesBefore if not pruned) */
  linesAfter: number;
  /** Path to the archive file (if created) */
  archivePath?: string;
  /** Warning message for hard-limit pruning */
  warning?: string;
}

/** A parsed section from STATE.md */
export interface StateSection {
  /** The ## heading text (without the ## prefix) */
  header: string;
  /** The body content of the section */
  content: string;
  /** The checkpoint number this section is associated with */
  checkpoint: number;
}

/** Parsed STATE.md structure */
export interface ParsedState {
  /** YAML frontmatter (between --- delimiters) */
  frontmatter: string;
  /** Array of sections parsed from the document */
  sections: StateSection[];
}

/** Injectable I/O functions for testability */
export interface IOCallbacks {
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
}

// ============================================================================
// countLines
// ============================================================================

/**
 * Count the number of lines in a string.
 *
 * Empty string returns 0. Trailing newline does not count as an extra line.
 */
export function countLines(content: string): number {
  if (content === '') return 0;
  // Remove trailing newline before splitting to avoid counting an empty last line
  const trimmed = content.endsWith('\n') ? content.slice(0, -1) : content;
  return trimmed.split('\n').length;
}

// ============================================================================
// parseStateEntries
// ============================================================================

/**
 * Parse STATE.md into frontmatter and sections.
 *
 * Extracts YAML frontmatter between --- delimiters, then splits the remaining
 * content into sections by ## headings. Each section gets a checkpoint number
 * inferred from its content.
 */
export function parseStateEntries(content: string): ParsedState {
  if (!content || content.trim() === '') {
    return { frontmatter: '', sections: [] };
  }

  let frontmatter = '';
  let body = content;

  // Extract frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fmMatch) {
    frontmatter = fmMatch[1];
    body = content.slice(fmMatch[0].length);
  }

  // Split into sections by ## headings
  const sections: StateSection[] = [];
  const sectionRegex = /^## (.+)$/gm;
  let match: RegExpExecArray | null;
  const sectionStarts: { header: string; index: number }[] = [];

  while ((match = sectionRegex.exec(body)) !== null) {
    sectionStarts.push({ header: match[1].trim(), index: match.index });
  }

  for (let i = 0; i < sectionStarts.length; i++) {
    const start = sectionStarts[i];
    const nextStart = sectionStarts[i + 1];
    // Find the newline after the heading line
    const headingEnd = body.indexOf('\n', start.index);
    const startOffset = headingEnd === -1 ? body.length : headingEnd + 1;
    const endOffset = nextStart ? nextStart.index : body.length;
    const sectionContent = body.slice(startOffset, endOffset).trim();

    // Infer checkpoint from content (look for phase/subversion references)
    const checkpoint = inferCheckpoint(sectionContent);

    sections.push({
      header: start.header,
      content: sectionContent,
      checkpoint,
    });
  }

  return { frontmatter, sections };
}

/**
 * Infer a checkpoint number from section content.
 *
 * Looks for patterns like "Phase: 497" or "subversion 50" to determine
 * which checkpoint this section belongs to.
 */
function inferCheckpoint(content: string): number {
  // Look for phase numbers
  const phaseMatch = content.match(/Phase:\s*(\d+)/i);
  if (phaseMatch) return parseInt(phaseMatch[1], 10);

  // Look for subversion numbers
  const subMatch = content.match(/subversion\s+(\d+)/i);
  if (subMatch) return parseInt(subMatch[1], 10);

  // Look for checkpoint numbers
  const cpMatch = content.match(/checkpoint\s+(\d+)/i);
  if (cpMatch) return parseInt(cpMatch[1], 10);

  // Default to 0 (structural/always-present)
  return 0;
}

// ============================================================================
// identifyStaleEntries
// ============================================================================

/**
 * Identify sections that are stale relative to the current checkpoint.
 *
 * Structural sections (Project Reference, Current Position, Session Continuity)
 * are never considered stale. Non-structural sections with a checkpoint older
 * than currentCheckpoint are marked stale.
 */
export function identifyStaleEntries(
  sections: StateSection[],
  currentCheckpoint: number,
): StateSection[] {
  return sections.filter(section => {
    // Never prune structural sections
    if (STRUCTURAL_SECTIONS.includes(section.header)) {
      return false;
    }
    // Mark as stale if checkpoint is older than current
    return section.checkpoint < currentCheckpoint;
  });
}

// ============================================================================
// formatArchive
// ============================================================================

/**
 * Format archived entries into a valid archive markdown document.
 *
 * Produces a document with a header, timestamp, milestone, covers list,
 * and the original entry content.
 */
export function formatArchive(
  entries: StateSection[],
  checkpoint: number,
  milestone: string,
): string {
  const timestamp = new Date().toISOString();
  const coversList = entries.map(e => e.header).join(', ');

  const entryContent = entries
    .map(e => `## ${e.header}\n\n${e.content}`)
    .join('\n\n');

  return [
    `# STATE Archive — Checkpoint ${checkpoint}`,
    `Archived: ${timestamp}`,
    `Milestone: ${milestone}`,
    `Covers: ${coversList}`,
    '',
    entryContent,
    '',
  ].join('\n');
}

// ============================================================================
// pruneState (orchestrator)
// ============================================================================

/**
 * Orchestrate STATE.md pruning.
 *
 * - Reads STATE.md
 * - If under 80 lines, returns { pruned: false }
 * - If 80-100 lines (soft limit), archives stale entries and replaces
 *   them with summary lines
 * - If over 100 lines (hard limit), force-prunes to structural sections
 *   only with a warning
 * - If no stale entries can be identified, returns { pruned: false }
 *   even above soft limit
 */
export async function pruneState(
  statePath: string,
  archiveDir: string,
  executionState: Partial<ExecutionState>,
  io: IOCallbacks,
): Promise<PruneResult> {
  const content = await io.readFile(statePath);
  const linesBefore = countLines(content);

  // Under soft limit: no action needed
  if (linesBefore < SOFT_LIMIT) {
    return { pruned: false, linesBefore, linesAfter: linesBefore };
  }

  // Parse the state file
  const parsed = parseStateEntries(content);
  if (parsed.sections.length === 0) {
    return { pruned: false, linesBefore, linesAfter: linesBefore };
  }

  // Determine current checkpoint from execution state
  const currentCheckpoint = executionState.current_subversion ?? 0;

  // Identify stale entries
  const staleEntries = identifyStaleEntries(parsed.sections, currentCheckpoint);
  if (staleEntries.length === 0) {
    return { pruned: false, linesBefore, linesAfter: linesBefore };
  }

  // Create archive document
  const milestone = executionState.milestone ?? 'unknown';
  const archiveContent = formatArchive(staleEntries, currentCheckpoint, milestone);
  const archivePath = `${archiveDir}STATE-ARCHIVE-${currentCheckpoint}.md`;

  // Write archive
  await io.writeFile(archivePath, archiveContent);

  // Build pruned STATE.md
  const staleHeaders = new Set(staleEntries.map(e => e.header));
  const keptSections = parsed.sections.filter(s => !staleHeaders.has(s.header));

  // Reconstruct the file
  let prunedContent = '';
  if (parsed.frontmatter) {
    prunedContent += `---\n${parsed.frontmatter}\n---\n\n`;
  }
  prunedContent += '# Project State\n\n';

  for (const section of keptSections) {
    prunedContent += `## ${section.header}\n\n${section.content}\n\n`;
  }

  // Add archive reference
  prunedContent += `*Archived entries: -> ${archivePath.split('/').pop()}*\n`;

  let linesAfter = countLines(prunedContent);
  let warning: string | undefined;

  // Issue warning if original content exceeded hard limit
  if (linesBefore > HARD_LIMIT) {
    warning = `Hard limit exceeded (${linesBefore} lines). Pruned to ${linesAfter} lines.`;
  }

  // If still over 100 after soft prune, force prune to structural only
  if (linesAfter > HARD_LIMIT) {
    // Keep only structural sections
    const structuralSections = parsed.sections.filter(s =>
      STRUCTURAL_SECTIONS.includes(s.header),
    );

    prunedContent = '';
    if (parsed.frontmatter) {
      prunedContent += `---\n${parsed.frontmatter}\n---\n\n`;
    }
    prunedContent += '# Project State\n\n';

    for (const section of structuralSections) {
      prunedContent += `## ${section.header}\n\n${section.content}\n\n`;
    }

    prunedContent += `*Force-pruned: all non-structural entries archived to ${archivePath.split('/').pop()}*\n`;

    linesAfter = countLines(prunedContent);
    warning = `Hard limit exceeded (${linesBefore} lines). Force-pruned to ${linesAfter} lines. All non-structural entries archived.`;
  }

  // Write pruned STATE.md
  await io.writeFile(statePath, prunedContent);

  return {
    pruned: true,
    linesBefore,
    linesAfter,
    archivePath,
    warning,
  };
}
