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

## [v1.49.573] — 2026-04-24 — Upstream Intelligence Pack v1.44 (ArXiv eess Integration)

### Added

- 7 research modules covering 150 arXiv eess/cs papers (17–23 Apr 2026 submission window) — M1 Skill Learning, M2 Mathematical & Info-Theoretic Substrate, M3 Bioacoustics/Music/Audio + Cultural Sensitivity, M4 Federated Learning + Threat Model, M5 Edge Mesh, M6 Hardware Substrate, M7 Safety + Pedagogy. LaTeX outputs at `.planning/missions/arxiv-eess-integration-apr17-23/work/templates/` (18 `.tex` files; ~707 KB). Citation-key convention `eess26_<arxivID>`.
- 10 substrate-code modules across 3 tiers (default-off; opt-in via `.claude/gsd-skill-creator.json` `upstream-intelligence` block):
  - **T1 must-ship:** `src/skilldex-auditor/` (T1a, ZFC compliance auditor) · `src/bounded-learning-empirical/` (T1b, SkillLearnBench harness) · `src/activation-steering/` (T1c, Local Linearity DACP runtime steering) · `src/fl-threat-model/` (T1d, Lee et al. trio pre-rollout gate)
  - **T2 if-budget:** `src/experience-compression/` (T2a, cross-level adaptive compression) · `src/predictive-skill-loader/` (T2b, GNN link-formation cache pre-warmer) · `src/promptcluster-batcheffect/` (T2c, embedding-space drift detector) · `src/artifactnet-provenance/` (T2d, SONICS forensic-residual provenance)
  - **T3 may-defer (shipped):** `src/stackelberg-pricing/` (T3a, multi-tenant pricing reference) · `src/rumor-delay-model/` (T3b, SDDE signal-vs-hype separator)
- W9 cross-module integration suite at `src/upstream-intelligence/__tests__/` — 6 test files / 33 tests + 153-file SHA-256 hash-tree fixture (`preserved-modules-hashtree.json`, root digest `ace3a9008ed7850e33d05bc6d98fc57daa617d46a7e0341bd6c77acc54804d95`)
- 7 convergent-discovery projects enumerated in `synthesis-convergent-discovery.tex` (Skilldex, SkillX, Experience Compression, Vakhnovskyi BLE-LoRa, Stackelberg Drainability, ArtifactNet, Spatiotemporal Link Formation)
- 5 hub HTML pages on `www/tibsfox/com/Research/UPSTREAM/` (gitignored; reach production via `sync-research-to-live.sh`)
- 8 college concept `.ts` files seeded across `ai-computation` + `adaptive-systems` departments
- 11 cross-references.json edges + series.js entry under "AI & Computation" / "Safety & Verification" / "Audio Intelligence" Rosetta clusters
- `docs/substrate/upstream-intelligence/README.md` hub doc + 10 per-module guides at `docs/substrate/`

### Changed

- `.claude/gsd-skill-creator.json` — new top-level `upstream-intelligence` block with 10 sub-blocks (one per Half B module); all `enabled: false` by default
- `docs/CORE-CONCEPTS.md` — cross-link updates for T1c Activation Steering + T2b Predictive Skill Loader
- `docs/GROVE-FORMAT.md` — cross-link updates for T2c PromptCluster BatchEffect + T2d ArtifactNet Provenance

### Verified

- 16 CAPCOM gates G0–G15 all PASS / AUTHORIZED — including 4 hard-preservation gates (G10 Skilldex read-only · G11 DACP byte-identical · G12 orchestration byte-identical · G13 audit pipeline byte-identical) + 1 hard composition closure (G14) + 1 Safety Warden BLOCK (G7)
- 27,411 tests passing (+712 over baseline 26,699; 7.12× over the ≥100 floor; itemized +576 across 11 new test clusters: 4.11× over the ≥140 itemized floor)
- Zero v1.49.573 regressions
- Zero Fox Companies IP leakage in any of the 5 public hub pages or 10 module guides
- DACP / orchestration / audit pipelines byte-identical with all 10 flags off (verified by `composition-flag-off-byte-identical.test.ts` + 153-file hash-tree fixture + cross-milestone composition test with v1.49.570/571/572 + MB-1 Lyapunov + MB-5 dead-zone)
- `npx tsc --noEmit` exit 0 (clean)

