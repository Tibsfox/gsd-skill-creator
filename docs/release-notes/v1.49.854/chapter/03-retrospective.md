# v1.49.854 — Retrospective

**Wall-clock:** ~15 min from v853 ship close to v854 ship close. Includes integration-test authoring (~10 min) + ship sequence (~5 min).

## What went as expected

- **#10438 verify-axis discipline transferred cleanly.** Read the discipline doc; identified v843 substrate target; wrote integration test against real git; shipped. The named-substrate-target check (per #10438's anti-pattern "Verify ship without a named substrate target") was already satisfied by the operator-directed campaign scope.
- **Real-git temp-repo test pattern works.** `mkdtempSync` + `execFileSync('git', ['init', ...])` + `process.chdir(tempDir)` per-test + cleanup in afterEach. 4 cases pass on first run.
- **The DI-executor wire surfaces correctly at the integration boundary.** The restrictive-ctx test confirms `ensureProcessAllowed` fires BEFORE execSync (asserted by checking that the real git repo has NO mesh branch after the denied call).

## What I noticed

- **The integration test catches a wire behavior the unit tests can't.** Specifically: the audit record's `argv` field contains the actual tokenized git args (`['checkout', '-b', 'mesh/node1/task42', 'HEAD']`) — a property that requires the default executor's tokenization step to execute end-to-end. Unit tests would mock past this step.
- **Per-test process.chdir is acceptable for sequential test execution.** Vitest runs test files in parallel but tests within a file sequentially. The chdir-back in afterEach is the cleanup; if a future change runs tests within a file in parallel, this pattern would break. Documented in the test's beforeEach comment.
- **The verify-ship's release notes are smaller than the chip-ships'.** ~3 chapters vs the chip ships' 4 chapters' worth. Verify ships add proof, not substrate; the release-notes scope matches the proof's scope.

## What surprised me

- **The campaign's pattern variant coverage hit a new dimension.** Chip ships (v849-v853) covered wire-shape variants; verify ship (v854) is a different ship-shape entirely (axis: verify, not chip). The next two ships (v855 scorer + v856 auto-emit-verify) will each add new ship-shape coverage. v848 was the first novel-shape ship (help-coverage); 4 novel-shape ships across the 9-ship campaign — substantial discipline-coverage expansion.

## Risk that didn't materialize

- **No flake.** 4 tests pass deterministically; temp-dir cleanup works; no leftover branches.
- **No environment dependency.** `git config user.email/user.name` inside the test ensures the empty-commit step works without global git config.
- **No race condition.** Single-file sequential execution; per-test chdir is safe.

## Carried forward (post-v854)

NEW this ship: 1 below-threshold observation.

- **Real-git temp-repo integration-test pattern** — 1 instance from this ship. Pattern: `mkdtempSync` + git-init + chdir + per-test cleanup. Could be a shared test-helper module (`tests/integration/helpers/temp-git-repo.ts`) once a second integration test needs it. Wait for 2nd instance.

UNCHANGED from v853:
- DI-executor + tokenized-argv variant not exercised in chip campaign (v853, 1 instance) — REINFORCED in spirit by v854 because the verify ship targets exactly the DI-executor variant; classification clarifies that the chip campaign's non-coverage of #10441 is what this verify ship implicitly addresses.
- Stale-entry detection inverse-audit tool (v834 + v852, 2 instances) — codification-ready, target next codify ship.

## Eligible for next codify ship: 1 (stale-entry-inverse-audit, carried from v852)

## Campaign progress

**7 of 9 ships shipped.** Remaining:
- v855: Quality-drift scorer refinement (~30-45 min)
- v856: Auto-emit verification (potential blocker)
