# Adoption Scan Report

Generated: 2026-07-13T08:44:29.316Z
Root: `.`

**Summary:** 154 modules — 108 living · 40 test-only · 6 isolated. **Reachability:** 98 reachable-from-production · 56 unreachable-from-production.

**What this measures (import-surface):** TypeScript-import-surface adoption. A module is "living" if ≥1 non-test TS file (in `src/`, `tools/`, `scripts/`, `src-tauri/`, or `desktop/`) imports it. Modules invoked only via npm-scripts or shell-spawn (e.g., `node tools/foo.mjs <module-arg>`) will show as test-only — their CLI binary may still be in use even when their TS API is dormant.

**What this measures (reachability, Ship 3.1):** `reachableFromProduction` is the stricter dimension — whether a file-level static-import walk from the declared production entry roots (`src/cli.ts`, `src/index.ts`, `src/hooks/session-{start,end}.ts`) reaches any non-test file of the module. A module imported only by dev/CI tooling (`tools/`, `scripts/`) or only inside an unreachable import cycle is `living` but **unreachable-from-production**. This dimension does NOT feed `--shelfware-threshold` (which stays import-surface).

## Isolated modules (no importers anywhere)

These modules have zero importers — neither real code nor tests reference them.

### Shelfware candidates (not allowlisted)

| Module | self files | self importers |
|--------|-----------:|---------------:|
| `hooks` | 3 | 0 |

### Allowlisted (intentionally isolated)

| Module | self files | reason |
|--------|-----------:|--------|
| `holomorphic` | 25 | v1.47 Holomorphic Dynamics Educational Pack — content cluster, not core substrate. PROJECT.md GAP-3 (PNW vs Global Scope) lists content-area work as intentional design. |
| `initialization` | 1 | 1 self-file — gsd-init bootstrap module invoked via shell CLI (`skill-creator gsd-init`), not TS import. Future ship may consolidate into a normal module path. |
| `interpreter` | 6 | 6 self-files / 9 self-importers — DACP interpreter consumed via shell CLI surface, not TS imports. The src/dacp/ module reads interpreter outputs through filesystem hand-off, not direct API. |
| `mathematical-foundations` | 6 | 6 self-files / 0 self-importers — namespace placeholder for the substrate-reference docs (semantic-channel.md, bounded-learning.md). The actual implementation modules (coherent-functors, ricci-curvature-audit, etc.) live as siblings and ARE adoption-tracked individually. |
| `styles` | 0 | 0 self-files — directory stub for shared style tokens. Imports happen via build pipeline, not TS imports. |

## Test-only modules (importers exist but only from tests)

These modules are exercised in tests but no real code path consumes them. They may be premature substrate or recently shipped (awaiting first real caller — Era D found a typical 6-ship gap).

| Module | self files | test importers |
|--------|-----------:|---------------:|
| `activation-steering` | 11 | 5 |
| `agc` | 69 | 33 |
| `alternative-discoverer` | 12 | 5 |
| `aminet` | 77 | 38 |
| `artifactnet-provenance` | 11 | 5 |
| `bounded-learning-empirical` | 11 | 5 |
| `brainstorm` | 52 | 13 |
| `catalog` | 8 | 3 |
| `cloud-ops` | 23 | 7 |
| `code-absorber` | 12 | 5 |
| `compression-spectrum` | 4 | 1 |
| `convergent` | 6 | 2 |
| `dead-zone` | 12 | 10 |
| `dependency-resolver` | 13 | 5 |
| `eligibility` | 10 | 8 |
| `fl-threat-model` | 10 | 4 |
| `hardware-infrastructure` | 14 | 2 |
| `heuristics-free-skill-space` | 3 | 2 |
| `knowledge` | 45 | 23 |
| `langevin` | 11 | 8 |
| `launcher` | 6 | 2 |
| `learnable-k_h` | 15 | 11 |
| `mcp-defense` | 5 | 1 |
| `mission-world-model` | 6 | 2 |
| `promptcluster-batcheffect` | 9 | 4 |
| `random` | 2 | 1 |
| `reasoning-graphs` | 4 | 1 |
| `rumor-delay-model` | 9 | 4 |
| `runtime-hal` | 2 | 1 |
| `sigreg` | 5 | 2 |
| `skill-creator` | 36 | 21 |
| `skilldex-auditor` | 10 | 4 |
| `spatial-awareness` | 25 | 12 |
| `stackelberg-pricing` | 10 | 4 |
| `temperature` | 11 | 8 |
| `token-budget` | 4 | 2 |
| `tonnetz` | 7 | 2 |
| `trust-tiers` | 5 | 1 |
| `utils` | 2 | 1 |
| `wasserstein-hebbian` | 7 | 2 |

