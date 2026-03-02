import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const debtCredit: RosettaConcept = {
  id: 'econ-debt-credit',
  name: 'Debt and Credit Management',
  domain: 'economics',
  description: 'Debt is borrowed purchasing power -- useful when productive, dangerous when excessive. ' +
    'Interest rates and APR: the annual percentage rate is the true cost of borrowing -- compare APRs, not monthly payments. ' +
    'Credit card debt: if you carry a balance, credit cards charge 15-30% APR -- the highest common interest rate. ' +
    'Good debt vs. bad debt: mortgages and student loans can build assets or human capital. Consumer debt on depreciating goods rarely does. ' +
    'Credit scores (FICO): 300-850, based on payment history (35%), amounts owed (30%), length of history (15%), new credit (10%), mix (10%). ' +
    'Debt avalanche method: pay minimum on all debts, extra on highest-interest debt first -- mathematically optimal. ' +
    'Debt snowball method: pay smallest balance first regardless of interest rate -- psychologically effective for some people. ' +
    'Leverage: borrowing to invest amplifies both gains and losses. A 10% loss on a 10x leveraged position = 100% loss. ' +
    'Bankruptcy: legal process for discharging unsustainable debt -- severe credit consequences lasting 7-10 years.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'econ-budgeting-saving',
      description: 'Debt management is budgeting under constraint -- interest payments are a fixed expense that reduces available income',
    },
    {
      type: 'cross-reference',
      targetId: 'econ-banking-credit',
      description: 'Personal debt is the household side of what banks create -- credit creation at the macro level becomes personal debt at the micro level',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
