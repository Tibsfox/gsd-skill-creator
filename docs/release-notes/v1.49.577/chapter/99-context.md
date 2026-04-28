# v1.49.577 — Engine Context (Snapshot)

**Backfilled:** 2026-04-27 (1 day after release; original ship did not author release-notes — drift remediation)

## Test posture (v1.49.576 baseline → v1.49.577 final)

| Metric | Baseline | Final | Delta |
|---|---|---|---|
| Passing | 28,066 | 28,345 | +279 (target ≥+50; 5.6× overdelivery) |
| Failing | 10 | 3 | −7 (Part B fixed 6 baseline failures via collateral; introduced 0) |
| Skipped | 7 | 11 | +4 (LEAN_AVAILABLE-gated tests in JP-001 / JP-009) |
| Todo | 7 | 7 | unchanged |

**Pre-existing failures remaining (3, all non-Part-B-induced):**

1. `src/mathematical-foundations/__tests__/integration.test.ts` — 2 failures, "flag-off byte-identical regression — live-config" + companion. Confirmed pre-existing via Track A stash/revert in P837/P834.
2. `src/heuristics-free-skill-space/__tests__/integration.test.ts` — 1 failure, `.claude/` install-completeness check. Fresh-checkout artifact: `.claude/agents/`, `.claude/skills/`, `.claude/hooks/` are gitignored per CLAUDE.md and populated by `project-claude/install.cjs`.

## JP-NNN findings matrix (40 / 40 landed)

| Severity | Count | Wave | Status |
|---|---|---|---|
| BLOCK | 3 | Wave 1 | All landed (JP-001, JP-002, JP-003) |
| HIGH | 12 | Wave 2 | All landed (JP-004 … JP-015) |
| MEDIUM | 25 | Wave 3 | All landed (JP-016 … JP-040) |
| LOW | — | backlog | Routed via `gsd-add-backlog` |

**Selected wave-anchor commits:**

| Phase / Finding | Commit | Subsystem(s) |
|---|---|---|
| Part B scaffold (W0) | `73bf440e7` | `src/anytime-valid/`, `src/skill-promotion/` |
| JP-001 Lean toolchain pin | `c1f73f0cb` | `src/mathematical-foundations/` |
| JP-002 anytime-valid CAPCOM gate primitive | `40921c081` | `src/orchestration/`, `src/anytime-valid/` |
| JP-003 20%-rule causal-sync KL bound | `4d2fd00b1` | `src/bounded-learning/` |
| JP-004 SAP probe + (I−P_S) projector | `7d165fa70` | `src/safety/`, `src/projection/` |
| JP-005 ROI gate + JP-010a K telemetry | `9ae20e756` | `src/skill-promotion/`, `src/ab-harness/` |
| JP-006 mesh-degree monitor + JP-007 draft/verify router | `68422ed4a` | `src/orchestration/` |
| JP-008 SAGES regression + JP-012 fidelity codec | `9b5fa0034` | `src/vtm/`, `src/dacp/` |
| JP-009 + JP-013 | `23809d534` | `src/mathematical-foundations/`, `src/coherent-functors/` |
| JP-011 + JP-014 CLAUDE.md citations consolidation | `57bce4bb2` | CLAUDE.md |
| JP-022 + JP-037 + JP-024 Wasserstein direction (anchor phase 839) | `871f8172b` | `src/ab-harness/`, `src/orchestration/`, `coprocessors/` |
| JP-029 anytime-valid bridge migration | `b7a54b0fb` | `src/ab-harness/` |
| Self-review pass cleanup | `268950204` | 7 files reframed |
| Closing inventory regen | `821568eea` | INVENTORY-MANIFEST.json |

## `src/*` subsystem deltas

