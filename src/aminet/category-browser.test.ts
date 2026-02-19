/**
 * TDD tests for category-browser.ts
 *
 * Tests buildCategoryTree, listPackages, filterByArchitecture,
 * and filterByOsVersion using synthetic Aminet package fixtures.
 */

import { describe, it, expect } from 'vitest';
import type { AminetPackage, PackageReadme } from './types.js';
import {
  buildCategoryTree,
  listPackages,
  filterByArchitecture,
  filterByOsVersion,
} from './category-browser.js';

// ============================================================================
// Synthetic fixtures
// ============================================================================

function makePackage(
  filename: string,
  directory: string,
  sizeKb = 100,
  ageDays = 30,
  description = 'Test package',
): AminetPackage {
  const [category, subcategory] = directory.split('/');
  return {
    filename,
    directory,
    category,
    subcategory,
    sizeKb,
    ageDays,
    description,
    fullPath: `${directory}/${filename}`,
  };
}

const PACKAGES: AminetPackage[] = [
  makePackage('ShooterA.lha', 'game/shoot', 200, 10, 'Shooter game A'),
  makePackage('ShooterB.lha', 'game/shoot', 300, 20, 'Shooter game B'),
  makePackage('BoardGame.lha', 'game/board', 150, 5, 'Board game'),
  makePackage('ProTracker.lha', 'mus/edit', 500, 100, 'Music tracker'),
  makePackage('OctaMED.lha', 'mus/edit', 400, 90, 'Music editor'),
  makePackage('LhaTool.lha', 'util/misc', 50, 60, 'Archive utility'),
  makePackage('MusPlayer.lha', 'mus/play', 120, 15, 'Music player'),
];

function makeReadme(
  architecture: string[],
  requires: string[],
): PackageReadme {
  return {
    short: 'Test',
    author: null,
    uploader: null,
    type: null,
    version: null,
    requires,
    architecture,
    description: '',
    rawHeader: {},
  };
}

const README_INDEX = new Map<string, PackageReadme>([
  ['game/shoot/ShooterA.lha', makeReadme(['m68k-amigaos'], ['OS 3.0+', 'AGA'])],
  ['game/shoot/ShooterB.lha', makeReadme(['ppc-amigaos'], ['OS 4.0+'])],
  ['game/board/BoardGame.lha', makeReadme(['m68k-amigaos'], ['OS 2.0+'])],
  ['mus/edit/ProTracker.lha', makeReadme(['m68k-amigaos'], ['OS 2.0+'])],
  ['mus/edit/OctaMED.lha', makeReadme(['m68k-amigaos', 'ppc-amigaos'], ['OS 3.0+'])],
  // LhaTool and MusPlayer have NO readme -- should be included by default in filters
]);

// ============================================================================
// buildCategoryTree tests
// ============================================================================

describe('buildCategoryTree', () => {
  it('returns sorted category nodes from mixed packages', () => {
    const tree = buildCategoryTree(PACKAGES);
    expect(tree).toHaveLength(3);
    expect(tree.map((n) => n.name)).toEqual(['game', 'mus', 'util']);
  });

  it('computes correct packageCount for each category', () => {
    const tree = buildCategoryTree(PACKAGES);
    const game = tree.find((n) => n.name === 'game')!;
    const mus = tree.find((n) => n.name === 'mus')!;
    const util = tree.find((n) => n.name === 'util')!;

    expect(game.packageCount).toBe(3);
    expect(mus.packageCount).toBe(3);
    expect(util.packageCount).toBe(1);
  });

  it('nests subcategories with correct counts sorted alphabetically', () => {
    const tree = buildCategoryTree(PACKAGES);
    const game = tree.find((n) => n.name === 'game')!;

    expect(game.subcategories).toHaveLength(2);
    expect(game.subcategories[0]).toEqual({
      name: 'board',
      path: 'game/board',
      packageCount: 1,
    });
    expect(game.subcategories[1]).toEqual({
      name: 'shoot',
      path: 'game/shoot',
      packageCount: 2,
    });
  });

  it('handles single-package category', () => {
    const tree = buildCategoryTree(PACKAGES);
    const util = tree.find((n) => n.name === 'util')!;

    expect(util.packageCount).toBe(1);
    expect(util.subcategories).toHaveLength(1);
    expect(util.subcategories[0]).toEqual({
      name: 'misc',
      path: 'util/misc',
      packageCount: 1,
    });
  });

  it('handles multiple subcategories in mus', () => {
    const tree = buildCategoryTree(PACKAGES);
    const mus = tree.find((n) => n.name === 'mus')!;

    expect(mus.subcategories).toHaveLength(2);
    expect(mus.subcategories.map((s) => s.name)).toEqual(['edit', 'play']);
    expect(mus.subcategories[0].packageCount).toBe(2);
    expect(mus.subcategories[1].packageCount).toBe(1);
  });

  it('returns empty array for empty input', () => {
    const tree = buildCategoryTree([]);
    expect(tree).toEqual([]);
  });
});

