/**
 * citations-presence — JP-032 / JP-033 / JP-040 presence tests (Wave 3 / phase 843).
 *
 * Asserts that the citation anchor files created in Wave 3 exist on disk
 * and reference the expected arXiv IDs.
 */

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

describe('JP-040 — .planning/missions/nasa/REFERENCES.md', () => {
  const filePath = resolve(REPO_ROOT, '.planning/missions/nasa/REFERENCES.md');

  it('file exists', () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it('contains arXiv:2512.09111 (SAGES) anchor', () => {
    const content = readFileSync(filePath, 'utf8');
    expect(content).toMatch(/2512\.09111/);
  });

  it('contains arXiv:2604.21024 (EEI formation flying) anchor', () => {
    const content = readFileSync(filePath, 'utf8');
    expect(content).toMatch(/2604\.21024/);
  });
});
