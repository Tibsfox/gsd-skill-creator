import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const capitalismMarketEconomy: RosettaConcept = {
  id: 'econ-capitalism-market-economy',
  name: 'Capitalism and Market Economies',
  domain: 'economics',
  description: 'Capitalism is an economic system characterized by private ownership of production, free markets, and profit-driven decisions. ' +
    'Key institutions: private property rights, voluntary exchange, price signals, profit motive, competition. ' +
    'Adam Smith\'s "invisible hand": self-interested actors pursuing profit can produce socially beneficial outcomes through market coordination. ' +
    'Creative destruction (Schumpeter): capitalism progresses through innovation destroying old industries and creating new ones. ' +
    'Varieties of capitalism: laissez-faire (minimal government), social market (welfare state + markets), state capitalism (government-guided markets). ' +
    'Inequalities in capitalism: markets efficiently allocate resources but do not ensure equitable distribution. ' +
    'Critique 1 (socialist): profit motive leads to exploitation and ignores social needs. ' +
    'Critique 2 (environmental): markets underprice ecological costs -- externalities require correction. ' +
    'Historical performance: market economies have produced unprecedented material prosperity and technological development.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'econ-market-structures',
      description: 'Understanding capitalism requires understanding how markets actually work and fail -- market structure analysis is the microeconomic foundation',
    },
    {
      type: 'cross-reference',
      targetId: 'econ-market-failures',
      description: 'Capitalism\'s strengths and weaknesses map directly to when markets work and when they fail',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};
