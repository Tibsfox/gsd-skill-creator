import { describe, it, expect } from 'vitest';
import {
  resolveRevertsFromGit,
  parseCommitLog,
  parseRevertReference,
  REVERT_LOG_FORMAT,
  type GitExec,
} from './revert-resolver.js';

const FIELD = '\x1f';
const RECORD = '\x1e';

/** Assemble raw `git log` output in the module's own record format. */
function log(
  commits: { hash: string; subject: string; body: string }[],
): string {
  return commits
    .map((c) => `${c.hash}${FIELD}${c.subject}${FIELD}${c.body}${RECORD}`)
    .join('\n');
}

/**
 * Build a fake GitExec dispatching on command shape:
 *  - `git log ...`                -> canned log
 *  - `git show --name-only ... H` -> files[H]
 *  - `git show "REV:FILE"`        -> blobs[`${REV}:${FILE}`] (throws if absent)
 */
function fakeGit(opts: {
  logOut: string;
  files: Record<string, string[]>;
  blobs: Record<string, string>;
  onLogThrow?: boolean;
}): { git: GitExec; calls: string[] } {
  const calls: string[] = [];
  const git: GitExec = async (command: string) => {
    calls.push(command);
    if (command.startsWith('git log')) {
      if (opts.onLogThrow) throw new Error('not a git repository');
      return opts.logOut;
    }
    if (command.startsWith('git show --name-only')) {
      const hash = command.split(/\s+/).pop()!;
      return (opts.files[hash] ?? []).join('\n') + '\n';
    }
    const m = command.match(/^git show "(.+)"$/);
    if (m) {
      const key = m[1];
      if (key in opts.blobs) return opts.blobs[key];
      throw new Error(`path does not exist: ${key}`);
    }
    throw new Error(`unexpected command: ${command}`);
  };
  return { git, calls };
}

describe('parseRevertReference', () => {
  it('extracts the reverted commit hash from a standard revert body', () => {
    const body = 'This reverts commit abc1234def5678.';
    expect(parseRevertReference(body)).toBe('abc1234def5678');
  });

  it('returns null for a non-revert body', () => {
    expect(parseRevertReference('feat: add a thing\n\nbody text')).toBeNull();
  });

  it('is case-insensitive and tolerates surrounding text', () => {
    const body = 'Revert of the bad change.\n\nthis reverts commit DEADBEEF.\n';
    expect(parseRevertReference(body)).toBe('DEADBEEF');
  });
});

describe('parseCommitLog', () => {
  it('parses hash/subject/body records split on the format separators', () => {
    const raw = log([
      { hash: 'h1', subject: 'Revert "x"', body: 'This reverts commit deadbee.' },
      { hash: 'h2', subject: 'feat: y', body: 'plain body\nwith newline' },
    ]);
    const recs = parseCommitLog(raw);
    expect(recs).toHaveLength(2);
    expect(recs[0]).toEqual({
      hash: 'h1',
      subject: 'Revert "x"',
      body: 'This reverts commit deadbee.',
    });
    expect(recs[1].body).toBe('plain body\nwith newline');
  });

  it('returns [] on empty output', () => {
    expect(parseCommitLog('')).toEqual([]);
    expect(parseCommitLog('   \n ')).toEqual([]);
  });
});

describe('resolveRevertsFromGit', () => {
  it('emits a RevertedCommitSignal per file the revert restored', async () => {
    const logOut = log([
      {
        hash: 'revert01',
        subject: 'Revert "feat: bad change"',
        body: 'This reverts commit abc1234.',
      },
      { hash: 'other22', subject: 'chore: unrelated', body: 'nothing' },
    ]);
    const { git, calls } = fakeGit({
      logOut,
      files: { revert01: ['src/foo.ts'] },
      blobs: {
        'abc1234:src/foo.ts': 'const x = wrong();\n',
        'revert01:src/foo.ts': 'const x = right();\n',
      },
    });

    const signals = await resolveRevertsFromGit(git);

    expect(signals).toHaveLength(1);
    expect(signals[0]).toEqual({
      filePath: 'src/foo.ts',
      original: 'const x = wrong();\n',
      corrected: 'const x = right();\n',
      revertedCommitHash: 'abc1234',
      revertCommitHash: 'revert01',
      revertMessage: 'Revert "feat: bad change"',
    });
    // Uses the module's own log format (ASCII placeholders, no literal bytes).
    expect(calls[0]).toContain(REVERT_LOG_FORMAT);
  });

  it('skips files whose content is unchanged across the revert', async () => {
    const logOut = log([
      {
        hash: 'rev1',
        subject: 'Revert "noop"',
        body: 'This reverts commit deadbee.',
      },
    ]);
    const { git } = fakeGit({
      logOut,
      files: { rev1: ['a.ts', 'b.ts'] },
      blobs: {
        'deadbee:a.ts': 'same\n',
        'rev1:a.ts': 'same\n', // unchanged -> dropped
        'deadbee:b.ts': 'before\n',
        'rev1:b.ts': 'after\n',
      },
    });

    const signals = await resolveRevertsFromGit(git);
    expect(signals.map((s) => s.filePath)).toEqual(['b.ts']);
  });

  it('treats a missing blob at either revision as empty content', async () => {
    const logOut = log([
      { hash: 'rev1', subject: 'Revert "add"', body: 'This reverts commit deadbee.' },
    ]);
    const { git } = fakeGit({
      logOut,
      files: { rev1: ['added.ts'] },
      // m1 introduced the file; the revert removed it -> corrected blob absent.
      blobs: { 'deadbee:added.ts': 'introduced\n' },
    });

    const signals = await resolveRevertsFromGit(git);
    expect(signals).toHaveLength(1);
    expect(signals[0].original).toBe('introduced\n');
    expect(signals[0].corrected).toBe('');
  });

  it('ignores commits that are not reverts', async () => {
    const logOut = log([
      { hash: 'c1', subject: 'feat: a', body: 'no revert here' },
      { hash: 'c2', subject: 'fix: b', body: 'still nothing' },
    ]);
    const { git } = fakeGit({ logOut, files: {}, blobs: {} });
    expect(await resolveRevertsFromGit(git)).toEqual([]);
  });

  it('degrades to [] when git log fails (e.g. not a repository)', async () => {
    const { git } = fakeGit({ logOut: '', files: {}, blobs: {}, onLogThrow: true });
    expect(await resolveRevertsFromGit(git)).toEqual([]);
  });

  it('honours the maxCommits option in the log command', async () => {
    const { git, calls } = fakeGit({ logOut: '', files: {}, blobs: {} });
    await resolveRevertsFromGit(git, { maxCommits: 7 });
    expect(calls[0]).toContain('-n 7');
  });
});
