# v1.49.821 — T2.2 Part 1: Discipline-coverage Gate Ceiling Infrastructure

**Released:** 2026-05-27
**Type:** Gate-flip infrastructure (T2.2 part 1 of 2 per v784 audit sizing)
**Predecessor:** v1.49.820 — First Chip: git/core/branch-manager ProcessContext Wiring
**Engine state:** UNCHANGED (NASA degree sustains at 1.178; counter-cadence count UNCHANGED at 6)
**Wedge:** Pre-tag-gate step 13 (discipline-coverage) is WARN-only. The audit's T2.2 plan: pick a stricter threshold and flip to BLOCK. Direct flip would block at current 39 UNCODIFIED. v821 lands the threshold infrastructure; v822 flips.

## Summary

Adds ceiling-based enforcement infrastructure to the discipline-coverage gate without changing the default behavior. Two coordinated changes:

1. **`tools/check-discipline-coverage.mjs` gets `--max-uncodified=N`** — when set, exits 1 if UNCODIFIED count > N. Independent of `--strict` (which exits 1 if ANY UNCODIFIED). Help text documents the new flag with v821 T2.2 context.

2. **`tools/pre-tag-gate.sh` step 13 reads `SC_DISCIPLINE_COVERAGE_CEILING` env var** (default 50). When UNCODIFIED count exceeds ceiling, surfaces "CEILING EXCEEDED" line and (only when `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage` is set) escalates to FAIL. Default behavior unchanged — WARN-only at the current state (39 < 50).

The 11-unit soak buffer (50 − 39 = 11) gives v822's flip room to land without immediate breakage. v822 will tighten the default ceiling toward the current count.

## What changed

`tools/check-discipline-coverage.mjs`:
- Add `--max-uncodified=N` flag in parseArgs with validation (must be non-negative integer).
- Help text updated: new "Flags:" section documenting `--json`, `--strict`, `--max-uncodified=N` with their semantics and the v821 T2.2 context for the ceiling.
- Main exit: after `--strict` check, also check `--max-uncodified=N` against `buckets.UNCODIFIED.length`; exit 1 with a clear stderr message on threshold-exceed.

`tools/pre-tag-gate.sh` step 13:
- Read `SC_DISCIPLINE_COVERAGE_CEILING` env var (default 50).
- Step-log includes the active ceiling.
- After UNCODIFIED count is extracted: check if count > ceiling.
  - If yes: surface "CEILING EXCEEDED" line. If `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage`, FAIL.
  - If no: continue with the existing WARN behavior (or FAIL if `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage` set even without ceiling exceed — preserves the pre-v821 ENV-var escape behavior).
- Per-step WARN log line includes the active ceiling.

`.planning/PROJECT.md`:
- Pre-bump refresh `Latest shipped release` v819 → v820.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `tools/check-discipline-coverage.mjs` | MODIFIED | +25 LOC (flag parsing + validation + exit check + help text). 244 → 269 lines. |
| `tools/pre-tag-gate.sh` (step 13) | MODIFIED | +20 LOC (env var + ceiling check + branching). 24 → 44 lines for step 13 block. |
| `.planning/PROJECT.md` | MODIFIED | Pre-bump refresh. |
| `docs/release-notes/v1.49.821/` | NEW | 5 files: README + 4 chapter files. |

## Lessons applied

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read tool (244 LOC) + pre-tag-gate step 13 + ran the tool to observe current state (39 UNCODIFIED + 8 PARTIAL + 69 COVERED). ~5 min recon before any code change. |
| #10416 | Tolerant-generator / lightest wire | Resisted: chiping the 39 UNCODIFIED lessons (8+ ship cost; out of scope); building an auto-classifier; adding the ceiling to disciplines.json. Chose: 1 flag + 1 env var. |
| #10417 | Static-analysis tool authoring | Direct application — the tool is a comparable-output analyzer. New flag adds threshold-based exit. Documented in help. |
| #10422 | Verdict-pattern surface separation | The ceiling is a DECISION surface (block-or-not). The tool's report is an OBSERVABILITY surface (what's uncodified). Both independent. |
| #10427 | Failure-mode contracts | Gate's failure mode shifts from "always-pass with WARN noise" to "fail-on-ceiling-exceeded with explicit reason." Reason includes UNCODIFIED count + ceiling for operator-actionability. |
| #10431 | Two-layer closure | Discipline-coverage drift is procedure-rooted (operators manually codify). Detector layer existed (the tool). Source-eliminator layer is the ceiling-based BLOCK (v822 flips it on). v821 lands the scaffolding. |
| #10432 | KNOWN_UNWIRED-style ledger | The UNCODIFIED count functions as a debt ledger; the ceiling provides a buffer. Same shape as the v806 KNOWN_UNWIRED allowlist pattern applied to a different domain. Generalization candidate. |

## What this ship is not

- Not a NASA degree advance.
- Not a flip of the gate default (v822).
- Not a change to disciplines.json or any discipline doc.
- Not a codification of any specific UNCODIFIED lesson.
- Not a chokepoint chip.

## Verification

- `node tools/check-discipline-coverage.mjs --max-uncodified=50` → exit 0.
- `node tools/check-discipline-coverage.mjs --max-uncodified=30` → exit 1 with "UNCODIFIED count 39 EXCEEDS ceiling 30".
- `bash tools/pre-tag-gate.sh` → 17/17 PASS expected. Step 13 log line shows `ceiling=50`.
- `SC_DISCIPLINE_COVERAGE_CEILING=30 SC_PRE_TAG_GATE_REQUIRE=discipline-coverage bash tools/pre-tag-gate.sh` → expected FAIL at step 13 with ceiling-exceeded message (not tested in this ship; reserved for v822 verification).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 39 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

Infrastructure ship; does not tick counter-cadence per #10430.

## Forward path

v822 (next in chain) = T2.2 Part 2. Concrete plan:
- Lower default `SC_DISCIPLINE_COVERAGE_CEILING` from 50 to a tighter value (e.g., 40 or 41 — current 39 + small buffer).
- Flip step 13 to call BLOCK on ceiling-exceed by default (without requiring `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage`).
- Document the chip-down expectation (codify lessons to bring count down + lower ceiling over time).
- Verify pre-tag-gate still PASSES at current state with the tightened ceiling.

Then v823 (T1.3 Ship 2 ObservationBridge wire) closes the chain.
