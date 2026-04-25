/**
 * Integration tests for the bounded-learning-empirical module.
 *
 * Covers:
 *   - End-to-end runBenchmark() smoke test with flag enabled
 *   - Default-off byte-identical (disabled returns empty evidence)
 *   - validateConstraint() for each of the 3 caps with flag enabled
 *   - validateConstraint() disabled returns byte-identical empty record
 *   - TaskSet round-trip: serialize → deserialize → structural equality
 *   - Evidence-emitter JSON shape validation
 *   - emitConstraintEvidence produces correct shape for each cap
 */

import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { runBenchmark, validateConstraint } from '../index.js';
import { DEFAULT_TASK_SET, serializeTaskSet, deserializeTaskSet } from '../task-scaffold.js';
import { emitConstraintEvidence } from '../evidence-emitter.js';
import { detectRecursiveDrift } from '../recursive-drift-detector.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Write a temporary settings file that sets the enabled flag. */
function writeEnabledSettings(dir: string): string {
  const path = join(dir, 'gsd-skill-creator.json');
  const content = JSON.stringify({
    'gsd-skill-creator': {
      'upstream-intelligence': {
        'bounded-learning-empirical': { enabled: true },
      },
    },
  });
  writeFileSync(path, content, 'utf8');
  return path;
}

