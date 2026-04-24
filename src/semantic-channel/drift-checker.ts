/**
 * Semantic Channel — runtime semantic-drift checker (advisory-only).
 *
 * Given a baseline and a current `ChannelState`, emits a structured
 * `DriftFinding` describing per-component content drift and any
 * fidelity-tier weakening (Xu semantic-channel preservation violation —
 * a channel must never weaken per-component fidelity).
 *
 * ADVISORY-ONLY. This module cannot:
 *   - mutate state of any kind (no file I/O, no in-memory mutation of
 *     DACP objects);
 *   - emit bypass, override, or DACP-migration actions of any kind;
 *   - influence CAPCOM handoff decisions (CAPCOM retains full authority).
 *
 * The settings-gated wrapper `checkSemanticDriftIfEnabled` returns `null`
 * when the `mathematical-foundations.semantic-channel.enabled` flag is
 * off, so pure callers that want to unconditionally consume the check
 * should call `checkSemanticDrift` directly.
 *
 * @module semantic-channel/drift-checker
 */

import { DEFAULT_DRIFT_THRESHOLD, isSemanticChannelEnabled, readSemanticChannelConfig } from './settings.js';
import type {
  ChannelComponentFidelity,
  ChannelState,
  DriftFinding,
  DriftMagnitudes,
} from './types.js';
import { tierCompare } from './types.js';

// ============================================================================
// Options
// ============================================================================

export interface DriftCheckOptions {
  /**
   * Fraction of component content that must change before the finding
   * is elevated to `severity: 'warn'`. Defaults to
   * `DEFAULT_DRIFT_THRESHOLD` (0.25).
   */
  threshold?: number;
}

// ============================================================================
// Core drift computation
// ============================================================================

/**
 * Compute advisory drift between a baseline and a current channel state.
 *
 * Drift magnitudes per component: normalised character-length delta
 * clamped to [0, 1]. Fidelity weakening is detected via `tierCompare`
 * (a positive value means current tier is weaker than baseline).
 *
 * Severity:
 *   - `'warn'` if any component fidelity weakened, OR any drift
 *     magnitude >= threshold;
 *   - `'info'` otherwise.
 */
export function checkSemanticDrift(
  baseline: ChannelState,
  current: ChannelState,
  options: DriftCheckOptions = {},
): DriftFinding {
  const threshold =
    typeof options.threshold === 'number' && Number.isFinite(options.threshold)
      ? clamp01(options.threshold)
      : DEFAULT_DRIFT_THRESHOLD;

  const perComponent: DriftMagnitudes = {
    intent: drift(
      baseline.triad.humanIntent,
      current.triad.humanIntent,
    ),
    data: drift(
      JSON.stringify(baseline.triad.structuredData),
      JSON.stringify(current.triad.structuredData),
    ),
    code: drift(
      baseline.triad.executableCode.join('\0'),
      current.triad.executableCode.join('\0'),
    ),
  };

  const weakened = isWeakened(baseline.fidelity, current.fidelity);
  const exceeded =
    perComponent.intent >= threshold ||
    perComponent.data >= threshold ||
    perComponent.code >= threshold;
  const severity: DriftFinding['severity'] =
    weakened || exceeded ? 'warn' : 'info';

  const timestamp = new Date().toISOString();
  const findingId = `semch-${timestamp.replace(/[:.]/g, '-')}-${hashMagnitudes(perComponent)}`;
  const summary = buildSummary(perComponent, weakened, threshold);

  return {
    findingId,
    kind: 'semantic-channel-drift',
    severity,
    summary,
    perComponent,
    threshold,
    baselineFidelity: baseline.fidelity,
    currentFidelity: current.fidelity,
    weakened,
    timestamp,
  };
}

/**
 * Settings-gated convenience wrapper. Returns `null` when the
 * `mathematical-foundations.semantic-channel.enabled` flag is off, so
 * opt-in callers can branch without a separate `isEnabled()` call.
 *
 * Reads the `driftThreshold` config value (if present) and passes it
 * through as the default threshold; explicit `options.threshold`
 * overrides.
 */
export function checkSemanticDriftIfEnabled(
  baseline: ChannelState,
  current: ChannelState,
  options: DriftCheckOptions & { settingsPath?: string } = {},
): DriftFinding | null {
  if (!isSemanticChannelEnabled(options.settingsPath)) return null;
  const cfg = readSemanticChannelConfig(options.settingsPath);
  const threshold =
    typeof options.threshold === 'number'
      ? options.threshold
      : cfg.driftThreshold;
  return checkSemanticDrift(baseline, current, { threshold });
}

// ============================================================================
// Internal helpers (pure)
// ============================================================================

function drift(baseline: string, current: string): number {
  if (baseline === current) return 0;
  const maxLen = Math.max(baseline.length, current.length);
  if (maxLen === 0) return 0;
  // Cheap normalised distance: |len delta| + number of differing positions
  // within the min-length prefix, capped. This is O(min(|a|,|b|)) and
  // produces a stable value in [0, 1] for advisory purposes.
  const lenDelta = Math.abs(baseline.length - current.length);
  const minLen = Math.min(baseline.length, current.length);
  let differing = 0;
  for (let i = 0; i < minLen; i++) {
    if (baseline.charCodeAt(i) !== current.charCodeAt(i)) differing += 1;
  }
  const raw = (lenDelta + differing) / maxLen;
  return clamp01(raw);
}

function isWeakened(
  baseline: ChannelComponentFidelity,
  current: ChannelComponentFidelity,
): boolean {
  return (
    tierCompare(current.intent, baseline.intent) > 0 ||
    tierCompare(current.data, baseline.data) > 0 ||
    tierCompare(current.code, baseline.code) > 0
  );
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function buildSummary(
  m: DriftMagnitudes,
  weakened: boolean,
  threshold: number,
): string {
  const header = weakened
    ? 'Semantic-channel fidelity WEAKENED (advisory)'
    : 'Semantic-channel drift (advisory)';
  return `${header}: intent=${m.intent.toFixed(3)} data=${m.data.toFixed(3)} code=${m.code.toFixed(3)} (threshold θ=${threshold.toFixed(3)})`;
}

function hashMagnitudes(m: DriftMagnitudes): string {
  let h = 0x811c9dc5;
  const s = `${m.intent.toFixed(6)}:${m.data.toFixed(6)}:${m.code.toFixed(6)}`;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
