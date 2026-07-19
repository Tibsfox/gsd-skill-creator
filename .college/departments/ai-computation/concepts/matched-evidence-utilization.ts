/**
 * Matched-Evidence Utilization Diagnostic -- ai-computation concept (June-2026 arXiv additional scan, T2).
 * @module departments/ai-computation/concepts/matched-evidence-utilization
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 27 * 2 * Math.PI / 23;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const matchedEvidenceUtilization: RosettaConcept = {
  id: "ai-computation-matched-evidence-utilization",
  name: "Matched-Evidence Utilization Diagnostic",
  domain: 'ai-computation',
  description:
    "The Matched-Evidence Utilization Diagnostic addresses a blind spot in retrieval-augmented and long-context evaluation: final-answer accuracy, retrieval recall, and citation overlap cannot reveal how much answer advantage a model actually recovers from supplied evidence, since it may answer from parametric priors, ignore present evidence, or cite text without converting it into the answer (arXiv 2606.06758, 2026). Its distinct contribution is a four-condition protocol—no-evidence, full-context, retrieved-evidence, and oracle-evidence—held under matched examples, models, prompts, and scoring, with Oracle-Reference Normalized Context Utilization (ONCU) as a denominator-valid estimate of recovered oracle-reference advantage. Across five open-weight models, controlled settings expose reduced recovery when evidence is buried in long input, while multi-hop tasks show full-context beating retrieval. For agent systems, it warns that a RAG pipeline scoring well on recall or citations may still fail to convert evidence into answers, demanding utilization-level auditing.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "ai-computation-utilization-accuracy-gap",
      description: "The utilization-accuracy gap names the discrepancy that high final-answer accuracy can hide, and this diagnostic supplies the matched four-condition, oracle-normalized denominator that turns that gap into a measurable recovery estimate.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-grounding-faithfulness",
      description: "Grounding-faithfulness checks whether a stated answer traces back to cited evidence, while this protocol isolates the complementary failure of evidence that is cited yet never converted into the final answer.",
    },
    {
      type: "dependency",
      targetId: "ai-computation-calibrated-retrieval-budget",
      description: "A calibrated retrieval budget can be tuned from this diagnostic's retrieved-evidence versus full-context conditions, which reveal when retrieval underperforms compact whole-context supply of the same evidence.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
