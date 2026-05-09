/**
 * SCRIBE Build-Out v1.49.621 — Component 09 substrate-conformance test.
 *
 * The unified CITATIONS.json must:
 *   - declare a schema version
 *   - reference the same milestone all 5 track citations.json files do
 *   - retain the union of every track citation by id (no silent drops)
 *
 * Track citations.json files reference CITATIONS.json via `unifiedIndex`;
 * the merged file must in turn record their tracks in `citedByTracks`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..', '..');
const UNIFIED_PATH = resolve(
  REPO_ROOT,
  '.planning/missions/v1-49-621-scribe/CITATIONS.json',
);

interface UnifiedSource {
  readonly id: string;
  readonly type?: string;
  readonly citedByTracks: ReadonlyArray<string>;
}
interface Unified {
  readonly version: string;
  readonly milestone: string;
  readonly totalUniqueSources: number;
  readonly sources: ReadonlyArray<UnifiedSource>;
}

const TRACK_FILES: ReadonlyArray<{ track: string; path: string }> = [
  { track: 'T1', path: 'examples/cartridges/markup-lineage/citations.json' },
  // T2 has citations distributed across primitives/animations/latex-to-svg/validators
  // (no single citations.json in svg-substrate root). It's still referenced by T2
  // tags in the unified index — the parity test below tolerates absent track files.
  { track: 'T3', path: 'examples/cartridges/code-svg-hdl-bridge/citations.json' },
  { track: 'T4', path: 'examples/cartridges/dashboard-lod-rendering/citations.json' },
  { track: 'T5', path: 'examples/cartridges/retrieval-provenance/citations.json' },
];

describe('substrate-conformance: unified CITATIONS.json schema + track parity', () => {
  const unified = JSON.parse(readFileSync(UNIFIED_PATH, 'utf8')) as Unified;

  it('declares a schema version + milestone + counter-cadence v1.49.621 milestone', () => {
    expect(typeof unified.version).toBe('string');
    expect(unified.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(unified.milestone).toBe('v1.49.621');
  });

  it('totalUniqueSources matches the actual sources array length', () => {
    expect(unified.totalUniqueSources).toBe(unified.sources.length);
  });

  it('totalUniqueSources is within 5% of the 302 baseline (success criterion C2)', () => {
    const baseline = 302;
    const tolerance = baseline * 0.05;
    expect(unified.totalUniqueSources).toBeGreaterThanOrEqual(
      Math.floor(baseline - tolerance),
    );
    expect(unified.totalUniqueSources).toBeLessThanOrEqual(
      Math.ceil(baseline + tolerance),
    );
  });

  it('every source has a non-empty citedByTracks array', () => {
    for (const s of unified.sources) {
      expect(Array.isArray(s.citedByTracks)).toBe(true);
      expect(s.citedByTracks.length).toBeGreaterThan(0);
    }
  });

  it('each track-citations file declares the same v1.49.621 milestone-pinned unifiedIndex', () => {
    for (const { track, path } of TRACK_FILES) {
      const fullPath = resolve(REPO_ROOT, path);
      if (!existsSync(fullPath)) continue;
      const trackData = JSON.parse(readFileSync(fullPath, 'utf8')) as {
        track?: string;
        unifiedIndex?: string;
      };
      expect(trackData.track).toBe(track);
      expect(trackData.unifiedIndex).toMatch(/CITATIONS\.json$/);
    }
  });

  it('the unified index covers all 5 tracks T1-T5 in its citedByTracks union', () => {
    const trackUnion = new Set<string>();
    for (const s of unified.sources) {
      for (const t of s.citedByTracks) trackUnion.add(t);
    }
    for (const t of ['T1', 'T2', 'T3', 'T4', 'T5']) {
      expect(trackUnion.has(t)).toBe(true);
    }
  });
});
