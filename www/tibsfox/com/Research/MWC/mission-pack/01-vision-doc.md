# PNW Millwork Co-op Network — Vision Guide

**Date:** 2026-03-26
**Status:** Initial Vision / Pre-Research
**Depends on:** Fox Infrastructure Group Master Business Plan (foxinfrastructuregroup.pdf), RCW 23.86 co-op legal framework
**Context:** A federated worker co-op network along the I-5 corridor that reconstructs the Synsor Corporation model of high-volume, high-quality CNC woodworking and millwork — but owned by the workers and communities that build it.

---

## Vision

There was a shop in Everett in the mid-1990s that built the insides of Starbucks stores, Alaska Airlines gates, and hotel lobbies across the Pacific Northwest. Synsor Corporation was a nationally recognized fixture manufacturer — not a craft shop, not a big Southern furniture factory, but something rarer: a precision-manufacturing operation embedded in its own community, running lean BOM-based engineering on CNC equipment to produce architectural millwork at commercial scale. The talent that came out of Synsor went directly into the procurement desks at Eddie Bauer and Starbucks. The knowledge flowed both ways. Then in 2017, a New York consolidator bought it and the Everett operation wound down. The shop is gone. The knowledge is dispersed. The contracts are being filled by someone else, somewhere else.

The gap it left is real. Every major hotel renovation, every new Starbucks buildout, every Alaska Airlines gate refresh needs someone who can produce architectural millwork to spec, at volume, on schedule. The I-5 corridor from Everett to Portland has the workforce, the timber supply infrastructure, the co-op legal frameworks, and the institutional memory to fill that gap — but it needs a deliberate network structure to do it at scale. A single shop trying to recreate Synsor will get acquired again. A federated co-op network of three to five nodes, jointly holding anchor contracts, sharing engineering capacity, and distributing production by geography — that's a different animal.

This is not a craft revival. It is an industrial reconstruction, built on co-op ownership principles so the next acquisition offer gets declined. The workers who build the fixtures own the shop that builds them. The communities along the corridor own the network. When Starbucks needs 200 identical espresso bar fixtures for a regional rollout, the answer comes from Snohomish County and the Willamette Valley, not from a consolidator in New Jersey.

The Amiga Principle applies here: you don't need the biggest factory. You need the right network structure. Specialized nodes, federated contracts, shared engineering intelligence, community ownership. The spaces between the nodes are where the value lives — in the logistics coordination, the shared BOM database, the client trust that accumulates over years of on-spec delivery.

## Problem Statement

1. **The Synsor vacuum.** The closure of Synsor's Everett operation left a gap in PNW commercial millwork capacity. High-volume architectural fixture work for retail and hospitality chains is now largely served by out-of-region manufacturers with no community stake.

2. **The acquisition trap.** Successful local manufacturers get consolidated. A single-entity shop has no structural protection against acquisition. Worker co-op ownership is the only durable defense — you can't hostile-take a co-op.

3. **Dispersed knowledge, no vessel.** The workforce skills, timber supply relationships, and client network that Synsor built over 40 years are dispersed across the region. No current organization is holding or transmitting this institutional knowledge.

4. **Volume requires network.** A single node cannot bid competitively on a 200-location retail rollout. The I-5 corridor has the production capacity but lacks the coordination layer to aggregate it into a credible bid.

5. **Workforce pipeline atrophied.** The apprenticeship and training pathways that fed Synsor's precision woodworking workforce have not been replaced. Sno-Isle TECH and similar institutions have capacity but no dedicated commercial millwork curriculum.

## Core Concept

**Research → Anchor → Network → Scale → Own.**

A researcher at a node submits a bid for a commercial millwork contract. The federated co-op network evaluates capacity across all nodes. Production is distributed by geography and specialty. Engineering BOMs are shared. Quality verification runs at each node. The client receives a unified product — they're buying from the network, not from one shop. Profits return to worker-owners at each contributing node. The network accrues equity, trains the next cohort, and declines acquisition offers.

### Network Topology

