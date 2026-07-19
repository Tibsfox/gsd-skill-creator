/**
 * Anticipatory Agent Memory -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/agent-memory/anticipatory-memory
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 118 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const anticipatoryMemory: RosettaConcept = {
  id: "agent-anticipatory-memory",
  name: "Anticipatory Agent Memory",
  domain: 'agent-systems',
  description:
    "Anticipatory Agent Memory (arXiv 2606.15405, 2026) addresses a blind spot in LLM long-term conversational memory: recall is reachability-bounded by lexical or dense-vector similarity between a query and stored content, so it succeeds only for descriptive cases where the two share surface features (wording, named entities) and fails for associative cases tied only by a latent semantic arc. The distinct contribution is T-Mem, which adds write-time rehearsals called triggers—the engineering counterpart of episodic future thinking—that anticipate the future contexts under which a memory will need to be found. At two granularities, single facts and full exchanges, it pairs a descriptive trigger family with an associative one, keeping every memory reachable from both surface-similar and relevance-bound queries, reaching state-of-the-art on LoCoMo and LoCoMo-Plus. For agent systems, this reframes memory writing as forecasting retrieval, letting an assistant actively mine past dialogue as a semantic asset.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-hybrid-retrieval",
      description: "T-Mem's descriptive trigger family rests on lexical-plus-dense hybrid retrieval, which anticipatory memory then extends with an associative trigger family to reach queries that share no surface features.",
    },
    {
      type: "cross-reference",
      targetId: "agent-prospective-memory",
      description: "Anticipatory write-time triggers are the mechanism that lets an agent honor prospective commitments made many sessions earlier, by making those commitments retrievable under the later contexts where follow-through is due.",
    },
    {
      type: "analogy",
      targetId: "agent-memory-consolidation",
      description: "Both restructure stored experience after the exchange ends, but consolidation compresses and abstracts memories whereas anticipatory rehearsal instead generates extra descriptive and associative retrieval handles for forecasted future queries.",
    },
    {
      type: "cross-reference",
      targetId: "agent-answer-conditioned-information-gain",
      description: "Both forecast what a memory is FOR, from opposite ends of the pipeline: anticipatory rehearsal predicts at write time which traces future queries will need, while answer-conditioned information-gain scores at retrieval time how much a candidate memory would move the answer. Reading them together frames the write-vs-read symmetry of memory value estimation.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
