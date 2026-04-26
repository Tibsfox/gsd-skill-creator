/**
 * citations-presence — JP-032 / JP-033 / JP-040 presence tests.
 *
 * Asserts that the citation anchor files exist on disk and reference the
 * expected arXiv IDs. JP-040 was originally Wave 3 / phase 843 of the
 * v1.49.577 JULIA-PARAMETER mission; its presence assertion was relocated
 * from a gitignored `.planning/` path to the on-tree
 * `docs/research/nasa-citations.md` path in v1.49.578 (the `nasa` branch is
 * no longer active — all NASA-series work continues on dev/main).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const REPO_ROOT = resolve(__dirname, '../../../');

describe('JP-032 — skill-promotion/REFERENCES.md', () => {
  const filePath = resolve(REPO_ROOT, 'src/skill-promotion/REFERENCES.md');

  it('file exists', () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it('contains arXiv:2604.20897 anchor', () => {
    const content = readFileSync(filePath, 'utf8');
    expect(content).toMatch(/2604\.20897/);
  });
});

describe('JP-033 — dead-zone/CITATION.md', () => {
  const filePath = resolve(REPO_ROOT, 'src/dead-zone/CITATION.md');

  it('file exists', () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it('contains arXiv:2604.21101 anchor', () => {
    const content = readFileSync(filePath, 'utf8');
    expect(content).toMatch(/2604\.21101/);
  });
});

describe('JP-040 — docs/research/nasa-citations.md', () => {
  const filePath = resolve(REPO_ROOT, 'docs/research/nasa-citations.md');

  it('file exists on-tree', () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it('contains the SAGES anchor (arXiv:2512.09111)', () => {
    const content = readFileSync(filePath, 'utf8');
    expect(content).toMatch(/2512\.09111/);
  });

  it('contains the EEI Formation Flying anchor (arXiv:2604.21024)', () => {
    const content = readFileSync(filePath, 'utf8');
    expect(content).toMatch(/2604\.21024/);
  });

  it('is well-formed Markdown with an H1 title', () => {
    const content = readFileSync(filePath, 'utf8');
    expect(content).toMatch(/^# /m);
  });
});
