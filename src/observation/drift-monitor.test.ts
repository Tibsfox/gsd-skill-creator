import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PatternStore } from '../storage/pattern-store.js';
import type { DriftEvent, DemotionDecision, DriftMonitorConfig } from '../types/observation.js';
import { DriftMonitor } from './drift-monitor.js';

describe('DriftMonitor', () => {
  let tmpDir: string;
  let store: PatternStore;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'drift-monitor-test-'));
    store = new PatternStore(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns no demotion when actual hash matches expected hash', async () => {
    const monitor = new DriftMonitor(store);
    const result = await monitor.check('Read:abc123', 'hash-aaa', 'hash-aaa');

    expect(result.demoted).toBe(false);
    expect(result.consecutiveMismatches).toBe(0);
    expect(result.reason).toMatch(/match/i);
  });

  it('tracks consecutive mismatches on hash mismatch', async () => {
    const monitor = new DriftMonitor(store);
    const result = await monitor.check('Read:abc123', 'hash-actual', 'hash-expected');

    expect(result.demoted).toBe(false);
    expect(result.consecutiveMismatches).toBe(1);
    expect(result.reason).toMatch(/mismatch/i);
  });

  it('triggers demotion after 3 consecutive mismatches (default sensitivity)', async () => {
    const monitor = new DriftMonitor(store);

    const r1 = await monitor.check('Read:abc123', 'bad-1', 'expected-hash');
    expect(r1.demoted).toBe(false);
    expect(r1.consecutiveMismatches).toBe(1);

    const r2 = await monitor.check('Read:abc123', 'bad-2', 'expected-hash');
    expect(r2.demoted).toBe(false);
    expect(r2.consecutiveMismatches).toBe(2);

    const r3 = await monitor.check('Read:abc123', 'bad-3', 'expected-hash');
    expect(r3.demoted).toBe(true);
    expect(r3.consecutiveMismatches).toBe(3);
    expect(r3.events.length).toBe(3);
    expect(r3.reason).toMatch(/threshold/i);
  });

  it('resets consecutive mismatch counter when output matches', async () => {
    const monitor = new DriftMonitor(store);

    await monitor.check('Read:abc123', 'bad-1', 'expected');
    await monitor.check('Read:abc123', 'bad-2', 'expected');

    // Reset with matching hash
    const reset = await monitor.check('Read:abc123', 'expected', 'expected');
    expect(reset.consecutiveMismatches).toBe(0);
    expect(reset.demoted).toBe(false);

    // Start fresh counter
    const result = await monitor.check('Read:abc123', 'bad-3', 'expected');
    expect(result.consecutiveMismatches).toBe(1);
    expect(result.demoted).toBe(false);
  });

  it('uses configurable sensitivity threshold', async () => {
    const config: DriftMonitorConfig = { sensitivity: 5, enabled: true };
    const monitor = new DriftMonitor(store, config);

    for (let i = 1; i <= 4; i++) {
      const r = await monitor.check('Read:abc123', `bad-${i}`, 'expected');
      expect(r.demoted).toBe(false);
    }

    const r5 = await monitor.check('Read:abc123', 'bad-5', 'expected');
    expect(r5.demoted).toBe(true);
    expect(r5.consecutiveMismatches).toBe(5);
  });

  it('tracks separate counters per operation ID', async () => {
    const monitor = new DriftMonitor(store);

    await monitor.check('Read:abc', 'bad-1', 'exp-1');
    await monitor.check('Bash:xyz', 'bad-1', 'exp-2');
    const result = await monitor.check('Read:abc', 'bad-2', 'exp-1');

    expect(result.consecutiveMismatches).toBe(2);
  });

  it('stores drift events to PatternStore feedback category', async () => {
    const monitor = new DriftMonitor(store);
    await monitor.check('Read:abc123', 'actual-hash', 'expected-hash');

    const entries = await store.read('feedback');
    expect(entries.length).toBe(1);
    expect(entries[0].data).toMatchObject({
      operationId: 'Read:abc123',
      matched: false,
      actualHash: 'actual-hash',
      expectedHash: 'expected-hash',
      consecutiveMismatches: 1,
    });
  });

  it('restores consecutive mismatch state from PatternStore on construction', async () => {
    const monitor1 = new DriftMonitor(store);
    await monitor1.check('Read:abc', 'bad-1', 'expected');
    await monitor1.check('Read:abc', 'bad-2', 'expected');

    // Create a NEW DriftMonitor with the same store (simulates new session)
    const monitor2 = new DriftMonitor(store);
    const result = await monitor2.check('Read:abc', 'bad-3', 'expected');

    expect(result.consecutiveMismatches).toBe(3);
    expect(result.demoted).toBe(true);
  });

  it('returns disabled result when enabled is false', async () => {
    const config: DriftMonitorConfig = { sensitivity: 3, enabled: false };
    const monitor = new DriftMonitor(store, config);
    const result = await monitor.check('Read:abc123', 'actual', 'expected');

    expect(result.demoted).toBe(false);
    expect(result.reason).toMatch(/disabled/i);
    expect(result.consecutiveMismatches).toBe(0);
  });

  it('events array in demotion decision contains all contributing events', async () => {
    const monitor = new DriftMonitor(store);

    await monitor.check('Read:abc123', 'bad-1', 'expected');
    await monitor.check('Read:abc123', 'bad-2', 'expected');
    const result = await monitor.check('Read:abc123', 'bad-3', 'expected');

    expect(result.events.length).toBe(3);
    expect(result.events[0].matched).toBe(false);
    expect(result.events[0].consecutiveMismatches).toBe(1);
    expect(result.events[1].matched).toBe(false);
    expect(result.events[1].consecutiveMismatches).toBe(2);
    expect(result.events[2].matched).toBe(false);
    expect(result.events[2].consecutiveMismatches).toBe(3);

    for (const event of result.events) {
      expect(event.operationId).toBe('Read:abc123');
    }
  });

  it('continues tracking after demotion (does not stop)', async () => {
    const config: DriftMonitorConfig = { sensitivity: 2, enabled: true };
    const monitor = new DriftMonitor(store, config);

    await monitor.check('Read:abc123', 'bad-1', 'expected');
    const r2 = await monitor.check('Read:abc123', 'bad-2', 'expected');
    expect(r2.demoted).toBe(true);

    const r3 = await monitor.check('Read:abc123', 'bad-3', 'expected');
    expect(r3.demoted).toBe(true);
    expect(r3.consecutiveMismatches).toBe(3);
  });
});
