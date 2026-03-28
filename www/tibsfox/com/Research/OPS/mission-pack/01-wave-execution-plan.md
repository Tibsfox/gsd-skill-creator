# GSD OpenStack Cloud Platform (NASA SE Edition) — Wave Execution Plan

**Total Tasks:** 15 | **Parallel Tracks:** 3 | **Sequential Depth:** 6 waves  
**Estimated Wall Time:** ~18 hours (down from ~45 sequential)  
**Critical Path:** 12 sequential sessions (Waves 0→1→2→3→4→5)

## Wave Summary

| Wave | Tasks | Parallel Tracks | Est. Time | Cache Dependencies |
|------|-------|----------------|-----------|-------------------|
| 0 | 2 | 1 (sequential) | ~1.5 hrs | None — foundation |
| 1 | 3 | 3 (parallel) | ~3 hrs | Wave 0 shared types + NASA reference |
| 2 | 3 | 3 (parallel) | ~2.5 hrs | Wave 0 + Wave 1 skills |
| 3 | 3 | 3 (parallel) | ~4 hrs | Wave 2 crew configs + chipset |
| 4 | 2 | 2 (parallel) | ~3 hrs | Wave 3 docs + running system |
| 5 | 2 | 1 (sequential) | ~4 hrs | All prior waves |

## Wave 0: Foundation (Sequential)

Shared types, NASA SE methodology skill, and chipset definition. Must complete within first session to establish cache for all downstream consumers.

| Task | Description | Produces | Model | Est. Tokens |
|------|------------|----------|-------|-------------|
| 0.1 | Shared TypeScript interfaces, NASA SE phase definitions, communication loop schemas, requirement/runbook types | `types/*.ts`, `schemas/*.yaml` | Sonnet | ~8K |
| 0.2 | NASA SE Methodology skill — the process mapping that all documentation skills and crews depend on | `skills/methodology/nasa-se/SKILL.md` | Opus | ~12K |

**Cache note:** Wave 0 artifacts are consumed by every subsequent wave. Keep total under 20K tokens to maximize TTL coverage.

## Wave 1: Skills (Parallel — 3 Tracks)

All three tracks consume Wave 0 shared types and NASA SE skill. Tracks are independent — no cross-track dependencies.

### Track A: OpenStack Core Skills

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|-----------|
| 1A | 8 core OpenStack service skills (keystone, nova, neutron, cinder, glance, swift, heat, horizon) + kolla-ansible deployment skill. Each skill: SKILL.md with deploy/configure/operate/troubleshoot sections | `skills/openstack/{service}/SKILL.md` ×9 | Sonnet | ~40K | Wave 0 types |

### Track B: Operations Skills

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|-----------|
| 1B | 6 operations skills (monitoring, backup, security, networking-debug, capacity, kolla-ansible-ops). Each: SKILL.md with operational procedures and integration points | `skills/openstack/{ops}/SKILL.md` ×6 | Sonnet | ~25K | Wave 0 types |

### Track C: Documentation Skills

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|-----------|
| 1C | 3 documentation skills (ops-manual-writer, runbook-generator, doc-verifier) + NASA SE methodology extensions for cloud ops. Each: SKILL.md with templates, format standards, verification methods | `skills/methodology/{skill}/SKILL.md` ×3 | Opus | ~20K | Wave 0 NASA SE skill |

## Wave 2: Crew Configurations & Chipset (Parallel — 3 Tracks)

Crews consume skills from Wave 1. Chipset integrates everything. Tracks can proceed in parallel because each crew definition is self-contained once its skills exist.

### Track A: Deployment & Operations Crews

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|-----------|
| 2A | Deployment crew (12 roles) + Operations crew (8 roles). Role activation patterns, communication loop assignments, skill loadouts per role | `configs/deployment-crew.yaml`, `configs/operations-crew.yaml` | Opus | ~15K | Wave 1A + 1B skills |

### Track B: Documentation Crew & Communication Framework

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|-----------|
| 2B | Documentation crew (8 roles) + all 9 communication loops with priority arbitration, message schemas, and routing rules | `configs/documentation-crew.yaml`, `configs/communication-loops.yaml`, `.planning/bus/*` | Opus | ~15K | Wave 1C skills |

