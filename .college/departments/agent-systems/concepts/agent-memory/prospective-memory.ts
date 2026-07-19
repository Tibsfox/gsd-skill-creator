/**
 * Prospective Memory -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/agent-memory/prospective-memory
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 119 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const prospectiveMemory: RosettaConcept = {
  id: "agent-prospective-memory",
  name: "Prospective Memory",
  domain: 'agent-systems',
  description:
    "Prospective memory (PM) is an agent's capacity to spontaneously recall and act on a latent constraint at the right moment, without an explicit query triggering the retrieval—contrasted with retrospective memory (RM), which answers direct recall questions. TriggerBench operationalizes PM across five dimensions using matched RM controls, contrastive positive/negative variants, and overloaded triggers to measure proactive recall, false-alarm rate, and attentional robustness under one protocol (arXiv 2606.23459, 2026). Its distinct finding is that PM is markedly harder than RM: while RM near-saturates up to 100K tokens, PM decays sharply as context grows, and stronger reasoning can overfit an \"always-remind\" heuristic that inflates false alarms. PM further tracks spare reasoning budget that raw token count obscures. For agent builders, this implies proactive constraint-following needs explicit trigger monitoring and precision-recall tuning, not merely a larger context window.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-anticipatory-memory",
      description: "Anticipatory memory pre-fetches information the agent expects to need next, whereas prospective memory tests whether an already-stored latent constraint is recalled and acted upon at its correct trigger moment without any prompt.",
    },
    {
      type: "dependency",
      targetId: "agent-constraint-decay",
      description: "Reliable prospective memory depends on the latent constraint surviving intervening context; constraint-decay names the failure mode where that stored instruction weakens before its trigger fires, which TriggerBench observes as sharp PM decay under long contexts.",
    },
    {
      type: "analogy",
      targetId: "agent-long-range-dependency",
      description: "Like long-range dependency's difficulty resolving references separated by many tokens, prospective memory degrades as the gap between constraint-setting and its firing trigger widens with context length.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
