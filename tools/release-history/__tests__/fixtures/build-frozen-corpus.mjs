#!/usr/bin/env node
/**
 * Regenerator for the frozen scorer-calibration corpus fixtures.
 *
 * WHY (v1.49.913): score-completeness.test.mjs + score-completeness-c5.test.mjs
 * assert that the cleanup-mission / multi-track-trs rubrics grade specific
 * historical releases (v1.49.585=B, v1.49.634=B, v1.49.587=A). They originally
 * read the LIVE docs/release-notes/<version>/ tree — coupling unit tests to
 * editable published documentation. The 2026-05-25 "lift quality" commits
 * (9ec5820df, ffbc0dc16) rewrote those releases' chapter/00-summary.md, shrinking
 * them below the scorer's word-count tiers and silently breaking the tests for
 * ~2 weeks (the suite was not gate-enforced). The scorer itself never changed.
 *
 * FIX: freeze the corpus AS OF the rubric-calibration commit (557182042,
 * "recalibrate --cleanup rubric weights", 2026-05-11), which reproduces the
 * documented calibration grades with the current scorer. buildCorpus() prefers
 * these frozen blobs, so the calibration-target tests are hermetic and immune to
 * future documentation edits, while detection/regression tests stay on live docs
 * (and any future break is now caught at ship time by the tools-suite gate step).
 *
 * The concatenation logic here is BYTE-IDENTICAL to buildCorpus() in both test
 * files, so each frozen blob equals what live buildCorpus() produced at the
 * calibration commit.
 *
 * Regenerate (only if the rubric is recalibrated and the calibration commit moves):
 *   node tools/release-history/__tests__/fixtures/build-frozen-corpus.mjs
 */

import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..', '..');
const OUT_DIR = join(HERE, 'corpus');

const CALIBRATION_REF = '557182042'; // recalibrate --cleanup rubric weights (2026-05-11)
const VERSIONS = ['v1.49.585', 'v1.49.634', 'v1.49.587'];

// Byte-identical to buildCorpus() in score-completeness*.test.mjs.
function buildCorpus(releaseDir) {
  const readmePath = join(releaseDir, 'README.md');
  if (!existsSync(readmePath)) throw new Error(`README.md absent in ${releaseDir}`);
  let text = readFileSync(readmePath, 'utf8');
  const chapterDir = join(releaseDir, 'chapter');
  if (existsSync(chapterDir)) {
    for (const name of readdirSync(chapterDir).filter((n) => n.endsWith('.md')).sort()) {
      let chap = readFileSync(join(chapterDir, name), 'utf8');
      chap = chap.replace(/^(#{1,5})(\s+)/gm, '#$1$2');
      text += '\n\n<!-- chapter: ' + name + ' -->\n\n' + chap;
    }
  }
  return text;
}

const work = mkdtempSync(join(tmpdir(), 'frozen-corpus-'));
try {
  // Extract the calibration-era release-notes trees into a temp worktree.
  const paths = VERSIONS.map((v) => `docs/release-notes/${v}`).join(' ');
  execSync(`git archive ${CALIBRATION_REF} ${paths} | tar -x -C "${work}"`, {
    cwd: REPO_ROOT,
    stdio: 'pipe',
  });

  mkdirSync(OUT_DIR, { recursive: true });
  for (const v of VERSIONS) {
    const releaseDir = join(work, 'docs', 'release-notes', v);
    const blob = buildCorpus(releaseDir);
    const outPath = join(OUT_DIR, `${v}.corpus.md`);
    writeFileSync(outPath, blob, 'utf8');
    console.log(`wrote ${v}.corpus.md (${Buffer.byteLength(blob, 'utf8')} bytes)`);
  }
  console.log(`\nFrozen at calibration ref ${CALIBRATION_REF}. Verify grades with score-completeness*.test.mjs.`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
