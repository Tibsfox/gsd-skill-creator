/**
 * Team validator functions for agent resolution, cycle detection, tool overlap,
 * skill conflict detection, and role coherence validation.
 *
 * Sync validators:
 * - VALID-02: validateMemberAgents() -- checks agent files exist on disk
 * - VALID-05: detectTaskCycles() -- detects circular blockedBy dependencies
 * - VALID-06: detectToolOverlap() -- warns when members share write-capable tools
 *
 * Async validators (embedding-dependent):
 * - VALID-03: detectSkillConflicts() -- cross-member skill overlap detection
 * - VALID-04: detectRoleCoherence() -- near-duplicate description warnings
 */

import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { TeamConfig, TeamMember, TeamTask, InterTeamLink } from '../types/team.js';
import { ConflictDetector } from '../conflicts/conflict-detector.js';
import { getEmbeddingService, cosineSimilarity } from '../embeddings/index.js';
import { validateTeamConfig, validateTopologyRules } from '../validation/team-validation.js';

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

/**
 * A single skill conflict entry between two skills owned by different members.
 */
export interface SkillConflictEntry {
  /** Name of the first conflicting skill. */
  skillA: string;
  /** Name of the second conflicting skill. */
  skillB: string;
  /** Agent ID of the member owning skillA. */
  memberA: string;
  /** Agent ID of the member owning skillB. */
  memberB: string;
  /** Cosine similarity between the skills. */
  similarity: number;
  /** Severity level based on similarity score. */
  severity: 'high' | 'medium';
}

/**
 * Result of cross-member skill conflict detection.
 */
export interface SkillConflictResult {
  /** Detected cross-member skill conflicts. */
  conflicts: SkillConflictEntry[];
  /** Total number of skills analyzed across all members. */
  totalSkillsAnalyzed: number;
}

/**
 * A warning about two members with different roles having near-duplicate descriptions.
 */
export interface RoleCoherenceWarning {
  /** Agent ID of the first member. */
  memberA: string;
  /** Agent ID of the second member. */
  memberB: string;
  /** Cosine similarity between their descriptions. */
  similarity: number;
  /** Human-readable suggestion for role differentiation. */
  suggestion: string;
}

/**
 * Result of role coherence validation.
 */
export interface RoleCoherenceResult {
  /** Warnings about near-duplicate descriptions across different-role members. */
  warnings: RoleCoherenceWarning[];
}

// ============================================================================
// Full Validation Types
// ============================================================================

/**
 * Options for the full team validation orchestrator.
 */
export interface TeamFullValidationOptions {
  /** Directories to search for agent .md files. Defaults to project + user scope. */
  agentsDirs?: string[];
  /** Skills that are intentionally shared across members (excluded from conflict detection). */
  sharedSkills?: string[];
  /** Similarity threshold for conflict and coherence detection. Default: 0.85. */
  threshold?: number;
  /** Optional tasks for cycle detection. If omitted, VALID-05 is skipped. */
  tasks?: TeamTask[];
  /** Member skills for conflict detection. If omitted, VALID-03 is skipped. */
  memberSkills?: Array<{ agentId: string; skills: Array<{ name: string; description: string }> }>;
  /** Member descriptions for role coherence. If omitted, VALID-04 is skipped. */
  memberDescriptions?: Array<{ agentId: string; agentType?: string; description: string }>;
  /** Related teams for inter-team link validation. If omitted, inter-team validation is skipped. */
  relatedTeams?: Array<{ name: string; outputTo?: InterTeamLink[]; inputFrom?: InterTeamLink[] }>;
}

/**
 * Result of the full team validation orchestrator.
 */
