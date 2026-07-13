/**
 * Scribe → source-ledger recording adapter.
 *
 * The pure {@link mergeCitations} composer emits a {@link UnifiedCitationIndex}
 * but MUST stay deterministic (byte-identical re-runs), so it never touches the
 * filesystem. This module is the orchestration-side seam that forwards each
 * unified source onto the shared {@link SourceLedgerPort} spine, keying every
 * arxiv/DOI source through {@link canonicalCitationId} so it collapses onto the
 * exact dedup key the arxiv and citation entry points use for the same work.
 *
 * The ledger write is done through an injected `SourceLedgerPort` — this module
 * imports no `node:fs`, so the fs work stays behind the ledger's own boundary.
 *
 * @module scribe/cartridge-composition/record-scribe-sources
 */

import type {
  UnifiedCitation,
  UnifiedCitationIndex,
} from '../types/cartridge-manifest.js';
import {
  canonicalCitationId,
  scribeSourceEntry,
  type SourceLedgerPort,
} from '../../source-ledger/source-ledger.js';

/**
 * Derive a unified citation's cross-origin canonical id in the SAME normalized
 * form the arxiv / citation entry points key on.
 *
 * `primaryKeyFor` emits `arxiv:<id>` / `doi:<id>` WITHOUT the normalization
 * `canonicalCitationId` applies (arxiv version-strip, DOI lower-case), so the
 * strong ids are re-routed through {@link canonicalCitationId} rather than used
 * verbatim — otherwise `arxiv:2601.00001v1` would miss `arxiv:2601.00001`.
 * `w3c:` / `fallback:` keys carry no arxiv/DOI identity, so they fall back to
 * the url, then the title. Returns null when nothing stable can be derived.
 */
export function canonicalIdForUnifiedCitation(
  c: Pick<UnifiedCitation, 'primaryKey' | 'url' | 'title'>,
): string | null {
  const pk = c.primaryKey;
  if (pk.startsWith('arxiv:')) {
    const cid = canonicalCitationId({ arxivId: pk.slice('arxiv:'.length) });
    if (cid) return cid;
  } else if (pk.startsWith('doi:')) {
    const cid = canonicalCitationId({ doi: pk.slice('doi:'.length) });
    if (cid) return cid;
  }
  // w3c / fallback keys (or a malformed arxiv/doi key) have no strong id.
  return canonicalCitationId({ url: c.url, title: c.title });
}

/**
 * Record every source in a unified citation index onto the source ledger under
 * the `scribe` origin. Best-effort: a ledger failure is swallowed per source,
 * since the ledger is an observability spine, not a gate on composition. Idem-
 * potent — the ledger's append-only dedup makes re-recording an index a no-op.
 */
export async function recordScribeSources(
  index: UnifiedCitationIndex,
  ledger: SourceLedgerPort,
  ingestedAt: string = new Date().toISOString(),
): Promise<void> {
  for (const source of index.sources) {
    const canonicalId = canonicalIdForUnifiedCitation(source);
    if (!canonicalId) continue;
    try {
      await ledger.record(
        scribeSourceEntry(canonicalId, source.id, ingestedAt, index.milestone),
      );
    } catch {
      // Swallow — recording is observability, not a gate on composition.
    }
  }
}
