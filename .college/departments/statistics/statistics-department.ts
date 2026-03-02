/**
 * Statistics Department Definition
 *
 * Defines the CollegeDepartment object for the statistics department,
 * including 5 wings derived from STAT-101 modules (Accounting & Statistics pack),
 * token budget configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/statistics/statistics-department
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

const accountingBookkeepingWing: DepartmentWing = {
  id: 'accounting-bookkeeping',
  name: 'Accounting Principles & Bookkeeping',
  description:
    'The foundations of financial record-keeping. ' +
    'Covers the accounting equation (Assets = Liabilities + Equity), ' +
    'double-entry bookkeeping, journal entries, ledgers, chart of accounts, ' +
    'and cash versus accrual accounting.',
  concepts: [], // Populated in Phase 23
};

const financialStatementsWing: DepartmentWing = {
  id: 'financial-statements',
  name: 'Financial Statements & Analysis',
  description:
    'Reading and interpreting the three core financial statements. ' +
    'Covers income statements, balance sheets, cash flow statements, ' +
    'how the three connect, financial ratios (liquidity, profitability, leverage), ' +
    'and distinguishing profit from cash flow.',
  concepts: [], // Populated in Phase 23
};

const probabilityWing: DepartmentWing = {
  id: 'probability',
  name: 'Probability & Randomness',
  description:
    'Understanding chance, uncertainty, and probabilistic reasoning. ' +
    'Covers experimental versus theoretical probability, expected value, ' +
    'conditional probability, independence, Bayes\' theorem basics, ' +
    'and common probability misconceptions.',
  concepts: [], // Populated in Phase 23
};

const statisticalAnalysisWing: DepartmentWing = {
  id: 'statistical-analysis',
  name: 'Statistical Analysis & Inference',
  description:
    'Collecting data and drawing valid conclusions through statistical reasoning. ' +
    'Covers measures of center and spread, data visualization, sampling and bias, ' +
    'confidence intervals, hypothesis testing, and correlation versus causation.',
  concepts: [], // Populated in Phase 23
};

const financialLiteracyWing: DepartmentWing = {
  id: 'financial-literacy',
  name: 'Financial Literacy & Personal Finance',
  description:
    'Practical money management skills for life. ' +
    'Covers personal budgeting, compound interest, saving and investing basics, ' +
    'debt management, credit scores, taxes, and recognizing predatory financial products.',
  concepts: [], // Populated in Phase 23
};

// ─── Token Budget ───────────────────────────────────────────────────────────

const tokenBudget: TokenBudgetConfig = {
  summaryLimit: 3000,
  activeLimit: 12000,
  deepLimit: 50000,
};

// ─── Department Definition ──────────────────────────────────────────────────

/**
 * The Statistics department -- 5 wings covering accounting, probability, statistics,
 * and personal finance (STAT-101: Accounting & Statistics pack).
 *
 * Wings integrate quantitative reasoning across financial record-keeping,
 * probability, data analysis, and personal finance decisions.
 */
export const statisticsDepartment: CollegeDepartment = {
  id: 'statistics',
  name: 'Accounting & Statistics',
  wings: [
    accountingBookkeepingWing,
    financialStatementsWing,
    probabilityWing,
    statisticalAnalysisWing,
    financialLiteracyWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in content phases
  calibrationModels: [] as CalibrationModel[], // Populated in Phase 27
  trySessions: [] as TrySession[], // Populated in Phase 23
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the statistics department with a CollegeLoader.
 *
 * This is a no-op for the scaffold phase -- the CollegeLoader discovers
 * departments via DEPARTMENT.md on the filesystem.
 */
export function registerStatisticsDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
