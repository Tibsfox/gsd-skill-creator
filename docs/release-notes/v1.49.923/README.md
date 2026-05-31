# v1.49.923 — Staged macOS Lane Promotion (Non-Blocking ci.yml Matrix)

**Shipped:** 2026-05-30
**Type:** CI infrastructure (forward — drains carry-forward #1 from the v1.49.922 retro)
**NASA degree:** 1.178 (unchanged — 138 consecutive ships)
**Predecessor:** v1.49.922

## What shipped

The v1.49.920 macOS lane was a SEPARATE, decoupled workflow (`ci-macos.yml`) — nightly +
dispatch + PR, no `push` trigger — so it could never block a ship but also gave no per-push
signal. v921 fixed its first six cross-platform bugs; v922 made it green end-to-end. This
milestone takes the documented next rung: fold `macos-latest` into `ci.yml`'s `test` job as a
`strategy.matrix` leg and retire the separate workflow — but in the **staged** form, so macOS
runs on every push for signal WITHOUT yet being able to block a ship.

### The staged mechanism

The `test` job is now a matrix over `[ubuntu-latest, macos-latest]`. The macOS leg carries
`continue-on-error: ${{ matrix.os == 'macos-latest' }}` with `fail-fast: false`. A
`continue-on-error` leg that fails shows a red X on that leg (visible signal) but its result
stays OUT of the workflow's **run-level conclusion** — which is exactly what the pre-tag-gate
ci-gate reads (`gh run list --workflow ci.yml --json conclusion`). So the still-unproven macOS
lane gives per-push cross-platform signal but cannot block a ship; the ubuntu leg stays
load-bearing.

### Empirically proven, not assumed

An adversarial review put a sourced BLOCKER on the design (claiming job-level
`continue-on-error` does not mask the run conclusion). It was refuted two ways: (1) the cited
"workflow still fails" case requires a `needs: [test]` downstream job consuming the deceptive
success — and `ci.yml`'s four jobs are all independent; (2) an isolated throwaway-branch probe
ran a matrix with a passing blocking leg + a failing continue-on-error leg: the failing leg
showed `failure`, the **run-level conclusion was `success`**. Ground truth, then ship.

### Drift-guard rewritten

`ci-macos-parity.test.ts` (two-file parity) is replaced by `ci-matrix-parity.test.ts`: the
matrix makes step-parity structural (both OSes are legs of one job definition), and the guard
now pins the load-bearing invariants — both OSes present, the macOS leg stays non-blocking
(exactly one `continue-on-error`, gated on macos-latest), `ci-macos.yml` is gone, full command
set mirrored. The job slice is bounded to the `test` job (not EOF). The "flip to load-bearing"
(deleting `continue-on-error` after N green pushes) MUST update this test, so it can't happen
silently.

## Verification

- New drift-guard green (**9 tests**; was 6 on the retired two-file guard).
- Isolated COE-semantics probe: a continue-on-error matrix-leg failure → run-level
  conclusion `success` (real GitHub Actions; throwaway branch, cleaned up).
- Real `ci.yml` matrix run on the shipped change: run `26699329004` = **success**, with both
  `Test (ubuntu-latest)` and `Test (macos-latest)` legs executing.

## Engine state

- NASA degree 1.178 (unchanged)
- Counter-cadence count: 18 (unchanged — forward CI work, not a cleanup mission)
- Manifest: 24 domains, 149 lessons (unchanged — one lesson candidate noted, not codified)
- macOS now runs on every push to main/dev as a non-blocking `ci.yml` matrix leg

## Chapters

- [00-summary](chapter/00-summary.md)
- [03-retrospective](chapter/03-retrospective.md)
- [04-lessons](chapter/04-lessons.md)
- [99-context](chapter/99-context.md)
