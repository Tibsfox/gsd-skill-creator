import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const cardiovascularFitness: RosettaConcept = {
  id: 'pe-cardiovascular-fitness',
  name: 'Cardiovascular Fitness',
  domain: 'physical-education',
  description:
    'Cardiovascular fitness (cardiorespiratory endurance) is the ability of the heart, ' +
    'lungs, and blood vessels to deliver oxygen to working muscles during sustained activity. ' +
    'VO2 max (maximum oxygen consumption, mL/kg/min) is the gold standard measure of ' +
    'aerobic capacity. Resting heart rate is a proxy indicator: lower resting HR generally ' +
    'indicates better cardiovascular fitness. ' +
    'Cardiac output = stroke volume x heart rate. Training increases stroke volume ' +
    '(amount pumped per beat) through cardiac hypertrophy, lowering resting and exercise HR. ' +
    'Aerobic vs. anaerobic threshold: below the threshold, oxygen fully meets energy demands; ' +
    'above it, lactate accumulates faster than cleared -- the "burning" sensation marks this crossover. ' +
    'The talk test is a simple field measure: if you can hold a conversation comfortably, ' +
    'you are below aerobic threshold -- good for steady-state long-duration training.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'pe-fitness-training',
      description: 'Cardiovascular training is one of the primary applications of fitness training principles',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};
