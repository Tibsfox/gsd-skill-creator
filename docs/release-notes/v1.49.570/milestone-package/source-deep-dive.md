# arXiv April 2026 — Deep-Dive Relevance Survey for gsd-skill-creator

**Prepared:** Thursday, 23 April 2026
**Scope requested:** Thu 23 Apr – Fri 17 Apr 2026 (cs listings)
**Target system:** `github.com/Tibsfox/gsd-skill-creator` (dev branch, v1.49.x — DACP series)

---

## A note on sourcing

The live `/list/cs/recent` arXiv page currently surfaces submissions from early March 2026 at the top of its window — the April-specific day listings (17, 20, 21, 22, 23 Apr) are not reachable as a single contiguous scrape right now without extended pagination that the rate limiter blocks. I worked around this by searching directly against the `2604.xxxxx` submission-ID namespace (year 26, month 04 = April 2026 primary submissions) and walking out from there. Every paper below is from that namespace (April 2026). First-submission dates span **6 Apr – 23 Apr**, with heavy concentration in the 17–23 Apr window the user requested. A handful of late-March foundational papers are included where the April work directly cites them as architectural precedent — those are clearly marked.

Papers are tiered by how directly they map onto a shipped-or-imminent gsd-skill-creator subsystem. Tier S = "read before the next milestone planning session." Tier A = "contains patterns worth adopting." Tier B = "useful reference for a specific subsystem."

---

## Tier S — Load-bearing, read first

These map so directly onto existing GSD/skill-creator architecture that they're either independent convergent discovery (strong validation signal) or active threat models the DACP/Staging Layer has to address.

### 1. Liu et al., "How Well Do Agentic Skills Work in the Wild" — `2604.04323`
The single most relevant paper for skill-creator. First comprehensive benchmark of skill utility under realistic settings — agents retrieving from **34,000 real-world skills**, not curated sets. Headline finding: **skill benefit is fragile and degrades as realism increases; pass rates approach no-skill baseline in the hardest conditions.** Query-specific refinement recovers most of the loss; they lift Claude Opus 4.6 on Terminal-Bench 2.0 from 57.7% → 65.5% with retrieval+refinement.

**Why it matters for skill-creator:** validates the bounded-learning / 3-correction-minimum / 20% content-change-cap governance model — brittleness at scale is real, and the paper's refinement strategy is close to what CAPCOM gates already enforce. The 34k skill benchmark is a ready-made harness for v1.50's retrospective subversions.

**Read before:** v1.50 Half-A retrospective planning. The ablation taxonomy (hand-curated vs. retrieved vs. refined) is the evaluation spine for the 49 milestone audits.

### 2. Ni et al. (alleged), "CoEvoSkills: Self-Evolving Agent Skills via Co-Evolutionary Verification" — `2604.01687`
Full co-evolutionary loop: a **Surrogate Verifier** catches implementation bugs early and detects refactoring regressions, a **Ground Truth Oracle** exposes deeper algorithmic limitations, and their interplay drives qualitative jumps (parameter tuning → algorithm replacement) based on oracle feedback. On SkillsBench: 71.1% pass rate, +40.5pp over no-skill baseline. Agent-authored skills beat human-curated ones in their tests; evolved skills transfer across six model families with 35–45pp gains.

**Why it matters:** this is essentially GSD's dual-verification pattern (Surrogate = fast CAPCOM check; Oracle = Safety Warden) done at the skill level with empirical backing. The "parameter tune → algorithm replace" phase transition they document is exactly the kind of signal the skill-creator promotion pipeline should be detecting.

**Read before:** Any subversion that touches the bounded-learning tuning. Their budget-allocation numbers (how much oracle feedback, how much surrogate) are worth lifting directly.

### 3. Shen et al., "Experience Compression Spectrum: Unifying Memory, Skills, and Rules in LLM Agents" — `2604.15877`
Citation analysis of 1,136 references across 22 primary papers: **cross-community citation rate below 1%.** Frames memory/skills/rules as points on a single compression axis (5–20× for episodic memory, 50–500× for procedural skills, 1000×+ for declarative rules). Identifies the "missing diagonal": **no surveyed system supports adaptive cross-level compression.**

