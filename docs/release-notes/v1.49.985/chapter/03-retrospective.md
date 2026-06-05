# v1.49.985 — Retrospective

## What went right

- **Reused a proven pattern instead of inventing one.** Windows was added exactly the way macOS (v1.49.923) and cargo (v1.49.936) were — a staged, non-blocking matrix leg gated by a deterministic flip-readiness reporter. Parallel recon mapped the full mechanism (the staged→flip arc, the #10461 drift-guard pairing, the readiness-tool model) before any file was touched, so the change-set was crisp and the lockstep was known up front.
- **The drift-guard pairing worked as designed.** Adding the staged leg deliberately broke the "ZERO continue-on-error" assertion in `ci-matrix-parity.test.ts` — exactly the "force the conversation" behavior the #10461 guard exists for. Updating it to the STAGED-WINDOWS invariant (exactly one windows-gated `continue-on-error`) in the same commit kept the gate honest.
- **The readiness tool is a faithful analog.** `windows-flip-readiness.mjs` mirrors `macos-flip-readiness.mjs` one-for-one (windows is a test-matrix leg exactly like macOS, so the organic-churn model — not the cargo lane-stability model — applies). A review confirmed zero leftover macos-specific logic in code and that the jq leg-match uniquely selects `Test (windows-latest)`.

## What went well in process

- **Recon → author → verify → review → ship**, with the heavy reads (the 20KB readiness tool, the repo-specific T14 runbook, the full lockstep change-set) fanned out to parallel agents so authoring stayed precise and context-lean.
- **Adversarial review scaled to blast radius and confirmed the one load-bearing claim** — that a job-level `continue-on-error` gated on a matrix expression makes *only* the windows leg non-blocking — against authoritative GitHub Actions sources, not assumption.

## What to watch

- **Windows is expected RED and will stay red until driven green.** The staged leg is non-blocking by design, but the readiness streak cannot advance while the leg fails on organic commits. Fixing the suite's Unix assumptions (path separators, `/tmp`, fs perms, EOL) is the iterative follow-on; only then does the flip to load-bearing become available.
- **Cost:** the windows leg runs on every push to `main`/`dev` and, because the run does not conclude until the (slow, uncached) windows leg finishes, it lengthens every CI run's wall-clock. Windows runner minutes are billed 2× on private repos.
- **The flip is a future deliberate act** that must delete the gated line *and* update `ci-matrix-parity.test.ts` again — `windows-flip-readiness.mjs` is the gate that says when it's earned.
