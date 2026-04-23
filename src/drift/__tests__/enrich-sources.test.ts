// @ts-nocheck -- imports a .mjs script as runtime JS
import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(here, '../../../scripts/drift/enrich-sources.mjs');

const mod = await import(scriptPath);
const { parseExtractionYaml, toBibEntry, toMetaEntry, fetchArxiv } = mod;

describe('enrich-sources: parseExtractionYaml', () => {
  it('parses a minimal well-formed extraction.yaml', () => {
    const yaml = `schema_version: "1.0.0"
mission: drift-in-llm-systems
extraction_date: 2026-04-23

primary:
  - cite_key: spataru2024sd
    tier: primary
    authors: Spataru, Hambro
    year: 2024
    arxiv_id: "2404.05411"
    title: Semantic Drift
    venue: arXiv
    module: A
    key_finding: SD score 0.78

supporting:
  - cite_key: greenblatt2024intrinsic
    tier: supporting
    authors: Greenblatt
    year: 2024
    arxiv_id: null
    title: Intrinsic Goal Drift
    venue: null
    module: B
    key_finding: Prose mention only
    needs_manual_source_resolution: true
`;
    const out = parseExtractionYaml(yaml);
    expect(out.schema_version).toBe('1.0.0');
    expect(out.mission).toBe('drift-in-llm-systems');
    expect(out.primary).toHaveLength(1);
    expect(out.supporting).toHaveLength(1);
    expect(out.primary[0].cite_key).toBe('spataru2024sd');
    expect(out.primary[0].year).toBe(2024);
    expect(out.primary[0].arxiv_id).toBe('2404.05411');
    expect(out.supporting[0].arxiv_id).toBeNull();
    expect(out.supporting[0].needs_manual_source_resolution).toBe(true);
  });

  it('coerces null/true/false/number scalars', () => {
    const yaml = `mission: test

primary:
  - cite_key: key1
    tier: primary
    authors: A
    year: 2024
    arxiv_id: null
    title: T
    venue: null
    module: A
    key_finding: f
    needs_manual_source_resolution: true
`;
    const out = parseExtractionYaml(yaml);
    expect(out.primary[0].arxiv_id).toBeNull();
    expect(out.primary[0].venue).toBeNull();
    expect(out.primary[0].year).toBe(2024);
    expect(out.primary[0].needs_manual_source_resolution).toBe(true);
  });

  it('ignores comments and blank lines', () => {
    const yaml = `# comment at top
mission: drift

# another comment
primary:
  # and here
  - cite_key: only
    tier: primary
    authors: X
    year: 2025
    arxiv_id: "1234.5678"
    title: T
    venue: arXiv
    module: A
    key_finding: f
`;
    const out = parseExtractionYaml(yaml);
    expect(out.primary).toHaveLength(1);
    expect(out.primary[0].cite_key).toBe('only');
  });
});

describe('enrich-sources: toBibEntry', () => {
  it('emits a BibTeX @misc with arxiv fields', () => {
    const rec = {
      cite_key: 'spataru2024sd',
      authors: 'Spataru, Hambro',
      year: 2024,
      arxiv_id: '2404.05411',
      title: 'Semantic Drift',
      venue: 'arXiv',
    };
    const bib = toBibEntry(rec, { venue: 'arXiv', url: 'https://arxiv.org/abs/2404.05411' });
    expect(bib).toContain('@misc{spataru2024sd');
    expect(bib).toContain('author = {Spataru, Hambro}');
    expect(bib).toContain('year = {2024}');
    expect(bib).toContain('eprint = {2404.05411}');
    expect(bib).toContain('archivePrefix = {arXiv}');
    expect(bib).toContain('url = {https://arxiv.org/abs/2404.05411}');
  });

  it('omits arxiv fields when arxiv_id is null', () => {
    const rec = {
      cite_key: 'greenblatt2024intrinsic',
      authors: 'Greenblatt',
      year: 2024,
      arxiv_id: null,
      title: 'Intrinsic Goal Drift',
    };
    const bib = toBibEntry(rec, null);
    expect(bib).not.toContain('eprint');
    expect(bib).not.toContain('archivePrefix');
    expect(bib).toContain('@misc{greenblatt2024intrinsic');
  });

  it('strips braces from field values to avoid BibTeX syntax errors', () => {
    const rec = { cite_key: 'x', authors: 'Smith {et al}', year: 2024, title: 'Curly{Braces}Title', arxiv_id: null };
    const bib = toBibEntry(rec, null);
    expect(bib).toContain('author = {Smith et al}');
    expect(bib).toContain('title = {CurlyBracesTitle}');
  });
});

describe('enrich-sources: toMetaEntry', () => {
  it('populates all 684.1 placeholder fields', () => {
    const rec = {
      cite_key: 'spataru2024sd',
      tier: 'primary',
      authors: 'Spataru',
      year: 2024,
      arxiv_id: '2404.05411',
      title: 'Semantic Drift',
      venue: 'arXiv',
      module: 'A',
      key_finding: 'SD score 0.78',
    };
    const enrichment = { abstract: 'The real arXiv abstract text.', venue: 'arXiv', url: 'https://arxiv.org/abs/2404.05411' };
    const meta = toMetaEntry(rec, enrichment);
    expect(meta.cite_key).toBe('spataru2024sd');
    expect(meta.tier).toBe('primary');
    expect(meta.abstract).toBe('The real arXiv abstract text.');
    expect(meta.key_finding).toBe('SD score 0.78');
    // 684.1 fields start null
    expect(meta.review_status).toBeNull();
    expect(meta.rigor_score).toBeNull();
    expect(meta.surface_fit).toBeNull();
    expect(meta.opus_notes).toBeNull();
    expect(meta.needs_manual_source_resolution).toBe(false);
  });

  it('marks non-arXiv entries for Phase 684.1 resolution', () => {
    const rec = {
      cite_key: 'greenblatt2024intrinsic',
      tier: 'supporting',
      arxiv_id: null,
      needs_manual_source_resolution: true,
      module: 'B',
      key_finding: 'prose mention',
    };
    const meta = toMetaEntry(rec, null);
    expect(meta.abstract).toBeNull();
    expect(meta.url).toBeNull();
    expect(meta.needs_manual_source_resolution).toBe(true);
  });
});

describe('enrich-sources: fetchArxiv', () => {
  it('returns null for null arxiv_id (no API call)', async () => {
    const result = await fetchArxiv(null);
    expect(result).toBeNull();
  });

  it('parses abstract + id from a mocked arXiv atom response', async () => {
    const fakeXml = `<?xml version="1.0"?>
<feed>
  <entry>
    <id>https://arxiv.org/abs/2404.05411v1</id>
    <published>2024-04-08T17:50:00Z</published>
    <summary>
    We study semantic drift in long-form text generation and propose the SD score.
    </summary>
  </entry>
</feed>`;
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => fakeXml,
    });
    const result = await fetchArxiv('2404.05411', { dryRun: false, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.abstract).toContain('SD score');
    expect(result.url).toContain('2404.05411');
    expect(result.venue).toBe('arXiv');
  });

  it('throws on malformed arxiv-id API error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => '' });
    await expect(fetchArxiv('not-a-real-id', { dryRun: false, fetchImpl })).rejects.toThrow(/arXiv API returned 400/);
  });

  it('respects dry-run mode — no fetch, returns null', async () => {
    const fetchImpl = vi.fn();
    const result = await fetchArxiv('2404.05411', { dryRun: true, fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
