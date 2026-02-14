/**
 * TDD tests for tmux session detection and command building.
 *
 * All tests mock child_process.execSync -- no real tmux commands
 * are executed. Covers SESS-01 (auto-connect), SESS-02 (create new),
 * and SESS-03 (configurable session name).
 *
 * @module terminal/session.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TerminalConfigSchema } from '../integration/config/terminal-schema.js';

// ---------------------------------------------------------------------------
// Mock node:child_process
// ---------------------------------------------------------------------------

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'node:child_process';
import { listTmuxSessions, buildSessionCommand } from './session.js';

const mockExecSync = vi.mocked(execSync);

// ---------------------------------------------------------------------------
// listTmuxSessions -- parses tmux output
// ---------------------------------------------------------------------------

describe('listTmuxSessions -- parses tmux output', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns array of session names from multi-line tmux output', () => {
    mockExecSync.mockReturnValue('dev\nwork\ntest\n');

    const sessions = listTmuxSessions();

    expect(sessions).toEqual(['dev', 'work', 'test']);
  });

  it('returns single-element array for one session', () => {
    mockExecSync.mockReturnValue('dev\n');

    const sessions = listTmuxSessions();

    expect(sessions).toEqual(['dev']);
  });

  it('strips whitespace and empty lines from output', () => {
    mockExecSync.mockReturnValue('  dev  \n\n  work  \n\n');

    const sessions = listTmuxSessions();

    expect(sessions).toEqual(['dev', 'work']);
  });
});

// ---------------------------------------------------------------------------
// listTmuxSessions -- error handling
// ---------------------------------------------------------------------------

describe('listTmuxSessions -- error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when execSync throws (tmux not installed)', () => {
    const err = new Error('spawn tmux ENOENT') as NodeJS.ErrnoException;
    err.code = 'ENOENT';
    mockExecSync.mockImplementation(() => { throw err; });

    const sessions = listTmuxSessions();

    expect(sessions).toEqual([]);
  });

  it('returns empty array when execSync throws (no tmux server running)', () => {
    const err = new Error('no server running on /tmp/tmux-1000/default');
    (err as any).status = 1;
    mockExecSync.mockImplementation(() => { throw err; });

    const sessions = listTmuxSessions();

    expect(sessions).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildSessionCommand -- generates compound command
// ---------------------------------------------------------------------------

describe('buildSessionCommand -- generates compound command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns compound attach-or-new command for session name "dev"', () => {
    const cmd = buildSessionCommand('dev');

    expect(cmd).toBe('tmux attach -t dev || tmux new -s dev');
  });

  it('returns compound attach-or-new command for session name "work"', () => {
    const cmd = buildSessionCommand('work');

    expect(cmd).toBe('tmux attach -t work || tmux new -s work');
  });

  it('handles session names with hyphens and underscores', () => {
    const cmd = buildSessionCommand('my-project_v2');

    expect(cmd).toBe('tmux attach -t my-project_v2 || tmux new -s my-project_v2');
  });
});

// ---------------------------------------------------------------------------
// config extension -- session_name
// ---------------------------------------------------------------------------

describe('config extension -- session_name', () => {
  it('TerminalConfigSchema.parse({}) includes session_name: "dev"', () => {
    const config = TerminalConfigSchema.parse({});

    expect(config.session_name).toBe('dev');
  });

  it('TerminalConfigSchema.parse({ session_name: "work" }) uses provided name', () => {
    const config = TerminalConfigSchema.parse({ session_name: 'work' });

    expect(config.session_name).toBe('work');
  });
});
