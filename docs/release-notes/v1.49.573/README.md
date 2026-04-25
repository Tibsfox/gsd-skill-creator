# v1.49.573 — Upstream Intelligence Pack v1.44 (ArXiv eess Integration)

**Closed:** 2026-04-24 (on `dev`; human merge to `main` remains gated per 2026-04-22 directive)
**Milestone tip on dev:** `<TBD-after-commit>`
**Phases:** 24 (755 → 778)
**Waves:** 11 (W0 → W11)
**Tests:** 27,411 passing (vs v1.49.572 published baseline 26,699 → **+712 tests**, 7.12× over the ≥100 floor)
**Regressions:** 0 net new attributable to v1.49.573
**Pre-existing failures:** 2 (in `src/mathematical-foundations/__tests__/integration.test.ts` — v1.49.572 baseline, NOT v1.49.573; see `src/upstream-intelligence/__tests__/PRE-EXISTING.md`)
**Typecheck:** clean (`npx tsc --noEmit` exit 0)
**CAPCOM gates:** G0–G14 all PASS · G15 Final **AUTHORIZED** (16 gates total, including 4 HARD preservation gates G10/G11/G12/G13 + 1 HARD composition gate G14 + 1 Safety Warden BLOCK G7)

## The architecture reads itself

> The chipset reads the chipset literature; the federated layer reads the federated-learning literature; the safety warden reads the safety-verification literature. The Amiga Principle proved itself recursively — architecture integrating peer-reviewed literature about the same architecture.

Where v1.49.572 asked *what does a math result constrain?*, v1.49.573 asks the prior question: **what does the literature already say about the architecture we built?** The 17–23 April 2026 arXiv eess/cs harvest (150 curated papers, seven module tracks) gave seven answers — and along the way independently rederived seven GSD architectural decisions, the strongest external validation signal the project has logged to date.

| Module | Domain | GSD asset strengthened |
|--------|--------|------------------------|
| M1 | Skill Learning Foundations | gsd-skill-creator pipeline integration plans |
| M2 | Mathematical & Info-Theoretic Substrate | *The Space Between* proof-companion arc + chipset theoretical foundation |
| M3 | Bioacoustics, Music & Audio Intelligence | Sound of Puget Sound mission + cultural-sensitivity gate |
| M4 | Federated Learning, Security & Privacy | Pre-rollout threat-model gate + DoltHub federated skill-economy boundary |
| M5 | Edge Infrastructure, Mesh & Resilient Networks | FIG plan v2 + GSD Mesh Prototype + personal weather station mission |
| M6 | Hardware Substrate & Energy Economics | Silicon Layer roadmap + commercial pricing thesis (reference-only) |
| M7 | Safety, Verification & Pedagogy | CAPCOM gate logic revision + College of Knowledge pedagogy + ZFC compliance auditor blueprint |

## Half A — ArXiv eess Deep Research + Corpus Tie-In (phases 755–764)

Docs-and-public-artifact wave. LaTeX module research + cultural-sensitivity audit + threat-model audit + three-document M7 synthesis + cross-module integration synthesis + convergent-discovery enumeration + top-10 cross-cutting recommendations + v1.44 delta over v1.43 + 150-entry BibTeX + 5 public hub HTML pages on `tibsfox.com/Research/UPSTREAM/` + 8 college concept `.ts` files + 11 cross-references.json edges + series.js entry. Re-analyze directive observed: 7 overlap papers vs v1.49.572 (Tonnetz, SampEn graph signals, Timescale Limits, Reward-Balancing, Symplectic Inductive Bias, Unified EnKF, CAR-EnKF) all produced fresh per-paper analysis in the eess/cs lens with **zero forward-cite** to v1.49.572's math lens.

