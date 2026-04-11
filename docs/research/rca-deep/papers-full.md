# Root Cause Analysis — Deep Source Extraction

Generated: 2026-04-07 | 8 sources fetched and analyzed

---

## 1. Why Do AI Agents Systematically Fail at Cloud Root Cause Analysis?

**Source:** arXiv:2602.09937 (Feb 10, 2026; revised Mar 4, 2026)
**Authors:** Taeyoon Kim, Woohyeok Park, Hoyeong Yun, Kyungyong Lee
**Categories:** cs.AI, cs.DC

### Abstract Summary

Systematic failure analysis of LLM-based Root Cause Analysis agents for cloud systems. Existing systems exhibit low detection accuracy even with capable models, and current evaluation frameworks assess only final answer correctness without revealing why the agent's reasoning failed. The authors conducted 1,675 agent runs across 5 LLM models using the OpenRCA benchmark, classifying failures into 12 pitfall types.

### Methodology

- **Scale:** 1,675 total agent runs across 5 models (Claude 3.5 Sonnet, GPT-4, GPT-4o, Llama 3.1 70B, Mistral Large)
- **Benchmark:** OpenRCA
- **Approach:** Classified failures into 12 pitfall categories across three domains, then tested mitigation strategies (prompt engineering vs. architectural changes)

### 12 Pitfall Types

Organized across three failure domains:

**Intra-Agent Reasoning Failures:**
1. **Hallucination** — Agents generate plausible-sounding but incorrect diagnoses without factual grounding
2. **Weak Hypothesis Generation** — Agents struggle to formulate diverse or accurate diagnostic theories
3. **Incomplete Exploration** — Agents prematurely terminate investigation before exhausting possibilities
4. **Assumption Validation Failures** — Agents accept unverified premises without confirmation
5. **Root Cause Confusion** — Agents identify symptoms rather than underlying causes
6. **Circular Reasoning** — Agents get trapped repeating similar investigations without progression

**Inter-Agent Communication Failures:**
7. **Insufficient Context Window** — Agents lack adequate observability data for comprehensive analysis
8. **Ineffective State Tracking** — Agents lose context about system conditions across multiple steps
9. **Cross-System Blindness** — Agents cannot correlate failures across distributed system components

**Agent-Environment Interaction Failures:**
10. **Narrow Tool Utilization** — Agents fail to leverage available diagnostic tools effectively
11. **Poor Action Sequencing** — Agents execute operations in suboptimal or illogical orders
12. **Tool Invocation Errors** — Agents misuse or misunderstand tool parameters and return values

### Key Results

- **Most prevalent pitfalls** (hallucinated data interpretation + incomplete exploration) persist across ALL models regardless of capability tier
- **Prompt engineering alone cannot resolve** the dominant pitfalls
- **Inter-agent communication protocol enrichment** reduced communication-related failures by **up to 15 percentage points**
- Architecture-level issues dominate over model-level issues — failures stem from system design, not individual model weaknesses

### Implications for gsd-skill-creator

- Our multi-agent architecture (GSD executor, verifier, planner) must address inter-agent communication explicitly — richer protocol design is more impactful than model upgrades
- Hallucination and incomplete exploration are the top risks for our research co-processor pipeline; constraint-based guard rails at each agent step are essential
- Tool utilization failures map directly to our MCP tool integration — schema validation and guided tool selection should be built in
- State tracking across agent handoffs (context-handoff skill, beads-state) is architecturally critical, not optional

---

## 2. AgentRx: Diagnosing AI Agent Failures from Execution Trajectories

**Source:** arXiv:2602.02475 (Feb 2, 2026)
**Authors:** Shraddha Barke, Arnav Goyal, Alind Khare, Avaljot Singh, Suman Nath, Chetan Bansal (Microsoft Research)
**Categories:** cs.AI
**Open-sourced:** March 12, 2026 | Code: https://aka.ms/AgentRx/Code | Dataset: https://aka.ms/AgentRx/Dataset

### Abstract Summary

