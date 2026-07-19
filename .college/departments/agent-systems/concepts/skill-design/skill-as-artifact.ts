import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const skillAsArtifact: RosettaConcept = {
  id: 'agent-skill-as-artifact',
  name: 'Skill as Artifact',
  domain: 'agent-systems',
  description:
    'A reusable procedural artifact that coordinates tools, memory, and runtime context under task-specific constraints — ' +
    'the definition adopted verbatim by the 2026 survey (Zhou et al., "A Comprehensive Survey on Agent Skills", arxiv 2605.07358v1), ' +
    'which frames agents as handling high-level reasoning and planning while skills form the operational layer that enables ' +
    'reliable, reusable, and composable execution. That survey organises the field around a four-stage skill lifecycle — ' +
    'representation, acquisition, retrieval, and evolution — and flags open challenges in quality control, interoperability, ' +
    'safe updating, and long-term capability management. ' +
    "The entry point for thinking about agent-system architecture: everything else (orchestration, memory, code-gen) " +
    'composes specialised skills as building blocks. Contrast with: prompt-engineering (skills as text patches), ' +
    'tool-use (skills as flat tool descriptions). The first-class-artifact framing is what enables compilation, audit, retirement, and provenance.',
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
