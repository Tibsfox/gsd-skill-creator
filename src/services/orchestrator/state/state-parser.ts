/**
 * STATE.md parser.
 *
 * Extracts current position, decisions, blockers, pending todos,
 * and session continuity from STATE.md content.
 * Returns null for empty, missing, or structurally invalid input.
 *
 * Supports both integer (36) and decimal (2.1) phase numbers in position.
 */

import type { CurrentPosition, ParsedState } from './types.js';

/**
 * Regex for the Phase position line:
 *
 * Phase: 36 of 44 (Discovery Foundation) -- COMPLETE
 * Phase: 2.1 of 10 (Hotfix)
 *
 * Groups: 1=phase number, 2=total phases, 3=phase name, 4=status suffix (optional)
 */
const PHASE_LINE_REGEX = /^Phase:\s+(\d+(?:\.\d+)?)\s+of\s+(\d+)\s*\((.+?)\)\s*(?:--\s*(.+))?$/;

/**
 * Regex for the Plan position line:
 *
 * Plan: 3 of 3 in current phase (phase complete)
 * Plan: 1 of 4
 *
 * Groups: 1=plan number, 2=total plans
 */
const PLAN_LINE_REGEX = /^Plan:\s+(\d+)\s+of\s+(\d+)/;

/**
 * Regex for progress percentage:
 *
 * Progress: [███░░░░░░░] 14% (3/22 plans)
 *
 * Groups: 1=percentage
 */
const PROGRESS_REGEX = /(\d+)%/;

/**
 * Parse STATE.md content into a structured ParsedState.
 *
 * @param content - Raw STATE.md file content
 * @returns Parsed state data, or null if content is empty/invalid
 */
export function parseState(content: string): ParsedState | null {
  if (!content || !content.trim()) {
    return null;
  }

  const lines = content.split('\n');

  // Extract current position (required section)
  const position = extractPosition(lines);
  if (!position) {
    return null;
  }

  // Extract accumulated context sections
  const decisions = extractListSection(lines, 'Decisions');
  const blockers = extractListSection(lines, 'Blockers/Concerns');
  const pendingTodos = extractListSection(lines, 'Pending Todos');

  // Extract session continuity
  const sessionContinuity = extractSessionContinuity(lines);

  return {
    position,
    decisions,
    blockers,
    pendingTodos,
    sessionContinuity,
  };
}

/**
 * Extract current position from the ## Current Position section.
 *
 * Parses Phase, Plan, Status, Last activity, and Progress lines.
 */
function extractPosition(lines: string[]): CurrentPosition | null {
  let inPositionSection = false;
  const position: CurrentPosition = {
    phase: null,
    totalPhases: null,
    phaseName: null,
    phaseStatus: null,
    plan: null,
    totalPlans: null,
    status: null,
    progressPercent: null,
    lastActivity: null,
  };

  let foundAnyField = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect start of ## Current Position section
    if (/^##\s+Current Position\b/.test(trimmed)) {
      inPositionSection = true;
      continue;
    }

    // Detect end of section (next ## heading)
    if (inPositionSection && /^##\s+/.test(trimmed) && !/^##\s+Current Position\b/.test(trimmed)) {
      break;
    }

    if (!inPositionSection) {
      continue;
    }

    // Parse Phase line
    const phaseMatch = trimmed.match(PHASE_LINE_REGEX);
    if (phaseMatch) {
      position.phase = parseFloat(phaseMatch[1]);
      position.totalPhases = parseInt(phaseMatch[2], 10);
      position.phaseName = phaseMatch[3].trim();
      position.phaseStatus = phaseMatch[4]?.trim() || null;
      foundAnyField = true;
      continue;
    }

    // Parse Plan line
    const planMatch = trimmed.match(PLAN_LINE_REGEX);
    if (planMatch) {
      position.plan = parseInt(planMatch[1], 10);
      position.totalPlans = parseInt(planMatch[2], 10);
      foundAnyField = true;
      continue;
    }

    // Parse Status line
    if (/^Status:\s+/.test(trimmed)) {
      position.status = trimmed.replace(/^Status:\s+/, '').trim();
      foundAnyField = true;
      continue;
    }

    // Parse Last activity line
    if (/^Last activity:\s+/.test(trimmed)) {
      position.lastActivity = trimmed.replace(/^Last activity:\s+/, '').trim();
      foundAnyField = true;
      continue;
    }

    // Parse Progress line
    if (/^Progress:\s+/.test(trimmed)) {
      const percentMatch = trimmed.match(PROGRESS_REGEX);
      if (percentMatch) {
        position.progressPercent = parseInt(percentMatch[1], 10);
        foundAnyField = true;
      }
      continue;
    }
  }

  return foundAnyField ? position : null;
}

/**
 * Extract a list of items from a named subsection under ## Accumulated Context.
 *
 * Looks for ### {sectionName} heading, collects lines starting with "- "
 * until the next ### heading. Skips "None." lines.
 *
 * @param lines - All lines of STATE.md
 * @param sectionName - Name of the subsection (e.g., "Decisions", "Blockers/Concerns")
 * @returns Array of extracted items (empty array if section not found or "None.")
 */
function extractListSection(lines: string[], sectionName: string): string[] {
  const items: string[] = [];
  let inSection = false;

  // Escape special regex characters in section name (e.g., "/" in "Blockers/Concerns")
  const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sectionRegex = new RegExp(`^###\\s+${escapedName}\\b`);

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect start of target section
    if (sectionRegex.test(trimmed)) {
      inSection = true;
      continue;
    }

    // Detect end of section (next ### or ## heading)
    if (inSection && /^#{2,3}\s+/.test(trimmed) && !sectionRegex.test(trimmed)) {
      break;
    }

    if (!inSection) {
      continue;
    }

    // Skip "None." lines
    if (/^None\.?\s*$/i.test(trimmed)) {
      continue;
    }

    // Collect bullet items
    if (/^-\s+/.test(trimmed)) {
      const item = trimmed.replace(/^-\s+/, '').trim();
      if (item) {
        items.push(item);
      }
    }
  }

  return items;
}

/**
 * Extract session continuity fields from ## Session Continuity section.
 *
 * Parses Last session, Stopped at, and Resume file lines.
 */
function extractSessionContinuity(lines: string[]): {
  lastSession: string | null;
  stoppedAt: string | null;
  resumeFile: string | null;
} {
  const continuity = {
    lastSession: null as string | null,
    stoppedAt: null as string | null,
    resumeFile: null as string | null,
  };

  let inSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect start of ## Session Continuity section
    if (/^##\s+Session Continuity\b/.test(trimmed)) {
      inSection = true;
      continue;
    }

    // Detect end of section (next ## heading)
    if (inSection && /^##\s+/.test(trimmed) && !/^##\s+Session Continuity\b/.test(trimmed)) {
      break;
    }

    if (!inSection) {
      continue;
    }

    // Parse Last session line
    if (/^Last session:\s+/.test(trimmed)) {
      continuity.lastSession = trimmed.replace(/^Last session:\s+/, '').trim();
      continue;
    }

    // Parse Stopped at line
    if (/^Stopped at:\s+/.test(trimmed)) {
      continuity.stoppedAt = trimmed.replace(/^Stopped at:\s+/, '').trim();
      continue;
    }

    // Parse Resume file line
    if (/^Resume file:\s+/.test(trimmed)) {
      continuity.resumeFile = trimmed.replace(/^Resume file:\s+/, '').trim();
      continue;
    }
  }

  return continuity;
}
