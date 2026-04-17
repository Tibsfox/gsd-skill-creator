# v1.8 — Capability-Aware Planning + Token Efficiency

**Released:** 2026-02-08
**Scope:** 10-phase milestone — refactor SkillApplicator into a 6-stage pipeline, declare capabilities in phases/plans, optimize token consumption end-to-end
**Branch:** dev → main
**Tag:** v1.8 (2026-02-08T16:05:19-08:00) — "Capability-Aware Planning + Token Efficiency"
**Predecessor:** v1.7 — GSD Master Orchestration Agent
**Successor:** v1.8.1 — Audit Remediation (first adversarial audit against the v1.8 baseline)
**Classification:** milestone — 10 phases, 28 plans, 14/14 requirements satisfied
**Phases:** 52-61 (10) · **Plans:** 28 · **Requirements:** 14
**Files Changed:** 124 across the milestone window · **Insertions:** ~12,000 lines · **LOC at tag:** 90,447
**Verification:** 10/10 phase VERIFICATION.md passed · 10/10 integration points verified · 5/5 E2E flows complete · no tech debt recorded

## Summary

**Pipeline first, stages second.** The milestone's through-line is a single refactor: SkillApplicator becomes a pipeline, and every subsequent feature adds a stage instead of editing a monolith. Phase 52 extracted Score, Resolve, and Load as composable stages behind a `PipelineStage` interface. Phases 53 through 61 each shipped a new stage or a new feature that composes against the pipeline — BudgetStage (53), CacheOrderStage (57), ModelFilterStage (59), plus capability-aware injection (56), research compression (58), post-phase hooks (60), and a parallelization advisor (61). The ordering matters: pipeline first, budget second, everything else third. By the time cache-aware ordering landed in Phase 57, adding the stage was a three-file change because the composition surface was already there. This is the v1.0 "start with the loop, not the features" principle restated for a subsystem — get the composition right first, then each feature compiles in one's head.

**Capability-aware planning makes skills first-class.** Skills are now declared in the ROADMAP, not discovered as ambient context at runtime. Before v1.8, skills were found by scoring against the current plan's content — the loader looked at what the executor was doing and guessed what to bring. v1.8 inverts that: phases declare what capabilities they use, create, invoke-after, or adapt, and plans inherit those declarations through frontmatter. The `CapabilityDiscovery` service scans both global (`~/.claude/`) and project-local (`.claude/`) scopes, renders a deterministic CAPABILITIES.md manifest with content hashes for staleness detection, and the executor context is populated from the plan's declarations before the pipeline runs. The difference is the same as runtime type inference versus declared types: with declarations, planning errors are caught by validation (unknown capabilities produce warnings) instead of by reading the skill load order at runtime and wondering why `skill-X` didn't fire.

**Priority tiers make budget pressure honest.** Per-agent token budget profiles carry critical/standard/optional tiers; without tiers, budget exhaustion meant arbitrary skill ejection — whatever the sort put last got dropped. Phase 53 made the tiers explicit: critical-priority skills load even when standard budget is exhausted (up to a hard ceiling), standard-priority skills load within the normal envelope, and optional skills get whatever budget remains. The `budget-estimate` CLI reports the tier breakdown with 50/80/100% threshold warnings, and the `ApplyResult` now includes a `skipped` list with reasons so the user sees what didn't load and why. This lifts skill selection from "whatever fit" to "here's what the agent needs, in order of how much losing it would hurt."

**Research compression at 10-20x reduction, without losing the signal.** Research artifacts in this project routinely run 20-35 KB; the `compress-research` CLI distills them into 2-5 KB skill files that keep the actionable guidance. Staleness detection uses content-hash tracking between the source file and the derived skill — when the source changes, the derived skill is excluded from loading until regeneration. Manual skills always win conflicts with auto-generated ones, which means a human-authored skill is never silently overwritten by a regeneration pass. The compression pipeline and the staleness check are separate services (`ResearchCompressor`, `StalenessChecker`) so either can be replaced without disturbing the other.

