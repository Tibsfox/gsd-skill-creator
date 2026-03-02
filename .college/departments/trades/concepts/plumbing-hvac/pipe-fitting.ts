import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const pipeFitting: RosettaConcept = {
  id: 'trade-pipe-fitting',
  name: 'Pipe Fitting',
  domain: 'trades',
  description:
    'Pipe fitting covers selecting materials, cutting, and joining pipes for water supply, ' +
    'drain-waste-vent (DWV), and gas systems. Common pipe materials: copper (soldered joints, ' +
    'corrosion-resistant, expensive), PEX (flexible cross-linked polyethylene — crimp or clamp ' +
    'fittings, freeze-tolerant, easy to work with), CPVC (rigid plastic for hot/cold supply, ' +
    'cement-joined), PVC (DWV only — white, glued), ABS (black DWV plastic, common in western ' +
    'US). Soldering copper: clean pipe and fitting with emery cloth and flux brush; apply flux; ' +
    'heat fitting (not pipe) until solder flows into joint via capillary action; wipe excess. ' +
    'Compression fittings (no heat required): nut, compression ring (ferrule), and fitting body ' +
    '— good for repairs and shutoffs. Pipe sizing: supply lines 1/2" - 3/4" for branches and ' +
    'mains; DWV sizing by fixture units. Slope for DWV: 1/4" per foot minimum for horizontal ' +
    'drains to maintain self-cleaning flow velocity.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'trade-plumbing-basics',
      description: 'Pipe fitting is the hands-on skill application of plumbing basics principles',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
