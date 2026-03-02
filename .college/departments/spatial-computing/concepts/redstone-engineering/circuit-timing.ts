import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const circuitTiming: RosettaConcept = {
  id: 'spatial-circuit-timing',
  name: 'Redstone Circuit Timing',
  domain: 'spatial-computing',
  description:
    'Redstone timing is measured in "ticks" -- 1 Redstone tick = 0.1 seconds (10 game ticks per second). ' +
    'Repeaters introduce delay: right-clicking cycles through 1, 2, 3, or 4 tick delays. ' +
    'A repeater at 1 tick delays the signal by 0.1 seconds; 4 ticks = 0.4 seconds. ' +
    'Clock circuits produce repeating pulses: a 5-clock uses one repeater at 4 ticks in a loop, ' +
    'giving a period of 10 ticks (1 second). Monostable circuits (one-shot): a button triggers a ' +
    'single pulse of controlled duration regardless of how long the input is held. ' +
    'Comparators detect container fill levels: a chest half-full outputs signal strength 7. ' +
    'Comparator in subtraction mode: output = input A signal - input B signal (useful for ' +
    'threshold detection). Timing synchronization matters for multi-stage piston doors -- ' +
    'all piston movements must complete before the next sequence begins.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'spatial-signal-propagation',
      description: 'Signal strength and propagation rules affect timing calculations in repeater chains',
    },
    {
      type: 'dependency',
      targetId: 'spatial-automated-farms',
      description: 'Clock circuits drive the timing of automated farm mechanisms like piston-powered tree farms',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.55 ** 2 + 0.55 ** 2),
    angle: Math.atan2(0.55, 0.55),
  },
};
