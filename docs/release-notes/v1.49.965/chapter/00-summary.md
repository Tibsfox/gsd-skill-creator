# v1.49.965 — Summary

## The ship

The first ship acting on the 2026-06-03 core-functions audit (item T1.3). The
adoption shelfware-telemetry baseline (`docs/ADOPTION-BASELINE-v*.json`) had
silently frozen at `v1.49.801` for ~163 ships because nothing made its refresh a
load-bearing step and nothing gated its freshness — an un-gated-runnable-surface
(#10461). This ship re-arms the alarm as a two-layer closure: a source eliminator
that regenerates the baseline every ship, and a detector gate that fires if it
ever drifts again.

## What shipped

- `tools/adoption-baseline-freshness.mjs` — forward-progress freshness check
  (default 30-ship tolerance via `SC_ADOPTION_BASELINE_MAX_DRIFT`); exits
  0 FRESH / 1 STALE / 2 FATAL; numeric version ordering; a baseline from a
  different release line is STALE, never falsely FRESH.
- `pre-tag-gate.sh` step 20 `adoption-freshness` — DETECTOR, WARN-only first
  (#10463), escalatable (`SC_PRE_TAG_GATE_REQUIRE`, exit 23), gateable
  (`SC_PRE_TAG_GATE_BYPASS`).
- `T14-SHIP-SEQUENCE.md` step 2.7 — SOURCE ELIMINATOR (`adoption-refresh` +
  `adoption-trends --write`, post-bump).
- Parity surfaces + `SC_ADOPTION_BASELINE_MAX_DRIFT` doc; `v1-49-965-meta-test`
  owns the "all 20 checks" count, `v1-49-961-meta-test` made count-agnostic.

## Verification

17 freshness-tool tests (incl. the stale negative fixture and the
different-release-line case); tools suite 832/832; build green; parity 7/7;
meta-tests green; WARN-only-non-blocking + exit-23 escalation proven under
`set -euo pipefail`. An adversarial Workflow self-review caught and fixed 3 real
BLOCKERs pre-commit (false-FRESH cross-line baseline, exit-22 collision, missing
T14 step).

## Engine state

- NASA degree 1.178 (frozen) · counter-cadence 29 (unchanged, normal forward
  `feat`) · manifest 151 (unchanged) · no cadence_advances.
