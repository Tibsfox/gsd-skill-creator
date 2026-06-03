#!/usr/bin/env node
/**
 * scaffold-release-notes.mjs — source eliminator for the release-notes 5-file
 * scaffolding drift class (counter-cadence #27, v1.49.958).
 *
 * THE DRIFT CLASS. Before tagging any v1.49.x ship, an operator hand-creates
 *   docs/release-notes/<version>/
 *   ├── README.md
 *   └── chapter/{00-summary,03-retrospective,04-lessons,99-context}.md
 * and can forget a file or mis-shape the directory. The completeness gate
 * (tools/release-history/check-completeness.mjs, pre-tag-gate step 3) is the
 * DETECTOR — it catches the drift after it lands. This tool is the missing
 * SOURCE ELIMINATOR (two-layer-closure discipline #10431 / #10436): it emits the
 * canonical 5-file STRUCTURE deterministically so the directory is never
 * hand-created, then the operator fills the prose.
 *
 * THE SCAFFOLD-PENDING SENTINEL. Each scaffolded section carries a pending HTML
 * comment marker. The completeness gate's --strict mode (this ship adds the
 * check) BLOCKS any release-notes file still carrying the marker, so a
 * scaffolded-but-unfilled file cannot ship — closing the placeholder-could-ship
 * hazard a structure scaffolder would otherwise introduce. The literal marker
 * token therefore must NEVER appear in published release-notes prose (the
 * self-referential leak-scan trap, #10462): describe the marker, do not
 * reproduce it. The token lives ONLY in this tool and its test fixtures.
 *
 * STRUCTURE vs FILL — two concerns, two surfaces:
 *   - This tool's --check verifies STRUCTURE (all 5 files present). It is silent
 *     about fill-state.
 *   - check-completeness --strict verifies STRUCTURE + size + FILL (no pending
 *     marker). That is the ship-time gate.
 *
 * PRESERVATION. --write (re)writes ONLY missing files and PRISTINE scaffolds
 * (byte-identical to the freshly built scaffold). Any file with hand-authored
 * edits is PRESERVED -- whether fully filled (no marker) or partially filled
 * (real prose plus a leftover marker). So forgetting one of a file's several
 * markers never clobbers the rest of that file (review finding, v1.49.958): a
 * partially-filled file is preserved with a loud warning, not blind-rewritten.
 * --force overwrites everything (resets edited files back to a blank scaffold).
 *
 * Usage:
 *   node tools/release-history/scaffold-release-notes.mjs \
 *     --version v1.49.958 \
 *     --name "release-notes 5-file scaffolding source eliminator" \
 *     [--type "feat(cli)"]          # the conventional-commit type label
 *     [--date 2026-06-02]           # default: today (local)
 *     [--check]                     # report structure drift, no write (exit 1 if any file missing)
 *     [--force]                     # overwrite even filled (hand-authored) files
 *
 * Exit codes:
 *   0  --write: all 5 files present after the run (post-condition PASS);
 *      --check: all 5 files present (no structure drift)
 *   1  --check: one or more files missing; or invalid args
 *   2  I/O error or post-condition failure
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const COMPLETENESS = join(HERE, 'check-completeness.mjs');

// The pending-section sentinel. SCAFFOLD_PENDING_TOKEN is the distinctive
// namespaced substring (uppercase/prefixed so the lowercase descriptive phrase
// "scaffold-pending" in ordinary prose never collides). SCAFFOLD_PENDING_MARKER
// is the full HTML-comment the scaffolder emits per unfilled section, and is the
// exact string check-completeness --strict BLOCKS on -- matching the COMMENT
// form (not the bare token) lets published prose name the token freely while an
// actual unfilled scaffold (which always carries the comment) is still caught
// (#10462). Keep the marker comment out of published prose; the token may be
// described.
export const SCAFFOLD_PENDING_TOKEN = 'RELEASE-NOTES-SCAFFOLD-PENDING';
export const SCAFFOLD_PENDING_MARKER = `<!-- ${SCAFFOLD_PENDING_TOKEN}: replace this section with real content before shipping -->`;
const PENDING = SCAFFOLD_PENDING_MARKER;

export const REQUIRED_FILES = [
  'README.md',
  'chapter/00-summary.md',
  'chapter/03-retrospective.md',
  'chapter/04-lessons.md',
  'chapter/99-context.md',
];

// ─── arg parsing ────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = { version: null, name: null, type: null, date: null, check: false, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--version': out.version = argv[++i]; break;
      case '--name': out.name = argv[++i]; break;
      case '--type': out.type = argv[++i]; break;
      case '--date': out.date = argv[++i]; break;
      case '--check': out.check = true; break;
      case '--force': out.force = true; break;
      default:
        if (a?.startsWith('--')) throw new Error(`Unknown flag: ${a}`);
    }
  }
  return out;
}

function validateArgs(a, { requireName }) {
  if (!a.version) throw new Error('Missing required flag: --version');
  if (!/^v\d+\.\d+\.\d+$/.test(a.version)) {
    throw new Error(`--version must match vMAJOR.MINOR.PATCH (got ${JSON.stringify(a.version)})`);
  }
  if (requireName && !a.name) throw new Error('Missing required flag: --name');
  if (a.date && !/^\d{4}-\d{2}-\d{2}$/.test(a.date)) {
    throw new Error(`--date must be YYYY-MM-DD (got ${JSON.stringify(a.date)})`);
  }
}

// ─── content builders (exported for tests) ──────────────────────────────────

/**
 * Build the canonical content for all 5 release-notes files. Every file carries
 * the pending sentinel in each body section and exceeds the 200-byte floor the
 * completeness gate enforces, so the STRUCTURE passes presence+size while the
 * FILL-gate (--strict pending check) still blocks until the operator replaces
 * the markers.
 */
