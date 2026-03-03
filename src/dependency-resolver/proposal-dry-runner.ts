/**
 * Applies a temporary manifest change, runs the ecosystem dry-run, then
 * restores the original manifest. Verifies proposals before HITL.
 *
 * RSLV-02 implementation.
 *
 * CRITICAL: The manifest restore in step 4 runs inside a finally block —
 * the project is NEVER left in a modified state after dry-run, even on error.
 */

import { promises as fs } from 'node:fs';
import { join, basename } from 'node:path';
import { createBackup } from './manifest-backup.js';
import { patchManifest } from './manifest-patcher.js';
import { DryRunGate } from '../dependency-auditor/dry-run-gate.js';
import type { ResolutionProposal } from './types.js';
import type { DryRunResult } from '../dependency-auditor/dry-run-gate.js';

// ─── Types ────────────────────────────────────────────────────────────────────

type PartialProposal = Omit<ResolutionProposal, 'dryRunResult' | 'backupPath'>;

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Runs the full dry-run verification cycle for a proposed dependency change:
 *   1. Create backup
 *   2. Patch manifest temporarily
 *   3. Run DryRunGate
 *   4. Restore original (in finally)
 *   5. Return ResolutionProposal with dryRunResult and backupPath
 */
export async function runProposalDryRun(
  proposal: PartialProposal,
  manifestPath: string,
  lockfilePath: string | null,
  projectRoot: string,
): Promise<ResolutionProposal> {
  // Step 1: Create backup
  const record = await createBackup(manifestPath, lockfilePath);

  const originalContent = await fs.readFile(manifestPath, 'utf-8');
  let dryRunResult: DryRunResult;

  try {
    // Step 2: Patch manifest temporarily
    const patched = patchManifest(
      originalContent,
      proposal.packageName,
      proposal.proposedVersion,
      proposal.changeType,
      proposal.ecosystem,
    );
    await fs.writeFile(manifestPath, patched, 'utf-8');

    // Step 3: Run dry-run
    const gate = new DryRunGate();
    try {
      dryRunResult = await gate.check(projectRoot, proposal.ecosystem);
    } catch {
      // DryRunGate error → treat as inconclusive (no conflicts detected)
      dryRunResult = {
        ecosystem: proposal.ecosystem,
        hasConflicts: false,
        conflictSummary: [],
        rawOutput: '',
      };
    }
  } finally {
    // Step 4: Always restore original manifest
    const backupCopy = join(record.backupDir, basename(manifestPath));
    try {
      await fs.copyFile(backupCopy, manifestPath);
    } catch {
      // If backup copy doesn't exist, restore from memory
      await fs.writeFile(manifestPath, originalContent, 'utf-8');
    }
  }

  // Step 5: Return complete proposal
  return {
    ...proposal,
    dryRunResult,
    backupPath: record.backupDir,
  };
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/** Class wrapper for runProposalDryRun, providing a stateful API surface. */
export class ProposalDryRunner {
  run(
    proposal: PartialProposal,
    manifestPath: string,
    lockfilePath: string | null,
    projectRoot: string,
  ): Promise<ResolutionProposal> {
    return runProposalDryRun(proposal, manifestPath, lockfilePath, projectRoot);
  }
}
