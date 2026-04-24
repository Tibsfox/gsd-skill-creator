/**
 * Intrinsic Telemetry — top-level correlator.
 *
 * Pure function: takes a bag of signals (each a list of TelemetrySamples) and
 * produces a TelemetryReport with one SignalCorrelation per signal. No I/O,
 * no side effects, no CAPCOM interaction.
 *
 * @module intrinsic-telemetry/telemetry
 */

import { pearson, spearman } from './correlation.js';
import type { SignalCorrelation, TelemetryReport, TelemetrySample } from './types.js';

/** Minimum number of paired observations for a reportable correlation. */
export const MIN_SAMPLES = 5;

/**
 * Produce a correlation report across multiple signals.
 *
 * `signals` is a dictionary: signal name → list of per-mission samples. Each
 * mission's quality score is the `qualityScore` field of the sample.
 */
export function correlateSignals(
  signals: Readonly<Record<string, ReadonlyArray<TelemetrySample>>>,
): TelemetryReport {
  const correlations: SignalCorrelation[] = [];
  const names = Object.keys(signals).sort();
  for (const name of names) {
    const samples = signals[name];
    if (samples.length < MIN_SAMPLES) {
      correlations.push({
        signalName: name,
        spearman: 0,
        pearson: 0,
        sampleCount: samples.length,
        verdict: 'insufficient',
      });
      continue;
    }
    const xs = samples.map((s) => s.signalValue);
    const ys = samples.map((s) => s.qualityScore);
    const sp = spearman(xs, ys);
    const pe = pearson(xs, ys);
    const mag = Math.abs(sp);
    const verdict: SignalCorrelation['verdict'] =
      mag >= 0.7 ? 'strong' : mag >= 0.4 ? 'moderate' : 'weak';
    correlations.push({
      signalName: name,
      spearman: sp,
      pearson: pe,
      sampleCount: samples.length,
      verdict,
    });
  }
  // Pick the best reportable signal (verdict != 'insufficient') by |spearman|.
  let best: SignalCorrelation | undefined = undefined;
  for (const c of correlations) {
    if (c.verdict === 'insufficient') continue;
    if (best === undefined || Math.abs(c.spearman) > Math.abs(best.spearman)) {
      best = c;
    }
  }
  return {
    correlations,
    bestSignal: best?.signalName,
    runTag: `telemetry|signals=${names.length}|min_samples=${MIN_SAMPLES}`,
  };
}
