---
title: "Context"
chapter: 99-context
version: v1.49.958
date: 2026-06-02
summary: "Where v1.49.958 sits in the larger arc."
tags: [context, release-notes, tooling, counter-cadence, two-layer-closure]
---

# v1.49.958 — Context

## Milestone metadata

- **Version:** v1.49.958
- **Type:** `feat(release-notes)` — release-notes 5-file scaffolding source eliminator (counter-cadence #27)
- **Predecessor:** v1.49.957 (return-value dataflow for the cadence verify wire detector)
- **NASA degree:** 1.178 (unchanged — degree-non-advancing)
- **Counter-cadence count:** **27** (this ship IS the counter-cadence)

## Where this sits

- Second of a two-ship session after v1.49.956: v1.49.957 was the normal forward `feat` (return-value dataflow), and this is counter-cadence #27. The prior counter-cadence was #26 (v1.49.955, the AST/call-graph verify detector); #25 (v1.49.954) built the PROJECT.md source eliminator — the immediately-preceding two-layer closure this ship's discipline extends.
- The two-layer-closure lineage: STATE.md (#27's grandparent pattern; detector v807 / eliminator v813), PROJECT.md (detector v785 / eliminator v954), release-notes (detector pre-existing / eliminator v958 — this). Three closures graduate the discipline to ESTABLISHED.

## How the scope was chosen

`skill-creator cadence --check` exits 0 (nothing machine-overdue), so the scope came from a ledger: the open items in `docs/two-layer-closure-discipline.md`, which listed the release-notes 5-file scaffolding class as the detector-without-eliminator entry. Counter-cadence ships are the natural venue for source-eliminator construction (per the discipline's own cross-reference to counter-cadence-discipline.md).

## Files changed

- `tools/release-history/scaffold-release-notes.mjs` — NEW source eliminator. CLI (`--version` / `--name` / `--type` / `--date` / `--check` / `--force`), exported `buildReleaseNotesFiles` + `REQUIRED_FILES` + `SCAFFOLD_PENDING_TOKEN` + `SCAFFOLD_PENDING_MARKER`, state-based preservation (missing/pristine/partial/filled — preserves any edited file, the review clobber fix), non-strict presence post-condition, `SC_RELEASE_NOTES_ROOT` seam.
- `tools/release-history/check-completeness.mjs` — under `--strict`, BLOCK any release-notes file still carrying the scaffold-pending marker COMMENT (imports `SCAFFOLD_PENDING_MARKER` from the scaffolder; matches the full comment, not the bare token, so prose may name the token — #10462); reads each file once for the size + marker checks; honors `SC_RELEASE_NOTES_ROOT`.
- `tools/release-history/__tests__/scaffold-release-notes.test.mjs` — NEW (16 tests, incl. partial-fill preserve + #10462 prose-names-token).
- `vitest.tools.config.mjs` — registers the new test (drift-guard enforced).
- `docs/two-layer-closure-discipline.md` — third case study + ESTABLISHED promotion.
- `docs/T14-SHIP-SEQUENCE.md` — documents the optional scaffolder step before chapter authoring.

## Two-layer closure ledger

| Drift class | Detector | Source eliminator |
|---|---|---|
| STATE.md post-T14 reset | pre-tag-gate step 0.5 (v807) | `state-md-set-shipped.mjs` (v813) |
| PROJECT.md latest-shipped | `project-md-normalizer.mjs --check` (v785) | `project-md-normalizer.mjs --write` (v954) |
| release-notes 5-file scaffolding | `check-completeness.mjs` (pre-existing) + scaffold-pending BLOCK (v958) | `scaffold-release-notes.mjs` (v958) |

## Structure vs fill (the two surfaces)

- `scaffold-release-notes.mjs --check` verifies STRUCTURE (all 5 files present); it is silent about fill-state.
- `check-completeness.mjs --strict` verifies STRUCTURE + size + FILL (no scaffold-pending marker); this is the ship-time gate at pre-tag-gate step 3.

Keeping the two concerns on two surfaces is what lets the eliminator's post-condition be non-strict (it just confirms the files landed) while the ship gate still refuses an unfilled scaffold.

## Test posture

- `scaffold-release-notes.test.mjs` **16/16**; `tools-config-coverage` drift-guard green; full tools suite 799 green.
- 3-lens adversarial review (7 agents, 0 blockers): a MAJOR partial-fill clobber + a minor self-trip were found and fixed in code (state-based preservation; full-comment gate match), with regression tests.
- Dogfooded end-to-end on `docs/release-notes/v1.49.958/`: `--strict` returned 5 BLOCKs + exit 1 on the unfilled scaffold, then passed after filling.
- pre-tag-gate all checks PASS.

## Engine state at close

- NASA degree 1.178 (unchanged).
- Counter-cadence count **27** (this IS the counter-cadence cleanup).
- Manifest: **151 lessons** (count unchanged — promotes no new lesson number; promotes the existing #10431 / #10436 two-layer-closure discipline to ESTABLISHED via its third case study; applies #10461 + #10462).

## References

- The eliminator: `tools/release-history/scaffold-release-notes.mjs`.
- The detector + FILL gate: `tools/release-history/check-completeness.mjs`.
- The discipline: `docs/two-layer-closure-discipline.md` (#10431 / #10436).
- The #10462 self-referential trap: `.claude/skills/security-hygiene/SKILL.md` (leak-scanner authoring rule).
