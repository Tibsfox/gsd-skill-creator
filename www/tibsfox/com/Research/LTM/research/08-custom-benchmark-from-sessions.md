# LTM-08: Custom Benchmark from Session Data

**Series:** Long-Term Memory (LTM) Research
**Module:** 08
**Status:** Design specification
**Date:** 2026-04-08
**Branch:** artemis-ii

## Abstract

Public memory benchmarks — LoCoMo, LongMemEval, BEAM — measure generic scenarios. They do not measure *our* workload. This module specifies a complete benchmark methodology that uses gsd-skill-creator's 129 ingested conversation sessions (16,928 turns, stored in PostgreSQL `artemis` schema) as an evaluation dataset. The benchmark mirrors BEAM's ten memory ability categories but grounds every question in real turns we authored. It is strictly local — the session data is private and never leaves the machine. The deliverable is a test harness that a CI run can execute on every commit, a scoring rubric that combines exact match, LLM-as-judge, and ranking metrics, and a regression-detection policy that alerts when any category drops more than 5 percent week-over-week. This is the measurement backbone for LTM-09 and every subsequent memory-architecture change.

---

## 1. Why Build Our Own Benchmark

Three reasons, each sufficient on its own:

1. **Distribution mismatch.** LoCoMo sessions are simulated multi-day dialogs between fictional personas. LongMemEval questions target a synthetic chat assistant. Our workload is a single researcher-operator (Foxy) driving 190+ research missions, 21,000+ tests, Rust/TS/GLSL stacks, and 13 Rosetta clusters. Accuracy on public benchmarks is a weak predictor of accuracy on our conversations because our topic distribution, temporal structure, and reference patterns differ.
2. **Privacy constraint.** Our sessions contain Fox Companies IP, personal timeline details, and unpublished research. We cannot submit them to any hosted LLM, and we cannot publish them. The benchmark must run entirely local, on the PostgreSQL instance at `maple@tibsfox` with schema `artemis`.
3. **Measurement discipline.** Every improvement proposed in LTM-09 (embedding upgrades, scoring changes, reranker experiments) is guesswork until we can measure a delta. Without a scoring harness, we are building on intuition. BEAM's categories are the right taxonomy; BEAM's data is the wrong fit.

The goal is a benchmark that a single command (`npm run bench:memory`) runs in under ten minutes, produces a per-category score table, flags regressions, and never sends a byte off-machine.

---

## 2. Dataset Inventory

### 2.1 Raw Material

| Asset | Count | Source | Storage |
|---|---|---|---|
| Conversation sessions | 129 | Claude Code history, manual ingest | `artemis.conversation_sessions` |
| Conversation turns | 16,928 | Each user/assistant/tool message | `artemis.conversation_turns` |
| Distinct projects | ~20 | Branch/project tags on sessions | `sessions.project` column |
| Distinct branches | ~15 | `sessions.branch` column | `sessions.branch` column |
| Span | ~8 months | `started_at` min/max | |
| Avg turns per session | 131 | 16,928 / 129 | |
| Median content length | ~380 chars | Estimated from ingest logs | |
| HNSW embedding index | vector(384) | all-MiniLM-L6-v2 | `idx_turns_embedding` |
| Full-text GIN index | English tsvector | | `idx_turns_fulltext` |

The schema already satisfies the benchmark's access patterns. No migration is required; we add a new schema `artemis_bench` alongside for test metadata only.

### 2.2 Partitioning Strategy

Splitting by session (not by turn) is mandatory. Turn-level splits leak — turn N+1 inside the same session trivially predicts turn N. We target a 70/15/15 split on a 129-session pool.

| Split | Sessions | Purpose | Selection |
|---|---|---|---|
| Train | 90 | Prompt refinement, judge calibration, retrieval tuning | Stratified by project cluster |
| Validation | 20 | Hyperparameter sweeps, early-stopping regression checks | Held out during question generation iteration |
| Holdout | 19 | Never touched except for final scoring | Locked at benchmark creation, hash-sealed |

Stratification keys are: primary project (`project`), time period (quarter), and topic cluster (derived from `topics` array). The stratifier ensures that NASA Mission Series sessions, Seattle 360 sessions, LTM research sessions, and operational sessions each appear proportionally in all three splits.

