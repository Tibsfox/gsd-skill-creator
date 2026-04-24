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

import fs from 'node:fs';
import path from 'node:path';

export interface RicciCurvatureAuditConfig {
  enabled: boolean;
  bottleneckThreshold?: number;
  laziness?: number;
  verbose?: boolean;
}

export const DEFAULT_RICCI_CURVATURE_AUDIT_CONFIG: RicciCurvatureAuditConfig = {
  enabled: false,
};

function projectRoot(): string {
  // Tests may override via env var for deterministic reads.
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  if (envRoot && envRoot.length > 0) return envRoot;
  return process.cwd();
}

function defaultConfigPath(): string {
  return path.join(projectRoot(), '.claude', 'gsd-skill-creator.json');
}

/**
 * Read the ricci-curvature-audit config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readRicciCurvatureAuditConfig(
  settingsPath?: string,
): RicciCurvatureAuditConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_RICCI_CURVATURE_AUDIT_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_RICCI_CURVATURE_AUDIT_CONFIG };
  }
  const block = extractBlock(raw);
  if (!block) return { ...DEFAULT_RICCI_CURVATURE_AUDIT_CONFIG };

  const out: RicciCurvatureAuditConfig = { enabled: false };
  const rec = block as Record<string, unknown>;
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

function extractBlock(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const outer = (raw as Record<string, unknown>)['gsd-skill-creator'];
  if (!outer || typeof outer !== 'object') return null;
  const math = (outer as Record<string, unknown>)['mathematical-foundations'];
  if (!math || typeof math !== 'object') return null;
  const block = (math as Record<string, unknown>)['ricci-curvature-audit'];
  if (!block || typeof block !== 'object') return null;
  return block as Record<string, unknown>;
}

/**
 * Is the Ricci-Curvature Audit primitive opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isRicciCurvatureAuditEnabled(settingsPath?: string): boolean {
  return readRicciCurvatureAuditConfig(settingsPath).enabled === true;
}
