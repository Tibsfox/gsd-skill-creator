import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { logOperation } from '../../../../src/git/core/logger.js';
import type { GitStateReport, GitOperationLog } from '../../../../src/git/types.js';

// --- Helpers ---

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-git-log-'));
  tempDirs.push(dir);
  return dir;
}

function makeStateReport(overrides: Partial<GitStateReport> = {}): GitStateReport {
  return {
    state: 'CLEAN',
    branch: 'dev',
    remotes: [],
    ahead: 0,
    behind: 0,
    staged: [],
    unstaged: [],
    untracked: [],
    ...overrides,
  };
}

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
  tempDirs.length = 0;
});

// --- Tests ---

describe('logOperation', () => {
  it('appends JSONL lines — two calls produce two lines', async () => {
    const dir = createTempDir();
    const before = makeStateReport({ state: 'DIRTY' });
    const after = makeStateReport({ state: 'CLEAN' });

    await logOperation(dir, 'sync', ['git fetch', 'git rebase'], before, after, true);
    await logOperation(dir, 'commit', ['git commit'], after, after, true);

    const content = fs.readFileSync(path.join(dir, 'operations.jsonl'), 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(2);

    const entry1 = JSON.parse(lines[0]) as GitOperationLog;
    expect(entry1.operation).toBe('sync');

    const entry2 = JSON.parse(lines[1]) as GitOperationLog;
    expect(entry2.operation).toBe('commit');
  });

  it('creates operations.jsonl if it does not exist', async () => {
    const dir = createTempDir();
    const logFile = path.join(dir, 'operations.jsonl');
    expect(fs.existsSync(logFile)).toBe(false);

    await logOperation(
      dir,
      'install',
      ['git clone'],
      makeStateReport(),
      makeStateReport(),
      true,
    );

    expect(fs.existsSync(logFile)).toBe(true);
  });

  it('log entry has correct fields', async () => {
    const dir = createTempDir();
    const before = makeStateReport({ state: 'DIRTY', unstaged: ['file.ts'] });
    const after = makeStateReport({ state: 'CLEAN' });

    await logOperation(dir, 'commit', ['git add .', 'git commit -m "fix"'], before, after, true);

    const content = fs.readFileSync(path.join(dir, 'operations.jsonl'), 'utf-8');
    const entry = JSON.parse(content.trim()) as GitOperationLog;

    // Timestamp is ISO string
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(entry.operation).toBe('commit');
    expect(entry.commands).toEqual(['git add .', 'git commit -m "fix"']);
    expect(entry.stateBefore.state).toBe('DIRTY');
    expect(entry.stateAfter.state).toBe('CLEAN');
    expect(typeof entry.success).toBe('boolean');
    expect(entry.success).toBe(true);
  });

  it('error field present on failure', async () => {
    const dir = createTempDir();
    const state = makeStateReport({ state: 'CONFLICT' });

    await logOperation(
      dir,
      'merge',
      ['git merge feature'],
      state,
      state,
      false,
      'merge conflict',
    );

    const content = fs.readFileSync(path.join(dir, 'operations.jsonl'), 'utf-8');
    const entry = JSON.parse(content.trim()) as GitOperationLog;

    expect(entry.success).toBe(false);
    expect(entry.error).toBe('merge conflict');
  });

  it('creates parent directory if configDir does not exist', async () => {
    const parentDir = createTempDir();
    const nestedDir = path.join(parentDir, 'nested', 'config');

    await logOperation(
      nestedDir,
      'test',
      ['git status'],
      makeStateReport(),
      makeStateReport(),
      true,
    );

    expect(fs.existsSync(path.join(nestedDir, 'operations.jsonl'))).toBe(true);
  });
});
