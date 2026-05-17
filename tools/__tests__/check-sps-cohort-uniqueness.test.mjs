/**
 * tools/__tests__/check-sps-cohort-uniqueness.test.mjs — v1.49.666 cc-3 Phase 3 C09 tests.
 *
 * Hermetic: each test uses a tmpdir as spsRoot with fabricated <slug>/index.html
 * stubs declaring `SPS #N`. Mirrors the scaffold-sps-pages test pattern.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  extractDeclaration,
  scanSpsRoot,
  findCollisions,
  checkProspective,
  runCheck,
} from '../check-sps-cohort-uniqueness.mjs';

let tmpRoot, spsRoot;

function writeSpsPage(slug, body) {
  const dir = join(spsRoot, slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), body, 'utf8');
}

function stubBody(number, extraText = '') {
  return `<!doctype html><html><head><title>${extraText} SPS #${number} test page</title></head><body><p>SPS #${number} body</p></body></html>`;
}

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'check-sps-cohort-test-'));
  spsRoot = join(tmpRoot, 'SPS');
  mkdirSync(spsRoot, { recursive: true });
});

afterEach(() => {
  if (tmpRoot) rmSync(tmpRoot, { recursive: true, force: true });
});

describe('extractDeclaration', () => {
  it('extracts the first declared SPS number from a file', () => {
    writeSpsPage('foo', stubBody(42));
    expect(extractDeclaration(join(spsRoot, 'foo', 'index.html'))).toBe(42);
  });

  it('returns null if file is missing', () => {
    expect(extractDeclaration(join(spsRoot, 'nonexistent', 'index.html'))).toBe(null);
  });

  it('returns null if the file has no declaration', () => {
    writeSpsPage('plain', '<html><body><p>no declaration here</p></body></html>');
    expect(extractDeclaration(join(spsRoot, 'plain', 'index.html'))).toBe(null);
  });

  it('extracts the first declaration when multiple appear', () => {
    writeSpsPage('multi', '<p>title SPS #5</p><p>see also SPS #6</p>');
    expect(extractDeclaration(join(spsRoot, 'multi', 'index.html'))).toBe(5);
  });
});

describe('scanSpsRoot', () => {
  it('reports declarations + skipped + sorts numerically', () => {
    writeSpsPage('alpha', stubBody(10));
    writeSpsPage('bravo', stubBody(2));
    writeSpsPage('charlie', '<html>no number here</html>');
    const result = scanSpsRoot(spsRoot);
    expect(result.rootMissing).toBe(false);
    expect(result.declarations.map((d) => d.slug)).toEqual(['bravo', 'alpha']);
    expect(result.declarations.map((d) => d.number)).toEqual([2, 10]);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].slug).toBe('charlie');
    expect(result.skipped[0].reason).toBe('no-declaration');
  });

  it('flags slugs missing index.html as no-index-html', () => {
    mkdirSync(join(spsRoot, 'no-html'), { recursive: true });
    const result = scanSpsRoot(spsRoot);
    expect(result.skipped[0].reason).toBe('no-index-html');
  });

  it('returns rootMissing when SPS dir absent', () => {
    const result = scanSpsRoot(join(tmpRoot, 'does-not-exist'));
    expect(result.rootMissing).toBe(true);
    expect(result.declarations).toEqual([]);
  });

  it('ignores non-directory entries at SPS root', () => {
    writeFileSync(join(spsRoot, 'stray.txt'), 'noise', 'utf8');
    writeSpsPage('valid', stubBody(99));
    const result = scanSpsRoot(spsRoot);
    expect(result.declarations.map((d) => d.slug)).toEqual(['valid']);
  });
});

describe('findCollisions', () => {
  it('returns empty when all numbers unique', () => {
    expect(findCollisions([
      { slug: 'a', number: 1 },
      { slug: 'b', number: 2 },
      { slug: 'c', number: 3 },
    ])).toEqual([]);
  });

  it('detects a single collision', () => {
    const c = findCollisions([
      { slug: 'a', number: 5 },
      { slug: 'b', number: 5 },
    ]);
    expect(c).toEqual([{ number: 5, slugs: ['a', 'b'] }]);
  });

  it('detects multiple collisions and sorts numerically', () => {
    const c = findCollisions([
      { slug: 'a', number: 10 },
      { slug: 'b', number: 5 },
      { slug: 'c', number: 10 },
      { slug: 'd', number: 5 },
      { slug: 'e', number: 5 },
    ]);
    expect(c).toEqual([
      { number: 5, slugs: ['b', 'd', 'e'] },
      { number: 10, slugs: ['a', 'c'] },
    ]);
  });
});

describe('checkProspective', () => {
  it('returns null when no prospective given', () => {
    expect(checkProspective(null, [])).toBe(null);
    expect(checkProspective(undefined, [])).toBe(null);
  });

  it('detects collision against existing declarations', () => {
    const declarations = [
      { slug: 'foo', number: 82 },
      { slug: 'bar', number: 100 },
    ];
    const result = checkProspective({ slug: 'marbled-murrelet', number: 82 }, declarations);
    expect(result.collision).toBe(true);
    expect(result.collidingSlugs).toEqual(['foo']);
  });

  it('reports first-instance-genuine when no collision', () => {
    const result = checkProspective({ slug: 'new-species', number: 200 }, [
      { slug: 'foo', number: 82 },
    ]);
    expect(result.collision).toBe(false);
  });

  it('does not flag a prospective with the same slug AND same number as an existing entry', () => {
    const result = checkProspective({ slug: 'foo', number: 82 }, [
      { slug: 'foo', number: 82 },
    ]);
    expect(result.collision).toBe(false);
    expect(result.slugCollision).toBe(null);
  });

  it('flags slug-collision when prospective slug exists at different number (marbled-murrelet near-miss)', () => {
    const result = checkProspective({ slug: 'marbled-murrelet', number: 115 }, [
      { slug: 'marbled-murrelet', number: 82 },
    ]);
    expect(result.collision).toBe(true);
    expect(result.slugCollision).toEqual({ existingNumber: 82 });
    expect(result.collidingSlugs).toEqual([]);
  });

  it('reports both slug-collision AND number-collision when both apply', () => {
    const result = checkProspective({ slug: 'marbled-murrelet', number: 115 }, [
      { slug: 'marbled-murrelet', number: 82 },
      { slug: 'other-bird', number: 115 },
    ]);
    expect(result.collision).toBe(true);
    expect(result.slugCollision).toEqual({ existingNumber: 82 });
    expect(result.collidingSlugs).toEqual(['other-bird']);
  });
});

describe('runCheck — marbled-murrelet near-miss scenario (Lesson #10364 reproduction)', () => {
  it('detects the v661 first-instance-claim near-miss via slug-collision branch', () => {
    // Existing v608-era page declaring SPS #82
    writeSpsPage('marbled-murrelet', stubBody(82, 'Pre-existing marbled murrelet @ '));
    // Prospective: v661 release-notes claim FIRST-INSTANCE at SPS #115 for the
    // same slug — the exact pattern that shipped at v661 and was caught
    // pre-dispatch at cc-2 session open.
    const result = runCheck({
      spsRoot,
      prospective: { slug: 'marbled-murrelet', number: 115 },
    });
    expect(result.prospectiveResult.collision).toBe(true);
    expect(result.prospectiveResult.slugCollision).toEqual({ existingNumber: 82 });
  });

  it('detects when two pages independently claim the same number', () => {
    writeSpsPage('marbled-murrelet', stubBody(82));
    writeSpsPage('alt-bird-claiming-same-slot', stubBody(82));
    const result = runCheck({ spsRoot });
    expect(result.collisions).toEqual([
      { number: 82, slugs: ['alt-bird-claiming-same-slot', 'marbled-murrelet'] },
    ]);
  });

  it('detects prospective duplicate of existing number', () => {
    writeSpsPage('marbled-murrelet', stubBody(82));
    const result = runCheck({
      spsRoot,
      prospective: { slug: 'new-entry', number: 82 },
    });
    expect(result.prospectiveResult.collision).toBe(true);
    expect(result.prospectiveResult.collidingSlugs).toEqual(['marbled-murrelet']);
  });
});

describe('runCheck — happy path', () => {
  it('passes with three unique SPS pages', () => {
    writeSpsPage('a', stubBody(1));
    writeSpsPage('b', stubBody(2));
    writeSpsPage('c', stubBody(3));
    const result = runCheck({ spsRoot });
    expect(result.collisions).toEqual([]);
    expect(result.declarations).toHaveLength(3);
    expect(result.skipped).toEqual([]);
  });

  it('handles a mix of declared and undeclared pages gracefully', () => {
    writeSpsPage('a', stubBody(1));
    writeSpsPage('b', '<html>nothing</html>');
    writeSpsPage('c', stubBody(3));
    const result = runCheck({ spsRoot });
    expect(result.collisions).toEqual([]);
    expect(result.declarations).toHaveLength(2);
    expect(result.skipped).toHaveLength(1);
  });

  it('returns rootMissing if SPS root absent', () => {
    const result = runCheck({ spsRoot: join(tmpRoot, 'absent') });
    expect(result.rootMissing).toBe(true);
    expect(result.declarations).toEqual([]);
  });
});
