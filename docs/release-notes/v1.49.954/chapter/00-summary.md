# v1.49.954 — Summary

## The ship

Item 4 (final) of the post-v1.49.950 "1 2 3 and 4" batch: counter-cadence #25. Adds the source eliminator for the PROJECT.md "Latest shipped release" hand-edit drift, completing the two-layer closure (#10431) the discipline doc flagged OPEN since v1.49.813.

## How it was scoped

Per the meta-cadence discipline, scope was chosen by running `skill-creator cadence --check` first — it exits **0** (no axis machine-determinably overdue: consume/calibrate/verify `not-overdue`, codify `manual`). So #25 targets hand-picked debt: the PROJECT.md structured-line hand-edit, which surfaced twice IN this batch (two hand-edits + a pre-tag-gate WARN at v1.49.952).

## What shipped

- **`project-md-normalizer.mjs --write --version vX --name "..." [--date]`** — narrow, prose-preserving rewrite of ONLY the three structured lines: rotates current latest-shipped into Predecessor, sets new latest-shipped, refreshes Last-updated.
- **Idempotent** (re-run at same version rotates nothing) + **post-condition self-check** (result must pass `--check`).
- **Touches no hand-authored prose** — the v1.49.785 conservative-by-design stance is preserved.
- **5 new `--write` tests** + the 12 existing `--check` tests; idempotency guard **mutation-proven**.
- **`docs/two-layer-closure-discipline.md`** — PROJECT.md class moved from "open; flagged at v813" to "closed at v1.49.954" with a parallel case study.

## The new ship step

PROJECT.md is gitignored (local-only), so `--write` is a LOCAL post-ship step (after `state-md-set-shipped.mjs`). This ship dogfoods it — v954's own PROJECT.md lines were set by `--write`, not by hand.

## Verification

- `tools/` suite 783/783, incl. 17 normalizer tests (12 `--check` + 5 `--write`).
- Mutation-proven: dropping the `oldVersion !== version` idempotency guard clobbers the predecessor and fails the idempotency test.
- `cadence --check` exits 0 (scoping confirmation).

## Engine state

NASA 1.178 (unchanged), counter-cadence **24 -> 25**, manifest **151** (unchanged — applies #10431 / #10168 / #10428; a new instance of the two-layer pattern, not a new lesson). No `cadence_advances` tag.
