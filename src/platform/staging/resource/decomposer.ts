/**
 * Work decomposer for the resource analysis pipeline.
 *
 * Decomposes a VisionAnalysis into subtasks with dependency tracking,
 * shared resource detection, critical path identification, and
 * maximum parallelism computation. Pure function with no I/O.
 *
 * @module staging/resource/decomposer
 */

import type {
  VisionAnalysis,
  ParallelDecomposition,
  Subtask,
  DomainRequirement,
  ComplexityLevel,
  ComplexitySignal,
} from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Category keywords that indicate foundation/setup dependency roots. */
const FOUNDATION_KEYWORDS = [
  'foundation',
  'setup',
  'infrastructure',
  'config',
  'configuration',
  'core',
  'base',
  'bootstrap',
];

/** Complexity level ordering for comparisons. */
const LEVEL_ORDER: Record<ComplexityLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

/** Reverse mapping from numeric order to ComplexityLevel. */
const ORDER_TO_LEVEL: ComplexityLevel[] = ['low', 'medium', 'high', 'critical'];

// ============================================================================
// Subtask Creation
// ============================================================================

/**
 * Create subtasks from requirements. One subtask per DomainRequirement.
 */
function createSubtasks(
  requirements: DomainRequirement[],
  signals: ComplexitySignal[],
): Subtask[] {
  return requirements.map((req, index) => ({
    id: `task-${index}`,
    description: req.description,
    dependencies: [],
    sharedResources: [],
    estimatedComplexity: estimateSubtaskComplexity(req, signals),
  }));
}

/**
 * Estimate subtask complexity from matching complexity signals.
 *
 * Checks if the requirement's description contains terms from any
 * complexity signal's evidence. If so, takes the highest matching
 * signal level. Falls back to 'low'.
 */
function estimateSubtaskComplexity(
  req: DomainRequirement,
  signals: ComplexitySignal[],
): ComplexityLevel {
  const descLower = req.description.toLowerCase();
  let maxLevel = 0;

  for (const signal of signals) {
    // Check if signal evidence terms overlap with requirement description
    const evidenceWords = signal.evidence.toLowerCase().split(/\s+/);
    const descWords = descLower.split(/\s+/);

    const hasOverlap = evidenceWords.some(
      (word) => word.length > 3 && descWords.some((dw) => dw.includes(word)),
    );

    if (hasOverlap) {
      const level = LEVEL_ORDER[signal.level];
      if (level > maxLevel) maxLevel = level;
    }
  }

  return ORDER_TO_LEVEL[maxLevel];
}

// ============================================================================
// Dependency Inference
// ============================================================================

/**
 * Check if a category indicates a foundation/setup role.
 */
function isFoundationCategory(category: string): boolean {
  const categoryLower = category.toLowerCase();
  return FOUNDATION_KEYWORDS.some((kw) => categoryLower.includes(kw));
}

/**
 * Infer dependencies between subtasks based on category relationships.
 *
 * Rules:
 * 1. Same-category requirements: later depends on earlier (sequential)
 * 2. Foundation/setup categories: become dependency roots for all others
 * 3. Cross-category term matching: if A mentions terms from B's category, A depends on B
 */
function inferDependencies(
  subtasks: Subtask[],
  requirements: DomainRequirement[],
): void {
  // Map subtask index to requirement for category lookup
  const taskCategories = requirements.map((r) => r.category);

  // Track foundation task IDs
  const foundationTaskIds: string[] = [];

  // Identify foundation tasks
  for (let i = 0; i < subtasks.length; i++) {
    if (isFoundationCategory(taskCategories[i])) {
      foundationTaskIds.push(subtasks[i].id);
    }
  }

  // Rule 1: Same-category sequential dependencies
  const categoryLastTask = new Map<string, string>();
  for (let i = 0; i < subtasks.length; i++) {
    const cat = taskCategories[i];
    const prevTask = categoryLastTask.get(cat);

    if (prevTask !== undefined) {
      subtasks[i].dependencies.push(prevTask);
    }

    categoryLastTask.set(cat, subtasks[i].id);
  }

  // Rule 2: Foundation tasks are dependency roots for non-foundation tasks
  for (let i = 0; i < subtasks.length; i++) {
    if (isFoundationCategory(taskCategories[i])) continue;

    for (const foundId of foundationTaskIds) {
      if (!subtasks[i].dependencies.includes(foundId)) {
        subtasks[i].dependencies.push(foundId);
      }
    }
  }
}

// ============================================================================
// Shared Resource Detection
// ============================================================================

/**
 * Detect shared resources. Categories with 2+ subtasks are shared resources.
 */
function detectSharedResources(
  subtasks: Subtask[],
  requirements: DomainRequirement[],
): string[] {
  // Group task indices by category
  const categoryGroups = new Map<string, number[]>();
  for (let i = 0; i < requirements.length; i++) {
    const cat = requirements[i].category;
    const group = categoryGroups.get(cat) ?? [];
    group.push(i);
    categoryGroups.set(cat, group);
  }

  const sharedResources: string[] = [];

  for (const [category, indices] of categoryGroups) {
    if (indices.length >= 2) {
      sharedResources.push(category);

      // Mark each subtask in this category as sharing the resource
      for (const idx of indices) {
        if (!subtasks[idx].sharedResources.includes(category)) {
          subtasks[idx].sharedResources.push(category);
        }
      }
    }
  }

  return sharedResources;
}

