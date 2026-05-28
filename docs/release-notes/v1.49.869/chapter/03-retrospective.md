# v1.49.869 — Retrospective

**Wall-clock:** ~12-15 min from v868 ship close to release-notes draft complete. Below the codify-ship range — this is a pure wiring ship (~3 LOC changes in pre-tag-gate.sh + a 3-case meta-test). No discipline-doc edits, no JSON updates, no CLAUDE.md regen.

## What went as expected

- **The v868 codify pre-validated the integration.** v868 explicitly named v869 as the integration ship and codified the continuous-verification mode discipline + the operator-invoked-to-automatic transition expectation. v869 executes the codification.
- **The cross-audit tool needed zero changes.** v857 shipped the tool; v867 hardened its regex parser; v868 codified the operational discipline. v869 just wraps the tool in a pre-tag-gate step. Single-purpose ships compose cleanly.
- **The meta-test pattern was directly applicable.** v671 + v638 + v636 meta-tests all verify a pre-tag-gate step's existence via regex match against the script. Pattern reused verbatim; 3 cases covering label/wiring/ordering.

## What surprised me

- **The pre-tag-gate.sh step-numbering culture.** Different step labels say "step 13/15", "step 14/15", "step 15/16", "step 16/16", "step 17/17" — each numbered against the step-count-at-the-time-of-introduction. Adding v869's step as "18/18" continues this pattern but creates a fresh inconsistency (the earlier steps still say their original ratios). Either accept the inconsistency (the labels are informational) or refactor all step labels to "X/18". I chose accept-the-inconsistency — refactoring all step labels is out-of-scope for v869 and would obscure the meaningful change (the new step + final summary count).

## What went wrong

- Nothing this ship. Single-file pre-tag-gate.sh edit + single-file meta-test + four version-bump files. ~30 min including release-notes drafting.

## Future-improvement candidates surfaced this ship

### Pre-tag-gate step-label refactor

The X/N step labels have drifted across milestones. Each step's N corresponds to the total step count at the milestone where that step was introduced. The labels are informational only — they don't affect gate logic. A future codify ship could either:
1. Refactor ALL step labels to "X/18" (current total) — clean but high-churn (~25 sed substitutions across the file).
2. Add a comment block at the top explaining the convention (low-churn; preserves git-blame history of when each step was added).

Below-threshold observation (1 instance). Carry as forward-observation.

### Sanity-check assertion strengthening in check-stale-known-unwired.test.ts

The v868 codify discipline says "Add at least one sanity-check assertion that compares the tool's structural-view count against the actual allowlist file's enumerated entries." The current test at line 51 (`expect(processReport.entryCount).toBeGreaterThan(0)`) is a weak sanity-check; a stricter version would assert the count matches an independent parse of the audit-test file.

Below-threshold (1 instance). Carry as forward-observation — a 2nd discipline-doc reference to this assertion pattern would promote it.

## Verdict on scope

This ship invests in the **codify axis** by operationalizing the v868 codification. It is the deterministic-gate half of the codify-then-gate two-ship pattern: v868 documented the discipline; v869 makes it enforceable.

Pre-tag-gate step count grows 17 → 18; manifest holds at 23 / 85 lessons; KNOWN_UNWIRED Process + Egress unchanged at 6 each. The next 12 chips (v870-881) will exercise the new gate as part of their pre-tag-gate runs — automatic continuous-verification instead of operator-invoked.

The codify-then-gate pattern emerges as a structural pair when a codified discipline names an existing tool: codify the discipline in one ship, wire the gate in the next. The pair is faster than the alternative (codify + gate in one ship) when the gate-wiring tests are non-trivial (3 meta-test cases here) — splitting them keeps each ship's surface lean.
