/**
 * Task Decomposition Suggester — Layer 2, Wave 2
 *
 * Converts top sequence patterns into decomposition templates.
 * Assigns agent archetypes per phase, estimates durations,
 * identifies parallelizable phases.
 */

import type {
  SequencePattern,
  ClusterResult,
  DecompositionTemplate,
  DecompositionPhase,
} from './types.js';

// ============================================================================
// Template Generation
// ============================================================================

/**
 * Generate a decomposition template from a sequence pattern.
 * Uses cluster archetypes to assign recommended agent types per phase.
 */
export function generateTemplate(
  pattern: SequencePattern,
  clusters: ClusterResult[],
  avgDurationPerType: Map<string, number>,
): DecompositionTemplate {
  const phases: DecompositionPhase[] = pattern.sequence.map((taskType, idx) => {
    // Find best matching archetype for this task type
    const archetype = findBestArchetype(taskType, clusters);
    const duration = avgDurationPerType.get(taskType) ?? 3600000; // default 1 hour

    // Dependencies: each phase depends on the previous (linear by default)
    const dependencies = idx > 0 ? [pattern.sequence[idx - 1]] : [];

    return {
      name: `Phase ${idx + 1}: ${taskType}`,
      taskType,
      recommendedArchetype: archetype,
      estimatedDurationMs: duration,
      dependencies,
    };
  });

  // Identify parallelizable phases (phases with no data dependency)
  const parallelGroups = findParallelGroups(phases);

  // Total duration considers parallelism
  const estimatedDurationMs = estimateParallelDuration(phases, parallelGroups);

  return {
    id: `tmpl-${pattern.id}`,
    sourcePatternId: pattern.id,
    phases,
    estimatedDurationMs,
    parallelizablePhases: parallelGroups,
    confidence: pattern.score,
  };
}

/**
 * Find the best matching cluster archetype for a task type.
 */
function findBestArchetype(taskType: string, clusters: ClusterResult[]): string {
  let bestArchetype = 'generalist';
  let bestScore = -1;

  for (const cluster of clusters) {
    const score = cluster.centroid[taskType] ?? 0;
    if (score > bestScore) {
      bestScore = score;
      bestArchetype = cluster.archetype;
    }
  }

  return bestArchetype;
}

/**
 * Find groups of phases that can run in parallel.
 * Two phases can be parallel if neither depends on the other
 * (based on the dependency graph, not just linear order).
 */
export function findParallelGroups(phases: DecompositionPhase[]): string[][] {
  // Build dependency graph
  const dependsOn = new Map<string, Set<string>>();
  for (const phase of phases) {
    dependsOn.set(phase.taskType, new Set(phase.dependencies));
  }

  // Compute transitive closure
  const transitiveReach = new Map<string, Set<string>>();
  for (const phase of phases) {
    const reachable = new Set<string>();
    const queue = [...(dependsOn.get(phase.taskType) ?? [])];
    while (queue.length > 0) {
      const dep = queue.pop()!;
      if (!reachable.has(dep)) {
        reachable.add(dep);
        for (const d of dependsOn.get(dep) ?? []) {
          queue.push(d);
        }
      }
    }
    transitiveReach.set(phase.taskType, reachable);
  }

  // Group phases by topological level
  const levels = new Map<string, number>();
  function getLevel(taskType: string): number {
    if (levels.has(taskType)) return levels.get(taskType)!;
    const deps = dependsOn.get(taskType) ?? new Set();
    if (deps.size === 0) {
      levels.set(taskType, 0);
      return 0;
    }
    let maxDep = 0;
    for (const dep of deps) {
      maxDep = Math.max(maxDep, getLevel(dep) + 1);
    }
    levels.set(taskType, maxDep);
    return maxDep;
  }

  for (const phase of phases) {
    getLevel(phase.taskType);
  }

  // Group by level (same level = parallelizable)
  const groups = new Map<number, string[]>();
  for (const [taskType, level] of levels) {
    const group = groups.get(level) ?? [];
    group.push(taskType);
    groups.set(level, group);
  }

  return Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, types]) => types)
    .filter(group => group.length > 1); // Only return groups with actual parallelism
}

/**
 * Estimate total duration considering parallelism.
 */
function estimateParallelDuration(
  phases: DecompositionPhase[],
  parallelGroups: string[][],
): number {
  const durationMap = new Map<string, number>();
  for (const phase of phases) {
    durationMap.set(phase.taskType, phase.estimatedDurationMs);
  }

  // For parallel groups, take the max duration
  const parallelTypes = new Set(parallelGroups.flat());
  let totalDuration = 0;

  // Handle parallel groups
  for (const group of parallelGroups) {
    const maxDuration = Math.max(...group.map(t => durationMap.get(t) ?? 0));
    totalDuration += maxDuration;
  }

  // Add sequential phases
  for (const phase of phases) {
    if (!parallelTypes.has(phase.taskType)) {
      totalDuration += phase.estimatedDurationMs;
    }
  }

  return totalDuration;
}

// ============================================================================
// Batch Template Generation
// ============================================================================

/**
 * Generate templates for the top-N patterns.
 */
export function generateTemplates(
  patterns: SequencePattern[],
  clusters: ClusterResult[],
  avgDurationPerType: Map<string, number>,
  topN: number = 10,
): DecompositionTemplate[] {
  return patterns
    .slice(0, topN)
    .map(pattern => generateTemplate(pattern, clusters, avgDurationPerType));
}