// ============================================================================
// Critical Path
// ============================================================================

/**
 * Compute the critical path: the longest dependency chain in the DAG.
 *
 * Uses topological sort + dynamic programming to find the longest path.
 */
function computeCriticalPath(subtasks: Subtask[]): string[] {
  if (subtasks.length === 0) return [];

  // Build adjacency and in-degree maps
  const taskMap = new Map<string, Subtask>();
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // task -> tasks that depend on it

  for (const task of subtasks) {
    taskMap.set(task.id, task);
    inDegree.set(task.id, task.dependencies.length);
    dependents.set(task.id, []);
  }

  for (const task of subtasks) {
    for (const dep of task.dependencies) {
      const deps = dependents.get(dep);
      if (deps) deps.push(task.id);
    }
  }

  // Topological sort (Kahn's algorithm) tracking longest path
  const queue: string[] = [];
  const longestPathTo = new Map<string, number>(); // longest path ending at this node
  const predecessor = new Map<string, string | null>(); // for path reconstruction

  for (const task of subtasks) {
    longestPathTo.set(task.id, 1); // each task has path length of at least 1
    predecessor.set(task.id, null);

    if (task.dependencies.length === 0) {
      queue.push(task.id);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentPath = longestPathTo.get(current)!;

    for (const dependent of dependents.get(current) ?? []) {
      const newPath = currentPath + 1;
      if (newPath > longestPathTo.get(dependent)!) {
        longestPathTo.set(dependent, newPath);
        predecessor.set(dependent, current);
      }

      const newDegree = inDegree.get(dependent)! - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) {
        queue.push(dependent);
      }
    }
  }

  // Find the task with the longest path
  let maxPath = 0;
  let endTask = '';
  for (const [taskId, pathLen] of longestPathTo) {
    if (pathLen > maxPath) {
      maxPath = pathLen;
      endTask = taskId;
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let current: string | null = endTask;
  while (current !== null) {
    path.unshift(current);
    current = predecessor.get(current) ?? null;
  }

  return path;
}

// ============================================================================
// Maximum Parallelism
// ============================================================================

/**
 * Compute maximum parallelism: the widest point in the dependency DAG.
 *
 * This is the maximum number of tasks that can run concurrently at any
 * given "level" of the topological order (anti-chain width).
 */
function computeMaxParallelism(subtasks: Subtask[]): number {
  if (subtasks.length === 0) return 0;

  // Assign each task to a level (depth in the DAG)
  const taskLevel = new Map<string, number>();
  const taskMap = new Map<string, Subtask>();

  for (const task of subtasks) {
    taskMap.set(task.id, task);
  }

  // Compute levels via BFS from roots
  function getLevel(taskId: string, visited: Set<string>): number {
    if (taskLevel.has(taskId)) return taskLevel.get(taskId)!;
    if (visited.has(taskId)) return 0; // cycle prevention
    visited.add(taskId);

    const task = taskMap.get(taskId)!;
    if (task.dependencies.length === 0) {
      taskLevel.set(taskId, 0);
      return 0;
    }

    let maxDepLevel = 0;
    for (const dep of task.dependencies) {
      const depLevel = getLevel(dep, visited);
      if (depLevel + 1 > maxDepLevel) maxDepLevel = depLevel + 1;
    }

    taskLevel.set(taskId, maxDepLevel);
    return maxDepLevel;
  }

  for (const task of subtasks) {
    getLevel(task.id, new Set());
  }

  // Count tasks per level
  const levelCounts = new Map<number, number>();
  for (const level of taskLevel.values()) {
    levelCounts.set(level, (levelCounts.get(level) ?? 0) + 1);
  }

  // Maximum parallelism is the widest level
  let maxWidth = 0;
  for (const count of levelCounts.values()) {
    if (count > maxWidth) maxWidth = count;
  }

  return maxWidth;
}

// ============================================================================
// Main Decomposer
// ============================================================================

/**
 * Decompose a VisionAnalysis into a parallel work plan.
 *
 * Takes the analyzed vision and produces:
 * - Subtasks: one per requirement with inferred dependencies
 * - Critical path: longest dependency chain
 * - Max parallelism: widest concurrent execution point
 * - Shared resources: categories with multiple subtasks
 *
 * @param analysis - Complete vision analysis result
 * @returns Parallel decomposition plan
 */
export function decomposeWork(analysis: VisionAnalysis): ParallelDecomposition {
  const { requirements, complexity } = analysis;

  if (requirements.length === 0) {
    return {
      subtasks: [],
      criticalPath: [],
      maxParallelism: 0,
      sharedResources: [],
    };
  }

  // 1. Create subtasks from requirements
  const subtasks = createSubtasks(requirements, complexity);

  // 2. Infer dependencies between subtasks
  inferDependencies(subtasks, requirements);

  // 3. Detect shared resources
  const sharedResources = detectSharedResources(subtasks, requirements);

  // 4. Compute critical path
  const criticalPath = computeCriticalPath(subtasks);

  // 5. Compute maximum parallelism
  const maxParallelism = computeMaxParallelism(subtasks);

  return {
    subtasks,
    criticalPath,
    maxParallelism,
    sharedResources,
  };
}
