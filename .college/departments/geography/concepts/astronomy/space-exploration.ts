import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const spaceExploration: RosettaConcept = {
  id: 'geo-space-exploration',
  name: 'Space Exploration',
  domain: 'geography',
  description:
    'Space exploration extends human knowledge beyond Earth through robotic probes, telescopes, and crewed missions. ' +
    'Key milestones: Sputnik (1957), Moon landings (1969), Mars rovers, the Hubble Space Telescope, and the ISS. ' +
    'Space exploration has produced practical technologies (GPS, weather satellites, materials), astronomical discoveries, ' +
    'and ongoing challenges in propulsion, life support, and international cooperation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-solar-system',
      description: 'Space exploration missions are organized around targets within the solar system',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.2025 + 0.49),
    angle: Math.atan2(0.7, 0.45),
  },
};
