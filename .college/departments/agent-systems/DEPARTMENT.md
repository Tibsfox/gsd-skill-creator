# Agent Systems Department

**Domain:** agent-systems
**Source:** May 2026 arxiv synthesis (60 papers) + June 2026 arxiv wave, across skill-design, multi-agent orchestration, code generation, and agent memory
**Status:** Active
**Purpose:** The structural vocabulary of LLM-agent systems — how skills are represented, how agents coordinate, how generated code is validated, and how long-lived memory consolidates. Five wings covering the 2026 frontier: representation, orchestration, code generation, memory, and integration.

## Wings

- Skill Design — Typed skill IR, knowing-doing gap, privilege boundary, counterfactual audit, evolution
- Multi-Agent Orchestration — Topology diagnostics, critique-and-route controllers, constraint state, two-timescale co-evolution
- Agentic Code Generation — Harness as substrate, execution-grounded selection, structured specs, dynamic autonomy
- Agent Memory — Consolidation, intent routing, tiered storage, content-addressed records, hybrid retrieval
- Integration & Evaluation — Episode packaging, pass-rate-blind audit, compliance traces, eval rubrics
- Security & Governance — Skill permission models, capability-vs-authorization gating, semantic tool transactions, supply-chain/resource attacks, governance decay under compaction, skill identity

## Entry Point

agent-skill-as-artifact

## Concepts

### Skill Design (20 concepts)
- agent-skill-as-artifact — A reusable procedural artifact that coordinates tools, memory, and runtime context (Zhou survey `2605.07358v1`)
- agent-skill-ir-compilation — Typed intermediate representation, compiled per target framework (SkCC `2605.03353v2`)
- agent-knowing-doing-gap — Orthogonality between latent tool-necessity representation and emitted action (`2605.14038v1`)
- agent-skill-privilege-boundary — Declared capability/permission surface enforced at selection and execution (FORTIS `2605.09163v2`)
- agent-counterfactual-audit — Paired-trace audit exposing behavioural changes invisible to pass-rate (CTA `2605.11946v1`)
- agent-capability-controlled-self-evolution — Self-evolution as privilege-escalation surface; affordances mutate freely, resource authority only via audited primitives (arXiv `2606.03895v2`)
- agent-compositional-behavioral-leakage — Composed prompt modules interfere via shared self-attention; editing one shifts another, invisible to pass/fail (arXiv `2606.26356v1`)
- agent-compositional-skill-evolution — Skill construction as create/improve/merge operators; specification-vs-generalization tension (arXiv `2606.06079v1`)
- agent-operational-anchor-preservation — Skill rewriting ≠ compression; cutting operational anchors raises runtime cost per task (arXiv `2606.09421v2`)
- agent-tool-contract-inference — Infer per-tool contracts (preconditions/effects/risk/cost) governing WHEN a tool is causally appropriate (arXiv `2606.07904v1`)
- agent-trace-to-skill-induction — Induce skills from interaction traces; decompose into workflow / execution-semantics / runtime-attachments (arXiv `2606.06893v1`)
- agent-in-weight-skill — Skill as hypernetwork-generated LoRA (arXiv `2606.06087v1`)
- agent-multimodal-skill-distillation — Novel acquisition-source axis (human tutorial media to a multimodal Skill Wiki) (arXiv `2606.29538v1`)
- agent-on-demand-tool-forging — Online tool-synthesis loop + decide-when-warranted gate, distinct creation axis from tool-contract-inference (arXiv `2606.01801v1`)
- agent-persistent-decision-history — Retain revision decision-trail as memory unit (process-as-memory), orthogonal to evolution operators (arXiv `2606.08671v3`)
- agent-same-capability-risk-retrieval — 'right family, risky sibling' retrieval failure (stale/missing-precondition/wrong-procedure), execution-risk angle distinct (arXiv `2606.10388v1`)
- agent-self-mutating-poisoning — NEW temporal/lifecycle poisoning threat (benign-then-mutates) not covered by static-injection shipped guardian (arXiv `2606.02540v1`)
- agent-skill-internalization — Skills absorbed into policy weights (opposite of skill-as-artifact) (arXiv `2606.02355v1`)
- agent-verifiable-skill-contract — Formal temporal-safety-proof contract gating evolution under untested conditions, distinct from empirical spec-gate (arXiv `2606.05395v1`)
- agent-label-free-skill-refinement — Distinct label-free diagnose-and-rewrite signal (arXiv `2606.10546v2`)

