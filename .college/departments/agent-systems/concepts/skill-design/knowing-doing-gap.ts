import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const knowingDoingGap: RosettaConcept = {
  id: 'agent-knowing-doing-gap',
  name: 'Knowing-Doing Gap',
  domain: 'agent-systems',
  description:
    "LLMs' hidden states encode whether a tool is needed, yet the emitted action diverges from that latent judgment. " +
    'The 2026 finding (Model-Adaptive Tool Necessity, arxiv `2605.14038v1`) defines tool-necessity relative to each ' +
    "model's own capability and measures a mismatch of 26.5-54.0% on arithmetic and 30.8-41.8% on factual QA across four " +
    'models. Decomposing tool use into a cognition stage (does the model believe a tool is needed) and an execution ' +
    'stage (does it actually call one), both signals are linearly decodable from hidden states — but their probe ' +
    'directions turn nearly orthogonal in the late-layer, last-token regime that drives the next token, and the bulk of ' +
    'the mismatch sits in the cognition-to-action transition, not in cognition itself. The model knows; the action ' +
    'lags. A sibling result (LLM Agents Already Know When to Call Tools, arxiv `2605.09252v1`) shows the necessity ' +
    'signal is linearly decodable from the pre-generation representation with AUROC 0.89-0.96 across six models, and its ' +
    'Probe&Prefill fix — read the probe, prefill a steering decision — cuts unnecessary tool calls by 48% at only 1.7% ' +
    'accuracy loss, versus 6% for the best prompting baseline at comparable accuracy. Implication: when a skill seems ' +
    "to know what to do but doesn't, instrument the latent representation directly rather than rewording the prompt.",
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-intent-routing',
      description: 'The Probe&Prefill fix (arxiv 2605.09252) is intent routing applied to tool-necessity at the hidden-state level',
    },
    {
      type: 'cross-reference',
      targetId: 'rosetta-knowing-doing-gap',
      description: 'Anchored at the rosetta-core level as the knowing-doing-gap concept',
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
