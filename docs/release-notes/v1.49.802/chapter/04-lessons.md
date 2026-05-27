# 04 — Lessons Learned: v1.49.802 Codification Ship

## 3 lessons promoted from candidate to ESTABLISHED (#10425–#10427)

These lessons formalize the candidate IDs accumulated across the T1.1 arc (v795-v801). Each lesson is now ESTABLISHED in the cumulative lessons-learned database and codified into a CLAUDE.md operative-discipline entry with a backing canonical doc.

### Bounded-learning calibration discipline (1 lesson, new domain)

**Lesson #10425 — Two-sided likelihood-ratio e-processes on bounded binary observations are insensitive to unanimous direction.**
Severity: MEDIUM. For observations strictly at `|x| = 1`, the two-sided likelihood-ratio statistic `cosh(λ·x) · exp(−λ²/2)` satisfies `cosh(λ) · exp(−λ²/2) ≤ 1` for every `λ > 0`, with equality only at `λ = 0`. No choice of `λ` rescues the statistic — it cannot reject under any amount of unanimous evidence. Use two one-sided e-processes at Bonferroni `α/2` each instead. Promoted from v795 candidate. Apply: every bounded-learning math choice; particularly when adding a new threshold class or extending the loop to continuous bounded observations.

The discipline also codifies the **math-check-before-test-fixture convention**: compute `E_n / E_{n-1}` under unanimous evidence by hand before writing the trip-point assertion. If the ratio is `≤ 1`, the construction is unfit for the signal.

### Architecture-retrofit patterns discipline (1 lesson, extends existing)

**Lesson #10426 — Cross-class registry extraction at the SECOND class instance, not the third.**
Severity: MEDIUM. When a primitive accumulates instances across multiple classes (e.g. threshold classes with different observation sources), extract the per-class registry at the SECOND class instance. At the first instance: premature — you don't yet know what's varying. At the third instance: the second class shipped using a temporary wrong-source measure, accumulating semantic confusion in documentation that has to be unwound. At the second instance: you know exactly what's varying — the contrast between two real instances determines the registry shape rather than projection from one or speculation about future ones. Promoted from v798 candidate. Validated three times consumer-side during v799-v801 (audit log, watch loop, summary). Apply: every SECOND instance of a class-typed family in the codebase.

Sits alongside #10414 (optional `ctx?` chokepoint retrofit) and #10416 (tolerant generators) under the Architecture-retrofit patterns umbrella. The trio answers different questions about retrofits:

- #10414 — how to add a chokepoint to N existing modules without breaking callers.
- #10416 — how to make a generator tolerant of partial input.
- #10426 — when (which instance) to extract a cross-class abstraction.

### Failure-mode contracts discipline (1 lesson, new domain)

**Lesson #10427 — Forensic/dashboard/observability surfaces fail silently; load-bearing surfaces fail loudly.**
Severity: MEDIUM. Every surface has a failure-mode contract — explicit or implicit. Accessory surfaces (logging, telemetry, dashboard sections, optional decorations) SHOULD fail silently — propagating their failures would either gate the load-bearing operation or pollute the operator-facing output. Load-bearing surfaces (operations the user is explicitly asking for; data that decisions depend on) MUST fail loudly with clear messages — hiding the failure means the user acts on wrong data without knowing it. Promoted from v799-801 three-instance candidate (audit-log write, watch-loop callback, /sc:status Step 5.5 subprocess). Apply: every accessory-vs-load-bearing design choice.

The discipline also codifies the **contract documentation convention**: explicit `// best-effort silent` or `// fail loudly` marker in the function/section docstring, paired with at least one test assertion that exercises the failure path. Surfaces without the paired test are stochastic — the next refactor may quietly invert the contract.

## Lessons-learned database state

