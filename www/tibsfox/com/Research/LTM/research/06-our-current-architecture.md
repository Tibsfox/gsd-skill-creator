---
title: "Our Current Memory Architecture: Strengths & Gaps"
module: 06
series: "LTM Research"
project: "gsd-skill-creator"
status: "draft"
date: "2026-04-08"
---

# Module 06 — Our Current Memory Architecture: Strengths & Gaps

> A cold-eye walk through the TypeScript we have written in `src/memory/`
> and `src/mcp/gateway/tools/`, an accounting of what it actually does, and
> an equally careful accounting of what it does not do — particularly the
> things we know the state of the art does better.
>
> If we are honest here, the next modules can fix what's missing. If we are
> generous here, we will build on sand.

---

## 1. The 30,000-ft view

`gsd-skill-creator` owns a memory subsystem at `src/memory/` consisting of
nine TypeScript files and roughly 5,700 lines of code. The subsystem is
organized around a single governing metaphor borrowed from Building
Information Modeling (BIM): **Level of Detail** (LOD). In the BIM spec,
an object progresses through LODs 100–500: concept, schematic, detailed,
construction, fabrication, as-built. Each level answers a different
question: *what is this?*, *how big?*, *exactly what?*, *how does it
connect?*, *how is it built?*, *what was actually built?*. We took that
idea wholesale and applied it to memory storage tiers.

The six tiers as they exist in code today:

| LOD | Name | Store class | Backing | Latency | Role |
|-----|------|-------------|---------|---------|------|
| **100** | Concept | `RamCache` | In-process `Map` | <1ms | Hot memories, LRU, ~256 entries |
| **200** | Schematic | `IndexManager` | `MEMORY.md` + `.md` files | ~10ms | Always-loaded pointer index |
| **300** | Detailed | `FileStore` | Per-memory `.md` with frontmatter | ~50ms | Verbatim content, keyword search |
| **350** | Construction | `ChromaStore` | ChromaDB | ~100ms | Semantic vectors (optional) |
| **400** | Fabrication | `PgStore` | PostgreSQL + pgvector | ~20–200ms | Authoritative relational store |
| **500** | As-Built | *(implicit)* | Filesystem + git history | seconds | Corpus-level recall |

The top lives in process RAM for session-scoped heat. The bottom is git
history — every commit is, from one angle, a snapshot of the LOD 500
corpus. The tier doing the most work is 400 (PostgreSQL); the tier we
rely on in the tightest loop is 100 (RAM). One surprise for first-time
readers: the retrieval quality we report on benchmarks does not come from
"throw it in a vector DB and pray." It comes from a careful fusion of
keyword signals, temporal decay, and scope proximity layered on top of
the embedding stage. We'll get there in §5.

---

## 2. The data model — records, scope, visibility, time

Open `src/memory/types.ts` and you find the data model the whole system
rotates around. A `MemoryRecord` is not "a blob with an embedding." It is
a dense object with fields for identity, classification, lifetime,
provenance, access statistics, and relations.

**Six memory types.** `user`, `feedback`, `project`, `reference`,
`episodic`, `semantic`. The type drives default `temporalClass` and
default `visibility` through `inferTemporalClass()` and `inferVisibility()`.
When in doubt, private and seasonal.

**Five scopes**, ordered broadest to narrowest. Scope answers "where
does this memory apply?":

| Scope | Base relevance | Mismatch penalty | What lives here |
|-------|----------------|------------------|-----------------|
| `global` | 0.6 | 0.0 | User identity, universal prefs |
| `domain` | 0.7 | 0.4 | Knowledge domain (networking, rust) |
| `project` | 0.8 | 0.7 | Decisions, architecture, one repo |
| `branch` | 0.9 | 0.8 | Branch-specific state |
| `session` | 1.0 | 1.0 | Current session only |

A branch-scoped memory on the wrong branch is pushed down by a factor of
5. A session memory from a different session drops to zero. This is a
more refined scoping system than most memory systems we've reviewed. Mem0
has user/agent/session. Cognee has "datasets." Memori has "namespaces."
Our five-level ordering, combined with the project/branch distinction
(which matters when a worktree shares a repo across branches like we do
with `artemis-ii` and `gsd-skill-creator`), shows up in recall quality on
context-mixed queries.