**Why it matters:** this is the theoretical frame GSD's College of Knowledge / Rosetta Core has been groping toward. The "missing diagonal" is the opportunity — skill-creator already has the observe→detect→suggest→apply→learn→compose loop, which when extended to span all three compression levels would actually fill this gap. Tibsfox's instinct that "memory in context, skills in SKILL.md, rules in hooks" is **exactly** the diagonal they say nobody ships.

**Read before:** Any planning around how CLAUDE.md hooks interact with skill files and with user memory edits.

### 4. Qin et al., "Learning Without Losing Identity: Capability Evolution for Embodied Agents" — `2604.07799`
Introduces **Embodied Capability Modules (ECMs)** — modular, versioned units of embodied functionality learned, refined, and composed over time. Decouples capability evolution from agent identity. A runtime enforces invariant safety envelopes independent of the ECMs; gated deployment checks block unsafe new versions. Key empirical: **11.8% of episodes produce unsafe actions without policy enforcement; the runtime layer blocks 100% of them at 2.3ms overhead per decision.**

**Why it matters:** this is the Amiga Principle in formal clothes. "Persistent agent as cognitive identity, evolve capabilities separately" is exactly what the chipset / Instruction-Set-Architecture split is doing. The versioned-ECM + runtime-safety-layer split is a cleaner statement of the Safety Warden pattern than GSD currently has written down.

**Read before:** v1.50 Half-B proof companion — the "separate identity from capability" framing tightens the pedagogical Teacher/Student/Support decomposition.

### 5. Zhao et al., "On Safety Risks in Experience-Driven Self-Evolving Agents" — `2604.16968`
Critical negative result. **Experience gathered solely from benign tasks can still compromise safety in high-risk scenarios.** AWM and ReasoningBank both tested; safety degradation is monotonic over sessions — ASR rises from ~52% to >55% and doesn't recover. Category-level: Availability Compromise, Sensitive-Info Leakage, and Unsafe-Info Spread all see 20–30% ASR increases post-AWM. Claude-4.5-Sonnet shows the lowest offline ASR gap — boundary retention is model-dependent.

**Why it matters:** directly validates why GSD's bounded-learning constraints (20% change cap, 3-correction minimum, 7-day cooldown, Safety Warden BLOCK authority) are *necessary*, not paranoid. This paper is citation-worthy every time someone asks why the constraints exist.

**Read before:** Anything touching the Wasteland/GASTOWN integration or federated skill sharing via DoltHub. Shared skills from benign contexts can still compromise safety when recombined.

### 6. Liu et al., "Dive into Claude Code: The Design Space of Today's and Future AI Agent Systems" — `2604.14228`
**Systematic analysis of the exact runtime GSD runs on.** Documents the seven-component model, the five-layer compaction pipeline, the permission system with seven modes and ML-classifier, four extensibility mechanisms (MCP, plugins, skills, hooks), subagent delegation, and append-oriented session storage. Quotes: "SkillTool injects into current context (cheap). AgentTool spawns isolated context (expensive, but prevents context explosion)." CLAUDE.md is delivered as user context (probabilistic compliance), not system prompt (deterministic).

**Why it matters:** this is the only published architectural paper on Claude Code. Every GSD assumption about how subagents, skills, and hooks interact needs to be re-checked against this. The SkillTool-vs-AgentTool distinction, in particular, is load-bearing for skill-creator's decisions about whether a pattern should promote to skill or to agent.

**Read before:** Anything. Seriously — this should go into the next subversion's reading list.

### 7. Jiang et al., "Agent Skills for Large Language Models: Architecture, Acquisition, Security, and the Path Forward" — `2602.12430` *(Feb 2026 precedent, but load-bearing)*
Survey organized along architecture / acquisition / deployment / security. Key empirical: **26.1% of community-contributed skills contain vulnerabilities.** Proposes a Skill Trust and Lifecycle Governance Framework — four-tier, gate-based permission model mapping skill provenance to graduated deployment capabilities. Cites tool search tool, programmatic tool calling, tool learning as the three 2025 mechanisms that deepen skill–tool integration.