- **Total lessons emitted to date:** 10427 (cumulative since corpus inception).
- **Lessons promoted this milestone:** 3 (#10425, #10426, #10427).
- **Lesson candidates closed:** 3 (#10425 from v795; #10426 from v798; #10427 from v799-801).
- **Open lesson candidate backlog:** 0 (drained).
- **Tentative observations carried forward:** 2 (watch-loop tear-down race from v800; chained-session architectural-tax break-even from v798→v799-801). Both await second-instance forward-shadow OR codification at a future ship.
- **Manifest entries in `tools/render-claude-md/disciplines.json`:** 15 → 17 domains; 65 → 68 lessons.
- **New canonical docs:** 2 (`docs/bounded-learning-calibration-discipline.md`, `docs/failure-mode-contracts.md`).
- **Extended canonical docs:** 1 (`docs/architecture-retrofit-patterns.md`).

## Lessons applied at v1.49.802 (from v1.49.795-801 and earlier)

- **#10412** (recon-first default) — applied: ~10 minutes of pre-ship recon on existing disciplines.json + v784/v790 codification chapter-sets surfaced the natural 3-cluster grouping (1 extension + 2 new domains).
- **#10415** (deferred-maintenance escalation) — applied: the 3-candidate backlog from the T1.1 arc crossed the v784/v790 codification threshold. Closing it at v802 honors the discipline being applied.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — applied to discipline-doc authorship: three separate canonical docs (not one mega-doc), each evolving independently. Rejected the "T1.1 lessons umbrella discipline" framing as premature aggregation.
- **#10424** (Adoption-refresh AFTER bump) — applied: T14 step 11 ordering. Ninth consecutive ship under the active gate.
- **#10426 candidate** — applied during ship itself: adding two new "classes" (Bounded-learning calibration; Failure-mode contracts) to disciplines.json IS the second-instance abstraction-extraction the lesson is about. Self-referential validation.
- **#10427 candidate** — applied to chapter-authoring conventions: codification chapter-sets use the same shape as the v784 and v790 codifications, where the structure itself is best-effort silent on render failures (regenerate is idempotent on re-run).

## Open lessons watchlist (apply at next opportunity)

- **#10425** (newly ESTABLISHED — Bounded-learning calibration) — apply at every bounded-learning math choice.
- **#10426** (newly ESTABLISHED — Architecture-retrofit patterns extension) — apply at every SECOND class instance of any class-typed family.
- **#10427** (newly ESTABLISHED — Failure-mode contracts) — apply at every accessory-vs-load-bearing surface design choice.
- **(tentative) watch-loop tear-down race** — apply at every long-running async primitive. Carry forward.
- **(tentative) chained-session architectural-tax break-even** — apply at the next multi-ship chained session. Carry forward.
- **FlagLookup extract** — non-lesson refactor opportunity; v803 is a natural place to bundle it if scope allows.

## Cross-discipline observation: codification ship is now well-grooved

v784, v790, and v802 are the three codification ships to date. The shape has converged:

1. Recon on the candidate backlog + existing disciplines.json + the most recent codification chapter-set surfaces the natural cluster-grouping in ~5-10 minutes.
2. Write 1 new canonical doc per new domain; extend existing canonical docs for fit-in lessons.
3. Update disciplines.json with new entries / extended entries.
4. Run `npm run render:claude-md` to regenerate CLAUDE.md (no hand-edits).
5. Author the 5-file chapter set (README + 00-summary + 03-retrospective + 04-lessons + 99-context).
6. T14 ship.

Three instances are not yet enough for a codification-ship-discipline (#10412 says recon-first, which already informs this every time). But the shape is now stable enough that a future v950-ish codification ship will likely follow the same pattern — promotable if it does.

## Forward backlog (post-v802)

| ID | Severity | Apply | Source | Status |
|---|---|---|---|---|
| (tentative) watch-loop tear-down race | NOTE | Long-running primitives MUST await in-flight callbacks during teardown. | v800 implementation | carry forward (1 instance) |
| (tentative) chained-session architectural-tax break-even | NOTE | Architectural-tax ship in multi-ship chain breaks even at 2nd consumer, net positive at 3rd. | v798→v799-801 observation | carry forward (1 chain) |

Lesson-candidate backlog: **0** (drained — first time since pre-v784).
