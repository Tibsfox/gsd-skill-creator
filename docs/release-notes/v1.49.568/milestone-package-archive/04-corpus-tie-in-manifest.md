# Corpus Tie-In Manifest — Phase-by-Phase

Every phase of the Nonlinear Frontier milestone names which slice of the existing corpus it touches. This is the formal map; failures to hit the surfaces listed here are a milestone-scope violation.

## P1 — Concept Panels Activation

| Target surface | Concepts landing there |
|----------------|----------------------|
| `.college/departments/mathematics/concepts/` | solitons, blow-up-dynamics, scale-critical-equations, erdos-problem-index, millennium-problem-catalogue |
| `.college/departments/physics/concepts/` | reynolds-similarity, vorticity-stretching, k41-cascade, primitive-equations |
| `.college/departments/chemistry/concepts/` | clausius-clapeyron, kohler-theory |
| `.college/departments/materials/concepts/` | wbf-mixed-phase, ice-nucleation-modes |
| `.college/departments/environmental/concepts/` | aerosol-indirect-erf, wmo-cloud-taxonomy |
| `.college/departments/data-science/concepts/` | data-assimilation-4dvar, ai-weather-pipeline |
| `.college/departments/adaptive-systems/concepts/` | lorenz-predictability-limit |
| `.college/departments/logic/concepts/` | ai-verified-proof |

Departments with a new concepts/ folder created: **adaptive-systems/concepts/** (did not exist pre-milestone).

DEPARTMENT.md files to update (add concept rows to the "Concepts" table):
- `.college/departments/mathematics/DEPARTMENT.md`
- `.college/departments/physics/DEPARTMENT.md`
- `.college/departments/chemistry/DEPARTMENT.md`
- `.college/departments/materials/DEPARTMENT.md`
- `.college/departments/environmental/DEPARTMENT.md`
- `.college/departments/data-science/DEPARTMENT.md`
- `.college/departments/adaptive-systems/DEPARTMENT.md`
- `.college/departments/logic/DEPARTMENT.md`

## P2 — Publication Cuts

| Target path on tibsfox.com | Source section in FINAL.md | Research series home |
|----------------------------|----------------------------|---------------------|
| `/Research/BLN/nonlinear-frontier/` | Introduction + Module 2 + Cross-Module Synthesis Arc 1 | BLN (existing: thicc-splines-save-lives) |
| `/Research/CSP/soliton-resolution/` | Module 1 + Cross-Module Synthesis Arc 1 | CSP (existing: complex systems / plane) |
| `/Research/TIBS/merle-breakthrough-2026/` | Module 1 (full) + Closing | TIBS (new dated entry) |
| `/Research/TIBS/erdos-1196-ai-proof/` | Module 6 §2, §3 + Cross-Module Synthesis Arc 3 | TIBS (new dated entry) |

Plus an update to `/Research/index.html` with links to the four new pages.

## P3 — Forest-Sim Extensions

| Extension | Source section | Simulation file touched |
|-----------|---------------|------------------------|
| Köhler droplet activation | M4 §4 | `www/tibsfox/com/Research/forest/simulation.js` (behind `featureFlags.microphysics`) |
| K41 canopy-flow sub-grid turbulence | M2 §5 | `www/tibsfox/com/Research/forest/simulation.js` (behind `featureFlags.k41Turbulence`) |

Integration checked against:
- `.planning/missions/forest-sim-retro-wire/` — active mission; our flags live upstream of its integration
- `src/simulation/batch-simulator.ts` — ensemble pattern continues to apply; no break

## P4 — Tracker + #143

| Target | Source | Action |
|--------|--------|--------|
| `/ERDOS-TRACKER.md` (repo root) | Enriched 2026-04-22 by ERDOS-wirer; 51/52 erdosproblems.com matched | Weekly refresh via `scripts/erdos-refresh.py` |
| `scripts/erdos-refresh.py` (NEW) | WebFetch pattern (similar to `sweep.py` in Artemis II) | Polls `teorth/erdosproblems` wiki weekly; dry-run mode |
| `/Research/TIBS/erdos-143/` (tibsfox.com) | M6 §3 + new "transfer-of-method" analysis | Published via publish-pipeline |

## P5 — Final Test Pass

Touches everything above as read-only verification. Adds tests at:
- `.college/departments/*/concepts/*.test.ts` — 16 new CF-CONC tests
- `tests/milestone/nonlinear-frontier.test.ts` — 8 IN-MILE tests
- `tests/milestone/edge-cases.test.ts` — 4 EC-MILE tests
- `tests/milestone/safety.test.ts` — 6 SC-MILE tests

## Cross-References for FINAL.md → Published Pages

Every inline citation in FINAL.md that becomes a per-page citation must retain:
- Exact URL
- Source attribution
- Date of access (2026-04-22)
- Safety-gate flag (SC-SRC, SC-NUM, SC-ADV, SC-QUOTE, SC-TM, SC-VER) preserved

This is audited by SC-MILE-04 in the test plan.

## Out-of-Scope Filters (preserves research-pack boundaries)

- No new Direct3D / Metal / WebGPU content (graphics-apis milestone territory)
- No Unreal / Unity / Godot engine content
- No new HLSL / MSL / CUDA / OpenCL (scope kept narrow)
- Ray tracing stays in graphics-apis
- WebGPU continues to be a forward-reference only

This milestone is about **wiring the research into the substrate** — not adding new research.