AI agents often fail in ways that are difficult to localize because executions are probabilistic, long-horizon, multi-agent, and mediated by noisy tool outputs. AgentRx is a domain-agnostic framework that automatically diagnoses agent failures by synthesizing constraints, evaluating them step-by-step, and producing auditable validation logs.

### 4-Stage Pipeline

1. **Trajectory Normalization** — Heterogeneous logs from different domains are converted into a common intermediate representation
2. **Constraint Synthesis** — Automatically generates executable constraints from tool schemas (API response validity) and domain policies (user confirmation mandates)
3. **Guarded Evaluation** — Evaluates constraints step-by-step, checking each constraint only when its guard condition applies; produces auditable validation log documenting violations with evidence
4. **LLM-Based Judging** — Language model judge analyzes validation log and failure taxonomy to identify the "Critical Failure Step" (first unrecoverable error)

### 9-Category Failure Taxonomy

| # | Category | Definition |
|---|----------|-----------|
| 1 | Plan Adherence Failure | Ignored required steps or performed unplanned actions |
| 2 | Invention of New Information | Altered facts unsupported by trace or tool output (hallucination) |
| 3 | Invalid Invocation | Malformed tool calls, missing arguments, schema violations |
| 4 | Misinterpretation of Tool Output | Incorrectly read outputs; acted on false assumptions |
| 5 | Intent-Plan Misalignment | Misunderstood user goals/constraints during planning |
| 6 | Under-specified User Intent | Insufficient information prevented task continuation |
| 7 | Intent Not Supported | No available tool addresses the requested action |
| 8 | Guardrails Triggered | Safety or access restriction blocked execution |
| 9 | System Failure | Connectivity or tool endpoint failures |

### Benchmark

- **115 manually annotated failed trajectories** across three domains:
  - **tau-bench** — Structured API workflows for retail and service tasks
  - **Flash** — Real-world incident management and troubleshooting
  - **Magentic-One** — Open-ended web and file tasks using multi-agent systems

### Key Results

- **Step localization:** +23.6% absolute improvement over baselines
- **Root-cause attribution:** +22.9% improvement over prompting baselines
- Domain-agnostic — works across structured API, incident management, and open-ended web tasks
- Auditable validation logs enable human review of diagnostic reasoning

### Implications for gsd-skill-creator

- The constraint synthesis pattern (tool schemas + domain policies -> executable guards) maps directly to our hook system and security-hygiene skill
- Our GSD workflow already has trajectory data (phase plans, execution logs, verification results) — applying AgentRx-style constraint checking to skill-creator's own agent runs would catch failures earlier
- The 9-category taxonomy provides a concrete classification for our gsd-forensics skill to adopt
- "Critical Failure Step" identification is exactly what our witness-observer and polecat-worker need for stalled-agent detection

---

## 3. A Comprehensive Survey on Root Cause Analysis in (Micro) Services

**Source:** arXiv:2408.00803 (Jul 23, 2024)
**Authors:** Tingting Wang, Guilin Qi (Southeast University)
**Categories:** cs.SE, cs.AI, cs.CE

### Abstract Summary

Comprehensive survey examining RCA methodologies for microservices architectures, organized by data modality (metrics, traces, logs, multi-modal). Covers 90+ distinct RCA methods, the role of LLMs in RCA, evaluation criteria, and future research directions.

### Methodology Taxonomy

#### By Data Source:
1. **Metric-based RCA** — Non-graph (KPI correlation, HMM, clustering) and graph-based (dependency, topology, causality, knowledge graphs)
   - Notable methods: Sieve, FacGraph, MicroRCA, DejAVu, CloudRanger, AutoMAP, MicroCause, CORAL, REASON
2. **Trace-based RCA** — Correlation analysis (alarm clustering, random walk, frequent pattern mining) and classification (ML, DNN, spectrum-based, GNN)
   - Notable methods: TBAC, TraceRCA, TraceRank, MonitorRank, Pinpoint, MicroRank, Sleuth
