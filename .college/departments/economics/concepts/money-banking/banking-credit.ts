import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const bankingCredit: RosettaConcept = {
  id: 'econ-banking-credit',
  name: 'Banking and Credit Creation',
  domain: 'economics',
  description: 'Banks do more than store money -- they create it through the process of lending. ' +
    'Fractional reserve banking: banks hold only a fraction (reserve requirement) of deposits and lend the rest. ' +
    'Money multiplier: 1/reserve requirement. With 10% reserves, $1,000 deposit → up to $10,000 in new money created. ' +
    'Credit: borrowing present spending power in exchange for future repayment with interest. ' +
    'Interest rate: the price of credit. Determined by supply of loanable funds (savings) and demand (borrowing). ' +
    'Central banks (Federal Reserve, ECB): set policy interest rates, control money supply, lend to banks (lender of last resort). ' +
    'Bank runs: if everyone tries to withdraw simultaneously, even solvent banks fail -- the basis of systemic risk. ' +
    'Deposit insurance (FDIC): government backstop that prevents bank runs by guaranteeing deposits. ' +
    'Credit scores: mechanisms for solving information asymmetry in lending markets.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'econ-money-functions',
      description: 'Banking creates money through lending -- you need to understand what money is before seeing how banks multiply it',
    },
    {
      type: 'cross-reference',
      targetId: 'econ-market-failures',
      description: 'Banking crises are market failures -- information asymmetry, systemic risk, and moral hazard combine to produce financial instability',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};