Leakage prevention rules:
- **No cross-session prompt context.** A question generated from session S tests retrieval of evidence from session S plus the broader corpus, never from sessions in another split.
- **Question-generator LLM sees train only.** When we iteratively refine prompts, the LLM only consumes train-split sessions. Validation and holdout are quarantined.
- **Hash-sealed holdout.** At benchmark creation, we store SHA-256 of each holdout session's turn content in a manifest file. Any accidental mutation fails the integrity check.
- **Embedding index freeze for holdout runs.** When scoring on holdout, we use a specific commit SHA of the index-manager code so retrieval is reproducible.

### 2.3 Dataset Stats Table (to populate at build)

```sql
CREATE VIEW artemis_bench.dataset_stats AS
SELECT
  bs.split,
  COUNT(DISTINCT s.id)                           AS sessions,
  COUNT(t.id)                                    AS turns,
  AVG(s.turn_count)::int                         AS avg_turns_per_session,
  MIN(s.started_at)                              AS earliest,
  MAX(COALESCE(s.ended_at, s.started_at))        AS latest,
  COUNT(DISTINCT s.project)                      AS distinct_projects,
  COUNT(DISTINCT s.branch)                       AS distinct_branches
FROM artemis_bench.split_assignment bs
JOIN artemis.conversation_sessions s ON s.id = bs.session_id
JOIN artemis.conversation_turns t    ON t.session_id = s.id
GROUP BY bs.split;
```

Running this view at benchmark init gives us the canonical stats banner for every report.

---

## 3. Question Generation Methodology

The benchmark needs roughly 1,000 questions — 100 per BEAM category. BEAM uses 200 per category on a larger corpus; 100 is a practical target for 129 sessions and leaves headroom to grow to 200 as ingest continues.

### 3.1 Pipeline

```
session turns  ->  category-specific prompt  ->  LLM generator  ->
    draft (Q, A, evidence turn_ids, category, difficulty)  ->
    automated filter  ->  human review gate  ->  sealed question bank
```

### 3.2 Generator Choice

Three options, with tradeoffs:

| Generator | Pros | Cons |
|---|---|---|
| GPT-4o via API | Highest quality, best at nuanced prompts | Sends session content off-machine — **disqualified by privacy** |
| Claude Sonnet via API | Same concern | Disqualified |
| Local Llama 3.1 70B (quantized) | Fully local, fits on RTX 4060 Ti 8GB only with heavy quantization | Lower fluency for subtle categories |
| Local Qwen2.5 32B or 14B | Runs comfortably on 8GB with 4-bit | Good instruction-following, strong enough for this task |

**Decision: local Qwen2.5 14B-Instruct at Q4_K_M quantization via llama.cpp or ollama.** The generator never sees holdout data. Questions go through a human review gate regardless, so generator quality is not the final quality bar.

### 3.3 Prompt Contract

Every category prompt produces a JSON record:

```json
{
  "category": "temporal_reasoning",
  "difficulty": "medium",
  "question": "...",
  "answer": "...",
  "answer_type": "short_text | list | yes_no | date | number",
  "evidence_turn_ids": ["turn-uuid-1", "turn-uuid-2"],
  "evidence_quotes": ["exact span from turn 1", "exact span from turn 2"],
  "session_id": "uuid",
  "requires_multi_session": false,
  "notes": "optional rationale"
}
```

The generator must emit `evidence_quotes` as exact substrings of the referenced turns. A post-filter verifies substring presence and discards any record that fails.

### 3.4 Human Review Gate

For each draft question, a reviewer answers four checkboxes:

1. Is the question answerable from the cited evidence alone?
2. Is the answer correct?
3. Does the question actually exercise the stated category?
4. Is the question free of trivial giveaways (e.g., the answer appearing verbatim in the question)?

A question passes only with four checks. Reviewer load: ~1,000 questions * ~20 seconds each = ~5.5 hours. Acceptable one-time cost. Refinement cycles happen on validation split only.

### 3.5 Per-Category Generation Prompts

The following ten prompts are ready to drop into a generator script. Each includes a concrete example using plausible session content.

#### 3.5.1 Abstention

**Goal:** questions where the correct answer is "I don't know" or "not enough information."

```
You will see 5 conversation turns from a session about {project}.
Generate a question that appears answerable from these turns but
actually is NOT — the session never states the answer. The correct
response is an abstention phrase. Include in `notes` which specific
fact is missing.
```

