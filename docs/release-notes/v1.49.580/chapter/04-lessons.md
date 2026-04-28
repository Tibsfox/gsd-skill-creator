# v1.49.580 -- BAYES-SEQUENTIAL-MV -- Forward Lessons (Emitted to v1.49.581+)

## Lessons Forward

### 1. Release-notes 5-file structure is now a HARD ship gate

v1.49.580 (and v1.49.577 + v1.49.578 + v1.49.579) shipped without the canonical `docs/release-notes/v1.49.<N>/` 5-file structure (README.md + chapter/00-summary.md + chapter/03-retrospective.md + chapter/04-lessons.md + chapter/99-context.md). The drift was caught at v1.49.581 ship and is being remediated by 1-day-late backfill. **Forward operational rule:** every dev-line milestone ship MUST include the full 5-file release-notes structure BEFORE tag-push. The release-notes authoring step is part of the closing wave (W6), not an after-tag housekeeping pass. v1.49.581 + v1.49.582 already operate under this rule; v1.49.583+ inherits it. (Same lesson as v1.49.582 forward lesson #12; restated here for the v1.49.580 backfill record.)

### 2. CI gate every wave-close on full `npm run build`, not just `npx vitest run`

The v1.49.580 CI fix (`46c912891`) was a `tsc` strict-mode catch on `as const` test fixtures that `vitest` accepted locally. **Forward operational rule:** every wave-close commit must pass `npm run build` (full tsc + vitest), not just `npx vitest run`. The local-test-vs-CI-test divergence is a tooling gap that costs one extra commit when it bites; gating wave-close on the full build avoids the extra commit and keeps the closing wave atomic.

### 3. Conjugate-by-construction stays the architectural floor for `src/bayes-ab/`

v1.49.579 + v1.49.580 have both held the conjugate-by-construction floor: closed-form posterior updates, no Monte-Carlo for the update itself. **Forward operational rule:** future extensions to `src/bayes-ab/` (continuous-multivariate priors, hierarchical priors, time-varying priors) should hold the conjugate-by-construction floor. When a use case genuinely requires non-conjugate inference (variational / MCMC), that lands as a separate `src/bayes-ab-approx/` directory rather than diluting the conjugate floor of `src/bayes-ab/`.

### 4. Function-name-and-body honesty is the architectural floor for `src/ab-harness/wasserstein-boed.ts`

v1.49.579 established that every named function in `src/ab-harness/wasserstein-boed.ts` either delegates to a real implementation in `src/bayes-ab/` or is removed. v1.49.580 preserves the rule: the multivariate code lives in `src/bayes-ab/`, not in `wasserstein-boed.ts`. **Forward operational rule:** any future Bayesian-A/B work continues to live in `src/bayes-ab/`; `wasserstein-boed.ts` only updates its `## Limitations` block as the multivariate frontier moves. The honesty-floor rule is restated in `src/ab-harness/wasserstein-boed.ts`'s preamble for v1.49.581+ readers.

### 5. Citation-anchored algorithmic gaps are translation tasks, not exploration tasks

The v1.49.577 `wasserstein-boed.ts` multivariate-gap footnote was framed as "a separate-paper algorithmic extension"; in execution at v1.49.580 it turned out to be ~10 commits of citation-anchored translation work. **Forward operational rule:** when a future milestone scope is "implement algorithm X from cited paper Y," estimate it as a translation task (waves = component count + 2 for tests + close), not an exploration task (waves = component count + 2 for tests + close + 2 for algorithmic-design-discovery). The discipline of authoring `01-vision-doc.md` as a thin layer over the citations is what makes this estimate-shape work.

### 6. Parallel surfaces beat unified surfaces when the special-case math reduces

`selectIpmBoedDesign` (1-D) and `selectIpmBoedDesignMv` (>=1-D) are parallel surfaces verified by numerical-equivalence tests, not collapsed into runtime dispatch. **Forward operational rule:** when a generalised-N case reduces to the special-case-N version under input equivalence, ship parallel surfaces and verify equivalence by tests. This keeps each surface readable on its own and makes future case-specific optimisations addable without touching the other surface. The pattern applies beyond `src/bayes-ab/` -- e.g., to future eligibility-trace + reinforcement work where the K=1 case may have its own optimised surface.

### 7. The mission package's DEFER table is a forward-citation slot

The v1.49.580 mission's DEFER table includes (a) multivariate Normal / Inverse-Wishart priors, (b) approximate-posterior methods for non-conjugate priors, (c) deterministic-Sobol projections, (d) GPU-accelerated SW. Each item has an explicit reason for deferral. **Forward operational rule:** when a future milestone arrives that addresses one of these DEFERs, the milestone vision-doc should cite back to v1.49.580's DEFER entry as the prior boundary marker. This converts the DEFER table from a one-way deferral into a forward-citation slot that future milestones inherit.

### 8. JP-002 anytime-valid gate generalises across dimensionalities cleanly

The same JP-002 e-process gate that v1.49.579 used on a 1-D posterior-shift metric works at v1.49.580 on a multivariate posterior-shift metric, with only the metric definition changing (`2 * |posteriorMean - priorMean|` -> `2 * sum_K |posteriorMean_K - priorMean_K| / K`, both clipped to [-1, 1]). **Forward operational rule:** future Bayesian-sequential code (continuous-multivariate, hierarchical, time-varying) should reuse the JP-002 gate verbatim and only contribute a metric-definition. This keeps the e-process gate as a single canonical surface that consumes a scalar-in-[-1,1] regardless of upstream model complexity.

### 9. The `wasserstein-boed.ts` open-items subseries reaches its natural close

v1.49.577 opened the wasserstein-boed.ts subseries (skeleton + multivariate-gap footnote). v1.49.578 substantiated the citation. v1.49.579 closed the function-name-and-body honesty gap. v1.49.580 closes the multivariate gap. The subseries reaches its natural close at v1.49.580. **Forward operational rule:** future open-items entries on `wasserstein-boed.ts` are net-new (not carried). The subseries does not have inherited open items into v1.49.581+. If a future use case surfaces a new gap (e.g., continuous-multivariate priors), that gap is opened fresh, not framed as a continuation of the wasserstein-boed.ts subseries.

### 10. 4-milestone-in-1-day sprints are the drift trigger to design against

The 2026-04-26 single-day sprint that closed v1.49.577 + v1.49.578 + v1.49.579 + v1.49.580 was the proximate cause of release-notes drift. **Forward operational rule:** multi-milestone single-day sprints are allowed but require explicit release-notes-authoring time at the end of each milestone in the sprint. If the sprint cadence does not allow time for release-notes authoring per milestone, the sprint should ship one-milestone-per-day instead. The structural fix is to make release-notes authoring a hard ship gate (lesson #1 above); the cultural fix is to recognise that ship cadence has a release-notes-authoring tax and to budget for it.

### 11. Backfilled release-notes carry an explicit "Backfilled" header

This release-notes set is backfilled 1 day late. The README.md and chapter/99-context.md both carry an explicit `**Backfilled:** 2026-04-27` header line that distinguishes it from a same-day-as-ship release-notes set. **Forward operational rule:** if a future ship requires release-notes backfilling, mark the backfill explicitly in the README.md + chapter/99-context.md headers; do not retroactively claim same-day authorship. This preserves the audit trail and makes the drift-and-remediation cycle visible to future readers.

---

*v1.49.580 forward lessons. Emitted to v1.49.581+ as carryover. Backfilled 2026-04-27 (1 day after ship).*
