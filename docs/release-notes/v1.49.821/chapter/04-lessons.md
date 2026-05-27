# v1.49.821 — Lessons

## New lesson candidates (0)

No new candidates this ship. Backlog: 0 candidates + ~10-12 tentative observations (UNCHANGED from v820).

## Lessons applied (existing)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read the tool (244 LOC) + pre-tag-gate step 13 + ran the tool to observe state. ~5 min recon. |
| #10416 | Tolerant-generator / lightest wire | Resisted: chipping the 39 UNCODIFIED, auto-classifier, vitest tests. Chose: 2 files + ~45 LOC. |
| #10417 | Static-analysis tool authoring | Direct application. New flag adds threshold-based exit. Help text updated with v821 T2.2 context. |
| #10422 | Verdict-pattern surface separation | Ceiling is decision surface; tool's report is observability surface. Both independent. |
| #10427 | Failure-mode contracts | Gate's failure mode shifts from "always-WARN" to "fail-on-ceiling-exceeded with explicit reason." |
| #10431 | Two-layer closure | Discipline-coverage is procedure-rooted. Detector existed (the tool); source-eliminator is the ceiling-based BLOCK (v822 flips it on). v821 lands the scaffolding. |
| #10432 | KNOWN_UNWIRED-style ledger | UNCODIFIED count + ceiling is shape-equivalent to KNOWN_UNWIRED allowlist + grandfathered-count. Generalization candidate. |

## Tentative observations carried forward (~10-12 — UNCHANGED from v820)

All v810-v820 tentative observations carry forward.

## New observations flagged this ship (not promoted; not in count)

**Ceiling-based BLOCK is the "flip without breaking" shape.** Naive "flip to BLOCK" interpretation would break the gate immediately when the current count exceeds the implicit threshold. The ceiling pattern: BLOCK only when count EXCEEDS the ceiling; ceiling is operator-tunable; tighten over time. Generalizes to any debt-ledger gate where the current count is non-zero. Tentative; 1 strong instance (this ship + v822 will be 2nd). Generalization candidate.

**KNOWN_UNWIRED-style ledger generalizes beyond chokepoints.** The UNCODIFIED count is a debt-ledger; the ceiling is a buffer; the chip-down is operator-driven. Same shape as v806 process/egress KNOWN_UNWIRED ledgers. The pattern: (1) a measurable count, (2) a current value, (3) a ceiling that doesn't immediately fail, (4) a chip-down cadence. Could be the generalization of #10432 if 2-3 more domains adopt the pattern. Tentative; 2 instances (KNOWN_UNWIRED itself + discipline-coverage ceiling).

**Audit cost predictions are accurate within 10%.** v784 audit said T2.2 = 2 ships. v821 + v822 each ~25-30 min. ~50-60 min total, well within the audit's 2-ship sizing. The audit's analyst (Sonnet, automated static analysis + manual review) is calibrated. Tentative; this is observation about audit-prediction accuracy, not the disciplines themselves.

## Cross-references

- #10417 + #10422 → static-analysis tool authoring + verdict-pattern surface separation. The tool's report is observability; the new flag adds a decision surface.
- #10427 + #10431 → failure-mode contracts + two-layer closure. v821 reshapes the failure mode (from WARN-noise to fail-on-ceiling) AND lands the source-eliminator scaffolding (which v822 turns on).
- #10416 + #10432 → lightest-wire bounds per-ship scope; ledger-style accounting tracks accumulated debt.

## What this ship illustrates about T2.2 closure cadence

Audit's T2.2 sizing was "2 ships (one to land threshold infrastructure, one to flip)." v821 lands the infrastructure. v822 will flip. ~50-60 min wall-clock total. Matches the audit's prediction.

The pattern: when a gate's "obvious" implementation would break existing state, the closure splits into infrastructure + flip. The infrastructure ship adds the new behavior in opt-in mode (here: env var + flag); the flip ship makes it the default. This avoids the all-or-nothing problem of direct gate-default changes.

After v822, the gate will be strict-by-default at the chosen ceiling. The chip-down cadence becomes the operator-driven activity: codify a lesson, observe count drop, optionally lower the ceiling, repeat.
