# v1.49.954 — Retrospective

## What went right

- **The counter-cadence scope was chosen by the gate the batch built.** Counter-cadence scoping has historically been operator-discretion prose. This batch built `cadence --check` (v947/949/950) precisely to make that scoping machine-readable. So #25 ran it FIRST — it exits 0, no axis overdue — confirming the pick had to be hand-selected debt rather than a gate-flagged axis. The tool the batch built scoped the batch's own final ship: the meta-cadence loop closed on itself.

- **The debt was self-evident — the batch generated its own evidence.** The PROJECT.md hand-edit was not a hypothetical: it was hand-edited at v1.49.952 and v1.49.953, and the pre-tag-gate WARNed about it at v1.49.952. The counter-cadence pattern (#10168) says convert an offending RULE into a GATE; here the rule ("hand-edit PROJECT.md each ship") had a detector but no eliminator. The friction surfaced naturally during the batch, then was closed by the batch.

- **The discipline doc had already named the work.** `docs/two-layer-closure-discipline.md` listed "PROJECT.md 'Latest shipped release' hand-edit (open; flagged at v813)" as an explicit open follow-up. This ship is the close of a doc-named TODO, not an invented one — the two-layer-closure ledger (#10431) tracked the open source-eliminator gap across 141 ships until a counter-cadence had budget for it.

- **The source eliminator respected the prior conservative stance.** The normalizer adopted "no `--write`, to avoid rewriting hand-authored prose" at v1.49.785. Rather than overturn that, `--write` implements the SAFE subset: it rewrites ONLY the three deterministically-derivable structured lines (latest-shipped / predecessor / last-updated) and leaves every prose line, the GAP table, and section headings byte-identical (pinned by a test). The stance held; the automation fit inside it.

- **Idempotency was the load-bearing correctness property, and it is mutation-proven.** The rotation (current latest-shipped -> predecessor) is destructive if re-run: a second `--write` at the same version would rotate the current version into the predecessor, clobbering the real predecessor. The `oldVersion !== version` guard prevents it; the idempotency test fails the instant that guard is mutated away.

## What went well in process

- **Dogfooding closed the loop.** v1.49.954's own PROJECT.md lines were set by `--write`, not by hand — meta-testing the new gate against its own milestone (the #10203 "meta-test newly-installed gates against the milestone's own release" instinct, applied to a source eliminator). The first real use of the tool was the ship that introduced it.

## What to watch

- **`--write` reads no committed state, so it is a LOCAL step.** PROJECT.md is gitignored; `--write` rewrites it from CLI args (version + name) and the file's own current latest-shipped line (for the rotation). It does not read package.json or STATE.md, so it is order-independent within the post-ship sequence — but it MUST be run locally each ship (it is not, and cannot be, enforced in CI, since CI has no local PROJECT.md). The detector (`--check`, pre-tag-gate step 17) remains the bypass catch.

- **The date defaults to today.** Omitting `--date` stamps Last-updated with the wall-clock date — correct for a real ship. Tests pass an explicit `--date` for determinism; the post-condition self-check is date-agnostic (it validates only the version line).