| Phase | Deliverable | Requirement |
|-------|-------------|-------------|
| 755 | W0 Foundation — 150-entry BibTeX shared schema + `eess26_<arxivID>` cite-key convention + 7 module spec templates + CAPCOM gate macro + safety-warden-report.tex scaffold | UIP-12 seed |
| 756 | M1 `module_1.tex` — Skill Learning Foundations (11 papers) | UIP-01, UIP-02 |
| 757 | M2 `module_2.tex` — Mathematical & Info-Theoretic Substrate (22 papers) | UIP-01, UIP-02 |
| 758 | M3 `module_3.tex` — Bioacoustics, Music & Audio Intelligence (16 papers) + `m3-cultural-sensitivity-report.tex` (OCAP/CARE/UNDRIP audit) | UIP-01, UIP-05, UIP-10 |
| 759 | M4 `module_4.tex` — Federated Learning, Security & Privacy (14 papers) + `m4-mia-threat-model.tex` (Lee et al. trio) | UIP-01, UIP-11 |
| 760 | M5 `module_5.tex` — Edge Infrastructure, Mesh & Resilient Networks (14 papers) | UIP-01, UIP-02 |
| 761 | M6 `module_6.tex` — Hardware Substrate & Energy Economics (14 papers) | UIP-01, UIP-07 |
| 762 | M7 `module_7.tex` — Safety, Verification & Pedagogy (16 papers) + `m7-capcom-revision.tex` + `m7-zfc-blueprint.tex` + `m7-college-pedagogy.tex` | UIP-01, UIP-06, UIP-08 |
| 763 | W2 Synthesis — `synthesis-integration.tex` + `synthesis-convergent-discovery.tex` (7 external projects enumerated) + `synthesis-top10-crosscutting.tex` | UIP-03, UIP-04 |
| 764 | W3 Publication + Corpus Tie-In — `v1.44-delta.tex` + 5 hub HTML pages + 8 college concept `.ts` files + 11 cross-references.json edges + series.js entry + Safety Warden BLOCK | UIP-05, UIP-09, UIP-12 |

**Convergent-discovery enumeration** (Phase 763, `synthesis-convergent-discovery.tex`): seven external peer-reviewed projects independently arrived at GSD architectural decisions —

- **Skilldex** (`eess26_2604.16911`, Saha & Hemanth) ≈ ZFC compliance auditor we'd been planning to build for ~6 milestones (package-manager + registry + first public spec-conformance scorer).
- **SkillX** (`eess26_2604.04804`) ≈ chipset three-tier hierarchy.
- **Experience Compression Spectrum** (`eess26_2604.15877`, Zhang et al.) ≈ DACP cross-level adaptive compression layer (the "missing diagonal" the paper names).
- **Vakhnovskyi BLE-LoRa Mesh** (`eess26_2604.15532`) ≈ Cascadia Subduction emergency-comms thesis.
- **Stackelberg Drainability Guardrails** (`eess26_2604.16802`, CDC 2026) ≈ FoxCompute commercial-thesis pricing antecedent (reference-only; commercial deployment downstream).
- **ArtifactNet** (`eess26_2604.16254`) ≈ skill/asset provenance gate via forensic-residual physics (SONICS n=23,288).
- **Spatiotemporal Link Formation** (`eess26_2604.18888`, EDM 2026) ≈ predictive skill-loader via GNN link-formation prediction over the College-of-Knowledge graph.

**Safety Warden BLOCK at Phase 764 close: PASS** — 0 quote violations, 0 source reuse, 0 `www/tibsfox/com` commits, `cross-references.json` schema-valid, pre-commit hook intact, **zero Fox Companies IP leakage** in any of the 5 public hub pages.

## Half B — Research-Informed Substrate (phases 765–774)

All 10 Half B modules ship **default-off**. Opt-in via `.claude/gsd-skill-creator.json` `upstream-intelligence` block (same schema pattern as v1.49.570 `convergent` / v1.49.571 `heuristics-free-skill-space` / v1.49.572 `mathematical-foundations`). Tier-gating discipline carried forward from v1.49.572: T1 must-ship, T2 if-budget, T3 may-defer-but-shipped.

