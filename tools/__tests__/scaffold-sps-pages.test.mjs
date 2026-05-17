/**
 * tools/__tests__/scaffold-sps-pages.test.mjs — v1.49.664 cc-1 C06 tests.
 *
 * Hermetic: each test uses a tmpdir as spsRoot; manifest is in-memory via the
 * exported scaffoldSpsPages() function with overridable spsRoot + manifestPath.
 * Mirrors the scaffold-cross-track-dirs.test.mjs pure-helper pattern.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  SCAFFOLD_MARKER,
  renderSpsStub,
  renderDataSourcesStub,
  renderKnowledgeNodesStub,
  loadManifest,
  scaffoldSpsPages,
} from '../scaffold-sps-pages.mjs';

let tmpRoot, spsRoot, manifestPath;

function manifestBody(entries) {
  return JSON.stringify({ schema: 'scaffold-sps-pages/v1', species: entries }, null, 2);
}

function fixture(slug, overrides = {}) {
  return {
    slug,
    common_name: 'Test Species',
    scientific_name: 'Testum testum',
    authority: 'Test, 2026',
    sps_number: 999,
    class: 'Aves',
    order: 'Test',
    family: 'Test',
    cohort_entry_milestone: 'v1.49.664',
    cross_track_nasa: 'STS-test',
    structural_firsts: ['FIRST-TEST'],
    substrate_tags: ['TEST-TAG'],
    ...overrides,
  };
}

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'scaffold-sps-test-'));
  spsRoot = join(tmpRoot, 'SPS');
  mkdirSync(spsRoot, { recursive: true });
  manifestPath = join(tmpRoot, 'manifest.json');
});

afterEach(() => { try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {} });

describe('scaffold-sps-pages: pure helpers', () => {
  it('renderSpsStub embeds the SCAFFOLD-PENDING marker', () => {
    const html = renderSpsStub(fixture('x'));
    expect(html).toContain(SCAFFOLD_MARKER);
  });

  it('renderSpsStub includes common_name + scientific_name + family fields', () => {
    const html = renderSpsStub(fixture('x', {
      common_name: 'Roosevelt Elk',
      scientific_name: 'Cervus canadensis roosevelti',
      family: 'Cervidae',
      sps_number: 116,
    }));
    expect(html).toContain('Roosevelt Elk');
    expect(html).toContain('Cervus canadensis roosevelti');
    expect(html).toContain('Cervidae');
    expect(html).toContain('SPS #116');
  });

  it('renderDataSourcesStub sets scaffold_pending=true and empty data_sources', () => {
    const json = JSON.parse(renderDataSourcesStub(fixture('x')));
    expect(json.scaffold_pending).toBe(true);
    expect(json.data_sources).toEqual([]);
  });

  it('renderKnowledgeNodesStub sets scaffold_pending=true and empty knowledge_nodes', () => {
    const json = JSON.parse(renderKnowledgeNodesStub(fixture('x')));
    expect(json.scaffold_pending).toBe(true);
    expect(json.knowledge_nodes).toEqual([]);
  });

  it('loadManifest throws on missing file', () => {
    expect(() => loadManifest('/nonexistent/path.json')).toThrow(/not found/);
  });

  it('loadManifest throws on malformed JSON', () => {
    writeFileSync(manifestPath, 'not json');
    expect(() => loadManifest(manifestPath)).toThrow(/parse error/);
  });

  it('loadManifest throws when species array is missing', () => {
    writeFileSync(manifestPath, JSON.stringify({ schema: 'x' }));
    expect(() => loadManifest(manifestPath)).toThrow(/species/);
  });
});

describe('scaffold-sps-pages: integration', () => {
  it('--dry-run reports without writing', () => {
    writeFileSync(manifestPath, manifestBody([fixture('test-bird')]));
    const summary = scaffoldSpsPages({ dryRun: true, manifestPath, spsRoot });
    expect(summary.files_created.length).toBeGreaterThanOrEqual(4);
    expect(existsSync(join(spsRoot, 'test-bird'))).toBe(false);
  });

  it('creates dir + 3 files + artifacts/ for a missing species', () => {
    writeFileSync(manifestPath, manifestBody([fixture('test-bird')]));
    scaffoldSpsPages({ manifestPath, spsRoot });
    expect(existsSync(join(spsRoot, 'test-bird/index.html'))).toBe(true);
    expect(existsSync(join(spsRoot, 'test-bird/data-sources.json'))).toBe(true);
    expect(existsSync(join(spsRoot, 'test-bird/knowledge-nodes.json'))).toBe(true);
    expect(existsSync(join(spsRoot, 'test-bird/artifacts'))).toBe(true);
  });

  it('writes SCAFFOLD-PENDING marker into HTML stub on disk', () => {
    writeFileSync(manifestPath, manifestBody([fixture('test-bird')]));
    scaffoldSpsPages({ manifestPath, spsRoot });
    const html = readFileSync(join(spsRoot, 'test-bird/index.html'), 'utf8');
    expect(html).toContain('SCAFFOLD-PENDING');
  });

  it('idempotent: never overwrites existing files (completes partials)', () => {
    // Pre-create dir with only index.html (the marbled-murrelet partial case)
    mkdirSync(join(spsRoot, 'partial'), { recursive: true });
    writeFileSync(join(spsRoot, 'partial/index.html'), '<html>existing real content</html>\n');
    writeFileSync(manifestPath, manifestBody([fixture('partial')]));

    scaffoldSpsPages({ manifestPath, spsRoot });
    // Existing index.html UNTOUCHED
    expect(readFileSync(join(spsRoot, 'partial/index.html'), 'utf8')).toBe('<html>existing real content</html>\n');
    // Missing files NOW created
    expect(existsSync(join(spsRoot, 'partial/data-sources.json'))).toBe(true);
    expect(existsSync(join(spsRoot, 'partial/knowledge-nodes.json'))).toBe(true);
    expect(existsSync(join(spsRoot, 'partial/artifacts'))).toBe(true);
  });

  it('second run is a no-op (all files skipped as existing)', () => {
    writeFileSync(manifestPath, manifestBody([fixture('test-bird')]));
    scaffoldSpsPages({ manifestPath, spsRoot });
    const second = scaffoldSpsPages({ manifestPath, spsRoot });
    expect(second.files_created.length).toBe(0);
    expect(second.files_skipped_existing.length).toBeGreaterThanOrEqual(4);
  });

  it('handles multiple species in one run', () => {
    writeFileSync(manifestPath, manifestBody([
      fixture('alpha', { sps_number: 100 }),
      fixture('beta', { sps_number: 101 }),
      fixture('gamma', { sps_number: 102 }),
    ]));
    scaffoldSpsPages({ manifestPath, spsRoot });
    expect(existsSync(join(spsRoot, 'alpha/index.html'))).toBe(true);
    expect(existsSync(join(spsRoot, 'beta/index.html'))).toBe(true);
    expect(existsSync(join(spsRoot, 'gamma/index.html'))).toBe(true);
  });

  it('records errors in summary instead of throwing on missing manifest', () => {
    const summary = scaffoldSpsPages({ manifestPath: '/nonexistent/manifest.json', spsRoot });
    expect(summary.errors.length).toBeGreaterThan(0);
    expect(summary.errors[0].error).toMatch(/not found/);
  });
});
