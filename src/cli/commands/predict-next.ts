/**
 * Predict-next CLI command — production caller of the predict path
 * (v1.49.845).
 *
 * Closes the v837 forward-flag "production caller of ActivationSelector or
 * copper Activation is absent". The v837 ship wired the
 * `predictive.low_confidence_threshold` observation source (read-side) but
 * left the write-side dependent on a future production caller that would
 * exercise the predict path with a wired fallbackProvider.
 *
 * This CLI command is that production caller. It:
 *   1. Calls `predictNextSkillsWithMeta(currentSkill, context)` to get the
 *      ranked predictions + the configured `lowConfidenceThreshold`.
 *   2. Computes `maxScore` (top prediction; 0 if no predictions returned).
 *   3. If `maxScore < lowConfidenceThreshold`, records a low-confidence event
 *      via `appendPredictiveLowConfidenceEvent`. The event kind defaults to
 *      `not_useful` (operator can flip with --useful flag to record the
 *      inverse calibration signal).
 *   4. Outputs the predictions + threshold + recorded event (if any) as JSON
 *      or human-readable text.
 *
 * The recorded JSONL events feed the bounded-learning calibration loop for
 * the `predictive.low_confidence_threshold` threshold. The loop's e-process
 * decides whether to recommend lowering, holding, or raising the threshold
 * based on the polarity convention documented in
 * `src/bounded-learning/predictive-low-confidence-events.ts`.
 *
 * Failure contract per #10427: prediction failures and event-recording
 * failures are caught and surfaced in the JSON output rather than thrown.
 * The command exits 0 unless arguments are invalid.
 *
 * Usage:
 *   skill-creator predict-next <currentSkill> [--useful|--not-useful]
 *                              [--json] [--no-record]
 *
 * @module cli/commands/predict-next
 */

import {
  predictNextSkillsWithMeta,
  type SkillPrediction,
} from '../../predictive-skill-loader/index.js';
import {
  appendPredictiveLowConfidenceEvent,
  type PredictiveLowConfidenceEventKind,
} from '../../bounded-learning/predictive-low-confidence-events.js';

interface PredictNextOptions {
  /** Override the recorded-event kind. Default 'not_useful'. */
  kind: PredictiveLowConfidenceEventKind;
  /** Skip the JSONL append (predict-only mode). */
  noRecord: boolean;
  /** JSON output. */
  json: boolean;
}

function parseArgs(args: string[]): { currentSkill: string | null; options: PredictNextOptions } {
  const options: PredictNextOptions = {
    kind: 'not_useful',
    noRecord: false,
    json: false,
  };
  const positional: string[] = [];
  for (const arg of args) {
    if (arg === '--useful') options.kind = 'useful';
    else if (arg === '--not-useful') options.kind = 'not_useful';
    else if (arg === '--no-record') options.noRecord = true;
    else if (arg === '--json') options.json = true;
    else if (!arg.startsWith('--')) positional.push(arg);
  }
  return { currentSkill: positional[0] ?? null, options };
}

export async function predictNextCommand(args: string[]): Promise<number> {
  const { currentSkill, options } = parseArgs(args);

  if (!currentSkill) {
    console.error('Usage: skill-creator predict-next <currentSkill> [--useful|--not-useful] [--json] [--no-record]');
    return 1;
  }

  let predictions: SkillPrediction[] = [];
  let lowConfidenceThreshold = 0;
  let disabled = false;
  let predictError: string | null = null;

  try {
    const result = await predictNextSkillsWithMeta(currentSkill);
    predictions = result.predictions;
    lowConfidenceThreshold = result.lowConfidenceThreshold;
    disabled = result.disabled;
  } catch (err) {
    predictError = err instanceof Error ? err.message : String(err);
  }

  const maxScore = predictions.length === 0
    ? 0
    : Math.max(...predictions.map((p) => p.score));
  const isLowConfidence = !disabled && !predictError && maxScore < lowConfidenceThreshold;

  let eventRecorded = false;
  let recordError: string | null = null;
  if (isLowConfidence && !options.noRecord) {
    try {
      await appendPredictiveLowConfidenceEvent({
        timestamp: new Date().toISOString(),
        kind: options.kind,
      });
      eventRecorded = true;
    } catch (err) {
      recordError = err instanceof Error ? err.message : String(err);
    }
  }

  const result = {
    currentSkill,
    disabled,
    predictions: predictions.map((p) => ({ skillId: p.skillId, score: p.score, hopDepth: p.hopDepth })),
    maxScore,
    lowConfidenceThreshold,
    isLowConfidence,
    eventRecorded,
    eventKind: eventRecorded ? options.kind : null,
    predictError,
    recordError,
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (predictError) {
      console.error(`predict error: ${predictError}`);
      return 1;
    }
    if (disabled) {
      console.log(`predictive-skill-loader is disabled. No predictions returned.`);
      return 0;
    }
    console.log(`current skill: ${currentSkill}`);
    console.log(`predictions (${predictions.length}):`);
    for (const p of predictions) {
      console.log(`  ${p.skillId.padEnd(40)} score=${p.score.toFixed(4)} hop=${p.hopDepth}`);
    }
    console.log(`max score: ${maxScore.toFixed(4)}`);
    console.log(`low-confidence threshold: ${lowConfidenceThreshold.toFixed(4)}`);
    if (isLowConfidence) {
      console.log(`-> LOW CONFIDENCE (maxScore < threshold)`);
      if (eventRecorded) {
        console.log(`-> recorded event: kind=${options.kind}`);
      } else if (options.noRecord) {
        console.log(`-> event NOT recorded (--no-record flag)`);
      } else if (recordError) {
        console.error(`-> event-record error: ${recordError}`);
      }
    } else if (!disabled) {
      console.log(`-> confidence OK (maxScore >= threshold)`);
    }
  }

  return 0;
}
