import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const telescopeBasics: RosettaConcept = {
  id: 'astro-telescope-basics',
  name: 'Telescope Basics',
  domain: 'astronomy',
  description:
    'Telescopes collect and focus light to reveal faint or distant objects. Three optical designs: ' +
    'refractors (lens objective — sharp, maintenance-free, best for planets and Moon; chromatic ' +
    'aberration in lower-quality versions); reflectors (mirror objective — Newtonian, Dobsonian; ' +
    'larger aperture for price; requires occasional collimation); catadioptric (Schmidt-Cassegrain, ' +
    'Maksutov — compact folded optics; versatile for visual and imaging). Key specifications: ' +
    'aperture (diameter of objective — determines light gathering and resolving power; larger is ' +
    'better); focal length (determines magnification with a given eyepiece; f/ratio affects field ' +
    'of view); magnification = focal length ÷ eyepiece focal length. Maximum useful magnification ' +
    '≈ 50× per inch of aperture; excess magnification produces a dim, blurry image. Dark adaptation ' +
    'takes 20-30 minutes — red lights preserve night vision. Telescope mounts: alt-azimuth (simple, ' +
    'intuitive) vs. equatorial (polar-aligned, tracks sky rotation; essential for photography).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'astro-constellation-navigation',
      description: 'Using a telescope effectively requires first knowing how to find objects by learning the sky',
    },
    {
      type: 'cross-reference',
      targetId: 'phys-waves-sound-light',
      description: 'Telescope optics apply the physics of light refraction, reflection, and diffraction',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.5625 + 0.0625),
    angle: Math.atan2(0.25, 0.75),
  },
};
