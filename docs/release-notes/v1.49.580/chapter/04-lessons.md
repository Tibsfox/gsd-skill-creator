# Lessons — v1.49.580

16 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Release-notes 5-file structure is a HARD ship gate.**
   Every dev-line milestone ship MUST include README.md + chapter/00-summary.md + chapter/03-retrospective.md + chapter/04-lessons.md + chapter/99-context.md BEFORE tag-push. Restated as v1.49.582 forward lesson #12.
   _⚙ Status: `investigate` · lesson #10092_

2. **CI gate every wave-close on full `npm run build`, not just `npx vitest run`.**
   The local-test-vs-CI-test divergence is a tooling gap that costs one extra commit when it bites; gating wave-close on the full build avoids the extra commit and keeps the closing wave atomic.
   _⚙ Status: `investigate` · lesson #10093_

3. **Conjugate-by-construction stays the architectural floor for `src/bayes-ab/`.**
   Future extensions (continuous-multivariate, hierarchical, time-varying) hold the closed-form-update floor. When a use case genuinely requires non-conjugate inference, that lands as `src/bayes-ab-approx/`, not as a dilution of the conjugate floor.
   _⚙ Status: `investigate` · lesson #10094_

4. **Function-name-and-body honesty is the architectural floor for `src/ab-harness/wasserstein-boed.ts`.**
   Every named function in the file either delegates to a real implementation in `src/bayes-ab/` or is removed. The honesty rule is restated in the file's preamble for v1.49.581+ readers.
   _⚙ Status: `investigate` · lesson #10095_

5. **Citation-anchored algorithmic gaps are translation tasks, not exploration tasks.**
   When a future milestone scope is "implement algorithm X from cited paper Y," estimate it as translation work (waves = component count + 2 for tests + close), not exploration work. Authoring `01-vision-doc.md` as a thin layer over the citations is what makes the estimate-shape work.
   _⚙ Status: `investigate` · lesson #10096_

6. **Parallel surfaces beat unified surfaces when the special-case math reduces.**
   `selectIpmBoedDesign` (1-D) and `selectIpmBoedDesignMv` (>=1-D) ship as parallel surfaces verified by numerical-equivalence tests, not collapsed into runtime dispatch. Each surface stays readable on its own; future case-specific optimisations are addable without touching the other surface.
   _⚙ Status: `investigate` · lesson #10097_

7. **The mission package's DEFER table is a forward-citation slot.**
   When a future milestone addresses one of the deferred items (continuous-multivariate priors, approximate-posterior, deterministic-Sobol, GPU SW), the milestone vision-doc should cite back to v1.49.580's DEFER entry as the prior boundary marker.
   _⚙ Status: `investigate` · lesson #10098_

8. **JP-002 anytime-valid gate generalises across dimensionalities cleanly.**
   Future Bayesian-sequential code (continuous-multivariate, hierarchical, time-varying) reuses the JP-002 gate verbatim and only contributes a metric definition. The gate stays a single canonical surface that consumes a scalar in `[-1, 1]`.
   _⚙ Status: `investigate` · lesson #10099_

9. **The `wasserstein-boed.ts` open-items subseries reaches its natural close at v1.49.580.**
   Future open-items entries on the file are net-new (not carried). The subseries does not have inherited open items into v1.49.581+. If a future use case surfaces a new gap, that gap is opened fresh.
   _⚙ Status: `investigate` · lesson #10100_

10. **4-milestone-in-1-day sprints are the drift trigger to design against.**
   Multi-milestone single-day sprints are allowed but require explicit release-notes-authoring time at the end of each milestone in the sprint. If cadence does not allow time for release-notes authoring per milestone, ship one-milestone-per-day instead.
   _⚙ Status: `investigate` · lesson #10101_

11. **Backfilled release-notes carry an explicit "Backfilled" header.**
   If a future ship requires release-notes backfilling, mark the backfill explicitly in the README.md + chapter/99-context.md headers; do not retroactively claim same-day authorship. This preserves the audit trail and makes the drift-and-remediation cycle visible to future readers.
   _⚙ Status: `investigate` · lesson #10102_

12. **Release-notes drift.**
   This is the dominant retro item. v1.49.580 shipped on the same day as v1.49.577 + v1.49.578 + v1.49.579 (4-milestone single-day sprint). None of the four authored a `docs/release-notes/v1.49.<N>/` directory at ship time. Drift caught at v1.49.581 ship; remediated by 1-day-late backfill (this document is part of that pass). Forward operational rule: every dev-line milestone ship MUST include the full 5-file release-notes structure BEFORE tag-push. The release-notes authoring step is part of the closing wave (W6), not an after-tag housekeeping pass.
   _⚙ Status: `investigate` · lesson #10103_

13. **CI fix at the close, not before.**
   The W5 `as const` mistake should have been caught by the W5 commit's local `npm run build`, not by post-tag CI. The local-test-vs-CI-test divergence (vitest looser than tsc strict) is a known tooling gap; W5 ran vitest, not the full build. The fix in `46c912891` is the right surface, but the structural fix is to gate every wave-close commit on `npm run build` (full tsc + vitest) locally before push.
   _⚙ Status: `investigate` · lesson #10104_

14. **Mission directory naming drift.**
   On-disk mission directory `v1-49-580-multivariate-boed/` predates the post-v1.49.579 framing shift to `BAYES-SEQUENTIAL-MV`. The directory was not renamed when the framing shifted; both names are meaningful and refer to the same shipped work, but the drift is a minor traceability cost.
   _⚙ Status: `investigate` · lesson #10105_

15. **Cadence pressure causal chain.**
   The 4-milestone-in-1-day cadence was the proximate cause of release-notes drift; the CI-fix-at-close was the proximate cause of cadence pressure spilling into the final commit slot. If the cadence had allowed time for release-notes authoring per milestone, the sprint would have shipped one-milestone-per-day instead. The structural fix (lesson #1) makes release-notes authoring a hard ship gate; the cultural fix is to recognise that ship cadence has a release-notes-authoring tax and budget for it.
   _⚙ Status: `investigate` · lesson #10106_

16. **Type-fixture discipline gap.**
   The `as const` test fixture pattern is a TypeScript idiom that produces readonly tuples; the `DirichletPrior.alphas: number[]` interface expects mutable arrays. The mismatch is detectable at type-check time but not at vitest runtime. A lint rule banning `as const` on test fixtures that flow into mutable-array fields would catch this class of issue at edit time.
   _⚙ Status: `investigate` · lesson #10107_