*Example (hypothetical session about Seattle 360 engine):*
Turns mention that degree 57 is line art for "Orca pod, Commencement Bay." Generated question: *"What color palette did we choose for degree 57?"* Answer: *"The session does not specify the color palette."* Evidence quotes document the turns where palette was mentioned only for adjacent degrees, not 57.

#### 3.5.2 Contradiction Resolution

**Goal:** evidence conflicts across turns; test whether retrieval surfaces both and the resolver picks the later or more authoritative one.

```
Scan the session for cases where a statement is later corrected,
updated, or contradicted. Generate a question whose answer requires
noting both statements and selecting the later or more authoritative
one. The `evidence_turn_ids` must include both conflicting turns.
```

*Example:* Turn 42 says "v1.49.190 is the latest release." Turn 187 says "v1.49.192 is the latest release." Generated question: *"What was the final release version on 2026-03-31?"* Answer: *"v1.49.192."*

#### 3.5.3 Event Ordering

**Goal:** reconstructing temporal sequence when only relative cues exist.

```
Identify 3-5 distinct events in the session (tool runs, decisions,
file writes, commits). Generate a question asking the order in which
they occurred. The answer is an ordered list. Evidence quotes should
include temporal markers (timestamps, "then", "after", "before").
```

*Example:* *"Order these four events chronologically: (a) decision to use pgvector, (b) ingestion of first 50 sessions, (c) HNSW index creation, (d) migration to all-MiniLM-L6-v2 embeddings."*

#### 3.5.4 Information Extraction

**Goal:** recalling a specific entity, number, or fact.

```
Find a specific factual claim in the session — a filename, a version
number, a person's name, a test count, a file size, a config value.
Generate a direct factual question. Answer is a single value or
short phrase. This is the easiest category; prioritize diversity
over difficulty.
```

*Example:* *"How many tests are in the test suite as of this session?"* Answer: *"21,298."*

#### 3.5.5 Instruction Following

**Goal:** sustained constraint adherence across many turns — the memory system must recall earlier directives and honor them in later responses.

```
Identify an instruction given early in the session that should bind
later responses (e.g., "use simple quoting", "no co-author line",
"lowest verbosity"). Generate a question asking what the binding
constraint is and whether a specific later action honored it.
```

*Example:* *"Early in this session, what quoting style was specified for commit messages, and did the commit at turn 219 follow it?"*

#### 3.5.6 Knowledge Update

**Goal:** test revision of facts — something was true, then changed.

```
Identify a fact that was stated as true and later updated. Generate
a question asking for the CURRENT value (not the original). Distinct
from contradiction because the update is a legitimate state change,
not a correction of error.
```

*Example:* *"What is the current target date for v1.50?"* (original session turn said April 7; later turn revised to April 21). Answer: *"April 21, 2026."*

#### 3.5.7 Multi-Session Reasoning

**Goal:** synthesize evidence from two or more non-adjacent sessions. This category requires cross-session retrieval.

```
Pick two sessions from the same project cluster separated by at
least one day. Identify a fact from session A that is elaborated,
refined, or contradicted in session B. Generate a question whose
answer requires both. Set `requires_multi_session: true`.
```

*Example:* Session A (Feb 15) introduces Cedar as "filter + ledger." Session B (Mar 21) adds "Trust: 'Trust no one' — earned, not given." Question: *"What is Cedar's role in the muse team and what trust principle governs it?"*

#### 3.5.8 Preference Following

**Goal:** recall user preferences stated anywhere in history, test whether the system applies them.

```
Find a user preference statement ("I prefer X", "never do Y",
"always use Z"). Generate a question asking whether a specific
proposed action respects the preference.
```

*Example:* *"The user stated a preference about Co-Authored-By lines. Would adding one to a commit respect this preference?"* Answer: *"No — the user finds Co-Authored-By lines intrusive."*

#### 3.5.9 Summarization

**Goal:** abstractive compression of a span of turns.

```
Pick a contiguous span of 20-50 turns on a single topic. Generate a
question asking for a summary of the span at a specified length
(one sentence, three bullets, etc.). Answer is the reference summary;
scoring is LLM-judge (semantic equivalence), not exact match.
```

*Example:* *"In three bullet points, summarize the decision process that led to adopting pgvector over ChromaDB in this session."*

#### 3.5.10 Temporal Reasoning

