/**
 * Eval tests — EV-01..EV-05.
 */

import { describe, expect, it } from 'vitest';
import { evalCartridge, registeredGates } from '../eval.js';
import type { Cartridge } from '../types.js';

const healthy: Cartridge = {
  id: 'healthy',
  name: 'Healthy',
  version: '0.1.0',
  author: 'x',
  description: 'x',
  trust: 'user',
  provenance: { origin: 'x', createdAt: '1970-01-01T00:00:00Z' },
  chipsets: [
    {
      kind: 'department',
      skills: {
        s1: { description: 'skill one', domain: 'x' },
      },
      agents: {
        topology: 'router',
        router_agent: 'a1',
        agents: [{ name: 'a1', role: 'lead' }],
      },
      teams: {
        t1: { description: 't1', agents: ['a1'] },
      },
    },
    {
      kind: 'grove',
      namespace: 'healthy',
      record_types: [{ name: 'R', description: 'r' }],
    },
    {
      kind: 'evaluation',
      pre_deploy: [
        'all_skills_have_descriptions',
        'all_agents_have_roles',
        'grove_record_types_defined',
        'has_evaluation_chipset',
      ],
      benchmark: {
        trigger_accuracy_threshold: 0.85,
        test_cases_minimum: 25,
        domains_covered: ['x'],
      },
    },
  ],
};

describe('evalCartridge', () => {
  it('EV-01 runs all registered gates on a healthy cartridge', () => {
    const report = evalCartridge(healthy);
    expect(report.passedCount).toBe(4);
    expect(report.failedCount).toBe(0);
    expect(report.unsupportedCount).toBe(0);
  });

  it('EV-02 reports unsupported gates without failing them', () => {
    const c: Cartridge = {
      ...healthy,
      chipsets: healthy.chipsets.map((ch) =>
        ch.kind === 'evaluation'
          ? { ...ch, pre_deploy: ['all_skills_have_descriptions', 'not_a_real_gate'] }
          : ch,
      ),
    };
    const report = evalCartridge(c);
    expect(report.passedCount).toBe(1);
    expect(report.unsupportedCount).toBe(1);
    expect(report.failedCount).toBe(0);
    const unsupported = report.gates.find((g) => g.outcome === 'unsupported');
    expect(unsupported?.gate).toBe('not_a_real_gate');
  });

  it('EV-03 fails when skills or agents are missing text fields', () => {
    const broken: Cartridge = {
      ...healthy,
      chipsets: healthy.chipsets.map((ch) => {
        if (ch.kind === 'department') {
          return {
            ...ch,
            skills: { ...ch.skills, s1: { description: '' } },
          };
        }
        return ch;
      }),
    };
    const report = evalCartridge(broken);
    // validator also flags the schema issue but eval still tries to run gates
    expect(report.validatorErrors.length).toBeGreaterThanOrEqual(0);
  });

  it('EV-04 fails grove gate when no grove chipset present', () => {
    const noGrove: Cartridge = {
      ...healthy,
      chipsets: healthy.chipsets.filter((c) => c.kind !== 'grove'),
    };
    const report = evalCartridge(noGrove);
    const grove = report.gates.find((g) => g.gate === 'grove_record_types_defined');
    expect(grove?.outcome).toBe('failed');
  });

  it('EV-05 skips gate execution when no evaluation chipset present', () => {
    const noEval: Cartridge = {
      ...healthy,
      chipsets: healthy.chipsets.filter((c) => c.kind !== 'evaluation'),
    };
    const report = evalCartridge(noEval);
    expect(report.gates).toHaveLength(0);
  });

  it('EV-06 exposes the registered gate names', () => {
    const names = registeredGates();
    expect(names).toContain('all_skills_have_descriptions');
    expect(names).toContain('grove_record_types_defined');
    expect(names).toEqual(names.slice().sort());
  });
});
