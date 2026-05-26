# Adoption Scan Report

Generated: 2026-05-26T15:08:46.319Z
Root: `.`

**Summary:** 153 modules — 91 living · 52 test-only · 10 isolated.

**What this measures:** TypeScript-import-surface adoption. A module is "living" if ≥1 non-test TS file (in `src/`, `tools/`, `scripts/`, `src-tauri/`, or `desktop/`) imports it. Modules invoked only via npm-scripts or shell-spawn (e.g., `node tools/foo.mjs <module-arg>`) will show as test-only — their CLI binary may still be in use even when their TS API is dormant.

## Isolated modules (no importers anywhere)

These modules have zero importers — neither real code nor tests reference them. Strongest shelfware candidates.

| Module | self files | self importers |
|--------|-----------:|---------------:|
| `dogfood` | 66 | 132 |
| `holomorphic` | 25 | 69 |
| `initialization` | 1 | 0 |
| `interpreter` | 6 | 9 |
| `mathematical-foundations` | 6 | 0 |
| `retro` | 7 | 11 |
| `settings` | 1 | 0 |
| `styles` | 0 | 0 |
| `upstream` | 14 | 29 |
| `upstream-intelligence` | 7 | 0 |

## Test-only modules (importers exist but only from tests)

These modules are exercised in tests but no real code path consumes them. They may be premature substrate or recently shipped (awaiting first real caller — Era D found a typical 6-ship gap).

| Module | self files | test importers |
|--------|-----------:|---------------:|
| `activation-steering` | 11 | 10 |
| `agc` | 69 | 33 |
| `alternative-discoverer` | 12 | 5 |
| `aminet` | 77 | 38 |
| `artifactnet-provenance` | 11 | 9 |
| `bounded-learning` | 5 | 1 |
| `bounded-learning-empirical` | 11 | 9 |
| `brainstorm` | 52 | 13 |
| `catalog` | 8 | 3 |
| `citations` | 68 | 15 |
| `cloud-ops` | 23 | 7 |
| `code-absorber` | 12 | 5 |
| `coherent-functors` | 11 | 5 |
| `compression-spectrum` | 4 | 1 |
| `convergent` | 6 | 2 |
| `dead-zone` | 12 | 11 |
| `dependency-resolver` | 13 | 5 |
| `eligibility` | 10 | 8 |
| `experience-compression` | 11 | 9 |
| `fl-threat-model` | 10 | 7 |
| `hardware-infrastructure` | 14 | 2 |
| `heuristics-free-skill-space` | 3 | 2 |
| `hooks` | 7 | 2 |
| `hourglass-persistence` | 8 | 2 |
| `intrinsic-telemetry` | 5 | 2 |
| `knowledge` | 43 | 22 |
| `koopman-memory` | 8 | 3 |
| `langevin` | 11 | 8 |
| `launcher` | 6 | 2 |
| `learnable-k_h` | 15 | 11 |
| `mcp-defense` | 5 | 1 |
| `mission-world-model` | 6 | 2 |
| `predictive-skill-loader` | 11 | 9 |
| `promptcluster-batcheffect` | 9 | 7 |
| `random` | 2 | 1 |
| `reasoning-graphs` | 4 | 1 |
| `rumor-delay-model` | 9 | 8 |
| `runtime-hal` | 2 | 1 |
| `scribe` | 59 | 22 |
| `semantic-channel` | 7 | 3 |
| `sigreg` | 5 | 2 |
| `skill-creator` | 36 | 21 |
| `skilldex-auditor` | 10 | 8 |
| `spatial-awareness` | 25 | 12 |
| `stackelberg-pricing` | 10 | 7 |
| `stochastic` | 10 | 7 |
| `temperature` | 11 | 8 |
| `tonnetz` | 7 | 2 |
| `trust-tiers` | 5 | 1 |
| `utils` | 2 | 1 |
| `vtm` | 57 | 29 |
| `wasserstein-hebbian` | 7 | 2 |

