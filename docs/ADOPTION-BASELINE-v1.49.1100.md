# Adoption Scan Report

Generated: 2026-06-23T00:49:22.414Z
Root: `.`

**Summary:** 151 modules — 98 living · 45 test-only · 8 isolated. **Reachability:** 87 reachable-from-production · 64 unreachable-from-production.

**What this measures (import-surface):** TypeScript-import-surface adoption. A module is "living" if ≥1 non-test TS file (in `src/`, `tools/`, `scripts/`, `src-tauri/`, or `desktop/`) imports it. Modules invoked only via npm-scripts or shell-spawn (e.g., `node tools/foo.mjs <module-arg>`) will show as test-only — their CLI binary may still be in use even when their TS API is dormant.

**What this measures (reachability, Ship 3.1):** `reachableFromProduction` is the stricter dimension — whether a file-level static-import walk from the declared production entry roots (`src/cli.ts`, `src/index.ts`, `src/hooks/session-{start,end}.ts`) reaches any non-test file of the module. A module imported only by dev/CI tooling (`tools/`, `scripts/`) or only inside an unreachable import cycle is `living` but **unreachable-from-production**. This dimension does NOT feed `--shelfware-threshold` (which stays import-surface).

## Isolated modules (no importers anywhere)

These modules have zero importers — neither real code nor tests reference them.

### Allowlisted (intentionally isolated)

| Module | self files | reason |
|--------|-----------:|--------|
| `dogfood` | 66 | Test fixture / dogfood corpus. The module's purpose is to host self-test inputs; external imports are not expected. 66 self-files + 132 self-importers. |
| `holomorphic` | 25 | v1.47 Holomorphic Dynamics Educational Pack — content cluster, not core substrate. PROJECT.md GAP-3 (PNW vs Global Scope) lists content-area work as intentional design. |
| `initialization` | 1 | 1 self-file — gsd-init bootstrap module invoked via shell CLI (`skill-creator gsd-init`), not TS import. Future ship may consolidate into a normal module path. |
| `interpreter` | 6 | 6 self-files / 9 self-importers — DACP interpreter consumed via shell CLI surface, not TS imports. The src/dacp/ module reads interpreter outputs through filesystem hand-off, not direct API. |
| `mathematical-foundations` | 6 | 6 self-files / 0 self-importers — namespace placeholder for the substrate-reference docs (semantic-channel.md, bounded-learning.md). The actual implementation modules (coherent-functors, ricci-curvature-audit, etc.) live as siblings and ARE adoption-tracked individually. |
| `retro` | 7 | 7 self-files / 11 self-importers — retrospective tooling consumed via shell CLI (tools/session-retro/observe.mjs). TS API surface is internal-only by design. |
| `settings` | 1 | 1 self-file — settings reader is consumed via dynamic require() / JSON load patterns that the static-import scanner doesn't detect. |
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
| `citations` | 68 | 15 |
| `cloud-ops` | 23 | 7 |
| `code-absorber` | 12 | 5 |
| `compression-spectrum` | 4 | 1 |
| `convergent` | 6 | 2 |
| `dead-zone` | 12 | 10 |
| `dependency-resolver` | 13 | 5 |
| `eligibility` | 10 | 8 |
| `experience-compression` | 11 | 5 |
| `fl-threat-model` | 10 | 4 |
| `hardware-infrastructure` | 14 | 2 |
| `heuristics-free-skill-space` | 3 | 2 |
| `hooks` | 7 | 2 |
| `knowledge` | 43 | 22 |
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
| `scribe` | 59 | 22 |
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
| `vtm` | 57 | 29 |
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
| `skill-promotion` | 1 | yes | allowlisted (park/reference) |
| `umwelt` | 1 | yes | allowlisted (park/reference) |

## Living modules (≥1 real caller)

