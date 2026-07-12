import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  parseSourceArgs,
  formatLedgerList,
  formatLedgerShow,
  sourceCommand,
} from './source.js';
import {
  SourceLedger,
  acquiredSourceEntry,
  hashContent,
  type SourceLedgerEntry,
} from '../../source-ledger/source-ledger.js';

let dir: string;
let ledgerPath: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(join(tmpdir(), 'source-cli-'));
  ledgerPath = join(dir, 'ledger.jsonl');
});

afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('parseSourceArgs', () => {
  it('parses subcommand, verb, flags, and values', () => {
    const parsed = parseSourceArgs(['ledger', 'show', 'abc123', '--path', 'l.jsonl', '--json']);
    expect(parsed.subcommand).toBe('ledger');
    expect(parsed.positional).toEqual(['show', 'abc123']);
    expect(parsed.path).toBe('l.jsonl');
    expect(parsed.json).toBe(true);
  });

  it('parses --file= and --path= equals forms', () => {
    const parsed = parseSourceArgs(['ledger', 'dedup-check', '--file=paper.pdf', '--path=x.jsonl']);
    expect(parsed.file).toBe('paper.pdf');
    expect(parsed.path).toBe('x.jsonl');
  });
});

describe('formatters', () => {
  it('formatLedgerList handles empty and populated', () => {
    expect(formatLedgerList([])).toContain('empty');
    const entries: SourceLedgerEntry[] = [
      { contentHash: 'a'.repeat(64), provenance: { origin: 'arxiv', sourceId: '2601.1', ingestedAt: 't', label: 'r1' } },
    ];
    const out = formatLedgerList(entries);
    expect(out).toContain('arxiv');
    expect(out).toContain('2601.1');
    expect(out).toContain('r1');
  });

  it('formatLedgerShow reports miss and hit', () => {
    expect(formatLedgerShow('h', [])).toContain('No ledger entries');
    const out = formatLedgerShow('h', [
      { contentHash: 'h', provenance: { origin: 'o', sourceId: 's', ingestedAt: 't' } },
    ]);
    expect(out).toContain('origin=o');
  });
});

describe('sourceCommand', () => {
  it('help returns 0', async () => {
    expect(await sourceCommand([])).toBe(0);
    expect(await sourceCommand(['help'])).toBe(0);
  });

  it('rejects an unknown subcommand', async () => {
    expect(await sourceCommand(['bogus'])).toBe(1);
  });

  it('list prints entries from the ledger file', async () => {
    const ledger = new SourceLedger(ledgerPath);
    await ledger.record(acquiredSourceEntry('a.txt', 'body', 't'));
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await sourceCommand(['ledger', 'list', '--path', ledgerPath]);
    expect(code).toBe(0);
    expect(spy.mock.calls.flat().join('\n')).toContain('learn-acquirer');
  });

  it('dedup-check returns 3 for a duplicate and 0 for a new hash', async () => {
    const ledger = new SourceLedger(ledgerPath);
    await ledger.record(acquiredSourceEntry('a.txt', 'body', 't'));
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const dupHash = hashContent('body');
    expect(await sourceCommand(['ledger', 'dedup-check', dupHash, '--path', ledgerPath])).toBe(3);
    expect(await sourceCommand(['ledger', 'dedup-check', 'f'.repeat(64), '--path', ledgerPath])).toBe(0);
  });

  it('dedup-check --file hashes the file bytes then checks', async () => {
    const file = join(dir, 'paper.txt');
    await fs.writeFile(file, 'paper bytes');
    const ledger = new SourceLedger(ledgerPath);
    await ledger.record(acquiredSourceEntry(file, 'paper bytes', 't'));
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // present → 3
    expect(await sourceCommand(['ledger', 'dedup-check', '--file', file, '--path', ledgerPath])).toBe(3);
  });

  it('show returns 1 when the hash is absent', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(await sourceCommand(['ledger', 'show', 'z'.repeat(64), '--path', ledgerPath])).toBe(1);
  });
});
