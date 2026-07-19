/**
 * Defeasible Deontic Compilation concept — logic (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.08932 (2026).
 *
 * @module departments/logic/concepts/defeasible-deontic-compilation
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 1 * 2 * Math.PI / 29;
const radius = 0.9;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const defeasibleDeonticCompilation: RosettaConcept = {
  id: 'logic-defeasible-deontic-compilation',
  name: 'Defeasible Deontic Compilation',
  domain: 'logic',
  description: 'Defeasible deontic compilation treats a statute or policy not as prose to paraphrase but as source code to compile: the Span-Grounded Deontic Tree (SG-DT) is a compiler-style intermediate representation in which every branch of a deontic rule (a permission, obligation, or prohibition) is anchored to the exact source span that licenses it, and each nested exception carries an explicit exclusion guard naming which clause overrides which — for instance, a general permission to process personal data branches to a prohibition whose exclusion guard names GDPR\'s special-category clause as the overriding provision, so the health-data carve-out cannot be silently dropped. Because each branch grounds to a span and each override is guarded, the tree can be deterministically compiled into control flow and audited leaf-by-leaf, rather than trusting a model\'s free-text summary. The mechanism targets Silent Scope Omission (SSO), where a model applies a general rule but quietly drops its nested exceptions, yielding output that looks compliant but breaks on edge cases. In arXiv:2606.08932 (2026) the authors build NormBench, 2,290 provisions across Chinese law and local policy, English U.S. tax law, GDPR, and corporate policy, plus cross-lingual settings, and show frontier LLMs suffer Recursion Decay (accuracy falls sharply as defeater depth grows) and an Auditability Trap (models retrieve the right spans yet assemble wrong control flow); using SG-DT as a constrained intermediate output improves whole-tree fidelity and defeater recovery, with gains concentrated on exception-active, SSO-prone cases. Distinct from Deontic Logic, which supplies the modal semantics of obligation and permission but not a span-grounded, auditable IR whose exceptions must be explicitly guarded and compiled; SG-DT is the engineering artifact that makes defeasibility executable. For agent systems, the implication is that any policy- or regulation-following agent should emit a span-anchored, exclusion-guarded tree as a checkable intermediate before acting, so that dropped exceptions surface as missing guards at audit time instead of as silent compliance failures in production.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'logic-deontic-logic',
      description: 'SG-DT operationalizes the modal obligation/permission/prohibition semantics of deontic logic, turning its abstract modalities into span-anchored, guard-carrying tree branches that can be compiled and audited.',
    },
    {
      type: 'cross-reference',
      targetId: 'logic-instruction-autoformalization',
      description: 'Both convert natural-language normative text into an executable formal target; autoformalization produces policy-as-code broadly, while defeasible deontic compilation specializes in the exception/counter-exception override structure that policy-as-code often flattens.',
    },
    {
      type: 'analogy',
      targetId: 'log-argument-structure',
      description: 'An SG-DT is to a defeasible statute what an argument diagram is to reasoning: it makes the override relations (which defeater beats which claim) explicit and inspectable rather than latent in prose.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
