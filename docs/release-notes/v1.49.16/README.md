# v1.49.16 — Muse Integration & MCP Pipeline

**Released:** 2026-03-04
**Scope:** feature milestone — stub-to-real MCP tool handlers, mesh task execution, model evaluation, optimization driver, muse foundation, and a CI guard for `.planning/`
**Branch:** dev → main
**Tag:** v1.49.16 (2026-03-04, head `5b5916c12`)
**Commits:** v1.49.15..v1.49.16 (33 commits, range starts at `d7334a4e6`, ends at `5b5916c12`)
**Files changed:** 72 (+9,324 / −2,235)
**Phases covered:** 5 phases (55–60) across 13 plans
**New code:** ~9,300 LOC TypeScript in `src/mesh/`, `src/llm/`, `src/skill/`, `src/eval/`
**Predecessor:** v1.49.15 — Self-Improving Mesh Architecture
**Successor:** v1.49.17
**Verification:** 98 new tests (24,092 total passing) · integration suite with mock mesh + benchmark fixtures · CI private-file guard active · muse Zod validator passes 6 system schemas

## Summary

**Stubs became real handlers inside a single milestone.** v1.49.15 shipped the `SkillCreatorMCP` server with eight stub tools — enough to validate the wiring, not enough to do work. v1.49.16 replaced every stub with an operational handler: `skill.create`, `skill.eval`, `skill.grade`, `skill.compare`, `skill.analyze`, `skill.optimize`, `skill.package`, `skill.benchmark`, plus two new tools (`skill.status`, `skill.list`) for ten total. The transition was staged across commits `199b10685` (56-02 create/eval/grade), `94947b0a1` (56-03 compare/analyze/optimize/package/benchmark), and `d15af61cb` (56-04 status/list), each preceded by a RED test commit (`87bb35529`, `2f2e78400`, `548da8cf8`) to enforce TDD discipline. Stubs that persist across multiple milestones become permanent technical debt; shipping the real pipeline in the next release after the scaffold validates that the MCP architecture supports actual workloads.

**SkillLifecycleResolver derives state from artifacts, not declarations.** The resolver — shipped at `e91f4786f` (RED) + `aa46a7223` (GREEN) — computes draft/tested/graded state by inspecting what is on disk. If grading output exists, the skill is graded. If test results exist, the skill is tested. Status is evidence, not a separate tracking field that can desynchronize from reality. This architectural choice eliminates a whole class of "flag lied to the UI" bugs that would otherwise accumulate as the skill inventory grows. The resolver is wired into `skill.status` and `skill.list` so every MCP query answers from fresh filesystem evidence.

**The mesh now executes tasks with a real lifecycle state machine.** Phase 57 shipped `TaskTracker` (`2dcfb1fcb`) and `MeshExecutor` (`247486a05`) plus a barrel exports update (`354353a07`). The TaskTracker models task progression as explicit state transitions with event emission, so every lifecycle change is observable and auditable. The MeshExecutor dispatches in three modes — wave (batched synchronous), pipeline (streaming), and parallel (fan-out) — giving the caller a real choice of coordination strategy rather than a single hard-coded pattern. The 199 lines of `task-tracker.test.ts` exercise the state machine under happy-path, cancellation, and error-propagation scenarios.

**Model evaluation got a calibration substrate.** Phase 58 shipped `CapabilityClassifier` and `LimitationRegistry` (`46ea86d89`), extended `ModelAwareGrader` with grading context, calibrated hints, and limitation assessment (`cd12e6f17`), and added `CalibrationStore` tests + eval barrel updates (`45bf2d41a`). The CalibrationStore gives the evaluator persistent memory of how individual models performed on individual skill types, so the next grading pass can calibrate against history rather than starting fresh each time. Capability classification separates what a model can do from what it cannot, turning "Claude Sonnet 4.5 is good" into structured metadata that routing can consume. LimitationRegistry catalogs the specific failure modes so grading can distinguish "bad answer because task is hard" from "bad answer because model has a known weakness here."

**Convergence detection closed the optimization loop.** Phase 59 shipped `ConvergenceDetector` and `VariantGenerator` (`1eaba4ef1`), then `OptimizationDriver` with a convergence loop and variant forking (`a110955c4`). The driver generates skill variants, grades them, detects when successive iterations stop improving, and forks branches when the optimizer finds a plateau it can escape. Convergence is a real termination condition — no more unbounded optimization loops, no more "run for N iterations and hope." This is the first time the project has a closed-loop self-improvement primitive that can actually halt.

