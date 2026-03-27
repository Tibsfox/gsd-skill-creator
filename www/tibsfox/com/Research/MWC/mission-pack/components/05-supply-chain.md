# Supply Chain — Component Specification
**Milestone:** PNW Millwork Co-op Network
**Wave:** 1 | **Track:** C
**Model Assignment:** Sonnet
**Estimated Tokens:** ~16K
**Dependencies:** 00-shared-types.md (BOMLineItem schema, compliance checklist)
**Produces:** components/05-supply-chain.md — complete I-5 corridor supply chain map
## Objective
Map the complete materials supply chain for Node North and the broader network — hardwood, sheet goods, finish materials, and hardware — with primary and backup suppliers for each category and a clear FSC certification pathway. Done looks like a purchasing manager can open this document and place the first orders for a production run.
## Context
The I-5 corridor has established wholesale supply infrastructure. Emerson Hardwood (Portland/Seattle, est. 1907) is the region's most established hardwood distributor with 7 locations in OR/WA and an in-house millwork department (EM2). OrePac Building Products has a 10-branch western US distribution network with a new I-5 corridor MDF manufacturing facility (operational 2024). Crosscut Hardwoods (Seattle, Portland, Eugene) is the specialty hardwood source for custom species and figured wood.
FSC Chain of Custody (CoC) certification is required by Starbucks, hotel renovation chains, and most LEED projects. It must be obtained before the first contract is executed. Timeline: 3–6 months from application; cost: ~$1,500–$3,000/year. Certification bodies operating in PNW: Rainforest Alliance, SCS Global Services.
CARB-compliant finishes are required for LEED projects and are the de facto national standard for commercial millwork. Sherwin-Williams Catalyst and Resisthane product lines meet CARB standards and have commercial millwork volume programs.
## Technical Specification
### Required Outputs
1. **Supplier map by material category** — primary + backup for: hardwood lumber, hardwood plywood/veneer, MDF/sheet goods, specialty hardwoods, finish materials (stains, topcoats, sealers), hardware
2. **Account opening process** — steps to open commercial/wholesale accounts with Emerson Hardwood and OrePac
3. **FSC CoC certification pathway** — step-by-step: choose certification body, submit application, document review, on-site audit, certification issued
4. **CARB compliance product list** — Sherwin-Williams (or equivalent) products meeting CARB ATCM for wood coatings
5. **Lead time table** — expected lead times by material category; minimum inventory buffer recommendations
6. **Supply chain resilience matrix** — what happens when the primary supplier has a stockout; backup activation protocol
## Implementation Steps
1. Build supplier map table for all material categories
2. Document Emerson Hardwood account opening process (commercial account, volume pricing)
3. Document OrePac commercial account process
4. Write FSC CoC certification step-by-step with timeline and costs
5. Write CARB-compliant finish product list
6. Build lead time table
7. Write supply chain resilience matrix
## Safety Boundaries
| Constraint | Boundary Type |
|-----------|---------------|
| FSC-required materials must have certified source documented before order | GATE |
| CARB-compliant finishes are the default; deviation requires explicit approval | GATE |
