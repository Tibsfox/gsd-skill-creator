#!/usr/bin/env node
// Audits whether lessons referenced in release-notes are codified in at
// least one discipline doc OR explicitly listed in the disciplines manifest.
//
// Addresses CONCERNS §23.4 (L-04): "a future agent without context-budget to
// load all discipline docs may inadvertently re-introduce closed-by-discipline
// issues." This tool surfaces lessons that have been emitted-and-referenced
// without ever being captured in the discipline-as-data manifest at
// tools/render-claude-md/disciplines.json.
//
// Lessons are classified into three buckets:
//
//   COVERED       — lesson ID appears in disciplines.json key_lessons list,
//                   AND appears in at least one cited canonical_doc.
//   PARTIAL       — lesson ID appears in disciplines.json key_lessons list
//                   but not in any cited canonical_doc (manifest claim
//                   needs validation), OR appears only in a discipline doc
//                   but isn't listed in the manifest.
//   UNCODIFIED    — lesson ID appears in 2+ retrospectives (emit + at least
//                   one carry-forward) but is not in disciplines.json AND not
//                   referenced in any discipline doc. These are the
//                   highest-risk gaps.
//
// Usage:
//   node tools/check-discipline-coverage.mjs                  (human-readable report)
//   node tools/check-discipline-coverage.mjs --json
//   node tools/check-discipline-coverage.mjs --strict         (exit 1 if any UNCODIFIED)
//
// Exit codes:
//   0  scan clean (or non-strict with UNCODIFIED findings)
//   1  UNCODIFIED findings present AND --strict
//   2  CLI argument error
//   3  manifest or retrospective tree missing

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';

function repoRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return process.cwd();
  }
}

const REPO_ROOT = repoRoot();
const MANIFEST = resolve(REPO_ROOT, 'tools/render-claude-md/disciplines.json');
const NOTES_DIR = resolve(REPO_ROOT, 'docs/release-notes');

