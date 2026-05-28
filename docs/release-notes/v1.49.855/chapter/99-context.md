# v1.49.855 — Context

## Provenance

Eighth ship of the operator-directed v848-v856 nine-ship campaign. Closes the v841 forward-flag for task-shaped ships firing false `recent_all_F` alerts.

The v841 retrospective explicitly predicted this ship's shape ("a future ship can add `task` to classify-types.mjs with the same pattern v841 established"). v855 applies that prediction: regex anchor + KNOWN_TYPES + F-by-design exclusion + dist init + console-summary + test coverage.

## What this ship adds

```
tools/release-history/classify-types.mjs                  [MODIFIED: +task type, +taskMarkers regex, +dist field, +summary line update]
tools/release-history/quality-drift-check.mjs             [MODIFIED: +task in KNOWN_TYPES, +rationale comments]
tools/release-history/__tests__/classify-types-chip.test.mjs   [MODIFIED: existing T-prefix assertion updated to not.toBe('chip'); +5 task-classification tests]
docs/release-notes/v1.49.855/                             [NEW: README + 4 chapters]
```

## Recon trail

1. **Read v841 retrospective** — explicit forward-flag for `task` sub-type with named regex pattern + named files.
2. **Read `tools/release-history/classify-types.mjs`** — confirmed chip-type infrastructure is the template; priority order is degree → milestone → patch → chip → feature.
3. **Read `tools/release-history/quality-drift-check.mjs`** — confirmed KNOWN_TYPES list + authoredTypes F-by-design exclusion.
4. **Grep release titles** for T-prefix + S-prefix patterns: confirmed v1.49.797 (T1.1 Ship 3), v1.49.799 (T1.1 Ship 5), v1.49.801 (T1.1 Ship 7), v1.49.808 (S2), v1.49.831 (T1.3) as task-shaped releases.
5. **Design taskMarkers regex** — `/^[TS]\d+(\.\d+)?\s/` (anchored to title start to avoid degree-body false-positives like "Degree 171: ... S36").
6. **Apply changes:**
   - `classify-types.mjs`: header comment + priority order comment + regex insertion (after chip, before feature default) + dist init + summary line.
   - `quality-drift-check.mjs`: KNOWN_TYPES + authoredTypes comment.
   - Existing test: update T-prefix assertions from `toBe('feature')` to `not.toBe('chip')` (semantically equivalent for the chip-negative-assertion but allows task migration).
7. **Add new tests** — 5 cases in `v1.49.855: task classification` describe block.
8. **Direct verification** via node script — 8/8 PASS.
9. **Build + pre-tag-gate.**
10. **Author release notes.**

## T14 ship sequence

Per `docs/T14-SHIP-SEQUENCE.md`.

## Why now

The `recent_all_F` warning has been firing intermittently since v841 (per the v841 retrospective). The accumulated 14 ships' worth of task-shaped work in the v797-v831 window made the warning chronic. Closing the v841 forward-flag was the named follow-up — taking it in the v848-v856 campaign batches the operational-debt close with other campaign work.

## Re-classification side-effect

Existing releases previously classified as `feature` may be re-classified as `task` on next `classify-types.mjs` run:
- v1.49.797 (T1.1 Ship 3), v1.49.799 (T1.1 Ship 5), v1.49.801 (T1.1 Ship 7) — T1.1 Ship series
- v1.49.831 (T1.3 Option C)
- v1.49.808 (S2 Adoption Telemetry)

This shifts per-type baseline averages on next `--update-baseline` run. The drift-check report should stop reporting `recent_all_F` on T/S-prefix windows.

## Discipline-extension vs new-domain choice

**EXTENSION of zero existing disciplines** (no discipline doc changes this ship). v855 closes a v841 forward-flag with a regex + KNOWN_TYPES update; no new discipline introduced.

## Test impact

Direct classify() verification: 8/8 PASS via node script. Vitest test file is outside the include glob (inherited from v841 codification); future ship could widen the glob to bring these tests under CI scope.

## Cross-references

- v1.49.841 — forward-flag origin (per-type baselines + explicit `task` prediction)
- v1.49.842 — first ship after v841 to log `recent_all_F` firing chronically
- `tools/release-history/quality-drift-check.mjs` — runtime enforcement
- `tools/release-history/classify-types.mjs` — classification logic
- `.claude/agents/quality-drift-watcher.md` — agent definition that triggers the check
