import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const eclipses: RosettaConcept = {
  id: 'astro-eclipses',
  name: 'Eclipses',
  domain: 'astronomy',
  description:
    'Eclipses occur when three bodies align: solar eclipses when the Moon passes between Earth ' +
    'and Sun; lunar eclipses when Earth\'s shadow falls on the Moon. Solar eclipse geometry: the ' +
    'umbra (total shadow cone) touches Earth\'s surface in a narrow path of totality (max width ' +
    '~270 km); the penumbra creates a wider zone of partial eclipse. Totality exposes the solar ' +
    'corona — the Sun\'s outer atmosphere — and allows daytime stars. Lunar eclipses (penumbral, ' +
    'partial, total) are visible from the entire night-side hemisphere simultaneously. The Saros ' +
    'cycle (18 years, 11 days, 8 hours): the periodicity of eclipse repetition due to the ' +
    'commensurability of the synodic, anomalistic, and draconic months. Eclipses don\'t occur ' +
    'every month because the Moon\'s orbit is inclined 5.1° to the ecliptic — alignment requires ' +
    'the Moon near a node. Safe solar observation requires eclipse glasses (ISO 12312-2 certified), ' +
    'a pinhole projector, or solar filters — the brief diamond-ring/Baily\'s beads phase requires ' +
    'rapid filter removal.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'astro-moon-phases',
      description: 'Eclipses are special cases of Moon phase geometry occurring when orbital alignment is nearly perfect',
    },
    {
      type: 'analogy',
      targetId: 'astro-earth-sky-geometry',
      description: 'Eclipse prediction requires the same spherical geometry principles used in earth-sky geometry',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.4225 + 0.1225),
    angle: Math.atan2(0.35, 0.65),
  },
};
