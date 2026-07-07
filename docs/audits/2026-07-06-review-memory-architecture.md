# Memory Architecture Review — 2026-07-06 (Dimension D)

Deep dive on `src/memory/*` (the LOD-tiered memory system, the Grove content-addressed
substrate, the M2 hierarchical-hybrid primitives, and the scorer family) plus
`src/types/memory.ts`. Read-only audit. Every claim below was verified against source
with grep/read; file:line anchors are given.

Scope note: this review deliberately does **not** re-cover artifact/skill/agent content
(handled by `2026-07-06-artifact-ecosystem-review.md`) and does not deep-review the
experimental math surface. It focuses on the memory *code* — what the model is, what is
wired vs dormant, cross-store consistency, and capability under-use.

## Summary

The memory layer is architecturally ambitious and largely **well-implemented at the
component level**, but the top-level product exposes **none of it**. There are two
distinct, healthy subsystems and one large dormant one:

1. **WIRED — the Grove substrate.** `grove-format.ts`, `grove-store.ts`,
   `content-addressed-store.ts`, `rust-arena.ts` + `node-arena-shim.ts` are the real,
   live memory: consumed by `src/mesh/*` (arena skill store, namespaces, views, exports)
   and `src/mcp/gateway/tools/arena-tools.ts`. `scorer.ts` (`MemoryScorer`) is wired into
   `src/orchestration/selector.ts`. `src/types/memory.ts` (Living Sensoria M1–M5) is the
   actual shared type vocabulary — used by ~28 modules (traces, umwelt, branches,
   embeddings, graph, cache). These are fine.

2. **DORMANT — the entire `MemoryService` LOD stack.** `MemoryService` (service.ts, 788
   loc) and every tier store it orchestrates (`RamCache`, `IndexManager`, `FileStore`,
   `ArenaFileStore`, `ChromaStore`, and the "future" `PgStore`) plus the eight memory MCP
   tools (`memory.query/store/recall/relate/deprecate/wakeup/stats/search_conversations`)
   are **never instantiated or reached in shipped code** — only in docstrings and tests.
   The stdio MCP server the CLI actually launches (`createMcpServer`) registers 3 *skill*
   tools and no memory. The HTTP gateway that *could* host memory tools is itself never
   started outside tests, and the production gateway factory omits memory tools anyway.

3. **DORMANT — a large secondary cluster.** `pg-store.ts` (816 loc, full pgvector),
   `conversation-store.ts`, `embedding-index.ts`, `triple-store.ts`, `peer-trust.ts`,
   `content-addressed-set-store.ts`, `survey-scorer.ts`, `relevance-scorer.ts`,
   `memory-loader.ts`, `strategies/lexical.ts`, and the M2 lifecycle trio
   (`short-term.ts`/`long-term.ts`/`reflection.ts`/`read-write-reflect.ts`) have **zero
   production importers** (only barrel re-export + tests, or a "must-not-import" boundary
   doc). Well over 4,000 lines of tested-but-unreachable memory code.

There are also three parallel, unreconciled memory-*type* taxonomies and a genuine
cross-store consistency bug in access-count accrual that would bite the moment the
`MemoryService` were wired up.

Headline: the memory subsystem is a **capability that exists but is not surfaced**. The
highest-value move is not new code — it is wiring the already-built, already-tested stack
into a reachable entry point (the gateway config already has the slot for it).

## Findings

### D-1 (HIGH) — MemoryService + all LOD tier stores + memory MCP tools are unreachable in shipped code
- **Location:** `src/memory/service.ts` (whole file); `src/mcp/gateway/tools/index.ts:82-84`;
  `src/mcp/gateway/create-gateway-server.ts:110-164`; `src/mcp/server.ts:42-120`;
  `src/cli/commands/mcp-server.ts`.
