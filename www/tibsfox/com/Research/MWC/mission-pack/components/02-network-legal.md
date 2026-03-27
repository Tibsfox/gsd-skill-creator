# Network Legal Structure — Component Specification

**Milestone:** PNW Millwork Co-op Network
**Wave:** 1 | **Track:** B
**Model Assignment:** Opus
**Estimated Tokens:** ~22K
**Dependencies:** 00-shared-types.md (entity schemas, compliance checklist)
**Produces:** components/02-network-legal.md — complete RCW 23.86 federation legal structure

---

## Objective

Design and document the complete legal structure for the federated worker co-op network — individual node co-ops plus a federated contracting entity — such that the package is ready for review by NWCDC (Olympia) and a co-op formation attorney. The single non-negotiable requirement: worker equity must be non-transferable to non-workers by explicit bylaw provision. This is the acquisition-protection mechanism.

## Context

Washington State's worker cooperative statute is RCW 23.86. The federation model consists of:
1. Individual node co-ops (each an RCW 23.86 entity, owned by its own worker-members)
2. A federated entity (a second co-op or multi-member LLC owned by the node co-ops) that holds master client contracts and shared engineering assets
3. An inter-co-op agreement governing production distribution, revenue split, and dispute resolution

The plywood co-op model (PNW, 1921–present) is the historical precedent. NWCDC (nwcdc.coop, Olympia) is the primary formation support organization and should be referenced as Step 1.

Capitalization pathways: Craft3 (CDFI, craft3.org), SBA 7(a) with co-op-experienced lender, member equity buy-in ($1K–$10K per founding member). USDA Rural Development applies if Node North qualifies as rural-designated in Snohomish County.

## Technical Specification

### Required Outputs
1. **RCW 23.86 articles of incorporation template** — for a single node co-op; all mandatory provisions; acquisition-protection language in the membership transfer section
2. **Bylaws template** — one member, one vote; patronage dividend formula (profit by labor contribution, not capital); membership share non-transferability; board election process; expulsion provisions
3. **Federation agreement template** — inter-co-op agreement covering: which entity holds client contracts, how production is distributed to nodes, revenue split formula (by labor hours contributed), dispute resolution (binding arbitration before litigation)
4. **Capitalization table** — co-op formation costs (filing fees, attorney, NWCDC advisory) + three funding pathways with timeline
5. **NWCDC engagement plan** — specific steps: initial contact, advisory review of bylaws, formation support

### Acquisition-Protection Language (Non-Negotiable)
The bylaws must include a provision substantially equivalent to:
> "Membership shares in this cooperative are personal to the member and may not be sold, transferred, pledged, or otherwise conveyed to any person or entity other than the cooperative itself. Any purported transfer of a membership share in violation of this section is void."

## Implementation Steps

1. Draft RCW 23.86 articles of incorporation template with all mandatory provisions
2. Draft bylaws with acquisition-protection language, one-member-one-vote, patronage dividend formula
3. Draft inter-co-op federation agreement template
4. Build capitalization cost table and three-pathway timeline
5. Document NWCDC engagement steps as a checklist
6. Cross-reference compliance checklist (00-shared-types.md) to confirm all legal domains addressed

## Safety Boundaries
| Constraint | Boundary Type |
|-----------|---------------|
| Acquisition-protection language must be present in bylaws verbatim or equivalent | ABSOLUTE |
| One member, one vote — no provision for super-voting shares | ABSOLUTE |
| NWCDC review recommended before Secretary of State filing | GATE |
