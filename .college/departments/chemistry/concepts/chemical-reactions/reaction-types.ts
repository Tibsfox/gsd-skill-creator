import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const reactionTypes: RosettaConcept = {
  id: 'chem-reaction-types',
  name: 'Reaction Types',
  domain: 'chemistry',
  description: 'Chemical reactions are classified by pattern: synthesis (A+B→AB), decomposition (AB→A+B), single displacement (A+BC→AC+B), double displacement (AB+CD→AD+CB), and combustion (fuel+O₂→CO₂+H₂O). Recognizing reaction types enables prediction of products. Redox reactions involve electron transfer and underlie electrochemistry and biochemistry.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-balancing-equations', description: 'Reaction types predict the form of the balanced equation' },
    { type: 'dependency', targetId: 'chem-oxidation-reduction', description: 'Many reaction types involve oxidation-reduction as their driving mechanism' },
  ],
  complexPlanePosition: { real: 0.65, imaginary: 0.4, magnitude: Math.sqrt(0.4225 + 0.16), angle: Math.atan2(0.4, 0.65) },
};