- **Problem / evidence:**
  - `grep -rn "new MemoryService"` across `src/ tools/ desktop/` (excluding tests) returns
    **only a docstring** (`index.ts:12`). Nothing constructs a `MemoryService`.
  - Memory tools register only inside `registerAllTools` (`tools/index.ts:82`) *and only if
    `config.memoryService` is set*. No caller ever sets it — `grep "memoryService:"`
    (non-test) returns nothing.
  - The **production** gateway factory `createGsdGatewayFactory`
    (`create-gateway-server.ts`) — the one whose header claims it "wires all 19 tools" —
    never imports `registerMemoryTools` at all. Its options interface
    (`GatewayFactoryOptions`, lines 69-85) has **no** `memoryService` field. So even a
    caller who wanted memory tools cannot pass one through this path.
  - The only server the CLI launches is the **stdio** `createMcpServer`
    (`mcp-server.ts:32` → `startMcpServer` → `createMcpServer`), which registers 3 skill
    tools (`server.ts` lines 50/77/111) and nothing memory-related.
  - `startGateway(...)` (the HTTP path that could host memory tools) has **zero non-test
    callers**; there is no `gateway` entry in `src/cli/dispatch.ts`/`help.ts`. The whole
    HTTP gateway is example/test-only.
- **Impact:** The product advertises an LOD-tiered memory system (`index.ts` module doc,
  `memory.*` MCP tools) that a user can never invoke. ~15 modules exist solely to satisfy
  their own test suites.
- **Recommendation:** Decide and act. Either (a) **wire it**: add a small
  `memoryService` field to `GatewayFactoryOptions`, construct a default `MemoryService`
  (FileStore LOD300 needs no external services), register memory tools in
  `createGsdGatewayFactory`, and add a `skill-creator gateway` CLI command that starts
  `startGateway`; or (b) **quarantine it**: move the dormant stack under
  `examples/`/`experimental/` and drop it from the public `memory/index.ts` barrel so its
  status is honest. Do not leave it in the shipped `src/` surface implying it works.
- **Effort:** M (wire a minimal FileStore-backed service + one CLI command) / S (quarantine).
- **Verify:** After wiring, `skill-creator gateway` (or an MCP client) can call
  `memory.store` then `memory.recall` and get the record back end-to-end. Before wiring,
  confirm the gap with `grep -rn "new MemoryService" src --include=*.ts | grep -v test`.

### D-2 (MEDIUM) — pg-store (LOD 400, 816 loc, full pgvector) is fully dormant; `pg` shipped for dead code
- **Location:** `src/memory/pg-store.ts`; `src/memory/service.ts:163-164` (commented out);
  `package.json:116` (`"pg": "^8.20.0"`).
- **Problem / evidence:** `PgStore` is a complete implementation — DDL for
  `artemis.memories`/`memory_relations`/`conversation_*` (lines 116-227), pgvector
  `vector(384)`, IVFFlat cosine index, tsvector FTS, dynamic `import('pg')`. It
  `implements MemoryStore`. Yet the `MemoryService` constructor explicitly leaves LOD 400
  as a comment: `// LOD 400 — PostgreSQL (Phase 2, not implemented yet)`
  (service.ts:163). Non-test importers of `pg-store`: **none** (only the `index.ts` barrel
  and doc-comments in `koopman-memory` and `long-term.ts`). The repo *does* have a live
  Postgres (`RH_POSTGRES_URL` in `.env`), so this is a wire-up gap, not a
  no-database problem.
- **Impact:** A production dependency (`pg`) and 816 loc of DDL/query code ship for a tier
  the service never creates. `MemoryServiceConfig.pgConnectionString` (service.ts:87) is
  accepted but ignored.
- **Recommendation:** If pursuing D-1(a), wire LOD 400 by uncommenting the branch and
  passing `pgConnectionString` (gate on env availability — it should degrade gracefully
  like ChromaStore does). If not, remove `PgStore` from the barrel and consider dropping
  the `pg` dependency, or relocate to `experimental/`.
- **Effort:** M (wire) / S (quarantine + dep prune).
- **Verify:** With `pgConnectionString` set, `getStats()` reports a non-zero LOD-400
  `tierCounts[400]` after a store; without it, service still boots.

### D-3 (MEDIUM) — Three divergent, unreconciled memory-type taxonomies
- **Location:** `src/memory/types.ts:444` (`MemoryType`, 6 values);
  `src/memory/survey-scorer.ts:29` (`MemoryType`, 9 values);
  `src/types/memory.ts` (Living Sensoria M1–M5 `Entity`/`MemoryEntry`/`DecisionTrace`).
