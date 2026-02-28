/**
 * Wave planner core -- decomposes mission component specs into dependency-ordered
 * waves with parallel track detection and Wave 0 enforcement.
 *
 * Provides three key capabilities:
 * - planWaves(): Full wave decomposition from milestone + component specs
 * - detectParallelTracks(): Groups non-conflicting specs into concurrent tracks
 * - enforceWaveZero(): Identifies foundation specs (types/schemas/config)
 *
 * Replaces the placeholder single-wave plan from Phase 282 with a real
 * multi-wave planner that maximizes parallelism while respecting dependency
 * ordering.
 *
 * @module vtm/wave-planner
 */

import type {
  MilestoneSpec,
  ComponentSpec,
  WaveExecutionPlan,
  Wave,
  Track,
  WaveTask,
  WaveSummaryEntry,
} from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Keywords that identify Wave 0 (foundation) components. */
const WAVE_ZERO_KEYWORDS = [
  'types',
  'interfaces',
  'schema',
  'config',
  'type definitions',
  'interface contracts',
];

// ---------------------------------------------------------------------------
// enforceWaveZero
// ---------------------------------------------------------------------------

/**
 * Identify component specs that must be in Wave 0 (foundation).
 *
 * A spec is forced to Wave 0 if:
 * 1. It has no dependencies, AND
 * 2. Its objective or produces contain type/interface/schema/config keywords
 *
 * @param specs - All component specs
 * @returns Set of spec names that belong in Wave 0
 */
function enforceWaveZero(specs: ComponentSpec[]): Set<string> {
  const wave0Names = new Set<string>();

  for (const spec of specs) {
    // Only specs with no dependencies can be forced to Wave 0
    if (spec.dependencies.length > 0) continue;

    const objectiveLower = spec.objective.toLowerCase();
    const producesLower = spec.produces.map(p => p.toLowerCase()).join(' ');
    const searchText = `${objectiveLower} ${producesLower}`;

    const isFoundation = WAVE_ZERO_KEYWORDS.some(kw => searchText.includes(kw));
    if (isFoundation) {
      wave0Names.add(spec.name);
    }
  }

  return wave0Names;
}

// ---------------------------------------------------------------------------
// detectParallelTracks
// ---------------------------------------------------------------------------

/**
 * Group component specs into parallel tracks within a wave.
 *
 * Two specs conflict (cannot share a track) if:
 * - One depends on the other (dependency relationship)
 * - Both produce the same artifact (shared mutable state)
 *
 * Uses greedy graph coloring to assign specs to tracks such that no two
 * conflicting specs share a track.
 *
 * @param specs - Component specs within a single wave
 * @param allSpecs - All component specs (for resolving cross-wave dependencies)
 * @returns Array of Track objects grouping non-conflicting tasks
 */
export function detectParallelTracks(
  specs: ComponentSpec[],
  allSpecs: ComponentSpec[],
): Track[] {
  if (specs.length === 0) {
    return [{ name: 'Track A', tasks: [] }];
  }

  // Build conflict adjacency: spec index -> set of conflicting spec indices
  const conflicts = new Map<number, Set<number>>();
  for (let i = 0; i < specs.length; i++) {
    conflicts.set(i, new Set());
  }

  for (let i = 0; i < specs.length; i++) {
    for (let j = i + 1; j < specs.length; j++) {
      const a = specs[i];
      const b = specs[j];

      // Conflict: dependency relationship
      const aDepB = a.dependencies.includes(b.name);
      const bDepA = b.dependencies.includes(a.name);

      // Conflict: shared produces artifact
      const aProduces = new Set(a.produces);
      const sharedArtifact = b.produces.some(p => aProduces.has(p));

      if (aDepB || bDepA || sharedArtifact) {
        conflicts.get(i)!.add(j);
        conflicts.get(j)!.add(i);
      }
    }
  }

  // Greedy graph coloring
  const colors = new Map<number, number>(); // spec index -> track index

  for (let i = 0; i < specs.length; i++) {
    const usedColors = new Set<number>();
    for (const neighbor of conflicts.get(i)!) {
      if (colors.has(neighbor)) {
        usedColors.add(colors.get(neighbor)!);
      }
    }

    // Assign the smallest available color
    let color = 0;
    while (usedColors.has(color)) {
      color++;
    }
    colors.set(i, color);
  }

  // Group specs by color (track)
  const trackCount = Math.max(...[...colors.values()]) + 1;
  const trackMap = new Map<number, WaveTask[]>();

  for (let i = 0; i < specs.length; i++) {
    const trackIdx = colors.get(i)!;
    if (!trackMap.has(trackIdx)) {
      trackMap.set(trackIdx, []);
    }
    trackMap.get(trackIdx)!.push(specToTask(specs[i]));
  }

  // Build Track objects with alphabetic names
  const tracks: Track[] = [];
  for (let t = 0; t < trackCount; t++) {
    const tasks = trackMap.get(t) ?? [];
    if (tasks.length > 0) {
      tracks.push({
        name: `Track ${String.fromCharCode(65 + t)}`, // A, B, C, ...
        tasks,
      });
    }
  }

  return tracks;
}

