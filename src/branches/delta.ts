/**
 * M4 Branch-Context Experimentation — 20%-bound refinement-diff computation.
 *
 * The bound is computed as:
 *
 *   changedBytes / max(parent_size, proposed_size)
 *
 * Using max() rather than parent_size prevents bypass via deletions: a
 * proposal that halves the skill body and adds content still has its diff
 * measured against the larger side.
 *
 * The maximum allowed fraction is 0.20 (20%). Proposals that exceed this
 * are rejected at fork time (SC-REFINE-BOUND, CF-M4-05).
 *
 * Implementation note:
 *   "Changed bytes" is measured as the byte-level diff between the two
 *   UTF-8 encoded bodies.  We use a simple LCS-style count: the number
 *   of bytes that are NOT in the common prefix + suffix of the two
 *   bodies.  This is deterministic, symmetric, and fast for the sizes
 *   we expect (skill bodies are typically 1 KB–100 KB).
 *
 *   A more sophisticated diff (e.g. Levenshtein on lines) would give
 *   smaller changed counts for typical refactors, but that complexity
 *   is not required by the spec.  The simple prefix+suffix approach is
 *   conservative (may over-count) which is the correct direction for a
 *   safety bound.
 *
 * Phase 645, Wave 1 Track D (M4).
 *
 * @module branches/delta
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum allowed refinement fraction (20%). */
export const MAX_DELTA_FRACTION = 0.20;

// ─── Delta computation ────────────────────────────────────────────────────────

/**
 * Result of a refinement-diff computation.
 */
export interface DeltaResult {
  /** Byte length of the parent (original) body. */
  parentBytes: number;

  /** Byte length of the proposed (new) body. */
  proposedBytes: number;

  /**
   * Denominator used for the bound: max(parentBytes, proposedBytes).
   * Never zero (callers that pass empty strings get denominator = 0
   * handled as a special case below).
   */
  denominator: number;

  /**
   * Number of bytes estimated as "changed" (bytes in neither common
   * prefix nor common suffix).
   */
  changedBytes: number;

  /**
   * Fractional diff: changedBytes / denominator.
   * Range [0.0, 1.0].
   */
  fraction: number;

  /**
   * Whether the proposed change exceeds the 20% bound.
   * True means "reject at fork time".
   */
  exceeds: boolean;
}

/**
 * Compute the bounded refinement diff between parent and proposed skill bodies.
 *
 * Both bodies are expected as UTF-8 strings (the skill body field of SkillSpec).
 * Byte lengths are computed via `Buffer.byteLength(s, 'utf8')` which is
 * cross-platform and part of Node.js stdlib (no filesystem dependency).
 *
 * @param parentBody  - The current (trunk) skill body.
 * @param proposedBody - The proposed (branched) skill body.
 * @returns DeltaResult with fraction and exceeds flag.
 */
export function computeDelta(parentBody: string, proposedBody: string): DeltaResult {
  const parentBytes = byteLength(parentBody);
  const proposedBytes = byteLength(proposedBody);
  const denominator = Math.max(parentBytes, proposedBytes);

  if (denominator === 0) {
    // Both sides are empty — no change, fraction = 0.
    return {
      parentBytes: 0,
      proposedBytes: 0,
      denominator: 0,
      changedBytes: 0,
      fraction: 0,
      exceeds: false,
    };
  }

  // Convert to byte arrays for character-level diff.
  const parentBuf = stringToBytes(parentBody);
  const proposedBuf = stringToBytes(proposedBody);

  // Count common prefix bytes.
  const minLen = Math.min(parentBuf.length, proposedBuf.length);
  let prefixLen = 0;
  while (prefixLen < minLen && parentBuf[prefixLen] === proposedBuf[prefixLen]) {
    prefixLen++;
  }

  // Count common suffix bytes (from the end, not overlapping the prefix).
  let suffixLen = 0;
  const parentTail = parentBuf.length - 1;
  const proposedTail = proposedBuf.length - 1;
  while (
    suffixLen < minLen - prefixLen &&
    parentBuf[parentTail - suffixLen] === proposedBuf[proposedTail - suffixLen]
  ) {
    suffixLen++;
  }

  // Changed bytes: everything in parent not in prefix/suffix + everything
  // in proposed not in prefix/suffix.
  const parentChanged = parentBuf.length - prefixLen - suffixLen;
  const proposedChanged = proposedBuf.length - prefixLen - suffixLen;
  const changedBytes = parentChanged + proposedChanged;

  const fraction = changedBytes / denominator;
  const exceeds = fraction > MAX_DELTA_FRACTION;

  return {
    parentBytes,
    proposedBytes,
    denominator,
    changedBytes,
    fraction,
    exceeds,
  };
}

/**
 * Return a human-readable rejection message for an exceeded delta.
 * Included in the Error thrown by fork.ts when the bound is exceeded.
 */
export function deltaRejectionMessage(result: DeltaResult): string {
  const pct = (result.fraction * 100).toFixed(1);
  const maxPct = (MAX_DELTA_FRACTION * 100).toFixed(0);
  return (
    `SC-REFINE-BOUND: proposed diff of ${pct}% exceeds the ${maxPct}% limit ` +
    `(${result.changedBytes} changed bytes / ${result.denominator} max bytes). ` +
    `Reduce the refinement scope and try again.`
  );
}

// ─── Cross-platform byte utilities ───────────────────────────────────────────

/**
 * Return the UTF-8 byte length of a string.
 * Uses Node.js `Buffer.byteLength` — stdlib, cross-platform, no dependencies.
 */
function byteLength(s: string): number {
  return Buffer.byteLength(s, 'utf8');
}

/**
 * Encode a string to its UTF-8 bytes.
 * Uses `Buffer.from` — stdlib, cross-platform.
 */
function stringToBytes(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, 'utf8'));
}
