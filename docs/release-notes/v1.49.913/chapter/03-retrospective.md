# Retrospective — v1.49.913

## Carryover lessons applied

- **#10415 (deferred-maintenance — close red tests promptly)**: the operative principle this ship embodies. A silently-red test suite is the alarm; it was closed within the ship that discovered it rather than ledgered for later.
- **#10431 / #10436 (two-layer closure)**: applied directly — a source/enforcement layer (the gate step) AND a detector layer (the drift-guard). Either alone is incomplete: a gate step without a drift-guard re-rots the moment a new test file is added but not registered; a drift-guard with nothing running the suite catches list drift but never catches test rot.
- **#10450 (static-analysis tools must handle common code shapes OR fail loudly)**: directly relevant to the drift-guard's runner classifier, and the source of both adversarial findings it had to survive.
- **#10417 (spawnSync test harness) / #10421 (no silent caps) / #10427 (fail loudly when load-bearing)**: the drift-guard tool + test were built to all three.

## What went unusually well

- **Parallel root-cause workflow.** Fanning out one read-only investigator per failure cluster (scorer / catalog / FTP) returned precise, per-test verdicts fast, and the scorer agent corrected the working hypothesis outright: the scorer had not regressed at all — the *corpus* had drifted. That correction changed the entire fix strategy (freeze fixtures, not revert docs) and was worth far more than the dispatch cost.
- **Adversarial review earned its spend.** The four-agent review confirmed the gate-shell, scorer, and catalog/FTP surfaces clean, and caught two genuine drift-guard fragilities (multi-line `import {\n …\n} from 'vitest'` misclassified as unknown → false-positive; a `node:test` file wrongly added to the include list passing `ok:true`) plus the degree-regex over-match the classify hoist newly exposed. None were ship-blockers in practice, but all three are now closed with paired tests. This is the recommended pattern for gate-critical shell + tooling changes.
- **Freeze-not-revert was the right call on the scorer.** The agent's first-choice recommendation — restore the shrunken corpus — would have reverted real documentation improvements to satisfy a test. Recognizing the actual defect (tests coupled to a living corpus) and decoupling via frozen fixtures fixed the fragility at its root without touching published docs or the scorer.
- **The green-up bounded cleanly.** Each rotted test traced to a single never-enforced-rot root cause, and the drift-guard guarantees no recurrence. The population of at-risk files was finite (the 5 drifted-out files), so the scope did not spiral.

## What went less well

- **The suite was more rotted than the handoff implied.** The handoff framed this as a small "wire it in, watch the blast radius" ship. In reality 8 files were red across 3+ subsystems, and 3 of those failures only surfaced after the 5 drifted-out files were added to the include list. The scope expanded from "wire" to "wire + green-up 8 files + drift-guard," surfaced to the operator and re-confirmed before proceeding.
- **Mutation-testing agents ran in the live working tree.** The adversarial drift-guard reviewer injected a `return 'vitest'; // MUTATION` into `check-tools-test-coverage.mjs` to confirm the tests catch it — correct technique, wrong isolation. It ran in the shared working tree (and the harness briefly reported the mutation as an "intentional" edit). The agent reverted it, and a post-review working-tree audit confirmed no leftover artifacts, but a verify-only fan-out that mutates source files should run with `isolation: 'worktree'`. Process note for next time.
- **Exit-code collision caught late.** The new gate step initially reused exit code 20, which is already taken by step 18 (the legend was incomplete and did not list it). Caught by grepping all `exit N` before shipping; reassigned to 21. A reminder that the exit-code legend is not authoritative — the code is.

## Threads closed / opened / extended

**CLOSED:** the tools-test suite ran nowhere enforced — closed by the `tools-suite` gate step (Layer 1) + the drift-guard (Layer 2). 8 silently-red test files greened.
**OPENED:** the tools-suite is gate-enforced but NOT CI-enforced — `npx vitest run` (CI) still does not cover it. Folding the tools config into CI would close this but widens CI's blast radius (network/ftp tool tests); deferred as a forward candidate.
**CARRY-FORWARD:** candidate lesson #10461 (a test suite that runs nowhere enforced silently rots; gate-enforce + drift-guard) recorded at 1 instance, below the 3-instance promotion bar. The 2 `node:test` files under `tools/` (`citation-debt/list`, `phases-plans-extraction`) still have no `node --test` runner in any gate — a smaller sibling gap, reported by the drift-guard but not yet enforced.

## Thread state

Engine state: UNCHANGED. NASA degree 1.178 (131 consecutive ships). Counter-cadence 14. No codification; no chokepoint chip; no threshold/substrate work. Pre-tag-gate 18 → 19 steps.
