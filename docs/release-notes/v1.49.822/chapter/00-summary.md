# v1.49.822 — T2.2 Part 2: Discipline-coverage Gate Default-BLOCK Flip

**Released:** 2026-05-27
**Type:** Gate-flip (T2.2 part 2 of 2 per v784 audit sizing)
**Predecessor:** v1.49.821 — T2.2 Part 1: Discipline-coverage Gate Ceiling Infrastructure
**Engine state:** UNCHANGED (NASA degree sustains at 1.178; counter-cadence count UNCHANGED at 6)
**Wedge:** v821 landed the threshold infrastructure (`SC_DISCIPLINE_COVERAGE_CEILING` env var + `--max-uncodified=N` flag on the tool) but kept default behavior as WARN-only. v822 flips the default to BLOCK-on-ceiling-exceed.

## Summary

Flip ship per the v784 audit's T2.2 plan ("flip to BLOCK with `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage` as the escape valve").

The actual flip:
- Default `SC_DISCIPLINE_COVERAGE_CEILING` lowered from 50 → 41 (current count 39 + buffer 2).
- Ceiling-exceed now FAILS by default — no longer requires `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage` env var.
- Legacy `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage` mode preserved as "strict mode" (FAIL on ANY UNCODIFIED, not just ceiling-exceed) for backward compatibility.
- Two operator escape valves remain: (a) raise `SC_DISCIPLINE_COVERAGE_CEILING` to push past current; (b) bypass via `SC_PRE_TAG_GATE_BYPASS=discipline-coverage`.

The flip is functionally a ~5-LOC change: lower the default + remove the `gate_required` gating around the ceiling-exceed FAIL. Comment block + log line updated to reflect the new default behavior.

## What changed

`tools/pre-tag-gate.sh` step 13:

- **Default ceiling:** `SC_DISCIPLINE_COVERAGE_CEILING:-50` → `SC_DISCIPLINE_COVERAGE_CEILING:-41`.
- **Ceiling-exceed branch:** removed the `if gate_required "discipline-coverage"; then ... fi` wrap; FAIL fires unconditionally on ceiling-exceed.
- **Comment block (header for step 13):** documents v822 flip + the two escape valves (raise ceiling, bypass step).
- **WARN log line:** new text reflects within-ceiling pass + "ceiling-exceed will BLOCK by default since v822" reminder.

`.planning/PROJECT.md`:

- Pre-bump refresh `Latest shipped release` v820 → v821.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `tools/pre-tag-gate.sh` (step 13) | MODIFIED | ~10 LOC delta: comment update + default-value change + remove gate_required wrap + log line update. |
| `.planning/PROJECT.md` | MODIFIED | Pre-bump refresh. |
| `docs/release-notes/v1.49.822/` | NEW | 5 files: README + 4 chapter files. |

## Lessons applied

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read v821 retrospective + the v821-modified step 13 + the audit's T2.2 framing. Verified v821 infrastructure works end-to-end (smoke tested with ceiling=30 → exit 15) before flipping default. |
| #10416 | Tolerant-generator / lightest wire | Resisted: removing legacy `SC_PRE_TAG_GATE_REQUIRE` mode (preserves backward compatibility); auto-tuning ceiling; making ceiling unbounded via "block on increase from baseline" (would require state-tracking). Chose: ~10-LOC tweak to the existing v821 infrastructure. |
| #10417 | Static-analysis tool authoring | Tool unchanged; gate's policy changed. Cleanly separated. |
| #10422 | Verdict-pattern surface separation | Default-BLOCK decision surface (ceiling-exceed FAIL) is distinct from legacy strict-mode decision surface (any-UNCODIFIED FAIL via env). Both preserved. |
| #10427 | Failure-mode contracts | Gate's failure mode: "FAIL when count > ceiling; raise the ceiling explicitly if you want to push past." Documented in the inline gate comment + the FAIL message. |
| #10431 | Two-layer closure | v807 detector + v822 source-eliminator complete the two-layer closure for the discipline-coverage drift class. The detector existed (the tool); v821 added threshold infrastructure; v822 makes it the default. Procedure-rooted drift closure done. |
| #10432 | KNOWN_UNWIRED-style ledger | Discipline-coverage ceiling is structurally identical to KNOWN_UNWIRED allowlist. Second instance of the pattern. Generalization candidate progress. |

## What this ship is not

- Not a NASA degree advance.
- Not a codification of any UNCODIFIED lesson.
- Not a change to the tool itself.
- Not a removal of any existing functionality.
- Not a chip of process/egress KNOWN_UNWIRED.

## Verification

- `bash tools/pre-tag-gate.sh` (default ceiling=41) → 17/17 PASS. Step 13 log: `WARN (within-ceiling: 39 ≤ 41; ceiling-exceed will BLOCK by default since v822)`.
- `SC_DISCIPLINE_COVERAGE_CEILING=30 bash tools/pre-tag-gate.sh` → exit 15. Step 13 surfaces "CEILING EXCEEDED" + FAIL message.
- `SC_DISCIPLINE_COVERAGE_CEILING=100 bash tools/pre-tag-gate.sh` → 17/17 PASS (raised ceiling absorbs).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 40 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

Configuration-flip ship; does not tick counter-cadence per #10430. T2.2 audit wedge CLOSED.

## Forward path

v823 (final in chain) = T1.3 Ship 2 — wire ObservationBridge per `.planning/T1.3-RECON-2026-05-27.md`. ~55 min wall-clock estimate. After v823, the v816-822 chain closes.
