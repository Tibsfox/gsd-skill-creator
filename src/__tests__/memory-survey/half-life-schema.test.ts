// CF-MED-024 — Half-life metadata schema + migration script.
//
// Verifies:
//   - parseFrontmatter / serializeFrontmatter roundtrip
//   - migrateDocument adds half_life + last_accessed + confidence to a file
//     missing frontmatter entirely
//   - migration is idempotent on the second run (no further changes)
//   - prefix-driven default selection (feedback_ → 6mo, user_ → infinite)
//
// Closes: OGA-024 (MEDIUM).

import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseFrontmatter,
  serializeFrontmatter,
  migrateDocument,
  migrateDirectory,
  pickDefaultHalfLife,
  HALF_LIFE_VALUES,
// @ts-expect-error — .mjs migration script has no .d.ts; runtime-tested via this suite
} from '../../../scripts/memory-migrate-half-life.mjs';

const STAMP = '2026-04-25T12:00:00.000Z';

describe('CF-MED-024: parseFrontmatter / serializeFrontmatter', () => {
  it('parses a well-formed frontmatter block', () => {
    const text = '---\nname: foo\ntype: project\n---\nbody\n';
    const { frontmatter, body, hadFrontmatter } = parseFrontmatter(text);
    expect(hadFrontmatter).toBe(true);
    expect(frontmatter).toEqual({ name: 'foo', type: 'project' });
    expect(body).toBe('body\n');
  });

  it('returns hadFrontmatter=false for a body-only document', () => {
    const text = '# Just a heading\n\nNo frontmatter here.\n';
    const { frontmatter, body, hadFrontmatter } = parseFrontmatter(text);
    expect(hadFrontmatter).toBe(false);
    expect(frontmatter).toEqual({});
    expect(body).toBe(text);
  });

  it('roundtrips parse → serialize without losing fields', () => {
    const original = '---\nname: a\nhalf_life: 1mo\n---\nbody body\n';
    const { frontmatter, body } = parseFrontmatter(original);
    expect(serializeFrontmatter(frontmatter, body)).toBe(original);
  });
});

describe('CF-MED-024: pickDefaultHalfLife', () => {
  it('returns 6mo for feedback_ files', () => {
    expect(pickDefaultHalfLife('feedback_branch-rule.md')).toBe('6mo');
  });

  it('returns infinite for user_ files', () => {
    expect(pickDefaultHalfLife('user_project-purpose.md')).toBe('infinite');
  });

  it('returns 1mo for project_ files', () => {
    expect(pickDefaultHalfLife('project_release-state.md')).toBe('1mo');
  });

  it('returns the fallback for unprefixed files', () => {
    expect(pickDefaultHalfLife('arbitrary-name.md')).toBe('1mo');
    expect(pickDefaultHalfLife('arbitrary-name.md', '6mo')).toBe('6mo');
  });
});

describe('CF-MED-024: migrateDocument', () => {
  it('adds half_life + last_accessed + confidence to a file with no frontmatter', () => {
    const result = migrateDocument({
      text: '# Hello\n',
      basename: 'feedback_dev-branch.md',
      lastAccessedIso: STAMP,
    });
    expect(result.changed).toBe(true);
    expect(result.added.sort()).toEqual(['confidence', 'half_life', 'last_accessed']);
    const { frontmatter } = parseFrontmatter(result.text);
    expect(frontmatter.half_life).toBe('6mo');
    expect(frontmatter.last_accessed).toBe(STAMP);
    expect(frontmatter.confidence).toBe('0.95');
  });

  it('preserves an existing half_life value (manual override wins)', () => {
    const text = '---\nname: x\nhalf_life: infinite\n---\nbody\n';
    const result = migrateDocument({
      text,
      basename: 'project_x.md',
      lastAccessedIso: STAMP,
    });
    const { frontmatter } = parseFrontmatter(result.text);
    expect(frontmatter.half_life).toBe('infinite');
  });

  it('is idempotent on the second run (no changes)', () => {
    const first = migrateDocument({
      text: '# Body\n',
      basename: 'project_a.md',
      lastAccessedIso: STAMP,
    });
    const second = migrateDocument({
      text: first.text,
      basename: 'project_a.md',
      lastAccessedIso: STAMP,
    });
    expect(second.changed).toBe(false);
    expect(second.added).toEqual([]);
    expect(second.text).toBe(first.text);
  });

  it('emits half_life from the canonical 5-value vocabulary', () => {
    const result = migrateDocument({
      text: '# x\n',
      basename: 'whatever.md',
      lastAccessedIso: STAMP,
    });
    const { frontmatter } = parseFrontmatter(result.text);
    expect(HALF_LIFE_VALUES).toContain(frontmatter.half_life);
  });
});

describe('CF-MED-024: migrateDirectory (synthetic corpus, dry-run + idempotency)', () => {
  it('reports scanned + changed counts; --write actually mutates', () => {
    const dir = mkdtempSync(join(tmpdir(), 'memscorer-half-life-'));
    try {
      writeFileSync(join(dir, 'feedback_a.md'), '# a\n');
      writeFileSync(join(dir, 'project_b.md'), '# b\n');
      writeFileSync(join(dir, 'user_c.md'), '# c\n');
      mkdirSync(join(dir, 'sub'));
      writeFileSync(join(dir, 'sub', 'observation_d.md'), '# d\n');

      const dry = migrateDirectory({ dir, write: false });
      expect(dry.scanned).toBe(4);
      expect(dry.changed).toBe(4);
      // Dry-run: file unchanged on disk
      expect(readFileSync(join(dir, 'feedback_a.md'), 'utf-8')).toBe('# a\n');

      const wet = migrateDirectory({ dir, write: true });
      expect(wet.changed).toBe(4);
      const after = readFileSync(join(dir, 'feedback_a.md'), 'utf-8');
      expect(after).toMatch(/half_life: 6mo/);
      expect(after).toMatch(/confidence: 0.95/);

      // Second --write run is a no-op (idempotency)
      const second = migrateDirectory({ dir, write: true });
      expect(second.changed).toBe(0);
      expect(readFileSync(join(dir, 'feedback_a.md'), 'utf-8')).toBe(after);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
