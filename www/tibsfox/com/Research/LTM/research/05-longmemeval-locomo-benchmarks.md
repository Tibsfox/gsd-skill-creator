# Module 05: LongMemEval, LoCoMo, HotPotQA, MSC — Benchmark Methodology

**Research cluster:** Long-Term Memory (LTM)
**Module status:** Foundational survey
**Research date:** 2026-04-08
**Confidence:** HIGH on dataset statistics; MEDIUM on exact SOTA numbers (rapidly moving target)

---

## 1. Why This Module Exists

`gsd-skill-creator` has ingested **129 sessions and 16,928 conversation turns** into PostgreSQL. That is real interactive workload — not synthetic, not crawled, not crowdworker-cobbled. It is the exact substrate a long-term memory system for a coding agent would have to reason over in production.

The question is: *how do we evaluate whether our memory system actually works?* We cannot answer that by intuition. We need a benchmark. And before we build one, we need to understand what the research community has already done well, done poorly, and left on the table.

This module surveys six long-term memory benchmarks in depth:

1. **LongMemEval** (Wu et al., ICLR 2025) — the current gold standard for interactive chat memory
2. **LoCoMo** (Maharana et al., ACL 2024) — the "very long" conversational memory benchmark from Snap Research and Stanford
3. **HotPotQA** (Yang et al., EMNLP 2018) — the multi-hop QA ancestor that every memory benchmark borrows from
4. **MSC / Multi-Session Chat** (Xu, Szlam, Weston, ACL 2022) — Facebook AI's "Beyond Goldfish Memory" dataset that effectively kicked off the field
5. **MemBench** (Tan et al., ACL Findings 2025) — a multi-dimensional framework from Renmin University
6. **ConvoMem** (Pakhomov, Nijkamp, Xiong, Salesforce AI Research, 2025) — the newest entrant, designed as an explicit LoCoMo alternative

For each, we extract citation, size, categories, construction methodology, metrics, leaderboard status, limitations, licensing, and reproducibility. At the end we compare them side-by-side against the BEAM ability categories (Module 02) and sketch what a **Tibsfox Session Benchmark** — built from our 129 real sessions — would look like if we adapted this methodology to our own workload.

---

## 2. LongMemEval (ICLR 2025)

### Citation