**Goal:** explicit and implicit time relations.

```
Find a turn with an explicit date/time reference and another turn
whose time is only inferable from context. Generate a question
requiring reasoning about elapsed duration or ordering.
```

*Example:* *"How many days elapsed between the first mention of pgvector in this session and the first successful HNSW index build?"*

### 3.6 Target Distribution

| Category | Target count | Difficulty mix (easy / med / hard) |
|---|---|---|
| Abstention | 100 | 20 / 50 / 30 |
| Contradiction Resolution | 100 | 10 / 50 / 40 |
| Event Ordering | 100 | 20 / 50 / 30 |
| Information Extraction | 100 | 40 / 40 / 20 |
| Instruction Following | 100 | 20 / 50 / 30 |
| Knowledge Update | 100 | 20 / 50 / 30 |
| Multi-Session Reasoning | 100 | 10 / 40 / 50 |
| Preference Following | 100 | 30 / 50 / 20 |
| Summarization | 100 | 20 / 50 / 30 |
| Temporal Reasoning | 100 | 20 / 50 / 30 |
| **Total** | **1,000** | |

Difficulty labels come from the generator and are verified during human review.

---

## 4. Scoring Rubric

### 4.1 Three Scorers, Routed by Answer Type

| Answer type | Scorer | Categories |
|---|---|---|
| Short factual (string, number, date, list) | Exact match (normalized) | Info Extraction, Temporal Reasoning (numeric), Knowledge Update (factual) |
| Yes/no, abstention | Regex / keyword match on canonical phrases | Abstention, Preference Following |
| Open-ended text | LLM-as-judge (local Qwen2.5 14B) | Summarization, Multi-Session Reasoning, Instruction Following |
| Ranked retrieval | Recall@K, MRR, nDCG | All categories (retrieval sub-score) |

### 4.2 Exact Match Normalization

- Lowercase
- Strip whitespace
- Collapse punctuation to single spaces
- Date parsing via a tolerant parser (accepts "April 21, 2026", "2026-04-21", "Apr 21 2026")
- Number parsing with tolerance (`21,298 == 21298`)
- For list answers: set equality after normalization

### 4.3 LLM-as-Judge Protocol

Memori's approach uses GPT-4.1-mini as judge. We cannot. Instead, we use the same local Qwen2.5 14B used for generation, but in a pinned evaluation configuration (temperature 0, seed fixed, one-shot calibration example). The judge prompt:

```
You will be given a question, a reference answer, and a candidate
answer. Score the candidate on a 0-3 scale:

0: incorrect or contradictory
1: partially correct, missing key elements
2: substantively correct, minor gaps
3: fully correct and complete

Respond with only the integer score.

Question: {q}
Reference: {ref}
Candidate: {cand}
```

Judge calibration: we run 50 questions through the judge twice with different seeds and flag any divergence >= 1. Calibration drift above 5 percent triggers judge replacement.

### 4.4 Retrieval Sub-Score

For every question, the system returns a ranked list of turn_ids as its working context. We measure:

- **Recall@5:** fraction of ground-truth evidence turn_ids in top 5
- **Recall@20:** same at top 20
- **MRR:** mean reciprocal rank of the first correct evidence turn_id
- **nDCG@10:** rewards correct retrieval at higher ranks

Retrieval sub-score is orthogonal to answer correctness. A system can retrieve perfectly and still answer wrong (generation bug) or retrieve poorly and still answer right (lucky guess or in-training knowledge). Tracking both surfaces where breakage lives.

### 4.5 Composite Category Score

For category C:
```
score_C = 0.6 * answer_accuracy + 0.4 * retrieval_score
```
where `answer_accuracy` is the mean of exact-match or judge-normalized scores (judge scores divided by 3), and `retrieval_score` is Recall@20.

The 60/40 weight gives primacy to answer correctness while still rewarding retrieval improvements that have not yet translated into better answers.

### 4.6 Overall Weighted Score

BEAM weights all categories equally. We deviate: Multi-Session Reasoning gets 1.5x weight because it is the hardest and the most diagnostic of our architecture; Information Extraction gets 0.75x because it is the easiest and dominates if not dampened. Summarization and Preference Following get 1.0x.

```
overall = (1.5 * multi_session + 0.75 * info_extraction + sum(1.0 * other_8))
           / (1.5 + 0.75 + 8.0)
```

---

