/**
 * frozen-corpus.mjs — frozen calibration-era release-notes corpus for the
 * score-completeness tests.
 *
 * v1.49.913: score-completeness.test.mjs + score-completeness-c5.test.mjs assert
 * that the cleanup-mission / multi-track-trs rubrics grade specific historical
 * releases at fixed grades (v1.49.585=B, v1.49.634=B, v1.49.587=A). Reading the
 * LIVE docs/release-notes/<version>/ tree coupled those unit tests to editable
 * published documentation: the 2026-05-25 "lift quality" commits rewrote the
 * chapter/00-summary.md files, dropping word counts below the scorer's tiers and
 * silently breaking the tests (the scorer itself never changed).
 *
 * These blobs are frozen at the rubric-calibration commit (557182042) and
 * reproduce the documented grades with the current scorer, so the
 * calibration-target tests are hermetic and immune to future doc edits. Detection
 * and A/95+ regression tests stay on live docs (and any future break is now
 * caught at ship time by the tools-suite pre-tag-gate step). Regenerate via
 * build-frozen-corpus.mjs.
 *
 * Returns the frozen corpus text for `version` (e.g. 'v1.49.585'), or null if no
 * frozen fixture exists for it (callers fall back to live docs).
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export function frozenCorpus(version) {
  const p = join(HERE, 'corpus', `${version}.corpus.md`);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}
