import { describe, it, expect } from 'vitest';
import { mkdtempSync, symlinkSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isCliEntrypoint } from './entrypoint-guard.js';

function withTempDir<T>(fn: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), 'epg-'));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('isCliEntrypoint', () => {
  it('returns false when argv[1] is missing', () => {
    expect(isCliEntrypoint('file:///tmp/anything.js', ['node'])).toBe(false);
  });

  it('returns true when argv[1] equals the script path (direct invocation)', () => {
    withTempDir((dir) => {
      const script = join(dir, 'script.js');
      writeFileSync(script, '');
      expect(
        isCliEntrypoint(pathToFileURL(script).href, ['node', script]),
      ).toBe(true);
    });
  });

  it('returns true when argv[1] is a symlink to the script', () => {
    withTempDir((dir) => {
      const script = join(dir, 'script.js');
      const link = join(dir, 'link');
      writeFileSync(script, '');
      symlinkSync(script, link);
      expect(
        isCliEntrypoint(pathToFileURL(script).href, ['node', link]),
      ).toBe(true);
    });
  });

  it('returns false when argv[1] points at an unrelated script', () => {
    withTempDir((dir) => {
      const script = join(dir, 'script.js');
      const other = join(dir, 'other.js');
      writeFileSync(script, '');
      writeFileSync(other, '');
      expect(
        isCliEntrypoint(pathToFileURL(script).href, ['node', other]),
      ).toBe(false);
    });
  });

  it('falls back to pathResolve when realpathSync throws (missing argv[1] file)', () => {
    withTempDir((dir) => {
      const script = join(dir, 'script.js');
      writeFileSync(script, '');
      // argv[1] points at a nonexistent path; realpathSync throws ENOENT.
      // Fallback compares against pathResolve, which here returns the same
      // string we pass in, so the test asserts the fallback path is reached
      // and does not crash.
      expect(
        isCliEntrypoint(pathToFileURL(script).href, ['node', join(dir, 'nope.js')]),
      ).toBe(false);
    });
  });
});
