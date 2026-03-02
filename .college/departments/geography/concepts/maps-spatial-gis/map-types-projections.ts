import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const mapTypesProjections: RosettaConcept = {
  id: 'geo-map-types-projections',
  name: 'Map Types & Projections',
  domain: 'geography',
  description:
    'Maps are representations of the spherical Earth on a flat surface — all projections distort either ' +
    'shape, area, distance, or direction. Common projections include Mercator (preserves direction, distorts area), ' +
    'Robinson (compromise), and equal-area projections. Understanding projection distortion is essential for ' +
    'correctly interpreting maps and recognizing how map choices can encode cultural or political bias.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-latitude-longitude',
      description: 'Map projections are mathematical transformations of the latitude-longitude coordinate system',
    },
  ],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.7225 + 0.0225),
    angle: Math.atan2(0.15, 0.85),
  },
};
