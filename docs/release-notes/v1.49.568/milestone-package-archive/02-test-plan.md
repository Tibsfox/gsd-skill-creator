# Test Plan — Nonlinear Systems, Clouds, Open Frontier Milestone

**Total tests:** 34 new.
**Categories:** 6 Safety-critical / 16 Core / 8 Integration / 4 Edge.
**Baseline:** 21,948 existing `npm test` count; no regression.

## Safety-Critical (6, BLOCK on fail)

| ID | Verifies | Expected |
|----|----------|----------|
| SC-MILE-01 | No regression in existing test suite | `npm test` count ≥ 21,948 after each phase |
| SC-MILE-02 | No undeclared exports from concept files | Every `export const` has a TypeScript interface |
| SC-MILE-03 | FTP sync atomicity (no partial files) | Post-sync byte-for-byte check matches local source |
| SC-MILE-04 | `publish-pipeline` preserves citations | Every inline citation in FINAL.md survives to HTML |
| SC-MILE-05 | `erdos-refresh.py` dry-run is idempotent | Two consecutive dry-runs produce identical diff |
| SC-MILE-06 | Sim flags default OFF | `featureFlags.microphysics === false`, `featureFlags.k41Turbulence === false` unless explicitly set |

## Core Functional (16)

### Concept panels (19 tests, one per concept)

Each test verifies:
- Concept ID matches `<dept>-<name>` convention
- Has ≥ 2 relationships
- `complexPlanePosition` is well-formed (real²+imag² = magnitude²; angle in [-π, π])
- Registered in department (queryable via department.ts)

| ID | Concept | Dept |
|----|---------|------|
| CF-CONC-01 | solitons | math |
| CF-CONC-02 | blow-up-dynamics | math |
| CF-CONC-03 | scale-critical-equations | math |
| CF-CONC-04 | reynolds-similarity | phys |
| CF-CONC-05 | vorticity-stretching | phys |
| CF-CONC-06 | k41-cascade | phys |
| CF-CONC-07 | clausius-clapeyron | chem |
| CF-CONC-08 | kohler-theory | chem |
| CF-CONC-09 | wbf-mixed-phase | materials |
| CF-CONC-10 | ice-nucleation-modes | materials |
| CF-CONC-11 | aerosol-indirect-erf | env |
| CF-CONC-12 | wmo-cloud-taxonomy | env |
| CF-CONC-13 | primitive-equations | phys |
| CF-CONC-14 | data-assimilation-4dvar | ds |
| CF-CONC-15 | lorenz-predictability-limit | adapt-sys |
| CF-CONC-16 | ai-weather-pipeline | ds |

**Note:** 3 more concepts (erdos-problem-index, ai-verified-proof, millennium-problem-catalogue) fold into CF-INT tests below.

## Integration (8)

| ID | Verifies | Expected |
|----|----------|----------|
| IN-MILE-01 | Forest sim + Köhler | Given supersaturation sweep 0.1% → 2.0%, activation curve matches Lohmann 2016 textbook within 5% |
| IN-MILE-02 | Forest sim + K41 | Sub-grid TKE dissipation rate scales as ε^(2/3) within fit tolerance |
| IN-MILE-03 | Forest sim + both flags | 100-step run with both on produces no NaN / no divergence |
| IN-MILE-04 | Concept cross-refs resolve | Every `targetId` in a concept's relationships resolves to a concept registered in SOME department |
| IN-MILE-05 | Published pages render | All 4 new tibsfox.com pages return 200 and contain their expected headings |
| IN-MILE-06 | ERDOS-TRACKER format stable | `erdos-refresh.py` updates fields without breaking markdown table structure |
| IN-MILE-07 | #143 page links to #1196 | Page has hyperlink to #1196 write-up + M6 source |
| IN-MILE-08 | Concept bundles query | `math-erdos-problem-index`, `ai-verified-proof`, `millennium-problem-catalogue` all reachable via their department.ts concept queries |

## Edge Cases (4, LOG on fail)

| ID | Verifies | Expected |
|----|----------|----------|
| EC-MILE-01 | Köhler at T = 0°C (freezing boundary) | Activation returns sensible result, no div-by-zero |
| EC-MILE-02 | K41 at vanishing ε | Fallback to laminar scaling, no negative viscosity |
| EC-MILE-03 | `erdos-refresh.py` offline | Dry-run succeeds with warning; no data corruption |
| EC-MILE-04 | Concept id collision protection | Adding a new concept with duplicate id raises test failure |

## Verification Matrix

| Success Criterion | Test IDs | Status |
|-------------------|----------|--------|
| 1. All concept panels pass tests | CF-CONC-01..16 + IN-MILE-08 | Pending |
| 2. Concepts appear in DEPARTMENT.md tables | CF-CONC-01..16 | Pending |
| 3. 4 web pages live | IN-MILE-05 | Pending |
| 4. Köhler within 5% of Lohmann 2016 | IN-MILE-01 | Pending |
| 5. K41 ε^(2/3) scaling verified | IN-MILE-02 | Pending |
| 6. erdos-refresh.py <60s + idempotent | SC-MILE-05 | Pending |
| 7. #143 elevation write-up published | IN-MILE-07 | Pending |
| 8. No regression (≥21,948 tests) | SC-MILE-01 | Pending |
| 9. ERDOS-TRACKER last_refresh field | SC-MILE-05 + IN-MILE-06 | Pending |
| 10. Every deliverable backed by test | (audit all IDs map to D1-D7) | Pending |
| 11. publish-log.md captured | SC-MILE-04 | Pending |
| 12. Safety gates preserved | SC-MILE-04 | Pending |

## Execution Cadence

- W0 runs SC-MILE-01 pre-flight (baseline snapshot)
- W1 Track A runs CF-CONC-01..16 as each sub-phase completes
- W1 Track B runs IN-MILE-05 + SC-MILE-03 + SC-MILE-04 after FTP
- W2 runs IN-MILE-01..03, EC-MILE-01..02 after each sim sub-phase
- W3 runs SC-MILE-05, SC-MILE-06, IN-MILE-06..08, EC-MILE-03..04 at end; final SC-MILE-01 re-check
