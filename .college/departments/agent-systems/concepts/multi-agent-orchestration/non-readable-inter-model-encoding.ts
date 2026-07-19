/**
 * Non-Readable Inter-Model Encoding -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/multi-agent-orchestration/non-readable-inter-model-encoding
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 126 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const nonReadableInterModelEncoding: RosettaConcept = {
  id: "agent-non-readable-inter-model-encoding",
  name: "Non-Readable Inter-Model Encoding",
  domain: 'agent-systems',
  description:
    "Non-Readable Inter-Model Encoding, termed BabelTele (arXiv 2606.19857, 2026), studies whether semantics can be packed into compact, non-standard textual forms that sacrifice human readability yet remain recoverable by instruction-tuned LLMs. Rather than a fixed protocol, it is an empirical probe: readability diagnostics, model-likelihood measures, human questionnaires, and downstream tasks show that generated encodings can depart sharply from ordinary language while preserving core meaning, holding 99.5% semantic fidelity even when condensed to 27.9% of the original text volume. Its distinct contribution is demonstrating that human readability, natural-language typicality, and model-side recoverability are partially decoupled, though effectiveness depends on the compressor-reader pair and task. For agent systems, this opens model-native representations that cut context overhead across cross-model transfer, agent memory, and multi-agent communication, shrinking token cost without a dedicated codec.",
  panels: new Map(),
  relationships: [
    {
      type: "analogy",
      targetId: "agent-latent-agent-communication",
      description: "Both establish model-to-model channels that abandon human-readable natural language, but BabelTele keeps the channel textual and decodable by a reader LLM, whereas latent agent communication drops to sub-symbolic vectors.",
    },
    {
      type: "cross-reference",
      targetId: "agent-single-token-memory-compression",
      description: "Both trade legibility for density to reduce context overhead, with BabelTele compressing prose into compact non-standard text while single-token memory compression collapses a whole span into one recoverable token.",
    },
    {
      type: "cross-reference",
      targetId: "agent-multi-order-communication",
      description: "BabelTele's reliability across a multi-agent exchange hinges on the compressor-reader pairing, a channel-fidelity constraint that multi-order communication routing must respect when encoded messages hop between heterogeneous agents.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
