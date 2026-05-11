#!/usr/bin/env node
/**
 * scripts/append-story-entry.mjs (v1.49.637 C5)
 *
 * Per-ship sustained-update gate for `docs/release-notes/STORY.md`. On every
 * ship, the public STORY.md gains an entry mirroring the just-shipped milestone
 * from the gitignored ground truth at `.planning/roadmap/STORY.md`. The entry
 * is appended verbatim (byte-equivalent) and the header line + chapter count
 * line are updated.
 *
 * Closes v1.49.636 named carry-forward #1 "Public STORY.md sustained-update
 * process" (Lesson #10191 forward). Pre-v1.49.636 history: ship-time directives
 * were race-conditioned; v1.49.636 backfilled 53 entries inline during T14;
 * v1.49.637+ uses this gate so future operators never need to backfill.
 *
 * Mechanism:
 *   1. Read tag from `package.json` → `vMAJOR.MINOR.PATCH`.
 *   2. Parse `.planning/roadmap/STORY.md` (ground truth) for the entry line
 *      matching that tag.
 *   3. If `docs/release-notes/STORY.md` already contains the entry → no-op.
 *      Otherwise append the verbatim entry + update header line 4
 *      (`continues to vX.Y.Z`) + chapter count line 6 (`**N chapters.**`).
 *   4. Block (exit non-zero) if ground truth lacks the tag's entry.
 *
 * The script is idempotent: a second run with no new tag is a no-op.
 *
 * Default behavior: write changes to public STORY.md (exit 0 on success or
 * already-present).
 *
 *   SC_SKIP_STORY_GATE=1   bypass with INFO log (exit 0, no write)
 *   --dry-run              print what would change but don't write (exit 0)
 *   --json                 emit machine-readable result on stdout
 *
 * Exit codes:
 *   0  appended OR already-present OR bypassed OR dry-run
 *   1  ground-truth missing entry for current tag (BLOCKER)
 *   2  malformed package.json / unreadable inputs
 *   3  malformed public STORY.md (cannot locate header / chapter-count lines)
 *
 * See: .planning/missions/v1-49-637-housekeeping-cluster-4/components/05-story-md-sustained-update-gate.md
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(process.cwd());
const DEFAULT_PUBLIC_PATH = resolve(REPO_ROOT, 'docs/release-notes/STORY.md');
const DEFAULT_GROUND_TRUTH_PATH = resolve(REPO_ROOT, '.planning/roadmap/STORY.md');
const DEFAULT_PACKAGE_JSON_PATH = resolve(REPO_ROOT, 'package.json');

/**
 * @typedef {Object} AppendStoryEntryResult
 * @property {string} tag                       e.g. 'v1.49.637'
 * @property {'appended'|'already-present'|'bypassed'|'dry-run-would-append'} status
 * @property {number} changes                   0 or 1
 * @property {string|null} appendedEntry        the line appended, or null
 * @property {string|null} previousHeaderTag    e.g. 'v1.49.636'
 * @property {number|null} previousChapterCount e.g. 679
 * @property {number|null} newChapterCount      e.g. 680
 */

// ─── Pure helpers (exported for tests) ────────────────────────────────────────

export function readPackageVersion(pkgPath = DEFAULT_PACKAGE_JSON_PATH) {
  const raw = readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(raw);
  if (typeof pkg.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(pkg.version)) {
    throw new Error(
      `package.json version is not a valid semver string (got ${JSON.stringify(pkg.version)})`,
    );
  }
  return pkg.version;
}

/**
 * Find the ground-truth entry line for a given tag.
 *
 * Ground-truth entry shape (one line, anchored at column 0):
 *   - **[v1.49.NNN](v1.49.NNN/00-summary.md)** — <summary> · <date>
 *
 * Returns the raw matching line (no trailing newline) or null if absent.
 */
export function findGroundTruthEntry(groundTruthContent, tag) {
  const lines = groundTruthContent.split('\n');
  // Anchor on the tag inside the `[v1.49.NNN]` link form to avoid spurious
  // matches inside prose elsewhere in the document.
  const anchor = `- **[${tag}](${tag}/00-summary.md)**`;
  for (const line of lines) {
    if (line.startsWith(anchor)) {
      return line;
    }
  }
  return null;
}

/**
 * Check whether public STORY already contains an entry for `tag`.
 * Uses the same anchored-link form as ground-truth detection.
 */
export function publicAlreadyHasEntry(publicContent, tag) {
  const anchor = `- **[${tag}](${tag}/00-summary.md)**`;
  return publicContent.split('\n').some((line) => line.startsWith(anchor));
}

