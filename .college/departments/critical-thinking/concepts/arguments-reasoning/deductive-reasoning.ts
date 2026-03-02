import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const deductiveReasoning: RosettaConcept = {
  id: 'crit-deductive-reasoning', name: 'Deductive Reasoning', domain: 'critical-thinking',
  description: 'Deductive arguments claim that if the premises are true, the conclusion must be true. Validity means the logic is correct (conclusion follows from premises); soundness requires both validity and true premises. Modus ponens (if P then Q; P; therefore Q) and modus tollens (if P then Q; not Q; therefore not P) are the basic deductive forms.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'crit-argument-structure', description: 'Deductive reasoning is the strongest form of argument structure evaluation' }, { type: 'analogy', targetId: 'math-equations-expressions', description: 'Deductive logic resembles mathematical proof: valid steps from axioms to theorem' }],
  complexPlanePosition: { real: 0.45, imaginary: 0.7, magnitude: Math.sqrt(0.2025 + 0.49), angle: Math.atan2(0.7, 0.45) },
};