**All green by the milestone's own gates.** Ten phases, 28 plans, 14 requirements, 10 verification passes, 5 E2E flows — all green. The milestone audit at `.planning/milestones/v1.8-MILESTONE-AUDIT.md` records 14/14 requirements satisfied, 10/10 phase verifications passed, 10/10 cross-phase integration points verified, and 5/5 end-to-end flows complete. No critical gaps, no non-critical gaps, no deferred tech debt. The initial audit caught five phases (57-61) missing VERIFICATION.md; a gap-closure pass ran the verifications in parallel via `gsd-verifier` agents and all five passed. This is the kind of completion profile that makes the follow-on v1.8.1 adversarial audit's eleven findings legitimately surprising — the milestone closed clean by its own gates, and the audit found what those gates didn't check (mock drift, `any` escape hatches, CLI input validation, path-traversal guards, a 1,500-line `main()`). v1.8 shipped a coherent architecture; v1.8.1 shipped the hygiene pass that the architecture needed to stay coherent.

## Key Features

| Area | What Shipped |
|------|--------------|
| Pipeline abstraction (Phase 52) | `SkillApplicator.apply()` reduced to < 25 lines, delegating to `SkillPipeline` with pluggable `PipelineStage` implementations (Score, Resolve, Load) |
| Token budget tiers (Phase 53) | Per-agent budget profiles with critical/standard/optional priority tiers; `BudgetStage` wired into the pipeline; `ApplyResult.skipped` carries reasons |
| Budget estimation CLI (Phase 53) | `budget-estimate` / `be` command reports per-tier token cost and fires 50/80/100% threshold warnings |
| Capability manifest (Phase 54) | `CapabilityDiscovery` scans global + project-local scopes; deterministic `CAPABILITIES.md` renderer with YAML frontmatter + markdown tables; content hashing for staleness |
| Phase and plan declarations (Phase 55) | ROADMAP.md phases declare `use`/`create`/`after`/`adapt` verbs over skills/agents/teams; plan frontmatter inherits declarations; `CapabilityValidator` warns on unknown references |
| Skill injection (Phase 56) | `SkillInjector` resolves `use`-verb capabilities to disk content at critical budget tier; executor context receives auto-injected skills without manual loading |
| Capability scaffolding (Phase 56) | `CapabilityScaffolder` generates scaffold tasks for `create`-verb capabilities — new skills/agents land in project-local `.claude/` and appear in CAPABILITIES.md on next regeneration |
| Cache-aware ordering (Phase 57) | Skills declare `cacheTier` (static/session/dynamic); `CacheOrderStage` reorders within relevance bands; deterministic tiebreaking preserves maxSkills cut quality |
| Research compression (Phase 58) | `ResearchCompressor` distills 20-35 KB research files to 2-5 KB skills (10-20x reduction); `StalenessChecker` blocks loading when source hash diverges; manual skills win conflicts |
| Model-aware activation (Phase 59) | Skills declare `modelGuidance` (opus/sonnet/haiku + minimum tier); `ModelFilterStage` gracefully skips (not errors) on mismatch; skipped-with-reason surfaces in ApplyResult |
| Post-phase invocation (Phase 60) | Phase `after`-verb capabilities fire automatically after verification passes; `PostPhaseInvoker` wired into the `verify-phase` workflow |
| Collector agent generation (Phase 60) | `generate-collector` / `gc` CLI produces read-only collector agents for context-efficient information gathering with compressed summary output |
| Parallelization advisor (Phase 61) | `advise-parallelization` / `ap` CLI analyzes plan dependencies, prints wave/conflict/warning output for wave-based execution recommendations |
| Workflow integration (Phases 54-60) | `new-project`, `new-milestone`, `execute-phase`, and `verify-phase` workflows updated; `gsd-executor` gains `injected_skills_protocol`; `gsd-planner` documents `capability_inheritance` + `create`-verb scaffolding |

## Retrospective

### What Worked