| Subsystem | Status |
|---|---|
| `src/anytime-valid/` | **NEW** — e-process martingale primitive (Ville's inequality). Consumed by `src/orchestration/anytime-gate.ts` + `src/ab-harness/` (JP-029 migration) |
| `src/skill-promotion/` | **NEW** — deployment-horizon ROI gate (Landauer floor T=300K). Anchors JP-005 |
| `src/orchestration/` | extended — anytime-gate wiring (JP-002), mesh-degree monitor (JP-006), draft/verify router (JP-007) |
| `src/safety/` | extended — SAP probe (JP-004) |
| `src/projection/` | extended — (I−P_S) safety-aware projector registered in MB-2 registry (JP-004) |
| `src/bounded-learning/` | extended — CITATION.md anchoring 20%-rule to causal-sync KL bound (JP-003) |
| `src/mathematical-foundations/` | extended — `lean-toolchain.md` + Lean build-smoke target (JP-001) |
| `src/ab-harness/` | extended — Wasserstein direction (JP-022/JP-037), sample budget BO autotune (JP-018), e-process bridge migration (JP-029) |
| `src/vtm/` | extended — SAGES regression (JP-008) |
| `src/dacp/` | extended — fidelity-tier codec (JP-012) |
| `src/coherent-functors/` | extended — JP-027/JP-028 small-data composition |
| `src/ace/`, `src/traces/`, `src/graph/`, `src/learnable-k_h/` | extended — JP-019/JP-020/JP-021/JP-023 small-data citations |
| `src/coprocessors/`, `src/cache/` | extended — JP-031/JP-024/JP-015 |
| `src/symbiosis/` | extended — JP-025 SAP-projected gradient gate |
| `src/dead-zone/` | citation-only — JP-033 references arXiv:2604.21101 12-simulation floor |
| Subsystem count | 145 → 147 (+2) |

## CLAUDE.md "External Citations" section state

| Anchor | Source | Cluster | Status at v1.49.577 |
|---|---|---|---|
| arXiv:2604.20874 Root Theorem | CS25–26 Sweep (v1.49.575) | C1 bounded-tape | unchanged |
| arXiv:2604.21744 GROUNDINGmd | CS25–26 Sweep (v1.49.575) | C2 Hard Constraints | unchanged |
| arXiv:2604.21910 Skills-as-md | CS25–26 Sweep (v1.49.575) | C3 three-tier pipeline | unchanged |
| **arXiv:2604.20897** Watts-per-Intelligence II (Algorithmic Catalysis) | JULIA-PARAMETER (v1.49.577) | C1 extension | NEW — anchors `src/skill-promotion/` JP-005 |
| **arXiv:2604.20915** Absorber LLM (Causal Synchronization) | JULIA-PARAMETER (v1.49.577) | C1 | NEW — anchors `src/bounded-learning/` JP-003 |
| **arXiv:2510.04070** Markov kernels in Lean Mathlib (Degenne et al.) | JULIA-PARAMETER (v1.49.577) | C1 / C3 enabler | NEW — anchors `src/mathematical-foundations/` JP-001 |
| **arXiv:2604.21101** Hybridizable Neural Time Integrator | JULIA-PARAMETER (v1.49.577) | C5 small-data inductive bias | NEW — anchors `src/dead-zone/` 12-floor + `src/lyapunov/` MB-1 |
| **arXiv:2604.21048** Mandelbrot/Julia 3-parameter slices | JULIA-PARAMETER (v1.49.577) | C6 find-the-right-slice | NEW — featured / philosophical anchor; no `src/*` code anchor |

Section grew from 3 → 7 anchors + 1 featured philosophical anchor.

## User decisions locked at Part A → Part B handoff (2026-04-26)

| Decision | Lock |
|---|---|
| Final milestone name | "JULIA-PARAMETER: Wasserstein-Everywhere" (option C) |
| Skill-promotion home | new `src/skill-promotion/` subsystem |
| E-process consolidation | single shared `src/anytime-valid/` primitive |
| CLAUDE.md sectioning | extend existing "External Citations (CS25–26 Sweep)" with new cluster subsection (not sibling) |
| JP-010 K definition | adjust K based on actual deployment-target evidence (telemetry precedes calibration) |
| Part B scope | all 40 candidates (full BLOCK + HIGH + MEDIUM coverage) |

## Anti-patterns enforced

| Anti-pattern | Status |
|---|---|
| Re-research of FINDINGS-classified items in Part B | Compliant — no Part B phase re-read source arXiv abstracts |
| Upstream PR drafting from this milestone | Compliant — separate future backlog |
| `wasteland` branch / muse content imported | Compliant — 0 references in 54 paper-cards |
| `.planning/fox-companies/` IP exposed | Compliant — gitignored throughout |
| `/media/foxy/...` paths in user-facing copy | Compliant — `$REPO/...` + relative paths only |
| Featured-paper handling overshadows convergent-discovery clusters | Compliant — featured paper handled as user-interest signal, philosophical anchor only |
| Final milestone-name selection before Part A handoff | Compliant — name locked at handoff (2026-04-26), not before |
| `"all candidates" Part B scope` | Honored — 40 / 40 findings landed |
| Full-PDF reading reserved for Wave 1 paper-cards | Compliant — Wave 0 catalog used abstracts only |

## Versions bumped at v1.49.577

- `package.json` → 1.49.577
- `package-lock.json` → 1.49.577
- `src-tauri/Cargo.toml` → 1.49.577
- `src-tauri/tauri.conf.json` → 1.49.577

(Version-bump merge from dev landed at `1b9eedb9b` on main 2026-04-26 02:40:30 -0700.)

## Forward citations (v1.49.578+)

| Carryover item | Source | Status at v1.49.577 close | v1.49.578 disposition |
|---|---|---|---|
| `wasserstein-boed.ts` IPM-BOED replacement | self-review MEDIUM | DEFER (info-blocked on concrete `p(y\|d,θ)` model) | Carried forward; documented in v1.49.578 STATE.md as W2a/W2c DEFER with read-of-source evidence |
| JP-001 substantive Mathlib pin verification | placeholder + procedure | placeholder shape landed | CLOSED in v1.49.578 — `tools/verify-mathlib-pin.sh` ran end-to-end on Lean 4.15.0 + Mathlib4@6955cd00cec441d129d832418347a89d682205a6; all four namespaces compiled cleanly |
| JP-040 NASA citations relocation | gitignored `.planning/missions/nasa/REFERENCES.md` | citation-only stub | CLOSED in v1.49.578 — relocated to `docs/research/nasa-citations.md` with 4 new presence asserts |
| JP-010a real-caller seed | telemetry hooks shipped, K=3 default | zero observations captured | CLOSED in v1.49.578 — first real caller seeded at `src/ab-harness/cli.ts` with caller=ab-harness-cli + sessionType from `process.env.CI` |

---

*v1.49.577 / JULIA-PARAMETER: Wasserstein-Everywhere / 2026-04-26 (release) / 2026-04-27 (release-notes backfill)*
