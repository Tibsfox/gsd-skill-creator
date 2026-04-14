/**
 * Evaluation normalizer tests — W3.T0.
 *
 * Three assertions per the wave plan:
 *   1. positive — legacy gates.pre_deploy flattens and metadata.gateDetails
 *      preserves the full gate objects.
 *   2. round-trip deep-equal — every original gate object appears verbatim
 *      in metadata.gateDetails.
 *   3. negative — clear error naming file + gate index when a gate lacks
 *      a non-empty `check` field.
 */

import { describe, expect, it } from 'vitest';
import { normalizeEvaluationChipset } from '../normalizers/evaluation.js';

describe('normalizeEvaluationChipset (W3.T0)', () => {
  it('flattens legacy gates.pre_deploy to top-level pre_deploy', () => {
    const legacy = {
      kind: 'evaluation',
      gates: {
        pre_deploy: [
          {
            check: 'all_skills_have_descriptions',
            description: 'Every skill must have a non-empty description',
            action: 'block',
          },
          {
            check: 'all_agents_have_roles',
            description: 'Every agent must have a non-empty role',
            action: 'block',
          },
        ],
      },
      benchmark: {
        trigger_accuracy_threshold: 0.85,
        test_cases_minimum: 30,
        domains_covered: ['proof', 'algebra'],
      },
    };

    const normalized = normalizeEvaluationChipset(legacy);

    expect(normalized.pre_deploy).toEqual([
      'all_skills_have_descriptions',
      'all_agents_have_roles',
    ]);
    expect(normalized.kind).toBe('evaluation');
    expect(normalized.benchmark).toEqual(legacy.benchmark);
    const meta = normalized.metadata as Record<string, unknown>;
    expect(meta.gateLegacy).toBe(true);
    expect(meta.gateDetails).toEqual(legacy.gates.pre_deploy);
  });

  it('is a no-op when pre_deploy is already a flat array of strings', () => {
    const flat = {
      kind: 'evaluation',
      pre_deploy: ['gate_a', 'gate_b'],
      benchmark: {
        trigger_accuracy_threshold: 0.85,
        test_cases_minimum: 10,
        domains_covered: ['x'],
      },
    };
    const out = normalizeEvaluationChipset(flat);
    expect(out).toBe(flat);
  });

  it('round-trip deep-equals the original gate objects', () => {
    const originalGates = [
      { check: 'g1', description: 'd1', action: 'block', extra: 1 },
      { check: 'g2', description: 'd2', action: 'warn' },
      { check: 'g3', description: 'd3', action: 'block', custom: { nested: true } },
    ];
    const legacy = {
      kind: 'evaluation',
      gates: { pre_deploy: originalGates },
      benchmark: {
        trigger_accuracy_threshold: 0.9,
        test_cases_minimum: 5,
        domains_covered: ['a'],
      },
    };
    const normalized = normalizeEvaluationChipset(legacy);
    const meta = normalized.metadata as Record<string, unknown>;
    expect(meta.gateDetails).toEqual(originalGates);
  });

  it('errors with file hint + gate index when check is missing', () => {
    const broken = {
      kind: 'evaluation',
      gates: {
        pre_deploy: [
          { check: 'ok_gate', description: 'good', action: 'block' },
          { description: 'no check field', action: 'block' },
        ],
      },
    };

    expect(() =>
      normalizeEvaluationChipset(broken, {
        sourceFile: '/tmp/broken.yaml',
      }),
    ).toThrow(/gates\.pre_deploy\[1\].*\/tmp\/broken\.yaml/);
  });
});
