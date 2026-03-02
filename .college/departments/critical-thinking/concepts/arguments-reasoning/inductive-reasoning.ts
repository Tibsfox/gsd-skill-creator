import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const inductiveReasoning: RosettaConcept = {
  id: 'crit-inductive-reasoning', name: 'Inductive Reasoning', domain: 'critical-thinking',
  description: 'Inductive arguments move from specific observations to general conclusions. They cannot guarantee their conclusions but can make them more or less probable. Strong inductive arguments have large, representative samples and consistent observations. Science relies on induction: no finite number of confirming observations can prove a universal claim, but a single counterexample can disprove it.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'crit-argument-structure', description: 'Inductive arguments have a different structural standard than deductive: probability rather than certainty' }],
  complexPlanePosition: { real: 0.5, imaginary: 0.65, magnitude: Math.sqrt(0.25 + 0.4225), angle: Math.atan2(0.65, 0.5) },
};
