import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { SuccessTracker } from './success-tracker.js';

describe('SuccessTracker', () => {
  let tempDir: string;
  let tracker: SuccessTracker;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'success-tracker-test-'));
    tracker = new SuccessTracker(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('records a success signal with auto-generated id and timestamp', async () => {
    const signal = await tracker.record({
      skillName: 'test-skill',
      signalType: 'correction',
      activationScore: 0.85,
    });

    expect(signal.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(signal.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(signal.skillName).toBe('test-skill');
    expect(signal.signalType).toBe('correction');
    expect(signal.activationScore).toBe(0.85);
  });

  it('gets signals by skill name', async () => {
    // Record 3 for skill-a
    await tracker.record({ skillName: 'skill-a', signalType: 'correction', activationScore: 0.80 });
    await tracker.record({ skillName: 'skill-a', signalType: 'explicit-positive', activationScore: 0.90 });
    await tracker.record({ skillName: 'skill-a', signalType: 'override', activationScore: 0.70 });

    // Record 2 for skill-b
    await tracker.record({ skillName: 'skill-b', signalType: 'explicit-negative', activationScore: 0.65 });
    await tracker.record({ skillName: 'skill-b', signalType: 'explicit-positive', activationScore: 0.88 });

    const signalsA = await tracker.getBySkill('skill-a');
    const signalsB = await tracker.getBySkill('skill-b');

    expect(signalsA).toHaveLength(3);
    expect(signalsB).toHaveLength(2);
  });

  it('computes success rate with weighted signals', async () => {
    // 2x explicit-positive (success), 1x correction (failure), 1x explicit-negative (failure)
    await tracker.record({ skillName: 'test-skill', signalType: 'explicit-positive', activationScore: 0.90 });
    await tracker.record({ skillName: 'test-skill', signalType: 'explicit-positive', activationScore: 0.85 });
    await tracker.record({ skillName: 'test-skill', signalType: 'correction', activationScore: 0.80 });
    await tracker.record({ skillName: 'test-skill', signalType: 'explicit-negative', activationScore: 0.75 });

    const rate = await tracker.getSuccessRate('test-skill');

    expect(rate.total).toBe(4);
    expect(rate.positive).toBe(2);  // 2 explicit-positive
    expect(rate.negative).toBe(2);  // 1 correction + 1 explicit-negative
    expect(rate.rate).toBe(0.5);    // 2/4
  });

  it('counts override as failure in success rate', async () => {
    await tracker.record({ skillName: 'test-skill', signalType: 'explicit-positive', activationScore: 0.90 });
    await tracker.record({ skillName: 'test-skill', signalType: 'override', activationScore: 0.80 });

    const rate = await tracker.getSuccessRate('test-skill');

    expect(rate.total).toBe(2);
    expect(rate.positive).toBe(1);
    expect(rate.negative).toBe(1);
    expect(rate.rate).toBe(0.5);
  });

  it('returns zero rate when no signals exist', async () => {
    const rate = await tracker.getSuccessRate('nonexistent');

    expect(rate.rate).toBe(0);
    expect(rate.total).toBe(0);
    expect(rate.positive).toBe(0);
    expect(rate.negative).toBe(0);
  });

  it('persists signals to JSONL file', async () => {
    await tracker.record({
      skillName: 'persist-test',
      signalType: 'explicit-positive',
      activationScore: 0.92,
    });

    // Create a new tracker instance with the same path
    const tracker2 = new SuccessTracker(tempDir);
    const signals = await tracker2.getBySkill('persist-test');

    expect(signals).toHaveLength(1);
    expect(signals[0].skillName).toBe('persist-test');
    expect(signals[0].signalType).toBe('explicit-positive');
    expect(signals[0].activationScore).toBe(0.92);
  });

  it('handles concurrent writes without corruption', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      tracker.record({
        skillName: 'concurrent-skill',
        signalType: 'explicit-positive',
        activationScore: 0.80 + i * 0.01,
      })
    );

    await Promise.all(promises);

    const signals = await tracker.getBySkill('concurrent-skill');
    expect(signals).toHaveLength(10);
  });

  it('returns all signals via getAll()', async () => {
    await tracker.record({ skillName: 'skill-a', signalType: 'correction', activationScore: 0.80 });
    await tracker.record({ skillName: 'skill-b', signalType: 'explicit-positive', activationScore: 0.90 });
    await tracker.record({ skillName: 'skill-c', signalType: 'override', activationScore: 0.70 });

    const all = await tracker.getAll();
    expect(all).toHaveLength(3);
  });

  it('clears all signals', async () => {
    await tracker.record({ skillName: 'test-skill', signalType: 'correction', activationScore: 0.80 });
    await tracker.record({ skillName: 'test-skill', signalType: 'explicit-positive', activationScore: 0.90 });

    await tracker.clear();

    const all = await tracker.getAll();
    expect(all).toHaveLength(0);
  });
});
