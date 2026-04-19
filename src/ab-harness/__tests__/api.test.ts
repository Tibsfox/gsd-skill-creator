/**
 * ME-3 api.ts — read API tests.
 *
 * Verifies:
 *   - getExperimentStatus returns 'not-found' for missing branches.
 *   - writeExperimentState + getExperimentStatus round-trips correctly.
 *   - listExperiments returns all experiments in the branches dir.
 *   - listExperiments returns empty array for empty/nonexistent dir.
 *   - State round-trips include all required fields.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import {
  getExperimentStatus,
  listExperiments,
  writeExperimentState,
  type ABExperimentState,
} from '../api.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function makeTmpDir(): Promise<string> {
  const dir = join(tmpdir(), `ab-api-test-${randomUUID()}`);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function cleanupDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

function makeState(branchId: string, skillName: string): ABExperimentState {
  return {
    branchId,
    skillName,
    startedAt: Date.now(),
    samplesPerVariant: 20,
    outcomes: [
      { session: '1', variant: 'A', score: 50 },
      { session: '1', variant: 'B', score: 55 },
    ],
    latestVerdict: {
      nRuns: 2,
      meanDelta: 5,
      signTest: 0.05,
      noiseFloor: 2.0,
      decision: 'commit-B',
      tractability: 'tractable',
      warnings: ['E-4: IID assumption'],
    },
    resolved: false,
  };
}

// ─── getExperimentStatus ──────────────────────────────────────────────────────

describe('getExperimentStatus()', () => {
  let tmpDir: string;
  beforeEach(async () => { tmpDir = await makeTmpDir(); });
  afterEach(async () => { await cleanupDir(tmpDir); });

  it('returns not-found for missing branch', async () => {
    const result = await getExperimentStatus('nonexistent-id', tmpDir);
    expect(result.status).toBe('not-found');
  });

  it('returns found with correct state after write', async () => {
    const branchId = randomUUID();
    const state = makeState(branchId, 'my-skill');

    await writeExperimentState(branchId, state, tmpDir);
    const result = await getExperimentStatus(branchId, tmpDir);

    expect(result.status).toBe('found');
    if (result.status !== 'found') return;

    expect(result.state.branchId).toBe(branchId);
    expect(result.state.skillName).toBe('my-skill');
    expect(result.state.samplesPerVariant).toBe(20);
    expect(result.state.outcomes).toHaveLength(2);
    expect(result.state.resolved).toBe(false);
  });

  it('round-trips latestVerdict correctly', async () => {
    const branchId = randomUUID();
    const state = makeState(branchId, 'skill-x');
    await writeExperimentState(branchId, state, tmpDir);

    const result = await getExperimentStatus(branchId, tmpDir);
    expect(result.status).toBe('found');
    if (result.status !== 'found') return;

    const v = result.state.latestVerdict!;
    expect(v.decision).toBe('commit-B');
    expect(v.tractability).toBe('tractable');
    expect(v.noiseFloor).toBe(2.0);
    expect(v.warnings).toContain('E-4: IID assumption');
  });

  it('round-trips resolved=true and resolution', async () => {
    const branchId = randomUUID();
    const state: ABExperimentState = {
      ...makeState(branchId, 'resolved-skill'),
      resolved: true,
      resolution: 'committed',
    };
    await writeExperimentState(branchId, state, tmpDir);

    const result = await getExperimentStatus(branchId, tmpDir);
    expect(result.status).toBe('found');
    if (result.status !== 'found') return;
    expect(result.state.resolved).toBe(true);
    expect(result.state.resolution).toBe('committed');
  });
});

// ─── listExperiments ──────────────────────────────────────────────────────────

describe('listExperiments()', () => {
  let tmpDir: string;
  beforeEach(async () => { tmpDir = await makeTmpDir(); });
  afterEach(async () => { await cleanupDir(tmpDir); });

  it('returns empty array for empty directory', async () => {
    const result = await listExperiments(tmpDir);
    expect(result).toEqual([]);
  });

  it('returns empty array for nonexistent directory', async () => {
    const result = await listExperiments(join(tmpDir, 'no-such-dir'));
    expect(result).toEqual([]);
  });

  it('returns all experiments in the directory', async () => {
    const ids = [randomUUID(), randomUUID(), randomUUID()];
    for (const id of ids) {
      await writeExperimentState(id, makeState(id, `skill-${id.slice(0, 4)}`), tmpDir);
    }

    const result = await listExperiments(tmpDir);
    expect(result).toHaveLength(3);
    const foundIds = result.map(r => r.branchId).sort();
    expect(foundIds).toEqual(ids.sort());
  });

  it('ignores directories without ab-state.json', async () => {
    // Create one valid experiment.
    const id = randomUUID();
    await writeExperimentState(id, makeState(id, 'valid-skill'), tmpDir);

    // Create a spurious directory without ab-state.json.
    const spuriousDir = join(tmpDir, 'not-an-experiment');
    await fs.mkdir(spuriousDir, { recursive: true });
    await fs.writeFile(join(spuriousDir, 'manifest.json'), '{"id":"x"}', 'utf8');

    const result = await listExperiments(tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0]!.branchId).toBe(id);
  });

  it('state in list includes latestVerdict', async () => {
    const id = randomUUID();
    await writeExperimentState(id, makeState(id, 'skill-y'), tmpDir);

    const result = await listExperiments(tmpDir);
    expect(result[0]!.state.latestVerdict?.decision).toBe('commit-B');
  });
});

// ─── writeExperimentState ────────────────────────────────────────────────────

describe('writeExperimentState()', () => {
  let tmpDir: string;
  beforeEach(async () => { tmpDir = await makeTmpDir(); });
  afterEach(async () => { await cleanupDir(tmpDir); });

  it('creates branch directory if it does not exist', async () => {
    const branchId = randomUUID();
    await writeExperimentState(branchId, makeState(branchId, 's'), tmpDir);
    const stat = await fs.stat(join(tmpDir, branchId));
    expect(stat.isDirectory()).toBe(true);
  });

  it('overwrites existing state on second write', async () => {
    const branchId = randomUUID();
    const s1 = makeState(branchId, 'skill-original');
    const s2: ABExperimentState = { ...s1, skillName: 'skill-updated', resolved: true, resolution: 'aborted' };

    await writeExperimentState(branchId, s1, tmpDir);
    await writeExperimentState(branchId, s2, tmpDir);

    const result = await getExperimentStatus(branchId, tmpDir);
    expect(result.status).toBe('found');
    if (result.status !== 'found') return;
    expect(result.state.skillName).toBe('skill-updated');
    expect(result.state.resolved).toBe(true);
  });

  it('writes valid JSON', async () => {
    const branchId = randomUUID();
    await writeExperimentState(branchId, makeState(branchId, 'test'), tmpDir);
    const raw = await fs.readFile(join(tmpDir, branchId, 'ab-state.json'), 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});
