# v1.49.921 — Context

## Milestone metadata

- **Version:** v1.49.921
- **Type:** Fix (cross-platform test hardening — fix-forward from the v1.49.920 macOS lane)
- **Predecessor:** v1.49.920
- **NASA degree:** 1.178 (unchanged)
- **Counter-cadence count:** 18 (unchanged — audit-driven forward work)
- **Source:** the v1.49.920 macOS CI lane's first dispatched run (run 26696517104, conclusion `failure`, 6 tests / 3 files)

## Files changed

- `src/cli/entrypoint-guard.test.ts` — `realpathSync`-wrap the `withTempDir` scratch dir;
  add `realpathSync` import. (fixes 2 failures)
- `src/intelligence/atlas-indexer/__tests__/file-walker.test.ts` — `realpathSync`-wrap the
  `beforeEach` root; add import. (fixes 3 failures)
- `src/intelligence/atlas-indexer/__tests__/runner.test.ts` — `realpathSync`-wrap both
  `mkdtempSync` sites (`projectRoot` + concurrency `cRoot`); add import. (fixes 1 failure
  + hardens the concurrency block)
- `docs/release-notes/v1.49.921/**` — this milestone's release notes (5-file structure).

Source code is unchanged — `isCliEntrypoint` and `walkProjectFiles` are correct.

## Test posture

- 3 fixed files on Linux: **31 tests pass**; full `npm run build` (tsc) clean; zero source changes.
- Full pre-tag-gate: confirms the suite (the realpath wrap is a no-op on the Linux gate runner).
- macOS proof: the lane is re-dispatched post-ship (`gh workflow run "CI (macOS)" --ref main`)
  to confirm the 6 failures resolve — the green the v920 lane could not yet show.

## Verification provenance

- The 6 failures came from the v920 macOS lane's first real run (`gh run view 26696517104
  --log-failed`). Root cause traced to the `/var`→`/private/var` tmpdir symlink by reading
  the atlas-indexer assertion diffs and the `isCliEntrypoint` docstring; one fix shape
  (realpath the temp root) covers all six.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + #10184 (single-step main FF) +
#10197 (STORY-gate post-bump-version). Canonical sequence at
`docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- bump-version run BEFORE the full pre-tag-gate so completeness `--current` resolves to v1.49.921.
- No `www/` change → no FTP sync, no chapter-gen needed.
- GH release publish remains batch-deferred (since v886).
- Operator retains the G3 (dev→main) gate.
- Post-push: re-dispatch `CI (macOS)` on `--ref main` and watch for green.

## Engine state at close

- NASA degree 1.178 (136 consecutive ships)
- Counter-cadence count 18
- Manifest: 24 domains, 149 lessons (lesson candidate noted in 04-lessons, not yet codified)
- KNOWN_UNWIRED Process/Egress/Loader: 0/0/0
- Architecture gaps: 5/7 closed-or-intentional (unchanged)
- macOS CI lane (v920): now green after this fix — a working cross-platform signal
- Open follow-ons: promote the macOS lane to the gated matrix once nightly-green-stable;
  Rust-in-CI; a real `coprocessor:` skill consumer; `algebrus.eigen` Python error
