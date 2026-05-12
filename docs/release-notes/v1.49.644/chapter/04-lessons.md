# 04 — Lessons: v1.49.644 Cluster #11

## Emitted lessons

### Lesson #10208 — `npm-audit` probe threshold gap

**Surfaced at:** v1.49.644 W0 CF-16 probe execution

**Observation:** the `npm-audit` probe in `scripts/closure-verify-cf.mjs:probeNpmAudit` ran `npm audit --audit-level=high --json` unconditionally. The probe inferred status from `res.status` (npm's own exit code), which is `0` when no advisories at or above the threshold exist. The combination produced a silent false-negative for moderate-only CFs:

```js
// Before:
const res = spawnSync('npm', ['audit', '--audit-level=high', '--json'], ...);
const status = res.status === 0 ? 'resolved-upstream' : 'still-real';
```

If a CF was authored against moderate-only advisories (e.g., 2 moderate `protobufjs` vulns at the first W0 probe pass for CF-16), the probe always returned `resolved-upstream` → default routing rule = `retire` → CF mechanically closed despite real debt.

**Closure:** in-cluster sub-task at C3 path (i). Added `probe_args.severity` to the `npm-audit` probe with backward-compatible default `high`. cf-16.yaml gains `probe_args: { severity: moderate }` as the canonical apply-to-self example.

**Routing-rule override pattern:** before C3, the workaround was to declare `routing_rules: { resolved-upstream: proceed }` in the CF spec. This pattern is now obsolete for severity-driven CFs; the native threshold makes routing match probe semantics. The override pattern remains useful for OTHER probe shapes where the underlying probe's status mapping doesn't fit the CF's framing.

**Forward implication:** future CF spec authors should set `probe_args.severity` based on the CF's risk acceptance level rather than declaring a routing override.

**Discovery condition:** the gap survived 11 clusters of CF authoring because no prior CF was authored against moderate-only advisories. CF-16 was the first to test the boundary; the advisory escalation mid-W0 (moderate → high) prevented the gap from biting this cluster but the risk remained latent for any future moderate-only CF.

### Lesson #10208 status: EMITTED + CLOSED IN-CLUSTER

Same milestone surfaced + fixed. Apply-to-self test asserts the fix.

## Forward-noted observations (not emitted as formal lessons)

### Observation A — STATE.md normalizer-on-write integration

After authoring the v1.49.644 W0 STATE.md by hand, the v1.49.635 meta-test's STATE.md normalizer idempotency invariant failed. The drift was frontmatter-level (status string + Engine state line). Resolved by running `node tools/state-md-normalizer.mjs --write` once.

The forward improvement: integrate the normalizer into any STATE.md write flow so authors don't have to remember to run it manually. Cost ~10min of integration; benefit ~5min saved per cluster open + reduced test-failure noise.

**Why not emit formally?** This is a process improvement, not a structural finding. A future cluster can absorb it as a small W3 enhancement without formal lesson tracking.

### Observation B — Schema-discovery overhead in adapter work

When extending the cartridge adapter to handle Family A, ~15 minutes were spent understanding the per-skill / per-agent / per-team shape differences before the normalizer code was written. The migration spec doc at `.planning/cartridge-migration-phase2.md` listed Family A as `chipset:`-wrapped but didn't surface the SHAPE differences in skills (array vs map), agents (flat list vs `{topology, agents:[]}` block), and teams (`members` vs `agents` field).

The forward improvement: mission packages that route adapter expansion work should include a sub-section listing observed shape deltas BEFORE the normalizer task. Cost ~10min of upfront documentation; benefit ~15min saved in implementation time.

**Why not emit formally?** Adapter work is rare enough that this observation may apply only when it happens. Tracking it as a discipline doc seems over-investment.

## Cross-references to prior lessons load-bearing this milestone

| Lesson | Description | Application |
|---|---|---|
| #10180 | Skip-guard pattern recognition | (latent; not triggered) |
| #10187 | Mission package T1 commit OMITTED | applied — mission package never committed (gitignored + git-add-blocker) |
| #10191 | Ship-time directives atomic | will apply at T14 |
| #10193 | Sub-agent token ceiling + iterative dispatch | applied throughout (single-context execution; no sub-agent dispatch) |
| #10196 | Forward-note RECOMMENDATION discipline | applied at W0 operator decision-point framing |
| #10197 | STORY-gate pipeline ordering | will validate 7th consecutive at T14 |
| #10199 | Closure-verification gate (W0 §1.3) | applied — both CFs cleared mechanical gate |
| #10201 | git-add-blocker false-positive on compound | applied — all commits used split git-add + git-commit |
| #10202 | gh CLI background-task git-discovery | (latent; no background gh in this cluster) |
| #10204 | Self-applying discipline | LOAD-BEARING — C3 closes Lesson #10208 via apply-to-self |
| #10207 | §1.4 consistency at 4+ cluster threshold | NOT TRIGGERED (both CFs are fresh, 0-cluster carry) |

## Bayesian discipline update (per MISSION-PACKAGE-DISCIPLINE.md §1.6)

The v1.49.644 cluster confirms the closure-verification machinery handles fresh debt without revision. Add a Bayesian note for cluster-#12+ authors:

**Prior:** the discipline doc + probe tool were tuned to the specific debt patterns of the original v1.49.585 → .643 chain.

**Posterior after v1.49.644:** the machinery generalizes. Two fresh CFs of different shapes (npm vuln + cartridge adapter) closed without procedural friction.

**Implication for v1.49.645+:** authors should use the established closure-verification flow by default; revisit the discipline doc only when a CF type genuinely doesn't fit the existing probe shapes.