| Phase | Tier | Module | Path | Tests | Floor | Multiplier | Gate |
|-------|------|--------|------|-------|-------|------------|------|
| 765 | T1a | Skilldex Conformance Auditor | `src/skilldex-auditor/` (10 files, 1,333 lines) | 32 | 15 | 2.13× | **G10 hard preservation** |
| 766 | T1b | Bounded-Learning Empirical Harness | `src/bounded-learning-empirical/` (11 files, 2,226 lines) | 72 | 10 | 7.20× | standard |
| 767 | T1c | Activation Steering Runtime | `src/activation-steering/` (11 files, 1,358 lines) | 38 | 12 | 3.17× | **G11 hard preservation (DACP byte-identical)** |
| 768 | T1d | FL Pre-Rollout Threat-Model Gate | `src/fl-threat-model/` (10 files, 2,591 lines) | 115 | 15 | 7.67× | standard |
| 769 | T2a | Experience Compression Layer | `src/experience-compression/` (11 files, 2,005 lines) | 49 | 10 | 4.90× | standard |
| 770 | T2b | Predictive Skill Auto-Loader | `src/predictive-skill-loader/` (11 files, 1,458 lines) | 39 | 12 | 3.25× | **G12 hard preservation (orchestration byte-identical)** |
| 771 | T2c | PromptCluster BatchEffect Detector | `src/promptcluster-batcheffect/` (9 files, 1,863 lines) | 42 | 10 | 4.20× | standard |
| 772 | T2d | ArtifactNet Provenance Verifier | `src/artifactnet-provenance/` (11 files, 1,878 lines) | 56 | 10 | 5.60× | **G13 hard preservation (audit pipeline byte-identical)** |
| 773 | T3a | Stackelberg Drainability Pricing Reference | `src/stackelberg-pricing/` (10 files, 2,354 lines) | 67 | 8 | 8.38× | standard |
| 774 | T3b | Rumor Delay Model | `src/rumor-delay-model/` (9 files, 2,059 lines) | 33 | 8 | 4.13× | standard |
| 775 | — | W9 Integration suite + composition + flag-off byte-identical | `src/upstream-intelligence/__tests__/` (7 files, 1,592 lines, 6 test files + 1 fixture + 1 audit doc) | 33 | 30 | 1.10× | **G14 hard composition closure** |

Half B totals: **10 new src/ modules** (~19,125 lines), **1 integration suite** (33 tests across 6 files), **576 tests** (vs ≥94 itemized floor: 6.13×); **+712 raw delta** vs the published 26,699 baseline (vs ≥100 floor: 7.12×).

**T3 SHIPPED, not deferred.** T1 + T2 closed with 8.6× and 4.4× multipliers respectively; the autonomous run had budget; T3 Stackelberg + Rumor-Delay shipped as a bonus rather than carried into a future milestone.

## CAPCOM preservation (hard gates)

Four modules sit on load-bearing architectural joints and carry **hard preservation** gates; one composition gate seals the milestone:

- **G10 (Phase 765, Skilldex Auditor)** — `src/skilldex-auditor/` is **read-only relative to the skill library**. The auditor never mutates `.claude/skills/`; FAIL paths are explicitly verified to emit a finding without writing. CAPCOM source-regex sweep empty; flag-off byte-identical in flag-off path.
- **G11 (Phase 767, Activation Steering)** — `src/dacp/` byte-identical with the steering flag off. The activation vector is an additional metadata channel alongside the DACP `(intent, data, code)` triad — it never enters the wire-format payload. SHA-256 wire-format hash test PASS; semantic-channel fidelity tier never weakens.
- **G12 (Phase 770, Predictive Skill Loader)** — `src/orchestration/` byte-identical with the predictive flag off. The predictive layer composes via the existing hook API only; orchestration topology unchanged. Hash test PASS.
- **G13 (Phase 772, ArtifactNet Provenance)** — audit pipeline byte-identical with the provenance flag off. The provenance verdict feeds the existing audit as a pre-audit slot; the Grove pre-hook composes additively via duck-compatible `ExistingAudit` interface. SONICS n=23,288 forensic-residual detector reference; hash test PASS.
- **G14 (Phase 775, composition closure)** — 10-module CAPCOM-preservation source-regex sweep empty; ES-module singleton reference-equality held across the full Half B set; live-config `upstream-intelligence` block schema-valid; 8 pairwise compositions PASS; public API surface smoke PASS (every module exports a settings reader and a headline entry point); cross-milestone composition with v1.49.570/571/572 + MB-1 Lyapunov + MB-5 dead-zone verified; **stability-rail V̇ ≤ 0 preserved across all 10 Half B flag combinations**. Hash-tree fixture root digest: `ace3a9008ed7850e33d05bc6d98fc57daa617d46a7e0341bd6c77acc54804d95`.