// ---------------------------------------------------------------------------
// planWaves
// ---------------------------------------------------------------------------

/**
 * Decompose mission component specs into dependency-ordered waves.
 *
 * Algorithm:
 * 1. Identify Wave 0 candidates via enforceWaveZero
 * 2. Topological sort all specs into waves respecting dependencies
 * 3. Force Wave 0 candidates to wave 0 (merge if needed)
 * 4. Detect parallel tracks within each wave
 * 5. Build WaveExecutionPlan with naming, summary, and critical path
 *
 * @param milestoneSpec - Milestone specification for naming and metadata
 * @param componentSpecs - All component specs to decompose
 * @returns Complete WaveExecutionPlan
 */
export function planWaves(
  milestoneSpec: MilestoneSpec,
  componentSpecs: ComponentSpec[],
): WaveExecutionPlan {
  const wave0Forced = enforceWaveZero(componentSpecs);

  // --- Topological sort into wave assignments ---
  const waveAssignment = new Map<string, number>();
  const assigned = new Set<string>();

  // Phase 1: Assign Wave 0 -- forced foundation specs + specs with no dependencies
  let currentWave = 0;

  while (assigned.size < componentSpecs.length) {
    const waveSpecs: string[] = [];

    for (const spec of componentSpecs) {
      if (assigned.has(spec.name)) continue;

      // All dependencies must be in prior waves
      const allDepsAssigned = spec.dependencies.every(dep => assigned.has(dep));
      if (!allDepsAssigned) continue;

      // If this is wave 0, also include forced Wave 0 specs
      if (currentWave === 0 && wave0Forced.has(spec.name)) {
        waveSpecs.push(spec.name);
      } else if (allDepsAssigned) {
        waveSpecs.push(spec.name);
      }
    }

    // Cyclic dependency fallback: assign all remaining to current wave
    if (waveSpecs.length === 0) {
      for (const spec of componentSpecs) {
        if (!assigned.has(spec.name)) {
          waveAssignment.set(spec.name, currentWave);
          assigned.add(spec.name);
        }
      }
      break;
    }

    for (const name of waveSpecs) {
      waveAssignment.set(name, currentWave);
      assigned.add(name);
    }

    currentWave++;
  }

  // --- Group specs by wave number ---
  const waveGroups = new Map<number, ComponentSpec[]>();
  for (const spec of componentSpecs) {
    const waveNum = waveAssignment.get(spec.name) ?? 0;
    if (!waveGroups.has(waveNum)) {
      waveGroups.set(waveNum, []);
    }
    waveGroups.get(waveNum)!.push(spec);
  }

  const sortedWaveNumbers = [...waveGroups.keys()].sort((a, b) => a - b);
  const totalWaves = sortedWaveNumbers.length;

  // --- Build Wave objects with parallel tracks ---
  const waves: Wave[] = [];
  const waveSummary: WaveSummaryEntry[] = [];
  let maxTracks = 0;

  for (let i = 0; i < sortedWaveNumbers.length; i++) {
    const waveNum = sortedWaveNumbers[i];
    const waveSpecs = waveGroups.get(waveNum)!;

    // Detect parallel tracks
    const tracks = detectParallelTracks(waveSpecs, componentSpecs);
    if (tracks.length > maxTracks) {
      maxTracks = tracks.length;
    }

    // Determine wave name
    const waveName = getWaveName(i, totalWaves, tracks.length > 1);

    // Determine purpose
    const purpose = waveSpecs.length === 1
      ? `Execute ${waveSpecs[0].name}`
      : `Execute ${waveSpecs.length} components${tracks.length > 1 ? ` across ${tracks.length} parallel tracks` : ''}`;

    // isSequential: true only if there's exactly 1 track and specs have
    // inter-dependencies. Wave 0 (foundation types) is always non-sequential.
    const isSequential = i > 0 && tracks.length === 1 && waveSpecs.length > 1;

    const wave: Wave = {
      number: i,
      name: waveName,
      purpose,
      isSequential,
      tracks,
    };

    waves.push(wave);

    // Estimate time for this wave based on tokens
    const waveTokens = waveSpecs.reduce((sum, s) => sum + s.estimatedTokens, 0);
    const estMinutes = Math.ceil(waveTokens / 5000);

    // Cache dependencies: list prior waves
    const cacheDeps = i === 0
      ? 'None (foundation wave)'
      : `Wave ${sortedWaveNumbers.slice(0, i).join(', Wave ')}`;

    waveSummary.push({
      wave: i,
      tasks: waveSpecs.length,
      parallelTracks: tracks.length,
      estimatedTime: `${estMinutes} min`,
      cacheDependencies: cacheDeps,
    });
  }

  // --- Critical path ---
  const criticalPath = computeCriticalPath(componentSpecs, waveAssignment);

  // --- Estimated wall time ---
  // Sum of longest track per wave
  const wallTimeMinutes = waveSummary.reduce((sum, ws) => {
    const waveSpecs = waveGroups.get(sortedWaveNumbers[ws.wave])!;
    const maxTokensPerTrack = Math.max(
      ...waves[ws.wave].tracks.map(t =>
        t.tasks.reduce((s, task) => s + task.estimatedTokens, 0),
      ),
    );
    return sum + Math.ceil(maxTokensPerTrack / 5000);
  }, 0);

  return {
    milestoneName: milestoneSpec.name,
    milestoneSpec: 'milestone-spec.md',
    totalTasks: componentSpecs.length,
    parallelTracks: maxTracks,
    sequentialDepth: totalWaves,
    estimatedWallTime: `${wallTimeMinutes} min`,
    criticalPath,
    waveSummary,
    waves,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Convert a ComponentSpec to a WaveTask.
 *
 * Maps ComponentSpec fields to WaveTask fields:
 * - id: sanitized name as task-NNN pattern
 * - description: objective
 * - produces: first produces entry
 * - model: modelAssignment
 * - estimatedTokens: estimatedTokens
 * - dependsOn: dependencies
 */
function specToTask(spec: ComponentSpec): WaveTask {
  const sanitizedId = `task-${spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`;
  return {
    id: sanitizedId,
    description: spec.objective,
    produces: spec.produces[0] ?? `${spec.name} implementation`,
    model: spec.modelAssignment,
    estimatedTokens: spec.estimatedTokens,
    dependsOn: spec.dependencies,
  };
}

/**
 * Assign a name to a wave based on its position and total wave count.
 *
 * Naming convention:
 * - Wave 0 always: "Foundation"
 * - With 4+ waves: 0=Foundation, last=Polish, second-to-last=Integration,
 *   middle waves: "Parallel Implementation" if parallel, "Wave N" otherwise
 * - With <4 waves: 0=Foundation, others: "Parallel Implementation" if
 *   parallel, "Wave N" otherwise
 */
function getWaveName(index: number, totalWaves: number, hasParallelTracks: boolean): string {
  if (index === 0) return 'Foundation';

  if (totalWaves >= 4) {
    if (index === totalWaves - 1) return 'Polish';
    if (index === totalWaves - 2) return 'Integration';
  }

  if (hasParallelTracks) return 'Parallel Implementation';
  return `Wave ${index}`;
}

/**
 * Compute the critical path description from component specs.
 *
 * Finds the longest dependency chain by tracing from each leaf spec
 * back through its dependencies. Returns the chain with the most nodes.
 */
function computeCriticalPath(
  specs: ComponentSpec[],
  waveAssignment: Map<string, number>,
): string {
  const specMap = new Map(specs.map(s => [s.name, s]));

  // Find all leaf specs (no other spec depends on them)
  const dependedOn = new Set<string>();
  for (const spec of specs) {
    for (const dep of spec.dependencies) {
      dependedOn.add(dep);
    }
  }
  const leaves = specs.filter(s => !dependedOn.has(s.name));

  // BFS/trace back from each leaf to find longest chain
  let longestChain: string[] = [];

  for (const leaf of leaves) {
    const chain = traceChain(leaf.name, specMap);
    if (chain.length > longestChain.length) {
      longestChain = chain;
    }
  }

  // If no leaves found (all cyclic), just list all specs
  if (longestChain.length === 0) {
    longestChain = specs.map(s => s.name);
  }

  return longestChain.join(' -> ');
}

/**
 * Trace the dependency chain from a spec back to its roots.
 * Returns the chain in root-to-leaf order.
 */
function traceChain(
  name: string,
  specMap: Map<string, ComponentSpec>,
  visited: Set<string> = new Set(),
): string[] {
  if (visited.has(name)) return [name]; // cycle guard
  visited.add(name);

  const spec = specMap.get(name);
  if (!spec || spec.dependencies.length === 0) return [name];

  // Find the longest dependency chain among our dependencies
  let longestPrefix: string[] = [];
  for (const dep of spec.dependencies) {
    const prefix = traceChain(dep, specMap, new Set(visited));
    if (prefix.length > longestPrefix.length) {
      longestPrefix = prefix;
    }
  }

  return [...longestPrefix, name];
}
