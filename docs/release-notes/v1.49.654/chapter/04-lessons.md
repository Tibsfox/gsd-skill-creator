# 04 — Lessons Learned: v1.49.654 Forward Lessons

## 2 forward lessons emitted (#10265–#10266)


These lessons are added to the cumulative lessons-learned database for application by future milestones.

### Process / cadence lessons

**Lesson #10265 — Cross-track scaffold-then-fill is a two-milestone pattern.**
Severity: MEDIUM. Counter-cadence content backfills with substantial per-page authoring (≥500 lines × 16 pages) split cleanly into two milestones: (1) infrastructure + scaffold-marker introduction (this milestone), (2) parallel W2 content authoring with marker removal (next milestone). The scaffold tool produces minimal valid stubs; the content milestone replaces them via the same path. The split avoids "scaffold-and-fill in one ship" patterns that would either rush the content authoring or leave drift in the depth-audit. Apply at future cross-track drifts of comparable magnitude (≥4 missing pages requiring substrate-tracked depth).

### Gate-authoring lessons

**Lesson #10266 — Granular bypass token beats blanket bypass when the underlying drift is multi-track.**
Severity: MEDIUM. The new `SC_PRE_TAG_GATE_BYPASS=depth-audit-mus-elc` token narrows depth-audit's bypass scope to MUS+ELC tracks only, preserving NASA strictness. This pattern (granular bypass at single-component resolution) is preferred over blanket bypass when multiple tracks have independent drift profiles. Apply: when introducing a new SC_PRE_TAG_GATE_BYPASS token, prefer the most-granular form that still expresses operator intent.

## Lessons-learned database state

- **Total lessons emitted to date:** 10266 (cumulative since corpus inception)
- **Lessons emitted this milestone:** 2 (#10265, #10266)
- **Lessons applied at v1.49.654 (from v1.49.653 lesson-set and earlier):**
  - **L-04 closure (47 lessons COVERED)** — discipline-coverage audit reports zero gaps post-codification. Applies v1.49.653 L-04 forward-roadmap item directly.
  - **#10168** (counter-cadence pattern) — applied: this is the 3rd counter-cadence milestone in 2026 (v1.49.585 → v1.49.653 → v1.49.654).
  - **#10169** (gate-not-vigilance) — applied: the FA-652-11 drift is being converted to a gate (SCAFFOLD-PENDING-aware depth-audit) rather than a prose-only "remember to author MUS/ELC" reminder.
  - **#10170** (meta-test strategy) — applied: 54 tests verify the new behavior at introduction. The scaffold tool's own scaffold-marker emission is verified via tests.
  - **#10185** (CI-gate override enumerated CSV) — applied: granular bypass `depth-audit-mus-elc` continues the L-02 vocabulary pattern.
  - **#10193** (sub-agent toolkit lacks SendMessage) — applied: v1.49.654 is entirely Opus-main-context work; no W2 dispatches needed for this scope.
  - **#10204** (apply-to-self) — applied at obs#3: the scaffold-cross-track tool is a counter-cadence-discipline-introducing tool that gets its own tests + audit-coverage in the same milestone it lands.
- **Open lessons watchlist (apply at next opportunity):**
  - **#10265** (cross-track scaffold-then-fill two-milestone pattern) — applies directly at v1.49.655 W0 brief authoring.
  - **#10266** (granular bypass token) — apply when new pre-tag-gate steps are introduced.
