import { describe, it, expect } from 'vitest';
import { resolve, join } from 'node:path';
import { existsSync, mkdtempSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { parseSkillsDir, parseStringFlag } from './cli.js';
import { getSkillsBasePath } from './types/scope.js';

describe('parseSkillsDir', () => {
  it('resolves --skills-dir <path> relative to cwd (separated form)', () => {
    const args = ['critique', 'foo', '--skills-dir', 'examples/skills/coding'];
    expect(parseSkillsDir(args, 'project')).toBe(
      resolve(process.cwd(), 'examples/skills/coding'),
    );
  });

  it('resolves --skills-dir=<path> relative to cwd (equals form)', () => {
    const args = ['critique', 'foo', '--skills-dir=examples/skills/coding'];
    expect(parseSkillsDir(args, 'project')).toBe(
      resolve(process.cwd(), 'examples/skills/coding'),
    );
  });

  it('preserves an absolute --skills-dir path', () => {
    const args = ['critique', 'foo', '--skills-dir', '/abs/path'];
    expect(parseSkillsDir(args, 'user')).toBe('/abs/path');
  });

  it('falls back to user scope default when --skills-dir is absent', () => {
    const args = ['critique', 'foo'];
    expect(parseSkillsDir(args, 'user')).toBe(getSkillsBasePath('user'));
  });

  it('falls back to project scope default when --skills-dir is absent', () => {
    const args = ['critique', 'foo'];
    expect(parseSkillsDir(args, 'project')).toBe(getSkillsBasePath('project'));
  });

  it('does not mutate the incoming args array', () => {
    const args = ['critique', 'foo', '--skills-dir', 'x'];
    const snapshot = [...args];
    parseSkillsDir(args, 'user');
    expect(args).toEqual(snapshot);
    expect(args.length).toBe(snapshot.length);
  });
});

describe('parseStringFlag', () => {
  it('returns the value for --name <value> (separated form)', () => {
    const args = ['publish', 'foo', '--override-critique', 'smoke test'];
    expect(parseStringFlag(args, '--override-critique')).toBe('smoke test');
  });

  it('returns the value for --name=<value> (equals form)', () => {
    const args = ['publish', 'foo', '--override-critique=ship it'];
    expect(parseStringFlag(args, '--override-critique')).toBe('ship it');
  });

  it('returns undefined when the flag is absent', () => {
    const args = ['publish', 'foo'];
    expect(parseStringFlag(args, '--override-critique')).toBeUndefined();
  });

  it('returns undefined when the next token is another flag', () => {
    const args = ['publish', 'foo', '--override-critique', '--skills-dir'];
    expect(parseStringFlag(args, '--override-critique')).toBeUndefined();
  });

  it('returns undefined when the equals form has an empty value', () => {
    const args = ['publish', 'foo', '--override-critique='];
    expect(parseStringFlag(args, '--override-critique')).toBeUndefined();
  });

  it('does not mutate the incoming args array', () => {
    const args = ['publish', 'foo', '--override-critique', 'a'];
    const snapshot = [...args];
    parseStringFlag(args, '--override-critique');
    expect(args).toEqual(snapshot);
    expect(args.length).toBe(snapshot.length);
  });
});

// Regression guard: the global-install path is `node <symlink>`, and
// `process.argv[1]` is the symlink — not its realpath. A naive
// `pathResolve(argv[1]) === fileURLToPath(import.meta.url)` guard fails for
// that case and main() never fires, leaving every flag silent. Spawning
// through a temp symlink reproduces the npm-global invocation faithfully.
describe('cli entrypoint guard (symlink-aware)', () => {
  const DIST_CLI = resolve(process.cwd(), 'dist/cli.js');
  const NODE = process.execPath;
  const distAvailable = existsSync(DIST_CLI);
  const maybeIt = distAvailable ? it : it.skip;

  maybeIt('runs --version when invoked through a symlink', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'sc-symlink-'));
    const link = join(tmp, 'skill-creator');
    symlinkSync(DIST_CLI, link);
    try {
      const result = spawnSync(NODE, [link, '--version'], {
        encoding: 'utf-8',
        timeout: 15000,
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/skill-creator/);
      expect(result.stdout).toMatch(/v\d+\.\d+\.\d+/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  maybeIt('runs --help when invoked through a symlink', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'sc-symlink-'));
    const link = join(tmp, 'skill-creator');
    symlinkSync(DIST_CLI, link);
    try {
      const result = spawnSync(NODE, [link, '--help'], {
        encoding: 'utf-8',
        timeout: 15000,
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/Usage:/);
      expect(result.stdout).toMatch(/Commands:/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
