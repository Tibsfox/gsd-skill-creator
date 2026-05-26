> Following v1.49.793 — _Shelfware Verdicts 5 + 6: Math Foundations Refresh Cluster CLOSED_, v1.49.794 ships as Deterministic Gate for #10424: Adoption-Refresh Overwrite Guard — closes the lone open lesson candidate from the v791 trip + promotes it to ESTABLISHED in the same milestone.

# v1.49.794 — Deterministic Gate for #10424: Adoption-Refresh Overwrite Guard

**Shipped:** 2026-05-26

Closes the only remaining lesson candidate (#10424) from the v793 backlog by converting the "run adoption-refresh AFTER bump-version" rule from a prose-in-handoff sequencing warning into a deterministic guard inside `tools/adoption-refresh.mjs`. The guard refuses to overwrite an existing `docs/ADOPTION-BASELINE-v${VERSION}.json` whose content would differ — unless `--force`. First-run writes (file absent) and idempotent re-runs (content matches) are unaffected; `--dry-run` skips the guard.

## What shipped

- **`tools/adoption-refresh.mjs`** — new `checkOverwriteGuard()` (compares disk content to proposed content; exits 3 with corrective guidance if overwrite would differ) + `--force` flag (overrides with WARN) + header docstring spec for the guard.
- **`tools/__tests__/adoption-refresh.test.mjs`** — 3 new tests: T9 (guard refusal), T10 (`--force` override), T11 (idempotent re-run succeeds without `--force`). Test count 8 → 11. All 11 pass first run.
- **`docs/static-analysis-tool-discipline.md`** — new section "Refuse to overwrite version-stamped baseline files (Lesson #10424 — ESTABLISHED, v794)" with the reference implementation, validation history (v791 trip → v792-v793 vigilance-hold → v794 gate), and the meta-principle (migrate prose warnings to gates after one trip + 2-3 sequential clean applications).
- **`tools/render-claude-md/disciplines.json`** — static-analysis-tool-authoring entry: `key_lessons` adds `#10424`, summary line extended, codified-at-milestone extended with "v1.49.794 (extended with #10424 refuse-to-overwrite guard)".
- **`CLAUDE.md`** — regenerated via `npm run render:claude-md` (gitignored — local only). `--check` confirms in-sync.
- **`.planning/PROJECT.md`** — Active milestone + Latest shipped release + Last updated frontmatter advanced.

## Through-line

The v791 trip was the textbook prose-in-handoff failure: 1 trip → 2 sequential clean applications under vigilance → vigilance won't scale to N+10. The cost of the trip (15-30s recovery + cognitive load on the next 2 ships' operators) outweighs the cost of the gate (~30 min to install). The deferred-maintenance discipline (#10415, codified at v784) said "close escalated wedges within 1-2 milestones" — #10424 entered v794 at exactly milestone-3 since emit. The gate lands the same ship as the candidate's ESTABLISHED promotion, which is the cleanest possible closure: rule becomes code; candidate becomes formal ID; the candidate-backlog goes empty.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5. v794 is forward-cadence operational-debt closure.

## Audit roadmap progress

| Item | Status |
|---|---|
| T1.4 — PROJECT.md GAP table refresh | Delivered at v785 |
| S5 — PROJECT.md normalizer | Delivered at v785 |
| T1.2 ship 1-6 — Adoption telemetry + cluster verdicts (6/6) | Delivered v786-v793 |
| Path A — NASA 1.178 IBEX | Delivered at v788 |
| Path A meta — Codification of v785-v789 lesson cluster | Delivered at v790 |
| **Path E — #10424 deterministic gate + ESTABLISHED promotion** | **Delivered at v794 (this ship)** |
| T1.1 — Bounded-learning calibration loop | OPEN — 4-6 ships (NEXT, operator confirmed) |
| T1.3 — College of Knowledge consumer engine | OPEN — 3-5 ships |
| S3 — Codify the meta-cadence | OPEN |
| S4 — Public surface separation | OPEN |
| S6 — Self-evidence loop for security disciplines | OPEN |
| S7 — Counter-cadence cadence | OPEN |

## Lesson-backlog state (lifecycle close)

| At | Lesson candidates | Notes |
|---|---|---|
| v789 close | 7 | Backlog at codification threshold |
| v790 close | 0 | Drained: 7 promoted to ESTABLISHED |
| v791 close | 1 (#10424) | New candidate from v791 trip |
| v792 close | 1 (#10424) | Held clean (1st sequential application) |
| v793 close | 1 (#10424) | Held clean (2nd sequential application) |
| **v794 close** | **0** | **#10424 → ESTABLISHED + gate installed** |

## Next forward candidates

- **Path A — T1.1: Bounded-learning calibration loop** (4-6 ships; operator confirmed as next).
- **Path B — T1.3: College of Knowledge consumer engine** (3-5 ships).
- **Path C — NASA 1.179** (INTERSTELLAR-BOUNDARY obs#3, 1 ship).
- **Path D — Strengthening Levers** (S3, S4, S6, S7).

---
**Prev:** [v1.49.793](../v1.49.793/00-summary.md) · _(current tip)_
