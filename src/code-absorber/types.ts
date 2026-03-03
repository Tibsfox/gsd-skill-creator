/**
 * Shared type vocabulary for the Code Absorber.
 *
 * Phase 48: Code Absorber — Types
 */

import type { Ecosystem } from '../dependency-auditor/types.js';

// ─── AbsorptionCandidate ──────────────────────────────────────────────────────

/** Input to the AbsorptionCriteriaGate. */
export interface AbsorptionCandidate {
  packageName: string;
  ecosystem: Ecosystem;
  /** Lines of source code in the package (for ≤500 check). */
  implementationLines: number;
  /** Whether the algorithm has been stable (no breaking changes in last 2 years). */
  isAlgorithmStable: boolean;
  /** Whether the implementation is pure algorithmic (no I/O, no side effects, no network). */
  isPureAlgorithmic: boolean;
  /** Fraction of the package's exported API surface the project actually uses (0.0–1.0). */
  apiUsageRatio: number;
  /** Category tags describing what the package does — used for hard-block checking. */
  categoryTags: string[];
}

// ─── CriteriaVerdict ─────────────────────────────────────────────────────────

export type CriteriaStatus = 'approved' | 'rejected' | 'hard-blocked';

/** Output of AbsorptionCriteriaGate. */
export interface CriteriaVerdict {
  candidatePackage: string;
  status: CriteriaStatus;
  /** Empty when status='approved'. One reason per failed criterion. */
  rejectionReasons: string[];
  /** True when package matches a prohibited category (ABSB-02 hard block). */
  isHardBlocked: boolean;
  checkedAt: string; // ISO 8601
}

// ─── OracleTestResult ────────────────────────────────────────────────────────

/** Produced by OracleVerifier (plan 48-02). */
export interface OracleTestResult {
  packageName: string;
  totalCases: number;
  failures: number;
  isDeterministic: boolean;
  passedAt: string | null; // ISO 8601 when passed; null if not yet passed
}

// ─── CallSiteCycle ───────────────────────────────────────────────────────────

/** Produced by CallSiteReplacer per replacement cycle (plan 48-03). */
export interface CallSiteCycle {
  cycleNumber: number;
  totalCallSites: number;
  replacedInCycle: number;
  verifiedInCycle: number;
  failedInCycle: number;
}

// ─── AbsorptionRecord ────────────────────────────────────────────────────────

/** Stored in the internalization registry (plan 48-04). */
export interface AbsorptionRecord {
  id: string; // UUID v4
  packageName: string;
  ecosystem: Ecosystem;
  algorithmName: string;
  sourcePackage: string;
  criteriaVerdict: CriteriaVerdict;
  oracleResult: OracleTestResult;
  callSiteCycles: CallSiteCycle[];
  dateAbsorbed: string; // ISO 8601
  observationPeriodDays: number;
  observationPeriodComplete: boolean;
  status: 'in-progress' | 'complete' | 'failed' | 'rolled-back';
}
