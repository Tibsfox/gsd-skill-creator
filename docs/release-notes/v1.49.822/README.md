> Following v1.49.821 — _T2.2 Part 1: Discipline-coverage Gate Ceiling Infrastructure_, v1.49.822 closes T2.2 part 2 by flipping the gate default to BLOCK-at-ceiling. Lowers `SC_DISCIPLINE_COVERAGE_CEILING` default from 50 to 41 (current count 39 + buffer 2). Ships adding ≥3 new UNCODIFIED entries hit BLOCK by default; previously this required `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage`. Verifies the flip with a forced-fail test (ceiling=30 → exit 15).

# v1.49.822 — T2.2 Part 2: Discipline-coverage Gate Default-BLOCK Flip

**Shipped:** 2026-05-27

Seventh ship of the v816-822 chain (item #6b of 7). Second of 2 T2.2 ships. Flips the default behavior of pre-tag-gate step 13 from WARN-only-with-env-var-escape to BLOCK-on-ceiling-exceed-by-default. The ceiling is tightened to current count (39) + small buffer (2) = 41.

Closes the v784 audit's T2.2 wedge: "Pre-tag-gate step 13 currently WARN-only. The codification cadence works; the gate just doesn't enforce it." Post-v822, it enforces — within the ceiling. Operators wanting to add more UNCODIFIED lessons must either codify some first or explicitly raise the ceiling.

## What shipped

- **MODIFIED** `tools/pre-tag-gate.sh` step 13:
  - Default `SC_DISCIPLINE_COVERAGE_CEILING` lowered from **50 → 41** (current 39 + buffer 2).
  - Ceiling-exceed now FAILS by default (no longer requires `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage`).
  - The legacy escape-valve `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage` still works for "strict mode" (FAIL on ANY UNCODIFIED, not just ceiling-exceed) — preserved for backward compatibility.
  - Updated header comment block to document v822's default-BLOCK flip + the two escape valves (raise ceiling, or bypass step).
  - Updated WARN log line text to reflect the new default behavior.
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh `Latest shipped release` v820 → v821.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| pre-tag-gate step 13 default behavior | 0 vitest | Verified via shell smoke: ceiling=41+default → PASS; ceiling=30 forced → FAIL exit 15 |
| All other steps | unchanged | 17/17 still PASS |
| **Total added** | **+0** | Configuration flip; no new tests |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 40 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: ~10-12 → ~10-12.

## Gate state post-v822

| Metric | Pre-v822 (v821) | Post-v822 |
|---|---|---|
| UNCODIFIED count | 39 | 39 |
| Default ceiling | 50 | **41** |
| Default behavior on within-ceiling | WARN | **WARN** (unchanged for safe state) |
| Default behavior on ceiling-exceed | WARN (unless ENV set) | **BLOCK** (regardless of ENV) |
| `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage` mode | BLOCK on any UNCODIFIED | BLOCK on any UNCODIFIED (preserved legacy) |
| Escape valves | env var, codify, bypass | raise ceiling, codify, bypass |

The "ceiling buffer" is operator-tunable. v822 picks 2 (39 + 2 = 41) as a tight default. Operators wanting more headroom can raise via `SC_DISCIPLINE_COVERAGE_CEILING=N`.

## Lessons applied

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read pre-tag-gate step 13 (v821 changes) + the v821 retrospective + the audit's T2.2 plan. Verified the v821 infrastructure works end-to-end before flipping the default. |
| #10416 | Tolerant-generator / lightest wire | Resisted: removing the legacy `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage` escape (preserves backward compatibility); making the ceiling unbounded ("just BLOCK on increase from baseline" — would require state-tracking which is bigger scope); auto-tuning the ceiling. Chose: single-line default change + remove the gate-required gating around the ceiling-exceed FAIL. |
| #10417 | Static-analysis tool authoring | Tool itself (`check-discipline-coverage.mjs`) UNCHANGED — only the gate's default behavior flips. Tool remains separately invokable; gate enforces. |
| #10422 | Verdict-pattern surface separation | The gate's decision surface (default-BLOCK at ceiling) is now distinct from the legacy strict-mode decision surface (FAIL on any UNCODIFIED via env var). Both decision surfaces preserved; gate dispatches on env state. |
| #10427 | Failure-mode contracts | Gate's failure mode now consistent: ceiling-exceed = FAIL by default (was WARN unless env). The contract: "the gate FAILS when count exceeds the ceiling; raise the ceiling explicitly if you want to push past." Documented in the inline gate comment + the FAIL message. |
| #10431 | Two-layer closure | v807 detector + v822 source-eliminator complete the two-layer closure for the discipline-coverage drift class. The detector existed (the tool); v821 added the threshold infrastructure; v822 makes it the default. Procedure-rooted drift closure done. |
| #10432 | KNOWN_UNWIRED-style ledger | The discipline-coverage ceiling pattern is now structurally identical to the KNOWN_UNWIRED allowlist pattern: a measurable count + a ceiling + operator-tunable + chip-down cadence. Second instance (after KNOWN_UNWIRED itself). Generalization-candidate progress. |

## What this ship is not

- Not a NASA degree advance.
- Not a chip — no UNCODIFIED lessons were codified in this ship.
- Not a change to disciplines.json or any discipline doc.
- Not a removal of the legacy `SC_PRE_TAG_GATE_REQUIRE` escape (preserved).
- Not a change to the tool itself.

## Verification

- `bash tools/pre-tag-gate.sh` (default) → 17/17 PASS (step 13 WARN: within-ceiling 39 ≤ 41).
- `SC_DISCIPLINE_COVERAGE_CEILING=30 bash tools/pre-tag-gate.sh` → exit 15 at step 13 (CEILING EXCEEDED: 39 > 30, FAIL by default).
- `SC_DISCIPLINE_COVERAGE_CEILING=100 bash tools/pre-tag-gate.sh` → 17/17 PASS (raised ceiling absorbs current count).

## Forward path

v823 (next + final in chain) = T1.3 Ship 2 — wire ObservationBridge into `src/dashboard/activity-tab-toggle.ts` `skill-activate` events. Activates the observation side of the integration bridges per `.planning/T1.3-RECON-2026-05-27.md`. ~55 min wall-clock estimate.

After v823, the v816-822 chain closes. Total chain wall-clock estimate: ~3 hours across 7 ships.
