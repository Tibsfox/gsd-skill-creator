/**
 * Wires all resolution steps into a single-dep resolution pipeline:
 *   ManifestBackup → ProposalDryRunner → HITLApprovalGate → applyChange
 *
 * Enforces the single-dep-per-resolution safety constraint (RSLV-05).
 * Manifest changes never applied without explicit user approval (RSLV-03).
 *
 * RSLV-05 implementation.
 */

import { promises as fs } from 'node:fs';
import { runProposalDryRun } from './proposal-dry-runner.js';
import { presentForApproval } from './hitl-approval-gate.js';
import { patchManifest } from './manifest-patcher.js';
import type {
  ResolutionProposal,
  ApprovalResult,
  ChangeType,
} from './types.js';
import type { Ecosystem } from '../dependency-auditor/types.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResolutionRequest {
  /** The packages to resolve — exactly 1 unless explicitMultiConsent=true. */
  packages: Array<{
    packageName: string;
    proposedVersion: string;
    changeType: ChangeType;
  }>;
  /** Which ecosystem the packages belong to. */
  ecosystem: Ecosystem;
  /** Absolute path to the project manifest file. */
  manifestPath: string;
  /** Absolute path to the lockfile, or null if no lockfile exists. */
  lockfilePath: string | null;
  /** Root directory of the project (for dry-run commands). */
  projectRoot: string;
  /**
   * The user's approval/rejection text (provided externally — e.g. from
   * AskUserQuestion or CLI input). Interpreted by HITLApprovalGate.
   */
  userResponse: string;
  /**
   * Must be true to allow 2+ packages in a single resolution.
   * When false, a batch of 2+ packages throws ResolverError('BATCH_NOT_CONSENTED').
   */
  explicitMultiConsent: boolean;
}

export interface ResolutionOutcome {
  /** The original request. */
  request: ResolutionRequest;
  /** All proposals produced by the dry-runner (including conflicting ones). */
  proposals: ResolutionProposal[];
  /** All HITL decisions (one per non-conflicting proposal). */
  approvalResults: ApprovalResult[];
  /** Package names whose changes were successfully applied to the manifest. */
  appliedPackages: string[];
  /** Package names the user explicitly rejected. */
  rejectedPackages: string[];
  /** Errors encountered per package (dry-run conflicts, apply failures, etc.). */
  errors: Array<{ packageName: string; error: string }>;
}

// ─── ResolverError ────────────────────────────────────────────────────────────

export class ResolverError extends Error {
  constructor(
    public readonly code: 'BATCH_NOT_CONSENTED' | 'MANIFEST_NOT_FOUND' | 'APPLY_FAILED',
    message: string,
  ) {
    super(message);
    this.name = 'ResolverError';
  }
}

// ─── Apply change ─────────────────────────────────────────────────────────────

/**
 * Permanently applies the proposed change to the manifest file.
 * This is the ONLY place in the pipeline where a permanent filesystem write occurs.
 * Throws ResolverError('APPLY_FAILED') on write error.
 */
async function applyChange(
  manifestPath: string,
  proposal: ResolutionProposal,
): Promise<void> {
  try {
    const content = await fs.readFile(manifestPath, 'utf-8');
    const patched = patchManifest(
      content,
      proposal.packageName,
      proposal.proposedVersion,
      proposal.changeType,
      proposal.ecosystem,
    );
    await fs.writeFile(manifestPath, patched, 'utf-8');
  } catch (err) {
    throw new ResolverError(
      'APPLY_FAILED',
      `Failed to apply change for ${proposal.packageName}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ─── Core orchestrator ────────────────────────────────────────────────────────

/** Class wrapper for the resolution pipeline. */
export class ResolverOrchestrator {
  /**
   * Runs the full resolution pipeline for each package in the request.
   *
   * Order: dry-run → HITL → apply (sequentially per package).
   * Never applies without explicit approval; never skips backup (done by dry-runner).
   *
   * Throws ResolverError('BATCH_NOT_CONSENTED') when 2+ packages are provided
   * without explicitMultiConsent=true.
   */
  async resolve(request: ResolutionRequest): Promise<ResolutionOutcome> {
    // Batch guard (RSLV-05)
    if (request.packages.length > 1 && !request.explicitMultiConsent) {
      throw new ResolverError(
        'BATCH_NOT_CONSENTED',
        `Multiple packages (${request.packages.map(p => p.packageName).join(', ')}) require explicitMultiConsent=true`,
      );
    }

    const outcome: ResolutionOutcome = {
      request,
      proposals: [],
      approvalResults: [],
      appliedPackages: [],
      rejectedPackages: [],
      errors: [],
    };

    // Process each package sequentially
    for (const pkg of request.packages) {
      let proposal: ResolutionProposal;

      // Step 1: Run dry-run (includes backup)
      try {
        proposal = await runProposalDryRun(
          {
            packageName: pkg.packageName,
            ecosystem: request.ecosystem,
            currentVersion: '', // caller fills if needed; orchestrator doesn't need it for pipeline
            proposedVersion: pkg.proposedVersion,
            changeType: pkg.changeType,
          },
          request.manifestPath,
          request.lockfilePath,
          request.projectRoot,
        );
        outcome.proposals.push(proposal);
      } catch (err) {
        outcome.errors.push({
          packageName: pkg.packageName,
          error: err instanceof Error ? err.message : String(err),
        });
        continue;
      }

      // Step 2: Check for dry-run conflicts — skip HITL if conflicting
      if (proposal.dryRunResult.hasConflicts) {
        outcome.errors.push({
          packageName: pkg.packageName,
          error: `dry-run conflict: ${proposal.dryRunResult.conflictSummary.join(', ')}`,
        });
        continue;
      }

      // Step 3: HITL approval gate
      const approvalResult = presentForApproval(proposal, request.userResponse);
      outcome.approvalResults.push(approvalResult);

      if (!approvalResult.approved) {
        outcome.rejectedPackages.push(pkg.packageName);
        continue;
      }

      // Step 4: Apply change (only on explicit approval)
      try {
        await applyChange(request.manifestPath, proposal);
        outcome.appliedPackages.push(pkg.packageName);
      } catch (err) {
        outcome.errors.push({
          packageName: pkg.packageName,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return outcome;
  }
}
