import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const sewingBasics: RosettaConcept = {
  id: 'domestic-sewing-basics',
  name: 'Sewing Basics',
  domain: 'home-economics',
  description:
    'Sewing skills range from basic hand stitching for repairs to machine operation for garment ' +
    'construction. Essential hand stitches: running stitch (simple in-and-out basting), backstitch ' +
    '(strong, continuous seam), slip stitch (invisible hem joining), and blanket stitch (edge ' +
    'finishing). Sewing machine fundamentals: threading upper and lower (bobbin) paths correctly; ' +
    'setting stitch length (2-3mm standard, shorter for curves); seam allowance (typically 1.5cm/5/8" ' +
    'in garment patterns); backstitching at start and end to secure. Garment repair applications: ' +
    'replacing missing buttons (four-hole square or diagonal patterns, shank buttons), mending ' +
    'seam splits (turn inside out, sew parallel to original seam), patching worn areas with ' +
    'matching or decorative fabric (Japanese sashiko visible mending). Pattern reading involves ' +
    'understanding grain lines (parallel to selvage), cutting on fold, and transferring notches. ' +
    'Pressing (ironing seams open or to one side as you sew) is as important as stitching for ' +
    'professional results.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'domestic-clothing-care',
      description: 'Sewing skills enable repair and alteration of clothing, extending the garment life covered in clothing care',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
