---
title: "v1.49.958 — release-notes 5-file scaffolding source eliminator (counter-cadence #27)"
version: v1.49.958
date: 2026-06-02
summary: >
  Counter-cadence #27: build the missing SOURCE ELIMINATOR for the release-notes
  5-file scaffolding drift class, completing its two-layer closure (#10431 /
  #10436) and promoting that discipline to ESTABLISHED (third case study, after
  STATE.md v813 and PROJECT.md v954). Before this ship an operator hand-created
  docs/release-notes/<version>/ (README + four chapters) before each tag and
  could forget a file; the completeness gate (check-completeness.mjs,
  pre-tag-gate step 3) was the DETECTOR but there was no source eliminator. The
  new tools/release-history/scaffold-release-notes.mjs emits the canonical
  5-file structure deterministically (--check / --write / --force, prose-
  preserving, with a non-strict presence post-condition), so the directory is
  never hand-created. Each scaffolded section carries a scaffold-pending HTML-
  comment marker, and check-completeness --strict now BLOCKS any release-notes
  file still carrying it -- the ship-time FILL gate paired with the structure
  eliminator, closing the placeholder-could-ship hazard. The marker token is
  kept out of all published prose (#10462 self-referential leak-scan trap). The
  tool was dogfooded on this ship's own notes (scaffold v1.49.958 -> fill). 13
  scaffolder tests + the include-list drift-guard; the existing release-notes
  pipeline (chapter.mjs / publish.mjs preservation) is unchanged.
tags: [feat, release-notes, tooling, counter-cadence, two-layer-closure, lesson-10431, lesson-10436, lesson-10462]
---

# v1.49.958 — release-notes 5-file scaffolding source eliminator (counter-cadence #27)

**Shipped:** 2026-06-02

One-line: a deterministic source eliminator now scaffolds the canonical release-notes 5-file structure, and `check-completeness --strict` now BLOCKS an unfilled scaffold -- completing the two-layer closure for the release-notes scaffolding drift class and promoting the discipline (#10431 / #10436) to ESTABLISHED.

## Why this ship

`skill-creator cadence --check` exits 0 (no axis machine-overdue), so this counter-cadence was scoped from a ledger: `docs/two-layer-closure-discipline.md` listed "Release-notes file scaffolding (any drift between v<X> dir and expected 5-file set; currently caught by completeness check but no source eliminator)" as the open detector-without-eliminator entry. The two-layer-closure discipline says a procedure-rooted (or file-overwrite) drift class needs BOTH a detector AND a source eliminator; the release-notes class had only the detector. This ship builds the missing layer and, as the third such closure, promotes the discipline to ESTABLISHED.

## What shipped

- **Source eliminator** -- `tools/release-history/scaffold-release-notes.mjs`. Given `--version` and `--name` (and optional `--type` / `--date`), it emits `docs/release-notes/<version>/README.md` + `chapter/{00-summary,03-retrospective,04-lessons,99-context}.md` with canonical frontmatter / headers and a scaffold-pending marker per section. `--check` reports structure drift (exit 1 if any file is missing); `--write` (default) creates missing files and resets PRISTINE (untouched) scaffolds, while PRESERVING any file with hand-authored edits -- whether fully filled (no marker) OR partially filled (real prose plus a leftover marker, preserved with a loud warning). Forgetting one of a file's several markers never clobbers the rest. `--force` overwrites everything (resets edited files to a blank scaffold). The post-condition is a non-strict completeness check (presence of the 5 files) -- deliberately not `--strict`, because the freshly written scaffold still carries the fill markers by design.
- **Ship-time FILL gate** -- `check-completeness.mjs --strict` now BLOCKS any release-notes file that still carries the scaffold-pending marker COMMENT, in addition to its existing missing-file and under-200-byte BLOCKs. This is the destination half of the closure: the structure eliminator can emit a placeholder, but a placeholder can never reach a tag. The gate matches the full HTML-comment marker (not the bare token), so published prose may NAME the token while an actual unfilled scaffold (which always carries the comment) is still caught. The marker is the single source of truth shared between the two tools (imported, not duplicated -- #10461).
- **`SC_RELEASE_NOTES_ROOT` seam** -- both tools honor this env var to relocate the release-notes root (default `docs/release-notes`), a test-isolation / alternate-tree seam in the `RH_ENV_FILE` lineage.
- **Unchanged.** The DB-derived release-notes pipeline (`chapter.mjs` write-idempotent preservation, `publish.mjs` destination preservation -- the v585/v836 #10436 layers) is untouched; this ship adds a pre-chore structure eliminator upstream of it.

## Two-layer closure (now ESTABLISHED)

| Layer | Mechanism | Ship |
|---|---|---|
| Detector | `check-completeness.mjs` (missing-file + size BLOCKs; pre-tag-gate step 3) + the new scaffold-pending BLOCK | pre-existing + v1.49.958 |
| Source eliminator | `scaffold-release-notes.mjs` (deterministic 5-file structure, prose-preserving) | v1.49.958 |

This is the third two-layer closure (STATE.md: detector v807 / eliminator v813; PROJECT.md: detector v785 / eliminator v954; release-notes: detector pre-existing / eliminator v958), so `#10431` graduates from "1 case study, applied" to ESTABLISHED.

## The #10462 guard

Documenting a loud gate must not feed it the literal it guards. The scaffold-pending marker token therefore appears in NONE of this ship's published release-notes prose -- it is described, never reproduced. The literal lives only in the tool source and its test fixtures (which `check-completeness` does not scan), so this ship's own `--strict` gate stays green.

## Verification

- `scaffold-release-notes.test.mjs` **16/16** (builder: 5 canonical files, sized, marker-bearing; CLI: --check drift, --write + post-condition, strict BLOCK on unfilled scaffold, non-strict pass, fill-then-pass, filled-preserve + pristine-unchanged, PARTIAL-fill preserve, --force resets partial, #10462 prose-names-token-passes, --force, malformed-version reject) -- all CLI cases isolated via `SC_RELEASE_NOTES_ROOT`. Full tools suite 799 green.
- The vitest.tools.config include-list **drift-guard** (`tools-config-coverage`) passes with the new test registered.
- **Dogfooded:** this ship's own `docs/release-notes/v1.49.958/` was scaffolded by the tool, then filled; `check-completeness --strict` blocked the unfilled scaffold (5 BLOCKs, exit 1) and passes now that the markers are gone.
- **3-lens adversarial review** (gate-regression/false-positive | preservation/clobber | closure-completeness/#10462; 7 agents, 0 blockers). The load-bearing gate lens found NO false-positive/self-trip/regression. The preservation lens found a MAJOR clobber -- the original whole-file `isFilled` check rewrote a PARTIALLY-filled file on a re-run, destroying hand-authored sections -- plus a minor self-trip surface. BOTH were fixed in code (preserve any edited file by comparing against the pristine scaffold; match the full marker comment so prose may name the token), not documented away.
- pre-tag-gate all checks PASS (the new `--strict` marker gate runs at step 3 and is green for this filled ship).

## Engine state

NASA 1.178 (unchanged), counter-cadence **27** (this IS the counter-cadence cleanup), manifest **151** (unchanged in count -- promotes no new lesson number; promotes the EXISTING #10431 / #10436 two-layer-closure discipline to ESTABLISHED via its third case study). No `cadence_advances` tag: this is a counter-cadence drift-closure, not a calibrate/consume/verify coverage advance.
