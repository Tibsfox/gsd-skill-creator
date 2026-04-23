// @ts-nocheck -- imports a .mjs script as runtime JS
import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(here, '../../../scripts/drift/fetch-pdfs.mjs');

const mod = await import(scriptPath);
const { validateArxivId, fetchOnePdf, fetchBatch } = mod;

// ---------------------------------------------------------------------------
// validateArxivId — happy path + malformed input
// ---------------------------------------------------------------------------

describe('fetch-pdfs: validateArxivId', () => {
  it('accepts canonical new-format arXiv IDs (happy path)', () => {
    // YYMM.NNNNN — the drift corpus's shape
    const cases = [
      '2404.05411',  // Spataru 2024
      '2409.07085',  // Fastowski 2024
      '2509.01093',  // Wu 2025
      '2601.14210',  // DRIFT 2026
      '2604.05096',  // Liu 2026
      '2404.05411v3',  // versioned
      '1905.10650',  // classical Michel 2019 (4-digit suffix)
    ];
    for (const id of cases) {
      const v = validateArxivId(id);
      expect(v.ok, `${id} should validate`).toBe(true);
      expect(v.format).toBe('new');
      expect(v.normalized).toBe(id);
    }
  });

  it('rejects malformed arXiv IDs with a clear reason (error handling)', () => {
    const cases = [
      { id: null,           expect: /null/ },
      { id: '',             expect: /empty/ },
      { id: 'not-a-real-id',expect: /unrecognized/ },
      { id: 'only-letters', expect: /unrecognized/ },
      { id: '2413.05411',   expect: /invalid month/ },   // month=13
      { id: '2400.05411',   expect: /invalid month/ },   // month=00
      { id: '24.05411',     expect: /unrecognized/ },    // only 2-digit prefix
      { id: 42,             expect: /string/ },
      { id: '   ',          expect: /empty/ },
    ];
    for (const { id, expect: rx } of cases) {
      const v = validateArxivId(id);
      expect(v.ok, `${JSON.stringify(id)} should be invalid`).toBe(false);
      expect(v.reason).toMatch(rx);
    }
  });

  it('flags pre-2007 format with a warning but still accepts it', () => {
    const v = validateArxivId('math.CO/0201001');
    expect(v.ok).toBe(true);
    expect(v.format).toBe('old');
    expect(v.warning).toMatch(/pre-2007/);
  });
});

// ---------------------------------------------------------------------------
// fetchOnePdf — dry-run skips the network, malformed IDs short-circuit, cache
// path preserves bytes
// ---------------------------------------------------------------------------

describe('fetch-pdfs: fetchOnePdf', () => {
  it('short-circuits on malformed arxiv_id without hitting the network', async () => {
    const fetchSpy = vi.fn();
    const res = await fetchOnePdf('not-a-real-id', { outDir: '/tmp', fetchImpl: fetchSpy });
    expect(res.status).toBe('skip');
    expect(res.reason).toMatch(/unrecognized/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('honors --dry-run — no fetch, returns the planned URL', async () => {
    const fetchSpy = vi.fn();
    const res = await fetchOnePdf('2404.05411', { outDir: '/tmp', dryRun: true, fetchImpl: fetchSpy });
    expect(res.status).toBe('dry-run');
    expect(res.url).toContain('2404.05411');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('writes a %PDF- payload to disk and returns ok', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fetch-pdfs-'));
    const body = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(32, 0x20)]);
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => body,
    }));
    const res = await fetchOnePdf('2404.05411', { outDir: tmp, fetchImpl });
    expect(res.status).toBe('ok');
    expect(fs.existsSync(res.path)).toBe(true);
    expect(fs.readFileSync(res.path).slice(0, 5).toString()).toBe('%PDF-');
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('rejects non-PDF responses (e.g. HTML error page)', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fetch-pdfs-'));
    const body = Buffer.from('<html>404 Not Found</html>');
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, arrayBuffer: async () => body }));
    const res = await fetchOnePdf('2404.05411', { outDir: tmp, fetchImpl });
    expect(res.status).toBe('error');
    expect(res.reason).toMatch(/not a PDF/);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('returns cached without re-fetching when file already exists', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fetch-pdfs-'));
    const outPath = path.join(tmp, '2404.05411.pdf');
    fs.writeFileSync(outPath, '%PDF-preexisting');
    const fetchSpy = vi.fn();
    const res = await fetchOnePdf('2404.05411', { outDir: tmp, fetchImpl: fetchSpy });
    expect(res.status).toBe('cached');
    expect(fetchSpy).not.toHaveBeenCalled();
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});

// ---------------------------------------------------------------------------
// fetchBatch — rate-limit is skipped on dry-run, results carry cite_key
// ---------------------------------------------------------------------------

describe('fetch-pdfs: fetchBatch', () => {
  it('preserves cite_key on every result and skips rate-limit on dry-run', async () => {
    const fetchSpy = vi.fn();
    const entries = [
      { cite_key: 'a', arxiv_id: '2404.05411' },
      { cite_key: 'b', arxiv_id: '2409.07085' },
      { cite_key: 'c', arxiv_id: null },
    ];
    const t0 = Date.now();
    const results = await fetchBatch(entries, { dryRun: true, rateMs: 10_000, fetchImpl: fetchSpy });
    const dt = Date.now() - t0;
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.cite_key)).toEqual(['a', 'b', 'c']);
    expect(results[2].status).toBe('skip');
    expect(dt).toBeLessThan(500); // no 10s sleep
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
