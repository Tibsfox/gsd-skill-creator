/**
 * Scan orchestrator for passive monitoring.
 *
 * Coordinates all three monitoring subsystems (plan-vs-summary diff,
 * STATE.md transitions, ROADMAP.md structural diff) and writes
 * detected changes as observations to sessions.jsonl.
 *
 * This is the entry point that slash commands and wrappers invoke.
 * It is always scan-on-demand, never running as a background process.
 *
 * @module integration/monitoring/scanner
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import { readIntegrationConfig } from '../config/index.js';
import { diffPlanVsSummary } from './plan-summary-differ.js';
import { detectStateTransitions, parseStateMd } from './state-transition-detector.js';
import { diffRoadmap, parseRoadmapPhases } from './roadmap-differ.js';
import { appendScanObservation } from './observation-writer.js';
import type {
  ScanState,
  PlanSummaryDiff,
  StateTransition,
  RoadmapDiff,
  ScanObservation,
} from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Default path for persisted scan state. */
const SCAN_STATE_PATH = '.planning/patterns/scan-state.json';

/** Default path for STATE.md. */
const STATE_MD_PATH = '.planning/STATE.md';

/** Default path for ROADMAP.md. */
const ROADMAP_PATH = '.planning/ROADMAP.md';

// ============================================================================
// Types
// ============================================================================

/** Result of a monitoring scan. */
export interface ScanResult {
  /** Number of observations written to sessions.jsonl. */
  observations_written: number;
  /** Plan-vs-summary diffs detected. */
  plan_summary_diffs: PlanSummaryDiff[];
  /** STATE.md transitions detected. */
  state_transitions: StateTransition[];
  /** ROADMAP.md structural diff, or null if not available. */
  roadmap_diff: RoadmapDiff | null;
}

/** Options for the scan orchestrator. */
export interface ScanOptions {
  /** Path to phase directory containing PLAN.md and SUMMARY.md files. */
  planDir?: string;
  /** Custom path to STATE.md. */
  stateMdPath?: string;
  /** Custom path to ROADMAP.md. */
  roadmapPath?: string;
  /** Custom path to scan-state.json. */
  scanStatePath?: string;
  /** Custom sessions.jsonl output path. */
  outputPath?: string;
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Load persisted scan state from disk.
 *
 * Returns null on first scan (file does not exist) or if parsing fails.
 */
async function loadScanState(path: string): Promise<ScanState | null> {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as ScanState;
  } catch {
    // ENOENT (first scan) or parse error -- both return null
    return null;
  }
}

/**
 * Save scan state to disk for next scan comparison.
 */