/**
 * Parse current header tag from line 4.
 *
 * Expected shape:
 *   The story begins at `v1.0` and continues to `v1.49.636`.
 *
 * Returns the trailing tag string (without backticks) or null if line 4
 * doesn't match.
 */
export function parseHeaderTag(publicContent) {
  const lines = publicContent.split('\n');
  if (lines.length < 4) return null;
  const m = lines[3].match(/continues to `(v\d+\.\d+\.\d+)`\.\s*$/);
  return m ? m[1] : null;
}

/**
 * Parse current chapter count from line 6.
 *
 * Expected shape:
 *   **679 chapters.** 678 have retrospectives.
 *
 * Returns { chapters, retrospectives } or null.
 */
export function parseChapterCount(publicContent) {
  const lines = publicContent.split('\n');
  if (lines.length < 6) return null;
  const m = lines[5].match(/^\*\*(\d+) chapters\.\*\* (\d+) have retrospectives\.\s*$/);
  if (!m) return null;
  return {
    chapters: parseInt(m[1], 10),
    retrospectives: parseInt(m[2], 10),
  };
}

/**
 * Compute the new public STORY.md content with the entry appended + header
 * line 4 updated + chapter-count line 6 incremented.
 *
 * Preserves the trailing-newline shape of the input: if input ends with \n
 * the output ends with \n; otherwise no trailing newline is added beyond the
 * single \n that separates the new entry from the prior last line.
 */
export function applyAppend(publicContent, groundTruthEntry, tag) {
  const headerTag = parseHeaderTag(publicContent);
  if (!headerTag) {
    throw new Error(
      'STORY.md header line 4 does not match `continues to \\`vX.Y.Z\\`.` shape — cannot update header',
    );
  }
  const counts = parseChapterCount(publicContent);
  if (!counts) {
    throw new Error(
      'STORY.md line 6 does not match `**N chapters.** M have retrospectives.` shape — cannot update count',
    );
  }

  // Update header line 4: replace tag inside backticks.
  const lines = publicContent.split('\n');
  lines[3] = lines[3].replace(
    /continues to `v\d+\.\d+\.\d+`\./,
    `continues to \`${tag}\`.`,
  );

  // Update chapter-count line 6: bump chapters by 1; retrospectives stays at
  // (chapters - 1) i.e. previous chapters value, matching the historical
  // pattern that the most-recent ship hasn't yet authored its retrospective.
  const newChapters = counts.chapters + 1;
  const newRetrospectives = counts.chapters; // prior chapters becomes new retro count
  lines[5] = `**${newChapters} chapters.** ${newRetrospectives} have retrospectives.`;

  // Append the entry. Preserve trailing-newline shape.
  const hadTrailingNewline = publicContent.endsWith('\n');
  // The last list line is the previous-tag entry; we append the new line
  // immediately after it (no extra blank line — list is contiguous).
  let updated;
  if (hadTrailingNewline) {
    // Remove the trailing "" element from split, append entry + newline,
    // re-join.
    if (lines[lines.length - 1] === '') {
      lines[lines.length - 1] = groundTruthEntry;
      lines.push('');
      updated = lines.join('\n');
    } else {
      // No empty trailing element — just append.
      lines.push(groundTruthEntry);
      lines.push('');
      updated = lines.join('\n');
    }
  } else {
    lines.push(groundTruthEntry);
    updated = lines.join('\n');
  }

  return {
    content: updated,
    previousHeaderTag: headerTag,
    previousChapterCount: counts.chapters,
    newChapterCount: newChapters,
  };
}

/**
 * Top-level: do the whole append-if-missing dance.
 *
 * @param {Object} options
 * @param {string} [options.tag]                 override package.json version
 * @param {string} [options.publicPath]          override public STORY.md path
 * @param {string} [options.groundTruthPath]     override ground-truth path
 * @param {string} [options.packageJsonPath]     override package.json path
 * @param {boolean} [options.dryRun=false]       skip write
 * @returns {AppendStoryEntryResult}
 */
