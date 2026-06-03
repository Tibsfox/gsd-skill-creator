---
title: "v1.49.961 — STATE.md backup-file two-layer closure (counter-cadence #28)"
version: v1.49.961
date: 2026-06-03
summary: >
  Counter-cadence #28: closes the .planning/ backup-file accumulation drift class
  with a two-layer closure (#10431/#10436) — a deterministic source eliminator
  (state-md-clean-backups.mjs, self-run at the T14 reset) plus a pre-tag-gate
  detector (step 19). Promotes the two-layer-closure discipline to a 4th
  case study.
tags: [counter-cadence, two-layer-closure, tooling, pre-tag-gate, cleanup]
---

# v1.49.961 — STATE.md backup-file two-layer closure (counter-cadence #28)

**Shipped:** 2026-06-03

The forgettable per-ship `rm` of `.planning/` backup files becomes a deterministic
self-cleaning tool plus a ship-blocking detector — the last enumerated two-layer
closure candidate, closed.

## Why this ship

`tools/state-md-normalizer.mjs` writes `.planning/STATE.md.backup-before-normalize-<ts>`
before every destructive rewrite, and `tools/citation-debt/apply-diff.mjs` writes
`.planning/citation-debt.json.bak.<epoch>` before every ledger merge. Neither is
cleaned, so they accumulate in the gitignored `.planning/` working tree. The
pre-tag-gate step-0.5 janitor only sweeps the STATE prefix, only in the gate
window — citation-debt backups and post-gate STATE backups persisted, and the
remedy was a forgettable manual `rm`. This was the last candidate enumerated in
`docs/two-layer-closure-discipline.md` and forward-candidate 1 of the operator's
post-v958 "1 2 & 3" batch (shipped last, as the counter-cadence).

## What shipped

- **Source eliminator** — `tools/state-md-clean-backups.mjs` (`--check` / `--write`
  / `--all` / `--json`, `SC_STATE_BACKUP_ROOT` test seam). NARROW default scope =
  the two tool-written prefixes (so a deliberately-parked manual backup is left
  alone); `--all` widens to any trailing-marker `*.backup-*` / `*.bak.*`. `--write`
  unlinks then runs a post-condition re-scan (exit 2 on residue).
- **Self-clean wire** — `state-md-set-shipped.mjs` runs `--write` (best-effort) at
  the T14 reset, eliminating the manual `rm` discretion step.
- **Detector** — pre-tag-gate **step 19** runs `--check` as a BLOCKER (exit 21),
  bypass token `state-backups`.
- **Discipline** — `docs/two-layer-closure-discipline.md` records this as the 4th
  two-layer closure (after STATE.md v813, PROJECT.md v954, release-notes v958);
  the candidate list is now empty.

## Verification

- 16 cleaner tests (narrow/broad selection, live-file negative, post-condition
  exit-2 via chmod, double-write idempotency, `--all` mid-name guard) — the
  pattern-selection + live-file protection mutation-proven. Full tools-suite 815
  green. Two meta-tests (v961 new + v869 made count-agnostic).
- Dogfooded: the detector `--check` on the real `.planning/` passes (narrow), and
  `--all --check` correctly flags the parked manual backup.
- A 3-lens adversarial review found a **MAJOR** runtime bug — step 19's
  `OUTPUT="$(...)"` + `EXIT=$?` under `set -euo pipefail` aborted the gate before
  the diagnostic / `exit 21` (it still blocked, silently, with the wrong code).
  The same latent bug sat in step 18 (a copied sibling). **Both fixed** with the
  exit-code-preserving idiom `OUTPUT="$(...)" && EXIT=0 || EXIT=$?` (the review's
  suggested plain `|| true` would have masked the code to 0 and made the detector
  vacuous — a worse bug), runtime-verified to reach exit 21, and pinned by a
  mutation-proven meta-test. The review also tightened the `--all` regex and added
  the post-condition + idempotency tests.

## Engine state

- **NASA degree:** 1.178 (frozen hold; unchanged).
- **Counter-cadence:** 27 -> **28** (this ship is counter-cadence #28).
- **Manifest lessons:** 151 (applies #10431 / #10436 / #10461 / #10427; no new
  lesson — the two-layer-closure discipline is promoted to a 4th case study).
- **cadence_advances:** none.