- **Problem / evidence:** The `MemoryService` taxonomy is
  `user|feedback|project|reference|episodic|semantic` (types.ts:444). The survey/memory-shed
  pipeline defines a *different* `MemoryType`:
  `project|feedback|decision|reference|user|pinned-rule|observation|tactic|question`
  (survey-scorer.ts:29), keyed to `docs/memory-schema.md`. `src/types/memory.ts` is a
  third, entity-graph vocabulary. `survey-scorer.ts:23` itself notes it is "distinct from
  the legacy `relevance-scorer.ts`/`memory-loader.ts` pair". No adapter reconciles them; a
  consumer must pick a silo.
- **Impact:** Any attempt to unify memory retrieval (e.g. feed session-retro observations
  into `MemoryService`) hits an impedance mismatch — `pinned-rule`/`observation`/`tactic`
  have no home in the service taxonomy, and `episodic`/`semantic` have none in the survey
  taxonomy.
- **Recommendation:** Pick one canonical `MemoryType` (the survey 9-type set is the most
  operationally grounded — it maps to `docs/memory-schema.md` and the standing-rules
  invariant). Express the others as a documented mapping or `type` alias. At minimum, add a
  cross-reference comment in each file naming the others so the divergence is intentional
  and discoverable.
- **Effort:** M.
- **Verify:** A single `MemoryType` union imported by service, survey-scorer, and the
  MCP `memory.store` schema (`memory-tools.ts`) type-checks without a cast.

### D-4 (MEDIUM) — Access-count accrual is inconsistent across MemoryStore implementations (latent promotion bug)
- **Location:** `src/memory/file-store.ts:345-360` vs `374` (query); `src/memory/ram-cache.ts:232-233`;
  `src/memory/service.ts:341` and `:763`.
- **Problem / evidence:** `RamCache.query()` increments `accessCount`/`lastAccessed` on
  every hit (ram-cache.ts:232-233). `FileStore.query()` (file-store.ts:374) does **not** —
  only `FileStore.get()` bumps the counter (lines 359-360). But `MemoryService.query()`
  reaches stores through `store.query(q)` (service.ts:194), never `get()`. Records live
  primarily at LOD 300 (FileStore) — `store()` writes there first (service.ts:326-330). So
  a record that is repeatedly *recalled* never accrues access counts, and the promotion
  gate `record.confidence >= 0.8 && record.accessCount >= 5` (service.ts:341) plus
  `PromotionRule.minAccessCount` (service.ts:763) can essentially **never fire** for the
  default (FileStore) tier — while the RAM tier over-counts the same query.
- **Impact:** The promotion/demotion engine (a headline feature of the LOD design) is a
  no-op for the primary store; hot memories never rise to the LOD-200 index. Dormant today
  (D-1), but this is the bug that makes wiring D-1 disappointing.
- **Recommendation:** Move access accounting into `MemoryService.query()` (increment on
  every returned result, once per record, then persist) rather than relying on each store's
  `query()` to do it — that centralizes the semantics and removes the ram-vs-file
  divergence. Alternatively make all `MemoryStore.query()` implementations bump uniformly.
- **Effort:** S.
- **Verify:** Add a test: `store()` a record, `query()` for it 5×, then `runMaintenance()`
  and assert it appears in the LOD-200 index store (`has(id)` at `LodLevel.SCHEMATIC`).

### D-5 (MEDIUM) — Memory relations are ephemeral in-memory only; the supersedes/contradicts graph is lost and never queried
- **Location:** `src/memory/service.ts:124` (`private relations: MemoryRelation[] = []`),
  `:432-450` (`relate`), and absence of any relation read path.
- **Problem / evidence:** `relate()` builds a `MemoryRelation` and pushes it onto an
  in-process array (`this.relations.push`, service.ts:444). Nothing persists that array,
  nothing reads it back, and `query()`/`recall()` never traverse relations. The
  `supersedes`/`contradicts` side effect (deprecating the object via `validTo`) does
  persist, but the *edge itself* — subject, predicate, object, confidence — evaporates on
  process exit. The type model is rich (`MemoryRelation`, `RelationType` at types.ts:519;
  pg-store even has a `memory_relations` table, pg-store.ts:175) but the runtime graph is
  dead.
