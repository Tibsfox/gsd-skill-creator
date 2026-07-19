import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const skillPrivilegeBoundary: RosettaConcept = {
  id: 'agent-skill-privilege-boundary',
  name: 'Skill Privilege Boundary',
  domain: 'agent-systems',
  description:
    'A declared capability/permission surface on a skill — which tools it may call, which paths it may read or ' +
    'write, whether it may touch the network, exec subprocesses, or read secrets — with enforcement at two stages: ' +
    'selection time (choosing the least-privileged skill that fits the task) and execution time (refusing dispatch ' +
    "when a skill reaches for a tool outside its declared boundary). That closes lateral-movement failures where a " +
    "skill's prose says one thing and its runtime calls do another. FORTIS (arxiv `2605.09163v2`, 2026), " +
    "'Benchmarking Over-Privilege in Agent Skills,' is the benchmark that measures exactly these two failure " +
    'modes — whether a model selects minimally sufficient skills from overlapping libraries, and whether it ' +
    'executes them without expanding into unauthorized tools or actions — and its headline result is that ' +
    'over-privilege is the norm rather than the exception: across ten frontier models and three domains, agents ' +
    'consistently reach for higher-privilege skills and tools than the task requires, failing at both the ' +
    'selection and execution stages at rates that stay high even for the strongest models — and doing so under ' +
    'ordinary conditions (incomplete specs, convenience framing, proximity to skill boundaries) with no ' +
    "adversarial construction. FORTIS's own framing is that the skill layer, far from containing agent behavior, " +
    'is a primary source of privilege escalation in current systems. Privilege boundary is the agent-system ' +
    'instantiation of capability-based security; without it, every skill is implicitly omnipotent.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'agent-skill-as-artifact',
      description: 'A privilege boundary is a typed field of the skill artifact manifest',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-constraint-drift',
      description: 'Constraint drift across delegation includes loss of privilege boundary; the audit must catch it',
    },
    {
      type: 'cross-reference',
      targetId: 'security-capability-model',
      description: 'Privilege boundary is the agent-system instantiation of capability-based security',
    },
  ],
  complexPlanePosition: {
    real: -0.5,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.25 + 0.16),
    angle: Math.atan2(0.4, -0.5),
  },
};