| Module | self files | real callers | test callers | internal importers |
|--------|-----------:|-------------:|-------------:|--------------------|
| `activation` | 8 | 1 | 3 | — |
| `audio-engineering` | 15 | 1 | 2 | `hardware-infrastructure` |
| `bayes-ab` | 23 | 1 | 14 | `ab-harness` |
| `cache` | 8 | 1 | 5 | `orchestration` |
| `coherent-functors` | 11 | 1 | 4 | — |
| `components` | 2 | 1 | 1 | `security` |
| `console` | 29 | 1 | 16 | `dashboard` |
| `discovery` | 45 | 1 | 21 | — |
| `drift` | 22 | 1 | 9 | — |
| `engines` | 16 | 1 | 10 | `integration` |
| `evaluator` | 9 | 1 | 4 | — |
| `fs` | 13 | 1 | 0 | — |
| `health-diagnostician` | 14 | 1 | 9 | `alternative-discoverer` |
| `hourglass-persistence` | 8 | 1 | 2 | — |
| `keystore` | 2 | 1 | 1 | — |
| `koopman-memory` | 8 | 1 | 2 | — |
| `lod` | 4 | 1 | 3 | `memory` |
| `projection` | 12 | 1 | 11 | `langevin` |
| `representation-audit` | 12 | 1 | 8 | — |
| `ricci-curvature-audit` | 8 | 1 | 2 | `hourglass-persistence` |
| `roles` | 9 | 1 | 4 | — |
| `scan-arxiv` | 29 | 1 | 13 | `commands` |
| `semantic-channel` | 7 | 1 | 2 | — |
| `site` | 30 | 1 | 2 | `critique` |
| `skill` | 8 | 1 | 4 | — |
| `skill-isotropy` | 6 | 1 | 2 | `sigreg` |
| `skill-promotion` | 6 | 1 | 2 | `ab-harness` |
| `skill-workflows` | 15 | 1 | 8 | — |
| `staging` | 99 | 1 | 49 | `dashboard` |
| `symbiosis` | 20 | 1 | 13 | — |
| `telemetry` | 14 | 1 | 7 | `application` |
| `umwelt` | 13 | 1 | 8 | `symbiosis` |
| `ab-harness` | 22 | 2 | 14 | `bayes-ab` |
| `bundles` | 19 | 2 | 9 | `cartridge` |
| `chipset` | 83 | 2 | 39 | `observation`, `types` |
| `coprocessor` | 15 | 2 | 8 | `application` |
| `critique` | 21 | 2 | 12 | — |
| `dashboard` | 151 | 2 | 73 | `launcher` |
| `den` | 44 | 2 | 31 | `dacp`, `mcp` |
| `events` | 11 | 2 | 5 | `types` |
| `git` | 23 | 2 | 8 | `commands` |
| `learn` | 35 | 2 | 18 | `commands`, `scan-arxiv` |
| `lyapunov` | 9 | 2 | 10 | `learnable-k_h`, `projection` |
| `model-affinity` | 14 | 2 | 9 | `agents` |
| `portability` | 7 | 2 | 3 | `mcp` |
| `retrieval` | 8 | 2 | 4 | `application`, `workflows` |
| `stochastic` | 10 | 2 | 8 | `branches`, `orchestration` |
| `terminal` | 10 | 2 | 5 | `launcher` |
| `amiga` | 94 | 3 | 47 | `knowledge` |
| `anytime-valid` | 4 | 3 | 1 | `ab-harness`, `bounded-learning`, `orchestration` |
| `branches` | 19 | 3 | 12 | `ab-harness`, `cli-status.ts`, `symbiosis` |
| `calibration` | 12 | 3 | 6 | `index.ts`, `observation` |
| `cartridge` | 61 | 3 | 34 | `orchestration`, `traces` |
| `commands` | 10 | 3 | 5 | `scan-arxiv` |
| `composition` | 9 | 3 | 4 | `workflows` |
| `conflicts` | 7 | 3 | 4 | `index.ts`, `teams` |
| `eval` | 23 | 3 | 14 | `critique`, `mesh` |
| `graph` | 16 | 3 | 12 | `cli-status.ts`, `orchestration`, `umwelt` |
| `identifiers` | 8 | 3 | 3 | `agents`, `dashboard`, `detection` |
| `mcp` | 106 | 3 | 44 | — |
| `output-structure` | 11 | 3 | 9 | `model-affinity`, `tractability` |
| `plane` | 30 | 3 | 17 | `application` |
| `predictive-skill-loader` | 12 | 3 | 7 | `chipset`, `orchestration` |
| `simulation` | 10 | 3 | 4 | `index.ts`, `testing` |
| `workflows` | 4 | 3 | 0 | `index.ts` |
| `dacp` | 41 | 4 | 16 | `catalog`, `interpreter`, `semantic-channel` |
| `dependency-auditor` | 25 | 4 | 23 | `alternative-discoverer`, `code-absorber`, `dependency-resolver`, `health-diagnostician` |
| `detection` | 9 | 4 | 6 | `discovery` |
| `disclosure` | 12 | 4 | 6 | `detection`, `storage`, `workflows` |
| `nlp` | 3 | 4 | 0 | `application`, `brainstorm`, `embeddings`, `orchestrator` |
| `reinforcement` | 9 | 4 | 6 | `branches`, `eligibility`, `symbiosis`, `umwelt` |
| `sensoria` | 10 | 4 | 9 | `application`, `orchestration`, `symbiosis` |
| `traces` | 18 | 4 | 21 | `branches`, `cartridge`, `orchestration`, `reinforcement` |
| `ace` | 12 | 5 | 9 | `dead-zone`, `learnable-k_h`, `lyapunov`, `orchestration`, `projection` |
| `agents` | 9 | 5 | 5 | `bundles`, `events`, `plane` |
| `mesh` | 70 | 5 | 38 | `branches`, `reinforcement`, `traces` |
| `orchestration` | 44 | 5 | 36 | `application`, `bayes-ab`, `branches`, `cartridge`, `stochastic` |
| `chips` | 17 | 6 | 14 | `eval`, `mcp`, `mesh` |
| `learning` | 13 | 6 | 6 | `index.ts` |
| `memory` | 63 | 6 | 42 | `graph`, `mcp`, `mesh`, `orchestration` |
| `observation` | 38 | 6 | 21 | `dashboard`, `hooks`, `orchestrator` |
| `bounded-learning` | 27 | 7 | 19 | `chipset`, `observation`, `orchestration`, `token-budget` |
| `capabilities` | 26 | 7 | 14 | `index.ts`, `orchestrator`, `staging` |
| `orchestrator` | 90 | 7 | 39 | `capabilities`, `mcp`, `skill-workflows` |
| `teams` | 17 | 7 | 9 | `index.ts` |
| `testing` | 14 | 7 | 6 | `chips`, `evaluator`, `index.ts`, `mesh` |
| `integration` | 61 | 8 | 45 | `dashboard`, `hooks`, `launcher`, `terminal` |
| `tractability` | 9 | 8 | 8 | `ab-harness`, `branches`, `langevin`, `orchestration`, `stochastic` (+2) |
| `application` | 21 | 10 | 15 | `coprocessor`, `index.ts`, `integration`, `retrieval`, `sensoria` (+3) |
| `safety` | 47 | 11 | 25 | `bundles`, `calibration`, `evaluator`, `events`, `learning` (+6) |
| `embeddings` | 21 | 12 | 20 | `application`, `conflicts`, `discovery`, `index.ts`, `orchestrator` (+5) |
| `atlas` | 69 | 13 | 23 | `intelligence` |
| `cli` | 142 | 16 | 56 | `commands`, `scribe`, `skill` |
| `intelligence` | 207 | 26 | 121 | — |
| `validation` | 37 | 26 | 32 | `agents`, `capabilities`, `critique`, `dashboard`, `detection` (+10) |
| `storage` | 7 | 40 | 36 | `agents`, `application`, `capabilities`, `chips`, `composition` (+14) |
| `security` | 12 | 41 | 46 | `agc`, `alternative-discoverer`, `amiga`, `aminet`, `atlas` (+32) |
| `types` | 32 | 84 | 154 | `ace`, `activation`, `agents`, `amiga`, `application` (+51) |
