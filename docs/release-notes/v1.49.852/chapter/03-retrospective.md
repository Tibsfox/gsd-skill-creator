# v1.49.852 — Retrospective

**Wall-clock:** ~8 min from v851 ship close to v852 ship close. Below v851's ~13 min — the stale-import variant skips the wire-write + test-write phases entirely.

## What went as expected

- **Dead-code removal is the lightest possible chip.** No wire to write, no tests to add, no behavior change to verify. The audit-test simply re-classifies the file from "in KNOWN_UNWIRED" to "no longer imports child_process so out of scope" — both classifications result in 0 audit complaints.
- **The second stale-entry chip confirms the v834 pattern.** Different shape (import-without-use vs wired-but-still-in-allowlist) but same root cause: the audit's runtime check is unidirectional. The 2nd instance crosses the codification threshold for refinements per #10426; documented in 04-lessons for the next codify ship.

## What I noticed

- **The chip-execution cadence is now ~10-13 min for wire chips, ~8 min for dead-code chips.** Across v849-v852 the per-chip cost is converging to a stable ~10-min floor (wire variant) and ~8-min floor (dead-code variant). The compression came from template reuse rather than from any particular optimization.
- **Stale-entry detection as inverse-audit tool is now codification-ready.** v834 was 1 instance; v852 is 2 instances; the pattern is `tools/security/check-stale-known-unwired.mjs` — inverse-audit tool that scans the KNOWN_UNWIRED list and flags entries that either (a) no longer import child_process OR (b) already call ensureProcessAllowed. The 2-instance threshold is met per #10426. NOT promoting in this ship (chip campaign is not codify scope), but explicit forward-flag for next codify ship.
- **The audit-test KNOWN_UNWIRED's runtime check IS protected** against the inverse stale-shape (line 242: `KNOWN_UNWIRED entries actually exist and import child_process`). But only against shape (a) — entry-no-longer-imports-child_process. Shape (b) — entry-wired-but-still-in-allowlist — has no runtime check. Inverse-audit tool would close both.

## What surprised me

- **The v834 commit (intelligence/analyzer/git.ts) is now classifiable as the FIRST stale-entry chip of the campaign-cluster series.** v852 retroactively makes that ship the start of a 2-instance pattern. The forward-observation at v806 ("audit is unidirectional") + the v834 first-instance + the v852 second-instance form a complete codification trail.

## Risk that didn't materialize

- **No audit-test regression.** Inline check at line 242 (entries actually import child_process) passes because the entry was REMOVED from the list simultaneously with the import removal.
- **No build break.** Unused-import removal is always safe.
- **No behavioral test regression.** Dead code; no callers to update.

## Carried forward (post-v852)

NEW this ship: 1 codification-ready observation.

- **Stale-entry detection inverse-audit tool** — 2 instances (v834 + v852). MEETS #10426 codification threshold. Inverse-audit tool would scan KNOWN_UNWIRED + flag (a) entries no longer importing child_process AND (b) entries already calling ensureProcessAllowed. PROMOTE in next codify ship (~v853-v860 cadence per #10428). Classification: refinement of #10421 (metric-emitting + baseline-file discipline) AND #10432 (KNOWN_UNWIRED ratchet-ledger discipline). The natural home is `docs/known-unwired-ledger-discipline.md` as a new section "## Inverse-audit: stale-entry detection."

Below-threshold observations from prior ships UNCHANGED.

## Eligible for next codify ship: 1 (the inverse-audit observation, now at 2 instances)