## 5. Test Harness Architecture

The harness is TypeScript, lives in `src/memory/__tests__/bench/`, and reuses the existing `pg-store.ts` and `service.ts` modules. No new runtime dependencies.

### 5.1 Directory Layout

```
src/memory/__tests__/bench/
  ├── README.md
  ├── run.ts                  # entry point, CLI
  ├── load-questions.ts       # reads from artemis_bench.questions
  ├── run-question.ts         # executes one question end-to-end
  ├── scorers/
  │   ├── exact-match.ts
  │   ├── llm-judge.ts
  │   └── retrieval.ts
  ├── systems/
  │   ├── baseline-keyword.ts # naive tsvector full-text
  │   ├── baseline-vector.ts  # HNSW only
  │   └── current.ts          # hybrid-scorer (what we ship)
  ├── report/
  │   ├── html.ts
  │   ├── json.ts
  │   └── regression-check.ts
  └── fixtures/
      └── judge-calibration.json
```

### 5.2 Database Objects

```sql
CREATE SCHEMA IF NOT EXISTS artemis_bench;

CREATE TABLE artemis_bench.split_assignment (
  session_id   UUID PRIMARY KEY REFERENCES artemis.conversation_sessions(id),
  split        TEXT NOT NULL CHECK (split IN ('train','val','holdout')),
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE artemis_bench.questions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category              TEXT NOT NULL,
  difficulty            TEXT NOT NULL,
  question              TEXT NOT NULL,
  answer                TEXT NOT NULL,
  answer_type           TEXT NOT NULL,
  evidence_turn_ids     TEXT[] NOT NULL,
  evidence_quotes       TEXT[] NOT NULL,
  session_id            UUID NOT NULL REFERENCES artemis.conversation_sessions(id),
  requires_multi_session BOOLEAN NOT NULL DEFAULT false,
  split                 TEXT NOT NULL,
  reviewed_by           TEXT,
  reviewed_at           TIMESTAMPTZ,
  review_passed         BOOLEAN,
  generator_version     TEXT NOT NULL,
  content_hash          TEXT NOT NULL
);

CREATE TABLE artemis_bench.runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  git_sha         TEXT NOT NULL,
  system          TEXT NOT NULL,  -- 'baseline-keyword' | 'baseline-vector' | 'current'
  split           TEXT NOT NULL,
  config_json     JSONB NOT NULL,
  overall_score   NUMERIC,
  duration_ms     INT
);

CREATE TABLE artemis_bench.results (
  run_id          UUID NOT NULL REFERENCES artemis_bench.runs(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES artemis_bench.questions(id),
  category        TEXT NOT NULL,
  answer_score    NUMERIC NOT NULL,
  recall_at_5     NUMERIC NOT NULL,
  recall_at_20    NUMERIC NOT NULL,
  mrr             NUMERIC NOT NULL,
  ndcg_at_10      NUMERIC NOT NULL,
  latency_ms      INT NOT NULL,
  tokens_in       INT NOT NULL,
  tokens_out      INT NOT NULL,
  retrieved_turns TEXT[] NOT NULL,
  response_text   TEXT,
  PRIMARY KEY (run_id, question_id)
);

CREATE INDEX idx_results_category ON artemis_bench.results (category);
CREATE INDEX idx_runs_git_sha     ON artemis_bench.runs (git_sha);
```

### 5.3 Run Entry Point

```typescript
// src/memory/__tests__/bench/run.ts
import { loadQuestions } from './load-questions';
import { runQuestion } from './run-question';
import { systems } from './systems';
import { emitReport } from './report/html';
import { checkRegression } from './report/regression-check';

export async function main(opts: BenchOpts) {
  const questions = await loadQuestions(opts.split);   // 'val' or 'holdout'
  const system = systems[opts.system];                 // 'current' by default
  const runId = await startRun(opts);

  for (const q of questions) {
    const result = await runQuestion(system, q);
    await recordResult(runId, q, result);
  }

  const summary = await finalizeRun(runId);
  await emitReport(runId, summary);

  if (opts.split === 'val') {
    const regressed = await checkRegression(runId, summary);
    if (regressed.length) process.exitCode = 2;
  }
}
```

### 5.4 Baselines

Three systems run on every benchmark invocation:

1. **baseline-keyword** — pure PostgreSQL `tsvector` full-text match (`ts_rank` over `idx_turns_fulltext`). No embeddings. No reranking. The floor.
2. **baseline-vector** — pure HNSW vector search on the 384-dim embedding. No keyword fallback. Tests the embedding space in isolation.
3. **current** — the production `hybrid-scorer.ts` path: vector + keyword fusion with whatever weights and reranker we ship today.

Expected score ordering at v1: `keyword < vector < current`. Any inversion is a bug.

### 5.5 Question Execution Contract

```typescript
interface MemorySystem {
  retrieve(query: string, k: number): Promise<RetrievalResult[]>;
  answer(query: string, retrieved: RetrievalResult[]): Promise<AnswerResult>;
}

interface RetrievalResult {
  turnId: string;
  score: number;
  content: string;
}

interface AnswerResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}
```

For the `current` system, `answer()` feeds retrieved turns into a local Qwen2.5 14B (same model as judge, different config). The answer model never sees holdout ground truth.

---

## 6. Metrics Dashboard

The dashboard is a single HTML page written to `.benchmarks/reports/{run_id}.html` after each run and a rolling `.benchmarks/reports/latest.html`.

### 6.1 Primary Panels

| Panel | Content | Source |
|---|---|---|
| Headline | Overall weighted score, delta vs previous run | `runs.overall_score` |
| Category bars | 10-row bar chart, score 0-1, with last-run ghost bar | `results` grouped by category |
| Latency distribution | p50, p95, p99 by system | `results.latency_ms` |
| Token efficiency | Tokens per correct answer — our Memori analog | `sum(tokens_in) / count(answer_score >= 0.66)` |
| Retrieval quality | Recall@20 and MRR by category | `results.recall_at_20`, `results.mrr` |
| Failure gallery | 10 lowest-scoring questions with system output | `results` ordered by `answer_score` |
| System comparison | `keyword` vs `vector` vs `current` side-by-side | Joined by `run_id` per git_sha |

### 6.2 Token Efficiency — the Memori Metric

Memori's blog reports 1,294 tokens per correct answer vs a naive baseline's 26,000. That ratio — not raw accuracy — is the most honest measure of memory system value. We compute:

```
token_efficiency = total_tokens_in / count(answer_score >= 0.66)
```

where `0.66` corresponds to judge score 2 out of 3 (substantively correct). We track this per system and per category, and we alert if our system's ratio degrades by more than 20 percent.

### 6.3 Cost Per Query

Even though we run locally, we attach a synthetic cost for portability:
```
cost = (tokens_in / 1000) * 0.00015 + (tokens_out / 1000) * 0.0006
```
(rates: GPT-4o-mini as of early 2026). This lets us compare to published benchmarks that use hosted models.

---

## 7. CI Integration

The benchmark must run automatically, otherwise it rots. Three tiers:

### 7.1 Per-Commit (Smoke)

On every push to `artemis-ii`, a GitHub Actions workflow runs `npm run bench:memory -- --split val --sample 100 --system current`. Total wall time target: under 3 minutes. The sample is stratified across all 10 categories (10 questions each). Fails the build if the sample score drops >= 10 percent from the main-branch baseline.

```yaml
# .github/workflows/bench-memory.yml
name: bench-memory
on: [push, pull_request]
jobs:
  bench:
    runs-on: self-hosted  # required: local Postgres + local LLM
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run bench:memory -- --split val --sample 100
      - uses: actions/upload-artifact@v4
        with:
          name: bench-report
          path: .benchmarks/reports/latest.html
```

### 7.2 Nightly (Full Validation)

Cron 03:00 local, full val split (all 200 val questions), all three systems. Produces the full HTML report and posts a summary comment to any open PR.

### 7.3 Weekly (Holdout)

Sunday 03:00, full holdout split. Results are sealed — the holdout number is the official score for the week. Reviewers see it only after the run completes; iteration on holdout is forbidden.

### 7.4 Local Dev

`npm run bench:memory -- --quick` runs a 50-question validation sample in under 90 seconds for fast iteration. `npm run bench:memory -- --category multi_session_reasoning` runs a single category.

---

## 8. Regression Detection

### 8.1 Policy