**Three visibilities — `private` / `internal` / `public`** — the **hard
security boundary**. Not a suggestion, not configurable at runtime,
enforced at the store level:

```ts
private: { allowExternalSync: false, allowPublicSite: false, allowGitCommit: false }
internal: { allowExternalSync: false, allowPublicSite: false, allowGitCommit: true }
public: { allowExternalSync: true, allowPublicSite: true, allowGitCommit: true }
```

`routeToDatabase()` makes the invariant concrete: if visibility is not
`public`, the external database slot is `null`. A private memory cannot
accidentally ride a sync job to `tibsfox.com`. Compare to systems that
ship everything to a single vector DB and try to ACL at the query layer —
those systems leak.

**Five temporal classes with principled decay.** Not all old memories
are stale:

| Class | Half-life | Floor | For |
|-------|-----------|-------|-----|
| `timeless` | ∞ | 1.0 | Math proofs, user identity |
| `durable` | 180 d | 0.3 | Architecture, learned patterns |
| `seasonal` | 30 d | 0.1 | Sprint goals, active context |
| `ephemeral` | 3 d | 0.0 | Session state, workarounds |
| `dated` | 7 d | 0.2 | Historical — fast decay, hard floor |

The decay function is exponential `2^(-age/halfLife)` with a per-class
minimum floor. Most competitor systems use either no decay or a single
hand-tuned exponential.

**Provenance** carries `project`, `branch`, `worktree`, `mission`,
`phase`, `domains[]`. These are not standard fields in off-the-shelf
frameworks — they are opinions baked in from our own workflow. Mission
matters because we have long-running missions (Artemis II, NASA series).
Phase matters because GSD has a discuss/plan/execute/verify pipeline.
Worktree matters because we routinely share a repo across branches.

---

## 3. The write path

A new memory flows through a deterministic pipeline in `service.ts`:

```
remember(text, type, name, description)
  → MemoryRecord with UUID, timestamps, inferred temporalClass
  → store(record):
      1. LOD 300 FileStore — write .md with frontmatter (synchronous)
      2. LOD 350 ChromaStore — background store (swallow errors)
      3. LOD 200 IndexManager — promote if confidence≥0.8, accessCount≥5
      4. LOD 400 PgStore — via maintenance promotion rules
```

The write path is not "fan out to everyone." **LOD 300 is the single
source of truth.** If we only store to LOD 300, no data is lost. Higher
tiers (100 RAM, 200 index) are caches populated by access patterns.
Lower tiers (350 Chroma, 400 Postgres) are enhancements populated eagerly
or on a maintenance pass. Chroma and Postgres can be rebuilt from the
files. A failed Postgres or missing Chroma does not corrupt the archive.
This is deliberate: grep-able, git-friendly, tooling-independent.

Promotion is access-driven. A memory nobody queries stays at LOD 300. A
memory hit ten times in a week climbs to LOD 100, where it is hot for
the next session. Demotion is recency-driven: LOD 100 drops records
after 1 day idle, LOD 200 after 30. Bottom tiers never demote — they
are the archive.

---

## 4. The read path

The read path is where the interesting work happens.
`MemoryService.query()` does this, in order:

1. `resolveTiers(q)` — decide which LOD tiers to search
2. For each tier, call `store.query(q)`, merge into `Map<id, result>`
3. Dedupe by ID, keep highest score
4. If `cascade=true` and we have enough results, stop early
5. `hybridRerank()` — the multi-signal re-ranker
6. `applyTemporalDecay` — multiply by age-based decay factor
7. `applyScopeRelevance` — multiply by scope proximity factor
8. Sort by final score, apply `limit`, apply `tokenBudget`

Read that list carefully. This is *not* a thin wrapper around a vector
DB. The embedding score is only the first of several signals. After we
pull candidates back from pgvector or Chroma, we apply **four** signals
via `hybridRerank`, then **two** multiplicative factors (temporal decay,
scope proximity). By the time we sort, raw vector similarity is maybe
40% of the final score.

