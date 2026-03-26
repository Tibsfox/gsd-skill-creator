# Open Compute Node — Component Spec: Community Integration

**Component:** 09-community-integration.md
**Wave:** 2E (2 tasks: 2E.3, 2E.4)
**Model:** Sonnet (2E.3), Haiku (2E.4)
**Dependencies:** 07-compute-systems.md (network architecture, capacity)

---

## Mission

Design the community-facing systems: compute allocation architecture (free library/school access) and the mural art program (container as community canvas). These are the "give back" systems that make the Open Compute Node net-positive for communities.

## Deliverables

### D-09.1: Community Compute Allocation Architecture

**Capacity Reservation:**
- Minimum 10% of total compute capacity permanently allocated
- For NVL36×2 reference: ~7.2 PFLOPS FP4 inference capacity
- Isolated on dedicated VLAN (no access to primary compute workloads)
- No usage tracking, no user identification, no data collection
- Available 24/7 with same uptime SLA as primary compute

**Access Architecture:**
```
Community Partner Building ←—— Fiber/Wireless ——→ Container
   │                                                │
   ├── Library terminals (thin client)               │
   ├── School computer lab (network access)          │── Community VLAN
   ├── Municipal office (research access)            │
   └── Public WiFi (rate-limited, filtered)          │
```

**Service Offerings (examples):**
- AI inference API (local models for education/research)
- General-purpose compute (science projects, data analysis)
- Web hosting (community websites, local government)
- Educational platform hosting (LMS, digital library)

**Governance:**
- Community advisory board selects service priorities
- No commercial use of community allocation
- Capacity shared equally among partner institutions
- Simple web dashboard shows usage (anonymous, aggregate only)

### D-09.2: Mural Art Program Guidelines

**Panel Preparation:**
- Container exterior walls (2× long sides = ~96m² total canvas)
- Roof excluded (solar panel/equipment mounting surface)
- End walls partially available (avoid penetration areas)
- Surface preparation: sandblast, primer, base coat (white)

**Design Process:**
1. Community engagement: announcement via partner institutions
2. Open call for designs (schools, local artists, community groups)
3. Community vote on finalists (public exhibition)
4. Selected design professionally reproduced at manufacturing facility
5. Weather-resistant marine-grade paint + UV-protective clear coat
6. Artist attribution plaque mounted near design

**Technical Paint Specifications:**
- Base: 2-part marine epoxy primer
- Art: Exterior-grade acrylic or marine enamel
- Clear coat: 2K polyurethane with UV stabilizer
- Expected durability: 7-10 years in Southwest conditions
- Refresh cycle: aligned with major hardware upgrade (5-7 year cycle)

**Design Guidelines:**
- Avoid political/religious content (community consensus required)
- Celebrate local culture, landscape, science, art
- Include education/knowledge themes where natural
- No corporate logos or advertising
- Artist retains copyright; grants perpetual display license

## Acceptance Criteria

1. Community compute architecture is network-isolated from primary compute
2. No PII collection or individual usage tracking
3. Minimum 10% capacity reservation is architecturally enforced (not just policy)
4. Mural program has complete process from call-for-designs to installation
5. Paint specification suitable for 7+ year outdoor exposure
6. Community governance model documented