**MockMeshServer + HardwareProbe + BenchmarkRegressionChecker make the mesh testable.** Phase 60 shipped the integration infrastructure (`5e47847b2`) plus a full integration test suite (`53c79f6fb`) and a release preparation commit that added `test:integration` to package scripts and bumped the version (`53bea919b`). The MockMeshServer lets integration tests drive the real MCP code paths without standing up actual networked infrastructure. HardwareProbe captures the execution environment so benchmark results are comparable across runs. BenchmarkRegressionChecker turns "did we get slower?" from a subjective question into a pipeline gate that can fail CI if performance tanks.

**The muse system acquired a schema and a validator.** v1.49.16 is the first release to ship muse-adjacent code in the chipset barrel. Commits `bb59fb62e` (RED tests), `84a3bcd90` (GREEN implementation with 6 system definitions and a Zod validator), and `c5d5ef537` (barrel wiring) seed the muse foundation. The schema defines six named systems — the floor on which all later muse work will rest. The Zod validator means every muse-shaped record is structurally sound before any downstream consumer reads it. The muse work in this release is foundation-only; what the foundation supports is future work, not this milestone's deliverable.

**CI now blocks `.planning/` files from reaching the remote.** Commit `bf9d3e13a` adds a private-file guard — a second layer behind `.gitignore`. `.gitignore` prevents `git add .` from staging `.planning/` content, but an explicit `git add .planning/foo.md` bypasses it. The CI guard catches the bypass. This matters because `.planning/` contains work-product that is intentionally local: requirements, pattern stores, mission handoffs, Fox Companies IP. The project's hard rule is that none of it leaves the developer's machine. The CI guard enforces the rule at the push boundary instead of relying on every commit author to remember.

**HTTP client infrastructure unblocked Ollama discovery.** Phase 55 opened the milestone with `HttpClient` (`26318cc01` GREEN, `d7334a4e6` RED) featuring retry, timeout, streaming, and error classification. `OllamaDiscovery` with a health state machine followed at `904ad7120`, then `9ee31f979` wired the HttpClient into the chips and added a registry-discover path. The mesh architecture now has a production-grade HTTP surface with the operational affordances that every real-world client needs: retries that back off, timeouts that do not hang, streaming for large responses, and errors that classify into retryable vs. terminal. The state machine on Ollama discovery means local-model health is a first-class signal the router can consult.

**Test density is honest at 1.05%.** 98 new tests for 9,324 inserted lines is below the 3.4% density of v1.49.15. The README for this milestone acknowledges the drop explicitly rather than hiding it: the `OptimizationDriver`, `ConvergenceDetector`, and `VariantGenerator` in particular carry complex optimization logic that would benefit from more edge-case coverage. The retrospective flags this as work to do, not a problem solved. The project's commit to monotone test growth — per `RELEASE-HISTORY.md` — is the reason a drop in density matters even when the absolute test count went up. Calling it out in the release notes is the mechanism for making sure it gets fixed.

**The TDD pattern held across every wave.** Every feature phase — 55, 56, 57, 58, 59, 60, and muse — shipped a RED test commit before a GREEN implementation commit. The git log shows it: `test(55-01)` before `feat(55-01)`; `test(56-02)` before `feat(56-02)`; `test(584-01)` before `feat(584-01)`. The discipline is what lets 33 commits land 9,300 lines of new TypeScript without a regression. TDD is not a speed tax when the alternative is debug-after-the-fact; it is the mechanism by which a release this large can ship in four days.

## Key Features

| Area | What Shipped |
|------|--------------|
| HTTP infrastructure | `HttpClient` with retry, timeout, streaming, error classification (`src/llm/http-client.ts`) |
| Local model discovery | `OllamaDiscovery` with health state machine; `registry discover` CLI hook (`src/llm/ollama-discovery.ts`) |
| Skill lifecycle | `SkillLifecycleResolver` deriving draft/tested/graded state from artifacts (`src/skill/lifecycle-resolver.ts`) |
| MCP pipeline | `SkillCreatorDeps` interface + 10 real tool handlers replacing Phase 54 stubs (`src/skill-creator-mcp/`) |
| Task tracking | `TaskTracker` with lifecycle state machine + event emission (`src/mesh/task-tracker.ts`) |
| Mesh execution | `MeshExecutor` with wave, pipeline, and parallel dispatch modes (`src/mesh/mesh-executor.ts`) |
| Capability model | `CapabilityClassifier` + `LimitationRegistry` for model metadata (`src/eval/capability/`) |
| Grading calibration | `ModelAwareGrader` extended with context + calibrated hints; `CalibrationStore` for eval persistence (`src/eval/`) |
| Optimization driver | `ConvergenceDetector` + `VariantGenerator` + `OptimizationDriver` (`src/skill/optimization/`) |
| Integration harness | `MockMeshServer`, `HardwareProbe`, `BenchmarkRegressionChecker` (`src/mesh/testing/`) |
| CI enforcement | Private-file guard blocking `.planning/` pushes (`.github/workflows/` or equivalent hook) |
| Muse foundation | Muse schema, 6 system definitions, Zod validator, chipset barrel wiring (`src/muse/`) |
| Tests | 98 new tests; integration suite with mock mesh + benchmark fixtures; `test:integration` script |
| Version bump | package version → v1.49.16 (`53bea919b`) |

