# v1.49.577 — Forward Lessons (Emitted to v1.49.578+)

## Lessons forward

### 1. Single-shared primitive consolidation pays back component-count

Both `src/anytime-valid/` and `src/skill-promotion/` landed as new top-level subsystems in v1.49.577 (commits `73bf440e7` scaffold + `40921c081` JP-002 + `9ae20e756` JP-005). Each consolidates logic that was previously duplicated across consumers — `src/orchestration/` and `src/ab-harness/` for e-process; `src/skill-workflows/` and `src/reinforcement/` for promotion ROI. The consolidation paid back inside the same milestone: JP-029 (commit `b7a54b0fb`) migrated `src/ab-harness/` onto the shared `src/anytime-valid/` primitive within Part B. **Forward operational rule:** when a research-absorption mission surfaces ≥ 2 candidate absorptions targeting the same primitive (e.g., e-process, ROI gate, KL bound), prefer a new shared `src/<primitive>/` subsystem at scaffold time over per-consumer rolls. The user-locked decision pattern at Part A → Part B handoff is the correct gate.

### 2. Featured paper handled as philosophical anchor, not src/* anchor

arXiv:2604.21048 (Mandelbrot/Julia structures in 3-parameter rational map slices) anchors a *philosophical* through-line in CLAUDE.md but does **not** anchor any `src/*` subsystem. The CLAUDE.md content explicitly notes "**Featured: ...** *Philosophical anchor — no `src/*` code anchor; methodological thesis only.*". **Forward operational rule:** when the next research-absorption mission's featured paper is a methodological/pedagogical paper rather than a tractable algorithmic-anchor paper, the CLAUDE.md content for it should follow the same "philosophical anchor — no `src/*` code anchor" framing. Reserve the convergent-discovery cluster anchors for the load-bearing src-subsystem citations.

### 3. JP-NNN finding ID convention scales

Every Part B commit referenced its JP-NNN finding ID(s) in the commit subject (e.g., `feat(orchestration): JP-006 mesh-degree monitor + JP-007 draft/verify router`). The convention made the 20-commit Part B history scannable and made the `findings_landed: "40/40 (all JP-NNN)"` accounting in STATE.md mechanically verifiable. **Forward operational rule:** future Part B implementation phases should keep the FINDING-ID-in-commit-subject convention. Multi-finding commits are fine (e.g., `JP-026+034+035+015+030+031` in `3f55c9c58`); single-finding commits are also fine. The discipline is name-the-finding, not one-finding-per-commit.

### 4. Pre-existing failures retire as collateral when the right primitive lands

Part B fixed 6 baseline failures via collateral (failures: 10 → 3). None were the explicit target of any JP-NNN finding; they retired because the new primitives (anytime-valid e-process, skill-promotion ROI, mesh-degree monitor) replaced ad-hoc logic that had been failing in edge-case tests. **Forward operational rule:** when a milestone's pre-existing failure count is high (≥ 8) and the milestone introduces ≥ 2 new shared `src/*` subsystems, expect 5–8 collateral retires. Do not pre-allocate JP-NNN findings to "fix the failing tests" — the failures retire when the right primitive lands. (The 3 remaining pre-existing failures are independent of any v1.49.577 absorption: 2 in math-foundations integration test confirmed pre-existing via Track A stash/revert; 1 in heuristics-free-skill-space install-completeness check is a fresh-checkout artifact.)

### 5. Component-count overshoot is a function of "all candidates" scope

The 14-component landing against a 6–10 target was driven by the "all candidates" scope (40 findings → 14 components rather than 40 findings → 6 components with most folded into existing files). The overshoot is not a vision-to-mission planning failure — it is the correct mechanical consequence of severity-mapping all 40 findings to deliverables. **Forward operational rule:** vision-to-mission's component-count estimate (currently "6–10 components based on candidate count") should adapt to scope: ≤ 15 candidates → 4–6 components; 15–30 candidates → 8–12; ≥ 30 candidates → 12–18. The current estimator under-counts at the high end.