- **The 6-stage loading pipeline (Score → Resolve → ModelFilter → CacheOrder → Budget → Load) replaced monolithic skill loading with composable stages.** Each stage does one thing. Stages can be swapped, reordered, or extended independently. This is the right architecture for a subsystem whose loading requirements will keep evolving — every feature after Phase 52 was an additive stage or a consumer of an existing stage, not an edit to a god function.
- **Per-agent token budget profiles with priority tiers made resource allocation explicit.** Without tiers, budget pressure would force arbitrary skill ejection. With tiers, the system knows what to drop first and surfaces the drop list so the user can see it. `budget-estimate` giving threshold warnings at 50/80/100% turned a runtime surprise into a planning signal.
- **Research compression at 10-20x reduction is a force multiplier.** Large research documents consume token budget without proportional value; compression with staleness detection keeps the signal-to-noise ratio high and manual-wins conflict resolution keeps human-authored skills safe.
- **Capability declarations in ROADMAP.md + plan frontmatter lifted skills from ambient context to first-class planning concepts.** The declaration layer is what makes every downstream feature possible — without it, `SkillInjector`, `PostPhaseInvoker`, and the parallelization advisor would all be guessing. Validation catches typos at plan time rather than at runtime.
- **Pipeline-first ordering compounded.** By the time Phase 57 needed to add cache-aware ordering, the change was additive — a new `CacheOrderStage` plus an exported type. The pipeline infrastructure from Phase 52 paid for every subsequent phase's scope.
- **Parallel verification gap-closure worked.** The initial audit caught five phases missing VERIFICATION.md; running the missing verifications in parallel via `gsd-verifier` subagents closed the gap in a single pass and the re-audit returned passed across all dimensions.

### What Could Be Better

- **Cache-aware skill ordering depends on prompt-cache behavior that isn't a stable API contract.** Optimizing for cache hit rates couples the system to LLM implementation details; the `cacheTier` metadata is a hint, and any upstream change to how Anthropic's prompt cache segments content could blunt or invert its effect. The test here measures ordering determinism, not actual cache-hit improvement against a live model.
- **The parallelization advisor produces recommendations but the runtime can't act on them automatically.** `advise-parallelization` prints wave/conflict/warning output; wave-based execution itself isn't implemented in v1.8. Users still run phases sequentially. The advisor is a diagnostic, not a scheduler — v1.49's wave execution work is what eventually consumed these outputs.
- **Ten phases in one milestone is a lot of surface area to verify.** The initial audit missing five VERIFICATION.md files is a symptom; with ten phases landing across a short window, it was easy to lose track of which phases had been verified versus which were assumed-verified because they had passing tests.
- **Capability declaration syntax in ROADMAP.md is inherited from the planner's existing conventions rather than co-designed with v1.8's needs.** The verbs (`use`/`create`/`after`/`adapt`) cover the v1.8 cases but the grammar is positional and string-matched; future capability expansion (capability versions, capability dependencies, cross-project references) will need either a looser parser or a migration.
- **`ApplyResult.skipped` gained a `reason` string but not a structured reason code.** Downstream code that wants to branch on "skipped because budget" vs "skipped because model mismatch" has to parse the text. A reason enum would have cost nothing at the v1.8 schema point and would have paid for itself immediately in v1.8.1 tests.

## Lessons Learned

