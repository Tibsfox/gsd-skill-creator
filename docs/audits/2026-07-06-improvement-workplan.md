# gsd-skill-creator — Master Improvement Workplan (2026-07-06)

Synthesis of 11 dimension reviews (A code, B gsd-core alignment, C Claude Code best-practices, D memory/RAG/postgres). Top findings were adversarially verified; corrected severities and verdicts are carried through here. This is the single actionable backlog — dimension docs hold the per-finding detail.

Source reports:
- A/cli `docs/audits/2026-07-06-review-cli.md`
- A/orchestration `docs/audits/2026-07-06-review-orchestration.md`
- A/learning `docs/audits/2026-07-06-review-learning.md`
- A/artifact-code `docs/audits/2026-07-06-review-artifact-code.md`
- A/integration `docs/audits/2026-07-06-review-integration.md`
- A/quality `docs/audits/2026-07-06-review-quality.md`
- B/alignment `docs/audits/2026-07-06-review-gsd-core-alignment.md`
- C/bestpractices `docs/audits/2026-07-06-review-claude-code-bestpractices.md`
- D/memory-arch `docs/audits/2026-07-06-review-memory-architecture.md`
- D/retrieval `docs/audits/2026-07-06-review-retrieval-embeddings.md`
- D/postgres-rag `docs/audits/2026-07-06-review-postgres-rag.md`

---

## 0. Implementation status — updated 2026-07-07

Implemented this session (on `dev`, atomic commits, each verified against its tests; not pushed):