// Lesson ID pattern: "Lesson #10199" or "Lesson #10199 candidate" etc.
const LESSON_ID_RE = /Lesson\s+(#\d{4,5})/g;

function parseArgs(argv) {
  const opts = { json: false, strict: false };
  for (const a of argv) {
    if (a === '--json') opts.json = true;
    else if (a === '--strict') opts.strict = true;
    else if (a === '-h' || a === '--help') {
      process.stdout.write(
        [
          'Usage: node tools/check-discipline-coverage.mjs [--json] [--strict]',
          '',
          'Audits release-notes lesson IDs against the disciplines manifest at',
          'tools/render-claude-md/disciplines.json.',
          '',
          'Exit codes:',
          '  0  clean (or non-strict with UNCODIFIED findings)',
          '  1  UNCODIFIED findings AND --strict',
          '  2  CLI arg error',
          '  3  inputs missing',
          '',
        ].join('\n'),
      );
      process.exit(0);
    } else {
      process.stderr.write(`unknown arg: ${a}\n`);
      process.exit(2);
    }
  }
  return opts;
}

function loadManifest() {
  if (!existsSync(MANIFEST)) {
    process.stderr.write(`manifest missing: ${MANIFEST}\n`);
    process.exit(3);
  }
  return JSON.parse(readFileSync(MANIFEST, 'utf8'));
}

// Walk a list of doc paths, return concatenated content (or empty string for missing).
function readDocs(paths) {
  let combined = '';
  for (const p of paths) {
    const abs = resolve(REPO_ROOT, p);
    if (existsSync(abs)) {
      try {
        combined += readFileSync(abs, 'utf8') + '\n';
      } catch {
        // pass
      }
    }
  }
  return combined;
}

function listVersionDirs() {
  if (!existsSync(NOTES_DIR)) {
    process.stderr.write(`retrospective tree missing: ${NOTES_DIR}\n`);
    process.exit(3);
  }
  return readdirSync(NOTES_DIR)
    .filter((d) => /^v\d+(\.\d+)+$/.test(d))
    .filter((d) => statSync(join(NOTES_DIR, d)).isDirectory());
}

// Returns Map<lesson_id, Set<version_dir>> for all lessons referenced in
// any chapter/04-lessons.md across the tree.
function collectLessonRefs() {
  const refs = new Map();
  for (const v of listVersionDirs()) {
    const lessonsMd = join(NOTES_DIR, v, 'chapter', '04-lessons.md');
    if (!existsSync(lessonsMd)) continue;
    const content = readFileSync(lessonsMd, 'utf8');
    let m;
    LESSON_ID_RE.lastIndex = 0;
    while ((m = LESSON_ID_RE.exec(content)) !== null) {
      const id = m[1];
      if (!refs.has(id)) refs.set(id, new Set());
      refs.get(id).add(v);
    }
  }
  return refs;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const manifest = loadManifest();
  const lessonRefs = collectLessonRefs();

  // Build manifest index: lesson_id → { domain, canonical_docs[] }
  const manifestIndex = new Map();
  const allCanonicalPaths = new Set();
  for (const d of manifest) {
    for (const p of d.canonical_docs) allCanonicalPaths.add(p);
    for (const id of d.key_lessons || []) {
      if (!manifestIndex.has(id)) manifestIndex.set(id, []);
      manifestIndex.get(id).push({ domain: d.domain, canonical_docs: d.canonical_docs });
    }
  }
  const discipDocsCombined = readDocs([...allCanonicalPaths]);

  // Classify each referenced lesson
  const buckets = { COVERED: [], PARTIAL: [], UNCODIFIED: [] };
  for (const [id, versions] of lessonRefs.entries()) {
    const versionList = [...versions].sort();
    const refCount = versionList.length;
    const inManifest = manifestIndex.has(id);
    const inDocs = discipDocsCombined.includes(id);

    if (inManifest && inDocs) {
      buckets.COVERED.push({ id, ref_count: refCount, versions: versionList, claimed_by: manifestIndex.get(id) });
    } else if (inManifest || inDocs) {
      buckets.PARTIAL.push({
        id,
        ref_count: refCount,
        versions: versionList,
        in_manifest: inManifest,
        in_docs: inDocs,
        claimed_by: manifestIndex.get(id) || null,
      });
    } else if (refCount >= 2) {
      // Only flag lessons that have been carried forward at least once —
      // single-mention lessons are emit-and-forget by design.
      buckets.UNCODIFIED.push({ id, ref_count: refCount, versions: versionList });
    }
  }

  if (opts.json) {
    process.stdout.write(
      JSON.stringify(
        {
          scan_date: new Date().toISOString().split('T')[0],
          manifest_lessons: [...manifestIndex.keys()].sort(),
          lessons_referenced: lessonRefs.size,
          covered_count: buckets.COVERED.length,
          partial_count: buckets.PARTIAL.length,
          uncodified_count: buckets.UNCODIFIED.length,
          buckets,
        },
        null,
        2,
      ),
    );
    process.stdout.write('\n');
  } else {
    process.stdout.write(`Discipline coverage report\n`);
    process.stdout.write(`  Manifest entries:    ${manifest.length} discipline domains\n`);
    process.stdout.write(`  Lessons in manifest: ${manifestIndex.size}\n`);
    process.stdout.write(`  Lessons referenced:  ${lessonRefs.size} (in release-notes)\n\n`);

    process.stdout.write(`COVERED   (in manifest AND in discipline doc): ${buckets.COVERED.length}\n`);
    for (const e of buckets.COVERED.slice(0, 10)) {
      const domains = e.claimed_by.map((c) => c.domain).join(', ');
      process.stdout.write(`  ${e.id}  (${e.ref_count}x: ${e.versions.join(', ')})  → ${domains}\n`);
    }
    if (buckets.COVERED.length > 10) {
      process.stdout.write(`  ... ${buckets.COVERED.length - 10} more\n`);
    }

    process.stdout.write(`\nPARTIAL   (in manifest OR in doc, not both): ${buckets.PARTIAL.length}\n`);
    for (const e of buckets.PARTIAL) {
      const status = e.in_manifest ? 'in manifest, NOT in doc' : 'in doc, NOT in manifest';
      process.stdout.write(`  ${e.id}  (${e.ref_count}x)  [${status}]\n`);
    }

    process.stdout.write(`\nUNCODIFIED (carried forward but not captured): ${buckets.UNCODIFIED.length}\n`);
    for (const e of buckets.UNCODIFIED.slice(0, 30)) {
      process.stdout.write(`  ${e.id}  (${e.ref_count}x: ${e.versions.slice(0, 4).join(', ')}${e.versions.length > 4 ? ', ...' : ''})\n`);
    }
    if (buckets.UNCODIFIED.length > 30) {
      process.stdout.write(`  ... ${buckets.UNCODIFIED.length - 30} more\n`);
    }

    if (buckets.UNCODIFIED.length > 0) {
      process.stdout.write(
        `\nUNCODIFIED lessons represent discipline-as-data drift. Fix by either:\n` +
          `  1. Adding the lesson ID to a relevant entry's "key_lessons" in tools/render-claude-md/disciplines.json, OR\n` +
          `  2. Codifying the lesson into a discipline doc and re-running this audit.\n`,
      );
    }
  }

  if (opts.strict && buckets.UNCODIFIED.length > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main();
