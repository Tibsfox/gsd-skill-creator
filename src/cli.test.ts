import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { parseSkillsDir } from './cli.js';
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
