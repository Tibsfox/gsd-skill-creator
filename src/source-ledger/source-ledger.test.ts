import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  SourceLedger,
  hashContent,
  hashSourceId,
  arxivSourceEntry,
  acquiredSourceEntry,
  canonicalCitationId,
  citationSourceEntry,
  scribeSourceEntry,
  DEFAULT_SOURCE_LEDGER_PATH,
  type SourceLedgerEntry,
} from './source-ledger.js';

let dir: string;
let ledgerPath: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(join(tmpdir(), 'source-ledger-'));
  ledgerPath = join(dir, 'ledger.jsonl');
});

afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe('hash helpers', () => {
  it('hashContent is stable and content-derived', () => {
    expect(hashContent('abc')).toBe(hashContent('abc'));
    expect(hashContent('abc')).not.toBe(hashContent('abd'));
    expect(hashContent('abc')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashSourceId is namespaced away from hashContent of the raw id', () => {
    expect(hashSourceId('x')).not.toBe(hashContent('x'));
    expect(hashSourceId('x')).toBe(hashSourceId('x'));
  });
});

describe('SourceLedger core', () => {
  it('records, reads back, and dedup-checks by content hash', async () => {
    const ledger = new SourceLedger(ledgerPath);
    const entry: SourceLedgerEntry = {
      contentHash: hashContent('hello'),
      provenance: { origin: 'test', sourceId: 'a.txt', ingestedAt: '2026-01-01T00:00:00.000Z' },
    };

    expect(await ledger.has(entry.contentHash)).toBe(false);
    const res = await ledger.record(entry);
    expect(res.appended).toBe(true);
    expect(await ledger.has(entry.contentHash)).toBe(true);
    expect(await ledger.list()).toHaveLength(1);
  });

  it('is idempotent for an identity-equal entry (append-only no-op)', async () => {
    const ledger = new SourceLedger(ledgerPath);
    const entry = acquiredSourceEntry('a.txt', 'hello', '2026-01-01T00:00:00.000Z');

    expect((await ledger.record(entry)).appended).toBe(true);
    expect((await ledger.record({ ...entry })).appended).toBe(false);
    expect(await ledger.list()).toHaveLength(1);
  });

  it('collapses concurrent identity-equal records to one row (locked, not TOCTOU)', async () => {
    // The read-check-append is serialized by a cross-process FileLock, so two
    // racing writers cannot both pass the identity check before either appends.
    const ledger = new SourceLedger(ledgerPath);
    const entry = acquiredSourceEntry('a.txt', 'hello', '2026-01-01T00:00:00.000Z');

    const results = await Promise.all([
      ledger.record({ ...entry }),
      ledger.record({ ...entry }),
    ]);

    // Exactly one append wins; the other is the idempotent no-op — never a duplicate row.
    expect(results.filter((r) => r.appended)).toHaveLength(1);
    expect(await ledger.list()).toHaveLength(1);
  });

  it('records distinct provenances under the same content hash', async () => {
    const ledger = new SourceLedger(ledgerPath);
    const hash = hashContent('shared bytes');
    await ledger.record({ contentHash: hash, provenance: { origin: 'arxiv', sourceId: '2601.1', ingestedAt: 't1' } });
    await ledger.record({ contentHash: hash, provenance: { origin: 'learn-acquirer', sourceId: 'a.pdf', ingestedAt: 't2' } });

    const byHash = await ledger.findByHash(hash);
    expect(byHash).toHaveLength(2);
    expect(byHash.map((e) => e.provenance.origin).sort()).toEqual(['arxiv', 'learn-acquirer']);
  });

  it('a source ingested via one origin is visible to another via dedup-check', async () => {
    // The core promise: acquirer records content, arxiv path later dedup-checks
    // the same bytes and finds it.
    const ledger = new SourceLedger(ledgerPath);
    const content = 'paper full text';
    await ledger.record(acquiredSourceEntry('paper.pdf', content, 't'));

    // A different entry point holding the same bytes hashes to the same key.
    expect(await ledger.has(hashContent(content))).toBe(true);
  });

  it('findBySource looks up by origin + sourceId', async () => {
    const ledger = new SourceLedger(ledgerPath);
    await ledger.record(arxivSourceEntry('2601.00001v2', 'learn-42'));
    const found = await ledger.findBySource('arxiv', '2601.00001v2');
    expect(found).toHaveLength(1);
    expect(found[0]!.provenance.label).toBe('learn-42');
  });

  it('list() returns [] for a missing file and skips corrupt lines', async () => {
    const ledger = new SourceLedger(ledgerPath);
    expect(await ledger.list()).toEqual([]);
    await fs.writeFile(ledgerPath, '{"bad json\n{"contentHash":"h","provenance":{"origin":"o","sourceId":"s","ingestedAt":"t"}}\n');
    const all = await ledger.list();
    expect(all).toHaveLength(1);
    expect(all[0]!.contentHash).toBe('h');
  });

  it('defaults to DEFAULT_SOURCE_LEDGER_PATH when no path is given', () => {
    expect(DEFAULT_SOURCE_LEDGER_PATH).toContain('source-ledger');
    // constructing without a path must not throw
    expect(() => new SourceLedger()).not.toThrow();
  });
});

describe('adapters', () => {
  it('arxivSourceEntry strips the version suffix so v1/v2 dedup', async () => {
    const ledger = new SourceLedger(ledgerPath);
    const v1 = arxivSourceEntry('2601.00001v1');
    const v2 = arxivSourceEntry('2601.00001v2');
    expect(v1.contentHash).toBe(v2.contentHash);

    expect((await ledger.record(v1)).appended).toBe(true);
    // Same normalized hash + same origin, but sourceId differs (v1 vs v2), so
    // this is a distinct provenance row — still visible under one dedup key.
    expect(await ledger.has(v2.contentHash)).toBe(true);
  });

  it('acquiredSourceEntry keys on content hash and tags origin learn-acquirer', () => {
    const e = acquiredSourceEntry('/tmp/a.txt', 'body');
    expect(e.contentHash).toBe(hashContent('body'));
    expect(e.provenance.origin).toBe('learn-acquirer');
    expect(e.provenance.sourceId).toBe('/tmp/a.txt');
  });

  it('canonicalCitationId prefers arxiv (version-stripped) then doi/url/title', () => {
    expect(canonicalCitationId({ arxivId: '2601.00001v3' })).toBe('arxiv:2601.00001');
    expect(canonicalCitationId({ doi: '10.1000/XyZ' })).toBe('doi:10.1000/xyz');
    expect(canonicalCitationId({ url: 'https://x.test/p' })).toBe('url:https://x.test/p');
    expect(canonicalCitationId({ title: 'On Groups' })).toBe('title:on groups');
    expect(canonicalCitationId({})).toBeNull();
  });

  it('citationSourceEntry keys via hashSourceId and tags origin citation', () => {
    const e = citationSourceEntry('arxiv:2601.00001', 'ref.md', 't', 'cite-1');
    expect(e.contentHash).toBe(hashSourceId('arxiv:2601.00001'));
    expect(e.provenance.origin).toBe('citation');
    expect(e.provenance.sourceId).toBe('ref.md');
    expect(e.provenance.label).toBe('cite-1');
  });

  it('a citation shares one dedup key with the arxiv path for the same paper', async () => {
    // The cross-entry-point promise, reached from the citations side: record a
    // source via the citations origin, then dedup-check it via the arxiv path.
    const ledger = new SourceLedger(ledgerPath);
    const cid = canonicalCitationId({ arxivId: '2601.00001' })!;
    await ledger.record(citationSourceEntry(cid, 'ref.md', 't'));

    // The arxiv path (a different version suffix) hashes to the same key.
    expect(await ledger.has(arxivSourceEntry('2601.00001v2').contentHash)).toBe(true);
    const byHash = await ledger.findByHash(hashSourceId('arxiv:2601.00001'));
    expect(byHash.map((e) => e.provenance.origin)).toContain('citation');
  });

  it('scribeSourceEntry keys via hashSourceId and tags origin scribe', () => {
    const e = scribeSourceEntry('arxiv:2601.00001', 'markup-lineage-1', 't', 'v1.49.621');
    expect(e.contentHash).toBe(hashSourceId('arxiv:2601.00001'));
    expect(e.provenance.origin).toBe('scribe');
    expect(e.provenance.sourceId).toBe('markup-lineage-1');
    expect(e.provenance.label).toBe('v1.49.621');
  });

  it('a scribe source shares one dedup key with the arxiv/citation path for the same paper', async () => {
    // The cross-entry-point promise, reached from the scribe side: record a
    // source via the scribe origin, then dedup-check it via the arxiv path and
    // find both the scribe and citation provenances under one key.
    const ledger = new SourceLedger(ledgerPath);
    const cid = canonicalCitationId({ arxivId: '2601.00001' })!;
    await ledger.record(citationSourceEntry(cid, 'ref.md', 't'));
    await ledger.record(scribeSourceEntry(cid, 'code-svg-hdl-bridge-3', 't'));

    // The arxiv path (a different version suffix) hashes to the same key.
    expect(await ledger.has(arxivSourceEntry('2601.00001v2').contentHash)).toBe(true);
    const byHash = await ledger.findByHash(hashSourceId('arxiv:2601.00001'));
    expect(byHash.map((e) => e.provenance.origin).sort()).toEqual(['citation', 'scribe']);
  });
});
