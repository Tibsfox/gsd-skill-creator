# 04 — Lessons Learned: v1.49.656 Forward Lessons

## 2 forward lessons emitted (#10270–#10271)

### Inter-sibling depth-ratio lessons

**Lesson #10270 — Inter-sibling byte-ratio cascades from asymmetric multi-page uplift trigger predecessor-comparison FAIL even when all siblings exceed cohort baseline.**
Severity: MEDIUM. At v1.49.656 W3, 8 NASA pages were uplifted to add missing Track 3/4/5/7 cards. Per-page agent dispatches authored cards at variable depth (50-80 lines/card). After Wave 2, NASA 1.115 (~555 lines) trailed its predecessor 1.114 (~613 lines) at 91% lines / 76% bytes ratio — FAIL status in depth-audit's strict mode despite 1.115 being structurally complete and above the v1.108 cohort baseline. Targeted +25 line extension restored ratio. Apply: cross-page uplift work should specify per-page line/byte targets explicitly to avoid the cascade. Consider `--composite-pass` flag in pre-tag-gate step 6 to allow graceful byte-density variance when lines + sections are healthy.

### Counter-cadence cadence lessons

**Lesson #10271 — Counter-cadence trio (infra + content-half-1 + content-half-2) is the established pattern for multi-component cross-track drift class closure.**
Severity: MEDIUM. v1.49.585 closed concerns-cleanup operational debt; v1.49.653 closed long-term roadmap; v1.49.654 (FA-652-11 infra) + v1.49.655 (FA-652-11 content) + v1.49.656 (NASA track-card sibling-class) is the THREE-MILESTONE TRIO closing one cross-track drift class. The trio executed in 24h wall-clock with 4 counter-cadence ships total (counting v1.49.653 as standalone). Reproducibility now at obs#1; pattern transfers to future cross-track drift events of comparable magnitude (≥8 affected pages + ≥3 missing structural elements).

## Lessons-learned database state

- **Total lessons emitted to date:** 10271 (cumulative)
- **Lessons emitted this milestone:** 2 (#10270, #10271)
- **Lessons applied at v1.49.656 (from prior milestones):**
  - **#10267** (reference-template + subject-data dispatch pattern) — applied at obs#2: 8 W2 dispatches landed cleanly via same prompt pattern as v1.49.655.
  - **#10268** (transient API retry policy) — not invoked: 0 API errors this session (vs 2 of 16 in v1.49.655).
  - **#10269** (forbidden-substring meta-statement gap) — applied: all prompts explicitly forbade meta-statements ABOUT the no-attribution policy; zero false-positive grep matches post-uplift.
  - **#10204** (apply-to-self discipline) — applied at obs#5: the NASA-track-card uplift fixes a class first surfaced post-v1.49.655, demonstrating the apply-discipline-immediately-after-emit pattern.
  - **#10265** (scaffold-then-fill two-milestone pattern) — extended to TRIO pattern at #10271.
  - **#10207** (composite-pass thresholds) — applicable but pre-tag-gate doesn't pass `--composite-pass` flag; candidate hardening for next ship-pipeline-discipline milestone.
- **Open lessons watchlist:**
  - **#10270** (inter-sibling byte-ratio cascades) — apply at any future multi-page uplift wave (specify per-page line/byte targets).
  - **#10271** (counter-cadence trio pattern) — apply at next cross-track drift class of similar magnitude.