## Living modules (≥1 real caller)

| Module | self files | real callers | test callers | internal importers |
|--------|-----------:|-------------:|-------------:|--------------------|
| `activation` | 8 | 1 | 3 | — |
| `amiga` | 87 | 1 | 43 | `knowledge` |
| `audio-engineering` | 15 | 1 | 2 | `hardware-infrastructure` |
| `bayes-ab` | 23 | 1 | 14 | `ab-harness` |
| `cache` | 8 | 1 | 5 | `orchestration` |
| `commands` | 9 | 1 | 4 | `scan-arxiv` |
| `components` | 2 | 1 | 1 | `security` |
| `console` | 29 | 1 | 16 | `dashboard` |
| `discovery` | 45 | 1 | 21 | — |
| `drift` | 21 | 1 | 8 | — |
| `engines` | 16 | 1 | 10 | `integration` |
| `evaluator` | 9 | 1 | 4 | — |
| `fs` | 13 | 1 | 0 | — |
| `git` | 23 | 1 | 8 | `commands` |
| `health-diagnostician` | 14 | 1 | 9 | `alternative-discoverer` |
| `keystore` | 2 | 1 | 1 | — |
| `lod` | 4 | 1 | 3 | `memory` |
| `model-affinity` | 12 | 1 | 8 | — |
| `projection` | 12 | 1 | 11 | `langevin` |
| `representation-audit` | 12 | 1 | 8 | — |
| `ricci-curvature-audit` | 8 | 1 | 3 | `hourglass-persistence` |
| `roles` | 9 | 1 | 4 | — |
| `scan-arxiv` | 29 | 1 | 13 | `commands` |
| `site` | 30 | 1 | 2 | `critique` |
| `skill` | 8 | 1 | 4 | — |
| `skill-isotropy` | 6 | 1 | 3 | `sigreg` |
| `skill-promotion` | 6 | 1 | 2 | `ab-harness` |
| `skill-workflows` | 15 | 1 | 8 | — |
| `staging` | 99 | 1 | 49 | `dashboard` |
| `symbiosis` | 20 | 1 | 13 | — |
| `telemetry` | 14 | 1 | 7 | `application` |
| `umwelt` | 13 | 1 | 8 | `symbiosis` |
| `ab-harness` | 22 | 2 | 14 | `bayes-ab` |
| `anytime-valid` | 4 | 2 | 1 | `ab-harness`, `orchestration` |
| `bundles` | 19 | 2 | 9 | `cartridge` |
| `chipset` | 83 | 2 | 39 | `observation`, `types` |
| `coprocessor` | 11 | 2 | 4 | `application` |
| `critique` | 21 | 2 | 12 | — |
| `dashboard` | 151 | 2 | 73 | `launcher` |
| `den` | 44 | 2 | 31 | `dacp`, `mcp` |
| `events` | 11 | 2 | 5 | `types` |
| `learn` | 35 | 2 | 18 | `commands`, `scan-arxiv` |
| `lyapunov` | 9 | 2 | 11 | `learnable-k_h`, `projection` |
| `portability` | 7 | 2 | 3 | `mcp` |
| `retrieval` | 8 | 2 | 4 | `application`, `workflows` |
| `terminal` | 10 | 2 | 5 | `launcher` |
| `branches` | 15 | 3 | 9 | `ab-harness`, `cli-status.ts`, `symbiosis` |
| `calibration` | 12 | 3 | 6 | `index.ts`, `observation` |
| `cartridge` | 61 | 3 | 34 | `orchestration`, `traces` |
| `composition` | 9 | 3 | 4 | `workflows` |
| `conflicts` | 7 | 3 | 4 | `index.ts`, `teams` |
| `detection` | 9 | 3 | 4 | `discovery` |
| `eval` | 23 | 3 | 14 | `critique`, `mesh` |
| `graph` | 16 | 3 | 12 | `cli-status.ts`, `orchestration`, `umwelt` |
| `identifiers` | 8 | 3 | 3 | `agents`, `dashboard`, `detection` |
| `mcp` | 105 | 3 | 43 | — |
| `output-structure` | 11 | 3 | 9 | `model-affinity`, `tractability` |
| `plane` | 30 | 3 | 17 | `application` |
| `simulation` | 10 | 3 | 4 | `index.ts`, `testing` |
| `workflows` | 4 | 3 | 0 | `index.ts` |
| `dacp` | 41 | 4 | 16 | `catalog`, `interpreter`, `semantic-channel` |
| `dependency-auditor` | 25 | 4 | 23 | `alternative-discoverer`, `code-absorber`, `dependency-resolver`, `health-diagnostician` |
| `disclosure` | 12 | 4 | 6 | `detection`, `storage`, `workflows` |
| `nlp` | 3 | 4 | 0 | `application`, `brainstorm`, `embeddings`, `orchestrator` |
| `orchestration` | 43 | 4 | 34 | `application`, `bayes-ab`, `cartridge`, `stochastic` |
| `reinforcement` | 9 | 4 | 6 | `branches`, `eligibility`, `symbiosis`, `umwelt` |
| `sensoria` | 10 | 4 | 9 | `application`, `orchestration`, `symbiosis` |
| `traces` | 18 | 4 | 20 | `branches`, `cartridge`, `orchestration`, `reinforcement` |
| `ace` | 12 | 5 | 9 | `dead-zone`, `learnable-k_h`, `lyapunov`, `orchestration`, `projection` |
| `agents` | 8 | 5 | 4 | `bundles`, `events`, `plane` |
| `mesh` | 70 | 5 | 38 | `branches`, `reinforcement`, `traces` |
| `observation` | 36 | 5 | 20 | `dashboard`, `hooks`, `orchestrator` |
| `chips` | 17 | 6 | 14 | `eval`, `mcp`, `mesh` |
| `integration` | 60 | 6 | 43 | `dashboard`, `launcher`, `terminal` |
| `learning` | 13 | 6 | 6 | `index.ts` |
| `memory` | 62 | 6 | 41 | `graph`, `mcp`, `mesh`, `orchestration` |
| `tractability` | 9 | 6 | 8 | `ab-harness`, `langevin`, `stochastic`, `symbiosis`, `temperature` |
| `capabilities` | 26 | 7 | 14 | `index.ts`, `orchestrator`, `staging` |
| `orchestrator` | 90 | 7 | 39 | `capabilities`, `mcp`, `skill-workflows` |
| `teams` | 17 | 7 | 9 | `index.ts` |
| `testing` | 14 | 7 | 6 | `chips`, `evaluator`, `index.ts`, `mesh` |
| `security` | 4 | 8 | 1 | `agc`, `cartridge`, `cloud-ops`, `graph`, `interpreter` (+3) |
| `application` | 21 | 10 | 13 | `coprocessor`, `index.ts`, `integration`, `retrieval`, `sensoria` (+3) |
| `cli` | 117 | 10 | 43 | `commands`, `scribe`, `skill` |
| `safety` | 47 | 11 | 25 | `bundles`, `calibration`, `evaluator`, `events`, `learning` (+6) |
| `embeddings` | 21 | 12 | 20 | `application`, `conflicts`, `discovery`, `index.ts`, `orchestrator` (+5) |
| `atlas` | 69 | 13 | 23 | `intelligence` |
| `intelligence` | 206 | 26 | 120 | — |
| `validation` | 37 | 26 | 31 | `agents`, `capabilities`, `critique`, `dashboard`, `detection` (+10) |
| `storage` | 6 | 39 | 35 | `agents`, `application`, `capabilities`, `chips`, `composition` (+14) |
| `types` | 32 | 82 | 153 | `ace`, `activation`, `agents`, `application`, `branches` (+50) |
