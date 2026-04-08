# BEAM Benchmark Deep Dive

**Module:** LTM Research Series, Module 01
**Primary source:** Tavakoli, Salemi, Ye, Abdalla, Zamani, Mitchell — *Beyond a Million Tokens: Benchmarking and Enhancing Long-Term Memory in LLMs* (ICLR 2026)
**Repository:** https://github.com/mohammadtavakoli78/BEAM
**ArXiv:** https://arxiv.org/abs/2510.27246
**OpenReview:** https://openreview.net/forum?id=y59hf5lrMn
**Date compiled:** 2026-04-08
**Audience:** memory-system designers, long-context LLM researchers, gsd-skill-creator LTM mission team

---

## 1. Why BEAM Matters

Until late 2025, the long-term memory evaluation landscape was a patchwork. LoCoMo, LongMemEval, and MemBench each measured *some* aspects of conversational memory, but they shared three structural weaknesses that BEAM was designed to repair:

1. **Domain monoculture.** Prior benchmarks concentrated overwhelmingly on personal-life dialogue — casual chit-chat, fictional relationships, daily-life trivia. Technical reasoning, code, finance, and medicine were underrepresented or absent. That made it impossible to tell whether a memory system generalized or whether it had merely memorized the shape of gossip.

2. **Length ceilings far below production usage.** Most memory benchmarks topped out at roughly 100K–500K tokens. By 2025, frontier models shipped million-token context windows, and real deployments routinely accumulated multi-million-token histories (agent loops, research sessions, long-running assistants). No benchmark tested what happens past a million tokens, let alone at ten million.

3. **Partial ability coverage.** Each benchmark probed a subset of what "memory" means. Some tested recall. Some tested reasoning. None systematically covered the *ten* distinct capabilities that a useful long-term memory system actually needs.

BEAM directly addresses all three. It spans four length tiers up to 10 million tokens, draws conversations from coding, math, health, finance, and personal domains, and partitions memory into ten orthogonal abilities — three of them novel to the literature — with 2,000 validated probing questions distributed across them. It is, as of this writing, the most rigorous public evaluation of long-term conversational memory in LLMs.

The second contribution of the paper — LIGHT, a cognitively inspired memory framework — is interesting on its own, but the benchmark itself is the lasting artifact. LIGHT will be superseded. The ten-ability taxonomy and the 10M-token test bed are likely to persist as reference points for the next several years of memory research.

---

## 2. The Ten Memory Abilities

BEAM decomposes "long-term memory" into ten abilities, each probed separately. Three abilities — **Abstention**, **Contradiction Resolution**, and **Event Ordering** — are novel contributions of this paper. The remaining seven are adapted from prior benchmarks but now evaluated at unprecedented context lengths.

### 2.1 Abstention *(novel)*

**Definition:** "Evaluates whether a model withholds answers when evidence is missing."

The ability to say "I don't know" is a surprisingly weak point for LLMs. When asked about something not present in the conversation history, a well-calibrated memory system should refuse — not hallucinate a plausible-sounding answer. Abstention questions in BEAM deliberately reference information the conversation never contained. A correct response acknowledges the absence; an incorrect response invents.

*Example probe shape:* "What did I say my sister's name was?" — when no sister was ever mentioned.

Notably, abstention is the **easiest** ability on BEAM: all methods score highest here. It turns out that at long contexts, retrieval-augmented pipelines naturally abstain more often because their retrievers simply fail to surface relevant chunks, which the generator then interprets as "not enough information." This means abstention scores can be misleading — high abstention can signal either good calibration *or* retrieval failure. BEAM's per-ability reporting lets readers disentangle these.

### 2.2 Contradiction Resolution *(novel)*

**Definition:** "Tests the capacity to detect and reconcile inconsistent statements across widely separated turns."

This is the **hardest** ability on BEAM. Across all models and methods tested — including LIGHT — contradiction resolution scores near the floor. Scores in the 0.025–0.037 range are common at 100K tokens, meaning models correctly reconcile contradictions roughly 3% of the time.

The setup: during the conversation, a user makes some statement ("I'm allergic to peanuts"), and later — often hundreds of thousands of tokens later — makes an incompatible statement ("I had a peanut butter sandwich for lunch every day this week"). The probe asks the model to recognize the inconsistency and produce the reconciled truth. Even million-token-context LLMs, given the full dialogue, cannot reliably do this.