### Multi-Agent Orchestration (14 concepts)
- agent-coordination-surface — Architectural layer separating agent logic from information access (Nechepurenko & Shuvalov `2605.03310`)
- agent-spectral-topology — Rank-order predictor of robustness/consensus/drift via successor representation M = (I − γP)⁻¹ (Parks & Alharthi `2605.11453`)
- agent-constraint-drift — Loss/distortion of safety constraints across delegation, memory, tool use, audit (Li et al. `2605.10481`)
- agent-critique-and-route — Finite-horizon MDP controller replacing one-shot dispatch (Fang et al. `2605.08686`)
- agent-fast-slow-coevolution — Two-timescale adaptation: capability fast, topology slow (TacoMAS `2605.09539`)
- agent-latent-agent-communication — Agents exchange continuous representations (embeddings/hidden-states/KV) instead of NL tokens; cost vs interpretability (arXiv `2606.05711v2`)
- agent-selector-priority-arbitration — One-controlled-variable-per-agent + MIN/MAX selector networks resolve conflict via deterministic priority (arXiv `2606.30877v1`)
- agent-semantic-concurrency-control — Each agent's LLM adjudicates whether a shared-state write conflict is semantically real, vs lock/abort-retry (arXiv `2606.15376v1`)
- agent-governance-taxonomy — Six-dimension governance taxonomy broader than compliance-trace-check audit-only (arXiv `2606.31498v1`)
- agent-declarative-protocol-enactment — Reusable protocol grammar agents enact at runtime, adjacent to declarative-agent-control (arXiv `2606.05390v2`)
- agent-multi-order-communication — Multi-hop neighbor-evidence aggregation, orthogonal content axis to coordination-surface (arXiv `2606.02359v1`)
- agent-orchestration-meta-skill — Non-parametric evolvable orchestration, third path vs frozen/trained MAS (arXiv `2606.18837v2`)
- agent-plan-tensor-rank — Plan-content CP-rank measure vs communication-graph spectral-topology (arXiv `2606.16478v1`)
- agent-skill-incidence-composition — Skill-agent incidence matrix jointly determining composition and topology (arXiv `2606.19758v1`)

### Agentic Code Generation (13 concepts)
- agent-harness-as-substrate — Runtime substrate mediating between foundation model and environment; H0-H3 ladder (Zhong & Zhu `2605.13357v1`)
- agent-execution-grounded-selection — Behavioural evidence under diverse inputs dominates textual aggregation (Semantic Voting `2605.08680v1`)
- agent-structured-spec-gate — Refuse multi-file dispatch without typed schema or API contract (`2605.06445v1`)
- agent-dynamic-autonomy — Per-task-class autonomy that tightens on correction and loosens on clean runs (Hedwig `2605.11495v1`)
- agent-constraint-decay — Monotonic accuracy decline as non-functional constraint count grows (Dente et al. `2605.06445v1`)
- agent-causal-tool-frontier — Expose only the causally-sufficient next-step tools via precondition-effect contracts, not every relevant tool (arXiv `2606.06284v1`)
- agent-declarative-agent-control — NL skill files in the prompt drive the agent's own control flow; declarative vs imperative policy classes (arXiv `2606.06923v1`)
- agent-goal-state-inference — Infer candidate symbolic goals + ambiguity; clarification as a causal action against wrong-goal execution (arXiv `2606.16813v1`)
- agent-llm-as-code — Invert orchestration: a deterministic program owns the loop, the LLM is a callable component (arXiv `2606.15874v2`)
- agent-algorithm-steering — Cue-induced output-policy shift, orthogonal to execution-grounded-selection (arXiv `2606.04057v1`)
- agent-constraint-induced-tool-suppression — Distinct footgun (JSON-schema grammar masks suppress tool-call tokens) (arXiv `2606.25605v1`)
- agent-cost-aware-speculation — Speculative-execution scheduling with per-token pricing, no existing scheduling slug (arXiv `2606.07846v1`)
- agent-loop-specification — Externalized control-loop artifact distinct from harness-as-substrate (arXiv `2607.00038v1`)

