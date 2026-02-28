/**
 * CLI command: skill-creator plane-status
 *
 * Display complex plane health metrics: versine distribution,
 * exsecant reach, angular velocity warnings, chord candidates.
 *
 * Flags:
 *   --json              Output as JSON
 *   --snapshot          Save metrics snapshot to disk
 *   --detail SKILL_ID   Show detailed view for one skill
 *   --help, -h          Show this help message
 *
 * Aliases: ps
 */

import { computeDashboardMetrics, saveMetricsSnapshot } from '../../packs/plane/metrics.js';
import { renderPlaneStatus, renderSkillDetail } from '../../packs/plane/dashboard.js';
import { computeTangent } from '../../packs/plane/arithmetic.js';
import { PositionStore } from '../../packs/plane/position-store.js';
import { ChordStore } from '../../packs/plane/chords.js';

// ============================================================================
// Types
// ============================================================================

/** Injection options for testing (custom store paths, snapshot path). */
export interface PlaneStatusTestOptions {
  positionsPath?: string;
  chordsPath?: string;
  snapshotPath?: string;
}

// ============================================================================
// Help text
// ============================================================================

const HELP_TEXT = `
Usage: skill-creator plane-status [options]

Display complex plane health metrics: versine distribution,
exsecant reach, angular velocity warnings, chord candidates.

Options:
  --json              Output as JSON
  --snapshot          Save metrics snapshot to disk
  --detail SKILL_ID   Show detailed view for one skill
  --help, -h          Show this help message

Aliases: ps

Examples:
  skill-creator plane-status                Show full dashboard
  skill-creator plane-status --json         Machine-readable output
  skill-creator plane-status --snapshot     Save snapshot for tracking
  skill-creator plane-status --detail git-workflow   Show one skill
`;

// ============================================================================
// Command implementation
// ============================================================================

/**
 * Execute the plane-status command.
 *
 * @param args - Arguments after 'plane-status' (flags and values)
 * @param options - Optional test injection for custom store/snapshot paths
 * @returns Exit code: 0 for success, 1 for error
 */
export async function planeStatusCommand(
  args: string[],
  options?: PlaneStatusTestOptions,
): Promise<number> {
  // Help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP_TEXT);
    return 0;
  }

  const jsonMode = args.includes('--json');
  const snapshotMode = args.includes('--snapshot');

  // Parse --detail flag and its value
  const detailIdx = args.indexOf('--detail');
  const detailSkillId = detailIdx >= 0 ? args[detailIdx + 1] : undefined;

  // Load stores
  const positionStore = new PositionStore(options?.positionsPath);
  const chordStore = new ChordStore(options?.chordsPath);
  await positionStore.load();
  await chordStore.load();

  // Compute metrics
  const metrics = computeDashboardMetrics(positionStore, chordStore);

  // Snapshot mode: save before rendering
  if (snapshotMode) {
    const snapshotPath = options?.snapshotPath ?? '.claude/plane/metrics-snapshot.json';
    await saveMetricsSnapshot(metrics, snapshotPath);
  }

  // JSON mode
  if (jsonMode) {
    console.log(JSON.stringify(metrics, null, 2));
    return 0;
  }

  // Detail mode
  if (detailSkillId) {
    const position = positionStore.get(detailSkillId);
    if (!position) {
      console.error(`No plane position for skill: ${detailSkillId}`);
      return 1;
    }
    const tangent = computeTangent(position);
    console.log(renderSkillDetail(detailSkillId, position, tangent));
    return 0;
  }

  // Default: full dashboard
  console.log(renderPlaneStatus(metrics));
  return 0;
}