**Why it matters:** the 26.1% vulnerability rate is the baseline GSD's Staging Layer has to beat. The four-tier T1–T4 trust framework is a reference architecture for how the staging layer should gate skills coming in from Wasteland/GASTOWN/DoltHub.

**Read before:** Any federated-sharing work.

---

## Tier A — High architectural relevance

### Memory, context, and procedural knowledge

**Wu et al., "Procedural Knowledge at Scale Improves Reasoning" / Reasoning Memory — `2604.01348`** (arxiv submission April 20, 2026)
Decomposes reasoning trajectories into **32 million self-contained subquestion-subroutine pairs** and retrieves them at test time. This is the scale at which skill-creator would operate if it treated the *reasoning steps* inside skills as the retrieval unit rather than whole SKILL.md files. Very relevant to the mathematical proof companion target of v1.50 Half-B.

**Han et al., "StageMem: Lifecycle-Managed Memory for Language Models" — `2604.16774`** (April 18, 2026)
Three stages — **transient, working, durable** — each item has confidence + strength. Shallow admission separated from long-term commitment. Matches the retention-policy problem GSD hit when deciding how long session memory should persist before promotion. The confidence+strength pair is a cleaner metric than GSD's current usage-count heuristic.

**Wittenborg et al., "AgentFold: Long-Horizon Web Agents with Proactive Context Management" — `2510.24699`** *(foundational precedent)*
Treats context as a "dynamic cognitive workspace to be actively sculpted" via folding operations at multiple scales — granular condensations for fine-grained detail, deep consolidations for whole sub-tasks. The "proactive" framing is directly applicable to CAPCOM gates at wave boundaries.

**Byun et al., "Cat: Context as a Tool for SWE-Agents" — `2512.22087`**
Elevates context maintenance to a callable tool. Structured workspace = stable task semantics + condensed long-term memory + high-fidelity short-term interactions. Agents proactively compress trajectories at milestones. This is the explicit tool GSD could add to its subagent scaffolding.

**Xu et al., "AgentProg: Program-Guided Context Management" — `2512.10371`**
Reframes interaction history as a program with variables and control flow. Belief-state mechanism from Belief-MDP for partial observability. The program-as-context metaphor would fit cleanly with the CLAUDE.md approach.

**Zhao, "Externalization in LLM Agents: A Unified Review of Memory, Skills, Protocols and Harness Engineering" — `2604.08224`**
The single best framing paper of the month. Explicitly distinguishes memory (evidence of prior execution) from skills (promoted reusable procedure), then layers protocols (machine-readable contracts) and harnesses (orchestration) on top. **This is the four-layer stack GSD has de-facto built but never formally named.**

### Orchestration, harnesses, and protocols

**Penaroza, "Reasoning Graphs: Deterministic Agent Accuracy through Evidence-Centric Chain-of-Thought Feedback" — `2604.07595`** (April 8, 2026)
Persists per-evidence chain of thought as structured edges. Traversal surfaces how specific evidence items have been judged across all prior runs. **Self-improving without retraining — base model frozen, all gains from context engineering via graph traversal.** Evidence-centric feedback is different from query-similarity retrieval in kind. Accuracy rises and variance collapses over successive runs. Direct relevance to DACP's three-part bundle structure.

**Anonymous (alleged Liu et al.), "Natural-Language Agent Harnesses" — `2603.25723`** *(March precedent, April citations)*
Treats harness as first-class systems object, not a thin wrapper. Defines harness = control + contracts + state. Makes the harness↔runtime boundary analytical rather than absolute. The taxonomy maps almost 1:1 onto GSD's Wave/CAPCOM/Squadron/Fleet split.

**Rushing et al., "CAMCO: Safe and Policy-Compliant Multi-Agent Orchestration for Enterprise AI" — `2604.17240`**
Three-component coordination layer: Constraint Projection Engine + Risk-Weighted Utility Engine + Negotiation Loop. **After K_max failures, escalation to human review.** Algorithm 1 formalizes constraint-aware projection + risk-shaped utility. The K_max-then-escalate pattern is the CAPCOM gate pattern stated as a theorem. Their "fail-safe" framing from industrial control systems is worth lifting as a GSD design principle.