This is a direct port of the `hybrid_v4` strategy from mempalace, and
it's the reason we see 96.6% Recall@5 on LongMemEval where raw embedding
search gets about 85%.

---

## 5. The hybrid scorer — signals with no LLM calls

`src/memory/hybrid-scorer.ts` is the quietest file and possibly the one
doing the most work per line. It takes candidate documents with raw
distances and re-ranks using cheap heuristics. Every signal is a pure
function. There are no LLM calls. There is no learned component. And
yet it pushes raw embedding recall from ~85% to 96.6% on LongMemEval.

**The question: what is the 5th signal?** The first four are obvious
from the code: **keyword overlap**, **quoted phrases**, **person names**,
**temporal proximity**. The fifth is the one that is *extracted* rather
than *compared*: **preference extraction**.

`extractPreferences(text)` runs 21 regex patterns pulling out first-person
statements of concern, struggle, preference, habit, memory, and nostalgia:

```ts
/i(?:'ve been) having (?:trouble|issues?) with ([^,\.!?]{5,80})/gi
/i prefer ([^,\.!?]{5,60})/gi
/i used to ([^,\.!?]{5,60})/gi
/when i was (?:in high school|in college|young|a kid)[,\s]+([^,\.!?]{5,80})/gi
// ... 17 more
```

Notably, preferences are not directly fused into the final distance in
`hybridRerank` — the fused formula multiplies only four factors.
Preferences are an **extraction heuristic** used to classify documents
as containing user-owned state. It's an offline signal, not a runtime
distance tweak. So the five signals are "four distance tweaks plus one
extraction," not five distance tweaks.

The four distance tweaks, with their weights:

1. **Keyword overlap** (weight 0.30). Fraction of query keywords present
   in document. Stop-worded, 3+ char tokens.
2. **Quoted phrase boost** (weight 0.60). Phrases in single or double
   quotes (3–60 chars). High precision — if a user asks "what did you
   say about 'temporal grounding'?" and a doc contains that exact
   phrase, confidence is very high.
3. **Person name boost** (weight 0.40). Capitalized 3–15 char words not
   in the `NOT_NAMES` stopword set. Boosts when query and document share
   proper nouns like our muse agents (Willow, Cedar, Hemlock).
4. **Temporal proximity** (max boost 0.40). `parseTimeOffset` handles
   "3 days ago", "last month", "a couple of days ago", "recently",
   converting them to `{daysBack, toleranceDays}` relative to query
   date. `temporalBoost()` decays linearly past tolerance over a 3x
   envelope.

The fusion per document is strictly multiplicative:

```
fused = raw_distance
      * (1 - 0.30 * keyword_overlap)
      * (1 - temporal_boost)        // already in [0, 0.4]
      * (1 - 0.40 * name_overlap)
      * (1 - 0.60 * phrase_overlap)
```

Signals never fight — they accumulate. A document hitting all four can
see its distance cut by ~80%. What this does *not* do: learn weights.
The values are hand-tuned from mempalace's LongMemEval sweep. They work
for conversation recall. They are probably not optimal for code recall
or fact recall — we have never measured.

---

## 6. The PostgreSQL schema — LOD 400 as authoritative tier

`pg-store.ts` is the largest file (818 lines). It runs its own migration
block on `init()`. Five tables:

**`artemis.memories`** — 25 columns covering identity, provenance
(scope, visibility, temporal_class, domains, project, branch, worktree,
mission, phase), classification (tags, confidence), temporal validity
(`valid_from`, `valid_to`, `created_at`, `updated_at`, `last_accessed`,
`access_count`), source, and a `vector(384)` embedding column.

**`artemis.memory_relations`** — `(subject_id, predicate, object_id,
valid_from, valid_to, confidence)`. Predicate is one of `supersedes`,
`contradicts`, `elaborates`, `derives-from`. Cascade-deletes with
endpoints. This is the nearest thing we have to a graph layer — more
on that in the gaps section.

