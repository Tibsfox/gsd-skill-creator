# v1.49.958 — Summary

## The ship

Counter-cadence #27. Build the missing SOURCE ELIMINATOR for the release-notes 5-file scaffolding drift class. The completeness gate (`check-completeness.mjs`, pre-tag-gate step 3) already DETECTED a malformed or incomplete `docs/release-notes/<version>/` directory, but an operator still hand-created the five files before each tag and could forget one. The two-layer-closure discipline (#10431 / #10436) requires both a detector AND a source eliminator; this ship adds the missing eliminator, and as the third such closure it promotes the discipline to ESTABLISHED.

## What shipped

- **Source eliminator** -- `tools/release-history/scaffold-release-notes.mjs` emits the canonical 5-file structure (README + four chapters) deterministically from `--version` + `--name`. `--check` reports structure drift; `--write` creates missing files and resets pristine scaffolds while PRESERVING any file with hand-authored edits -- fully filled OR partially filled (the review-found clobber fix); `--force` resets all. Post-condition: a non-strict presence check of the 5 files.
- **Ship-time FILL gate** -- `check-completeness.mjs --strict` now BLOCKS any release-notes file still carrying the scaffold-pending marker COMMENT, so a placeholder structure can never reach a tag. The gate matches the full comment (not the bare token), so prose may name the token; the marker is imported from the scaffolder (one source of truth, #10461) and kept out of all published prose (#10462).
- **`SC_RELEASE_NOTES_ROOT`** env seam relocates the release-notes root for both tools (test isolation; `RH_ENV_FILE` lineage).

## The invariant

The DB-derived release-notes pipeline (`chapter.mjs` write-idempotent preservation; `publish.mjs` destination preservation -- the v585/v836 #10436 layers) is unchanged. This ship adds a pre-chore structure eliminator upstream of it; it does not alter how chapters are generated or published.

## Verification

- `scaffold-release-notes.test.mjs` **16/16** (builder + CLI write/check/preserve/partial-preserve/force/strict-block/#10462-prose, isolated via `SC_RELEASE_NOTES_ROOT`); include-list drift-guard green; full tools suite 799 green.
- **3-lens adversarial review** (7 agents, 0 blockers): the load-bearing gate lens found no regression/false-positive; the preservation lens found a MAJOR partial-fill clobber + a minor self-trip, both fixed in code (preserve edited files vs the pristine scaffold; match the full marker comment).
- **Dogfooded** on this ship's own notes: scaffolded `v1.49.958/`, confirmed `--strict` BLOCKED the unfilled scaffold (5 BLOCKs, exit 1), then filled. pre-tag-gate all checks PASS.

## Engine state

NASA 1.178 (unchanged), counter-cadence **27** (this IS the cleanup), manifest **151** (count unchanged; promotes the existing #10431 / #10436 discipline to ESTABLISHED via a third case study). No `cadence_advances` tag.
