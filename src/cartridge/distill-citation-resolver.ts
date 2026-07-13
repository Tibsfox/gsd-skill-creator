/**
 * Ledger-backed {@link ./distill-enricher-semantic.js CitationResolver} — the
 * live plug-in that attaches cross-origin provenance to a distilled cartridge's
 * concept citations (opt-in via `cartridge distill --ledger`).
 *
 * A distill source is a local artifact (its `content` bytes are in hand), so it
 * resolves against the {@link ../source-ledger/source-ledger.js SourceLedger} by
 * CONTENT HASH — the ledger's designed "visible across entry points" key. If the
 * same document was previously ingested by any content-keyed entry point (e.g.
 * the learn acquirer), the hashes collide and this resolver surfaces that
 * provenance. Identity-keyed entries (arxiv/citation, keyed by canonical id, not
 * bytes) do not match a raw file's content hash — that is expected; a local file
 * carries the provenance of whoever ingested those exact bytes.
 *
 * Kept in a SEPARATE file so the enricher stays pure: the SourceLedger (fs) and
 * the content hash (crypto) live behind the injected {@link SourceLedgerPort}
 * and {@link hashContent} here, never in the enricher.
 *
 * @module cartridge/distill-citation-resolver
 */

import { hashContent, type SourceLedgerPort } from '../source-ledger/source-ledger.js';
import type { CitationResolver } from './distill-enricher-semantic.js';
import type { ResolvedCitationProvenance } from './distill.js';

/**
 * Resolve a distill source's provenance from a {@link SourceLedgerPort} by the
 * content hash of its bytes. Returns every provenance the ledger holds for that
 * content (one document may have been ingested through several origins).
 */
export class LedgerCitationResolver implements CitationResolver {
  constructor(private readonly ledger: SourceLedgerPort) {}

  async resolve(_sourceId: string, content: string): Promise<ResolvedCitationProvenance[]> {
    const entries = await this.ledger.findByHash(hashContent(content));
    return entries.map((e) => ({
      origin: e.provenance.origin,
      sourceId: e.provenance.sourceId,
      ingestedAt: e.provenance.ingestedAt,
      ...(e.provenance.label ? { label: e.provenance.label } : {}),
    }));
  }
}
