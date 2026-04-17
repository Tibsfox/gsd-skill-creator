# v1.1 — Semantic Conflict Detection

**Released:** 2026-02-04
**Scope:** validation layer — semantic conflict detection and activation likelihood scoring as the first extension of the v1.0 Apply step
**Branch:** dev → main
**Tag:** v1.1 (2026-02-04T20:36:47-08:00) — "Validation Enhancements"
**Predecessor:** v1.0 — Core Skill Management
**Successor:** v1.2 — Test Infrastructure
**Classification:** milestone — first post-foundation validation release
**Phases:** 4 (10, 11, 12, 13) · **Plans:** 13 · **Requirements:** 10
**Commits:** `ad8984a50..b3a94382e` (37 commits)
**Files changed:** 34 files · **Insertions:** 7,761 · **Deletions:** 24
**Verification:** 184 tests covering embeddings, conflicts, and activation · graceful degradation at every layer

## Summary

**v1.1 is the immune system for the v1.0 learning loop.** The foundation release defined the 6-step Observe → Detect → Suggest → Apply → Learn → Compose cycle, but nothing in v1.0 could tell whether two skills contradicted each other. Without a conflict check, the loop could happily converge on two skills that agree on nothing, each competing for activation on the same cue. v1.1 closes that hole. Four phases (10, 11, 12, 13) built the full semantic layer: local embedding infrastructure, a ConflictDetector that operates on embedding similarity rather than keyword matching, a heuristic ActivationScorer with a 0–100 output, and an optional LLM-based deep analysis that plugs into the same scoring contract. The tag message names it plainly: "Validation Enhancements."

**Local embeddings via HuggingFace transformers keep the loop free of API cost.** Phase 10 shipped the EmbeddingService backed by `all-MiniLM-L6-v2`, a small sentence-transformers model that runs entirely on the user's machine. No API key, no per-call billing, no network dependency at steady state. The model loads once and embedding becomes an in-process operation. The tradeoff is honest and documented — cold-start model loading adds seconds to the first invocation, and the library pulls in a non-trivial Python/WebAssembly runtime — but the total cost of ownership for a local quality gate that fires on every skill creation is zero dollars per run. The `reload-embeddings` CLI command (Phase 10.4) exposes a manual refresh path for when the catalog or the model changes.

**ConflictDetector uses embedding similarity plus configurable threshold, not keyword overlap.** Phase 11 built the ConflictDetector class on top of Phase 10's embeddings. The detector compares skill descriptions in semantic space, so two skills that describe the same behavior with no vocabulary overlap — "summarize long documents" vs "condense lengthy text" — still trigger a conflict. The threshold is a dial the operator controls: low threshold catches more false positives, high threshold catches fewer real conflicts. Phase 11 also shipped the ConflictFormatter for human-readable reporting and the RewriteSuggester with both LLM and heuristic modes, producing concrete remediation suggestions rather than bare warnings. The full `detect-conflicts` CLI command (Phase 11.4) wires the pipeline into the user-facing tool surface with --help handling.

**Activation likelihood scoring turns the Apply step into something measurable.** Phase 12 added ActivationScorer, a 5-factor heuristic that produces a 0–100 activation score for any skill against any prompt context. The factors are concrete: keyword overlap, semantic similarity, description specificity, scope alignment, and context signals. The scorer is deterministic — same inputs produce same score — so it can be used as a unit-testable part of the Apply step. ActivationFormatter renders the score for the CLI, and ActivationSuggester produces tiered recommendations (strong fit, marginal fit, skip). Phase 12.3 integrated the `score-activation` CLI command so the operator can ask "how likely is this skill to activate on this prompt?" and get a numeric answer with reasoning.

**LLM-based deep activation analysis is opt-in and gracefully absent by default.** Phase 13 added the LLMActivationAnalyzer class that calls the Claude API to simulate activation reasoning and produce a second, independent score alongside the heuristic. It is strictly optional: the `@anthropic-ai/sdk` is loaded via dynamic import so the dependency is absent when the API key is missing, the analyzer returns null on missing key / API error / malformed JSON rather than throwing, and the `--llm` flag on `score-activation` warns loudly if `ANTHROPIC_API_KEY` is unset or if the flag is combined with `--all` (batch mode). The scoring contract is shared: both the heuristic and the LLM analyzer produce the same `LLMAnalysisResult` shape with score, confidence, and reasoning, so the CombinedActivationResult just merges them. This is graceful degradation as a first-class design property, not an afterthought.

