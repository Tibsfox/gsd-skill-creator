# v1.49.949 — Lessons

No new manifest lesson is promoted this ship (manifest stays **151**). This `feat` ship hardens an existing tool and records one carried-forward candidate.

## Applied (existing lessons)

- **#10453 — substrate->calibration end-to-end integration test pattern.** The verify axis now checks the actual #10453 artifact: the dedicated `*-end-to-end.integration.test.ts` files. The old heuristic used a proxy (threshold-string presence anywhere in `tests/integration/`); keying on the dedicated-test convention aligns the detector with the discipline it is meant to enforce.
- **#10427 — failure-mode contracts (honest verdicts).** The axis stays labelled a heuristic and reports `manual` when the integration dir is unreadable rather than guessing. The hardening narrows the false-positive surface but does not over-claim: the docstring states plainly that it is filename-convention + string-presence, not import/call-graph wire detection.
- **#10409 — recon precedes code.** The naming-convention false-positive risk (a real end-to-end test named off-convention being wrongly flagged) was checked against the live `tests/integration/` dir BEFORE relying on the regex — no end-to-end calibration test escapes it, and the 3 `suggestions.*` have no integration coverage at all.

## Carried-forward candidate (observed, not promoted)

- **Match a discipline-checking heuristic to the discipline's artifact, not a proxy.** When a tool exists to check a coding discipline (here: "each calibratable threshold has a dedicated substrate->calibration end-to-end test"), the precise detector keys on the discipline's actual artifact (the dedicated `*-end-to-end` file), not a looser proxy (any mention of the threshold string anywhere). The proxy can give the right answer for the wrong reason and is fragile to incidental matches. **One instance.** Promote if a second discipline-checking tool replaces a proxy detector with an artifact-keyed one (sibling of #10450 static-analysis-tool-must-handle-code-shapes-or-fail-loudly).

## Process note

- **A pure-function extraction is the cheapest path to testing an I/O-bound heuristic.** `verifyVerdict(wired, endToEndTests)` separates the coverage logic (pure, synthetic-testable) from the dir I/O (`checkVerify`), mirroring `calibrateVerdict`. Paired with an `integrationDir` override threaded through `buildCadenceReport` (reusing the calibrate axis's `suggestionsPath` seam), it took the verify axis from zero tests to nine — including a temp-dir test that is mutation-proven against the exact regression the hardening prevents.
- **A focused single-agent adversarial review is proportionate for a low-blast-radius heuristic change.** Unlike the v1.49.948 concurrency fix (a 4-lens Workflow), this advisory-heuristic change warranted one focused review agent — which confirmed correctness, the conservative failure paths, the intentional exclusion of non-end-to-end integration files, and that no threshold string is a substring of another (so `.includes` cannot cross-match). Scale the review to the blast radius.
