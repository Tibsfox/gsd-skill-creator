/**
 * Constraint Compatible Retrieval -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agent-memory/constraint-compatible-retrieval
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 50 * 2 * Math.PI / 85;
const radius = 0.70;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const constraintCompatibleRetrieval: RosettaConcept = {
  id: "agent-constraint-compatible-retrieval",
  name: "Constraint Compatible Retrieval",
  domain: 'agent-systems',
  description:
    "Dense retrieval ranks by topical similarity, so a query for \"flights with no layover\" scores layover-heavy passages as top matches — negations and excluded attributes get surfaced as evidence even though they violate the query. CoDeR (arXiv 2606.13204) factors the retrieval score into two channels: a relevance encoder for topic and a dedicated compatibility encoder that scores polarity, so the retriever enforces a constraint rather than treating it as a match. For agents whose memory holds negated preferences or hard exclusions, this stops recall from returning exactly what the user ruled out.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-hybrid-retrieval",
      description: "Specializes hybrid retrieval by adding a scoring channel beyond dense and sparse topical match: a compatibility encoder that scores constraint polarity, so the fused score enforces negations and exclusions instead of only measuring topical overlap.",
    },
    {
      type: "cross-reference",
      targetId: "agent-memory-validity-gate",
      description: "Both are read-side memory quality controls but target distinct failures: the validity gate rejects stale or invalidated facts, while constraint-compatible retrieval blocks topically-similar yet constraint-violating hits. Curation ranks the validity gate as higher priority.",
    },
    {
      type: "cross-reference",
      targetId: "agent-intent-routing",
      description: "A router that detects a query carries a negation or hard exclusion can dispatch it to a compatibility-aware retriever rather than a plain dense one, making CoDeR the specialized strategy that sits behind such a routing decision.",
    },
    {
      type: "analogy",
      targetId: "agent-riemannian-memory-retrieval",
      description: "Both refine retrieval scoring past flat cosine similarity — CoDeR factors out a polarity/compatibility dimension while Riemannian retrieval reshapes the metric with curved geometry — each correcting a way raw dot-product ranking misleads.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
