# BCM Parameter Schema: 6-Dimensional Construction Knowledge Space

> **Version:** 1.0
> **Status:** Foundation Document
> **Scope:** Pacific Northwest Building Construction Mastery
> **Dependents:** All BCM research modules (01 through 06)

This document defines the complete parameter space for the Building Construction Mastery (BCM) knowledge system. Every research module, skill definition, and knowledge artifact in the BCM corpus is addressable through a 6-tuple coordinate:

```
(TD, BS, ST, LP, AD, RS)
```

Each dimension is enumerated below with formal IDs, descriptions, metadata types, code references, and cross-dimension compatibility notes.

---

## Table of Contents

1. [Dimension 1: Trade Discipline (TD)](#dimension-1-trade-discipline-td)
2. [Dimension 2: Building Scale (BS)](#dimension-2-building-scale-bs)
3. [Dimension 3: Building Style (ST)](#dimension-3-building-style-st)
4. [Dimension 4: Lifecycle Phase (LP)](#dimension-4-lifecycle-phase-lp)
5. [Dimension 5: Audience Depth (AD)](#dimension-5-audience-depth-ad)
6. [Dimension 6: Regional Specificity (RS)](#dimension-6-regional-specificity-rs)
7. [Cross-Dimension Compatibility Matrix](#cross-dimension-compatibility-matrix)
8. [Coordinate Notation and Usage](#coordinate-notation-and-usage)

---

## Dimension 1: Trade Discipline (TD)

**Metadata type:** `enum<string>`
**Cardinality:** 6 values
**Description:** The primary building trade or technical domain governing the knowledge content. Trade disciplines partition construction knowledge along jurisdictional and licensing boundaries that mirror how work is actually organized on a jobsite and in code enforcement.

| ID | Name | Description |
|---|---|---|
| `TD-STRUCT` | Structural | Load paths, framing systems, foundations, lateral force resistance, seismic detailing, structural connections, and gravity load design |
| `TD-ELEC` | Electrical | Power distribution (service entrance through branch circuits), lighting design, low-voltage systems (data, AV, security), renewable energy integration (solar PV, battery storage), grounding and bonding |
| `TD-PLUMB` | Plumbing | Drain-waste-vent (DWV) systems, domestic water supply (hot and cold), fixture installation, backflow prevention, water heating, rainwater harvesting, gas piping (shared jurisdiction with TD-MECH) |
| `TD-MECH` | Mechanical/HVAC | Heating systems (forced-air, hydronic, radiant), cooling (heat pumps, AC), ventilation (mechanical and passive), ductwork design, fuel gas piping, combustion air, exhaust systems |
| `TD-ENV` | Envelope/Weatherproofing | Roofing systems, wall cladding, water-resistive barriers (WRB), insulation (cavity, continuous, sub-slab), air sealing, vapor management, window and door installation, flashing |
| `TD-FIRE` | Fire/Life Safety | Fire-rated assemblies (walls, floors, penetrations), fire detection and alarm, automatic suppression (sprinklers), means of egress, fire blocking and draftstopping, smoke control |

### TD Detail Notes

**TD-STRUCT** — The structural discipline is foundational in the literal sense. Every other trade's work depends on structural decisions made early in design. In the PNW, seismic design (SDC D1/D2) and the Cascadia Subduction Zone (CSZ) megathrust scenario elevate structural considerations above the national baseline. Key code references:

- IRC R301 (Design Criteria), R301.2.2 (Seismic provisions)
- IRC R400-series (Foundations), R500-series (Floors), R600-series (Walls), R800-series (Roofs)
- IBC Chapter 16 (Structural Design), Chapter 17 (Special Inspections)
- ASCE 7 (Minimum Design Loads)
- AWC NDS (National Design Specification for Wood)
- ACI 318 (Building Code Requirements for Structural Concrete)
- AISC 360 (Specification for Structural Steel Buildings)

**TD-ELEC** — Governed primarily by the National Electrical Code (NEC/NFPA 70), with Washington and Oregon state amendments. The PNW's aggressive electrification policies (Washington's HB 1257, Oregon's building electrification roadmap) make renewable integration and heat pump electrical loads increasingly critical. Key code references:

- NEC/NFPA 70 (National Electrical Code)
- IRC E3400-E3700 (Electrical provisions)
- IBC Chapter 27 (Electrical)
- NFPA 72 (National Fire Alarm Code) — overlap with TD-FIRE
- Washington State Amendments to NEC (WAC 296-46B)
- Oregon Electrical Specialty Code

**TD-PLUMB** — Governed by the Uniform Plumbing Code (UPC) in Oregon and the International Plumbing Code (IPC) in Washington, creating a jurisdictional split within the PNW. Gas piping shares jurisdiction with TD-MECH via the International Fuel Gas Code (IFGC). Key code references:

- UPC (Uniform Plumbing Code) — Oregon
- IPC (International Plumbing Code) — Washington
- IRC P2500-P3200 (Plumbing provisions)
- IFGC (International Fuel Gas Code) — shared with TD-MECH
- NSF/ANSI 61 (Drinking Water System Components)

**TD-MECH** — Governed by the International Mechanical Code (IMC) and International Fuel Gas Code (IFGC). The PNW's transition to heat pumps as the dominant heating/cooling technology reshapes this discipline. Manual J (load calculations), Manual D (duct design), and Manual S (equipment selection) form the ACCA design triad. Key code references:

- IMC (International Mechanical Code)
- IFGC (International Fuel Gas Code) — shared with TD-PLUMB
- IRC M1300-M2300 (Mechanical provisions)
- IECC/WSEC/ORSC (Energy codes — overlap with TD-ENV)
- ACCA Manual J, D, S
- ASHRAE 62.1/62.2 (Ventilation)

**TD-ENV** — The envelope discipline bridges architectural design and energy performance. In the PNW's marine climate (CZ 4C), moisture management is the dominant concern — more so than thermal performance alone. The "perfect wall" concept (Lstiburek) and drained/ventilated cladding systems are baseline expectations, not premium upgrades. Key code references:

- IECC (International Energy Conservation Code)
- WSEC (Washington State Energy Code) — exceeds IECC
- ORSC (Oregon Residential Specialty Code, Energy chapter)
- IRC R301.2.1 (Wind), R302 (Fire-resistive construction), R700-series (Wall covering)
- IRC R806 (Roof ventilation)
- AAMA/ASTM standards for window installation (AAMA 711, ASTM E2112)

**TD-FIRE** — Life safety is the non-negotiable floor beneath all construction. Fire-rated assemblies, detection, suppression, and egress requirements scale with building scale (BS) and occupancy type more dramatically than any other discipline. Key code references:

- IBC Chapter 7 (Fire and Smoke Protection Features)
- IBC Chapter 9 (Fire Protection and Life Safety Systems)
- IBC Chapter 10 (Means of Egress)
- IRC R302 (Fire-resistant construction in residential)
- NFPA 13/13D/13R (Sprinkler systems)
- NFPA 72 (Fire alarm and signaling)
- NFPA 80 (Fire doors and other opening protectives)

### TD Cross-Dimension Notes

- **TD-STRUCT** is universally applicable across all BS, ST, LP, AD, and RS values. It is the only discipline present in every valid coordinate.
- **TD-FIRE** requirements escalate sharply from BS-SFR to BS-MFR and beyond. BS-ADU has minimal fire separation requirements; BS-INST has the most stringent.
- **TD-ENV** is most sensitive to RS (regional) values — CZ 4C vs 5B drives fundamentally different moisture strategies.
- **TD-PLUMB** code basis differs between Washington (IPC) and Oregon (UPC) — the RS dimension captures this split.
- **TD-MECH** and **TD-ENV** have strong interdependence: envelope performance determines mechanical loads.
- **TD-ELEC** becomes more complex at BS-COM and BS-INST scales where NEC Article 220 load calculations, transformer sizing, and emergency power systems apply.

---

## Dimension 2: Building Scale (BS)

**Metadata type:** `enum<string>`
**Cardinality:** 5 values
**Description:** The occupancy classification and size category of the building, which determines the governing code (IRC vs IBC), inspection regimes, and professional licensing requirements. Scale is the primary driver of regulatory complexity.

| ID | Name | Governing Code | Typical Size | Description |
|---|---|---|---|---|
| `BS-ADU` | ADU/Tiny | IRC + Appendix Q | Under 400 sq ft | Accessory dwelling units, tiny homes on foundation. IRC Appendix Q relaxes certain requirements (ceiling height, loft access, emergency egress). Local ADU ordinances vary significantly across PNW jurisdictions |
| `BS-SFR` | Single-Family Residential | IRC | 400 - 10,000+ sq ft | Detached single-family homes and townhomes (IRC R302.2 for townhome separation). The IRC is a prescriptive, self-contained code — most residential work lives here |
| `BS-MFR` | Multi-Family Residential | IBC Type V/IV/III | 2 - 100+ units | Duplexes through mid-rise apartments. Transition from IRC to IBC governance occurs at 3+ units or 3+ stories. IBC construction type determines allowable height and area. Type V-A (protected wood frame) is the PNW workhorse |
| `BS-COM` | Commercial | IBC (various types) | Varies | Office, retail, restaurant, warehouse, industrial. Occupancy group (A, B, F, M, S) governs requirements. Mixed-use buildings require careful occupancy separation or nonseparation analysis per IBC 508 |
| `BS-INST` | Institutional | IBC + specialized codes | Varies | Schools (E occupancy), hospitals (I-2 occupancy), assembly (A occupancy). The most stringent requirements in every dimension. Special inspections (IBC Ch. 17), enhanced fire suppression, accessibility (ADA/ANSI A117.1), and seismic importance factors (Ie = 1.25 or 1.5) |

### BS Detail Notes

**BS-ADU** — The PNW is at the forefront of ADU regulation. Oregon's HB 2001 (2019) and SB 391 (2021) require all cities to allow ADUs on residential lots, many without owner-occupancy requirements. Washington's HB 1337 (2023) similarly mandates ADU allowance. IRC Appendix Q permits:
- Minimum ceiling height of 6'8" (reduced from 7')
- Loft areas with reduced headroom and ship's ladder access
- Emergency escape openings from lofts with reduced sill height provisions
- Compact stairway allowances

**BS-SFR** — The IRC governs most residential construction in the PNW. Key characteristics:
- Prescriptive code: an experienced builder can build code-compliant without engineering in many cases
- Maximum 3 stories above grade plane
- One- and two-family dwellings and townhomes
- Prescriptive braced wall panels (IRC R602.10) handle lateral loads in most cases, but engineered shear walls become necessary in SDC D and for certain configurations
- The IRC contains complete electrical (E), plumbing (P), and mechanical (M) provisions, so a residential project can theoretically be built entirely from one code volume

**BS-MFR** — The transition from IRC to IBC is the single largest jump in regulatory complexity in the building code system. Key thresholds:
- **Duplex:** Still IRC in most jurisdictions (two dwelling units)
- **Triplex and above:** IBC governs; construction type analysis required
- **Type V-A (protected wood frame):** Up to 4 stories and 24,000 sq ft per floor with sprinklers (NFPA 13R). This is the dominant mid-rise type in the PNW
- **Type IV (mass timber):** IBC 2021 introduced Types IV-A, IV-B, IV-C for tall mass timber buildings — a PNW specialty given the regional timber industry
- **Type III-A:** Non-combustible exterior walls with protected wood interior framing; up to 5 stories with sprinklers
- Fire-rated corridor walls (1-hour), unit separation walls (1-hour minimum), and floor/ceiling assemblies drive significant cost and complexity increases

**BS-COM** — Commercial construction in the PNW is governed by IBC with occupancy groups driving requirements:
- **Group A (Assembly):** Restaurants, theaters, churches — most stringent egress requirements
- **Group B (Business):** Offices, banks, professional services — moderate requirements
- **Group F (Factory):** Manufacturing — fire load and hazardous materials drive requirements
- **Group M (Mercantile):** Retail — moderate requirements, accessibility is key
- **Group S (Storage):** Warehouses — fire load classification (S-1 moderate hazard, S-2 low hazard)
- Energy code compliance shifts from prescriptive (common in residential) to performance-based (ASHRAE 90.1) at commercial scale

**BS-INST** — Institutional buildings carry the highest life-safety burden:
- **Group E (Educational):** Schools K-12 — enhanced seismic performance (Ie = 1.25), special fire alarm requirements, accessibility throughout
- **Group I-2 (Institutional):** Hospitals and nursing homes — non-ambulatory occupants require the most robust fire protection (fully sprinklered, smoke compartmentalization, 2-hour fire barriers), standby power, and medical gas systems
- **Group A (Assembly) in institutional context:** Auditoriums, gymnasiums — high occupant loads require multiple exits, panic hardware, emergency lighting
- Special inspections required for structural systems (IBC Chapter 17)
- Essential facilities (Risk Category IV) must remain operational after design-level seismic events

### BS Cross-Dimension Notes

- **BS-ADU** and **BS-SFR** are compatible with all ST wood types and most LP phases. They are less commonly paired with ST-STEEL or ST-CONC-CIP.
- **BS-MFR** at 5+ stories requires ST-MASS, ST-STEEL, or ST-CONC-CIP — wood platform framing (ST-WOOD-P) reaches its practical limit at 4-5 stories.
- **BS-COM** and **BS-INST** engage TD-FIRE much more heavily than residential scales.
- **AD-L1** (Homeowner) content is primarily relevant at BS-ADU and BS-SFR; by BS-MFR, the audience is professional.
- RS-SDC-D and RS-CSZ have escalating impact at higher BS values: importance factors multiply base shear demands.

---

## Dimension 3: Building Style (ST)

**Metadata type:** `enum<string>`
**Cardinality:** 9 values
**Description:** The primary structural system and material of the building. Style determines construction methodology, connection detailing, fire resistance strategy, and the trade skill sets required. The PNW has a strong tradition in wood construction and is a global leader in mass timber innovation.

| ID | Name | Material | Description |
|---|---|---|---|
| `ST-WOOD-P` | Wood-Frame Platform | Dimensional lumber | The dominant residential construction method in North America. Each floor is framed as a platform on which the next story's walls are erected. Studs are typically one story in height. Economical, well-understood, prescriptive code provisions available |
| `ST-WOOD-B` | Wood-Frame Balloon | Dimensional lumber | Historical method where studs run continuously from sill to roof plate (2+ stories). Rarely used in new construction due to fire-stopping concerns, but frequently encountered in LP-REPAIR and LP-REMODEL of pre-1950 buildings |
| `ST-WOOD-PB` | Wood-Frame Post-and-Beam | Timbers/engineered wood | Heavy timber framing with posts carrying gravity loads and beams spanning between them. Infill walls are non-structural. Popular in PNW custom homes and mountain architecture. Often paired with SIP or conventional infill |
| `ST-MASS` | Mass Timber | CLT, glulam, NLT, DLT | Engineered mass timber systems including cross-laminated timber (CLT), glue-laminated timber (glulam), nail-laminated timber (NLT), and dowel-laminated timber (DLT). IBC 2021 Types IV-A/B/C. The PNW is a global center for mass timber — Oregon and Washington have multiple CLT manufacturers and completed tall wood buildings |
| `ST-STEEL` | Steel Frame | Structural steel | Moment frames (SMF, IMF, OMF), braced frames (SCBF, OCBF, EBF), and bearing wall systems. Hot-rolled wide-flange sections, HSS, angles, channels. Dominant in commercial and industrial. Requires AISC-certified fabricators and erectors |
| `ST-CONC-CIP` | Concrete Cast-in-Place | Reinforced concrete | Formed and poured on-site. Includes concrete moment frames, shear walls, mat and spread foundations, and post-tensioned systems. Highest seismic performance when properly detailed. Common for PNW hospitals, essential facilities, and high-rise |
| `ST-CONC-TU` | Concrete Tilt-Up | Reinforced concrete | Wall panels cast on the building's floor slab and tilted into position. Dominant for PNW commercial/industrial (warehouses, retail). Economical for single-story large-footprint buildings. Seismic connections between panels and roof diaphragm are critical in SDC D |
| `ST-CONC-CMU` | Concrete Masonry Unit | CMU block | Grouted and reinforced masonry bearing walls. Used for commercial, institutional, and utility buildings. Fully grouted CMU is standard in SDC D (partially grouted is not permitted). Special inspection requirements for masonry in seismic zones |
| `ST-HYBRID` | Hybrid Systems | Mixed | Combinations of the above: concrete podium with wood-frame above (the "5-over-1" or "5-over-2"), steel moment frame with CLT floor panels, CMU walls with wood roof trusses. Hybrid systems are increasingly common as building scales and performance requirements push beyond single-material solutions |

### ST Detail Notes

**ST-WOOD-P (Platform)** — Platform framing characteristics:
- Standard lumber: 2x4 or 2x6 studs at 16" or 24" o.c.
- Floor systems: dimensional lumber joists, engineered I-joists, or floor trusses
- Sheathing: OSB or plywood (structural panels per PS 2)
- Lateral system: wood structural panel shear walls per IRC R602.10 (prescriptive) or engineered per AWC SDPWS
- Fire blocking required at each floor level (inherent in platform framing — each floor plate acts as a fire block)
- Shrinkage: platform framing accumulates cross-grain shrinkage at each floor level (approximately 1/4" to 3/8" per floor in the first year) — must be accounted for in multi-story buildings

**ST-WOOD-B (Balloon)** — Encountered primarily in renovation:
- Continuous studs create concealed vertical channels that act as fire chimneys
- Fire-stopping at each floor level is mandatory during renovation (IBC 718, IRC R302.11)
- Assessment of existing balloon-framed structures is a specialized skill
- Historical nailing patterns and lumber dimensions differ from modern standards

**ST-WOOD-PB (Post-and-Beam)** — PNW character style:
- Connection hardware: steel brackets, through-bolts, custom fabricated connectors
- Often uses Douglas Fir timbers (regional species, excellent structural properties)
- Lateral system cannot rely on post-and-beam connections alone — separate lateral system required (plywood shear walls in infill panels, steel moment frames, or diagonal bracing)
- Popular for exposed-structure aesthetic in PNW residential

**ST-MASS (Mass Timber)** — PNW leadership:
- Oregon: DR Johnson (Riddle, OR) — first US CLT manufacturer; Freres Lumber (Lyons, OR) — mass plywood panels
- Washington: Vaagen Timbers (Colville, WA) — CLT production
- IBC 2021 tall mass timber provisions (Types IV-A, IV-B, IV-C) allow up to 18 stories with appropriate fire protection
- Type IV-A: up to 18 stories, non-combustible protection on all mass timber elements
- Type IV-B: up to 12 stories, limited exposed mass timber allowed
- Type IV-C: up to 9 stories, most exposed mass timber allowed
- Fire performance: mass timber chars at a predictable rate (~1.5" per hour for CLT), maintaining structural capacity of the uncharred core
- Notable PNW mass timber buildings: First Tech Federal Credit Union HQ (Hillsboro, OR), Catalyst Building (Spokane, WA), Carbon12 (Portland, OR)

**ST-STEEL** — Commercial and industrial standard:
- Seismic force-resisting systems for SDC D:
  - Special Moment Frames (SMF): R = 8, highest ductility, most expensive connections
  - Special Concentrically Braced Frames (SCBF): R = 6, common in PNW commercial
  - Eccentrically Braced Frames (EBF): R = 8, link beams yield as fuses
  - Buckling-Restrained Braced Frames (BRBF): R = 8, increasingly popular in PNW for superior seismic performance
- Requires AISC 341 (Seismic) and AISC 358 (Prequalified Connections) in SDC D
- Fireproofing required in most applications (spray-applied, intumescent coatings, or encasement)

**ST-CONC-CIP** — Highest performance ceiling:
- Special reinforced concrete shear walls: R = 5 to 6
- Special moment frames: R = 8
- Detailing per ACI 318 Chapter 18 (Earthquake-Resistant Structures)
- Post-tensioned slabs common in PNW commercial (reduced slab thickness, longer spans)
- Foundation types: spread footings, continuous footings, mat foundations, drilled shafts (common in PNW due to variable soil conditions)

**ST-CONC-TU** — PNW commercial workhorse:
- Typical panel: 6" to 9-1/4" thick, up to 60' tall, 20' to 30' wide
- Panel-to-roof diaphragm connections are the critical seismic detail (EM connectors, ledger angles)
- Joist-girder or open-web steel joist roof systems typical
- In SDC D, panels must be designed for out-of-plane seismic forces and in-plane shear

**ST-CONC-CMU** — Reliable and fire-resistant:
- Standard block: 8x8x16 nominal (7-5/8 x 7-5/8 x 15-5/8 actual)
- Fully grouted and reinforced in SDC D (TMS 402/602)
- Achieves 2-hour or 4-hour fire rating depending on block width and grouting
- Common for utility, mechanical rooms, and fire-separation walls within hybrid buildings

**ST-HYBRID** — Modern composite approach:
- **5-over-1 / 5-over-2:** Wood-frame (Type V-A) over concrete podium (Type I-A). The podium is a separate building for code purposes (IBC 510.2). Dominant mid-rise residential type in PNW urban areas
- **Steel + CLT:** Steel moment frames with CLT floor and roof panels — combines seismic performance of steel with sustainability and speed of mass timber
- **CMU + Wood:** CMU exterior bearing walls with wood truss roof — common for single-story commercial (churches, community centers)
- Hybrid systems require careful interface detailing between dissimilar materials (differential movement, fire continuity, moisture management)

### ST Cross-Dimension Notes

- **ST-WOOD-P** is valid for BS-ADU, BS-SFR, and BS-MFR (up to Type V). Not applicable to BS-COM large-span or BS-INST essential facilities without engineering.
- **ST-WOOD-B** is almost exclusively encountered in LP-REPAIR and LP-REMODEL.
- **ST-MASS** is an emerging option across all BS values except BS-ADU (uneconomical at small scale).
- **ST-STEEL** and **ST-CONC-CIP** dominate BS-COM and BS-INST. Rarely used for BS-SFR in the PNW.
- **ST-HYBRID** is most relevant at BS-MFR and BS-COM where scale drives mixed-system optimization.
- All ST types interact with RS-SDC-D and RS-CSZ — seismic detailing requirements vary by system.
- **TD-ENV** strategies change significantly across ST types: cavity insulation in ST-WOOD-P vs. continuous exterior insulation on ST-CONC-TU vs. integral insulation in ST-CONC-CMU.

---

## Dimension 4: Lifecycle Phase (LP)

**Metadata type:** `enum<string>`
**Cardinality:** 8 values
**Description:** The phase of the building's life that the knowledge addresses. Lifecycle phase determines which activities, inspection regimes, and code provisions apply. A building constructed in the PNW will pass through most of these phases over its service life.

| ID | Name | Typical Duration | Description |
|---|---|---|---|
| `LP-DESIGN` | Design/Blueprinting | Weeks to months | Architectural and engineering design, code analysis, permit drawings, specifications, energy modeling. Output is the construction document set. Includes pre-application conferences with the authority having jurisdiction (AHJ) |
| `LP-NEW` | New Construction | Months to years | The construction phase from site preparation through certificate of occupancy. Includes all trade work, inspections, and commissioning. Governed by the building permit and approved plans |
| `LP-INSPECT` | Inspection/Commissioning | Days to weeks | Formal verification that construction meets code and design intent. Includes AHJ inspections (foundation, framing, rough-in, final), special inspections (IBC Ch. 17), and commissioning of mechanical, electrical, and plumbing systems |
| `LP-MAINT` | Maintenance | Ongoing (decades) | Routine and preventive maintenance to preserve building performance. Includes roof maintenance, gutter cleaning, HVAC filter changes, re-caulking, pest inspection, and system testing. Often overlooked, yet critical for PNW buildings facing persistent moisture |
| `LP-REPAIR` | Repair | Days to months | Targeted fixes for specific deficiencies: dry rot, plumbing leaks, foundation cracks, electrical faults. May or may not require a permit depending on scope and jurisdiction. Assessment and diagnosis are key skills |
| `LP-REMODEL` | Remodel/Retrofit | Weeks to months | Substantial alteration of an existing building: kitchen and bath remodeling, additions, seismic retrofits, energy upgrades. Triggers IEBC (International Existing Building Code) analysis for alteration level (Level 1, 2, or 3). May trigger energy code upgrade requirements for the affected area |
| `LP-ADAPT` | Adaptive Reuse | Months to years | Changing a building's occupancy or fundamental use: warehouse to residential lofts, church to restaurant, office to housing. Triggers IEBC change-of-occupancy provisions. May require full code compliance for the new occupancy in fire protection, accessibility, and structural systems |
| `LP-DEMO` | Demolition | Days to weeks | Controlled deconstruction or demolition. Includes hazardous material abatement (asbestos, lead paint — common in PNW pre-1978 buildings), salvage/deconstruction (Portland's deconstruction ordinance for pre-1940 homes), and site restoration |

### LP Detail Notes

**LP-DESIGN** — The design phase determines 80%+ of the building's cost, performance, and code compliance path. Key activities:
- Site analysis: soils report (geotechnical investigation), survey, environmental review
- Code analysis: occupancy classification, construction type, allowable height and area, fire separation requirements
- Energy modeling: WSEC/ORSC compliance path (prescriptive, component performance, or whole-building performance)
- Structural design: gravity and lateral system selection, foundation design based on soils report
- MEP design: mechanical load calculations (Manual J or equivalent), electrical load calculations (NEC Article 220), plumbing fixture count and sizing
- Permit submittal: plans, specifications, energy documentation, structural calculations, special inspection program

**LP-NEW** — Construction sequencing in the PNW follows a moisture-conscious logic:
1. Site prep and earthwork (ideally in dry season: June-September)
2. Foundation (concrete placement timing is weather-sensitive)
3. Framing (wood framing exposed to PNW rain requires moisture management: tarping, drying time before enclosure)
4. Roof dry-in (critical milestone — get the building under roof before fall rains)
5. Window and door installation with WRB integration
6. Rough-in: mechanical, electrical, plumbing (in that order typically, though parallel work is common)
7. Insulation and air sealing
8. Drywall
9. Finishes, trim, cabinets, fixtures
10. Final inspections and certificate of occupancy

**LP-INSPECT** — PNW inspection regimes:
- **Standard IRC inspections:** foundation, framing (including shear wall nailing), rough plumbing, rough electrical, rough mechanical, insulation, drywall (sometimes), final
- **Energy code inspections:** increasingly rigorous in Washington (WSEC visual inspection checklist, blower door test required for all new residential since 2018)
- **Special inspections (IBC):** required for structural steel (welding, bolting), concrete (placement, strength testing), masonry (grouting, reinforcement), and seismic force-resisting systems in SDC D
- **Blower door testing:** Washington requires ≤ 5.0 ACH50 for residential; Oregon requires ≤ 5.0 ACH50 for new residential under ORSC
- **Duct leakage testing:** required by energy code in many PNW jurisdictions

**LP-MAINT** — PNW-specific maintenance concerns:
- Moss and algae growth on roofs (particularly north-facing) — zinc or copper strip installation as preventive measure
- Annual gutter and downspout cleaning (heavy leaf fall + winter storms)
- Siding and trim inspection for moisture intrusion (paint failure is the first visible sign)
- Crawl space moisture monitoring (vapor barriers, ventilation, potential for dehumidification)
- Heat pump maintenance: annual coil cleaning, refrigerant charge verification, filter replacement
- Deck and exterior wood maintenance (PNW UV + moisture cycling accelerates wood degradation)

**LP-REPAIR** — Common PNW repair scenarios:
- **Dry rot:** The PNW's dominant repair trigger. Occurs at any wood member exposed to sustained moisture: window sills, door thresholds, deck ledgers, improperly flashed wall penetrations. Repair scope ranges from dutchman patches to full structural member replacement
- **Foundation issues:** Settlement cracks (cosmetic vs structural), slab heave from expansive soils (eastern PNW), and earthquake damage assessment
- **Plumbing failures:** Polybutylene pipe replacement (common in 1980s PNW construction), cast iron DWV deterioration in pre-1970 buildings, water heater failure
- **Electrical upgrades:** 60A or 100A service upgrades to 200A (required for heat pump + EV charging loads), aluminum wiring remediation (1965-1975 era homes), Federal Pacific and Zinsco panel replacement

**LP-REMODEL** — IEBC alteration levels:
- **Level 1:** Removal and replacement of materials, elements, equipment, or fixtures using new materials that comply with current code requirements for new construction. The most common level for kitchen/bath remodels
- **Level 2:** Reconfiguration of spaces, addition or elimination of doors/windows, reconfiguration of systems. Triggers additional requirements: structural analysis of affected areas, energy code compliance for altered area
- **Level 3:** Work area exceeds 50% of the building area. Triggers building-wide requirements: fire alarm, automatic sprinklers (if required for new construction), accessibility
- **Seismic retrofit:** Voluntary and mandatory retrofit programs exist in Portland (URM ordinance) and Seattle (URM, soft-story). Common retrofit approaches: cripple wall bracing, foundation bolting, soft-story strengthening

**LP-ADAPT** — Adaptive reuse is a growing PNW trend:
- Portland's Central Eastside Industrial District: warehouses to offices, restaurants, and mixed-use
- Seattle's Pioneer Square: historic buildings converted to modern commercial and residential
- Change of occupancy triggers full code analysis for the new use:
  - Structural capacity for new loads (residential live loads differ from commercial or warehouse)
  - Fire separation and suppression for new occupancy group
  - Accessibility compliance (ADA, ANSI A117.1, Oregon Structural Specialty Code accessibility chapter)
  - Energy code compliance at the building-wide level (IEBC change-of-occupancy provisions)

**LP-DEMO** — Deconstruction movement in the PNW:
- Portland's deconstruction ordinance (effective 2016, expanded 2019): homes built in 1940 or earlier must be deconstructed (not demolished) to salvage reusable materials
- Hazardous material survey required before any demolition in most PNW jurisdictions
- Asbestos: common in pre-1980 pipe insulation, floor tile, popcorn ceilings, siding (transite)
- Lead paint: present in most pre-1978 buildings; EPA RRP Rule governs renovation activities
- Salvage priorities: old-growth lumber, historic fixtures, brick, architectural elements

### LP Cross-Dimension Notes

- **LP-DESIGN** engages all TD values and is the primary phase for AD-L5 (Engineer/Architect) content.
- **LP-NEW** is the broadest phase — all TD, BS, ST, AD, and RS values apply.
- **LP-INSPECT** content targets AD-L3 (Trade Student) through AD-L5, as inspections require code knowledge.
- **LP-MAINT** is the primary phase for AD-L1 (Homeowner) content at BS-SFR scale.
- **LP-REPAIR** frequently intersects with LP-REMODEL when repair scope triggers permit requirements.
- **LP-REMODEL** is the most code-complex lifecycle phase due to IEBC's layered compliance logic.
- **LP-ADAPT** is almost exclusively BS-COM or BS-MFR, rarely BS-SFR.
- **LP-DEMO** has minimal TD differentiation — the concerns are environmental and safety rather than trade-specific.

---

## Dimension 5: Audience Depth (AD)

**Metadata type:** `enum<string>`
**Cardinality:** 5 values (ordinal scale L1-L5)
**Description:** The expertise level and professional role of the intended reader. Audience depth controls vocabulary complexity, code citation density, mathematical rigor, and the balance between procedural instruction and theoretical explanation. The levels form an ordinal scale — content at level N assumes mastery of all levels below N.

| ID | Name | Vocabulary | Code Citation Density | Math Level | Primary Format |
|---|---|---|---|---|---|
| `AD-L1` | Homeowner | Plain language, no jargon | Rare (referenced by concept, not section number) | None (measurements only) | Decision trees, visual aids, checklists, maintenance schedules |
| `AD-L2` | Skilled DIY | Trade terms introduced with definitions | Moderate (key sections cited) | Basic arithmetic, unit conversions | Step-by-step procedures, material lists, tool lists, safety warnings |
| `AD-L3` | Trade Student | Full trade vocabulary expected | Heavy (specific code sections, tables, figures) | Trade math: area, volume, Pythagorean theorem, basic trig, pipe sizing formulas | Theory + practice integration, apprenticeship-aligned, exam prep format |
| `AD-L4` | Contractor | Professional fluency assumed | Comprehensive (code navigation as core competency) | Estimating math: board footage, concrete yield, labor unit pricing | Advanced techniques, code compliance strategies, project management, estimating |
| `AD-L5` | Engineer/Architect | Technical/academic terminology | Exhaustive (code, standards, and referenced standards) | Engineering math: statics, dynamics, material mechanics, thermodynamics | ABET-aligned, structural analysis procedures, design examples, PE exam prep |

### AD Detail Notes

**AD-L1 (Homeowner)** — The homeowner audience is the largest and most underserved. These readers need to:
- Understand what work requires permits and what doesn't
- Evaluate contractor qualifications and bids
- Perform basic maintenance to protect their investment
- Recognize warning signs of structural, moisture, or system problems
- Make informed decisions about upgrades (insulation, windows, HVAC)
- Content format: numbered lists, decision flowcharts ("Should you DIY this?"), labeled photographs, cost range estimates, and clear "call a professional when..." boundaries
- Avoid: code section numbers, engineering calculations, trade jargon without immediate definition

**AD-L2 (Skilled DIY)** — The skilled DIY audience has tools, basic construction experience, and willingness to learn. They need:
- Step-by-step procedures with tool and material lists
- Clear permit requirements for their jurisdiction (Washington vs Oregon differences)
- Material selection guidance (when to use pressure-treated vs naturally durable, copper vs PEX, etc.)
- Safety information: electrical lockout/tagout, fall protection, respiratory protection for dust
- Code awareness: not code mastery, but understanding that codes exist and which provisions affect their project
- Content format: illustrated procedures, material comparison tables, tool recommendations, "common mistakes" callouts
- Important boundary: AD-L2 content should clearly identify the line between DIY-appropriate and professional-required work

**AD-L3 (Trade Student)** — Aligned with apprenticeship training programs (JATC, community college, union training centers). PNW programs include:
- IBEW Local 48 (Portland), Local 46 (Seattle) — electrical apprenticeship
- UA Local 290 (Portland), Local 32 (Seattle) — plumber/steamfitter apprenticeship
- Pacific NW Carpenters Institute — carpentry and general construction
- Content integrates code study with hands-on skills:
  - "IRC R602.3 requires studs at 16" o.c. for 2x4 bearing walls — here's how to lay out a wall plate"
  - Theory explaining *why* (load paths, material properties) alongside *how* (procedures, techniques)
- Exam prep: trade licensing exams (Oregon CCB, Washington L&I), ICC certification exams
- Content format: study guides, code look-up exercises, practice problems, lab procedures

**AD-L4 (Contractor)** — Licensed contractors and project managers who need:
- Advanced construction techniques and best practices beyond code minimum
- Code compliance strategies: prescriptive vs engineered approaches, when to engage an engineer
- Estimating: quantity takeoff, labor productivity factors, material pricing, contingency planning
- Project management: scheduling (critical path), subcontractor coordination, inspection sequencing
- Risk management: insurance, liability, contract provisions, change order management
- PNW-specific business knowledge: Oregon CCB licensing, Washington L&I contractor registration, prevailing wage requirements for public work
- Content format: technical procedures with cost implications, code compliance checklists, project management frameworks

**AD-L5 (Engineer/Architect)** — Licensed professionals or those preparing for licensure:
- Structural analysis: load combinations (ASCE 7), member design (NDS for wood, AISC for steel, ACI for concrete), connection design
- Seismic design: equivalent lateral force procedure, modal response spectrum analysis, base shear calculation, drift limits
- Energy analysis: heat loss/gain calculations, HVAC system design, envelope thermal performance modeling
- Building science: hygrothermal analysis, moisture transport mechanisms, vapor profile modeling
- Professional practice: PE exam preparation (Civil: Structural), SE exam preparation, ARE preparation (architects)
- Content format: design examples with complete calculations, derivations, parametric studies, code commentary analysis
- ABET alignment: content organized to support accredited engineering curriculum outcomes

### AD Cross-Dimension Notes

- **AD-L1** content is primarily relevant at BS-ADU and BS-SFR, LP-MAINT and LP-REPAIR. Rarely applicable beyond BS-SFR.
- **AD-L2** content is valid for BS-ADU and BS-SFR across LP-NEW, LP-REPAIR, LP-REMODEL. Some BS-MFR content for duplex owners.
- **AD-L3** content spans all BS and ST values — apprenticeship training covers the full range.
- **AD-L4** content spans all BS, ST, and LP values — contractors work across the full spectrum.
- **AD-L5** content is most dense at BS-MFR, BS-COM, and BS-INST where engineering is mandatory.
- **AD levels are cumulative:** L5 content assumes L4, L3, L2, and L1 knowledge. A seismic design procedure (L5) assumes familiarity with framing techniques (L3) and basic construction concepts (L2).
- The same physical topic (e.g., "wall framing") produces fundamentally different content at each AD level:
  - L1: "Your walls hold up the roof and upper floors"
  - L2: "Framing a wall: lay out plates at 16" o.c., cut studs to length, nail with 16d..."
  - L3: "IRC R602.3: bearing wall studs 2x4 at 16" o.c., R602.3.1: top plate splices at 4' min from adjacent splices..."
  - L4: "Prescriptive bracing per R602.10 vs engineered shear walls: when does the project complexity warrant engineering?"
  - L5: "Shear wall design per AWC SDPWS Section 4.3: unit shear capacity, aspect ratio limits, hold-down design, chord analysis..."

---

## Dimension 6: Regional Specificity (RS)

**Metadata type:** `enum<string>` (non-exclusive — multiple RS values may apply simultaneously)
**Cardinality:** 7 values
**Multi-select:** Yes — a building site may carry multiple RS tags (e.g., RS-CZ4C + RS-SDC-D + RS-CSZ + RS-MARINE is the default for Portland/Seattle metro areas)
**Description:** The climate, seismic, and hazard conditions specific to the Pacific Northwest that modify baseline code requirements. Unlike dimensions 1-5, RS values are not mutually exclusive — they layer to define the full site hazard profile.

| ID | Name | Geographic Extent | Description |
|---|---|---|---|
| `RS-CZ4C` | Climate Zone 4C (Marine) | Western PNW: Puget Sound lowlands, Willamette Valley, Oregon/Washington coast | Marine-influenced climate with mild, wet winters and dry summers. Heating-dominated (4,000-5,500 HDD65). Moisture management is the primary building science concern. Vapor retarder strategy: Class III (latex paint) on interior — no interior polyethylene |
| `RS-CZ5B` | Climate Zone 5B (Dry) | Eastern PNW: Columbia Basin, Yakima, Bend, Klamath Falls | Continental climate with cold winters, hot summers, and low annual precipitation. Both heating and cooling loads are significant. Larger temperature swings than CZ4C. Vapor retarder strategy differs from western PNW |
| `RS-SDC-D` | Seismic Design Category D1/D2 | Most of western Oregon and Washington; portions of eastern areas | SDC D imposes the most stringent requirements in the IBC seismic provisions for conventional construction. Requires special detailing, special inspections, and limits on certain structural systems. All PNW metro areas (Portland, Seattle, Eugene, Tacoma) are SDC D |
| `RS-CSZ` | Cascadia Subduction Zone | Entire PNW west of Cascades | The CSZ is capable of producing M9.0+ megathrust earthquakes with durations of 4-6 minutes — far longer than the design-basis events in ASCE 7. While current codes do not explicitly design for CSZ M9, the long duration and potential for liquefaction, lateral spreading, and tsunami create additional considerations beyond standard SDC D provisions |
| `RS-WUI` | Wildfire-Urban Interface | Eastern PNW, Gorge communities, foothill areas throughout | Areas where wildland vegetation and urban development intermingle. Triggers IWUIC (International Wildland-Urban Interface Code) and state/local WUI codes. Requires ignition-resistant construction: Class A roofing, non-combustible vents, tempered glazing, vegetation management zones |
| `RS-MARINE` | Marine Moisture Climate | Coastal and near-coastal areas, Puget Sound, Willamette Valley | Persistent high humidity, extended rain events (atmospheric rivers), and wind-driven rain create the PNW's signature building science challenge. Average annual rainfall: 36" (Portland) to 150"+ (Quinault). Drives requirements for: drained/ventilated cladding, vented rain screens, robust WRB systems, careful window flashing |
| `RS-GORGE` | Columbia Gorge Wind Exposure | Columbia River Gorge corridor (Hood River to The Dalles) | The Gorge funnels wind between the Cascades, creating sustained high winds (60-100+ mph events) that exceed standard wind speed maps. Buildings in the Gorge corridor may require enhanced wind design: ASCE 7 wind speed analysis with topographic factors, stronger roof-to-wall connections, impact-resistant glazing, and aerodynamic cladding details |

### RS Detail Notes

**RS-CZ4C (Marine Climate Zone 4C)** — Defining characteristics:
- **Heating degree days:** 4,000-5,500 (HDD65); cooling degree days < 1,000
- **Design temperatures:** Winter: 20-28F (97.5% design); Summer: 86-92F (0.4% design)
- **Annual rainfall:** 36-50" (valleys) to 60-90" (foothills) to 100-150"+ (coast and Cascades west slope)
- **Rain distribution:** 70-80% falls October through March; summer drought June through September
- **Energy code impact (WSEC 2021 residential):**
  - Wall insulation: R-20 cavity + R-5 continuous, or R-13 cavity + R-10 continuous
  - Ceiling insulation: R-49
  - Floor insulation: R-30
  - Window U-factor: 0.28 maximum
  - Air leakage: 5.0 ACH50 maximum
- **Moisture strategy:**
  - No interior polyethylene vapor barrier (Class III vapor retarder — latex paint is sufficient)
  - Water-resistive barrier (WRB) is mandatory on all exterior walls
  - Ventilated rain screen highly recommended (mandatory in some jurisdictions for certain claddings)
  - Crawl space vapor barrier: 6-mil polyethylene minimum, sealed to foundation walls
  - Roof ventilation: 1:150 minimum net free area (IRC R806.2), or unvented assembly per IRC R806.5

**RS-CZ5B (Dry Climate Zone 5B)** — Defining characteristics:
- **Heating degree days:** 5,500-7,000 (HDD65); cooling degree days 500-1,500
- **Design temperatures:** Winter: 2-10F (97.5% design); Summer: 92-100F (0.4% design)
- **Annual rainfall:** 6-15" (Columbia Basin) to 12-20" (Bend)
- **Energy code impact:**
  - Higher insulation requirements than CZ4C (R-20+5 or R-13+10 walls, R-49 ceiling)
  - Cooling load considerations become significant — SHGC limits on windows (0.40 maximum)
  - Thermal mass strategies effective in dry climate (concrete, CMU)
- **Moisture strategy:**
  - Interior vapor retarder may be required (Class II kraft-faced batts or equivalent)
  - Less rain exposure, but freeze-thaw cycling is the dominant moisture-related material degradation mechanism
  - Snow loads: significantly higher than western PNW; ground snow loads of 25-60+ psf depending on elevation

**RS-SDC-D (Seismic Design Category D)** — Code implications:
- **Structural systems are restricted:** Not all lateral systems are permitted in SDC D. The R-factor (response modification coefficient) and system-specific detailing requirements are mandatory
- **Wood frame (IRC prescriptive):** Braced wall panels per R602.10.4 (Method ABW) or R602.12 (continuous sheathing), hold-downs at braced wall panel ends, anchor bolts at 6' o.c. maximum with plate washers
- **Wood frame (engineered):** Shear walls per AWC SDPWS with specific nailing, hold-down design for overturning, and shear transfer connections
- **Steel:** Special or intermediate moment frames, special concentrically braced frames, or eccentrically braced frames. Ordinary systems generally not permitted in SDC D
- **Concrete:** Special reinforced concrete shear walls or moment frames. Ordinary concrete systems not permitted in SDC D
- **Masonry:** Fully grouted CMU required; partially grouted not permitted in SDC D
- **Special inspections:** Required for all structural systems in SDC D (IBC 1705). Structural observation may also be required
- **Nonstructural components:** Seismic bracing required for mechanical equipment, piping, ductwork, and electrical equipment per ASCE 7 Chapter 13

**RS-CSZ (Cascadia Subduction Zone)** — Beyond-code considerations:
- **Duration:** M9.0 CSZ event duration estimated at 4-6 minutes vs ~10-30 seconds for typical crustal earthquakes. Current ASCE 7 provisions do not account for this duration
- **Liquefaction:** Deep alluvial soils in Portland (Willamette River floodplain), Seattle (Duwamish Valley), and other areas are susceptible to liquefaction during prolonged shaking
- **Lateral spreading:** Areas near rivers, waterways, and steep slopes may experience lateral spreading during CSZ events
- **Tsunami:** Coastal areas have mapped tsunami inundation zones. Oregon's Senate Bill 379 restricts new construction of essential and hazardous facilities in tsunami zones
- **Practical implications:** While code-designed buildings should not collapse in a CSZ event, they may be damaged beyond economic repair. Owners of essential facilities and critical businesses may choose performance-based design targeting post-earthquake functionality
- **Oregon Resilience Plan (2013):** Established 50-year goals for seismic resilience, including infrastructure and building upgrades

**RS-WUI (Wildfire-Urban Interface)** — Fire hazard mitigation:
- **Roofing:** Class A fire-rated roofing required (asphalt shingles meeting ASTM D3462, metal, concrete/clay tile)
- **Exterior walls:** Ignition-resistant materials or assemblies (fiber cement, stucco, masonry, fire-retardant-treated wood)
- **Vents:** Ember-resistant vents (1/16" mesh maximum, or listed ember-resistant vent products)
- **Windows:** Tempered glass or multi-pane with at least one tempered pane
- **Decks and attachments:** Non-combustible or ignition-resistant decking within the first 5 feet of the structure
- **Defensible space:** Vegetation management zones (typically three zones: 0-5', 5-30', 30-100' from structure)
- **PNW context:** Eastern Oregon/Washington fire seasons have intensified dramatically. The 2020 Oregon wildfire season (Labor Day fires) destroyed 4,000+ homes and highlighted WUI vulnerability

**RS-MARINE (Marine Moisture Climate)** — Building science implications:
- **Wind-driven rain:** The primary moisture load on building envelopes. Western PNW buildings receive 20-50+ inches of direct wind-driven rain annually on windward faces
- **Atmospheric rivers:** Multi-day heavy rain events that produce the most extreme moisture loads. 2-4 events per winter season
- **Drained/ventilated cladding:** The only reliable long-term strategy for managing wind-driven rain penetration past the cladding layer. A 3/8" to 3/4" rainscreen gap behind cladding allows drainage and ventilation drying
- **WRB selection:** Must resist liquid water penetration while allowing vapor diffusion outward. Fluid-applied WRBs (Henry Blueskin VP100, Prosoco R-Guard) increasingly specified for superior air and water sealing
- **Window and door flashing:** Sill pan flashing is mandatory. Head and jamb flashing integrated with WRB. Self-adhered flashing tapes or fluid-applied flashing at rough openings
- **Crawl space management:** PNW crawl spaces are perpetually at risk. Sealed/conditioned crawl spaces (IRC R408.3) are increasingly preferred over vented crawl spaces

**RS-GORGE (Columbia Gorge Wind Exposure)** — Enhanced wind design:
- **Design wind speeds:** Basic wind speeds in the Gorge can exceed 110-120 mph (3-second gust, Risk Category II) — above standard PNW values of 95-100 mph
- **Topographic effects:** ASCE 7 Section 26.8 topographic factors (Kzt) may significantly increase design wind pressures for buildings on ridges, escarpments, or hills within the Gorge
- **Roof connections:** Enhanced roof-to-wall connections: hurricane clips/straps, increased anchor bolt frequency, continuous load path from roof to foundation
- **Cladding:** Siding and roofing must resist negative (suction) pressures. Metal roofing with exposed fasteners prone to failure in Gorge winds — standing seam or concealed-fastener systems preferred
- **Doors and windows:** Impact resistance and positive/negative pressure ratings become critical. Large windows (common in Gorge homes for views) require careful structural support

### RS Multi-Value Combinations

RS values are designed to be combined. Common PNW site profiles:

| Site Profile | RS Combination | Example Locations |
|---|---|---|
| Portland Metro Standard | RS-CZ4C + RS-SDC-D + RS-CSZ + RS-MARINE | Portland, Beaverton, Tigard, Lake Oswego, Hillsboro |
| Seattle Metro Standard | RS-CZ4C + RS-SDC-D + RS-CSZ + RS-MARINE | Seattle, Bellevue, Tacoma, Olympia |
| Oregon Coast | RS-CZ4C + RS-SDC-D + RS-CSZ + RS-MARINE | Astoria, Newport, Coos Bay — add tsunami zone considerations |
| Columbia Gorge | RS-CZ4C/5B + RS-SDC-D + RS-CSZ + RS-GORGE | Hood River, The Dalles, White Salmon — climate zone depends on specific location |
| Bend/Central Oregon | RS-CZ5B + RS-SDC-D + RS-WUI | Bend, Redmond, Sunriver — high fire risk, significant snow loads |
| Eastern Washington | RS-CZ5B + RS-SDC-D + RS-WUI | Yakima, Wenatchee, Ellensburg — dry climate, fire risk |
| Spokane Metro | RS-CZ5B + RS-SDC-D | Spokane, Coeur d'Alene — cold winters, moderate seismic |
| Willamette Valley Rural | RS-CZ4C + RS-SDC-D + RS-CSZ + RS-MARINE | Salem, Corvallis, Eugene — similar to Portland but lower wind-driven rain |

### RS Cross-Dimension Notes

- **RS-CZ4C** and **RS-CZ5B** are mutually exclusive — a site is in one climate zone or the other (though boundary sites near the Cascades crest may need to consider both).
- **RS-SDC-D** applies to virtually all PNW sites west of the Cascades and many east. It modifies requirements across all TD values but most heavily affects TD-STRUCT.
- **RS-CSZ** is an overlay on RS-SDC-D that adds beyond-code considerations — relevant primarily at AD-L4 and AD-L5 depth.
- **RS-WUI** primarily affects TD-ENV (ignition-resistant materials) and TD-FIRE (vegetation management, access).
- **RS-MARINE** primarily affects TD-ENV (moisture management) and TD-MECH (ventilation and dehumidification strategies).
- **RS-GORGE** primarily affects TD-STRUCT (wind loads) and TD-ENV (cladding and roofing selection).
- All RS values influence LP-DESIGN decisions and LP-NEW construction sequencing.

---

## Cross-Dimension Compatibility Matrix

The 6 dimensions create a theoretical space of 6 x 5 x 9 x 8 x 5 x 7 = **75,600** unique coordinates. Not all combinations are valid or useful. The matrix below identifies the highest-relevance intersections for PNW construction practice.

### Primary Intersections: TD x BS

This is the most fundamental compatibility matrix — trade discipline requirements vary dramatically by building scale.

| | BS-ADU | BS-SFR | BS-MFR | BS-COM | BS-INST |
|---|---|---|---|---|---|
| **TD-STRUCT** | Prescriptive IRC, minimal engineering | Prescriptive IRC or engineered | Engineered required (IBC) | Engineered required (IBC) | Engineered + special inspections |
| **TD-ELEC** | Simplified load calc, single circuit may suffice | Standard residential per NEC | Commercial provisions, submetering | Full commercial NEC, transformer rooms | Emergency power, redundant systems |
| **TD-PLUMB** | Minimal fixture count, compact DWV | Standard residential DWV + supply | Shared waste stacks, water distribution risers | Grease traps, backflow preventers, roof drains | Medical gas, specialized waste |
| **TD-MECH** | Mini-split or small forced air | Manual J full calc, ducted system | Central plant or individual units | Rooftop units, VAV systems | Hospital-grade HVAC, 100% outside air |
| **TD-ENV** | Simple envelope, tight assembly | Standard wall assemblies, energy code | Fire-rated assemblies + energy code | Curtain wall, commercial roofing | Enhanced performance requirements |
| **TD-FIRE** | Smoke alarms only | Smoke alarms, CO alarms, egress windows | Fire-rated corridors, sprinklers (13R), alarm | Full sprinkler (13), alarm, standpipes | Smoke compartments, 2-hr barriers, full 13 |

### Secondary Intersections: ST x BS

Not all structural styles are valid at all building scales.

| | BS-ADU | BS-SFR | BS-MFR | BS-COM | BS-INST |
|---|---|---|---|---|---|
| **ST-WOOD-P** | Primary | Primary | Up to Type V (4-5 stories) | Limited (small commercial) | Rarely |
| **ST-WOOD-B** | Renovation only | Renovation only | Renovation only | N/A | N/A |
| **ST-WOOD-PB** | Occasional (custom) | Moderate (custom/mountain) | Rare | Rare (restaurant, brewery) | Rare |
| **ST-MASS** | Uneconomical | Rare (custom) | Growing (Type IV) | Growing | Growing (schools) |
| **ST-STEEL** | N/A | Rare | Moderate (frames) | Primary | Primary |
| **ST-CONC-CIP** | N/A | Rare (foundations only) | Podium levels | Moderate | Primary |
| **ST-CONC-TU** | N/A | N/A | N/A | Primary (industrial/retail) | Moderate |
| **ST-CONC-CMU** | N/A | Rare (retaining/utility) | Moderate (fire walls) | Moderate | Moderate |
| **ST-HYBRID** | N/A | Rare | Primary (5-over-1) | Moderate | Moderate |

### Tertiary Intersections: LP x AD

Lifecycle phases have natural audience alignments.

| | AD-L1 | AD-L2 | AD-L3 | AD-L4 | AD-L5 |
|---|---|---|---|---|---|
| **LP-DESIGN** | Decision input | Scope/budget planning | Blueprint reading | Full design management | Engineering design |
| **LP-NEW** | Progress monitoring | DIY portions | On-site training | Full project execution | Design support, RFIs |
| **LP-INSPECT** | Understanding reports | Prep for inspection | Performing inspections | Managing inspection schedule | Special inspections |
| **LP-MAINT** | Primary audience | DIY maintenance | Training context | Commercial maintenance | System evaluation |
| **LP-REPAIR** | Problem identification | DIY repairs | Repair training | Professional repair | Forensic assessment |
| **LP-REMODEL** | Scope decisions | DIY remodel | Remodel training | Full remodel execution | Structural evaluation |
| **LP-ADAPT** | Tenant perspective | N/A | Renovation training | Project management | Change of occupancy analysis |
| **LP-DEMO** | Awareness | N/A | Safety training | Demo management | Environmental assessment |

### Regional Intensity: RS x TD

How strongly each regional factor affects each trade discipline (scale: Low / Moderate / High / Critical).

| | TD-STRUCT | TD-ELEC | TD-PLUMB | TD-MECH | TD-ENV | TD-FIRE |
|---|---|---|---|---|---|---|
| **RS-CZ4C** | Moderate (moisture on wood) | Low | Low | Moderate (heat pump sizing) | Critical (moisture management) | Low |
| **RS-CZ5B** | Moderate (snow loads) | Low (solar potential) | Low (freeze protection) | High (heating + cooling) | High (thermal + vapor) | Low |
| **RS-SDC-D** | Critical (seismic design) | Moderate (equipment bracing) | Moderate (pipe bracing) | Moderate (equipment anchorage) | Moderate (cladding connections) | Moderate (sprinkler bracing) |
| **RS-CSZ** | Critical (long duration) | Low | Low | Low | Low | Low |
| **RS-WUI** | Low | Low | Low | Low | Critical (ignition resistance) | Critical (defensible space) |
| **RS-MARINE** | Low | Low | Low | Moderate (ventilation) | Critical (rain management) | Low |
| **RS-GORGE** | High (wind loads) | Low | Low | Low | High (cladding pressure) | Low |

---

## Coordinate Notation and Usage

### Formal Notation

A BCM knowledge coordinate is expressed as a 6-tuple:

```
BCM(TD, BS, ST, LP, AD, RS)
```

Examples:

```
BCM(TD-STRUCT, BS-SFR, ST-WOOD-P, LP-NEW, AD-L3, RS-CZ4C+RS-SDC-D)
```
*Structural framing for new single-family wood-frame home construction, trade student level, western PNW with seismic.*

```
BCM(TD-ENV, BS-MFR, ST-HYBRID, LP-REMODEL, AD-L4, RS-CZ4C+RS-MARINE)
```
*Envelope retrofit for multi-family hybrid building, contractor level, marine moisture climate.*

```
BCM(TD-MECH, BS-SFR, ST-WOOD-P, LP-MAINT, AD-L1, RS-CZ4C)
```
*HVAC maintenance for homeowner of wood-frame house in western PNW.*

### Wildcard Notation

Use `*` to indicate "all values" for a dimension:

```
BCM(TD-STRUCT, *, ST-WOOD-P, LP-NEW, AD-L3, *)
```
*Structural framing for new wood-frame platform construction at all building scales, trade student level, all regions.*

### Metadata Types Summary

| Dimension | Type | Cardinality | Multi-select | Ordinal |
|---|---|---|---|---|
| TD (Trade Discipline) | `enum<string>` | 6 | No | No |
| BS (Building Scale) | `enum<string>` | 5 | No | Yes (ascending complexity) |
| ST (Building Style) | `enum<string>` | 9 | No | No |
| LP (Lifecycle Phase) | `enum<string>` | 8 | No | No (but temporal ordering exists) |
| AD (Audience Depth) | `enum<string>` | 5 | No | Yes (ascending expertise, L1-L5) |
| RS (Regional Specificity) | `enum<string>` | 7 | Yes | No |

### Parameter Validation Rules

1. **TD** must be exactly one value from the TD enumeration.
2. **BS** must be exactly one value from the BS enumeration.
3. **ST** must be exactly one value from the ST enumeration.
4. **LP** must be exactly one value from the LP enumeration.
5. **AD** must be exactly one value from the AD enumeration.
6. **RS** must be one or more values from the RS enumeration, joined with `+`. RS-CZ4C and RS-CZ5B are mutually exclusive.
7. A coordinate is **valid** if the ST x BS combination exists in the Secondary Intersections matrix (not marked N/A).
8. A coordinate is **high-relevance** if all cross-dimension compatibility notes are satisfied.

### Enumeration Counts

| Dimension | Count |
|---|---|
| Trade Discipline (TD) | 6 |
| Building Scale (BS) | 5 |
| Building Style (ST) | 9 |
| Lifecycle Phase (LP) | 8 |
| Audience Depth (AD) | 5 |
| Regional Specificity (RS) | 7 (multi-select) |
| **Theoretical maximum** | **75,600** (single RS) |
| **With RS multi-select** | **75,600 x 2^7 = 9,676,800** |
| **Practical valid coordinates** | **~8,000-12,000** (after filtering invalid ST x BS combinations) |

---

## Document Metadata

| Field | Value |
|---|---|
| **Document ID** | BCM-00 |
| **Title** | 6-Dimensional Parameter Schema |
| **Version** | 1.0 |
| **Status** | Foundation |
| **Dependencies** | None (root document) |
| **Dependents** | BCM-01 through BCM-06 (all research modules) |
| **Primary dimensions** | All (TD, BS, ST, LP, AD, RS) |
| **Coordinate** | BCM(*, *, *, *, *, *) |
| **Word count** | ~8,500 |
| **Last validated** | 2026-03-08 |
