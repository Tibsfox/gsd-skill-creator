# v1.49.961 — Summary

## The ship

v1.49.961 is counter-cadence #28: a two-layer closure (#10431/#10436) for the
`.planning/` backup-file accumulation drift class. Tool-written backups
(`STATE.md.backup-before-normalize-*`, `citation-debt.json.bak.*`) accumulated in
the gitignored `.planning/` tree because the cleanup was a forgettable manual
`rm`. The closure adds a deterministic source eliminator (self-run at the T14
reset) and a ship-blocking detector, and promotes the two-layer-closure
discipline to a 4th case study (the candidate list is now empty).

## What shipped

- `tools/state-md-clean-backups.mjs` (new): `--check` / `--write` / `--all` /
  `--json`, `SC_STATE_BACKUP_ROOT` seam, narrow tool-written-prefix default,
  unlink + post-condition re-scan (exit 2 on residue).
- `tools/state-md-set-shipped.mjs`: best-effort `--write` self-clean at the T14
  reset (the source-elimination point).
- `tools/pre-tag-gate.sh`: step 19/19 `--check` BLOCKER (exit 21), bypass token
  `state-backups`; final summary now "all 19 checks PASS".
- `tools/render-claude-md/env-vars.json`: bypass vocab + a count-agnostic default
  phrasing (was a stale "all 13 steps").
- `docs/two-layer-closure-discipline.md`: 4th-case-study record.

## Verification

- 16 cleaner tests + 2 meta-tests; full tools-suite 815 green. Pattern selection,
  live-file protection, and the step-19/18 exit-code idiom all mutation-proven.
- Dogfooded on the real `.planning/`.
- 3-lens adversarial review found a MAJOR (step 19 + step 18 aborted under
  `set -euo pipefail` before their FAIL diagnostic / exit code) — fixed with the
  exit-code-preserving `&& X=0 || X=$?` idiom (runtime-verified to reach exit 21),
  plus the `--all` regex anchor and the post-condition/idempotency tests.

## Engine state

- NASA degree 1.178 (frozen hold). Counter-cadence 27 -> **28**. Manifest 151
  (no new lesson; 4th two-layer-closure case study). No `cadence_advances` marker.