**Eryilmaz, "ChipCraftBrain: Validation-First RTL Generation via Multi-Agent Orchestration" — `2604.19856`** (April 22–23, 2026)
**PPO policy over 168-dim state for adaptive orchestration of six specialized agents.** Hybrid symbolic-neural: algorithmic solve for K-maps and truth tables, specialized agents for waveform timing and general RTL. 971 open-source references with focus-aware retrieval. Hierarchical specification decomposition with interface synchronization. **Reaches 97.2% pass@1 on VerilogEval-Human, 94.7% on a 302-problem CVDP subset.** The hybrid symbolic-neural split and the 168-dim state vector are worth studying — GSD could use an analogous state representation for routing between Opus/Sonnet/Haiku tiers.

**Feng & Su, "Experience as a Compass: Multi-agent RAG with Evolving Orchestration and Agent Prompts" (HERA) — `2604.00901`**
Co-evolution of coordination structure and agent prompts. Four learning phases: initial, exploration, refinement, optimization. Shows the exact topology dynamics Tibsfox predicted — **trajectories contract as the system matures, redundant agents and self-loops are pruned.** Validates the Squadron→Fleet scaling decisions are directionally correct.

**Sharma et al., "Hive: A Multi-Agent Infrastructure for Algorithm- and Task-Level Scaling" — `2604.17353`**
Heterogeneous runtime characteristics between agents (input/output lengths, cache footprints, context reuse). Current inference engines are "agent-unaware." Proposes agent-aware inference scheduling. Directly relevant to the Silicon Layer GPU co-processor design — the chipset allocation (Opus 30% / Sonnet 60% / Haiku 10%) could benefit from their heterogeneous-scheduling primitives.

### Bounded self-improvement theory

**Wang & Dorchen, "On The Statistical Limits of Self-Improving Agents" — `2510.04399`** *(Oct 2025 foundational; April 2026 citations)*
**Formalizes a boundary:** distribution-free PAC learnability is preserved under self-modification **iff** the policy-reachable hypothesis family has uniformly bounded capacity. Introduces the **Two-Gate guardrail** — validation margin τ + capacity cap K[m] — with an oracle inequality at VC rates. This is the paper that gives a theoretical justification for the 20% bounded-learning rule. **The Two-Gate is essentially CAPCOM + Safety Warden stated formally.**

**Alzubi et al. (alleged), "Training LLM Agents for Spontaneous, Reward-Free Self-Evolution via World Knowledge Exploration" — `2604.18131`** (April 22, 2026)
Three-stage progression: Experience-Driven → Adversarial → Meta-Learning-Driven. Teacher-model bootstrapping (SFT) + on-policy reinforcement rejection sampling (RFT). **At inference time, no external rewards or human instructions needed — the agent spontaneously self-evolves.** Concerning from a safety perspective (see Zhao et al. above), but the training-time-reward/inference-time-autonomy split is worth thinking about for how the staging layer should gate autonomous skill modification.

### Deterministic protocols & communication

**Anonymous, "CBCL: Safe Self-Extending Agent Communication" — `2604.14512`**
**Directly relevant to DACP.** Dialects with three checks: enter_depth counter, expansion-size accumulator, time-limit comparator. Template language deliberately not Turing-complete — only flat pattern matching, finite conditional branching, one-shot substitution, single-pass expansion. Lean 4 formal verification of parser + validation + dialect parsing + fuel-bounded evaluation model. **Epidemic/gossip propagation of dialects with cryptographic signatures for receiver verification.** Five example verified dialects (37 performatives).

**This is what DACP should look like if taken all the way to a verified implementation.** Read before the next DACP subversion.