### Agent Memory (27 concepts)
- agent-content-addressed-storage — Records keyed by content hash, immutable + dedupable; the Grove substrate (Zhou survey `2605.07358v1`)
- agent-intent-routing — Classify query intent before selecting retrieval strategy (Pre-Route `2605.10235v2`, MemFlow `2605.03312v1`)
- agent-memory-consolidation — Offline sleep-phase merge/decay + retrieval-time reconsolidation (`2605.08538v1`)
- agent-hybrid-retrieval — Combine BM25 lexical + dense embedding channels; retriever choice dominates generator choice (`2605.14503v1`)
- agent-engram-maturation — Per-record activation count + tier transition (cold/warm/hot) (`2605.08538v1`)
- agent-adaptive-retrieval-stopping — Training-free predicate halts iterative retrieval on answer-repeat + calibrated logit margin (arXiv `2606.13814v3`)
- agent-admission-time-hubness-gate — Write-side vector-memory poisoning defense: score vs sentinel queries, quarantine hub-like records (arXiv `2606.19692v1`)
- agent-answer-conditioned-information-gain — Score memory by answer-conditioned per-token log-likelihood lift, not success or lexical overlap (arXiv `2606.03329v1`)
- agent-decision-aware-context-selection — Rank context by expected effect on the next action, compress winners to typed memory cards (arXiv `2606.08151v2`)
- agent-memory-use-warrant — WHETHER to integrate retrieved (sensitive) memory is a warrant decision separate from retrieval accuracy (arXiv `2606.06055v1`)
- agent-temporal-supersession-memory — Timestamp facts + (S,R,O) supersession retires contradicted facts embeddings can't tell from duplicates (arXiv `2606.26511v1`)
- agent-bi-temporal-fact-invalidation — Valid-time/transaction-time contradiction resolution (arXiv `2606.09900v1`)
- agent-constraint-compatible-retrieval — Similarity surfaces constraint-violating evidence (negation/exclusion), distinct read-side failure (arXiv `2606.13204v1`)
- agent-context-proprioception — Models self-manage once per-block context metadata is surfaced (training-free interface), distinct from consolidation (arXiv `2606.30005v2`)
- agent-evolvable-context-units — Typed coverage-aware experience library (arXiv `2606.02304v1`)
- agent-experience-internalization-collapse — Iterative parametric internalization degrades capability (instance-level collapse), warns toward external memory (arXiv `2606.04703v1`)
- agent-hierarchical-memory-navigation — Detail-preserving top-down navigation (not lossy compression) (arXiv `2606.11680v1`)
- agent-index-side-reasoning — Relocate implicit-relation reasoning into an offline RL-built index, distinct axis from query-time concepts (arXiv `2606.16316v1`)
- agent-intention-graph-tool-discovery — Active open-world discovery via an evolving intention graph, distinct from intent-routing (arXiv `2606.16591v2`)
- agent-memory-depth — Access-vs-parametric-depth dichotomy (arXiv `2606.26806v1`)
- agent-memory-validity-gate — Read-side temporal-validity/supersession gate (arXiv `2606.26753v1`)
- agent-operator-vocabulary-thesis — Teachable thesis (capability bounded by typed-operator vocabulary) (arXiv `2606.06003v1`)
- agent-query-aware-graph-traversal — Query-conditioned relevance-gated spreading activation (arXiv `2606.30133v1`)
- agent-riemannian-memory-retrieval — Fisher-Rao/hubness fix that isotropic-embedding only diagnoses (arXiv `2606.18406v1`)
- agent-submodular-context-selection — Per-turn context-window packing (submodular relevance+diversity under budget), not a long-term-store concept (arXiv `2606.20047v1`)
- agent-transactive-memory — Cross-agent trajectory reuse as a shared corpus, bridges Agent Memory and orchestration (arXiv `2606.19911v1`)
- agent-compositional-kv-cache — Reusable composable KV caches + non-compositionality collapse (arXiv `2606.04557v1`)