### Known

- 2 pre-existing failures in `src/mathematical-foundations/__tests__/integration.test.ts` (v1.49.572 baseline live-config flag-state checks; NOT v1.49.573 regressions; deferred to v1.49.572 follow-up cleanup phase). Audit trail: `src/upstream-intelligence/__tests__/PRE-EXISTING.md`.

### Dedication

Dedicated to **Zhong et al.** (SkillLearnBench / `eess26_2604.20087`), **Saha & Hemanth** (Skilldex / `eess26_2604.16911`), **Vakhnovskyi** (BLE-LoRa / `eess26_2604.15532`), **Zhang et al.** (Experience Compression / `eess26_2604.15877`), **Lee et al.** (FL threat trio / `eess26_2604.19891` + `eess26_2604.19915` + `eess26_2604.20020`), **Skifstad / Yang / Chou** (Local Linearity / `eess26_2604.19018`).

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

### Refinement wave (phases 651–660, added 2026-04-18)

**Thesis:** Zhang et al. 2026 ("Prompt Optimization Is a Coin Flip") establishes that prompt-content edits on compound AI systems are statistically indistinguishable from a coin flip except when the target skill has exploitable output structure. The refinement wave lands this diagnostic as a first-class capability (ME-1 tractability classifier) and uses it as the gating variable that conditions everything downstream — closing the actor-critic loop (Barto, Sutton & Anderson 1983) that Thread A identified as the central missing wire in the original Living Sensoria architecture.

Through-line: **ME-5 declares** output structure → **ME-1 classifies** tractability → **MA-6 canonicalises** reinforcement channels → **MA-1 records** eligibility-decayed events → **MA-2 drives** the actor-critic loop (TD-error weighted by ME-1) → **ME-4 surfaces** tractability warnings in M8 teach.

**Added**
- **ME-5 output-structure frontmatter** (`src/output-structure/`) — `output_structure:` block declaring `json-schema` / `markdown-template` / `prose`; validator + `skill-creator output-structure` CLI + `--migrate-all [--apply]` migration. Default `prose` preserves backwards compat.
- **MA-6 canonical reinforcement taxonomy** (`src/types/reinforcement.ts`, `src/reinforcement/`) — `ReinforcementEvent` discriminated union over five channels (`explicit_correction`, `outcome_observed`, `branch_resolved`, `surprise_triggered`, `quintessence_updated`); emitters + writer; channel-source adapters auto-wire teaching / branches / umwelt / quintessence to the new stream at `.planning/traces/reinforcement.jsonl`.
- **ME-1 tractability classifier** (`src/tractability/`) — *keystone*. Classifies every skill as `{tractable, coin-flip, unknown}` + confidence score from ME-5 frontmatter (pure function). `skill-creator tractability <skill>` + `--audit` CLI; read API for MA-2 + ME-4.
- **MA-1 eligibility-trace layer** (`src/eligibility/`) — TD(λ)-style exponential decay over MA-6 events with per-channel τ (explicit_correction 7d, outcome_observed 1h, branch_resolved 24h, surprise_triggered 10min, quintessence_updated 3d); replay over the canonical log produces deterministic snapshots; matches brute-force TD(λ) reference to ≤1e-14 (inside the 10⁻⁶ LS-28 gate).
- **MA-2 ACE actor-critic wire** (`src/ace/`) — closes the loop: M7 expected-F-reduction ΔF becomes the ACE secondary reinforcement driving M5's ActivationSelector via `δ = weight · (r̄ + γ · ΔF_curr − ΔF_prev)` where `r̄` is `|eligibility|`-weighted reinforcement across the 5 channels and `weight` scales with ME-1 tractability confidence (floor 0.3). Flag-off (`gsd-skill-creator.orchestration.ace.enabled: false`) byte-identical to pre-refinement, enforced by SC-REF-FLAG-OFF.
- **ME-4 coin-flip teach warning** (`src/symbiosis/expected-effect.ts`, `teach-warning.ts`) — teach CLI surfaces Zhang-2026-grounded warning for coin-flip/unknown skills; adds `expected_effect: {low, medium, high}` field to `TeachEntry`; warning copy validated at module load via parasocial-guard. `--no-warning` / `--force` flags for scripted use.
- **Refinement integration tests** (`src/integration/__tests__/refinement/`) — fixture + through-line + cross-component + the load-bearing flag-off byte-identical test. 51 tests total.
- **Refinement regression addendum** (`docs/release-notes/v1.49.561/regression-report-refinement.md`).
- **User-facing refinement docs**: `docs/refinement-wave.md`, `docs/tractability.md`, `docs/reinforcement-taxonomy.md`, `docs/actor-critic.md`.
- **669 new tests** across 28 new test files (ME-5: 87, MA-6: 45, ME-1: 102, MA-1: 70, MA-2: 40, ME-4: 136, R3 integration: 51, plus incremental coverage in existing suites).

