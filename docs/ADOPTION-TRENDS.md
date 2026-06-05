# Adoption Trends

> **Auto-generated** by `tools/adoption-trends.mjs` from `docs/ADOPTION-BASELINE-v*.json`. Run `node tools/adoption-trends.mjs --write` to refresh.

**Snapshots considered:** 30 (`v1.49.787` → `v1.49.980`)
**Shelfware threshold:** 6 consecutive non-living snapshots (override via `SC_ADOPTION_STALE_SHIPS`)
**New-module watch window:** last 10 snapshots (override via `SC_NEW_MODULE_WATCH_SHIPS`)

## Population summary

| version | total | living | test-only | isolated | allowlisted |
|---|---|---|---|---|---|
| v1.49.787 | 153 | 91 | 52 | 10 | 10 |
| v1.49.789 | 153 | 92 | 51 | 10 | 10 |
| v1.49.790 | 153 | 92 | 51 | 10 | 10 |
| v1.49.791 | 153 | 92 | 51 | 10 | 12 |
| v1.49.792 | 153 | 93 | 50 | 10 | 12 |
| v1.49.793 | 153 | 95 | 48 | 10 | 12 |
| v1.49.794 | 153 | 95 | 48 | 10 | 12 |
| v1.49.795 | 153 | 96 | 47 | 10 | 12 |
| v1.49.796 | 153 | 96 | 47 | 10 | 12 |
| v1.49.797 | 153 | 96 | 47 | 10 | 12 |
| v1.49.798 | 153 | 96 | 47 | 10 | 12 |
| v1.49.799 | 153 | 96 | 47 | 10 | 12 |
| v1.49.800 | 153 | 96 | 47 | 10 | 12 |
| v1.49.801 | 153 | 96 | 47 | 10 | 12 |
| v1.49.965 | 154 | 98 | 46 | 10 | 12 |
| v1.49.966 | 154 | 98 | 46 | 10 | 12 |
| v1.49.967 | 154 | 98 | 46 | 10 | 12 |
| v1.49.968 | 154 | 98 | 46 | 10 | 12 |
| v1.49.969 | 154 | 98 | 46 | 10 | 12 |
| v1.49.970 | 154 | 98 | 46 | 10 | 12 |
| v1.49.971 | 154 | 98 | 46 | 10 | 12 |
| v1.49.972 | 153 | 98 | 45 | 10 | 20 |
| v1.49.973 | 153 | 98 | 45 | 10 | 20 |
| v1.49.974 | 153 | 98 | 45 | 10 | 20 |
| v1.49.975 | 153 | 98 | 45 | 10 | 20 |
| v1.49.976 | 153 | 98 | 45 | 10 | 20 |
| v1.49.977 | 153 | 98 | 45 | 10 | 20 |
| v1.49.978 | 151 | 98 | 45 | 8 | 32 |
| v1.49.979 | 151 | 98 | 45 | 8 | 29 |
| v1.49.980 | 151 | 98 | 45 | 8 | 29 |

## Status changes

7 status transition(s) across the window. Most recent first.

| module | transition | at version | note |
|---|---|---|---|
| `predictive-skill-loader` | test-only → living | v1.49.965 | ✓ adoption |
| `stochastic` | test-only → living | v1.49.965 | ✓ adoption |
| `bounded-learning` | test-only → living | v1.49.795 | ✓ adoption |
| `coherent-functors` | test-only → living | v1.49.793 | ✓ adoption |
| `hourglass-persistence` | test-only → living | v1.49.793 | ✓ adoption |
| `koopman-memory` | test-only → living | v1.49.792 | ✓ adoption |
| `semantic-channel` | test-only → living | v1.49.789 | ✓ adoption |

## Persistent shelfware watch

39 module(s) with ≥6 consecutive non-living snapshots. Operator action: wire a real caller, allowlist with reason, or retire.

| module | consecutive non-living | current status | non-living since |
|---|---|---|---|
| `activation-steering` | 6 | test-only | v1.49.975 |
| `agc` | 6 | test-only | v1.49.975 |
| `alternative-discoverer` | 6 | test-only | v1.49.975 |
| `aminet` | 6 | test-only | v1.49.975 |
| `artifactnet-provenance` | 6 | test-only | v1.49.975 |
| `bounded-learning-empirical` | 6 | test-only | v1.49.975 |
| `brainstorm` | 6 | test-only | v1.49.975 |
| `catalog` | 6 | test-only | v1.49.975 |
| `citations` | 6 | test-only | v1.49.975 |
| `cloud-ops` | 6 | test-only | v1.49.975 |
| `code-absorber` | 6 | test-only | v1.49.975 |
| `compression-spectrum` | 6 | test-only | v1.49.975 |
| `convergent` | 6 | test-only | v1.49.975 |
| `dependency-resolver` | 6 | test-only | v1.49.975 |
| `experience-compression` | 6 | test-only | v1.49.975 |
| `fl-threat-model` | 6 | test-only | v1.49.975 |
| `hardware-infrastructure` | 6 | test-only | v1.49.975 |
| `heuristics-free-skill-space` | 6 | test-only | v1.49.975 |
| `hooks` | 6 | test-only | v1.49.975 |
| `intrinsic-telemetry` | 6 | test-only | v1.49.966 |
| `knowledge` | 6 | test-only | v1.49.975 |
| `launcher` | 6 | test-only | v1.49.975 |
| `mcp-defense` | 6 | test-only | v1.49.975 |
| `mission-world-model` | 6 | test-only | v1.49.975 |
| `promptcluster-batcheffect` | 6 | test-only | v1.49.975 |
| `random` | 6 | test-only | v1.49.975 |
| `reasoning-graphs` | 6 | test-only | v1.49.975 |
| `rumor-delay-model` | 6 | test-only | v1.49.975 |
| `runtime-hal` | 6 | test-only | v1.49.975 |
| `scribe` | 6 | test-only | v1.49.975 |
| `sigreg` | 6 | test-only | v1.49.975 |
| `skill-creator` | 6 | test-only | v1.49.975 |
| `skilldex-auditor` | 6 | test-only | v1.49.975 |
| `spatial-awareness` | 6 | test-only | v1.49.975 |
| `stackelberg-pricing` | 6 | test-only | v1.49.975 |
| `token-budget` | 6 | test-only | v1.49.975 |
| `trust-tiers` | 6 | test-only | v1.49.975 |
| `utils` | 6 | test-only | v1.49.975 |
| `vtm` | 6 | test-only | v1.49.975 |

## New-module watch

_No new modules first observed in the last 10 snapshots._

---

_Per AUDIT-2026-05-26 strengthening lever S2._ Closes the open lever from the 2026-05-26 audit retrospective.