### Integration & Evaluation (11 concepts)
- agent-episode-package — Post-execution artifact covering all eleven harness responsibilities (Zhong & Zhu `2605.13357v1`)
- agent-paired-trace-audit — Run with-skill / without-skill, align phases, emit SIP report (CTA `2605.11946v1`)
- agent-compliance-trace-check — SMT-validatable predicates derived from natural-language manuals (MANTRA `2605.06334v1`)
- agent-counterfactual-utility — Expected success-rate change from adding/refining/retiring a skill (SkillMaster `2605.08693v2`)
- agent-long-range-dependency — Stress benchmark over dependency depths 5-20 (AgentEscapeBench `2605.07926v1`)
- agent-evaluator-validity-audit — Audit the benchmark's own evaluator (brittle matching, judge drift, wrong ground truths) instead of trusting its scores (arXiv `2607.02577v1`)
- agent-silent-failure-taxonomy — 5-class mechanism taxonomy of agent errors whose signal never reaches a human despite dense gates (arXiv `2606.14589v1`)
- agent-skill-coverage-metric — Trajectory-based test-adequacy: which of a skill's instructions were exercised, and were they followed (arXiv `2606.20659v2`)
- agent-formal-agent-verification — Lean4 machine-checked workflow/trajectory verification, categorically different guarantee from runtime audits (arXiv `2606.06523v2`)
- agent-nugget-grounded-judging — Human-authored nuggets + LLM matching (division of labor to avoid rubber-stamping) (arXiv `2606.29033v2`)
- agent-safety-rule-evolution — Learned interpretable safety rules via CEGIS/ILP, distinct from static privilege-boundary (arXiv `2606.24245v3`)

### Security & Governance (6 concepts)
- agent-skill-permission-dual-plane — Skill as a security principal governed on two planes — reasoning-influence AND action side-effects — beyond the single action-surface privilege boundary (arXiv `2606.03024`) — SkillGuard
- agent-capability-gate-authorization — Exposing a tool is not authorizing the call; a fail-closed per-call value-authorization PDP/PEP defeats confused-deputy misuse (arXiv `2606.28679`) — ScopeGate
- agent-semantic-tool-transactions — Task-scoped commit/rollback/recovery/audit boundary over a tool sequence; the task, not the RPC, is the unit of containment (arXiv `2606.17573`) — Cordon
- agent-skill-resource-supply-chain — Malice hidden in a skill's auxiliary scripts/resources, and cross-modal prose-and-code attacks that evade text-only scanners (arXiv `2606.19191`, `2606.14154`)
- agent-governance-decay-compaction — Context compaction silently drops in-context safety constraints; constraint-pinning restores enforcement (arXiv `2606.22528`)
- agent-per-component-skill-identity — Locality-sensitive per-component (prompt/code/tools) fingerprint for skill lineage — recognition, not trust (arXiv `2606.31272`)

### June-2026 additional-scan T2 (27 concepts)

**Security & Governance**
- agent-isolated-planning-poison-defense — Quarantine a poisoned tool's descriptive influence on planning while keeping the tool callable, defeating cross-tool description poisoning (arXiv:2606.20922)
- agent-runtime-skill-spec-enforcement — Compile natural-language skill specs into SMT trace policies checked against the live execution trace (VIGIL) (arXiv:2606.26524)
- agent-least-privilege-tool-selection — Over-privileged tool choice as a safety axis; prefer the lowest sufficient-privilege tool, escalate only on demonstrated failure (arXiv:2606.20023)
- agent-joint-intent-harm-defense — Verify prompt intent AND response harm jointly behind a judge, catching attacks that split intent from harm (arXiv:2606.26377)
- agent-purpose-bound-tool-privacy — Route task-private data only to tools/sinks authorized for that purpose, auditing disclosure not just success (arXiv:2606.28061)
- agent-retriever-weight-editing-attack — Poison RAG by editing the retriever's parameters rather than the corpus — a model-centric threat surface (arXiv:2606.18310)
- agent-skill-scanner-evasion — Poisoned skills that slip past static text-first scanners via task-preserving stealth and cross-modal visual hiding (arXiv:2606.07943, 2606.18198)
- agent-model-dependency-audit — Reconstruct an LLM's provenance graph (data-gen/filtering/judging dependencies) from fragmented public artifacts (arXiv:2606.12385)

**Agent Memory**
- agent-anticipatory-memory — Organize memory around anticipated future use, not archival similarity, to escape recall's reachability bound (arXiv:2606.15405)
- agent-prospective-memory — Spontaneously act on a latent constraint at the right moment without an explicit triggering query (arXiv:2606.23459)
- agent-multi-factor-memory-valuation — Score memory value with a multi-factor utility function beyond similarity and recency (arXiv:2606.12945)
- agent-sharded-context-rolling-memory — The "lost-in-conversation" accuracy collapse when task-critical detail arrives piecemeal across turns (arXiv:2606.12941)
- agent-single-token-memory-compression — Replace each raw evidence item with one high-dimensional latent token instead of retrievable text (arXiv:2606.10572)
- agent-cache-preserving-context-edit — Constrain context mutation to preserve the KV-cache prefix, cutting long-horizon inference cost (arXiv:2606.17016)

