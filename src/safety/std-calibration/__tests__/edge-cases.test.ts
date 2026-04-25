/**
 * HB-03 — edge-case + boundary tests.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync } from 'node:fs';
import {
  stageCalibration,
  promoteStaged,
  readTable,
  writeTable,
  lookupCalibration,
  EMPTY_CALIBRATION_TABLE,
} from '../calibration-table.js';
import { decideReInjection } from '../re-injection.js';
import { makeEnv } from './test-helpers.js';

describe('STD calibration — edge cases', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('concurrent calibration updates from parallel sessions: last-writer-wins on disk; in-memory stage is deterministic', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    // Session A stages.
    const a = stageCalibration(EMPTY_CALIBRATION_TABLE, {
      model: 'opus',
      std: 9,
      measuredAt: '2026-04-25T01:00:00Z',
      trialCount: 32,
      complianceAtStd: 0.49,
    });
    writeTable(a, env.tablePath, env.configPath);

    // Session B re-reads, stages a competing value, writes.
    const reread = readTable(env.tablePath);
    const b = stageCalibration(reread, {
      model: 'opus',
      std: 13,
      measuredAt: '2026-04-25T01:30:00Z',
      trialCount: 64,
      complianceAtStd: 0.42,
    });
    writeTable(b, env.tablePath, env.configPath);

    const final = readTable(env.tablePath);
    // Only one staged record per model — last-writer wins.
    expect(final.staged).toHaveLength(1);
    expect(final.staged?.[0].std).toBe(13);
  });

  it('malformed calibration JSON does not crash; treated as no calibration', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    writeFileSync(env.tablePath, '{"truncated": ', 'utf8');
    const t = readTable(env.tablePath);
    expect(t.entries).toHaveLength(0);
    // Re-injection on a model not in the (now-empty) table falls back to bootstrap floor.
    const r = decideReInjection('haiku', 5, ['rule'], {
      tablePath: env.tablePath,
      settingsPath: env.configPath,
    });
    expect(r.usedBootstrapFloor).toBe(true);
  });

  it('lookup returns null for a model absent from the calibration table', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const staged = stageCalibration(EMPTY_CALIBRATION_TABLE, {
      model: 'opus',
      std: 11,
      measuredAt: '2026-04-25T00:00:00Z',
      trialCount: 64,
      complianceAtStd: 0.4,
    });
    const promoted = promoteStaged(staged, 'opus');
    writeTable(promoted, env.tablePath, env.configPath);
    const t = readTable(env.tablePath);
    expect(lookupCalibration(t, 'opus')?.std).toBe(11);
    expect(lookupCalibration(t, 'sonnet')).toBeNull();
    expect(lookupCalibration(t, 'haiku')).toBeNull();
  });

  it('promoteStaged is a no-op when no staged record exists for that model', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const result = promoteStaged(EMPTY_CALIBRATION_TABLE, 'opus');
    expect(result.entries).toHaveLength(0);
    expect(result.staged ?? []).toHaveLength(0);
  });
});