**184 tests are the load-bearing evidence for the release.** The tag message cites 184 tests covering embeddings, conflicts, and activation. The ConflictDetector, ConflictFormatter, RewriteSuggester, ActivationScorer, ActivationFormatter, ActivationSuggester, EmbeddingService, and LLMActivationAnalyzer each ship with their own comprehensive unit tests. The LLM analyzer tests use `vi.doMock` to simulate the SDK without requiring a real API key during test runs. The conflict detector tests exercise both the above-threshold and below-threshold paths explicitly. v1.1 establishes the pattern that every validation component ships with its own test file — a discipline that persists into v1.2 (Test Infrastructure) where it becomes formalized.

**v1.1 finishes the work v1.0 left open: the Apply step is now auditable.** v1.0 could load skills within a 2–5% token budget, but nothing verified that the loaded skills were mutually consistent or likely to actually activate. v1.1 added both checks. Every skill in the catalog can be conflict-checked against every other skill using the ConflictDetector; every skill can be activation-scored against any prompt using the ActivationScorer; and either score can be deepened with an optional LLM second opinion. The Apply step in v1.1 is no longer a black box — it has two measurable output dimensions (conflict risk, activation likelihood) and a CLI surface that exposes both to the operator.

## Key Features

| Component | What Shipped |
|-----------|--------------|
| EmbeddingService | Local embeddings via HuggingFace `all-MiniLM-L6-v2` — zero API cost, in-process after cold start (Phase 10.3) |
| Embedding types | `src/types/embedding.ts` foundation for semantic operations (Phase 10.1) |
| `reload-embeddings` CLI | Manual refresh for catalog or model changes (Phase 10.4) |
| ConflictDetector | Semantic conflict detection via embedding similarity with configurable threshold (Phase 11.1) |
| ConflictFormatter | Human-readable conflict reports with severity and context (Phase 11.2) |
| RewriteSuggester | Conflict resolution suggestions in LLM and heuristic modes — merge, deprecate, scope restriction (Phase 11.3) |
| `detect-conflicts` CLI | Full conflict-scan command with --help handling (Phase 11.4) |
| ActivationScorer | 0–100 heuristic score based on 5-factor analysis (Phase 12.1) |
| ActivationFormatter | Score rendering for CLI with verbose mode (Phase 12.1) |
| ActivationSuggester | Tiered recommendations — strong fit, marginal fit, skip (Phase 12.2) |
| `score-activation` CLI | Activation scoring command integrated into the CLI surface (Phase 12.3) |
| LLMActivationAnalyzer | Optional Claude-API-backed deep analysis with graceful null return on failure (Phase 13.1) |
| LLM analysis types | `LLMAnalysisResult`, `CombinedActivationResult`, `LLMConfidence` (Phase 13.1) |
| `--llm` flag | Opt-in deep analysis on `score-activation` with warn-on-missing-key, warn-on-batch-mode (Phase 13.2) |
| Dynamic SDK import | `@anthropic-ai/sdk` loaded only when API key present — zero dependency when absent (Phase 13.1) |
| Test coverage | 184 tests across embeddings, conflicts, and activation |

## Retrospective

### What Worked

- **Embedding-based conflict detection is the right approach.** Using `all-MiniLM-L6-v2` for semantic similarity avoids brittle keyword matching — two skills can conflict without sharing any words. Phase 11's ConflictDetector is the component this release is named after, and it behaves correctly on both the vocabulary-overlap and no-overlap paths.
- **Resolution recommendations (merge, deprecate, scope restriction) give actionable outcomes.** Detection without remediation would just generate noise. The RewriteSuggester (Phase 11.3) ships both LLM and heuristic modes so operators without an API key still get usable suggestions.
- **Graceful degradation at every layer is a shipped property, not an aspiration.** The LLM analyzer returns null on missing key, API error, or malformed JSON rather than throwing. The SDK is loaded via dynamic import so it is absent from the dependency closure when the key is missing. The `--llm` flag warns instead of failing. Every opt-in code path has a no-op fallback.
- **Four phases of sequential build (10 → 11 → 12 → 13) produced clean layering.** Each phase consumed only the prior phases' outputs. Embeddings are independent, conflicts depend on embeddings, activation depends on embeddings, LLM analysis plugs into activation's existing contract. No back-edits to earlier phases were required.
- **Tag-message-level traceability.** The v1.1 tag message lists the exact accomplishments, 4 phases / 13 plans / 34 files / 7,761 lines, and 184 tests. Every claim in this README can be verified against the commit log in the `v1.0..v1.1` range.

### What Could Be Better

