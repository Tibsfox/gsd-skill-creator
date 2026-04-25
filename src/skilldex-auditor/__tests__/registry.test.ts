/**
 * registry test suite.
 *
 * The registry is read-only relative to the skill library: tests use a
 * throwaway tmp directory rather than poking at the real `.claude/skills/`
 * tree.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { findInRegistry, listRegistry } from '../registry.js';

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-registry-'));
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

function writeSkill(name: string, content: string): void {
  const dir = path.join(tmpRoot, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), content);
}

describe('listRegistry', () => {
  it('returns empty array when directory does not exist', () => {
    expect(listRegistry(path.join(tmpRoot, 'nope'))).toEqual([]);
  });

  it('enumerates SKILL.md files one level deep, sorted by name', () => {
    writeSkill(
      'beta',
      '---\nname: beta-skill\ndescription: B\nversion: 0.2\n---\n# B\n',
    );
    writeSkill(
      'alpha',
      '---\nname: alpha-skill\ndescription: A\n---\n# A\n',
    );
    const entries = listRegistry(tmpRoot);
    expect(entries.map((e) => e.name)).toEqual(['alpha-skill', 'beta-skill']);
    expect(entries[0]?.description).toBe('A');
    expect(entries[1]?.version).toBe('0.2');
  });

  it('falls back to directory name when frontmatter name is missing', () => {
    writeSkill('orphan', '# no frontmatter at all\n');
    const entries = listRegistry(tmpRoot);
    expect(entries.length).toBe(1);
    expect(entries[0]?.name).toBe('orphan');
  });

  it('does not write to skill library on listing', () => {
    writeSkill(
      'alpha',
      '---\nname: alpha-skill\ndescription: A\n---\n# A\n',
    );
    const skillFile = path.join(tmpRoot, 'alpha', 'SKILL.md');
    const before = fs.statSync(skillFile);
    listRegistry(tmpRoot);
    const after = fs.statSync(skillFile);
    expect(after.mtimeMs).toBe(before.mtimeMs);
    expect(after.size).toBe(before.size);
  });
});

describe('findInRegistry', () => {
  it('returns the matching entry by name', () => {
    writeSkill(
      'alpha',
      '---\nname: alpha-skill\ndescription: A\n---\n# A\n',
    );
    const entry = findInRegistry(tmpRoot, 'alpha-skill');
    expect(entry?.name).toBe('alpha-skill');
  });

  it('returns undefined on miss', () => {
    expect(findInRegistry(tmpRoot, 'nope')).toBeUndefined();
  });
});