Why? Contradiction detection requires holding two claims in working memory simultaneously *and* noticing their semantic conflict. Retrieval systems tend to return one or the other claim but not both. Long-context attention diffuses across the window and fails to surface the conflict. This is the single clearest open problem the benchmark reveals.

### 2.3 Event Ordering *(novel)*

**Definition:** "Assesses whether a model can recognize and reconstruct the sequence of evolving information."

Uniquely among the ten abilities, Event Ordering is scored using the **Kendall tau-b rank correlation coefficient** — which measures both the presence of events in the answer *and* their ordering. Standard nugget scoring (binary satisfaction per atomic fact) would miss order errors, so the paper introduces this specialized metric.

*Example probe:* Given a conversation about a user's career progression, "List the jobs the user held in chronological order." An answer that lists all jobs but misorders them receives partial credit proportional to the rank correlation.

### 2.4 Information Extraction

**Definition:** "Measures recall of entities and factual details in long histories."

The classic memory task: did the model remember a specific fact that appeared somewhere in the conversation? Information Extraction is typically the second-best-performing ability, which matches intuition — dense retrieval is good at surfacing specific entities when queries are well-formed.

### 2.5 Instruction Following

**Definition:** "Examines sustained adherence to user-specified constraints over long contexts."

A user might say "from now on, always respond in bullet points." Hundreds of thousands of tokens later, does the model still comply? Instruction Following probes these long-range behavioral commitments. It is distinct from in-context instructions in a single prompt — here the instruction might have been issued 500K tokens ago.

### 2.6 Knowledge Update

**Definition:** "Evaluates revising stored facts as new ones appear."

Closely related to contradiction resolution, but distinct: the user updates a fact (not contradictory, just newer), and the model must use the *new* value. "I live in Boston." ... [200K tokens later] ... "I just moved to Seattle." Probe: "Where do I live?" Correct answer: Seattle. A memory system that returns the older fact fails.

### 2.7 Multi-Session / Multi-Hop Reasoning

**Definition:** "Probes inference that integrates evidence across multiple, non-adjacent dialogue segments."

The paper uses both "Multi-Session Reasoning" and "Multi-Hop Reasoning" for this ability — they refer to the same thing. The model must combine two or more facts from different parts of the conversation to derive a new fact not explicitly stated. Classic chain-of-reasoning over distant memory.

*Example:* Fact A at turn 50: "My birthday is March 15." Fact B at turn 800: "I was born in 1992." Probe at turn 1200: "How old will I be on my next birthday?" Requires retrieving both facts, doing arithmetic, and reasoning about the current date.

### 2.8 Preference Following

**Definition:** "Captures personalized responses that adapt to evolving preferences."

Preferences are a special class of long-lived facts: the user states likes, dislikes, constraints, and these should persist. Preference Following distinguishes from Instruction Following by being softer — not directives but taste. "I prefer vegetarian food." The model should remember this when recommending restaurants 300K tokens later.

### 2.9 Summarization

**Definition:** "Assesses the ability to abstract and compress dialogue content."

Can the model produce a faithful summary of a portion of the conversation? This is the ability where LIGHT shows the **largest relative improvement** — +160.6% over vanilla baselines — because the scratchpad component essentially pre-computes rolling summaries that the final response generator can draw on.

### 2.10 Temporal Reasoning

**Definition:** "Tests reasoning about explicit and implicit time relations."

Can the model answer "how long ago did I tell you about the job interview?" or "did event A happen before event B?" Explicit temporal markers are easier; implicit reasoning ("last winter," "when I was still working at the startup") is harder. LIGHT shows strong gains here (+56.3%) because the episodic memory index preserves timestamps that vanilla attention muddles.

---

## 3. Dataset Construction

BEAM's 100 conversations and 2,000 questions were not scraped or crowd-sourced. They were generated through a five-stage synthetic pipeline with human validation at the end. Understanding this pipeline matters because it determines what the benchmark can and cannot measure.

### 3.1 Length Tiers

| Tier | Conversations | Purpose |
|------|---------------|---------|
| 128K tokens | 20 | Baseline — comparable to prior benchmarks |
| 500K tokens | 35 | Mid-range, approximating typical long chats |
| 1M tokens | 35 | Frontier-context stress test |
| 10M tokens | 10 | Beyond-frontier test |