| Signal | Threshold | Action |
|---|---|---|
| Overall score drops vs main baseline | >= 5 percent | PR comment, non-blocking |
| Any category drops | >= 10 percent | PR comment, non-blocking |
| Any category drops | >= 20 percent | CI failure, blocking |
| Multi-session score drops | >= 15 percent | CI failure, blocking (high-value category) |
| Latency p95 increases | >= 2x | PR comment, non-blocking |
| Token efficiency degrades | >= 20 percent | PR comment, non-blocking |
| Retrieval recall@20 drops across all categories | >= 10 percent | CI failure, blocking |

Blocking failures can be overridden with a `bench-override` commit trailer and a one-line justification. The trailer is logged to a review channel weekly.

### 8.2 Implementation

```typescript
// src/memory/__tests__/bench/report/regression-check.ts
export async function checkRegression(runId: string, summary: RunSummary) {
  const baseline = await getMainBranchBaseline();  // cached, refreshed weekly
  const failures: string[] = [];

  if (summary.overall < baseline.overall * 0.95) {
    failures.push(`overall -${pct(summary.overall, baseline.overall)}%`);
  }
  for (const cat of CATEGORIES) {
    const drop = 1 - summary.byCategory[cat] / baseline.byCategory[cat];
    if (drop >= 0.20) failures.push(`${cat} -${(drop*100).toFixed(1)}% BLOCKING`);
    else if (drop >= 0.10) failures.push(`${cat} -${(drop*100).toFixed(1)}% warn`);
  }
  if (summary.byCategory.multi_session_reasoning <
      baseline.byCategory.multi_session_reasoning * 0.85) {
    failures.push('multi-session drop exceeds 15% BLOCKING');
  }
  return failures;
}
```

### 8.3 Baseline Refresh

The "main baseline" refreshes automatically when `main` advances: the nightly job on main commits new baseline values to a committed JSON file at `.benchmarks/baseline.json`. This prevents a drifting baseline from hiding real regressions on PRs.

---

## 9. Cross-Validation With Public Benchmarks

Running our architecture on LoCoMo and LongMemEval gives us three things:

1. **External calibration.** If our score on LoCoMo tracks published results, our harness is trustworthy. If it diverges wildly, we have a bug in scoring before we even think about architecture.
2. **Shared vocabulary.** Reviewers from outside our project can interpret LoCoMo scores; they cannot interpret ours. Having both lets us publish comparable numbers in LTM papers without leaking private sessions.
3. **Coverage check.** LoCoMo emphasizes multi-turn persona chat; BEAM covers the 10-category taxonomy we adopted; our custom benchmark stresses research-operator workloads. Running all three detects capabilities our own data doesn't exercise.

### 9.1 Implementation Plan

- **LoCoMo ingest:** download public LoCoMo questions and conversations into `artemis_public.locomo_sessions` (separate schema so it never pollutes `artemis.*`). Our `MemorySystem` interface is identical, so `run-question.ts` already works.
- **LongMemEval ingest:** same pattern into `artemis_public.longmemeval_sessions`.
- **BEAM ingest:** if and when public, same pattern.
- **Parallel reporting:** the dashboard shows four columns — custom, LoCoMo, LongMemEval, BEAM — and flags any category where we regress on one but not another.

### 9.2 What Cross-Validation Cannot Do

It cannot validate privacy-sensitive categories (Preference Following grounded in personal history, Knowledge Update on Fox Companies IP). Those live only in the custom benchmark. Cross-validation is a sanity check, not a replacement.

---

## 10. Privacy Controls

Non-negotiable rules:

1. **Session data never leaves the machine.** No hosted LLM. No telemetry. No uploaded reports. The `.benchmarks/reports/` directory is gitignored.
2. **Generator and judge are local.** Qwen2.5 14B via llama.cpp or ollama, running on the RTX 4060 Ti. Models pulled via `ollama pull` once, then offline.
3. **Schema isolation.** `artemis_bench` is a separate schema. A single `REVOKE ALL ON SCHEMA artemis_bench FROM PUBLIC` hardens it.
4. **Hash-sealed holdout.** Holdout session content hashes are committed to git (not the content, just hashes). Integrity check at every run catches accidental mutation or exfiltration.
5. **Publish numbers, not questions.** Weekly holdout scores can be published as aggregate numbers (`overall: 0.74, multi_session: 0.61`). Individual questions and session content are never published.
6. **Redaction for shared reports.** If we ever paste a failure example into an external discussion, a redactor script replaces proper nouns, filenames, and personal identifiers with placeholders. The redactor lives at `src/memory/__tests__/bench/redact.ts`.
7. **Manifest audit.** A script lists every file created by the benchmark and verifies it is either in `.benchmarks/` (gitignored) or in `.benchmarks/baseline.json` (committed, numbers only). Run weekly.