**`artemis.conversation_sessions`** — session metadata.

**`artemis.conversation_turns`** — turn-level log with its own 384-dim
embedding column.

**`artemis.schema_version`** — tracks applied migrations.

**Sixteen indexes.** Two are vector-class: `idx_memories_embedding` and
`idx_turns_embedding`, both `ivfflat vector_cosine_ops` (pgvector's ANN
for this version). Three are GIN: `idx_memories_tags` on the tags array,
`idx_memories_fulltext` and `idx_turns_fulltext` on tsvector. The other
eleven are standard btrees for filter pushdown on type, scope,
visibility, project, branch, temporal validity, subject/object/predicate,
session, role, and timestamp.

`PgStore.query()` is a hybrid FTS + ILIKE search with `ts_rank_cd`
ordering, filtered by visibility/type/scope/tags/temporal validity:

```sql
SELECT *,
  ts_rank_cd(to_tsvector('english', name||' '||description||' '||content),
             plainto_tsquery('english', $1)) AS text_rank
FROM artemis.memories
WHERE ...conditions...
  AND (to_tsvector('english', ...) @@ plainto_tsquery('english', $1)
       OR name ILIKE '%'||$1||'%'
       OR description ILIKE '%'||$1||'%')
ORDER BY text_rank DESC, last_accessed DESC
```

The vector path is separate, via `searchByEmbedding()`, using
`embedding <=> $1::vector` cosine distance. When we want exact recall,
we can `SET ivfflat.probes = 10` before the query.

Graph traversal lives in `traverseGraph(startId, maxHops)` as a recursive
CTE that handles both directions of each edge and walks up to `maxHops`
levels. For `maxHops = 2` on a sparse graph, this is a cheap index scan.

---

## 7. Conversation ingestion — 129 sessions, 16,928 turns

We have 129 session logs and 16,928 turns loaded. The ingestion pipeline
lives in two places:

**`ConversationStore`** handles file-level ingest. Its
`ingestSessionLog(logPath)` reads a Claude Code JSONL log, parses each
line, classifies role (`human`/`assistant`/`system`), caps at 10K chars
per turn, writes to `.local/conversations/chunks/{sessionId}.jsonl`, and
updates the in-memory session index. The store path is in `.gitignore`
by construction — this data is **always private**.

**`PgStore.storeTurn()`** upserts into `artemis.conversation_turns` with
`ON CONFLICT (id) DO NOTHING` for idempotent re-ingestion. It bumps
`turn_count` on the parent session. Neither table is ever synced
externally: `getPublicMemoriesForSync()` returns memories only, never
turns.

Crucially, the conversation store has a **separate retrieval path** from
the memory store. `searchConversations(query)` is its own FTS via
`ts_rank_cd`, its own MCP tool (`memory.search_conversations`). It
deliberately does not merge into general query surface, because
conversation turns are cheap, numerous, and noisy — blending them into
general recall results in 50 half-relevant assistant turns drowning out
3 actually-useful architecture decisions.

---

## 8. The MCP tool surface

`src/mcp/gateway/tools/memory-tools.ts` exposes **8 tools** to agents:

| Tool | Purpose |
|------|---------|
| `memory.query` | Hybrid search across all tiers with re-ranking |
| `memory.store` | Persist a memory with explicit type/scope/visibility |
| `memory.recall` | Quick retrieval — content strings only |
| `memory.relate` | Create a relationship (supersedes/contradicts/elaborates/derives-from) |
| `memory.deprecate` | Set `validTo` on a memory |
| `memory.wakeup` | Session-start context from LOD 100 + 200 |
| `memory.stats` | Tier counts, type distribution, active vs deprecated |
| `memory.search_conversations` | Private conversation history search |

Every tool has a strict Zod schema. Every response is the MCP envelope
`{ content: [{ type: 'text', text: JSON }] }`.

---

## 9. What this architecture does well

Taking an honest look at the code, these are the things I think stand up
against the literature.

