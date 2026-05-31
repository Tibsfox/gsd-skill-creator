# v1.49.923 — Summary

**The macOS lane, promoted — carefully.** v1.49.920 stood up a decoupled macOS workflow that
could never block a ship; v921/v922 made it green end-to-end. The retro's carry-forward #1 was
to fold it into the ship-blocking `ci.yml` matrix. This milestone does that in the **staged**
form: `macos-latest` is now a matrix leg of `ci.yml`'s `test` job, push-triggered on every
main/dev commit, but `continue-on-error` keeps it OUT of the run-level conclusion the ship gate
reads — so it gives cross-platform signal without yet being able to block a ship. No NASA degree
advance (1.178); forward CI work, so counter-cadence holds at 18.

## The staged design

- **Matrix:** `test` runs on `${{ matrix.os }}` over `[ubuntu-latest, macos-latest]`,
  `fail-fast: false` so a macOS failure can't cancel the ubuntu leg.
- **Non-blocking:** `continue-on-error: ${{ matrix.os == 'macos-latest' }}`. A failing
  continue-on-error leg shows a red X for signal but the run-level conclusion stays `success`.
  The pre-tag-gate ci-gate reads that run-level conclusion, so macOS cannot block a ship.
- **Retirement:** the separate `ci-macos.yml` is deleted; its `pull_request` macOS coverage is
  preserved by the matrix (`ci.yml` runs on PRs into main).
- **The flip:** delete the `continue-on-error` line once N consecutive green macOS pushes
  accumulate — a deliberate act that must also update the drift-guard.

## Proven, not assumed

An adversarial review raised a sourced BLOCKER: that job-level `continue-on-error` does not
keep the run-level conclusion green. Refuted two ways — the cited failure case needs a
`needs: [test]` downstream consumer (this repo has none), and an isolated probe on real GitHub
Actions showed a failing continue-on-error matrix leg with run-level conclusion `success`. The
real `ci.yml` matrix run on the shipped SHA (`26699329004`) is green with both legs executing.

## Why staged, not full

The promotion path said "fold in once N nightlies are green-stable." Zero scheduled nightlies
had run (the lane was three days old); the only green data were two manual dispatches after two
reds. Making an unproven lane load-bearing then would let a macOS flake block ships at T14 —
exactly what the original decoupling avoided. The staged leg gets the per-push signal now and
defers the load-bearing flip until the track record exists.
