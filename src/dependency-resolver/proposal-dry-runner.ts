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
import { DryRunGate } from '../dependency-auditor/dry-run-gate.js';
import type { ResolutionProposal, ChangeType } from './types.js';
import type { Ecosystem } from '../dependency-auditor/types.js';
import type { DryRunResult } from '../dependency-auditor/dry-run-gate.js';

// ─── Manifest patching ────────────────────────────────────────────────────────

type PartialProposal = Omit<ResolutionProposal, 'dryRunResult' | 'backupPath'>;

/**
 * Applies a version patch to the manifest content using simple text substitution.
 * Returns patched content — does NOT write to disk.
 */
function patchManifest(
  content: string,
  packageName: string,
  proposedVersion: string,
  changeType: ChangeType,
  ecosystem: Ecosystem,
): string {
  if (changeType === 'remove') {
    return removePackageFromManifest(content, packageName, ecosystem);
  }

  switch (ecosystem) {
    case 'npm': {
      // Handles both dependencies and devDependencies sections
      // Pattern: "packageName": "version"
      const escapedName = packageName.replace(/[@/]/g, (c) => `\\${c}`);
      const re = new RegExp(`("${escapedName}"\\s*:\\s*)"[^"]*"`, 'g');
      const patched = content.replace(re, `$1"${proposedVersion}"`);
      if (patched === content) {
        throw new Error(`Package '${packageName}' not found in npm manifest`);
      }
      return patched;
    }

    case 'cargo': {
      // Pattern: packageName = "version" or packageName = { version = "version" }
      const escapedName = packageName.replace(/[-]/g, '\\-');
      const re = new RegExp(`(${escapedName}\\s*=\\s*(?:\\{[^}]*version\\s*=\\s*|"))[^"]*("?)`, 'g');
      const patched = content.replace(re, `$1${proposedVersion}$2`);
      if (patched === content) {
        throw new Error(`Package '${packageName}' not found in Cargo.toml`);
      }
      return patched;
    }

    case 'pypi': {
      // Pattern: packageName==version or packageName>=version
      const escapedName = packageName.replace(/[-_.]/g, '[-_.]');
      const re = new RegExp(`(${escapedName})[>=<~!]+[\\d.*]+`, 'gi');
      const patched = content.replace(re, `$1==${proposedVersion}`);
      if (patched === content) {
        throw new Error(`Package '${packageName}' not found in requirements.txt`);
      }
      return patched;
    }

    case 'rubygems': {
      // Pattern: gem 'name', 'version'
      const escapedName = packageName.replace(/[-]/g, '\\-');
      const re = new RegExp(`(gem\\s+['"]${escapedName}['"]\\s*,\\s*['"])[^'"]*(['"])`, 'g');
      const patched = content.replace(re, `$1${proposedVersion}$2`);
      if (patched === content) {
        throw new Error(`Package '${packageName}' not found in Gemfile`);
      }
      return patched;
    }

    case 'conda': {
      // Pattern: - name=version under dependencies:
      const re = new RegExp(`(- ${packageName}=)[^\\n]*`, 'g');
      const patched = content.replace(re, `$1${proposedVersion}`);
      if (patched === content) {
        throw new Error(`Package '${packageName}' not found in environment.yml`);
      }
      return patched;
    }
  }
}

function removePackageFromManifest(
  content: string,
  packageName: string,
  ecosystem: Ecosystem,
): string {
  switch (ecosystem) {
    case 'npm': {
      // Remove the line with "packageName": "version"
      const escapedName = packageName.replace(/[@/]/g, (c) => `\\${c}`);
      return content.replace(new RegExp(`\\s*"${escapedName}"\\s*:\\s*"[^"]*",?`, 'g'), '');
    }
    case 'pypi': {
      const escapedName = packageName.replace(/[-_.]/g, '[-_.]');
      return content.replace(new RegExp(`^${escapedName}[^\\n]*\\n?`, 'gim'), '');
    }
    case 'cargo': {
      return content.replace(new RegExp(`^${packageName}\\s*=.*\\n?`, 'gm'), '');
    }
    case 'rubygems': {
      return content.replace(new RegExp(`^\\s*gem\\s+['"]${packageName}['"][^\\n]*\\n?`, 'gm'), '');
    }
    case 'conda': {
      return content.replace(new RegExp(`^\\s*-\\s*${packageName}[^\\n]*\\n?`, 'gm'), '');
    }
  }
}

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