- **Impact:** No multi-hop retrieval, no "why was this deprecated", no contradiction
  auditing survives a restart — despite tests like `multi-hop-retrieval.test.ts` implying
  the capability. This is the semantic-graph promise of `src/types/memory.ts` M1 going
  unfulfilled at the service layer.
- **Recommendation:** Persist relations through a store (FileStore sidecar file, or the
  pg-store `memory_relations` table if D-2 is wired) and add a relation-aware read path
  (e.g. expand top query hits by one hop, filtering `validTo === null`).
- **Effort:** M.
- **Verify:** `relate(a,'refines',b)`, restart/reconstruct the service, and confirm the
  edge is still queryable.

### D-6 (MEDIUM) — Large dormant module cluster: ~4k loc of tested-but-unreachable memory code
- **Location:** `src/memory/{embedding-index,triple-store,peer-trust,content-addressed-set-store,
  survey-scorer,relevance-scorer,memory-loader}.ts`, `src/memory/strategies/lexical.ts`,
  and the M2 lifecycle `{short-term,long-term,reflection,read-write-reflect}.ts`.
- **Problem / evidence:** Each has **zero** production importers (verified per-module:
  `grep -rln "memory/<mod>" src tools desktop` excluding tests/barrel/self). The M2 trio is
  imported only by `src/koopman-memory/memory-boundary.ts` — and that file references them
  as things koopman **must not** import (a negative boundary), not a consumer.
  `long-term.ts:14` claims it is "wired to the warm (ChromaDB) and cold (pg-store) tiers"
  — it is not wired to anything. `content-addressed-set-store.ts` (multi-pool ArenaSet)
  implements `GroveStore` but no consumer injects it (the single-arena
  `ContentAddressedStore` is the one `src/mesh` uses). `strategies/` (a pluggable retrieval
  strategy dir with `lexical.ts` + `index.ts`) has no importer at all.
- **Impact:** Dead weight that inflates the memory surface, confuses "what is real", and
  imposes maintenance/test cost (these modules carry sizeable test files) for no shipped
  behavior. It also masks D-1 — a reader assumes so much code must be reachable.
- **Recommendation:** Triage into three buckets: (1) *promote* the ones you intend to wire
  (embedding-index is the natural vector backend behind ChromaStore; the M2 trio is the
  natural session-retro consumer) as part of D-1; (2) *quarantine* the clearly-legacy pair
  `relevance-scorer.ts` + `memory-loader.ts` (survey-scorer.ts:23 already calls them
  "legacy") into `experimental/` or delete; (3) *document* the rest with a one-line
  "unwired capability — entry point pending" header so status is explicit.
- **Effort:** M (triage + move) — mechanical.
- **Verify:** After triage, every file remaining in `src/memory/` has at least one non-test,
  non-barrel importer (a lint/audit script can assert this, mirroring the existing
  loader/process-context audits).

### D-7 (LOW) — Conversation history has two independent, non-shared backends
- **Location:** `src/memory/conversation-store.ts:33-34,155` (filesystem: `readFile`/
  `writeFile`/`mkdir`) vs `src/memory/pg-store.ts:191-219`
  (`artemis.conversation_sessions`/`conversation_turns` tables with embeddings/FTS).
- **Problem / evidence:** `ConversationStore` is filesystem-backed. `PgStore` independently
  defines the same conceptual entities as SQL tables with pgvector embeddings. Neither
  reads the other; there is no shared interface. The MCP `memory.search_conversations`
  tool binds to `ConversationStore` (memory-tools.ts:336-348), so the richer pg-backed
  conversation search (embeddings + tsvector) is unreachable even in principle.
- **Impact:** Divergent storage models for one concept; a future "search my past
  conversations semantically" feature would have to reconcile them.
- **Recommendation:** Pick one backing. If D-2 wires pg, make `ConversationStore` an
  interface with a pg implementation; otherwise drop the pg conversation tables to avoid
  implying a capability the tool layer can't use.
- **Effort:** M.
- **Verify:** One `ConversationStore` interface, one live implementation behind
  `memory.search_conversations`.

### D-8 (LOW) — Two divergent gateway factories; the tool-registry one is dead
- **Location:** `src/mcp/gateway/tools/index.ts:57-103` (`registerAllTools` /
  `createGatewayServerFactory`) vs `src/mcp/gateway/create-gateway-server.ts:110`
  (`createGsdGatewayFactory`).
