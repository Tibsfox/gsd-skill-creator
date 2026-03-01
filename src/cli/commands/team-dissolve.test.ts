import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { teamDissolveCommand } from './team-dissolve.js';
import { TeamStore } from '../../teams/team-store.js';
import { TeamLifecycleManager } from '../../teams/team-lifecycle.js';
import type { TeamConfig } from '../../types/team.js';

describe('teamDissolveCommand', () => {
  let tempDir: string;
  let teamsDir: string;
  let store: TeamStore;
  let manager: TeamLifecycleManager;
  let originalLog: typeof console.log;
  let originalError: typeof console.error;
  let logOutput: string[];
  let errorOutput: string[];

  function createValidConfig(overrides?: Partial<TeamConfig>): TeamConfig {
    return {
      name: 'test-team',
      leadAgentId: 'lead-1',
      createdAt: '2026-03-01T00:00:00Z',
      members: [{ agentId: 'lead-1', name: 'Lead' }],
      ...overrides,
    };
  }

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'team-dissolve-cmd-'));
    teamsDir = path.join(tempDir, 'teams');
    store = new TeamStore(teamsDir);
    manager = new TeamLifecycleManager(store, teamsDir);

    // Capture console output
    logOutput = [];
    errorOutput = [];
    originalLog = console.log;
    originalError = console.error;
    console.log = (...args: unknown[]) => logOutput.push(args.join(' '));
    console.error = (...args: unknown[]) => errorOutput.push(args.join(' '));

    // We need to mock getTeamsBasePath for the CLI command to use our temp dir
    // Instead, we'll pre-create a team and test the actual command behavior
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should print help and return 0 for --help flag', async () => {
    const exitCode = await teamDissolveCommand(['--help']);
    expect(exitCode).toBe(0);
    expect(logOutput.some((l) => l.includes('dissolve'))).toBe(true);
  });

  it('should print help and return 0 for -h flag', async () => {
    const exitCode = await teamDissolveCommand(['-h']);
    expect(exitCode).toBe(0);
    expect(logOutput.some((l) => l.includes('dissolve'))).toBe(true);
  });

  it('should return 1 with error when no team name provided', async () => {
    const exitCode = await teamDissolveCommand([]);
    expect(exitCode).toBe(1);
    expect(errorOutput.some((e) => e.includes('Team name is required'))).toBe(true);
  });

  it('should return 1 with error for nonexistent team', async () => {
    const exitCode = await teamDissolveCommand(['nonexistent']);
    expect(exitCode).toBe(1);
    expect(errorOutput.some((e) => e.includes('Error'))).toBe(true);
  });
});