3. **Log-based RCA** — Correlation analysis (rule-based, ARM, statistical) and classification (decision tree, clustering, NLP, knowledge graphs)
   - Notable methods: LogRule, SherLog, LogSed, DeCaf, LogDC, LADRA
4. **Multi-modal RCA** — Vote-based, knowledge graph, Bayesian, contrastive learning, GNN fusion
   - Notable methods: Pdiagnose, MicroCBR, CloudRCA, MULAN, DiagFusion, Nezha, GROOT
5. **LLM-enhanced RCA** — Fine-tuning, RAG (RCACopilot), confidence estimation, ReAct agents
   - Notable methods: RCACopilot, ADARMA

#### By Method Type:
- Rule-Based, Statistical, Time Series, Graph Theory, ML/DL

#### Graph Types Used:
- Dependency, Topology, Causality, Bayesian Networks, Knowledge Graphs, Causal Knowledge Graphs

### Key Numbers

- **90+ distinct RCA methods** surveyed
- ~30+ metric-based, ~25+ trace-based, ~30+ log-based, 10+ multi-modal, 8+ LLM-based
- **74.38%** of failures in microservices are recurring
- Standard benchmarks: TrainTicket, Sockshop, OnlineBoutique, SocialNetwork
- Evaluation metrics: MTTD, MTTR, Accuracy, Precision, Recall, Top-N Accuracy

### 6 Challenge Categories

1. **Data-Related** — Reliability, log volume, sampling rate, trace truncation, incompleteness
2. **Dependency Complexity** — Dense interconnected services, cascading faults, ambiguous call relationships
3. **Fault Characteristics** — Destructiveness, propagation, 74.38% recurrence rate
4. **Methodology Limitations** — Single-modality narrow perspectives, graph completeness vs complexity, labeled data requirements
5. **Practical Implementation** — Heterogeneous data integration, interpretability vs accuracy, scalability, real-time requirements
6. **Emerging Technical** — LLM black-box nature, agent-based prompting complexity, dynamic adaptation

### Future Directions

- Multi-modal data integration beyond metrics/traces/logs
- Graph neural network advancement
- LLM application expansion with improved confidence estimation
- Knowledge graph enrichment and reasoning
- Cascading failure analysis and proactive prevention
- Integration with automated remediation

### Implications for gsd-skill-creator

- The 74.38% recurrence rate validates our approach of persistent learning via skills — most failures repeat, so learned patterns have high reuse value
- Multi-modal fusion is the trend; our architecture already combines multiple signal types (git history, test results, phase plans, execution traces) — formalizing this as RCA input is natural
- Knowledge graph approaches align with our pgvector + Rosetta cluster architecture
- The survey's evaluation framework (MTTD, MTTR, interpretability, generalizability) gives us concrete metrics for measuring our research co-processor

---

## 4. DynaCausal: Dynamic Causality-Aware RCA for Distributed Microservices

**Source:** arXiv:2510.22613 (Oct 26, 2025)
**Authors:** Songhan Zhang, Aoyang Fang, Yifan Yang, Ruiyi Cheng, Xiaoying Tang, Pinjia He
**Categories:** cs.SE

### Abstract Summary

Dynamic causality-aware framework for RCA in distributed microservice systems that unifies multi-modal signals to capture time-varying dependencies through interaction-aware representation learning. Addresses cascading fault propagation, noise interference, and over-reliance on deviation intensity.

### Three-Stage Methodology

1. **Multi-Modal Data Alignment** — Integrates metrics, logs, and traces into unified multivariate time series. Constructs dynamic call graphs with edge weights combining request counts and error rates: `e_{i,j}^{(t)} = sigma(alpha * Norm(C) + (1-alpha) * Norm(R))`

2. **System-Interaction-Aware Representation Learning:**
   - Temporal encoding via Transformer encoders with multi-head self-attention
   - Hybrid-Aware GAT combining standard graph attention with pre-calculated dynamic edge weights modeling fault propagation causality

