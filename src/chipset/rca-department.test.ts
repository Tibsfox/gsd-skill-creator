// rca-department.test.ts — implements the declarative gates from
// examples/chipsets/rca-department/chipset.yaml and runs the trigger
// benchmark from examples/chipsets/rca-department/benchmark/test-cases.yaml.
//
// Addresses the two "declarative only" gaps in the chipset:
//   1. evaluation.gates.pre_deploy → enforced as structural tests below
//   2. evaluation.benchmark        → enforced against the fixture
//
// If either file changes, this test adjusts automatically (no hardcoded
// counts beyond the brief's invariants: 6 / 5 / 3 / 5).

import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Skill {
  domain: string;
  description: string;
  triggers: string[];
  agent_affinity: string | string[];
}

interface Agent {
  name: string;
  role: string;
  model: string;
  tools: string[];
  is_capcom?: boolean;
}

interface Team {
  description: string;
  agents: string[];
  use_when: string;
}

interface Chipset {
  name: string;
  version: string;
  skills: Record<string, Skill>;
  agents: { topology: string; router_agent: string; agents: Agent[] };
  teams: Record<string, Team>;
  evaluation: {
    gates: { pre_deploy: Array<{ check: string; action: string }> };
    benchmark: {
      trigger_accuracy_threshold: number;
      test_cases_minimum: number;
      domains_covered: string[];
    };
  };
  grove: { namespace: string; record_types: Array<{ name: string; description: string }> };
  college: {
    department: string | null;
    concept_graph: { read: boolean; write: boolean };
    wings: string[];
  };
}

interface TestCase {
  query: string;
  expected_skills: string[];
}

interface Fixture {
  test_cases: TestCase[];
}

const CHIPSET_ROOT = join(__dirname, '../../examples/chipsets/rca-department');
const chipset: Chipset = parse(readFileSync(join(CHIPSET_ROOT, 'chipset.yaml'), 'utf8'));
const fixture: Fixture = parse(readFileSync(join(CHIPSET_ROOT, 'benchmark/test-cases.yaml'), 'utf8'));

const REQUIRED_METHODOLOGIES = [
  'rca-classical-methods',
  'rca-systems-theoretic',
  'rca-causal-inference',
  'rca-human-factors',
  'rca-distributed-systems',
];

const REQUIRED_GROVE_TYPES = [
  'RCAInvestigation',
  'RCAFinding',
  'RCACausalGraph',
  'RCAPostmortem',
  'RCASession',
];

describe('rca-department chipset', () => {
  describe('structural invariants (brief done-criteria)', () => {
    it('lists exactly 6 skills, 5 agents, 3 teams, 5 grove record types', () => {
      expect(Object.keys(chipset.skills)).toHaveLength(6);
      expect(chipset.agents.agents).toHaveLength(5);
      expect(Object.keys(chipset.teams)).toHaveLength(3);
      expect(chipset.grove.record_types).toHaveLength(5);
    });

    it('name is rca-department-v1.0', () => {
      expect(chipset.name).toBe('rca-department-v1.0');
    });
  });

  describe('pre_deploy gates', () => {
    it('all_skills_have_descriptions', () => {
      for (const [name, skill] of Object.entries(chipset.skills)) {
        expect(skill.description?.trim().length, `${name} description`).toBeGreaterThan(0);
      }
    });

    it('all_agents_have_roles', () => {
      for (const agent of chipset.agents.agents) {
        expect(agent.role?.trim().length, `${agent.name} role`).toBeGreaterThan(0);
      }
    });

    it('grove_record_types_defined (5 RCA types present)', () => {
      const actual = chipset.grove.record_types.map((r) => r.name);
      for (const required of REQUIRED_GROVE_TYPES) {
        expect(actual, `missing grove type ${required}`).toContain(required);
      }
    });

    it('router_agent_is_capcom and exactly one capcom exists', () => {
      const router = chipset.agents.router_agent;
      const routerAgent = chipset.agents.agents.find((a) => a.name === router);
      expect(routerAgent, `router agent ${router} must exist`).toBeDefined();
      expect(routerAgent?.is_capcom, `${router} is_capcom`).toBe(true);
      const capcoms = chipset.agents.agents.filter((a) => a.is_capcom === true);
      expect(capcoms, 'exactly one capcom').toHaveLength(1);
    });

    it('all_methodologies_covered (5 RCA methodology skills)', () => {
      for (const m of REQUIRED_METHODOLOGIES) {
        expect(chipset.skills[m], `methodology skill ${m}`).toBeDefined();
      }
    });
  });

  describe('referential integrity', () => {
    it('skill agent_affinity references only real agents', () => {
      const names = new Set(chipset.agents.agents.map((a) => a.name));
      for (const [skillName, skill] of Object.entries(chipset.skills)) {
        const affinities = Array.isArray(skill.agent_affinity)
          ? skill.agent_affinity
          : [skill.agent_affinity];
        for (const a of affinities) {
          expect(names.has(a), `${skillName} affinity ${a} not in agent roster`).toBe(true);
        }
      }
    });

    it('team members reference only real agents', () => {
      const names = new Set(chipset.agents.agents.map((a) => a.name));
      for (const [teamName, team] of Object.entries(chipset.teams)) {
        for (const a of team.agents) {
          expect(names.has(a), `${teamName} member ${a} not in agent roster`).toBe(true);
        }
      }
    });

    it('college binding is explicitly opted out (deliberate divergence)', () => {
      expect(chipset.college.department).toBeNull();
      expect(chipset.college.concept_graph.read).toBe(false);
      expect(chipset.college.concept_graph.write).toBe(false);
      expect(chipset.college.wings).toEqual([]);
    });
  });

  describe('trigger benchmark', () => {
    it('fixture has at least test_cases_minimum cases', () => {
      expect(fixture.test_cases.length).toBeGreaterThanOrEqual(
        chipset.evaluation.benchmark.test_cases_minimum,
      );
    });

    it('every expected skill in fixture exists in chipset', () => {
      for (const tc of fixture.test_cases) {
        for (const s of tc.expected_skills) {
          expect(chipset.skills[s], `test-case expected skill ${s}`).toBeDefined();
        }
      }
    });

    it('trigger accuracy meets threshold', () => {
      const matchSkill = (query: string): Set<string> => {
        const q = query.toLowerCase();
        const hits = new Set<string>();
        for (const [name, skill] of Object.entries(chipset.skills)) {
          for (const trigger of skill.triggers) {
            if (q.includes(trigger.toLowerCase())) {
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
        const hit = tc.expected_skills.some((s) => matched.has(s));
        if (hit) {
          correct++;
        } else {
          misses.push(`"${tc.query}" → expected ${tc.expected_skills.join(',')}, matched ${[...matched].join(',') || 'none'}`);
        }
      }
      const accuracy = correct / fixture.test_cases.length;
      expect(
        accuracy,
        `trigger accuracy ${accuracy.toFixed(3)} below threshold ${chipset.evaluation.benchmark.trigger_accuracy_threshold}\nMisses:\n  ${misses.join('\n  ')}`,
      ).toBeGreaterThanOrEqual(chipset.evaluation.benchmark.trigger_accuracy_threshold);
    });
  });
});