export interface TeamFullValidationResult {
  /** Whether the team config is valid (no errors). Warnings do not affect this. */
  valid: boolean;
  /** Error messages (blocking issues). */
  errors: string[];
  /** Warning messages (non-blocking suggestions). */
  warnings: string[];
  /** Per-member agent file resolution status (VALID-02). */
  memberResolution: MemberResolutionResult[];
  /** Parsed config data (if schema validation passed). */
  data?: TeamConfig;
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

// ============================================================================
// VALID-03: detectSkillConflicts
// ============================================================================

/**
 * Detect semantically overlapping skills across different team members.
 *
 * Uses the ConflictDetector to find skill pairs with high semantic similarity,
 * then filters to only cross-member conflicts (intra-member pairs are expected).
 * Supports a shared-skill exclusion list for intentionally duplicated skills.
 *
 * @param memberSkills - Array of members with their skill lists
 * @param options - Optional threshold and shared-skill exclusions
 * @returns Skill conflict result with cross-member conflicts
 */
export async function detectSkillConflicts(
  memberSkills: Array<{ agentId: string; skills: Array<{ name: string; description: string }> }>,
  options?: { sharedSkills?: string[]; threshold?: number }
): Promise<SkillConflictResult> {
  // Need at least 2 members for cross-member conflicts
  if (memberSkills.length < 2) {
    const totalSkills = memberSkills.reduce((sum, m) => sum + m.skills.length, 0);
    return { conflicts: [], totalSkillsAnalyzed: totalSkills };
  }

  // Build combined skills list with member ownership
  const allSkills: Array<{ name: string; description: string; agentId: string }> = [];
  for (const member of memberSkills) {
    for (const skill of member.skills) {
      allSkills.push({ ...skill, agentId: member.agentId });
    }
  }

  if (allSkills.length < 2) {
    return { conflicts: [], totalSkillsAnalyzed: allSkills.length };
  }

  // Run conflict detection on all skills
  const detector = new ConflictDetector({ threshold: options?.threshold ?? 0.85 });
  const detectResult = await detector.detect(
    allSkills.map((s) => ({ name: s.name, description: s.description }))
  );

  const sharedSkills = new Set(options?.sharedSkills ?? []);

  // Post-filter: keep only cross-member conflicts, exclude shared skills
  const conflicts: SkillConflictEntry[] = [];
  for (const pair of detectResult.conflicts) {
    // Find member ownership for each skill in the pair
    const ownerA = allSkills.find((s) => s.name === pair.skillA);
    const ownerB = allSkills.find((s) => s.name === pair.skillB);

    if (!ownerA || !ownerB) continue;

    // Skip intra-member conflicts (same member owns both skills)
    if (ownerA.agentId === ownerB.agentId) continue;

    // Skip conflicts involving shared skills
    if (sharedSkills.has(pair.skillA) || sharedSkills.has(pair.skillB)) continue;

    conflicts.push({
      skillA: pair.skillA,
      skillB: pair.skillB,
      memberA: ownerA.agentId,
      memberB: ownerB.agentId,
      similarity: pair.similarity,
      severity: pair.severity,
    });
  }

  return {
    conflicts,
    totalSkillsAnalyzed: allSkills.length,
  };
}

// ============================================================================
// VALID-04: detectRoleCoherence
// ============================================================================

/**
 * Detect when members with different roles have near-duplicate descriptions.
 *
 * Same-role members (e.g., multiple workers) having similar descriptions is
 * expected and normal. Different-role members with very similar descriptions
 * suggests poor role differentiation that should be addressed.
 *
 * @param members - Array of members with agentId, agentType, and description
 * @param options - Optional similarity threshold (default 0.85)
 * @returns Role coherence result with warnings for near-duplicate descriptions
 */
export async function detectRoleCoherence(
  members: Array<{ agentId: string; agentType?: string; description: string }>,
  options?: { threshold?: number }
): Promise<RoleCoherenceResult> {
  // Need at least 2 members for comparison
  if (members.length < 2) {
    return { warnings: [] };
  }

  const threshold = options?.threshold ?? 0.85;

  // Batch embed all member descriptions
  const embeddingService = await getEmbeddingService();
  const descriptions = members.map((m) => m.description);
  const ids = members.map((m) => m.agentId);
  const results = await embeddingService.embedBatch(descriptions, ids);

  const embeddings = results.map((r) => r.embedding);

  // Compare all pairs of members with DIFFERENT agentTypes
  const warnings: RoleCoherenceWarning[] = [];

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const memberA = members[i];
      const memberB = members[j];

      // Skip pairs where both have the same agentType (expected similarity)
      if (memberA.agentType === memberB.agentType) continue;

      const similarity = cosineSimilarity(embeddings[i], embeddings[j]);

      if (similarity >= threshold) {
        const typeA = memberA.agentType ?? 'unknown';
        const typeB = memberB.agentType ?? 'unknown';
        const pct = (similarity * 100).toFixed(0);

        warnings.push({
          memberA: memberA.agentId,
          memberB: memberB.agentId,
          similarity,
          suggestion: `Members "${memberA.agentId}" (${typeA}) and "${memberB.agentId}" (${typeB}) have very similar descriptions (${pct}% similar). Consider differentiating their roles.`,
        });
      }
    }
  }

  return { warnings };
}