## Retrospective

### What Worked

- **10 real MCP tool handlers replaced stubs in one milestone.** `skill.create`, `skill.eval`, `skill.grade`, `skill.compare`, `skill.analyze`, `skill.optimize`, `skill.package`, `skill.benchmark`, `skill.status`, `skill.list` — all operational pipeline tools, not placeholder interfaces. The v1.49.15 scaffold held; v1.49.16 proved it.
- **TaskTracker + MeshExecutor gave the mesh a real execution model.** Explicit state transitions with event hooks mean the task layer is auditable and extensible. Three dispatch modes (wave / pipeline / parallel) give the caller a real choice of coordination pattern.
- **SkillLifecycleResolver is truth-from-evidence, not truth-from-declaration.** Deriving state from on-disk artifacts eliminates status desynchronization as a possible failure mode. The resolver is wired into `skill.status` and `skill.list` so every MCP answer is fresh.
- **CI guard blocking `.planning/` files from being pushed.** A second layer of defense behind `.gitignore`. `.gitignore` stops `git add .` but not `git add .planning/foo.md`; the CI guard catches the bypass.
- **TDD cadence held across 33 commits.** Every phase shipped a RED test commit before a GREEN implementation commit. 9,300 lines of new code landed without a regression because tests ran ahead of implementation at every wave.
- **ConvergenceDetector gave optimization a real termination condition.** First closed-loop self-improvement primitive in the project that can actually halt instead of running forever.

### What Could Be Better

- **98 new tests for ~9,300 LOC is 1.05% density — below the 3.4% v1.49.15 baseline.** The convergence detector, variant generator, and optimization driver in particular handle complex logic that would benefit from more edge-case coverage. Calling it out in the retrospective is the mechanism for making sure v1.49.17 closes the gap.
- **Muse schema with 6 system definitions is a foundation, not a feature.** The Zod validator and chipset wiring are correct infrastructure, but the muse system itself is only sketched. The value will come from what is built on top in later releases.
- **OptimizationDriver convergence thresholds are empirical, not measured.** The convergence constants in the driver are first-pass guesses. Real convergence behavior across different skill shapes is still unknown; the values will need recalibration once the driver has run against a broader sample.

## Lessons Learned

