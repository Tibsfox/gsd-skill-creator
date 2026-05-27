# v1.49.822 — Context

## Provenance

- **Source:** v784 audit §4 Tier 2 item T2.2 part 2 of 2.
- **Trigger:** Operator selected the v816-822 chain at session-start; this ship is item #6b (T2.2 part 2).
- **Predecessor ship:** v1.49.821 (T2.2 Part 1: Discipline-coverage Gate Ceiling Infrastructure); shipped 2026-05-27 ~11:21 UTC.
- **Session boundary:** Chain-mode (same session-retro mission).

## The flip in 3 changes

1. **Default ceiling:** `SC_DISCIPLINE_COVERAGE_CEILING:-50` → `SC_DISCIPLINE_COVERAGE_CEILING:-41`. Tight: current 39 + buffer 2 = 41.
2. **Ceiling-exceed branch:** removed `if gate_required "discipline-coverage"; then ... fi` wrap around the FAIL. Now: ceiling-exceed FAILS unconditionally.
3. **Documentation:** header comment + WARN log line updated.

## The decision-surface hierarchy post-v822

| Mode | Default? | Triggers | Failure condition |
|---|---|---|---|
| Bypass | No | `SC_PRE_TAG_GATE_BYPASS=discipline-coverage` | Never fails (step skipped) |
| Ceiling (NEW DEFAULT) | YES | None | FAIL when UNCODIFIED > ceiling |
| Strict (legacy) | No | `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage` | FAIL on ANY UNCODIFIED |

The three modes nest: Strict ⊆ Ceiling ⊆ Bypass (in terms of strictness). Strict is the most restrictive; ceiling is the default; bypass is the escape hatch.

## Why ceiling=41 specifically

Current UNCODIFIED count is 39. Picking 39 (zero buffer) would fail the gate immediately if any new tentative-observation accumulates to UNCODIFIED status. Picking 50 (the v821 soak value) leaves too much room — defeats the purpose of "enforcement."

41 (current + 2) is operator-friendly: absorbs 1-2 near-term additions without spurious failures; tight enough that 3+ additions trigger enforcement. Future codify ships (whenever they land) drop the count below 39, and a future ship can re-tighten the ceiling.

## What v823 needs to know

The chain's last ship (v823 = T1.3 ObservationBridge wire) will produce its own retrospective. If it adds new tentative observations that promote to lessons-carried-forward, the gate may approach the ceiling. v823 should:
1. Stay within the ceiling (≤2 new lessons-carried-forward in its retrospective).
2. Or: explicitly raise `SC_DISCIPLINE_COVERAGE_CEILING` if it needs to add 3+.
3. Or: codify some existing UNCODIFIED to make room.

In practice, v823's likely impact: 1-2 new tentative observations, 0 promotions to lesson-carried-forward (the chain's pattern has been mostly observation-only). Should stay within ceiling.

## Engine state crossover

NASA degree sustains at **1.178** for the 40th consecutive ship. Counter-cadence count UNCHANGED at 6.

The codify ⟂ consume ⟂ calibrate ⟂ observe quadrant:
- **Consume:** consume-axis (closes the T2.2 audit wedge).
- **Codify:** N/A directly.
- **Calibrate:** the ceiling IS a calibratable threshold (current default 41; operator-tunable; could be a 7th wired threshold candidate).
- **Observe:** the new WARN log line includes ceiling state per-run.

## Predecessor handoff reference

See `.planning/HANDOFF-2026-05-27-v1.49.815-t2.3-high-01-pmtiles-refcount-shipped.md`.

## Forward path post-v822

v823 = T1.3 Ship 2 (ObservationBridge wire). After v823, the v816-822 chain closes.

T2.2 audit wedge: **CLOSED v822**.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + Lesson #10184 + Lesson #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- v822 used the v816-fixed `state-md-set-shipped` tool for STATE.md reset.
- Seventh consecutive post-v816 ship with clean colon-handling.