No Half B module replaces or bypasses CAPCOM human-gate architecture. All 10 augment rather than replace.

## CAPCOM gate ledger

| Gate | Phase | Type | Verdict |
|------|-------|------|---------|
| G0 | 755 | Standard | PASS |
| G1 | 757 | Standard | PASS |
| G2 | 758 | Cultural-Sensitivity Audit (OCAP/CARE/UNDRIP) | PASS |
| G3 | 759 | Pre-Rollout Threat Model (Lee et al. trio) | PASS |
| G4 | 761 | Standard | PASS |
| G5 | 762 | Standard | PASS |
| G6 | 763 | Synthesis (convergent-discovery enumeration) | PASS |
| G7 | 764 | **Safety Warden BLOCK** | PASS |
| G8 | 765 | Standard (T1 entry) | PASS |
| G9 | 768 | Standard (T1 closure) | PASS |
| G10 | 765 | **CAPCOM hard preservation (Skilldex)** | PASS |
| G11 | 767 | **CAPCOM hard preservation (DACP)** | PASS |
| G12 | 770 | **CAPCOM hard preservation (orchestration)** | PASS |
| G13 | 772 | **CAPCOM hard preservation (audit pipeline)** | PASS |
| G14 | 775 | **CAPCOM hard composition closure** | PASS |
| G15 | 778 | Final | **AUTHORIZED** |

Audit trail JSON: `.planning/missions/arxiv-eess-integration-apr17-23/work/capcom_gates.json` — 16 records.

## UIP-* requirements (24/24 CLOSED)

| Requirement | Half | Phase(s) | Wave | Closure artifact |
|-------------|------|----------|------|------------------|
| UIP-01 | A | 756–762 | W1A–W1C | All 150 papers individually addressed across M1–M7 with methodology + GSD target + risk class + test pattern |
| UIP-02 | A | 756–762 | W1A–W1C | Per-paper consistency check; 7 overlap papers re-analyzed in eess/cs lens (no forward-cite) |
| UIP-03 | A | 763 | W2 | `synthesis-convergent-discovery.tex` — 7 external projects enumerated (≥5 required) |
| UIP-04 | A | 763 | W2 | `synthesis-top10-crosscutting.tex` ≤25pp, ≥3 modules per recommendation; pre-rollout-gate language verified |
| UIP-05 | A | 758, 764 | W1A, W3 | 16 M3 audio papers feed Sound of Puget Sound reference; cultural-sensitivity audit complete |
| UIP-06 | A | 762 | W1C | `m7-capcom-revision.tex` — 4 mandatory paper→gate mappings present |
| UIP-07 | A | 761, 764 | W1B, W3 | M6 hardware methodologies enumerated adopted/deferred/rejected; FoxCompute IP stays in `.planning/` |
| UIP-08 | A | 762 | W1C | `m7-zfc-blueprint.tex` — Skilldex + Structural Verification fusion |
| UIP-09 | A | 762, 764 | W1C, W3 | SkillLearnBench empirical justification documented |
| UIP-10 | A | 758 | W1A | `m3-cultural-sensitivity-report.tex` — every Indigenous reference names specific nation |
| UIP-11 | A | 759 | W1B | `m4-mia-threat-model.tex` — Lee et al. trio + 4 mitigations |
| UIP-12 | A | 755→764 | W0→W3 | `gsd-arxiv-eess-apr17-23.bib` — 150 entries, conference targets named, `eess26_<arxivID>` cite-keys |
| UIP-13 (T1a) | B | 765 | W4 | `src/skilldex-auditor/` 32 tests; G10 PASS |
| UIP-14 (T1b) | B | 766 | W4 | `src/bounded-learning-empirical/` 72 tests |
| UIP-15 (T1c) | B | 767 | W5 | `src/activation-steering/` 38 tests; G11 PASS |
| UIP-16 (T1d) | B | 768 | W5 | `src/fl-threat-model/` 115 tests; 15 block-on conditions |
| UIP-17 (T2a) | B | 769 | W6 | `src/experience-compression/` 49 tests |
| UIP-18 (T2b) | B | 770 | W6 | `src/predictive-skill-loader/` 39 tests; G12 PASS |
| UIP-19 (T2c) | B | 771 | W7 | `src/promptcluster-batcheffect/` 42 tests; 100% TP / 0% FPR on synthetic injection |
| UIP-20 (T2d) | B | 772 | W7 | `src/artifactnet-provenance/` 56 tests; G13 PASS |
| UIP-21 (T3a) | B | 773 | W8 | `src/stackelberg-pricing/` 67 tests; **SHIPPED, not deferred** |
| UIP-22 (T3b) | B | 774 | W8 | `src/rumor-delay-model/` 33 tests; **SHIPPED, not deferred** |
| UIP-21-COMP | B | 775 | W9 | W9 integration suite 33 tests; G14 PASS; flag-off byte-identical fixture; cross-milestone composition with v1.49.570/571/572 |
| UIP-22-CLOSE | B | 778 | W11 | This README + RETROSPECTIVE.md + milestone-package/MANIFEST.md + CHANGELOG entry; STATE.md flipped `ready_for_review`; G15 AUTHORIZED |

