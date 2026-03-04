import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CalibrationStore } from './calibration-store.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('CalibrationStore', () => {
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
    const store = new CalibrationStore(filePath);
    await store.load();

    const adj = store.getAdjustment('small');
    expect(adj.passRateAdjustment).toBe(0);
    expect(adj.knownLimitationWeight).toBe(0);
  });

  it('save then load round-trips correctly', async () => {
    const store = new CalibrationStore(filePath);
    store.setAdjustment('small', { passRateAdjustment: -0.05, knownLimitationWeight: 0.5 });
    await store.save();

    const store2 = new CalibrationStore(filePath);
    await store2.load();
    const adj = store2.getAdjustment('small');
    expect(adj.passRateAdjustment).toBe(-0.05);
    expect(adj.knownLimitationWeight).toBe(0.5);
  });

  it('getAdjustment returns stored adjustment', () => {
    const store = new CalibrationStore(filePath);
    store.setAdjustment('medium', { passRateAdjustment: 0.1 });
    const adj = store.getAdjustment('medium');
    expect(adj.passRateAdjustment).toBe(0.1);
  });

  it('getAdjustment returns default zeros for unset class', () => {
    const store = new CalibrationStore(filePath);
    const adj = store.getAdjustment('cloud');
    expect(adj.passRateAdjustment).toBe(0);
    expect(adj.knownLimitationWeight).toBe(0);
  });

  it('setAdjustment merges with existing data', () => {
    const store = new CalibrationStore(filePath);
    store.setAdjustment('small', { passRateAdjustment: -0.1 });
    store.setAdjustment('small', { knownLimitationWeight: 0.8 });
    const adj = store.getAdjustment('small');
    expect(adj.passRateAdjustment).toBe(-0.1);
    expect(adj.knownLimitationWeight).toBe(0.8);
  });

  it('passRateAdjustment clamped to [-0.25, 0.25]', () => {
    const store = new CalibrationStore(filePath);
    store.setAdjustment('small', { passRateAdjustment: -0.5 });
    expect(store.getAdjustment('small').passRateAdjustment).toBe(-0.25);

    store.setAdjustment('small', { passRateAdjustment: 0.5 });
    expect(store.getAdjustment('small').passRateAdjustment).toBe(0.25);
  });

  it('knownLimitationWeight clamped to [0, 1]', () => {
    const store = new CalibrationStore(filePath);
    store.setAdjustment('small', { knownLimitationWeight: -0.5 });
    expect(store.getAdjustment('small').knownLimitationWeight).toBe(0);

    store.setAdjustment('small', { knownLimitationWeight: 1.5 });
    expect(store.getAdjustment('small').knownLimitationWeight).toBe(1);
  });
});
