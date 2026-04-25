/**
 * HB-07 AEL bandit — shared test helpers.
 */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface BanditTestEnv {
  configPath: string;
  triggerMarkerPath: string;
  capcomMarkerPath: string;
  /** HB-04 sister markers — needed for hb04-integration tests. */
  rolesTriggerMarkerPath: string;
  rolesCapcomMarkerPath: string;
  cleanup: () => void;
}

/**
 * Builds a temp directory containing a `gsd-skill-creator.json` with the
 * supplied flags and an empty `.planning/skill-creator/` for marker files.
 *
 * `banditFlag` controls `ael-bandit.enabled`; `rolesFlag` controls
 * `weler-roles.enabled` (HB-04 sister; needed for integration tests).
 */
export function makeBanditEnv(
  banditFlag: boolean | undefined,
  rolesFlag: boolean | undefined = undefined,
): BanditTestEnv {
  const dir = mkdtempSync(join(tmpdir(), 'ael-bandit-test-'));
  const claudeDir = join(dir, '.claude');
  const scDir = join(dir, '.planning', 'skill-creator');
  mkdirSync(claudeDir, { recursive: true });
  mkdirSync(scDir, { recursive: true });

  const configPath = join(claudeDir, 'gsd-skill-creator.json');
  const sweep: Record<string, unknown> = {};
  if (banditFlag !== undefined) {
    sweep['ael-bandit'] = { enabled: banditFlag };
  }
  if (rolesFlag !== undefined) {
    sweep['weler-roles'] = { enabled: rolesFlag };
  }
  writeFileSync(
    configPath,
    JSON.stringify({
      'gsd-skill-creator': {
        'cs25-26-sweep': sweep,
      },
    }),
  );

  return {
    configPath,
    triggerMarkerPath: join(scDir, 'ael-bandit.trigger'),
    capcomMarkerPath: join(scDir, 'ael-bandit.capcom'),
    rolesTriggerMarkerPath: join(scDir, 'weler-roles.trigger'),
    rolesCapcomMarkerPath: join(scDir, 'weler-roles.capcom'),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

/** Authorize the bandit-engagement gate. */
export function authorizeBanditCapcom(env: BanditTestEnv, signature = 'human-foxy@2026-04-25'): void {
  writeFileSync(env.capcomMarkerPath, signature, 'utf8');
}

/** Authorize the HB-04 sister gate (role-split + protocol-update). */
export function authorizeRolesCapcom(env: BanditTestEnv, signature = 'human-foxy@2026-04-25'): void {
  writeFileSync(env.rolesCapcomMarkerPath, signature, 'utf8');
}

/**
 * Deterministic LCG-based PRNG. Returns a function compatible with the
 * `random` config field. Seedable so tests are reproducible.
 */
export function makeSeededPrng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    // Numerical Recipes LCG; modulo 2^32.
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}
