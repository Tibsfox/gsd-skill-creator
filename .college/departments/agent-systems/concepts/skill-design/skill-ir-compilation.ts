import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const skillIrCompilation: RosettaConcept = {
  id: 'agent-skill-ir-compilation',
  name: 'Skill IR & Compilation',
  domain: 'agent-systems',
  description:
    'Express a skill once as a strongly-typed intermediate representation (SkIR), then compile it per target ' +
    'framework (demonstrated on Claude Code and Kimi CLI) instead of authoring N near-duplicate prose copies. The ' +
    '2026 reframing (SkCC, arxiv `2605.03353v2`) treats the typed manifest — declared tools, inputs, dependencies, ' +
    'ordering, output shape — as the source of truth and the prose body as a per-target rendering, cutting ' +
    'adaptation complexity from O(m×n) to O(m+n) across m skills and n frameworks. Compilation closes three holes ' +
    'that prose authoring leaves open: (a) cross-target drift — the same skill varies widely in performance ' +
    'because frameworks are highly sensitive to prompt formatting (the paper reports large per-framework ' +
    'performance variation for identical skills as its motivation); (b) audit blindness, since prose ' +
    'cannot be statically checked for missing capabilities; (c) brittle migration, since framework-version bumps ' +
    'require re-authoring. Reported gains: pass rate rising 21.1% to 33.3% on Claude Code and 35.1% to 48.7% on ' +
    'Kimi CLI, sub-10ms compilation latency, 10–46% runtime token savings, and 94.8% proactive detection at the ' +
    'security-check layer. The artifact framing from `agent-skill-as-artifact` is what makes IR compilation ' +
    'possible — once a skill is a typed object, you can target multiple compilation backends.',
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