3. **Causal Representation Discrimination (CRD):**
   - Temporal Causal Disentanglement (TCD): Contrastive learning comparing anomalous vs normal service embeddings
   - Spatial Causal Ordering (SCO): Pairwise ranking constraints ensuring root cause scores exceed downstream affected services

### Combined Loss Function

`L_total = L_CE + lambda_1 * L_TCD + lambda_2 * L_rank`

Where TCD enforces temporal disentanglement and ranking loss implements causal ordering priorities.

### Key Results — AC@1 (Accuracy at Rank 1)

| Dataset | DynaCausal | Best Baseline | Improvement |
|---------|-----------|---------------|-------------|
| D1 (12 services) | **0.769** | 0.459 (Eadro) | **+0.310** |
| D2 (50 services) | **0.481** | 0.301 (Eadro) | **+0.180** |

**Full metrics on D1:** AC@3=0.980, Avg@5=0.937, MRR=0.873
**Full metrics on D2:** AC@3=0.696, Avg@5=0.680, MRR=0.626

### Baseline Comparisons (AC@1)

| Method | Type | D1 | D2 |
|--------|------|----|----|
| MicroRank | trace-based | 0.444 | 0.013 |
| Baro | metric-based | 0.144 | 0.263 |
| Nezha | multi-modal | 0.078 | 0.092 |
| Eadro | multi-modal | 0.459 | 0.301 |
| ART | unsupervised | 0.196 | 0.176 |
| **DynaCausal** | **dynamic causal** | **0.769** | **0.481** |

### Ablation Study (AC@1, D1/D2)

| Configuration | D1 | D2 | Degradation |
|--------------|----|----|-------------|
| Full DynaCausal | 0.769 | 0.481 | -- |
| w/o TCD | 0.743 | 0.454 | -3.4% / -5.6% |
| w/o SCO | 0.737 | 0.447 | -4.2% / -7.1% |
| w/o H-GAT | 0.697 | 0.401 | -9.4% / -16.6% |
| w/ Static graphs | 0.669 | 0.395 | -13.0% / -17.9% |

Dynamic graph construction had the greatest impact; static variants degraded most on larger D2 (50 services).

### Cascading Fault Handling

- Dynamic call graphs capture real-time interaction intensity
- Hybrid-Aware GAT explicitly models causality via edge weights combining request counts and error rates
- SCO constrains rankings to respect service dependencies — root causes rank above affected downstream services
- Case study: Existing methods incorrectly ranked PaymentService and AdService above actual root cause CheckoutService (which showed only subtle latency vs pronounced downstream memory shifts)

### Implications for gsd-skill-creator

- The dynamic causal graph approach is directly applicable to our multi-agent dependency chains — phase dependencies, skill activation sequences, and agent handoffs form a dynamic graph
- The "deviation intensity" trap (where the most visibly broken thing is not the root cause) maps to our debugging experience — the loudest test failure is often a downstream symptom
- Contrastive learning (normal vs anomalous embeddings) could improve our pgvector-based pattern matching for mission failure detection
- SCO's causal ordering constraint is a principle we should adopt: when diagnosing GSD pipeline failures, always rank upstream causes above downstream symptoms

---

## 5. A Goal-Driven Survey on Root Cause Analysis

**Source:** arXiv:2510.19593 (Oct 22, 2025)
**Authors:** Aoyang Fang, Haowen Yang, Haoze Dong, Qisheng Lu, Junjielong Xu, Pinjia He
**Categories:** cs.SE, cs.AI

### Abstract Summary

Survey of 135 RCA papers (2014-2025) organized by underlying objectives rather than data types. Argues that "the goal of localizing a faulty service for rapid triage is fundamentally different from identifying a specific functional bug" and that conventional categorization obscures true progress.

### Formal Definition

RCA defined as: **F: O -> G** where:
- **Input Space (O):** Logs, metrics, traces, events, supplementary data (code, configs, docs)
- **Output Space (G):** Incident Propagation Graph (DAG) with three node types: root cause (zero in-degree), trigger (optional catalyst), symptom (observable failure)

