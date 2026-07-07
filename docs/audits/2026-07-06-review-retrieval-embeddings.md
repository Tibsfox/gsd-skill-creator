# Retrieval + Embeddings Deep Review — 2026-07-06

Dimension **D/retrieval**. Scope: `src/retrieval/*`, `src/embeddings/*`,
`src/orchestration/retrieval-loop.ts`, `src/discovery/prompt-embedding-cache.ts`,
`src/drift/temporal-retrieval.ts`, `src/memory/embedding-index.ts`, plus the live
wiring in `src/application/skill-applicator.ts` and
`src/application/stages/score-stage.ts`.

Read-only audit. Every claim below was checked against source and against the
actual wiring (grep of non-test call sites). This does **not** re-report anything
from `docs/audits/2026-07-06-artifact-ecosystem-review.md` (that review covered
skill/agent/team/chipset/cartridge *content*, not the RAG code path).

## Summary

The embedding *infrastructure* is solid and well-tested in isolation
(`EmbeddingService`, cache, cosine, skip-gram trainer, JSONL persistence all have
thorough unit suites). The problem is the **retrieval pipeline as a system**: the
one path that ships enabled is weaker than the sum of the parts, and several of
the strongest retrieval components in the repo are never wired to anything.

Headline issues:

1. **Semantic retrieval only re-ranks; it can never recall.** The embedding path
   in `ScoreStage` scores only the candidates that a lexical/regex trigger
   prefilter (`findByTrigger`) already returned. A paraphrased intent that misses
   every trigger pattern produces **zero** skills — embeddings never get a chance.
   This defeats the primary purpose of semantic RAG.
2. **The default "semantic" fallback is not semantic.** `@huggingface/transformers`
   is an `optionalDependency`; when it is absent the service uses
   `HeuristicEmbedder`, which — because the service never seeds a corpus — is just
   DJB2 hashed bag-of-words with no IDF and no semantics.
3. **The embedding cache poisons across the heuristic/model boundary** (same
   `modelVersion` tag for both), so heuristic vectors get served as model vectors
   on a later run.
4. **The correction loop compares raw TF-IDF scores against a cosine threshold**,
   silently overriding the router's fast-path decision.
5. A **proven in-repo hybrid re-ranker** (`src/memory/hybrid-scorer.ts`, documented
   96.6%→98.4% recall) and a **BM25 strategy** (`src/memory/strategies/lexical.ts`)
   exist but are not used by skill retrieval; neither is the pre-indexed
   `EmbeddingIndex`, the multi-turn `retrieve()` loop, or the MD-1 learned-embedding
   stack. The RAG is materially under-used relative to what's already built.

Retrieval features are all default-OFF (`retrievalConfig.enabled` defaults false;
`GSD_SKILL_CREATOR_EMBEDDINGS_ENABLED` defaults false), which caps live blast
radius — hence severities are mostly medium — but it also means the semantic path
is effectively unexercised in production and the quality gaps are latent.

## Findings

### RET-1 — Semantic path can only re-rank lexical candidates, never recall (HIGH, gap)

**Location:** `src/application/stages/score-stage.ts:42-80` +
`src/storage/skill-index.ts:309-347`

`ScoreStage.process` calls `findByTrigger(intent, file, context)` first and sets
`context.matches` to the result. `findByTrigger` is a pure lexical/regex prefilter:
intent patterns via regex/`includes`, file globs, and context substring match. If
`matches.length === 0` the stage sets `earlyExit` and returns **zero** skills.
Only when matches exist does it score them — and even on the `embedding` route
(`scoreWithEmbeddings`, line 138) it embeds and ranks *only those same
lexical candidates*.

Consequence: a semantically-relevant skill whose trigger phrases don't literally
appear in the query is never a candidate, so embeddings cannot surface it. The
"embedding semantic path" is therefore a re-ranker over a lexical recall set, not
a semantic retriever. The single most valuable property of dense retrieval —
recalling lexically-dissimilar-but-relevant items — is structurally unavailable.

**Recommendation:** When the router picks `embedding` (or as a fallback when
`findByTrigger` returns few/zero candidates), run an embedding scan over the full
enabled-skill set (or the pre-indexed `EmbeddingIndex`, see RET-8) and union those
hits with the trigger candidates before scoring. At minimum, do not `earlyExit` on
empty lexical matches when the semantic route is active.

**Effort:** M
**Verify:** Add a test with an intent that hits no trigger pattern but is a clear
paraphrase of an enabled skill's description; assert the skill is returned when
`retrievalConfig.enabled` is true. Today it returns empty.

