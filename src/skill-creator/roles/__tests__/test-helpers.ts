/**
 * HB-04 W/E/E roles — shared test helpers.
 */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { FailureHistoryEntry } from '../types.js';

export interface TestEnv {
  configPath: string;
  triggerMarkerPath: string;
  capcomMarkerPath: string;
  cleanup: () => void;
}

export function makeEnv(flagValue: boolean | undefined): TestEnv {
  const dir = mkdtempSync(join(tmpdir(), 'weler-roles-test-'));
  const claudeDir = join(dir, '.claude');
  const scDir = join(dir, '.planning', 'skill-creator');
  mkdirSync(claudeDir, { recursive: true });
  mkdirSync(scDir, { recursive: true });
  const configPath = join(claudeDir, 'gsd-skill-creator.json');
  const triggerMarkerPath = join(scDir, 'weler-roles.trigger');
  const capcomMarkerPath = join(scDir, 'weler-roles.capcom');
  const block: Record<string, unknown> = {};
  if (flagValue !== undefined) block.enabled = flagValue;
  writeFileSync(
    configPath,
    JSON.stringify({
      'gsd-skill-creator': {
        'cs25-26-sweep': {
          'weler-roles': block,
        },
      },
    }),
  );
  return {
    configPath,
    triggerMarkerPath,
    capcomMarkerPath,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

export function makeMissingConfigEnv(): TestEnv {
  const dir = mkdtempSync(join(tmpdir(), 'weler-roles-missing-'));
  const scDir = join(dir, '.planning', 'skill-creator');
  mkdirSync(scDir, { recursive: true });
  return {
    configPath: join(dir, '.claude', 'never-created.json'),
    triggerMarkerPath: join(scDir, 'weler-roles.trigger'),
    capcomMarkerPath: join(scDir, 'weler-roles.capcom'),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

export function authorizeCapcom(env: TestEnv, signature = 'human-foxy@2026-04-25'): void {
  writeFileSync(env.capcomMarkerPath, signature, 'utf8');
}

export function recordTrigger(env: TestEnv): void {
  writeFileSync(env.triggerMarkerPath, '', 'utf8');
}

/** A small synthetic failure-history fixture used across role tests. */
export const SYNTHETIC_FAILURE_HISTORY: ReadonlyArray<FailureHistoryEntry> = Object.freeze([
  Object.freeze({
    id: 'fh-001',
    failureClass: 'unbounded-recursion',
    summary: 'recursive helper without depth limit blew the stack',
    recordedAt: '2026-04-01T00:00:00Z',
  }),
  Object.freeze({
    id: 'fh-002',
    failureClass: 'silent-truncation',
    summary: 'output truncated at 4096 bytes without warning',
    recordedAt: '2026-04-02T00:00:00Z',
  }),
  Object.freeze({
    id: 'fh-003',
    failureClass: 'capcom-bypass',
    summary: 'gate emitter swallowed exception and reported authorized',
    recordedAt: '2026-04-03T00:00:00Z',
  }),
]);
