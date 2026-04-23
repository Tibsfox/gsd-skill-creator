/**
 * Convergent settings reader tests.
 *
 * Validates isConvergentModuleEnabled, readConvergentNumber, and
 * getConvergentEnablementSnapshot against live .claude/gsd-skill-creator.json
 * plus synthesized fixture files.
 */

import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import {
  isConvergentModuleEnabled,
  readConvergentSettings,
  readConvergentNumber,
  getConvergentEnablementSnapshot,
  ALL_CONVERGENT_MODULES,
} from '../settings.js';

const LIB_PATH = path.join(process.cwd(), '.claude', 'gsd-skill-creator.json');

function writeFixture(content: unknown): string {
  const tmp = path.join(os.tmpdir(), `conv-settings-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(tmp, JSON.stringify(content));
  return tmp;
}

describe('convergent settings: ALL_CONVERGENT_MODULES', () => {
  it('lists exactly 5 module keys', () => {
    expect(ALL_CONVERGENT_MODULES).toHaveLength(5);
    expect(ALL_CONVERGENT_MODULES).toContain('trustTiers');
    expect(ALL_CONVERGENT_MODULES).toContain('twoGate');
    expect(ALL_CONVERGENT_MODULES).toContain('compressionSpectrum');
    expect(ALL_CONVERGENT_MODULES).toContain('cascadeMcpDefense');
    expect(ALL_CONVERGENT_MODULES).toContain('reasoningGraphs');
  });
});

describe('convergent settings: live .claude/gsd-skill-creator.json', () => {
  it('readConvergentSettings returns non-null object', () => {
    const conv = readConvergentSettings(LIB_PATH);
    expect(conv).not.toBeNull();
    expect(typeof conv).toBe('object');
  });

  it('all 5 modules are enabled in the live config', () => {
    for (const key of ALL_CONVERGENT_MODULES) {
      expect(isConvergentModuleEnabled(key, LIB_PATH), `${key} should be enabled`).toBe(true);
    }
  });

  it('getConvergentEnablementSnapshot returns all-true for live config', () => {
    const snap = getConvergentEnablementSnapshot(LIB_PATH);
    expect(Object.values(snap).every((v) => v === true)).toBe(true);
  });

  it('readConvergentNumber returns the vulnerability baseline 26.1 for trustTiers', () => {
    const v = readConvergentNumber('trustTiers', 'vulnerabilityBaselinePercent', 0, LIB_PATH);
    expect(v).toBeCloseTo(26.1, 2);
  });

  it('readConvergentNumber returns default for missing field', () => {
    const v = readConvergentNumber('trustTiers', 'notARealField', 42, LIB_PATH);
    expect(v).toBe(42);
  });
});

describe('convergent settings: synthesized fixtures', () => {
  it('returns false when config has no gsd-skill-creator root', () => {
    const p = writeFixture({ other: { convergent: { trustTiers: { enabled: true } } } });
    expect(isConvergentModuleEnabled('trustTiers', p)).toBe(false);
    fs.unlinkSync(p);
  });

  it('returns false when config has no convergent block', () => {
    const p = writeFixture({ 'gsd-skill-creator': { drift: {} } });
    expect(isConvergentModuleEnabled('trustTiers', p)).toBe(false);
    fs.unlinkSync(p);
  });

  it('returns false when a module is explicitly disabled', () => {
    const p = writeFixture({
      'gsd-skill-creator': {
        convergent: {
          trustTiers: { enabled: false },
          twoGate: { enabled: true },
        },
      },
    });
    expect(isConvergentModuleEnabled('trustTiers', p)).toBe(false);
    expect(isConvergentModuleEnabled('twoGate', p)).toBe(true);
    fs.unlinkSync(p);
  });

  it('returns false on non-boolean enabled value (strict)', () => {
    const p = writeFixture({
      'gsd-skill-creator': {
        convergent: { trustTiers: { enabled: 'yes' } },
      },
    });
    expect(isConvergentModuleEnabled('trustTiers', p)).toBe(false);
    fs.unlinkSync(p);
  });

  it('readConvergentNumber respects nested numeric fields', () => {
    const p = writeFixture({
      'gsd-skill-creator': {
        convergent: {
          twoGate: { enabled: true, tau: 0.05, capacityK0: 8 },
        },
      },
    });
    expect(readConvergentNumber('twoGate', 'tau', 0, p)).toBe(0.05);
    expect(readConvergentNumber('twoGate', 'capacityK0', 0, p)).toBe(8);
    expect(readConvergentNumber('twoGate', 'missing', 999, p)).toBe(999);
    fs.unlinkSync(p);
  });

  it('returns default on malformed JSON', () => {
    const tmp = path.join(os.tmpdir(), `bad-${Date.now()}.json`);
    fs.writeFileSync(tmp, '{ not valid json');
    expect(isConvergentModuleEnabled('trustTiers', tmp)).toBe(false);
    expect(readConvergentSettings(tmp)).toBeNull();
    fs.unlinkSync(tmp);
  });

  it('returns default on non-existent file', () => {
    expect(isConvergentModuleEnabled('trustTiers', '/tmp/definitely-not-a-real-file.json')).toBe(false);
  });

  it('getConvergentEnablementSnapshot reports per-module state accurately', () => {
    const p = writeFixture({
      'gsd-skill-creator': {
        convergent: {
          trustTiers: { enabled: true },
          twoGate: { enabled: false },
          compressionSpectrum: { enabled: true },
          cascadeMcpDefense: { enabled: false },
          reasoningGraphs: { enabled: true },
        },
      },
    });
    const snap = getConvergentEnablementSnapshot(p);
    expect(snap.trustTiers).toBe(true);
    expect(snap.twoGate).toBe(false);
    expect(snap.compressionSpectrum).toBe(true);
    expect(snap.cascadeMcpDefense).toBe(false);
    expect(snap.reasoningGraphs).toBe(true);
    fs.unlinkSync(p);
  });
});
