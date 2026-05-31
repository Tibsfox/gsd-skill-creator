# v1.49.922 — Context

## Milestone metadata

- **Version:** v1.49.922
- **Type:** Fix (cross-platform ship tooling — fix-forward from the v1.49.920/921 macOS lane)
- **Predecessor:** v1.49.921
- **NASA degree:** 1.178 (unchanged)
- **Counter-cadence count:** 18 (unchanged — fix-forward work, not a cleanup mission)
- **Source:** the v1.49.921 retro's forward-notes (BSD git-grep culprit + "layered cleanup")
  plus two latent ship-tooling gate bugs logged during the v920/921 session.

## Files changed

- `tools/perf-assertion-audit.mjs` — de-lazy the `relative-ratio` SHAPE_PATTERN
  (`[^)]+?`→`[^)]+`), write the trailing class as `[0-9.+ \-]` (no `\d` nested in `[...]`),
  extract + export a hardened `toPosixEre()` that strips lazy quantifiers. (commit `4411eb8eb`)
- `tools/__tests__/perf-assertion-audit-additive.test.mjs` — track the corrected source string;
  add POSIX-ERE portability regression guards over every SHAPE_PATTERN + `toPosixEre` unit
  tests. (commit `4411eb8eb`)
- `tools/pre-tag-gate.sh` — step 4 pinned to `--workflow ci.yml` (+ `SC_CI_GATE_WORKFLOW`
  override); step 17 grep gets `|| true`. (commits `19f746792` + `3adc58bf4`)
- `docs/release-notes/v1.49.922/**` — this milestone's release notes (5-file structure).

The three fixes landed as separate commits on dev (`3adc58bf4`, `4411eb8eb`, `19f746792`),
all pushed, before this `chore(release)` bump/notes commit.

## Test posture

- Full tools-suite green on Linux: **698 tests** (691 baseline + 7 new portability guards);
  perf-assertion-audit findings 75 → 90 (latent under-count closed, all true positives).
- Gate fixes proven by isolated repro: clean-child shell (step 17 no longer aborts on a
  non-drift WARN; real-drift escalation intact) + live before/after (ci-gate picks `CI`,
  not `CI (macOS)`, with both runs at the same dev-tip).
- Broad GNU-vs-BSD sweep of macOS-lane-reachable JS/TS (grep -P, sed -i, readlink -f,
  date -d, stat -c, cp --parents, stray git-grep forms) — no other hazards.

## Verification provenance

- macOS proof: the lane was re-dispatched on the fixed SHA `4411eb8eb` — run `26697886385`
  = **success**, all five substantive steps including `node …check-tools-test-coverage.mjs
  --run-node-test` (the node:test step) running on macOS for the first time, having been
  gated behind the previously-failing tools-suite step.
- ci-gate precondition: `ci.yml` green at dev-tip `19f746792` (run `26698267943`).

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + #10184 (single-step main FF) +
#10197 (STORY-gate post-bump-version). Canonical sequence at
`docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- bump-version run BEFORE the full pre-tag-gate so completeness `--current` resolves to v1.49.922.
- No `www/` change → no FTP sync, no chapter-gen needed.
- GH release publish remains batch-deferred (since v886).
- Operator retains the G3 (dev→main) gate.

## Engine state at close

- NASA degree 1.178 (137 consecutive ships)
- Counter-cadence count 18
- Manifest: 24 domains, 149 lessons (two lesson candidates noted in 04-lessons, not codified)
- KNOWN_UNWIRED Process/Egress/Loader: 0/0/0
- Architecture gaps: 5/7 closed-or-intentional (unchanged)
- macOS CI lane (v920): green **end-to-end** after this fix — vitest + tools-suite + node:test
- Open follow-ons: promote the macOS lane to the gated matrix once nightly-green-stable;
  Rust-in-CI; a real `coprocessor:` skill consumer
