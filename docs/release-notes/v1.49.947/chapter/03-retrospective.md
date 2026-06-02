# v1.49.947 — Retrospective

## What went right

- **The tool was built to defeat the EXACT errors that motivated it, and validated against them.** The v1.49.944 session's two mis-reads were both trigger-READING errors (calibrate's dropped `>=20` conjunct; consume's catch-all false positive). The CLI's two machine-readable axes target precisely those: calibrate reads the actual observation count (the live repo shows `max 12 < 20`, the verdict the session mis-read), and consume enumerates the REAL union members so the defensive catch-alls cannot produce a false positive. Running the tool reproduces the session's TRUE state — the strongest possible validation for a discipline-as-code ship: it gets right exactly what was got wrong by hand.

- **Honest scoping over false precision.** Not every axis is machine-readable. Rather than fake a definitive verdict for all four, the tool reports `manual` for codify (no structured ESTABLISHED-candidate backlog exists) and labels verify as a heuristic (`tests/integration/` string-presence). The doc's forward-shadow had optimistically implied all four would be cleanly checkable; building it surfaced that only calibrate and consume are. The tool says so plainly.

- **The second conjunct was not faked.** Every trigger is "`first conjunct` AND `>=N ships since last X`". The ships-since half is genuinely not machine-tracked. Rather than invent a fragile per-axis last-ship heuristic, the tool reports `candidate` when a first conjunct is met and explicitly hands the ships-since conjunct back to the operator. A gate that claimed "overdue" on half the evidence would be worse than the prose check.

- **The drift guard is compile-time, not just a test.** `ALL_CALIBRATABLE_THRESHOLDS` is a new runtime array mirroring a compile-time-only union. The pairing is exactly the #10461 drift class. Rather than rely on a runtime test alone (which can go stale), a `satisfies` clause rejects a non-member typo and a `_AllThresholdsCovered` conditional-type assertion fails to compile if a union member is added without being appended to the array — both directions pinned at build time, mutation-proven (dropping a member yields TS2322).

- **The verify heuristic earned its keep on first run.** It flagged the 3 `suggestions.*` thresholds as lacking a `tests/integration/` reference. Ground-truth check confirmed a real asymmetry: the 4 later thresholds (predictive, token_budget.max, observation.retention, token_budget.warn) have dedicated `*-end-to-end` integration tests; the 3 original `suggestions.*` thresholds do not. A heuristic that surfaces a real coverage asymmetry on its first run is worth keeping (labelled as advisory).

## What went well in process

- **Recon read the prose triggers against the source before encoding them.** The consume axis is the cautionary tale: a naive `grep wired:false` over `observation-sources.ts` returns the catch-all branches and produces the v944 false positive. The tool iterates `ALL_CALIBRATABLE_THRESHOLDS` (the real members) and calls `observationSourceFor` per member — encoding the *intent* of the trigger, not its surface string. Getting that right is the whole point of the ship.

- **A pure verdict function made the conjunct testable.** `calibrateVerdict(perThreshold)` is extracted as a pure function so the `>=20` conjunct — the exact thing the session mis-read — is tested with synthetic data (all-at-12 -> not-overdue; exactly-20 -> candidate; 19 -> not-overdue), independent of any on-disk event files. The integration path reads `process.cwd()` paths, which are not isolatable in a unit test; the pure helper is.

## What to watch

- **The ships-since conjunct remains the prose check's domain.** If a future ship adds per-axis last-ship tracking (e.g. axis tags in release-notes frontmatter, machine-read), the tool could upgrade `candidate` to a definitive `overdue`. Until then, a `candidate` verdict is a prompt for operator confirmation, not a gate that blocks anything.

- **The verify heuristic is string-presence, not semantic.** It will false-positive a threshold whose integration test references it indirectly, and false-negative one whose test happens to contain the string for an unrelated reason. It is advisory; do not wire it into a blocking gate without hardening it to actual substrate-to-caller wire detection.

- **`suggestions.*` integration coverage is the verify axis's first real finding.** Whether the 3 original thresholds need dedicated `*-end-to-end` integration tests (matching the other 4) or are adequately covered by their unit + command tests is an operator call — exactly the kind of thing the tool exists to surface for decision.