async function saveScanState(path: string, state: ScanState): Promise<void> {
  await writeFile(path, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Extract the current phase number from STATE.md content.
 * Looks for a "Phase:" line and extracts the first number.
 */
function extractPhaseFromState(content: string): number | null {
  const match = content.match(/^Phase:\s*(\d+)/m);
  return match ? parseInt(match[1], 10) : null;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Run a passive monitoring scan.
 *
 * Coordinates all three monitors (STATE.md transitions, ROADMAP.md diffs,
 * plan-vs-summary diffs) and writes detected changes as observations to
 * sessions.jsonl. Each monitor runs independently -- failures in one do
 * not prevent others from running.
 *
 * @param options - Optional overrides for file paths
 * @returns Scan result with counts and detected changes
 */
export async function runScan(options?: ScanOptions): Promise<ScanResult> {
  const emptyResult: ScanResult = {
    observations_written: 0,
    plan_summary_diffs: [],
    state_transitions: [],
    roadmap_diff: null,
  };

  // Step 1: Check integration config
  let config;
  try {
    config = await readIntegrationConfig();
  } catch {
    // Config read failure -- proceed with defaults (phase_transition_hooks enabled)
    config = null;
  }

  if (config && !config.integration.phase_transition_hooks) {
    return emptyResult;
  }

  // Step 2: Load previous scan state
  const scanStatePath = options?.scanStatePath ?? SCAN_STATE_PATH;
  const previousState = await loadScanState(scanStatePath);

  const result: ScanResult = {
    observations_written: 0,
    plan_summary_diffs: [],
    state_transitions: [],
    roadmap_diff: null,
  };

  const outputOpts = options?.outputPath ? { outputPath: options.outputPath } : undefined;
  let currentStateMd: string | null = null;
  let currentRoadmapContent: string | null = null;

  // Step 3: STATE.md transitions (MON-02)
  try {
    const statePath = options?.stateMdPath ?? STATE_MD_PATH;
    currentStateMd = await readFile(statePath, 'utf-8');
    const transitions = detectStateTransitions(
      previousState?.state_md_snapshot ?? null,
      currentStateMd,
    );

    if (transitions.length > 0) {
      const phase = extractPhaseFromState(currentStateMd);
      for (const transition of transitions) {
        const observation: ScanObservation = {
          type: 'scan',
          timestamp: new Date().toISOString(),
          source: 'scan',
          phase,
          scan_type: 'state_transition',
          details: transition,
        };
        await appendScanObservation(observation, outputOpts);
        result.observations_written++;
      }
      result.state_transitions = transitions;
    }
  } catch (err) {
    // ENOENT or other error -- skip STATE.md monitoring
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      // Log non-ENOENT errors silently but do not throw
    }
  }

  // Step 4: ROADMAP.md diff (MON-05)
  try {
    const roadmapPath = options?.roadmapPath ?? ROADMAP_PATH;
    currentRoadmapContent = await readFile(roadmapPath, 'utf-8');
    const diff = diffRoadmap(
      previousState?.roadmap_phases ?? null,
      currentRoadmapContent,
    );

    const hasChanges =
      diff.phases_added.length > 0 ||
      diff.phases_removed.length > 0 ||
      diff.phases_reordered ||
      diff.status_changes.length > 0;

    if (hasChanges) {
      const phase = currentStateMd ? extractPhaseFromState(currentStateMd) : null;
      const observation: ScanObservation = {
        type: 'scan',
        timestamp: new Date().toISOString(),
        source: 'scan',
        phase,
        scan_type: 'roadmap_diff',
        details: diff,
      };
      await appendScanObservation(observation, outputOpts);
      result.observations_written++;
    }

    result.roadmap_diff = diff;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      // Log non-ENOENT errors silently but do not throw
    }
  }

  // Step 5: Plan-vs-summary diffs (MON-01)
  try {
    if (options?.planDir) {
      const entries = await readdir(options.planDir);
      const planFiles = entries.filter(
        (f) => f.endsWith('-PLAN.md') || f.match(/^\d+-\d+-PLAN\.md$/),
      );

      for (const planFile of planFiles) {
        try {
          // Extract plan number prefix (e.g., "87-01" from "87-01-PLAN.md")
          const prefix = planFile.replace(/-PLAN\.md$/, '');
          const summaryFile = `${prefix}-SUMMARY.md`;

          if (!entries.includes(summaryFile)) continue;

          const planContent = await readFile(join(options.planDir, planFile), 'utf-8');
          const summaryContent = await readFile(join(options.planDir, summaryFile), 'utf-8');

          const diff = diffPlanVsSummary(planContent, summaryContent);

          const hasNotableChanges =
            diff.scope_change !== 'on_track' ||
            diff.emergent_work.length > 0 ||
            diff.dropped_items.length > 0;

          if (hasNotableChanges) {
            const observation: ScanObservation = {
              type: 'scan',
              timestamp: new Date().toISOString(),
              source: 'scan',
              phase: diff.phase,
              scan_type: 'plan_summary_diff',
              details: diff,
            };
            await appendScanObservation(observation, outputOpts);
            result.observations_written++;
          }

          result.plan_summary_diffs.push(diff);
        } catch {
          // Skip individual plan/summary pair errors
        }
      }
    }
  } catch {
    // Plan directory read error -- skip plan-vs-summary monitoring
  }

  // Step 6: Save updated scan state
  try {
    const newState: ScanState = {
      last_scan_timestamp: new Date().toISOString(),
      state_md_snapshot: currentStateMd ? parseStateMd(currentStateMd) : {},
      roadmap_phases: currentRoadmapContent ? parseRoadmapPhases(currentRoadmapContent) : [],
    };
    await saveScanState(scanStatePath, newState);
  } catch {
    // Scan state save failure -- non-fatal
  }

  return result;
}