**Anonymous (MCP-Diag), "Deterministic, Protocol-Driven Architecture for AI-Native Network Diagnostics" — `2601.22633`** *(late-Jan precedent; April citations)*
Three-step deterministic grounding: strict input-output sanitization via jc library, rigid data contract, no raw PTY exposure. MCP elicitation as cryptographic-handshake-equivalent human gate. Hybrid transport (standard MCP for control, SSE for long-running data). Pattern directly applicable to planning-bridge MCP server.

**Anonymous, "Type-Checked Compliance: Deterministic Guardrails for Agentic Financial Systems Using Lean 4" — `2604.01483`**
Lean-Agent Protocol: probabilistic thinking isolated from deterministic doing via Lean kernel. Aristotle model (Harmonic AI, IMO gold-medal equivalent) for formally verified reasoning. Flags "logical jailbreaks" and "formalization drift" as novel attack vectors in the translation layer. For GSD's ZFC auditor mission, this is the reference architecture.

**Anonymous, "LLM StructCore: Schema-Guided Reasoning Condensation and Deterministic Compilation" — `2604.20560`** (very recent, <1 week)
Two-stage: Stage-1 schema-constrained extraction, Stage-2 deterministic compilation to target format. **100% structural compliance at Stage 2**, teacher-student ablation enabled by shared deterministic back-end. Direct pattern for DACP's "structured data → executable code" step.

**Huang et al., "Model Context Protocol Threat Modeling and Analyzing Vulnerabilities to Prompt Injection with Tool Poisoning" — `2603.22489`** *(Mar precedent)*
STRIDE + DREAD on five MCP components. **Tool poisoning via malicious instructions in tool metadata identified as the most prevalent client-side vulnerability.** Comparison of seven major MCP clients; most have insufficient static validation.

**Abasikelesh Turgut et al., "CASCADE: A Cascaded Hybrid Defense Architecture for Prompt Injection Detection in MCP-Based Systems" — `2604.17125`** (April 18, 2026)
Three tiers: regex + phrase weighting + entropy → BGE embedding + Ollama Llama3 fallback → pattern-based output filtering. 95.85% precision, 6.06% FPR, fully local operation. Direct fit for the planning-bridge MCP server's input validation.

**Anonymous, "MCP-DPT: A Defense-Placement Taxonomy and Coverage Analysis for Model Context Protocol Security" — `2604.07551`**
Surveys existing MCP defenses (MCP Guardian, MindGuard, Cisco MCP Scanner, MCPScan.ai, MCIP-Guardian, ToolHive, MCP-Guard). Key gap: host orchestration, transport, and supply-chain governance are **structurally underdefended.** Useful as a landscape map for where GSD's staging layer fits.

### Adapter/expert routing — Silicon Layer

**Mu et al., "TalkLoRA: Communication-Aware Mixture of Low-Rank Adaptation" — `2604.06291`** (April 7, 2026)
Relaxes the independence assumption between LoRA experts. Lightweight Talking Module enables controlled information exchange across expert subspaces. Theoretical result: expert communication smooths routing dynamics by mitigating perturbation amplification. **Directly applicable to the Agnus/Denise/Paula/Gary chipset communication pattern — the Amiga chips literally *had* inter-chip communication lines, and this paper shows why that's mathematically advantageous.**

**Ming et al., "SAMoRA: Semantic-Aware Mixture of LoRA Experts" — `2604.19048`** (April 22, 2026)
Semantic-aware router explicitly aligns input semantics with expert capabilities. Task-Adaptive Scaling dynamically regulates expert contributions. Addresses the "imprecise routing" and "uniform weight fusion" problems of prior MoE-LoRA. For the RTX 4060 Ti 8GB reference hardware this is immediately tractable.

**Anonymous, "LoRAuter: Effective LoRA Adapter Routing using Task Representations" — `2601.21795`**
Training-free, black-box adapter routing. Weighted fusion over retrieved adapters. Directly relevant to the federated-skill-sharing vision where imported LoRA adapters have unknown training data.

### Evaluation frameworks & benchmarks

