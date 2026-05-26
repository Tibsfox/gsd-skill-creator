# 04 — Lessons Learned: v1.49.784 Codification Ship

## 8 lessons emitted (#10409–#10416)

These lessons formalize the candidate IDs L781-1, L781-2, L781-3, L782-1, L782-2, L782-3, L783-1, L783-2 from prior ships' 04-lessons.md files. Each lesson is now ESTABLISHED in the cumulative lessons-learned database and codified into a CLAUDE.md operative-discipline entry with backing canonical doc.

### Ledger-driven work discipline (5 lessons)

**Lesson #10409 — Recon flips scope estimates more often than not.**
Severity: HIGH. When picking a wedge from a REVIEW ledger written as a sweep summary, dedicate the first ~15min to per-file recon. Verify scope, framing, and prior-art before writing the first line of code. The cost of recon is bounded; the cost of executing the wrong refactor is unbounded. Promoted from L781-1 candidate. Apply: every ledger-driven wedge.

**Lesson #10410 — Filename collisions and class-name collisions need separate ledger fields.**
Severity: MEDIUM. REVIEW ledger sweeps flagging duplicate `Store`/`Registry`/`Manager`/`Loader` files should report BOTH `filename_dups: ['foo.ts × 3']` AND `class_name_dups: [{name: 'FooRegistry', count: 2, paths: [...]}]`. The two are independent failure modes with ~10× fix-size delta. Promoted from L781-2 candidate. Apply: future REVIEW ledger sweep authoring.

**Lesson #10411 — Interface-conformance audits report a 3-way verdict.**
Severity: MEDIUM. When auditing an interface for conformance across N candidate types, each candidate's verdict must be ALREADY CONFORMS / SHOULD CONFORM / INTENTIONALLY DIFFERENT ROLE. The third verdict is just as load-bearing as the second — it prevents future re-flagging. Promoted from L781-3 candidate. Apply: every interface-conformance audit.

**Lesson #10412 — Recon-first discipline graduates from candidate to default.**
Severity: HIGH. Three consecutive milestones (v780, v781, v782) where ~15min of recon flipped the REVIEW ledger's framing materially. The pattern is not coincidence — REVIEW ledger sweeps are best-effort summaries without per-file inspection. They WILL mis-estimate scope, miss already-done work, and conflate distinct failure modes. Recon-first is now the DEFAULT discipline for ledger-driven work, not a candidate option. Promoted from L782-1 candidate. Apply: every wedge sourced from a planning artifact written as a sweep summary.

**Lesson #10413 — Audit rules classify by behavior, not by filename.**
Severity: MEDIUM. When authoring an audit rule for "files that do X," classify by the actual behavior signature (here: `import.*node:fs` presence), not by filename pattern. The filename is a hint at intent; the import statement is a fact about behavior. Discrepancies are common — at v782, 4 of 15 `*loader*.ts` files had no `node:fs` import. Promoted from L782-2 candidate. Apply: every audit-rule authoring task.

### Architecture-retrofit patterns discipline (2 lessons)

**Lesson #10414 — Optional `ctx?` parameter is the cheapest retrofit pattern for chokepoint introduction.**
Severity: MEDIUM. When introducing a security or invariant chokepoint to N existing modules with high call-site multiplicity, use the optional-parameter pattern. Three states emerge: undefined→legacy permissive (zero churn); defaultLoaderContext()→audit-only (rollout); restricted→enforced (production). Validated at v1.49.782 LoaderContext (11 modules / ~200 sites). Promoted from L782-3 candidate. Apply: every architectural chokepoint introduction.

**Lesson #10416 — Tolerant generators are the default for hand-authored ↔ generated round-trips.**
Severity: MEDIUM. When a generator runs on partial input, prefer skip-the-line over placeholder sentinels (`UNKNOWN`, `TODO`, `???`, `N/A`). Placeholders are visually indistinguishable from real values, make round-trip fragile, and mask the schema gap. Exception: defaulted fields (the default IS the right semantic answer) emit the default. Validated at v1.49.783 STATE.md normalizer fix. Promoted from L783-2 candidate. Apply: every template + generator pair where partial input is realistic.

### Deferred-maintenance escalation discipline (1 lesson)

**Lesson #10415 — Deferred-maintenance debt has a half-life; close it when the handoff escalates it.**
Severity: HIGH. The cost of deferred-maintenance debt is not the eventual fix — it's the silent test-suite drift + workaround documentation that accumulates while the fix is deferred. When a handoff escalates a deferred-maintenance item, close the wedge within 1-2 milestones. Forward-cadence engine-state work can wait one milestone; an open red `tests/integration/` test cannot. The pre-tag-gate's silent acceptance of a known-failing test is the alarm. At v1.49.783, a 45-min wedge closed a normalizer bug that had been load-bearing for ~5 months. Promoted from L783-1 candidate. Apply: every session start where a handoff lists a fix as 'escalated' or 'load-bearing'.

## Lessons-learned database state

- **Total lessons emitted to date:** 10416 (cumulative since corpus inception)
- **Lessons emitted this milestone:** 8 (#10409, #10410, #10411, #10412, #10413, #10414, #10415, #10416)
- **Lesson candidates closed:** 8 (L781-1, L781-2, L781-3, L782-1, L782-2, L782-3, L783-1, L783-2)
- **Open lesson candidate backlog:** 0 (drained)
- **Manifest entries in `tools/render-claude-md/disciplines.json`:** 10 → 13 domains; 49 → 57 lessons
- **New canonical docs:** 3 (`docs/ledger-driven-work-discipline.md`, `docs/architecture-retrofit-patterns.md`, `docs/deferred-maintenance-discipline.md`)

## Lessons applied at v1.49.784 (from v1.49.783 and earlier)

- **#10415** (deferred-maintenance escalation) — applied: this codification ship closes the 8-lesson backlog that had been escalated to "queued for codification" at v783. The discipline being codified is honored by the act of codifying it.
- **#10412** (recon-first default) — applied: ~5 minutes of pre-ship recon on existing disciplines.json entries surfaced the natural 3-cluster grouping of the 8 lessons (vs the alternative 8-single-entry approach).
- **#10266** (granular bypass token) — N/A this ship: no new pre-tag-gate steps introduced.

## Open lessons watchlist (apply at next opportunity)

- **#10409–#10413** (Ledger-driven work) — apply at the next REVIEW ledger sweep + at the next audit-rule authoring task.
- **#10414** (Optional ctx? retrofit) — apply at the next chokepoint introduction.
- **#10415** (Deferred-maintenance escalation) — apply at every session start that begins with a handoff document.
- **#10416** (Tolerant generators) — apply at the next template + generator pair authoring task.
