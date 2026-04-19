/**
 * Sensoria CLI smoke + output-shape tests.
 */

import { describe, it, expect } from 'vitest';
import { sensoriaCommand } from '../cli.js';
import type { SkillStore } from '../../storage/skill-store.js';

function stubStore(frontmatter: Record<string, unknown> = {}): SkillStore {
  return {
    read: async () => ({ metadata: frontmatter, body: '', path: '' }),
  } as unknown as SkillStore;
}

describe('sensoriaCommand', () => {
  it('prints help on --help and exits 0', async () => {
    const lines: string[] = [];
    const code = await sensoriaCommand('--help', {}, { skillStore: stubStore(), logger: l => lines.push(l) });
    expect(code).toBe(0);
    expect(lines.join('\n')).toMatch(/skill-creator sensoria/);
  });

  it('exits 1 with help when no skill name supplied', async () => {
    const lines: string[] = [];
    const code = await sensoriaCommand(undefined, {}, { skillStore: stubStore(), logger: l => lines.push(l) });
    expect(code).toBe(1);
  });

  it('table format prints sweep rows', async () => {
    const lines: string[] = [];
    const code = await sensoriaCommand(
      'my-skill',
      { format: 'table', min: 0.01, max: 10, points: 5 },
      { skillStore: stubStore({ sensoria: { K_H: 10, K_L: 0.1, R_T_init: 1, theta: 0.01 } }), logger: l => lines.push(l) },
    );
    expect(code).toBe(0);
    expect(lines.some(l => l.includes('ΔR_H'))).toBe(true);
    expect(lines.some(l => l.includes('peak [L]'))).toBe(true);
  });

  it('json format produces parseable JSON with sweep array', async () => {
    const lines: string[] = [];
    await sensoriaCommand(
      'my-skill',
      { format: 'json', quiet: true, min: 0.1, max: 10, points: 3 },
      { skillStore: stubStore({ sensoria: { K_H: 10, K_L: 0.1, R_T_init: 1, theta: 0.01 } }), logger: l => lines.push(l) },
    );
    const joined = lines.join('\n');
    const parsed = JSON.parse(joined);
    expect(parsed.skill).toBe('my-skill');
    expect(Array.isArray(parsed.sweep)).toBe(true);
    expect(parsed.sweep.length).toBe(3);
  });

  it('tachyphylaxis mode shows 20-step trace and fade summary', async () => {
    const lines: string[] = [];
    await sensoriaCommand(
      'my-skill',
      { tachyphylaxis: true },
      { skillStore: stubStore({ sensoria: { K_H: 10, K_L: 0.1, R_T_init: 1, theta: 0.01 } }), logger: l => lines.push(l) },
    );
    const joined = lines.join('\n');
    expect(joined).toMatch(/20-step fade/);
    expect(joined).toMatch(/CF-M6-03/);
  });

  it('falls back to DEFAULT_SENSORIA when skill read fails', async () => {
    const lines: string[] = [];
    const failingStore = {
      read: async () => { throw new Error('missing'); },
    } as unknown as SkillStore;
    const code = await sensoriaCommand(
      'no-such-skill',
      { format: 'table', points: 3 },
      { skillStore: failingStore, logger: l => lines.push(l) },
    );
    expect(code).toBe(0);
    // Default K_H=5.0 should appear in the status lines
    expect(lines.some(l => l.includes('K_H=5'))).toBe(true);
  });

  it('reports source=default when frontmatter has no sensoria block', async () => {
    const lines: string[] = [];
    await sensoriaCommand(
      'plain-skill',
      { points: 3 },
      { skillStore: stubStore({}), logger: l => lines.push(l) },
    );
    expect(lines.some(l => l.includes('source: default'))).toBe(true);
  });
});