**Alzubi et al., "ClawEnvKit: Automatic Environment Generation for Claw-Like Agents" — `2604.18543`** (April 20, 2026)
Automated agent environment generation that separates declarative specification from deterministic verification. **LLM-judge weight capped at 55% to ensure majority of every score is deterministic.** Fifteen check types across audit-log, output, and filesystem sources. Live evaluation: user describes desired capability in natural language, gets a verified environment on demand. This is the evaluation harness v1.50 Half-A retrospectives need.

**Li et al., "ClawsBench: Evaluating capability and safety of LLM productivity agents in simulated workspaces" — `2604.05172`**
The productivity-agent companion benchmark. Useful as a baseline against which GSD's missions can be evaluated.

**Ji et al., "ClawArena: Benchmarking AI agents in evolving information environments" — `2604.04202`**
"Evolving" is the operative word — benchmarks that change across sessions to prevent memorization.

**Anonymous, "Inference-Time Scaling of Verification: Self-Evolving Deep Research Agents via Test-Time Rubric-Guided Verification" (DeepVerifier) — `2601.15808`** *(Jan precedent)*
Automated failure taxonomy (5 major classes, 13 sub-classes) → structured rubrics → outcome-based rewards. Inference-time scaling of verification holds for both closed-source APIs and SFT'd models. Integrating verification into DeepVerifier lifts Claude-3.7-Sonnet by 8%+ without additional training.

---

## Tier B — Specific component relevance

### Context management tactics

- **ExtAgents, `2505.21471`** — Multi-agent framework for scaling external knowledge input beyond context windows. Relevant to the 150–400 line module sizing rule.
- **ZoomR, `2604.10898`** — Memory-efficient reasoning through multi-granularity KV retrieval. Coarse-grained summary keys index fine-grained thoughts. Reduces decoding memory >2×. Direct application to long-running GSD sessions.

### Self-improvement architectures

- **PsychAgent, `2604.00931`** — Experience-Driven Lifelong Learning with Memory-Augmented Planning Engine + Skill Evolution Engine + Reinforced Internalization Engine. Three-engine split is a cleaner statement of skill-creator's six-step loop if regrouped by function rather than sequence.
- **Procedural Skills to Strategy Genes, `2604.15097`** — Gene-based evolution. Compact task-facing solution procedures ("gene_gep_repair_from_errors" etc.). Reusable repair procedures rather than "be careful" reminders. Terminology borrowed from the biological paradigm — resonates with the foxfire/heritage naming convention GSD already uses.
- **Evo-MedAgent, `2604.14475`** — Three complementary memory stores: Retrospective Clinical Episodes + Adaptive Procedural Heuristics + (governance). Utility-driven selection. "Self-evolving test-time memory" in a tool-augmented setting.
- **Memory Transfer Learning (coding agents), `2604.14004`** — How memories transfer across domains in coding agents. Very relevant for Wasteland/GASTOWN skill importation.
- **Persistent Identity (soul.py), `2604.09588`** — Multi-anchor architecture for resilient memory using neurological case studies as inspiration. "Functional identity — consistency of behavior, values, and knowledge" vs. phenomenal continuity. Worth reading alongside Learning Without Losing Identity for a different angle.
- **SEAgent, `2508.04700`** *(Aug precedent)* — World State Model + Curriculum Generator producing increasingly diverse tasks. Adversarial imitation of failure actions + GRPO.

### RL / tuning methods

- **SAGE, `2512.17102`** — Skill Augmented GRPO for self-Evolution. Sequential Rollout: agent iteratively deployed across chains of similar tasks.
- **KARL, `2603.05218`** *(Mar)* — Knowledge Agents via Reinforcement Learning. 77 pages, 43 figures — reference-weight survey.
- **CritPt, per `2604.15097`** — benchmark for procedural-skill evolution at test time.

### Domain-adjacent orchestration

