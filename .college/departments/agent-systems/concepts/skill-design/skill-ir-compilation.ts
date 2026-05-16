import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const skillIrCompilation: RosettaConcept = {
  id: 'agent-skill-ir-compilation',
  name: 'Skill IR & Compilation',
  domain: 'agent-systems',
  description:
    'Express a skill once as a typed intermediate representation, then compile it per target framework (Claude Code, ' +
    "Codex, Kimi, Cursor) instead of authoring N near-duplicate prose copies. The 2026 reframing (SkCC, arxiv " +
    '`2605.03353v2`) treats the manifest — declared tools, inputs, dependencies, ordering, output shape — as the ' +
    'source of truth; the prose body becomes a per-target rendering. Compilation closes three holes that prose ' +
    'authoring leaves open: (a) cross-target drift, where a skill silently behaves differently on a different runtime; ' +
    "(b) audit blindness, since prose can't be statically checked for missing capabilities; (c) brittle migration, " +
    'since framework-version bumps require re-authoring. The artifact framing from `agent-skill-as-artifact` is what ' +
    'makes IR compilation possible — once a skill is a typed object, you can target multiple compilation backends.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'agent-skill-as-artifact',
      description: 'IR compilation presupposes that the skill is a typed artifact, not free prose',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-skill-privilege-boundary',
      description: 'The privilege boundary is a typed field of the IR, checked at compile time per target',
    },
    {
      type: 'analogy',
      targetId: 'code-compilation',
      description: 'Skill IR is to skill prose as a programming-language IR is to platform-specific assembly',
    },
  ],
  complexPlanePosition: {
    real: -0.6,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.36 + 0.36),
    angle: Math.atan2(0.6, -0.6),
  },
};
