import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const topographicReading: RosettaConcept = {
  id: 'geo-topographic-reading',
  name: 'Topographic Map Reading',
  domain: 'geography',
  description:
    'Topographic maps represent three-dimensional terrain on a two-dimensional surface using contour lines, ' +
    'each connecting points of equal elevation. Reading contours reveals slope steepness, valleys, ridges, ' +
    'peaks, and drainage patterns. Topographic skills are foundational for outdoor navigation, military operations, ' +
    'civil engineering, and understanding how terrain shapes human activity and settlement.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-map-types-projections',
      description: 'Topographic maps are a specialized map type requiring understanding of scale and symbology',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.64 + 0.0625),
    angle: Math.atan2(0.25, 0.8),
  },
};
