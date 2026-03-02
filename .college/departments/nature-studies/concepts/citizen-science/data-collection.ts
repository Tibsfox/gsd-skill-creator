import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const dataCollection: RosettaConcept = {
  id: 'nature-data-collection',
  name: 'Field Data Collection',
  domain: 'nature-studies',
  description:
    'Rigorous field data collection transforms casual observation into scientific evidence. ' +
    'Core principles: standardized protocols (same method every time), spatial precision (GPS ' +
    'coordinates or mapped grid points), temporal metadata (date, time, weather conditions), ' +
    'and observer bias minimization. Transect surveys count organisms along a fixed-length line ' +
    'at regular intervals. Point counts record all individuals seen or heard from a stationary ' +
    'position within a set radius and time. Quadrat sampling uses defined area plots for plant ' +
    'or invertebrate density estimates. Datasheets should be designed before fieldwork: columns ' +
    'for all variables, codes for common taxa, and space for anomalies. Digital tools (field ' +
    'tablets, eBird app, Survey123) reduce transcription errors. Quality control requires duplicate ' +
    'observers, regular calibration checks, and documented data cleaning decisions.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nature-citizen-science',
      description: 'Citizen science projects require standardized data collection methods to produce usable scientific data',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.5625 + 0.0625),
    angle: Math.atan2(0.25, 0.75),
  },
};