**Coverage:** 22 numbered + 2 closure = **24/24 CLOSED**. Zero deferred.

## Architecture Gap impact

- **GAP-9** (Medium): "GSD Architectural Assumptions Not Cross-Validated Against Peer Literature" — **v1.49.573 is the canonical example**: 150 papers × 7 modules × 10 substrate primitives mapping external literature to every major architectural joint. The 7 convergent-discovery projects (synthesis-convergent-discovery.tex) are the strongest external validation signal the project has logged.
- **GAP-6** (Critical): "DACP Not Publicly Documented" — extended via T1c Activation Steering (Local Linearity runtime steering of DACP bundles); v1.49.572's Semantic Channel formalism remains the primary closure.
- **GAP-7** (Medium): "Content Filter Vulnerability" — provenance-authentication angle addressed via T2d ArtifactNet Provenance.
- **GAP-10** (High): "Skill Space Collapse Risk Not Directly Measured" — embedding-space drift detection added via T2c PromptCluster BatchEffect (composes with v1.49.571 SSIA).
- **GAP-11** (Medium): "Bounded-Learning Caps Are Empirical Not Proved" — extended from theorem-reference attestation (v1.49.572 T1d) to executable empirical-harness via T1b Bounded-Learning Empirical (SkillLearnBench reproduction).
- **GAP-14** (NEW, Medium): "Skill-Spec Conformance Has No Machine-Checkable Scorer" — **ADDRESSED** via T1a Skilldex Conformance Auditor (Skilldex + Structural Verification methodology fusion).
- **GAP-15** (NEW, Medium): "No Runtime Mechanism for No-Fine-Tune CRAFT-Role Modulation" — **ADDRESSED** via T1c Activation Steering runtime (Local Linearity of LLMs).
- **GAP-16** (NEW, Medium): "No Pre-Rollout Gate for Future Federated Skill Training" — **ADDRESSED** via T1d FL Threat-Model Gate (Data-Free MIA trio as mandatory pre-rollout).

## Feature-flag schema

All 10 Half B modules live behind a new `upstream-intelligence` block in `.claude/gsd-skill-creator.json`. Every flag defaults `false`; callers must explicitly opt in.

```json
{
  "gsd-skill-creator": {
    "upstream-intelligence": {
      "skilldex-auditor":            { "enabled": false },
      "bounded-learning-empirical":  { "enabled": false },
      "activation-steering":         { "enabled": false },
      "fl-threat-model":             { "enabled": false },
      "experience-compression":      { "enabled": false },
      "predictive-skill-loader":     { "enabled": false },
      "promptcluster-batcheffect":   { "enabled": false },
      "artifactnet-provenance":      { "enabled": false },
      "stackelberg-pricing":         { "enabled": false },
      "rumor-delay-model":           { "enabled": false }
    }
  }
}
```