- **Problem / evidence:** `createGatewayServerFactory` (tools/index.ts) is the only factory
  that wires memory tools, but it has **no non-test caller**. `createGsdGatewayFactory`
  (create-gateway-server.ts) is the documented production factory and duplicates the same
  registrations *minus* memory. Two factories, drifting registration lists, one dead.
- **Impact:** Maintenance hazard and the direct cause of D-1's "the slot exists but nothing
  fills it". A contributor fixing gateway tooling can easily edit the wrong factory.
- **Recommendation:** Collapse to one factory. Fold the `memoryService?` option into
  `GatewayFactoryOptions` and delete `createGatewayServerFactory` (or make it delegate).
- **Effort:** S.
- **Verify:** Only one factory function creates gateway servers; a grep for the deleted
  name returns test-only or nothing.

## New-function / capability opportunities

1. **Wire the memory stack into a reachable entry point (the flagship opportunity).** All
   the parts exist and are tested. A minimal path: add `memoryService?` to
   `GatewayFactoryOptions`, default-construct a FileStore-backed `MemoryService`
   (`memoryDir`/`indexPath` under the project's `.claude/memory`), register memory tools in
   `createGsdGatewayFactory`, and add `skill-creator gateway` to the CLI dispatch. This
   turns 15 dormant modules into a shipped feature with days, not weeks, of work — the
   design and tests are already done.

2. **Close the session-retro → long-term-memory loop.** The repo already captures rich
   session events (`tools/session-retro/observe.mjs`, per CLAUDE.md). The M2 trio
   (`short-term` → `reflection` → `long-term`) is the natural consumer: ingest observations
   into short-term, reflect into summaries, promote durable lessons into long-term. Today
   these modules float unattached. Wiring this would give the "adaptive learning layer" an
   actual persistent memory of past sessions instead of the ephemeral in-context MEMORY.md.

3. **Reconcile the three type taxonomies into one canonical `MemoryType`** (D-3). This is a
   prerequisite for #1 and #2 to interoperate and is cheap relative to its unlocking value.

4. **Make `embedding-index.ts` the real vector backend.** It is a clean, tested,
   pluggable-`EmbedFn` cosine index that "eliminates the query-time embedding cost
   entirely" (its own doc) but has no consumer. It could back either ChromaStore
   preloading or a lightweight local semantic search over Grove records without requiring a
   running ChromaDB server — a strictly-simpler LOD-350 than the current external-Chroma
   dependency.

5. **Add a `src/memory` reachability audit** mirroring the existing
   `loader-context-audit`/`process-context-audit` pattern: fail CI if a `src/memory/*.ts`
   module has no non-test importer and isn't explicitly marked experimental. This prevents
   the dormant cluster (D-6) from silently regrowing.

## Notes

- The Grove substrate (`grove-format.ts` 799 loc + `grove-migration.ts` + arena stores) is
  the healthiest part of the memory tree: real consumers, drift-guarded encoding, bootstrap
  type records, and a clean `GroveStore` DI seam. No action needed there beyond leaving it
  be. It is worth noting the naming collision this creates: "memory" in `src/memory/` means
  two unrelated things — the Grove content-addressed skill store (live) and the
  `MemoryService` LOD-tier record system (dormant). A short README in `src/memory/` naming
  which is which would save future readers the reverse-engineering this review required.
- `src/types/memory.ts` (Living Sensoria M1–M5) is *not* dormant — it is the shared type
  vocabulary across ~28 modules. Its header still says "implementations land in Wave 1
  Track D (phases 642–646)"; some implementations clearly did land (traces, branches,
  embeddings, graph, cache all import it), so that header is now stale and slightly
  misleading — worth a one-line update.
- The math/experimental surface named in the brief (koopman-memory etc.) intersects memory
  only through `koopman-memory/memory-boundary.ts`, which is a *negative* boundary
  declaration (what koopman may not import). It is doing its job and is not dead weight.
- I did not run the memory test suite (expensive; ~20 test files). Findings D-4/D-5 are
  code-path arguments verified by reading, and each carries a concrete `verify` test to
  confirm before fixing.
