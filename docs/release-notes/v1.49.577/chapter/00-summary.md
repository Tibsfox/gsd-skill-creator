# v1.49.577 — JULIA-PARAMETER: Wasserstein-Everywhere — Summary

**Released:** 2026-04-26
**Backfilled:** 2026-04-27
**Theme:** distribution-aware bounded learning + evaluation as the unifying axis across all 40 candidate absorptions
**Profile:** Fleet (8 modules, 19 named roles in Part A; severity-mapped wave plan in Part B)

## One-line

v1.49.577 closes a deliberate "catchup pass" against the April 2026 arXiv-math firehose: 370 papers indexed, ~50 carded across 8 modules, 6 convergent-discovery clusters synthesized, and **all 40 candidate absorptions implemented** (3 BLOCK + 12 HIGH + 25 MEDIUM) inside a single milestone dual-part shape — Part A research absorption (phases 821–826, 4 waves) followed by Part B implementation (20 phases / 20 commits, severity-mapped Wave 1/2/3). The milestone overshot its test-delta target 5.6× (+279 vs +50), retired 7 pre-existing failures via collateral fixes, and added two new `src/*` subsystems (`src/anytime-valid/` and `src/skill-promotion/`) that consolidate primitives the architecture had been duplicating informally.

## Structural firsts at v1.49.577

1. **First "all candidates" Part B scope.** Earlier vision-to-mission consumptions floored at top-K-by-leverage (typically 3–6 candidates). v1.49.577 implements every BLOCK + HIGH + MEDIUM finding from `m5/FINDINGS.md` (40 of 40) as deliverables, with LOW items routed to backlog via `gsd-add-backlog`. Scope is bounded by FINDINGS quality, not by an arbitrary K cutoff. User-locked at the Part A → Part B handoff (2026-04-26).

2. **First milestone-name selection deferred to Part A handoff.** Three candidate names surfaced in `synthesis/retro-seed.md §6` ("Find the Right Slice", "Catchup as Parameter Slice", "Wasserstein-Everywhere"). The user selected option C ("Wasserstein-Everywhere") at the Part A → Part B handoff CAPCOM gate after the W2 synthesis-matrix made the convergent axis legible. Working title was used through Part A; final name set at handoff, not before.

3. **First shared `src/anytime-valid/` primitive.** Both `src/orchestration/` CAPCOM gates and `src/ab-harness/` stochastic-dominance tests previously rolled their own threshold logic. JP-002 (commit `40921c081`) creates the shared e-process primitive in `src/anytime-valid/`; JP-029 (commit `b7a54b0fb`) migrates `src/ab-harness/` onto it. The `(Ville's inequality; consumed by src/orchestration/anytime-gate.ts and future src/ab-harness/ consumer per JP-029)` annotation in CLAUDE.md "Key File Locations" reflects the new structure.

4. **First standalone `src/skill-promotion/` subsystem.** Skill promotion ROI logic previously lived as scattered helpers in `src/skill-workflows/` and `src/reinforcement/`. JP-005 (commit `9ae20e756`) lands `src/skill-promotion/promotion-roi.ts` implementing the Landauer-floor deployment-horizon ROI gate at T=300K (anchored on arXiv:2604.20897). The user-locked decision at handoff was explicit: new subsystem, not a fold-in.

5. **First Lean Mathlib pin for the v1.50 proof companion.** JP-001 (commit `c1f73f0cb`) creates `src/mathematical-foundations/lean-toolchain.md` declaring the pinned Mathlib commit hash + Lean toolchain version matching Degenne et al. (arXiv:2510.04070). The pin is the substrate every formal statement in the v1.50 proof companion compiles against — bounded-learning cap, anytime-valid e-process gate, multi-calibration sample-complexity bound. (Substantively closed in v1.49.578 when `tools/verify-mathlib-pin.sh` ran end-to-end on Lean 4.15.0 + Mathlib4 commit hash; v1.49.577 lands the placeholder + substitution procedure.)

6. **First training-time safety enforcement.** Until v1.49.577 the BLOCK pattern (CLAUDE.md + Safety Warden) operated only at inference time. JP-004 (commit `7d165fa70`) lands `src/safety/sap-probe.ts` (contrastive-probe + (I − P_S) construction) and registers safety-aware-projection in `src/projection/` MB-2 registry. Composes with MB-1 Lyapunov-gated update without invariant violation. Anchors on arXiv:2505.16737 (SAP) + arXiv:2604.21744 (GROUNDINGmd Hard Constraints) as convergent.

