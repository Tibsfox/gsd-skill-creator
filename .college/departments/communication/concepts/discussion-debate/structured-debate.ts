import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const structuredDebate: RosettaConcept = {
  id: 'comm-structured-debate', name: 'Structured Debate', domain: 'communication',
  description: 'Formal debate structures (Lincoln-Douglas, Parliamentary, Oxford) provide frameworks for arguing opposing positions, delivering rebuttals, and responding to cross-examination. Debate develops argumentation skills, research ability, and the cognitive flexibility to argue positions one might not personally hold. The discipline of structured debate strengthens critical thinking.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-facilitated-discussion', description: 'Debate is a structured form of discussion with defined rules and roles' }, { type: 'cross-reference', targetId: 'crit-argument-structure', description: 'Debate applies critical thinking\'s argument structure in a competitive oral format' }],
  complexPlanePosition: { real: 0.55, imaginary: 0.6, magnitude: Math.sqrt(0.3025 + 0.36), angle: Math.atan2(0.6, 0.55) },
};
