/**
 * STATE.md transition detector for passive monitoring.
 *
 * Parses STATE.md content into key-value pairs and compares against
 * a previous scan snapshot to detect meaningful lifecycle transitions:
 * phase completions, phase starts, blocker changes, and status updates.
 *
 * @module integration/monitoring/state-transition-detector
 */

import type { StateTransition } from './types.js';

/**
 * Parse STATE.md content into a flat key-value record.
 *
 * Extracts: phase, status, plan, blockers, last_activity, next_action.
 * Missing fields are omitted (not present as keys).
 *
 * @param content - Raw STATE.md file content
 * @returns Record of extracted field names to their string values
 */
export function parseStateMd(content: string): Record<string, string> {
  if (!content || content.trim() === '') {
    return {};
  }

  const result: Record<string, string> = {};

  // Extract phase: "Phase: 86 -- Wrapper Commands (COMPLETE)"
  const phaseMatch = content.match(/^Phase:\s*(.+)$/m);
  if (phaseMatch) {
    result.phase = phaseMatch[1].trim();
  }

  // Extract status: "Status: Phase 86 complete"
  const statusMatch = content.match(/^Status:\s*(.+)$/m);
  if (statusMatch) {
    result.status = statusMatch[1].trim();
  }

  // Extract plan: "Plan: 02 of 2 complete"
  const planMatch = content.match(/^Plan:\s*(.+)$/m);
  if (planMatch) {
    result.plan = planMatch[1].trim();
  }

  // Extract last activity: "Last activity: 2026-02-12 -- Phase 86 verified"
  const lastActivityMatch = content.match(/^Last activity:\s*(.+)$/m);
  if (lastActivityMatch) {
    result.last_activity = lastActivityMatch[1].trim();
  }

  // Extract next action: "Next action: Execute plan 87-02"
  const nextActionMatch = content.match(/^Next action:\s*(.+)$/m);
  if (nextActionMatch) {
    result.next_action = nextActionMatch[1].trim();
  }

  // Extract blockers section
  const blockersMatch = content.match(
    /###\s*Blockers\s*\n([\s\S]*?)(?=\n##|\n---|\n\n\n|$)/,
  );
  if (blockersMatch) {
    const blockersSection = blockersMatch[1].trim();
    const bulletLines = blockersSection
      .split('\n')
      .filter((line) => line.match(/^\s*-\s+/))
      .map((line) => line.replace(/^\s*-\s+/, '').trim());

    // "(none)" means no blockers
    if (
      bulletLines.length === 0 ||
      (bulletLines.length === 1 && bulletLines[0] === '(none)')
    ) {
      result.blockers = '';
    } else {
      result.blockers = bulletLines.join('; ');
    }
  }

  return result;
}

/**
 * Extract the phase number from a phase string.
 *
 * Handles formats like: "86 -- Wrapper Commands (COMPLETE)", "87", "Phase 86"
 *
 * @param phaseStr - Phase string from STATE.md
 * @returns Extracted phase number, or null if not found
 */
function extractPhaseNumber(phaseStr: string): number | null {
  const match = phaseStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Detect state transitions by comparing a previous scan snapshot
 * against the current STATE.md content.
 *
 * Returns an empty array for the first scan (null previousState)
 * since that is a baseline capture with nothing to compare against.
 *
 * @param previousState - Key-value snapshot from prior scan, or null for first scan
 * @param currentContent - Raw STATE.md file content
 * @returns Array of detected state transitions
 */
export function detectStateTransitions(
  previousState: Record<string, string> | null,
  currentContent: string,
): StateTransition[] {
  const currentState = parseStateMd(currentContent);

  // First scan: baseline capture only, no transitions
  if (previousState === null) {
    return [];
  }

  const transitions: StateTransition[] = [];
  const reportedTypes = new Set<string>();

  // --- Phase changes ---
  const prevPhaseNum = previousState.phase
    ? extractPhaseNumber(previousState.phase)
    : null;
  const currPhaseNum = currentState.phase
    ? extractPhaseNumber(currentState.phase)
    : null;

  if (prevPhaseNum !== null && currPhaseNum !== null && prevPhaseNum !== currPhaseNum) {
    // Phase number changed -- determine if completion and/or start

    // Check if the status indicates the PREVIOUS phase completed
    const prevStatusLower = (previousState.status || '').toLowerCase();
    const currStatusLower = (currentState.status || '').toLowerCase();
    const prevPhaseComplete =
      prevStatusLower.includes('complete') ||
      (previousState.phase || '').toLowerCase().includes('complete');
    const currPhaseComplete = currStatusLower.includes('complete');

    // If previous phase was marked complete, or current status says previous is complete
    if (prevPhaseComplete || currPhaseComplete) {
      // Only report phase_complete if the completed phase is the previous one
      // and it wasn't already "complete" in the previous state
      if (!prevStatusLower.includes('complete') || currPhaseNum > prevPhaseNum) {
        transitions.push({
          field: 'phase',
          previous_value: previousState.phase,
          current_value: currentState.phase,
          transition_type: 'phase_complete',
        });
        reportedTypes.add('phase_complete');
      }
    }

    // New phase started
    transitions.push({
      field: 'phase',
      previous_value: previousState.phase,
      current_value: currentState.phase,
      transition_type: 'phase_started',
    });
    reportedTypes.add('phase_started');
  }

  // --- Status changes (when phase number didn't change, or status changed independently) ---
  const prevStatus = (previousState.status || '').trim();
  const currStatus = (currentState.status || '').trim();

  if (prevStatus !== currStatus && currStatus !== '') {
    const currStatusLower = currStatus.toLowerCase();
    const prevStatusLower = prevStatus.toLowerCase();

    // Check if the status indicates a PHASE completion (not just a plan completion).
    // "Phase 86 complete" is a phase completion.
    // "Executing plan 87-01 complete, 87-02 next" is NOT a phase completion.
    const isPhaseComplete =
      /phase\s+\d+\s+complete/i.test(currStatus) ||
      (currStatusLower === 'complete');
    const wasPhaseComplete =
      /phase\s+\d+\s+complete/i.test(prevStatus) ||
      (prevStatusLower === 'complete');

    if (
      isPhaseComplete &&
      !wasPhaseComplete &&
      !reportedTypes.has('phase_complete')
    ) {
      transitions.push({
        field: 'status',
        previous_value: prevStatus || null,
        current_value: currStatus,
        transition_type: 'phase_complete',
      });
      reportedTypes.add('phase_complete');
    } else if (prevPhaseNum === currPhaseNum && !reportedTypes.has('status_change')) {
      // General status change within the same phase
      transitions.push({
        field: 'status',
        previous_value: prevStatus || null,
        current_value: currStatus,
        transition_type: 'status_change',
      });
      reportedTypes.add('status_change');
    }
  }

  // --- Blocker changes ---
  const prevBlockers = (previousState.blockers || '').trim();
  const currBlockers = (currentState.blockers || '').trim();

  if (prevBlockers !== currBlockers) {
    if (prevBlockers === '' && currBlockers !== '') {
      transitions.push({
        field: 'blockers',
        previous_value: prevBlockers || null,
        current_value: currBlockers,
        transition_type: 'blocker_added',
      });
    } else if (prevBlockers !== '' && currBlockers === '') {
      transitions.push({
        field: 'blockers',
        previous_value: prevBlockers,
        current_value: currBlockers || '',
        transition_type: 'blocker_resolved',
      });
    }
  }

  return transitions;
}
