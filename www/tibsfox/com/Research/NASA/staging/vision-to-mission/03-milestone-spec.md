# NASA Mission Series — Milestone Specification

**Date:** 2026-03-29
**Vision Document:** 01-vision-doc.md
**Research Reference:** 02-research-reference.md
**Estimated Execution:** ~73 releases across the full NASA catalog, each release ~8-12 context windows across ~3 sessions, total series estimated 200+ sessions over months of wall-clock time

---

## Mission Objective

Build a complete, iteratively-refined knowledge base by traversing every NASA mission in chronological order on a dedicated `nasa` branch of gsd-skill-creator, starting at v1.0. Each mission passes through a seven-part pipeline (A: History, B: Science, C: Education, D: Engineering, E: Simulation, F: Operations, G: Refinement, H: Dataset Integration), producing educational materials, skills, agents, teams, and chipsets that compound in quality across the full run. "Done" means: a developer clones the repo, checks out the nasa branch, and finds a comprehensive, indexed, self-teaching knowledge base covering 68 years of NASA missions with working integrations to public NASA datasets, ready to use immediately.

## Architecture Overview

```
SYSTEM ARCHITECTURE — THREE-TIER
===================================

┌─────────────────────────────────────────────┐
│         TIER 1: ORCHESTRATION               │
│                                             │
│  Mission Catalog    Release Cadence  Sync   │
│  Index (00)         Engine (04)      (09)   │
│                                             │
│  Branch Infra (01)  Retro System (05)       │
└──────────────────────┬──────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────┐
│         TIER 2: PER-MISSION PIPELINE        │
│                                             │
│  Pipeline Executor (03)                     │
│    Parts A → B → C/D/E/F → G → H           │
│                                             │
│  Skill/Agent/Team Factory (06)              │
│  NASA Dataset Integration (07)              │
│  Educational Output Generator (08)          │
└──────────────────────┬──────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────┐
│         TIER 3: SAFETY & VERIFICATION       │
│                                             │
│  Safety Warden (10)                         │
│  Integration & Verification (11)            │
└─────────────────────────────────────────────┘
```

### System Layers

1. **Orchestration Layer** — Mission catalog indexing, branch infrastructure, release cadence management, main branch sync, retrospective system
2. **Pipeline Layer** — Per-mission seven-part pipeline execution, skill/agent/team/chipset factory, NASA dataset integration, educational output generation
3. **Safety & Verification Layer** — Safety Warden enforcement, cross-release integration testing, factual accuracy verification

## Deliverables

| # | Deliverable | Acceptance Criteria | Component Spec |
|---|-------------|--------------------|--------------:|
| 1 | Branch infrastructure | nasa branch created from main; push.default=nothing; .github/workflows configured | components/01-branch-infrastructure.md |
| 2 | Mission catalog index | All ~73 missions indexed with metadata; JSON schema validated; chronological order verified | components/02-mission-catalog-index.md |
| 3 | Per-mission pipeline executor | Parts A-H execute in correct order; each part produces required artifacts; CAPCOM gates enforced | components/03-per-mission-pipeline.md |
| 4 | Release cadence engine | Version bump, release notes, tag, push, sync cycle operational | components/04-release-cadence-engine.md |
| 5 | Retrospective system | 8-pass refinement; lessons forward-linked; template improvement tracking | components/05-retrospective-system.md |
| 6 | Skill/agent/team/chipset factory | New skills generated from mission content; iterative improvement from retrospectives | components/06-skill-agent-team-factory.md |
| 7 | NASA dataset integration | Part H working for at least one mission; API connectors for JPL Horizons, PDS, NTRS | components/07-nasa-dataset-integration.md |
| 8 | Educational output generator | TRY Sessions, DIY projects, study guides produced per mission; College of Knowledge format | components/08-educational-output-generator.md |
| 9 | Upstream sync engine | Main branch merge after each release; conflict resolution documented | components/09-upstream-sync-engine.md |
| 10 | Safety Warden | All disaster narratives verified; biosignature boundaries enforced; BLOCK authority active | components/10-safety-warden.md |
| 11 | Integration & verification | Cross-release consistency; catalog completeness; end-to-end smoke test | components/11-integration-verification.md |

