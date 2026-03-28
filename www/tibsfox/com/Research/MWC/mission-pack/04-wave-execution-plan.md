# PNW Millwork Co-op Network — Wave Execution Plan

**Milestone:** PNW Millwork Co-op Network
**Total Waves:** 3
**Parallel Tracks:** 3 (Wave 1)
**Activation Profile:** Squadron

---

## Wave 0: Foundation (Sequential — Must complete < 5 min)

*Produces shared schemas and compliance baseline that all Wave 1 agents consume from cache.*

| Task | Description | Produces | Model | Est. Tokens |
|------|-------------|----------|-------|-------------|
| 0.1 | Entity and node schemas | entity-schemas in 00-shared-types.md | Haiku | ~3K |
| 0.2 | Legal + safety compliance checklist | compliance-checklist in 00-shared-types.md | Haiku | ~3K |

---

## Wave 1: Core Build (Parallel — 3 Tracks)

*All tracks start immediately after Wave 0. Track A, B, and C run simultaneously.*

### Track A: Physical Infrastructure
*Node North founding spec + production ops playbook.*

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 1A.1 | Node North location analysis, cohort profile, equipment list | components/01-anchor-node.md | Sonnet | ~20K | 0.1, 0.2 |
| 1A.2 | BOM-first production methodology, CNC workflow, AWI grade compliance, lean scheduling | components/03-production-model.md | Sonnet | ~24K | 0.1, 1A.1 |

### Track B: Legal + Commercial
*Federation legal structure + client acquisition pipeline.*

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 1B.1 | RCW 23.86 federation structure, bylaws with acquisition protection, inter-co-op agreement template | components/02-network-legal.md | Opus | ~22K | 0.1, 0.2 |
| 1B.2 | Named anchor client targets, warm outreach templates, SOW response template | components/04-client-pipeline.md | Sonnet | ~18K | 0.1, 0.2 |

### Track C: Supply + Workforce
*Materials supply chain + apprenticeship pipeline.*

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 1C.1 | Supplier map (Emerson, OrePac, Crosscut), FSC certification pathway, material specs | components/05-supply-chain.md | Sonnet | ~16K | 0.1, 0.2 |
| 1C.2 | Sno-Isle partnership outline, apprenticeship structure, FoxEdu integration, equity accrual | components/06-workforce-pipeline.md | Sonnet | ~18K | 0.1, 1A.1 |

---

## Wave 2: Integration + Verification (Sequential)

*Assembles all Wave 1 outputs into a coherent network design and verifies against success criteria.*

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|-------------|----------|-------|-------------|------------|
| 2.1 | Integrate all components into federated network design; identify gaps and conflicts | network-design-integrated.md (in 07-verification.md) | Opus | ~28K | All Wave 1 |
| 2.2 | Run all success criteria checks; produce NWCDC presentation package | verification-report.md + nwcdc-presentation.md (in 07-verification.md) | Sonnet | ~20K | 2.1 |

---

## Cache Optimization Strategy

### Skill Loads Saved
- `02-research-reference.md` loaded once in Wave 0 → cached for all 6 Wave 1 agents
- Entity schemas (00-shared-types.md) loaded once → consumed by all 6 Wave 1 agents

### Schema Reuse
- Node profile schema defined in Wave 0 → used by Track A (node spec) and Track C (workforce)
- BOM standard schema defined in Wave 0 → used by Track A (production), Track B (client SOW), Track C (supply chain)
- Legal compliance checklist defined in Wave 0 → used by Track B (legal), all verification checks

### Token Budget Estimate

| Wave | Est. Tokens | Context Windows | Sessions |
|------|-------------|-----------------|---------|
| 0 | ~6K | 1 | 1 |
| 1 (Track A) | ~44K | 2 parallel | 1 |
| 1 (Track B) | ~40K | 2 parallel | 1 |
| 1 (Track C) | ~34K | 2 parallel | 1 |
| 2 | ~48K | 2 sequential | 1 |
| **Total** | **~172K** | **~9** | **~3** |

---

## Dependency Graph

```
[Wave 0: Foundation]
   ├── entity-schemas ────────────────────────────┐
   └── compliance-checklist ──────────┐           │
                                      │           │
              ┌───────────────────────┼───────────┤
              │                       │           │
              ▼                       ▼           ▼
[Wave 1: Parallel]
   Track A                  Track B           Track C
   ├── 01-anchor-node       ├── 02-network-   ├── 05-supply-
   └── 03-production-model  │   legal         │   chain
                            └── 04-client-    └── 06-workforce-
                                pipeline          pipeline
              │                       │           │
              └───────────────────────┼───────────┘
                                      ▼
[Wave 2: Integration]
   2.1 Network Design (Integrated)
        │
        ▼
   2.2 Verification + NWCDC Package
        │
        ▼
[RELEASE → NWCDC Presentation]
        ▲
   Critical Path: Legal acquisition-protection bylaws (1B.1) → must pass before release
```
