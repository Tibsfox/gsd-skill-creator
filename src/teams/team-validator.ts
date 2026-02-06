/**
 * Team validator functions for agent resolution, cycle detection, and tool overlap.
 *
 * Three pure/sync validators:
 * - VALID-02: validateMemberAgents() -- checks agent files exist on disk
 * - VALID-05: detectTaskCycles() -- detects circular blockedBy dependencies
 * - VALID-06: detectToolOverlap() -- warns when members share write-capable tools
 */

import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { TeamMember, TeamTask } from '../types/team.js';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Result of resolving a single member's agent file.
 */
export interface MemberResolutionResult {
  /** Agent ID that was searched for. */
  agentId: string;
  /** Whether the agent file was found or is missing. */
  status: 'found' | 'missing';
  /** Absolute path to the found agent file (only when status is 'found'). */
  path?: string;
  /** All paths that were searched during resolution. */
  searchedPaths: string[];
  /** Suggested similar agent names when status is 'missing'. */
  suggestions?: string[];
}

/**
 * Result of cycle detection in task dependencies.
 */
export interface CycleDetectionResult {
  /** Whether a cycle was detected. */
  hasCycle: boolean;
  /** Task IDs participating in the cycle (only when hasCycle is true). */
  cycle?: string[];
}

/**
 * A single tool overlap entry -- one write-capable tool shared by multiple members.
 */
export interface ToolOverlapResult {
  /** The shared write-capable tool name. */
  tool: string;
  /** Agent IDs of members that share this tool. */
  members: string[];
}

// ============================================================================
// Constants
// ============================================================================

/** Default directories to search for agent files. */
const DEFAULT_AGENTS_DIRS = [
  '.claude/agents',
  join(homedir(), '.claude', 'agents'),
];

/** Tools that perform write operations (potential conflict source). */
const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit']);

// ============================================================================
// VALID-02: validateMemberAgents
// ============================================================================

/**
 * Validate that agent files exist on disk for each team member.
 *
 * Searches the provided directories (or defaults) for each member's
 * agent file (`{agentId}.md`). When a file is missing, provides fuzzy
 * name suggestions from available agent files in the search directories.
 *
 * @param members - Team members to validate
 * @param agentsDirs - Directories to search (defaults to project + user scope)
 * @returns Array of resolution results, one per member
 */
export function validateMemberAgents(
  members: TeamMember[],
  agentsDirs?: string[]
): MemberResolutionResult[] {
  const dirs = agentsDirs ?? DEFAULT_AGENTS_DIRS;

  return members.map((member) => {
    const searchedPaths: string[] = [];
    let foundPath: string | undefined;

    for (const dir of dirs) {
      const filePath = join(dir, `${member.agentId}.md`);
      searchedPaths.push(filePath);

      if (!foundPath && existsSync(filePath)) {
        foundPath = filePath;
      }
    }

    if (foundPath) {
      return {
        agentId: member.agentId,
        status: 'found' as const,
        path: foundPath,
        searchedPaths,
      };
    }

    // Collect suggestions from available agent files in search dirs
    const suggestions = collectSuggestions(member.agentId, dirs);

    return {
      agentId: member.agentId,
      status: 'missing' as const,
      searchedPaths,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  });
}

/**
 * Collect fuzzy-matched agent name suggestions from available files.
 *
 * Matches via:
 * - Levenshtein distance <= 2
 * - Shared prefix of 4+ characters
 */
function collectSuggestions(targetId: string, dirs: string[]): string[] {
  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const dir of dirs) {
    let files: string[];
    try {
      files = readdirSync(dir) as unknown as string[];
    } catch {
      continue;
    }

    for (const file of files) {
      if (typeof file !== 'string' || !file.endsWith('.md')) continue;
      const name = file.slice(0, -3); // strip .md
      if (name === targetId || seen.has(name)) continue;
      seen.add(name);

      if (isSimilar(targetId, name)) {
        suggestions.push(name);
      }
    }
  }

  return suggestions;
}

/**
 * Check if two names are similar via Levenshtein distance or shared prefix.
 */
function isSimilar(a: string, b: string): boolean {
  // Shared prefix of 4+ characters
  const prefixLen = Math.min(4, Math.min(a.length, b.length));
  if (prefixLen >= 4 && a.slice(0, prefixLen) === b.slice(0, prefixLen)) {
    return true;
  }

  // Levenshtein distance <= 2
  return levenshtein(a, b) <= 2;
}

/**
 * Compute Levenshtein edit distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Optimization: early return for trivial cases
  if (m === 0) return n;
  if (n === 0) return m;

  // Use single-row optimization (O(min(m,n)) space)
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

// ============================================================================
// VALID-05: detectTaskCycles
// ============================================================================

/**
 * Detect circular dependencies in task blockedBy relationships.
 *
 * Uses Kahn's algorithm (BFS topological sort) for O(n+m) cycle detection,
 * matching the DependencyGraph pattern from src/composition/dependency-graph.ts.
 *
 * @param tasks - Tasks with optional blockedBy arrays
 * @returns Cycle detection result with participating task IDs if cycle found
 */
export function detectTaskCycles(tasks: TeamTask[]): CycleDetectionResult {
  if (tasks.length === 0) {
    return { hasCycle: false };
  }

  // Build in-degree map and dependents map
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // dependency -> tasks that depend on it

  // Initialize all tasks with 0 in-degree
  for (const task of tasks) {
    inDegree.set(task.id, 0);
    dependents.set(task.id, []);
  }

  // Build graph from blockedBy relationships
  for (const task of tasks) {
    if (!task.blockedBy) continue;

    for (const depId of task.blockedBy) {
      // task is blocked by depId, so task has in-degree from depId
      inDegree.set(task.id, (inDegree.get(task.id) ?? 0) + 1);

      // depId has task as a dependent
      const deps = dependents.get(depId) ?? [];
      deps.push(task.id);
      dependents.set(depId, deps);
    }
  }

  // Kahn's algorithm: start with zero in-degree tasks
  const queue: string[] = [];
  const order: string[] = [];

  for (const [taskId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(taskId);
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

  // If not all tasks processed, there's a cycle
  if (order.length !== tasks.length) {
    const cycleNodes = tasks
      .map((t) => t.id)
      .filter((id) => !order.includes(id));

    return {
      hasCycle: true,
      cycle: cycleNodes,
    };
  }

  return { hasCycle: false };
}

// ============================================================================
// VALID-06: detectToolOverlap
// ============================================================================

/**
 * Detect when multiple team members share write-capable tools.
 *
 * Write-capable tools (Write, Edit, MultiEdit) can cause conflicts
 * when multiple agents modify the same files. This function identifies
 * overlapping write tool assignments across team members.
 *
 * @param members - Team members to check for tool overlap
 * @returns Array of overlap results (empty if no overlaps)
 */
export function detectToolOverlap(members: TeamMember[]): ToolOverlapResult[] {
  // Build map: write tool -> member agentIds
  const toolMembers = new Map<string, string[]>();

  for (const member of members) {
    const tools = (member as Record<string, unknown>).tools as string[] | undefined;
    if (!tools) continue;

    for (const tool of tools) {
      if (!WRITE_TOOLS.has(tool)) continue;

      const existing = toolMembers.get(tool) ?? [];
      existing.push(member.agentId);
      toolMembers.set(tool, existing);
    }
  }

  // Return only tools with 2+ members
  const results: ToolOverlapResult[] = [];
  for (const [tool, memberIds] of toolMembers) {
    if (memberIds.length > 1) {
      results.push({ tool, members: memberIds });
    }
  }

  return results;
}
