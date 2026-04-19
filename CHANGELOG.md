# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Where the release history lives

gsd-skill-creator ships releases at a cadence that makes a traditional
per-entry changelog impractical: 592 milestones from v1.0 (2026-01-31)
through v1.49.549 (2026-04-14), many shipped multiple per day during
engine runs like the Seattle 360 / Sound of Puget Sound series.

The authoritative, one-line-per-release index is:

- **[`docs/RELEASE-HISTORY.md`](docs/RELEASE-HISTORY.md)** — every shipped
  version, newest first, with title, ship date, and links to the detailed
  release-notes directory.

Each release also has its own directory under
[`docs/release-notes/v<version>/`](docs/release-notes/) containing a
`README.md` with the full feature description, and for major milestones
a `RETROSPECTIVE.md` and/or `LESSONS-LEARNED.md`.

## [v1.49.561] — 2026-04-18

### Added

- **M1 Semantic Memory Graph** (`src/graph/`) — entity/edge schema over Grove content-addressed records; Leiden community detection (Traag et al. 2019) guaranteeing well-connected communities; hierarchical summaries at community level; seven query patterns (direct lookup, edge traversal, community membership, cross-community path, temporal slice, activation sequence, precedent similarity). NEW-LAYER over `grove-format.ts`.
- **M2 Hierarchical Hybrid Memory** (`src/memory/short-term.ts`, `long-term.ts`, `scorer.ts`, `reflection.ts`, `read-write-reflect.ts`) — three-tier αβγ-scored memory (RAM cache → ChromaDB at `localhost:8100` → PostgreSQL + pgvector); reflection pass compresses 1,000 short-term entries to ≤100 long-term without entity-recall loss. EXTEND posture on `chroma-store.ts`, `pg-store.ts`, `ram-cache.ts`, `service.ts`, `types.ts`.
- **M3 Decision-Trace Ledger** (`src/traces/`) — AMTP-compatible append-only trace schema; writer redacts `api_key`, `password`, `token`, `secret`, `private_key` values on write; precedent queries surface semantically similar past decisions. EXTEND of `src/mesh/event-log.ts` (new `logDecisionTrace` + `readDecisionTraces` methods) and `src/mesh/types.ts` (new `decision_trace` MeshEventType variant).
- **M4 Branch-Context Experimentation** (`src/branches/`) — copy-on-write skill variants with fork/explore/commit lifecycle; first-commit-wins conflict resolution with clear diagnostic for N-1 blocked branches; userspace-portable (macOS/Linux/Windows). EXTEND of `lifecycle-resolver.ts` (`BranchLifecycleResolver`) and `skill-diff.ts` (`byteChangeFraction`).
- **M5 Agentic Orchestration + Prefix Cache** (`src/orchestration/`, `src/cache/`) — multi-turn retrieval loop; radix-tree prefix cache; step-graph predictor for KVFlow-style anticipatory preloading (Pan et al. 2025); ≥60% cache hit rate on step-graph fixture; ≥10x first-token latency reduction on 1,000-session baseline. NEW-LAYER, strictly additive.
- **M6 Sensoria** (`src/sensoria/`) — Lanzara 2023 net-shift receptor substrate for skill activation; pure function `netShift.ts` implementing ΔR_H = [L]·R_T·(K_H−K_L)/((1+K_H·[L])·(1+K_L·[L])); tachyphylaxis (K_H decay under sustained activation); Weber's law log-linear response verified to R²≥0.95; silent-binder detection; `sensoria:` frontmatter block for per-skill parameters; `skill-creator sensoria <skill>` CLI. NEW-LAYER.
- **M7 Umwelt** (`src/umwelt/`) — Markov-blanket state partition (Internal/Sensory/Active/External) enforced at TypeScript type level and runtime; variational free-energy minimiser converging ≤50ms on 100-node model; 3σ surprise-triggered reflection; dark-room guard with configurable minimum-activity floor. NEW-LAYER.
- **M8 Symbiosis** (`src/symbiosis/`) — teaching ledger (five categories: correction, instruction, preference, boundary, positive-feedback); co-evolution ledger (four offering kinds: skill-parameter, new-skill, refinement, quintessence-alert); Quintessence five-axis report (Self-vs-Non-Self, Essential Tensions, Growth-and-Energy-Flow, Stability-vs-Novelty, Fateful Encounters); parasocial-guard language validator; `skill-creator teach|co-evolution|quintessence` CLI commands. NEW-LAYER.
- **Eight-module integration** (`src/integration/__tests__/living-sensoria/`) — end-to-end composition chain from M1 graph through M8 Quintessence; M6 net-shift reads M5 relevance; M7 generative model reads M1 communities + M3 traces; M8 Quintessence reads all seven.
- **546 new tests** across 45 new test files (M6: 58, M7: 45, M8: 113, M1: 47, M2: 54, M3: 91, M4: 61, M5: 45, integration: 32).
- **Shared TypeScript types** (`src/types/`) — M1–M8 schemas; re-exported from `src/types/index.ts`; no duplicates.
- **Theoretical foundation doc** (`docs/foundations/theoretical-audit.md`) — primary-source citations for net-shift, Markov blanket, Quintessence, Amiga Principle (Lanzara 2023, Friston 2010/2013, Kirchhoff et al. 2018, Foxglove 2026, Traag 2019).
- **Grove re-architecture inventory** (`docs/grove-rearch/inventory.md`) — EXTEND/NEW-LAYER/UNTOUCHED classification for all 104 files in `src/memory/` and `src/mesh/`; zero REWRITEs executed.
- **User-facing module docs**: `docs/sensoria.md`, `docs/umwelt.md`, `docs/symbiosis.md`, `docs/memory-stack.md`.