**Tiering by access pattern, not by type.** Most memory systems separate
"short-term" from "long-term" by content type or TTL. We separate by
access latency budget and promotion ladder. A memory can live
simultaneously at LOD 100, 300, and 400. Promotion surfaces hot
memories naturally without manual curation.

**Provenance-native scoring.** Project, branch, worktree, mission,
phase, domain are all first-class fields *and* first-class multipliers
in the scorer. Query for "decomposition patterns" while on the
artemis-ii branch and memories tagged artemis-ii boost above memories
tagged nasa, with global memories always contributing a baseline. This
is a substantial win on multi-project setups, which is our normal
operating mode.

**Temporal classes with principled decay.** Five classes, each with
half-life and floor. Timeless never decays. Ephemeral goes to zero in
two weeks. The decay is a cheap pow-of-2 that is intuitive to reason
about.

**Hybrid re-ranking with zero LLM calls.** The jump from ~85% raw
embedding recall to 96.6% R@5 on LongMemEval comes from four pure-function
signals. Quoted phrases and person names are high-precision signals
raw embeddings almost never catch. This is arguably our most
transferable technique.

**Hard visibility enforcement.** Private memories literally cannot be
sent to an external store because `routeToDatabase('private').external
=== null`. Enforcement at the routing layer, not the query layer. The
invariant is not configurable. Compare to systems where every query
has to remember to pass an ACL filter — those leak.

**File store as source of truth.** Every memory is a markdown file with
YAML frontmatter. Grep-able, git-log-able, readable without a database.
Chroma and Postgres can be rebuilt from the files. Resilient to tooling
changes.

**Conversation store separate by design.** Private, separate API,
separate retrieval path, separate tool. Never merges into general
recall. Keeps the signal-to-noise ratio of the memory store high.

---

## 10. What this architecture does not do — the honest gap list

Now the hard part. Modules 01–05 of this series covered Cognee, Memori,
BEAM/LIGHT, LongMemEval, and OperateSeal. Each does something we do not.
The gap list, in rough order of impact:

### 10.1 No proper graph layer

**Cognee scores 0.93 on HotPotQA** because it builds a knowledge graph
from entities extracted from documents and walks that graph at query
time. We have `memory_relations`, a flat `(subject, predicate, object)`
table with four predicate types. That is not a knowledge graph. It is
an annotation layer for human-created relationships between memory
records.

The difference matters on multi-hop queries. "Which muse agents use the
Cedar filter?" — Cognee walks from "Cedar" through "filter" to "agents"
and back. Our system does full-text search for "Cedar" and "filter" and
hopes the relevant memories surface. With 16,928 turns, they often do —
but recall on multi-hop depends on the keyword re-ranker carrying the
load, not on structural understanding.

**What we'd need:** automatic entity extraction from memory content, a
proper nodes + edges pair of tables (trivial given we already have pg),
and a graph-aware query path doing 2–3 hop traversal on matched entities.

### 10.2 No semantic triples

**Memori scores 81.95% on LoCoMo vs Mem0's 62.47%** because it uses
Subject-Predicate-Object triples as the atomic memory unit instead of
text chunks. "Foxy was born 4/21/1976" becomes `(Foxy, birth_date,
1976-04-21)`. Triples are queryable by shape, compose, and resist
paraphrase drift.

We store text records. Our `memory_relations` has triple shape but only
between *other memory records*, not arbitrary entities. We cannot ask
"what is Foxy's birth date" and get a deterministic answer; we can only
ask for memories that happen to mention both. **LoCoMo tests exactly
this case.** Our score: 60.3%. Mem0's: 62.47%. Memori's: 81.95%. **That
22-point gap is, to a first approximation, the triples gap.**

**What we'd need:** a triples table with its own indexes, a write path
extracting triples from incoming memories, a query interface that knows
about triple shape.

### 10.3 No LIGHT-style scratchpad

**BEAM with LIGHT shows 3.5–12.7% improvement on multi-turn coherence.**
LIGHT is a lightweight in-context scratchpad the model writes to during
generation, persisting across turns, letting it remember intra-task
state without round-tripping through the full memory store.

