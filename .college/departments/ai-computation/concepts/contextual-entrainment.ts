/**
 * Contextual Entrainment -- ai-computation concept (June-2026 arXiv additional scan, T2).
 * @module departments/ai-computation/concepts/contextual-entrainment
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 25 * 2 * Math.PI / 23;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const contextualEntrainment: RosettaConcept = {
  id: "ai-computation-contextual-entrainment",
  name: "Contextual Entrainment",
  domain: 'ai-computation',
  description:
    "Contextual entrainment is the tendency of a large language model to assign elevated probability to tokens simply because they appear in its context. This work lifts the phenomenon from the token level to the sentence level, scoring a sentence by its per-token mean log-probability rather than individual token probabilities (arXiv 2606.24077, 2026). Across 26 models from seven families on both subjective and objective datasets, sentences placed in the prompt—including counterfactual statements—significantly gain probability at inference time, an effect that gradually weakens as model size grows. Its distinct contribution is causal localization: only 2% to 4% of attention heads control the behavior, and turning off those heads mitigates entrainment without hurting performance. For agent systems, this means context-driven bias toward planted or retrieved claims is a targeted, editable circuit rather than a diffuse, unavoidable property.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "ai-computation-conflict-regime-rag",
      description: "When retrieved passages contradict the model's parametric knowledge, contextual entrainment is a driving force that tilts generation toward the in-context claim, sharpening the very conflict regimes that RAG pipelines must arbitrate.",
    },
    {
      type: "analogy",
      targetId: "ai-computation-lineage-inherited-truthful-heads",
      description: "Both findings localize a global behavior to a small, identifiable subset of attention heads, so the 2-4% of entrainment heads mirror truthful heads as a sparse, intervenable locus of control.",
    },
    {
      type: "dependency",
      targetId: "ai-computation-knowledge-conflict-steering",
      description: "Ablating the identified entrainment heads is a concrete steering intervention, giving knowledge-conflict steering a precise circuit to disable when in-context claims should not override stored knowledge.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