### RET-2 — Embedding cache does not distinguish heuristic vs model vectors (MEDIUM, bug)

**Location:** `src/embeddings/embedding-service.ts:203-256` +
`src/embeddings/embedding-cache.ts:135-174`

`EmbeddingCache` tags every entry with a fixed `modelVersion`
(`'bge-small-en-v1.5-v1'`, `embedding-service.ts:37`) and `get()` only returns an
entry when that version matches. But the same version string is used whether the
vector came from the real BGE model or from `HeuristicEmbedder`. So:

- A run where `@huggingface/transformers` is unavailable writes **heuristic**
  384-dim vectors into the cache under the model's version tag.
- A later run where the model *is* installed calls `cache.get(...)`, the version
  matches, and the **heuristic vector is silently served as a model embedding** —
  permanently, until the content hash changes.

Additionally, on a cache hit `embed()` reports
`method: this.fallbackMode ? 'heuristic' : 'model'` (line 216) — the *current*
mode, not the mode that produced the cached vector — so telemetry/`method` is
unreliable for cached results.

**Recommendation:** Fold the producing method into the cache identity — e.g.
append `-heuristic` to `modelVersion` for fallback entries, or store a `method`
field on the entry and invalidate on mismatch. Return the stored method on hits.

**Effort:** S
**Verify:** Embed a skill in forced-fallback mode, then reload with the model
available; assert the second `embed()` recomputes (does not return the heuristic
vector) and reports `method: 'model'`.

### RET-3 — Heuristic fallback is hashed bag-of-words, not TF-IDF, not semantic (MEDIUM, gap)

**Location:** `src/embeddings/heuristic-fallback.ts:60-81,155-183` +
`src/embeddings/embedding-service.ts:68,225-228`

`EmbeddingService` constructs `new HeuristicEmbedder(EMBEDDING_DIM)` and **never
calls `addDocument`**, so `documentCount` stays 0 and `embed()` always takes the
`populateWithTermFrequency` branch: DJB2-hash each token into one of 384 buckets
with `1 + log(freq)` weight, then L2-normalize. There is no IDF and no notion of
term relatedness — two paraphrases sharing no exact tokens get cosine ≈ 0.

