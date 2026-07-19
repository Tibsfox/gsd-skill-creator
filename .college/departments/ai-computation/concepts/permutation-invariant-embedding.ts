/**
 * Permutation Invariant Embedding -- ai-computation concept (June-2026 arXiv cohort, T2).
 * @module departments/ai-computation/concepts/permutation-invariant-embedding
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 39 * 2 * Math.PI / 41;
const radius = 0.70;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const permutationInvariantEmbedding: RosettaConcept = {
  id: "ai-computation-permutation-invariant-embedding",
  name: "Permutation Invariant Embedding",
  domain: 'ai-computation',
  description:
    "Serializing a structured record — fields concatenated into one string — before embedding lets a fine-tuned encoder cheat: it binds meaning to a field's absolute position in the string rather than to its label, so reordering fields at query time drops retrieval quality by about 7 nDCG@10. Permutation-invariant fine-tuning (arXiv 2606.30473, 2026) resamples field order each epoch and randomly drops fields, forcing the encoder to key on labels rather than slots; the reordering sensitivity vanishes with no loss on the canonical order. It matters because production records rarely arrive in one fixed field order, so a position-bound encoder degrades silently under realistic schema drift.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "ai-computation-isotropic-embedding",
      description: "Builds on the representation-probing view of what an encoder's geometry actually encodes. Where isotropy asks whether embedding dimensions are uniformly used, this specialization asks whether they encode field labels versus absolute string position, and treats the discovered positional binding as a latent-space defect to correct via permutation-invariant fine-tuning.",
    },
    {
      type: "analogy",
      targetId: "ai-computation-entity-rebinding-circuit",
      description: "Both concern positional versus semantic binding: the rebinding circuit traces how a model attaches attributes to entities partly by position, mirroring how a serialized-record encoder attaches meaning to a field's slot rather than its label. Permutation-invariant training is the embedding-side remedy for the same slot-versus-label failure mode.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-lexical-anchor-probe",
      description: "Field labels are the lexical anchors a corrected encoder must key on. The anchor probe measures whether retrieval scores hinge on specific label tokens, so it directly diagnoses whether permutation-invariant fine-tuning actually shifted binding from position to label rather than merely masking the reordering symptom.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-embedding-norm-specificity",
      description: "A sibling representation-probing finding about what a fine-tuned embedding geometry actually encodes. Both reveal an encoder optimizing a surrogate signal — norm-as-specificity in one case, position-as-field in the other — that diverges from the intended semantic content and is only exposed by targeted probing.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