### Track C: Chipset Definition

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|-----------|
| 2C | Complete ASIC chipset.yaml integrating all skills, all crew configs, all activation profiles (scout/patrol/squadron), evaluation gates | `.chipset/chipset.yaml` | Opus | ~12K | Wave 1 all tracks (skill names + configs) |

## Wave 3: Documentation Production (Parallel — 3 Tracks)

The three major documentation deliverables produced in parallel. Each track has its own EXEC agents from the documentation crew.

### Track A: Systems Administrator's Guide

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|-----------|
| 3A | 7-chapter guide following NASA SE phases (Pre-Phase A through Phase F). Each chapter: narrative + procedures + cross-references to SP-6105 and NPR 7123.1. Includes ConOps, trade studies, design decisions, deployment procedures, verification plan, operations guide, closeout | `docs/sysadmin-guide/*.md` ×8 | Opus | ~60K | Wave 2 all (chipset + crews define the deployment this documents) |

### Track B: Operations Manual

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|-----------|
| 3B | Per-service operations procedures following NASA procedure format. Each service: daily ops, maintenance, troubleshooting, upgrade procedures. Procedure format per NASA-STD adapted in reference doc | `docs/operations-manual/{service}-procedures.md` ×8 | Sonnet | ~45K | Wave 1A skills (service-specific knowledge) |

### Track C: Runbook Library + Reference Library

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|-----------|
| 3C.1 | Runbook library: task-indexed + symptom-indexed. Standard format per entry. Minimum 40 runbooks covering deploy, operate, monitor, and incident response | `docs/runbooks/*.md` ×40+ | Sonnet | ~35K | Wave 1A + 1B skills |
| 3C.2 | Reference library: 3-tier structure. NASA SE mapping guide, cross-cloud translation tables, quick reference card. External doc links archived | `docs/reference/*.md` ×4 | Haiku | ~10K | Reference doc (already written) |

## Wave 4: Verification & Dashboard (Parallel — 2 Tracks)

V&V plan maps every requirement to tests. Dashboard integrates cloud ops monitoring into GSD-OS.

### Track A: V&V Plan and Compliance Matrix

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|-----------|
| 4A | Requirements Verification Matrix (every requirement → verification method → test → status). Compliance matrix (NPR 7123.1 Appendix H format — every tailoring decision documented). Validation plan for stakeholder acceptance | `docs/vv/*.md`, `docs/compliance-matrix.md` | Sonnet | ~20K | Wave 3A (requirements defined in sysadmin guide) |

### Track B: Dashboard Console Integration

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|-----------|
| 4B | GSD-OS dashboard panel for cloud operations: service status, health metrics, alert feed. Documentation console: browse sysadmin guide, ops manual, runbooks within GSD-OS. Doc verification status display | `dashboard/cloud-ops-panel.ts`, `dashboard/documentation-console.ts` | Sonnet | ~15K | Wave 2C (chipset), Wave 3 all (docs to display) |

## Wave 5: Integration, Verification & Retrospective (Sequential)

