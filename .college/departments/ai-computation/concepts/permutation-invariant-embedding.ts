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
    "Serializing a structured record — fields concatenated into one string — before embedding lets a fine-tuned encoder cheat: because it always sees fields in one fixed serialization order, absolute string position becomes a lower-loss shortcut to field identity, so the encoder binds meaning to a field's slot rather than to its label. Reordering fields at query time then drops retrieval quality by 7.4 nDCG@10 points for a standard fine-tune. Permutation-invariant fine-tuning (PI-FT, arXiv 2606.30473, 2026) serializes each record under a freshly sampled field order every epoch with random field dropout, forcing the encoder to key on labels rather than slots; this cuts the reordering penalty to 0.2 nDCG@10 points, and the fine-tuned 118M-parameter encoder reaches 0.707 nDCG@10 versus 0.556 for a text-embedding-3-large baseline. It matters because production records rarely arrive in one fixed field order, so a position-bound encoder degrades silently under realistic schema drift.",
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
    {
      type: "cross-reference",
      targetId: "ai-computation-hyperbolic-retrieval-geometry",
      description: "Reciprocal sibling embedding-geometry defect: both concepts show an embedding whose geometry discards task-critical structure — order here, hierarchy in hyperbolic-retrieval-geometry — and both are corrected by changing the geometry rather than the model.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
