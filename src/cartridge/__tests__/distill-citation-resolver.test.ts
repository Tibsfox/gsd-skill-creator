import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LedgerCitationResolver } from '../distill-citation-resolver.js';
import {
  SourceLedger,
  acquiredSourceEntry,
  arxivSourceEntry,
} from '../../source-ledger/source-ledger.js';

describe('LedgerCitationResolver', () => {
  let dir: string;
  let ledgerPath: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(join(tmpdir(), 'distill-cite-'));
    ledgerPath = join(dir, 'ledger.jsonl');
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('resolves provenance by content hash for a ledger-known source', async () => {
    const content = 'Some research content bytes distilled into a cartridge.';
    const ledger = new SourceLedger(ledgerPath);
    await ledger.record(acquiredSourceEntry('/papers/x.md', content, '2026-01-01T00:00:00.000Z'));

    const resolver = new LedgerCitationResolver(ledger);
    const prov = await resolver.resolve('x', content);

    expect(prov).toHaveLength(1);
    expect(prov[0]).toMatchObject({
      origin: 'learn-acquirer',
      sourceId: '/papers/x.md',
      ingestedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('returns [] for content the ledger has never seen (content-hash miss)', async () => {
    const ledger = new SourceLedger(ledgerPath);
    // An identity-keyed arxiv entry does NOT collide with a raw file's content hash.
    await ledger.record(arxivSourceEntry('2401.09999', 'report-1', '2026-01-01T00:00:00.000Z'));
    const resolver = new LedgerCitationResolver(ledger);
    expect(await resolver.resolve('x', 'brand new unseen content')).toEqual([]);
  });

  it('surfaces every provenance the ledger holds for the same content', async () => {
    const content = 'Shared bytes ingested twice via different origins.';
    const ledger = new SourceLedger(ledgerPath);
    await ledger.record(acquiredSourceEntry('/a.md', content, 't1'));
    // Same content bytes, a different origin-local path → second provenance row.
    await ledger.record(acquiredSourceEntry('/b.md', content, 't2'));

    const resolver = new LedgerCitationResolver(ledger);
    const prov = await resolver.resolve('any', content);
    expect(prov.map((p) => p.sourceId).sort()).toEqual(['/a.md', '/b.md']);
  });
});
