# Agent Systems Department

**Domain:** agent-systems
**Source:** May 2026 arxiv synthesis — 60 papers across skill-design, multi-agent orchestration, code generation, and agent memory
**Status:** Active
**Purpose:** The structural vocabulary of LLM-agent systems — how skills are represented, how agents coordinate, how generated code is validated, and how long-lived memory consolidates. Five wings covering the 2026 frontier: representation, orchestration, code generation, memory, and integration.

## Wings

- Skill Design — Typed skill IR, knowing-doing gap, privilege boundary, counterfactual audit, evolution
- Multi-Agent Orchestration — Topology diagnostics, critique-and-route controllers, constraint state, two-timescale co-evolution
- Agentic Code Generation — Harness as substrate, execution-grounded selection, structured specs, dynamic autonomy
- Agent Memory — Consolidation, intent routing, tiered storage, content-addressed records, hybrid retrieval
- Integration & Evaluation — Episode packaging, pass-rate-blind audit, compliance traces, eval rubrics

## Entry Point

agent-skill-as-artifact

## Concepts

### Skill Design (5 concepts)
- agent-skill-as-artifact — A reusable procedural artifact that coordinates tools, memory, and runtime context (Zhou survey `2605.07358v1`)
- agent-skill-ir-compilation — Typed intermediate representation, compiled per target framework (SkCC `2605.03353v2`)
- agent-knowing-doing-gap — Orthogonality between latent tool-necessity representation and emitted action (`2605.14038v1`)
- agent-skill-privilege-boundary — Declared capability/permission surface enforced at selection and execution (FORTIS `2605.09163v2`)
- agent-counterfactual-audit — Paired-trace audit exposing behavioural changes invisible to pass-rate (CTA `2605.11946v1`)

### Multi-Agent Orchestration (5 concepts)
- agent-coordination-surface — Architectural layer separating agent logic from information access (Nechepurenko & Shuvalov `2605.03310`)
- agent-spectral-topology — Rank-order predictor of robustness/consensus/drift via successor representation M = (I − γP)⁻¹ (Parks & Alharthi `2605.11453`)
- agent-constraint-drift — Loss/distortion of safety constraints across delegation, memory, tool use, audit (Li et al. `2605.10481`)
- agent-critique-and-route — Finite-horizon MDP controller replacing one-shot dispatch (Fang et al. `2605.08686`)
- agent-fast-slow-coevolution — Two-timescale adaptation: capability fast, topology slow (TacoMAS `2605.09539`)

### Agentic Code Generation (5 concepts)
- agent-harness-as-substrate — Runtime substrate mediating between foundation model and environment; H0-H3 ladder (Zhong & Zhu `2605.13357v1`)
- agent-execution-grounded-selection — Behavioural evidence under diverse inputs dominates textual aggregation (Semantic Voting `2605.08680v1`)
- agent-structured-spec-gate — Refuse multi-file dispatch without typed schema or API contract (`2605.06445v1`)
- agent-dynamic-autonomy — Per-task-class autonomy that tightens on correction and loosens on clean runs (Hedwig `2605.11495v1`)
- agent-constraint-decay — Monotonic accuracy decline as non-functional constraint count grows (Dente et al. `2605.06445v1`)

### Agent Memory (5 concepts)
- agent-content-addressed-storage — Records keyed by content hash, immutable + dedupable; the Grove substrate (Zhou survey `2605.07358v1`)
- agent-intent-routing — Classify query intent before selecting retrieval strategy (Pre-Route `2605.10235v2`, MemFlow `2605.03312v1`)
- agent-memory-consolidation — Offline sleep-phase merge/decay + retrieval-time reconsolidation (`2605.08538v1`)
- agent-hybrid-retrieval — Combine BM25 lexical + dense embedding channels; retriever choice dominates generator choice (`2605.14503v1`)
- agent-engram-maturation — Per-record activation count + tier transition (cold/warm/hot) (`2605.08538v1`)

### Integration & Evaluation (5 concepts)
- agent-episode-package — Post-execution artifact covering all eleven harness responsibilities (Zhong & Zhu `2605.13357v1`)
- agent-paired-trace-audit — Run with-skill / without-skill, align phases, emit SIP report (CTA `2605.11946v1`)
- agent-compliance-trace-check — SMT-validatable predicates derived from natural-language manuals (MANTRA `2605.06334v1`)
- agent-counterfactual-utility — Expected success-rate change from adding/refining/retiring a skill (SkillMaster `2605.08693v2`)
- agent-long-range-dependency — Stress benchmark over dependency depths 5-20 (AgentEscapeBench `2605.07926v1`)

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

This department's vocabulary is derived from 60 May 2026 arxiv papers — see `.planning/research/arxiv-may-2026-synthesis.md` for the master synthesis and the four per-domain syntheses for full citations. All concept IDs reference their primary paper by arxivId so the lineage is verifiable.
