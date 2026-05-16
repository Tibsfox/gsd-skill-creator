import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const knowingDoingGap: RosettaConcept = {
  id: 'agent-knowing-doing-gap',
  name: 'Knowing-Doing Gap',
  domain: 'agent-systems',
  description:
    'LLMs internally represent whether a tool is necessary with AUROC 0.89-0.96, yet emit tool calls only 60-70% of the ' +
    "time they should. The latent representation knows; the action surface doesn't. The 2026 finding (Probe&Prefill, " +
    'arxiv `2605.14038v1`) is that externalising the probe — a small classifier over hidden states — and prefilling the ' +
    "decision cuts tool calls by 48% with only 1.7% accuracy loss. The gap generalises: it's not specific to tool use, " +
    'but a symptom of any time emitted behaviour lags latent representation. Implication: when a skill seems to know ' +
    "what to do but doesn't, instrument the latent representation directly rather than rewording the prompt.",
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-intent-routing',
      description: 'Probe&Prefill is intent routing applied to tool-necessity at the hidden-state level',
    },
    {
      type: 'cross-reference',
      targetId: 'rosetta-knowing-doing-gap',
      description: 'Anchored at the rosetta-core level as concept #11',
    },
    {
      type: 'dependency',
      targetId: 'agent-counterfactual-audit',
      description: 'Closing the gap requires a paired-trace audit; pass-rate alone misses the behaviour shift',
    },
  ],
  complexPlanePosition: {
    real: -0.4,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.16 + 0.25),
    angle: Math.atan2(0.5, -0.4),
  },
};
