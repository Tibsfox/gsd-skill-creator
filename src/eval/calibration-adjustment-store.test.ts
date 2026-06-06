import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CalibrationAdjustmentStore } from './calibration-adjustment-store.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  CapturingAuditSink,
  defaultLoaderContext,
  LoaderContextDenied,
  type LoaderContext,
} from '../security/loader-context.js';

/** Escape a string for safe literal use inside a RegExp (Windows paths contain backslashes). */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('CalibrationAdjustmentStore', () => {
  let tmpDir: string;
  let filePath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(join(tmpdir(), 'cal-test-'));
    filePath = join(tmpDir, 'calibration.json');
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('load with missing file returns default zero adjustments', async () => {
    const store = new CalibrationAdjustmentStore(filePath);
    await store.load();

    const adj = store.getAdjustment('small');
    expect(adj.passRateAdjustment).toBe(0);
    expect(adj.knownLimitationWeight).toBe(0);
  });

  it('save then load round-trips correctly', async () => {
    const store = new CalibrationAdjustmentStore(filePath);
    store.setAdjustment('small', { passRateAdjustment: -0.05, knownLimitationWeight: 0.5 });
    await store.save();

    const store2 = new CalibrationAdjustmentStore(filePath);
    await store2.load();
    const adj = store2.getAdjustment('small');
    expect(adj.passRateAdjustment).toBe(-0.05);
    expect(adj.knownLimitationWeight).toBe(0.5);
  });

  it('getAdjustment returns stored adjustment', () => {
    const store = new CalibrationAdjustmentStore(filePath);
    store.setAdjustment('medium', { passRateAdjustment: 0.1 });
    const adj = store.getAdjustment('medium');
    expect(adj.passRateAdjustment).toBe(0.1);
  });

  it('getAdjustment returns default zeros for unset class', () => {
    const store = new CalibrationAdjustmentStore(filePath);
    const adj = store.getAdjustment('cloud');
    expect(adj.passRateAdjustment).toBe(0);
    expect(adj.knownLimitationWeight).toBe(0);
  });

  it('setAdjustment merges with existing data', () => {
    const store = new CalibrationAdjustmentStore(filePath);
    store.setAdjustment('small', { passRateAdjustment: -0.1 });
    store.setAdjustment('small', { knownLimitationWeight: 0.8 });
    const adj = store.getAdjustment('small');
    expect(adj.passRateAdjustment).toBe(-0.1);
    expect(adj.knownLimitationWeight).toBe(0.8);
  });

  it('passRateAdjustment clamped to [-0.25, 0.25]', () => {
    const store = new CalibrationAdjustmentStore(filePath);
    store.setAdjustment('small', { passRateAdjustment: -0.5 });
    expect(store.getAdjustment('small').passRateAdjustment).toBe(-0.25);

    store.setAdjustment('small', { passRateAdjustment: 0.5 });
    expect(store.getAdjustment('small').passRateAdjustment).toBe(0.25);
  });

  it('knownLimitationWeight clamped to [0, 1]', () => {
    const store = new CalibrationAdjustmentStore(filePath);
    store.setAdjustment('small', { knownLimitationWeight: -0.5 });
    expect(store.getAdjustment('small').knownLimitationWeight).toBe(0);

    store.setAdjustment('small', { knownLimitationWeight: 1.5 });
    expect(store.getAdjustment('small').knownLimitationWeight).toBe(1);
  });

  describe('LoaderContext chokepoint integration (v1.49.890)', () => {
    it('emits exactly one audit record on load when ctx is provided', async () => {
      const sink = new CapturingAuditSink();
      const store = new CalibrationAdjustmentStore(filePath, defaultLoaderContext(sink));
      await store.load();
      expect(sink.records).toHaveLength(1);
      const rec = sink.records[0];
      expect(rec.source).toBe('eval/calibration-adjustment-store');
      expect(rec.op).toBe('read-file');
      expect(rec.target).toBe(filePath);
      expect(rec.allowed).toBe(true);
    });

    it('throws LoaderContextDenied when filePath is not in allowList', async () => {
      const sink = new CapturingAuditSink();
      const restrictedCtx: LoaderContext = {
        allowList: ['/somewhere/that/does/not/match'],
        audit: sink,
      };
      const store = new CalibrationAdjustmentStore(filePath, restrictedCtx);
      await expect(store.load()).rejects.toBeInstanceOf(LoaderContextDenied);
      expect(sink.records).toHaveLength(1);
      expect(sink.records[0].allowed).toBe(false);
    });

    it('legacy permissive mode when ctx is undefined (load works without audit)', async () => {
      const store = new CalibrationAdjustmentStore(filePath);
      await store.load();
      expect(store.getAdjustment('small').passRateAdjustment).toBe(0);
    });

    it('admits filePath via prefix-pattern (trailing slash) in allowList', async () => {
      const sink = new CapturingAuditSink();
      // The string trailing-slash prefix pattern only matches POSIX-style
      // separators; filePath uses path.join (backslashes on Windows). Use a
      // RegExp anchored to the (native-separator) tmpDir so the prefix
      // admission is exercised on both platforms.
      const prefixCtx: LoaderContext = {
        allowList: [new RegExp(`^${escapeRegExp(tmpDir)}`)],
        audit: sink,
      };
      const store = new CalibrationAdjustmentStore(filePath, prefixCtx);
      await store.load();
      expect(sink.records).toHaveLength(1);
      expect(sink.records[0].allowed).toBe(true);
    });

    it('audits the override path when load(overridePath) is called', async () => {
      const sink = new CapturingAuditSink();
      // Admit BOTH constructor path and the override path
      const ctx: LoaderContext = {
        allowList: [/.*/],
        audit: sink,
      };
      const store = new CalibrationAdjustmentStore(filePath, ctx);
      const overridePath = join(tmpDir, 'override-calibration.json');
      await store.load(overridePath);
      expect(sink.records).toHaveLength(1);
      expect(sink.records[0].target).toBe(overridePath);
    });

    it('save() is not gated by LoaderContext (read-side chokepoint by design)', async () => {
      const sink = new CapturingAuditSink();
      const restrictedCtx: LoaderContext = {
        allowList: ['/somewhere/that/does/not/match'],
        audit: sink,
      };
      const store = new CalibrationAdjustmentStore(filePath, restrictedCtx);
      // save() succeeds even though the path is not in allowList — the chokepoint
      // is intentionally read-only per LoaderContext docstring.
      store.setAdjustment('small', { passRateAdjustment: 0.1 });
      await expect(store.save()).resolves.toBeUndefined();
      expect(sink.records).toHaveLength(0);
    });
  });
});
