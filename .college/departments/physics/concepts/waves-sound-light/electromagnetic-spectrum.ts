import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const electromagneticSpectrum: RosettaConcept = {
  id: 'phys-electromagnetic-spectrum',
  name: 'Electromagnetic Spectrum',
  domain: 'physics',
  description:
    'The electromagnetic spectrum encompasses all types of light: radio waves, microwaves, infrared, ' +
    'visible light, ultraviolet, X-rays, and gamma rays. All travel at c (3×10⁸ m/s) in vacuum. ' +
    'They differ in frequency and wavelength -- and therefore in energy and interactions with matter. ' +
    'This diversity of electromagnetic radiation enables radar, medical imaging, communications, and astronomy.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-wave-properties',
      description: 'Electromagnetic waves share the fundamental wave properties of frequency, wavelength, and speed',
    },
    {
      type: 'dependency',
      targetId: 'phys-optics',
      description: 'Visible light optics is the specialized study of the electromagnetic spectrum we can see',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.3025 + 0.3025),
    angle: Math.atan2(0.55, 0.55),
  },
};
