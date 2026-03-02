import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const fabricSelection: RosettaConcept = {
  id: 'domestic-fabric-selection',
  name: 'Fabric Selection',
  domain: 'home-economics',
  description:
    'Fabric selection requires understanding fiber content, weave structure, and care requirements. ' +
    'Natural fibers: cotton (breathable, washable, prone to shrinkage), linen (strong, breathable, ' +
    'wrinkles easily), wool (warm, moisture-wicking, requires gentle washing), silk (lustrous, ' +
    'delicate, dry-clean or cold hand wash). Synthetic fibers: polyester (durable, wrinkle-resistant, ' +
    'less breathable), nylon (strong, abrasion-resistant), acrylic (wool-like, pilling over time). ' +
    'Blends combine properties: cotton-polyester is more wrinkle-resistant than pure cotton. ' +
    'Weave structures: plain weave (simple, durable — muslin, canvas), twill (diagonal ribs, ' +
    'drape — denim, gabardine), satin (smooth surface, less durable — satin, charmeuse), knit ' +
    '(stretchy — jersey, rib knit). For sewing projects: match fabric stretch and drape to ' +
    'pattern requirements; use stabilizers (interfacing) for structure. Care label symbols follow ' +
    'international ISO standards for washing, drying, bleaching, and ironing.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'domestic-sewing-basics',
      description: 'Fabric selection knowledge is essential for choosing appropriate materials for sewing projects',
    },
    {
      type: 'analogy',
      targetId: 'domestic-clothing-care',
      description: 'Understanding fiber content underlies both fabric selection and proper clothing care and washing',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.3025 + 0.2025),
    angle: Math.atan2(0.45, 0.55),
  },
};
