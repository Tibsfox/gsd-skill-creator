import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const citizenScience: RosettaConcept = {
  id: 'nature-citizen-science',
  name: 'Citizen Science',
  domain: 'nature-studies',
  description:
    'Citizen science engages non-professional observers in systematic data collection ' +
    'that contributes to scientific research. iNaturalist allows recording of any organism ' +
    'observation (photo + location + date) that computer vision and expert review then ' +
    'identifies to species; millions of records map biodiversity at unprecedented scale. ' +
    'eBird (Cornell Lab of Ornithology) collects bird observation data from millions of ' +
    'birders; the resulting dataset tracks species population trends, range shifts, and ' +
    'migration timing across decades. Phenology networks monitor first bloom, first leaf-out, ' +
    'first frog call, and first swallow return each spring -- detecting climate-driven shifts. ' +
    'Data quality in citizen science requires protocols: standardized observation methods, ' +
    'effort reporting (how long did you look), and quality control by expert reviewers. ' +
    'Citizen scientists have discovered new species, detected population crashes before professionals, ' +
    'and provided data impossible to collect any other way.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nature-outdoor-observation',
      description: 'Citizen science applies outdoor observation skills to systematic data collection',
    },
    {
      type: 'dependency',
      targetId: 'nature-bird-identification',
      description: 'eBird citizen science requires accurate bird identification skills',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