export function buildReleaseNotesFiles({ version, name, type, date }) {
  const t = type || '<type(scope)>';
  const files = {};

  files['README.md'] =
`---
title: "${version} — ${name}"
version: ${version}
date: ${date}
summary: >
  ${PENDING}
  One paragraph: what shipped and why it matters. Replace this block.
tags: [scaffold-pending]
---

# ${version} — ${name}

**Shipped:** ${date}

${PENDING}
One-line: the headline change in a single sentence.

## Why this ship

${PENDING}
What gap or forward-candidate this closes; how it was scoped.

## What shipped

${PENDING}
The concrete changes, as bullets.

## Verification

${PENDING}
Tests, build, gate, and any mutation/review evidence.

## Engine state

${PENDING}
NASA degree, counter-cadence count, manifest lesson count, cadence_advances.
`;

  files['chapter/00-summary.md'] =
`# ${version} — Summary

## The ship

${PENDING}
One paragraph stating what shipped.

## What shipped

${PENDING}
The concrete changes, as bullets.

## Verification

${PENDING}
Tests, build, gate evidence.

## Engine state

${PENDING}
NASA degree, counter-cadence, manifest count.
`;

  files['chapter/03-retrospective.md'] =
`# ${version} — Retrospective

## What went right

${PENDING}
The decisions and outcomes that worked.

## What went well in process

${PENDING}
Cadence, review, and discipline notes.

## What to watch

${PENDING}
Risks, residuals, and named forward bounds.
`;

  files['chapter/04-lessons.md'] =
`# ${version} — Lessons

${PENDING}
State whether a manifest lesson is promoted, or which existing lessons this applies.

## Applied (existing lessons)

${PENDING}
The lessons this ship applies, with how.

## Process notes

${PENDING}
Reusable process observations.
`;

  files['chapter/99-context.md'] =
`---
title: "Context"
chapter: 99-context
version: ${version}
date: ${date}
summary: "Where ${version} sits in the larger arc."
tags: [context, scaffold-pending]
---

# ${version} — Context

## Milestone metadata

- **Version:** ${version}
- **Type:** \`${t}\` — ${name}
- **Predecessor:** ${PENDING}
- **NASA degree:** ${PENDING}
- **Counter-cadence count:** ${PENDING}

## Where this sits

${PENDING}
How this milestone relates to its predecessor and the active arc.

## Files changed

${PENDING}
The source/doc files this ship touched.

## Engine state at close

${PENDING}
NASA degree, counter-cadence, manifest count.
`;

  return files;
}

// ─── filesystem helpers ─────────────────────────────────────────────────────

/**
 * Classify each required file. `files` (the freshly built scaffold for this
 * version) enables the 'pristine' state; omit it (e.g. for --check) and an
 * untouched scaffold simply reads as 'partial'.
 *   - 'missing'    — not on disk
 *   - 'pristine'   — byte-identical to the freshly built scaffold (untouched)
 *   - 'partial'    — edited (differs from pristine) but still carries the marker
 *   - 'filled'     — edited and carries NO marker (hand-authored)
 *   - 'unreadable' — exists but could not be read
 * Only 'missing' and 'pristine' are (re)written by --write; 'partial', 'filled',
 * and 'unreadable' are PRESERVED. The preservation contract therefore holds for
 * ANY file with hand-authored content, not just fully-filled ones — forgetting
 * one of a file's several markers no longer clobbers the rest (review finding,
 * v1.49.958). --force overrides and rewrites every file.
 */
