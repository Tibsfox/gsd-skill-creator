import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const stellarPhysics: RosettaConcept = {
  id: 'astro-stellar-physics',
  name: 'Stellar Physics',
  domain: 'astronomy',
  description:
    'Stars are giant balls of plasma held together by gravity and powered by nuclear fusion. ' +
    'Main sequence stars fuse hydrogen to helium in their cores: ' +
    '4 protons -> 1 helium nucleus + energy (E = mc²; the 0.7% mass difference becomes energy). ' +
    'The Sun\'s core temperature is 15 million Kelvin; pressure + temperature enables ' +
    'quantum tunneling to overcome electromagnetic repulsion between protons. ' +
    'The Hertzsprung-Russell diagram plots stellar luminosity vs. surface temperature; ' +
    'most stars fall on the main sequence; giants, supergiants, and white dwarfs are evolutionary stages. ' +
    'Massive stars (> 8 solar masses) evolve faster and more violently: ' +
    'red supergiant -> core collapse -> supernova -> neutron star or black hole. ' +
    'Supernovae are the source of most elements heavier than iron -- we are made of star stuff. ' +
    'Solar mass stars: red giant phase (helium shell burning, outer envelope expands) -> ' +
    'planetary nebula (outer layers ejected) -> white dwarf (Earth-sized, cooling remnant).',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'phys-nuclear-physics',
      description: 'Nuclear fusion in stars is governed by the same physics as terrestrial nuclear reactions',
    },
    {
      type: 'dependency',
      targetId: 'astro-stellar-spectroscopy',
      description: 'Spectroscopy is the tool that makes stellar physics possible from a distance',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.16 + 0.49),
    angle: Math.atan2(0.7, 0.4),
  },
};
