/**
 * GL-1 governance dispute record schema and lifecycle functions.
 *
 * Extends ICD-04 DisputeRecordPayloadSchema with GL-1-specific governance
 * metadata (GOVR-07). Dispute records capture:
 * - Raiser identity (contributor or agent)
 * - Disputed item description
 * - Supporting evidence (min 1 item)
 * - Conclusion and optional algorithm adjustment
 * - GL-1 metadata: dispute_id, filed_at, reviewed_by, review_notes, charter_clause_refs
 */

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { TimestampSchema, AgentIDSchema } from '../types.js';
import {
  DisputeRecordPayloadSchema,
  AlgorithmAdjustmentSchema,
} from '../icd/icd-04.js';
import type { EvidenceItem, AlgorithmAdjustment } from '../icd/icd-04.js';

// ============================================================================
// GovernanceDisputeSchema
// ============================================================================

/**
 * GL-1 governance dispute record.
 *
 * Extends the ICD-04 DisputeRecordPayloadSchema with governance-layer
 * metadata for tracking, review, and charter clause references.
 */
export const GovernanceDisputeSchema = DisputeRecordPayloadSchema.extend({
  dispute_id: z.string().min(1),
  filed_at: TimestampSchema,
  reviewed_by: AgentIDSchema.optional(),
  review_notes: z.string().optional(),
  charter_clause_refs: z.array(z.string()).optional(),
}).passthrough();

export type GovernanceDispute = z.infer<typeof GovernanceDisputeSchema>;

// ============================================================================
// createDispute
// ============================================================================

/**
 * Factory function to create a new governance dispute.
 *
 * Generates a unique dispute_id and sets the initial status to "open".
 *
 * @param raiser - ContributorID or AgentID of the dispute raiser
 * @param disputedItem - Description of what is being disputed
 * @param evidence - Array of evidence items (min 1 required)
 * @returns New GovernanceDispute in "open" status
 * @throws If evidence array is empty
 */
export function createDispute(
  raiser: string,
  disputedItem: string,
  evidence: EvidenceItem[],
): GovernanceDispute {
  if (evidence.length === 0) {
    throw new Error('At least one evidence item is required');
  }

  const dispute: GovernanceDispute = {
    raiser,
    disputed_item: disputedItem,
    evidence,
    status: 'open',
    dispute_id: `dispute-${Date.now()}-${randomUUID().slice(0, 8)}`,
    filed_at: new Date().toISOString(),
  };

  return dispute;
}

// ============================================================================
// resolveDispute
// ============================================================================

/**
 * Resolves a dispute with a conclusion and optional algorithm adjustment.
 *
 * Returns a new dispute object -- does NOT mutate the input.
 *
 * @param dispute - Dispute to resolve (must be "open" or "under_review")
 * @param conclusion - Written conclusion of the review
 * @param reviewedBy - AgentID of the reviewer (e.g., "GL-1")
 * @param algorithmAdjustment - Optional algorithm adjustment resulting from the dispute
 * @returns New dispute object with "resolved" status
 * @throws If dispute is already resolved or rejected
 */
export function resolveDispute(
  dispute: GovernanceDispute,
  conclusion: string,
  reviewedBy: string,
  algorithmAdjustment?: AlgorithmAdjustment,
): GovernanceDispute {
  if (dispute.status === 'resolved' || dispute.status === 'rejected') {
    throw new Error(`Cannot resolve dispute with status "${dispute.status}"`);
  }

  return {
    ...dispute,
    status: 'resolved',
    conclusion,
    reviewed_by: reviewedBy,
    resolved_at: new Date().toISOString(),
    algorithm_adjustment: algorithmAdjustment ?? null,
  };
}

// ============================================================================
// rejectDispute
// ============================================================================

/**
 * Rejects a dispute with a reason.
 *
 * Returns a new dispute object -- does NOT mutate the input.
 *
 * @param dispute - Dispute to reject (must be "open" or "under_review")
 * @param reason - Reason for rejection
 * @param reviewedBy - AgentID of the reviewer (e.g., "GL-1")
 * @returns New dispute object with "rejected" status
 * @throws If dispute is already resolved or rejected
 */
export function rejectDispute(
  dispute: GovernanceDispute,
  reason: string,
  reviewedBy: string,
): GovernanceDispute {
  if (dispute.status === 'resolved' || dispute.status === 'rejected') {
    throw new Error(`Cannot reject dispute with status "${dispute.status}"`);
  }

  return {
    ...dispute,
    status: 'rejected',
    conclusion: reason,
    reviewed_by: reviewedBy,
  };
}
