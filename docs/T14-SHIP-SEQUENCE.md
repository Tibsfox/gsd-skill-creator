# T14 Ship Sequence (Operator-Driven)

**Status:** Canonical reference for the dev→main release ship sequence.
**Authority:** Operator-only authorization (G3 gate).
**Pipeline:** This document defines the ordering of operator-executed steps at T14.

---

## Why this document exists

The T14 ship sequence is **operator-driven** — there is no `scripts/ship.sh`
or `Makefile` ship target that orchestrates the full pipeline. Each
milestone's `docs/release-notes/v<X>/chapter/99-context.md` documents the
ship sequence locally, but pipeline-position constraints (e.g. "X must run
AFTER Y") are load-bearing across milestones and need a stable reference
that does not get rewritten per ship.

This document is that stable reference. Per-milestone `99-context.md`
files MAY restate the sequence with milestone-specific details, but they
MUST NOT contradict the ordering invariants documented here.

---

## Pipeline-position invariants (load-bearing)

### INV-1 — STORY-gate runs POST bump-version

`scripts/append-story-entry.mjs` reads `package.json.version` to determine
which tag's STORY.md entry to append. It MUST run **after** `bump-version.mjs`
has updated `package.json` to the current milestone's version. If it runs
**before** bump-version, the script reads the predecessor's version, finds
the predecessor's entry already present in public STORY.md, reports
"already present" → no-op, and the current milestone's entry never lands
in public STORY.md.

**Root cause of v1.49.637 silent no-op:** the STORY-gate was wired as
`tools/pre-tag-gate.sh` step 10/10, which runs PRE bump-version. The
script read stale `package.json.version = v1.49.636`, found the v1.49.636
entry already present, reported no-op, and the v1.49.637 public STORY.md
entry was silently skipped. Lesson #10197 closes this forward via this
canonical doc + invariant test at
`tests/integration/c2-story-gate-ordering.test.ts`.

**Mitigation:** `scripts/append-story-entry.mjs` is idempotent on re-run.
Operator can re-run after bump-version to recover from an out-of-order
sequence; the second run will correctly read the current
`package.json.version` and append the missing entry.

---

## T14 ship sequence (canonical ordering)

The numbered steps below are the operator-executed sequence. Step numbers
are stable references; insertion of new steps SHOULD use decimal sub-steps
(e.g. `2.5`) to preserve numbering continuity for downstream docs.

```
1.   Pre-tag-gate composite (tools/pre-tag-gate.sh)
       - build, vitest, completeness, depth-audit, CLAUDE.md drift,
         catalog-index drift, tauri-boundary, apply-to-self,
         (optionally other gates per milestone)
       - NOTE: STORY-gate MUST NOT run here (Lesson #10197).

2.   bump-version <X> (node scripts/bump-version.mjs --from-npm)
       - updates package.json, package-lock.json, tauri.conf.json,
         Cargo.toml, Cargo.lock to <X>.
       - At this point package.json.version reflects the current tag.

2.5. STORY-gate run (node scripts/append-story-entry.mjs)
       - reads package.json.version (now CURRENT tag).
       - appends the current tag's entry from ground-truth
         .planning/roadmap/STORY.md to public docs/release-notes/STORY.md.
       - idempotent on re-run.
       - MUST run AFTER step 2 (bump-version) and BEFORE step 4 (git tag).
       - Closes Lesson #10197.

2.6. citation-debt auto-update (v1.49.653, L-03)
       - `node tools/citation-debt/scan-retrospectives.mjs --since v<X> --write-diff`
       - If the scan emits proposed actions, review the diff at
         `.planning/citation-debt-proposed-diff.json` and apply:
         `node tools/citation-debt/apply-diff.mjs --auto-confirm`
         (or without --auto-confirm to confirm interactively per action).
       - Skip if the scan reports "0 valid action(s)" — nothing to apply.
       - The pre-tag-gate step 11 (citation-debt-sync) is WARN-only and runs
         BEFORE bump-version; this T14 step 2.6 runs AFTER bump-version with
         the current tag visible, so the `mission_origin` field on emitted
         V-flags is correct.
       - Idempotent: re-runs are safe (apply-diff reads current ledger +
         deduplicates).
       - See: docs/citation-debt-syntax.md for the formal block syntax.
       - Closes CONCERNS §9.3 part 2 (L-03).

3.   chore(release): commit
       - `git commit -m "chore(release): v<X> <subtitle>"`
       - includes the bump-version manifest changes + the public STORY.md
         append from step 2.5 + any citation-debt.json updates from step 2.6.

4.   git tag v<X>

5.   git push origin v<X>

6.   git push origin dev

7.   dev → main fast-forward (single-step)
       - `git update-ref refs/heads/main HEAD`
       - per Lesson #10184, NOT `git checkout main && git merge dev`.

8.   git push origin main

9.   RH refresh
       - `tools/release-history/run-with-pg.mjs refresh --fast --quiet`

10.  GH release publish
       - `npm run gh-release-publish <X>`

11.  STATE.md normalize (with prose validator)

11.5. STATE.md shipped-state reset (v1.49.813 — closes v805→v806 drift class)
       - `node tools/state-md-set-shipped.mjs --version v<X> --name "<Subtitle>" --degree <NASA-degree> --predecessor v<PRED> --predecessor-sha <SHA>`
       - Atomic writer: emits a fully-normalized STATE.md from the milestone metadata
         and runs the normalizer post-write to confirm canonical form.
       - REPLACES the prior hand-edit + manual normalize flow that was the v805→v806
         drift source (closed informationally by v807 step-0.5 post-write check;
         deterministically by this step).
       - Idempotent: re-running with the same args produces identical output.
       - Exit 0 = STATE.md written + normalize-check confirms canonical form.

12.  HANDOFF doc finalization
```

---

## Invariant test

`tests/integration/c2-story-gate-ordering.test.ts` asserts that this
canonical doc lists `append-story-entry` AFTER `bump-version` in the
ordered sequence. The test uses a tight regex pattern
(`node\s+.*append-story-entry\.mjs`) to avoid matching incidental prose
references to the script name. Skip-guarded against absent doc-file
(Lesson #10180 pattern).

If a future edit reverses this ordering, the test fails — surfacing the
pipeline-position regression before it ships.

---

## Per-milestone authoring guidance

Each milestone's `docs/release-notes/v<X>/chapter/99-context.md` SHOULD
include a brief T14 sequence section. To stay in sync with this canonical
doc, link out to it rather than restating the full sequence:

```markdown
## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step
main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical
sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- <any deviations or extras for this milestone>
```

---

## Change log

| Date | Change | Driver |
|---|---|---|
| 2026-05-11 | Initial canonical doc. T14 sequence documented with STORY-gate as step 2.5 (post bump-version, pre git-tag). | v1.49.638 C2 (Lesson #10197 closure) |

## Lesson coverage (codified v1.49.654 C08+C09)

Appended for discipline-coverage audit completeness. Each lesson is
documented in its first-emit retrospective at
`docs/release-notes/<version>/chapter/04-lessons.md`.

- **Lesson #10202** — gh CLI background-task git-discovery quirk;
  recovery via explicit `-R <owner>/<repo>` flag
- **Lesson #10220** — apply-to-self at obs#2 reaffirm; ship-discipline
  applied recursively to milestones that introduce ship-discipline
  changes
- **Lesson #10221** — dev/main 0-commit drift via ship-sync;
  ESTABLISHED at v596 third-instance; v598 maintains zero-drift through
  W4 ship pipeline
- **Lesson #10222** — `--cross-link-strict` flag added to
  `tools/pre-tag-gate.sh` step 6 invocation (commit `2912121a7`, v1.49.595
  W0.2); enforces FAIL mode for NASA index.html cross-link coverage <50%