1. **Extract the pipeline first, add the stages second.** Phase 52's pipeline extraction was the highest-risk phase in the milestone (pure refactor, no new behavior, every later phase depends on it). Getting it done first meant every subsequent phase was additive. If Phase 52 had been inline with its consumers, each later phase would have carried a refactor cost.
2. **Declare what you need, don't discover it at runtime.** Capability declarations in phase/plan frontmatter caught unknown-capability typos at validation time that would otherwise have surfaced as silent skill-load misses during execution. Explicit declarations always beat implicit scoring when the set of candidates is known at planning time.
3. **Priority tiers are how you give budget pressure teeth.** Without critical/standard/optional tiers, "budget exceeded → drop skills" is an arbitrary sort. With tiers, it's a ranked contract. The `critical` tier's hard-ceiling guarantee (it loads even when standard budget is gone) is what makes the agent's core skills non-negotiable.
4. **Compression is valuable only when staleness detection is built in.** A compressed artifact that drifts from its source is worse than no compression — it's confident noise. `StalenessChecker` pairs with `ResearchCompressor` because neither is trustworthy without the other. Shipping the two services together forced the hash-tracking contract between them to be designed up-front.
5. **Manual wins conflicts over auto-generated.** The `source: auto-generated` vs hand-authored distinction in skill frontmatter lets a human always override the pipeline's output. Regeneration never silently stomps human intent. This is a policy that has to be encoded in the resolver, not trusted to author discipline.
6. **Graceful skip beats hard error for capability mismatches.** Model-mismatch skips (Phase 59) and budget-exceeded skips (Phase 53) both land in `ApplyResult.skipped` instead of throwing. The agent proceeds with whatever loaded; the user sees the drop list. Errors should be reserved for conditions the agent can't recover from.
7. **Verification gaps scale with phase count, not commit count.** Ten phases in one milestone is structurally harder to audit than three phases with more plans each. The missing-VERIFICATION.md finding on phases 57-61 was a phase-density problem. Future milestones with high phase counts should include a mid-milestone audit checkpoint, not just an end-of-milestone one.
8. **Determinism is a verification dimension, not a nice-to-have.** CAPABILITIES.md must render identically from the same source (Phase 54 success criterion). CacheOrderStage must produce the same order for the same inputs (Phase 57 success criterion). Building determinism tests into success criteria from the start made the integration tests at milestone close easy — every stage's output was already idempotent.
9. **An advisor is not an executor.** `advise-parallelization` prints what could be parallelized but doesn't parallelize anything; the runtime still serializes phase execution. Shipping advisory CLIs before runtime implementations is fine — they surface the plan-time signal early — but the scope line needs to be honest. v1.8 did not ship wave execution; it shipped a tool that recommends wave execution.
10. **Workflows need updating when capabilities change, and the update list is long.** Phases 54 and 60 touched `new-project`, `new-milestone`, `execute-phase`, `verify-phase`, `gsd-executor` docs, and `gsd-planner` docs. If you add a capability and don't update the workflows that consume it, the capability lands but isn't reachable. Integration point #9 in the milestone audit was specifically about this — the audit ledger made "workflows updated" a first-class check.
11. **Pure-refactor phases need the same verification rigor as feature phases.** Phase 52's success criterion "all existing tests pass without modification" is a behavior-preservation claim, not a behavior-change claim. Verifying it required reasoning about what the refactor *didn't* change as much as what it did. Treating the refactor as verification-worthy is what caught drift before it became Phase-53's problem.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Foundation — the 6-step adaptive loop. v1.8's pipeline refines the Apply step from a single function into six composable stages |
| [v1.1](../v1.1/) | Semantic conflict detection — embedding-based scoring that feeds the v1.8 pipeline's `Score` stage |
| [v1.5](../v1.5/) | Pattern Discovery — deepens the Observe → Detect pipeline whose output v1.8 declarations now reference by name |
| [v1.6](../v1.6/) | Cross-Domain Examples — the examples library that `SkillInjector` can resolve against |
| [v1.7](../v1.7/) | Predecessor — GSD Master Orchestration Agent. v1.8 makes the orchestrator capability-aware by giving it declarations and auto-injection instead of content-based guessing |
| [v1.8.1](../v1.8.1/) | Successor — first adversarial audit against v1.8. Eleven findings: mock drift, `any` escape hatches, CLI validation, path-traversal, 1,500-line `main()`, 37 hard-coded paths |
| [v1.9](../v1.9/) | Ecosystem Alignment & Advanced Orchestration — built on the v1.8/v1.8.1 clean baseline |
| [v1.10](../v1.10/) | Security Hardening — extends the `assertSafePath` groundwork that v1.8.1 laid over v1.8's stores |
| [v1.25](../v1.25/) | Ecosystem Integration — 20-node dependency DAG. Its declarative dependency model echoes v1.8's capability declarations |
| [v1.49](../v1.49/) | Mega-release consolidating post-v1.8 tracks; wave-based execution (the v1.8.61 advisor's target) lives here |
| `.planning/milestones/v1.8-MILESTONE-AUDIT.md` | Audit of record — 14/14 requirements, 10/10 phases, 10/10 integration, 5/5 flows |
| `.planning/milestones/v1.8-REQUIREMENTS.md` | Requirements archive — CAP-01..07 + TOK-01..07 with phase mapping |
| `.planning/milestones/v1.8-ROADMAP.md` | Archived roadmap with phase goals, dependencies, and success criteria |
| `src/capabilities/` | Capability types, discovery, renderer, parser, validator, injector, scaffolder, post-phase invoker, collector generator |
| `src/cli/commands/advise-parallelization.ts` | Parallelization advisor CLI (Phase 61) |
| `src/cli/commands/generate-collector.ts` | Collector agent generator CLI (Phase 60) |

## Cumulative Statistics

| Metric | Value at v1.8 close |
|--------|---------------------|
| LOC (total) | 90,447 |
| Files changed across milestone window | 124 |
| Insertions across milestone window | ~12,000 lines |
| Phases delivered | 10 (52-61) |
| Plans delivered | 28 |
| Requirements satisfied | 14/14 (100%) |
| Phase verifications passed | 10/10 |
| Cross-phase integration points verified | 10/10 |
| E2E flows complete | 5/5 |
| Pipeline stages available | 6 (Score, Resolve, ModelFilter, CacheOrder, Budget, Load) |
| New CLI commands | 5 (`capabilities`, `budget-estimate`, `compress-research`, `generate-collector`, `advise-parallelization`) |
| Test files covering v1.8 features | 14 |
| Commits in milestone window (approx.) | 60 |

## Engine Position

v1.8 is the milestone that made skills planning-native. v1.0 defined the loop; v1.1–v1.7 added capabilities one at a time; v1.8 rewrote the Apply step as a pipeline, pulled skill declarations up into the ROADMAP, and put the budget, model-guidance, and cache-ordering knobs into stages instead of into ad-hoc code paths scattered across consumers. Everything v1.9 and later did with capability evolution, cross-project sharing, and wave execution builds on the declaration layer and the pipeline seam this milestone established. The immediate follow-on, v1.8.1, is the first pause-and-audit in the project's history and remediates the hygiene debt that ten straight feature phases accumulated — it does not add capability, it cleans the foundation v1.8 shipped. Together, v1.8 + v1.8.1 form the clean baseline every later milestone inherits.

## Files

- `src/capabilities/index.ts` — barrel exports for capability types, discovery, renderer, parser, validator, injector, scaffolder, post-phase invoker, collector generator
- `src/cli/commands/advise-parallelization.ts` — parallelization advisor CLI (Phase 61, `ap` alias)
- `src/cli/commands/generate-collector.ts` — collector agent generator CLI (Phase 60, `gc` alias)
- `src/cli/commands/generate-collector.test.ts` — 6 tests covering generation, validation, frontmatter, tools
- `src/cli.ts` — router additions for `budget-estimate`, `compress-research`, `generate-collector`, `advise-parallelization`, `capabilities`
- `src/index.ts` — public API surface for Phase 60 services (PostPhaseInvoker, CollectorAgentGenerator)
- `.claude/get-shit-done/workflows/verify-phase.md` — post-phase invocation wired after `determine_status`, before `generate_fix_plans`; after-hooks fire only on passed verification
- `.planning/milestones/v1.8-MILESTONE-AUDIT.md` — audit of record (passed — 14/14 requirements, 10/10 phases)
- `.planning/milestones/v1.8-REQUIREMENTS.md` — CAP-01..07 + TOK-01..07 archived requirements with phase traceability
- `.planning/milestones/v1.8-ROADMAP.md` — archived roadmap with phase goals, dependencies, success criteria
- `docs/release-notes/v1.8/chapter/00-summary.md` · `03-retrospective.md` · `04-lessons.md` · `99-context.md` — chapter files published by the release pipeline

---