```
                    ┌─────────────────────────────────┐
                    │   PNW MILLWORK CO-OP FEDERATION  │
                    │   (Contract Holder / BOM Engine) │
                    └──────────────┬──────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                     ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │  NODE NORTH      │  │  NODE CENTRAL    │  │  NODE SOUTH      │
   │  Everett /       │  │  South King Co.  │  │  Portland /      │
   │  Snohomish Co.   │  │  Seattle Metro   │  │  Willamette      │
   │                  │  │                  │  │  Valley          │
   │  CNC Production  │  │  Finishing &     │  │  Secondary       │
   │  Primary Mfg     │  │  Assembly /      │  │  Production +    │
   │  Boeing-adjacent │  │  Logistics Hub   │  │  Hardwood Supply │
   │  precision       │  │  Airport access  │  │  Integration     │
   └──────────────────┘  └──────────────────┘  └──────────────────┘
              │                    │                     │
              └────────────────────┼─────────────────────┘
                                   ▼
                    ┌──────────────────────────┐
                    │  EMERSON HARDWOOD /      │
                    │  PNW TIMBER SUPPLY       │
                    │  (Wholesale Partner)     │
                    └──────────────────────────┘
```

## Architecture

### Component Map

```
PNW Millwork Co-op Network
├── 00-shared-types          ← legal entity schemas, BOM standards, node profiles
├── 01-anchor-node           ← Everett/Snohomish Node North (founding node spec)
├── 02-network-legal         ← RCW 23.86 federation structure, equity model
├── 03-production-model      ← CNC ops playbook (Synsor methodology reconstructed)
├── 04-client-pipeline       ← anchor client acquisition (Starbucks, hotel, airline)
├── 05-supply-chain          ← timber + materials supply (Emerson Hardwood integration)
├── 06-workforce-pipeline    ← apprenticeship model (Sno-Isle TECH partnership)
└── 07-verification          ← integration verification, quality gates, audit system
```

**Cross-component connections:**
- `01-anchor-node` → `02-network-legal` — Node North is the founding co-op entity; legal structure wraps it
- `03-production-model` → `00-shared-types` — BOM schemas and CNC specs flow from production model into shared types
- `04-client-pipeline` → `01-anchor-node` — First anchor contracts flow through Node North
- `05-supply-chain` → `03-production-model` — Material specs and lead times inform production scheduling
- `06-workforce-pipeline` ↔ `01-anchor-node` — Node North is both employer and training ground
- `07-verification` ← all components — Verification audits every node and every contract

## Module Descriptions

### Node North — Everett/Snohomish County Anchor
**Purpose:** The founding production node. Located near the original Synsor footprint at Merrill Creek Pkwy, Everett. Carries the institutional memory and Boeing-adjacent precision manufacturing culture of the region.

**Key concepts:**
- CNC router and panel processing production floor
- Architectural millwork and store fixture specialization
- Lean BOM-based manufacturing engineering
- Worker-owner equity from day one

**Entry point:** A founding cohort of 8–12 worker-owners, ideally including former Synsor employees still in the region, plus Sno-Isle TECH graduates.

**Safety considerations:** Shop safety protocols (OSHA 29 CFR 1910 woodworking), finish room VOC controls, CNC operator certification requirements.

**Cross-references:** Network Legal (co-op ownership structure), Workforce Pipeline (hiring and training)

---

### Network Legal Structure
**Purpose:** The RCW 23.86 worker co-op federation that holds contracts, distributes equity, and protects against acquisition.

**Key concepts:**
- Individual node co-ops as members of a federated entity
- Work unit accrual tied to production hours
- Equity stake that grows over time, non-transferable to outside buyers
- Governance: one member, one vote

**Entry point:** Washington Secretary of State incorporation + NWCDC (Northwest Cooperative Development Center, Olympia) as formation advisor.

**Safety considerations:** Legal compliance — co-op bylaws must explicitly restrict transfer of member equity to non-workers.

---

### Production Model — Synsor Methodology Reconstructed
**Purpose:** The operational playbook for high-volume, high-quality CNC millwork. Reconstructed from Synsor's documented work (store fixtures, architectural millwork, case goods) and current best practices.

