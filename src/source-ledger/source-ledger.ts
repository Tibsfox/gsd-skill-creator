/**
 * Unified source ledger — one append-only record of every source the system
 * ingests, keyed by content-hash + provenance.
 *
 * The dedup/provenance stores that predate this (scan-arxiv seen-ids, the
 * citations ProvenanceTracker, the learn registry) each track sources in their
 * own silo, so a paper pulled in one way is invisible to another. This ledger
 * is the shared spine: every entry point appends a `SourceLedgerEntry`, and any
 * other entry point can dedup-check against the same file.
 *
 * `acquireSource()` is NOT a universal chokepoint (citations / scribe bypass it),
 * so the ledger is designed for MULTIPLE entry points rather than one wrapper —
 * `arxivSourceEntry()` and `acquiredSourceEntry()` are the first two adapters.
 *
 * Storage: JSON Lines, one `SourceLedgerEntry` per line. Append-only — a record
 * with an identity already present is a no-op, so re-runs are idempotent and
 * safe across processes.
 */

import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Where a source came from and what identifies it there. */
export interface SourceProvenance {
  /** The ingestion entry point, e.g. 'arxiv', 'learn-acquirer', 'citation'. */
  origin: string;
  /** The origin-local identity: arxiv id, file path, url, citation id. */
  sourceId: string;
  /** ISO-8601 timestamp of when the source was recorded. */
  ingestedAt: string;
  /** Optional human/session label (e.g. a learn sessionId or report ref). */
  label?: string;
  /** Optional origin-specific extra metadata. */
  extra?: Record<string, unknown>;
}

/** One append-only ledger row: a content-hash keyed to its provenance. */
export interface SourceLedgerEntry {
  /** Stable dedup key — sha256 of content, or of a canonical source id. */
  contentHash: string;
  provenance: SourceProvenance;
}

/** Outcome of a `record()` call. `appended` is false on an idempotent no-op. */
export interface RecordResult {
  entry: SourceLedgerEntry;
  appended: boolean;
}

/**
 * The write/read surface the rest of the system programs against. Callers take
 * a `SourceLedgerPort` so they can be handed a real ledger or a stub in tests.
 */
export interface SourceLedgerPort {
  record(entry: SourceLedgerEntry): Promise<RecordResult>;
  has(contentHash: string): Promise<boolean>;
  findByHash(contentHash: string): Promise<SourceLedgerEntry[]>;
  findBySource(origin: string, sourceId: string): Promise<SourceLedgerEntry[]>;
  list(): Promise<SourceLedgerEntry[]>;
}

// ─── Default path ────────────────────────────────────────────────────────────

export const DEFAULT_SOURCE_LEDGER_PATH = '.planning/source-ledger/ledger.jsonl';

// ─── Hash helpers ────────────────────────────────────────────────────────────