### Seven Fundamental Goals

1. **Multi-dimensional Data Correlation** — Fusing heterogeneous telemetry into unified frameworks
   - Unified representation learning (DiagFusion, Nezha, UniDiag)
   - Graph-based fusion (TrinityRCL, CHASE, FaaSRCA)
   - LLM-driven semantic fusion (RCACopilot, TrioXpert, Atlas, Raccoon)

2. **Robustness** — Maintaining accuracy despite incomplete/noisy/sparse data
   - Constraint-based causal discovery (CloudRanger, ServiceRank)
   - Sparsity-tolerant methods (MicroCU, SparseRCA)
   - Multi-agent/LLM consensus (mABC, RCAgent)

3. **Adaptive Learning** — Continuous model evolution with system changes
   - Graph-based incremental updates
   - Feedback-driven refinement
   - Few-shot learning, reinforcement learning

4. **Real-time Performance** — Computational efficiency for timely analysis
   - Search space pruning, dimensionality reduction
   - Parallel/distributed processing
   - Hierarchical architectures, LLM token optimization

5. **Interpretability** — Causally sound, understandable explanations
   - Structural (causal graphs), semantic (natural language)
   - Evidence-based, interactive visualization

6. **Multi-granularity** — Fault localization from service to code level
   - Service -> infrastructure/component
   - Service -> code-level
   - Multi-dimensional fine-grained

7. **Actionability** — Converting diagnostics into remedial recommendations
   - Automated remediation generation
   - LLM-driven planning
   - Human-in-the-loop validation

### The Effectiveness-Data-Cost Triangle

Fundamental trade-off: improving effectiveness requires richer data, but richer data increases cost. Three-way competition forces strategic compromises.

### Critical Gaps Identified

- Current research focuses on "point-finding" (identifying root cause nodes) rather than "graph-building" (constructing complete incident propagation graphs)
- No existing work generates comprehensive propagation paths with validated causal edges
- SRE seeking rapid mitigation (MTTR) needs different RCA than developer pursuing permanent fixes (MTBF) — this distinction is absent from conventional surveys

### Cloud Incident Management Lifecycle (per Google)

1. Preparation -> 2. Detection -> 3. Localization (RCA) -> 4. Mitigation -> 5. Resolution -> 6. Improvement

RCA operates throughout with evolving granularity: broad for triage, narrow for mitigation, highly specific for resolution.

### Implications for gsd-skill-creator

- The 7-goal framework maps remarkably well to our architecture: data correlation (Rosetta clusters), robustness (beads-state crash recovery), adaptive learning (skill-creator observation loop), real-time (GSD fast/quick paths), interpretability (session reports), multi-granularity (phase -> plan -> code), actionability (gsd-do routing)
- The point-finding vs graph-building distinction is critical — our gsd-forensics should build propagation graphs, not just identify single failure points
- The effectiveness-data-cost triangle is our token-budget constraint in different clothes
- Goal-based organization validates our approach of having different diagnostic paths for different purposes (fast triage via gsd-fast vs deep investigation via gsd-forensics)

---

## 6. Stalled, Biased, and Confused: Reasoning Failures in LLMs for Cloud RCA

**Source:** arXiv:2601.22208 (Jan 29, 2026)
**Authors:** Evelien Riddell, James Riddell, Gengyi Sun, Michal Antkiewicz, Krzysztof Czarnecki
**Venue:** FORGE 2026
**Categories:** cs.SE

### Abstract Summary

Empirical evaluation isolating LLM reasoning behavior in RCA using simplified experimental conditions. Tested 6 open-source LLMs across 2 agentic workflows (ReAct, Plan-and-Execute) plus non-agentic baseline, with 48,000 simulated failure scenarios over 228 execution days. Produced a labeled taxonomy of 16 common RCA reasoning failures.

### 16 Reasoning Failure Taxonomy

**Per-Hypothesis Failures (RF-01 to RF-08):**