// ============================================================================
// validateTeamFull: Full Validation Orchestrator
// ============================================================================

/**
 * Run all seven validation checks on a team configuration and aggregate results.
 *
 * Orchestration sequence:
 * 1. VALID-01: Schema validation (via validateTeamConfig) -- early return on failure
 * 2. VALID-07: Topology rules (via validateTopologyRules) -- adds errors/warnings
 * 3. VALID-02: Member resolution (via validateMemberAgents) -- informational
 * 4. VALID-05: Task cycles (via detectTaskCycles) -- if tasks provided
 * 5. VALID-06: Tool overlap (via detectToolOverlap) -- warnings only
 * 6. VALID-03: Skill conflicts (via detectSkillConflicts) -- if memberSkills provided
 * 7. VALID-04: Role coherence (via detectRoleCoherence) -- if memberDescriptions provided
 *
 * @param config - Raw team configuration data to validate
 * @param options - Optional parameters for conditional checks
 * @returns Aggregated validation result with errors, warnings, and member resolution
 */
export async function validateTeamFull(
  config: unknown,
  options?: TeamFullValidationOptions
): Promise<TeamFullValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let memberResolution: MemberResolutionResult[] = [];

  // ---- VALID-01: Schema validation ----
  const schemaResult = validateTeamConfig(config);
  if (!schemaResult.valid) {
    return {
      valid: false,
      errors: schemaResult.errors,
      warnings: schemaResult.warnings,
      memberResolution: [],
    };
  }

  const parsedConfig = schemaResult.data!;

  // ---- VALID-07: Topology rules ----
  const topoResult = validateTopologyRules(parsedConfig);
  errors.push(...topoResult.errors);
  warnings.push(...topoResult.warnings);

  // ---- VALID-02: Member resolution ----
  memberResolution = validateMemberAgents(parsedConfig.members, options?.agentsDirs);

  // ---- VALID-05: Task cycles (optional) ----
  if (options?.tasks) {
    const cycleResult = detectTaskCycles(options.tasks);
    if (cycleResult.hasCycle) {
      const cycleIds = cycleResult.cycle?.join(' -> ') ?? 'unknown';
      errors.push(`Task dependency cycle detected: ${cycleIds}`);
    }
  }

  // ---- VALID-06: Tool overlap ----
  const overlaps = detectToolOverlap(parsedConfig.members);
  for (const overlap of overlaps) {
    warnings.push(
      `Tool "${overlap.tool}" is shared by members: ${overlap.members.join(', ')}`
    );
  }

  // ---- Inter-team link validation (optional) ----
  if (options?.relatedTeams) {
    const { validateInterTeamLinks } = await import('./inter-team-bridge.js');
    const linkResult = validateInterTeamLinks(options.relatedTeams);
    errors.push(...linkResult.errors);
    warnings.push(...linkResult.warnings);
  }

  // ---- VALID-03: Skill conflicts (optional) ----
  if (options?.memberSkills) {
    const skillResult = await detectSkillConflicts(options.memberSkills, {
      sharedSkills: options.sharedSkills,
      threshold: options.threshold,
    });
    for (const conflict of skillResult.conflicts) {
      const pct = (conflict.similarity * 100).toFixed(0);
      warnings.push(
        `Skill conflict (${conflict.severity}): "${conflict.skillA}" (${conflict.memberA}) and "${conflict.skillB}" (${conflict.memberB}) are ${pct}% similar`
      );
    }
  }

  // ---- VALID-04: Role coherence (optional) ----
  if (options?.memberDescriptions) {
    const coherenceResult = await detectRoleCoherence(options.memberDescriptions, {
      threshold: options?.threshold,
    });
    for (const warning of coherenceResult.warnings) {
      warnings.push(warning.suggestion);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    memberResolution,
    data: parsedConfig,
  };
}
