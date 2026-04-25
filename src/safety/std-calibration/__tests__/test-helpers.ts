/**
 * HB-03 STD Calibration — shared test helpers.
 */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface TestEnv {
  configPath: string;
  tablePath: string;
  triggerMarkerPath: string;
  capcomMarkerPath: string;
  cleanup: () => void;
}

export function makeEnv(flagValue: boolean | undefined): TestEnv {
  const dir = mkdtempSync(join(tmpdir(), 'std-calibration-test-'));
  const claudeDir = join(dir, '.claude');
  const safetyDir = join(dir, '.planning', 'safety');
  mkdirSync(claudeDir, { recursive: true });
  mkdirSync(safetyDir, { recursive: true });
  const configPath = join(claudeDir, 'gsd-skill-creator.json');
  const tablePath = join(safetyDir, 'std-calibration.json');
  const triggerMarkerPath = join(safetyDir, 'std-calibrate-triggered.marker');
  const capcomMarkerPath = join(safetyDir, 'std-calibration.capcom');
  const block: Record<string, unknown> = {};
  if (flagValue !== undefined) block.enabled = flagValue;
  writeFileSync(
    configPath,
    JSON.stringify({
      'gsd-skill-creator': {
        'cs25-26-sweep': {
          'std-calibration': block,
        },
      },
    }),
  );
  return {
    configPath,
    tablePath,
    triggerMarkerPath,
    capcomMarkerPath,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

export function makeMissingConfigEnv(): TestEnv {
  const dir = mkdtempSync(join(tmpdir(), 'std-calibration-missing-'));
  const safetyDir = join(dir, '.planning', 'safety');
  mkdirSync(safetyDir, { recursive: true });
  return {
    configPath: join(dir, '.claude', 'never-created.json'),
    tablePath: join(safetyDir, 'std-calibration.json'),
    triggerMarkerPath: join(safetyDir, 'std-calibrate-triggered.marker'),
    capcomMarkerPath: join(safetyDir, 'std-calibration.capcom'),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

export function authorizeCapcom(env: TestEnv, signature = 'human-foxy@2026-04-25'): void {
  writeFileSync(env.capcomMarkerPath, signature, 'utf8');
}

export function recordTrigger(env: TestEnv): void {
  writeFileSync(env.triggerMarkerPath, '', 'utf8');
}

/**
 * Build a deterministic synthetic prohibition-decay trial that mimics
 * the paper's 73%@5 → 33%@16 shape. The decay is monotone-ish; jitter is
 * driven by a simple linear-congruential generator seeded by trial id so
 * tests stay deterministic across runs.
 */
export function buildSyntheticTrial(
  trialId: string,
  maxTurns: number,
  startCompliance = 0.73,
  endCompliance = 0.33,
): { trialId: string; turns: ReadonlyArray<{ turn: number; compliant: boolean }> } {
  let seed = 0;
  for (let i = 0; i < trialId.length; i++) seed = (seed * 31 + trialId.charCodeAt(i)) >>> 0;
  const turns: Array<{ turn: number; compliant: boolean }> = [];
  for (let t = 1; t <= maxTurns; t++) {
    const fraction = (t - 1) / Math.max(1, maxTurns - 1);
    const expected = startCompliance + (endCompliance - startCompliance) * fraction;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const draw = (seed & 0xffff) / 0xffff;
    turns.push({ turn: t, compliant: draw < expected });
  }
  return { trialId, turns };
}
