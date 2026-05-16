import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const skillAsArtifact: RosettaConcept = {
  id: 'agent-skill-as-artifact',
  name: 'Skill as Artifact',
  domain: 'agent-systems',
  description:
    'A reusable procedural artifact that coordinates tools, memory, and runtime context under task-specific constraints. ' +
    'The 2026 reframing (Zhou et al. survey, arxiv 2605.07358v1) treats skills not as prose convenience but as first-class ' +
    'objects with a typed manifest: declared tools, dependencies, privilege boundary, and behavioural-audit history. ' +
    "The entry point for thinking about agent-system architecture: everything else (orchestration, memory, code-gen) " +
    'composes specialised skills as building blocks. Contrast with: prompt-engineering (skills as text patches), ' +
    'tool-use (skills as flat tool descriptions). The artifact framing is what enables compilation, audit, retirement, and provenance.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'agent-skill-privilege-boundary',
      description: 'The privilege boundary is a required field of the skill artifact manifest',
    },
    {
      type: 'dependency',
      targetId: 'agent-counterfactual-audit',
      description: 'A skill artifact ages via paired-trace audit, not just self-report',
    },
    {
      type: 'cross-reference',
      targetId: 'code-abstraction',
      description: 'Skill as artifact is the agent-domain analogue of code abstraction — a typed interface over implementation detail',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.09 + 0.49),
    angle: Math.atan2(0.7, 0.3),
  },
};
