# v1.49.949 — Retrospective

## What went right

- **The hardening matched the detector to the actual discipline.** The verify axis exists to check the #10453 verify-axis discipline: each calibratable threshold should have a dedicated substrate->calibration end-to-end integration test. The old heuristic searched every integration file for the threshold string — a proxy that happened to give the right answer on the live repo but for the wrong reason. Keying on the `*-end-to-end.integration.test.ts` convention makes the detector check the thing the discipline is actually about, so its verdict means what it says.

- **Behavior-preserving on the live repo, more robust off it.** The live verdict is unchanged (3 `suggestions.*` uncovered, 4 covered) — confirmed by reasoning and by running. The hardening shows up only where it matters: a future incidental mention of `suggestions.min_occurrences` in some unrelated integration test would no longer falsely mark it covered. The change tightens precision without moving the current answer, which is exactly what a hardening should do.

- **The pure-function extraction made the new logic unit-testable.** `verifyVerdict(wired, endToEndTests)` mirrors the `calibrateVerdict` pattern the v1.49.947 ship established: the coverage logic is a pure function over synthetic file entries, while `checkVerify` does the I/O. The verify axis went from zero tests to nine, including the load-bearing "incidental mention in a non-end-to-end file does NOT count" test (mutation-proven).

- **The dir-override mirrored an existing testability seam.** `checkCalibrate` already took a `suggestionsPath` override for tests; `checkVerify` now takes an `integrationDir` override threaded through the same `buildCadenceReport` options bag. Reusing the established seam kept the change small and consistent rather than inventing a new mocking approach.

## What went well in process

- **The naming-convention false-positive risk was checked before relying on it.** Restricting to a filename convention introduces a risk: a threshold that genuinely has end-to-end coverage in a file that does NOT match the convention would be wrongly flagged. Before committing to the regex, the real `tests/integration/` dir was audited — no end-to-end calibration test escapes `*-end-to-end.integration.test.ts`, and the 3 `suggestions.*` thresholds have no integration coverage at all. The restriction is safe on the current tree, and the residual risk (a future end-to-end test named off-convention) is documented.

## What to watch

- **The detector is convention-coupled.** If a future substrate->calibration end-to-end test is named without the `-end-to-end.integration.test.ts` suffix, the verify axis will not see it and will report a false coverage gap. The convention is the contract; new end-to-end tests must follow it (or the regex must be widened). This is the inherent trade-off of a filename-convention detector and is called out in the module docstring.

- **It is still a heuristic, deliberately.** The axis checks string-presence within dedicated files, not that the test actually imports and exercises both the substrate write-side and the calibrate read-side. A dedicated file that names the threshold in a comment but does not exercise it would still count. A true import/call-graph wire detector — which would let the verify axis drive `--check` as a real gate — remains future work, and the axis stays labelled advisory until then.

- **`suggestions.*` integration coverage is still the open operator decision.** The verify axis precisely confirms the 3 original `suggestions.*` thresholds lack a dedicated end-to-end test while the other 4 have one. Whether those 3 warrant dedicated `*-end-to-end` tests (matching the others) or are adequately covered by their unit + command tests is the operator call the axis exists to surface — unchanged by this ship, just stated more precisely.