With every flag `false`, runtime behavior is **byte-identical to v1.49.572** — verified by Phase 775 composition + flag-off byte-identical regression test (`composition-flag-off-byte-identical.test.ts`) + live-config verification (`live-config-flag-off.test.ts`) + the 153-file SHA-256 hash-tree fixture (`preserved-modules-hashtree.json`, root digest `ace3a9008ed7850e33d05bc6d98fc57daa617d46a7e0341bd6c77acc54804d95`).

## Corpus Tie-In Artifacts (Phase 764)

- **5 HTML hub pages** under `www/tibsfox/com/Research/UPSTREAM/` — UPSTREAM hub + 4 themed (M1 Skill Learning · M3 Audio Intelligence · M5 Edge Mesh · M7 Safety & Verification). **Pages live on disk only** — `www/tibsfox/com/Research/` is gitignored; `scripts/git-hooks/pre-commit` enforces this.
- **8 college concept `.ts` files** across `ai-computation` + `adaptive-systems` departments: `experience-compression-spectrum`, `skilldex-conformance`, `local-linearity-steering`, `data-free-mia-attack`, `ble-lora-mesh`, `stackelberg-drainability`, `interval-pomdp-shielding`, `spatiotemporal-link-formation`. Each with relationships + `complexPlanePosition`.
- **+11 `cross-references.json` edges** — UPSTREAM hub ↔ MATH (v1.49.572) · LeJEPA (v1.49.571) · Convergent (v1.49.570) · Drift · SST · LLM · Chipset · College · Silicon Layer · DACP · *The Space Between* · Sound of Puget Sound · FIG plan · CAPCOM. Edge count net 11 new for the milestone.
- **`series.js`** UPSTREAM hub + themed child entries under "AI & Computation" / "Safety & Verification" / "Audio Intelligence" Rosetta clusters.

## Documentation

- `docs/substrate/upstream-intelligence/README.md` (Phase 777, hub) — opt-in guide + composition guide + cross-milestone integration + hard-preservation reference for the 10 Half B modules.
- `docs/substrate/skilldex-auditor.md`, `bounded-learning-empirical.md`, `activation-steering.md`, `fl-threat-model.md`, `experience-compression.md`, `predictive-skill-loader.md`, `promptcluster-batcheffect.md`, `artifactnet-provenance.md`, `stackelberg-pricing.md`, `rumor-delay-model.md` — 10 per-module guides.
- Cross-link updates: `docs/CORE-CONCEPTS.md` (T1c Activation Steering, T2b Predictive Skill Loader); `docs/GROVE-FORMAT.md` (T2c BatchEffect, T2d ArtifactNet Provenance).

## Pre-existing failures

Two failures in `src/mathematical-foundations/__tests__/integration.test.ts` carry forward from the v1.49.572 baseline. Both are live-config flag-state checks (the dev environment has some `mathematical-foundations` flags opted in by the user), **not v1.49.573's responsibility**. Audit trail: `src/upstream-intelligence/__tests__/PRE-EXISTING.md`. Action: defer to a v1.49.572 follow-up cleanup phase. The Gate G14 verdict explicitly distinguishes this category from new regressions; zero tests that were passing at v1.49.572 close now fail.

## Source mission package

`.planning/missions/arxiv-eess-integration-apr17-23/`:
- `arxiv_eess_integration_mission.pdf` (50 pages, three-stage package: Vision / Research Reference / Mission Spec)
- `arxiv_eess_integration_mission.tex` (1,389 lines)
- `index.html` (cover page)
- `work/templates/` — 18 `.tex` artifacts (7 modules + 4 M3/M4/M7 audits + 3 W2 syntheses + v1.44 delta + safety-warden-report + capcom_gate_macro)
- `work/sources/index.bib` — 150-entry shared BibTeX
- `work/glossary.md` + `work/numerical_attribution.md` + `work/capcom_gates.json`

See `milestone-package/MANIFEST.md` for the close-time artifact index.