---

## 11. Build Plan

### Phase A: Infrastructure (1 day)

1. Create `artemis_bench` schema and the five tables.
2. Write the split assigner (`scripts/bench/assign-splits.ts`) that stratifies and inserts rows into `split_assignment`.
3. Hash-seal holdout manifest committed at `.benchmarks/holdout-manifest.sha256`.
4. Set up local Qwen2.5 14B via ollama, verify generation and judging against a 5-question fixture.

### Phase B: Question Generation (3 days)

5. Write one generator per category (`scripts/bench/generate/{category}.ts`) using the prompts in section 3.5.
6. Run on train split, produce ~1,200 candidates (20 percent overgeneration for filter slack).
7. Automated filter: verify evidence quotes are substrings, answer type matches, difficulty label present.
8. Human review gate: interactive CLI that shows question + evidence + answer and asks for 4 checkboxes. ~5.5 hours of review.
9. Commit final question bank (references only, not content) to git.

### Phase C: Harness (2 days)

10. Implement `run.ts`, `run-question.ts`, the three scorers, and the three baseline systems.
11. Implement report HTML emitter and regression checker.
12. Wire `npm run bench:memory` script.

### Phase D: CI (half day)

13. Add `.github/workflows/bench-memory.yml`.
14. First main-branch baseline commit to `.benchmarks/baseline.json`.
15. Nightly and weekly cron jobs.

### Phase E: Cross-Validation (2 days, optional at launch)

16. LoCoMo and LongMemEval ingest scripts.
17. Parallel reporting in the dashboard.

**Total: ~8 days for the full build, ~6 days for launch without cross-validation.**

---

## 12. Success Criteria

The benchmark is usable when:

- [x] 1,000 reviewed questions across 10 categories in `artemis_bench.questions`
- [x] Three baseline systems run end-to-end on val and holdout splits
- [x] Overall score, per-category scores, and token efficiency reported in HTML
- [x] CI blocks PRs that regress a category >= 20 percent
- [x] Holdout integrity check passes at every run
- [x] Privacy manifest audit passes weekly
- [x] First `current` vs `baseline-vector` vs `baseline-keyword` comparison is committed to git as the reference point for LTM-09

---

## 13. Open Questions for LTM-09

This module specifies *measurement*. The next module uses the numbers. Questions this benchmark will answer:

1. Does raising the HNSW `ef_search` parameter improve multi-session score enough to justify latency cost?
2. Does a reranker stage (cross-encoder) improve retrieval enough that answer accuracy follows?
3. Does extending embeddings from 384-dim to 768-dim improve contradiction resolution?
4. Does a session-summary compression layer (pre-retrieval) improve token efficiency without hurting accuracy?
5. What is our actual token-per-correct-answer number today, and how does it compare to Memori's published 1,294?
6. Which categories benefit most from hybrid scoring vs pure vector, and are the hybrid weights tuned per category or globally?

None of these can be answered today because we have no way to measure the deltas. After this module ships, all six become straightforward experiments.

---

## 14. Summary

We own 129 conversation sessions and 16,928 turns of real operational memory work. Public memory benchmarks do not and cannot measure our workload, and even if they could, our privacy constraints rule them out. This module specifies a complete replacement: stratified 70/15/15 session-level splits, 1,000 human-reviewed questions across BEAM's 10 categories generated by a local Qwen2.5 14B from train-split sessions, a TypeScript harness reusing our existing `pg-store.ts` and `hybrid-scorer.ts`, three scorers (exact match, local LLM judge, retrieval metrics), three baseline systems (keyword, vector, current) for comparison, a token-efficiency metric modeled on Memori's 1,294-vs-26,000 ratio, three-tier CI (per-commit smoke, nightly full val, weekly holdout), and a regression policy with blocking thresholds on multi-session and overall categories. Cross-validation against LoCoMo and LongMemEval provides external calibration. Everything runs local; session content never leaves the machine; only aggregate numbers are ever published. An eight-day build plan takes us from empty schema to CI-integrated benchmark. This is the measurement substrate LTM-09 and every memory change after it depends on.
