---
title: "v1.49.965 — adoption-baseline freshness gate + tool"
version: v1.49.965
date: 2026-06-03
summary: >
  Re-arms the adoption shelfware-telemetry alarm that silently froze at baseline
  v1.49.801 for ~163 ships. A new freshness detector (pre-tag-gate step 20,
  WARN-only) plus a mandatory T14 refresh step form a two-layer closure so the
  baseline can never drift silently again.
tags: [tools, gate, adoption, two-layer-closure]
---

# v1.49.965 — adoption-baseline freshness gate + tool

**Shipped:** 2026-06-03

First ship acting on the 2026-06-03 core-functions audit (item T1.3): the adoption
shelfware-telemetry baseline had frozen at `v1.49.801` for ~163 ships because no
surface gated its freshness — the alarm the project built to answer the prior
audit's #1 concern had gone silent.

## Why this ship

The 2026-06-03 audit refresh flagged the adoption baseline (`docs/ADOPTION-BASELINE-v*.json`,
written by `tools/adoption-refresh.mjs`) as a textbook un-gated-runnable-surface
(#10461): `adoption-refresh` existed since v1.49.787 but nothing made it a
load-bearing ship step, so the last committed baseline sat ~163 milestones stale
and the persistent-shelfware watch quietly stopped tracking reality. This ship
re-arms it as a **two-layer closure** (#10431/#10436): a source eliminator that
regenerates the baseline every ship, plus a detector gate that fires if it ever
drifts again.

## What shipped

- **`tools/adoption-baseline-freshness.mjs`** — compares the newest committed
  `docs/ADOPTION-BASELINE-v*.json` against `package.json` in *forward-progress*
  mode (tolerates trailing by up to `SC_ADOPTION_BASELINE_MAX_DRIFT` ships,
  default 30 — not exact-match, so a fresh baseline is not forced every ship).
  Exits 0 FRESH / 1 STALE / 2 FATAL; numeric (not lexical) version ordering;
  a baseline from a different release line is STALE, never falsely FRESH.
- **`pre-tag-gate.sh` step 20 (`adoption-freshness`)** — the DETECTOR. WARN-only
  by default (#10463 staged promotion), escalatable to BLOCKER via
  `SC_PRE_TAG_GATE_REQUIRE=adoption-freshness` (exit 23), gateable via
  `SC_PRE_TAG_GATE_BYPASS=adoption-freshness`.
- **`T14-SHIP-SEQUENCE.md` step 2.7** — the SOURCE ELIMINATOR: `adoption-refresh`
  + `adoption-trends --write` run post-bump, every ship.
- Parity surfaces updated together (#10461): gate help-log, `env-vars.json`
  vocabulary + REQUIRE list, and the new `SC_ADOPTION_BASELINE_MAX_DRIFT` knob;
  CLAUDE.md re-rendered. New `v1-49-965-meta-test` owns the "all 20 checks" count;
  `v1-49-961-meta-test` made count-agnostic.

## Verification

- 17 unit tests for the freshness tool (incl. the deliberately-stale negative
  fixture, the boundary `drift == max-drift`, and the different-release-line case).
- Full tools suite 832/832; build green; bypass-vocab parity 7/7; the new + updated
  meta-tests green. The WARN-only-cannot-block and exit-23-escalation properties
  proven under `set -euo pipefail`.
- An adversarial Workflow self-review (3 reviewers + a verify pass) caught **3 real
  BLOCKERs**, all fixed in code before commit: a cross-release-line baseline that
  reported FRESH; an exit-code 22 collision with `tools-node-test`; and
  `adoption-refresh` missing from the canonical T14 sequence.

## Engine state

- **NASA degree:** 1.178 (frozen — unchanged)
- **Counter-cadence count:** 29 (unchanged — normal forward `feat`)
- **Manifest lessons:** 151 (unchanged — applies #10431/#10436/#10461/#10463/#10424/#10427; no new lesson)
- **cadence_advances:** none (not a degree advance)
