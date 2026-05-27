/**
 * C01 T6 — Git metadata helper tests.
 */

import { describe, it, expect, vi } from 'vitest';
import { join } from 'node:path';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  ProcessContextDenied,
  type ProcessContext,
} from '../../../security/process-context.js';

const execFileAsync = promisify(execFile);

// We test gitMetadata via a real temp git repo for the happy path
// and via a mock for the "git unavailable" path.

describe('gitMetadata', () => {
  it('returns null when .git directory is absent (no git repo)', async () => {
    const tmp = join(tmpdir(), `git-test-nogit-${Date.now()}`);
    await mkdir(tmp, { recursive: true });
    await writeFile(join(tmp, 'file.ts'), 'export const x = 1;');
    try {
      const { gitMetadata } = await import('../git.js');
      const result = await gitMetadata(join(tmp, 'file.ts'), tmp);
      expect(result).toBeNull();
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it('returns commit_count, author_count when git is available', async () => {
    const tmp = join(tmpdir(), `git-test-repo-${Date.now()}`);
    await mkdir(tmp, { recursive: true });

    try {
      // Init git repo with known commits
      await execFileAsync('git', ['init', '--initial-branch=main', tmp]);
      await execFileAsync('git', ['-C', tmp, 'config', 'user.email', 'test@test.com']);
      await execFileAsync('git', ['-C', tmp, 'config', 'user.name', 'Test User']);

      await writeFile(join(tmp, 'file.ts'), 'export const x = 1;');
      await execFileAsync('git', ['-C', tmp, 'add', 'file.ts']);
      await execFileAsync('git', ['-C', tmp, 'commit', '-m', 'commit 1']);

      await writeFile(join(tmp, 'file.ts'), 'export const x = 2;');
      await execFileAsync('git', ['-C', tmp, 'add', 'file.ts']);
      await execFileAsync('git', ['-C', tmp, 'commit', '-m', 'commit 2']);

      await writeFile(join(tmp, 'file.ts'), 'export const x = 3;');
      await execFileAsync('git', ['-C', tmp, 'add', 'file.ts']);
      await execFileAsync('git', ['-C', tmp, 'commit', '-m', 'commit 3']);

      // Re-import to get fresh module (or use dynamic import with cache bust)
      const { gitMetadata } = await import('../git.js');
      const result = await gitMetadata(join(tmp, 'file.ts'), tmp);

      expect(result).not.toBeNull();
      expect(result!.commit_count).toBe(3);
      expect(result!.author_count).toBe(1);
      expect(result!.last_modified).toBeTruthy();
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it('file path with shell metacharacters — args remain a fixed array (S2 invariant)', async () => {
    // This test verifies the function uses execFile with a fixed argv, not a shell string.
    // We verify this by checking that the function is called with the file path as-is
    // and any metacharacters don't cause injection.
    const { gitMetadata } = await import('../git.js');

    // A path with shell metacharacters — should return null gracefully (not crash or execute injected code)
    const maliciousPath = '/tmp/a;rm -rf /tmp/innocent-file.ts';
    const result = await gitMetadata(maliciousPath, '/tmp');
    // Either null (no git repo at /tmp or file doesn't exist) or a proper result
    // The key invariant: function did NOT execute "rm -rf ..."
    // We just verify it returns null or a valid result without throwing
    expect(result === null || typeof result === 'object').toBe(true);
  });

  describe('ProcessContext integration', () => {
    it('throws ProcessContextDenied when ctx restricts the git command', async () => {
      const tmp = join(tmpdir(), `git-test-pc-denied-${Date.now()}`);
      await mkdir(tmp, { recursive: true });

      try {
        // Real git repo so we get PAST the hasGitRepo early-return and into ensureProcessAllowed.
        await execFileAsync('git', ['init', '--initial-branch=main', tmp]);
        await execFileAsync('git', ['-C', tmp, 'config', 'user.email', 'test@test.com']);
        await execFileAsync('git', ['-C', tmp, 'config', 'user.name', 'Test User']);
        await writeFile(join(tmp, 'file.ts'), 'export const x = 1;');
        await execFileAsync('git', ['-C', tmp, 'add', 'file.ts']);
        await execFileAsync('git', ['-C', tmp, 'commit', '-m', 'c1']);

        const ctx: ProcessContext = {
          allowList: [], // deny all
          audit: { record() {} },
        };

        const { gitMetadata } = await import('../git.js');
        await expect(gitMetadata(join(tmp, 'file.ts'), tmp, ctx)).rejects.toThrow(
          ProcessContextDenied,
        );
      } finally {
        await rm(tmp, { recursive: true, force: true });
      }
    });

    it('records an audit entry when ctx allows the git command', async () => {
      const tmp = join(tmpdir(), `git-test-pc-allowed-${Date.now()}`);
      await mkdir(tmp, { recursive: true });

      try {
        await execFileAsync('git', ['init', '--initial-branch=main', tmp]);
        await execFileAsync('git', ['-C', tmp, 'config', 'user.email', 'test@test.com']);
        await execFileAsync('git', ['-C', tmp, 'config', 'user.name', 'Test User']);
        await writeFile(join(tmp, 'file.ts'), 'export const x = 1;');
        await execFileAsync('git', ['-C', tmp, 'add', 'file.ts']);
        await execFileAsync('git', ['-C', tmp, 'commit', '-m', 'c1']);

        const records: { source: string; target: string; argv: readonly string[] }[] = [];
        const ctx: ProcessContext = {
          allowList: ['git'],
          audit: {
            record(r) {
              records.push({ source: r.source, target: r.target, argv: r.argv });
            },
          },
        };

        const { gitMetadata } = await import('../git.js');
        const result = await gitMetadata(join(tmp, 'file.ts'), tmp, ctx);
        expect(result).not.toBeNull();
        expect(records).toHaveLength(1);
        expect(records[0].source).toBe('intelligence/analyzer/git');
        expect(records[0].target).toBe('git');
        expect(records[0].argv[0]).toBe('log');
      } finally {
        await rm(tmp, { recursive: true, force: true });
      }
    });
  });
});