function classify(releaseDir, files) {
  const rows = [];
  for (const rel of REQUIRED_FILES) {
    const abs = join(releaseDir, rel);
    if (!existsSync(abs)) {
      rows.push({ rel, abs, state: 'missing' });
      continue;
    }
    let content;
    try {
      content = readFileSync(abs, 'utf8');
    } catch {
      rows.push({ rel, abs, state: 'unreadable' });
      continue;
    }
    if (files && content === files[rel]) rows.push({ rel, abs, state: 'pristine' });
    else if (content.includes(SCAFFOLD_PENDING_MARKER)) rows.push({ rel, abs, state: 'partial' });
    else rows.push({ rel, abs, state: 'filled' });
  }
  return rows;
}

// ─── main ───────────────────────────────────────────────────────────────────

function main() {
  let a;
  try {
    a = parseArgs(process.argv.slice(2));
    validateArgs(a, { requireName: !a.check });
  } catch (err) {
    console.error(`[scaffold-release-notes] ${err.message}`);
    process.exit(1);
  }

  // Release-notes root: default <repo>/docs/release-notes; SC_RELEASE_NOTES_ROOT
  // relocates it (a test-isolation / alternate-tree seam, cf. RH_ENV_FILE). The
  // post-condition child inherits this env, so it checks the same tree.
  const releaseNotesRoot = process.env.SC_RELEASE_NOTES_ROOT || join(REPO_ROOT, 'docs', 'release-notes');
  const releaseDir = join(releaseNotesRoot, a.version);

  // --- --check: structure drift only (presence of the 5 files) ---
  if (a.check) {
    const rows = classify(releaseDir);
    const missing = rows.filter((r) => r.state === 'missing');
    if (missing.length === 0) {
      console.log(`[scaffold-release-notes] CHECK ${a.version}: structure present (all 5 files).`);
      const markered = rows.filter((r) => r.state === 'partial');
      if (markered.length > 0) {
        console.log(`  note: ${markered.length} file(s) still carry the scaffold-pending marker (fill before the --strict ship gate):`);
        for (const r of markered) console.log(`    - ${r.rel}`);
      }
      process.exit(0);
    }
    console.error(`[scaffold-release-notes] CHECK ${a.version}: structure INCOMPLETE — ${missing.length} file(s) missing:`);
    for (const r of missing) console.error(`    - ${r.rel}`);
    console.error(`  Run: node tools/release-history/scaffold-release-notes.mjs --version ${a.version} --name "..." [--write]`);
    process.exit(1);
  }

  // --- default (write): create missing files, reset pristine scaffolds, PRESERVE
  //     any file with hand-authored edits (filled OR partial). --force rewrites all.
  const date = a.date || new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local
  const files = buildReleaseNotesFiles({ version: a.version, name: a.name, type: a.type, date });
  const rows = classify(releaseDir, files);

  let wrote = 0;
  let preserved = 0;
  try {
    for (const r of rows) {
      const writeIt = a.force || r.state === 'missing' || r.state === 'pristine';
      if (!writeIt) {
        preserved++;
        if (r.state === 'partial') {
          console.warn(`[scaffold-release-notes] PRESERVED ${r.rel} (PARTIALLY FILLED — has edits AND a scaffold-pending marker; finish filling, or pass --force to reset to a blank scaffold)`);
        } else if (r.state === 'unreadable') {
          console.warn(`[scaffold-release-notes] PRESERVED ${r.rel} (unreadable — left untouched; inspect manually)`);
        } else {
          console.log(`[scaffold-release-notes] PRESERVED ${r.rel} (filled / hand-authored)`);
        }
        continue;
      }
      if (r.state === 'pristine' && !a.force) {
        // Already byte-identical to the canonical scaffold — leave it untouched.
        console.log(`[scaffold-release-notes] UNCHANGED ${r.rel} (pristine scaffold)`);
        continue;
      }
      mkdirSync(dirname(r.abs), { recursive: true });
      writeFileSync(r.abs, files[r.rel], 'utf8');
      wrote++;
      const verb = r.state === 'missing' ? 'CREATED' : 'RESET  ';
      console.log(`[scaffold-release-notes] ${verb} ${r.rel}`);
    }
  } catch (err) {
    console.error(`[scaffold-release-notes] I/O error: ${err.message}`);
    process.exit(2);
  }

  // Post-condition: confirm the 5-file STRUCTURE now exists (presence). The
  // FILL-gate (--strict pending check) is a deliberate later step the operator
  // satisfies by replacing the markers, so the post-condition is non-strict.
  const post = spawnSync('node', [COMPLETENESS, a.version], { cwd: REPO_ROOT, stdio: 'pipe' });
  if (post.status !== 0) {
    console.error('[scaffold-release-notes] POST-CONDITION FAILED: structure incomplete after write:');
    if (post.stderr) console.error(post.stderr.toString());
    process.exit(2);
  }

  console.log(`[scaffold-release-notes] ${a.version}: wrote ${wrote}, preserved ${preserved} — structure complete (5 files). Fill the scaffold-pending sections before the --strict ship gate.`);
  process.exit(0);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) main();
