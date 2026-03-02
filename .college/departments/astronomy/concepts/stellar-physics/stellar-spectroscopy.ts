import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const stellarSpectroscopy: RosettaConcept = {
  id: 'astro-stellar-spectroscopy',
  name: 'Stellar Spectroscopy',
  domain: 'astronomy',
  description:
    'Spectroscopy is the study of how matter interacts with light at different wavelengths, ' +
    'and it is how astronomers know everything about distant stars without visiting them. ' +
    'When starlight is passed through a prism or diffraction grating, absorption lines appear ' +
    'at wavelengths where specific elements absorb photons (Fraunhofer lines). ' +
    'Each element has a unique spectral fingerprint: hydrogen\'s Balmer series (656nm, 486nm, etc.) ' +
    'is the dominant absorption in most stars. ' +
    'Stellar classification (OBAFGKM, hottest to coolest): O stars are blue and hot (30,000K+), ' +
    'G stars are yellow (Sun = G2V, 5778K), M stars are red and cool (3500K). ' +
    'Doppler shift: if a star moves toward us, spectral lines shift blue (blueshift); ' +
    'away, they shift red (redshift). This reveals radial velocity, enabling binary star ' +
    'detection, planet detection via the radial velocity method, and measurement of galactic recession.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'astro-stellar-physics',
      description: 'Spectroscopy is the observational foundation of stellar physics',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};
