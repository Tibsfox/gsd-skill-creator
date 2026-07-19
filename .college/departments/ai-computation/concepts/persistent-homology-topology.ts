/**
 * Persistent Homology Topology concept — ai-computation (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.23590 (2026).
 *
 * @module departments/ai-computation/concepts/persistent-homology-topology
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 10 * 2 * Math.PI / 29;
const radius = 0.93;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const persistentHomologyTopology: RosettaConcept = {
  id: 'ai-computation-persistent-homology-topology',
  name: 'Persistent Homology Topology',
  domain: 'ai-computation',
  description: 'Persistent Homology Topology treats an LLM\'s own uncertainty about a prompt as a geometric object. For each transformer layer, the contextual hidden states of the prompt tokens are gathered into a point cloud, and finite zero-dimensional persistent homology — a topological-data-analysis technique that tracks how connected components merge as a distance threshold grows — is computed over that cloud. Each layer is summarized by three compact descriptors, mean finite lifetime, normalized lifetime entropy, and largest-lifetime concentration, and these are concatenated across all layers to yield a single topology representation of the question. arXiv:2606.23590 (2026) shows this representation classifies ill-posed questions (ambiguous, underspecified, or contradictory) far better than prompt-based or pooled-hidden-state baselines, lifting average accuracy from 67.4% to 78.9% on AmbigQA, from 79.9% to 88.5% on SituatedQA, and from 57.6% to 69.6% on CLAMBER 9-way classification. The paper further introduces topology-conditioned activation steering: it retrieves topologically similar prior examples and builds query-specific activation interventions that push the model toward source-aware clarification or abstention, raising the total acceptable response rate from 61.4% to 70.6% and grounded acceptable responses from 11.9% to 16.4%. Distinct from the Activation Delta Probe, which reads a linear activation difference along a fixed learned direction, this mechanism characterizes the multi-scale shape of the entire hidden-state cloud, capturing forms of ill-posedness that no single steering vector isolates. For agent systems it offers a concrete model-internal early-warning signal: before an agent commits to answering, a cheap topological read of its own layers can flag that the question itself is broken and route it to a clarification turn or a principled abstention rather than a confident hallucination.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'ai-computation-activation-delta-probe',
      description: 'Both are internal-state probes that classify a query from hidden activations, but Activation Delta Probe reads a linear difference along a fixed direction whereas this reads the multi-scale topological shape of the whole per-layer point cloud.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-knowledge-conflict-steering',
      description: 'Both use activation steering conditioned on a detected query property; here the conditioning signal is topological similarity to prior ill-posed examples rather than a knowledge-conflict indicator.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-local-linearity-steering',
      description: 'Contrasts a linear/local steering formulation with topology-conditioned steering that retrieves topologically similar cases to build query-specific interventions toward clarification or abstention.',
    },
    {
      type: "cross-reference",
      targetId: "mathematics-hourglass-persistence",
      description: "Routes the TDA machinery back to the math topology wing: persistent-homology-topology imports filtration/persistence-diagram tooling that hourglass-persistence formalizes as a contraction index on filtered simplicial complexes. This mirrors hyperbolic-retrieval-geometry's link to math-fractal-geometry, keeping the mathematical foundation cross-referenced.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
