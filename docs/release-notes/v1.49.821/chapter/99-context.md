# v1.49.821 — Context

## Provenance

- **Source:** v784 audit (`.planning/AUDIT-2026-05-26-core-functions-retrospective.md`) §4 Tier 2 item T2.2 "Discipline-coverage gate WARN → BLOCK (2 ships)."
- **Trigger:** Operator selected the v816-822 chain at session-start; this ship is item #6 (T2.2 part 1 of 2).
- **Predecessor ship:** v1.49.820 (First Chip: git/core/branch-manager ProcessContext Wiring); shipped 2026-05-27 ~11:05 UTC.
- **Session boundary:** Chain-mode (same session-retro mission).

## The discipline-coverage gate's state

Pre-v821 default behavior:
- Step 13 runs `node tools/check-discipline-coverage.mjs`
- Surfaces UNCODIFIED count (currently 39) + PARTIAL count (8)
- Default: WARN-only (always passes)
- Escape valve: `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage` → BLOCK on ANY UNCODIFIED

The naive flip to "BLOCK by default" would fail every pre-tag-gate immediately (39 UNCODIFIED > 0). Solution: ceiling-based BLOCK.

## The ceiling pattern

```
UNCODIFIED count = N
SC_DISCIPLINE_COVERAGE_CEILING = K
If N > K: gate fails (when SC_PRE_TAG_GATE_REQUIRE=discipline-coverage set)
If N ≤ K: gate passes (regardless of strict flag)
```

v821 sets K = 50, N = 39. Gate passes; soak buffer of 11.
v822 will set K closer to N (e.g., K = 40), and flip the default to BLOCK at ceiling without needing the env var.

## The two-flag distinction

- `--strict` (v653 original): exit 1 if ANY UNCODIFIED (count > 0).
- `--max-uncodified=N` (v821 NEW): exit 1 if UNCODIFIED count > N.

`--strict` is "no debt allowed"; `--max-uncodified=N` is "debt bounded by N." Both can coexist; `--strict` is the special case `--max-uncodified=0`.

## Why ceiling, not strict

`--strict` would require codifying all 39 UNCODIFIED before the gate could be flipped. That's 8+ ships of codification work. Out of scope for the v816-822 chain.

`--max-uncodified=N` lets the gate be flipped while the debt asymptotes. As ships codify lessons, count drops; ceiling can be lowered to match; gate stays useful throughout.

This is the same pattern as v806's KNOWN_UNWIRED allowlist: don't require all callers to be wired immediately; ledger the existing ones; chip down over time.

## The gate's pre-tag log line

Pre-v821:
```
[pre-tag-gate] step 13/15: WARN (informational; set SC_PRE_TAG_GATE_REQUIRE=discipline-coverage to block)
```

Post-v821:
```
[pre-tag-gate] step 13/15: WARN (informational; set SC_PRE_TAG_GATE_REQUIRE=discipline-coverage to block; ceiling=50)
```

The ceiling is now visible per-run. Operators tweaking via env var see the active value in the log.

## What v822 will do

Concrete plan for v822 (T2.2 part 2):
1. Lower the default `SC_DISCIPLINE_COVERAGE_CEILING` from 50 to a tighter value (e.g., 40 or 41).
2. Flip step 13 to call BLOCK on ceiling-exceed by default (without requiring `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage`).
3. Document the chip-down expectation: codify lessons → count drops → lower ceiling over time.
4. Verify pre-tag-gate PASSES at current state with the tightened ceiling.
5. Maybe add a small "ceiling history" table to disciplines.md or a new ceiling-history.md tracking ceiling changes over time.

## Engine state crossover

NASA degree sustains at **1.178** for the 39th consecutive ship. Counter-cadence count UNCHANGED at 6.

The codify ⟂ consume ⟂ calibrate ⟂ observe quadrant:
- **Consume:** N/A this ship.
- **Codify:** N/A directly, but enables future codify ships to land with effective gate feedback.
- **Calibrate:** the ceiling itself IS a calibratable threshold (potential 7th wired threshold candidate for future codify-ship).
- **Observe:** the per-run ceiling log line is new observability.

## Predecessor handoff reference

See `.planning/HANDOFF-2026-05-27-v1.49.815-t2.3-high-01-pmtiles-refcount-shipped.md`.

## Forward path post-v821

v822 = T2.2 Part 2 (flip the default + tighten the ceiling). v823 = T1.3 Ship 2 (ObservationBridge wire). Then the chain closes.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + Lesson #10184 + Lesson #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- v821 used the v816-fixed `state-md-set-shipped` tool for STATE.md reset.
- Sixth consecutive post-v816 ship with clean colon-handling.
