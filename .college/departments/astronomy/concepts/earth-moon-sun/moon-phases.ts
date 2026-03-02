import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const moonPhases: RosettaConcept = {
  id: 'astro-moon-phases',
  name: 'Moon Phases',
  domain: 'astronomy',
  description:
    'Moon phases result from the changing geometry between Earth, Moon, and Sun as the ' +
    'Moon orbits Earth every 29.5 days (synodic period). New Moon: Moon between Earth and Sun, ' +
    'dark side toward us, not visible. Waxing crescent: thin lit sliver grows. First quarter: ' +
    'half lit, rises at noon, sets at midnight. Waxing gibbous: more than half lit, growing. ' +
    'Full Moon: Earth between Moon and Sun, fully lit, rises at sunset, sets at sunrise. ' +
    'Waning gibbous, last quarter, waning crescent follow. ' +
    'Common misconception: we see phases because of Earth\'s shadow -- FALSE. Phases result from ' +
    'viewing angle; Earth\'s shadow causes lunar eclipses only at full moon when alignment is precise. ' +
    'The Moon keeps the same face toward Earth (synchronous rotation / tidal locking): ' +
    'the Moon rotates exactly once per orbit, so the far side was unknown until spacecraft. ' +
    'Tidal forces slow planetary rotation over time, eventually tidally locking natural satellites.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'astro-earth-sky-geometry',
      description: 'Moon phases require understanding the geometry of the Earth-Moon-Sun system',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.25 + 0.16),
    angle: Math.atan2(0.4, 0.5),
  },
};