## Branch state

- **dev** tip: `<TBD-after-commit>` (this milestone-close commit)
- **main** tip: `a5ec2bd6f` (v1.49.571 merge + CI guards)
- v1.49.572 + v1.49.573 queue on dev awaiting human merge decision
- **Branch directive in force (2026-04-22):** dev-branch only; no push to main until explicit user approval
- **v1.50 branch:** **DEFERRED** — do not touch

## Dedication

This milestone is dedicated to the authors whose peer-reviewed work shaped its substrate:

- **Zhong et al.** for SkillLearnBench (`eess26_2604.20087`) — the recursive-drift-under-self-feedback finding that empirically validates the GSD constitution's bounded-learning caps.
- **Saha & Hemanth** for Skilldex (`eess26_2604.16911`) — the package-manager + registry + first public spec-conformance scorer methodology that became our T1a auditor.
- **Vakhnovskyi** for the Dual-Radio BLE-LoRa Mesh (`eess26_2604.15532`) — the mesh-topology design language that the Cascadia-emergency-comms thesis now cites as antecedent.
- **Zhang et al.** for the Experience Compression Spectrum (`eess26_2604.15877`) — the "missing diagonal" that named the cross-level adaptive layer the system needed.
- **Lee et al.** for the FL threat trio (`eess26_2604.19891` + `eess26_2604.19915` + `eess26_2604.20020`) — Data-Free MIA / DECIFR / FL Hardware Assurance, three papers that together force every future federated-training path to budget for the attack before deployment.
- **Skifstad / Yang / Chou** for Local Linearity of LLMs (`eess26_2604.19018`) — the no-fine-tune CRAFT-role modulation runtime that became our T1c steering controller.

Their work is cited in detail in the 10 Half B module guides and in `synthesis-convergent-discovery.tex`. Where their names appear above, the substrate they enabled appears in `src/`.

## Next

- **Human authorization required** to merge `dev` → `main`. Per 2026-04-22 directive, dev-branch-only is still in force.
- Post-merge task: publish `tibsfox.com/Research/UPSTREAM/` pages via `sync-research-to-live.sh` (site sync only; tree stays gitignored).
- Opt-in any subset of the 10 Half B modules by flipping `upstream-intelligence.<name>.enabled` to `true`.

## Cross-references

- `docs/release-notes/v1.49.573/REGRESSION.md` — Phase 776 regression report (per-module test-ID lists; +712 delta arithmetic; pre-existing failure attribution)
- `docs/release-notes/v1.49.573/RETROSPECTIVE.md` — Phase 778 retrospective (what worked / surprised / learned / would do differently / numerical-attribution audit)
- `docs/release-notes/v1.49.573/milestone-package/MANIFEST.md` — Phase 778 close-time artifact index
- `docs/substrate/upstream-intelligence/README.md` — Phase 777 substrate hub doc
- `src/upstream-intelligence/__tests__/PRE-EXISTING.md` — pre-existing failure audit trail

## Sources

Primary arXiv harvest (April 17–23, 2026 eess/cs window): 150 curated papers across 7 module domains. Citation-key convention: `eess26_<arxivID>`. Full reference graph: `.planning/missions/arxiv-eess-integration-apr17-23/work/sources/index.bib` (D10 deliverable).

Keystone papers — `eess26_2604.16911` (Skilldex) · `eess26_2604.20087` (SkillLearnBench) · `eess26_2604.15877` (Experience Compression) · `eess26_2604.19018` (Local Linearity) · `eess26_2604.19891` + `eess26_2604.19915` + `eess26_2604.20020` (FL threat trio) · `eess26_2604.18888` (Spatiotemporal Link Formation) · `eess26_2604.14441` (Batch Effects in Brain FMs) · `eess26_2604.16254` (ArtifactNet) · `eess26_2604.16802` (Stackelberg Drainability) · `eess26_2604.17368` (Stochastic Delayed Rumor Propagation) · `eess26_2604.15532` (BLE-LoRa Mesh) · `eess26_2604.18834` (Structural Verification for EDA) · `eess26_2604.04804` (SkillX).