// ============================================================================
// listPackages tests
// ============================================================================

describe('listPackages', () => {
  it('filters packages by category', () => {
    const result = listPackages(PACKAGES, 'game');
    expect(result).toHaveLength(3);
    expect(result.every((p) => p.category === 'game')).toBe(true);
  });

  it('filters packages by category and subcategory', () => {
    const result = listPackages(PACKAGES, 'game', 'shoot');
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.subcategory === 'shoot')).toBe(true);
  });

  it('returns empty array for non-existent category', () => {
    const result = listPackages(PACKAGES, 'nonexistent');
    expect(result).toEqual([]);
  });

  it('returns empty array for non-existent subcategory', () => {
    const result = listPackages(PACKAGES, 'game', 'nonexistent');
    expect(result).toEqual([]);
  });
});

// ============================================================================
// filterByArchitecture tests
// ============================================================================

describe('filterByArchitecture', () => {
  it('filters packages by matching architecture', () => {
    const result = filterByArchitecture(PACKAGES, README_INDEX, 'm68k-amigaos');
    // ShooterA (m68k), BoardGame (m68k), ProTracker (m68k), OctaMED (m68k+ppc),
    // LhaTool (no readme = included), MusPlayer (no readme = included)
    // ShooterB is ppc-only, excluded
    expect(result).toHaveLength(6);
    expect(result.find((p) => p.filename === 'ShooterB.lha')).toBeUndefined();
  });

  it('filters packages by ppc architecture', () => {
    const result = filterByArchitecture(PACKAGES, README_INDEX, 'ppc-amigaos');
    // ShooterB (ppc), OctaMED (m68k+ppc), LhaTool (no readme), MusPlayer (no readme)
    // ShooterA, BoardGame, ProTracker are m68k-only
    expect(result).toHaveLength(4);
    expect(result.map((p) => p.filename).sort()).toEqual([
      'LhaTool.lha',
      'MusPlayer.lha',
      'OctaMED.lha',
      'ShooterB.lha',
    ]);
  });

  it('includes packages without readme data by default', () => {
    const result = filterByArchitecture(PACKAGES, README_INDEX, 'm68k-amigaos');
    const lhaTool = result.find((p) => p.filename === 'LhaTool.lha');
    const musPlayer = result.find((p) => p.filename === 'MusPlayer.lha');
    expect(lhaTool).toBeDefined();
    expect(musPlayer).toBeDefined();
  });
});

// ============================================================================
// filterByOsVersion tests
// ============================================================================

describe('filterByOsVersion', () => {
  it('filters packages requiring OS 3.0', () => {
    const result = filterByOsVersion(PACKAGES, README_INDEX, 'OS 3.0');
    // ShooterA requires ["OS 3.0+", "AGA"] -> matches "OS 3.0"
    // OctaMED requires ["OS 3.0+"] -> matches "OS 3.0"
    // LhaTool (no readme = included), MusPlayer (no readme = included)
    // ShooterB requires ["OS 4.0+"] -> no "OS 3.0" substring -> excluded
    // BoardGame requires ["OS 2.0+"] -> no "OS 3.0" substring -> excluded
    // ProTracker requires ["OS 2.0+"] -> no "OS 3.0" substring -> excluded
    expect(result).toHaveLength(4);
    expect(result.map((p) => p.filename).sort()).toEqual([
      'LhaTool.lha',
      'MusPlayer.lha',
      'OctaMED.lha',
      'ShooterA.lha',
    ]);
  });

  it('filters packages requiring OS 2.0', () => {
    const result = filterByOsVersion(PACKAGES, README_INDEX, 'OS 2.0');
    // BoardGame ["OS 2.0+"] -> matches
    // ProTracker ["OS 2.0+"] -> matches
    // LhaTool (no readme = included), MusPlayer (no readme = included)
    expect(result).toHaveLength(4);
    expect(result.map((p) => p.filename).sort()).toEqual([
      'BoardGame.lha',
      'LhaTool.lha',
      'MusPlayer.lha',
      'ProTracker.lha',
    ]);
  });

  it('includes packages without readme data by default', () => {
    const result = filterByOsVersion(PACKAGES, README_INDEX, 'OS 3.0');
    const lhaTool = result.find((p) => p.filename === 'LhaTool.lha');
    const musPlayer = result.find((p) => p.filename === 'MusPlayer.lha');
    expect(lhaTool).toBeDefined();
    expect(musPlayer).toBeDefined();
  });

  it('returns all packages including those without readme for unmatched version', () => {
    const result = filterByOsVersion(PACKAGES, README_INDEX, 'OS 99.0');
    // No readme entry matches "OS 99.0", but packages without readme are included
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.filename).sort()).toEqual([
      'LhaTool.lha',
      'MusPlayer.lha',
    ]);
  });
});
