/**
 * Self-Recognition Activation Signatures -- ai-computation concept (June-2026 arXiv additional scan, T2).
 * @module departments/ai-computation/concepts/self-recognition-signatures
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 23 * 2 * Math.PI / 23;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const selfRecognitionSignatures: RosettaConcept = {
  id: "ai-computation-self-recognition-signatures",
  name: "Self-Recognition Activation Signatures",
  domain: 'ai-computation',
  description:
    "Self-Recognition Activation Signatures denote the finding that large language models implicitly embed signals in their generated text that let them recognize their own outputs, a capability shown to be reliable even in low-entropy settings and amplifiable through targeted intervention (arXiv 2606.06315, 2026). The distinct mechanism steers the residual stream during generation with a random sparse vector, planting a detectable fingerprint that a second LLM, used as a detector, recovers directly from its activations at over 98% accuracy while leaving text quality intact. Rather than embedding a watermark externally, it exploits the model's natural representation structure for attribution, demonstrating that activation spaces carry exploitable capacity for encoding identity without semantic interference. For agent systems, this offers a practical provenance primitive: attributing content to a specific model in multi-agent pipelines where knowing which agent authored an output governs trust and auditing.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "ai-computation-local-linearity-steering",
      description: "The fingerprint is planted by adding a random sparse vector to the residual stream mid-generation, depending on local-linearity steering to inject signal without collapsing output quality.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-forensic-residual-physics",
      description: "Both attribute a text to its source model by reading structure in residual activations rather than external metadata, treating the activation trace itself as forensic evidence of authorship.",
    },
    {
      type: "analogy",
      targetId: "ai-computation-semantic-channel",
      description: "Encoding a sparse identity fingerprint in activation space without disturbing meaning is like a side-band riding orthogonally to the semantic channel, carrying attribution without semantic interference.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