## Living but unreachable from production (reachability-v2, Ship 3.1)

These modules are `living` by import-surface (≥1 non-test importer) but are NOT reachable by a file-level static-import walk from the declared production entry roots (`src/cli.ts`, `src/index.ts`, `src/hooks/session-{start,end}.ts`). They are imported only by code that is itself unreachable from a root (e.g. an intra-island cycle), or only by dev/CI tooling under `tools/` / `scripts/`. An **allowlisted** row is an accepted park/reference; a **non-allowlisted** row is a shelfware signal the import-surface dimension misses.

| Module | real callers | allowlisted | note |
|--------|-------------:|:-----------:|------|
| `audio-engineering` | 1 | yes | allowlisted (park/reference) |
| `bayes-ab` | 1 | yes | allowlisted (park/reference) |
| `cache` | 1 | yes | allowlisted (park/reference) |
| `components` | 1 | yes | allowlisted (park/reference) |
| `dependency-auditor` | 4 | yes | allowlisted (park/reference) |
| `engines` | 1 | yes | allowlisted (park/reference) |
| `health-diagnostician` | 1 | yes | allowlisted (park/reference) |
| `lyapunov` | 2 | yes | allowlisted (park/reference) |
| `projection` | 1 | yes | allowlisted (park/reference) |
| `skill-isotropy` | 1 | yes | allowlisted (park/reference) |
| `umwelt` | 1 | yes | allowlisted (park/reference) |

## Living modules (≥1 real caller)

