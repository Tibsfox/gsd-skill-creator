/**
 * Core type contracts for Phase 47 — Dependency Resolver.
 *
 * The resolution pipeline:
 *   ManifestBackup → ProposalDryRunner → HITLApprovalGate → applyChange
 *   RollbackEngine is available at any time to restore from a BackupRecord.
 */

import type { Ecosystem } from '../dependency-auditor/types.js';
import type { DryRunResult } from '../dependency-auditor/dry-run-gate.js';

// Re-export for consumer convenience
export type { DryRunResult };

// ─── Change Type ──────────────────────────────────────────────────────────────

/**
 * Classifies the nature of a proposed dependency change.
 *
 * - update: New version is higher than current (semver upgrade).
 * - downgrade: New version is lower than current (regression or security pin).
 * - replace: Different package (alternative from AlternativeReport alternativeName).
 * - remove: Dependency removed entirely from manifest.
 */
export type ChangeType = 'update' | 'downgrade' | 'replace' | 'remove';

// ─── Backup Record ────────────────────────────────────────────────────────────

/**
 * A record of a manifest+lockfile backup created before any modification.
 * Produced by ManifestBackup.create() and consumed by RollbackEngine.rollback().
 */
export interface BackupRecord {
  /** Absolute path to the timestamped backup directory. */
  backupDir: string;
  /** Absolute path to the original manifest file (e.g. package.json). */
  manifestPath: string;
  /** Absolute path to the lockfile, or null if the ecosystem has no lockfile concept. */
  lockfilePath: string | null;
  /** ISO 8601 timestamp of when the backup was created. */
  backedUpAt: string;
  /** Always true — ManifestBackup throws if the manifest doesn't exist. */
  manifestExists: boolean;
  /** True when the lockfile existed at backup time and was successfully copied. */
  lockfileExists: boolean;
}

// ─── Resolution Proposal ─────────────────────────────────────────────────────

/**
 * A fully-verified proposed dependency change ready for user approval.
 *
 * Produced by ProposalDryRunner after:
 *   1. Creating a manifest backup (backupPath populated)
 *   2. Running a dry-run install (dryRunResult populated)
 *   3. Restoring the original manifest
 *
 * Only presented to the user if dryRunResult.hasConflicts === false.
 */
export interface ResolutionProposal {
  /** The npm/cargo/pypi/etc. package being changed. */
  packageName: string;
  /** Which ecosystem this package belongs to. */
  ecosystem: Ecosystem;
  /** The version currently declared in the manifest. */
  currentVersion: string;
  /**
   * The proposed new version string, or a replacement package name for
   * changeType='replace'.
   */
  proposedVersion: string;
  /** What kind of change this is. */
  changeType: ChangeType;
  /**
   * Result of running the ecosystem dry-run with the proposed change applied.
   * hasConflicts=true means this proposal must be rejected before reaching HITL.
   */
  dryRunResult: DryRunResult;
  /** Absolute path to the backup directory created before this dry-run. */
  backupPath: string;
}

// ─── Approval Result ──────────────────────────────────────────────────────────

/**
 * Records the human's decision about a ResolutionProposal.
 *
 * Pure data — no filesystem access in this interface.
 * The actual manifest write happens only after approved=true is confirmed.
 */
export interface ApprovalResult {
  /** Whether the user explicitly confirmed the proposed change. */
  approved: boolean;
  /** The proposal that was presented for review. */
  proposal: ResolutionProposal;
  /** ISO 8601 timestamp when approval was granted, or null if rejected. */
  approvedAt: string | null;
  /**
   * The user's original response text when rejected (audit trail).
   * Null when approved=true.
   */
  rejectionReason: string | null;
}

// ─── Rollback Result ──────────────────────────────────────────────────────────

/**
 * Outcome of a RollbackEngine.rollback() call.
 *
 * Never throws — returns success=false with failureReason on any error.
 */
export interface RollbackResult {
  /** True when all files were successfully restored. */
  success: boolean;
  /** The backup directory that was used as the restore source. */
  backupDir: string;
  /** Absolute paths of all files that were restored. */
  restoredFiles: string[];
  /** Null on success; error message on failure. */
  failureReason: string | null;
}