**Key concepts:**
- BOM-first engineering: every project starts with a complete bill of materials before a single machine runs
- CNC router as primary tool (panel processing, routing, carving)
- Finish room as quality differentiator (consistent color matching across 200 identical units)
- Lean manufacturing: pull scheduling, no overproduction, JIT material delivery

**Entry point:** A project kicks off when a client SOW (scope of work) arrives. Engineering converts SOW to BOM. BOM feeds CNC programs. Programs run. Finished goods staged. Delivered.

---

### Client Pipeline — Anchor Contract Acquisition
**Purpose:** Land the first major client contract that proves network capacity and establishes the relationship template for future rollouts.

**Key concepts:**
- Starbucks casework: still rolling out globally; regional preference for regional suppliers exists
- Alaska Airlines: cabin and gate fixture refreshes are cyclical; PNW-based supplier has logistics advantage
- Hotel renovation chains (Marriott, Hilton regional): lobby and in-room millwork on a predictable renovation cycle
- The "materials manager to purchasing manager" pipeline: Synsor's own alumni at Starbucks and Eddie Bauer prove the relationship entry point

**Entry point:** Identify former Synsor alumni now in purchasing roles at PNW-anchored clients. Warm outreach, not cold pitch.

---

### Supply Chain — Timber and Materials Integration
**Purpose:** Lock in reliable, quality hardwood and sheet good supply along the I-5 corridor.

**Key concepts:**
- Emerson Hardwood (Portland/Seattle): established 4-division PNW hardwood distributor with millwork capability
- Crosscut Hardwoods (Seattle, Portland, Eugene): specialty supply for custom species and cuts
- Sheet goods (MDF, plywood, veneer): OrePac I-5 corridor distribution network
- LEED and FSC certification: mandatory for hotel and retail clients with sustainability commitments

---

### Workforce Pipeline — Apprenticeship at Sno-Isle TECH
**Purpose:** Build the training pipeline that feeds Node North and eventual additional nodes with certified precision woodworkers.

**Key concepts:**
- Sno-Isle TECH (Everett): existing advanced manufacturing program; no dedicated commercial millwork track currently
- Apprenticeship model: earn-while-you-learn, co-op equity accrual from first day of apprenticeship
- FoxEdu integration point: this workforce track maps directly to Fox Infrastructure Group's "Advanced Fabrication & Manufacturing" workforce track
- Generational knowledge transfer: former Synsor workers as master instructors

---

## Skill-Creator Integration

### Chipset Configuration

```yaml
name: pnw-millwork-coop-network
version: 1.0.0
description: >
  Research and planning intelligence for building a federated worker co-op
  millwork network along the I-5 corridor, reconstructing the Synsor model
  under community ownership.

skills:
  co-op-legal:
    domain: cooperative-law
    description: "RCW 23.86 compliance, federation structure, equity model design"
  production-planning:
    domain: manufacturing-engineering
    description: "BOM generation, CNC scheduling, lean production playbook"
  client-acquisition:
    domain: commercial-sales
    description: "Anchor client identification, warm outreach templates, SOW response"
  supply-chain:
    domain: materials-procurement
    description: "Timber supply sourcing, FSC certification, I-5 corridor logistics"

agents:
  topology: "leader-worker"
  agents:
    - name: "FLIGHT"
      role: "Mission orchestrator — coordinates all nodes and tracks"
    - name: "LEGAL"
      role: "Co-op legal structure and governance design"
    - name: "OPS"
      role: "Production model and CNC ops playbook"
    - name: "BIZ-DEV"
      role: "Client pipeline and contract acquisition"
    - name: "SUPPLY"
      role: "Materials supply chain and timber sourcing"
    - name: "WORKFORCE"
      role: "Apprenticeship program and training pipeline"
    - name: "VERIFY"
      role: "Integration audit and quality gate verification"

evaluation:
  gates:
    pre_deploy:
      - check: "co-op-bylaws-acquisition-protection"
        action: "block"
      - check: "node-north-founding-cohort-confirmed"
        action: "block"
      - check: "anchor-client-letter-of-intent"
        action: "warn"
      - check: "fsc-certification-pathway-mapped"
        action: "warn"
```

