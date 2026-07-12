/**
 * Self-Improvement Lifecycle -- milestone retro driver.
 *
 * The pure orchestration core behind `retro milestone`. Given already-collected
 * milestone metrics, an optional changelog-watch result, and harvested session
 * observations, it:
 *
 *   1. computes calibration deltas (estimated vs actual),
 *   2. generates prose action items,
 *   3. folds in any manually-supplied action items (e.g. "Research X"),
 *   4. routes every action item to a concrete verb (research / cartridge-distill
 *      / skill-retire / memory-lesson),
 *   5. assembles the RetroTemplateData and renders RETROSPECTIVE.md.
 *
 * Pure function: no git, no fs, no clock beyond `generateRetrospective`'s own
 * rendering. All impure collection (git metrics, changelog fetch, observation
 * file read, file write, action execution) lives in the CLI wrapper. This keeps
 * the driver fully testable and lets callers dry-run a routing plan without
 * touching disk.
 *
 * @module retro/driver
 */

import type {
  ActionItem,
  ChangelogWatchResult,
  MilestoneMetrics,
  RetroTemplateData,
} from './types.js';
import type { ObservationSummary } from './observation-harvester.js';
import { computeCalibrationDeltas } from './calibration-delta.js';
import { generateActionItems } from './action-generator.js';
import { generateRetrospective } from './template-generator.js';
import { routeActionItems, type RoutedAction } from './action-router.js';

// ============================================================================
// I/O shapes
// ============================================================================

/**
 * Everything the driver needs, already collected by the caller.
 */
export interface RetroMilestoneInput {
  /** Milestone metrics snapshot (git-derived + planning estimates). */
  metrics: MilestoneMetrics;

  /** Optional changelog-watch result for the version range. */
  changelog?: ChangelogWatchResult;

  /** Harvested session observations. */
  observations: ObservationSummary;

  /** Optional custom estimate pairs for calibration (keyed by metric field). */
  estimates?: Record<string, number>;

  /**
   * Extra action items supplied by hand (e.g. "Research foo", "Retire bar").
   * Appended after the auto-generated items so the router still sees them.
   */
  extraActionItems?: ActionItem[];

  /** Human-authored retro sections (optional). */
  whatWentWell?: string[];
  whatDidntGoWell?: string[];
  lessonsLearned?: string[];
}

/**
 * The driver's output: the assembled data, the rendered markdown, and the
 * routing plan for every action item.
 */
export interface RetroMilestoneResult {
  /** The fully-assembled template data. */
  data: RetroTemplateData;

  /** Rendered RETROSPECTIVE.md content. */
  markdown: string;

  /** Every action item mapped to a concrete downstream verb. */
  routedActions: RoutedAction[];
}

// ============================================================================
// Driver
// ============================================================================

/**
 * Run the milestone retrospective pipeline (pure).
 */
export function runRetroMilestone(input: RetroMilestoneInput): RetroMilestoneResult {
  const calibrationDeltas = computeCalibrationDeltas(input.metrics, input.estimates);

  const generated = generateActionItems({
    deltas: calibrationDeltas,
    changelog: input.changelog?.features,
    observations: input.observations,
  });

  const actionItems: ActionItem[] = [...generated, ...(input.extraActionItems ?? [])];
  const routedActions = routeActionItems(actionItems);

  const data: RetroTemplateData = {
    metrics: input.metrics,
    changelog: input.changelog,
    calibration_deltas: calibrationDeltas,
    observations: input.observations,
    action_items: actionItems,
    what_went_well: input.whatWentWell ?? [],
    what_didnt_go_well: input.whatDidntGoWell ?? [],
    lessons_learned: input.lessonsLearned ?? [],
  };

  const markdown = generateRetrospective(data);

  return { data, markdown, routedActions };
}

/**
 * Summarise a routing plan as `verb → count` for CLI display / logging.
 */
export function summarizeRouting(routed: RoutedAction[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of routed) {
    out[r.verb] = (out[r.verb] ?? 0) + 1;
  }
  return out;
}
