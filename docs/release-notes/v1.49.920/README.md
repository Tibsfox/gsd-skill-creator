# v1.49.920 — Cross-Platform CI: macOS vitest Lane (Decoupled)

**Shipped:** 2026-05-30
**Type:** Feature (CI / cross-platform; audit item T3.1 — first step)
**NASA degree:** 1.178 (unchanged — 136 consecutive ships)
**Predecessor:** v1.49.919

## What shipped

Continues the audit thread (`.planning/AUDIT-2026-05-26-core-functions-retrospective.md`):
the v919 retrospective named T3.1 cross-platform CI as the next ship, with "a single
macOS vitest job" as the high-value first step (public repo → free macOS runners). This
milestone stands up that lane.

### A decoupled macOS vitest workflow — not a matrix job

A three-scout map of the CI surface found that adding macOS to the existing `ci.yml`
as a `strategy.matrix` would silently make it **load-bearing for the ship gate**: the
pre-tag-gate ci-gate (`tools/pre-tag-gate.sh` step 4) reads the **run-level conclusion**
of the dev-tip CI run, which aggregates *every* job — so a flaky or merely slow macOS
job would block (or with `continue-on-error`, delay) every future ship. macOS runners
are ~10× billed and a constrained pool, so that latency is real.

The chosen design is a **separate `.github/workflows/ci-macos.yml`** with `schedule`
(nightly) + `workflow_dispatch` + `pull_request[main]` triggers and **no `push`** — so
it never enters the ci-gate's `--branch dev` headSha match and can never block or delay
a ship. The job mirrors the Linux `test` job's command sequence exactly (`npm ci` →
`npm run build` → Grove fixture-gen prelude → `npx vitest run` → tools-suite config →
node:test runner), with `permissions: contents:read`, a 60-minute timeout, and a
concurrency group.

### A parity + decoupling drift-guard (#10461 pairing)

`tests/integration/ci-macos-parity.test.ts` pins the lane so it cannot silently rot:

- **PARITY** — derives the required command set *from* `ci.yml`'s test job at test time;
  if Linux gains a test command but the macOS lane is forgotten, the guard fails.
- **DECOUPLING** — fails if anyone adds a `push:` trigger (which would re-couple macOS
  to the ship gate).

### Also surfaced

- The ci-gate's `gh run list --branch dev | .[0]` run-selection is **ambiguous if two
  workflows ever produce dev-tip runs at the same SHA** (the JSON omits the workflow
  name). Safe today (only `CI` push-triggers on dev); the no-`push` design avoids it.
- The real macOS risk is the wall-clock perf-assertion flake class
  (`tools/perf-assertion-audit.mjs` inventories the tight single-shot floors) plus the
  `zip` / native `better-sqlite3` rebuild — to be surfaced by the nightly and fixed
  forward, never blocking a ship.

## The honest caveat

A CI workflow cannot be proven green until it is on GitHub (the push *is* the deploy —
there is no local macOS runner). The TS surface scanned clean and this lane mirrors a
job that already passes on Linux, so confidence is high; the green proof is chased
post-push via `gh workflow run "CI (macOS)" --ref dev`, safely decoupled from the gate.

## Engine state

- NASA degree 1.178 (unchanged)
- Counter-cadence count: 18 (unchanged — audit-driven forward work, not a cleanup-mission)
- Manifest: 24 domains, 149 lessons (unchanged — lesson candidate noted, not yet codified)
- Architecture gaps: unchanged (5 of 7 closed-or-intentional; T3.1 is an audit Tier-3 item, not a GAP row)
- New drift-guard: `ci-macos-parity` 6/6 green; full tsc typecheck clean; zero new deps

## Chapters

- [00-summary](chapter/00-summary.md)
- [03-retrospective](chapter/03-retrospective.md)
- [04-lessons](chapter/04-lessons.md)
- [99-context](chapter/99-context.md)
