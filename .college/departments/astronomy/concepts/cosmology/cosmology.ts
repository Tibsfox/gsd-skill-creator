import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const cosmology: RosettaConcept = {
  id: 'astro-cosmology',
  name: 'Cosmology',
  domain: 'astronomy',
  description:
    'Cosmology is the science of the origin, structure, and evolution of the universe. ' +
    'The Big Bang model: the universe originated ~13.8 billion years ago from an extremely hot, ' +
    'dense state and has been expanding ever since. Evidence: Hubble\'s law (galaxies recede ' +
    'proportional to distance), cosmic microwave background (CMB -- thermal echo of early universe ' +
    'at 380,000 years after Big Bang), and Big Bang nucleosynthesis (predicted H:He ratio matches observed). ' +
    'The observable universe is a sphere 46 billion light-years in radius (light travel time is only ' +
    '13.8 billion years due to space expansion itself). ' +
    'Dark matter (~27% of total energy): inferred from galaxy rotation curves, gravitational lensing, ' +
    'and structure formation; composition unknown. ' +
    'Dark energy (~68%): drives accelerating expansion; discovered 1998 from Type Ia supernovae distances; ' +
    'possibly Einstein\'s cosmological constant. ' +
    'The fate of the universe depends on dark energy density: continued expansion toward heat death appears most likely.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'phys-modern-physics',
      description: 'Cosmology tests general relativity and quantum field theory at extreme scales',
    },
  ],
  complexPlanePosition: {
    real: 0.2,
    imaginary: 0.9,
    magnitude: Math.sqrt(0.04 + 0.81),
    angle: Math.atan2(0.9, 0.2),
  },
};
