import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const gisSpatialAnalysis: RosettaConcept = {
  id: 'geo-gis-spatial-analysis',
  name: 'GIS & Spatial Analysis',
  domain: 'geography',
  description:
    'Geographic Information Systems (GIS) are software tools for capturing, storing, analyzing, and ' +
    'displaying spatial data as layered maps. GIS enables spatial analysis: finding patterns, relationships, ' +
    'and trends across geographic data. Applications include urban planning, epidemiology, environmental ' +
    'monitoring, and disaster response. Modern GIS skills are highly transferable across many technical careers.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-latitude-longitude',
      description: 'GIS data is georeferenced using coordinate systems built on latitude and longitude',
    },
    {
      type: 'dependency',
      targetId: 'geo-map-types-projections',
      description: 'GIS outputs require choosing appropriate projections for the spatial analysis task',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
