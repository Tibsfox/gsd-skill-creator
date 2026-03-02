import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const isotopesRadioactivity: RosettaConcept = {
  id: 'chem-isotopes-radioactivity',
  name: 'Isotopes & Radioactivity',
  domain: 'chemistry',
  description: 'Isotopes are atoms of the same element with different numbers of neutrons (same atomic number, different mass). Radioactive isotopes have unstable nuclei that decay by emitting alpha particles, beta particles, or gamma rays. Half-life is the time for half a sample to decay. Radioisotopes have applications in medical imaging, cancer treatment, and carbon dating.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-atomic-structure', description: 'Isotopes differ only in neutron count; their chemistry is nearly identical' },
    { type: 'cross-reference', targetId: 'phys-nuclear-physics', description: 'Nuclear physics explains the mechanisms and energetics of radioactive decay' },
  ],
  complexPlanePosition: { real: 0.4, imaginary: 0.7, magnitude: Math.sqrt(0.16 + 0.49), angle: Math.atan2(0.7, 0.4) },
};