**Changed**
- `src/orchestration/selector.ts` — optional `aceSignal?` parameter on `select()`; flag-gated branch applies `δ · propensity` to composite score; short-circuits before any mutation when the flag is off (byte-identical invariant).
- `src/mesh/types.ts` — `MeshEventTypeSchema` gained `reinforcement_event` variant.
- `src/mesh/event-log.ts` — new `reinforcement_event` read/write helpers (EXTEND; 638 mesh tests remain green).
- `src/types/symbiosis.ts` — `TeachEntry` gained optional `expected_effect: 'low' | 'medium' | 'high'`.
- `src/symbiosis/teaching.ts` — writer now accepts `rawOutputStructure` + `expectedEffect` options; infers `expected_effect` via ME-1 on every append.
- `src/symbiosis/cli.ts` — `teach` subcommand displays warning block before confirming; `--no-warning` + `--force` flags.
- Channel-source wiring: `src/symbiosis/teaching.ts`, `src/branches/commit.ts`, `src/branches/abort.ts`, `src/umwelt/prediction.ts`, `src/symbiosis/quintessence.ts` emit canonical reinforcement events as fire-and-forget side effects (auto-suppressed under test env).

**Security**
- MA-6 writer reuses M3's redaction (same key patterns: `api_key`, `password`, `token`, `secret`, `private_key`).
- ME-4 warning templates validated against the existing parasocial-guard at module load; no first-person-plural / emotional / relational / personification / metaphysical registers reach the CLI.

**Migration**

All refinement modules default **off**. Opt-in sequence:

```bash
# 1. Declare output structure on skills (adds output_structure: frontmatter)
SKILL_CREATOR_OUTPUT_STRUCTURE=true \
  skill-creator output-structure --migrate-all --apply

# 2. Enable tractability classification (reads ME-5 frontmatter)
export SKILL_CREATOR_TRACTABILITY=true

# 3. Enable reinforcement event emission (or leave auto-suppressed in dev)
export REINFORCEMENT_EMIT=true

# 4. Enable the actor-critic loop (wires everything together)
# in .claude/settings.json:
#   "gsd-skill-creator.orchestration.ace.enabled": true
```

With every flag off, v1.49.561 refinement-wave installs behave byte-identically to pre-refinement v1.49.561 (phase 650) — enforced by the SC-REF-FLAG-OFF integration test running three independent captures of the selector on a 50-session synthetic fixture.

