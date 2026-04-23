// @ts-nocheck -- imports a .mjs script as runtime JS
import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(here, '../../../scripts/convergent/enrich-sources.mjs');

const mod = await import(scriptPath);
const { parseExtractionYaml, toBibEntry, toMetaEntry, fetchArxiv } = mod;

describe('convergent enrich-sources: parseExtractionYaml (3-tier)', () => {
  it('parses a minimal well-formed extraction.yaml with all three tiers', () => {
    const yaml = `schema_version: "1.0.0"
mission: arxiv-april-2026-convergent-substrate
extraction_date: 2026-04-23

tier_s:
  - cite_key: liu2026wildskills
    tier: tier_s
    authors: Liu et al.
    year: 2026
    arxiv_id: "2604.04323"
    title: How Well Do Agentic Skills Work
    venue: arXiv
    module: skill-creator-loop
    key_finding: retrieval plus refinement lifts pass rate
    alleged_flag: false
    needs_manual_source_resolution: false

tier_a:
  - cite_key: mu2026talklora
    tier: tier_a
    authors: Mu et al.
    year: 2026
    arxiv_id: "2604.06291"
    title: TalkLoRA
    venue: arXiv
    module: chipset
    key_finding: cross-expert communication smooths routing
    alleged_flag: false
    needs_manual_source_resolution: false

tier_b:
  - cite_key: extagents2025
    tier: tier_b
    authors: Anonymous
    year: 2025
    arxiv_id: "2505.21471"
    title: ExtAgents
    venue: arXiv
    module: context-tactics
    key_finding: multi-agent framework for external knowledge
    alleged_flag: true
    needs_manual_source_resolution: false
`;
    const out = parseExtractionYaml(yaml);
    expect(out.schema_version).toBe('1.0.0');
    expect(out.mission).toBe('arxiv-april-2026-convergent-substrate');
    expect(out.tier_s).toHaveLength(1);
    expect(out.tier_a).toHaveLength(1);
    expect(out.tier_b).toHaveLength(1);
    expect(out.tier_s[0].cite_key).toBe('liu2026wildskills');
    expect(out.tier_a[0].cite_key).toBe('mu2026talklora');
    expect(out.tier_b[0].cite_key).toBe('extagents2025');
    expect(out.tier_b[0].alleged_flag).toBe(true);
    expect(out.tier_s[0].alleged_flag).toBe(false);
  });

  it('coerces scalar null/true/false/number correctly', () => {
    const yaml = `mission: test

tier_s:
  - cite_key: key1
    tier: tier_s
    authors: A
    year: 2024
    arxiv_id: null
    title: T
    venue: null
    module: A
    key_finding: f
    alleged_flag: true
    needs_manual_source_resolution: true
`;
    const out = parseExtractionYaml(yaml);
    expect(out.tier_s[0].arxiv_id).toBeNull();
    expect(out.tier_s[0].venue).toBeNull();
    expect(out.tier_s[0].year).toBe(2024);
    expect(out.tier_s[0].alleged_flag).toBe(true);
    expect(out.tier_s[0].needs_manual_source_resolution).toBe(true);
  });

  it('ignores comments and blank lines', () => {
    const yaml = `# header comment
mission: convergent

# mid comment
tier_a:
  # indented comment
  - cite_key: only
    tier: tier_a
    authors: X
    year: 2026
    arxiv_id: "1234.5678"
    title: T
    venue: arXiv
    module: A
    key_finding: f
    alleged_flag: false
`;
    const out = parseExtractionYaml(yaml);
    expect(out.tier_a).toHaveLength(1);
    expect(out.tier_a[0].cite_key).toBe('only');
  });

  it('handles empty tier groups gracefully', () => {
    const yaml = `mission: test

tier_s:

tier_a:
  - cite_key: only_a
    tier: tier_a
    authors: X
    year: 2026
    arxiv_id: "1111.2222"
    title: T
    venue: arXiv
    module: A
    key_finding: f
    alleged_flag: false
`;
    const out = parseExtractionYaml(yaml);
    expect(out.tier_s).toHaveLength(0);
    expect(out.tier_a).toHaveLength(1);
    expect(out.tier_b).toHaveLength(0);
  });
});

