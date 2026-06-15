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
P.   Adversarial ship review (PRE-PUSH; v1.49.968 Ship 1.1 — REQUIRED as of v1.49.1029)
       - After the code commit(s) and BEFORE `git push origin dev`, run the multi-agent
         adversarial review on the diff; fix every CONFIRMED REAL finding IN CODE
         (never explain it away in prose), then proceed to push → CI → pre-tag-gate.
       - `Workflow({ scriptPath: 'tools/ship-review/adversarial-ship-review.mjs',
         args: { base: '<first-code-commit>^', intent: '<one paragraph: what the ship does>' } })`
       - Reviewers are READ-ONLY (Explore agentType); do NOT use worktree isolation
         (fresh worktree lacks node_modules → probes fail). After the run, `git status`
         the tree and `git checkout`/restore any leak before trusting it; re-Read a file
         before Edit if a probe touched it (file-read-state invalidation).
       - SCALE to blast radius: a trivial, deterministically-checked, mechanical edit MAY
         use direct multi-angle verification instead of the full five-lens panel — note
         the scale-down in the retrospective (use `--mode scaled --notes "<why>"`).
       - After the review, write the attestation: `node tools/ship-review/write-attestation.mjs
         --mode full --base <first-code-commit>^ --confirmed N` (for NASA content-review
         ships use `--mode content`; for deliberate scale-downs `--mode scaled --notes "<why>"`).
       - Pre-tag-gate step 22 enforces the attestation is present and fresh for THIS ship
         (exit 26 if missing/stale; bypass token ship-review-attestation for emergencies).
       - Promoted from ADVISORY (staged #10463) to REQUIRED at v1.49.1029: K=30 clean ships,
         evidence = 55 reviewed release dirs all-time (20 within v968+; the v986–v1026 NASA
         band ran content reviews recorded in untracked mission artifacts, so the
         committed-notes proxy under-counts) + caught-defect ledger (v965: 3 BLOCKERs;
         v966: 1 MAJOR; v982; 11/35 F4; v1027: 1 BLOCKER + 1 MAJOR; v1028: 1 MAJOR).
       - Canonical: docs/adversarial-ship-review.md. Caught real defects pre-push in
         v965 (3 BLOCKERs), v966 (1 MAJOR), v982, 11/35 F4, v1027 (1 BLOCKER + 1 MAJOR),
         and v1028 (1 MAJOR).

0.   Release-notes scaffold + fill (BEFORE step 1's completeness gate; v1.49.958)
       - `node tools/release-history/scaffold-release-notes.mjs --version v<X>
         --name "<Subtitle>" [--type "<type(scope)>"]` emits the canonical 5-file
         structure (README + chapter/{00,03,04,99}) with a scaffold-pending
         marker per section. Re-running creates only missing files and resets
         untouched (pristine) scaffolds; any file with hand-authored edits
         (filled OR partially filled) is preserved, so a re-run never clobbers
         work-in-progress. `--check` reports structure drift without writing.
       - FILL every marked section with real content. All scaffold-pending
         markers MUST be removed before shipping: step 1's completeness gate
         (`check-completeness.mjs --strict`) BLOCKs any file still carrying one.
         Source eliminator + FILL gate = the two-layer closure for the
         release-notes scaffolding drift class (#10431/#10436).
       - Do NOT reproduce the scaffold-pending marker literal in published prose
         (#10462 self-referential trap) — describe it, never quote it.

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

2.7. adoption-baseline refresh (v1.49.965 Ship 0.1, audit T1.3 — LOAD-BEARING)
       - `node tools/adoption-refresh.mjs`  (writes docs/ADOPTION-BASELINE-v<X>.{md,json}
         + renders dashboard/adoption.html)
       - `node tools/adoption-trends.mjs --write`  (refreshes docs/ADOPTION-TRENDS.md)
       - MUST run AFTER step 2 (bump-version): the baseline filename embeds
         package.json.version, and adoption-refresh's overwrite-guard (#10424)
         refuses to clobber a predecessor baseline. Running it pre-bump would
         write the PREDECESSOR's filename.
       - This is the SOURCE-ELIMINATOR half of the two-layer closure (#10431/#10436)
         for the baseline-freeze drift class: the baseline silently froze at
         v1.49.801 for ~163 ships because nothing made this step mandatory. The
         DETECTOR half is pre-tag-gate step 20 (adoption-freshness, WARN-only).
       - Ordering note: pre-tag-gate (step 1) runs PRE bump-version, so its
         adoption-freshness check reads the PREDECESSOR baseline. In steady state
         that baseline was written by the PRIOR ship's step 2.7 and matches the
         pre-bump version (drift 0 → FRESH). The first ship after a freeze WARNs
         once (the alarm), then this step re-arms it; from the next ship on it is
         FRESH. Skipping this step for >SC_ADOPTION_BASELINE_MAX_DRIFT (default 30)
         ships re-trips the WARN.
       - Included in the step-3 chore(release) commit.

3.   chore(release): commit
       - `git commit -m "chore(release): v<X> <subtitle>"`
       - includes the bump-version manifest changes + the public STORY.md
         append from step 2.5 + any citation-debt.json updates from step 2.6
         + the adoption baseline/trends/dashboard from step 2.7.

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

## Appendix — NASA per-ship T14 variant (resume-era, v988–v1026)

The autonomous NASA degree ships run a streamlined ~14-Bash-call T14 whose
ordering obeys every invariant above (INV-1 included). Until v1.49.1031 this
sequence lived only in untracked per-run handoffs (a pointer chain through
gitignored files — the documented single point of failure); this appendix is
its committed home. Build/review machinery feeding into it:
`tools/workflows/decompose-build.mjs` and
`tools/workflows/content-adversarial-review.mjs`
([workflows-library.md](workflows-library.md));
per-mission discipline at
[nasa-mission-authoring-discipline.md](nasa-mission-authoring-discipline.md) §0.

**Leading-edge nav (build-time, no longer a manual T14 step):** the new degree
ships with the leading-edge nav (right cell **Series hub**, never a dead
"Next mission → successor"), and `decompose-build`'s `retro-forest` task promotes
the predecessor's nav (Series hub → Next mission → this degree) via
`tools/nasa-nav-promote-predecessor.mjs`. If a build predates this wiring, run
that script by hand before pre-tag-gate (it is idempotent; `--check` reports
whether a promotion is still pending). This retired the old "index.html nav-next
×2" manual fix that lived only in per-run handoffs.

```
N0.  Revert refresh side-effects if present:
       git checkout -- docs/release-notes/INDEX.md docs/release-notes/STORY.md docs/RELEASE-HISTORY.md
N1.  Machine load < ~7.5 (cat /proc/loadavg) -> bash tools/pre-tag-gate.sh -> all checks PASS
       (step-12 STORY-drift WARN pre-bump is the INV-1 designed steady state).
     Step P equivalent for NASA content ships: the adversarial CONTENT review ran post-build;
       write the attestation with --mode content.
N2.  docs(release): git add docs/release-notes/v<X>/ && git commit   (single Bash call —
       the git-add-blocker trips a standalone `git commit`)
N3.  Bump chain: node scripts/bump-version.mjs <X>
       -> node tools/adoption-refresh.mjs
       -> node tools/adoption-trends.mjs --write
       -> node scripts/append-story-entry.mjs        (AFTER bump — INV-1)
N4.  chore(release): git add the 9 manifest/baseline files && git commit
N5.  git tag v<X> <chore-release-sha>
N6.  git push origin dev && git push origin v<X>
N7.  git push origin dev:main && git branch -f main dev   (single-step FF, Lesson #10184)
N8.  bash tools/gh-release-publish.sh <X>
N9.  FTP publish: pre-flight port 21 (nc -zvw5 <host> 21)
       -> bash scripts/sync-research-to-live.sh --nasa-only
       -> curl 200 spot-checks on the new degree pages + shader
N10. Post-tag: node tools/release-history/run-with-pg.mjs refresh --fast --quiet
N11. chore(post-ship): git add docs/RELEASE-HISTORY.md && git commit
       (revert any INDEX/STORY refresh side-effects first if they appear)
N12. git push origin dev && git push origin dev:main && git branch -f main dev
N13. State reset: node tools/state-md-set-shipped.mjs --version v<X> --name "<...>"
       --degree <D> --predecessor v<P> --predecessor-sha "<sha>"   (quote shas — \d+e\d+
       short-shas corrupt to .inf unquoted)
       -> node tools/state-md-clean-backups.mjs --write
N14. MANDATORY: node tools/project-md-normalizer.mjs --write --version v<X>
       --name "<...>" --date <date>   (PROJECT.md is gitignored and drifts +1/ship;
       gate step 19 BLOCKs at >3)
```

Standing notes: `bump-version.mjs` / `append-story-entry.mjs` /
`sync-research-to-live.sh` live under `scripts/`, the rest under `tools/`;
`www/` and the pairings data are gitignored (FTP-deployed) — only
`docs/release-notes/v<X>/` + the chore(release) manifest files +
`docs/RELEASE-HISTORY.md` are git-tracked NASA deliverables; always pair
`git add <paths> && git commit` in one call.

---

## Change log

| Date | Change | Driver |
|---|---|---|
| 2026-05-11 | Initial canonical doc. T14 sequence documented with STORY-gate as step 2.5 (post bump-version, pre git-tag). | v1.49.638 C2 (Lesson #10197 closure) |
| 2026-06-03 | Added step 2.7 adoption-baseline refresh (post bump-version, pre chore-commit): `adoption-refresh.mjs` + `adoption-trends.mjs --write`. SOURCE-ELIMINATOR half of the two-layer closure (#10431/#10436) for the baseline-freeze drift class; DETECTOR is pre-tag-gate step 20 (adoption-freshness, WARN-only). | v1.49.965 Ship 0.1 (audit T1.3) |
| 2026-06-04 | Added pre-flight step P — adversarial ship review on the diff before `git push origin dev` (ADVISORY, staged #10463). Reusable workflow `tools/ship-review/adversarial-ship-review.mjs`; canonical doc `docs/adversarial-ship-review.md`; drift-guard `tests/integration/adversarial-ship-review-discipline.test.ts`. | v1.49.968 Ship 1.1 (audit T1.4) |
| 2026-06-10 | Step P promoted from ADVISORY to REQUIRED. Pre-tag-gate step 22 (ship-review-attestation, exit 26) enforces that `write-attestation.mjs` was run after the review (K=30; 55 reviewed release dirs all-time, 20 within v968+ — the NASA band's content reviews live in untracked mission artifacts; caught-defect ledger: v965 3 BLOCKERs, v966, v982, 11/35 F4, v1027 1 BLOCKER + 1 MAJOR, v1028 1 MAJOR). Gate count 21→22. | v1.49.1029 (audit §10 ship 3) |
| 2026-06-10 | Added the NASA per-ship T14 appendix (the resume-era ~14-call variant, previously only in untracked handoffs) + cross-refs to the committed `tools/workflows/` skeletons. | v1.49.1031 (audit §10 ship 5) |
| 2026-06-15 | Leading-edge nav folded into the build: `decompose-build` emits the Series-hub right cell for the newest degree and `retro-forest` promotes the predecessor via `tools/nasa-nav-promote-predecessor.mjs` (idempotent, `--check`-able). Retired the manual "index.html nav-next ×2" + forest-href + H1/breadcrumb post-build fixes (v1.221 GRACE). Drift-guards: `tests/integration/workflows-library-discipline.test.ts` + `tests/integration/nasa-nav-promote-predecessor.test.ts`. | v1.49.1038 follow-up (nav-rule tooling hardening) |

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
