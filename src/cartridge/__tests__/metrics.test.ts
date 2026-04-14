/**
 * Metrics tests — MT-01..MT-04.
 */

import { describe, expect, it } from 'vitest';
import { collectMetrics } from '../metrics.js';
import type { Cartridge } from '../types.js';

const base: Cartridge = {
  id: 'metric-test',
  name: 'Metric Test',
  version: '0.1.0',
  author: 'x',
  description: 'x',
  trust: 'user',
  provenance: { origin: 'x', createdAt: '1970-01-01T00:00:00Z' },
  chipsets: [
    {
      kind: 'department',
      skills: {
        s1: { description: 's1' },
        s2: { description: 's2' },
      },
      agents: {
        topology: 'router',
        router_agent: 'a1',
        agents: [
          { name: 'a1', role: 'lead' },
          { name: 'a2', role: 'support' },
        ],
      },
      teams: {
        t1: { description: 't1', agents: ['a1'] },
      },
    },
    {
      kind: 'grove',
      namespace: 'metric-test',
      record_types: [
        { name: 'R1', description: 'r1' },
        { name: 'R2', description: 'r2' },
        { name: 'R3', description: 'r3' },
      ],
    },
  ],
};

describe('collectMetrics', () => {
  it('MT-01 counts skills, agents, teams, and record types', () => {
    const m = collectMetrics(base);
    expect(m.skillCount).toBe(2);
    expect(m.agentCount).toBe(2);
    expect(m.teamCount).toBe(1);
    expect(m.groveRecordTypeCount).toBe(3);
    expect(m.chipsetCount).toBe(2);
    expect(m.chipsetKinds).toEqual(['department', 'grove']);
  });

  it('MT-02 flags presence of metrics and evaluation chipsets', () => {
    const m = collectMetrics(base);
    expect(m.hasMetricsChipset).toBe(false);
    expect(m.hasEvaluationChipset).toBe(false);
    expect(m.benchmarkCaseMinimum).toBeNull();
  });

  it('MT-03 reports the minimum benchmark case count when metrics chipset present', () => {
    const c: Cartridge = {
      ...base,
      chipsets: [
        ...base.chipsets,
        {
          kind: 'metrics',
          activation_tracking: {
            triggers: true,
            skill_loads: true,
            agent_routes: true,
            team_uses: true,
          },
          benchmarks: [
            {
              trigger_accuracy_threshold: 0.85,
              test_cases_minimum: 50,
              domains_covered: ['a'],
            },
            {
              trigger_accuracy_threshold: 0.9,
              test_cases_minimum: 25,
              domains_covered: ['b'],
            },
          ],
          telemetry_sinks: ['jsonl'],
        },
      ],
    };
    const m = collectMetrics(c);
    expect(m.hasMetricsChipset).toBe(true);
    expect(m.benchmarkCaseMinimum).toBe(25);
  });

  it('MT-04 handles empty department chipsets', () => {
    const c: Cartridge = {
      ...base,
      chipsets: [
        {
          kind: 'grove',
          namespace: 'x',
          record_types: [],
        },
      ],
    };
    const m = collectMetrics(c);
    expect(m.skillCount).toBe(0);
    expect(m.agentCount).toBe(0);
    expect(m.teamCount).toBe(0);
    expect(m.groveRecordTypeCount).toBe(0);
  });
});
