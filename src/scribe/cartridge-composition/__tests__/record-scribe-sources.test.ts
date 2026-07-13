import { describe, it, expect } from 'vitest';
import type {
  UnifiedCitation,
  UnifiedCitationIndex,
} from '../../types/cartridge-manifest.js';
import {
  SourceLedger,
  arxivSourceEntry,
  citationSourceEntry,
  canonicalCitationId,
  hashSourceId,
  type SourceLedgerEntry,
  type RecordResult,
  type SourceLedgerPort,
} from '../../../source-ledger/source-ledger.js';
import {
  canonicalIdForUnifiedCitation,
  recordScribeSources,
} from '../record-scribe-sources.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function citation(overrides: Partial<UnifiedCitation>): UnifiedCitation {
  return {
    id: 'src-1',
    type: 'paper',
    primaryKey: 'arxiv:2601.00001',
    title: 'A Title',
    citedByTracks: ['T1'],
    ...overrides,
  };
}

function index(sources: UnifiedCitation[]): UnifiedCitationIndex {
  return {
    version: '1.0.0',
    milestone: 'v1.49.621',
    totalUniqueSources: sources.length,
    sources,
  };
}

describe('canonicalIdForUnifiedCitation', () => {
  it('routes an arxiv primaryKey through canonicalCitationId (version-stripped)', () => {
    // primaryKeyFor emits arxiv:<id> WITHOUT stripping the version, so a raw
    // primaryKey would be arxiv:2601.00001v1 — re-routing collapses that onto
    // the version-stripped arxiv/citation dedup key.
    const id = canonicalIdForUnifiedCitation(
      citation({ primaryKey: 'arxiv:2601.00001v1' }),
    );
    expect(id).toBe('arxiv:2601.00001');
    expect(id).toBe(canonicalCitationId({ arxivId: '2601.00001' }));
  });

  it('routes a doi primaryKey through canonicalCitationId (lowercased)', () => {
    const id = canonicalIdForUnifiedCitation(
      citation({ primaryKey: 'doi:10.1000/XyZ' }),
    );
    expect(id).toBe('doi:10.1000/xyz');
  });

  it('falls back to url for a w3c primaryKey', () => {
    const id = canonicalIdForUnifiedCitation(
      citation({ primaryKey: 'w3c:svg:1.1', url: 'https://www.w3.org/TR/SVG11/' }),
    );
    expect(id).toBe('url:https://www.w3.org/TR/SVG11/');
  });

  it('falls back to title for a fallback primaryKey with no url', () => {
    const id = canonicalIdForUnifiedCitation(
      citation({ primaryKey: 'fallback:knuth:1997:abcd1234', url: undefined, title: 'The Art' }),
    );
    expect(id).toBe('title:the art');
  });

  it('returns null when no identity can be derived (empty title, no url)', () => {
    const id = canonicalIdForUnifiedCitation(
      citation({ primaryKey: 'fallback:unknown:0:00000000', url: undefined, title: '' }),
    );
    expect(id).toBeNull();
  });
});

describe('recordScribeSources', () => {
  it('records each source under origin scribe, keyed to collapse onto arxiv/citation', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'scribe-ledger-'));
    try {
      const ledger = new SourceLedger(join(dir, 'ledger.jsonl'));
      const cid = canonicalCitationId({ arxivId: '2601.00001' })!;
      // A citation source is already on the ledger for the same paper.
      await ledger.record(citationSourceEntry(cid, 'ref.md', 't'));

      await recordScribeSources(
        index([citation({ id: 'markup-lineage-1', primaryKey: 'arxiv:2601.00001v2' })]),
        ledger,
      );

      // The scribe source collapsed onto the same dedup key as the citation
      // and arxiv paths for the same paper.
      const byHash = await ledger.findByHash(hashSourceId('arxiv:2601.00001'));
      expect(byHash.map((e) => e.provenance.origin).sort()).toEqual(['citation', 'scribe']);
      expect(await ledger.has(arxivSourceEntry('2601.00001').contentHash)).toBe(true);
      const scribeRow = byHash.find((e) => e.provenance.origin === 'scribe')!;
      expect(scribeRow.provenance.sourceId).toBe('markup-lineage-1');
      expect(scribeRow.provenance.label).toBe('v1.49.621');
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it('is idempotent — re-recording the same index appends nothing new', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'scribe-ledger-'));
    try {
      const ledger = new SourceLedger(join(dir, 'ledger.jsonl'));
      const idx = index([
        citation({ id: 'a', primaryKey: 'arxiv:2601.00001' }),
        citation({ id: 'b', primaryKey: 'doi:10.1/x', type: 'paper' }),
      ]);

      await recordScribeSources(idx, ledger, 't');
      const afterFirst = await ledger.list();
      await recordScribeSources(idx, ledger, 't');
      const afterSecond = await ledger.list();

      expect(afterSecond).toHaveLength(afterFirst.length);
      expect(afterSecond).toHaveLength(2);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it('skips sources with no derivable identity', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'scribe-ledger-'));
    try {
      const ledger = new SourceLedger(join(dir, 'ledger.jsonl'));
      await recordScribeSources(
        index([
          citation({ id: 'ok', primaryKey: 'arxiv:2601.00001' }),
          citation({ id: 'skip', primaryKey: 'fallback:x:0:y', url: undefined, title: '' }),
        ]),
        ledger,
        't',
      );
      const all = await ledger.list();
      expect(all).toHaveLength(1);
      expect(all[0]!.provenance.sourceId).toBe('ok');
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it('is best-effort — a ledger.record failure never propagates', async () => {
    const throwing: SourceLedgerPort = {
      record(): Promise<RecordResult> {
        throw new Error('disk full');
      },
      has: async () => false,
      findByHash: async (): Promise<SourceLedgerEntry[]> => [],
      findBySource: async (): Promise<SourceLedgerEntry[]> => [],
      list: async (): Promise<SourceLedgerEntry[]> => [],
    };
    await expect(
      recordScribeSources(index([citation({})]), throwing),
    ).resolves.toBeUndefined();
  });
});