### 6. Lean Mathlib pin lands as placeholder + substitution procedure

JP-001 landed `src/mathematical-foundations/lean-toolchain.md` with a placeholder Mathlib commit hash and a substitution procedure documented inline. Substantive verification (running `tools/verify-mathlib-pin.sh` end-to-end on Lean 4.15.0 + a real Mathlib4 commit) was deferred to v1.49.578 (substantive close at `520419af8` 2026-04-26). **Forward operational rule:** load-bearing toolchain pins should land as placeholder + procedure in the milestone that introduces them, with substantive verification scheduled for the immediate next milestone. The "placeholder + procedure" shape is honest — it says "this is the right pin shape; the actual hash is substituted at first verification" — and avoids blocking a research-absorption milestone on a runtime-environment dependency.

### 7. JP-010 split into (a) telemetry / (b) sample-budget

The user-locked decision at Part A → Part B handoff was: "JP-010 includes a measurement-step phase before calibration; instrumentation precedes the math." Implemented as JP-010a (commit `9ae20e756`, K telemetry hooks) shipping in the same wave as JP-005, with JP-010b (commit `6a5787736`, sample-budget calibration via BO autotune) shipping in a later wave. **Forward operational rule:** when a finding's calibration value (e.g., K, ε, budget) depends on caller-side evidence that does not yet exist, split the finding into (a) instrumentation/telemetry and (b) calibration. (a) ships first; (b) ships when telemetry has captured ≥ N caller observations. Matches the JP-010 actual shipping pattern and avoids the failure mode of calibrating against synthetic defaults.

### 8. Self-review pass is now a normative closing-wave addendum

Commit `268950204` is the v1.49.577 self-review pass. Six findings (2 MEDIUM citation-overclaim + 4 LOW doc-comment drift) caught after the closing wave but before the version-bump merge. No behavioral change. **Forward operational rule:** every milestone with ≥ 5 new components or ≥ 100 net test delta opens a self-review pass after the closing inventory regen and before the version-bump merge. The pass focuses on (a) citation overclaims (does the docstring/code-comment claim more than the implementation delivers?) and (b) doc-comment drift (does the file header reference stale wave-N-placeholder behavior?). Behavioral changes are out of scope.

### 9. CLAUDE.md "External Citations" extension as single subsection

The 4 new anchors + 1 featured anchor landed in commit `57bce4bb2` as a single contiguous edit extending the existing "External Citations (CS25–26 Sweep)" section with a "JULIA-PARAMETER additions (v1.49.577)" subsection plus a "Mission-philosophical anchor (JULIA-PARAMETER)" sub-subsection. The single-edit shape preserves scannability at the top of CLAUDE.md. **Forward operational rule:** future research-absorption milestones extend the same "External Citations" section with their own dated subsection; do not create sibling sections. The dated-subsection pattern keeps citation provenance auditable while preventing top-of-file drift.

### 10. Mission package PDF as Part A intake artifact

The mission package (`julia-parameter-mission.pdf` 50–58 pages + `.tex` + `index.html` + source deep-dive markdown) landed via .zip from the user at intake (2026-04-25). The PDF served as the canonical Part A wave plan; the deep-dive markdown served as the canonical paper-tier scoring (370 → 87 indexed → 54 carded). **Forward operational rule:** when a research-absorption mission has been authored upstream, the .zip → `.planning/missions/<name>/` extraction is the correct intake; do not re-author the wave plan inside GSD. The mission's own §Wave 0–§Wave 3 structure is executed verbatim; STATE.md and ROADMAP.md update to reflect the milestone version, but the wave plan is read from the mission package, not regenerated.

---

*v1.49.577 forward lessons. Emitted to v1.49.578+ as carryover input for substantiation, future research absorption, and any vision-to-mission consumption that lands an "all candidates" Part B.*