We have `getWakeUpContext()` for session start and `memory.wakeup` for
tool-level access, but nothing the model updates *during* a task. The
closest is the RAM cache, which the service updates on access — but the
agent has no way to explicitly write "note to self, build failed at
step 3" without using `memory.store` (which persists to LOD 300 — overkill
for transient task state).

**What we'd need:** a per-session scratchpad, a SQLite table or a
`.local/scratchpad/{sessionId}.jsonl` file, with simple
`scratchpad.append`/`scratchpad.read` MCP tools. Session-scoped,
ephemeral, never promoted above LOD 100.

### 10.4 No persistent RAM tier — we thrash local storage

Our LOD 100 cache is an in-process `Map` that dies with the Node
process. Every new process starts with an empty LOD 100 and populates
it by reading files from disk. With a warm page cache this is fine. On
a cold start after reboot, the first queries are slow because they hit
ext4.

A proper fix is a persistent RAM tier — `tmpfs` or a memory-mapped cache
file surviving process restarts but living in RAM. Linux has `tmpfs` out
of the box. Our RTX 4060 Ti machine has 60GB RAM. We are leaving cache
locality on the table.

**What we'd need:** a `RamCache` backend that snapshots to tmpfs every
N seconds and restores on startup. The gain is session-boot time, which
happens constantly during autonomous work.

### 10.5 No benchmark feedback loop

We have measured scores: LongMemEval R@5 96.6%, R@10 98.2%, ConvoMem
92.0%, LoCoMo 60.3%, MemBench 84.0%. Those numbers exist because
someone ran the benchmarks once. They are not rerun when we change
scorer weights, add a tier, or re-ingest conversations. We have no
regression test for recall quality.

**What we'd need:** a nightly or per-PR benchmark run on a fixed corpus,
writing numbers to a table, alerting on regressions. The benchmarks
already exist. It's a CI wiring problem. Without it, our 96.6% R@5 is
a snapshot, not a guarantee.

### 10.6 Interpreting our benchmark scores

- **LongMemEval R@5 96.6%, R@10 98.2%** — conversational recall on the
  same benchmark mempalace hybrid_v4 scored 96.6/98.4. We match because
  we ported the scorer. **Strong.**
- **ConvoMem 92.0%** — conversational memory, slightly easier than
  LongMemEval. In range of the literature. **Strong.**
- **LoCoMo 60.3%** — long-context memory over years of conversation.
  Memori with triples: 81.95%. Mem0 without triples: 62.47%. We're close
  to Mem0, far from Memori. **Weakest score, most actionable gap.**
- **MemBench 84.0%** — broad memory benchmark. Middle-of-pack. **Okay.**

The **LoCoMo vs MemBench asymmetry** is worth staring at. MemBench
rewards good keyword/vector retrieval. LoCoMo rewards structured
extraction. We do well on the former and poorly on the latter because
our architecture is chunk-based, not entity-based. Build the triple
store (§10.2) and the graph layer (§10.1) and LoCoMo is where we'd see
the biggest jump.

### 10.7 Minor gaps worth naming

- **`MemoryService` doesn't wire `PgStore`.** `service.ts` line 105
  constructs LOD 100/200/300 and optionally 350. LOD 400 is commented
  "Phase 2, not implemented yet." PgStore exists but is used via the
  MCP layer and conversation ingestion, not through the unified service.
  `cascade: true` queries don't actually touch Postgres via the service.
- **`ConversationStore.search` ignores Postgres FTS.** Does its own
  in-memory keyword search over JSONL chunks and only falls back to
  disk scan. Does not query `artemis.conversation_turns`, which has
  the proper GIN index. Redundant search path.
- **Session-scope matching is buggy.** `scope === 'session'` compares
  `queryContext.session === memory.workspace`. Those are the wrong
  fields: `workspace` is a filesystem path, `session` is usually a
  UUID. Session-scoped memories never match their own session.
- **YAML frontmatter parsing is bespoke.** Both `file-store.ts` and
  `index-manager.ts` have their own minimal parsers with different
  edge cases. A well-known YAML lib would replace ~200 lines each.