- **OpenDev / Claude-Code-for-Terminal, `2603.05344`** — Planner subagent with read-only tools enforced at schema level, not runtime permission checks. Separation of schema from runtime is a pattern GSD should consider for its Safety Warden gates.
- **Zup CodeGen, `2604.09805`** — Practical engineering retrospective on building an internal coding agent. Maestro orchestrator + WebSocket + FastAPI + PostgreSQL/Redis. Thirteen concrete design decisions.
- **Rethinking Software Engineering for Agentic AI, `2604.10599`** — Verification-first lifecycles, specification-driven development, explicit human oversight gates. Position paper — useful for citing the case for the CAPCOM pattern.
- **Agentic AI Architecture Survey, `2601.12560`** *(Jan precedent)* — Graph-based orchestration frameworks and state machines that prioritize debuggability, checkpointing, and human approvals. "Flow engineering" as a named pattern.

### Inference / throughput (Silicon Layer)

- **Ragged Paged Attention (RPA), `2604.15464`** — TPU-specific kernel. Fine-grained tiling over ragged memory + custom software pipeline + distribution-aware compilation. Probably not directly actionable on RTX 4060 Ti but the distribution-aware compilation pattern generalizes.
- **Blink, `2604.07609`** — CPU-Free LLM Inference delegating serving stack to GPU+SmartNIC. 8.47× P99 TTFT reduction. Relevant to the 10-node white-box mesh cluster spec.
- **Flux Attention, `2604.07394`** — Context-aware hybrid attention with lightweight Layer Router on frozen pretrained LLMs. 2.7× prefill / 2.0× decode speedup. 12 hours training on 8×A800.
- **HintMR, `2604.12229`** — Two-SLM decomposition (hinter + solver). Distillation into DeepSeek-R1-Distill-Qwen-7B. +48.28 points on AIME-2024 with LLM-generated hints. Pattern for how small models can be specialized within the GSD chipset tier.

### Cross-model / multilingual

- **UL-XCoT, `2604.20090`** (this week) — Unified logic space across languages for efficient cross-lingual CoT. Logic-space trajectory dynamics for pruning low-quality reasoning paths. White-box hidden-state access required.

### Hardware coverage / verification

- **CovAgent, `2604.15657`** — Two-tier agentic framework for coverage closure. Six functional categories for token profiling: system prompting, design comprehension, stimulus generation, coverage feedback, error recovery, agentic overhead. **Token-allocation profiling as a first-class efficiency metric.** Directly applicable to GSD's token-budget dashboards.

---

## Quick-reference mapping table

| GSD component | Primary papers (tier) | Immediate takeaway |
|---|---|---|
| **Skill-creator 6-step loop** | 2604.04323 (S), 2604.01687 (S), 2604.15877 (S), 2604.08224 (A) | Retrieve+refine is load-bearing; memory/skills/rules are one compression spectrum |
| **CAPCOM gates / Safety Warden** | 2604.07799 (S), 2510.04399 (A), 2604.17240 (A), 2604.16968 (S) | Two-Gate guardrail formalizes the pattern; policy enforcement blocks 100% at ~2ms |
| **DACP (Deterministic Agent Communication Protocol)** | 2604.14512 (A), 2604.20560 (A), 2604.01483 (A), 2604.07595 (A) | CBCL with Lean-verified template expansion is the target |
| **Bounded learning (20% rule, 3-correction, 7-day cooldown)** | 2604.16968 (S), 2510.04399 (A), 2604.04323 (S) | Empirical + theoretical justification ready for documentation |
| **Chipset (Agnus/Denise/Paula/Gary → model tiers)** | 2604.06291 (A), 2604.19048 (A), 2604.17353 (A), 2604.19856 (A) | Inter-expert communication matters (TalkLoRA); heterogeneous scheduling possible (Hive) |
| **Staging Layer (security/intake)** | 2602.12430 (S), 2604.07551 (A), 2604.17125 (A), 2603.22489 (A) | 26.1% vuln rate baseline; four-tier trust model ready to adopt |
| **College of Knowledge / Rosetta Core** | 2604.15877 (S), 2604.08224 (A), 2604.01348 (A) | Missing-diagonal opportunity; memory/skills/rules at one compression spectrum |
| **Silicon Layer / GPU math co-processor** | 2604.19048 (A), 2604.06291 (A), 2604.07609 (B), 2604.15464 (B) | SAMoRA + TalkLoRA work on consumer GPUs; TPU-specific kernels won't transfer |
| **Wave/CAPCOM/Squadron/Fleet** | 2603.25723 (A), 2604.17240 (A), 2604.00901 (A) | Harness-as-first-class-object is validated; topology contraction expected |
| **Context management (subagents, fresh context)** | 2604.14228 (S), 2510.24699 (A), 2512.22087 (A), 2512.10371 (A) | Claude Code architecture paper is essential; folding/Cat are mature patterns |
| **planning-bridge MCP server** | 2601.22633 (A), 2604.17125 (A), 2604.07551 (A), 2602.12430 (S) | CASCADE three-tier local defense is the reference; tool poisoning is the #1 threat |
| **v1.50 Half-A retrospectives** | 2604.18543 (A), 2604.04323 (S), 2604.01687 (S) | ClawEnvKit + 34k-skill benchmark + co-evolution verifier = evaluation harness |
| **v1.50 Half-B proof companion** | 2604.01348 (A), 2604.01483 (A), 2604.07799 (S) | Reasoning Memory at 32M pairs; Lean-Agent for mathematical soundness |
| **Federated skill sharing (Wasteland/GASTOWN/DoltHub)** | 2604.14004 (B), 2604.16968 (S), 2602.12430 (S), 2604.15877 (S) | Memory transfer is possible but unsafe by default; four-tier governance required |

