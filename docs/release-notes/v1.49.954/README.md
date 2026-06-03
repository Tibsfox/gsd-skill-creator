---
title: "v1.49.954 — PROJECT.md latest-shipped source eliminator (counter-cadence #25)"
version: v1.49.954
date: 2026-06-02
summary: >
  Item 4 (final) of the post-v1.49.950 "1 2 3 and 4" batch: counter-cadence #25.
  Scoped by running `skill-creator cadence --check` first (now literally its
  purpose) — it exits 0 (no axis machine-determinably overdue: consume/calibrate/
  verify all not-overdue, codify manual), so #25 targets a hand-picked
  operational-debt class instead. The chosen debt: PROJECT.md's structured
  "Latest shipped release" / "Predecessor" / "Last updated" lines were hand-edited
  every ship — a procedure-rooted drift the two-layer-closure discipline (#10431)
  had explicitly flagged OPEN since v1.49.813 (a detector existed, no source
  eliminator). It surfaced twice during this very batch (two hand-edits + one
  pre-tag-gate WARN at v1.49.952). This ship adds the source eliminator:
  `tools/project-md-normalizer.mjs --write --version --name [--date]` performs a
  narrow, prose-preserving rewrite of ONLY those three structured lines —
  rotating the current latest-shipped into Predecessor, setting the new
  latest-shipped, refreshing Last-updated. Idempotent (re-running at the same
  version rotates nothing) with a post-condition self-check. Paired with the
  pre-existing `--check` detector (pre-tag-gate step 17), it completes the
  two-layer closure for this drift class. 5 new --write tests; the idempotency
  guard is mutation-proven. The conservative-by-design normalizer touches no
  hand-authored prose.
tags: [feat, tools, counter-cadence, project-md, two-layer-closure, lesson-10431, lesson-10168]
---

# v1.49.954 — PROJECT.md latest-shipped source eliminator (counter-cadence #25)

**Shipped:** 2026-06-02

One-line: `project-md-normalizer.mjs --write` is the source eliminator for the PROJECT.md "Latest shipped release" hand-edit drift — a narrow, prose-preserving rewrite of three structured lines that completes the two-layer closure (#10431) the discipline doc flagged open since v1.49.813.

## Why this ship (and how it was scoped)

Item 4 (final) of the operator-directed "1 2 3 and 4" batch: counter-cadence #25. Per the meta-cadence discipline, the scope was chosen by running `skill-creator cadence --check` first — the gate this batch built (v947/949/950) and that v951/953 fed. It exits **0**: no axis is machine-determinably overdue (consume / calibrate / verify all `not-overdue`; codify `manual`). So #25 targets hand-picked operational debt rather than a gate-flagged axis.

The chosen debt was visible IN this batch: PROJECT.md's structured lines were hand-edited at v1.49.952 and v1.49.953, and the pre-tag-gate WARNed about PROJECT.md drift at v1.49.952. The two-layer-closure discipline (#10431) had named this exact class OPEN since v1.49.813: a detector (`--check`, pre-tag-gate step 17) existed, but no source eliminator — so the operator hand-edited every ship.

## What shipped

- **`project-md-normalizer.mjs --write --version vX --name "..." [--date YYYY-MM-DD]`** — a narrow, prose-preserving rewrite of ONLY the three STRUCTURED lines:
  - **rotates** the current "Latest shipped release" (version + name) into the "Predecessor" line,
  - **sets** the new "Latest shipped release" from the args (preserving the line's parenthetical prefix),
  - **refreshes** the "Last updated" date.
- **Idempotent** — re-running at the same version rotates nothing (the predecessor is never clobbered with the current version). The rotation is guarded by `oldVersion !== version`.
- **Post-condition self-check** (#10431) — after writing, the result must pass `--check`'s latest-shipped validation, else exit 2.
- **Touches no hand-authored prose.** The conservative-by-design stance the normalizer adopted at v1.49.785 (no `--write`, to avoid rewriting prose) is preserved: `--write` rewrites only the deterministically-derivable structured lines.
- **5 new `--write` tests** (rotation, prose+GAP-table preservation, idempotency, missing-arg exit 2, post-write `--check` passes) + the existing 12 `--check` tests. The idempotency guard is **mutation-proven**.
- **`docs/two-layer-closure-discipline.md`** — the PROJECT.md class is moved from "open; flagged at v813" to "closed at v1.49.954", with a parallel case study (the detector-first inversion of the STATE.md case).

## The new ship step

PROJECT.md is gitignored (local-only ground truth), so `--write` is a LOCAL post-ship step (run after `state-md-set-shipped.mjs`, replacing the manual hand-edit). This ship dogfoods it: v1.49.954's own PROJECT.md lines were set by `--write`, not by hand (meta-testing the new gate against its own milestone).

## Verification

- Full `tools/` suite 783/783 (vitest.tools.config.mjs), incl. 17 normalizer tests (12 `--check` + 5 `--write`).
- Mutation-proven: dropping the `oldVersion !== version` idempotency guard clobbers the predecessor on re-run and fails the idempotency test.
- `cadence --check` exits 0 (the scoping confirmation): nothing machine-overdue.

## Engine state

NASA 1.178 (unchanged), counter-cadence **24 -> 25** (this IS the counter-cadence ship), manifest **151** (unchanged — applies #10431 / #10168 / #10428; the PROJECT.md case is a new instance of the two-layer pattern, not a new lesson). No `cadence_advances` tag: a counter-cadence tooling cleanup advances none of the four measured axes.
