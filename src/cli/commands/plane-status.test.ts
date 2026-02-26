/**
 * Tests for the plane-status CLI command.
 *
 * Uses temp directories with pre-written JSON files for PositionStore
 * and ChordStore paths, avoiding dependency on real .claude/plane/ state.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { planeStatusCommand } from './plane-status.js';

// ============================================================================
// Helpers
// ============================================================================

/** Create a positions JSON file with the given skill map. */
async function writePositions(
  dir: string,
  skills: Record<string, { theta: number; radius: number; angularVelocity: number; lastUpdated: string }>,
): Promise<string> {
  const filePath = path.join(dir, 'positions.json');
  await writeFile(filePath, JSON.stringify(skills, null, 2));
  return filePath;
}

/** Create an empty chords JSON file. */
async function writeChords(dir: string, chords: unknown[] = []): Promise<string> {
  const filePath = path.join(dir, 'chords.json');
  await writeFile(filePath, JSON.stringify(chords, null, 2));
  return filePath;
}

function makeSkill(theta: number, radius: number, vel = 0) {
  return { theta, radius, angularVelocity: vel, lastUpdated: new Date().toISOString() };
}

// ============================================================================
// Tests
// ============================================================================

describe('planeStatusCommand', () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), 'plane-status-'));
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns 0 for help flag', async () => {
    const code = await planeStatusCommand(['--help']);
    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('plane-status');
    expect(output).toContain('--json');
  });

  it('outputs valid JSON with --json', async () => {
    const posPath = await writePositions(tmpDir, {
      'skill-a': makeSkill(0.5, 0.7),
      'skill-b': makeSkill(1.0, 0.3),
    });
    const chordsPath = await writeChords(tmpDir);

    const code = await planeStatusCommand(['--json'], {
      positionsPath: posPath,
      chordsPath,
    });

    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalled();

    const jsonStr = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(jsonStr);
    expect(parsed.totalSkills).toBe(2);
    expect(parsed.versineDistribution).toBeDefined();
    expect(parsed.avgExsecant).toBeGreaterThanOrEqual(0);
  });

  it('saves snapshot with --snapshot', async () => {
    const posPath = await writePositions(tmpDir, {
      'skill-a': makeSkill(0.5, 0.7),
    });
    const chordsPath = await writeChords(tmpDir);
    const snapshotPath = path.join(tmpDir, 'snapshot', 'metrics.json');

    const code = await planeStatusCommand(['--snapshot'], {
      positionsPath: posPath,
      chordsPath,
      snapshotPath,
    });

    expect(code).toBe(0);

    // Verify snapshot file was written
    const raw = await readFile(snapshotPath, 'utf-8');
    const snapshot = JSON.parse(raw);
    expect(snapshot.totalSkills).toBe(1);
    expect(typeof snapshot.timestamp).toBe('string');
  });

  it('renders detail for known skill', async () => {
    const posPath = await writePositions(tmpDir, {
      'test-skill': makeSkill(0.5, 0.8, 0.01),
    });
    const chordsPath = await writeChords(tmpDir);

    const code = await planeStatusCommand(['--detail', 'test-skill'], {
      positionsPath: posPath,
      chordsPath,
    });

    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('test-skill');
    expect(output).toContain('Position:');
    expect(output).toContain('Zone:');
  });

  it('returns 1 for unknown skill with --detail', async () => {
    const posPath = await writePositions(tmpDir, {});
    const chordsPath = await writeChords(tmpDir);

    const code = await planeStatusCommand(['--detail', 'nonexistent'], {
      positionsPath: posPath,
      chordsPath,
    });

    expect(code).toBe(1);
    expect(errorSpy).toHaveBeenCalled();
    const errOutput = errorSpy.mock.calls[0][0] as string;
    expect(errOutput).toContain('nonexistent');
  });

  it('renders dashboard with no flags', async () => {
    const posPath = await writePositions(tmpDir, {
      'skill-a': makeSkill(0.1, 0.9),
      'skill-b': makeSkill(0.8, 0.6),
    });
    const chordsPath = await writeChords(tmpDir);

    const code = await planeStatusCommand([], {
      positionsPath: posPath,
      chordsPath,
    });

    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('COMPLEX PLANE STATUS');
    expect(output).toContain('2 total');
  });
});