/** Content-derived dedup key — the true cross-origin identity of a source. */
export function hashContent(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Identity-derived dedup key, for entry points that only have a canonical id
 * (not the bytes) at record time. Namespaced so it never collides with a
 * content hash of the literal id string.
 */
export function hashSourceId(canonicalId: string): string {
  return createHash('sha256').update(`source-id:${canonicalId}`).digest('hex');
}

/** Composite identity used to dedup appends (same source, same origin). */
function identityOf(entry: SourceLedgerEntry): string {
  return `${entry.contentHash}\x00${entry.provenance.origin}\x00${entry.provenance.sourceId}`;
}

// ─── Adapters (entry-point mappers) ──────────────────────────────────────────

/**
 * Build a ledger entry for an arxiv paper. The version suffix (`v1`, `v2`, …)
 * is stripped so re-ingesting the same paper at a newer version dedups, mirror-
 * ing `normalizeArxivId` in scan-arxiv/dedup. Content bytes are not available
 * at the seen-ids write site, so the key is derived from the canonical id.
 */
export function arxivSourceEntry(
  arxivId: string,
  reportRef?: string,
  ingestedAt: string = new Date().toISOString(),
): SourceLedgerEntry {
  const normalized = arxivId.replace(/v\d+$/, '');
  return {
    contentHash: hashSourceId(`arxiv:${normalized}`),
    provenance: {
      origin: 'arxiv',
      sourceId: arxivId,
      ingestedAt,
      ...(reportRef ? { label: reportRef } : {}),
    },
  };
}

/**
 * Build a ledger entry for a source acquired by the learn pipeline. Keyed on
 * the actual content hash, so the SAME document acquired via a different path
 * (or re-acquired later) collapses to one dedup key — the core of the "visible
 * across entry points" guarantee.
 */
export function acquiredSourceEntry(
  sourceFile: string,
  content: string | Buffer,
  ingestedAt: string = new Date().toISOString(),
): SourceLedgerEntry {
  return {
    contentHash: hashContent(content),
    provenance: {
      origin: 'learn-acquirer',
      sourceId: sourceFile,
      ingestedAt,
    },
  };
}

/**
 * Canonicalize a citation's cross-origin identity so it keys the SAME way as
 * the other entry points. A citation carries metadata (arxiv id / DOI / url /
 * title), not content bytes, so — like arxiv — its dedup key is identity-derived.
 * An arxiv-resolved citation canonicalizes to `arxiv:<normalized>`, exactly the
 * form `arxivSourceEntry` keys on, so the two collapse to one dedup key.
 */
export function canonicalCitationId(input: {
  arxivId?: string;
  doi?: string;
  url?: string;
  title?: string;
}): string | null {
  if (input.arxivId) {
    return `arxiv:${input.arxivId.replace(/v\d+$/, '')}`;
  }
  if (input.doi) {
    return `doi:${input.doi.trim().toLowerCase()}`;
  }
  if (input.url) {
    return `url:${input.url.trim()}`;
  }
  if (input.title) {
    return `title:${input.title.trim().toLowerCase()}`;
  }
  return null;
}

/**
 * Build a ledger entry for a source recorded from the citations provenance path.
 * `canonicalId` is a cross-origin identity from {@link canonicalCitationId}; the
 * key is derived via {@link hashSourceId} so a citation that resolves to an arxiv
 * paper shares its dedup key with `arxivSourceEntry` — the "visible across entry
 * points" guarantee, reached from the citations side.
 */
export function citationSourceEntry(
  canonicalId: string,
  citationSourceId: string,
  ingestedAt: string = new Date().toISOString(),
  label?: string,
): SourceLedgerEntry {
  return {
    contentHash: hashSourceId(canonicalId),
    provenance: {
      origin: 'citation',
      sourceId: citationSourceId,
      ingestedAt,
      ...(label ? { label } : {}),
    },
  };
}

/**
 * Build a ledger entry for a source recorded from the scribe cartridge-
 * composition path (the unified `CITATIONS.json` merge). `canonicalId` is a
 * cross-origin identity from {@link canonicalCitationId}; the key is derived via
 * {@link hashSourceId} so a scribe source that resolves to an arxiv paper (or a
 * DOI) shares its dedup key with `arxivSourceEntry` / `citationSourceEntry` —
 * the "visible across entry points" guarantee, reached from the scribe side.
 * `scribeSourceId` is the unified citation's stable kebab-case id; `label` is
 * typically the composition milestone.
 */
export function scribeSourceEntry(
  canonicalId: string,
  scribeSourceId: string,
  ingestedAt: string = new Date().toISOString(),
  label?: string,
): SourceLedgerEntry {
  return {
    contentHash: hashSourceId(canonicalId),
    provenance: {
      origin: 'scribe',
      sourceId: scribeSourceId,
      ingestedAt,
      ...(label ? { label } : {}),
    },
  };
}

// ─── SourceLedger ────────────────────────────────────────────────────────────

/**
 * Append-only, JSONL-backed unified source ledger.
 *
 * Reads are whole-file scans (the store is append-only and bounded); this
 * matches the sibling append-only registries and keeps the surface simple.
 */
export class SourceLedger implements SourceLedgerPort {
  private readonly ledgerPath: string;

  constructor(ledgerPath?: string) {
    this.ledgerPath = ledgerPath ?? DEFAULT_SOURCE_LEDGER_PATH;
  }

  /**
   * Append `entry` unless an identity-equal row is already present. Returns
   * `{ appended: false }` on the idempotent no-op so callers can tell.
   */
  async record(entry: SourceLedgerEntry): Promise<RecordResult> {
    const existing = await this.list();
    const id = identityOf(entry);
    if (existing.some((e) => identityOf(e) === id)) {
      return { entry, appended: false };
    }
    await fs.mkdir(dirname(this.ledgerPath), { recursive: true });
    await fs.appendFile(this.ledgerPath, JSON.stringify(entry) + '\n', 'utf-8');
    return { entry, appended: true };
  }

  /** True if any entry carries `contentHash` (the dedup check). */
  async has(contentHash: string): Promise<boolean> {
    const all = await this.list();
    return all.some((e) => e.contentHash === contentHash);
  }

  /** All entries carrying `contentHash` (one hash may have many provenances). */
  async findByHash(contentHash: string): Promise<SourceLedgerEntry[]> {
    const all = await this.list();
    return all.filter((e) => e.contentHash === contentHash);
  }

  /** All entries whose provenance matches `origin` + `sourceId`. */
  async findBySource(origin: string, sourceId: string): Promise<SourceLedgerEntry[]> {
    const all = await this.list();
    return all.filter(
      (e) => e.provenance.origin === origin && e.provenance.sourceId === sourceId,
    );
  }

  /** Every entry, in append order. Corrupt lines are skipped, not thrown. */
  async list(): Promise<SourceLedgerEntry[]> {
    let content: string;
    try {
      content = await fs.readFile(this.ledgerPath, 'utf-8');
    } catch {
      return [];
    }
    const entries: SourceLedgerEntry[] = [];
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        entries.push(JSON.parse(trimmed) as SourceLedgerEntry);
      } catch {
        // Skip corrupt lines without throwing.
      }
    }
    return entries;
  }
}