**Multi-Agent Orchestration**
- agent-skill-collision-routing — Overlapping skill descriptions misroute the router; name the collision and rewrite to disambiguate (arXiv:2606.30775)
- agent-infrastructure-aware-orchestration — Route using live serving-infrastructure state (GPU load), not just task/model features (arXiv:2606.11440)
- agent-non-readable-inter-model-encoding — Pack semantics into compact human-unreadable text for model-to-model channels (BabelTele) (arXiv:2606.19857)
- agent-recursive-subagent-harness — Make the recursive unit a full agent harness (tools+execution+planning), not a bare model call (arXiv:2606.13643)

**Integration & Evaluation**
- agent-layer-isolated-eval — Decompose a deployed agent into a fixed layer taxonomy and evaluate each layer in isolation (arXiv:2606.11686)
- agent-building-to-the-test — Given a test oracle, agents optimize to pass it rather than deliver the request — a Goodhart failure (arXiv:2606.28430)
- agent-judge-prior-rigidity — LLM safety judges over-apply rigid priors and ignore supplied in-context information (arXiv:2606.07874)
- agent-workflow-convertibility — A taxonomy for migrating static "LLM+script" workflows into self-evolving agents without losing encoded knowledge (arXiv:2606.24598)

**Agentic Code Generation**
- agent-active-experimentalist — Training-free in-context self-improvement by actively designing and running experiments (HExA) (arXiv:2606.29315)
- agent-spec-anchored-drift-enforcement — Keep an evolving spec machine-readable and continuously coupled to code via automated drift enforcement (arXiv:2606.27045)
- agent-native-computer-use — Design programmatic/CLI interfaces for agents directly instead of mimicking human GUI interaction (arXiv:2606.03854)
- agent-exploration-skill-discovery — Continual robot skill discovery by writing and refining code-as-policy programs through physical exploration (ASPIRE) (arXiv:2607.00272)
- agent-productive-friction — Deliberately inject interactional resistance so users iterate and reflect rather than accept the first output (arXiv:2606.26626)

## Learning Path

1. agent-skill-as-artifact (start here) — what an agent skill IS
2. agent-skill-privilege-boundary — what a skill is ALLOWED to do
3. agent-coordination-surface — how agents talk to each other
4. agent-intent-routing — how requests find the right strategy
5. agent-harness-as-substrate — what the agent actually runs INSIDE
6. agent-execution-grounded-selection — how outputs are validated
7. agent-memory-consolidation — how state stays bounded over time
8. agent-constraint-drift — the failure mode that determines reliability
9. agent-paired-trace-audit — the pass-rate-blind audit gate
10. agent-fast-slow-coevolution — the two-timescale adaptation loop

## Calibration

Calibration models: pass-rate-blind paired-trace audit (CTA `2605.11946v1`) over a fixed 50-task probe bank covering each wing. Calibration measures behavioural drift across skill/agent revisions, not just task pass-rate.

## Cross-References

- **`coding/`** — algorithmic substrate for code-generation wing; pre-LLM-era foundations
- **`ai-computation/`** — mechanistic foundations for the knowing-doing gap and routing
- **`adaptive-systems/`** — fast/slow co-evolution as adaptive-system pattern
- **`critical-thinking/`** — counterfactual reasoning as audit primitive
- **`logic/`** — SMT validation for compliance-trace checks
- **`rosetta-core/`** — Five Rosetta concepts (Intent Routing, Constraint Drift, Execution-Grounded Selection, Memory Consolidation, Knowing-Doing Gap) anchor this department to the cross-cluster translation table

## Sources

This department's vocabulary is derived from 60 May 2026 arxiv papers — see `.planning/research/arxiv-may-2026-synthesis.md` for the master synthesis and the four per-domain syntheses for full citations — and extended by the June-2026 arXiv wave (concept IDs citing `2606.*`/`2607.*`), which added concepts to every wing on the 2026 LLM-agent-skill frontier. All concept IDs reference their primary paper by arxivId so the lineage is verifiable.