Because the transformer model is an `optionalDependency` (`package.json:131-134`),
this hashed-BoW path *is the default semantic backend* on any install that skips
optional deps. The class doc-comment ("Uses TF-IDF weights… same pattern as
RelevanceScorer", lines 5-15) is misleading about what actually runs. Net effect:
with the model absent, the "embedding" route in RET-1 degrades to lexical overlap —
strictly no better than the TF-IDF route it's supposed to complement, and it still
pays the cost of embedding every description.

**Recommendation:** Seed the heuristic corpus from the skill index at
`initialize()` time (call `addDocument` per skill description) so the fallback is
actually IDF-weighted; or, if that's not worth it, drop the corpus branch, keep
hashed-BoW, and correct the doc-comment + surface `isUsingFallback()` to callers so
they know semantic quality is degraded. Note RET-6 before enabling the corpus path.

**Effort:** M
**Verify:** With the model disabled, embed two token-disjoint paraphrases and
assert cosine > 0 after the corpus-seeding fix (today it is ~0).

### RET-4 — No hybrid/fusion or re-ranking in skill retrieval, despite a proven one in-repo (MEDIUM, improvement)

**Location:** `src/application/stages/score-stage.ts:63-80`,
`src/retrieval/adaptive-router.ts` — vs. unused `src/memory/hybrid-scorer.ts`,
`src/memory/strategies/lexical.ts`

`AdaptiveRouter.classify` picks *either* `tfidf` *or* `embedding` per query; the
two signals are never fused, and there is no re-ranking pass over the merged
result. Reciprocal-rank fusion or a weighted lexical+dense blend is the standard,
cheap win here.

The repo already ships exactly these: `src/memory/hybrid-scorer.ts` is a
pure-function re-ranker (keyword overlap, temporal proximity, name/quote boosts)
that its own header documents as lifting LongMemEval recall from 96.6% to 98.4%
"with zero LLM calls", and `src/memory/strategies/lexical.ts` exports a
`BM25Strategy`. Neither is referenced by `src/retrieval/*` or `ScoreStage`. The
skill-retrieval path is the weakest retriever in the codebase while a stronger one
sits one directory away, unused.

**Recommendation:** Add a fusion/re-rank stage: score candidates by both TF-IDF and
embedding cosine, combine via RRF (or reuse `hybrid-scorer`'s signal fusion), and
rank on the fused score instead of an either/or route. This also subsumes the
scale-mismatch problem in RET-5.

**Effort:** M
**Verify:** Benchmark against the default-cartridge trigger corpora
(`src/chipset/default-cartridge-benchmark.test.ts`) — fused ranking should match or
beat the current per-route accuracy on held-out paraphrases.

### RET-5 — CorrectionStage compares TF-IDF scores against a cosine threshold (MEDIUM, bug)

**Location:** `src/retrieval/corrective-rag.ts:63-116` +
`src/application/relevance-scorer.ts:45-64`

In the enabled pipeline the order is `score → correction`. `ScoreStage` on the
TF-IDF route fills `scoredSkills` with raw `natural` TF-IDF scores
(`scoreAgainstQuery` returns `tf*idf` sums, unbounded, **not** in [0,1]).
`CorrectionStage` then reads `context.scoredSkills[0].score` and compares it to
`confidenceThreshold = 0.7` (`corrective-rag.ts:63-66`) — a value that only makes
sense as a *cosine* similarity. On a mismatch it runs `reScoreWithEmbeddings`,
which **replaces** all scores with cosine sims.

So the 0.7 gate is applied to whichever scale the upstream route happened to
produce: a TF-IDF top score of 0.3 (common with small corpora) trips correction and
silently overrides the router's fast-path choice by re-embedding; a TF-IDF top
score of 2.5 skips it. The threshold is not calibrated to the score it guards.

**Recommendation:** Normalize `ScoreStage` output to a common scale, or make
`CorrectionStage` scale-aware (only apply the cosine threshold when the upstream
route was `embedding`; use a separate/normalized criterion for TF-IDF). Folding
into a single fused scorer (RET-4) removes the ambiguity entirely.

**Effort:** M
**Verify:** Feed a query whose TF-IDF top score is, say, 0.3 with correct top-1
ranking; assert correction does not needlessly re-embed and reorder it.

### RET-6 — HeuristicEmbedder corpus mode leaks temp documents (non-deterministic) (LOW, bug)

**Location:** `src/embeddings/heuristic-fallback.ts:128-153,201-209`

`populateWithTfIdf` adds a temporary document to `this.tfidf` to obtain TF-IDF
weights, then calls `rebuildTfidf()` to remove it — but `rebuildTfidf()` is a
documented **no-op** (lines 203-209). Every corpus-mode `embed()` therefore
permanently grows the corpus, shifting IDF weights, so repeated `embed()` of the
same text returns **different** vectors over time. Latent today because the service
never enters corpus mode (RET-3), but it will bite the moment RET-3's seeding fix
lands.

**Recommendation:** Track added documents in an array and truly rebuild the `TfIdf`
without the temp doc, or compute IDF from a frozen corpus snapshot taken once at
seed time and never mutate it in `embed()`.

**Effort:** S
**Verify:** With a seeded corpus, call `embed(text)` twice and assert vector
equality; today they diverge.

### RET-7 — CrossProjectIndex discards index relevance and re-scores with substring booleans (LOW, gap)

**Location:** `src/retrieval/cross-project-index.ts:73-142`

`search()` calls `skillIndex.search(query)` — which carries real relevance — then
**overwrites** each result's score with `computeScore()`, a coarse substring flag
(`===` → 1.0, name `includes` → 0.7, desc `includes` → 0.3). Cross-directory
merge/sort then runs on this crude scale, so genuinely relevant skills whose names
don't substring-match the query rank below exact-substring noise. There is also no
dedup/merge of the same skill name appearing in multiple scopes (user/project/
plugin) — duplicates surface as separate rows. Embeddings are not used at all here
even when enabled elsewhere.

**Recommendation:** Preserve the underlying `SkillIndex.search` score (optionally
blend with a scope-priority boost), dedup by skill name keeping the highest-scope
or highest-score instance, and reuse the shared scorer rather than an ad-hoc one.

**Effort:** M
**Verify:** Search a query that matches a skill by description only; assert it
ranks above a skill whose name merely contains the query token. Add a same-name
cross-scope fixture and assert a single merged row.

### RET-8 — Strong retrieval components exist but are unwired (MEDIUM, new-function)

**Location:** `src/memory/embedding-index.ts` (whole file),
`src/orchestration/retrieval-loop.ts:220-360`,
`src/embeddings/{skip-gram,trainer,co-occurrence,api,persist,settings}.ts`,
`src/drift/temporal-retrieval.ts`

Grep of non-test call sites shows these have **no production consumers**:

- **`EmbeddingIndex`** — a pre-indexed cosine store (embed once at ingest, pure
  arithmetic scan at query, batch ingest, import/export, and a `VectorBackend`
  seam explicitly designed for pgvector). This is the *correct* RAG index shape,
  yet nothing instantiates it and no `VectorBackend`/pgvector implementation
  exists. Meanwhile the live `ScoreStage` re-embeds descriptions **per query**.
- **`retrieve()` multi-turn loop** — RAGSearch-style iterative query expansion
  with an anytime-valid early-stop gate; exported from `orchestration/index.ts`
  but never called.
- **MD-1 learned skip-gram embeddings** — co-occurrence extraction + SGNS trainer
  + nearest-neighbour API + JSONL persistence, gated by
  `GSD_SKILL_CREATOR_EMBEDDINGS_ENABLED`, a flag **no code reads** (`settings.ts`
  is the only reference to `readEmbeddingsFlag` outside tests). The entire
  subsystem is inert.
- **`checkTemporalRetrieval`** — a stale-index freshness probe (DRIFT-23) with no
  caller.

These are not dead weight to delete blindly — each is tested and coherent — but
collectively they mean the project *built* a proper vector index, an iterative
retriever, a learned-embedding store, and a staleness guard, then shipped a
per-query-re-embed lexical-gated path instead. The highest-leverage move is to
route skill retrieval through `EmbeddingIndex` (fixes per-query re-embed cost from
RET-1/RET-3 and unlocks pgvector persistence).

**Recommendation:** Pick one integration target per milestone. Start with
`EmbeddingIndex` behind `retrievalConfig.enabled`: index enabled skills at
`initialize()`, scan at query, union with trigger candidates (RET-1). Then decide
whether `retrieve()`, MD-1, and temporal-check earn wiring or an explicit
"experimental/parked" marker so future audits don't re-flag them.

**Effort:** L
**Verify:** After wiring `EmbeddingIndex`, assert query latency no longer scales
with per-query description embedding count, and that a cold cache indexes once.

## New-function / capability opportunities

- **Reciprocal-rank fusion stage** for skill retrieval (RET-4) — cheapest single
  quality win; reuse `memory/hybrid-scorer.ts`.
- **Full-corpus semantic recall** (RET-1) — the difference between a re-ranker and
  a retriever.
- **pgvector `VectorBackend` implementation** — `EmbeddingIndex` already defines the
  interface; `better-sqlite3` is already an optionalDependency, so a SQLite-vec or
  pgvector backend is a natural, low-surface add for datasets that outgrow RAM.
- **Router replacement via the `intent-router` skill** — `AdaptiveRouter`'s
  word-count + question-word regex is crude; the repo now ships an `intent-router`
  skill (Pre-Route/MemFlow) that classifies information-need and could drive
  strategy + token-budget + depth instead of a binary tfidf/embedding flip.
- **Wire the multi-turn `retrieve()` loop** for hard/low-confidence queries as a
  second-stage expander when single-pass confidence is low (a real corrective-RAG,
  replacing the naive stop-word-stripping refinement in `corrective-rag.ts`).

## Notes

- Isolated component quality is genuinely good: `cosine-similarity.ts`,
  `embedding-cache.ts` (content-hash + version invalidation, atomic-ish writes),
  `persist.ts` (lossless Float64 JSONL round-trip with strict validation), and the
  skip-gram/trainer determinism story are all clean and well-tested. The problems
  are integration-level, not primitive-level.
- `prompt-embedding-cache.ts` is correctly wired into `cli/commands/discover.ts`
  for the clustering pipeline and uses atomic temp-file+rename (better than
  `embedding-cache.ts`'s direct write). It shares the same hardcoded
  `'bge-small-en-v1.5-v1'` version string, so it inherits RET-2's heuristic/model
  ambiguity if the model is unavailable during clustering.
- `EmbeddingService` is broadly consumed (simulation, conflicts, team-validator,
  scan-arxiv ranker, orchestrator intent semantic-matcher) — so RET-2/RET-3 affect
  more than skill retrieval; the cache-poisoning and non-semantic-fallback issues
  degrade every one of those consumers on a model-less install.
- All findings are on the default-OFF retrieval path, which is why none are rated
  critical — but it also means the semantic path is under-exercised, so these gaps
  would surface the moment `retrievalConfig.enabled` is turned on by default.
