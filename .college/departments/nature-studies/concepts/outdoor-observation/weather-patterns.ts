import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const weatherPatterns: RosettaConcept = {
  id: 'nature-weather-patterns',
  name: 'Weather Patterns',
  domain: 'nature-studies',
  description:
    'Reading local weather requires interpreting sky conditions, wind, and atmospheric pressure ' +
    'to anticipate short-term changes. Cloud types provide key signals: cumulus clouds with ' +
    'vertical development indicate afternoon thunderstorm potential; cirrus streaks at high altitude ' +
    'often precede frontal systems by 12-24 hours; stratus layers indicate stable, damp air. ' +
    'Wind direction shifts signal approaching fronts: backing winds (clockwise to counterclockwise) ' +
    'often precede deteriorating weather. Barometric pressure trends matter more than absolute value: ' +
    'rapid drops (more than 3 hPa/hr) signal incoming storms. Local topographic effects include ' +
    'valley fog, orographic lift (rain on windward mountain slopes), and cold air drainage. ' +
    'Traditional phenological indicators (swallows flying low, cattle lying down before rain) have ' +
    'partial empirical support. Weather journals recording daily conditions build pattern recognition.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nature-outdoor-observation',
      description: 'Weather reading is a field observation skill applied systematically to atmospheric conditions',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.4225 + 0.1225),
    angle: Math.atan2(0.35, 0.65),
  },
};
