/**
 * Ricci-Curvature Audit — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the T1b
 * Ricci-Curvature Audit primitive is opted in. Default at every field is
 * FALSE: missing file, malformed JSON, missing block, or missing flag all
 * return disabled.
 *
 * Path: `gsd-skill-creator.mathematical-foundations.ricci-curvature-audit`.
 *
 * No side effects. Pure function surface.
 *
 * @module ricci-curvature-audit/settings
 */

import { readNested, dedicatedConfigPath } from '../settings/read-settings.js';

export interface RicciCurvatureAuditConfig {
  enabled: boolean;
  bottleneckThreshold?: number;
  laziness?: number;
  verbose?: boolean;
}

export const DEFAULT_RICCI_CURVATURE_AUDIT_CONFIG: RicciCurvatureAuditConfig = {
  enabled: false,
};

/**
 * Read the ricci-curvature-audit config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readRicciCurvatureAuditConfig(
  settingsPath?: string,
): RicciCurvatureAuditConfig {
  const block = readNested(
    ['mathematical-foundations', 'ricci-curvature-audit'],
    [dedicatedConfigPath(settingsPath)],
  );
  if (!block || typeof block !== 'object') {
    return { ...DEFAULT_RICCI_CURVATURE_AUDIT_CONFIG };
  }
  const rec = block as Record<string, unknown>;

  const out: RicciCurvatureAuditConfig = { enabled: false };
  if (typeof rec.enabled === 'boolean') out.enabled = rec.enabled;
  if (typeof rec.bottleneckThreshold === 'number' && Number.isFinite(rec.bottleneckThreshold)) {
    out.bottleneckThreshold = rec.bottleneckThreshold;
  }
  if (typeof rec.laziness === 'number' && Number.isFinite(rec.laziness)) {
    out.laziness = rec.laziness;
  }
  if (typeof rec.verbose === 'boolean') out.verbose = rec.verbose;
  return out;
}

/**
 * Is the Ricci-Curvature Audit primitive opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isRicciCurvatureAuditEnabled(settingsPath?: string): boolean {
  return readRicciCurvatureAuditConfig(settingsPath).enabled === true;
}