### Changed

- `src/application/skill-applicator.ts` — gained orchestration-flag accessor; behaviour is byte-identical when all new flags are off (flag-off path tested by SC-EXT-FLAG-OFF / IT-11).
- `src/mesh/event-log.ts` — gained `logDecisionTrace` and `readDecisionTraces` (backwards compatible EXTEND; existing 638 mesh tests all green; IMP-07 append-only invariant preserved).
- `src/mesh/types.ts` — `MeshEventTypeSchema` gained `'decision_trace'` variant (additive; all existing consumers unaffected).
- `src/memory/types.ts` — `MemoryResult` gained optional `scoreComponents?: { recency, relevance, importance }` field (additive; all callers that ignore the field continue to work).
- `src/mesh/session-activation-view.ts` — `ActivationEvent` gained optional `traceId?: string` field for M3 trace correlation (additive forward-compatible change).
- `src/memory/triple-store.ts` — EXTEND: new predicate vocabulary for M1 edge types (`skill activated-in session`, `decision preceded decision`).
- `docs/OFFICIAL-FORMAT.md` — added `sensoria:` frontmatter block schema subsection.
- `docs/EXTENSIONS.md` — added `gsd-skill-creator.sensoria`, `.umwelt`, `.symbiosis` namespace documentation.
- `README.md` — added v1.49.561 Living Sensoria section with module table and links.
- `CLAUDE.md` — added `src/sensoria/`, `src/umwelt/`, `src/symbiosis/`, `src/graph/`, `src/traces/`, `src/branches/`, `src/orchestration/`, `src/cache/` to Key File Locations.

### Deprecated

Nothing deprecated in this release.

### Removed

Nothing removed in this release.

### Fixed

Nothing fixed in this release (documentation and module additions only).

### Security

- **M3 writer secret redaction** — `src/traces/writer.ts` redacts any value whose key matches `api_key`, `password`, `token`, `secret`, or `private_key` before appending to the decision trace JSONL. Pattern-matched at write time; no existing trace entries are modified (append-only invariant preserved).
- **M8 parasocial-guard** — `src/symbiosis/language-guard.ts` rejects co-evolution offerings containing emotional framing, first-person-plural relational language, or anthropomorphic experience attribution. Tested by SC-PARASOC (100 offerings, 0 constraint violations).

### Migration

All eight new modules default to **off** via opt-in flags in `.claude/settings.json`:

```json
{
  "gsd-skill-creator": {
    "sensoria":      { "enabled": false },
    "umwelt":        { "enabled": false },
    "symbiosis":     { "enabled": false },
    "orchestration": { "enabled": false }
  }
}
```

v1.49.560 installs load unchanged — no changes to existing skill activation, memory, or mesh behaviour when all flags are off. Enabling any single flag activates only that module's code path; the remaining modules stay dormant. Enabling all four flags activates the full eight-module Living Sensoria stack.

No schema migrations, no package.json dependency additions, no changes to existing JSONL ledger formats.