- **Local embeddings add a heavyweight dependency.** HuggingFace transformers pulls in a significant runtime for what is essentially a quality gate. Cold-start model loading will become a test speed issue (and does — see v1.8.1's adversarial audit).
- **The similarity threshold is not auto-tuned.** The threshold for "these two skills conflict" is a configurable number, but v1.1 ships with a default and no telemetry to calibrate it against real skill catalogs. Tuning is deferred to whoever runs into the false-positive or false-negative wall first.
- **The 5 activation-scoring factors are hand-picked.** Keyword overlap, semantic similarity, description specificity, scope alignment, context signals — these are reasonable factors, but they were chosen by intuition rather than by measurement. A later release should calibrate the weights against actual activation decisions.
- **LLM-based activation analysis costs money and depends on network.** When `--llm` is used, every scored skill costs an API call. Batch mode is explicitly disallowed for this reason. The warning surface around cost is minimal — a future version should estimate cost before running.
- **No integration tests across the 4 phases yet.** Each component has unit tests, but there is no end-to-end test that creates a skill, runs conflict detection, scores activation, and asserts that the CLI output is consistent. The honest scope of v1.1 is the components; the gluing happens across v1.2 and beyond.

## Lessons Learned

1. **Conflict detection is a prerequisite for safe learning.** Without it, the v1.0 learning loop could converge on contradictory skills. This is the immune system for the adaptive layer, and it has to exist before the system is turned loose on real usage.
2. **Activation likelihood scoring with configurable thresholds gives operators control.** The threshold is the dial between false positives (annoying) and false negatives (dangerous). Shipping a dial instead of a hardcoded number means every operator can calibrate for their own tolerance.
3. **Local embeddings add a heavyweight dependency, and that is acceptable here.** HuggingFace transformers pulls in a significant runtime for what is essentially a quality gate. The tradeoff is zero per-call cost and full offline capability. Cold-start model loading will become a test speed issue — and does surface in v1.8.1 — but the steady-state behavior is right.
4. **Opt-in LLM analysis with graceful degradation is the correct default.** Making the Claude-API path opt-in via `--llm` and returning null on any failure mode means the tool works for users without API access and users without network access. The SDK-via-dynamic-import pattern keeps the dependency closure honest when the key is absent.
5. **Shared scoring contracts enable multi-source analysis.** The `LLMAnalysisResult` and `CombinedActivationResult` types let the heuristic and LLM analyzers produce output that merges cleanly. Designing the types before implementing either source prevented forked contracts and kept the CLI formatter simple.
6. **Phase layering matters more than phase count.** 4 phases is not a lot for a milestone, but because each phase only depended on prior-phase outputs (10 → 11, 12 | 12, 13), the build order was deterministic and no phase had to be reworked after a later phase shipped. Ordering pays more than count.
7. **Warn loudly on misconfigured opt-ins.** The `--llm` flag warns when `ANTHROPIC_API_KEY` is missing and when combined with `--all`. Failing silently on misconfiguration is worse than failing loudly — it erodes trust in every flag that has a fallback.
8. **Every validation component ships with its own test file.** ConflictDetector, ConflictFormatter, RewriteSuggester, ActivationScorer, ActivationFormatter, ActivationSuggester, EmbeddingService, LLMActivationAnalyzer — each has a `.test.ts` sibling. 184 tests total. This discipline is why the v1.1 layer is trustable and sets the pattern that v1.2 formalizes as Test Infrastructure.
9. **Dynamic imports protect the dependency closure.** Loading `@anthropic-ai/sdk` via dynamic import instead of top-level import means users without the API key pay zero cost for the LLM path — no module load, no memory, no import-graph bloat. This is the idiomatic way to ship optional heavyweight deps in TypeScript.
10. **The scorer is the dial, not the decision.** ActivationScorer outputs a 0–100 number; it does not decide whether to load the skill. The loading decision stays in the v1.0 Apply step with its 2–5% token budget. Separating "how likely is this to activate" from "should we load it" keeps both responsibilities testable in isolation.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Predecessor — Core Skill Management, the 6-step loop v1.1 extends |
| [v1.2](../v1.2/) | Successor — Test Infrastructure, formalizes the per-component test discipline v1.1 established |
| [v1.5](../v1.5/) | Pattern Discovery — deepens the Observe → Detect pipeline that v1.1 added validation to |
| [v1.8](../v1.8/) | Capability-Aware Planning — activation scoring gets surfaced into planning decisions |
| [v1.8.1](../v1.8.1/) | Audit Remediation (Patch) — surfaces the embedding cold-start cost v1.1 accepted as a tradeoff |
| [v1.10](../v1.10/) | Security Hardening — pays down debt around dependency closure and optional-SDK handling |
| [v1.25](../v1.25/) | Ecosystem Integration — conflict detection becomes part of the 20-node dependency DAG |
| [v1.49](../v1.49/) | Mega-release consolidating post-v1.0 tracks — v1.1's ConflictDetector remains load-bearing |
| `src/activation/` | ActivationScorer, ActivationFormatter, ActivationSuggester, LLMActivationAnalyzer, llm-activation-analyzer.test.ts |
| `src/conflicts/` | ConflictDetector, ConflictFormatter, RewriteSuggester and their tests (Phase 11) |
| `src/embeddings/` | EmbeddingService backed by HuggingFace `all-MiniLM-L6-v2` (Phase 10) |
| `src/types/activation.ts` | `LLMAnalysisResult`, `CombinedActivationResult`, `LLMConfidence` contracts |
| `src/types/embedding.ts` | Embedding type definitions (Phase 10.1 foundation) |
| `src/cli/commands/score-activation.ts` | CLI entry for activation scoring + `--llm` flag |
| `src/cli.ts` | CLI wiring for `detect-conflicts`, `score-activation`, `reload-embeddings` |
| `.planning/MILESTONES.md` | Canonical milestone detail referenced by the v1.1 tag message |
| `docs/release-notes/v1.1/chapter/03-retrospective.md` | Chapter-file retrospective (preserved) |
| `docs/release-notes/v1.1/chapter/04-lessons.md` | Chapter-file lessons (3 extracted lessons retained) |

## Engine Position

v1.1 sits one step past the zero-point. v1.0 defined the 6-step adaptive loop — Observe → Detect → Suggest → Apply → Learn → Compose — and every later version extends that loop rather than restructures it. v1.1 is the first such extension: it installs a validation layer around the Apply step, giving it two measurable output dimensions (conflict risk, activation likelihood) where v1.0 had a black box. The components v1.1 added — EmbeddingService, ConflictDetector, ConflictFormatter, RewriteSuggester, ActivationScorer, ActivationFormatter, ActivationSuggester, LLMActivationAnalyzer — all remain load-bearing into v1.49 and beyond; every release that touches conflict detection or activation scoring sits on top of them. The decision to ship both heuristic and optional-LLM modes from day one meant no later release had to retrofit a local-only path or an API-only path; both have always been present. The discipline of a sibling `.test.ts` per component (184 tests total) is the practice that v1.2 formalizes into "Test Infrastructure." In the v1.x line, v1.1 is the release that turned the Apply step from policy into measurement.

## Files

- `src/embeddings/embedding-service.ts` — HuggingFace `all-MiniLM-L6-v2` integration (Phase 10.3)
- `src/embeddings/embedding-service.test.ts` — EmbeddingService unit tests (Phase 10.3)
- `src/types/embedding.ts` — embedding type definitions (Phase 10.1)
- `src/conflicts/conflict-detector.ts` + `.test.ts` — semantic conflict detection (Phase 11.1)
- `src/conflicts/conflict-formatter.ts` + `.test.ts` — human-readable conflict reports (Phase 11.2)
- `src/conflicts/rewrite-suggester.ts` + `.test.ts` — merge / deprecate / scope-restriction suggestions (Phase 11.3)
- `src/activation/activation-scorer.ts` + `.test.ts` — 5-factor 0–100 heuristic scorer (Phase 12.1)
- `src/activation/activation-formatter.ts` — score rendering with verbose mode, later extended for LLM results (Phase 12.1, 13.2)
- `src/activation/activation-suggester.ts` + `.test.ts` — tiered recommendations (Phase 12.2)
- `src/activation/llm-activation-analyzer.ts` + `.test.ts` — optional Claude-API deep analysis with `vi.doMock` SDK simulation (Phase 13.1)
- `src/activation/index.ts` — activation module exports, docstring updated for LLM support (Phase 13.2)
- `src/types/activation.ts` — `LLMAnalysisResult`, `CombinedActivationResult`, `LLMConfidence` (Phase 13.1)
- `src/cli/commands/score-activation.ts` — CLI command handler with `--llm` flag (Phase 12.3, 13.2)
- `src/cli.ts` — wiring for `detect-conflicts`, `score-activation`, `reload-embeddings`
- `docs/release-notes/v1.1/chapter/00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md` — chapter files (preserved)
- `.planning/MILESTONES.md` — canonical v1.1 milestone detail referenced by the tag

---

_v1.1 shipped 2026-02-04 on commits `ad8984a50..b3a94382e` — 37 commits, 34 files, 7,761 insertions, 24 deletions, 184 tests. Tag message: "v1.1 Validation Enhancements." Full semantic conflict detection and activation likelihood scoring, installed as the first extension of the v1.0 Apply step._
