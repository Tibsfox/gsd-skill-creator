import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const scarcityTradeoffs: RosettaConcept = {
  id: 'econ-scarcity-tradeoffs',
  name: 'Scarcity and Trade-offs',
  domain: 'economics',
  description: 'Scarcity is the fundamental economic problem: unlimited wants meet limited resources, forcing choices. ' +
    'Every resource -- time, money, land, labor, capital -- exists in limited supply. ' +
    'Trade-off: choosing one option means giving up another. Getting more of X requires giving up some Y. ' +
    'The production possibilities frontier (PPF): a graph showing the maximum combinations of two goods an economy can produce. ' +
    'Points inside the PPF: inefficiency (unused resources). Points on the PPF: efficiency. Points outside: currently impossible. ' +
    'Economic growth shifts the PPF outward -- more productive, or more resources. ' +
    'Individual trade-offs: more sleep vs. more study; more consumption now vs. more savings (future consumption). ' +
    'Scarcity applies to time absolutely -- everyone has 24 hours. How you spend your time IS your life strategy.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'log-decision-making',
      description: 'Trade-off analysis is applied decision logic -- evaluating options under resource constraints',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
