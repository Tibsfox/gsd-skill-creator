/**
 * Dedup tests — DD-01..DD-05.
 */

import { describe, expect, it } from 'vitest';
import { dedupCartridge } from '../dedup.js';
import type { Cartridge, DepartmentChipset } from '../types.js';

function makeDept(
  skillKeys: string[],
  agentNames: string[],
): DepartmentChipset {
  return {
    kind: 'department',
    skills: Object.fromEntries(
      skillKeys.map((k) => [k, { description: `${k} skill` }]),
    ),
    agents: {
      topology: 'router',
      router_agent: agentNames[0] ?? '',
      agents: agentNames.map((n) => ({ name: n, role: 'x' })),
    },
    teams: {},
  };
}

function cartridge(chipsets: Cartridge['chipsets']): Cartridge {
  return {
    id: 'test',
    name: 'test',
    version: '0.1.0',
    author: 'x',
    description: 'x',
    trust: 'user',
    provenance: { origin: 'x', createdAt: '1970-01-01T00:00:00Z' },
    chipsets,
  };
}

describe('dedupCartridge', () => {
  it('DD-01 reports no collisions on a unique cartridge', () => {
    const c = cartridge([makeDept(['a', 'b'], ['x', 'y'])]);
    const r = dedupCartridge(c);
    expect(r.collisions).toEqual([]);
    expect(r.skillCount).toBe(2);
    expect(r.agentCount).toBe(2);
  });

  it('DD-02 detects skill collisions across chipsets', () => {
    const c = cartridge([
      makeDept(['shared'], ['a']),
      makeDept(['shared'], ['b']),
    ]);
    const r = dedupCartridge(c);
    expect(r.collisions).toHaveLength(1);
    expect(r.collisions[0]?.kind).toBe('skill');
    expect(r.collisions[0]?.key).toBe('shared');
    expect(r.collisions[0]?.locations).toHaveLength(2);
  });

  it('DD-03 detects agent collisions across chipsets', () => {
    const c = cartridge([
      makeDept(['a'], ['shared-agent']),
      makeDept(['b'], ['shared-agent']),
    ]);
    const r = dedupCartridge(c);
    expect(r.collisions).toHaveLength(1);
    expect(r.collisions[0]?.kind).toBe('agent');
    expect(r.collisions[0]?.key).toBe('shared-agent');
  });

  it('DD-04 reports both skill and agent collisions sorted', () => {
    const c = cartridge([
      makeDept(['s1'], ['a1']),
      makeDept(['s1'], ['a1']),
    ]);
    const r = dedupCartridge(c);
    expect(r.collisions.map((c) => c.kind)).toEqual(['agent', 'skill']);
  });

  it('DD-05 ignores non-department chipsets', () => {
    const c = cartridge([
      { kind: 'grove', namespace: 'x', record_types: [] },
      { kind: 'evaluation', pre_deploy: [], benchmark: {
        trigger_accuracy_threshold: 0.85,
        test_cases_minimum: 25,
        domains_covered: ['x'],
      } },
    ]);
    const r = dedupCartridge(c);
    expect(r.collisions).toEqual([]);
    expect(r.skillCount).toBe(0);
    expect(r.agentCount).toBe(0);
    expect(r.graphicsSourceCount).toBe(0);
  });

  it('DD-06 flags duplicate shader source paths in a graphics chipset', () => {
    const c = cartridge([
      {
        kind: 'graphics',
        api: 'webgl2',
        api_version: '2.0',
        shader_language: 'glsl-es',
        shader_language_version: '3.00',
        shader_stages: ['vertex', 'fragment'],
        sources: [
          { stage: 'vertex', path: 'shaders/shared.glsl', entry_point: 'main' },
          { stage: 'fragment', path: 'shaders/shared.glsl', entry_point: 'main' },
        ],
      },
    ]);
    const r = dedupCartridge(c);
    expect(r.collisions).toHaveLength(1);
    expect(r.collisions[0]?.kind).toBe('graphics-source');
    expect(r.collisions[0]?.key).toBe('shaders/shared.glsl');
    expect(r.collisions[0]?.locations).toHaveLength(2);
    expect(r.graphicsSourceCount).toBe(1);
  });

  it('DD-07 unique shader paths report no collisions', () => {
    const c = cartridge([
      {
        kind: 'graphics',
        api: 'webgl2',
        api_version: '2.0',
        shader_language: 'glsl-es',
        shader_language_version: '3.00',
        shader_stages: ['vertex', 'fragment'],
        sources: [
          { stage: 'vertex', path: 'shaders/a.glsl', entry_point: 'main' },
          { stage: 'fragment', path: 'shaders/b.glsl', entry_point: 'main' },
        ],
      },
    ]);
    const r = dedupCartridge(c);
    expect(r.collisions).toEqual([]);
    expect(r.graphicsSourceCount).toBe(2);
  });
});
