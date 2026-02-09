/**
 * ROADMAP.md parser.
 *
 * Extracts phase list and per-phase plan lists from ROADMAP.md content.
 * Returns null for empty, missing, or structurally invalid input.
 *
 * Supports both integer (36, 37) and decimal (37.1, 37.2) phase numbers.
 * Handles both ### and #### phase detail headings (milestone-grouped format).
 */

import type { ParsedRoadmap, PhaseInfo, PlanInfo } from './types.js';
import type { CapabilityRef } from '../../capabilities/types.js';
import { parseCapabilityDeclarations } from '../../capabilities/roadmap-capabilities.js';

/**
 * Regex for phase checkbox lines in the ## Phases section:
 *
 * - [x] **Phase 36: Discovery Foundation** (Complete 2026-02-08) - Scan filesystem...
 * - [ ] **Phase 37.1: Hotfix** - Fix edge case
 *
 * Groups: 1=x or space, 2=phase number, 3=name, 4=parenthetical (optional), 5=description (optional)
 */
const PHASE_LINE_REGEX = /^-\s+\[(x| )\]\s+\*\*Phase\s+(\d+(?:\.\d+)?)\s*:\s*(.+?)\*\*(?:\s*\((.+?)\))?\s*(?:-\s*(.+))?$/;

/**
 * Regex for plan checkbox lines in phase detail sections:
 *
 * - [x] 36-01-PLAN.md -- Description text
 * - [ ] 38-01 -- Description text
 * - [x] 10-02-PLAN.md: Description text
 *
 * Groups: 1=x or space, 2=plan id (e.g., "36-01"), 3=description (optional)
 */
const PLAN_LINE_REGEX = /^-\s+\[(x| )\]\s+(\d+(?:\.\d+)?-\d+)(?:-PLAN\.md)?(?:\s*(?:--|:)\s*(.+))?$/;

/**
 * Regex for phase detail headings (### or ####):
 *
 * ### Phase 36: Discovery Foundation
 * #### Phase 37.1: Hotfix
 *
 * Groups: 1=phase number
 */
const PHASE_HEADING_REGEX = /^#{3,4}\s+Phase\s+(\d+(?:\.\d+)?)\s*:/;

/**
 * Parse ROADMAP.md content into a structured ParsedRoadmap.
 *
 * @param content - Raw ROADMAP.md file content
 * @returns Parsed roadmap data, or null if content is empty/invalid
 */
export function parseRoadmap(content: string): ParsedRoadmap | null {
  if (!content || !content.trim()) {
    return null;
  }

  const lines = content.split('\n');

  // Step 1: Find the ## Phases section and extract phase checkbox lines
  const phases = extractPhases(lines);
  if (phases.length === 0) {
    return null;
  }

  // Step 2: Extract per-phase plan lists from detail sections
  const plansByPhase = extractPlansByPhase(lines);

  // Step 3: Extract capability declarations from phase detail sections
  const capabilitiesByPhase = extractCapabilitiesByPhase(lines);

  const result: ParsedRoadmap = { phases, plansByPhase };
  if (Object.keys(capabilitiesByPhase).length > 0) {
    result.capabilitiesByPhase = capabilitiesByPhase as ParsedRoadmap['capabilitiesByPhase'];
  }
  return result;
}

/**
 * Extract phase info from the ## Phases checkbox list.
 *
 * Scans lines between "## Phases" heading and the next "## " heading,
 * parsing each checkbox line that matches the phase format.
 */
function extractPhases(lines: string[]): PhaseInfo[] {
  const phases: PhaseInfo[] = [];
  let inPhasesSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect start of ## Phases section
    if (/^##\s+Phases\b/.test(trimmed)) {
      inPhasesSection = true;
      continue;
    }

    // Detect end of ## Phases section (next ## heading)
    if (inPhasesSection && /^##\s+/.test(trimmed) && !/^##\s+Phases\b/.test(trimmed)) {
      break;
    }

    if (!inPhasesSection) {
      continue;
    }

    // Try to parse as a phase checkbox line
    const match = trimmed.match(PHASE_LINE_REGEX);
    if (match) {
      const phase: PhaseInfo = {
        number: match[2],
        name: match[3].trim(),
        complete: match[1] === 'x',
      };

      if (match[4]) {
        phase.completedInfo = match[4].trim();
      }

      if (match[5]) {
        phase.description = match[5].trim();
      }

      phases.push(phase);
    }
  }

  return phases;
}

/**
 * Extract plan lists from phase detail sections.
 *
 * Scans for ### Phase N: or #### Phase N: headings, then collects
 * plan checkbox lines until the next heading of equal or higher level.
 *
 * @returns Record mapping phase number string to PlanInfo arrays
 */
function extractPlansByPhase(lines: string[]): Record<string, PlanInfo[]> {
  const plansByPhase: Record<string, PlanInfo[]> = {};
  let currentPhaseNumber: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for phase detail heading (### or ####)
    const headingMatch = trimmed.match(PHASE_HEADING_REGEX);
    if (headingMatch) {
      currentPhaseNumber = headingMatch[1];
      continue;
    }

    // If we hit another heading of level <= 3, reset current phase
    // (but NOT #### headings, which could be sub-sections within a phase)
    if (/^#{1,3}\s+/.test(trimmed) && !PHASE_HEADING_REGEX.test(trimmed)) {
      currentPhaseNumber = null;
      continue;
    }

    // If we're inside a phase detail section, try to parse plan lines
    if (currentPhaseNumber) {
      const planMatch = trimmed.match(PLAN_LINE_REGEX);
      if (planMatch) {
        const plan: PlanInfo = {
          id: planMatch[2],
          complete: planMatch[1] === 'x',
        };

        if (planMatch[3]) {
          plan.description = planMatch[3].trim();
        }

        if (!plansByPhase[currentPhaseNumber]) {
          plansByPhase[currentPhaseNumber] = [];
        }
        plansByPhase[currentPhaseNumber].push(plan);
      }
    }
  }

  return plansByPhase;
}

/**
 * Extract capability declarations from phase detail sections.
 *
 * Iterates lines, tracks current phase number via PHASE_HEADING_REGEX,
 * accumulates lines per phase section, and calls parseCapabilityDeclarations
 * on each accumulated set.
 *
 * @returns Record mapping phase number -> CapabilityRef[] (only non-empty)
 */
function extractCapabilitiesByPhase(lines: string[]): Record<string, CapabilityRef[]> {
  const result: Record<string, CapabilityRef[]> = {};
  let currentPhaseNumber: string | null = null;
  let currentPhaseLines: string[] = [];

  function flushPhase(): void {
    if (currentPhaseNumber && currentPhaseLines.length > 0) {
      const refs = parseCapabilityDeclarations(currentPhaseLines);
      if (refs.length > 0) {
        result[currentPhaseNumber] = refs;
      }
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for phase detail heading (### or ####)
    const headingMatch = trimmed.match(PHASE_HEADING_REGEX);
    if (headingMatch) {
      // Flush previous phase
      flushPhase();
      currentPhaseNumber = headingMatch[1];
      currentPhaseLines = [];
      continue;
    }

    // If we hit another heading of level <= 3, reset current phase
    if (/^#{1,3}\s+/.test(trimmed) && !PHASE_HEADING_REGEX.test(trimmed)) {
      flushPhase();
      currentPhaseNumber = null;
      currentPhaseLines = [];
      continue;
    }

    // Accumulate lines within the current phase section
    if (currentPhaseNumber) {
      currentPhaseLines.push(trimmed);
    }
  }

  // Flush the last phase
  flushPhase();

  return result;
}
