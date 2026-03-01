import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const safeStorageTimes: RosettaConcept = {
  id: 'cook-safe-storage-times',
  name: 'Safe Storage Times',
  domain: 'culinary-arts',
  description: 'Safe storage guidelines define how long food remains safe at given temperatures. ' +
    'Refrigerator (40F/4C): raw poultry 1-2 days, raw ground meat 1-2 days, raw whole cuts 3-5 ' +
    'days, cooked leftovers 3-4 days, opened deli meats 3-5 days. Freezer (0F/-18C): poultry ' +
    '9-12 months, ground meat 3-4 months, whole cuts 4-12 months. Commercially canned goods are ' +
    'shelf-stable for 2-5 years when stored in cool, dry conditions. The 2-hour rule: cooked food ' +
    'must be refrigerated within 2 hours of preparation -- divide large batches into shallow ' +
    'containers for faster cooling. When in doubt, throw it out: foodborne illness costs far more ' +
    'than wasted food.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cook-temperature-danger-zone',
      description: 'Storage times are defined by how long food can remain outside the danger zone safely',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-pantry-management',
      description: 'Storage time knowledge informs FIFO rotation and expiration date decisions',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: -0.4,
    magnitude: Math.sqrt(0.64 + 0.16),
    angle: Math.atan2(-0.4, 0.8),
  },
};
