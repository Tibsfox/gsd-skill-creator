/**
 * Component 01 — merge-citations.ts unit tests.
 *
 * Covers dedup correctness across the four primary-key tiers (arXiv, DOI,
 * W3C TR, fallback), idempotent re-runs, citedByTracks completeness, and
 * the on-disk CITATIONS.json artifact's tolerance bound.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  mergeCitations,
  primaryKeyFor,
  TRACK_CITATIONS,
  type RawCitation,
} from '../merge-citations.js';
import type {
  UnifiedCitationIndex,
} from '../../types/cartridge-manifest.js';

const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..');

describe('primaryKeyFor — dedup key precedence', () => {
  it('prefers arXiv id when present', () => {
    const c: RawCitation = { id: 'x', type: 'paper', title: 't', arxivId: '2010.04050', doi: '10.1/x' };
    expect(primaryKeyFor(c)).toBe('arxiv:2010.04050');
  });

  it('falls back to DOI when arXiv id absent', () => {
    const c: RawCitation = { id: 'x', type: 'paper', title: 't', doi: '10.1/x' };
    expect(primaryKeyFor(c)).toBe('doi:10.1/x');
  });

  it('uses W3C shortname+version when present and no arXiv/DOI', () => {
    const c: RawCitation = { id: 'x', type: 'spec', title: 't', w3cShortname: 'svg', w3cVersion: '2.0' };
    expect(primaryKeyFor(c)).toBe('w3c:svg:2.0');
  });

  it('uses fallback (author-year-title-hash) for entries without canonical ids', () => {
    const c: RawCitation = { id: 'x', type: 'web', title: 'Some Page', authors: ['Jane Doe'], year: 2024 };
    const pk = primaryKeyFor(c);
    expect(pk.startsWith('fallback:jane-doe:2024:')).toBe(true);
  });
});

describe('mergeCitations — dedup behaviour', () => {
  it('collapses two arXiv-keyed entries from different tracks into one', () => {
    const result = mergeCitations({
      milestone: 'v1.49.621',
      perTrack: new Map([
        ['T2', [{ id: 'diffvg', type: 'paper', title: 'DiffVG', arxivId: '2010.04050' } as RawCitation]],
        ['T3', [{ id: 'diffvg', type: 'paper', title: 'DiffVG', arxivId: '2010.04050' } as RawCitation]],
      ]),
    });
    expect(result.totalUniqueSources).toBe(1);
    expect(result.sources[0].citedByTracks).toEqual(['T2', 'T3']);
  });

  it('collapses two DOI-keyed entries from different tracks into one', () => {
    const result = mergeCitations({
      milestone: 'v1.49.621',
      perTrack: new Map([
        ['T3', [{ id: 'sug', type: 'paper', title: 'Sugiyama', doi: '10.1109/TSMC.1981.4308636' } as RawCitation]],
        ['T4', [{ id: 'sug', type: 'paper', title: 'Sugiyama', doi: '10.1109/TSMC.1981.4308636' } as RawCitation]],
      ]),
    });
    expect(result.totalUniqueSources).toBe(1);
    expect(result.sources[0].citedByTracks).toEqual(['T3', 'T4']);
  });

  it('collapses two W3C TR-keyed entries from different tracks into one', () => {
    const result = mergeCitations({
      milestone: 'v1.49.621',
      perTrack: new Map([
        ['T2', [{ id: 'svg2', type: 'spec', title: 'SVG 2', w3cShortname: 'svg', w3cVersion: '2.0' } as RawCitation]],
        ['T4', [{ id: 'svg2', type: 'spec', title: 'SVG 2', w3cShortname: 'svg', w3cVersion: '2.0' } as RawCitation]],
      ]),
    });
    expect(result.totalUniqueSources).toBe(1);
    expect(result.sources[0].citedByTracks).toEqual(['T2', 'T4']);
  });

  it('collapses fallback-keyed entries when author+year+title hash collides', () => {
    const a: RawCitation = { id: 'a', type: 'web', title: 'Same Title', authors: ['Same Author'], year: 2020 };
    const b: RawCitation = { id: 'a', type: 'web', title: 'Same Title', authors: ['Same Author'], year: 2020 };
    const result = mergeCitations({
      milestone: 'v1.49.621',
      perTrack: new Map([['T1', [a]], ['T5', [b]]]),
    });
    expect(result.totalUniqueSources).toBe(1);
    expect(result.sources[0].citedByTracks).toEqual(['T1', 'T5']);
  });

  it('sorts sources by id ascending and unions loadBearingFor across tracks', () => {
    const result = mergeCitations({
      milestone: 'v1.49.621',
      perTrack: new Map([
        ['T2', [{ id: 'diffvg', type: 'paper', title: 'DiffVG', arxivId: '2010.04050', loadBearingFor: ['CAP-006'] } as RawCitation, { id: 'aaa-first', type: 'paper', title: 'A', arxivId: '0000.0001' } as RawCitation]],
        ['T3', [{ id: 'diffvg', type: 'paper', title: 'DiffVG', arxivId: '2010.04050', loadBearingFor: ['CAP-008'] } as RawCitation]],
      ]),
    });
    // Sorted by id
    expect(result.sources.map((s) => s.id)).toEqual(['aaa-first', 'diffvg']);
    // loadBearingFor union, sorted
    const diffvg = result.sources.find((s) => s.id === 'diffvg')!;
    expect(diffvg.loadBearingFor).toEqual(['CAP-006', 'CAP-008']);
  });

  it('produces idempotent (byte-identical) JSON across repeat invocations', () => {
    const a = mergeCitations({ milestone: 'v1.49.621', perTrack: TRACK_CITATIONS });
    const b = mergeCitations({ milestone: 'v1.49.621', perTrack: TRACK_CITATIONS });
    expect(JSON.stringify(a, null, 2)).toBe(JSON.stringify(b, null, 2));
  });
});

describe('On-disk CITATIONS.json artifact', () => {
  let index: UnifiedCitationIndex;

  it('parses against the UnifiedCitationIndex shape', () => {
    const path = resolve(REPO_ROOT, '.planning/missions/v1-49-621-scribe/CITATIONS.json');
    index = JSON.parse(readFileSync(path, 'utf8')) as UnifiedCitationIndex;
    expect(index.version).toBe('1.0.0');
    expect(index.milestone).toBe('v1.49.621');
    expect(typeof index.totalUniqueSources).toBe('number');
    expect(index.sources.length).toBe(index.totalUniqueSources);
  });

  it('totalUniqueSources is within the [287, 317] tolerance band (5% around 302)', () => {
    expect(index.totalUniqueSources).toBeGreaterThanOrEqual(287);
    expect(index.totalUniqueSources).toBeLessThanOrEqual(317);
  });

  it('every citedByTracks entry references a known track tag (T1..T5)', () => {
    const known = new Set(['T1', 'T2', 'T3', 'T4', 'T5']);
    for (const s of index.sources) {
      expect(s.citedByTracks.length).toBeGreaterThan(0);
      for (const t of s.citedByTracks) expect(known.has(t)).toBe(true);
    }
  });

  it('source ids are unique and the array is sorted ascending', () => {
    const ids = index.sources.map((s) => s.id);
    const sorted = [...ids].sort((a, b) => a.localeCompare(b));
    expect(ids).toEqual(sorted);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
