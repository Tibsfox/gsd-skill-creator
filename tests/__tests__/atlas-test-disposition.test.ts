/**
 * v1.49.638 C1 — Atlas test disposition invariant (updated from v1.49.637)
 *
 * Asserts that any remaining `#[ignore = "..."]` annotations in
 * `src-tauri/src/intelligence/atlas.rs` referencing the atlas test
 * disposition cross-reference the disposition records at
 * `.planning/atlas-test-disposition.md`.
 *
 * v1.49.638 C1 disposition outcome (Cluster #5 closure):
 *   - `lru_access_promotes_keeps_entry_alive_under_eviction` was
 *     FIXED-INLINE via option (a) — per-project query API
 *     (`SqliteAtlasKbDelegate::get_or_open_for_project`) added; test
 *     rewritten to exercise per-project LRU semantics against the new
 *     API; `#[ignore]` removed; test PASSes.
 *   - No tests remain in the v1.49.7XX cluster-5-deferred state.
 *
 * v1.49.637 C4 disposition outcome (predecessor):
 *   - `per_project_clear_with_unknown_project_id_falls_back_to_full_clear`
 *     was FIXED-INLINE (test contract corrected to expect actual eviction
 *     count; `#[ignore]` removed; test PASSes).
 *
 * The disposition file lives in `.planning/` (gitignored project
 * workspace). When it is absent (CI or fresh-clone environments),
 * this test SKIPs cleanly rather than failing — same pattern as
 * `memory-truth.test.ts` for similar local-only artifacts.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DISPOSITION_PATH = join(
  process.cwd(),
  '.planning',
  'atlas-test-disposition.md',
);
const ATLAS_RS_PATH = join(
  process.cwd(),
  'src-tauri',
  'src',
  'intelligence',
  'atlas.rs',
);

// Post-v1.49.638 C1: no cluster-5-deferred tests remain #[ignore]'d.
const EXPECTED_IGNORED_TESTS: string[] = [];

// Post-v1.49.638 C1: both former cluster-5 candidates are fixed-inline and
// must NOT be #[ignore]'d. The first was fixed in v1.49.637 C4; the second
// was fixed in v1.49.638 C1 via the new per-project query API.
const EXPECTED_NOT_IGNORED_TESTS = [
  'per_project_clear_with_unknown_project_id_falls_back_to_full_clear',
  'lru_access_promotes_keeps_entry_alive_under_eviction',
];

describe('v1.49.638 C1: atlas test-disposition invariants', () => {
  it('SKIP if disposition file absent (gitignored workspace)', () => {
    if (!existsSync(DISPOSITION_PATH)) {
      // Disposition lives in gitignored .planning/; CI doesn't see it.
      // This test is informational; absence is acceptable in CI.
      return;
    }
    expect(existsSync(DISPOSITION_PATH)).toBe(true);
  });

  it('disposition file (when present) records each remaining ignored test by name', () => {
    if (!existsSync(DISPOSITION_PATH)) return;
    const content = readFileSync(DISPOSITION_PATH, 'utf8');
    for (const testName of EXPECTED_IGNORED_TESTS) {
      expect(content).toContain(testName);
    }
  });

  it('every cluster-5-deferred #[ignore] annotation in atlas.rs has a disposition entry', () => {
    if (!existsSync(DISPOSITION_PATH)) return;
    const dispositionText = readFileSync(DISPOSITION_PATH, 'utf8');
    if (!existsSync(ATLAS_RS_PATH)) return; // src-tauri may be absent in some test contexts
    const atlasText = readFileSync(ATLAS_RS_PATH, 'utf8');

    // Find every `#[ignore = "TODO(v1.49.7XX cluster #5)..."]` followed by `fn <name>(`.
    const ignoreRe =
      /#\[ignore\s*=\s*"TODO\(v1\.49\.7XX cluster #5\)[^"]*"\]\s*\r?\n\s*fn\s+(\w+)/g;
    const ignored: string[] = [];
    for (let m: RegExpExecArray | null; (m = ignoreRe.exec(atlasText)); ) {
      ignored.push(m[1]);
    }
    expect(ignored.sort()).toEqual([...EXPECTED_IGNORED_TESTS].sort());
    for (const name of ignored) {
      expect(dispositionText).toContain(name);
    }
  });

  it('each cluster-5-deferred test annotation references the disposition file', () => {
    if (!existsSync(ATLAS_RS_PATH)) return;
    const atlasText = readFileSync(ATLAS_RS_PATH, 'utf8');
    const ignoreLines = atlasText
      .split('\n')
      .filter((l) => /#\[ignore\s*=\s*"TODO\(v1\.49\.7XX cluster #5\)/.test(l));
    expect(ignoreLines.length).toBe(EXPECTED_IGNORED_TESTS.length);
    for (const line of ignoreLines) {
      expect(line).toContain('atlas-test-disposition.md');
    }
  });

  it('fixed-inline tests are no longer #[ignore]d', () => {
    if (!existsSync(ATLAS_RS_PATH)) return;
    const atlasText = readFileSync(ATLAS_RS_PATH, 'utf8');
    for (const testName of EXPECTED_NOT_IGNORED_TESTS) {
      // The fn def must exist
      const fnRe = new RegExp(`fn\\s+${testName}\\s*\\(`);
      expect(fnRe.test(atlasText)).toBe(true);
      // And it must NOT be preceded immediately by an #[ignore] attribute.
      // We check: within ~200 chars before `fn <name>(`, there should be no
      // `#[ignore` that points to this fn (i.e. with no other fn between).
      const idx = atlasText.search(fnRe);
      if (idx >= 0) {
        const slice = atlasText.slice(Math.max(0, idx - 400), idx);
        // The slice should not contain an #[ignore = "..."] whose closest
        // following fn is THIS fn (heuristic: no other `fn ` between #[ignore] and us).
        const lastIgnore = slice.lastIndexOf('#[ignore');
        if (lastIgnore !== -1) {
          const between = slice.slice(lastIgnore);
          // If there's another `fn ` between, the #[ignore] belongs to that fn.
          const otherFn = between.match(/\bfn\s+\w+\s*\(/);
          expect(otherFn).not.toBeNull();
        }
      }
    }
  });
});
