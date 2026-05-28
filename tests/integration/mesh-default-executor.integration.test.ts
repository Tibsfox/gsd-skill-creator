/**
 * Verify ship — v1.49.854 (under #10438 verify-axis).
 *
 * The v1.49.843 mesh-family chip wired `createMeshWorktreeManager` through
 * the ProcessContext chokepoint using the DI-executor + tokenized-argv
 * shape codified at v847 as #10441. The wire is well-unit-tested via
 * `src/mesh/mesh-worktree.test.ts` (mocked GitExecutor), but per #10438
 * unit tests against mocks prove the wire's signature; integration tests
 * against real collaborators prove the wire's behavior.
 *
 * This test exercises the DEFAULT executor (the one created at
 * `createMeshWorktreeManager` line 145) against REAL git. It:
 *
 *   1. Creates a temp git repo via `execFileSync('git', ['init', ...])`.
 *   2. chdirs into the temp dir so the default executor's process.cwd-based
 *      execSync operates on the temp repo.
 *   3. Constructs a manager via `createMeshWorktreeManager()` (no injected
 *      executor → default path).
 *   4. Calls `createBranch` → `listMeshBranches` and asserts the real-git
 *      results.
 *
 * Also tests the security wire end-to-end: a restrictive ctx with an empty
 * allowList causes the default executor's `ensureProcessAllowed` to throw
 * `ProcessContextDenied` — proving the chokepoint propagates through the
 * DI-executor wrapper, not just through the unit tests.
 *
 * Closes the v843 mesh-family verify-overdue gap (10-ship-from-v843
 * threshold per #10438 hits at v853; v854 is one ship past — landing
 * within tolerance).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createMeshWorktreeManager } from '../../src/mesh/mesh-worktree.js';
import {
  CapturingProcessAuditSink,
  ProcessContextDenied,
  type ProcessContext,
} from '../../src/security/process-context.js';

describe('verify v843 mesh-family default executor against real git (v1.49.854)', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'mesh-verify-'));
    // Initialize a real git repo
    execFileSync('git', ['init', '-q', tempDir], { encoding: 'utf-8' });
    process.chdir(tempDir);
    // Configure local user identity so commits work without global config
    execFileSync('git', ['config', 'user.email', 'verify@mesh.test'], { cwd: tempDir });
    execFileSync('git', ['config', 'user.name', 'Mesh Verify'], { cwd: tempDir });
    // Create an initial commit so HEAD exists for `checkout -b ... HEAD`
    execFileSync('git', ['commit', '--allow-empty', '-q', '-m', 'init'], { cwd: tempDir });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('default executor creates a mesh branch via real git', () => {
    const manager = createMeshWorktreeManager(); // no injected executor → default
    const info = manager.createBranch('node1', 'task42');

    expect(info.branchName).toBe('mesh/node1/task42');
    expect(info.nodeId).toBe('node1');
    expect(info.taskId).toBe('task42');

    // Verify the branch actually exists in the real git repo
    const branches = execFileSync('git', ['branch', '--list', 'mesh/*'], {
      cwd: tempDir,
      encoding: 'utf-8',
    });
    expect(branches).toContain('mesh/node1/task42');
  });

  it('default executor lists real mesh branches', () => {
    // Create two branches via real git directly
    execFileSync('git', ['branch', 'mesh/alpha/work-1'], { cwd: tempDir });
    execFileSync('git', ['branch', 'mesh/beta/work-2'], { cwd: tempDir });

    const manager = createMeshWorktreeManager();
    const branches = manager.listMeshBranches();

    // Order may vary; collect names for set comparison
    const names = branches.map((b) => b.branchName).sort();
    expect(names).toEqual(['mesh/alpha/work-1', 'mesh/beta/work-2']);

    const alpha = branches.find((b) => b.branchName === 'mesh/alpha/work-1');
    expect(alpha?.nodeId).toBe('alpha');
    expect(alpha?.taskId).toBe('work-1');
  });

  it('default executor propagates ProcessContextDenied when ctx restricts git', () => {
    const sink = new CapturingProcessAuditSink();
    const restrictiveCtx: ProcessContext = { allowList: [], audit: sink };

    const manager = createMeshWorktreeManager(undefined, restrictiveCtx);

    expect(() => manager.createBranch('node1', 'task42')).toThrow(ProcessContextDenied);

    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]?.target).toBe('git');
    expect(sink.records[0]?.allowed).toBe(false);
    expect(sink.records[0]?.argv).toContain('checkout');
    expect(sink.records[0]?.argv).toContain('-b');

    // Verify the real git repo has NO mesh branch — the denial fired BEFORE
    // execSync invoked git.
    const branches = execFileSync('git', ['branch', '--list', 'mesh/*'], {
      cwd: tempDir,
      encoding: 'utf-8',
    });
    expect(branches).toBe('');
  });

  it('default executor allows git when ctx permits it (and records audit)', () => {
    const sink = new CapturingProcessAuditSink();
    const permissiveCtx: ProcessContext = { allowList: ['git'], audit: sink };

    const manager = createMeshWorktreeManager(undefined, permissiveCtx);
    const info = manager.createBranch('node2', 'task99');

    expect(info.branchName).toBe('mesh/node2/task99');
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]?.target).toBe('git');
    expect(sink.records[0]?.allowed).toBe(true);

    const branches = execFileSync('git', ['branch', '--list', 'mesh/*'], {
      cwd: tempDir,
      encoding: 'utf-8',
    });
    expect(branches).toContain('mesh/node2/task99');
  });
});
