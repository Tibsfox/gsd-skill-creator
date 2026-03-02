import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const investingBasics: RosettaConcept = {
  id: 'stat-investing-basics',
  name: 'Investing Basics',
  domain: 'statistics',
  description:
    'Investing allocates money to assets expected to grow in value or generate income. ' +
    'Asset classes: stocks (ownership), bonds (loans), real estate, and cash equivalents. ' +
    'Diversification reduces risk by spreading investments — "don\'t put all eggs in one basket." ' +
    'Index funds offer low-cost exposure to broad markets. ' +
    'Risk-return tradeoff: higher expected returns require accepting higher volatility. ' +
    'Time horizon is the most important factor — long-horizon investors can weather short-term volatility.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-compound-interest',
      description: 'Investment returns compound over time — this is the mathematical foundation of wealth accumulation',
    },
    {
      type: 'dependency',
      targetId: 'stat-expected-value-risk',
      description: 'Investment decisions require estimating expected returns and acceptable risk levels',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.25 + 0.5625),
    angle: Math.atan2(0.75, 0.5),
  },
};
