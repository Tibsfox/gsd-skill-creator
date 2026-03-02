import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const intermolecularForces: RosettaConcept = {
  id: 'chem-intermolecular-forces',
  name: 'Intermolecular Forces',
  domain: 'chemistry',
  description: 'Intermolecular forces hold molecules together in condensed phases. London dispersion forces (all molecules), dipole-dipole interactions (polar molecules), and hydrogen bonding (F, O, or N bonded to H) increase in strength in that order. Stronger intermolecular forces mean higher boiling points and lower vapor pressure. These forces explain why water has an anomalously high boiling point.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-molecular-geometry', description: 'Molecular polarity from geometry determines which intermolecular forces are present' },
    { type: 'analogy', targetId: 'chem-ionic-bonding', description: 'Intermolecular forces are weaker than ionic or covalent bonds but determine bulk properties' },
  ],
  complexPlanePosition: { real: 0.45, imaginary: 0.7, magnitude: Math.sqrt(0.2025 + 0.49), angle: Math.atan2(0.7, 0.45) },
};
