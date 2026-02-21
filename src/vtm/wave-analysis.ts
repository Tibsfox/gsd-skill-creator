/**
 * Wave analysis functions -- dependency graph visualization, sequential
 * savings computation, and risk factor analysis for wave execution plans.
 *
 * Provides three key capabilities:
 * - generateDependencyGraph(): ASCII DAG with critical path visualization
 * - computeSequentialSavings(): Wall-time savings from parallel execution
 * - analyzeRiskFactors(): Cache TTL, interface mismatch, model capacity risks
 *
 * Operates on the WaveExecutionPlan produced by planWaves() from wave-planner.
 *
 * @module vtm/wave-analysis
 */

import type { WaveExecutionPlan, ComponentSpec, WaveTask } from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Tokens per minute estimation for Claude execution speed. */
const TOKENS_PER_MINUTE = 1000;

/** Threshold in tokens for Wave 0 cache TTL exceedance risk (roughly 5 min). */
const CACHE_TTL_TOKEN_THRESHOLD = 300000;

/** Threshold in tokens for model capacity risk. */
const MODEL_CAPACITY_TOKEN_THRESHOLD = 100000;

/** Minimum wave separation for interface mismatch risk. */
const INTERFACE_MISMATCH_WAVE_GAP = 2;

// ---------------------------------------------------------------------------
// generateDependencyGraph
// ---------------------------------------------------------------------------

/**
 * Produce an ASCII dependency graph from a wave execution plan.
 *
 * Renders each wave as a section with task nodes grouped by track.
 * Tasks on the critical path are prefixed with `*` to visually distinguish
 * them. Dependency arrows connect tasks across waves.
 *
 * @param plan - Complete wave execution plan
 * @returns Multi-line ASCII string showing the dependency DAG
 */
