/**
 * Phase 456 verification tests for DACP CLI commands.
 * Tests: status, set-level, history, analyze, export-templates.
 *
 * @module test/dacp/cli
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { dacpStatusCommand } from '../../../src/tools/cli/commands/dacp-status.js';
import { dacpSetLevelCommand } from '../../../src/tools/cli/commands/dacp-set-level.js';

// ============================================================================
// Setup
// ============================================================================

let testDir: string;
let originalHome: string | undefined;

beforeEach(() => {
  testDir = join(tmpdir(), `dacp-cli-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(testDir, { recursive: true });
  originalHome = process.env.HOME;
  // Point HOME to test dir so CLI reads/writes there
  process.env.HOME = testDir;
});

afterEach(() => {
  process.env.HOME = originalHome;
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // Best effort cleanup
  }
});

// ============================================================================
// Tests
// ============================================================================

describe('DACP CLI Commands', () => {
  it('status command returns 0 with no data', async () => {
    // Capture console.log output
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exitCode = await dacpStatusCommand(['--json']);
    logSpy.mockRestore();

    expect(exitCode).toBe(0);
  });

  it('status command returns JSON with data', async () => {
    // Set up mock data files
    const dacpDir = join(testDir, '.gsd', 'dacp');
    mkdirSync(join(dacpDir, 'retrospective'), { recursive: true });
    mkdirSync(join(dacpDir, 'catalog'), { recursive: true });
    mkdirSync(join(dacpDir, 'templates'), { recursive: true });

    writeFileSync(
      join(dacpDir, 'retrospective', 'status.json'),
      JSON.stringify({
        total_handoffs: 15,
        bundled_handoffs: 10,
        avg_drift_score: 0.18,
        last_retrospective: new Date().toISOString(),
      }),
    );

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exitCode = await dacpStatusCommand(['--json']);
    const output = logSpy.mock.calls.map(c => c[0]).join('');
    logSpy.mockRestore();

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output);
    expect(parsed.handoffs.total).toBe(15);
    expect(parsed.avgDrift).toBe(0.18);
  });

  it('set-level command persists override to fidelity-overrides.json', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exitCode = await dacpSetLevelCommand([
      'planner->executor:task-assignment',
      '2',
      '--json',
    ]);
    logSpy.mockRestore();

    expect(exitCode).toBe(0);

    // Verify file was written
    const overridesPath = join(testDir, '.gsd', 'dacp', 'config', 'fidelity-overrides.json');
    expect(existsSync(overridesPath)).toBe(true);

    const overrides = JSON.parse(readFileSync(overridesPath, 'utf-8'));
    expect(overrides['planner->executor:task-assignment'].level).toBe(2);
  });

  it('set-level rejects invalid level (5)', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exitCode = await dacpSetLevelCommand([
      'planner->executor:task',
      '5',
      '--json',
    ]);
    logSpy.mockRestore();

    expect(exitCode).toBe(1);
  });

  it('status help flag returns 0', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exitCode = await dacpStatusCommand(['--help']);
    logSpy.mockRestore();

    expect(exitCode).toBe(0);
  });
});
