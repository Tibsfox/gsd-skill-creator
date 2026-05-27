# Adoption Trends

> **Auto-generated** by `tools/adoption-trends.mjs` from `docs/ADOPTION-BASELINE-v*.json`. Run `node tools/adoption-trends.mjs --write` to refresh.

**Snapshots considered:** 14 (`v1.49.787` → `v1.49.801`)
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

## Status changes

5 status transition(s) across the window. Most recent first.

| module | transition | at version | note |
|---|---|---|---|
| `bounded-learning` | test-only → living | v1.49.795 | ✓ adoption |
| `coherent-functors` | test-only → living | v1.49.793 | ✓ adoption |
| `hourglass-persistence` | test-only → living | v1.49.793 | ✓ adoption |
| `koopman-memory` | test-only → living | v1.49.792 | ✓ adoption |
| `semantic-channel` | test-only → living | v1.49.789 | ✓ adoption |

## Persistent shelfware watch

45 module(s) with ≥6 consecutive non-living snapshots. Operator action: wire a real caller, allowlist with reason, or retire.

| module | consecutive non-living | current status | non-living since |
|---|---|---|---|
| `activation-steering` | 6 | test-only | v1.49.796 |
| `agc` | 6 | test-only | v1.49.796 |
| `alternative-discoverer` | 6 | test-only | v1.49.796 |
| `aminet` | 6 | test-only | v1.49.796 |
| `artifactnet-provenance` | 6 | test-only | v1.49.796 |
| `bounded-learning-empirical` | 6 | test-only | v1.49.796 |
| `brainstorm` | 6 | test-only | v1.49.796 |
| `catalog` | 6 | test-only | v1.49.796 |
| `citations` | 6 | test-only | v1.49.796 |
| `cloud-ops` | 6 | test-only | v1.49.796 |
| `code-absorber` | 6 | test-only | v1.49.796 |
| `compression-spectrum` | 6 | test-only | v1.49.796 |
| `convergent` | 6 | test-only | v1.49.796 |
| `dead-zone` | 6 | test-only | v1.49.796 |
| `dependency-resolver` | 6 | test-only | v1.49.796 |
| `eligibility` | 6 | test-only | v1.49.796 |
| `experience-compression` | 6 | test-only | v1.49.796 |
| `fl-threat-model` | 6 | test-only | v1.49.796 |
| `hardware-infrastructure` | 6 | test-only | v1.49.796 |
| `heuristics-free-skill-space` | 6 | test-only | v1.49.796 |
| `hooks` | 6 | test-only | v1.49.796 |
| `intrinsic-telemetry` | 6 | test-only | v1.49.796 |
| `knowledge` | 6 | test-only | v1.49.796 |
| `langevin` | 6 | test-only | v1.49.796 |
| `launcher` | 6 | test-only | v1.49.796 |
| `learnable-k_h` | 6 | test-only | v1.49.796 |
| `mcp-defense` | 6 | test-only | v1.49.796 |
| `mission-world-model` | 6 | test-only | v1.49.796 |
| `predictive-skill-loader` | 6 | test-only | v1.49.796 |
| `promptcluster-batcheffect` | 6 | test-only | v1.49.796 |
| `random` | 6 | test-only | v1.49.796 |
| `reasoning-graphs` | 6 | test-only | v1.49.796 |
| `rumor-delay-model` | 6 | test-only | v1.49.796 |
| `runtime-hal` | 6 | test-only | v1.49.796 |
| `scribe` | 6 | test-only | v1.49.796 |
| `sigreg` | 6 | test-only | v1.49.796 |
| `skill-creator` | 6 | test-only | v1.49.796 |
| `skilldex-auditor` | 6 | test-only | v1.49.796 |
| `spatial-awareness` | 6 | test-only | v1.49.796 |
| `stackelberg-pricing` | 6 | test-only | v1.49.796 |
| `stochastic` | 6 | test-only | v1.49.796 |
| `temperature` | 6 | test-only | v1.49.796 |
| `trust-tiers` | 6 | test-only | v1.49.796 |
| `utils` | 6 | test-only | v1.49.796 |
| `vtm` | 6 | test-only | v1.49.796 |

## New-module watch

_No new modules first observed in the last 10 snapshots._

---

_Per AUDIT-2026-05-26 strengthening lever S2._ Closes the open lever from the 2026-05-26 audit retrospective.
