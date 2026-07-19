/**
 * Transactive Memory -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agent-memory/transactive-memory
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 81 * 2 * Math.PI / 85;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const transactiveMemory: RosettaConcept = {
  id: "agent-transactive-memory",
  name: "Transactive Memory",
  domain: 'agent-systems',
  description:
    "A population of heterogeneous agents typically re-derives the same solutions in isolation, wasting compute and never pooling hard-won procedure. Multi-Agent Transactive Memory (arXiv 2606.19911v1) treats each agent-generated trajectory as a shared procedural artifact, indexed in a common corpus so any agent can retrieve and reuse a peer's solution — extending retrieval-augmented generation from human-authored documents to agent-authored experience. The mechanism turns a group's collective runs into a queryable, growing knowledge base, so orchestrated teams amortize discovery and specialize by who-knows-what rather than each rediscovering a task from scratch.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-episode-package",
      description: "Specializes the single-agent episode package into a shared, cross-agent corpus: the same captured trajectory becomes an artifact indexed for a whole population to retrieve, not just its author's own future self.",
    },
    {
      type: "dependency",
      targetId: "agent-hybrid-retrieval",
      description: "Relies on hybrid dense-plus-sparse retrieval to index and surface agent-authored trajectories; it is the read-side substrate over which the shared transactive corpus is actually queried and ranked.",
    },
    {
      type: "cross-reference",
      targetId: "agent-content-addressed-storage",
      description: "Shares the content-addressed indexing pattern — trajectories are stored and deduplicated by their content so peers across the population can reliably locate and reuse identical procedure.",
    },
    {
      type: "cross-reference",
      targetId: "agent-execution-grounded-selection",
      description: "When several retrieved peer trajectories plausibly apply, execution-grounded selection disambiguates which one to reuse, bridging the shared memory corpus to orchestration-time behavioural choice.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
