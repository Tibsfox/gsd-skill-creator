# Structural Systems & Materials Science — Technical Deep-Dive

---
module: M1-ST
dimensions: [TD, BS, ST, LP, AD, RS]
audience: L1-L5
content_type: deep-dive
last_updated: 2026-03-08
version: 1.0
status: draft
---

> **Building Construction Mastery — Module 1**
>
> Complete structural systems coverage for Pacific Northwest residential and commercial construction. Spans all five audience levels (L1 homeowner through L5 engineer/architect) with PNW seismic design as a through-line. This is the largest and most technically demanding module in the BCM corpus.

---

## Table of Contents

- [Part 1: What Holds Your Building Up — Structural Systems Overview](#part-1-what-holds-your-building-up)
- [Part 2: Structural System Types](#part-2-structural-system-types)
  - [2.1 Wood-Frame Construction](#21-wood-frame-construction)
  - [2.2 Mass Timber](#22-mass-timber)
  - [2.3 Steel Frame](#23-steel-frame)
  - [2.4 Concrete and Masonry](#24-concrete-and-masonry)
  - [2.5 Hybrid Systems](#25-hybrid-systems)
- [Part 3: Foundation Types for PNW Soils](#part-3-foundation-types-for-pnw-soils)
- [Part 4: Materials Science — PNW Structural Materials](#part-4-materials-science)
- [Part 5: Seismic Design for the Pacific Northwest](#part-5-seismic-design-for-the-pacific-northwest)
- [Part 6: Load Path Analysis](#part-6-load-path-analysis)
- [Part 7: Engineering Calculations](#part-7-engineering-calculations)
- [Part 8: Design Examples](#part-8-design-examples)
- [Part 9: Inspection, Codes & Professional Practice](#part-9-inspection-codes-and-professional-practice)
- [Sources](#sources)

---

## Part 1: What Holds Your Building Up

### L1 View — The Skeleton of Your Home

Every building has a skeleton, just like your body does. In your body, bones carry your weight down to the ground. In a building, structural members — walls, beams, columns, and foundations — carry the weight of the roof, floors, furniture, people, and even snow and wind down to the earth beneath.

The "structural system" is the name for this skeleton. When a structural system works correctly, you never think about it. When it fails, the consequences can be catastrophic: sagging floors, cracked walls, stuck doors, and in the worst case, collapse [CODE-01].

> **PNW Regional Note:**
> In the Pacific Northwest, your building's skeleton has to handle something most of the country does not: major earthquake risk. The Cascadia Subduction Zone is capable of producing a magnitude 9.0+ earthquake — the last one occurred in 1700. This means every structural decision, from how your house is bolted to its foundation to how the walls resist sideways shaking, matters more here than almost anywhere else in the United States [CODE-04, GOV-05].
>
> *Applies to: Both OR and WA*

### L3 View — Structural System Classification

Structural systems are classified by their primary material and force-resisting mechanism. The International Building Code (IBC) organizes buildings into five construction types (Types I through V), defined by the fire-resistance ratings of structural elements [CODE-01]. The IRC governs one- and two-family dwellings and townhouses, which are predominantly Type V (combustible) construction [CODE-01].

For lateral force resistance (wind and seismic), structural systems are further classified by ASCE 7-22 into bearing wall systems, building frame systems, moment-resisting frame systems, dual systems, and cantilever column systems, each with assigned response modification coefficients (R), overstrength factors, and deflection amplification factors that govern seismic design [CODE-04].

---

## Part 2: Structural System Types

### 2.1 Wood-Frame Construction

#### L1 View — How Most PNW Homes Are Built

Most homes in Oregon and Washington are wood-frame construction. This means the walls, floors, and roof are built from dimensional lumber — the familiar 2x4s, 2x6s, 2x10s, and 2x12s you see at the lumber yard. Wood framing has been the dominant residential building method in the Pacific Northwest for over a century, in large part because the region produces some of the finest structural lumber in the world [STD-19].

**Platform framing** is the method used in virtually all new residential construction today. Each floor is built as a platform, and the walls for the next story are erected on top of that platform. The process repeats: foundation, first-floor platform, first-floor walls, second-floor platform, second-floor walls, roof [CODE-01, STD-02].

#### L2 View — Wood Framing Components and Assembly

**Platform Framing Components:**

| Component | Typical Size | Function | Spacing |
|-----------|-------------|----------|---------|
| Bottom plate (sole plate) | 2x4 or 2x6 | Anchors wall to floor or foundation | Continuous |
| Studs | 2x4 or 2x6 | Vertical wall members, carry gravity and lateral loads | 16" or 24" OC |
| Top plate (double) | 2x4 or 2x6 (doubled) | Ties wall together at top, transfers loads | Continuous |
| Header | Built-up lumber, LVL, or glulam | Spans openings (doors, windows), carries loads above | Per opening width |
| Cripple studs | 2x4 or 2x6 | Short studs above headers or below sills | Match wall stud spacing |
| King studs | 2x4 or 2x6 | Full-height studs flanking openings | One each side of opening |
| Trimmer studs (jack studs) | 2x4 or 2x6 | Support headers directly | One or more each side |

**Floor Systems:**

| Component | Typical Size | Function | Spacing |
|-----------|-------------|----------|---------|
| Floor joists | 2x10, 2x12, or engineered I-joists | Span between bearing walls/beams | 16" OC typical |
| Rim board (band joist) | Same depth as joists, or engineered rim | Closes perimeter of floor frame | Continuous |
| Subfloor | 3/4" T&G plywood or OSB | Structural diaphragm, walking surface | Continuous, glued and nailed |
| Blocking | Same size as joists | Prevents joist rotation at bearing points | At bearing and mid-span if required |

**Roof Systems:**

| System | Components | Application |
|--------|-----------|-------------|
| Conventional rafters | Ridge board, rafters, ceiling joists, collar ties | Cut on site, flexible geometry, additions |
| Engineered trusses | Factory-built triangulated frames | Production housing, long spans, no interior bearing walls |
| Ridge beam (structural) | Glulam or steel beam at ridge | Cathedral ceilings, no ceiling joists needed |

> **Note:**
> Balloon framing — where studs run continuously from the foundation sill to the top plate of the uppermost story — was common before 1940 and is still found in older PNW homes. Balloon framing creates hidden vertical channels in wall cavities that allow fire to spread rapidly from floor to floor. If you encounter balloon framing during renovation, fire-stopping with 2x blocking or mineral wool at every floor line is required per IBC 2021/2024 Section 718 [CODE-01, STD-01, STD-09].
>
> *Applies to: Both OR and WA*

#### L3 View — Code Requirements for Wood Framing

**Primary Code References:**

| Code | Edition | Section(s) | Topic | OR Amendments | WA Amendments |
|------|---------|-----------|-------|---------------|---------------|
| IRC | 2021 | R602 | Wood Wall Framing | ORSC 2023 adopts with amendments | WAC 51-51 adopts with amendments |
| IRC | 2021 | R502 | Wood Floor Framing | ORSC 2023 | WAC 51-51 |
| IRC | 2021 | R802 | Wood Roof Framing | ORSC 2023 | WAC 51-51 |
| IRC | 2021 | R602.10 | Braced Wall Panels | ORSC 2023 | WAC 51-51 |
| IBC | 2024/2021 | Ch. 23 | Wood — design per NDS | OSSC 2025 (IBC 2024) | WAC 51-50 (IBC 2021) |
| NDS | Current | All | Wood design values | Adopted by reference | Adopted by reference |

**Wall Framing Requirements — IRC R602:**

- **Stud size:** Minimum 2x4 for one-story buildings and the upper story of multi-story buildings. 2x6 minimum for first floor of three-story buildings [IRC 2021 R602.3, STD-02, STD-10].
- **Stud spacing:** 16" OC for bearing walls supporting more than one floor, roof, and ceiling; 24" OC permitted for one-story or the upper story of multi-story buildings [IRC 2021 R602.3.1].
- **Double top plates:** Required. End joints in top plates must be offset at least 48" from joints in the plate below. Single top plate permitted if studs align with framing above and below and tie plates are used at intersections [IRC 2021 R602.3.2].
- **Headers:** Required over all openings in bearing walls. Size determined by span, tributary load, and number of stories supported [IRC 2021 Table R602.7(1), R602.7(2), R602.7(3)].
- **Notching and boring:** Bearing studs — notches limited to 25% of stud depth (40% in exterior walls with each stud braced). Bore holes limited to 40% of stud depth (60% for doubled studs) with 5/8" minimum edge distance [IRC 2021 R602.6].

**Braced Wall Requirements — IRC R602.10 (L3/L4 Critical):**

The IRC prescriptive bracing provisions (Section R602.10) define minimum lateral force resistance for residential wood-frame structures. Braced wall lines must be identified on plans. Braced wall panels are the specific segments within each wall line that provide lateral resistance [STD-02, STD-10].

| Bracing Method | Description | Min Length (per panel) | Applicable Stories |
|---------------|-------------|----------------------|-------------------|
| LIB — Let-in bracing | 1x4 diagonal let into studs at 45-60 degrees | 4 ft | Limited use, not for seismic D |
| DWB — Diagonal wood boards | 5/8" min diagonal board sheathing | 4 ft | All |
| WSP — Wood structural panel | Plywood or OSB, 3/8" min, nailed per schedule | 4 ft | All, primary seismic method |
| SFB — Structural fiberboard | 1/2" min structural fiberboard | 4 ft | Not for seismic D1/D2 |
| GB — Gypsum board | 1/2" gypsum board on interior | 8 ft | Not for seismic D1/D2 |
| ABW — Alternate braced wall | WSP full-height with hold-downs | 2.67 ft min | All, including seismic D |
| PFH — Portal frame at garage | WSP panel with hold-downs at garage openings | 2.67 ft min | All, including seismic D |
| CS-WSP — Continuously sheathed | WSP over entire wall line, corners at 2 ft min | 2 ft min at corners | All, including seismic D |

> **PNW Regional Note:**
> Most of the Pacific Northwest west of the Cascades falls into Seismic Design Category D1 or D2 per ASCE 7-22 [CODE-04]. This eliminates several bracing methods (LIB, SFB, GB) and drives the region toward wood structural panel (plywood/OSB) bracing as the standard practice. The continuously sheathed method (CS-WSP) is increasingly common in PNW production housing because it allows narrower bracing panels while providing a more robust lateral system [STD-02, STD-10].
>
> *Applies to: Both OR and WA*

**Common Inspection Failures (L4):**

| Failure | Code Basis | Fix | Time Impact |
|---------|-----------|-----|-------------|
| Missing or inadequate headers | IRC R602.7 | Install proper header to span tables | 1-2 days |
| Insufficient braced wall panel length | IRC R602.10 | Add WSP sheathing to meet minimum length | 1 day |
| Wrong nailing schedule on shear panels | IRC R602.3, NDS | Re-nail to schedule (typically 6"/12" or 4"/12" edge/field) | 2-4 hours |
| Top plate joints not offset | IRC R602.3.2 | Re-frame or add tie plates | 2-4 hours |
| Improper cripple stud layout | IRC R602.9 | Install cripple studs at wall stud spacing | 1-2 hours |

#### L5 View — Wood Design per NDS

Wood structural design in the United States follows the National Design Specification for Wood Construction (NDS), published by the American Wood Council [STD-19]. The NDS provides both Allowable Stress Design (ASD) and Load and Resistance Factor Design (LRFD) methods.

**Governing Equation — Flexure (ASD):**

The basic flexural design check for a wood beam:

```
f_b <= F'_b
```

Where:
- f_b = actual bending stress = M / S (psi)
- M = maximum bending moment (in-lb)
- S = section modulus (in^3)
- F'_b = adjusted allowable bending stress (psi)

The adjusted design value F'_b accounts for conditions of use:

```
F'_b = F_b * C_D * C_M * C_t * C_L * C_F * C_i * C_r
```

Where:
- F_b = reference bending design value from NDS Supplement (species-specific)
- C_D = load duration factor (0.90 for snow, 1.0 for occupancy, 1.15 for wind, 1.60 for seismic/impact)
- C_M = wet service factor (1.0 for dry conditions, <1.0 for moisture content >19%)
- C_t = temperature factor (1.0 for temperatures ≤100F)
- C_L = beam stability factor (lateral support conditions)
- C_F = size factor (for sawn lumber only)
- C_i = incising factor (for preservative-treated lumber)
- C_r = repetitive member factor (1.15 for joists/rafters/studs at ≤24" OC with structural sheathing)

**Source:** NDS current edition, Section 3.3 [STD-19]

**Governing Equation — Shear (ASD):**

```
f_v <= F'_v
```

Where:
- f_v = actual shear stress = (3V) / (2bd) for rectangular sections (psi)
- V = maximum shear force (lb), typically reduced for uniform loads (NDS 3.4.3)
- b = member width (in)
- d = member depth (in)
- F'_v = adjusted allowable shear stress (psi)

**Governing Equation — Deflection:**

```
delta_actual <= delta_allowable
```

Where:
- delta_allowable = L/360 for live load, L/240 for total load (IBC Table 1604.3) [CODE-01]
- delta_actual for simple span, uniform load: (5wL^4) / (384EI)

**Bearing:**

```
f_c_perp <= F'_c_perp
```

Where:
- f_c_perp = actual bearing stress = P / A_bearing (psi)
- F'_c_perp = adjusted allowable compression perpendicular to grain (psi)

---

### 2.2 Mass Timber

#### L1 View — The Return of Big Wood

Mass timber is a modern engineering approach that creates building-scale structural members from smaller pieces of wood bonded together. The result is massive wooden panels and beams that can replace steel and concrete in multi-story buildings — and the Pacific Northwest is the epicenter of this technology in North America [CODE-01].

The most common mass timber products are:

- **CLT (Cross-Laminated Timber):** Layers of lumber boards glued together with alternating grain directions — like structural plywood scaled up to the size of a wall or floor panel.
- **Glulam (Glued Laminated Timber):** Layers of lumber bonded together with grain running in the same direction to create large beams and columns. Glulam has been used in the PNW since the 1930s.
- **NLT (Nail-Laminated Timber):** Lumber boards nailed together on edge to create heavy timber panels. A simpler, lower-cost alternative to CLT.

#### L3 View — IBC Tall Wood Provisions

The IBC 2021 introduced three new construction types for tall mass timber buildings, carried forward in IBC 2024 [CODE-01]:

| Construction Type | Max Height (ft) | Max Stories | Fire Protection | Exposed Wood |
|------------------|----------------|-------------|----------------|--------------|
| Type IV-A | 270 | 18 | Full non-combustible protection on all mass timber | None |
| Type IV-B | 180 | 12 | Non-combustible protection on most surfaces | Limited exposure permitted |
| Type IV-C | 85 | 9 | Connections protected | Substantial exposed wood surfaces permitted |

All three types require:
- Mass timber elements with minimum fire resistance ratings (2-hour or 3-hour depending on type)
- Sprinkler systems throughout
- Engineered connections with fire-resistance ratings

> **PNW Regional Note:**
> Oregon and Washington are leading states in mass timber construction. Key PNW manufacturers include DR Johnson (Riddle, OR — produced CLT for the first CLT building in the US), Freres Lumber (Lyons, OR — mass plywood panels/MPP), and Vaagen Brothers (Colville, WA). Oregon adopted the IBC 2021 tall wood provisions through the OSSC 2025, effective October 2025 with mandatory compliance by April 2026. Washington's IBC 2021 adoption via WAC 51-50 has been in effect since March 15, 2024 [STD-01, STD-09, GOV-01, GOV-02].
>
> *Applies to: Both OR and WA*

#### L4 View — Mass Timber Project Considerations

**Estimating Framework:**

| Work Item | Unit | Material Cost (2026 PNW) | Labor Hours | Notes |
|-----------|------|-------------------------|-------------|-------|
| CLT floor panel, 5-ply (6-7/8") | per SF | $22-30 | 0.03-0.05 | Crane time significant |
| CLT wall panel, 3-ply (4-1/8") | per SF | $16-22 | 0.02-0.04 | Pre-cut with openings from factory |
| Glulam beam, 24F-V8 DF | per BF | $5-8 | Varies by span | Stock sizes vs. custom |
| NLT floor panel, 2x decking | per SF | $12-18 | 0.04-0.06 | Labor-intensive vs. CLT |
| Mass timber connections (steel) | per connection | $200-2,000+ | 0.5-4 hrs | Complexity varies enormously |

> **Note:**
> Cost estimates are PNW metro area, Q1 2026. Mass timber material costs can fluctuate significantly based on supply chain conditions and order volume. Lead times for CLT panels are typically 12-20 weeks from order to delivery.

**Sequencing:**

| Phase | Predecessor Trade | This Trade's Work | Successor Trade | Duration (typical) |
|-------|------------------|-------------------|-----------------|-------------------|
| Foundation | Excavation | Concrete foundations with embedded connectors | — | 2-4 weeks |
| Erection | Foundation cure | Crane-set mass timber panels and beams | MEP rough-in | 1-3 weeks per floor |
| Connection completion | Erection | Steel hardware installation | Fireproofing (IV-A/B) | Concurrent with erection |
| Fire protection | Connection completion | Gypsum encapsulation (IV-A), intumescent (IV-B) | Interior finishes | 1-2 weeks per floor |

---

### 2.3 Steel Frame

#### L1 View — Steel Buildings

Steel framing is used for commercial buildings, large public structures, and some residential construction. Steel is strong, fire-resistant (when protected), and can span large distances without intermediate supports. In the PNW, steel moment frames are one of the best structural systems for resisting earthquake forces [STD-20, CODE-04].

There are two scales of steel construction:

- **Structural steel:** Heavy wide-flange beams and columns (W-shapes), angles, channels, and hollow sections used in commercial and multi-story buildings.
- **Light-gauge steel (cold-formed steel):** Thin steel members formed from sheet steel, used for residential and light commercial framing as an alternative to wood studs.

#### L3 View — Steel Framing Systems for Lateral Resistance

Steel lateral force-resisting systems are classified by ASCE 7-22 with assigned response modification coefficients (R values) that directly affect seismic design forces [CODE-04]:

| System | R Value | Description | Typical Application |
|--------|---------|-------------|-------------------|
| Special Moment Frame (SMF) | 8 | Fully ductile beam-column connections | High seismic (PNW), unlimited height |
| Intermediate Moment Frame (IMF) | 4.5 | Moderate ductility connections | Moderate seismic, height limited in SDC D |
| Ordinary Moment Frame (OMF) | 3.5 | Standard connections | Low seismic only, not permitted in SDC D/E |
| Special Concentrically Braced Frame (SCBF) | 6 | Diagonal bracing with ductile connections | High seismic, very stiff |
| Eccentrically Braced Frame (EBF) | 8 | Diagonal braces with offset connections (link beams) | High seismic, allows openings in brace bays |
| Buckling-Restrained Braced Frame (BRBF) | 8 | Braces with buckling restraint, yielding core | High seismic, excellent energy dissipation |

> **PNW Regional Note:**
> In Seismic Design Categories D1/D2 (most of western OR and WA), only Special Moment Frames, Special Concentrically Braced Frames, Eccentrically Braced Frames, and Buckling-Restrained Braced Frames are permitted for steel construction above certain height thresholds. Ordinary Moment Frames are generally not permitted. This requirement directly impacts construction cost and detailing complexity for PNW steel buildings [CODE-04, STD-01, STD-09].
>
> *Applies to: Both OR and WA*

**Steel Grades:**

| Grade | Designation | Yield Strength (ksi) | Typical Use |
|-------|-----------|---------------------|-------------|
| ASTM A36 | Carbon structural steel | 36 | Plates, angles, channels, older structures |
| ASTM A992 | Structural shapes | 50 | W-shapes (beams, columns) — current standard |
| ASTM A500 Grade B/C | Cold-formed structural tubing | 46/50 | HSS (hollow structural sections) |
| ASTM A572 Grade 50 | High-strength low-alloy | 50 | Plates, bars |

**Connection Types (L3/L5):**

| Connection | Method | Application | Inspection Requirements |
|-----------|--------|-------------|----------------------|
| Bolted — bearing type | High-strength bolts (A325, A490) | Standard connections, braced frames | Visual + pre-tension verification |
| Bolted — slip-critical | High-strength bolts, pretensioned, faying surfaces prepared | Moment connections, vibration-sensitive | Torque/turn-of-nut verification |
| Welded — CJP (Complete Joint Penetration) | Full-fusion weld through entire joint | Moment frame beam-flange-to-column | UT or RT required per AWS D1.1 |
| Welded — PJP (Partial Joint Penetration) | Fusion through partial thickness | Non-critical connections | Visual inspection typically sufficient |
| Welded — Fillet | Triangular weld at joint intersection | Most common steel weld type | Visual + dimensional check |

> **BLOCK — Licensed Professional Required**
>
> Structural steel connection design requires engineering by a licensed structural engineer (SE) or professional engineer (PE). Field modifications to steel connections — including additional bolt holes, weld alterations, or member cuts — must be approved by the engineer of record.
>
> **Required professional:** Licensed Structural Engineer (SE) or Professional Engineer (PE)
> **Why:** Improper steel connections are a primary failure mode in earthquakes. Post-Northridge (1994) research revealed that pre-qualified moment connections failed in ways not anticipated by design codes, leading to fundamental changes in steel seismic design (AISC 341, AISC 358).
> **Code basis:** IBC 2024/2021 Section 1704 (Special Inspections), AISC 341 (Seismic Provisions) [CODE-01, STD-20]

---

### 2.4 Concrete and Masonry

#### L1 View — The Heavy Builders

Concrete and masonry are used for foundations (nearly universal), commercial buildings, and specialized structures. Concrete is made from cement, water, and aggregate (sand and gravel or crushed rock). In the PNW, most concrete uses basalt aggregate — the dark volcanic rock that is abundant throughout the region.

**Types of concrete construction:**

- **Cast-in-place (CIP):** Liquid concrete poured into forms built on site. Used for foundations, slabs, walls, and entire building frames.
- **Precast concrete:** Concrete elements manufactured in a factory, transported to the site, and lifted into position by crane.
- **Tilt-up:** Concrete wall panels cast flat on the building's floor slab, then tilted upright by crane. Common for PNW commercial and industrial buildings.
- **CMU (Concrete Masonry Unit):** Hollow concrete blocks stacked and grouted to form walls. Often used for foundations, retaining walls, and commercial structures.

#### L3 View — Concrete Mix Design and PNW Considerations

**Standard Concrete Mix Parameters (L3/L5):**

| Application | Min f'c (psi) | Max w/c Ratio | Slump (in) | Air Content | Code Reference |
|-------------|-------------|-------------|-----------|-------------|----------------|
| Residential footings | 2,500 | 0.50 | 4-6 | 4-7% (exposed) | IRC R402.2 |
| Residential slabs | 2,500 | 0.45 (exterior) | 4-6 | 5-7% (exterior) | IRC R402.2 |
| Foundation walls | 2,500 | 0.50 | 4-6 | 4-7% (exposed) | IRC R404 |
| Structural elements (IBC) | 3,000-5,000 | per ACI 318 | per specification | per exposure class | IBC Ch. 19 |
| Driveways / exterior flatwork | 4,000 | 0.45 | 4-5 | 5-7% | ACI 318 |

> **PNW Regional Note:**
> PNW concrete mix design has several regional characteristics:
> - **Basalt aggregate:** The dominant coite aggregate in OR and WA is basalt, a dense volcanic rock. Basalt aggregate produces strong, durable concrete but can be angular, requiring slightly more cement paste than rounded river gravel.
> - **Marine exposure:** Coastal PNW structures require enhanced concrete durability. ACI 318 exposure classes C1/C2 (corrosion from chlorides) apply to structures within the marine spray zone. Minimum f'c of 4,000-5,000 psi with reduced w/c ratios is typical for marine exposure.
> - **Freeze-thaw:** Eastern Oregon and Washington (Climate Zone 5B) experience significant freeze-thaw cycling. Air-entraining admixtures are essential for any exposed concrete. Western PNW (Climate Zone 4C) has milder freeze-thaw exposure but air entrainment is still standard practice for exterior concrete [CODE-01, STD-01, STD-09].
>
> *Applies to: Both OR and WA*

**CMU (Concrete Masonry) in PNW:**

CMU construction in the PNW requires special attention to seismic reinforcement. For Seismic Design Category D, all CMU walls must be reinforced (no unreinforced masonry permitted for structural applications) per IBC Section 2106 and TMS 402 [CODE-01].

| CMU Configuration | Reinforcement Requirement (SDC D) | Grouting |
|------------------|----------------------------------|---------|
| Load-bearing walls | Vertical: #4 @ 48" OC min; Horizontal: Bond beams @ 48" OC with #4 min | Grouted cells at reinforcement |
| Shear walls | Vertical: #4 @ 24" OC min; Horizontal: #4 @ 24" OC min | Fully grouted |
| Non-structural partitions | May be unreinforced | Ungrouted permitted |

---

### 2.5 Hybrid Systems

#### L2 View — Combining Materials

Many modern buildings combine structural materials to take advantage of each material's strengths. The most common hybrid system in PNW construction is the wood-over-concrete podium:

**Podium Construction (Type V over Type I):**

A concrete or steel first story (the "podium") supports wood-frame construction above. This allows commercial or parking use on the ground floor with residential above. IBC 2021/2024 Section 510.2 governs this configuration [CODE-01].

| Configuration | Max Wood Stories | Total Height Limit | Podium Requirements | PNW Application |
|---------------|-----------------|-------------------|--------------------|--------------------|
| 1-story podium + Type V-A wood | 5 stories wood | Per Table 504.3 + podium | 3-hr fire rating, sprinklered | Mixed-use apartments (Portland, Seattle) |
| 1-story podium + Type V-B wood | 4 stories wood | Per Table 504.3 + podium | 3-hr fire rating, sprinklered | Mid-rise apartments |
| 2-story podium + Type V-A wood | 5 stories wood | Per Table 504.3 + podium | 3-hr fire rating at each podium level | Larger mixed-use developments |

> **GATE — Verify Before Proceeding**
>
> Before designing a podium building:
> - [ ] Verify the podium level fire-resistance rating meets IBC 510.2 requirements
> - [ ] Confirm the seismic force-resisting system is continuous through the podium level to the foundation — wood-to-concrete transitions require careful connection design
> - [ ] Verify the fire separation between podium and wood levels meets 3-hour minimum
>
> **If any item cannot be confirmed:** Engage a licensed structural engineer and fire protection engineer before proceeding [CODE-01, CODE-04].

**Other Common Hybrid Systems:**

- **Steel moment frame with wood infill:** Steel frame provides seismic resistance; wood framing fills wall bays. Common in mid-rise commercial/mixed-use.
- **Concrete core with mass timber floors:** Concrete elevator/stair cores provide lateral resistance; CLT or glulam floor systems span to the core. Emerging system type in tall mass timber buildings.
- **Wood-frame walls on steel beams:** Open ground-floor commercial with wood-frame residential above, using steel beams to create the column-free ground floor. Transfer beams at the first floor require careful engineering for seismic load path.

---

## Part 3: Foundation Types for PNW Soils

### L1 View — What Your House Sits On

Your foundation is where your house meets the earth. It serves three critical purposes: (1) spreading the building's weight over enough soil so the house does not sink, (2) anchoring the building to the ground so it does not slide in an earthquake or blow away in a storm, and (3) keeping water and soil gases (including radon) out of the living space [CODE-01, STD-02].

> **PNW Regional Note:**
> The Pacific Northwest has extremely varied soil conditions due to its geological history of volcanic eruptions, glacial activity, and river systems. Within a single city block, you might find glacial till (dense, hard-packed soil from the Ice Age), alluvial deposits (loose sand and gravel deposited by rivers), volcanic ash layers, or expansive clays that swell and shrink with moisture changes. This soil variability means that foundation design in the PNW is rarely "one size fits all" — what works on one lot may be completely wrong for the lot next door [CODE-04].
>
> *Applies to: Both OR and WA*

### L2/L3 View — Foundation Types

| Foundation Type | Description | Best For | PNW Soil Suitability | Cost Range (2026 PNW) |
|----------------|-------------|----------|---------------------|----------------------|
| Spread footing | Individual concrete pads under columns or posts | Posts, decks, additions | Stable bearing soils (glacial till, dense gravel) | $200-600 per footing |
| Continuous footing | Continuous concrete strip under bearing walls | Most residential construction | Standard for most PNW soils | $8-15 per LF |
| Stem wall + footing | Continuous footing with concrete or CMU wall rising to floor level | Crawlspace homes (very common in PNW) | Standard | $25-45 per LF |
| Slab-on-grade | Concrete floor slab directly on prepared ground | Garages, some residential, commercial | Well-drained soils, adequate compaction | $5-9 per SF |
| Pier/post | Concrete piers or wood posts set into the ground or on pads | Decks, elevated structures, slopes | Sloping sites, good bearing at depth | $300-800 per pier |
| Deep pile (driven) | Steel, concrete, or timber piles driven to refusal | Poor surface soils, high loads | Soft alluvial soils, fill areas (Portland waterfront, Seattle tideflats) | $50-150 per LF of pile |
| Deep pile (drilled shaft/caisson) | Drilled hole filled with reinforced concrete | Very poor soils, heavy structures | Areas with cobbles/boulders that prevent driving | $100-300 per LF of shaft |
| Helical piles | Steel shafts with helical flights screwed into soil | Retrofits, limited access, light structures | Variable soils, underpinning | $1,000-3,000 per pile installed |

> **Note:**
> Foundation cost estimates are PNW metro area, Q1 2026, for residential-scale construction. Commercial foundations can cost significantly more. Site conditions, access, and soil conditions create wide cost variation.

### L3 View — PNW Soil Conditions and Frost Depth

**Characteristic PNW Soil Types:**

| Soil Type | Origin | Bearing Capacity (typical) | Drainage | Locations | Foundation Concerns |
|-----------|--------|--------------------------|----------|-----------|-------------------|
| Glacial till | Pleistocene glaciation | 3,000-8,000 psf (excellent) | Good | Seattle, Puget Sound region | Dense — difficult excavation |
| Alluvial deposits | River/stream deposition | 1,000-3,000 psf (variable) | Variable | Portland metro, Willamette Valley, river floodplains | Potential liquefaction in seismic event |
| Volcanic ash/loess | Volcanic eruptions, wind | 1,000-2,000 psf (low) | Poor when disturbed | Eastern OR/WA, scattered western sites | Collapses when saturated, compressible |
| Expansive clays | Weathered basalt, sedimentary | 1,500-3,000 psf | Poor | Southwest OR, parts of Willamette Valley | Shrink-swell causes foundation movement |
| Peat/organic soils | Decomposed vegetation | <500 psf (very poor) | Poor | Lowlands, old lake beds, tideflats | Cannot support structures — must be removed or bypassed with piles |
| Basalt bedrock | Volcanic flows | >10,000 psf (excellent) | N/A (impermeable) | Throughout PNW, often shallow on hillsides | Excellent bearing, difficult to excavate |

**Frost Depth Requirements [STD-02, STD-10]:**

| Location | Frost Depth (min footing depth) | Code Reference |
|----------|-------------------------------|----------------|
| Western Oregon (Willamette Valley, Coast) | 12 inches | ORSC 2023 R403.1.4 |
| Portland metro | 12 inches | ORSC 2023 R403.1.4 |
| Eastern Oregon (Bend, La Grande, Pendleton) | 18-24 inches | ORSC 2023 R403.1.4 |
| Western Washington (Seattle, Olympia, Coast) | 12 inches | WAC 51-51 (IRC R403.1.4) |
| Eastern Washington (Spokane, Wenatchee, Tri-Cities) | 24 inches | WAC 51-51 (IRC R403.1.4) |

> **Note:**
> Frost depth requirements are minimums. Many PNW jurisdictions require deeper footings to reach adequate bearing soil. Always verify local requirements with the building department having jurisdiction.

### L5 View — Soil Mechanics and Foundation Engineering

**Bearing Capacity — Terzaghi's Equation (general shear failure):**

For a strip footing:

```
q_ult = c * N_c + q * N_q + 0.5 * gamma * B * N_gamma
```

Where:
- q_ult = ultimate bearing capacity (psf)
- c = soil cohesion (psf)
- q = effective overburden pressure at footing depth = gamma * D_f (psf)
- gamma = unit weight of soil (pcf)
- B = footing width (ft)
- N_c, N_q, N_gamma = bearing capacity factors (function of soil friction angle phi)
- D_f = depth of footing below grade (ft)

**Allowable bearing capacity:**

```
q_a = q_ult / FS
```

Where FS = factor of safety, typically 3.0 for dead + live load combinations.

**PNW Liquefaction Assessment (Critical for SDC D):**

Sites with loose, saturated, granular soils (alluvial deposits, fill, tideflats) must be evaluated for liquefaction potential per ASCE 7-22 Section 11.8.3 [CODE-04]. The Simplified Procedure (Seed-Idriss) is the standard practice:

1. Determine the Cyclic Stress Ratio (CSR) induced by the design earthquake
2. Determine the Cyclic Resistance Ratio (CRR) from SPT or CPT data
3. Compute Factor of Safety against liquefaction: FS = CRR / CSR
4. If FS < 1.0 for any liquefiable layer, mitigation is required (deep foundations, ground improvement, or structural design for liquefied conditions)

> **BLOCK — Licensed Professional Required**
>
> Geotechnical investigation and foundation design for sites with poor soils, steep slopes, or liquefaction potential requires a licensed geotechnical engineer. Foundation design beyond prescriptive IRC provisions requires a licensed structural engineer (SE) or professional engineer (PE).
>
> **Required professional:** Licensed Geotechnical Engineer (PE) and Structural Engineer (SE/PE)
> **Why:** Inadequate foundation design is the most common cause of building distress and the most difficult and expensive problem to correct after construction.
> **Code basis:** IBC 2024/2021 Section 1803 (Geotechnical Investigations), IRC 2021 R401.4 (soil tests for expansive soils) [CODE-01, STD-01, STD-09]

---

## Part 4: Materials Science

### Douglas Fir — The PNW Structural Workhorse

#### L1 View

Douglas fir (Pseudotsuga menziesii) is the primary structural lumber species in the Pacific Northwest. It is used for studs, joists, rafters, beams, and engineered wood products. Douglas fir is prized for its exceptional strength-to-weight ratio, stiffness, and availability — the PNW grows more Douglas fir than any other region in the world [STD-19].

#### L3 View — NDS Reference Design Values

**Douglas Fir-Larch (DF-L) Sawn Lumber — Select Structural Grade:**

| Property | Symbol | Value | Units | Conditions |
|----------|--------|-------|-------|-----------|
| Bending | F_b | 1,500 | psi | 2x10 and smaller |
| Tension parallel to grain | F_t | 1,000 | psi | 2x10 and smaller |
| Shear parallel to grain | F_v | 180 | psi | All sizes |
| Compression perpendicular to grain | F_c_perp | 625 | psi | All sizes |
| Compression parallel to grain | F_c | 1,700 | psi | 2x10 and smaller |
| Modulus of Elasticity | E | 1,900,000 | psi | Average |
| Modulus of Elasticity (min) | E_min | 690,000 | psi | For stability calculations |

**Source:** NDS Supplement, Table 4A — Reference Design Values for Visually Graded Dimension Lumber [STD-19]

> **Note:**
> Design values vary significantly by grade. No. 2 Douglas Fir-Larch (the most commonly specified grade for residential construction) has F_b = 900 psi, substantially lower than Select Structural. Always verify the grade stamp on delivered lumber matches the specified grade.

**Common Douglas Fir-Larch Grades for Residential Construction:**

| Grade | F_b (psi) | E (psi) | Typical Use | Visual Characteristics |
|-------|----------|---------|-------------|----------------------|
| Select Structural | 1,500 | 1,900,000 | Exposed beams, headers, critical members | Few knots, tight grain |
| No. 1 | 1,200 | 1,800,000 | Floor joists, rafters | Small tight knots |
| No. 2 | 900 | 1,600,000 | Studs, general framing | Moderate knots, standard construction grade |
| No. 3 / Stud | 525 | 1,400,000 | Non-structural, stud walls (limited) | Large knots, more defects |

### Western Red Cedar — Exterior Applications

#### L2 View

Western red cedar (Thuja plicata) is the PNW's premier exterior wood. It is not a structural powerhouse like Douglas fir — its strength values are roughly 60% of DF-L — but it has natural decay resistance from extractive chemicals (thujaplicin) in the heartwood. This makes it the traditional choice for siding, decking, fencing, shingles, and exterior trim in the PNW, where rain exposure is extreme [STD-19].

**Cedar vs. Douglas Fir for Exterior Applications:**

| Factor | Western Red Cedar | Douglas Fir (treated) |
|--------|------------------|---------------------|
| Decay resistance | Excellent (heartwood only, untreated) | Requires pressure treatment |
| Dimensional stability | Excellent — low shrink/swell | Moderate — more movement |
| Weight | Light (23 pcf) | Heavy (34 pcf) |
| Workability | Easy — cuts, nails, finishes easily | Harder — denser, more splitting |
| Structural strength | Moderate (F_b = 850 psi, No. 2) | High (F_b = 900 psi, No. 2) |
| Cost (2026 PNW) | Premium ($3-5/BF) | Standard ($1.50-3/BF) |
| Sustainability | PNW native, slower growth | PNW native, faster growth |
| Paint/stain holding | Good — accepts stain well | Good with proper prep |

### Fasteners and Connections — PNW Practice

#### L2/L3 View

Structural connections are where the load path is most likely to fail. In the PNW, seismic forces make connection design critically important. The major connection hardware categories:

**Simpson Strong-Tie Connectors (Industry Standard):**

| Connector | Function | Typical Load Rating | Application |
|-----------|----------|-------------------|-------------|
| A35 / A34 | Framing angle | 585 lb (A35, uplift) | Rafter-to-plate, joist-to-beam |
| H1 / H2.5 | Hurricane/seismic tie | 490 lb (H1, uplift) | Rafter-to-top plate |
| LUS/LU joist hangers | Joist support | Varies by model (1,000-5,000+ lb) | Floor joist to beam or header |
| HDU hold-down | Shear wall overturning restraint | 3,285-14,930 lb (varies by model) | Shear wall end posts to foundation |
| LSTA / MSTA straps | Tension tie, hold-down alternative | 1,025-1,815 lb | Continuous tie-down, stacked walls |
| STHD / DTT hold-down | High-capacity overturning restraint | 7,700-14,000+ lb | Engineered shear walls in seismic zones |
| Mudsill anchors (SSTB) | Sill plate to foundation | Per anchor bolt capacity | Foundation-to-wall connection |

**Nailing Schedules (L3 — Know These for Exams):**

| Connection | Nail Size | Quantity/Spacing | Code Reference |
|-----------|----------|-----------------|----------------|
| Stud to bottom plate (end nail) | 16d common (3-1/2" x 0.162") | 2 per stud | IRC Table R602.3(1) |
| Stud to top plate (end nail) | 16d common | 2 per stud | IRC Table R602.3(1) |
| Double top plate splice | 16d common | 8 nails per splice | IRC Table R602.3(1) |
| Subfloor to joist (6"/12" schedule) | 8d common (2-1/2" x 0.131") | 6" OC edges, 12" OC field | IRC Table R602.3(1) |
| WSP shear panel (standard) | 8d common | 6" OC edges, 12" OC field | IRC R602.10.4 |
| WSP shear panel (high seismic) | 8d common | 4" OC edges, 12" OC field | IRC R602.10.4 |
| WSP shear panel (high shear walls) | 10d common (3" x 0.148") | 3" OC edges, 12" OC field | Per engineering |
| Joist to sill or girder (toenail) | 3-8d common | 3 per joist | IRC Table R602.3(1) |
| Rim board to top plate | 8d common | 6" OC | IRC Table R602.3(1) |

> **Note:**
> "Common" nails have larger diameter shanks than "box" or "sinker" nails of the same penny designation. Structural connections require common nails or equivalent-capacity pneumatic nails. Many nail guns drive nails with smaller diameters than common nails — verify that pneumatic nail capacity equals or exceeds the required common nail capacity. This is a frequent source of inspection failures.

### Steel and Concrete Materials

#### L3/L5 View — Reinforcing Steel and Bolt Grades

**Reinforcing Steel (Rebar):**

| Grade | Designation | Yield Strength | Ultimate Strength | Application |
|-------|-----------|---------------|-------------------|-------------|
| Grade 40 | ASTM A615 | 40 ksi | 60 ksi | Light-duty, non-seismic |
| Grade 60 | ASTM A615 | 60 ksi | 90 ksi | Standard structural — most common |
| Grade 80 | ASTM A615 | 80 ksi | 105 ksi | High-performance, reduced congestion |
| Grade 60 (low-carbon) | ASTM A706 | 60 ksi | 80 ksi min | Seismic applications — weldable, controlled yield |

> **Note:**
> ASTM A706 Grade 60 rebar is specified for seismic detailing in PNW construction because it has a controlled yield strength range and a minimum ratio of ultimate-to-yield strength of 1.25, ensuring ductile behavior during earthquakes [CODE-01, CODE-04].

**Anchor Bolt Requirements — Foundation (L2/L3):**

| Requirement | IRC Prescriptive | Engineered (IBC) |
|-------------|-----------------|------------------|
| Bolt diameter | 1/2" min | Per design |
| Embedment | 7" min into concrete | Per ACI 318 anchor design |
| Spacing | 6 ft OC max | Per design |
| Edge distance | Per bolt diameter (1.75" min typical for 1/2" bolt) | Per ACI 318 |
| Washer | Standard cut washer or plate washer | Per connection design |
| Within 12" of each end of sill plate | Required | Required |

**Source:** IRC 2021 R403.1.6 [STD-02, STD-10]

---

## Part 5: Seismic Design for the Pacific Northwest

### L1 View — Earthquake Country

The Pacific Northwest is earthquake country. The region sits along the Cascadia Subduction Zone (CSZ), where the Juan de Fuca oceanic plate is diving beneath the North American continental plate. This subduction zone is capable of producing the largest earthquakes on Earth — magnitude 9.0 or greater. The last great Cascadia earthquake occurred on January 26, 1700, generating a massive tsunami that struck both the PNW coast and Japan [CODE-04, GOV-05].

**Key facts every PNW homeowner should know:**

- The USGS estimates a 37% probability of a magnitude 7.1 or greater earthquake in the PNW in the next 50 years [CODE-04, GOV-05].
- The Cascadia Subduction Zone has produced at least 41 major earthquakes in the last 10,000 years, with an average recurrence interval of approximately 240 years. The current interval since the last event exceeds 326 years.
- Portland and Seattle both have significant inventories of older buildings that predate modern seismic codes.
- Pre-1974 homes in Oregon were not required to be anchored to their foundations [STD-16].
- Pre-1993 homes in Oregon were built before seismic code requirements were added to the Oregon building code [STD-16, GOV-01].

#### Self-Assessment: Is My Home Earthquake-Ready?

1. [ ] Was your home built after 1993? (If NO, it may lack seismic code compliance)
2. [ ] Can you see anchor bolts where the wood framing meets the concrete foundation? (Check in crawlspace or basement)
3. [ ] Do your cripple walls (short wood-frame walls between the foundation and the first floor) have plywood on them?
4. [ ] Is your water heater strapped to the wall?
5. [ ] Are your chimneys reinforced or braced?
   - If YES to all: Your home has basic seismic provisions. Consider a professional seismic evaluation for additional improvements.
   - If NO to any: Contact a licensed contractor for a seismic evaluation. See retrofit options below.

### L2 View — Homeowner Seismic Retrofit (Prescriptive)

> **GATE — Verify Before Proceeding**
>
> Before beginning any seismic retrofit work:
> - [ ] Determine your home's construction date (county assessor records or permit history)
> - [ ] Inspect the crawlspace for existing anchor bolts and cripple wall bracing
> - [ ] Check if your city offers a prescriptive seismic retrofit program (Portland and Seattle both do)
> - [ ] Verify whether a permit is required (varies by jurisdiction — Portland and Seattle have streamlined permit processes for prescriptive retrofits)
>
> **If any item cannot be confirmed:** Contact your local building department or a licensed contractor specializing in seismic retrofits.

**Portland Prescriptive Residential Retrofit [STD-16, GOV-03]:**

| Component | Specification | Notes |
|-----------|--------------|-------|
| Foundation anchoring | 1/2" anchor bolts or approved retrofit anchors (e.g., Simpson UFP10) | Attach mudsill to foundation |
| Cripple wall bracing material | 1/2" CDX 5-ply plywood | Not OSB — plywood specifically required |
| Plywood coverage — 1-story home | 40% of cripple wall length | Concentrated at corners |
| Plywood coverage — 2-story home | 50% of cripple wall length | More coverage for heavier structure |
| Plywood coverage — 3-story home | 80% of cripple wall length | Nearly full bracing |
| Plywood nailing | 8d common nails, 4" OC at edges, 12" OC at field | Critical — inspect nail spacing |
| Sill plate connection | Bolts or approved anchors at 6 ft OC max, within 12" of each end | Both new and existing plates |

**Seattle SDCI Prescriptive Retrofit — ABC Approach [GOV-04]:**

| Step | Description | Purpose |
|------|-------------|---------|
| **A** — Anchor to foundation | Install foundation bolts or approved anchors connecting mudsill to foundation | Prevents house from sliding off foundation |
| **B** — Brace cripple walls | Install structural plywood on cripple walls between foundation and first floor | Prevents cripple walls from collapsing |
| **C** — Connect to first floor | Install framing connectors between first-floor framing and top of cripple walls | Completes the load path from house to foundation |

**Cost Ranges (2026, PNW Metro Areas):**

| Retrofit Component | Typical Range | Timeline | Notes |
|-------------------|-------------|----------|-------|
| Foundation bolting only | $2,000-5,000 | 1-3 days | Depends on access, number of bolts |
| Cripple wall bracing only | $3,000-7,000 | 2-4 days | Depends on wall length and access |
| Complete retrofit (A+B+C) | $5,000-15,000 | 3-7 days | Portland/Seattle prescriptive program |
| Engineered retrofit (complex) | $10,000-40,000+ | 1-4 weeks | Required for non-standard conditions |

> **Note:**
> These cost estimates are for standard residential conditions with crawlspace access. Homes on hillsides, homes without crawlspace access, or homes with unusual foundations may cost significantly more. Some Oregon cities offer seismic retrofit incentive programs.

### L3/L4 View — Seismic Code Framework

**ASCE 7-22 Seismic Load Determination [CODE-04]:**

The seismic design process follows ASCE 7-22, adopted by reference in both the IBC (2024 in Oregon via OSSC 2025, 2021 in Washington via WAC 51-50) and the IRC [CODE-01, STD-01, STD-09]:

**Step 1: Site Classification (ASCE 7-22 Chapter 20)**

| Site Class | Description | Typical v_s30 (ft/s) | PNW Example |
|-----------|-------------|---------------------|-------------|
| A | Hard rock | >5,000 | Basalt bedrock (Columbia Gorge, Cascades foothills) |
| B | Rock | 2,500-5,000 | Weathered basalt, competent sandstone |
| BC | Transition | 1,450-2,500 | Dense glacial till, weathered rock |
| C | Very dense soil/soft rock | 1,200-1,450 | Dense glacial deposits (parts of Seattle) |
| CD | Transition | 850-1,200 | Stiff clays, dense sands |
| D | Stiff soil | 600-850 | Most Willamette Valley soils, standard alluvium |
| DE | Transition | 450-600 | Soft-to-medium clays, loose sands |
| E | Soft clay | <450 | Peat, soft fill (Portland waterfront, Seattle tideflats) |
| F | Special soils | N/A | Liquefiable soils, sensitive clays, peat >10 ft — requires site-specific analysis |

> **Note:**
> ASCE 7-22 introduced a revised site classification system with intermediate classes (BC, CD, DE) and new spectral acceleration definitions. Projects designed under ASCE 7-16 used only classes A-F without intermediates.

**Step 2: Determine Spectral Acceleration Parameters**

Using the USGS Unified Hazard Tool (or ASCE 7 Hazard Tool) with the site coordinates:
- S_S = mapped spectral response acceleration at short periods (0.2 sec)
- S_1 = mapped spectral response acceleration at 1-second period
- Apply site coefficients to determine design spectral response acceleration parameters S_DS and S_D1

**Typical PNW Design Spectral Accelerations (approximate, site-specific values vary):**

| City | S_DS (g) | S_D1 (g) | SDC | Notes |
|------|---------|---------|-----|-------|
| Portland (Site Class D) | 0.85-1.00 | 0.40-0.55 | D1-D2 | Varies significantly by neighborhood |
| Seattle (Site Class D) | 1.00-1.20 | 0.45-0.65 | D1-D2 | Higher values near waterfront |
| Eugene | 0.70-0.90 | 0.35-0.45 | D1 | Lower than Portland/Seattle |
| Spokane | 0.30-0.45 | 0.12-0.18 | C-D1 | Much lower seismic demand than west side |
| Bend | 0.40-0.60 | 0.15-0.25 | C-D1 | Moderate seismic, high snow loads |

**Step 3: Determine Seismic Design Category (SDC)**

SDC is determined from Tables 11.6-1 and 11.6-2 of ASCE 7-22 based on S_DS, S_D1, and Risk Category. Most PNW buildings (Risk Category II) west of the Cascades are SDC D1 or D2 [CODE-04].

**SDC Implications:**

| SDC | Structural Design Impact | Analysis Method Required |
|-----|------------------------|------------------------|
| A | Minimal seismic requirements | Simplified (equivalent lateral force only) |
| B | Basic seismic detailing | Equivalent lateral force |
| C | Intermediate detailing, some system restrictions | Equivalent lateral force or modal |
| D0/D1/D2 | Special detailing, significant system restrictions, redundancy | Equivalent lateral force, modal, or nonlinear |
| E/F | Most restrictive, essential facilities | Modal or nonlinear typically required |

**Step 4: Equivalent Lateral Force Procedure (ASCE 7-22 Section 12.8)**

The base shear V:

```
V = C_s * W
```

Where:
- C_s = seismic response coefficient
- W = effective seismic weight of the building

```
C_s = S_DS / (R / I_e)
```

Subject to:
- Maximum: C_s = S_D1 / (T * (R / I_e)) for T ≤ T_L
- Minimum: C_s = max(0.044 * S_DS * I_e, 0.01)
- For S_1 ≥ 0.6g: C_s ≥ 0.5 * S_1 / (R / I_e)

Where:
- R = response modification coefficient (from ASCE 7-22 Table 12.2-1)
- I_e = importance factor (1.0 for Risk Category II)
- T = fundamental period of the building (sec)
- T_L = long-period transition period (from ASCE 7-22 maps)

### L4 View — Portland Chapter 24.85 and ASCE 41

**Portland City Code Chapter 24.85 — Seismic Design Standards for Existing Buildings [STD-16, GOV-03]:**

Portland's Ch. 24.85 mandates seismic evaluation and possible retrofit for existing buildings undergoing:
- Change of use or occupancy classification
- Significant structural alterations
- Additions (in some cases)

The evaluation follows ASCE 41-17 (Seismic Evaluation and Retrofit of Existing Buildings) [CODE-04]:

**ASCE 41-17 Evaluation Tiers:**

| Tier | Name | Scope | When Required |
|------|------|-------|--------------|
| Tier 1 | Screening | Checklist-based evaluation using standardized deficiency lists | Initial evaluation — all projects |
| Tier 2 | Deficiency-Based | Detailed evaluation of deficiencies identified in Tier 1 | When Tier 1 identifies potential deficiencies |
| Tier 3 | Systematic | Complete structural analysis (linear or nonlinear) | Complex buildings, Tier 2 inconclusive, voluntary upgrades |

**Performance Objective — BPOE (Basic Performance Objective for Existing Buildings):**

BPOE requires that the building achieve Life Safety performance under the BSE-1E earthquake (75% of BSE-2E, which is approximately the IBC design earthquake) [CODE-04, STD-16].

### L5 View — ASCE 41-17 Evaluation Methodology

**Tier 1 Structural Checklist Deficiencies (Common PNW Findings):**

| Deficiency | Building Type | Significance | Common in Pre-[Year] |
|-----------|--------------|-------------|---------------------|
| No positive connection to foundation | W1 (light wood-frame) | High — sliding failure | Pre-1974 (OR), Pre-1960 (WA) |
| Unbraced cripple walls | W1 | High — collapse mechanism | Pre-1960 |
| Soft/weak story (open ground floor) | W1a (multi-unit), C1, S1 | High — collapse mechanism | All eras |
| Unreinforced masonry (URM) walls | URM | High — collapse, falling hazard | Pre-1950 |
| Non-ductile concrete frames | C1 | High — brittle failure | Pre-1975 |
| Inadequate diaphragm-to-wall connections | All types | Moderate-High | Pre-1970 |
| Short columns (captive columns) | C1, C2 | High — shear failure | All eras |

**FEMA Publications for PNW Practice [GOV-05]:**

| Publication | Title | Application |
|-------------|-------|-------------|
| FEMA 154 | Rapid Visual Screening of Buildings for Potential Seismic Hazards | Pre-evaluation screening, portfolio-level assessment |
| FEMA P-1100 | Vulnerability-Based Assessment and Retrofit of One- and Two-Family Dwellings | Residential retrofit engineering guidance |
| FEMA E-74 | Reducing the Risks of Nonstructural Earthquake Damage — A Practical Guide | Non-structural component bracing |
| ASCE/SEI 31-03 | Seismic Evaluation of Existing Buildings | Predecessor to ASCE 41, still referenced in some jurisdictions |

---

## Part 6: Load Path Analysis

### L1 View — The Chain That Holds Your House Together

Think of your building's structure as a chain. Every link must be connected to the next. The "load path" is the route that forces take from the top of your building (where wind pushes and snow piles up and earthquakes shake) down to the earth. If any link in this chain is broken — a missing connector, an unbolted sill plate, a wall that is not attached to the floor below — the entire system can fail [CODE-01, CODE-04].

Two types of forces travel through this chain:

- **Gravity loads** (vertical): The weight of the roof, floors, walls, furniture, people, and snow pushes straight down. These forces are always present.
- **Lateral loads** (horizontal): Wind and earthquake forces push sideways. These forces are intermittent but can be enormous.

### L3 View — Continuous Load Path Connections

The load path concept requires every structural element to be connected to the elements above and below it with sufficient capacity to transfer all applied loads. For lateral loads in the PNW (seismic controls over wind in most locations), this means [CODE-04, STD-19]:

**Complete Gravity Load Path (Top to Bottom):**

```
Roof covering --> Roof sheathing (nailed to rafters/trusses)
  --> Rafters/Trusses (bearing on top plates)
    --> Top plates (double, nailed together and to studs)
      --> Wall studs (nailed to top and bottom plates)
        --> Bottom plate / sole plate (nailed to subfloor or rim board)
          --> Floor joists or I-joists (bearing on beams/walls)
            --> Beams / girders (bearing on columns/posts)
              --> Columns / posts (bearing on foundation piers)
                --> Spread footings / continuous footings
                  --> Soil (bearing capacity must exceed applied loads)
```

**Complete Lateral Load Path (For Seismic — Critical PNW Content):**

```
Seismic inertial forces (F = ma, distributed by floor weight)
  --> Roof diaphragm (sheathing acts as deep beam)
    --> Diaphragm-to-shear-wall connection (blocking, clips, straps)
      --> Shear walls (WSP braced wall panels)
        --> Shear wall-to-floor connection (anchor bolts or hold-downs)
          --> Floor diaphragm (subfloor sheathing)
            --> Lower shear walls (with hold-downs at overturning points)
              --> Mudsill plate (anchor bolts to foundation)
                --> Foundation (continuous footing or grade beam)
                  --> Soil (passive pressure, friction)
```

> **BLOCK — Licensed Professional Required**
>
> Load-bearing wall identification and any proposed modification to load-bearing walls, beams, columns, or foundation connections requires engineering review. Removing or cutting into a load-bearing wall without proper engineering can cause immediate or progressive structural failure.
>
> **Required professional:** Licensed Structural Engineer (SE)
> **Why:** Load-bearing walls carry cumulative weight from all floors above. What appears to be a simple interior wall may be carrying tens of thousands of pounds of load from the roof, upper floors, and the wall itself. Removal without a proper beam and post replacement design creates collapse risk.
> **Code basis:** IBC 2024/2021 Section 104.11.1 (alternative materials/methods require engineering), IRC R301.1 (design required for conditions not addressed by prescriptive provisions) [CODE-01, STD-02]

### L3/L5 View — Diaphragm Design

**Roof and Floor Diaphragms:**

Diaphragms are horizontal (or nearly horizontal) structural elements that distribute lateral forces to vertical lateral force-resisting elements (shear walls or frames). In wood-frame construction, the structural sheathing (plywood or OSB) nailed to framing members forms the diaphragm [STD-19, CODE-01].

**Diaphragm Capacity (Allowable Shear, ASD):**

| Sheathing | Thickness | Nail Size | Nail Spacing (boundary/field) | Allowable Shear (plf) | Blocked/Unblocked |
|-----------|-----------|----------|------------------------------|---------------------|------------------|
| Structural I plywood | 15/32" | 8d | 6"/12" | 360 | Blocked |
| Structural I plywood | 15/32" | 8d | 4"/12" | 530 | Blocked |
| Structural I plywood | 15/32" | 10d | 4"/12" | 720 | Blocked |
| Structural I plywood | 15/32" | 8d | 6"/12" | 180 | Unblocked |
| OSB (rated sheathing) | 7/16" | 8d | 6"/12" | 360 | Blocked |

**Source:** IBC 2024/2021 Table 2306.2 (simplified), NDS SDPWS [STD-19, CODE-01]

### L5 View — Shear Wall Design

**Shear Wall Design — Overturning Analysis:**

For a shear wall panel of length L and height H, subjected to lateral force V at the top:

**Overturning Moment:**
```
M_OT = V * H
```

**Resisting Moment (from dead load):**
```
M_R = W_dead * L / 2
```

**Net Uplift at Hold-Down:**
```
T = (M_OT - 0.6 * M_R) / L      (ASD, using 0.6D for seismic per ASCE 7-22 Load Combination 8)
```

Where 0.6 is the load factor on dead load when dead load resists overturning in the seismic load combination (0.6D + 0.7E, ASD).

**Shear Wall Aspect Ratio Limits (ASCE 7-22 / IBC):**

| Sheathing Type | Max Aspect Ratio (H:L) | Capacity Reduction for H:L > 2:1 |
|----------------|----------------------|----------------------------------|
| Wood structural panel | 3.5:1 (SDC D, wood frame) | 2b_s/h for ratios > 2:1 |
| Wood structural panel | 2:1 (no reduction) | Full capacity |

**Source:** ASCE 7-22 Table 12.2-1, SDPWS Table 4.3.3.5 [CODE-04, STD-19]

---

## Part 7: Engineering Calculations

### Worked Example 1: Beam Sizing (L3 Level)

**Given:** A Douglas Fir-Larch No. 2 beam spanning 12 feet, supporting a floor tributary width of 8 feet. Dead load = 15 psf, Live load = 40 psf. Simple span, uniformly loaded. Adequate lateral support.

**Find:** Minimum beam size using ASD.

**Code reference:** NDS [STD-19], IBC Table 1604.3 [CODE-01]

**Solution:**

**Step 1:** Calculate total load per linear foot

```
w_D = 15 psf * 8 ft = 120 plf
w_L = 40 psf * 8 ft = 320 plf
w_total = 120 + 320 = 440 plf
```

**Step 2:** Calculate maximum moment and shear

```
M_max = w * L^2 / 8 = 440 * (12)^2 / 8 = 7,920 ft-lb = 95,040 in-lb
V_max = w * L / 2 = 440 * 12 / 2 = 2,640 lb
```

**Step 3:** Determine required section modulus

For No. 2 DF-L, F_b = 900 psi. Apply adjustment factors:
- C_D = 1.0 (normal duration — floor live load)
- C_M = 1.0 (dry conditions)
- C_t = 1.0 (normal temperature)
- C_F = size factor (depends on member size — assume 1.0 initially, verify after sizing)
- C_L = 1.0 (adequate lateral support)
- C_r = 1.0 (single member, not repetitive)

```
F'_b = 900 * 1.0 * 1.0 * 1.0 * 1.0 * 1.0 * 1.0 = 900 psi
S_required = M / F'_b = 95,040 / 900 = 105.6 in^3
```

**Step 4:** Select beam size

| Size | S (in^3) | I (in^4) | Check |
|------|---------|---------|-------|
| 4x14 | 102.4 | 678.5 | Insufficient (102.4 < 105.6) |
| 6x12 | 121.2 | 697.1 | OK |
| 4x16 | 135.7 | 1034.4 | OK |

Try 6x12 (actual 5.5" x 11.25"): S = 121.2 in^3

**Step 5:** Verify size factor C_F for 6x12 (NDS Table 4A supplement):
- C_F for F_b, 6x12 = 1.0
- F'_b = 900 * 1.0 = 900 psi
- f_b = 95,040 / 121.2 = 784 psi < 900 psi **OK**

**Step 6:** Check shear

```
f_v = 3V / (2bd) = 3 * 2,640 / (2 * 5.5 * 11.25) = 7,920 / 123.75 = 64 psi
F'_v = 180 psi (DF-L)
64 psi < 180 psi   **OK**
```

**Step 7:** Check deflection

Live load deflection limit: L/360 = 12 * 12 / 360 = 0.40 inches

```
delta_L = 5 * w_L * L^4 / (384 * E * I)
        = 5 * (320/12) * (144)^4 / (384 * 1,600,000 * 697.1)
        = 5 * 26.67 * 429,981,696 / (384 * 1,600,000 * 697.1)
        = 57,329,452,800 / 428,244,864,000
        = 0.134 inches < 0.40 inches   **OK**
```

**Result:** Use 6x12 No. 2 Douglas Fir-Larch. Utilization: 87% bending, 36% shear, 33% deflection.

---

### Worked Example 2: Seismic Base Shear (L5 Level)

**Project type:** New construction — two-story wood-frame residence
**Location:** Portland, Oregon (Seismic Design Category D1)

**Given Information:**

- Site Class: D (stiff soil — standard Portland alluvium)
- S_DS = 0.92g (from USGS design maps for site)
- S_D1 = 0.48g
- Risk Category: II (I_e = 1.0)
- Structural system: Wood-frame bearing wall with wood structural panel shear walls
- R = 6.5 (per ASCE 7-22 Table 12.2-1, bearing wall system, wood light-frame wall with WSP)
- Building weight: W = 85,000 lb (effective seismic weight, including dead load and applicable portions of live load per ASCE 7-22 12.7.2)
- Approximate period: T_a = C_t * h_n^x = 0.02 * 22^0.75 = 0.21 sec (ASCE 7-22 Eq. 12.8-7, where h_n = 22 ft)

**Required:** Design base shear V

**Solution:**

**Step 1:** Compute C_s

```
C_s = S_DS / (R / I_e) = 0.92 / (6.5 / 1.0) = 0.92 / 6.5 = 0.1415
```

**Step 2:** Check maximum C_s

```
C_s_max = S_D1 / (T * (R / I_e)) = 0.48 / (0.21 * 6.5) = 0.48 / 1.365 = 0.352
```

C_s = 0.1415 < 0.352, so C_s is not governed by the maximum. Use C_s = 0.1415.

**Step 3:** Check minimum C_s

```
C_s_min = max(0.044 * S_DS * I_e, 0.01)
        = max(0.044 * 0.92 * 1.0, 0.01)
        = max(0.0405, 0.01)
        = 0.0405
```

C_s = 0.1415 > 0.0405. **OK, minimum does not control.**

**Step 4:** Compute base shear

```
V = C_s * W = 0.1415 * 85,000 = 12,028 lb
```

**Step 5:** Distribute to stories (ASCE 7-22 Section 12.8.3)

For T ≤ 0.5 sec, k = 1.0 (linear distribution).

| Story | w_x (lb) | h_x (ft) | w_x * h_x^k | C_vx | F_x (lb) |
|-------|---------|---------|-------------|------|---------|
| Roof | 35,000 | 22 | 770,000 | 0.646 | 7,770 |
| 2nd Floor | 50,000 | 10 | 500,000 | 0.354 | 4,258 |
| **Sum** | **85,000** | — | **1,270,000** | **1.000** | **12,028** |

**Design Summary:**

| Parameter | Value | Code Limit | Utilization |
|-----------|-------|-----------|-------------|
| Base shear V | 12,028 lb | N/A (calculated demand) | — |
| C_s | 0.1415 | min 0.0405, max 0.352 | Within bounds |
| Story force at roof | 7,770 lb | — | To shear wall design |
| Story force at 2nd floor | 4,258 lb | — | To shear wall design |

**Discussion:**

This base shear of approximately 14.2% of the building weight is typical for wood-frame residential construction in Portland. The shear walls at each story must be designed for the cumulative story shear (roof level: 7,770 lb; ground level: 12,028 lb). Hold-down forces are calculated from the overturning moment at each shear wall. For a 4-ft minimum braced wall panel at the ground level, the unit shear is 12,028 / (total bracing length in that direction), which must be compared to the allowable shear capacity from the diaphragm/shear wall tables [STD-19, CODE-04].

---

### Worked Example 3: Hold-Down Force (L5 Level)

**Given:** A ground-floor shear wall panel in the Portland residence from Example 2.

- Panel length: L = 8 ft
- Panel height: H = 9 ft (including top and bottom plates)
- Applied shear at top of panel: V_panel = 3,500 lb (ASD level, distributed from base shear)
- Dead load on panel: W_DL = 2,400 lb (total dead load on the 8-ft panel)

**Required:** Hold-down tension force T at the overturning end of the panel.

**Solution:**

**Step 1:** Overturning moment

```
M_OT = V_panel * H = 3,500 * 9 = 31,500 ft-lb
```

**Step 2:** Resisting moment from dead load (using ASD seismic load combination)

Per ASCE 7-22 Load Combination 8 (ASD): 0.6D + 0.7E

The dead load resistance uses 0.6D:

```
M_R = 0.6 * W_DL * L / 2 = 0.6 * 2,400 * 8 / 2 = 5,760 ft-lb
```

**Step 3:** Net uplift tension

```
T = (M_OT - M_R) / L = (31,500 - 5,760) / 8 = 25,740 / 8 = 3,218 lb
```

**Step 4:** Select hold-down

| Hold-Down | Allowable Tension (ASD) | Bolts Required | Anchor Bolt |
|-----------|----------------------|----------------|-------------|
| Simpson HDU4 | 3,285 lb | (4) 1/4" SDS screws to post | 5/8" anchor bolt |
| Simpson HDU5 | 4,565 lb | (5) 1/4" SDS screws to post | 5/8" anchor bolt |

**Select HDU4:** 3,285 lb > 3,218 lb (utilization = 98%)

> **Note:**
> A 98% utilization ratio is acceptable but leaves minimal margin. In practice, an HDU5 would typically be selected to provide additional margin for construction tolerances and load path eccentricities. The anchor bolt embedment must also be checked per ACI 318 anchor design provisions, including edge distance, spacing, and concrete breakout strength.

**Code check:** 3,285 lb ≥ 3,218 lb — **PASS**

---

## Part 8: Design Examples

### Design Example: Two-Story Wood-Frame Residence — Portland, OR (L5)

**Project type:** New construction
**Location:** Portland, Oregon — Seismic Design Category D1
**Complexity:** Professional practice / SE exam level

#### Given Information

- Two-story wood-frame residence, 1,800 SF per floor
- Plan dimensions: 36 ft x 50 ft
- Floor-to-floor height: 9 ft (each story)
- Roof: truss system, 6:12 pitch, composition shingles
- Walls: 2x6 at 16" OC, WSP (7/16" OSB) sheathing
- Foundation: Continuous spread footing with stem wall, 18" below grade
- Site Class D, S_DS = 0.92g, S_D1 = 0.48g
- Seismic design per ASCE 7-22 [CODE-04]
- Wood design per NDS [STD-19]
- Foundation per IRC/IBC [CODE-01, STD-02]

#### Required

1. Seismic base shear and force distribution (completed in Example 2 above)
2. Shear wall layout and design for the long direction (50-ft dimension)
3. Hold-down selection for critical shear wall panels
4. Foundation anchor bolt spacing verification

#### Solution

**Shear Wall Layout (Long Direction — North-South):**

Assume two shear wall lines in the 50-ft direction, at the east and west exterior walls. Each wall line resists half the total base shear (symmetric building):

```
V_per_wall_line = V / 2 = 12,028 / 2 = 6,014 lb (ASD)
```

Each wall line has the following openings:
- Wall length: 36 ft
- Windows and doors reduce effective bracing length
- Available bracing: 4 panels at 4 ft each = 16 ft of braced wall
- Net bracing ratio: 16/36 = 44% (meets IRC minimum for SDC D)

**Unit shear per bracing line:**
```
v = V_per_wall_line / bracing_length = 6,014 / 16 = 376 plf
```

**Check against WSP capacity:**
- 7/16" OSB, 8d nails at 6"/12" (edge/field): Allowable = 360 plf (blocked)
- 376 > 360 — **FAILS** at 6"/12" schedule

**Revise nailing to 4"/12":**
- 7/16" OSB, 8d nails at 4"/12": Allowable = 530 plf (blocked)
- 376 < 530 — **PASSES** (utilization = 71%)

**Select: 7/16" OSB with 8d common nails at 4" OC edges, 12" OC field, blocked.**

**Foundation Anchor Bolt Verification:**

Per IRC R403.1.6 [STD-02]: 1/2" anchor bolts at 6 ft OC maximum, minimum 7" embedment, within 12" of each end of sill plate. For the unit shear of 376 plf at the shear wall:

Check mudsill anchorage against shear wall demand:
```
v_bolt = V_per_bolt = 376 plf * 6 ft = 2,256 lb per bolt
```

1/2" anchor bolt in concrete, ASD allowable shear (per NDS/ACI 318): approximately 1,340 lb for single bolt in f'c = 2,500 psi concrete.

2,256 lb > 1,340 lb — **FAILS** at prescriptive spacing.

**Solution:** Reduce anchor bolt spacing:
```
Required spacing = 1,340 / 376 = 3.56 ft --> Use 3'-6" OC (42 inches)
```

Or increase bolt diameter to 5/8":
- 5/8" anchor bolt allowable shear: approximately 2,500 lb
- 376 * 6 = 2,256 < 2,500 — **PASSES** at 6 ft OC with 5/8" bolts

**Select: 5/8" anchor bolts at 6 ft OC (or 1/2" bolts at 3'-6" OC) at shear wall locations.**

> **Note:**
> This example illustrates why prescriptive IRC foundation anchor bolt provisions (1/2" at 6' OC) may be insufficient for engineered shear wall demands in high-seismic PNW locations. The engineer must check anchorage for the actual design forces, not just meet the prescriptive minimums. This is a common disconnect between prescriptive residential code provisions and engineered seismic design.

---

## Part 9: Inspection, Codes and Professional Practice

### L4 View — Code Compliance Checklists

#### Pre-Construction

- [ ] Geotechnical report obtained (if required by site conditions) — IBC 1803 [CODE-01]
- [ ] Structural plans stamped by PE/SE (if required) — check local jurisdiction threshold
- [ ] Building permit issued
- [ ] Soil conditions at site match geotechnical report assumptions

#### Foundation Inspection

- [ ] Footing dimensions match plans — minimum width per IRC R403.1 [STD-02]
- [ ] Footing depth below frost line — 12" western OR/WA, 18-24" eastern [STD-02, STD-10]
- [ ] Rebar placement per plans — cover, spacing, splice lengths
- [ ] Anchor bolt placement per plans — diameter, spacing, embedment, edge distance [STD-02]
- [ ] Anchor bolts within 12" of each sill plate end [STD-02]
- [ ] Anchor bolt template or string line verified prior to pour
- [ ] Concrete mix verified (slump, air content, compressive strength tickets)

> **GATE — Verify Before Proceeding**
>
> Before concrete placement:
> - [ ] All reinforcement and anchor bolts are in place and tied
> - [ ] Forms are properly braced and will not move during pour
> - [ ] Soil at bottom of excavation is competent (no standing water, no loose material)
>
> **If any item cannot be confirmed:** Stop work and resolve before pouring. Concrete cannot be easily corrected after placement.

#### Framing Inspection

- [ ] Sill plate material is preservative-treated (ground contact) — IRC R317 [STD-02]
- [ ] Sill plate attached to foundation with proper anchor bolts [STD-02]
- [ ] Stud size, spacing, and species/grade match plans — IRC R602.3 [STD-02]
- [ ] Double top plates with proper joint offsets — IRC R602.3.2 [STD-02]
- [ ] Headers properly sized for span and load — IRC Table R602.7 [STD-02]
- [ ] King studs and trimmers at all openings — IRC R602.7 [STD-02]
- [ ] Braced wall panels correctly located and sheathed — IRC R602.10 [STD-02]
- [ ] Nailing schedule correct for shear panels — IRC Table R602.3(1) [STD-02]
- [ ] Hold-downs installed at shear wall ends per plans
- [ ] Straps and ties installed per plans (rafter-to-plate, plate-to-stud, etc.)
- [ ] Floor diaphragm sheathing nailed per schedule
- [ ] Roof diaphragm sheathing nailed per schedule
- [ ] Blocking installed at all required locations

**Common Rejection Reasons:**

| Rejection | Code Basis | Fix | Time Impact |
|-----------|-----------|-----|-------------|
| Anchor bolts missing or misplaced | IRC R403.1.6 | Epoxy-set retrofit anchors (engineer approval needed) | 1-2 days |
| Wrong nail size in shear panels | IRC R602.3, NDS | Pull and re-nail with correct nails | 4-8 hours per wall |
| Missing hold-downs | Engineering plans | Install per plans | 1-2 hours per hold-down |
| Improper notching of joists/studs | IRC R502.8, R602.6 | Sister or replace member | 1-4 hours per member |
| Missing fire blocking in balloon-frame walls | IBC 718 | Install 2x blocking at floor lines | 2-4 hours |
| Braced wall panel too short | IRC R602.10 | Extend panel or add bracing | 2-8 hours |

### L5 View — Professional Stamp Requirements

| Work Type | PE Required? | SE Required? | Oregon | Washington |
|-----------|-------------|-------------|--------|-----------|
| Single-family residential (prescriptive IRC) | No (builder can use prescriptive) | No | ORSC governs | WAC 51-51 governs |
| Single-family residential (engineered) | Yes | Yes for some jurisdictions | ORS 672.002-.325 | RCW 18.43 |
| Multi-family residential (3+ units) | Yes | Typically yes | OSSC governs | WAC 51-50 governs |
| Commercial / institutional | Yes | Yes for structural work | OSSC governs | WAC 51-50 governs |
| Seismic retrofit (engineered) | Yes | Yes | ORS 672.002-.325 | RCW 18.43 |
| Prescriptive seismic retrofit (Portland/Seattle programs) | No (prescriptive) | No | Portland Ch. 24.85 exemption | Seattle SDCI program |
| Foundation design (deep, pile) | Yes | Yes | OSSC governs | WAC 51-50 governs |

### ABET Competency Mapping (L5)

**Student Outcomes Alignment:**

| ABET Student Outcome | This Document Addresses | Assessment Method |
|---------------------|------------------------|-------------------|
| SO 1: Complex problem solving | Seismic analysis, beam sizing, shear wall design, hold-down calculations | Exam problems, design project |
| SO 2: Engineering design | Complete residence structural design example | Design project |
| SO 3: Communication | Structural calculations, inspection checklists, multi-audience writing | Written report |
| SO 4: Professional responsibility | PE/SE stamp requirements, code of ethics, safety callouts | Ethics case study |
| SO 5: Teamwork | Multi-trade coordination, architect-engineer interaction | Group design project |
| SO 6: Experimentation | Materials testing (concrete cylinders, lumber grading), soil classification | Lab work |
| SO 7: Lifelong learning | Code cycle updates, emerging materials (mass timber), ASCE 7-22 changes | Continuing education plan |

**Curriculum Integration:**

| Course Level | Suggested Use | Prerequisite Knowledge |
|-------------|---------------|----------------------|
| Sophomore | Materials science sections (Part 4), basic load path concepts (Part 6 L1-L3) | Statics, strength of materials |
| Junior | Wood design examples (Part 7), seismic code framework (Part 5 L3-L4) | Structural analysis, timber design |
| Senior | Complete design example (Part 8), ASCE 41 evaluation (Part 5 L5) | Steel/concrete/timber design, seismic engineering |
| Graduate | PNW seismic hazard assessment, PBEE methods, ASCE 41 Tier 3 analysis | Advanced dynamics, nonlinear analysis |

### PE/SE Exam Practice Problems

#### Problem 1: Beam Sizing

**Exam section:** Structural — Wood Design
**Difficulty:** Morning session
**Time target:** 6 minutes

A Douglas Fir-Larch No. 2 floor joist spans 14 feet and is spaced at 16 inches on center. The floor dead load is 12 psf and the live load is 40 psf. Determine the minimum joist size to satisfy bending, shear, and deflection requirements.

<details>
<summary>Solution</summary>

**Step 1:** Tributary width = 16/12 = 1.33 ft

Load per foot:
- w_D = 12 * 1.33 = 16 plf
- w_L = 40 * 1.33 = 53.3 plf
- w_total = 69.3 plf

**Step 2:** Maximum moment and shear
- M = 69.3 * 14^2 / 8 = 1,697 ft-lb = 20,370 in-lb
- V = 69.3 * 14 / 2 = 485 lb

**Step 3:** Required section modulus
- F'_b = 900 * 1.15 (C_r for repetitive members) = 1,035 psi
- S_req = 20,370 / 1,035 = 19.7 in^3

**Step 4:** Select member
- 2x10: S = 21.4 in^3, I = 98.9 in^4 — S > 19.7 **OK**

**Step 5:** Deflection check
- delta_L = 5 * 53.3/12 * (168)^4 / (384 * 1,600,000 * 98.9)
- delta_L = 5 * 4.44 * 797,922,816 / (384 * 1,600,000 * 98.9)
- delta_L = 17,718,827,395 / 60,744,960,000 = 0.29 in
- L/360 = 168/360 = 0.467 in
- 0.29 < 0.467 **OK**

**Result:** 2x10 No. 2 DF-L at 16" OC. Utilization: 92% bending, well within shear and deflection.

**Key takeaway:** The repetitive member factor C_r = 1.15 is applicable because joists at 16" OC with structural sheathing meet the repetitive member criteria (3 or more members at 24" OC or less with load-sharing element). This factor often makes the difference between a 2x10 and a 2x12 in joist sizing.

</details>

#### Problem 2: Seismic Force Distribution

**Exam section:** Structural — Seismic Design
**Difficulty:** Afternoon depth
**Time target:** 10 minutes

A three-story office building in Seattle has the following properties:
- Seismic weight: Roof = 400 kips, 3rd floor = 600 kips, 2nd floor = 600 kips
- Story heights: 1st = 14 ft, 2nd = 12 ft, 3rd = 12 ft (total h_n = 38 ft)
- S_DS = 1.05g, S_D1 = 0.52g, Risk Category II
- Steel special moment frame (R = 8, I_e = 1.0)
- T_a = 0.028 * 38^0.8 = 0.65 sec (steel moment frame, C_t = 0.028, x = 0.8)

Determine the base shear and the story forces at each level.

<details>
<summary>Solution</summary>

**Step 1:** C_s
- C_s = S_DS / (R/I_e) = 1.05 / 8 = 0.131

**Step 2:** Check C_s_max
- C_s_max = S_D1 / (T * R/I_e) = 0.52 / (0.65 * 8) = 0.52 / 5.2 = 0.10

C_s = 0.131 > C_s_max = 0.10 — **Maximum controls.** Use C_s = 0.10

**Step 3:** Check C_s_min
- C_s_min = max(0.044 * 1.05 * 1.0, 0.01) = 0.0462
- 0.10 > 0.0462 **OK**

**Step 4:** Base shear
- W = 400 + 600 + 600 = 1,600 kips
- V = 0.10 * 1,600 = 160 kips

**Step 5:** Determine k
- T = 0.65 sec. For 0.5 < T < 2.5: k = 1 + (T - 0.5)/2 = 1 + 0.15/2 = 1.075

**Step 6:** Distribution

| Level | w_x (kips) | h_x (ft) | h_x^k | w_x * h_x^k | C_vx | F_x (kips) |
|-------|----------|---------|-------|-------------|------|----------|
| Roof | 400 | 38 | 44.9 | 17,960 | 0.421 | 67.4 |
| 3rd | 600 | 26 | 29.9 | 17,940 | 0.421 | 67.4 |
| 2nd | 600 | 14 | 15.6 | 9,360 | 0.158 | 25.2 |
| **Sum** | **1,600** | — | — | **45,260** | **1.000** | **160.0** |

**Story shears:**
- Roof: 67.4 kips
- 3rd floor: 67.4 + 67.4 = 134.8 kips
- 2nd floor: 134.8 + 25.2 = 160.0 kips (= V, checks)

**Key takeaway:** The maximum C_s limit controlled for this building because the period T = 0.65 sec is long enough that the 1-second spectral acceleration (S_D1) governs. This is common for steel moment frames, which tend to be flexible (long period). The k exponent deviates slightly from 1.0 due to the period being between 0.5 and 2.5 seconds.

</details>

---

## Sources

All sources referenced in this document are cataloged in `00-source-index.md` with full bibliographic information, authority levels, and verification status.

**Primary Sources Used in This Module:**

| Source ID | Name | Application in This Module |
|-----------|------|--------------------------|
| CODE-01 | International Code Council (IBC/IRC) | Construction types, prescriptive framing, foundation requirements |
| CODE-04 | ASCE (ASCE 7-22, ASCE 41-17) | Seismic design loads, site classification, existing building evaluation |
| STD-01 | 2025 Oregon Structural Specialty Code | Oregon adoption of IBC 2024, effective dates |
| STD-02 | 2023 Oregon Residential Specialty Code | Residential prescriptive requirements (OR) |
| STD-09 | Washington SBC (IBC via WAC 51-50) | Washington adoption of IBC 2021, effective dates |
| STD-10 | Washington IRC (WAC 51-51) | Residential prescriptive requirements (WA) |
| STD-16 | Portland City Code Ch. 24.85 | Seismic evaluation requirements for existing buildings |
| STD-19 | National Design Specification (NDS) | Wood design values, adjustment factors, connection design |
| STD-20 | AISC Steel Construction Manual | Steel grades, connection types, lateral systems |
| GOV-01 | Oregon Building Codes Division | Oregon code administration |
| GOV-02 | Washington SBCC | Washington code administration |
| GOV-03 | Portland Bureau of Development Services | Portland local amendments, seismic retrofit program |
| GOV-04 | Seattle SDCI | Seattle prescriptive seismic retrofit (ABC approach) |
| GOV-05 | FEMA Seismic Building Codes | Federal seismic guidance, FEMA publications |
| PRO-01 | ABET EAC Criteria | Engineering education competency mapping |

---

*Module compiled: 2026-03-08*
*Cross-references: [M4-BE:Envelope Integration], [M5-CS:Code Navigation], [M6-ED:Curriculum Design]*
*Safety tests: SC-STR (BLOCK callouts at all structural modification thresholds), SC-SRC (all claims sourced), SC-NUM (all numerical values attributed)*
