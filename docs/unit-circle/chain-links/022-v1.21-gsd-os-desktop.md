# Chain Link: v1.21 GSD-OS Desktop

**Chain position:** 22 of 50
**Milestone:** v1.50.35
**Type:** REVIEW — v1.21
**Score:** 4.34/5.0

---

## Score Trend

```
Pos  Ver    Score  Δ      Commits  Files
 16  v1.15  4.38   +0.19        —    —
 17  v1.16  4.25   -0.13        —    —
 18  v1.17  4.34   +0.09        —    —
 19  v1.18  4.315  -0.025       —    —
 20  v1.19  4.35   +0.035       —    —
 21  v1.20  4.35   0.00         —    —
 22  v1.21  4.34   -0.01       106    —
rolling: 4.332 | chain: 4.287 | floor: 3.94 | ceiling: 4.50
```

## What Was Built

v1.21 is the first physical artifact users can interact with — a native desktop application for the GSD-OS. 11 phases (158-168), 34 plans, 50 requirements, 636 tests, 106 commits. The desktop is built on Tauri v2 with a Rust backend and Vite webview frontend.

**Core subsystems:**

- **WebGL2 CRT engine** — scanline rendering, barrel distortion, phosphor glow, chromatic aberration, vignette effects at 60fps. Five retro presets (Amber, Green, Blue, White, RGB)
- **32-color indexed palette** — OKLCH-based color generation with perceptual uniformity, 5 Amiga-era retro presets
- **Rust PTY terminal** — native pseudoterminal with xterm.js frontend, proper signal handling
- **Amiga Workbench WM** — window management with depth cycling (front/back), Amiga-style title bars
- **Three-screen calibration wizard** — guides user through CRT intensity, color balance, and scan rate settings
- **Boot sequence** — skippable animated boot with `prefers-reduced-motion` support
- **Accessibility auto-detection** — motion reduction, high contrast, font scaling auto-detected from system preferences

**Boundary:** Strict `src/` ↔ `desktop/` boundary enforced by convention — no Tauri API imports from `src/`, no Node.js imports from `desktop/`. First milestone to formally establish this architecture rule.

## Commit Summary

- **Total:** 106 commits
- Covers 11 phases across Tauri setup, WebGL shaders, color system, PTY terminal, WM, calibration, accessibility
- Largest by commit count at this chain position

TDD discipline maintained: 636 tests for 50 requirements = 12.7 tests/requirement. Visual aspects inherently untestable via unit tests (shader output, color perception); logic layer well-covered.

## Scoring

| Dimension | Score | Notes |
|-----------|-------|-------|
| Code Quality | 4.50 | Clean Rust/TS split; WebGL shaders well-structured; proper PTY signal handling |
| Architecture | 4.75 | Tauri v2 with strict src/desktop boundary; subsystems cleanly separated |
| Testing | 4.00 | 636 tests (12.7/req) but visual rendering inherently untestable; logic layer strong |
| Documentation | 4.25 | Boot sequence, calibration wizard, and accessibility behaviors documented |
| Integration | 4.50 | Desktop integrates PTY, WM, CRT, calibration, accessibility into coherent shell |
| Patterns | 4.25 | P4 promoted (Amiga metaphor → actual desktop UI); WebGL defaults unjustified |
| Security | 4.25 | Tauri sandboxing; PTY process isolation; accessibility auto-detection |
| Connections | 4.50 | First physical realization of Amiga metaphor introduced in v1.13 |

**Overall: 4.34/5.0** | Δ: -0.01 from position 21

## Pattern Assessment

| Pattern | Status | Evidence |
|---------|--------|----------|
| P1: CSS/style | STABLE | Desktop CSS uses token system from v1.20; consistent with dashboard |
| P2: Import patterns | STABLE | src/ ↔ desktop/ boundary enforced; no cross-boundary imports |
| P3: safe* wrappers | STABLE | Tauri invoke() calls wrapped with error handling |
| P4: Copy-paste | STABLE | Component templates consistent; no duplicated calibration logic |
| P5: Never-throw | STABLE | PTY errors surface to user; boot sequence handles failure gracefully |
| P6: Composition | IMPROVED | 8-layer desktop: OS → shell → WM → window → PTY → xterm → CRT → shader |
| P7: Docs-transcribe | N/A | No external documentation transcribed |
| P8: Unit-only | IMPROVED | P-008 confirmed: Amiga metaphor (v1.13 example) → actual WM implementation |
| P9: Scoring duplication | N/A | No scoring formulas |
| P10: Template-driven | STABLE | Five retro presets follow same calibration template |
| P11: Forward-only | STABLE | 106 commits with very low fix rate |
| P12: Pipeline gaps | STABLE | Calibration wizard → color system → CRT → PTY pipeline complete |
| P13: State-adaptive | STABLE | Desktop adapts to system preferences (motion, contrast) at startup |
| P14: ICD | N/A | Pre-P14 introduction |

## Key Observations

**Spring Terminal Principle embodied in design.** The boot sequence is skippable (safe), the retro aesthetic is approachable rather than alienating, and the watermark flow control with 60fps WebGL target is responsive. These three properties define the Spring Terminal design philosophy: safe, approachable, responsive.

**P-008 Example-to-Infrastructure Pipeline confirmed.** The Amiga Workbench introduced as a metaphor in v1.13 becomes an actual window manager in v1.21. The pattern: an example demonstrates feasibility, then infrastructure delivers the reality. Third observation promotes P-008 to confirmed pattern.

**src/desktop boundary is a first-class architectural rule.** No tooling enforces it — only convention. This is the strongest unjustified parameter in v1.21: the boundary is correct but its enforcement mechanism is weak. Future versions should add tooling (ESLint import rules, Vite aliases) to harden it.

**WebGL defaults are unjustified.** Scanline intensity 0.8, barrel distortion 0.15, phosphor persistence 50ms — these values create the "correct" CRT feel but have no documented derivation. A new developer adjusting them has no basis for evaluation. This is a textbook P-002 instance in the visual domain.

## Reflection

v1.21 delivers the project's first tangible interface — something users can actually run. The 4.34 score reflects a version that excels architecturally (Tauri's clean Rust/TS split, strict boundary) and in integration (all desktop subsystems work together) but is constrained by the inherent untestability of visual rendering and the unjustified parameters in visual configuration.

The -0.01 delta from position 21 is practically negligible — v1.20 and v1.21 score essentially the same despite v1.21 being far more ambitious (106 commits vs implicit lower count). This suggests the scoring system correctly weights quality-per-complexity, not absolute scope.

Rolling average of 4.332 at position 22 confirms the platform tier (positions 16-22) maintains consistent 4.25-4.38 quality through its most ambitious deliverable.
