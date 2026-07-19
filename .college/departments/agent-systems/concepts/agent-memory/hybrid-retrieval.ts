import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const hybridRetrieval: RosettaConcept = {
  id: 'agent-hybrid-retrieval',
  name: 'Hybrid Retrieval',
  domain: 'agent-systems',
  description:
    'Combine a lexical channel (BM25 over surface forms) and a dense channel (embedding cosine over learned ' +
    'representation) into a single retrieval surface. The 2026 component-wise ablation (arxiv `2605.14503v1`, ' +
    '21 methods spanning code generation, code summarization, and code repair) lands two sharp findings: retriever ' +
    'choice influences end-to-end quality more than generator choice, and classic BM25 is remarkably robust — ' +
    'frequently competitive with, and on surface-form-heavy tasks (identifiers, error messages, exact phrases) ' +
    'beating, both dense and hybrid, inverting the assumption that bigger embeddings always win. Dense earns its ' +
    'keep on semantic-match tasks (paraphrases, conceptual neighbours). That makes a hybrid surface a routing ' +
    'problem rather than a free win: the payoff comes from sending each query to the channel its signal lives in. ' +
    'Implication for gsd-skill-creator: the existing dense-embedding-only retrieval is one channel ' +
    'in a planned `RetrievalStrategy` interface; a BM25 channel is a sibling, not a replacement, and the ' +
    'combination is gated by `agent-intent-routing` (Theme B).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'agent-intent-routing',
      description: 'Hybrid retrieval is gated by intent routing — lookup queries route to lexical, semantic to dense',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-content-addressed-storage',
      description: 'Both channels operate over the same content-addressed substrate but index different surface forms',
    },
    {
      type: 'analogy',
      targetId: 'ir-bm25-dense-hybrid',
      description: 'The same hybrid pattern from classical IR systems, applied to agent memory',
    },
  ],
  complexPlanePosition: {
    real: -0.2,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.04 + 0.16),
    angle: Math.atan2(0.4, -0.2),
  },
};