7. **First DiP-SD draft/verify router on the orchestration surface.** JP-007 (commit `68422ed4a`) lands `src/orchestration/draft-verify-router.ts` realizing fractional-MIP assignment with model-tier-aware draft and verify lanes; integrates with `src/cache/` KVFlow predictor for draft-token preloading. Anchors on arXiv:2604.20919 (DiP-SD) + arXiv:2604.21316 (LLM-Steered) as convergent.

8. **First mesh-degree monitor with churn-grace policy.** JP-006 (same commit as JP-007) lands `src/orchestration/mesh-degree-monitor.ts` enforcing the r ≥ 2 string-stability hard constraint with grace-window logic on transient mesh churn. Anchors on arXiv:2604.21329 (string stability) + arXiv:2604.21024 (EEI formation flying) as convergent.

9. **First retrospective milestone to extend CLAUDE.md "External Citations (CS25–26 Sweep)" with new anchors.** v1.49.575 created the section with 3 anchor papers; v1.49.577 extends the same section (per user-locked decision: "extend existing section with new cluster subsection, not sibling") with 4 new anchors (arXiv:2604.20897 / 2604.20915 / 2510.04070 / 2604.21101) plus a featured philosophical anchor (arXiv:2604.21048). Edits consolidated into a single CLAUDE.md commit `57bce4bb2` per `synthesis/retro-seed.md §3.4` recommendation.

10. **First component-count overshoot acknowledged in writing.** Vision-to-mission target was 6–10 components based on candidate count; Part B landed 14. Documented in the vision-to-mission report and acknowledged in self-review pass `268950204` as out-of-scope-but-acknowledged. The 5.6× test-delta overshoot is a related signal: the 40-candidate "all candidates" scope produced more deliverables than the original 6–10 component plan anticipated.

## Self-review pass

After the closing wave, a self-review pass landed at commit `268950204`. Six findings (2 medium + 4 low), no behavioral change, 28,345 passing unchanged across 48/48 re-verified tests in 7 touched files. The two medium findings:

- **MEDIUM:** `src/ab-harness/wasserstein-boed.ts` citation overclaim — `wassersteinExpectedUtility` was framed as IPM-BOED algorithm but ships a hand-constructed bounded-update heuristic (the actual IPM-BOED replacement is info-blocked on a concrete `p(y|d,θ)` data-generating model). Added Limitations section + reframed; explicit DEFER carried into v1.49.578.
- **MEDIUM:** `src/vtm/__tests__/sages-consistency.test.ts` framing — 4 structural-integrity checks were framed as SAGES semantic-behavioral consistency. Reframed; renamed `measureConsistency` → `measureStructuralIntegrity`.

The four LOW findings cleaned up doc-comment drift in `src/skill-promotion/promotion-roi.ts`, `src/anytime-valid/e-process.ts`, `src/anytime-valid/types.ts`, and `src/orchestration/anytime-gate.ts` — all stale framing from earlier wave drafts; no behavior change.

Acknowledged-out-of-scope: v1.50 proof-companion language in earlier commit messages (history preserved; defensible as "future v1.50"); component-count overshoot 14 vs 6–10 target; JP-001 placeholder Mathlib commit hash (substitution procedure documented); JP-010a zero telemetry observations (audit-trail entry documents K=3 default; activates when callers wire the module — first real caller seeded in v1.49.578).

## Engine state after v1.49.577

- 28,345 tests passing / 3 failing / 11 skipped / 7 todo — net +279 over v1.49.576 baseline
- 147 `src/*` subsystems (was 145); `src/anytime-valid/` and `src/skill-promotion/` are the two new
- All 40 JP-NNN findings landed; 0 induced regressions; 7 pre-existing failures retired via collateral fixes
- 3 pre-existing failures remain: 2 in `src/mathematical-foundations/__tests__/integration.test.ts` (flag-off byte-identical regression — confirmed pre-existing via Track A stash/revert in P837/P834) + 1 in `src/heuristics-free-skill-space/__tests__/integration.test.ts` (`.claude/` install-completeness check, fresh-checkout artifact since `.claude/agents/`, `.claude/skills/`, `.claude/hooks/` are gitignored per CLAUDE.md and populated by `project-claude/install.cjs`)
- CLAUDE.md "External Citations (CS25–26 Sweep)" section: 3 → 7 anchors + 1 featured philosophical anchor
- Forward-citation: v1.49.578 JULIA-PARAMETER Substantiation + Closure picked up the 4 known carryover items (BOED IPM DEFER, JP-001 substantive verification, JP-040 NASA citations relocation, JP-010a real-caller seed); CLOSED `ready_for_review` 2026-04-26 at `520419af8`.

---

*v1.49.577 / JULIA-PARAMETER: Wasserstein-Everywhere / 2026-04-26 (release) / 2026-04-27 (release-notes backfill)*
