/**
 * Lexical Anchor Probe -- ai-computation concept (June-2026 arXiv cohort, T2).
 * @module departments/ai-computation/concepts/lexical-anchor-probe
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 38 * 2 * Math.PI / 41;
const radius = 0.65;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const lexicalAnchorProbe: RosettaConcept = {
  id: "ai-computation-lexical-anchor-probe",
  name: "Lexical Anchor Probe",
  domain: 'ai-computation',
  description:
    "LLMs can score well on causal-reasoning benchmarks while merely exploiting familiar variable names (smoking→cancer) rather than the causal graph itself. Caliper (2026, arXiv:2606.04915) isolates this by anonymizing the semantic variable names while holding the causal-graph topology and conditional probabilities fixed, then measuring the accuracy drop between named and anonymized versions. A large drop signals the model leaned on lexical anchors — surface token associations — rather than structural inference. The probe converts a hidden confound into a quantitative faithfulness measure, distinguishing genuine structural competence from memorized lexical shortcuts.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "ai-computation-evidence-centric-reasoning",
      description: "Specializes the parent's evidence-grounded reasoning stance into a controlled-perturbation test: where evidence-centric-reasoning asks whether an answer tracks the provided evidence, this probe asks whether causal accuracy survives stripping the lexical cues, supplying the anonymization diagnostic the parent lacks.",
    },
    {
      type: "analogy",
      targetId: "ai-computation-activation-delta-probe",
      description: "Both quantify reasoning by a delta under a controlled intervention — activation-delta reads the hidden-state change caused by an edit, while this probe reads the accuracy change caused by anonymizing variable names; same measure-the-difference methodology on different observables.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-grounding-faithfulness",
      description: "Shares the faithfulness-probe objective of separating genuine structural competence from surface pattern-matching; name-anonymization is one concrete faithfulness diagnostic that complements grounding checks on whether output is truly supported rather than parroted.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-entity-rebinding-circuit",
      description: "Anonymizing variable names forces the model to rebind fresh symbols to their roles in the causal graph, and sensitivity to that rebinding is exactly what the drop measures, linking the probe's stimulus to the entity-binding machinery this circuit describes.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
