import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const claimsFactsOpinions: RosettaConcept = {
  id: 'crit-claims-facts-opinions', name: 'Claims, Facts & Opinions', domain: 'critical-thinking',
  description: 'A fact is a statement verifiable through observation or evidence. An opinion expresses a personal perspective or value judgment. A claim is any assertion offered as true, which may be factual, evaluative, or predictive. Critical thinking begins by categorizing statements: Is this verifiable? What would count as evidence? The conflation of opinion with fact is one of the most common reasoning errors.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'crit-evidence-quality', description: 'Once claims are identified, their supporting evidence can be evaluated' }],
  complexPlanePosition: { real: 0.85, imaginary: 0.15, magnitude: Math.sqrt(0.7225 + 0.0225), angle: Math.atan2(0.15, 0.85) },
};
