/**
 * Integrity-audit feedback gate for the ingestion path.
 *
 * The IntegrityAuditor (integrity-audit.ts) only audits works already stored in
 * the CitationStore. This gate closes the loop the other direction: it evaluates
 * a source (or its resolved citations) BEFORE it is merged, on standalone
 * metadata / DOI-resolution signals — a dead reference, a title that does not
 * match the resolved authority record, or a low-confidence resolution — and
 * returns a verdict so the arxiv bridge / sc:learn merge can block or flag it
 * and route it to a review queue instead of silently ingesting a bad source.
 *
 * Pure decision logic only (no I/O). The review-queue writer lives in
 * review-queue.ts; the arxiv adapter lives in the bridge.
 */

import type { AuditResult } from './integrity-audit.js';
import { normalizeTitleForComparison, levenshteinRatio } from '../resolver/confidence.js';

// ============================================================================
// Types
// ============================================================================

export type GateAction = 'pass' | 'flag' | 'block';

/** Standalone audit signals for one source (or one resolved citation). */
export interface SourceAuditInput {
  /** Origin-local identity for traceability (arxiv id, DOI, url). */
  sourceId: string;
  /** The source's DOI, if known — recorded on the review item for follow-up. */
  doi?: string;
  /**
   * True when the source's canonical reference (DOI, arxiv id, ...) does not
   * resolve — a dead link. Blocks by default.
   */
  deadReference?: boolean;
  /** Resolution confidence in [0, 1] (e.g. from resolver `scoreMatch`). */
  resolutionConfidence?: number;
  /** Title the source claims (as cited / fetched). */
  claimedTitle?: string;
  /** Title the resolver / authority returned, for mismatch detection. */
  resolvedTitle?: string;
  /** An IntegrityAuditor result to fold in (broken links, completeness). */
  audit?: AuditResult;
}

export interface GateThresholds {
  /** resolutionConfidence below this → block. */
  blockConfidence: number;
  /** resolutionConfidence below this (but >= blockConfidence) → flag. */
  flagConfidence: number;
  /** claimed-vs-resolved title similarity below this → block (title-mismatch). */
  titleSimilarity: number;
  /** audit.completeness_score below this → flag (low-completeness). */
  flagCompleteness: number;
}

export const DEFAULT_GATE_THRESHOLDS: GateThresholds = {
  blockConfidence: 0.5,
  flagConfidence: 0.8,
  titleSimilarity: 0.6,
  flagCompleteness: 0.8,
};

export interface GateVerdict {
  sourceId: string;
  action: GateAction;
  /** All reasons, block reasons first. */
  reasons: string[];
  /** Block reasons only (non-empty ⇒ action === 'block'). */
  blockedBy: string[];
  /** Flag reasons only. */
  flaggedBy: string[];
}

// ============================================================================
// Title similarity
// ============================================================================

/**
 * Normalized 0-1 similarity between a claimed and a resolved title. 1 = identical
 * after normalization; used to detect a mismatched-title resolution.
 */
export function titleSimilarity(claimed: string, resolved: string): number {
  return levenshteinRatio(
    normalizeTitleForComparison(claimed),
    normalizeTitleForComparison(resolved),
  );
}

// ============================================================================
// Gate decision
// ============================================================================

/**
 * Evaluate one source's audit signals into a pass / flag / block verdict.
 * Most-severe signal wins: any block reason ⇒ block; else any flag reason ⇒
 * flag; else pass.
 */
export function evaluateSourceAudit(
  input: SourceAuditInput,
  thresholds: GateThresholds = DEFAULT_GATE_THRESHOLDS,
): GateVerdict {
  const blockedBy: string[] = [];
  const flaggedBy: string[] = [];

  // Dead reference — the canonical link does not resolve.
  if (input.deadReference === true) {
    blockedBy.push('dead-reference');
  }

  // Resolution confidence bands.
  if (input.resolutionConfidence !== undefined) {
    if (input.resolutionConfidence < thresholds.blockConfidence) {
      blockedBy.push('low-confidence-resolution');
    } else if (input.resolutionConfidence < thresholds.flagConfidence) {
      flaggedBy.push('marginal-confidence');
    }
  }

  // Title mismatch — both a claimed and a resolved title present but they diverge.
  if (input.claimedTitle && input.resolvedTitle) {
    const sim = titleSimilarity(input.claimedTitle, input.resolvedTitle);
    if (sim < thresholds.titleSimilarity) {
      blockedBy.push('title-mismatch');
    }
  }

  // Fold in IntegrityAuditor findings on the source's own citations.
  if (input.audit) {
    if (input.audit.broken_links.length > 0) {
      blockedBy.push('broken-citations');
    }
    if (input.audit.completeness_score < thresholds.flagCompleteness) {
      flaggedBy.push('low-completeness');
    }
  }

  const action: GateAction =
    blockedBy.length > 0 ? 'block' : flaggedBy.length > 0 ? 'flag' : 'pass';

  return {
    sourceId: input.sourceId,
    action,
    reasons: [...blockedBy, ...flaggedBy],
    blockedBy,
    flaggedBy,
  };
}
