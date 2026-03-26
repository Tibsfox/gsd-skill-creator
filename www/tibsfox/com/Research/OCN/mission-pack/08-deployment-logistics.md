# Open Compute Node — Component Spec: Deployment & Logistics

**Component:** 08-deployment-logistics.md
**Wave:** 2E (2 tasks: 2E.1, 2E.2)
**Model:** Opus (2E.1), Sonnet (2E.2)
**Dependencies:** 04-06 (physical requirements define site constraints)

---

## Mission

Map the top 20 candidate deployment sites along US rail corridors where fiber routes, solar irradiance, water availability, and community partners converge. Produce a site preparation specification covering foundation, external connections, and security.

## Deliverables

### D-08.1: US Rail Corridor Deployment Map

Score 20 candidate sites using the selection matrix from 01-research-reference.md:

**Target corridors (highest priority — Southwest, excellent solar):**
1. BNSF Transcon (Amarillo TX → Barstow CA)
2. UP Sunset Route (El Paso TX → Tucson AZ → Phoenix AZ)
3. I-10 Corridor (Las Cruces NM → Deming NM → Lordsburg NM)
4. I-40 Corridor (Albuquerque NM → Flagstaff AZ)
5. I-25 Corridor (Las Cruces NM → Socorro NM)

**Secondary corridors (good solar, established fiber):**
6. California Central Valley (Bakersfield → Fresno → Sacramento)
7. Texas High Plains (Lubbock → Amarillo)
8. Great Plains (Dodge City KS → Garden City KS)

For each candidate site, document:
- GPS coordinates (approximate)
- Nearest rail siding/intermodal terminal
- Nearest fiber POP (Point of Presence)
- Solar irradiance (kWh/m²/day from NREL NSRDB)
- Water source identification (agricultural runoff, treated wastewater, etc.)
- Nearest community partner (library, school, municipal building)
- Land availability/ownership (BLM, private, railroad ROW)
- Selection matrix score (weighted total)

### D-08.2: Site Preparation Specification

**Foundation:**
- Minimum: compacted gravel pad, 15m × 5m, level ±25mm
- Preferred: reinforced concrete pad, 150mm thick, with anchor bolts
- Drainage: graded to prevent standing water around container
- Clearance: 3m on all sides for maintenance access

**External Connections:**
- Power: DC bus from solar/BESS to container penetrations (conduit, disconnect)
- Water intake: pipe from source with shutoff valve, flow meter, coarse screen
- Water output: pipe to community distribution point with flow meter
- Fiber: conduit from nearest splice point to container entry
- Waste: graded access path for drum dolly/cart to north wall

**Security:**
- Perimeter: chain-link fence with access gate (minimum)
- Lighting: solar-powered LED security lights (4 corners)
- Monitoring: IP cameras on local storage (no cloud dependency)
- Access: keyed/coded gate + container door electronic lock

## Acceptance Criteria

1. ≥20 candidate sites identified with complete data
2. ≥10 sites score ≥70/100 on selection matrix
3. Site preparation spec covers all external connections
4. Foundation spec references relevant building code (ASCE 7-22 for loads)
5. Security specification appropriate for unmanned remote operation
