/**
 * Economics Department Definition
 *
 * Defines the CollegeDepartment object for the economics department,
 * including all 5 wings derived from ECON-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/economics/economics-department
 */

import type {
  CollegeDepartment,
  DepartmentWing,
  TrySession,
  TokenBudgetConfig,
  CalibrationModel,
  RosettaConcept,
} from '../../rosetta-core/types.js';
import type { CollegeLoader } from '../../college/college-loader.js';

// ─── Wing Definitions ───────────────────────────────────────────────────────

const scarcityChoiceWing: DepartmentWing = {
  id: 'scarcity-choice',
  name: 'Scarcity & Economic Thinking',
  description:
    'Economics begins with scarcity: resources are finite and every choice involves ' +
    'trade-offs. Covers wants vs. needs, opportunity cost, marginal thinking, and ' +
    'how economic reasoning applies to personal and community decisions.',
  concepts: [], // Populated in Task 2
};

const marketsExchangeWing: DepartmentWing = {
  id: 'markets-exchange',
  name: 'Markets & Exchange',
  description:
    'How markets coordinate economic activity through price mechanisms. Supply and demand, ' +
    'market structures from perfect competition to monopoly, and market failures including ' +
    'externalities, public goods, and information asymmetry.',
  concepts: [], // Populated in Task 2
};

const moneyBankingWing: DepartmentWing = {
  id: 'money-banking',
  name: 'Money & Banking',
  description:
    'Currency as medium of exchange, store of value, and unit of account. Fractional ' +
    'reserve banking, the role of central banks, interest rates as the price of money, ' +
    'and inflation\'s effect on purchasing power.',
  concepts: [], // Populated in Task 2
};

const personalFinanceWing: DepartmentWing = {
  id: 'personal-finance',
  name: 'Personal Finance',
  description:
    'Practical financial literacy: budgeting across income levels, the power of compound ' +
    'interest and early saving, investing fundamentals including diversification and index ' +
    'funds, and building and protecting a credit score.',
  concepts: [], // Populated in Task 2
};

const economicSystemsWing: DepartmentWing = {
  id: 'economic-systems',
  name: 'Economic Systems & Policy',
  description:
    'Macroeconomic analysis: GDP as economic output measure, types of unemployment, ' +
    'fiscal policy tools of government spending and taxation, and how comparative ' +
    'advantage explains why specialization and trade benefit all parties.',
  concepts: [], // Populated in Task 2
};

// ─── Token Budget ───────────────────────────────────────────────────────────

const tokenBudget: TokenBudgetConfig = {
  summaryLimit: 3000,
  activeLimit: 12000,
  deepLimit: 50000,
};

// ─── Department Definition ──────────────────────────────────────────────────

/**
 * The Economics department -- 5 wings of economic thinking and personal finance.
 *
 * Wings progress from individual scarcity and choice through market mechanics,
 * money systems, personal financial literacy, and macroeconomic policy.
 */
export const economicsDepartment: CollegeDepartment = {
  id: 'economics',
  name: 'Economics & Personal Finance',
  wings: [
    scarcityChoiceWing,
    marketsExchangeWing,
    moneyBankingWing,
    personalFinanceWing,
    economicSystemsWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in Task 2
  calibrationModels: [] as CalibrationModel[], // Quantitative models populated in Task 2
  trySessions: [] as TrySession[], // Populated in Task 2
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the economics department with a CollegeLoader.
 *
 * CollegeLoader auto-discovers departments via DEPARTMENT.md on the filesystem.
 * This function provides a programmatic registration hook for future loader integration.
 */
export function registerEconomicsDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
  // This function provides a programmatic registration hook for future use.
}