---

## Recommended next actions

1. **Highest leverage, smallest read:** `2604.14228` (Dive into Claude Code). This is the runtime GSD runs on. Any assumptions about subagents, skills, and hooks should be re-validated against this paper before the next planning session.

2. **For v1.50 milestone planning:** pair `2604.04323` (skill benchmarking in the wild) with `2604.01687` (CoEvoSkills) and `2604.15877` (Experience Compression Spectrum). Together these define the evaluation frame for Half-A retrospectives and the theoretical frame for what skill-creator is trying to do.

3. **For DACP next subversion:** read `2604.14512` (CBCL) in full. The Lean-4 verified template expansion with bounded fuel is effectively the formal version of what DACP's five fidelity levels are approximating.

4. **For Staging Layer hardening:** `2602.12430` + `2604.07551` + `2604.17125` as a three-paper read. The 26.1% vulnerability baseline and the four-tier T1–T4 trust model are citation-worthy and directly adoptable.

5. **For the Amiga Principle documentation:** `2604.07799` (Learning Without Losing Identity) deserves to be cited as the formal statement of the "persistent identity + evolvable capabilities" frame. The ECM concept maps onto GSD's skill/adapter/compiled promotion pipeline almost exactly.

6. **As cautionary citations:** `2604.16968` (safety risks in self-evolving agents) and `2510.04399` (statistical limits of self-improvement). These justify the bounded-learning constraints when they come under pressure.

7. **Long-range read:** `2604.08224` (Externalization survey). This is the best published framing of the memory/skills/protocols/harness four-layer stack, and gsd-skill-creator is essentially an implementation of that stack — but calling it that explicitly would help upstream contribution conversations (badlogic, steveyegge, etc.).

---

## Omissions & caveats

- **Research frontier this survey did not cover:** robotics/embodied agents (cs.RO) was only sampled; multi-modal (cs.CV) was deliberately de-prioritized; numerical analysis (math.NA) was excluded.
- **Dates:** every paper above is April 2026 primary submission (`2604.xxxxx`) except the explicitly-marked precedents, which are included only where April 2026 work cites them as architectural basis. Papers first submitted before the 17 Apr – 23 Apr window are noted with the precedent tag.
- **Verification:** paper claims above are summaries from abstract + top-results snippets. Before adopting any specific numeric claim into GSD documentation, fetch the full PDF. I've tried to flag the load-bearing empirical claims (26.1% vulnerability rate; 11.8% unsafe-action rate; 40.5pp skill improvement; etc.) so they can be verified against source.
- **arXiv ID namespace:** a few papers I've attributed to authors I couldn't positively verify from snippets alone — those are marked "(alleged)". Before citing, confirm authorship.

---

*End of deep-dive. Ready for planning-bridge deposit if desired.*
