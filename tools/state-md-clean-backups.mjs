#!/usr/bin/env node
/**
 * state-md-clean-backups.mjs — source eliminator + detector for the `.planning/`
 * backup-file accumulation drift class (counter-cadence #28; two-layer closure
 * #10431 / #10436).
 *
 * The drift: `tools/state-md-normalizer.mjs` writes a timestamped
 * `.planning/STATE.md.backup-before-normalize-<ts>` before every destructive
 * rewrite, and `tools/citation-debt/apply-diff.mjs` writes
 * `.planning/citation-debt.json.bak.<epoch>` before every ledger merge. Neither
 * is ever cleaned, so they accumulate in the (gitignored) `.planning/` working
 * tree over many ships. The pre-tag-gate step-0.5 janitor only sweeps the
 * STATE.md prefix, only when STATE.md exists, and only inside the gate window —
 * the citation-debt backups and any STATE backup created AFTER the gate (the
 * T14 reset path) persist. The manual remedy was a forgettable per-ship `rm`.
 *
 * This tool is the deterministic SOURCE ELIMINATOR (the `rm` discretion step
 * becomes a one-command `--write` with a post-condition self-check) paired with
 * a pre-tag-gate DETECTOR (`--check`) — the two layers that close a procedure-
 * rooted drift class (third application after STATE.md v813 + PROJECT.md v954 +
 * release-notes v958; #10431/#10436 ESTABLISHED).
 *
 * Scope: by default ONLY the two TOOL-WRITTEN prefixes (narrow — so it never
 * surprises an operator who deliberately parked a manual backup such as
 * `CLAUDE.md.backup-<date>`). `--all` widens to every `.planning/` `*.backup-*`
 * / `*.bak.*` file.
 *
 * Flags:
 *   --check   (default)  exit 1 if any lingering backup is found; list to stderr.
 *   --write              unlink all matched backups, then a post-condition re-scan.
 *   --all                widen the glob to every *.backup-* / *.bak.* in .planning/.
 *   --json               machine-readable result on stdout.
 *
 * Exit codes:
 *   0  no backups (--check) / removed cleanly + post-condition holds (--write)
 *   1  backups present (--check)
 *   2  post-condition failed (--write left residue) or fatal error
 *
 * Test seam: SC_STATE_BACKUP_ROOT overrides the scanned directory (defaults to
 * `<cwd>/.planning`) so tests point at a tmp dir without touching the real tree.
 */

import { readdirSync, unlinkSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const args = new Set(process.argv.slice(2));
const WRITE = args.has('--write');
const ALL = args.has('--all');
const JSON_OUT = args.has('--json');

const PLANNING_DIR = process.env.SC_STATE_BACKUP_ROOT
  ? resolve(process.env.SC_STATE_BACKUP_ROOT)
  : resolve(process.cwd(), '.planning');

/** Narrow default: ONLY the two tool-written prefixes. `--all` widens to BROAD. */
const NARROW = [/^STATE\.md\.backup-before-normalize-.+/, /^citation-debt\.json\.bak\..+/];
// BROAD requires the `.backup-<suffix>` / `.bak.<suffix>` marker to be the FINAL
// dot-delimited segment (`[^.]+$`), so `--all` matches real trailing-marker
// backups (`CLAUDE.md.backup-2026-05-10`, `foo.bak.<epoch>`) but NOT a file that
// merely contains the substring mid-name (`my.backup-notes.md` ends in `.md`).
// `--all` is still the aggressive operator-only escape hatch — run `--check` first.
const BROAD = [/\.backup-[^.]+$/, /\.bak\.[^.]+$/];
const patterns = ALL ? BROAD : NARROW;

/** Path relative to cwd for friendly output. */
function rel(p) {
  const root = resolve(process.cwd());
  return p.startsWith(root + '/') ? p.slice(root.length + 1) : p;
}

/** List backup files (sorted) in PLANNING_DIR matching the active patterns. */
function listBackups() {
  if (!existsSync(PLANNING_DIR)) return [];
  let entries;
  try {
    entries = readdirSync(PLANNING_DIR, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isFile() && patterns.some((re) => re.test(e.name)))
    .map((e) => e.name)
    .sort();
}

function emit(result) {
  if (JSON_OUT) console.log(JSON.stringify(result));
  return result;
}

const found = listBackups();

if (!WRITE) {
  // ── --check (detector) ──────────────────────────────────────────────────────
  if (found.length === 0) {
    emit({ mode: 'check', found: [], ok: true });
    if (!JSON_OUT) console.log(`[state-md-clean-backups] CHECK: no lingering backups in ${rel(PLANNING_DIR)}`);
    process.exit(0);
  }
  emit({ mode: 'check', found, ok: false });
  if (!JSON_OUT) {
    console.error(`[state-md-clean-backups] CHECK: ${found.length} lingering backup file(s) in ${rel(PLANNING_DIR)}:`);
    for (const f of found) console.error(`  - ${f}`);
    console.error('[state-md-clean-backups]   Fix: node tools/state-md-clean-backups.mjs --write');
  }
  process.exit(1);
}

// ── --write (source eliminator) ───────────────────────────────────────────────
let removed = 0;
for (const name of found) {
  try {
    unlinkSync(join(PLANNING_DIR, name));
    removed++;
  } catch {
    /* leave it; the post-condition re-scan below catches any residue */
  }
}

// Post-condition self-check (#10431 source-eliminator + post-condition): a fresh
// scan MUST find zero remaining backups, else the elimination did not hold.
const residual = listBackups();
if (residual.length > 0) {
  emit({ mode: 'write', removed, residual, ok: false });
  if (!JSON_OUT) {
    console.error(
      `[state-md-clean-backups] WRITE: post-condition FAILED — ${residual.length} backup(s) remain after unlink:`,
    );
    for (const f of residual) console.error(`  - ${f}`);
  }
  process.exit(2);
}

emit({ mode: 'write', removed, residual: [], ok: true });
if (!JSON_OUT) {
  console.log(`[state-md-clean-backups] WRITE: removed ${removed} backup file(s); ${rel(PLANNING_DIR)} clean`);
}
process.exit(0);
