/**
 * Inter-team communication link validator with deadlock detection.
 *
 * Provides config-time validation of inter-team outputTo/inputFrom links.
 * NOT a runtime message broker -- validates that:
 * - All referenced team names exist
 * - No circular dependencies between teams
 * - outputTo/inputFrom consistency (advisory warnings)
 *
 * Uses Kahn's algorithm for O(n+m) cycle detection, matching
 * the pattern from detectTaskCycles() in team-validator.ts.
 */

import type { InterTeamLink } from '../types/team.js';

// ============================================================================
// Result Types
// ============================================================================

/**
 * Result of inter-team cycle detection.
 */
export interface InterTeamCycleResult {
  /** Whether a circular dependency was detected. */
  hasCycle: boolean;
  /** Team names participating in the cycle (only when hasCycle is true). */
  cycle?: string[];
}

/**
 * Result of inter-team link validation.
 */
export interface InterTeamValidationResult {
  /** Error messages (blocking issues). */
  errors: string[];
  /** Warning messages (non-blocking suggestions). */
  warnings: string[];
}

// ============================================================================
// Team Input Type
// ============================================================================

/**
 * Minimal team descriptor for inter-team validation.
 */
interface TeamDescriptor {
  name: string;
  outputTo?: InterTeamLink[];
  inputFrom?: InterTeamLink[];
}

// ============================================================================
// Cycle Detection
// ============================================================================

/**
 * Detect circular dependencies in inter-team communication links.
 *
 * Uses Kahn's algorithm (BFS topological sort) for O(n+m) cycle detection.
 * Builds a directed graph from both outputTo and inputFrom declarations.
 *
 * @param teams - Array of team descriptors with optional outputTo/inputFrom
 * @returns Cycle detection result with participating team names if cycle found
 */
export function detectInterTeamCycles(teams: TeamDescriptor[]): InterTeamCycleResult {
  if (teams.length === 0) {
    return { hasCycle: false };
  }

  // Build directed graph: team A -> team B means A outputs to B
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // source -> targets

  // Initialize all teams with 0 in-degree
  for (const team of teams) {
    inDegree.set(team.name, 0);
    dependents.set(team.name, []);
  }

  const teamNames = new Set(teams.map((t) => t.name));

  // Build edges from outputTo
  for (const team of teams) {
    if (!team.outputTo) continue;

    for (const link of team.outputTo) {
      if (!teamNames.has(link.teamName)) continue; // skip unknown teams

      const targets = dependents.get(team.name) ?? [];
      targets.push(link.teamName);
      dependents.set(team.name, targets);

      inDegree.set(link.teamName, (inDegree.get(link.teamName) ?? 0) + 1);
    }
  }

  // Build edges from inputFrom (reverse direction: if B.inputFrom includes A, that's A -> B)
  for (const team of teams) {
    if (!team.inputFrom) continue;

    for (const link of team.inputFrom) {
      if (!teamNames.has(link.teamName)) continue; // skip unknown teams

      // Check if this edge already exists from outputTo processing
      const existingTargets = dependents.get(link.teamName) ?? [];
      if (existingTargets.includes(team.name)) continue; // avoid duplicate edges

      existingTargets.push(team.name);
      dependents.set(link.teamName, existingTargets);

      inDegree.set(team.name, (inDegree.get(team.name) ?? 0) + 1);
    }
  }

  // Kahn's algorithm: start with zero in-degree teams
  const queue: string[] = [];
  const order: string[] = [];

  for (const [teamName, degree] of inDegree) {
    if (degree === 0) {
      queue.push(teamName);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);

    for (const dependent of dependents.get(current) ?? []) {
      const newDegree = inDegree.get(dependent)! - 1;
      inDegree.set(dependent, newDegree);

      if (newDegree === 0) {
        queue.push(dependent);
      }
    }
  }

  // If not all teams were processed, there's a cycle
  if (order.length !== teams.length) {
    const cycleNodes = teams
      .map((t) => t.name)
      .filter((name) => !order.includes(name));

    return {
      hasCycle: true,
      cycle: cycleNodes,
    };
  }

  return { hasCycle: false };
}

// ============================================================================
// Link Validation
// ============================================================================

/**
 * Validate inter-team communication links.
 *
 * Checks:
 * - All referenced team names in outputTo/inputFrom exist in the teams array
 * - outputTo/inputFrom consistency (advisory warning if mismatch)
 * - No circular dependencies between teams
 *
 * @param teams - Array of team descriptors with optional outputTo/inputFrom
 * @returns Validation result with errors and warnings
 */
export function validateInterTeamLinks(teams: TeamDescriptor[]): InterTeamValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const teamNames = new Set(teams.map((t) => t.name));

  // Check that all referenced team names exist
  for (const team of teams) {
    if (team.outputTo) {
      for (const link of team.outputTo) {
        if (!teamNames.has(link.teamName)) {
          errors.push(
            `Team "${team.name}" has outputTo "${link.teamName}" which does not exist`
          );
        }
      }
    }

    if (team.inputFrom) {
      for (const link of team.inputFrom) {
        if (!teamNames.has(link.teamName)) {
          errors.push(
            `Team "${team.name}" has inputFrom "${link.teamName}" which does not exist`
          );
        }
      }
    }
  }

  // Check consistency: if A outputs to B, warn if B doesn't input from A
  for (const team of teams) {
    if (!team.outputTo) continue;

    for (const link of team.outputTo) {
      if (!teamNames.has(link.teamName)) continue; // already reported as error

      const targetTeam = teams.find((t) => t.name === link.teamName);
      if (!targetTeam) continue;

      const hasMatchingInput = targetTeam.inputFrom?.some(
        (input) => input.teamName === team.name
      );

      if (!hasMatchingInput) {
        warnings.push(
          `Team "${team.name}" outputs to "${link.teamName}" but "${link.teamName}" does not declare inputFrom "${team.name}"`
        );
      }
    }
  }

  // Check for circular dependencies
  const cycleResult = detectInterTeamCycles(teams);
  if (cycleResult.hasCycle && cycleResult.cycle) {
    errors.push(
      `Inter-team circular dependency detected: ${cycleResult.cycle.join(' -> ')}`
    );
  }

  return { errors, warnings };
}
