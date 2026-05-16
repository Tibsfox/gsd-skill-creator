import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const skillPrivilegeBoundary: RosettaConcept = {
  id: 'agent-skill-privilege-boundary',
  name: 'Skill Privilege Boundary',
  domain: 'agent-systems',
  description:
    'A declared capability/permission surface on a skill, enforced at selection time and at execution time. The 2026 ' +
    'reframing (FORTIS, arxiv `2605.09163v2`) treats privilege as a first-class field of the skill manifest: which ' +
    'tools the skill is allowed to call, which paths it can read/write, whether it can touch the network, exec ' +
    'subprocesses, or read secrets. The runtime is responsible for refusing dispatch when a skill requests a tool ' +
    'outside its declared boundary, and the audit log records every privilege check. The pattern closes a class of ' +
    "lateral-movement failures where a skill's prose said one thing and its runtime calls did another. Privilege " +
    'boundary is what makes a skill safe to compile and ship; without it, every skill is implicitly omnipotent.',
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