---

## Highlights

A curated timeline of the most significant milestones across the v1.0 → v1.49.549 arc:

- **v1.0** (2026-01-31) — Core Skill Management. First shipped release.
- **v1.4** (2026-02-05) — Agent Teams. Multi-agent coordination primitives.
- **v1.23** (2026-02-19) — Project AMIGA. 24 phases, 74 plans; one of the
  largest pre-GSD-OS milestones.
- **v1.27** (2026-02-20) — GSD Foundational Knowledge Packs. 79 plans.
- **v1.30** (2026-02-22) — Vision-to-Mission Pipeline. The builder
  pipeline that still powers mission-pack creation today.
- **v1.33** (2026-02-23) — GSD OpenStack Cloud Platform (NASA SE Edition).
- **v1.35** (2026-02-26) — Mathematical Foundations Engine. 16 phases,
  50 plans. Underpins the Math Co-Processor.
- **v1.37** (2026-02-26) — Complex Plane Learning Framework.
- **v1.39** (2026-02-26) — GSD-OS Bootstrap & READY Prompt.
- **v1.44** (2026-02-26) — SC Learn PyDMD Dogfood. First end-to-end
  self-improving learning run.
- **v1.47** (2026-02-27) — Holomorphic Dynamics Educational Pack.
- **v1.48** (2026-02-27) — Physical Infrastructure Engineering Pack.
- **v1.49** (2026-02-27) — Deterministic Agent Communication Protocol
  (DACP). 11 phases, 24 plans. The v1.49 minor-line begins here and now
  dominates the release history.
- **v1.49.8 / v1.49.9** (2026-03-01) — Cooking With Claude + Learn Kung
  Fu. Heritage/practice-domain dogfood missions.
- **v1.49.12** (2026-03-02) — Heritage Skills Educational Pack. 12
  phases, 45 plans, 18 rooms, 55 badges, 36 red-team scenarios cleared.
- **v1.49.13 / v1.49.14** (2026-03-03) — Skill Usage Telemetry +
  Dependency Health Monitor & Progressive Internalization Engine.
- **v1.49.21** (2026-03-07) — Image to Mission Pipeline. 253 new tests,
  the creative-translation bridge for image-driven builds.
- **v1.49.39** (2026-03-25) — "Weird Al: Eat It". 37 Research Projects
  & Rosetta Stone framework crosses a threshold.
- **v1.49.40 → v1.49.192** (2026-03-25 → 2026-03-31) — Seattle 360
  engine first pass: roughly 58 degree-releases named after PNW bands
  and bird species, ~600K+ words of research, the Continuous Release
  Engine's proof of cadence.
- **v1.49.195** (2026-03-31) — Ecosystem Alignment, Helium Corridor,
  OOPS Analysis, OPEN Problems. Largest single-session release in
  project history (HEL + OOPS + OPEN mega-release, 126K+ words).
- **v1.49.200** (2026-04-01) — Degree 61: Y La Bamba + American Beaver.
  First Latina/bilingual artist and first mammal enter the engine on
  the same degree — taxonomic threshold for the SPS second pass.
- **v1.49.500** (2026-04-13) — last npx-published `skill-creator`
  checkpoint. Marks the beginning of the combined NASA/360 engine
  second pass.
- **v1.49.549** (2026-04-14) — **Artemis II: The Space Between the Moon
  and the Earth.** Omnibus mission release covering the full 13-day
  Artemis II arc (2026-04-01 → 2026-04-14): ~356 point releases
  (v1.49.193 → v1.49.549), the Seattle 360 / Sound of Puget Sound
  second pass through Degree 359, the Memory Arena Rust stack M1 → M13
  with IPC and Grove integration (710 Rust + 393 TS tests), the Grove
  content-addressed format with 299 resources imported, Phase B
  skill-author-discipline, 1.88M+ words of research corpus expansion,
  NASA missions v1.0 → v1.5, and — shipping the unified
  Cartridge/Chipset schema under the same release — cartridge-forge
  with seven CLI subcommands and 43 department migrations. Full suite
  23,645 passing, zero new runtime dependencies from the forge work,
  PR #32 merged artemis-ii → dev preserving all 670 commits.

For anything not in this list, consult
[`docs/RELEASE-HISTORY.md`](docs/RELEASE-HISTORY.md).
