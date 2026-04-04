# yt-queue-02: Stop Shipping on Vibes -- How to Build Real Evals for Coding Agents

**Speaker:** Jess, Braintrust
**Source:** YouTube transcript (yt-queue-02.en.vtt)
**Processed:** 2026-04-03

---

## Summary of Findings

Jess from Braintrust presents a practical framework for building evaluations (evals) for AI coding agents, arguing that teams routinely ship AI features based on "vibes" -- a PM trying a few prompts and saying it looks good -- rather than quantified, repeatable measurement. The talk defines the eval lifecycle, then walks through a real experiment comparing agentic search vs. vector search for code-bug-fixing tasks.

### Evaluation Methods Discussed

**The four-part eval structure:**
1. **Dataset** -- Collection of test cases: golden use cases, edge cases, failure modes. Best practice is to sample 10-20% of live production logs and convert them into eval datasets, creating a continuous feedback loop.
2. **Task** -- The system-under-test configuration: prompt + model selection defining how input maps to output.
3. **Scoring** -- Three scoring approaches mentioned: deterministic scoring, LLM-as-a-judge, and human review. The scorer defines what "good" and "bad" mean for the specific use case.
4. **Experimentation** -- Each unique combination of dataset + task + scorer = one experiment run. Compare runs to detect regressions and improvements.

### What Metrics Matter / What Doesn't Work

- **Pass/fail against existing test suites** was the primary metric (did the fix pass the repo's tests?). Binary but clear.
- **Duration, total tokens, and cost** tracked as secondary metrics.
- **Vibes-based shipping does not work.** The core thesis: manual spot-checking by PMs or engineers saying "it's ready" without quantified evidence is dangerous.
- **Small datasets are unreliable.** With 10 rows, one failure swings score by 10%. Multiple trials per task are essential because LLM non-determinism can cause 10-15% variance across identical runs.
- **Single-run results are insufficient.** Jess explicitly says she would not publish the results because they need multiple trials averaged.

### Key Experiment: Agentic Search vs. Vector Search

- **Agentic search** (Claude Code default): LLM uses CLI tools (grep, find, cat) to read code like a human, following references across files.
- **Vector search**: Code embedded into vector DB, retrieved by semantic similarity.
- **Results:** Agentic search matched or beat vector search on accuracy (68% vs 60% on SWE-Bench/Django; 70% vs 70% on TypeScript-Go). Agentic search was significantly cheaper in tokens/cost.
- **Key insight:** Vector search provides proximity to relevant code but lacks the "connective tissue" -- import chains, call graphs, type definitions -- that agentic search discovers through chain-of-thought exploration.

### Frameworks, Tools, and References

- **Braintrust** -- Eval platform with observability, experiment comparison, and "Loop" (natural language querying of experiment traces)
- **SWE-Bench Verified** -- Industry-standard benchmark used by Anthropic and OpenAI for coding agent evaluation
- **Claude Code** -- Used as the agent runtime; `disallow_tools` flag used to constrain search behavior
- **Cursor** -- Referenced for their published work on semantic/agentic search improving coding agent performance
- **OpenAI April 2025 model revert** -- Cited as a real-world example of overtrained "helpfulness" causing sycophancy, caught too late

### Connection to Verification-First Multi-Agent Systems

This talk directly validates several principles in our verification-first workflow:

1. **Scoring = verification contracts.** Their scorer-defines-quality pattern mirrors our goal-backward analysis: define what success looks like first, then work backward to implementation. The eval scorer IS the verification spec.
2. **Evals as a team sport.** The slide Jess highlights shows AI engineers, PMs, subject matter experts, and data analysts all contributing -- analogous to our muse council reviewing designs before build.
3. **Trace visibility is non-negotiable.** The subprocess tracing fix (passing parent span IDs as env vars so Claude Code traces attach to parent trace trees) is directly relevant to multi-agent observability. Without it, you cannot debug why agents fail.
4. **Continuous loop: production logs -> dataset -> eval -> ship.** This is the same flywheel as our iterative refinement pattern -- research informs build, build generates data, data informs next research cycle.
5. **Non-determinism demands multiple trials.** Her finding that identical eval configs can swing 10-15% reinforces why single-pass verification is insufficient -- our verification-first approach of running verifiers after executors addresses exactly this.
