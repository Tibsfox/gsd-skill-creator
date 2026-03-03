/**
 * Presents ResolutionProposal to user for explicit approval.
 * Records the human's decision without touching the filesystem.
 *
 * RSLV-03 implementation.
 *
 * This gate is purely functional — it accepts a user response string and
 * returns a structured ApprovalResult. No I/O, no filesystem access.
 * The actual manifest write occurs ONLY after approved=true is confirmed,
 * in the ResolverOrchestrator.
 */

import type { ResolutionProposal, ApprovalResult } from './types.js';

// ─── Approval detection ───────────────────────────────────────────────────────

/**
 * Patterns that constitute explicit user approval.
 * Only these exact tokens (case-insensitive, trimmed) are accepted.
 */
const APPROVED_TOKENS = new Set(['yes', 'y', 'approve', 'approved', 'confirm', 'ok', 'okay']);

/**
 * Returns true only when the user response is an explicit approval signal.
 * Ambiguous responses (empty string, "maybe", free-form text) → rejected.
 */
function isApproved(userResponse: string): boolean {
  return APPROVED_TOKENS.has(userResponse.trim().toLowerCase());
}

// ─── Core functions ───────────────────────────────────────────────────────────

/**
 * Formats a ResolutionProposal as a human-readable summary for display
 * before asking the user for approval.
 *
 * Includes: package name, ecosystem, change type, version transition,
 * dry-run status, backup path, and conflict details when present.
 */
export function formatProposal(proposal: ResolutionProposal): string {
  const { packageName, ecosystem, changeType, currentVersion, proposedVersion, dryRunResult, backupPath } = proposal;

  const dryRunStatus = dryRunResult.hasConflicts
    ? `⚠ Conflicts detected:\n  ${dryRunResult.conflictSummary.join('\n  ')}`
    : '✓ Clean';

  return [
    '## Dependency Resolution Proposal',
    '',
    `Package:  ${packageName} (${ecosystem})`,
    `Change:   ${changeType} ${currentVersion} → ${proposedVersion}`,
    `Dry-run:  ${dryRunStatus}`,
    `Backup:   ${backupPath}`,
  ].join('\n');
}

/**
 * Interprets the user's approval/rejection text and returns a structured
 * ApprovalResult. Pure function — no side effects, no filesystem access.
 *
 * Only explicit approval tokens are accepted (see APPROVED_TOKENS).
 * Any other response, including empty string, is treated as rejection.
 */
export function presentForApproval(
  proposal: ResolutionProposal,
  userResponse: string,
): ApprovalResult {
  const approved = isApproved(userResponse);
  return {
    approved,
    proposal,
    approvedAt: approved ? new Date().toISOString() : null,
    rejectionReason: approved ? null : userResponse,
  };
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/** Class wrapper providing presentForApproval and formatProposal as methods. */
export class HITLApprovalGate {
  present(proposal: ResolutionProposal, userResponse: string): ApprovalResult {
    return presentForApproval(proposal, userResponse);
  }

  format(proposal: ResolutionProposal): string {
    return formatProposal(proposal);
  }
}
