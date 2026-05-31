# v1.49.932 — Retrospective

## What went wrong (the reason this ship exists)

- **A red test was not treated as a blocker.** During the v1.49.931 build, the new
  integration test reported "2 failed | 5 passed". The correct response was to
  stop and fix before committing. Instead the ship proceeded — feature commit,
  tag, push to main — and CI caught what the local gate could not. The fix here is
  structural (gate the integration suite) rather than a promise to "be more
  careful", per the project's gate-not-vigilance principle.

- **The local gate's label lied.** Step 2's label said "vitest (full unit/integration
  suite — mirrors CI)", but the root `vitest.config.ts` excludes
  `tests/integration/**`. A surface that claims coverage it does not provide is
  worse than an honestly-scoped one — it invites exactly this false confidence.

## What went right (the recovery)

- **Diagnosis was fast and correct.** The CI failure was confirmed (`gh run list`
  → `ea55716a7 failure`), the root cause isolated (root config excludes
  integration; CI runs them separately), and the defect localized to the fixture
  (the 5 non-manifest cases passed, so the feature was sound).

- **Two-layer closure, not a band-aid.** The fixture fix unbreaks the test; the new
  pre-tag-gate step 2.7 makes the local gate run the same integration surface CI
  runs, so the next malformed integration test fails *before* a tag exists.

- **Verified under a degraded channel.** The session's harness intermittently
  duplicated/garbled multi-line tool output. Each load-bearing fact was confirmed
  with single-value probes that survive the corruption: `STEP27_OK_COUNT=1` (no
  duplicate insertion), `SYNTAX_EXIT=0` (valid bash), `7 passed` (fixture fixed),
  `68 passed | 4 skipped` (suite hermetic). The gate edit was kept only because
  these invariants confirmed it; an unverifiable gate edit would have been dropped.

## Follow-up surfaced

- **`integration` not yet in the bypass vocabulary.** The new step honours
  `SC_PRE_TAG_GATE_BYPASS=integration` (via `should_run`), but the vocabulary
  comment/log line wasn't updated (a multi-line edit deferred under the degraded
  channel). Low priority — bypassing this step is undesirable. Fold into a future
  gate-doc pass.

## What to watch

- **macOS is load-bearing (from v928).** This ship's whole purpose is to return
  `main` to green; confirm CI green on the pushed v932 commits before considering
  the recovery complete.
