import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const ratioAnalysis: RosettaConcept = {
  id: 'stat-ratio-analysis',
  name: 'Financial Ratio Analysis',
  domain: 'statistics',
  description:
    'Financial ratios transform raw financial statement numbers into meaningful comparisons. ' +
    'Liquidity ratios (current ratio) measure ability to pay short-term obligations. ' +
    'Profitability ratios (ROE, net margin) measure earnings efficiency. ' +
    'Leverage ratios (debt-to-equity) measure financial risk. ' +
    'Ratios are most useful when compared over time (trend analysis) or against industry benchmarks.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-balance-sheet',
      description: 'Liquidity and leverage ratios are calculated from balance sheet figures',
    },
    {
      type: 'dependency',
      targetId: 'stat-income-statement',
      description: 'Profitability ratios are calculated from income statement figures',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.3025 + 0.36),
    angle: Math.atan2(0.6, 0.55),
  },
};
