# PNW Millwork Co-op Network — Milestone Specification

**Date:** 2026-03-26
**Vision Document:** 01-vision-doc.md
**Research Reference:** 02-research-reference.md
**Estimated Execution:** ~8 context windows across ~3 sessions

---

## Mission Objective

Produce a complete, ready-to-execute formation package for a federated worker co-op millwork network along the I-5 corridor, modeled on Synsor Corporation's documented production methodology. Done looks like: a filing-ready RCW 23.86 co-op structure, a Node North founding spec, a production ops playbook, a client acquisition strategy with named targets, a supply chain map, and a workforce pipeline design — packaged for presentation to NWCDC and potential founding worker-owners.

## Architecture Overview

```
[Wave 0: Shared Types]
  ├── entity-schemas.md (node profile, BOM standard, contract template)
  └── legal-compliance-checklist.md (RCW 23.86, FSC, OSHA)
           │
    ┌──────┴──────┐
    ▼             ▼
[Wave 1A]     [Wave 1B]
Node North    Network Legal
Founding      Federation
Spec          Structure
    │             │
    ▼             ▼
[Wave 1C]     [Wave 1D]
Production    Client
Ops Playbook  Pipeline
    │             │
    ▼             ▼
[Wave 1E]
Supply Chain + Workforce Pipeline
    │
    ▼
[Wave 2: Integration]
Full Network Design Document
    │
    ▼
[Wave 3: Verification]
Quality Gates + NWCDC Presentation Package
```

### System Layers
1. **Foundation** — shared schemas, legal compliance baseline, RCW 23.86 filing checklist
2. **Core Components** — node spec, legal structure, production playbook, client pipeline, supply chain, workforce
3. **Integration** — federated network design assembling all components into a coherent whole
4. **Verification** — audit against success criteria, NWCDC-ready presentation package

## Deliverables

| # | Deliverable | Acceptance Criteria | Component Spec |
|---|-------------|--------------------|--------------:|
| 0 | Shared schemas + compliance checklist | All downstream components reference these; no conflicts | components/00-shared-types.md |
| 1 | Node North founding spec | Location, cohort profile, capitalization pathway, equipment list | components/01-anchor-node.md |
| 2 | Federation legal structure | RCW 23.86 compliant; acquisition-protection bylaws; federation agreement template | components/02-network-legal.md |
| 3 | Production ops playbook | BOM-first methodology, CNC workflow, AWI grade compliance, lean scheduling | components/03-production-model.md |
| 4 | Client pipeline strategy | 3+ named targets, warm outreach templates, SOW response template | components/04-client-pipeline.md |
| 5 | Supply chain map | Primary/backup suppliers for all material categories, FSC pathway | components/05-supply-chain.md |
| 6 | Workforce pipeline design | Sno-Isle partnership outline, apprenticeship structure, equity accrual model | components/06-workforce-pipeline.md |
| 7 | Integration + verification | Network design doc, quality gates, NWCDC presentation package | components/07-verification.md |

## Component Breakdown

| # | Component | Wave | Track | Model | Est. Tokens | Depends On |
|---|-----------|------|-------|-------|-------------|------------|
| 0 | Shared Types + Compliance | 0 | — | Haiku | ~6K | None |
| 1 | Node North Anchor | 1 | A | Sonnet | ~20K | #0 |
| 2 | Network Legal | 1 | B | Opus | ~22K | #0 |
| 3 | Production Ops Playbook | 1 | A | Sonnet | ~24K | #0, #1 |
| 4 | Client Pipeline | 1 | B | Sonnet | ~18K | #0 |
| 5 | Supply Chain | 1 | C | Sonnet | ~16K | #0 |
| 6 | Workforce Pipeline | 1 | C | Sonnet | ~18K | #0, #1 |
| 7 | Integration + Verification | 2 | — | Opus | ~28K | All |

**Model split:** ~25% Opus (legal architecture + final integration), ~65% Sonnet (core components), ~10% Haiku (scaffolding)

## Activation Profile

**Profile:** Squadron (12 roles, 3 parallel tracks)

| Role | Agent | Wave Presence |
|------|-------|--------------|
| FLIGHT | Orchestrator | All waves |
| PLAN | Planner | Wave 0–1 |
| LEGAL | Legal/Governance Agent | Wave 1B, 2 |
| OPS | Production Engineering Agent | Wave 1A, 2 |
| BIZ-DEV | Client Acquisition Agent | Wave 1B, 2 |
| SUPPLY | Supply Chain Agent | Wave 1C, 2 |
| WORKFORCE | Training/Apprenticeship Agent | Wave 1C, 2 |
| VERIFY | Verification Agent | Wave 2, 3 |
| CAPCOM | HITL Interface | Go/No-Go gates |

## Constraints
- All legal structures must comply with current RCW 23.86 (Washington co-op statute); verify against current Secretary of State guidance
- Production methodology must reference current AWI Quality Standards (current edition)
- FSC certification pathway must be mapped before client pipeline is finalized — clients require it
- Worker equity must be non-transferable to non-workers by bylaw — this is the acquisition protection; it is non-negotiable
- No component may assume funding has been secured — all capitalization references must include pathways and contingencies

## Pre-Computed Knowledge Tiers

| Tier | Content | Size | Loading Strategy |
|------|---------|------|-----------------|
| Summary | Network overview, vision one-pager | ~2K | Always loaded |
| Active | Current component spec + research section | ~12K | On demand |
| Reference | Full research reference doc | ~25K | Deep dives only |
