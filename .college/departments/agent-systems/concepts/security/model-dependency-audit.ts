/**
 * Model Dependency Audit -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/security/model-dependency-audit
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 117 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const modelDependencyAudit: RosettaConcept = {
  id: "agent-model-dependency-audit",
  name: "Model Dependency Audit",
  domain: 'agent-systems',
  description:
    "Model Dependency Audit is the agentic reconstruction of an LLM's full provenance graph from fragmented public artifacts, with every edge backed by source-grounded evidence. Its system, ModSleuth (arXiv 2606.12385, 2026), recursively traces how a model depends on upstream artifacts used to generate data, filter corpora, judge outputs, or guide development decisions. Its distinct insight is that extraction is no longer the bottleneck: the hard problems are defining what counts as a dependency and reconciling artifact identities across inconsistent names, versions, and repositories. It answers both with an operation-centered formalization separating direct from indirect dependencies and resolving cross-artifact references. Applied to four releases it recovers over a thousand verified dependencies, exposing multi-hop license obligations and train-evaluation coupling. For agent builders it supplies the supply-chain map needed to audit license, provenance, and contamination risk before trusting a model.",
  panels: new Map(),
  relationships: [
    {
      type: "analogy",
      targetId: "agent-skill-resource-supply-chain",
      description: "Both reconstruct a chain of upstream artifacts a component silently inherits; ModSleuth audits the model provenance supply chain while agent-skill-resource-supply-chain governs the resource dependencies a skill drags in.",
    },
    {
      type: "cross-reference",
      targetId: "agent-compliance-trace-check",
      description: "The multi-hop license obligations and train-evaluation couplings ModSleuth surfaces are exactly the provenance edges a compliance trace check must verify before a model or its outputs are permitted downstream.",
    },
    {
      type: "analogy",
      targetId: "agent-content-addressed-storage",
      description: "ModSleuth's hardest sub-problem, reconciling one artifact's identity across conflicting names, versions, and repositories, is the very ambiguity that content-addressed storage eliminates by identifying an artifact by the hash of its contents.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
