import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const evidenceQuality: RosettaConcept = {
  id: 'crit-evidence-quality', name: 'Evidence Quality', domain: 'critical-thinking',
  description: 'Not all evidence is equal. Strong evidence is relevant (directly supports the claim), representative (not cherry-picked), reliable (from trustworthy sources), and sufficient (enough cases to generalize). Anecdote is weak evidence; peer-reviewed studies with large samples are strong. Recognizing evidence quality prevents being persuaded by weak but emotionally compelling cases.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'crit-sourcing', description: 'Evidence quality depends on source credibility as one key criterion' }],
  complexPlanePosition: { real: 0.7, imaginary: 0.35, magnitude: Math.sqrt(0.49 + 0.1225), angle: Math.atan2(0.35, 0.7) },
};