describe('convergent enrich-sources: toBibEntry', () => {
  it('emits a BibTeX @misc with arxiv fields', () => {
    const rec = {
      cite_key: 'liu2026wildskills',
      authors: 'Liu et al.',
      year: 2026,
      arxiv_id: '2604.04323',
      title: 'Agentic Skills in the Wild',
      venue: 'arXiv',
    };
    const bib = toBibEntry(rec, { venue: 'arXiv', url: 'https://arxiv.org/abs/2604.04323' });
    expect(bib).toContain('@misc{liu2026wildskills');
    expect(bib).toContain('author = {Liu et al.}');
    expect(bib).toContain('year = {2026}');
    expect(bib).toContain('eprint = {2604.04323}');
    expect(bib).toContain('archivePrefix = {arXiv}');
    expect(bib).toContain('url = {https://arxiv.org/abs/2604.04323}');
  });

  it('omits arxiv fields when arxiv_id is null', () => {
    const rec = {
      cite_key: 'nonarxiv',
      authors: 'Anonymous',
      year: 2026,
      arxiv_id: null,
      title: 'Unindexed Paper',
    };
    const bib = toBibEntry(rec, null);
    expect(bib).not.toContain('eprint');
    expect(bib).not.toContain('archivePrefix');
    expect(bib).toContain('@misc{nonarxiv');
  });

  it('strips braces from field values to avoid BibTeX syntax errors', () => {
    const rec = { cite_key: 'x', authors: 'Smith {et al}', year: 2026, title: 'Curly{Braces}Title', arxiv_id: null };
    const bib = toBibEntry(rec, null);
    expect(bib).toContain('author = {Smith et al}');
    expect(bib).toContain('title = {CurlyBracesTitle}');
  });
});

describe('convergent enrich-sources: toMetaEntry (alleged_flag aware)', () => {
  it('populates all 701.1 placeholder fields plus alleged_flag', () => {
    const rec = {
      cite_key: 'ni2026coevoskills',
      tier: 'tier_s',
      authors: 'Ni et al.',
      year: 2026,
      arxiv_id: '2604.01687',
      title: 'CoEvoSkills',
      venue: 'arXiv',
      module: 'skill-creator-loop',
      key_finding: 'Surrogate+Oracle dual verification; 71.1% pass',
      alleged_flag: true,
    };
    const enrichment = { abstract: 'The real arXiv abstract.', venue: 'arXiv', url: 'https://arxiv.org/abs/2604.01687' };
    const meta = toMetaEntry(rec, enrichment);
    expect(meta.cite_key).toBe('ni2026coevoskills');
    expect(meta.tier).toBe('tier_s');
    expect(meta.abstract).toBe('The real arXiv abstract.');
    expect(meta.alleged_flag).toBe(true);
    // 701.1 fields start null
    expect(meta.review_status).toBeNull();
    expect(meta.rigor_score).toBeNull();
    expect(meta.surface_fit).toBeNull();
    expect(meta.opus_notes).toBeNull();
    expect(meta.needs_manual_source_resolution).toBe(false);
  });

  it('defaults alleged_flag to false when field absent', () => {
    const rec = {
      cite_key: 'verified',
      tier: 'tier_s',
      arxiv_id: '2604.04323',
      module: 'A',
      key_finding: 'f',
    };
    const meta = toMetaEntry(rec, null);
    expect(meta.alleged_flag).toBe(false);
  });
});

describe('convergent enrich-sources: fetchArxiv', () => {
  it('returns null for null arxiv_id (no API call)', async () => {
    const result = await fetchArxiv(null);
    expect(result).toBeNull();
  });

  it('parses abstract + id from a mocked arXiv atom response', async () => {
    const fakeXml = `<?xml version="1.0"?>
<feed>
  <entry>
    <id>https://arxiv.org/abs/2604.04323v1</id>
    <published>2026-04-06T17:50:00Z</published>
    <summary>
    We present a benchmark for agentic skills retrieved from 34000 real-world skills.
    </summary>
  </entry>
</feed>`;
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => fakeXml,
    });
    const result = await fetchArxiv('2604.04323', { dryRun: false, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.abstract).toContain('34000 real-world skills');
    expect(result.url).toContain('2604.04323');
    expect(result.venue).toBe('arXiv');
  });

  it('throws on malformed arxiv-id API error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => '' });
    await expect(fetchArxiv('not-a-real-id', { dryRun: false, fetchImpl })).rejects.toThrow(/arXiv API returned 400/);
  });

  it('respects dry-run mode — no fetch, returns null', async () => {
    const fetchImpl = vi.fn();
    const result = await fetchArxiv('2604.04323', { dryRun: true, fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
