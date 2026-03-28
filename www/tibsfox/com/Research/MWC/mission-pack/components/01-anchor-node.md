# Node North Anchor — Component Specification

**Milestone:** PNW Millwork Co-op Network
**Wave:** 1 | **Track:** A
**Model Assignment:** Sonnet
**Estimated Tokens:** ~20K
**Dependencies:** 00-shared-types.md (NodeProfile schema, compliance checklist)
**Produces:** components/01-anchor-node.md — complete Node North founding spec

---

## Objective

Produce a complete founding specification for Node North — the Everett/Snohomish County anchor production node. Done looks like a document a founding cohort can hand to a commercial real estate broker, a co-op formation attorney, and a CNC equipment supplier simultaneously, and each can act on it.

## Context

Synsor Corporation operated at 1920 Merrill Creek Pkwy, Everett, WA 98203 (Mukilteo/Everett border area) from 1971 until its 2017 acquisition. It was a $45M/year commercial millwork operation with ~145 employees, serving Starbucks, Alaska Airlines, AT&T, and Charlotte Russe. The Node North founding spec is the reconstruction of that operational footprint under worker co-op ownership.

The Merrill Creek area (near Paine Field/Boeing Everett) is the target geography — industrial zoning, workforce proximity, Boeing-adjacent precision manufacturing culture. Snohomish County has rural-designated areas qualifying for USDA Rural Development funding.

Node North is the first and founding node. It must be viable as a standalone operation before the network federation is activated. The first anchor contract will flow through Node North alone.

## Technical Specification

### Required Outputs
1. **Location analysis** — specific industrial zones in Everett/Snohomish County, commercial real estate criteria (sq footage, zoning, ceiling height for CNC equipment, finish room buildout)
2. **Founding cohort profile** — 8–12 worker-owners, skill mix (CNC operators, finish room workers, project manager, BOM engineer), former Synsor alumni pathway
3. **Equipment list with estimated CapEx** — CNC router (primary), wide-belt sander, edge bander, finish room (spray booth + ventilation), compressed air system
4. **Capitalization pathway** — CDFI (Craft3) + SBA 7(a) + member equity buy-in; estimated total CapEx; phased approach if full funding not immediately available
5. **First 90 days plan** — founding cohort assembled, co-op filed, space leased, equipment ordered, first client outreach initiated

### NodeProfile instance for Node North
Fill all fields of the NodeProfile schema (from 00-shared-types.md) for Node North at formation stage.

## Implementation Steps

1. Research Snohomish County industrial real estate criteria matching Synsor's operational profile
2. Define founding cohort skill mix and recruitment pathway (Synsor alumni + Sno-Isle TECH graduates)
3. Produce equipment list with current market pricing (CNC router is the largest CapEx item — research current 4x8 and 5x10 router pricing)
4. Build capitalization table: equipment + leasehold + working capital + formation costs
5. Map 3 capitalization pathways (CDFI, SBA 7(a), member equity) with timeline for each
6. Write first 90 days plan with weekly milestones

## Safety Boundaries
| Constraint | Boundary Type |
|-----------|---------------|
| Cohort minimum: 8 worker-owners before formation filing | GATE |
| Finish room must meet OSHA 29 CFR 1910.94 before operations begin | ABSOLUTE |
| Capitalization plan must not be single-pathway | ABSOLUTE |
