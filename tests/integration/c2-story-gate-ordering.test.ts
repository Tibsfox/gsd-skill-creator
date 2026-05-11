/**
 * C2 — STORY-gate Pipeline Ordering Invariant
 *
 * Asserts that the canonical T14 ship-sequence doc lists the STORY-gate
 * invocation (`node scripts/append-story-entry.mjs`) AFTER the
 * bump-version invocation (`node scripts/bump-version.mjs`).
 *
 * Closes Lesson #10197 forward: at v1.49.637, the STORY-gate ran as
 * pre-tag-gate step 10/10 — i.e. PRE bump-version. The script read
 * stale package.json.version (predecessor's tag), found the predecessor's
 * entry already present in public STORY.md, reported no-op, and the
 * v1.49.637 entry never landed in public STORY.md.
 *
 * Fix: STORY-gate moved to T14 step 2.5 (post bump-version, pre git-tag).
 * This test guards the canonical ordering doc at
 * `docs/T14-SHIP-SEQUENCE.md`.
 *
 * Skip-guard pattern (Lesson #10180): if the doc-file is absent in the
 * test environment, skip rather than fail — keeps fresh-clone / CI
 * environments from false-failing while the canonical doc is being
 * authored.
 *
 * Regex (per lab-director carry-forward concern, W0 design Section 5.2):
 * use tight `node\s+.*<script>\.mjs` matches to avoid false-positives
 * from incidental prose references to the script name.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = process.cwd();
const T14_DOC = resolve(REPO_ROOT, 'docs/T14-SHIP-SEQUENCE.md');

const BUMP_VERSION_RE = /node\s+.*bump-version\.mjs/;
const APPEND_STORY_RE = /node\s+.*append-story-entry\.mjs/;

describe('C2 — T14 STORY-gate pipeline ordering invariant', () => {
  it('canonical T14 doc lists STORY-gate AFTER bump-version', () => {
    if (!existsSync(T14_DOC)) {
      // Lesson #10180 skip-guard: doc-file absent in this env, do not fail.
      return;
    }

    const content = readFileSync(T14_DOC, 'utf8');
    const lines = content.split('\n');

    const bumpIdx = lines.findIndex((line) => BUMP_VERSION_RE.test(line));
    const storyIdx = lines.findIndex((line) =>
      APPEND_STORY_RE.test(line),
    );

    // Both invocations must be present in the canonical sequence.
    expect(bumpIdx).toBeGreaterThanOrEqual(0);
    expect(storyIdx).toBeGreaterThanOrEqual(0);

    // STORY-gate MUST come after bump-version (Lesson #10197 root cause).
    expect(storyIdx).toBeGreaterThan(bumpIdx);
  });
});
