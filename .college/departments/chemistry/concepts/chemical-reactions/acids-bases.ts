import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const acidsBases: RosettaConcept = {
  id: 'chem-acids-bases',
  name: 'Acids, Bases & pH',
  domain: 'chemistry',
  description: 'Acids donate protons (H⁺); bases accept them (Bronsted-Lowry definition). pH measures acidity on a logarithmic scale: pH 7 is neutral, below 7 is acidic, above 7 is basic. Neutralization reactions combine acids and bases to form water and a salt. Buffers resist pH changes and are critical in biological systems.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-reaction-types', description: 'Acid-base neutralization is a type of double displacement reaction' },
  ],
  complexPlanePosition: { real: 0.7, imaginary: 0.35, magnitude: Math.sqrt(0.49 + 0.1225), angle: Math.atan2(0.35, 0.7) },
};
