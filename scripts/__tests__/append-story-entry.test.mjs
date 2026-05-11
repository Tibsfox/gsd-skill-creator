/**
 * Tests for scripts/append-story-entry.mjs (v1.49.637 C5).
 *
 * Validates the per-ship STORY.md sustained-update gate:
 *   - append-on-tag with synthetic ground-truth + public
 *   - header-update (line 4)
 *   - chapter-count-update (line 6)
 *   - idempotent re-run
 *   - missing-ground-truth blocks
 *   - byte-equivalence of appended entry
 *   - env-var bypass via SC_SKIP_STORY_GATE
 *
 * Each test uses an isolated tmpdir + synthetic fixtures (does NOT touch the
 * real docs/release-notes/STORY.md or .planning/roadmap/STORY.md).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  appendStoryEntry,
  findGroundTruthEntry,
  publicAlreadyHasEntry,
  parseHeaderTag,
  parseChapterCount,
  applyAppend,
} from '../append-story-entry.mjs';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_PATH = resolve(dirname(__filename), '..', 'append-story-entry.mjs');

const HEADER = [
  '# The Story of This Project',
  '',
  'Read this directory like a book. Each subdirectory is a chapter. Each chapter is a release.',
  'The story begins at `v1.0` and continues to `v1.49.636`.',
  '',
  '**679 chapters.** 678 have retrospectives.',
  'For the structural view, read `INDEX.md`. For the backlog of open lessons, read `RETROSPECTIVE-TRACKER.md`.',
  '',
  '## Chapters',
  '',
].join('\n');

const ENTRY_636 = '- **[v1.49.636](v1.49.636/00-summary.md)** — Housekeeping Cluster #3 · 2026-05-11';
const ENTRY_637 = '- **[v1.49.637](v1.49.637/00-summary.md)** — Housekeeping Cluster #4 · 2026-05-11';
const ENTRY_638 = '- **[v1.49.638](v1.49.638/00-summary.md)** — Some Future Milestone · 2026-05-12';

function publicFixture() {
  // Public ends with newline (matches real file shape per `xxd` inspection).
  return HEADER + ENTRY_636 + '\n';
}

function groundTruthFixture(extraEntries = []) {
  // Ground truth does NOT end with newline (matches real file shape).
  const lines = [HEADER + ENTRY_636];
  for (const e of extraEntries) lines.push(e);
  return lines.join('\n');
}

describe('append-story-entry — pure helpers', () => {
  it('findGroundTruthEntry returns the matching line', () => {
    const gt = groundTruthFixture([ENTRY_637]);
    expect(findGroundTruthEntry(gt, 'v1.49.637')).toBe(ENTRY_637);
  });

  it('findGroundTruthEntry returns null when entry absent', () => {
    const gt = groundTruthFixture();
    expect(findGroundTruthEntry(gt, 'v1.49.637')).toBeNull();
  });

  it('publicAlreadyHasEntry detects existing entry', () => {
    expect(publicAlreadyHasEntry(publicFixture(), 'v1.49.636')).toBe(true);
    expect(publicAlreadyHasEntry(publicFixture(), 'v1.49.637')).toBe(false);
  });

  it('parseHeaderTag extracts the trailing tag from line 4', () => {
    expect(parseHeaderTag(publicFixture())).toBe('v1.49.636');
  });

  it('parseChapterCount extracts chapter + retrospective counts', () => {
    expect(parseChapterCount(publicFixture())).toEqual({
      chapters: 679,
      retrospectives: 678,
    });
  });
});

describe('append-story-entry — applyAppend pure transform', () => {
  it('appends entry + bumps header tag + increments chapter count', () => {
    const before = publicFixture();
    const { content, previousHeaderTag, previousChapterCount, newChapterCount } =
      applyAppend(before, ENTRY_637, 'v1.49.637');

    expect(previousHeaderTag).toBe('v1.49.636');
    expect(previousChapterCount).toBe(679);
    expect(newChapterCount).toBe(680);

    // Header line 4 advanced.
    expect(content.split('\n')[3]).toContain('continues to `v1.49.637`.');

    // Chapter count line 6 advanced: 679 → 680, retros 678 → 679.
    expect(content.split('\n')[5]).toBe('**680 chapters.** 679 have retrospectives.');

    // Entry appended at end.
    expect(content).toContain(ENTRY_637);
    expect(content.endsWith('\n')).toBe(true);
  });

  it('throws when public STORY.md header line 4 is malformed', () => {
    const broken = publicFixture().replace('continues to `v1.49.636`.', 'no header here');
    expect(() => applyAppend(broken, ENTRY_637, 'v1.49.637')).toThrow(/header line 4/);
  });

  it('throws when chapter-count line 6 is malformed', () => {
    const broken = publicFixture().replace(
      '**679 chapters.** 678 have retrospectives.',
      'lol not counts',
    );
    expect(() => applyAppend(broken, ENTRY_637, 'v1.49.637')).toThrow(/line 6/);
  });
});

describe('append-story-entry — appendStoryEntry orchestrator', () => {
  let tmpDir;
  let publicPath;
  let groundTruthPath;
  let packageJsonPath;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'append-story-entry-'));
    publicPath = join(tmpDir, 'STORY.md');
    groundTruthPath = join(tmpDir, 'roadmap-STORY.md');
    packageJsonPath = join(tmpDir, 'package.json');
    writeFileSync(publicPath, publicFixture(), 'utf8');
    writeFileSync(groundTruthPath, groundTruthFixture([ENTRY_637]), 'utf8');
    writeFileSync(packageJsonPath, JSON.stringify({ version: '1.49.637' }), 'utf8');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('append-on-tag: appends exactly one entry when ground truth has it', () => {
    const result = appendStoryEntry({
      publicPath,
      groundTruthPath,
      packageJsonPath,
    });
    expect(result.status).toBe('appended');
    expect(result.changes).toBe(1);
    expect(result.tag).toBe('v1.49.637');
    expect(result.appendedEntry).toBe(ENTRY_637);

    const after = readFileSync(publicPath, 'utf8');
    // Exactly one occurrence of the new entry.
    const occurrences = after.split(ENTRY_637).length - 1;
    expect(occurrences).toBe(1);
  });

  it('header-update: line 4 reflects new tag after append', () => {
    appendStoryEntry({ publicPath, groundTruthPath, packageJsonPath });
    const after = readFileSync(publicPath, 'utf8');
    expect(after.split('\n')[3]).toContain('continues to `v1.49.637`.');
  });

  it('chapter-count-update: line 6 increments after append', () => {
    appendStoryEntry({ publicPath, groundTruthPath, packageJsonPath });
    const after = readFileSync(publicPath, 'utf8');
    expect(after.split('\n')[5]).toBe('**680 chapters.** 679 have retrospectives.');
  });

  it('idempotent-rerun: second invocation is no-op', () => {
    appendStoryEntry({ publicPath, groundTruthPath, packageJsonPath });
    const afterFirst = readFileSync(publicPath, 'utf8');
    const result2 = appendStoryEntry({ publicPath, groundTruthPath, packageJsonPath });
    const afterSecond = readFileSync(publicPath, 'utf8');

    expect(result2.status).toBe('already-present');
    expect(result2.changes).toBe(0);
    expect(afterFirst).toBe(afterSecond); // byte-identical after second run
  });

  it('missing-ground-truth-blocks: throws GROUND_TRUTH_MISSING_ENTRY when ground truth lacks the tag', () => {
    // Overwrite ground truth to NOT have v1.49.637 entry.
    writeFileSync(groundTruthPath, groundTruthFixture(), 'utf8');
    let caught;
    try {
      appendStoryEntry({ publicPath, groundTruthPath, packageJsonPath });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    expect(caught.code).toBe('GROUND_TRUTH_MISSING_ENTRY');
    expect(caught.message).toContain('v1.49.637');

    // Public file unchanged.
    const after = readFileSync(publicPath, 'utf8');
    expect(after).toBe(publicFixture());
  });

  it('byte-equivalence: appended entry is byte-identical to ground-truth source', () => {
    appendStoryEntry({ publicPath, groundTruthPath, packageJsonPath });
    const publicAfter = readFileSync(publicPath, 'utf8');
    const groundTruth = readFileSync(groundTruthPath, 'utf8');

    // The exact ground-truth line for v1.49.637 must appear verbatim in public.
    const gtEntry = findGroundTruthEntry(groundTruth, 'v1.49.637');
    expect(publicAfter).toContain(gtEntry);
    // No leading/trailing whitespace munging on that line.
    const publicLines = publicAfter.split('\n');
    const matchingLine = publicLines.find((l) => l.startsWith('- **[v1.49.637]'));
    expect(matchingLine).toBe(gtEntry);
  });

  it('env-var-bypass: SC_SKIP_STORY_GATE=1 short-circuits via CLI', () => {
    const result = spawnSync('node', [SCRIPT_PATH, '--json'], {
      env: { ...process.env, SC_SKIP_STORY_GATE: '1' },
      cwd: tmpDir, // Run from tmp so script's REPO_ROOT can't find real files anyway
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    const out = JSON.parse(result.stdout.trim());
    expect(out.status).toBe('bypassed');
    expect(out.changes).toBe(0);
  });
});