## Component Breakdown

| # | Component | Wave | Track | Model | Est. Tokens | Depends On |
|---|-----------|------|-------|-------|-------------|------------|
| 0 | Shared Types & Schemas | 0 | — | Haiku | ~8K | None |
| 1 | Branch Infrastructure | 0 | — | Haiku | ~6K | None |
| 2 | Mission Catalog Index | 1 | A | Sonnet | ~25K | #0 |
| 3 | Per-Mission Pipeline | 1 | B | Opus | ~40K | #0 |
| 4 | Release Cadence Engine | 1 | A | Sonnet | ~20K | #0, #1 |
| 5 | Retrospective System | 1 | B | Opus | ~30K | #0 |
| 6 | Skill/Agent/Team Factory | 2 | A | Opus | ~35K | #3, #5 |
| 7 | NASA Dataset Integration | 2 | B | Sonnet | ~30K | #0, #2 |
| 8 | Educational Output Generator | 2 | A | Sonnet | ~25K | #3 |
| 9 | Upstream Sync Engine | 2 | B | Sonnet | ~15K | #1, #4 |
| 10 | Safety Warden | 3 | — | Opus | ~25K | All prior |
| 11 | Integration & Verification | 3 | — | Sonnet | ~20K | All prior |

## Activation Profile

**Profile:** Fleet (17 roles, 11 components, 3+ parallel tracks)

| Role | Agent | Wave Presence |
|------|-------|--------------|
| FLIGHT | RAVEN | All waves; synthesis; go/no-go gates |
| CAPCOM | FOXGLOVE | Go/No-Go gates; HITL interface |
| PLAN | SALMON | Waves 0–1; dependency optimization |
| SCOUT | OSPREY | Wave 1; source gathering; gap research |
| EXEC-HISTORY | CEDAR | Wave 1B pipeline; Parts A+B |
| EXEC-EDU | HEMLOCK | Wave 2A pipeline; Part C |
| EXEC-ENG | DOUGLAS-FIR | Wave 2A pipeline; Part D |
| EXEC-SIM | ALDER | Wave 2A pipeline; Part E |
| EXEC-OPS | MADRONE | Wave 2A pipeline; Part F |
| RETRO | HERON | Wave 2B; Part G refinement |
| DATA | ORCA | Wave 2B; Part H dataset integration |
| CRAFT-MATH | ELK | Waves 1-2; mathematical content |
| VERIFY | HAWK | Wave 3; all verification |
| SAFETY-WARDEN | OWL | Wave 3; BLOCK authority |
| FACTORY | WOLF | Wave 2A; skill/agent/team generation |
| RELEASE | WREN | Wave 2B; git operations; release notes |
| BUDGET | MARTEN | All waves; token tracking |

## Constraints

- **push.default=nothing** — mandatory staging discipline on nasa branch
- **Safety Warden cannot be bypassed** — BLOCK authority is absolute
- **Main sync after every release** — no exceptions; conflicts documented
- **Retrospective before next release** — lessons must be generated and linked forward
- **Government/peer sources only** — no blogs, entertainment media, or unsourced claims
- **Verbosity over speed** — this takes as much wall-clock time as needed
- **Each Part self-contained** — an agent executing Part D needs only the Part D spec and Part B output; never "see the other parts"
- **Real parameters or marked representative** — no unmarked approximations in engineering content

## Pre-Computed Knowledge Tiers

| Tier | Content | Size | Loading Strategy |
|------|---------|------|-----------------|
| Summary | Mission catalog index (names, dates, types) | ~3K | Always loaded in every context |
| Active | Current mission Parts A-B output + previous retrospective | ~15K | Loaded at start of each release cycle |
| Reference | Research mission pack templates (Parts D, F, G) | ~25K each | Loaded on demand when Part begins |
| Deep | Full prior release chain (retrospectives) | ~50K+ | Progressive loading; most recent 3 releases |