| ID | Name | Description |
|----|------|-------------|
| RF-01 | Fabricated evidence | Agent invents data not present in observations |
| RF-02 | Metric interpretation errors | Misreads numerical values or trends |
| RF-03 | Confused provenance | Attributes data to wrong source/component |
| RF-04 | Temporal misordering | Gets sequence of events wrong |
| RF-05 | Spurious causal attribution | Claims causation without valid evidence chain |
| RF-06 | Unjustified instance specificity | Over-narrows diagnosis without basis |
| RF-07 | Arbitrary evidence selection | Cherry-picks supporting data, ignores contradicting |
| RF-08 | Evidential insufficiency | Reaches conclusions with inadequate evidence |

**Full Trace Procedural Failures (RF-09 to RF-12):**

| ID | Name | Description |
|----|------|-------------|
| RF-09 | Failure to update belief | Doesn't revise hypothesis when new evidence contradicts |
| RF-10 | Simulation or role confusion | Loses track of its diagnostic role/purpose |
| RF-11 | Excessive speculation | Generates unfounded hypothetical scenarios |
| RF-12 | Repetition or stalled progress | Gets stuck in loops without advancing |

**Cross-Cutting Failures (RF-13 to RF-16):**

| ID | Name | Description |
|----|------|-------------|
| RF-13 | Anchoring bias | Over-indexes on first hypothesis encountered |
| RF-14 | Invalid inference patterns | Logical fallacies in reasoning chain |
| RF-15 | Internal contradiction | Holds mutually exclusive positions simultaneously |
| RF-16 | Arithmetic/aggregation errors | Math mistakes in data analysis |

### Key Results (48,000 scenarios, 6 models)

**Models tested:** Llama 3.2 (3B), Qwen 3 (4B, 32B), Llama 3.3 (70B), Command R+ (104B), DeepSeek-R1 (70B distilled)

**Accuracy:**
- Qwen 3 32B achieved highest overall HA@3: 0.36 (GAIA), 0.09 (OpenRCA)
- Plan-and-Execute: 77-87% failure rate for smallest models (recursion limits)
- Straight-Shot often equaled or surpassed complex agentic workflows for localization

**Propagation path recovery:**
- Agentic workflows improved path validity for capable models: Llama 3.3 PA@3 improved 0.61 -> 0.73 -> 0.78
- Smaller models achieved only 23-50% tool coverage in agentic settings

**Universal failures persisting across ALL models:**
- Unsupported causal claims, temporal ordering violations, fabricated evidence = highest prevalence
- **Anchoring bias, repetitive reasoning, arbitrary triage, belief-update failures** = strongest negative association with correctness (**15-45% accuracy reduction**)
- RCA-specific reasoning (metric misinterpretation, provenance confusion) appeared uniformly across model families

**Modality sensitivity:**
- **Metrics:** Withholding reduced localization by 7-15% (most essential modality)
- **Logs:** Exclusion degraded fault-type accuracy by 13%
- **Traces:** Removal **improved** accuracy by 6-7% — models were **distracted** by voluminous, noisy trace data

**Critical finding:** "No single model dominates across all RCA subtasks. Model selection should reflect target RCA objective rather than model size alone."

### Mitigation Recommendations

1. Early hypothesis diversification (tree-of-thought approaches)
2. Self-consistency and critique mechanisms for belief revision
3. Evidence sufficiency validation before ranking hypotheses
4. Explicit domain guidance for diagnostic triage heuristics
5. Better trace alert filtering and integration strategies
6. Workflow selection matching model capacity

### Implications for gsd-skill-creator

- The trace distraction finding is critical: more data is not always better. Our research co-processor must filter and summarize rather than dump raw traces
- Anchoring bias (15-45% accuracy reduction) maps directly to our agent workflows — first-hypothesis stickiness is a real threat; our planner/verifier split helps but may need explicit de-anchoring steps
- Belief update failure (RF-09) explains why our agents sometimes persist with wrong approaches — we need explicit "evidence review" checkpoints in phase execution
- The finding that simpler workflows often match complex ones for core tasks validates our gsd-fast path — complexity should be added only when the task demands it
- Metric data is the most valuable signal type; we should prioritize structured metrics (test counts, build times, error rates) over raw log dumps in our diagnostic pipelines

