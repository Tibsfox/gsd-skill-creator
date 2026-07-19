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
    "The name comes from Wegner's transactive memory: a group performs as one system by encoding, storing, and retrieving knowledge through a shared sense of who-knows-what, so no single member must hold everything. A population of heterogeneous LLM agents, by contrast, typically re-derives the same solutions in isolation — discarding each hard-won trajectory after a single use or retaining it only in the producing agent. Multi-Agent Transactive Memory (MATM, arXiv 2606.19911v1) applies the idea at population scale: producer agents deposit their completed trajectories into a shared repository and consumer agents retrieve them to improve execution, extending retrieval-augmented generation from human-authored documents to agent-authored experience. Mechanically it is a flat shared corpus of trajectories rather than a directory of expert identities — the reuse comes from retrieving a peer's full solution path, not from routing to a named specialist. In long-horizon interactive environments (ALFWorld and WebArena, where trajectories are long and procedurally rich), retrieving from MATM improves downstream task performance and reduces interaction steps with no coordination or joint training between agents. The pattern turns a team's collective runs into a queryable, growing knowledge base, so newly instantiated agents amortize discovery instead of rediscovering each task from scratch.",
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