The asymmetric distribution — fewer conversations at the extreme — reflects cost. A 10M-token synthetic conversation is expensive to generate, verify, and evaluate. Ten is enough to surface qualitative failure modes without breaking the compute budget.

### 3.2 Stage 1: Conversation Plans

Each conversation begins as a structured seed containing:

- **Domain** — coding, math, health, finance, personal, etc.
- **Title/theme** — the overarching narrative arc.
- **Subtopics** — 15–20 narrative threads that will weave through the dialogue.
- **User profile** — name, age, gender, profession, MBTI personality type.
- **Relationship graph** — who the user knows and how.
- **Explicit timeline** — a calendar of events that will be referenced.

For conversations at or below 1M tokens, a single LLM-generated plan suffices. For 10M-token conversations, the pipeline uses one of two expansion strategies:

- **Sequential Expansion** — ten interlocking plans chained by successive events (time-ordered).
- **Hierarchical Decomposition** — ten interlocking plans organized by topical segment (theme-ordered).

Plans are then augmented with three **targeted bullet points** per sub-plan: one for a contradiction the conversation must contain, one for a knowledge update, and one for an instruction the user will issue. These bullets are the anchors against which probing questions will later be generated — they guarantee that every conversation contains testable events for every ability.

### 3.3 Stage 2: User Utterance Generation

Each sub-plan's bullets are divided into K contiguous batches. Per batch, an LLM — specifically **LLaMA-3.3 70B** — generates I user questions conditioned on:

- The conversation seed (profile, timeline, relationships)
- The current batch of bullets
- All preceding batches (for local coherence)
- Earlier sub-plan context (for global coherence)

The K and I hyperparameters vary by domain and target length; specifics live in Table 6 of the paper.

### 3.4 Stage 3: Assistant Utterance Generation

The assistant side is generated by iterative role-playing. An assistant LLM and a user LLM alternate, but the pipeline also includes two interaction modules:

- **Question-detection:** if the assistant's response includes a counter-question requiring the user to reply, the pipeline enforces a follow-up turn.
- **Follow-up detection:** if a clarifying or elaborative user question is warranted, one is generated.

Loop thresholds cap both at two exchanges (δ₁ = δ₂ = 2), preventing runaway follow-up cascades.

The assistant conditions on the conversation seed, prior sub-plans, a summary of the last M turns, and compressed summaries of earlier content. This mirrors how a realistic long-context agent would operate and keeps the generated dialogue locally coherent over millions of tokens.

### 3.5 Stage 4: Probing Question Generation

With the conversation complete, **GPT-4.1-mini** generates candidate probing questions. For each target memory ability, the model selects candidate bullet points from the plan, then produces:

- A question
- A candidate answer
- Source identifiers pointing to the dialogue locations needed to answer it

For 10M-token dialogues, a sliding window across the ten sub-plans preserves topical locality — probes are not generated from random global positions but from semantically coherent slices. Ability-specific prompts (Prompts 10–19 in Appendix H of the paper) guide the generator.

Candidate questions are **reviewed by human annotators**. Invalid questions are discarded; inconsistencies are corrected. From the validated set, two questions per ability are selected per conversation, yielding **20 validated probes per conversation × 100 conversations = 2,000 total questions**.

### 3.6 Stage 5: Evaluation Nugget Creation

For each validated question, annotators decompose the reference answer into **atomic, self-contained criteria** that a system response must satisfy — "nuggets." A response is then scored by an LLM judge against each nugget:

- **0** — nugget unsatisfied
- **0.5** — nugget partially satisfied
- **1** — nugget fully satisfied

Final score per question is the mean over nuggets. The exception, again, is **Event Ordering**, which uses Kendall tau-b to measure both presence *and* order.

### 3.7 Human Quality Validation

The 100 conversations were rated by human annotators on three axes:

- **Coherence:** 4.53 / 5
- **Realism:** 4.57 / 5
- **Complexity:** 4.64 / 5

These scores matter. Synthetic long-context benchmarks have historically suffered from plausibility gaps — conversations that are long but shallow or inconsistent. BEAM's human ratings above 4.5 across all three axes indicate the generation pipeline produced dialogues that human reviewers found believable.

---

## 4. Domain Breakdown

The paper describes BEAM as "multi-domain" and reviewers confirm this was a deliberate departure from LoCoMo / LongMemEval / MemBench, which restricted themselves to personal-life scenarios. Appendix B.3.1 details domain coverage; the visible summary reports conversations drawn from:

- **Personal life** (traditional baseline — family, relationships, daily routines)
- **Coding and technical discussion** (software projects, debugging sessions, architectural conversations)
- **Mathematics** (problem-solving dialogues, proof walkthroughs)
- **Health and medical** (symptom tracking, treatment plans, long-term conditions)
- **Finance** (budgeting, investment planning, account tracking)
- **Travel and logistics** (multi-trip planning, itinerary updates)
- **Career progression** (job changes, skill development, professional goals)

The paper does not publish a precise per-domain count of conversations; the available text says "diverse domains" and "topical diversity reviewed by human annotators." For derivative research, this is a minor gap — the conversations are public, so domain counts can be computed from the released dataset.

---

## 5. Baselines and Scores

BEAM evaluates four backbone LLMs, each under three conditions: **Vanilla** (full context, no memory system), **RAG** (retrieval-augmented), and **LIGHT** (the paper's proposed framework).

### 5.1 Models Tested

| Model | Type | Context window | Role |
|-------|------|----------------|------|
| GPT-4.1-nano | Proprietary | 1M | Frontier proprietary baseline |
| Gemini-2.0-flash | Proprietary | 1M | Frontier proprietary baseline |
| Qwen2.5-32B-AWQ | Open-source | 128K (32K under LIGHT) | Mid-size open baseline |
| Llama-4-Maverick-fp8 | Open-source | 128K | Large open baseline |

### 5.2 Aggregate Results

**At 100K tokens:**

| Model | Vanilla | RAG | LIGHT |
|-------|---------|-----|-------|
| Qwen2.5-32B | 0.280 | 0.269 | 0.311 |
| Llama-4-Maverick | 0.240 | 0.323 | 0.358 |
| Gemini-2.0-flash | 0.242 | 0.280 | 0.294 |
| GPT-4.1-nano | 0.239 | 0.309 | 0.345 |

**At 1M tokens:**

| Model | Vanilla | RAG | LIGHT |
|-------|---------|-----|-------|
| Qwen2.5-32B | 0.193 | 0.285 | 0.309 |
| Llama-4-Maverick | 0.259 | 0.307 | 0.336 |
| Gemini-2.0-flash | 0.199 | 0.271 | 0.284 |
| GPT-4.1-nano | 0.191 | 0.302 | 0.336 |

**At 10M tokens:**

| Model | Vanilla | RAG | LIGHT |
|-------|---------|-----|-------|
| Llama-4-Maverick | 0.104 | 0.249 | 0.266 |
| GPT-4.1-nano | 0.109 | 0.218 | 0.226 |

Two observations dominate these tables.

**First**, absolute scores are low — *everywhere*. The best single score at 100K tokens is 0.358 (Llama + LIGHT). At 10M tokens, the best is 0.266. Even with state-of-the-art models and state-of-the-art memory frameworks, more than two-thirds of probing questions are answered incorrectly or only partially correctly. Long-term memory in LLMs is, empirically, nowhere near solved.

**Second**, vanilla full-context performance **collapses** as conversations lengthen. GPT-4.1-nano at 100K vanilla scores 0.239; at 10M vanilla it scores 0.109 — a 54% relative drop. Llama-4-Maverick drops from 0.240 to 0.104, a 57% relative drop. The million-token context window is not the solution to long-term memory; it is a mirage. Throwing more context at the problem without structured memory actively hurts.

### 5.3 Relative Improvements

Expressed as gains over vanilla baselines, LIGHT's contribution grows with conversation length:

- **100K:** +49.1% (Llama), +44.3% (GPT-4.1-nano)
- **1M:** +60.1% (Qwen), +75.9% (GPT-4.1-nano)
- **10M:** +155.7% (Llama), +107.3% (GPT-4.1-nano)

The headline average improvement — 3.5%–12.69% over the *strongest baselines* — undersells this picture. Over RAG, LIGHT is a modest improvement. Over vanilla full-context, LIGHT is transformative at extreme lengths, more than doubling scores at 10M tokens. The right comparison depends on what you're trying to beat.

---

## 6. LIGHT Framework Architecture

LIGHT (Long-term Index, General scratchpad, Hierarchical Three-memory framework, though the acronym is loose in the paper) is a cognitively inspired architecture that equips any backbone LLM with three complementary memory systems plus a filtering layer.

### 6.1 Component 1: Episodic Memory (Long-term Index)

The episodic memory component mirrors declarative long-term memory in human cognition. After each user–assistant turn, LIGHT invokes **Qwen2.5-32B-AWQ** to extract key–value pairs and a summary of the interaction:

- **Keys** represent entities (people, places, concepts, objects).
- **Values** capture attributes or descriptive details about those entities.

These key–value items and summaries are embedded using **BAAI/bge-small-en-v1.5** and stored in a vector database. At inference time, the user's question is embedded and compared against stored keys; the top *k* nearest neighbors are returned.

The default retrieval budget is **k = 15**, determined by ablation (see §7). Retrieval budgets of 10 or 20 both degraded performance — 10 surfaced too little, 20 introduced noise.

### 6.2 Component 2: Working Memory (Short-term Buffer)

Working memory is the simplest component: the most recent *z* dialogue pairs of the conversation are included verbatim in the prompt, without filtering. This provides continuity for references to the immediately preceding context — resolving pronouns, following multi-turn topics, handling recent clarifications.

Notably, ablation shows that at shorter lengths (500K and 1M tokens) **removing working memory slightly *improves* performance**. Recent context can introduce noise for questions about distant events. At 10M tokens, removing working memory costs 5.7% — so the component pays off only when the conversation is long enough that local and global contexts are clearly separated.

### 6.3 Component 3: Scratchpad (Accumulated Facts)

The scratchpad is LIGHT's most novel component. It's an iteratively compressed semantic layer that accumulates salient facts, user instructions, and contextual updates throughout the conversation.

After each dialogue pair, the LLM reasons over the current and preceding turn and extracts "salient content." This content is merged into the scratchpad. When the scratchpad exceeds **30K tokens**, it is compressed back down to **15K tokens** — a rolling 2:1 compression that keeps the scratchpad bounded.

At inference time, the scratchpad is processed by a filtering pipeline:

1. **Semantic chunking** divides the scratchpad into coherent chunks.
2. **Binary relevance classification** — an LLM assigns each chunk a yes/no label relative to the user's current question.
3. **Retention** — only chunks labeled yes are passed to the final generator.

This filtering layer is critical. Ablation shows that removing the noise filter costs between 2.2% (at 100K) and 8.3% (at 10M). The scratchpad without filtering introduces nearly as much noise as it eliminates.

### 6.4 Integration at Inference

When a new question arrives, LIGHT assembles the prompt as follows (Listing 44 in the paper's appendix):

1. Retrieve top-15 items from **episodic memory** using the question as query.
2. Include the most recent *z* turns as **working memory**.
3. Run the **scratchpad** through semantic chunking and relevance filtering, keeping only relevant chunks.
4. Combine all three memory representations with the question.
5. Pass to the backbone LLM for response generation.

The architecture is deliberately modular. Any of the three memory systems can be swapped (different retrievers, different chunking strategies, different filter models) without rewriting the others. This matters because it means the framework is a research *platform*, not just a single proposed system.

---

## 7. Ablation Studies

The paper performs two sets of ablations: component removal and retrieval budget sensitivity.

### 7.1 Component Ablations

Components removed one at a time, with performance deltas measured across length tiers:

**100K tokens:**
- Remove episodic memory: no change
- Remove scratchpad: –1.1%
- Remove working memory: –1.6%
- Remove noise filter: –2.2%

**500K tokens:**
- Remove episodic memory: harmful
- Remove scratchpad: harmful
- Remove working memory: slight improvement
- Remove noise filter: harmful

**1M tokens:**
- Remove episodic memory: harmful
- Remove scratchpad: harmful
- Remove working memory: slight improvement
- Remove noise filter: harmful

**10M tokens:**
- Remove episodic memory: –8.5%
- Remove scratchpad: –3.7%
- Remove working memory: –5.7%
- Remove noise filter: –8.3%

**Conclusion from the paper:** "Each module contributes increasingly as context length grows, and the full architecture consistently achieves the best performance."

Three specific insights from these numbers are worth highlighting:

1. **Episodic memory is the single most important component at scale.** At 10M tokens, removing retrieval costs 8.5% — more than any other single ablation. Long-term memory is, fundamentally, a retrieval problem.

2. **The noise filter is nearly as important as retrieval itself** (–8.3% at 10M). Raw scratchpad content, dropped into the prompt unfiltered, nearly neutralizes the benefit of having a scratchpad at all. This is an underappreciated finding: memory is not just about what you store but about what you *suppress* at recall time.

3. **Working memory is a double-edged sword.** At mid-range lengths it is marginally harmful; at extreme lengths it is helpful. This suggests that for questions about *the current topic*, recent turns help; for questions about *distant topics*, recent turns pollute the prompt with irrelevant continuation.

### 7.2 Retrieval Budget Sensitivity

Testing k ∈ {5, 10, 15, 20}:

- **k = 15** is optimal across all length tiers (+7.39% at 100K, +10.75% at 500K, +6.79% at 1M, +6.3% at 10M).
- **k = 20** degrades slightly due to noisy context — more retrieval is not better.
- **k = 10** is mixed: helpful at shorter lengths, harmful at 10M.
- **k = 5** underperforms everywhere — too little coverage.

The stability of k = 15 across a 100× length range is striking. It suggests that the relevant "memory surface" for any given question is bounded — once you've pulled the top 15 items, additional retrieval adds noise faster than signal.

---

## 8. Failure Modes

Appendix G of the paper catalogs qualitative error categories across all ten abilities. Patterns that recur:

**Contradiction Resolution is nearly broken across the board.** Scores near 0.025–0.037 at 100K tokens mean models correctly reconcile contradictions about 3% of the time. This is the single clearest open problem the benchmark identifies. Current architectures — vanilla attention, RAG, and LIGHT — all struggle to surface two conflicting claims simultaneously.

**Retrieval failures propagate as abstention inflation.** When the retriever fails to find relevant chunks, downstream models often abstain. This makes abstention scores artificially high and masks upstream failure. Any memory benchmark should report abstention alongside retrieval recall, not in isolation.

**Temporal reasoning collapses under implicit time relations.** Explicit dates and durations are tractable; implicit markers ("last winter," "a few months ago") are not. This is a language-understanding problem layered on top of a memory-retrieval problem.

**Instruction persistence decays roughly monotonically with distance.** An instruction issued at turn 50 is respected at turn 100, sometimes at turn 500, rarely at turn 5000. The decay curve is steep.

**Preference drift is common.** Models remember that a preference exists but not its specific content — remembering "the user has dietary restrictions" while forgetting "vegetarian, no dairy." This is partial-recall failure, distinct from total-recall failure.

**Summarization quality drops as distance grows.** Summarizing the last ten turns is easy; summarizing turns 100-200 out of 10000 is hard. Compression quality is length-dependent in a way that naive memory systems do not account for.

One observation from the paper is worth quoting directly: *"All methods — including ours — perform strongest in abstention and weakest in contradiction resolution, indicating that contradiction detection remains a challenging open problem."*

---

## 9. Per-Ability Results (100K Illustrative Slice)

The following table shows Qwen2.5 and Llama-4-Maverick scores at 100K tokens to illustrate the ability-by-ability texture:

| Ability | Qwen Vanilla | Qwen RAG | Qwen LIGHT | Llama Vanilla | Llama RAG | Llama LIGHT |
|---------|-------------|----------|-----------|--------------|-----------|------------|
| Abstention | 0.300 | 0.650 | 0.475 | 0.200 | 0.800 | 0.600 |
| Contradiction Resolution | 0.031 | 0.025 | 0.037 | 0.025 | 0.031 | 0.031 |
| Event Ordering | 0.192 | 0.201 | 0.205 | 0.190 | 0.162 | 0.166 |
| Information Extraction | 0.425 | 0.338 | 0.479 | 0.510 | 0.392 | 0.518 |
| Instruction Following | 0.400 | 0.375 | 0.362 | 0.412 | 0.375 | 0.412 |
| Knowledge Update | 0.437 | 0.275 | 0.362 | 0.300 | 0.350 | 0.450 |
| Multi-Hop Reasoning | 0.222 | 0.203 | 0.281 | 0.152 | 0.225 | 0.353 |
| Preference Following | 0.554 | 0.379 | 0.566 | 0.450 | 0.512 | 0.625 |
| Summarization | 0.128 | 0.074 | 0.232 | 0.065 | 0.111 | 0.238 |
| Temporal Reasoning | 0.112 | 0.162 | 0.112 | 0.100 | 0.275 | 0.187 |

Several patterns jump out.

**RAG sometimes hurts.** Look at Qwen on Information Extraction: vanilla 0.425, RAG 0.338. RAG actively degrades recall because retrieval surfaces near-duplicates or context-stripped fragments that confuse the generator. LIGHT rescues this (0.479) by combining retrieval with the scratchpad's accumulated context.

**Abstention does not correlate with overall skill.** Llama-4-Maverick + RAG scores 0.800 on abstention — the highest number in the table — but its overall average is middling. High abstention means the model is refusing more often, not that it is reasoning more correctly.

**LIGHT's largest gains are in Summarization and Multi-Hop Reasoning.** Llama Summarization goes from 0.065 (vanilla) to 0.238 (LIGHT) — a 3.7× improvement. Multi-Hop goes from 0.152 to 0.353, a 2.3× improvement. These are the abilities where the scratchpad component provides the most leverage: rolling summaries pre-compute what summarization probes want, and the episodic index provides the multi-hop substrate.

**Contradiction Resolution is stuck near zero regardless of method.** No configuration scores above 0.037. This is not a LIGHT limitation — it is a fundamental open problem.

Aggregated across all models and conditions, LIGHT's relative gains by ability are:

- **Summarization:** +160.6%
- **Preference Following:** +76.5%
- **Temporal Reasoning:** +56.3%
- **Instruction Following:** +39.5%
- **Multi-Hop Reasoning:** +27.2%

---

## 10. Implications for Memory System Designers

For anyone building long-term memory for LLM agents — which, for gsd-skill-creator's LTM mission, is us — BEAM provides ten concrete lessons.

### 10.1 Measure all ten abilities, not just recall

The industry's default memory benchmark is usually "can the model recall a fact?" BEAM demonstrates that this is the *easiest* ability class. A memory system that nails Information Extraction can still be useless because it fails Contradiction Resolution, Temporal Reasoning, or Event Ordering. When we evaluate our own architecture, we need all ten dimensions in the scorecard.

### 10.2 Long context is not memory

The headline finding of BEAM is that million-token context windows, used naively, collapse on long conversations. Vanilla GPT-4.1-nano at 10M tokens scores 0.109 — essentially unusable. Context-window size is a necessary condition for long-term memory, but it is not sufficient. Memory is an architectural problem, not a capacity problem.

### 10.3 Structured retrieval with a bounded budget beats unbounded attention

The k = 15 retrieval budget is surprisingly stable across 100× length variation. This suggests that the relevant memory surface for any given question is bounded. Design implication: when building a memory retrieval layer, optimize for precision at a small k, not recall at a large k. Returning 100 chunks and letting the model sort them out is a losing strategy.

### 10.4 Filter what you remember before you use it

The noise filter in LIGHT is almost as important as the memory itself. Removing it costs 8.3% at 10M tokens — nearly matching the cost of removing episodic retrieval. Raw memory dumps are noisy; relevance gating is essential. Any memory system that pulls content and injects it verbatim into the prompt is leaving a huge amount of accuracy on the table.

### 10.5 Rolling summaries ("scratchpads") are high-leverage

LIGHT's scratchpad component drives the +160.6% gain on Summarization and +27.2% on Multi-Hop Reasoning. A scratchpad is conceptually cheap — an LLM extracts salient facts after each turn, compresses when bounded — but it provides a pre-computed substrate that downstream queries can exploit. This is a free lunch for memory systems.

### 10.6 Three memory types (episodic, working, scratchpad) are a defensible minimum

Ablation shows each of the three memory types carries its weight at 10M tokens. Single-memory architectures (pure retrieval, pure recent-context, pure summary) underperform the three-way combination. When designing our own memory, "which memory type" is the wrong question — the right question is "how do our memory types compose."

### 10.7 Contradiction resolution is the open frontier

No current memory architecture handles contradiction resolution well. If a research program can demonstrably improve this ability, it will leapfrog the field. This is the single most valuable research direction BEAM identifies. Possible attack vectors: explicit contradiction-detection modules, two-claim retrieval (surface *pairs* of claims, not single claims), or temporal-delta tracking.

### 10.8 Abstention scores must be reported alongside recall

A memory system that refuses to answer looks well-calibrated — but may just be retrieval-broken. When evaluating our architecture, we should report abstention rate alongside recall precision so that "safe silence" is distinguishable from "informed silence."

### 10.9 Working memory is dangerous in the mid-range

The ablation finding that removing working memory slightly improves 500K and 1M performance is counter-intuitive but consistent with noise theory. Recent-turn context contains a lot of material unrelated to the current query. For memory systems targeting conversations in the 500K–1M range, working memory should be *optional* — included only when the question is about local continuity, excluded when the question is about distant facts. This is a routing decision we should expose.

### 10.10 Evaluate at lengths beyond your target deployment

BEAM's 10M-token tier is deliberate: by stress-testing 10× beyond realistic deployment, you find failure modes that don't surface at deployment length. When we evaluate our memory system, we should run it at 2–10× the length we actually care about. If it breaks at 10× but works at 1×, we know we've earned no safety margin.

---

## 11. What BEAM Does Not Measure

For honest engineering, the gaps matter as much as the coverage.

**Write latency.** BEAM measures read-side accuracy. It does not measure how long episodic memory ingestion, scratchpad updates, or compression passes take. A memory system that scores well but is too slow for real-time use fails in production. This is left to the implementer.

**Storage footprint.** No disk-size or memory-footprint numbers. LIGHT's scratchpad bounds at 30K → 15K tokens; episodic memory is a vector store of unknown final size. For embedded or resource-constrained deployments, these numbers matter.

**Cross-conversation generalization.** BEAM tests memory *within* a conversation. It does not test memory *across* conversations — the ability for a system to carry context from one session into another. Many real agents need this. BEAM is silent on it.

**Online update latency.** Can the memory system handle streaming updates at production rates? The paper's evaluation is batch. Real deployments are online.

**Cost.** LIGHT runs multiple LLM calls per turn (extraction, compression, filtering). This is invisible in the benchmark scores but very visible in the cloud bill.

**Robustness to adversarial inputs.** The synthetic generation pipeline assumes well-intentioned users. Adversarial inputs — prompt injection into the memory layer, contradictory facts planted deliberately, memory poisoning — are out of scope.

These gaps are not criticisms of BEAM; they are reasonable scope decisions for a first benchmark. They are things we must measure ourselves when evaluating a production memory system.

---

## 12. Conclusion: BEAM as Reference Point

BEAM establishes four things that will anchor long-term memory research for the next several years:

1. **A ten-ability taxonomy** that carves the memory problem into orthogonal measurable slices.
2. **A 10M-token test bed** that exposes failure modes invisible at shorter lengths.
3. **A rigorous synthetic generation pipeline** validated by human quality ratings above 4.5/5.
4. **An open baseline (LIGHT)** that proves structured memory beats naive long-context by large margins, especially at scale.

For gsd-skill-creator's LTM mission, BEAM is the right reference point. We should adopt its ten-ability framework as our evaluation scorecard, run our memory architecture against its 100 conversations and 2,000 probing questions, and report per-ability scores alongside averages. If we beat LIGHT on Contradiction Resolution, we have something worth publishing. If we match LIGHT on the other nine while running at a fraction of the cost, we have something worth shipping.

The most important thing BEAM does is honest: it reports low absolute scores, admits contradiction resolution is broken, shows that long context without structure collapses, and publishes its failure modes. This is the culture memory research needs. The next benchmark will build on BEAM. The ten abilities — especially the three novel ones — will almost certainly persist.

---

## Sources

- [BEAM GitHub repository](https://github.com/mohammadtavakoli78/BEAM) — primary artifact, README, code, evaluation scripts
- [BEAM on ArXiv (2510.27246)](https://arxiv.org/abs/2510.27246) — ICLR 2026 paper
- [BEAM HTML on ArXiv](https://arxiv.org/html/2510.27246) — full paper text with tables
- [OpenReview record](https://openreview.net/forum?id=y59hf5lrMn) — reviewer discussion and paper PDF
- [Hindsight blog: "Hindsight Is #1 on BEAM"](https://hindsight.vectorize.io/blog/2026/04/02/beam-sota) — early independent run against BEAM, April 2026
- [ResearchGate mirror](https://www.researchgate.net/publication/397188711_Beyond_a_Million_Tokens_Benchmarking_and_Enhancing_Long-Term_Memory_in_LLMs) — alternate access
- [alphaXiv discussion](https://www.alphaxiv.org/abs/2510.27246) — community annotations

---

**Next module:** `02-ltm-architectural-patterns.md` — surveys memory architectures beyond LIGHT (Memory3, MemoryLLM, Generative Agents, Mem0, Letta/MemGPT) and maps them onto BEAM's ten-ability framework.