| Module | self files | real callers | test callers | internal importers |
|--------|-----------:|-------------:|-------------:|--------------------|
| `activation` | 8 | 1 | 3 | — |
| `audio-engineering` | 15 | 1 | 2 | `hardware-infrastructure` |
| `bayes-ab` | 23 | 1 | 14 | `ab-harness` |
| `cache` | 8 | 1 | 5 | `orchestration` |
| `coherent-functors` | 11 | 1 | 4 | — |
| `college` | 6 | 1 | 3 | — |
| `components` | 2 | 1 | 1 | `security` |
| `console` | 29 | 1 | 16 | `dashboard` |
| `dogfood` | 70 | 1 | 3 | — |
| `drift` | 22 | 1 | 9 | — |
| `engines` | 16 | 1 | 10 | `integration` |
| `evaluator` | 9 | 1 | 4 | — |
| `experience-compression` | 13 | 1 | 6 | — |
| `flywheel` | 2 | 1 | 1 | — |
| `fs` | 13 | 1 | 0 | — |
| `health-diagnostician` | 14 | 1 | 9 | `alternative-discoverer` |
| `hourglass-persistence` | 8 | 1 | 2 | — |
| `keystore` | 2 | 1 | 1 | — |
| `koopman-memory` | 8 | 1 | 2 | — |
| `lod` | 4 | 1 | 5 | `memory` |
| `projection` | 12 | 1 | 11 | `langevin` |
| `representation-audit` | 12 | 1 | 8 | — |
| `retro` | 9 | 1 | 0 | — |
| `ricci-curvature-audit` | 8 | 1 | 2 | `hourglass-persistence` |
| `roles` | 9 | 1 | 4 | — |
| `semantic-channel` | 7 | 1 | 2 | — |
| `site` | 30 | 1 | 2 | `critique` |
| `skill-isotropy` | 6 | 1 | 2 | `sigreg` |
| `skill-workflows` | 15 | 1 | 8 | — |
| `staging` | 99 | 1 | 49 | `dashboard` |
| `symbiosis` | 20 | 1 | 13 | — |
| `umwelt` | 13 | 1 | 8 | `symbiosis` |
| `vtm` | 59 | 1 | 31 | — |
| `ab-harness` | 22 | 2 | 14 | `bayes-ab` |
| `bundles` | 19 | 2 | 9 | `cartridge` |
| `chipset` | 84 | 2 | 39 | `observation`, `types` |
| `coprocessor` | 15 | 2 | 8 | `application` |
| `dashboard` | 151 | 2 | 73 | `launcher` |
| `den` | 44 | 2 | 31 | `dacp`, `mcp` |
| `events` | 11 | 2 | 5 | `types` |
| `git` | 23 | 2 | 8 | `commands` |
| `learn` | 35 | 2 | 18 | `commands`, `scan-arxiv` |
| `lyapunov` | 9 | 2 | 10 | `learnable-k_h`, `projection` |
| `model-affinity` | 14 | 2 | 9 | `agents` |
| `portability` | 7 | 2 | 3 | `mcp` |
| `retrieval` | 8 | 2 | 5 | `application`, `workflows` |
| `scan-arxiv` | 29 | 2 | 14 | `commands`, `vtm` |
| `skill` | 14 | 2 | 7 | — |
| `stochastic` | 10 | 2 | 8 | `branches`, `orchestration` |
| `terminal` | 10 | 2 | 5 | `launcher` |
| `amiga` | 94 | 3 | 47 | `knowledge` |
| `anytime-valid` | 4 | 3 | 1 | `ab-harness`, `bounded-learning`, `orchestration` |
| `branches` | 19 | 3 | 12 | `ab-harness`, `cli-status.ts`, `symbiosis` |
| `calibration` | 12 | 3 | 6 | `index.ts`, `observation` |
| `cartridge` | 64 | 3 | 36 | `orchestration`, `traces` |
| `commands` | 10 | 3 | 5 | `scan-arxiv` |
| `composition` | 9 | 3 | 4 | `workflows` |
| `conflicts` | 7 | 3 | 4 | `index.ts`, `teams` |
| `critique` | 21 | 3 | 12 | `cartridge` |
| `eval` | 23 | 3 | 14 | `critique`, `mesh` |
| `graph` | 16 | 3 | 12 | `cli-status.ts`, `orchestration`, `umwelt` |
| `identifiers` | 8 | 3 | 3 | `agents`, `dashboard`, `detection` |
| `output-structure` | 11 | 3 | 9 | `model-affinity`, `tractability` |
| `plane` | 30 | 3 | 17 | `application` |
| `predictive-skill-loader` | 12 | 3 | 7 | `chipset`, `orchestration` |
| `simulation` | 10 | 3 | 4 | `index.ts`, `testing` |
| `telemetry` | 14 | 3 | 8 | `application`, `skill-promotion` |
| `workflows` | 6 | 3 | 1 | `index.ts` |
| `citations` | 78 | 4 | 19 | `commands`, `scan-arxiv`, `vtm` |
| `dacp` | 41 | 4 | 16 | `catalog`, `interpreter`, `semantic-channel` |
| `dependency-auditor` | 25 | 4 | 23 | `alternative-discoverer`, `code-absorber`, `dependency-resolver`, `health-diagnostician` |
| `detection` | 9 | 4 | 6 | `discovery` |
| `disclosure` | 12 | 4 | 6 | `detection`, `storage`, `workflows` |
| `discovery` | 47 | 4 | 23 | `detection`, `skill-promotion`, `validation` |
| `nlp` | 3 | 4 | 0 | `application`, `brainstorm`, `embeddings`, `orchestrator` |
| `reinforcement` | 9 | 4 | 6 | `branches`, `eligibility`, `symbiosis`, `umwelt` |
| `sensoria` | 10 | 4 | 9 | `application`, `orchestration`, `symbiosis` |
| `skill-promotion` | 8 | 4 | 3 | `ab-harness`, `cartridge`, `discovery`, `experience-compression` |
| `ace` | 12 | 5 | 9 | `dead-zone`, `learnable-k_h`, `lyapunov`, `orchestration`, `projection` |
| `agents` | 9 | 5 | 5 | `bundles`, `events`, `plane` |
| `mcp` | 109 | 5 | 47 | — |
| `mesh` | 70 | 5 | 38 | `branches`, `reinforcement`, `traces` |
| `orchestration` | 44 | 5 | 36 | `application`, `bayes-ab`, `branches`, `cartridge`, `stochastic` |
| `traces` | 18 | 5 | 22 | `branches`, `cartridge`, `orchestration`, `reinforcement` |
| `chips` | 17 | 6 | 14 | `eval`, `mcp`, `mesh` |
| `source-ledger` | 2 | 6 | 4 | `citations`, `commands`, `learn`, `scan-arxiv` |
| `bounded-learning` | 29 | 7 | 20 | `chipset`, `observation`, `orchestration`, `token-budget` |
| `capabilities` | 26 | 7 | 14 | `index.ts`, `orchestrator`, `staging` |
| `observation` | 40 | 7 | 22 | `dashboard`, `hooks`, `learning`, `orchestrator` |
| `orchestrator` | 90 | 7 | 39 | `capabilities`, `mcp`, `skill-workflows` |
| `scribe` | 59 | 7 | 24 | `memory` |
| `teams` | 17 | 7 | 9 | `index.ts` |
| `testing` | 14 | 7 | 6 | `chips`, `evaluator`, `index.ts`, `mesh` |
| `integration` | 61 | 8 | 45 | `dashboard`, `hooks`, `launcher`, `terminal` |
| `learning` | 19 | 8 | 12 | `index.ts` |
| `tractability` | 9 | 8 | 8 | `ab-harness`, `branches`, `langevin`, `orchestration`, `stochastic` (+2) |
| `application` | 23 | 10 | 17 | `coprocessor`, `index.ts`, `integration`, `retrieval`, `sensoria` (+3) |
| `safety` | 47 | 12 | 25 | `bundles`, `calibration`, `evaluator`, `events`, `learning` (+6) |
| `atlas` | 69 | 14 | 23 | `intelligence` |
| `cli` | 168 | 16 | 72 | `commands`, `scribe`, `skill` |
| `embeddings` | 21 | 18 | 23 | `application`, `conflicts`, `discovery`, `index.ts`, `orchestrator` (+5) |
| `memory` | 70 | 18 | 55 | `application`, `graph`, `intelligence`, `knowledge`, `mcp` (+5) |
| `intelligence` | 211 | 27 | 122 | — |
| `validation` | 39 | 31 | 33 | `agents`, `capabilities`, `cartridge`, `college`, `critique` (+13) |
| `settings` | 2 | 33 | 1 | `ace`, `activation-steering`, `artifactnet-provenance`, `bounded-learning-empirical`, `cartridge` (+28) |
| `storage` | 7 | 42 | 39 | `agents`, `application`, `capabilities`, `chips`, `composition` (+15) |
| `security` | 12 | 43 | 47 | `agc`, `alternative-discoverer`, `amiga`, `aminet`, `atlas` (+32) |
| `types` | 32 | 88 | 160 | `ace`, `activation`, `agents`, `amiga`, `application` (+52) |
