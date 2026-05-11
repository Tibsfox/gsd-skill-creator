/**
 * v1.49.636 C4 — Atlas test disposition invariant
 *
 * Asserts that the `#[ignore = "..."]` annotations in
 * `src-tauri/src/intelligence/atlas.rs` for the two pre-existing
 * atlas test failures cross-reference the disposition records at
 * `.planning/atlas-test-disposition.md`.
 *
 * The disposition file lives in `.planning/` (gitignored project
 * workspace). When it is absent (CI or fresh-clone environments),
 * this test SKIPs cleanly rather than failing — same pattern as
 * `memory-truth.test.ts` for similar local-only artifacts.
 *
 * When the file is present, it must enumerate both ignored tests so
 * a future cluster maintenance pass can mechanically check
 * "are we still saying we'll fix these?"
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

const EXPECTED_IGNORED_TESTS = [
  'lru_access_promotes_keeps_entry_alive_under_eviction',
  'per_project_clear_with_unknown_project_id_falls_back_to_full_clear',
];

describe('v1.49.636 C4: atlas test-disposition invariants', () => {
  it('SKIP if disposition file absent (gitignored workspace)', () => {
    if (!existsSync(DISPOSITION_PATH)) {
      // Disposition lives in gitignored .planning/; CI doesn't see it.
      // This test is informational; absence is acceptable in CI.
      return;
    }
    expect(existsSync(DISPOSITION_PATH)).toBe(true);
  });

  it('disposition file (when present) records each ignored test by name', () => {
    if (!existsSync(DISPOSITION_PATH)) return;
    const content = readFileSync(DISPOSITION_PATH, 'utf8');
    for (const testName of EXPECTED_IGNORED_TESTS) {
      expect(content).toContain(testName);
    }
  });

  it('every #[ignore = "..."] annotation in atlas.rs has a disposition entry', () => {
    if (!existsSync(DISPOSITION_PATH)) return;
    const dispositionText = readFileSync(DISPOSITION_PATH, 'utf8');
    if (!existsSync(ATLAS_RS_PATH)) return; // src-tauri may be absent in some test contexts
    const atlasText = readFileSync(ATLAS_RS_PATH, 'utf8');

    // Find every `#[ignore = "v1.49.636 C4 ..."]` followed by `fn <name>(`.
    const ignoreRe =
      /#\[ignore\s*=\s*"v1\.49\.636 C4[^"]*"\]\s*\r?\n\s*fn\s+(\w+)/g;
    const ignored: string[] = [];
    for (let m: RegExpExecArray | null; (m = ignoreRe.exec(atlasText)); ) {
      ignored.push(m[1]);
    }
    expect(ignored.sort()).toEqual([...EXPECTED_IGNORED_TESTS].sort());
    for (const name of ignored) {
      expect(dispositionText).toContain(name);
    }
  });

  it('each ignored test annotation references the disposition file', () => {
    if (!existsSync(ATLAS_RS_PATH)) return;
    const atlasText = readFileSync(ATLAS_RS_PATH, 'utf8');
    const ignoreLines = atlasText
      .split('\n')
      .filter((l) => /#\[ignore\s*=\s*"v1\.49\.636 C4/.test(l));
    expect(ignoreLines.length).toBe(EXPECTED_IGNORED_TESTS.length);
    for (const line of ignoreLines) {
      expect(line).toContain('atlas-test-disposition.md');
    }
  });
});