Final wave must be sequential — integration testing, documentation verification against running system, and lessons learned capture all depend on complete system state.

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|-----------|
| 5.1 | Integration verification: deploy OpenStack using the skills + crews + chipset, run V&V plan against running system, verify all docs against live infrastructure, execute doc-sync loop, update RVM with results | Updated V&V report, verified operations manual, verified runbooks | Sonnet | ~15K | All prior waves + running OpenStack instance |
| 5.2 | Lessons learned + final mission report: RETRO agent analysis of mission execution, ANALYST pattern review for skill-creator promotion candidates, PAO mission narrative, updated README | `docs/lessons-learned.md`, `README.md` | Opus | ~8K | Wave 5.1 (can't write retrospective before mission completes) |

## Cache Optimization Strategy

### Skill Loads Saved

| Optimization | Savings |
|---|---|
| NASA SE methodology skill loaded once in Wave 0, cached for all Wave 1C + Wave 2 + Wave 3 | ~12K tokens × 6 loads = ~72K saved |
| Shared types loaded once, consumed by all Wave 1 tracks | ~8K × 3 tracks = ~24K saved |
| Core OpenStack skills cached between Wave 1A and Wave 3B | ~40K cached for operations manual production |

### Schema Reuse

Wave 0 produces all shared interfaces. Every downstream wave references types from cache rather than regenerating. Estimated savings: ~15K tokens across all waves.

### Pre-Computed Knowledge Tiers

| Tier | Contents | Size | Used By |
|------|----------|------|---------|
| Summary | Cloud architecture overview, service quick reference, current phase status | ~6K | All agents, always loaded |
| Active | Current NASA SE phase mapping, active service procedures, current runbook context | ~20K | EXEC, CRAFT, VERIFY during their active phases |
| Reference | Full SP-6105 sections, complete OpenStack service documentation, cross-cloud tables | ~40K | SCOUT for research, CRAFT for deep troubleshooting |

### Token Budget Estimate

| Wave | Est. Tokens | Context Windows | Sessions |
|------|-------------|----------------|----------|
| Wave 0 | ~20K | 1 | 1 |
| Wave 1 | ~85K | 3 (parallel) | 2 |
| Wave 2 | ~42K | 3 (parallel) | 2 |
| Wave 3 | ~150K | 3 (parallel) | 3 |
| Wave 4 | ~35K | 2 (parallel) | 2 |
| Wave 5 | ~23K | 2 (sequential) | 2 |
| **Total** | **~355K** | **14** | **12** |

## Dependency Graph

```
Wave 0: Foundation
  ┌────────────────┐
  │ 0.1 Types      │
  │ 0.2 NASA SE    │
  └───────┬────────┘
          │
Wave 1: Skills (PARALLEL)
  ┌───────┴────────────────────────────────┐
  │           │              │             │
  ▼           ▼              ▼             │
┌──────┐  ┌──────┐  ┌──────────┐          │
│ 1A   │  │ 1B   │  │ 1C       │          │
│ Core │  │ Ops  │  │ Doc      │          │
│Skills│  │Skills│  │ Skills   │          │
└──┬───┘  └──┬───┘  └────┬─────┘          │
   │         │           │                │
Wave 2: Crews + Chipset (PARALLEL)         │
   │         │           │                │
   ▼         ▼           ▼                │
┌──────────────┐  ┌──────────────┐        │
│ 2A Deploy+   │  │ 2B Doc Crew  │        │
│ Ops Crews    │  │ + Comms      │        │
└──────┬───────┘  └──────┬───────┘        │
       │                 │                │
       │    ┌────────────┘                │
       │    │    ┌────────────────────────┘
       ▼    ▼    ▼
    ┌──────────────┐
    │ 2C Chipset   │  ◄── CRITICAL PATH NODE
    └──────┬───────┘
           │
Wave 3: Documentation (PARALLEL)
   ┌───────┼──────────────────┐
   ▼       ▼                  ▼
┌──────┐ ┌──────┐  ┌─────────────────┐
│ 3A   │ │ 3B   │  │ 3C.1 Runbooks   │
│SysAdm│ │OpsMnl│  │ 3C.2 RefLib     │
│Guide │ │      │  │                 │
└──┬───┘ └──┬───┘  └────┬────────────┘
   │        │           │
Wave 4: V&V + Dashboard (PARALLEL)
   │        │           │
   ▼        ▼           │
┌──────────────┐  ┌─────┴────────┐
│ 4A V&V Plan  │  │ 4B Dashboard │
│ + Compliance │  │ Console      │
└──────┬───────┘  └──────┬───────┘
       │                 │
Wave 5: Integration & Retrospective (SEQUENTIAL)
       │                 │
       ▼                 ▼
┌──────────────────────────────┐
│ 5.1 Integration Verification │  ◄── Requires running OpenStack
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ 5.2 Lessons Learned + README │  ◄── Final deliverable
└──────────────────────────────┘

CRITICAL PATH: 0.1 → 0.2 → 1A → 2C → 3A → 4A → 5.1 → 5.2
```
