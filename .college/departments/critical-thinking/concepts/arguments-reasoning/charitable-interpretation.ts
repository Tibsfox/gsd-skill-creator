import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const charitableInterpretation: RosettaConcept = {
  id: 'crit-charitable-interpretation', name: 'Charitable Interpretation (Steel-Manning)', domain: 'critical-thinking',
  description: 'Charitable interpretation means engaging with the strongest, most reasonable version of an argument rather than the weakest (straw man). Steel-manning reconstructs an opposing view so robustly that the opponent would recognize it. This practice reveals where genuine disagreement lies, prevents dismissing good ideas through misrepresentation, and is the intellectual standard for productive discourse.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'crit-argument-structure', description: 'Charitable interpretation requires accurately mapping the argument structure before evaluating it' }, { type: 'analogy', targetId: 'comm-respectful-disagreement', description: 'Steel-manning is the intellectual practice underlying respectful disagreement in communication' }],
  complexPlanePosition: { real: 0.4, imaginary: 0.75, magnitude: Math.sqrt(0.16 + 0.5625), angle: Math.atan2(0.75, 0.4) },
};