## Scope Boundaries

### In Scope (v1.0)
- Node North founding spec (Everett/Snohomish County)
- RCW 23.86 federation legal structure
- Production ops playbook (CNC millwork, Synsor methodology)
- Anchor client acquisition strategy (Starbucks, Alaska Airlines, hotel chains)
- I-5 timber supply chain integration
- Sno-Isle TECH apprenticeship partnership design
- Network governance and equity model

### Out of Scope (Future Considerations)
- Node Central and Node South buildout (Phase 2)
- International timber sourcing (FSC-certified offshore)
- CNC equipment procurement (handled by individual nodes post-capitalization)
- Full FoxEdu curriculum integration (deferred to FoxEdu milestone)
- BC and Oregon expansion (deferred to corridor Phase 2)

## Success Criteria

1. A complete RCW 23.86 co-op federation structure is documented and ready for Secretary of State filing, with bylaws that explicitly restrict equity transfer to non-worker buyers.
2. Node North founding spec identifies a physical location in the Everett/Snohomish County area, a founding cohort profile (8–12 worker-owners), and a capitalization pathway.
3. The production ops playbook documents the Synsor BOM-first engineering methodology in enough detail that a new shop can implement it from scratch.
4. The client pipeline strategy identifies at minimum 3 warm outreach targets by name, with documented connection rationale (e.g., former Synsor alumni in purchasing roles).
5. Timber and sheet goods supply sources are mapped with primary and backup suppliers for each material category, including FSC certification status.
6. The Sno-Isle TECH partnership design outlines a specific curriculum track, apprenticeship structure, and co-op equity accrual from day one of apprenticeship.
7. The network governance model specifies how production contracts are distributed across nodes, how revenue is split, and how disputes are resolved.
8. A phased capitalization plan identifies three funding pathways: CDFI loans, SBA 7(a) co-op financing, and member equity buy-in.
9. The quality verification system documents how 200 identical fixtures can be produced across two nodes and meet a single client spec.
10. The complete package is ready to present to NWCDC (Olympia) as a co-op formation proposal.

## Relationship to Other Vision Documents

| Document | Relationship |
|----------|-------------|
| foxinfrastructuregroup.pdf | Parent ecosystem — FoxCivil co-op model is the governance template; FoxEdu workforce track directly feeds this network |
| gsd-foxfire-heritage-skills-vision.md | Peer — Foxfire heritage skills feed the craft knowledge layer; this is the commercial production layer |
| gsd-local-cloud-provisioning-vision.md | Infrastructure peer — shared I-5 corridor geographic footprint |

## The Through-Line

The Fox Infrastructure Group plan ends with a sentence: "The corridor starts at home. It always will." The PNW Millwork Co-op Network is what that looks like at the shop floor level. Not maglev — woodworking. Not fiber optic — cabinet joints. The same principle: local workers, community ownership, acquisition-proof structure, generational knowledge transfer.

The Amiga Principle is native here. Synsor didn't need to be the biggest fixture manufacturer in America. It needed to be the most precise, most trusted, most embedded shop in the Pacific Northwest — and for forty years, it was. The co-op reconstruction doesn't need to beat the national consolidators on volume. It needs to beat them on relationship, on speed-to-spec, on the fact that the people building the fixtures are also the people who will be around in ten years when the client needs the next renovation cycle. The spaces between the nodes — the logistics coordination, the shared BOM intelligence, the accumulated client trust — that's where Synsor's real value lived. Building that back, owned this time, is what this mission is for.

---
*This vision guide is intended as input for GSD's `new-project` workflow.
Prioritize NWCDC (nwcdc.coop) and Washington Secretary of State cooperative filing resources for the legal research phase. For production methodology, prioritize AWI (Architectural Woodwork Institute) standards and former Synsor employee LinkedIn network for primary source interviews.*
