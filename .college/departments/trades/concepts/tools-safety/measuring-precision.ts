import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const measuringPrecision: RosettaConcept = {
  id: 'trade-measuring-precision',
  name: 'Measuring and Precision',
  domain: 'trades',
  description:
    'In trades, measurement precision determines whether parts fit, structures are level, ' +
    'and projects succeed. Measure twice, cut once is the foundational rule. ' +
    'Tools: tape measure (read from the hook, account for hook float), combination square ' +
    '(checks 90° and 45° simultaneously), level (bubble centered indicates plumb or level), ' +
    'marking gauge (scribes parallel line at fixed distance from edge), chalk line (long straight lines). ' +
    'Reading fractions on a tape measure: each inch is divided into halves, quarters, eighths, ' +
    'and sixteenths -- the marks decrease in height as denomination increases. ' +
    'Converting measurements: 1 board foot = 144 cubic inches of lumber. ' +
    'Tolerances: furniture joinery requires 1/32" accuracy; rough framing tolerates 1/4". ' +
    'Marking: always mark the waste side of a cut line to prevent cutting the piece short. ' +
    'The story stick technique (recording measurements as marks on a stick rather than numbers) ' +
    'eliminates transcription errors for repetitive cuts.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'trade-tool-safety',
      description: 'Precision measurement precedes cutting -- mistakes happen before the blade is on',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.36 + 0.04),
    angle: Math.atan2(0.2, 0.6),
  },
};