export function generateDependencyGraph(plan: WaveExecutionPlan): string {
  const lines: string[] = [];

  // Parse critical path task IDs from plan.criticalPath string
  const criticalPathIds = parseCriticalPath(plan);

  for (const wave of plan.waves) {
    // Wave header
    lines.push(`--- Wave ${wave.number}: ${wave.name} ---`);

    // Render tracks side by side within the wave
    const allTasks = wave.tracks.flatMap(t => t.tasks);

    if (wave.tracks.length === 1) {
      // Single track -- render vertically
      for (const task of wave.tracks[0].tasks) {
        const marker = criticalPathIds.has(task.id) ? '*' : ' ';
        lines.push(`  ${marker}[${task.id}]`);
      }
    } else {
      // Multiple tracks -- render side by side
      const trackLabels: string[] = [];
      for (const track of wave.tracks) {
        for (const task of track.tasks) {
          const marker = criticalPathIds.has(task.id) ? '*' : ' ';
          trackLabels.push(`${marker}[${task.id}]`);
        }
      }
      lines.push(`  ${trackLabels.join('    ')}`);
    }

    // Draw dependency arrows to next wave
    const nextWaveIdx = wave.number + 1;
    const nextWave = plan.waves.find(w => w.number === nextWaveIdx);
    if (nextWave) {
      // Collect tasks from current wave that feed into next wave
      const currentIds = new Set(allTasks.map(t => t.id));
      const nextTasks = nextWave.tracks.flatMap(t => t.tasks);
      const hasConnection = nextTasks.some(t =>
        t.dependsOn.some(dep => {
          // Match by dependency name against current task IDs
          return allTasks.some(ct =>
            ct.id.includes(dep.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
          );
        }),
      );

      if (hasConnection || nextWave) {
        // Render vertical connector
        const arrowCount = Math.min(allTasks.length, 3);
        const arrows = Array(arrowCount).fill('|').join('        ');
        lines.push(`  ${arrows}`);
      }
    }
  }

  // Append critical path summary
  if (plan.criticalPath) {
    lines.push('');
    lines.push(`Critical path: ${plan.criticalPath}`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// computeSequentialSavings
// ---------------------------------------------------------------------------

/**
 * Compute wall-time savings of parallel execution over sequential.
 *
 * For each wave:
 * - Sequential time = sum of ALL task tokens across ALL tracks
 * - Parallel time = max track total (sum of tokens per track)
 *
 * Tokens are converted to minutes using the standard estimation rate.
 *
 * @param plan - Complete wave execution plan
 * @returns Object with human-readable times and speedup factor
 */
export function computeSequentialSavings(plan: WaveExecutionPlan): {
  sequentialTime: string;
  parallelTime: string;
  savedTime: string;
  speedupFactor: number;
} {
  let totalSequentialTokens = 0;
  let totalParallelTokens = 0;

  for (const wave of plan.waves) {
    // Sequential: sum all task tokens across all tracks
    const waveSequentialTokens = wave.tracks.reduce(
      (sum, track) => sum + track.tasks.reduce((s, t) => s + t.estimatedTokens, 0),
      0,
    );

    // Parallel: max track total
    const waveParallelTokens = Math.max(
      ...wave.tracks.map(track =>
        track.tasks.reduce((s, t) => s + t.estimatedTokens, 0),
      ),
    );

    totalSequentialTokens += waveSequentialTokens;
    totalParallelTokens += waveParallelTokens;
  }

  const sequentialMinutes = Math.ceil(totalSequentialTokens / TOKENS_PER_MINUTE);
  const parallelMinutes = Math.ceil(totalParallelTokens / TOKENS_PER_MINUTE);
  const savedMinutes = sequentialMinutes - parallelMinutes;

  // Avoid division by zero
  const speedupFactor = totalParallelTokens > 0
    ? Math.round((totalSequentialTokens / totalParallelTokens) * 10) / 10
    : 1.0;

  return {
    sequentialTime: formatMinutes(sequentialMinutes),
    parallelTime: formatMinutes(parallelMinutes),
    savedTime: formatMinutes(savedMinutes),
    speedupFactor,
  };
}

// ---------------------------------------------------------------------------
// analyzeRiskFactors
// ---------------------------------------------------------------------------

/**
 * Identify execution risks in a wave execution plan.
 *
 * Checks for three risk categories:
 * 1. **Cache TTL Exceedance** -- Wave 0 total tokens exceed threshold
 * 2. **Interface Mismatch** -- Producer/consumer components 2+ waves apart
 * 3. **Model Capacity** -- Component with tokens exceeding single context window
 *
 * @param plan - Complete wave execution plan
 * @param componentSpecs - All component specs for cross-reference analysis
 * @returns Array of identified risk objects (empty if no risks)
 */
export function analyzeRiskFactors(
  plan: WaveExecutionPlan,
  componentSpecs: ComponentSpec[],
): Array<{ risk: string; impact: string; mitigation: string }> {
  const risks: Array<{ risk: string; impact: string; mitigation: string }> = [];

  // --- 1. Cache TTL Exceedance ---
  checkCacheTTL(plan, risks);

  // --- 2. Interface Mismatch ---
  checkInterfaceMismatch(plan, componentSpecs, risks);

  // --- 3. Model Capacity ---
  checkModelCapacity(componentSpecs, risks);

  return risks;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Parse the critical path string to extract task IDs that are on the path.
 *
 * The criticalPath field is a human-readable string like "A -> B -> C".
 * We extract the component names and convert them to task IDs using the
 * same sanitization as specToTask in wave-planner.
 */
function parseCriticalPath(plan: WaveExecutionPlan): Set<string> {
  const ids = new Set<string>();

  if (!plan.criticalPath) return ids;

  // Collect all task IDs from the plan
  const allTasks = plan.waves.flatMap(w => w.tracks.flatMap(t => t.tasks));

  // Parse names from critical path string (e.g., "A -> B -> C")
  const names = plan.criticalPath.split('->').map(s => s.trim());

  for (const name of names) {
    // Match against task IDs by checking if the task ID contains the
    // sanitized name
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    for (const task of allTasks) {
      if (task.id.includes(sanitized)) {
        ids.add(task.id);
      }
    }
  }

  return ids;
}

/**
 * Format minutes as human-readable time string.
 *
 * Examples: "5min", "1h 30min", "2h 0min"
 */
function formatMinutes(minutes: number): string {
  if (minutes < 0) minutes = 0;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
}

/**
 * Check for Cache TTL Exceedance risk in Wave 0.
 */
function checkCacheTTL(
  plan: WaveExecutionPlan,
  risks: Array<{ risk: string; impact: string; mitigation: string }>,
): void {
  const wave0 = plan.waves.find(w => w.number === 0);
  if (!wave0) return;

  const wave0Tokens = wave0.tracks.reduce(
    (sum, track) => sum + track.tasks.reduce((s, t) => s + t.estimatedTokens, 0),
    0,
  );

  if (wave0Tokens > CACHE_TTL_TOKEN_THRESHOLD) {
    risks.push({
      risk: 'Cache TTL Exceedance',
      impact: 'Wave 0 completion may exceed 5-minute cache TTL, causing stale types for Wave 1 consumers',
      mitigation: 'Split Wave 0 into smaller batches or pre-compute shared types before wave execution begins',
    });
  }
}

/**
 * Check for Interface Mismatch risk between distant producer/consumer pairs.
 *
 * For each component that has dependencies, finds the producer component
 * and checks if they are 2+ waves apart in the execution plan.
 */
function checkInterfaceMismatch(
  plan: WaveExecutionPlan,
  componentSpecs: ComponentSpec[],
  risks: Array<{ risk: string; impact: string; mitigation: string }>,
): void {
  // Build wave assignment map from component specs to wave numbers.
  // Match specs to plan tasks by sanitizing the spec name and checking
  // if any task ID contains that sanitized name.
  const waveAssignment = new Map<string, number>();

  for (const spec of componentSpecs) {
    const sanitized = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    for (const wave of plan.waves) {
      for (const track of wave.tracks) {
        for (const task of track.tasks) {
          // Match task ID exactly or check the suffix after 'task-' starts with the sanitized name
          const taskSuffix = task.id.replace(/^task-/, '');
          if (taskSuffix === sanitized || taskSuffix.startsWith(`${sanitized}-`)) {
            waveAssignment.set(spec.name, wave.number);
          }
        }
      }
    }
  }

  // Check each dependency pair for wave gap
  const flagged = new Set<string>();
  for (const spec of componentSpecs) {
    for (const dep of spec.dependencies) {
      const producerWave = waveAssignment.get(dep);
      const consumerWave = waveAssignment.get(spec.name);

      if (producerWave === undefined || consumerWave === undefined) continue;

      const gap = Math.abs(consumerWave - producerWave);
      const key = `${dep}-${spec.name}`;

      if (gap >= INTERFACE_MISMATCH_WAVE_GAP && !flagged.has(key)) {
        flagged.add(key);
        risks.push({
          risk: 'Interface Mismatch',
          impact: `Producer ${dep} (Wave ${producerWave}) and consumer ${spec.name} (Wave ${consumerWave}) may drift if interface changes during execution`,
          mitigation: `Add explicit interface contract tests between ${dep} and ${spec.name} to catch drift early`,
        });
      }
    }
  }
}

/**
 * Check for Model Capacity risk on large components.
 */
function checkModelCapacity(
  componentSpecs: ComponentSpec[],
  risks: Array<{ risk: string; impact: string; mitigation: string }>,
): void {
  for (const spec of componentSpecs) {
    if (spec.estimatedTokens > MODEL_CAPACITY_TOKEN_THRESHOLD) {
      risks.push({
        risk: 'Model Capacity',
        impact: `Component ${spec.name} (${spec.estimatedTokens} tokens) may exceed single context window capacity for ${spec.modelAssignment}`,
        mitigation: `Split ${spec.name} into sub-tasks or use a larger context model tier`,
      });
    }
  }
}