### Continuation wave (phases 661–678, added 2026-04-19)

**Thesis:** The continuation wave lands the 13 second-wave proposals from the Living Sensoria research mission: three adaptive-control stability rails (Sastry & Bodson 1989 / Narendra & Annaswamy 1989 lineage), three exploration-harness components (Welling & Teh 2011 SGLD), three representation-frontier components (Mikolov et al. 2013 word2vec), two authoring-tool components (ME-2 model affinity, ME-3 A/B harness), plus the College + Rosetta bootstrap closing GAP-2 from the v1.49.132 AAR audit. All thirteen components default off; the full-stack flag-off invariant (SC-CONT-FLAG-OFF) enforces byte-identical behaviour to phase 660 tip with every continuation flag unset.

**Through-line:** tractability gate + stability rails make adaptation safe; exploration harness makes it productive; representation frontier makes it learnable; authoring tools make it operable; college + rosetta make it teachable.

**Added**

- **MB-1 Lyapunov-stable K_H adaptation** (`src/lyapunov/`) — certifies V̇ ≤ 0 before each K_H update via Lyapunov candidate V(e) = ½e²; tractability-scaled gain table (1.0 / 0.6 / 0.3); `desensitisation-bridge.ts` wires certified values to M6 net-shift. Flag: `gsd-skill-creator.lyapunov.enabled`. 54 tests.
- **MB-2 Smooth projection operators** (`src/projection/`) — constrains every adapted parameter to a closed admissible manifold via C¹ penalty-barrier blending; `projectKH` adapter scales bounds by tractability class; `projectModelRow` covers M7 simplex rows. Flag: `gsd-skill-creator.projection.enabled`. 80 tests.
- **MB-5 Dead-zone bounded learning** (`src/dead-zone/`) — suppresses adaptation updates when |Δ K_H| ≤ σ_noise; composes with MB-1 such that V̇ is trivially zero under suppression; `lyapunov-composer.ts` verifies joint descent across 100-step trajectories. Flag: `gsd-skill-creator.lyapunov.dead_zone.enabled`. 95 tests.
- **MA-3+MD-2 Stochastic selection** (`src/stochastic/`) — replaces M5 argmax with temperature-weighted softmax sample; `applyStochasticBridge` short-circuits to input ref when flag off (SC-MA3-01). Flag: `gsd-skill-creator.stochastic.enabled`. 68 tests.
- **MD-3 Langevin noise injection** (`src/langevin/`) — adds SGLD-style gradient noise (Welling & Teh 2011) to M7 generative-model parameters; `guardDarkRoom` clamps post-noise values above SC-DARK floor; composes with MB-2 projection. Flag: `gsd-skill-creator.langevin.enabled`. 64 tests.
- **MD-4 Temperature schedule** (`src/temperature/`) — cosine-decay annealing schedule driven by M8 Quintessence signal; `computeTractTempering` applies tractability-weighted floor/ceiling; `SENTINEL_TEMPERATURE = 1.0` when flag off (SC-MD4-01). Flag: `gsd-skill-creator.temperature.enabled`. 91 tests.
- **MD-1 Shallow learned embeddings** (`src/embeddings/`) — native skip-gram trainer with negative sampling (Mikolov et al. 2013 lineage); `trainer.ts` includes rmsDrift early-stop; `persist.ts` format-versioned serialisation; pre-existing HF infra untouched. Flag: `gsd-skill-creator.embeddings.enabled`. 80 tests.
- **MD-5 Per-(skill, task-type) learnable K_H** (`src/learnable-k_h/`) — linear head over MD-1 embedding row; `train()` chains gradient → MB-1 Lyapunov gate → MB-2 projection before committing weight; `getOrCreate` defaults to frontmatter K_H on first access. Flag: `gsd-skill-creator.learnable_k_h.enabled`. 56 tests.
- **MD-6 Representation audit** (`src/representation-audit/`) — effective-rank (participation ratio of singular-value spectrum) + community separability (silhouette score over M1 community structure); `detectCollapse` returns `AuditStatus ∈ {healthy, degraded, critical}`; CLI: `skill-creator representation-audit`. Flag: `gsd-skill-creator.representation_audit.enabled`. 80 tests.
- **ME-2 Per-skill model affinity** (`src/model-affinity/`) — `model_affinity:` frontmatter block declaring preferred tier + escalation policy; `EscalationRateLimiter` gates suggestions to one per 24 h; `batchAffinityDecisions` for library-wide audit sweeps; `getAffinityDecision` returns null when flag off (SC-ME2-01). Flag: `gsd-skill-creator.model_affinity.enabled`. 103 tests.
- **ME-3 Skill A/B harness** (`src/ab-harness/`) — `requiredSampleSize` from two-sided binomial power table (ABSOLUTE_MIN_SAMPLES = 10); `runAB` opens M4 fork, accumulates `ABRunOutcome` per session, fires `runSignificanceTest` at threshold; returns `DISABLED` sentinel when flag off (SC-ME3-01). Flag: `gsd-skill-creator.ab_harness.enabled`. 100 tests.
- **TC College bootstrap** (`.college/departments/adaptive-systems/`, `.college/rosetta/`) — adaptive-systems department + 5 cross-references appended to existing departments; closes GAP-2 from v1.49.132 AAR. Markdown only.
- **TC Rosetta translations** (`.college/rosetta/`) — cross-domain translation table mapping adaptive-control ↔ reinforcement-learning ↔ neuroscience terminology. Markdown only.
- **Continuation integration tests** (`src/integration/__tests__/continuation/`) — bundle through-line tests + 13 cross-bundle tests; SC-CONT-FLAG-OFF load-bearing test verifies byte-identical selector output across three independent fixture captures. 95 tests.
- **Continuation regression addendum** (`docs/release-notes/v1.49.561/regression-report-continuation.md`) — phase 675 R11.1 addendum documenting +828 net-new tests and SC-CONT-FLAG-OFF result.
- **Continuation user-facing docs** (phase 676) — `docs/stability-rails.md`, `docs/exploration-harness.md`, `docs/representation-frontier.md`, `docs/authoring-tools.md`; see-also cross-links throughout.

