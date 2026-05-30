# v1.49.920 — Retrospective

## What went well

- **Mapping the CI surface before writing YAML found the coupling.** A naive reading of
  "add a macOS matrix job" would have appended `macos-latest` to `ci.yml`'s test job —
  the obvious move. The three-scout map surfaced that the ci-gate reads the **run-level
  conclusion** (which aggregates all jobs), so that obvious move would have made a flaky
  10×-billed runner load-bearing for every ship. The design changed *because* of the map,
  not after a painful first ship. Scope-first earned its keep on a one-file deliverable.

- **The decoupling is structural, not procedural.** Rather than "remember not to let
  macOS block ships," the no-`push` trigger makes it *impossible* for the lane to enter
  the ci-gate's dev-tip match. The safety is a property of the workflow's triggers, not
  of operator vigilance — gate-not-vigilance, applied to CI topology.

- **The drift-guard derives its expectation from the source.** `ci-macos-parity.test.ts`
  doesn't hard-code the list of test commands; it reads them out of `ci.yml`'s test job
  at test time and requires each to be mirrored. So a future Linux-side addition (the way
  v914 added the tools-suite run) automatically demands a macOS mirror — real drift-
  catching, not a snapshot that itself goes stale.

- **An honest "can't prove it yet" beat a false "proven."** The v919 lesson was "run the
  path, don't read it." Here the path *cannot* be run pre-push — a CI workflow's first
  real execution is on GitHub's infra. Saying that plainly (and wiring `workflow_dispatch`
  so the proof is one command away post-push) is more useful than stamping the lane
  "verified" off a local read.

## What was tricky

- **A CI workflow is unprovable until it's deployed.** The push *is* the deploy; there is
  no local macOS Actions runner. The most that can be verified pre-ship is structural:
  YAML validity, parity with a job that passes on Linux, and a clean cross-platform
  discipline scan. The green proof is necessarily post-push and fix-forward.

- **Run-level conclusion vs. per-job status.** The instinct is that `continue-on-error`
  makes a job "not count." It protects the *conclusion* but not the *latency*: the run
  stays `status: in_progress` until the slow job finishes, and the ci-gate blocks on
  `status != completed` just as hard as on a failure. The only way to fully decouple is
  to keep macOS out of the dev-push run entirely.

- **The ci-gate's run-selection is more fragile than it looks.** `gh run list --branch dev`
  returns runs across *all* workflows; `select(headSha==dev-tip) | .[0]` assumes exactly
  one workflow produces dev-tip runs. True today, but a latent footgun for any future
  second push-triggered workflow. Recorded as a forward note, not fixed here.

## Forward

- **Prove the lane green post-push** via `gh workflow run "CI (macOS)" --ref dev`, then
  watch the run. Real failures (perf-assertion floors, `zip` / native `better-sqlite3`
  rebuild) get fixed forward; the decoupled design means none of this blocks a ship.
- **Promotion path (a follow-on ship):** once N consecutive nightly runs are green-stable,
  fold `macos-latest` into `ci.yml`'s `test` job as a `strategy.matrix` and retire the
  separate file — making macOS load-bearing once it has earned it.
- **Rust-in-CI remains open and larger.** `src-tauri` has zero CI on any OS; `libc` is an
  unconditional Cargo dep and the arena uses Linux-only mmap constants (`MAP_HUGETLB`
  etc.) that would not compile on macOS. A separate milestone with its own scope.
- **Lesson candidate (not codified):** "A CI lane added to a single workflow inherits that
  workflow's run-level conclusion → it is load-bearing for any gate that reads that
  conclusion; decouple via a separate non-push workflow until the lane is proven green-
  stable." Sibling of failure-mode-contracts #10427 (load-bearing vs accessory) and the
  shelfware lightest-wire discipline (#10422). Deferred to the codify-axis cadence.
- **Carry-forwards from v919 still open:** a real `coprocessor:` skill consumer; the
  `algebrus.eigen` Python-side error.
