/**
 * HB-03 — calibration-table read/write tests.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync } from 'node:fs';
import {
  readTable,
  writeTable,
  lookupCalibration,
  stageCalibration,
  promoteStaged,
  EMPTY_CALIBRATION_TABLE,
} from '../calibration-table.js';
import { STD_CALIBRATION_SCHEMA_VERSION } from '../types.js';
import { makeEnv } from './test-helpers.js';

describe('STD calibration-table', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('reads the empty-table sentinel when file missing', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const t = readTable(env.tablePath);
    expect(t.entries).toHaveLength(0);
    expect(t.staged ?? []).toHaveLength(0);
    expect(t.schemaVersion).toBe(STD_CALIBRATION_SCHEMA_VERSION);
  });

  it('writes + reads round-trips all fields', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const candidate = {
      model: 'opus' as const,
      std: 11,
      measuredAt: '2026-04-25T12:00:00Z',
      trialCount: 256,
      complianceAtStd: 0.42,
    };
    const staged = stageCalibration(EMPTY_CALIBRATION_TABLE, candidate);
    const promoted = promoteStaged(staged, 'opus');
    const written = writeTable(promoted, env.tablePath, env.configPath);
    expect(written).toBe(env.tablePath);
    const reloaded = readTable(env.tablePath);
    expect(reloaded.entries).toHaveLength(1);
    expect(reloaded.entries[0]).toEqual(candidate);
    expect(reloaded.staged ?? []).toHaveLength(0);
  });

  it('writeTable is a no-op when flag is off', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const result = writeTable(EMPTY_CALIBRATION_TABLE, env.tablePath, env.configPath);
    expect(result).toBeNull();
    // file was never created
    expect(readTable(env.tablePath).entries).toHaveLength(0);
  });

  it('staging records previous std for replacements', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const first = stageCalibration(EMPTY_CALIBRATION_TABLE, {
      model: 'sonnet',
      std: 9,
      measuredAt: '2026-04-25T01:00:00Z',
      trialCount: 100,
      complianceAtStd: 0.5,
    });
    const promoted = promoteStaged(first, 'sonnet');
    const second = stageCalibration(promoted, {
      model: 'sonnet',
      std: 12,
      measuredAt: '2026-04-25T02:00:00Z',
      trialCount: 100,
      complianceAtStd: 0.45,
    });
    expect(second.staged).toHaveLength(1);
    expect(second.staged?.[0].previousStd).toBe(9);
  });

  it('lookupCalibration returns null for unknown models', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const t = readTable(env.tablePath);
    expect(lookupCalibration(t, 'haiku')).toBeNull();
  });

  it('readTable rejects malformed JSON and returns empty table', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    writeFileSync(env.tablePath, '{not valid json', 'utf8');
    const t = readTable(env.tablePath);
    expect(t.entries).toHaveLength(0);
  });

  it('readTable rejects wrong-schema-version payload', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    writeFileSync(
      env.tablePath,
      JSON.stringify({ schemaVersion: '0.0.1', entries: [{ model: 'opus' }] }),
      'utf8',
    );
    const t = readTable(env.tablePath);
    expect(t.entries).toHaveLength(0);
  });

  it('readTable filters out entries with invalid shape', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    writeFileSync(
      env.tablePath,
      JSON.stringify({
        schemaVersion: STD_CALIBRATION_SCHEMA_VERSION,
        entries: [
          { model: 'opus', std: 11, measuredAt: 'x', trialCount: 1, complianceAtStd: 0.4 },
          { model: 'unknown-model', std: 11, measuredAt: 'x', trialCount: 1, complianceAtStd: 0.4 },
          { model: 'sonnet', std: 'not-a-number' },
        ],
      }),
      'utf8',
    );
    const t = readTable(env.tablePath);
    expect(t.entries).toHaveLength(1);
    expect(t.entries[0].model).toBe('opus');
  });
});
