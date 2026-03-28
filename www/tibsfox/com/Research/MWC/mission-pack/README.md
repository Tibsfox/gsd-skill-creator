# PNW Millwork Co-op Network — Mission Package

**Date:** 2026-03-26
**Version:** 1.0.0
**Status:** Ready for GSD orchestrator
**Pipeline:** Full (Vision → Research → Mission)

---

## What This Is

A complete GSD mission package for building a federated worker co-op millwork network along the I-5 corridor — from Everett/Snohomish County to Portland — modeled on Synsor Corporation's documented production methodology but owned by the workers who build it.

Synsor ran for 46 years out of Everett, serving Starbucks, Alaska Airlines, AT&T, and Charlotte Russe at commercial scale. It was acquired by a New York consolidator in 2017 and wound down. This package is the reconstruction — acquisition-proof this time.

---

## Contents

| File | Purpose |
|------|---------|
| `01-vision-doc.md` | North star: what, why, and the through-line to Fox Infrastructure Group |
| `02-research-reference.md` | Synsor primary source data, RCW 23.86 legal, AWI standards, Starbucks alumni connection, supply chain map |
| `03-milestone-spec.md` | Mission objective, deliverables, component breakdown, model assignments |
| `04-wave-execution-plan.md` | 3-wave structure, 3 parallel tracks, cache strategy, token budget |
| `05-test-plan.md` | 52 tests (8 safety-critical), verification matrix against all 10 success criteria |
| `components/00-shared-types.md` | Wave 0: NodeProfile, BOMLineItem, ClientContract schemas + compliance checklist |
| `components/01-anchor-node.md` | Node North Everett founding spec (location, cohort, equipment, capitalization) |
| `components/02-network-legal.md` | RCW 23.86 federation structure with acquisition-protection bylaws |
| `components/03-production-model.md` | BOM-first CNC millwork production playbook (Synsor methodology reconstructed) |
| `components/04-client-pipeline.md` | Named anchor client targets (Starbucks, Alaska Airlines, hotel chains) + outreach templates |
| `components/05-supply-chain.md` | I-5 corridor supply chain map (Emerson Hardwood, OrePac, FSC pathway) |
| `components/06-workforce-pipeline.md` | Sno-Isle TECH apprenticeship design + FoxEdu integration |
| `components/07-verification.md` | Integration audit + NWCDC presentation package assembly |

## How to Use

1. Open a new Claude Code session
2. Load the vision doc as the project charter:
   ```
   claude --new-task "Read this vision doc and begin Wave 0: $(cat 01-vision-doc.md)"
   ```
3. Feed `04-wave-execution-plan.md` to the orchestrator for wave sequencing
4. Run Wave 0 (shared types) first — must complete in <5 min
5. Run Wave 1 Tracks A, B, and C in parallel
6. Run Wave 2 (integration + verification) after all Wave 1 tracks complete
7. Final output: NWCDC presentation package + critical path

## Execution Summary

| Metric | Value |
|--------|-------|
| Total components | 8 (Wave 0 + 7 Wave 1/2) |
| Parallel tracks | 3 (Wave 1) |
| Sequential depth | 3 waves |
| Activation profile | Squadron |
| Model split | ~25% Opus / ~65% Sonnet / ~10% Haiku |
| Estimated context windows | ~9 |
| Estimated wall time | ~3 sessions |
| Total tests | 52 (8 safety-critical) |

## Ecosystem Connections

| Related Document | Relationship |
|-----------------|--------------|
| `foxinfrastructuregroup.pdf` | Parent ecosystem — FoxCivil co-op model is the governance template; FoxEdu workforce track is directly implemented by Component 06 |
| `gsd-foxfire-heritage-skills-vision.md` | Peer — Foxfire heritage craft skills feed the knowledge layer; this is the commercial production layer |
| Fox Infrastructure Group RCW 23.86 co-op structure | Direct precedent — same legal structure, applied to manufacturing |

## The One-Line Version

Synsor built Starbucks and Alaska Airlines fixtures for 46 years out of Everett, Washington. A New York company bought it and shut it down. We're rebuilding it — owned by the workers this time.