export function appendStoryEntry(options = {}) {
  const publicPath = options.publicPath ?? DEFAULT_PUBLIC_PATH;
  const groundTruthPath = options.groundTruthPath ?? DEFAULT_GROUND_TRUTH_PATH;
  const packageJsonPath = options.packageJsonPath ?? DEFAULT_PACKAGE_JSON_PATH;
  const dryRun = options.dryRun ?? false;

  const versionString = options.tag
    ? options.tag.replace(/^v/, '')
    : readPackageVersion(packageJsonPath);
  const tag = `v${versionString}`;

  if (!existsSync(publicPath)) {
    throw new Error(`public STORY.md missing at ${publicPath}`);
  }
  if (!existsSync(groundTruthPath)) {
    throw new Error(`ground-truth STORY.md missing at ${groundTruthPath}`);
  }

  const publicContent = readFileSync(publicPath, 'utf8');

  // Idempotency: already-present.
  if (publicAlreadyHasEntry(publicContent, tag)) {
    return {
      tag,
      status: 'already-present',
      changes: 0,
      appendedEntry: null,
      previousHeaderTag: parseHeaderTag(publicContent),
      previousChapterCount: parseChapterCount(publicContent)?.chapters ?? null,
      newChapterCount: null,
    };
  }

  const groundTruthContent = readFileSync(groundTruthPath, 'utf8');
  const groundTruthEntry = findGroundTruthEntry(groundTruthContent, tag);
  if (groundTruthEntry === null) {
    const err = new Error(
      `ground-truth ${groundTruthPath} has no entry for ${tag} — author the entry there BEFORE running the gate`,
    );
    err.code = 'GROUND_TRUTH_MISSING_ENTRY';
    throw err;
  }

  const { content, previousHeaderTag, previousChapterCount, newChapterCount } =
    applyAppend(publicContent, groundTruthEntry, tag);

  if (!dryRun) {
    writeFileSync(publicPath, content, 'utf8');
  }

  return {
    tag,
    status: dryRun ? 'dry-run-would-append' : 'appended',
    changes: 1,
    appendedEntry: groundTruthEntry,
    previousHeaderTag,
    previousChapterCount,
    newChapterCount,
  };
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

function isDirectInvocation() {
  // Detect "node scripts/append-story-entry.mjs" vs. "import {...} from ..."
  // process.argv[1] resolves to the script's absolute path when invoked
  // directly; differs when imported.
  const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
  const thisPath = resolve(new URL(import.meta.url).pathname);
  return invokedPath === thisPath;
}

function main() {
  const args = new Set(process.argv.slice(2));
  const DRY_RUN = args.has('--dry-run');
  const JSON_OUT = args.has('--json');

  // Bypass: env var honored before any I/O so emergency skips never fail.
  if (process.env.SC_SKIP_STORY_GATE === '1') {
    const result = {
      tag: null,
      status: 'bypassed',
      changes: 0,
      appendedEntry: null,
      previousHeaderTag: null,
      previousChapterCount: null,
      newChapterCount: null,
    };
    if (JSON_OUT) {
      console.log(JSON.stringify(result));
    } else {
      console.log('[append-story-entry] BYPASSED (SC_SKIP_STORY_GATE=1)');
    }
    process.exit(0);
  }

  let result;
  try {
    result = appendStoryEntry({ dryRun: DRY_RUN });
  } catch (err) {
    if (err.code === 'GROUND_TRUTH_MISSING_ENTRY') {
      console.error(`[append-story-entry] FAIL: ${err.message}`);
      console.error('[append-story-entry] Fix: author the entry in .planning/roadmap/STORY.md first.');
      console.error('[append-story-entry] Emergency bypass: SC_SKIP_STORY_GATE=1 (document in release-notes).');
      process.exit(1);
    }
    if (
      err.message.includes('header line 4') ||
      err.message.includes('line 6')
    ) {
      console.error(`[append-story-entry] FAIL: malformed public STORY.md — ${err.message}`);
      process.exit(3);
    }
    if (
      err.message.includes('package.json version') ||
      err.message.includes('missing at')
    ) {
      console.error(`[append-story-entry] FAIL: ${err.message}`);
      process.exit(2);
    }
    throw err;
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(result));
  } else {
    if (result.status === 'already-present') {
      console.log(`[append-story-entry] no-op: ${result.tag} entry already in public STORY.md`);
    } else if (result.status === 'dry-run-would-append') {
      console.log(`[append-story-entry] DRY-RUN: would append ${result.tag} entry`);
      console.log(`[append-story-entry]   entry: ${result.appendedEntry}`);
      console.log(`[append-story-entry]   chapter count: ${result.previousChapterCount} → ${result.newChapterCount}`);
    } else {
      console.log(`[append-story-entry] APPENDED ${result.tag} entry to public STORY.md`);
      console.log(`[append-story-entry]   header tag: ${result.previousHeaderTag} → ${result.tag}`);
      console.log(`[append-story-entry]   chapter count: ${result.previousChapterCount} → ${result.newChapterCount}`);
    }
  }
  process.exit(0);
}

if (isDirectInvocation()) {
  main();
}
