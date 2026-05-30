# v1.49.920 — Summary

**Cross-platform CI: the macOS vitest lane.** The v919 retrospective named T3.1 (cross-platform CI) as the next audit item, with "a single macOS vitest matrix job" as the high-value first step. This milestone stands up that lane — but as a **deliberately decoupled** workflow, not a matrix job, after scoping the CI surface found that a naive matrix would silently couple macOS to the ship-blocking gate. No NASA degree advance (holds at 1.178); audit-driven forward work, so counter-cadence holds at 18.

## Scope-first: a three-scout map before a line of YAML

A read-only workflow mapped three surfaces against the live repo: the GitHub Actions inventory, the vitest run-topology, and the cross-platform discipline (what would *break*, not skip, on macOS). The map is what shaped the design:

- **CI today is one workflow** (`.github/workflows/ci.yml`, 4 jobs, all `ubuntu-latest`, node 22, no matrix/caching). The `test` job runs `npm ci` → `npm run build` → a Grove fixture-gen prelude → `npx vitest run` → the tools-suite config → the node:test runner.
- **The load-bearing finding:** the pre-tag-gate **ci-gate** (`tools/pre-tag-gate.sh` step 4) verifies "CI green on origin/dev" by matching the dev-tip `headSha` against `gh run list --branch dev` and reading the **run-level conclusion** — it never enumerates jobs. A GitHub run's roll-up conclusion aggregates *all* its jobs, so **any macOS job added to `ci.yml` is automatically load-bearing for every future ship**: a macOS failure turns the whole run red and blocks tagging, and even `continue-on-error: true` (which protects the *conclusion*) leaves the run `status != completed` until the slow macOS job finishes — which the gate *also* treats as a block. macOS runners are ~10× billed and a more constrained pool, so that latency is real.
- A latent fragility surfaced alongside it: the ci-gate's `gh run list --branch dev | .[0]` selection is **ambiguous if two workflows ever produce dev-tip runs at the same SHA** (the requested JSON omits the workflow name). Today only `CI` push-triggers on dev, so it's safe — but a second push-triggered workflow would break the assumption.

## The design: decoupled, not matrixed

The operator chose the conservative posture: a **separate `.github/workflows/ci-macos.yml`** triggered by `schedule` (nightly), `workflow_dispatch`, and `pull_request[main]` — **no `push` trigger**. Because it never produces a dev-tip push run, it never enters the ci-gate's `--branch dev` headSha match: it can **never block or delay a ship**, and it sidesteps the run-selection ambiguity entirely. The job mirrors the Linux `test` job's command sequence byte-for-byte (build + Grove fixture-gen prelude included — without them, dist-importing tests hard-fail and the grove-migration-live suite silently skips), plus `permissions: contents:read`, a 60-minute timeout, and a concurrency group.

## The drift-guard

Per #10461 (gate-enforce-every-runnable-surface + drift-guard pairing), the new lane ships with `tests/integration/ci-macos-parity.test.ts`, which pins two load-bearing invariants:

- **PARITY** — it *derives* the required command set from `ci.yml`'s `test` job at test time and asserts each command is mirrored on macOS. If a future ship adds a test invocation to the Linux job (as v914 did with the tools-suite) but forgets the macOS lane, macOS would silently test *less* than Linux — this guard fails until they're back in lockstep.
- **DECOUPLING** — it fails if anyone adds a `push:` trigger to `ci-macos.yml`, forcing the conversation before the lane re-couples to the ship gate.

## The honest caveat

A CI workflow **cannot be proven green until it is on GitHub** — the push *is* the deploy; there is no local macOS Actions runner. The cross-platform scout found the TS surface clean (6 win32-aware files all POSIX-correct; ~21 skip-guards none needing a darwin gate; shell scripts bash-3.2/BSD-clean; no `/tmp` disk-writes or `/proc`·`/sys` reads in TS), and this lane mirrors a job that already passes on Linux, so confidence is high — but the real proof is a macOS runner going green. The decoupled design makes that proof safe to chase post-push (`gh workflow run "CI (macOS)" --ref dev`) without ever risking a ship. The known macOS risk concentrates in the wall-clock perf-assertion flake class (the tight `<10ms`/`<50ms`/`<100ms` single-shot floors `tools/perf-assertion-audit.mjs` inventories) and the `zip`/native-`better-sqlite3` rebuild — to be surfaced by the nightly, fixed forward.

## Result

The macOS cross-platform CI lane exists, decoupled from the ship gate and pinned by a parity+decoupling drift-guard (6/6 green), with full tsc typecheck clean and zero new deps. Rust-in-CI remains out of scope (zero CI on any OS today; Linux-only `libc`/mmap constants would not compile on macOS). Promotion path — fold `macos-latest` into the `ci.yml` matrix once N nightly runs are green-stable — is recorded as a follow-on ship.
