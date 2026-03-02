import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const powerTools: RosettaConcept = {
  id: 'trade-power-tools',
  name: 'Power Tools',
  domain: 'trades',
  description:
    'Power tools multiply productivity but demand strict safety discipline. Circular saw ' +
    'fundamentals: blade selection (tooth count and geometry for rip vs. crosscut vs. sheet ' +
    'goods); blade depth (no more than 1/8" deeper than material); using a rip fence or ' +
    'straightedge guide for accuracy; kickback prevention (never pinch the blade, keep the ' +
    'shoe flat on the material). Drill/driver: drill bits vs. driver bits; torque clutch ' +
    'settings to prevent overdriving fasteners; hammer drill vs. rotary hammer for masonry. ' +
    'Router: bit selection (straight, roundover, chamfer, flush-trim); climb cutting vs. ' +
    'conventional cuts for edge control; template and fence setups. Universal safety rules: ' +
    'disconnect power before changing blades/bits; eye and ear protection for all power tool ' +
    'use; secure the workpiece before cutting; no loose clothing or jewelry; know where the ' +
    'blade/bit exits and never place hands in that path. Corded vs. cordless: corded tools ' +
    'provide consistent power; modern brushless cordless tools approach corded performance for ' +
    'most tasks.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'trade-tool-safety',
      description: 'Power tools are the highest-risk category within general tool safety principles',
    },
    {
      type: 'analogy',
      targetId: 'trade-measuring-precision',
      description: 'Accurate measuring is prerequisite to power tool use — cut marks should be verified before cutting',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
