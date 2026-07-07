// default-cartridge-benchmark.test.ts — enforces the trigger-accuracy benchmark
// that each of the four default cartridges declares in its evaluation chipset.
//
// Every default cartridge (get-shit-done, gsd-skill-creator, housekeeping,
// release-engine) ships an evaluation.yaml with a benchmark block
// (trigger_accuracy_threshold, test_cases_minimum, domains_covered) — but until
// now nothing ran it, so the declared 0.85 accuracy target measured nothing.
// This test closes that loop, following the rca-department pattern
// (src/chipset/rca-department.test.ts): it loads each cartridge's department
// chipset (skills + triggers), its evaluation benchmark thresholds, and a
// benchmark/test-cases.yaml corpus, then asserts trigger accuracy meets the
// declared threshold. If a cartridge's skills or triggers change, add or adjust
// the corpus — no counts are hardcoded here.

import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const CARTRIDGES = ['get-shit-done', 'gsd-skill-creator', 'housekeeping', 'release-engine'];
const ROOT = join(__dirname, '../../examples/cartridges');

interface Skill {
  triggers?: string[];
}
interface Dept {
  skills: Record<string, Skill>;
}
interface Benchmark {
  trigger_accuracy_threshold: number;
  test_cases_minimum: number;
}
interface TestCase {
  query: string;
  expected_skills: string[];
}

function load(cart: string) {
  const dept = parse(
    readFileSync(join(ROOT, cart, 'chipsets/department.yaml'), 'utf8'),
  ) as Dept;
  const evy = parse(
    readFileSync(join(ROOT, cart, 'chipsets/evaluation.yaml'), 'utf8'),
  ) as { benchmark?: Benchmark; evaluation?: { benchmark?: Benchmark } };
  const bench = evy.benchmark ?? evy.evaluation?.benchmark;
  const fxPath = join(ROOT, cart, 'benchmark/test-cases.yaml');
  const fixture = existsSync(fxPath)
    ? (parse(readFileSync(fxPath, 'utf8')) as { test_cases: TestCase[] })
    : { test_cases: [] as TestCase[] };
  return { dept, bench, fixture };
}

describe('default-cartridge trigger benchmarks', () => {
  for (const cart of CARTRIDGES) {
    describe(cart, () => {
      const { dept, bench, fixture } = load(cart);

      it('declares a benchmark in its evaluation chipset', () => {
        expect(bench, `${cart} evaluation.yaml has no benchmark block`).toBeDefined();
        expect(bench!.trigger_accuracy_threshold).toBeGreaterThan(0);
      });

      it('ships a non-empty benchmark/test-cases.yaml fixture', () => {
        expect(
          fixture.test_cases.length,
          `${cart} is missing benchmark/test-cases.yaml`,
        ).toBeGreaterThan(0);
      });

      it('fixture has at least test_cases_minimum cases', () => {
        expect(fixture.test_cases.length).toBeGreaterThanOrEqual(bench!.test_cases_minimum);
      });

      it('every expected skill in the fixture exists in the chipset', () => {
        for (const tc of fixture.test_cases) {
          for (const s of tc.expected_skills) {
            expect(dept.skills[s], `${cart}: expected skill '${s}' not in chipset`).toBeDefined();
          }
        }
      });

      it('trigger accuracy meets the declared threshold', () => {
        const matchSkill = (query: string): Set<string> => {
          const q = query.toLowerCase();
          const hits = new Set<string>();
          for (const [name, skill] of Object.entries(dept.skills)) {
            for (const trigger of skill.triggers ?? []) {
              if (q.includes(String(trigger).toLowerCase())) {
                hits.add(name);
                break;
              }
            }
          }
          return hits;
        };

        let correct = 0;
        const misses: string[] = [];
        for (const tc of fixture.test_cases) {
          const matched = matchSkill(tc.query);
          if (tc.expected_skills.some((s) => matched.has(s))) {
            correct++;
          } else {
            misses.push(
              `"${tc.query}" → expected ${tc.expected_skills.join(',')}, matched ${[...matched].join(',') || 'none'}`,
            );
          }
        }
        const accuracy = fixture.test_cases.length ? correct / fixture.test_cases.length : 0;
        expect(
          accuracy,
          `${cart} trigger accuracy ${accuracy.toFixed(3)} below threshold ${bench!.trigger_accuracy_threshold}\nMisses:\n  ${misses.join('\n  ')}`,
        ).toBeGreaterThanOrEqual(bench!.trigger_accuracy_threshold);
      });
    });
  }
});
