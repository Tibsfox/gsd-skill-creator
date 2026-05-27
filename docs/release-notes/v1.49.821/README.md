> Following v1.49.820 — _First Chip: git/core/branch-manager ProcessContext Wiring_, v1.49.821 closes T2.2 part 1 (gate-flip infrastructure ship). Adds threshold-based ceiling enforcement to the pre-tag-gate discipline-coverage step: `SC_DISCIPLINE_COVERAGE_CEILING` (default 50; current state 39 well under), plus a new `--max-uncodified=N` flag on `tools/check-discipline-coverage.mjs`. v822 (part 2) flips the gate to BLOCK by default.

# v1.49.821 — T2.2 Part 1: Discipline-coverage Gate Ceiling Infrastructure

**Shipped:** 2026-05-27

Sixth ship of the v816-822 chain (item #6a of 7). First of 2 T2.2 ships per v784 audit sizing. Lands the ceiling-based enforcement infrastructure for the discipline-coverage gate without changing the default behavior (still WARN-only). v822 will flip the default to BLOCK.

The audit's framing: "Pre-tag-gate step 13 currently WARN-only. The codification cadence works; the gate just doesn't enforce it." The catch: current UNCODIFIED count is 39; flipping straight to BLOCK would immediately break every pre-tag-gate. The fix: add a CEILING — block only when count EXCEEDS the ceiling. Set the ceiling to a soak value (50) for v821; lower toward the current count (39) in v822.

## What shipped

- **MODIFIED** `tools/check-discipline-coverage.mjs` — add `--max-uncodified=N` flag. When set, exits 1 if UNCODIFIED count > N (independent of `--strict`, which exits 1 if ANY UNCODIFIED). New error message on threshold exceeded names the v821 ceiling enforcement context. Help text updated.
- **MODIFIED** `tools/pre-tag-gate.sh` step 13 — read `SC_DISCIPLINE_COVERAGE_CEILING` env var (default 50). When UNCODIFIED count > ceiling, surface "CEILING EXCEEDED" line. When `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage` is set AND ceiling exceeded, FAIL. Default behavior UNCHANGED — still WARN-only when ceiling is intact (current 39 < 50). Per-step log line shows the active ceiling.
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh `Latest shipped release` v819 → v820.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `tools/check-discipline-coverage.mjs` | unit-tested via shell smoke | exit-code behavior verified inline |
| `tools/pre-tag-gate.sh` step 13 | full pre-tag-gate run | verifies ceiling=50, current 39, PASS (WARN) |
| **Total added** | **+0** | No new vitest tests; tool is shell + node CLI |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 39 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: ~10-12 → ~10-12.

## Discipline-coverage ledger state

| Metric | Pre-v821 | Post-v821 |
|---|---|---|
| Manifest entries (disciplines) | 22 | 22 |
| Lessons in manifest | 73 | 73 |
| COVERED | 69 | 69 |
| PARTIAL | 8 | 8 |
| UNCODIFIED | 39 | 39 |
| Ceiling (default) | N/A | **50** (soak buffer 11) |
| Gate behavior | WARN-only | WARN-only (UNCHANGED until v822 flips) |

The 11-unit buffer (50 − 39 = 11) gives the chain breathing room for v822's flip without immediate breakage. v822 will tighten the default ceiling toward the current count (39) and flip the default to BLOCK.

## Lessons applied

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read `check-discipline-coverage.mjs` (244 lines) + pre-tag-gate step 13 (24 lines) + ran the tool to observe current UNCODIFIED count (39). ~5 min recon before any code change. |
| #10416 | Tolerant-generator / lightest wire | Resisted: chiping the 39 UNCODIFIED lessons in this ship (out of scope; would be 8+ ships of work); building a per-lesson auto-classifier; adding the ceiling to disciplines.json itself. Chose: 1 flag on the tool + 1 env var in the gate + 1 ceiling default. No data-source changes. |
| #10417 | Static-analysis tool authoring | Direct application. `check-discipline-coverage.mjs` is a comparable-output static-analysis tool. The new flag adds a threshold-based exit code. Help text updated to document the flag's semantics and the v821 T2.2 context. |
| #10422 | Verdict-pattern surface separation | The ceiling is a DECISION surface (block or not). The tool's report is an OBSERVABILITY surface (what's uncodified). Both surfaces exist independently — operators reading the report can see what to codify; operators running the gate get a yes/no answer at the threshold. |
| #10427 | Failure-mode contracts | Gate's failure mode shifts from "always-pass with WARN noise" to "fail-on-ceiling-exceeded with explicit reason." The explicit reason includes the UNCODIFIED count + ceiling for operator-actionability. Documented in the help text + the gate's log line. |
| #10431 | Two-layer closure for procedure-rooted drift | The discipline-coverage drift is procedure-rooted: operators have to manually codify lessons into disciplines.json. The detector layer already exists (check-discipline-coverage.mjs). The source-eliminator layer is now scaffolded (ceiling-based BLOCK in v822); v821 is the infrastructure that makes the source-eliminator possible. |
| #10432 | KNOWN_UNWIRED-style ledger | The UNCODIFIED count (39) functions as a debt ledger; the ceiling (50) provides a buffer that doesn't immediately fail. Same shape as the KNOWN_UNWIRED allowlist pattern, applied to discipline-coverage instead of chokepoint-coverage. Generalization candidate at future codify-ship. |

## What this ship is not

- Not a NASA degree advance.
- Not a chokepoint chip.
- Not a flip of the gate default (v822 does that).
- Not a closure of the 39 UNCODIFIED lessons.
- Not a change to disciplines.json or any discipline doc.

## Verification

- `node tools/check-discipline-coverage.mjs --max-uncodified=50` → exit 0 (39 ≤ 50, PASS).
- `node tools/check-discipline-coverage.mjs --max-uncodified=30` → exit 1 with ceiling-exceeded message (39 > 30).
- `bash tools/pre-tag-gate.sh` → 17/17 PASS expected (step 13 WARN with ceiling=50).

## Forward path

v822 (next in chain) = T2.2 Part 2 — flip the gate default to BLOCK-at-ceiling. Concrete: lower `SC_DISCIPLINE_COVERAGE_CEILING` default toward current count (e.g., 40 or 41); flip step 13 to call BLOCK on ceiling-exceed without requiring `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage`. Then v823 (T1.3 Ship 2 ObservationBridge) closes the chain.
