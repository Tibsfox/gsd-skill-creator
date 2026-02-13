/**
 * ROADMAP.md structural differ for passive monitoring.
 *
 * Parses ROADMAP.md phase listings and compares against a previous
 * snapshot to detect structural changes: phase additions, removals,
 * reordering, and status transitions.
 *
 * @module integration/monitoring/roadmap-differ
 */

import type { RoadmapDiff } from './types.js';

/** A parsed phase entry from ROADMAP.md. */
export interface RoadmapPhase {
  number: number;
  name: string;
  status: string;
}

/**
 * Parse ROADMAP.md content into an ordered array of phase entries.
 *
 * Extracts phase number, name, and status from `### Phase N: Name`
 * headers and the `**Status:**` lines that follow them.
 *
 * @param content - Raw ROADMAP.md file content
 * @returns Array of phase entries in document order
 */
export function parseRoadmapPhases(content: string): RoadmapPhase[] {
  if (!content || content.trim() === '') {
    return [];
  }

  const phases: RoadmapPhase[] = [];

  // Split into sections by ### Phase headers
  const phaseHeaderPattern = /^###\s+Phase\s+(\d+):\s*(.+)$/gm;
  const matches: Array<{ number: number; name: string; index: number }> = [];

  let match: RegExpExecArray | null;
  while ((match = phaseHeaderPattern.exec(content)) !== null) {
    matches.push({
      number: parseInt(match[1], 10),
      name: match[2].trim(),
      index: match.index,
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const entry = matches[i];
    // Extract the text between this header and the next one (or end of file)
    const sectionStart = entry.index;
    const sectionEnd =
      i + 1 < matches.length ? matches[i + 1].index : content.length;
    const sectionText = content.slice(sectionStart, sectionEnd);

    // Determine status from the section text
    let status = 'Pending';

    // Check for **Status:** line
    const statusMatch = sectionText.match(
      /\*\*Status:\*\*\s*(Complete|In Progress)/i,
    );
    if (statusMatch) {
      const rawStatus = statusMatch[1];
      if (rawStatus.toLowerCase().startsWith('complete')) {
        status = 'Complete';
      } else if (rawStatus.toLowerCase().startsWith('in progress')) {
        status = 'In Progress';
      }
    } else {
      // Also check plain "Status:" format
      const plainStatusMatch = sectionText.match(
        /Status:\s*(Complete|In Progress)/i,
      );
      if (plainStatusMatch) {
        const rawStatus = plainStatusMatch[1];
        if (rawStatus.toLowerCase().startsWith('complete')) {
          status = 'Complete';
        } else if (rawStatus.toLowerCase().startsWith('in progress')) {
          status = 'In Progress';
        }
      }
    }

    phases.push({
      number: entry.number,
      name: entry.name,
      status,
    });
  }

  return phases;
}

/**
 * Compute a structural diff between a previous roadmap snapshot
 * and the current ROADMAP.md content.
 *
 * Returns an empty diff for the first scan (null previousPhases)
 * since that is a baseline capture with nothing to compare against.
 *
 * @param previousPhases - Phase entries from prior scan, or null for first scan
 * @param currentContent - Raw ROADMAP.md file content
 * @returns Structural diff describing additions, removals, reordering, and status changes
 */
export function diffRoadmap(
  previousPhases: RoadmapPhase[] | null,
  currentContent: string,
): RoadmapDiff {
  const emptyDiff: RoadmapDiff = {
    phases_added: [],
    phases_removed: [],
    phases_reordered: false,
    status_changes: [],
  };

  // First scan: baseline capture, no transitions
  if (previousPhases === null) {
    return emptyDiff;
  }

  const currentPhases = parseRoadmapPhases(currentContent);

  const prevNumbers = new Set(previousPhases.map((p) => p.number));
  const currNumbers = new Set(currentPhases.map((p) => p.number));

  // Phases added: in current but not in previous
  const phases_added = currentPhases
    .filter((p) => !prevNumbers.has(p.number))
    .map((p) => ({ number: p.number, name: p.name }));

  // Phases removed: in previous but not in current
  const phases_removed = previousPhases
    .filter((p) => !currNumbers.has(p.number))
    .map((p) => ({ number: p.number, name: p.name }));

  // Reordering: check if the relative order of shared phases is preserved
  const sharedPrevOrder = previousPhases
    .filter((p) => currNumbers.has(p.number))
    .map((p) => p.number);
  const sharedCurrOrder = currentPhases
    .filter((p) => prevNumbers.has(p.number))
    .map((p) => p.number);

  let phases_reordered = false;
  if (sharedPrevOrder.length === sharedCurrOrder.length) {
    for (let i = 0; i < sharedPrevOrder.length; i++) {
      if (sharedPrevOrder[i] !== sharedCurrOrder[i]) {
        phases_reordered = true;
        break;
      }
    }
  }

  // Status changes: phases in both with different status
  const prevStatusMap = new Map(
    previousPhases.map((p) => [p.number, p.status]),
  );
  const status_changes: Array<{ phase: number; from: string; to: string }> = [];

  for (const curr of currentPhases) {
    const prevStatus = prevStatusMap.get(curr.number);
    if (prevStatus !== undefined && prevStatus !== curr.status) {
      status_changes.push({
        phase: curr.number,
        from: prevStatus,
        to: curr.status,
      });
    }
  }

  return {
    phases_added,
    phases_removed,
    phases_reordered,
    status_changes,
  };
}