/** Write a temporary settings file with the flag set to false. */
function writeDisabledSettings(dir: string): string {
  const path = join(dir, 'gsd-skill-creator.json');
  const content = JSON.stringify({
    'gsd-skill-creator': {
      'upstream-intelligence': {
        'bounded-learning-empirical': { enabled: false },
      },
    },
  });
  writeFileSync(path, content, 'utf8');
  return path;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runBenchmark() integration', () => {
  let tmpDir: string;

  it('setup temp dir', () => {
    tmpDir = join(tmpdir(), `ble-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    expect(tmpDir).toBeTruthy();
  });

  it('default-off: returns disabled record with empty evidence', async () => {
    // Use a non-existent path — flag defaults to false
    const record = await runBenchmark(
      DEFAULT_TASK_SET,
      '/nonexistent/path/settings.json',
    );
    expect(record.disabled).toBe(true);
    expect(record.evidence).toHaveLength(0);
    expect(record.tasksEvaluated).toBe(0);
    expect(record.meanSelfFeedbackDrift).toBe(0);
    expect(record.meanExternalFeedbackDrift).toBe(0);
    expect(record.driftVerdict).toBeUndefined();
  });

  it('default-off: returns task set name even when disabled', async () => {
    const record = await runBenchmark(
      DEFAULT_TASK_SET,
      '/nonexistent/path/settings.json',
    );
    expect(record.taskSetName).toBe(DEFAULT_TASK_SET.name);
  });

  it('enabled: returns non-disabled record with evidence points', async () => {
    const dir = join(tmpdir(), `ble-enabled-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const settingsPath = writeEnabledSettings(dir);
    try {
      const record = await runBenchmark(DEFAULT_TASK_SET, settingsPath);
      expect(record.disabled).toBe(false);
      expect(record.tasksEvaluated).toBe(20);
      expect(record.evidence.length).toBeGreaterThan(0);
      expect(record.driftVerdict).toBeDefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('enabled: driftVerdict is PASS (qualitative finding reproduced)', async () => {
    const dir = join(tmpdir(), `ble-verdict-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const settingsPath = writeEnabledSettings(dir);
    try {
      const record = await runBenchmark(DEFAULT_TASK_SET, settingsPath);
      expect(record.driftVerdict).toBe('PASS');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('enabled: meanSelfFeedbackDrift > meanExternalFeedbackDrift', async () => {
    const dir = join(tmpdir(), `ble-mean-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const settingsPath = writeEnabledSettings(dir);
    try {
      const record = await runBenchmark(DEFAULT_TASK_SET, settingsPath);
      expect(record.meanSelfFeedbackDrift).toBeGreaterThan(
        record.meanExternalFeedbackDrift,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('enabled: timestamp is a valid ISO-8601 string', async () => {
    const dir = join(tmpdir(), `ble-ts-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const settingsPath = writeEnabledSettings(dir);
    try {
      const record = await runBenchmark(DEFAULT_TASK_SET, settingsPath);
      const d = new Date(record.timestamp);
      expect(d.getTime()).not.toBeNaN();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('validateConstraint() integration', () => {
  it('disabled: returns disabled ConstraintEvidence for twenty-percent-cap', async () => {
    const evidence = await validateConstraint(
      { id: 'twenty-percent-cap' },
      '/nonexistent/path/settings.json',
    );
    expect(evidence.disabled).toBe(true);
    expect(evidence.evidence).toHaveLength(0);
    expect(evidence.capId).toBe('twenty-percent-cap');
  });

  it('disabled: returns disabled ConstraintEvidence for three-correction-minimum', async () => {
    const evidence = await validateConstraint(
      { id: 'three-correction-minimum' },
      '/nonexistent/path/settings.json',
    );
    expect(evidence.disabled).toBe(true);
    expect(evidence.capId).toBe('three-correction-minimum');
  });

  it('disabled: returns disabled ConstraintEvidence for seven-day-cooldown', async () => {
    const evidence = await validateConstraint(
      { id: 'seven-day-cooldown' },
      '/nonexistent/path/settings.json',
    );
    expect(evidence.disabled).toBe(true);
    expect(evidence.capId).toBe('seven-day-cooldown');
  });

  it('enabled: twenty-percent-cap verdict is PASS', async () => {
    const dir = join(tmpdir(), `ble-20pct-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const settingsPath = writeEnabledSettings(dir);
    try {
      const evidence = await validateConstraint(
        { id: 'twenty-percent-cap' },
        settingsPath,
      );
      expect(evidence.disabled).toBe(false);
      expect(evidence.verdict).toBe('PASS');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('enabled: three-correction-minimum verdict is PASS', async () => {
    const dir = join(tmpdir(), `ble-3c-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const settingsPath = writeEnabledSettings(dir);
    try {
      const evidence = await validateConstraint(
        { id: 'three-correction-minimum' },
        settingsPath,
      );
      expect(evidence.disabled).toBe(false);
      expect(evidence.verdict).toBe('PASS');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('enabled: seven-day-cooldown verdict is PASS', async () => {
    const dir = join(tmpdir(), `ble-7d-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const settingsPath = writeEnabledSettings(dir);
    try {
      const evidence = await validateConstraint(
        { id: 'seven-day-cooldown' },
        settingsPath,
      );
      expect(evidence.disabled).toBe(false);
      expect(evidence.verdict).toBe('PASS');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('TaskSet round-trip', () => {
  it('serialize then deserialize produces structurally equal TaskSet', () => {
    const original = DEFAULT_TASK_SET;
    const json = serializeTaskSet(original);
    const deserialized = deserializeTaskSet(json);
    expect(deserialized.name).toBe(original.name);
    expect(deserialized.createdAt).toBe(original.createdAt);
    expect(deserialized.tasks).toHaveLength(original.tasks.length);
    // Verify first and last task
    expect(deserialized.tasks[0]?.id).toBe(original.tasks[0]?.id);
    expect(deserialized.tasks[original.tasks.length - 1]?.id).toBe(
      original.tasks[original.tasks.length - 1]?.id,
    );
  });

  it('deserialize throws on invalid JSON', () => {
    expect(() => deserializeTaskSet('not json')).toThrow();
  });

  it('deserialize throws on missing fields', () => {
    expect(() => deserializeTaskSet('{"name": "x"}')).toThrow(
      /Invalid TaskSet JSON/,
    );
  });

  it('serialized JSON contains all 20 task ids', () => {
    const json = serializeTaskSet(DEFAULT_TASK_SET);
    const parsed = JSON.parse(json) as { tasks: Array<{ id: string }> };
    expect(parsed.tasks).toHaveLength(20);
    // Spot-check a few task ids
    const ids = parsed.tasks.map((t) => t.id);
    expect(ids).toContain('SC-01');
    expect(ids).toContain('SI-01');
    expect(ids).toContain('EC-01');
  });
});

describe('Evidence-emitter JSON shape', () => {
  it('emitConstraintEvidence produces valid JSON-serialisable shape for twenty-percent-cap', () => {
    const driftResult = detectRecursiveDrift({ iterations: 3 });
    const evidence = emitConstraintEvidence(
      { id: 'twenty-percent-cap' },
      driftResult.externalFeedbackTrajectory,
    );
    // Must be JSON-serialisable
    const json = JSON.stringify(evidence);
    const parsed = JSON.parse(json) as typeof evidence;
    expect(parsed.capId).toBe('twenty-percent-cap');
    expect(typeof parsed.parameter).toBe('number');
    expect(['PASS', 'FAIL']).toContain(parsed.verdict);
    expect(typeof parsed.summary).toBe('string');
    expect(Array.isArray(parsed.evidence)).toBe(true);
    expect(typeof parsed.disabled).toBe('boolean');
  });

  it('emitConstraintEvidence produces valid JSON-serialisable shape for three-correction-minimum', () => {
    const driftResult = detectRecursiveDrift({ iterations: 3 });
    const points = driftResult.externalFeedbackTrajectory.map((p, i) => ({
      ...p,
      correctionCount: i + 3,
    }));
    const evidence = emitConstraintEvidence(
      { id: 'three-correction-minimum' },
      points,
    );
    const json = JSON.stringify(evidence);
    const parsed = JSON.parse(json) as typeof evidence;
    expect(parsed.capId).toBe('three-correction-minimum');
    expect(typeof parsed.parameter).toBe('number');
  });

  it('emitConstraintEvidence produces valid JSON-serialisable shape for seven-day-cooldown', () => {
    const driftResult = detectRecursiveDrift({ iterations: 3 });
    const points = driftResult.externalFeedbackTrajectory.map((p, i) => ({
      ...p,
      daysSinceLastCommit: i === 0 ? 0 : 8,
    }));
    const evidence = emitConstraintEvidence(
      { id: 'seven-day-cooldown' },
      points,
    );
    const json = JSON.stringify(evidence);
    const parsed = JSON.parse(json) as typeof evidence;
    expect(parsed.capId).toBe('seven-day-cooldown');
    expect(typeof parsed.parameter).toBe('number');
  });

  it('default-off EvidenceRecord has correct disabled shape', async () => {
    const record = await runBenchmark(
      DEFAULT_TASK_SET,
      '/nonexistent/settings.json',
    );
    const json = JSON.stringify(record);
    const parsed = JSON.parse(json) as typeof record;
    expect(parsed.disabled).toBe(true);
    expect(parsed.evidence).toHaveLength(0);
    expect(parsed.tasksEvaluated).toBe(0);
    expect(parsed.meanSelfFeedbackDrift).toBe(0);
    expect(parsed.meanExternalFeedbackDrift).toBe(0);
    // driftVerdict should be absent (undefined serialises to absent)
    expect(parsed.driftVerdict).toBeUndefined();
  });
});

describe('DEFAULT_TASK_SET scaffold', () => {
  it('has exactly 20 tasks', () => {
    expect(DEFAULT_TASK_SET.tasks).toHaveLength(20);
  });

  it('covers all 15 sub-domains', () => {
    const subDomains = new Set(DEFAULT_TASK_SET.tasks.map((t) => t.subDomain));
    expect(subDomains.size).toBe(15);
  });

  it('all tasks have unique ids', () => {
    const ids = DEFAULT_TASK_SET.tasks.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