| ID | Commit | What landed |
|----|--------|-------------|
| INT-1 | `dbc91eeec` | `install.cjs --uninstall` now cleans our hook groups from the host settings file (roundtrip-verified; user hooks preserved) |
| AC-1 | `841238dc4` | Cartridge `src:` reads contained via opt-in `allowedRoots` + `assertWithinRoots`; CLI/scaffold opt in with the project root; e2e-verified an absolute-path escape is blocked before read |
| LEARN-3 | `8e5f20a23` | `hitlGate` hard-blocks critical hygiene findings centrally (covers `--yes` + all arxiv ingest tools); `--force-critical` override |
| CC-2, B2, B9 | `016a56607` | `SubagentSpawn`→`SubagentStart` (+ tool-tracker + hook-event allowlist lint); dead `get-shit-done-cc` → `@opengsd/gsd-core`; gsd-workflow routing table repointed to shipped commands |
| PG-2, PG-4 | `e2c74682a` | PgStore resolves `RH_POSTGRES_URL` via `loadPgEnv` + uses `connectionString`; vector index IVFFlat→HNSW |
| ORCH-1/2/3/N1 | `375869123` | `canonicalCommandName` normalization fixes the whole-classifier hyphen/colon mismatch; vocabulary reconciled to shipped `gsd:phase`; destructive gate for phase; ORCH-N1 drift guard |
| CLI-1/2/3 | `ab8198042` | `pic2html` wired + argv parser; `activations`/`cadence`/`pic2html` documented; registry↔help parity test |
| B10 | `1f7160bb5` | Config validator accepts modern gsd-core config (`model_profile: adaptive|inherit`, `granularity`, `effort`) |
| QUAL-1a | `35fd433a9` | Contract tests pinning the shared settings reader (target for the QUAL-1b cascade) |
| MEM-1 | `f2258ea8c` | `createGsdGatewayFactory` registers the 8 memory.* tools when a `memoryService` is supplied (default-off); new `skill-creator gateway` CLI starts the HTTP gateway with a FileStore-backed `MemoryService` (memory on by default, `--no-memory` to disable). Also fixed `collectAllRecords()` empty-query enumeration so `memory.stats` is honest for FileStore, and classified the 8 memory tools in the auth scope map (read/write). Verified e2e: store→recall round-trip over HTTP + default-off + honest stats + scope enforcement |
| PG-1, PG-3 | `7116dd361` | pgvector LOD-400 tier wired into `MemoryService` behind `pgConnectionString` (mirrors the Chroma gate); `store()` awaits+catches the LOD-400 write; `--pg` opt-in on the gateway. PG-3: `init()` splits graceful connect-failure from loud schema-failure + version-checked migration applier. Renamed the schema `artemis`→`gsd_memory` (the `maple` creds can't write `artemis`). Review-found fixes: schema-correct HNSW index (a schema-blind guard silently skipped it — verified live), pool `'error'` listener (was a gateway-crash footgun), `connectionTimeoutMillis`/`application_name`, memoized `init()`. PG_TEST suite 8/8 against the live DB (store/get, FTS, cosine search, relations, graph, visibility, migration idempotency), cleans up its own rows |
| RET-1, RET-4 | `1c43ee7f5` | `ScoreStage` decides the route before pruning and, on the embedding route, RECALLS over the full enabled set (union with lexical candidates) instead of only re-ranking lexical hits — paraphrases that match no trigger now surface. RET-4: cosine-dominant (0.7/0.3) dense+lexical fusion, normalized by applied weight-mass so a semantic-only hit reports true cosine (keeps the CorrectionStage 0.7 gate calibrated). Non-semantic paths unchanged; default-off. Tests: recall of a non-trigger paraphrase, fusion reorder, cosine-comparability |
| RET-5 | `fd7d7092f` | `CorrectionStage` is now scale-aware. It gated on `topScore >= 0.7` (a cosine value) but on the TF-IDF fast path got raw `tf*idf` sums (unbounded; a strong single-word match scores ~0.05-0.3), so correction fired on good matches and silently re-embedded them — defeating the router. `PipelineContext.scoringScale` ('tfidf'\|'cosine') is set by `ScoreStage` per branch; `assessConfidence()` uses the raw top on the cosine/undefined path (byte-identical back-compat) and the top's share of total positive relevance mass on the tfidf path (scale-invariant [0,1], dominant top-1 skips). When correction fires on the tfidf route, `previousBestScore` is re-anchored on a cosine baseline so the loop stops mixing scales. Default-off. Tests: dominant-skip, ambiguous-fire, cosine-unchanged, back-compat; the re-anchor test is mutation-proven. Adversarial-review workflow: 0 fix-now findings |

**All 14 Tier-1 items are done** (INT-1, AC-1, LEARN-3, ORCH-1/2/3/N1, CC-2, CLI-1/2/3, B2, B9, QUAL-1a) plus seven Tier-2/§4.1 items (PG-2, PG-4, B10, **MEM-1**, **PG-1/PG-3**, **RET-1/RET-4**, **RET-5**).

**Memory/RAG/Postgres decision — SETTLED as "wire, not quarantine"** (the operator's explicit ask was to *use* the capability), and the §4.1 sequenced chain is now COMPLETE: **MEM-1** (`f2258ea8c`) lit up the eight `memory.*` tools via the new `skill-creator gateway`; **PG-1/PG-3** (`7116dd361`) turned on the pgvector LOD-400 tier (working live via `--pg`); **RET-1/RET-4** (`1c43ee7f5`) gave skill retrieval real dense recall + lexical/dense fusion. Each is independently shippable and default-OFF.

**Deferred (tracked here, not started):** the QUAL-1b settings-reader cascade (50-file mechanical migration — do test-first per §5, watch override-caller semantics), INT-2 (installer consolidation), ORCH-4 (atomic WorkState write), B3 (install detector), LEARN-1/2, and the rest of the Tier-2/Tier-3 backlog below. Memory/RAG tail beyond §4.1 (all default-off, none a live defect): **RET-8** (route retrieval through the pre-built `EmbeddingIndex` to stop per-query re-embedding — the perf story). PG lower tail: **PG-5** (populate conversation embeddings), **PG-6** (pool bounds — `connectionTimeoutMillis`/`application_name` now done, `max`/`statement_timeout` remain), **PG-7** (broader PgStore coverage — the PG_TEST suite now exists). Earlier MEM-1 follow-ups still open: `--port=` empty-value arg hygiene; wire a real `ConversationStore` for `memory.search_conversations`; the `MemoryServiceConfig.indexPath` naming ambiguity. Nothing in the deferred set is a live defect that harms users today.

---

## 1. Executive summary

**Overall health: good.** No CRITICAL defects survived verification. Across ~387K non-test LOC the classic quality axes are clean (23 TODO/FIXME, 8 ts-suppressions, chokepoint audits green with KNOWN_UNWIRED=0). The dominant theme is not bugs but **drift and dormancy**: shipped-but-unwired subsystems, command vocabulary that lags the current GSD install, and two parallel installers. Exactly **one** finding is a genuine untrusted-input security hole (AC-1); one is a host-breaking teardown bug (INT-1). Everything else degrades safely.

**Dimension A (code / CLI / orchestration / learning / integration / quality) — healthy with structural drift.**
- CLI is broad and structurally clean (92 registry entries, collision + callability tests) but has discoverability/consistency gaps: `pic2html` is built+tested but unreachable, `activations`/`cadence` are undocumented, and there is no registry↔help parity test to stop the drift.
- Orchestrator is a clean artifact-derived control surface, but its intent/lifecycle/gates modules hardcode **removed** granular phase commands (`gsd:add-phase`/`insert-phase`/`remove-phase`/`research-phase`) and never reference the shipped unified `gsd:phase`. Consequences with runtime teeth: NL classifier can't route phase-CRUD; destructive-confirmation gate for phase removal is silently ungated in YOLO. Its own tests pin the dead names, so CI is green on dead vocabulary.
- Learning surface: individual modules are well-tested but several safety/value-critical components have **zero production callers** (dedup/merge inert; generated artifacts + changesets never persisted; non-interactive approval waves through CRITICAL STRANGER hygiene findings because `report.passed` is dead).
- Integration: install/uninstall forked into two implementations sharing one manifest, each incomplete in complementary ways. `install.cjs --uninstall` orphans `.claude/settings.json`, leaving hooks pointing at deleted scripts (host-breaking).
- Quality: a purpose-built shared settings reader has **zero adopters** while 19+ files re-implement it inline; a 66-file `src/dogfood/` subsystem is untested and unwired. Root cause: no dead-export detector in the toolchain.

**Dimension B (gsd-core alignment) — works today, unauditable drift.** The vendored GSD slice (`.claude/get-shit-done/` VERSION 1.0.0) is a pre-rename fork far behind `@opengsd/gsd-core 1.7.0-rc.3`, with three coexisting version schemes and no provenance record. Bootstrap/version-check strings reference the dead package name; the install detector is hardcoded to a legacy `VERSION` path a modern plugin install may not create; config validator enums reject valid modern config. Nothing crashes — it's alignment/maintainability debt on an optional co-management integration.

**Dimension C (Claude Code best-practices) — trails the July-2026 surface.** Whole core still ships by copying into `.claude/` even though plugins+marketplaces are GA and `project-claude/` already maps 1:1 onto a plugin layout. One live telemetry bug: `SubagentSpawn` is not a real event (should be `SubagentStart`), so subagent telemetry silently never fires. The "over-1024 description" claim was **refuted** (see DROP list).

**Dimension D (memory / RAG / postgres) — strong parts built, wired to nothing.** The Grove content-addressed substrate is genuinely wired and healthy. Everything else is dormant surfaced-capability: `MemoryService` + all LOD-tier stores + 8 memory MCP tools are never instantiated; the pgvector/LOD-400 PgStore is complete but dead (and wouldn't reach the DB as-is — ignores `RH_POSTGRES_URL`); the semantic retrieval path can only re-rank lexical candidates, never recall; a proven in-repo hybrid re-ranker sits unused. Nothing is broken for users because none of it is reachable — it's a capability gap, not a correctness crisis.

### Highest-leverage moves (do these first)
1. **INT-1 — Fix `install.cjs --uninstall` to clean `settings.json`** (HIGH, S). The documented teardown path leaves the host project emitting `Cannot find module` on SessionStart/Bash/Write until hand-edited. Port the existing `gsd-init.ts` cleanup block.
2. **AC-1 — Contain cartridge-loader `src:` references** (HIGH, M). Only verified untrusted-input hole: a community cartridge reads arbitrary local files via `src: ../` / absolute paths, *before* the trust gate runs. Thread a cartridge-root `LoaderContext` + `assertSafePath` with an explicit cross-tree allowlist opt-in.
3. **Batch the orchestrator vocabulary fix + drift guard** (ORCH-1/2/3 + ORCH-N1, all S). Repoint to the shipped `gsd:phase` (using the token discovery actually emits), gate the destructive phase-removal sub-action, and add a set-membership CI test so vocabulary rot goes red instead of silent. Restores NL phase routing and closes a YOLO gate bypass.
4. **LEARN-3 — Make non-interactive approval severity-aware** (medium, S, security). Autonomous arxiv ingest currently auto-approves CRITICAL STRANGER findings; wire `report.passed`/severity into the auto-approve prompt fns.
5. **CC-2 — Rename `SubagentSpawn` → `SubagentStart`** (medium, S) + add a hook-event-name allowlist lint so bogus event keys fail CI.
6. **CLI hygiene batch** (CLI-1/2/3, S). Add the registry↔help parity test (root cause), document `activations`/`cadence`, and decide `pic2html` (wire or delete).
7. **QUAL-1 — Adopt the shared settings reader** across the 19+ (really 53+) inline re-implementers via a test-first batch-rewrite cascade, one flag-family per commit.
8. **Decide-and-record the memory/RAG capability** (MEM-1 + PG-1 + RET-1). Either wire `MemoryService` into the gateway behind a flag with a `skill-creator gateway` CLI entry (the config already has the slot) and unlock pgvector + hybrid recall, or quarantine and drop from the public barrel so status is honest. This is the single biggest capability opportunity — see §4.

---

## 2. DROP list (refuted — do not re-litigate)

| ID | Title | Why dropped |
|----|-------|-------------|
| **CC-3** | Skill validator hard-rejects descriptions >1024 chars | **REFUTED.** The 1-1024 bound is the canonical Anthropic Agent Skills / Claude Code frontmatter limit and is treated as authoritative throughout this repo (skill-frontmatter-doctor enforces it). The finding's premise — "upstream no longer caps at 1024; real behavior is a 1536-char combined truncation" — is unverified and contradicted by the codebase's own convention. `when_to_use` is not a separate CC frontmatter field. Throwing on >1024 is intentional proactive-before-silent-truncation design. Do **not** raise the cap to 1536. (A separate, real `when_to_use` feature request lives as CC-4, Tier 3.) |
| **LEARN-5** | skill-promotion ROI gate has no production callsite | **REFUTED.** Factual error (cited callsite is `computeROI`, not `shouldInstall`) plus the module is a **deliberate, documented, allowlisted park** (Ship-3.2 shelfware, `adoption-scan.allowlist.json:163`, `SHELFWARE-VERDICTS.md:75`, pinned by `learning-substrate-parked.test.ts` asserting `reachableFromProduction:false` by design, retire-or-resume review dated 2027-06-05). Wiring it contradicts the settled D3 decision. Only residue: a one-line docstring-accuracy nit (Tier 3, optional). |
| **LEARN-4** | Two-Gate guardrail has zero production callers | **Not dropped, downgraded (PLAUSIBLE → low).** Dead-code fact is real but it's an intentional default-off substrate; the practical 20% / 3-correction / 7-day caps ARE enforced by live modules (`branches/fork.ts`, `dead-zone/`, `dacp/retrospective/`). Do **not** wire `evaluateTwoGate` into the accept path (wrong inputs, wrong bound). Legitimate residue = documentation only. Kept at Tier 3 as a doc task. |

---

## 3. Prioritized backlog

Severity = adversarially-corrected severity. Effort: S ≤ ~1 file / <1h · M = a few files / half-day · L = subsystem / multi-day · XL = architectural.
Items marked *(unverified)* come from the lower-priority tail (not adversarially verified) and are placed by claimed severity.

### Tier 1 — do now (safe, high-value, well-scoped)

| ID | Dim | Title | Sev | Eff | Cat | Action | Files | Verify |
|----|-----|-------|-----|-----|-----|--------|-------|--------|
| INT-1 | integration | uninstall orphans settings.json | high | S | bug | Port `gsd-init.ts:876-964` settings-cleanup into `install.cjs` uninstall (filter our command-groups out of `settings.hooks`, drop emptied events) | `project-claude/install.cjs:945-1031` | Scratch repo: install then `--uninstall`; assert settings.json no longer references session-state/validate-commit/phase-boundary-check.cjs |
| AC-1 | artifact-code | cartridge `src:` arbitrary file read | high | M | security | After resolving `filePath`, `assertSafePath(filePath, baseDir)` with explicit allowlist opt-in for legit cross-tree refs; thread a cartridge-root `LoaderContext` via `loadCartridge(path,{ctx})` at all CLI callers | `src/cartridge/loader.ts:253-256,343`; `src/cli/commands/cartridge.ts`; `scaffold-companions.ts:39` | Test: `loadCartridge` on `src: ../x.yaml` or `/etc/hostname` throws instead of reading. Preserve LD-08 sibling-ref behavior via the allowlist |
| LEARN-3 | learning | non-interactive approval waves through CRITICAL | medium | S | security | Make auto-approve `promptFns` severity-aware: reject when any critical finding present; gate on `report.passed` with explicit `--force-critical` override | `sc-learn.ts:467-473`; `tools/ingest-batch.mts:49`; `ingest-aggregate.mts:79`; `ingest-one.mts:57-59`; `hitl-gate.ts:35-93` | STRANGER fixture with `<script>`/injection + `--yes` → rejects after fix |
| ORCH-1 | orchestration | lifecycle vocab omits `gsd:phase` | medium | S | alignment | Replace granular phase commands with the token discovery actually emits (`gsd-phase` / add name-normalization); drop non-shipped universals | `src/orchestrator/intent/lifecycle-filter.ts:52-107` | `filterByLifecycle(allDiscovered,'executing')` includes the phase command; classify "add a new phase" surfaces it |
| ORCH-2 | orchestration | destructive gate bypassed for phase removal | medium | S | security | Gate on the phase-removal sub-action; min: add the live phase command name to `DEFAULT_DESTRUCTIVE_COMMANDS` (use the colon/hyphen form the classifier emits) | `src/orchestrator/gates/types.ts:65-68` | Unit: `evaluateGate('gsd:phase','yolo',0.9).action==='confirm'` for remove intent |
| ORCH-3 | orchestration | transition-rules suggest non-existent commands | low | S | bug | Repoint `PHASE_MUTATION_COMMANDS` to phase add/insert sub-actions; replace `gsd:research-phase` with `gsd:plan-phase --research-phase` / drop; update tests | `src/orchestrator/lifecycle/transition-rules.ts:70-73,165,178` | `deriveNextActions` emits no non-shipped command |
| ORCH-N1 | orchestration | command-vocab drift guard test | medium | S | new-function | Test asserting every command in STAGE/UNIVERSAL/DESTRUCTIVE/CONFIRMATION sets + transition suggestions ⊆ discovered GSD command set | new test over lifecycle-filter/gates/transition-rules | Fails today on the 10 stale names; passes after ORCH-1/2/3 |
| CC-2 | bestpractices | hook on non-existent `SubagentSpawn` event | medium | S | bug | Rename block to `SubagentStart` in source; drop installed duplicate; add hook-event-name allowlist lint | `project-claude/settings.json:103`; `hook-event-coverage.test.ts` | `SubagentSpawn` gone from `project-claude/`; spawning a subagent produces a tool-tracker trace line |
| CLI-3 | cli | no registry↔help parity test (root cause) | medium | S | tech-debt | Test extracting primary aliases from REGISTRY, asserting each appears in `printHelp()` (word-boundary match); allowlist meta-entries | `src/cli/dispatch.test.ts`; `src/cli/help.ts` | Fails today on `cadence`; passes after CLI-2 |
| CLI-2 | cli | `activations`/`cadence` undocumented | low | S | gap | Add two `Commands:` lines to help | `src/cli/help.ts` | `help \| grep -E 'activations\|cadence'` prints both |
| CLI-1 | cli | `pic2html` built+tested but unreachable | low | S | gap | Decide: register (REGISTRY + help line) or delete `pic2html.ts` + test. Note: banner name `gsd-skill-creator pic2html` is wrong regardless (that bin is the installer) | `src/cli/dispatch.ts`; `src/cli/commands/pic2html.ts` | `pic2html --help` renders, or `Unknown command` exit 1 after removal |
| B2 | alignment | bootstrap strings reference dead package name | medium | S | bug | Swap to `npx @opengsd/gsd-core@latest` / `npm list @opengsd/gsd-core` + bin probe; keep old name as back-compat secondary; reconcile README.md:7 | `install.cjs:1052`; `examples/skills/workflow/ecosystem-alignment/SKILL.md:23,30` | grep for `get-shit-done-cc`/`npm list get-shit-done` in project-claude+examples returns nothing |
| B9 | alignment | gsd-workflow routing table teaches dead commands *(unverified)* | medium | S | bug | Regenerate routing table from installed command stems: research→explore/plan-phase; add/insert/remove-phase→phase; add-todo→capture | `project-claude/skills/gsd-workflow/references/command-routing.md:20,21,43,44,45` | No dead command names remain |
| QUAL-1a | quality | add read-settings test (pins migration target) | medium | S | tech-debt | Unit test for `read-settings.ts` before any migration (first step of QUAL-1) | `src/settings/read-settings.ts` | New test green |

### Tier 2 — do soon (medium impact)

| ID | Dim | Title | Sev | Eff | Cat | Action | Files | Verify |
|----|-----|-------|-----|-----|-----|--------|-------|--------|
| QUAL-1b | quality | 19+ inline settings readers | medium | M | tech-debt | Migrate call sites to shared helpers via batch-rewrite cascade, one flag-family per commit | `src/ace/settings.ts`, `drift/task-drift-monitor.ts`, `lyapunov/settings.ts`, `orchestration/settings.ts`, +49 | `grep 'no settings file found' src \| grep -v read-settings` = 0; ≥19 importers; vitest green |
| INT-2 | integration | two divergent installers | medium | M | tech-debt | Collapse to one manifest-driven engine (port autoDiscover+cartridge install into gsd-init, or delegate); parity test install→uninstall per entry point | `install.cjs` vs `src/cli/commands/gsd-init.ts` | Both installers → identical tree; uninstall → empty delta |
| ORCH-4 | orchestration | WorkState writer non-atomic/unlocked | medium | M | tech-debt | Route `save()` through temp-write+rename (existing idiom in `scan-state-store.ts:155`); add lockfile/mtime CAS in QueueManager | `work-state-writer.ts:21-31`; `queue-manager.ts:43-80` | Two parallel queue-adds both survive; interrupted write leaves valid YAML |
| LEARN-1 | learning | dedup/merge inert in sc:learn | medium | M | gap | Load persisted registry into `existingPrimitives` when caller supplies none; warm aggregate accumulator; else print "dedup disabled" notice | `sc-learn.ts:84,231-254`; `scan-arxiv/bridge.ts:261` | Run learn twice on same source → 2nd reports `primitivesSkipped>0` |
| LEARN-2 | learning | generated artifacts/changeset never persisted | medium | M | gap | Apply changeset + write artifacts in non-dry-run, or reword summary to "changeset staged"; ingestQueue must forward `result.changeset` | `sc-learn.ts:264-358`; `bridge.ts:268-276` | After non-dry-run learn, new SKILL.md written OR summary honest |
| B1 | alignment | vendored GSD pre-rename fork, no provenance | medium | M | alignment | Re-vendor against a known `@opengsd/gsd-core` tag + PROVENANCE file (source SHA); or stop vendoring bodies, depend on host install; CI drift check | `.claude/get-shit-done/VERSION` | VERSION shows real upstream version; PROVENANCE names source tag/SHA |
| B3 | alignment | GSD-install detector hardcoded to legacy VERSION | medium | M | bug | Broaden to first-hit probe list: legacy VERSION → `.claude-plugin/` → `.gsd-capabilities.json`/`.gsd-profile` → bin on PATH; record matched layout | `src/orchestrator/discovery/discovery-service.ts:44,55,161,174` | Fixture with only `.gsd-capabilities.json` detects rather than null |
| B10 | alignment | config validator enums reject modern config *(unverified)* | medium | S | bug | Add `granularity`/`effort`; extend `model_profile` to 5-value set; drop/alias `depth` | `src/orchestrator/state/config-validator.ts:112-122` | Modern config validates |
| MEM-1 | memory-arch | MemoryService + LOD stack + 8 MCP tools unreachable | medium | M | gap | Decide-and-record: wire `memoryService` field + FileStore default into gateway factory + `skill-creator gateway` CLI; OR quarantine + drop from public barrel | `src/memory/service.ts`; `mcp/gateway/create-gateway-server.ts`; `cli/commands/mcp-server.ts` | `memory.store`→`memory.recall` round-trips end-to-end, or barrel no longer exports dormant stack |
| RET-1 | retrieval | semantic path only re-ranks, never recalls | medium | M | gap | Move router decision ahead of empty-matches earlyExit; union full-set embedding scan with trigger candidates when embedding route selected | `src/application/stages/score-stage.ts:42-80`; `skill-index.ts:309-347` | Paraphrase test returns skill when `retrievalConfig.enabled` |
| AC-2 | artifact-code | scaffolder/schema allow write-side traversal *(unverified)* | medium | M | security | Add name/key pattern to cartridge Zod schema (or `validateSafeName` per key); `assertSafePath` inside `writeIfAbsent` | `scaffold-companions.ts:104`; `cartridge/types.ts:53,146` | Cartridge with `../` agent name is rejected / write contained |
| AC-3 | artifact-code | learn-time generators emit invalid artifacts *(unverified)* | medium | M | gap | Run generator output through `validateSkillInput`/`validateAgentFrontmatter` before recording; build real "Use when..." clause + tools string; emit `<name>.md` | `skill-generator.ts:90`; `agent-generator.ts:80,263` | Generated artifacts pass repo validators |
| INT-3 | integration | uninstall leaves ~30 hooks/skills on disk *(unverified)* | medium | M | bug | Derive uninstall set from manifest + install-time ledger of written paths; strip extension markers | `install.cjs:949-971` | Uninstall removes exactly what install wrote |
| INT-4 | integration | session-observation hooks unregistered + invalid docs *(unverified)* | medium | S | alignment | Wire session-start/end hooks via manifest with correct SessionStart/SessionEnd schema + fix INSTALL.md; or delete if superseded by observe.mjs | `INSTALL.md:224-231`; `src/hooks/session-start.ts`, `session-end.ts` | Documented path matches a real, firing hook |
| MEM-4 | memory-arch | access-count accrual inconsistent (promotion no-op) *(unverified)* | medium | S | bug | Centralize access accounting in `MemoryService.query()` | `file-store.ts:345-360`; `ram-cache.ts:232-233`; `service.ts:341,763` | LOD promotion increments uniformly (only matters if MEM-1 wired) |
| RET-2 | retrieval | embedding cache serves heuristic as model vectors *(unverified)* | medium | S | bug | Fold producing method into cache identity (`-heuristic` modelVersion suffix or method field) | `embedding-service.ts:203-256`; `embedding-cache.ts:135-174` | Fallback entry not served as model vector across runs |
| RET-5 | retrieval | CorrectionStage compares TF-IDF vs cosine threshold *(unverified)* | medium | M | bug | Normalize ScoreStage output to common scale, or make CorrectionStage scale-aware | `corrective-rag.ts:63-116`; `relevance-scorer.ts:45-64` | Correction loop no longer silently overrides router |
| RET-3 | retrieval | heuristic fallback is hashed BoW not TF-IDF *(unverified)* | medium | M | gap | Seed heuristic corpus from skill index at initialize(); or drop corpus branch + fix doc + surface `isUsingFallback()` | `heuristic-fallback.ts:60-81`; `embedding-service.ts:68` | Fallback IDF-weighted or honestly labeled (fix RET-6 first) |
| RET-4 | retrieval | no hybrid/fusion re-ranker despite in-repo one *(unverified)* | medium | M | improvement | Add fusion stage (RRF over TF-IDF + cosine) reusing `memory/hybrid-scorer.ts`; rank on fused score | `score-stage.ts:63-80`; `adaptive-router.ts` | Fused ranking beats either/or route (subsumes RET-5) |
| PG-2 | postgres-rag | PgStore ignores RH_POSTGRES_URL; connectionString dead *(unverified)* | medium | S | bug | Resolve creds via scribe `pg-runtime/env-loader.loadPgEnv()`; honor or delete `connectionString` | `pg-store.ts:248,252-262,281-288` | PgStore reaches real DB via canonical `.env` |
| PG-3 | postgres-rag | no migration versioning; errors swallowed *(unverified)* | medium | M | tech-debt | Move DDL to `migrations/memory/*.sql` with version-checked applier (or reuse scribe); read `schema_version`; hard-error on CREATE EXTENSION failure | `pg-store.ts:111-230,222-229,294-311` | Re-init is a no-op; extension failure surfaces |
| PG-4 | postgres-rag | IVFFlat on empty table, default probes *(unverified)* | medium | M | best-practice | Prefer HNSW (`vector_cosine_ops`); if IVFFlat, build lazily after seed threshold + set `ivfflat.probes` | `pg-store.ts:166-172,479-510` | ANN recall acceptable on populated table |
| MEM-2 | memory-arch | pg-store 816loc dormant; pg dep for dead code *(unverified)* | medium | M | tech-debt | If MEM-1 wired, uncomment LOD-400 branch w/ graceful degradation; else drop from barrel / relocate | `pg-store.ts`; `service.ts:163-164`; `package.json:116` | `new PgStore` non-empty OR barrel cleaned |
| MEM-3 | memory-arch | three unreconciled memory-type taxonomies *(unverified)* | medium | M | alignment | Pick canonical MemoryType (survey 9-type set); express others as documented mapping + cross-ref comments | `memory/types.ts:444`; `survey-scorer.ts:29`; `types/memory.ts` | One canonical type + alias map |
| MEM-5 | memory-arch | memory relations ephemeral, never persisted/queried *(unverified)* | medium | M | gap | Persist relations (FileStore sidecar or pg table); add relation-aware read path (expand top hits one hop) | `service.ts:124,432-450`; `types.ts:519` | Relations survive restart + expand queries |
| MEM-6 | memory-arch | ~4k loc dormant memory cluster *(unverified)* | medium | M | tech-debt | Triage: promote (embedding-index, M2 trio via MEM-1), quarantine legacy scorer/loader, header the rest; add reachability audit | multiple `src/memory/*` | Each module wired, quarantined, or headered |
| B4 | alignment | discovery reads VERSION but no compat gate *(unverified)* | medium | M | gap | Add `SUPPORTED_GSD_RANGE` semver; emit `version-mismatch` DiscoveryWarning when out of range | `discovery-service.ts` ~174 | Out-of-range version warns |
| B5 | alignment | discovery blind to capabilities/hooks/ns-* *(unverified)* | medium | M | gap | Add `discoverCapabilities()` reading `.gsd-capabilities.json` + `capabilities/*/capability.json` | `discovery-service.ts` | DiscoveryResult exposes capabilities |
| B8 | alignment | installed command set 4 behind upstream *(unverified)* | medium | M | gap | Re-sync re-vended commands vs upstream 71; restore `onboard`/`next` or document omissions | `.claude/commands/gsd/` | 71-command parity or documented delta |
| QUAL-3 | quality | CLI entrypoints under-tested *(unverified)* | medium | M | gap | Command-smoke harness: missing-arg → usage + non-zero; stubbed dep → exit code. Prioritize migrate/rollback/delete/team-spawn | `src/cli/commands/` | Destructive quartet has smoke tests |
| QUAL-4 | quality | no dead-export detector | medium | M | new-function | Add `knip` dev-dep + `npm run deadcode`, ignore-list research islands; non-blocking report first | `package.json` | `deadcode` script runs; baseline captured |
| CC-4 | bestpractices | `when_to_use` unsupported end-to-end *(unverified)* | medium | M | gap | Add `when_to_use` to SkillMetadata + schema; generators emit triggers there; document in both format docs | `types/skill.ts`; `skill-validation.ts`; generators; docs | Field round-trips through validate + generate |
| CC-5 | bestpractices | OFFICIAL/SKILL-FORMAT docs stale *(unverified)* | medium | M | best-practice | Bring both docs up to reference (missing fields, commands-merged note, hooks appendix, plugins section) | `docs/OFFICIAL-FORMAT.md`, `docs/SKILL-FORMAT.md` | Docs match `review-cc-features-reference.md` |
| LEARN-7 | learning | overlapping-distinct candidates silently dropped *(unverified)* | medium | M | bug | Drain `getPendingConflicts()` after merge loop; prompt or documented default via `resolveConflict`; record to changeset | `sc-learn.ts:236-262`; `merge-engine.ts:214-242` | Pending conflicts surfaced with IDs |

### Tier 3 — defer (large / architectural / needs operator decision)

| ID | Dim | Title | Sev | Eff | Cat | Action | Notes |
|----|-----|-------|-----|-----|-----|--------|-------|
| PG-1 | postgres-rag | pgvector/LOD-400 tier dead code | low | L | gap | Wire LOD-400 behind flag (mirror Chroma `chromaPath` gate) + PG_TEST integration test. **Depends on PG-2/3/4** | Enhancement, not a defect. Pairs with MEM-1 |
| RET-8 | retrieval | strong retrieval components unwired *(unverified)* | medium | L | new-function | Integrate one target/milestone starting with EmbeddingIndex behind `retrievalConfig.enabled`; then decide retrieve()/MD-1/temporal | Sequenced after RET-1/RET-4 |
| QUAL-2 | quality | `src/dogfood/` 66-file zero-test unwired | medium | L | tech-debt | Decide-and-record: surface via `dogfood verify\|refine` CLI + smoke tests, OR park under `experimental/` with Role header | Operator decision; no runtime harm today |
| B6 | alignment | file-copy vs capability-overlay extension | medium | XL | alignment | Prototype `role:feature` overlay (`skill-creator-learning`) OR document divergence + migration path in INTEGRATION.md | Slow-moving strategic item; safe defer-and-document fallback |
| CC-1 | bestpractices | no plugin/marketplace packaging path | medium | L | new-function | Add `.claude-plugin/plugin.json` + `marketplace.json`; keep install.cjs legacy; `export --plugin` via portability seam | Modernization; see §4 |
| INT-5 | integration | MCP gateway + agent-bridge no launcher *(unverified)* | medium | M | new-function | Add `mcp-gateway` CLI calling `startGateway`; or park with status note. **Pairs with MEM-1** | |
| INT-6 | integration | CASCADE MCP defense never invoked *(unverified)* | medium | M | security | Wire `runCascade` behind `cascadeMcpDefense` flag at MCP ingress; or note staged-for-later | Only matters once gateway launches |
| LEARN-6 | learning | observation→script promotion loop unwired *(unverified)* | medium | L | gap | Add `promote` CLI (detector→gatekeeper) or mark dormant w/ resume trigger | Decide-and-record |
| B7 | alignment | host-integration SDK not consumed *(unverified)* | medium | L | gap | Adopt host-integration handshake; pin PROTOCOL_VERSION; derive flags from negotiation | ADR-1239; forward-looking |
| B11/B12 | alignment | vendored gsd-tools fork + stale test fixtures *(unverified)* | low | M | tech-debt | Target host binary via B3 detection; add gsd-v1.7 fixture | Pairs with B3/B5 |
| LEARN-4 | learning | Two-Gate guardrail unwired (doc-only) | low | S | gap | Document advisory-only status in `bounded-learning/index.ts` + security-hygiene skill. Do **not** wire `evaluateTwoGate` into accept | Downgraded PLAUSIBLE→low; substrate by design |
| MEM-7/8 | memory-arch | dual conversation backends; dual gateway factories *(unverified)* | low | S/M | tech-debt | Collapse to one backing / one factory (fold `memoryService?` option) | Pairs with MEM-1 |
| INT-7/8/9 | integration | runtime-hal no consumer; dead settings-merge block; unused hook validators *(unverified)* | low | S | tech-debt | Reword skill claims / remove dead block / wire-or-delete validators | Hygiene |
| ORCH-5/6/7 | orchestration | dead snapshot retention; skippedByYolo mislabel; no-op confirmation tier *(unverified)* | low | S | tech-debt | Auto-trim in `store()`; set flag false; decide confirmation-tier intent | Low-blast hygiene |
| LEARN-8..11 | learning | co-occurring-tools bug; no file/workflow candidates; dedup AND-logic; id truncation collisions *(unverified)* | low | S/M | bug/gap | Per-item fixes | Batchable hygiene |
| AC-4..7 | artifact-code | team-validator gaps; agent desc bound; slugify empty; string-tools no-op *(unverified)* | low | S | bug/gap | Per-item fixes; mirror skill `.max(1024)` on agent desc | Batchable |
| CLI-4..10 | cli | unknown-subcmd exit 0; --help coverage; exit-code propagation; greedy --version; error 'undefined'; no completion; no doctor *(unverified)* | low | S/M | bug/improvement | Standardize router contract (0/1/2); global --help; `err instanceof Error`; first-token --version; `completion` + `doctor` commands | See §4 for completion/doctor |
| RET-6/7 | retrieval | heuristic corpus temp-doc leak; cross-project rescore *(unverified)* | low | S/M | bug/gap | Frozen corpus snapshot; preserve index scores | Fix RET-6 before RET-3 corpus mode |
| PG-5/6/7 | postgres-rag | conversation embedding unwired; unbounded pool; no PgStore test *(unverified)* | low | S/M | gap/best-practice/tech-debt | Route conversation through PgStore; pool bounds+timeouts; PG_TEST suite | Pairs with PG-1 |
| CC-6/7/8 | bestpractices | app feature_flags in CC settings; INTEGRATION.md .sh names; no argument-hint *(unverified)* | low | S/M | tech-debt/gap | Relocate flags to `.gsd/feature-flags.json`; fix hook names to .cjs; infer argument-hint | Hygiene |
| QUAL-5 | quality | fire-and-forget empty catches outside settings *(unverified)* | low | S | best-practice | Route through `swallow(err,context)` debug-observable helper | 3 sites |
| LEARN-5 | learning | ROI gate docstring overstates wiring | low | S | doc | Optional: soften `index.ts:10-12` docstring | REFUTED as a gap; doc nit only |

---

## 4. New-function / capability opportunities

### 4.1 Memory / RAG / Postgres — the biggest latent capability (MEM-1 + PG-1 + RET family)
The repo already contains a near-complete memory/RAG stack that is wired to nothing. Highest-value net-new capability, sequenced:

1. **Wire `MemoryService` into the gateway behind a flag** (MEM-1, M). `GatewayFactoryOptions` already has an (unpopulated) `memoryService?` slot and `tools/index.ts:82` already conditionally registers memory tools. Add a default FileStore-backed `MemoryService`, register the tools in `createGsdGatewayFactory`, and add a `skill-creator gateway` CLI command that calls `startGateway` (which currently has zero non-test callers). This lights up `memory.store/recall/query/relate/deprecate/stats` end-to-end.
2. **Unlock pgvector LOD-400** (PG-1 + PG-2/3/4, L). The 816-line `PgStore` is ~90% done. Fix credential resolution first (reuse the scribe `pg-runtime`/atlas-pg `.env`/`RH_POSTGRES_URL` pattern — it currently defaults to `foxy@localhost` empty-password and drops `connectionString`), then upgrade the index (**HNSW `vector_cosine_ops`** over IVFFlat-on-empty-table) and add real migration versioning. Gate on `RH_POSTGRES_URL` presence mirroring the existing Chroma `chromaPath` gate. Add a `PG_TEST=1` integration suite.
3. **Fix and enable dense retrieval recall** (RET-1 + RET-4, M). Today the semantic route can only re-rank lexical candidates. Move the router decision ahead of the empty-matches earlyExit, index enabled skills in the existing `EmbeddingIndex`, and add a **hybrid RRF fusion** re-ranker reusing the proven in-repo `memory/hybrid-scorer.ts` (96.6%→98.4% recall). Consider an **in-DB RRF hybrid** (pgvector cosine + tsvector FTS) once PG-1 lands — the schema already defines the FTS column, it's just never populated.

Approach sketch: one milestone per numbered step, each independently shippable and default-OFF so no regression risk. Step 1 is the honest-status unlock (or the quarantine decision if the operator prefers parking); steps 2-3 are opt-in performance capability.

### 4.2 gsd-core alignment control surface (B3/B4/B5)
Turn the discovery module from a legacy-VERSION-only probe into a **capability-aware, version-gated** control surface: first-hit install detection (VERSION → `.claude-plugin/` → `.gsd-capabilities.json` ledger → bin on PATH), a `SUPPORTED_GSD_RANGE` compatibility gate emitting `version-mismatch` warnings, and a `discoverCapabilities()` reader for the modern `capability.json` envelope. This future-proofs co-management against the plugin-based upstream without breaking today's install.

### 4.3 Claude Code packaging modernization (CC-1)
Add `.claude-plugin/plugin.json` + repo `.claude-plugin/marketplace.json` (two additive manifest files — non-breaking, keeps `install.cjs` for legacy), so the core installs via `/plugin marketplace add` on the GA plugin path that `project-claude/` already structurally matches. Extend the `src/portability` seam with `export --plugin` so authored cartridges emit installable plugins — closes the dogfooding-credibility gap.

### 4.4 CLI ergonomics (CLI-9, CLI-10)
Two cheap net-new commands over the existing REGISTRY: a **`completion bash|zsh|fish`** generator (`REGISTRY.flatMap(e=>e.aliases)`) and an aggregate **`doctor`/`health`** preflight that runs the existing validators and prints consolidated pass/fail with `--json` for CI. Both are additive and independently testable.

### 4.5 Toolchain guard (QUAL-4)
Add `knip` (dead files + unused exports + unused deps in one pass) as `npm run deadcode`, seeded with an ignore-list for the intentional research islands. This is the systemic root fix — it's the missing detector that let `read-settings.ts` (0 adopters) and `src/dogfood/` (66 files) rot silently. Ship as non-blocking report first, promote to a gate once baseline is clean.

---

## 5. Sequencing notes

**Batch A — orchestrator vocabulary (one PR).** ORCH-1 + ORCH-2 + ORCH-3 + ORCH-N1 are the same root cause (dead command vocabulary) and share files. Fix them together and let ORCH-N1 be the regression guard. **Critical caveat:** the classifier emits *hyphen* frontmatter names (`gsd-phase`) while the hardcoded sets use *colon* tokens (`gsd:phase`) and there is no normalization — apply the fix using the token discovery actually produces (or add name normalization), else routing still matches nothing. Gate on the phase-removal *sub-action* (ORCH-2) so the plan-phase override doesn't wrongly fire on remove/edit.

**Batch B — CLI hygiene (one PR).** CLI-3 (parity test) is the root cause of CLI-2; land the test + the two help lines together so the test is green on commit. CLI-1 (`pic2html`) is an independent decide-and-delete/wire.

**Batch C — settings-reader cascade (multi-commit, one PR).** QUAL-1a (add the test) MUST land before QUAL-1b (migrate call sites). Use the batch-rewrite-pattern workflow, one flag-family per commit; watch the override-caller semantics difference (shared helper always tries both paths). Keep flag-off default throughout — zero runtime risk.

**Independent Tier-1 singletons.** INT-1, AC-1, LEARN-3, CC-2, B2, B9 touch disjoint files and can land in parallel / any order. AC-1 must preserve the LD-08 sibling-reference test (use the allowlist opt-in, not a naive `assertSafePath`).

**Installer consolidation (INT-2) subsumes INT-1/INT-3.** If you do INT-2 (collapse to one manifest-driven engine) soon, do INT-1 first as the urgent host-breaking patch, then fold INT-3's ledger-based uninstall into the consolidation rather than patching both installers twice.

**Memory/RAG is a dependency chain, not parallel.** MEM-1 (wire or quarantine) gates MEM-2/4/5/7/8, INT-5/6, and PG-1. Within postgres: PG-2 (credentials) → PG-3 (migrations) → PG-4 (index) → PG-1 (wire + test). Within retrieval: RET-6 before RET-3; RET-1 before/with RET-4; RET-8 last. Make the MEM-1 decide-and-record call first — it determines whether the entire D-dimension tail is "wire it" or "quarantine and drop from barrel."

**Pre-tag-gate discipline.** All code changes must pass the full non-bypassable vitest leg. Note the known local flakes documented in MEMORY (`.claude-install` concurrency, pre-tag-gate vitest load-flake, Windows-EPERM rename) — confirm varying-subset + isolation-pass and re-run rather than investigate. ORCH-N1 and CLI-3 are new red-on-purpose tests: land them in the same commit as their fixes so CI is never knowingly red. Commit convention: conventional commits, no `Co-Authored-By: Claude` trailer (hard-blocked by pre-commit hook).

**No mission-package or `.planning/` commits** — gitignored + hook-enforced. This workplan lives in `docs/` and is committable.