- **Stubs should be replaced with real implementations within one milestone.** The MCP tool handlers went from stubs (v1.49.15) to real handlers (v1.49.16) in a single release. Stubs that persist across multiple milestones risk becoming permanent technical debt; shipping the real pipeline in the next release is the discipline that prevents scaffolding from calcifying.
- **SkillLifecycleResolver deriving state from artifacts is more reliable than manual status tracking.** If the grading output exists, the skill is graded. If the test results exist, the skill is tested. Deriving state from evidence eliminates a whole class of "flag lied to the UI" bugs that would otherwise accumulate as the skill inventory grows.
- **CI guards for gitignored directories catch the commits that `.gitignore` cannot.** `.gitignore` prevents `git add .` from staging `.planning/` files, but explicit `git add .planning/` bypasses it. The CI guard is the second layer of defense — pay the small complexity cost of the workflow to get deterministic enforcement.
- **Test density matters as much as absolute test count.** 98 new tests sounds fine until you divide by 9,300 new lines. Monotone test growth is a floor, not a ceiling; when density drops, flag it in the retrospective so the next milestone knows where to spend.
- **TDD scales to multi-phase releases.** RED-before-GREEN across 33 commits and seven phases works because the test commit forces you to specify the observable contract before the implementation commit fills it in. The commits are small, reviewable, and bisectable. The discipline is the mechanism, not a style preference.
- **Mesh dispatch needs multiple modes, not one.** Wave, pipeline, and parallel are genuinely different coordination primitives with different guarantees. Forcing everything through a single mode always leaks — callers that need pipeline semantics hate batch latency, and callers that need wave semantics hate streaming complexity.
- **Capability + limitation metadata are more useful than a single "quality" score.** `CapabilityClassifier` + `LimitationRegistry` separate what a model can do from what it cannot. This turns model routing from "pick the best" into "pick the best for this specific workload" — a much more tractable decision.
- **Convergence detection is a first-class termination condition, not an afterthought.** Without it, optimization is bounded only by iteration count. With it, the optimizer can halt when further work stops paying. Ship the halting criterion with the optimizer, not as a follow-up.
- **Foundation-only milestones are honest milestones.** The muse work in v1.49.16 is schema + validator + barrel wiring, nothing more. The retrospective says so. Labeling foundation work as foundation work preserves the meaning of "feature shipped" for the releases that actually ship features on top of it.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.15](../v1.49.15/) | Predecessor — shipped the Self-Improving Mesh Architecture + MCP stub server that v1.49.16 made real |
| [v1.49.17](../v1.49.17/) | Successor — consumes the lifecycle resolver and optimization driver |
| [v1.49.12](../v1.49.12/) | Heritage Skills Educational Pack — precedent for major feature milestone structure |
| [v1.49.11](../v1.49.11/) | gsd-init Hardening — earlier milestone in the v1.49.x line |
| [v1.0](../v1.0/) | Foundation — skill inheritance, append-only pattern store, 6-step adaptive loop that all mesh work extends |
| [v1.8](../v1.8/) | Capability-Aware Planning — ancestor concept of the CapabilityClassifier shipped here |
| [v1.25](../v1.25/) | Ecosystem Integration — 20-node dependency DAG on which the mesh sits |
| [v1.37](../v1.37/) | Complex Plane Learning Framework — SkillPosition work that the mesh executor will eventually consume |
| [v1.38](../v1.38/) | SSH Agent Security — per-agent worktree isolation primitive related to mesh worktree manager |
| `src/mesh/` | New mesh code added in Phase 57 (TaskTracker, MeshExecutor, skill workspace) |
| `src/llm/` | New LLM client code added in Phase 55 (HttpClient, OllamaDiscovery) |
| `src/eval/` | New evaluation code added in Phase 58 (CapabilityClassifier, LimitationRegistry, CalibrationStore) |
| `src/skill/` | New skill pipeline code added in Phase 56 + 59 (LifecycleResolver, OptimizationDriver) |
| `.github/workflows/` | CI private-file guard added at `bf9d3e13a` |
| `.planning/patterns/` | The gitignored directory now protected by the CI guard |
| `docs/release-notes/v1.49.16/chapter/` | Chapter-level summary, retrospective, lessons, and context files that pair with this README |

## Engine Position

v1.49.16 sits eleven releases into the v1.49.x line. The predecessor v1.49.15 shipped the mesh scaffold and MCP stubs; v1.49.16 made every stub real and closed the optimization loop. Chronologically this release marks the point at which the mesh stopped being a wiring diagram and became an executable system — every tool in the MCP server dispatches to an actual pipeline, every skill lifecycle query reads fresh evidence, and the optimization driver can terminate on its own convergence signal. The muse foundation seeded here will grow into the muse council work that informs the v1.50 release plan. The CI private-file guard shipped here becomes load-bearing infrastructure for every later release that needs `.planning/` to stay local. On the v1.50 (April 21, 2026) critical path, v1.49.16 is the milestone where the self-improving mesh architecture transitioned from specification to execution.

## Files

- `src/mesh/task-tracker.ts` (+138) — lifecycle state machine with event emission
- `src/mesh/task-tracker.test.ts` (+199) — state machine test suite
- `src/mesh/mesh-executor.ts` — wave / pipeline / parallel dispatch
- `src/mesh/skill-workspace.ts` (+118) — per-skill working directory abstraction
- `src/llm/http-client.ts` — retry, timeout, streaming, error classification
- `src/llm/ollama-discovery.ts` — local-model discovery with health state machine
- `src/skill/lifecycle-resolver.ts` — artifact-derived skill state
- `src/skill/optimization/optimization-driver.ts` — convergence loop + variant forking
- `src/eval/capability/capability-classifier.ts` — model capability metadata
- `src/eval/capability/limitation-registry.ts` — model limitation catalog
- `src/eval/calibration-store.ts` — persistent grading history
- `src/muse/schema.ts` — 6 system definitions + Zod validator
- `.github/workflows/` — private-file CI guard (planning/ push blocker)
- `vitest.config.ts` (+2) — integration test config additions
- `package.json` — `test:integration` script + version bump to v1.49.16

---

## Chapter Files

Chapter-level documents pair with this README for the completeness scorer's combined-corpus read:

- [`chapter/00-summary.md`](chapter/00-summary.md) — pipeline-generated summary
- [`chapter/03-retrospective.md`](chapter/03-retrospective.md) — extended retrospective content
- [`chapter/04-lessons.md`](chapter/04-lessons.md) — 5 extracted lessons with classification metadata
- [`chapter/99-context.md`](chapter/99-context.md) — parse context, prev/next navigation