---

## 7. AgentRx — Microsoft Research Blog Details

**Source:** https://www.microsoft.com/en-us/research/blog/systematic-debugging-for-ai-agents-introducing-the-agentrx-framework/
**Published:** March 12, 2026

### Framework Pipeline (Blog Version)

The blog provides additional operational context beyond the paper:

1. **Trajectory Normalization** — Converts heterogeneous logs from different agent systems into a common intermediate representation
2. **Constraint Synthesis** — Two sources: tool schemas (API response validity requirements) and domain policies (user confirmation mandates). Generates guarded, executable constraints
3. **Guarded Evaluation** — Step-by-step evaluation; constraints only checked when guard conditions apply. Produces auditable validation logs with evidence-backed violation documentation
4. **LLM-Based Judging** — Analyzes validation log + failure taxonomy to identify Critical Failure Step (first unrecoverable error)

### Benchmark Details (Extended)

- 115 failed trajectories manually annotated
- Domains: tau-bench (structured API), Flash (incident management), Magentic-One (open-ended web/file)
- Each trajectory annotated with: critical failure step + failure category from the 9-category taxonomy
- Grounded-theory methodology for taxonomy derivation (bottom-up from real failures)

### Open-Source Status

- **Framework:** Open-sourced (https://aka.ms/AgentRx/Code)
- **Annotated dataset:** Open-sourced (https://aka.ms/AgentRx/Dataset)
- **License:** CC BY 4.0

### Key Distinctions (Blog Emphasis)

- "Plan Adherence Failure" vs "Invention of New Information" — taxonomy helps developers distinguish agent ignoring its own plan from agent hallucinating
- Constraint synthesis is automatic from tool schemas, not manual annotation
- Validation logs are auditable by humans, creating accountability chain

### Implications for gsd-skill-creator

- Open-source availability means we can integrate AgentRx directly into our diagnostic pipeline
- The grounded-theory taxonomy derivation method (bottom-up from real failures) is exactly how our skill-creator observation loop works — validate that our approach matches their methodology
- Auditable validation logs align with our phase manifest and verification result patterns
- The constraint-from-schema approach can be applied to our MCP tool definitions to auto-generate guards

---

## 8. Google SRE: Blameless Postmortem Culture

**Source:** https://sre.google/sre-book/postmortem-culture/
**Authors:** Google SRE Team

### Core Philosophy

"The cost of failure is education." Postmortems are written records documenting incidents, impacts, mitigation actions, root causes, and preventive follow-ups. They serve as organizational learning tools.

### What Makes a Postmortem Blameless

- Assume all participants had good intentions with available information
- Investigate why individuals lacked complete or correct information
- Identify process and system weaknesses, not personal failings
- Prevent finger-pointing that discourages incident reporting
- Originated in healthcare and avionics where mistakes carry fatal consequences

### Postmortem Triggers

- User-visible downtime/degradation beyond thresholds
- Any data loss
- On-call engineer intervention (rollbacks, traffic rerouting)
- Resolution time exceeding established limits
- Monitoring failures requiring manual discovery
- Stakeholder requests

### Template Structure

Each postmortem should contain:
1. **Incident description** — What happened
2. **Impact** — User-facing and internal effects
3. **Root cause** — Why it happened (systemic, not individual)
4. **Mitigation actions** — What was done to stop it
5. **Follow-up actions** — What will prevent recurrence (with owners and deadlines)
6. **Timeline** — Sequence of events
7. **Lessons learned** — What went well, what went poorly, where we got lucky

### Review Process

- **Initial review:** Senior engineers assess completeness, root cause thoroughness, action plan priority
- **Publication:** Shared broadly across engineering teams via mailing lists and incident repositories
- **No unreviewed postmortems:** Regular review sessions ensure completion and action item finalization
- Never include user-identifying information

### Cultural Reinforcement

- **Postmortem of the Month:** Organization-wide newsletter featuring interesting cases
- **Postmortem Reading Clubs:** Teams discuss impactful incidents
- **Wheel of Misfortune:** Role-playing exercises reenacting previous incidents for training
- **Internal Discussion Groups:** Sharing and analysis platforms
- **Visible recognition:** Google founders hosted TGIF sessions celebrating exceptional incident handling

### Key Anti-Pattern

Stigmatizing frequent postmortems by individuals/teams creates cultures where incidents get "swept under the rug," increasing organizational risk.

### Automation Efforts

Google's "Postmortems at Google" working group coordinates:
- Template standardization
- Automated postmortem creation using incident tool data
- Metadata field enhancement for automated analysis
- Trend analysis across product boundaries
- Future ML applications for weakness prediction

### Implications for gsd-skill-creator

- Our gsd-forensics skill should follow blameless postmortem principles — focus on systemic causes in agent failures, not "which model is bad"
- The trigger criteria map to our phase/milestone completion checks — define explicit thresholds for when forensic investigation is warranted
- The template structure (incident, impact, root cause, mitigation, follow-up, timeline, lessons) should be the output format of our gsd-forensics skill
- Cultural reinforcement through "reading clubs" and "wheel of misfortune" suggests we should build a failure pattern library that skills can learn from
- Automated postmortem creation from incident data = automated session reports from execution traces (our gsd-session-report skill)
- The review process (no unreviewed postmortems) maps to our verification requirement — every forensic analysis should be reviewed before conclusions are adopted

---

## Cross-Cutting Synthesis

### Recurring Themes Across All 8 Sources

1. **Architecture > Model capability** — Papers 1 and 6 both show that failures persist across all model tiers; system design matters more than model selection
2. **Hallucination is universal** — Appears as a top failure in Papers 1, 2, 6; requires structural mitigation, not just prompting
3. **Multi-modal fusion is essential** — Papers 3, 4, 5 all converge on combining metrics + logs + traces; single-signal approaches are insufficient
4. **Dynamic > Static** — Paper 4 shows 13-18% degradation with static graphs; systems must adapt to changing conditions
5. **Simpler can be better** — Paper 6 shows Straight-Shot matching complex workflows; Paper 1 shows prompt engineering alone fails; right-sizing complexity is key
6. **Blame-free learning** — Paper 8's blameless culture + Papers 2 and 7's taxonomized failures = systematic learning without stigma
7. **Traces can hurt** — Paper 6's counter-intuitive finding that removing traces improved accuracy warns against naive data maximalism
8. **74.38% of failures recur** — Paper 3's statistic validates investment in pattern learning and skill persistence

### Direct Architecture Recommendations for gsd-skill-creator

| Finding | Source | Recommendation |
|---------|--------|----------------|
| Inter-agent communication enrichment reduces failures 15pp | Paper 1 | Formalize agent handoff protocols beyond simple context passing |
| Constraint synthesis from tool schemas | Paper 2 | Auto-generate MCP tool guards from schema definitions |
| 9-category failure taxonomy | Paper 2 | Adopt in gsd-forensics for standardized failure classification |
| 74.38% failure recurrence | Paper 3 | Prioritize persistent pattern learning in skill-creator |
| Dynamic causal graphs outperform static by 13-18% | Paper 4 | Build dynamic dependency tracking, not static dependency declarations |
| Goal-based diagnostic routing | Paper 5 | Different diagnostic paths for triage (gsd-fast) vs deep investigation (gsd-forensics) |
| Anchoring bias: 15-45% accuracy loss | Paper 6 | Explicit de-anchoring steps in multi-hypothesis investigation |
| Trace data distracts models | Paper 6 | Filter and summarize rather than dump raw traces to agents |
| Auditable validation logs | Paper 2 | Every agent decision should produce reviewable evidence |
| Blameless postmortem template | Paper 8 | Standardize gsd-forensics output format on Google's 7-section template |