**828 new tests** across the continuation wave (phases 661–674).

**Changed**

- `docs/refinement-wave.md` — appended "Continuation Wave Additions (phases 661–678)" section with five bundle summaries.
- `README.md` — added continuation-wave paragraph under the v1.49.561 section.
- `CLAUDE.md` — added 11 `src/` Key File Location entries for continuation-wave modules.

**Security**

- MD-3 Langevin noise preserves SC-DARK floor via `guardDarkRoom` clamp: no M7 generative-model parameter can fall below the `minimum-activity` floor regardless of noise scale or temperature.
- MA-6 emitter redaction (`api_key`, `password`, `token`, `secret`, `private_key` patterns) and M3 append-only invariant are unchanged across the entire continuation wave; no continuation component modifies the reinforcement or decision-trace writers.

**Migration**

All continuation flags default off. Enabling any single flag activates only that component's code path; all other continuation components stay dormant. SC-CONT-FLAG-OFF enforces byte-identical behaviour to the phase 660 tip with every continuation flag off. Full opt-in flag list:

```json
{
  "gsd-skill-creator": {
    "lyapunov":             { "enabled": false, "dead_zone": { "enabled": false } },
    "projection":           { "enabled": false },
    "stochastic":           { "enabled": false },
    "langevin":             { "enabled": false },
    "temperature":          { "enabled": false },
    "embeddings":           { "enabled": false },
    "learnable_k_h":        { "enabled": false },
    "representation_audit": { "enabled": false },
    "model_affinity":       { "enabled": false },
    "ab_harness":           { "enabled": false }
  }
}
```

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
