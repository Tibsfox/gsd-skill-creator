import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const plantPropagation: RosettaConcept = {
  id: 'nature-plant-propagation',
  name: 'Plant Propagation',
  domain: 'nature-studies',
  description:
    'Plant propagation encompasses both sexual (seed-based) and asexual (vegetative) reproduction ' +
    'methods. Seed saving requires understanding seed maturity cues, cleaning methods, and storage ' +
    'conditions (cool, dry, dark) for viability. Seed stratification simulates winter dormancy for ' +
    'species requiring cold before germination. Stem cuttings (softwood, semi-hardwood, hardwood) ' +
    'produce genetically identical clones — rooting hormone aids root initiation. Leaf cuttings ' +
    'work for succulents and some houseplants. Division splits multi-crown perennials at the root ' +
    'crown. Layering (pressing a stem into soil while still attached to the parent plant) is low-risk ' +
    'for woody plants. Grafting joins a scion (desired variety) to a rootstock (disease-resistant ' +
    'or dwarfing roots) — essential in commercial fruit production. Understanding which method suits ' +
    'which plant group is foundational for gardening, conservation propagation, and restoration.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nature-tree-identification',
      description: 'Tree and plant identification is prerequisite knowledge for choosing appropriate propagation methods per species',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
