/**
 * TDD tests for Aminet package search engine.
 *
 * Tests searchPackages() for substring matching across name, description,
 * and author fields with relevance ranking and category pre-filtering.
 */

import { describe, it, expect } from 'vitest';
import type { AminetPackage, PackageReadme } from './types.js';
import { searchPackages } from './search.js';

// ============================================================================
// Test fixtures
// ============================================================================

const protracker: AminetPackage = {
  filename: 'ProTracker36.lha',
  directory: 'mus/edit',
  category: 'mus',
  subcategory: 'edit',
  sizeKb: 145,
  ageDays: 3200,
  description: 'The ultimate music tracker',
  fullPath: 'mus/edit/ProTracker36.lha',
};

const blasteroids: AminetPackage = {
  filename: 'Blasteroids.lha',
  directory: 'game/shoot',
  category: 'game',
  subcategory: 'shoot',
  sizeKb: 320,
  ageDays: 4100,
  description: 'Classic arcade shooter',
  fullPath: 'game/shoot/Blasteroids.lha',
};

const lhaUtil: AminetPackage = {
  filename: 'LhA.lha',
  directory: 'util/arc',
  category: 'util',
  subcategory: 'arc',
  sizeKb: 48,
  ageDays: 2800,
  description: 'Fast LhA archiver for AmigaOS',
  fullPath: 'util/arc/LhA.lha',
};

const octamed: AminetPackage = {
  filename: 'OctaMED_SS.lha',
  directory: 'mus/edit',
  category: 'mus',
  subcategory: 'edit',
  sizeKb: 580,
  ageDays: 2900,
  description: 'Professional music editor and sequencer',
  fullPath: 'mus/edit/OctaMED_SS.lha',
};

const dopus: AminetPackage = {
  filename: 'DOpus55.lha',
  directory: 'util/dir',
  category: 'util',
  subcategory: 'dir',
  sizeKb: 920,
  ageDays: 3500,
  description: 'Directory Opus file manager',
  fullPath: 'util/dir/DOpus55.lha',
};

const allPackages: AminetPackage[] = [protracker, blasteroids, lhaUtil, octamed, dopus];

/** Readme index: only ProTracker and OctaMED have author data */
const readmeIndex = new Map<string, PackageReadme>([
  [
    'mus/edit/ProTracker36.lha',
    {
      short: 'The ultimate music tracker',
      author: 'Lars Hamre',
      uploader: 'lars@amiga.no',
      type: 'mus/edit',
      version: '3.62b',
      requires: ['OS 2.0+'],
      architecture: ['m68k-amigaos'],
      description: 'ProTracker is a 4-channel MOD tracker.',
      rawHeader: { short: 'The ultimate music tracker', author: 'Lars Hamre' },
    },
  ],
  [
    'mus/edit/OctaMED_SS.lha',
    {
      short: 'Professional music editor',
      author: 'Teijo Kinnunen',
      uploader: 'teijo@med.fi',
      type: 'mus/edit',
      version: '2.0',
      requires: ['OS 3.0+', 'AGA'],
      architecture: ['m68k-amigaos'],
      description: 'OctaMED SoundStudio is an 8-channel tracker.',
      rawHeader: { short: 'Professional music editor', author: 'Teijo Kinnunen' },
    },
  ],
]);

// ============================================================================
// Tests
// ============================================================================

describe('searchPackages', () => {
  it('finds packages by filename substring', () => {
    const results = searchPackages(allPackages, readmeIndex, { query: 'ProTracker' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].package.filename).toBe('ProTracker36.lha');
    expect(results[0].score).toBe(3);
    expect(results[0].matchField).toBe('name');
  });

  it('finds packages by description substring', () => {
    const results = searchPackages(allPackages, readmeIndex, { query: 'music editor' });
    // OctaMED has "music editor" in its description
    const octamedResult = results.find((r) => r.package.filename === 'OctaMED_SS.lha');
    expect(octamedResult).toBeDefined();
    expect(octamedResult!.score).toBe(2);
    expect(octamedResult!.matchField).toBe('description');
  });

  it('finds packages by author from readme index', () => {
    const results = searchPackages(allPackages, readmeIndex, { query: 'lars' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    const larsResult = results.find((r) => r.package.filename === 'ProTracker36.lha');
    expect(larsResult).toBeDefined();
    expect(larsResult!.score).toBe(1);
    expect(larsResult!.matchField).toBe('author');
  });

  it('is case-insensitive', () => {
    const results = searchPackages(allPackages, readmeIndex, { query: 'protracker' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].package.filename).toBe('ProTracker36.lha');
  });

  it('ranks results by score descending (name > description > author)', () => {
    // "tracker" appears in ProTracker filename (score 3) and ProTracker description "music tracker" (would match desc too, but name takes priority)
    const results = searchPackages(allPackages, readmeIndex, { query: 'tracker' });
    // ProTracker matches by name (score 3), should be first
    expect(results[0].package.filename).toBe('ProTracker36.lha');
    expect(results[0].score).toBe(3);
  });

  it('returns default limit of 50 results', () => {
    // Create 60 packages that all match
    const manyPackages: AminetPackage[] = Array.from({ length: 60 }, (_, i) => ({
      filename: `TestPkg${i}.lha`,
      directory: 'util/misc',
      category: 'util',
      subcategory: 'misc',
      sizeKb: 10,
      ageDays: 100,
      description: 'A test package',
      fullPath: `util/misc/TestPkg${i}.lha`,
    }));
    const results = searchPackages(manyPackages, new Map(), { query: 'TestPkg' });
    expect(results.length).toBe(50);
  });

  it('respects custom limit', () => {
    const results = searchPackages(allPackages, readmeIndex, { query: 'lha', limit: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('returns empty array for empty query', () => {
    const results = searchPackages(allPackages, readmeIndex, { query: '' });
    expect(results).toEqual([]);
  });

  it('skips author search when package has no readme entry', () => {
    // Blasteroids has no readme; searching for a term only in its (nonexistent) author should not match
    const results = searchPackages([blasteroids], readmeIndex, { query: 'SomeAuthor' });
    expect(results.length).toBe(0);
  });

  it('filters by category when options.category is set', () => {
    const results = searchPackages(allPackages, readmeIndex, {
      query: 'lha',
      category: 'util',
    });
    // Only util packages should appear
    for (const r of results) {
      expect(r.package.category).toBe('util');
    }
    // LhA.lha is in util, should be found
    expect(results.some((r) => r.package.filename === 'LhA.lha')).toBe(true);
  });

  it('filters by subcategory when options.subcategory is set', () => {
    const results = searchPackages(allPackages, readmeIndex, {
      query: 'music',
      category: 'mus',
      subcategory: 'edit',
    });
    // Only mus/edit packages
    for (const r of results) {
      expect(r.package.category).toBe('mus');
      expect(r.package.subcategory).toBe('edit');
    }
  });

  it('returns highest-scoring match field when multiple fields match', () => {
    // ProTracker matches by name (score 3) -- even though description also contains "tracker"
    const results = searchPackages(allPackages, readmeIndex, { query: 'ProTracker' });
    const pt = results.find((r) => r.package.filename === 'ProTracker36.lha');
    expect(pt).toBeDefined();
    expect(pt!.score).toBe(3);
    expect(pt!.matchField).toBe('name');
  });
});
