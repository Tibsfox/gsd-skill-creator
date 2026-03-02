/**
 * Business Department Definition
 *
 * Defines the CollegeDepartment object for the business department,
 * including 5 wings derived from BUS-101 modules, token budget
 * configuration, and the registration function for the CollegeLoader.
 *
 * @module departments/business/business-department
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

const economicOrganizationWing: DepartmentWing = {
  id: 'economic-organization',
  name: 'Economic Organization & Markets',
  description:
    'How societies organize economic activity and how markets work. ' +
    'Covers supply and demand, price signals, market structures ' +
    '(competitive, monopoly, oligopoly), market failures, and the role ' +
    'of government in the economy.',
  concepts: [], // Populated in Phase 23
};

const businessStructuresWing: DepartmentWing = {
  id: 'business-structures',
  name: 'Business Structures & Entrepreneurship',
  description:
    'How businesses are organized and how new ventures are created. ' +
    'Covers sole proprietorships, partnerships, corporations, cooperatives, ' +
    'the entrepreneurial process, business planning, and startup fundamentals.',
  concepts: [], // Populated in Phase 23
};

const financeAccountingWing: DepartmentWing = {
  id: 'finance-accounting',
  name: 'Finance & Accounting Fundamentals',
  description:
    'The financial foundations of business decision-making. ' +
    'Covers business financing (debt versus equity), cost-benefit analysis, ' +
    'break-even analysis, investment appraisal, and financial planning.',
  concepts: [], // Populated in Phase 23
};

const contractsLegalWing: DepartmentWing = {
  id: 'contracts-legal',
  name: 'Contracts, Rights & Legal Systems',
  description:
    'The legal framework within which business operates. ' +
    'Covers contract formation and enforcement, property rights, ' +
    'consumer protection, employment law basics, intellectual property, ' +
    'and the role of legal systems in enabling commerce.',
  concepts: [], // Populated in Phase 23
};

const ethicsGovernanceWing: DepartmentWing = {
  id: 'ethics-governance',
  name: 'Ethics, Governance & Social Responsibility',
  description:
    'The moral and social dimensions of business. ' +
    'Covers stakeholder theory, corporate governance, business ethics ' +
    'frameworks, corporate social responsibility, sustainability, ' +
    'and the relationship between business and society.',
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
 * The Business department -- 5 wings from economics through business ethics.
 *
 * Wings develop understanding from market fundamentals through business formation,
 * finance, law, and ethical governance, with concepts by content Phase 23.
 */
export const businessDepartment: CollegeDepartment = {
  id: 'business',
  name: 'Business',
  wings: [
    economicOrganizationWing,
    businessStructuresWing,
    financeAccountingWing,
    contractsLegalWing,
    ethicsGovernanceWing,
  ],
  concepts: [] as RosettaConcept[], // Aggregated from wings in content phases
  calibrationModels: [] as CalibrationModel[], // Populated in Phase 27
  trySessions: [] as TrySession[], // Populated in Phase 23
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the business department with a CollegeLoader.
 *
 * This is a no-op for the scaffold phase -- the CollegeLoader discovers
 * departments via DEPARTMENT.md on the filesystem.
 */
export function registerBusinessDepartment(_loader: CollegeLoader): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}
