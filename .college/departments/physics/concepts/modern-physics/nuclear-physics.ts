import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const nuclearPhysics: RosettaConcept = {
  id: 'phys-nuclear-physics',
  name: 'Nuclear Physics',
  domain: 'physics',
  description:
    'The nucleus contains protons and neutrons held by the strong nuclear force. Radioactive decay ' +
    '(alpha, beta, gamma) occurs when nuclei are unstable. Fission splits heavy nuclei releasing energy ' +
    '(nuclear power, atomic weapons); fusion combines light nuclei releasing even more energy (stars, ' +
    'fusion research). Half-life describes the statistical rate of decay for a radioactive sample.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-quantum-basics',
      description: 'Nuclear models and radioactive decay are explained by quantum mechanical principles',
    },
    {
      type: 'cross-reference',
      targetId: 'chem-isotopes-radioactivity',
      description: 'Chemistry and physics share the study of isotopes, radioactive decay, and nuclear reactions',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.85,
    magnitude: Math.sqrt(0.09 + 0.7225),
    angle: Math.atan2(0.85, 0.3),
  },
};
