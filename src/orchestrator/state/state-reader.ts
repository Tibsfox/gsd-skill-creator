/**
 * ProjectStateReader service.
 *
 * Assembles all state parsers (roadmap, state, project, config) into
 * a single typed ProjectState object. Handles every combination of
 * present/missing .planning/ files gracefully: missing files produce
 * null fields, missing directory produces an uninitialized state.
 *
 * This is the primary API surface consumed by Phase 38 (intent
 * classification), Phase 39 (lifecycle coordination), Phase 40 (CLI),
 * and Phase 45 (work state persistence).
 */

import { access } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { readFileSafe, GsdConfigSchema } from './types.js';
import type { ProjectState } from './types.js';
import { parseRoadmap } from './roadmap-parser.js';
import { parseState } from './state-parser.js';
import { parseProject } from './project-parser.js';
import { parseConfig } from './config-reader.js';

/**
 * Default config produced by parsing an empty object through Zod.
 * Used when config.json is missing or invalid.
 */
function getDefaultConfig() {
  return GsdConfigSchema.parse({});
}

/**
 * Reads and assembles all .planning/ artifacts into a ProjectState.
 *
 * Usage:
 * ```typescript
 * const reader = new ProjectStateReader('/path/to/.planning');
 * const state = await reader.read();
 * console.log(state.initialized, state.config.mode, state.phases);
 * ```
 */
export class ProjectStateReader {
  constructor(private planningDir: string) {}

  /**
   * Read all .planning/ artifacts and assemble into ProjectState.
   *
   * 1. Check if planningDir exists (returns uninitialized if not)
   * 2. Read all four files in parallel
   * 3. Parse each with respective parser
   * 4. Resolve phase directory paths from phases/ subdirectory
   * 5. Assemble into ProjectState with boolean flags
   *
   * @returns Complete ProjectState (always returns, never throws)
   */
  async read(): Promise<ProjectState> {
    // Check if planningDir exists
    const exists = await this.directoryExists(this.planningDir);
    if (!exists) {
      return this.uninitializedState();
    }

    // Read all four files in parallel
    const [roadmapContent, stateContent, projectContent, configContent] =
      await Promise.all([
        readFileSafe(join(this.planningDir, 'ROADMAP.md')),
        readFileSafe(join(this.planningDir, 'STATE.md')),
        readFileSafe(join(this.planningDir, 'PROJECT.md')),
        readFileSafe(join(this.planningDir, 'config.json')),
      ]);

    // Parse each file
    const parsedRoadmap = roadmapContent ? parseRoadmap(roadmapContent) : null;
    const parsedState = stateContent ? parseState(stateContent) : null;
    const parsedProject = projectContent ? parseProject(projectContent) : null;
    const parsedConfig = configContent ? parseConfig(configContent) : null;

    // Extract phases and resolve directory paths
    const phases = parsedRoadmap?.phases ?? [];
    const plansByPhase = parsedRoadmap?.plansByPhase ?? {};

    // Resolve phase directory paths
    await this.resolvePhaseDirectories(phases);

    // Assemble ProjectState
    return {
      initialized: true,
      config: parsedConfig ?? getDefaultConfig(),
      position: parsedState?.position ?? null,
      phases,
      plansByPhase,
      project: parsedProject ?? null,
      state: parsedState ?? null,
      hasRoadmap: parsedRoadmap !== null,
      hasState: parsedState !== null,
      hasProject: parsedProject !== null,
      hasConfig: parsedConfig !== null,
    };
  }

  /**
   * Check if a directory exists.
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      await access(dirPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Return an uninitialized ProjectState with all defaults.
   */
  private uninitializedState(): ProjectState {
    return {
      initialized: false,
      config: getDefaultConfig(),
      position: null,
      phases: [],
      plansByPhase: {},
      project: null,
      state: null,
      hasRoadmap: false,
      hasState: false,
      hasProject: false,
      hasConfig: false,
    };
  }

  /**
   * Resolve phase directory paths by scanning the phases/ subdirectory.
   *
   * Each phase directory is named with a number prefix (e.g., "36-discovery-foundation",
   * "37-state-reading-infrastructure"). This method lists the phases/ directory
   * and matches entries to PhaseInfo objects by their number prefix.
   *
   * Mutates the phases array in place by setting the `directory` field.
   */
  private async resolvePhaseDirectories(
    phases: Array<{ number: string; directory?: string }>,
  ): Promise<void> {
    if (phases.length === 0) return;

    const phasesDir = join(this.planningDir, 'phases');
    let entries: string[];

    try {
      entries = await readdir(phasesDir);
    } catch {
      // phases/ directory doesn't exist -- no resolution possible
      return;
    }

    // Build a lookup from normalized number prefix to directory name.
    // Normalizes zero-padded prefixes: "01-foundation" -> key "1",
    // "36-discovery" -> key "36", "37.1-hotfix" -> key "37.1"
    const dirsByNumber = new Map<string, string>();
    for (const entry of entries) {
      const match = entry.match(/^(\d+(?:\.\d+)?)-/);
      if (match) {
        const normalized = normalizePhaseNumber(match[1]);
        dirsByNumber.set(normalized, entry);
      }
    }

    // Attach directory paths to matching phases
    for (const phase of phases) {
      const dir = dirsByNumber.get(normalizePhaseNumber(phase.number));
      if (dir) {
        phase.directory = dir;
      }
    }
  }
}

/**
 * Normalize a phase number string by removing leading zeros.
 *
 * "01" -> "1", "36" -> "36", "37.1" -> "37.1", "001" -> "1"
 * Preserves decimal parts as-is.
 */
function normalizePhaseNumber(num: string): string {
  if (num.includes('.')) {
    const [integer, decimal] = num.split('.');
    return `${parseInt(integer, 10)}.${decimal}`;
  }
  return String(parseInt(num, 10));
}
