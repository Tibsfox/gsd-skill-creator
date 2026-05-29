# v1.49.888 — Lessons

## Lessons emitted this ship

**None new.** All design decisions reused established patterns:

- **#10451** (calibrate-axis read-side wire recipe — 7-step pattern) — applied (3rd instance). Promotes from 2-instance ESTABLISHED to 3-instance STABLE.
- **#10439** (CLI manual + substrate auto-emit duality) — applied. Substrate auto-emit deferred for `token_budget.max_percent` per the staging discipline.
- **#10427** (failure-mode contracts) — applied. `appendTokenBudgetMaxEvent` is best-effort silent (forensic surface, mirrors v803/v837/v884).
- **#10426** (extract-at-second-instance) — applied (negative case). Per-threshold JSONL files (warn vs max) is the second-instance abstraction — there's no shared file abstraction extracted because polarity + decision shapes differ per member.

## Promotion-eligible candidates (carry-forward)

1. **`audit-log.test.ts` assertion-flip step** (1 instance v888). When the dispatcher's `wired: true` flips, any test asserting on the threshold's source `wired` field must flip too — including in test files unrelated to the threshold's events module. The #10451 recipe should call this out explicitly in step 6. Promotion-eligible on 2nd instance.
2. `module-singleton` wire shape (1 instance v881)
3. Audit-fidelity inline-literal extraction (1 instance v872)
4. Fake-fixture test pattern (3 instances; cross-cutting test-discipline home not yet created)
5. `git stash` cross-branch hazard (1 instance v883 session)
6. Codify-ship duration scales with composition (5 data points; inconsistent units; revisit at v900-ish codify ship)
7. Cross-audit tool sanity-fixture coverage (1 instance v885; corollary of #10450 but distinct)
