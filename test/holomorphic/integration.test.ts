import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const HOLOMORPHIC_ROOT = join(__dirname, '../../src/holomorphic');
const SKILL_PATH = join(HOLOMORPHIC_ROOT, 'skills/holomorphic-dynamics/SKILL.md');
const MODULE_ROOT = join(HOLOMORPHIC_ROOT, 'modules');

describe('Cross-Module Integration', () => {
  it('master barrel exports all expected function names', async () => {
    const barrel = await import('../../src/holomorphic/index');
    const expectedExports = [
      'add', 'sub', 'mul', 'div', 'magnitude',
      'computeOrbit', 'detectPeriod', 'classifyFixedPoint',
      'renderMandelbrot', 'renderJulia',
      'classifySkillDynamics', 'classifyFatouJulia',
      'dmd', 'classifyDMDEigenvalue',
      'edmd', 'bridgeDMDToSkillDynamics',
    ];
    for (const name of expectedExports) {
      expect(barrel).toHaveProperty(name);
    }
  });

  it('all 10 module content files exist', () => {
    for (let i = 1; i <= 10; i++) {
      const id = `HD-${String(i).padStart(2, '0')}`;
      const contentPath = join(MODULE_ROOT, id, 'content.md');
      expect(existsSync(contentPath), `${id}/content.md should exist`).toBe(true);
    }
  });

  it('SKILL.md exists', () => {
    expect(existsSync(SKILL_PATH), 'SKILL.md should exist').toBe(true);
  });

  it('SKILL.md has correct frontmatter', () => {
    const content = readFileSync(SKILL_PATH, 'utf-8');
    expect(content).toMatch(/^---/);
    expect(content).toMatch(/name:\s*holomorphic-dynamics/);
    expect(content).toMatch(/description:/);
    expect(content).toMatch(/user-invocable:\s*true/);
  });

  it('SKILL.md word count exceeds 1000', () => {
    const content = readFileSync(SKILL_PATH, 'utf-8');
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBeGreaterThan(1000);
  });

  it('try-sessions export runTrySession function', async () => {
    // Spot-check HD-01, HD-05, HD-09
    const hd01 = await import('../../src/holomorphic/modules/HD-01/try-session');
    expect(typeof hd01.runTrySession).toBe('function');
    const hd05 = await import('../../src/holomorphic/modules/HD-05/try-session');
    expect(typeof hd05.runTrySession).toBe('function');
    const hd09 = await import('../../src/holomorphic/modules/HD-09/try-session');
    expect(typeof hd09.runTrySession).toBe('function');
  });
});