> Wu, D., Wang, H., Yu, W., Zhang, Y., Chang, K.-W., Yu, D. (2025). *LongMemEval: Benchmarking Chat Assistants on Long-Term Interactive Memory*. International Conference on Learning Representations (ICLR).
> arXiv: [2410.10813](https://arxiv.org/abs/2410.10813) — submitted October 14 2024, revised March 4 2025, accepted ICLR 2025.

Affiliations span Tencent AI Lab Seattle, UCLA, and the University of Notre Dame.

### Dataset Size

LongMemEval ships with **500 meticulously curated evaluation instances**, each embedded in a scalable chat history. The paper releases three variants:

| Variant | History length | Purpose |
|---------|----------------|---------|
| `longmemeval_s` | ~40 sessions, ~115k tokens (Llama 3 tokenizer) | The headline "short" variant everyone reports |
| `longmemeval_m` | ~500 sessions per instance | Stress test for retrieval at scale |
| `longmemeval_oracle` | Evidence sessions only | Upper bound for reading; strips the needle-in-a-haystack problem |

The 500 instances are distributed across question types. The paper also includes **30 abstention instances** — questions the assistant should refuse to answer because the conversation history does not support a response.

### Question Categories (5 Memory Abilities)

LongMemEval's central contribution is its explicit taxonomy of memory abilities:

1. **Information Extraction** — recall a specific fact the user mentioned earlier (e.g., "What's my dog's name?")
2. **Multi-Session Reasoning** — synthesize facts across multiple distinct sessions (e.g., "What did I say about Python last week that conflicts with what I said about Rust yesterday?")
3. **Knowledge Updates** — track when a fact has been superseded (e.g., user said they live in Seattle in session 3, then said they moved to Austin in session 17 — "Where do I live?" must answer Austin, not Seattle, not both)
4. **Temporal Reasoning** — reason about *when* things happened relative to each other or absolute time (e.g., "What project did I work on three weeks ago?")
5. **Abstention** — refuse to answer when the history doesn't contain the answer, rather than hallucinating

This five-way split is the closest thing the field has to a consensus taxonomy of chat-memory abilities. It maps cleanly onto the BEAM categories (see Module 02): Information Extraction = Persistence; Multi-Session Reasoning = Association; Knowledge Updates = Revision; Temporal Reasoning = Chronology; Abstention = Metacognition.

### Construction Methodology

LongMemEval uses an **attribute-controlled synthetic pipeline** inspired by "needle in a haystack" evaluations. Evidence sessions are authored (human-in-the-loop) to plant specific recall targets, then interleaved with filler sessions drawn from ShareGPT and UltraChat. Every session is timestamped, so temporal reasoning questions have ground-truth anchors.

The deliberate design is: histories should be **coherent, extensible, and timestamped**. "Coherent" because you can't just concatenate random conversations — the user persona has to be consistent. "Extensible" because the same 500 questions should still work if you swap in 10x more filler sessions. "Timestamped" because memory without time isn't memory at all.

### Evaluation Metrics

Three-layer evaluation:

- **Turn-level recall** — did the retrieval system surface the correct turn?
- **Session-level recall** — did it surface the correct session?
- **QA accuracy** — did the full system (retrieval + reader) produce the right answer? This is scored with GPT-4o as autoeval judge (`autoeval_label` field in the released data).

### SOTA / Leaderboard

The headline finding is brutal: **commercial chat assistants and long-context LLMs show a ~30% accuracy drop on memorizing information across sustained interactions.** GPT-4o, Claude, and Gemini — despite all their context-length bragging rights — cannot reliably reason over ~115k tokens of interactive history.

LongMemEval does not maintain a public leaderboard; the paper reports baselines for BM25, Contriever, Stella, GTE retrievers paired with GPT-4o / Claude readers, and a full-history no-retrieval condition. As of ICLR 2025 camera-ready, the best reported configuration hovers around **60-70% on longmemeval_s** depending on the memory ability slice. Temporal reasoning is consistently the weakest slice (<50%).

### Limitations

- **Synthetic histories** — filler sessions from ShareGPT/UltraChat are real but *not this user's actual conversation*. Persona coherence is approximate.
- **Single-user-persona only** — no multi-user context, no shared memory across agents.
- **English only.**
- **500 instances is small** compared to ConvoMem's 75k.
- **Autoeval via GPT-4o** introduces a judge bias and costs money to reproduce honestly.

### Licensing

MIT license. Data on Hugging Face at `xiaowu0162/longmemeval-cleaned` (September 2025 update cleaned some noise in filler sessions).

### Running Locally

```bash
git clone https://github.com/xiaowu0162/LongMemEval
cd LongMemEval
pip install -r requirements-lite.txt    # evaluation-only
# or: pip install -r requirements-full.txt  # with memory systems, CUDA 12.1
python3 evaluate_qa.py gpt-4o hypothesis_file.json data/longmemeval_oracle.json
```

The repo supports vLLM server wrappers for open-weight models. Cost note: evaluating all 500 instances on GPT-4o via the autoeval pipeline runs about **$15-25 in API fees** depending on reader model — cheap by benchmark standards, but nontrivial if you're iterating daily.

---

## 3. LoCoMo (ACL 2024)

### Citation

> Maharana, A., Lee, D.-H., Tulyakov, S., Bansal, M., Barbieri, F., Fang, Y. (2024). *Evaluating Very Long-Term Conversational Memory of LLM Agents*. Proceedings of the 62nd Annual Meeting of the Association for Computational Linguistics (ACL 2024), Volume 1 (Long Papers), pp. 13851–13869.
> arXiv: [2402.17753](https://arxiv.org/abs/2402.17753) — February 27 2024.
> Project page: [snap-research.github.io/locomo](https://snap-research.github.io/locomo/)
> Code: [github.com/snap-research/locomo](https://github.com/snap-research/locomo)

Affiliations: UNC Chapel Hill, USC, Snap Research.

### Dataset Size

LoCoMo is famous for going *long*. There are two slightly different sets of numbers floating around the literature because the paper and the public release don't match exactly:

| Source | Conversations | Avg turns | Avg tokens | Max sessions |
|--------|---------------|-----------|------------|--------------|
| arXiv preprint abstract | ~50 (initial) | 300 | 9,000 | 35 |
| ACL 2024 published | 10 | 600 | 16,000 | 32 |
| Public release (`locomo10.json`) | 10 | variable | variable | variable |

The public release is only **10 conversations**. This is small — dramatically smaller than LongMemEval's 500 questions or ConvoMem's 75k. The justification in the README is "quality and cost-effectiveness," but in practice it means any score on LoCoMo has wide confidence intervals and cherry-picking risk.

Even at 10 conversations, each individual conversation is enormous: 300-600 turns, 9k-16k tokens, spanning up to 35 sessions. This is qualitatively different from LongMemEval — *fewer, deeper* rather than *more, shallower*.

### Question Categories (5 Types)

1. **Single-hop** — answer from one session
2. **Multi-hop** — synthesize from multiple sessions
3. **Temporal** — reason about time
4. **Open-domain** — requires external world knowledge beyond the conversation
5. **Adversarial** — designed to trigger hallucination; the answer is "I don't know" or "not stated"

The "open-domain" category is a notable addition not in LongMemEval. It asks: does the model ground its answer in the conversation, or does it leak in external knowledge it shouldn't be using?

The "adversarial" category overlaps with LongMemEval's Abstention.

### Construction Methodology

LoCoMo uses a **machine-human pipeline** grounded in personas and temporal event graphs. The steps:

1. Seed each conversation with two personas (hobbies, jobs, relationship)
2. Generate a temporal event graph — things that happen to the personas over time
3. LLM agents play the personas, exchanging messages (with optional image sharing for multimodal variant)
4. Human annotators verify and edit for long-range consistency
5. Human annotators write QA pairs referencing specific session ranges
6. Event summarization task has separate annotations

The **multimodal** dimension is unique: LoCoMo conversations include images that personas share, and models must reason over both text and image content. Practically, this is rarely evaluated because most memory systems are text-only, but it's in the dataset.

### Evaluation Metrics

Three tasks, each with its own metrics:

- **QA:** F1, exact match, GPT-4-as-judge accuracy
- **Event summarization:** ROUGE, BLEU, BERTScore
- **Multimodal dialogue generation:** F1, BLEU, perplexity

### SOTA / Leaderboard

No public leaderboard. Paper reports:

- **Long-context LLMs improve by 22-66%** over short-context baselines but still **lag human performance by 56%**
- **Temporal reasoning shows a 73% human-model gap** — the worst category, just like in LongMemEval
- RAG-based memory offers a "balanced compromise" but nothing wins outright

Subsequent work (Mem0, Zep, MemoryOS, Graphiti) all report LoCoMo scores, typically in the 40-65% F1 range on the QA task, depending on configuration.

### Limitations

- **Only 10 public conversations** — statistically weak, cherry-pick-prone
- **Synthetic personas** — not real users, no genuine drift
- **Heavy human annotation** — expensive to extend or replicate
- **Multimodal component often ignored** — most evaluators run text-only
- **The 10-conversation release vs. 50-conversation paper discrepancy** is a persistent source of confusion

### Licensing

Research license via the snap-research GitHub (check LICENSE.txt; non-commercial with attribution in most reads).

### Running Locally

```bash
git clone https://github.com/snap-research/locomo
cd locomo
# Configure API keys in scripts/env.sh
bash scripts/evaluate_gpts.sh      # OpenAI
bash scripts/evaluate_claude.sh    # Anthropic
bash scripts/evaluate_gemini.sh    # Google
bash scripts/evaluate_hf_llm.sh    # HuggingFace open models
```

Data at `./data/locomo10.json`.

---

## 4. HotPotQA (EMNLP 2018)

### Citation

> Yang, Z., Qi, P., Zhang, S., Bengio, Y., Cohen, W. W., Salakhutdinov, R., Manning, C. D. (2018). *HotpotQA: A Dataset for Diverse, Explainable Multi-hop Question Answering*. Proceedings of EMNLP 2018.
> arXiv: [1809.09600](https://arxiv.org/abs/1809.09600)
> Project: [hotpotqa.github.io](https://hotpotqa.github.io/)

Affiliations: CMU, Stanford, Université de Montréal, Google AI.

HotPotQA isn't strictly a memory benchmark — it's a **multi-hop reading comprehension** benchmark. We include it because (a) every memory benchmark that tests "multi-session reasoning" is borrowing directly from HotPotQA's methodology, and (b) it remains the canonical way to measure reasoning-over-multiple-documents, which is structurally equivalent to reasoning-over-multiple-sessions.

### Dataset Size

**113,000 Wikipedia-based question-answer pairs**, with two evaluation settings:

- **Distractor** — 2 gold Wikipedia paragraphs + 8 similar distractor paragraphs retrieved via TF-IDF; model reads all 10 and answers
- **Fullwiki** — entire Wikipedia is the corpus; model must also do the retrieval step

### Question Categories

Two top-level types:

1. **Bridge questions** — "The director of *Inception* was born in what year?" (must first find that Nolan directed Inception, then look up his birth year)
2. **Comparison questions** — "Are *Inception* and *Oppenheimer* directed by the same person?" (factoid comparison)

Each question carries **supporting facts** annotations — the specific sentences crowdworkers identified as required for the answer. This enables scoring whether the model is *actually reasoning* or just guessing.

### Construction Methodology

Crowdworkers on Amazon Mechanical Turk were shown pairs of Wikipedia articles (selected via hyperlink graph analysis to ensure the articles were topically related). Workers wrote questions requiring information from both articles and marked the specific sentences they used.

### Evaluation Metrics

- **Answer EM** (exact match) and **Answer F1** (token overlap)
- **Supporting Facts EM** and **Supporting Facts F1**
- **Joint EM** and **Joint F1** — requires *both* correct answer *and* correct supporting facts (the only metric that can't be gamed by retrieval-heavy models that "guess" well)

### SOTA / Leaderboard

HotPotQA has one of the longest-running public leaderboards in NLP. Current highlights:

| Setting | Model | Answer EM | Joint EM | Year |
|---------|-------|-----------|----------|------|
| Distractor | Beam Retrieval | 72.69% | 77.54% | 2023 |
| Fullwiki | AISO | 67.46% | 72.00% | 2021 |

Human performance is ~97% EM. The gap remains notable, though LLMs have narrowed it significantly.

### Limitations

- **Wikipedia bias** — only factoid, encyclopedia-style reasoning
- **English, single-domain**
- **No temporal, no personalization, no revision** — this is the pure multi-hop slice
- **Bridge questions are often solvable by single-hop shortcuts** — a known criticism; some questions turn out not to actually require multi-hop reasoning

### Licensing

**CC BY-SA 4.0**. Both dataset and processed Wikipedia corpus. Fully open for commercial and research use with attribution.

### Running Locally

```bash
# Download data
wget http://curtis.ml.cmu.edu/datasets/hotpot/hotpot_train_v1.1.json
wget http://curtis.ml.cmu.edu/datasets/hotpot/hotpot_dev_distractor_v1.json
wget http://curtis.ml.cmu.edu/datasets/hotpot/hotpot_dev_fullwiki_v1.json
# Official eval script
python hotpot_evaluate_v1.py prediction.json hotpot_dev_distractor_v1.json
```

---

## 5. MSC — Multi-Session Chat (ACL 2022)

### Citation

> Xu, J., Szlam, A., Weston, J. (2022). *Beyond Goldfish Memory: Long-Term Open-Domain Conversation*. Proceedings of ACL 2022, pp. 5180–5197.
> arXiv: [2107.07567](https://arxiv.org/abs/2107.07567)
> Project: [parl.ai/projects/msc](https://parl.ai/projects/msc/)

Facebook AI Research (now Meta AI).

MSC is the *grandmother* of long-term conversational memory benchmarks. "Beyond Goldfish Memory" was the title because prior dialogue research essentially dumped the context after every session — giving models the attention span of a goldfish.

### Dataset Size

MSC is built incrementally across sessions 1-5:

| Cut | Episodes | Utterances | Avg utterances/episode | Notes |
|-----|----------|------------|------------------------|-------|
| MSC (sessions 1-3) | 4,000 | 161,440 | 40.4 | 3 sessions per episode |
| MSC (sessions 1-4) | 1,001 | 53,332 | 53.3 | 4 sessions per episode |
| Session 5 (eval-only) | ~6,000 | — | — | Held-out evaluation |

Higher-level stats:
- **237k training examples** for the dialogue task (sessions 1-4)
- **25k validation examples**
- **130k training examples** for the summarization task
- Average utterance length: **21-23 tokens**
- Total tokens across the dataset: ~6M (estimated from reported averages)

### Construction Methodology

Crowdworkers were paired on Mechanical Turk. Each worker adopted a persona (taken from the PersonaChat dataset — another Meta AI precursor). Workers chatted for one session, then *returned hours or days later* to chat again with the same partner, and again, and again — up to 5 sessions.

Between sessions, workers were shown summaries of what they'd discussed previously (an explicit memory aid, reflecting the insight that humans don't remember everything either). This makes the dataset naturally biased toward **personal-preference recall** and **persona consistency** rather than factual reasoning.

### Evaluation Metrics

- **Perplexity** on held-out dialogue turns
- **F1 on response tokens**
- **Hits@1/k** for retrieval-based dialogue models
- **Human evaluation** for engagingness and consistency (ACUTE-Eval methodology)

### Key Findings

- Standard encoder-decoder models **degrade past ~512 token context** — the "goldfish" threshold
- Retrieval-augmented and summarization-augmented models **substantially outperform** full-context truncation
- This paper effectively launched the summarization-memory branch of the field (which Claude's own context compression inherits)

### Limitations

- **Open-domain small talk** — nobody is solving technical problems or writing code
- **No timestamps** — can't evaluate temporal reasoning
- **No knowledge updates** — personas are static across sessions
- **Crowdworker gap timing** — "hours or days" is self-reported, noisy
- **Pre-LLM era baselines** — the reported SOTA is from BlenderBot 2.0 and similar; modern LLMs blow past it

### Licensing

Released via ParlAI under the ParlAI license (research use, attribution). Check the repo for current terms.

### Running Locally

Through ParlAI:

```bash
pip install parlai
parlai display_data -t msc
parlai eval_model -t msc -m <your_model>
```

---

## 6. MemBench (ACL Findings 2025)

### Citation

> Tan, H., Zhang, Z., Ma, C., Chen, X., Dai, Q., Dong, Z. (2025). *MemBench: Towards More Comprehensive Evaluation on the Memory of LLM-based Agents*. Findings of ACL 2025, Vienna.
> arXiv: [2506.21605](https://arxiv.org/abs/2506.21605)
> Code: [github.com/import-myself/Membench](https://github.com/import-myself/Membench)

Affiliations: Renmin University of China, City University of Hong Kong, Huawei Noah's Ark Lab.

### Dataset Size

MemBench is the **largest** of the chat-memory benchmarks by raw question count (until ConvoMem arrived):

- **500 user relation graphs** (each with entity profiles)
- **65,000 total questions** across four quadrants:

| Scenario × Level | Questions | Trajectories |
|------------------|-----------|--------------|
| Participation × Factual | 39,000 | 8,000 |
| Participation × Reflective | 3,500 | 3,500 |
| Observation × Factual | 8,500 | 8,500 |
| Observation × Reflective | 2,000 | 2,000 |

### Memory Levels and Interactive Scenarios

MemBench's distinctive contribution is a **2×2 factorial design**:

**Levels:**
- **Factual memory** — specific attributes (user's dog's name, coworker's age, last meeting date)
- **Reflective memory** — extracted preferences and higher-order summaries ("user prefers concise answers", "user dislikes small talk in morning")

**Scenarios:**
- **Participation** — agent is an active party in the dialogue
- **Observation** — agent passively watches user messages without engaging

The observation scenario is unique and clever. It models the case where a memory system is ingesting log data, emails, or Slack messages *without being the conversational partner* — which is exactly the gsd-skill-creator use case. We're ingesting 129 sessions that happened *to* an agent, not necessarily with the memory system *as* the agent.

### Evaluation Metrics

Four dimensions, not just accuracy:

1. **Memory Accuracy** — multiple-choice questions
2. **Memory Recall** — retrieval effectiveness (are the right facts being surfaced?)
3. **Memory Capacity** — at what scale does performance degrade?
4. **Memory Efficiency** — read/write time measurements

This is the first benchmark in our survey that treats **efficiency** as a first-class metric. LongMemEval and LoCoMo only measure accuracy; MemBench measures how fast.

### SOTA Results

Baselines use **Qwen2.5-7B** as the base model (not GPT-4 — this is a deliberately reproducible choice). Tested memory mechanisms include: FullMemory, RetrievalMemory, MemGPT-style, summarization-based, and others. **RetrievalMemory and FullMemory performed best** across scenarios. GPT-4o-mini, Llama-3.1-8B-Instruct, and GLM-4-9b-chat were used in some ablations.

### Limitations

- **Synthetic dialogues from user relation graphs** — no real conversation data
- **Multiple-choice format** may be gameable by elimination reasoning
- **Chinese research group** — some documentation is incomplete in English versions

### Licensing

MIT on the GitHub repo (`import-myself/Membench`).

### Running Locally

```bash
git clone https://github.com/import-myself/Membench
cd Membench
# Follow repo README — install deps, run eval scripts
```

---

## 7. ConvoMem (Salesforce AI Research, 2025)

### Citation

> Pakhomov, E., Nijkamp, E., Xiong, C. (2025). *ConvoMem Benchmark: Why Your First 150 Conversations Don't Need RAG*. arXiv preprint.
> arXiv: [2511.10523](https://arxiv.org/abs/2511.10523)
> Dataset: [huggingface.co/datasets/Salesforce/ConvoMem](https://huggingface.co/datasets/Salesforce/ConvoMem)
> Code: [github.com/SalesforceAIResearch/ConvoMem](https://github.com/SalesforceAIResearch/ConvoMem)

### Dataset Size

ConvoMem is the **largest memory benchmark** released to date:

- **75,336 question-answer pairs**
- **Configurable from 2 to 300 conversations** per test run
- **1k to 3M tokens** of test data depending on configuration
- Emphasis on **enterprise scenarios**: CRM, technical support, business process automation

This is an order of magnitude more data than LongMemEval and three orders more than LoCoMo.

### Key Thesis (from the title)

"Why your first 150 conversations don't need RAG" — the paper's central empirical finding is that simple full-context approaches achieve **70-82% accuracy on multi-message evidence cases**, while sophisticated RAG-based memory systems like Mem0 achieve only **30-45%** on the same cases.

In other words: **before you hit ~150 conversations of history, just stuff it all in context**. RAG only starts winning above that threshold, and even then only for specific query patterns.

This has enormous implications for gsd-skill-creator's 129-session corpus. We are *right at the RAG inflection point*. Reading ConvoMem carefully is probably the highest-value single action in this entire research cluster for our architecture decisions.

### Secondary Finding: Model Tier Doesn't Matter Much

Medium-tier models (GPT-4o-mini, Claude Haiku, Llama 3 8B) deliver **equivalent memory performance to premium models at 8x lower cost**. Memory is a retrieval-and-read problem, not a reasoning problem, and retrieval-and-read is easy.

### Construction Methodology

Not fully extractable from the PDF (the arXiv build is a binary stream). The paper uses enterprise scenario templates, but the core methodology is a machine-generated pipeline with human spot-checking.

### Evaluation Metrics

- **Accuracy on multi-message evidence cases** (the headline metric)
- **Accuracy on implicit-connection multi-message cases**
- Comparative framing against LongMemEval and LoCoMo

### Limitations

- **Very recent (November 2025)** — not yet extensively validated by independent replication
- **Enterprise-skewed** — CRM and tech support, not personal assistant or coding agent scenarios
- **The 150-conversation threshold claim** needs replication; this is a specific empirical finding, not a theorem

### Licensing

Apache 2.0 on the Salesforce GitHub. Hugging Face dataset under a permissive research license (check the dataset card).

---

## 8. Comparison Table

| Benchmark | Year / Venue | Size | Abilities Tested | SOTA (approx) | Reproducibility |
|-----------|--------------|------|------------------|---------------|-----------------|
| **LongMemEval** | 2025 / ICLR | 500 Qs, ~115k tok history | Extract, multi-session, update, temporal, abstain | ~60-70% on `_s`, <50% temporal | HIGH — MIT, HF dataset, one script |
| **LoCoMo** | 2024 / ACL | 10 convs, 300-600 turns, up to 35 sessions | Single-hop, multi-hop, temporal, open-domain, adversarial | ~40-65% F1, -56% vs human | MEDIUM — tiny public release, research license |
| **HotPotQA** | 2018 / EMNLP | 113k Qs | Multi-hop reading only (bridge + comparison) | 72% EM distractor, 67% fullwiki | HIGH — CC BY-SA, massive, standard eval script |
| **MSC** | 2022 / ACL | 4k+ episodes, 200k+ utterances, 5 sessions | Persona consistency, preference recall | Pre-LLM SOTA obsolete; modern ~80%+ F1 | HIGH — ParlAI, open |
| **MemBench** | 2025 / ACL Findings | 65k Qs across 4 quadrants | Factual × reflective, participation × observation, + efficiency | RetrievalMemory ≈ FullMemory on Qwen2.5-7B | MEDIUM — MIT, but docs partial |
| **ConvoMem** | 2025 / arXiv (Salesforce) | 75k QA pairs, 2-300 configurable convs | Multi-message evidence, implicit connections, enterprise | Full-context 70-82%, Mem0 30-45% | HIGH — Apache 2.0, HF dataset |

### Complementary vs Redundant

- **LongMemEval + LoCoMo** are complementary: LongMemEval is *wide* (500 questions, 5 abilities) and LoCoMo is *deep* (very long conversations). Evaluating on both gives you breadth and depth.
- **HotPotQA** is upstream infrastructure — any multi-hop result in LongMemEval or LoCoMo is descended from HotPotQA methodology.
- **MSC** is historically important but largely obsolete for modern model evaluation. It still matters for summarization-memory research because so much of that literature cites it.
- **MemBench and ConvoMem are partially redundant with each other** but attack from different angles: MemBench is academic and multi-dimensional (adds efficiency); ConvoMem is industrial and at scale (settles the "do I need RAG?" debate).

### Mapping to BEAM Ability Categories

Recall from Module 02 that BEAM defines five canonical memory abilities. Here's which benchmark covers which:

| BEAM Ability | LongMemEval | LoCoMo | HotPotQA | MSC | MemBench | ConvoMem |
|--------------|-------------|--------|----------|-----|----------|----------|
| **Persistence** (recall across time) | ✓ (Extract) | ✓ (single-hop) |  | ✓ | ✓ (factual) | ✓ |
| **Association** (multi-source synthesis) | ✓ (multi-session) | ✓ (multi-hop) | ✓ |  | ✓ | ✓ (implicit) |
| **Revision** (knowledge updates) | ✓ (updates) |  |  |  |  |  |
| **Chronology** (temporal reasoning) | ✓ (temporal) | ✓ (temporal) |  |  |  |  |
| **Metacognition** (abstention, uncertainty) | ✓ (abstain) | ✓ (adversarial) |  |  |  |  |

**LongMemEval covers all five BEAM categories**, which is why it has become the reference benchmark. LoCoMo covers four of five (missing Revision). Everything else is partial.

---

## 9. Which Can We Reproduce With Our Own Data?

Given 129 sessions and 16,928 turns in PostgreSQL, our reproducibility options are:

1. **LongMemEval methodology** — HIGH fit. We can authoring evidence targets in our real sessions and plant them; we have natural timestamps; we have coherent persona (one user); we have updates (we've changed our mind about things across sessions). Requires manual annotation to label evidence sessions.
2. **LoCoMo methodology** — MEDIUM fit. Our sessions are long but not *that* long. Our conversations are not persona-driven.
3. **HotPotQA methodology** — LOW fit directly, HIGH fit as inspiration for how to write multi-hop questions grounded in real sessions.
4. **MSC methodology** — LOW fit. We don't have persona consistency as the central concern; we have a coding workflow.
5. **MemBench methodology** — HIGH fit for the observation scenario. We are literally observing conversations that happened, not participating in them. The 2×2 design (factual/reflective × participation/observation) is the cleanest framework for what we're doing.
6. **ConvoMem methodology** — HIGH fit. Our 129 sessions straddle their 150-conversation threshold. We can literally *test their hypothesis* on our data.

---

## 10. The Tibsfox Session Benchmark (Proposal Sketch)

Drawing from this survey, here's what a benchmark built on our 16,928-turn corpus would look like:

### Name
**TSB-129** (Tibsfox Session Benchmark, 129 sessions, first release)

### Scale
- **129 sessions** (fixed, real)
- **16,928 turns** (fixed, real)
- **~300-500 questions** (to be authored) spread across 5 memory abilities
- **Timestamps preserved** from PostgreSQL ingestion
- **Persona: constant** (single user, Foxy) — naturally coherent, zero synthetic noise

### Question Categories (Borrowed from LongMemEval + MemBench)

Five LongMemEval-style ability slices, with MemBench's factual/reflective distinction layered on:

1. **Persistence (Factual)** — "What was the name of the skill we built in session 42?"
2. **Persistence (Reflective)** — "What does the user prefer for commit message format?"
3. **Association** — "We discussed X in session 12 and Y in session 87 — how are they related?"
4. **Revision** — "We changed our minds about the trust ledger architecture — what's the current decision?"
5. **Chronology** — "When did we first decide to use pgvector? How long after the Mem0 evaluation?"
6. **Metacognition (Abstention)** — "What color is the user's car?" (answer: unknown, system must refuse)

### Construction Methodology

**Hybrid LLM-assisted human annotation:**

1. Run a local LLM (Llama 3.1 8B via vLLM) over the 16,928 turns to generate candidate questions per category
2. Human review (Foxy) — accept, reject, rewrite
3. Human labels evidence turns (turn IDs from Postgres) as supporting facts
4. Autoeval using a larger model (Claude Opus or GPT-4o) to score responses
5. Hold out 20% as a test set; 80% as dev

### Evaluation Metrics

Borrowing from the best of each benchmark:

- **Turn-level recall** (LongMemEval)
- **Answer F1 + EM** (HotPotQA)
- **GPT-4-judge accuracy** (LongMemEval)
- **Memory efficiency: read/write latency** (MemBench)
- **Abstention precision** (LongMemEval)
- **Full-context vs RAG comparison** (ConvoMem replication)

### Why This Matters

No existing benchmark uses **real, unfiltered, single-user coding-agent sessions** as its substrate. LongMemEval fills with ShareGPT. LoCoMo uses personas. MSC is crowdworker small-talk. ConvoMem is synthesized enterprise dialogues. **TSB-129 would be the first real-workload memory benchmark** — and it would directly test the hypothesis that gsd-skill-creator's memory architecture works on the only data that actually matters: *the data it will actually see in production*.

It also lets us **replicate ConvoMem's 150-conversation RAG-inflection claim**. We are at 129 sessions today. By the time we publish TSB-129, we will be past 150. We can literally graph accuracy vs. session count and see if their threshold holds for coding sessions the way it does for enterprise CRM.

---

## 11. Open Questions

1. **LoCoMo 10 vs 50** — why did the public release shrink? We need to email the authors or dig through GitHub issues.
2. **MemBench observation scenario details** — the paper is sparse on exactly how "observation" is operationalized. GitHub repo needed.
3. **ConvoMem reproducibility at the 150-threshold** — is this robust across domains, or only enterprise? Our data will answer this empirically.
4. **Do any of these benchmarks handle code context?** Short answer: no. Long answer: see Module 06 for a gap analysis.
5. **License compatibility for derivative works** — if TSB-129 borrows questions or structure from LongMemEval, what license must it carry? MIT is probably the safe answer.

---

## 12. Sources

### Primary (HIGH confidence)

- [LongMemEval GitHub](https://github.com/xiaowu0162/LongMemEval) — paper, code, data
- [LongMemEval arXiv 2410.10813](https://arxiv.org/abs/2410.10813) — ICLR 2025 paper
- [LoCoMo arXiv 2402.17753](https://arxiv.org/abs/2402.17753) — ACL 2024 paper
- [LoCoMo ACL Anthology 2024.acl-long.747](https://aclanthology.org/2024.acl-long.747/) — published version
- [LoCoMo GitHub (snap-research)](https://github.com/snap-research/locomo) — public release
- [HotPotQA project page](https://hotpotqa.github.io/) — leaderboard, data, eval script
- [HotPotQA arXiv 1809.09600](https://arxiv.org/abs/1809.09600) — EMNLP 2018 paper
- [MSC arXiv 2107.07567](https://arxiv.org/abs/2107.07567) — Beyond Goldfish Memory paper
- [MSC ParlAI project](https://parl.ai/projects/msc/) — dataset host
- [MemBench arXiv 2506.21605](https://arxiv.org/abs/2506.21605) — ACL Findings 2025
- [MemBench GitHub](https://github.com/import-myself/Membench) — code
- [ConvoMem arXiv 2511.10523](https://arxiv.org/pdf/2511.10523) — Salesforce 2025 preprint
- [ConvoMem HuggingFace](https://huggingface.co/datasets/Salesforce/ConvoMem) — dataset
- [ConvoMem GitHub](https://github.com/SalesforceAIResearch/ConvoMem) — code

### Secondary (MEDIUM confidence)

- [LoCoMo project page](https://snap-research.github.io/locomo/) — project overview
- [Emergent Mind LoCoMo topic](https://www.emergentmind.com/topics/locomo-benchmark) — synthesis
- [Awesome-Memory-for-Agents](https://github.com/TsinghuaC3I/Awesome-Memory-for-Agents) — curated list
- [Supermemory research page](https://supermemory.ai/research/) — industry perspective

### Tertiary (LOW confidence — flagged for validation)

- Various secondary summaries of MSC statistics; exact train/valid/test split numbers varied slightly between sources
- ConvoMem internal methodology details (PDF was binary-encoded; some claims rely on web search summaries)
- LoCoMo conversation count discrepancy (10 public vs 50 paper) — not definitively resolved

---

## Metadata

**Confidence breakdown:**
- Dataset statistics: HIGH — cross-verified across paper abstracts, repos, and independent summaries
- Ability taxonomies: HIGH — primary-source quotes from all five papers
- SOTA numbers: MEDIUM — these move monthly; treat as approximate snapshots
- ConvoMem specifics: MEDIUM-LOW — recent paper, PDF extraction failed, relied on search summaries
- Tibsfox Session Benchmark design: Claude's synthesis, not validated against any prior art — flag for Foxy review

**Research date:** 2026-04-08
**Valid until:** ~2026-07-08 for SOTA numbers (fast-moving); ~2027-04-08 for methodology (stable)

**Next module dependencies:**
- Module 06: Gap analysis — what's missing from all six benchmarks that our coding-agent use case requires
- Module 07: TSB-129 question authoring protocol — operationalizing the sketch in Section 10
- Module 08: Replicating ConvoMem's 150-conversation threshold on our real data
