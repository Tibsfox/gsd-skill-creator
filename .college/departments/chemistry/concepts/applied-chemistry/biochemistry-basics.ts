import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const biochemistryBasics: RosettaConcept = {
  id: 'chem-biochemistry-basics',
  name: 'Biochemistry Basics',
  domain: 'chemistry',
  description: 'Biochemistry applies chemical principles to living systems. The four biomolecule families: carbohydrates (energy storage, structure), lipids (membranes, energy), proteins (enzymes, structure, signaling), and nucleic acids (genetic information). Enzyme catalysis, ATP as energy currency, and metabolic pathways (glycolysis, Krebs cycle) are central biochemical topics.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-polymers', description: 'Proteins and nucleic acids are biological polymers with specific sequence-dependent functions' },
    { type: 'dependency', targetId: 'chem-thermochemistry', description: 'Metabolic reactions are thermochemically driven, releasing or capturing free energy' },
  ],
  complexPlanePosition: { real: 0.5, imaginary: 0.65, magnitude: Math.sqrt(0.25 + 0.4225), angle: Math.atan2(0.65, 0.5) },
};