- **Access counts double-increment.** Both `PgStore.get` and
  `FileStore.get` bump `access_count`, and `RamCache.store` does it
  too on update. If the same memory touches three tiers in one query
  cycle, access count jumps by 3. Biases promotion toward
  already-promoted memories.

---

## 11. Capability comparison

| Capability | Our Architecture | Best in class | Gap |
|------------|------------------|---------------|-----|
| Storage tiers | 6-tier LOD | 2–3 typical | **Ahead** |
| Hard visibility enforcement | Routing-layer policy | Query-layer ACL | **Ahead** |
| Scope/provenance scoring | 5 levels, multiplicative | 1–3 levels | **Ahead** |
| Temporal decay | 5 classes w/ half-lives | 0–1 class typical | **Ahead** |
| Conversation isolation | Separate store + API | Usually merged | **Ahead** |
| Hybrid re-ranking | 4 distance signals + extraction, no LLM | BEAM LIGHT scratchpad | **Par** |
| Vector search | pgvector cosine ivfflat | pgvector HNSW / dedicated | **Par** |
| Full-text search | PG tsvector + GIN | Same | **Par** |
| MCP tool surface | 8 tools | Comparable | **Par** |
| Graph layer | Flat relation table, 4 predicates | Cognee KG, HotPotQA 0.93 | **Behind** |
| Semantic triples | None — text records only | Memori, LoCoMo 81.95% | **Behind, 21 pts LoCoMo** |
| Entity extraction | None | Cognee, Mem0, Memori | **Behind** |
| In-context scratchpad | Wake-up only, no mid-session | BEAM LIGHT, +3.5–12.7% | **Behind** |
| Persistent RAM tier | Dies with process | tmpfs-backed cache | **Behind** |
| Benchmark feedback loop | Manual snapshots | Nightly regression | **Behind** |
| Multi-hop recall | Keyword re-ranker dependent | Graph traversal | **Behind** |

---

## 12. Where this leaves us

The honest summary: we have built a **very good chunk-based memory
system** with unusually strong scoping, provenance, and visibility
controls. We are ahead of the field on tiering, access control, and
multi-signal re-ranking without LLM calls. We match on vector and
full-text retrieval.

We are **behind on structured extraction** — triples, entities, graph.
That is one capability family, and it is the single largest lever we
have for improving LoCoMo and enabling multi-hop recall.

We are **behind on runtime memory locality** — no persistent RAM tier,
no in-session scratchpad, no rerun-on-change benchmark loop. Smaller
individual wins but they compound.

The next modules should focus on:

1. **Designing the triple store tier.** New `artemis.triples` table, its
   own write path from ingestion, its own query tool. Target: close the
   LoCoMo gap.
2. **Designing the graph walker.** Builds on triples; extends
   `traverseGraph` to walk entities, not just memory records. Target:
   close the HotPotQA gap.
3. **Wiring `PgStore` into `MemoryService.resolveTiers`** so cascade
   actually uses LOD 400. Removes the "phase 2 not implemented" footgun.
4. **A tmpfs-backed `RamCache` snapshot** so session boot stops being
   a concern.
5. **A nightly benchmark job** on the same corpora we measured before
   so our scores stop being snapshots.

None are research problems. They are engineering with established
reference implementations. The research-level question this module is
building toward: can the LOD metaphor absorb structured extraction
cleanly, or do triples and graphs want to live *alongside* the LOD stack
as a parallel retrieval path that feeds the same `hybridRerank` stage?

My suspicion is the latter. LOD 100–500 is about **latency and detail**.
Triples and graph are about **shape**. Those are orthogonal axes. A
triple lives at LOD 400 (Postgres) but answers a different kind of
question than a chunk at LOD 400. The read path should fan out to both,
merge, re-rank, return. The write path should extract triples from every
new memory but keep the text chunk as source of truth.

That's the architecture I think we're going to end up with. The next
modules can test that hypothesis.

We know what we have. We know what we're missing. Module 07 picks up
from here with the triples design.
