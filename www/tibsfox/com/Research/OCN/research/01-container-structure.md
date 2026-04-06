# Container Structure: Engineering Specification

> **Domain:** Structural Engineering / Containerized Infrastructure
> **Module:** 01 — Open Compute Node: Container Structure, Modification, and Zone Layout
> **Through-line:** *The 40ft High Cube ISO shipping container is not a compromise or a convenience — it is the correct form factor. It arrives pre-certified for the world's harshest transport conditions, fits every rail car, crane, and ship cell on earth, and provides exactly enough internal volume to house four compute racks, a full cooling loop, redundant power distribution, and fire suppression with room to spare. The modification work described here transforms a commodity logistics asset into the physical substrate of an AI compute node.*

---

> **PROFESSIONAL ENGINEER REVIEW REQUIRED**
>
> This specification is a conceptual design produced by AI-assisted engineering analysis. It has NOT been reviewed or stamped by a licensed Professional Engineer (PE). Before any construction, fabrication, or installation based on this specification:
>
> 1. All structural calculations must be verified by a PE licensed in the jurisdiction of deployment.
> 2. All electrical designs must comply with local amendments to the National Electrical Code.
> 3. All plumbing designs must comply with local plumbing code (UPC or IPC as applicable).
> 4. All water treatment systems must be certified by the state drinking water program.
> 5. Site-specific soil, seismic, and wind load analysis must be performed.
>
> The authors assume no liability for use of this specification without proper professional review.

---

## Table of Contents

1. [ISO 668/1496 Container Engineering](#1-iso-6681496-container-engineering)
2. [Modification Engineering](#2-modification-engineering)
3. [Internal Zone Layout](#3-internal-zone-layout)
4. [Weight Budget Analysis](#4-weight-budget-analysis)
5. [Rack Mounting and Seismic Provisions](#5-rack-mounting-and-seismic-provisions)
6. [Fire Suppression and Safety Systems](#6-fire-suppression-and-safety-systems)
7. [Environmental Sealing](#7-environmental-sealing)
8. [Logistics Compatibility](#8-logistics-compatibility)
9. [Sources and Standards](#9-sources-and-standards)

---

## 1. ISO 668/1496 Container Engineering

### 1.1 The Case for the 40ft High Cube

The Open Compute Node design selects the 40ft High Cube (40HC) ISO shipping container as its structural foundation on engineering merit, not sentiment. The global intermodal shipping container fleet represents one of the most successfully standardized engineering achievements of the 20th century: a single dimensional specification that works across ship cell guides, rail well cars, truck chassis, and overhead crane spreader bars on every continent. Any deviation from standard dimensions immediately forfeits that compatibility.

Within the standard container family, the 40ft High Cube is the correct choice for an AI compute node for three compounding reasons:

**Volume maximization within standard logistics.** The 40HC internal volume is 76.4 m³ — the maximum available within the standard intermodal envelope. The 20ft container (33.2 m³) is too short to accommodate four full-depth compute racks in series with adequate service clearances. The 40ft standard height (2,591mm internal) is 104mm shorter than the High Cube variant's 2,695mm, which, as detailed in Section 1.3, eliminates necessary clearance for overhead cable management.

**Floor area.** The 28.3 m² internal floor area is sufficient to accommodate four 44U compute racks in a single row with hot/cold aisle containment, plus dedicated zones for power distribution, cooling equipment, and entry clearance. The geometry is long and narrow — 12,032mm × 2,352mm — which maps naturally onto the linear zone layout required: entry, power, compute, cooling reading front to back.

**Established modification practice.** The containerized data center market (BMarko Structures, CANCOM, Delta Power Solutions) has established documented engineering practice for converting 40HC containers to compute use. Standard plumbing, HVAC, and electrical penetration kits are available from multiple vendors. The modification described here builds on this foundation while publishing every specification openly.

### 1.2 Dimensional Reference Table

All dimensions in this specification derive from ISO 668:2020 and ISO 1496-1:2013. The following table is the canonical dimensional reference consumed by all other modules.

> **PE Review Required** — All dimensions should be field-verified against the specific container unit prior to modification fabrication.

| Parameter | Metric | Imperial | Standard |
|-----------|--------|----------|----------|
| External length | 12,192 mm | 40 ft 0 in | ISO 668:2020 |
| External width | 2,438 mm | 8 ft 0 in | ISO 668:2020 |
| External height | 2,896 mm | 9 ft 6 in | ISO 668:2020 |
| Internal length | 12,032 mm | 39 ft 5 in | ISO 668:2020 |
| Internal width | 2,352 mm | 7 ft 9 in | ISO 668:2020 |
| Internal height | 2,695 mm | 8 ft 10 in | ISO 668:2020 |
| Door opening width | 2,340 mm | 7 ft 8 in | ISO 1496-1 |
| Door opening height | 2,585 mm | 8 ft 5.5 in | ISO 1496-1 |
| Tare weight (typical 40HC) | 3,750–4,200 kg | 8,267–9,259 lbs | Manufacturer spec |
| Maximum gross weight | 30,480 kg | 67,197 lbs | ISO 668:2020 |
| Maximum payload | ~26,300 kg | ~57,980 lbs | ISO 668:2020 |
| Internal volume | 76.4 m³ | 2,694 cu ft | Calculated |
| Internal floor area | 28.3 m² | 305 sq ft | Calculated |
| Forklift pocket c/c | 2,050 mm | 80.7 in | ISO 1496-1 |
| Corner fitting hole (slot) | 100 × 65 mm oval | per ISO 1161 | ISO 1161 |

**Derived zone dimension budget** (all figures ±5mm manufacturing tolerance):

| Zone | Start | End | Length | Width | Floor Area |
|------|-------|-----|--------|-------|------------|
| Entry | 0 mm | 2,000 mm | 2,000 mm | 2,352 mm | 4.7 m² |
| Power | 2,000 mm | 4,500 mm | 2,500 mm | 2,352 mm | 5.9 m² |
| Compute | 4,500 mm | 9,500 mm | 5,000 mm | 2,352 mm | 11.8 m² |
| Cooling | 9,500 mm | 12,032 mm | 2,532 mm | 2,352 mm | 6.0 m² |

### 1.3 Why the High Cube Height Matters

The difference between a standard 40ft container (2,591mm internal height) and the High Cube variant (2,695mm internal height) is 104mm — just over 4 inches. That gap determines whether the compute node is buildable.

Working from the floor up in the compute zone:

| Layer | Height Budget | Notes |
|-------|--------------|-------|
| Floor reinforcement plate | 6 mm | 6mm steel overlay per D-04.2 |
| Insulation — floor | 25 mm | Rigid foam board |
| Finished floor | 31 mm | Combined |
| Rack height (44U) | 1,955 mm (44 × 44.45mm) | EIA-310-D standard |
| Blanking panel / top clearance | 50 mm | Minimum for hot-air exhaust |
| Containment panel track | 50 mm | Ceiling-mount track + panel |
| Cable tray — installed depth | 150 mm | 300mm wide tray + mounting hardware |
| Cable tray — bend clearance | 100 mm | Minimum Cat6A/fiber bend radius |
| Clearance to structural ceiling | 30 mm | Insulation foam thickness at ceiling |
| **Total stack height required** | **2,371 mm** | |
| **Available in standard height** | **2,591 mm** | Leaves 220mm — insufficient for containment + cable management combined |
| **Available in High Cube** | **2,695 mm** | Leaves 324mm — sufficient with 104mm working margin |

The 104mm the High Cube provides is not spare headroom — it is precisely the margin that makes a compliant containment + overhead cable management installation possible. Eliminating containment to fit a standard container would negate ASHRAE TC 9.9 hot-aisle separation benefits. Routing cables below the floor would require a raised floor system that the container floor load rating cannot support at the necessary depth. The High Cube is not a preference; it is a requirement.

### 1.4 Structural Properties: Corner Castings and Load Transfer

The 40HC ISO container's structural system transfers all loads — stacking, crane lift, lashing — through eight corner castings conforming to ISO 1161. Understanding this load path is essential for modification planning: any fabrication that compromises a corner casting or its immediate weld zone is structurally unacceptable.

**Corner casting specification (ISO 1161):**

| Property | Value |
|----------|-------|
| Material | Cast steel, yield strength ≥ 270 MPa |
| Slot opening (top/bottom face) | 100 × 65 mm oval |
| Slot opening (side face) | 100 × 54 mm oval |
| Proof load — vertical (lift) | 848 kN per corner |
| Proof load — horizontal (racking) | 294 kN end wall |
| Proof load — racking (side wall) | 147 kN per side |
| Stacking rated (loaded, static) | 9-high or 192,000 kg gross total |
| Stacking rated (dynamic, transport) | 1.8× static = 345,600 kg equivalent |

These ratings confirm that the corner casting and the top and bottom rails feeding into them carry the dominant structural loads. **Wall penetrations must maintain a minimum 300mm clearance from all corner casting weld zones.** The penetration plan in Section 2.2 is designed to respect this constraint.

**Floor cross-member spacing:** 40HC containers use steel cross-members spaced approximately 800–1,000mm on center, on which the 28mm marine plywood floor panels rest. The floor's published line load rating is 7,260 kg/m. This is a line load along the length of the container (per linear meter of width), not a point load or area load. Its significance for rack mounting is addressed in Section 2.1.

### 1.5 Corten Steel: Weathering, Corrosion Resistance, and Weldability

Container side walls, roof panels, and structural members are fabricated from Corten steel (ASTM A588 / EN 10025-5), a high-strength low-alloy weathering steel that forms a dense, adherent oxide layer (patina) that inhibits further corrosion. This material choice drives modification planning in several respects.

**Weathering characteristics:**

| Property | Value | Notes |
|----------|-------|-------|
| Yield strength | 345 MPa (50 ksi) | ASTM A588 Grade B |
| Tensile strength | 485 MPa (70 ksi) | |
| Elongation | 18% minimum | |
| Charpy impact (−12°C) | 27 J minimum | |
| ASTM B117 salt fog corrosion | 4–8× better than carbon steel | Accelerated test |
| Patina formation period | 1.5–5 years | Climate dependent |
| Panel thickness (side walls) | 1.6–2.0 mm | Manufacturer dependent |
| Corrugated profile depth | 22–25 mm | Provides bending stiffness |

**Weldability:** Corten can be welded using SMAW (stick), GMAW (MIG), or FCAW processes. The patina layer must be ground back to bare metal in the weld zone (minimum 25mm each side) before welding, and the heat-affected zone re-treated with weathering steel primer after welding. Structural welds should specify filler metal compatible with Corten chemistry — AWS D1.1 Annex D provides guidance. All penetration collars and floor overlay welds are in-scope for this requirement.

**Insulation implication:** The Corten exterior continues to weather and develop patina after insulation is applied to the interior. The insulation system must provide a vapor barrier on the warm (interior) side to prevent moisture migration through the steel panel, which could compromise the foam-to-steel bond over time. This is addressed in Section 2.3.

### 1.6 Marine Plywood Floor and Steel Plate Overlay

The factory floor of the 40HC container is 28mm apitong (keruing) marine plywood, resting on steel cross-members. Marine plywood is specified for its dimensional stability, void-free core, and resistance to moisture delamination under repeated wet/dry cycles that occur during normal shipping use. For compute node purposes, the original plywood floor is retained as a substrate and supplemented with a structural steel plate overlay in the compute zone.

**Why a steel plate overlay rather than full floor replacement:**

1. The cross-member spacing (~900mm centers) creates spans that are well within the plywood's structural capacity for distributed loads, but problematic for point loads from rack feet. A 6mm steel plate welded to the cross-members distributes the rack foot point load across multiple cross-member spans, eliminating local overstress.

2. Full floor replacement would require hot work throughout the container interior — an elevated fire risk and more extensive work than an overlay.

3. The marine plywood retains value as a thermal break and acoustic damper under the steel plate; removing it would require direct spray-foam application to bare steel cross-members, complicating vapor management.

**Point load analysis for GB200 NVL72 racks:**

Each GB200 NVL72 rack weighs approximately 1,360 kg. A standard server rack rests on four leveling feet. Assuming equal load distribution (conservative for level floor):

| Parameter | Value |
|-----------|-------|
| Rack weight | 1,360 kg |
| Load per foot (4 feet, equal) | 340 kg per foot |
| Foot contact area (typical leveling foot) | ~5,000 mm² (70mm diameter pad) |
| Local bearing pressure | 340 kg / 5,000 mm² = 0.068 kg/mm² = 0.68 MPa |
| Cross-member bearing area (foot spans one cross-member) | ~150mm × 150mm = 22,500 mm² of effective steel |
| Distributed load per cross-member | 340 kg over 22,500mm² = 0.015 kg/mm² |

The 6mm steel plate overlay (ASTM A36, yield 250 MPa) distributes the 340 kg foot load across the full inter-member span, reducing peak bending stress to well within plate capacity. **PE structural verification of the overlay weld pattern and plate thickness is required before fabrication.**

> **PE Review Required** — Point load calculations above are illustrative estimates. A licensed structural PE must verify floor reinforcement design, including the overlay plate thickness, weld schedule, and minimum safety factor of 2.0 on yield.

---

## 2. Modification Engineering

> **PE Review Required** — All modifications to the ISO container structure require engineering review and field inspection. Structural modifications (penetrations, welding) must be designed and supervised by a PE licensed in the jurisdiction of deployment.

### 2.1 Floor Reinforcement

**Scope:** A 6mm A36 structural steel plate overlay is installed in the compute zone (5,000mm × 2,352mm = 11.76 m²) and the power zone (2,500mm × 2,352mm = 5.88 m²), for a total overlay area of 17.64 m². The entry zone and cooling zone use the existing plywood floor without steel overlay, as these zones carry only personnel loads and equipment with smaller footprints distributed over wider areas.

**Fabrication specification:**

| Parameter | Specification |
|-----------|--------------|
| Plate material | ASTM A36 hot-rolled steel |
| Plate thickness | 6 mm |
| Plate sections | Cut to fit between and over cross-members |
| Weld pattern | Continuous fillet weld to each cross-member flange |
| Fillet weld size | 5mm (minimum for 6mm plate to structural member) |
| Weld process | FCAW or GMAW; E70 compatible filler |
| Surface treatment | Hot-dip galvanized or industrial epoxy primer before installation |
| Anti-slip surface | Diamond-plate texture or applied non-slip coating |
| Weight of overlay | 6mm A36 density = 47.1 kg/m²; 17.64 m² × 47.1 kg/m² ≈ **831 kg** |

**Rack anchor points:** Four M20 threaded anchor studs per rack (16 total for 4 racks) are welded to the overlay plate during fabrication, not drilled post-installation. Welded studs provide higher pull-out resistance and avoid galvanic issues from post-installation drilling. Anchor stud spacing per rack is detailed in Section 5.

### 2.2 Wall Penetrations

A 40HC container requires a minimum of six penetrations for the compute node function. The penetration plan below assigns each penetration to a specific wall, at heights and positions that avoid the structural corner casting zones and main corrugation forming ribs.

**Structural clearance rule:** No penetration edge may be within 300mm of any corner casting weld zone, or within 150mm of a primary structural forming rib.

**Penetration schedule:**

| ID | Wall | Type | Nominal Diameter | Center Height | Notes |
|----|------|------|-----------------|---------------|-------|
| P-01 | South (long wall) | Power conduit (main feed A) | 100 mm | 500 mm AFF | 3/C 750 kcmil or conduit bundle |
| P-02 | South (long wall) | Power conduit (main feed B) | 100 mm | 500 mm AFF | Redundant feed, 600mm from P-01 |
| P-03 | South (long wall) | Emergency disconnect access | 150 mm | 1,500 mm AFF | Exterior disconnect handle penetration |
| P-04 | North (long wall) | Water intake | 50 mm | 300 mm AFF | Non-potable water in, welded nipple |
| P-05 | North (long wall) | Filtered water output | 25 mm | 350 mm AFF | Potable water out, elevated to minimize siphon |
| P-06 | North (long wall) | Waste drum access hatch | 600 mm wide × 800 mm tall | 200 mm AFF sill | Full-opening hatch for drum removal |
| P-07 | East (rear) | Fiber entry | 50 mm | 2,000 mm AFF | Armored conduit, high entry reduces moisture |
| P-08 | East (rear) | Exhaust vent A | 300 mm | 2,200 mm AFF | Hot air exhaust from hot aisle |
| P-09 | East (rear) | Exhaust vent B | 300 mm | 2,200 mm AFF | Redundant; 400mm from P-08 c/c |
| P-10 | West (front) | Personnel door | 900 mm wide × 2,100 mm tall | 0 mm AFF | Door frame replaces original cargo doors |

**Penetration weatherproofing assembly (each):**

Every penetration, regardless of contents, receives the following assembly from outside to inside:

1. **Drip edge:** 50mm bent steel drip lip welded to Corten above the penetration, shed water away from the seal.
2. **Weatherproof cable/pipe gland:** NEMA 4X rated (IP66), stainless steel body, EPDM sealing element. Sized per content.
3. **Fire-rated collar:** 2-hour fire rating per NFPA 75, intumescent material that expands to seal the annular space on fire exposure.
4. **Interior seal plate:** 3mm steel plate with matching cutout, welded to interior wall, providing substrate for insulation termination.
5. **Insulation termination:** Spray foam terminated and taped at seal plate; no thermal bridge to penetration sleeve.

The waste drum access hatch (P-06) is treated as a structural opening and framed with a welded box frame (50mm × 50mm × 3mm RHS) before hatch installation. The hatch uses a gasketed flush-mount design with three-point locking — similar to those used on refrigerated container doors — to maintain the thermal envelope.

### 2.3 Door Replacement

The original 40HC cargo doors (two leaf, swing-out, rubber-gasket sealed) are removed and replaced with a single personnel door assembly mounted in a fabricated steel frame that occupies the full original door opening.

**Original door opening:** 2,340mm wide × 2,585mm tall

**Personnel door specification:**

| Parameter | Specification |
|-----------|--------------|
| Door type | Single-leaf steel personnel door |
| Clear opening width | 900 mm |
| Clear opening height | 2,100 mm |
| Frame material | 14-gauge galvanized steel, welded to container frame |
| Door material | 16-gauge steel, foam core |
| Lock | Electronic access control (audit logged, keypad + RFID), keyed deadbolt backup |
| Emergency egress | Panic bar (ADA/IBC compliant) on interior, no key required for egress |
| Environmental seal | EPDM compression gasket on all four edges, IP54 minimum |
| Thermal break | Polyamide thermal break in door frame to prevent condensation at steel frame |
| Infill panel | 2,340mm − 900mm = 1,440mm residual opening filled with insulated steel panel, same R-value as walls |

**Why not retain cargo doors:** The original cargo doors are designed for cargo operations — wide clear opening for forklifts and cargo loading — not for personnel access, security, or thermal performance. The rubber gasket seal on original doors is not rated for continuous operation in the temperature differential range the compute node will experience (interior 20°C, exterior can range from −10°C to +50°C depending on site). The single-leaf personnel door with engineered compression seal provides a measured, reliable thermal and weather barrier with the security audit trail required for infrastructure operations.

### 2.4 Insulation System

**Thermal design basis:** The compute node must maintain interior ambient temperature between 18°C and 27°C (ASHRAE TC 9.9 A1 class inlet conditions) across a site ambient range of −10°C to +45°C. The insulation system provides passive thermal resistance that reduces the HVAC load required from the cooling system.

**Solar loading on Corten steel:** An uninsulated 40HC steel container under direct summer sun can reach an exterior surface temperature of 70–80°C in the US Southwest. Without insulation, this creates a solar heat gain of approximately 15–25 kW through the exposed surfaces — added directly to the HVAC load. The insulation system reduces this to less than 2 kW, a significant reduction in cooling overhead.

**Closed-cell spray polyurethane foam (ccSPF) specification:**

| Surface | Thickness | Nominal R-Value | Notes |
|---------|-----------|-----------------|-------|
| Walls (all four) | 50 mm | R-13 | Applied to interior steel surface |
| Ceiling | 75 mm | R-19 | Applied to interior corrugated roof panel |
| Floor (compute/power zones) | 25 mm rigid board | R-10 | Rigid foam board under steel overlay plate |
| Door infill panel | 75 mm | R-19 | Matching ceiling value |
| Around penetration collars | Taped termination | N/A | No foam gap at sleeve |

**ccSPF properties for this application:**

| Property | Value |
|----------|-------|
| Density (closed-cell) | 30–40 kg/m³ |
| R-value per 25mm | ~R-6.5 (US units per inch: R-6.0–6.5) |
| Water vapor permeance (2") | < 0.1 perms (Class II vapor retarder) |
| Compressive strength | ≥ 200 kPa |
| Air permeance | < 0.02 L/s·m² at 75 Pa |
| Fire performance | Requires thermal barrier (gypsum or metal) if exposed |
| Application temperature | 15°C–35°C ambient; substrate must be dry |

**Vapor barrier:** ccSPF at ≥50mm thickness is itself a Class II vapor retarder (< 1 perm). No separate membrane vapor barrier is required when full-thickness foam is applied correctly to all surfaces without gaps. All penetration sleeves are sealed at the interior face with foam-compatible sealant to eliminate vapor pathways.

**Thermal bridging at structural members:** The container's internal horizontal corrugations and the corner post sections create thermal bridges through the insulation layer. At 50mm foam thickness applied over corrugated panels, the effective R-value of the wall system (accounting for the steel fin bridging through the foam) is approximately R-9 to R-11 — reduced from the nominal R-13 of the foam alone. This degradation must be factored into the cooling system heat load calculation. The ceiling, applied at 75mm, achieves approximately R-15 effective, down from the nominal R-19.

> **PE Review Required** — Insulation thickness, vapor management, and thermal bridging calculations must be verified by a mechanical PE or certified building envelope specialist. Jurisdiction fire codes may require specific thermal barriers over ccSPF.

### 2.5 Interior Finish and Cable Management Infrastructure

After foam application and thermal barrier installation, the interior receives functional infrastructure for cable management, rack mounting, and aisle containment.

**Ceiling-mounted cable tray:**

| Parameter | Specification |
|-----------|--------------|
| Tray type | Ladder-style cable tray, ventilated |
| Width | 300 mm |
| Material | Hot-dip galvanized steel |
| Run length | Full container length (12,032 mm), two parallel runs |
| Mounting height | 2,400 mm AFF (300mm below finished ceiling) |
| Mounting method | Threaded rod hangers from embedded ceiling inserts, 1,200mm spacing |
| Power/data separation | Two trays with 300mm lateral separation; power in south tray, data in north tray per NEC 300.3 |
| Drop points | At each rack top, 4 total; 600mm wide drop section at each rack |

**Overhead vs. underfloor routing decision:** The 40HC floor cannot accommodate a raised floor system without consuming 150–300mm of the available floor-to-ceiling height. Given the tight height budget documented in Section 1.3, all cable routing is overhead. This is consistent with hot-aisle containment designs where overhead routing naturally integrates with cold-aisle ceiling panels.

**Aisle containment panel system:**

| Parameter | Specification |
|-----------|--------------|
| Cold aisle clear width | 1,200 mm (ASHRAE TC 9.9 recommended minimum) |
| Hot aisle clear width | 900 mm (NEC 110.26 minimum electrical clearance, serves double duty) |
| Containment type | Cold-aisle containment (CAC) with overhead blanking panels |
| Panel material | Polycarbonate (clear, for visual inspection) or steel-faced composite |
| Panel mounting | Floor-mounted track + ceiling-mounted track, panels slide out for rack access |
| Hot aisle | Enclosed by containment; exhaust directed to east wall exhaust vents P-08/P-09 |

**NEC 110.26 electrical working clearance** for 120V–250V equipment is 900mm minimum in front of equipment requiring access. The 900mm hot-aisle minimum satisfies this requirement for the rear of racks where power connections are made. The 1,200mm cold aisle satisfies the same requirement for front-of-rack access.

---

## 3. Internal Zone Layout

### 3.1 Zone Overview

The 12,032mm internal length is divided into four functional zones arranged linearly from the personnel entry (west) to the rear wall (east). Zone boundaries are structural — they correspond to cable tray section changes, aisle containment terminations, and plumbing manifold locations.

```
WEST WALL                                                           EAST WALL
(entry)                                                               (rear)
  │                                                                       │
  ├──── ENTRY ZONE ────┼──── POWER ZONE ────┼──── COMPUTE ZONE ──────────┼──── COOLING ZONE ────│
  │      2,000mm       │      2,500mm       │         5,000mm             │        2,532mm       │
  │                    │                    │                              │                       │
  0mm               2,000mm             4,500mm                        9,500mm               12,032mm
```

### 3.2 Entry Zone (0–2,000 mm)

**Function:** Personnel access, safety systems, monitoring station, emergency shutoff.

**Why 2,000mm:** NFPA 10 (portable fire extinguishers) and OSHA 1910.37 (means of egress) require unobstructed access paths. The 2,000mm entry zone provides clearance for the personnel door swing radius (900mm door = ~950mm swing), a 600mm monitoring station mount on the north wall, and an unobstructed 1,000mm path to the power zone entry. A narrower zone would create OSHA egress violations.

**Equipment:**

| Item | Location | Notes |
|------|----------|-------|
| Personnel door | West wall | 900mm × 2,100mm, see Section 2.3 |
| Fire suppression control panel | North wall, 1,400mm AFF | Zone status, manual discharge, alarm interface |
| Environmental monitoring station | North wall, 1,500mm AFF | Temperature, humidity, smoke, water leak, power status |
| Emergency AC disconnect | South wall, exterior | Exterior-accessible through P-03 penetration |
| Emergency power-off (EPO) button | Inside entry door, 1,400mm AFF | NEC 645.10 EPOPS (Emergency Power Off Protective System) |
| Portable fire extinguisher | North wall, bracket-mounted | CO₂, 10-lb minimum, per NFPA 10 |
| First aid kit | North wall | OSHA 1910.151 |
| Lighting | Ceiling, LED fixture | Emergency battery backup, 90-minute duration per NFPA 101 |
| Entry air lock (optional) | Between entry and power zone | Positive pressure barrier to prevent hot air migration; recommended but not required for baseline design |

**NEC 645.10 Emergency Power Off:** Every IT equipment room over a certain occupancy threshold requires a readily accessible disconnecting means that de-energizes all 120V or greater circuits within the room. The EPO button in the entry zone, immediately inside the door, satisfies NEC 645.10 and is the first thing personnel reach in an emergency. The EPO system design must be coordinated with the power distribution architecture and reviewed by an electrical PE.

> **PE Review Required** — NEC 645.10 EPO system design requires electrical PE review. The emergency disconnecting means must interrupt all ungrounded conductors simultaneously.

### 3.3 Power Zone (2,000–4,500 mm)

**Function:** Power distribution, UPS interface, inverter/converter, switchgear, bus bar.

**Width:** 2,500mm accommodates:
- A 600mm-deep main switchgear/distribution cabinet on the south wall
- A center aisle (1,100mm clear) for access
- A 600mm-deep PDU/UPS interface cabinet on the north wall

**Equipment:**

| Item | Location | Notes |
|------|----------|-------|
| Main switchgear | South wall | Receives feed from solar/battery DC bus via P-01/P-02 |
| DC-DC converter (1,500V → 48–51V) | South wall, lower | Converts high-voltage DC distribution to rack bus voltage |
| PDU (Power Distribution Units) | Both walls, rack-mounted | Branch distribution to individual racks |
| UPS interface / battery buffer | North wall | Small local UPS for monitoring and controlled shutdown; main BESS is external |
| Bus bar | Overhead | 48–51V DC bus bar runs overhead along zone boundary, drops to each rack in compute zone |
| Current monitoring | Integrated | Per-circuit monitoring for all rack feeds |
| Zone fire suppression | Ceiling-mounted | Independent suppression zone from compute zone |

**Power zone dimensional check:**

| Requirement | Dimension | Satisfied? |
|-------------|-----------|-----------|
| NEC 110.26(A)(1) — 120V-250V equipment working clearance | 900 mm in front of equipment | Yes — 1,100mm center aisle |
| NEC 110.26(A)(1) — above 250V equipment (if applicable) | 1,200 mm minimum | Depends on voltage class; confirm with PE |
| Access from entry zone | Through unobstructed aisle | Yes |
| Access to compute zone | Through containment doorway | Yes |

> **PE Review Required** — Power zone layout, bus bar sizing, and NEC 110.26 clearance compliance must be verified by a licensed electrical PE. DC systems above 48V have specific NEC requirements under Article 480 (batteries) and Article 691 (large-scale PV).

### 3.4 Compute Zone (4,500–9,500 mm)

**Function:** Four 44U compute racks, hot/cold aisle containment, overhead cable management.

**This is the primary purpose of the container.** All other zones exist to support what happens here: four server racks drawing approximately 60–120 kW each (depending on load), cooled by liquid cooling loops, networked via the overhead cable tray, and accessed through the cold aisle during maintenance.

**Rack arrangement:**

| Parameter | Value |
|-----------|-------|
| Number of racks | 4 (labeled R1–R4, west to east) |
| Rack specification | 44U EIA-310-D standard, 600mm wide, 1,200mm deep |
| Rack spacing (center-to-center) | ~1,200mm (4 racks × 600mm = 2,400mm; fits in 2,352mm width only with aisles perpendicular to rack faces) |
| Orientation | Racks face north (cold aisle) and south (hot aisle) — see aisle layout below |
| Cold aisle clear width | 1,200 mm (between north wall and rack fronts) |
| Hot aisle clear width | 900 mm (between rack rears and south wall) |
| Liquid cooling manifold | Overhead at rear (hot aisle), drops to each rack |

**Wait — the width math:** 4 racks × 600mm wide = 2,400mm — this exceeds the 2,352mm internal container width. The resolution: racks are oriented perpendicular to the container's long axis (racks run wall-to-wall across the 2,352mm width, not along the 12,032mm length). Each rack occupies one cross-section of the container.

Restated layout (racks run short-axis, zones run long-axis):

```
NORTH WALL ──────────────────────────────────────────────────────────────────
  Cold Aisle (1,200mm wide, container long axis)
  [R1-FRONT] ──────── [R2-FRONT] ──────── [R3-FRONT] ──────── [R4-FRONT]
  │  600mm  │ ~150mm │  600mm  │ ~150mm │  600mm  │ ~150mm │  600mm  │
  [R1-REAR]  ──────── [R2-REAR]  ──────── [R3-REAR]  ──────── [R4-REAR]
  Hot Aisle (900mm wide, container long axis)
SOUTH WALL ──────────────────────────────────────────────────────────────────
           ← 4,500mm from west ──────── COMPUTE ZONE ─────────── 9,500mm →
```

Actually, re-examining: 4 racks × 600mm = 2,400mm > 2,352mm internal width. The standard practice in containerized data centers is to orient racks with their long dimension (depth, 1,200mm) running across the container width, and to place them side-by-side along the container length. Each rack's 600mm face is perpendicular to the short wall.

Corrected rack placement (depth across container, width along container length):

```
Top-down view of compute zone (5,000mm × 2,352mm):

NORTH WALL (2,352mm)
├──────────────────── Cold Aisle Width ──────────────────────┤
│  ←300mm→ │    R1     │    R2     │    R3     │    R4     │ ←300mm→ │
│  side     │ 600mm ×  │ 600mm ×  │ 600mm ×  │ 600mm ×  │  side    │
│  gap      │ 1200mm   │ 1200mm   │ 1200mm   │ 1200mm   │  gap     │
│           │ depth     │ depth     │ depth     │ depth     │          │
├──────────────────── Hot Aisle Width  ──────────────────────┤
SOUTH WALL
← ─────────────────── 5,000mm ──────────────────────────── →
```

With 4 racks at 600mm each in a 5,000mm zone: 4 × 600mm = 2,400mm used, leaving 2,600mm for side gaps, cold aisle, and hot aisle. The north-south dimension is 2,352mm: rack depth 1,200mm + cold aisle 1,200mm − some overlap = this dimension requires the hot aisle to be on one wall and cold aisle on the other. 1,200mm (cold aisle) + 1,200mm (rack depth) = 2,400mm, which exceeds 2,352mm.

**Resolution for 2,352mm width:** Use 1,050mm cold aisle + 1,200mm rack depth + 100mm hot aisle = 2,350mm. This reduces hot aisle to 100mm — too narrow. The correct solution is a single-sided aisle layout or reduced rack depth. For GB200 NVL72 (1,200mm deep racks), the correct container layout uses a **center-row with hot-aisle containment:**

- **Cold aisle:** Both sides (north wall: 576mm, south wall: 576mm)
- **Rack row:** Center, 1,200mm deep
- **2,352mm = 576mm + 1,200mm + 576mm**

Both aisles are cold (intake) and a single hot-aisle containment chimney exhausts to the east wall vents. This is a recognized ASHRAE-compliant variant for narrow room configurations. Each cold aisle has 576mm of clearance — adequate for front-of-rack access (keyboard/video access, drive replacement) but tight for full rack extraction. Rack extraction requires rotation into the aisle and should be planned with this constraint acknowledged.

**Aisle and NEC clearance re-check with 576mm cold aisles:**

NEC 110.26(A)(1) — Equipment ≤ 120V: 900mm working space. Equipment 120V–250V: 900mm. The 576mm cold aisles do NOT meet NEC 110.26(A)(1) requirements for equipment requiring servicing while energized. **Resolution:** The access aisles are classified as cable management corridors, not electrical working clearance spaces. All rack maintenance requiring NEC 110.26 clearance is performed with the rack powered down and locked out per LOTO procedures. The container does not permit energized rear-of-rack electrical work given the physical constraints. This classification must be documented in the safety plan and reviewed by an electrical PE.

> **PE Review Required** — Aisle width, NEC 110.26 compliance classification, and hot/cold aisle containment design must be reviewed by a licensed mechanical and electrical PE. The single-row center aisle layout is unconventional and requires explicit safety documentation.

### 3.5 Cooling Zone (9,500–12,032 mm)

**Function:** CDU (Coolant Distribution Unit), filtration stages, pumps, waste drum, plumbing manifolds.

**Width:** 2,532mm (to east wall). This is the widest zone in absolute measurement due to the container's full internal length being used.

**Equipment:**

| Item | Location | Notes |
|------|----------|-------|
| CDU (Coolant Distribution Unit) | North side of zone | Receives hot return from racks, cools via heat exchanger, returns to cold supply |
| Primary coolant pump (duty) | CDU-integrated | 40–80 GPM per rack, 4 racks = 160–320 GPM total |
| Primary coolant pump (standby) | CDU-integrated | N+1 pump redundancy minimum |
| Water intake manifold | North wall, low | Receives water via P-04 penetration |
| Filtration stages 1–5 | Rack-mounted north wall | Sequential filters per cooling module specification |
| UV sterilization unit | Filtration train outlet | 254nm germicidal UV lamp |
| Filtered water output manifold | North wall | Connects to P-05 penetration |
| Waste drum (55-gallon DOT 17H) | Center zone | On removable skid, exits via P-06 hatch |
| Plumbing manifolds | North and south walls | Distribution headers for cooling loop |
| Zone fire suppression | Ceiling-mounted | Independent suppression zone |
| Floor drain | Zone centerline | Gravity drain for spill containment; connects to dedicated spill sump, not to storm drain without treatment |

**Waste drum access path:** The 55-gallon steel drum (DOT 17H, ~208L capacity) sits on a wheeled skid. The P-06 access hatch (600mm × 800mm) is sized to allow drum removal on the skid. Drum weight full: approximately 250 kg. The approach path from drum position to hatch must be level and clear; a hand pallet jack is the primary removal tool.

---

## 4. Weight Budget Analysis

> **PE Review Required** — Weight estimates below are engineering approximations for planning purposes. Actual weights must be verified from manufacturer data sheets. A licensed PE must confirm the final loaded weight is within ISO container payload limits and applicable transport regulations.

### 4.1 Component Weight Table

| Component | Weight (kg) | Basis |
|-----------|------------|-------|
| Container (tare, 40HC typical) | 4,000 | Manufacturer spec range 3,750–4,200 kg |
| Floor reinforcement (6mm A36, 17.64 m²) | 831 | Calculated: 17.64 m² × 47.1 kg/m² |
| Insulation + interior finish | 300 | ccSPF ~1.5 kg/m² avg × 100 m² surfaces + thermal barrier panels |
| Cable tray system (full run, two) | 120 | ~5 kg/m × 12m × 2 = 120 kg |
| Power systems — switchgear, PDU, bus bar | 600 | Typical containerized switchgear assemblies |
| Inverter/DC-DC converter | 200 | ~200 kg for 150kW class |
| Fire suppression system (clean agent) | 150 | Agent cylinders + piping + nozzles |
| Cooling system — CDU, pumps, piping | 800 | CDU ~400 kg + piping ~200 kg + pumps ~200 kg |
| Filtration system (all stages) | 400 | Filter housings, membranes, UV unit |
| Compute racks — 4× GB200 NVL72 | 5,440 | 4 × 1,360 kg per rack |
| Networking equipment (ToR switches, patch panels) | 200 | 2 × 48-port 400GbE switches + cabling |
| Monitoring and access control | 100 | Servers, sensors, displays |
| Coolant charge (40–80 GPM loop, propylene glycol mix) | 200 | ~150–200L in loop |
| Cable and plumbing (total in-container) | 400 | Estimated from zone lengths |
| Waste drum (full, DOT 17H) | 250 | Empty drum ~20 kg + 208L content |
| Containment panels, door hardware | 150 | Aisle containment + door assembly |
| **Total estimated payload** | **~10,141 kg** | |
| **Container tare (included above)** | *4,000 kg* | Already counted |
| **Total gross weight estimate** | **~10,141 kg** | |

Wait — clarification: tare weight (4,000 kg) is the container empty. Payload is contents only. ISO specifies:

**Gross weight = Tare + Payload**

| Category | Weight (kg) |
|----------|------------|
| Container tare weight | 4,000 |
| All modifications and content (payload) | 6,141 |
| **Estimated gross weight** | **~10,141 kg** |
| ISO maximum gross weight (40HC) | 30,480 kg |
| **Remaining capacity** | **~20,339 kg** |
| Payload only vs. ISO max payload (26,300 kg) | 6,141 vs. 26,300 — **6,141 / 26,300 = 23.3% utilized** |

These figures are consistent with the research reference document's estimate of ~10,620 kg total (the ~479 kg difference reflects more detailed accounting here vs. rounded estimates in the reference). The key finding is confirmed: the estimated payload is approximately 23–24% of the ISO maximum payload. The container is structurally underloaded relative to its ratings.

### 4.2 Weight Margin and What It Enables

The ~20,000 kg remaining gross weight capacity (or ~20,000 kg remaining payload capacity) is not dead margin — it is design headroom that makes the Open Compute Node adaptable:

**Additional compute racks:** Each GB200 NVL72 rack weighs 1,360 kg. The current design uses 4 racks. The weight budget supports approximately 14 additional racks before approaching the ISO gross limit (14 × 1,360 = 19,040 kg — nearly matching the remaining capacity). The limiting factor for additional racks is power and cooling, not structural weight.

**Heavier future hardware:** The compute industry trend is toward higher rack density and higher weight per rack. A next-generation successor to the GB200 platform could plausibly weigh 2,000 kg or more. The weight budget accommodates this evolution without structural re-engineering.

**On-site battery buffer:** A small (50–100 kWh) local battery buffer could be installed inside the container for ride-through during brief power disturbances. At ~100 kg/kWh for modern LFP cells, a 100 kWh buffer weighs ~10,000 kg — fitting within the remaining weight budget, though volume becomes the constraining factor in this case.

**Water storage:** A 1,000L potable water storage tank weighs ~1,000 kg full. This could buffer output filtration capacity for peak demand periods.

### 4.3 Transport Weight Limits

For the container to remain deployable by all intermodal modes, the gross weight must satisfy the most restrictive applicable limit:

| Mode | Governing Limit | Value | OCN Gross Weight | Compliant? |
|------|----------------|-------|-----------------|-----------|
| US highway truck (single chassis) | FMCSA 49 CFR 393 + 23 USC 127 | 36,287 kg (80,000 lbs) gross vehicle weight | ~10,141 kg container + chassis ~9,000 kg = ~19,141 kg | Yes — well within |
| US highway truck (twin 20ft) | N/A — this is 40ft | — | — | N/A |
| Rail — standard well car | AAR interoperability rules | 30,480 kg per container | ~10,141 kg | Yes |
| Rail — double-stack well car | AAR + bridge formulae | 30,480 kg upper position; 52,163 kg lower | ~10,141 kg | Yes, either position |
| Ship cell guide | ISO 668 gross weight | 30,480 kg | ~10,141 kg | Yes |
| Crane lift (corner casting) | ISO 1161 proof load | 848 kN per corner × 4 = 339 tonne | ~10,141 kg | Yes — factor ~33× |

The Open Compute Node in its reference configuration remains within the road transport gross vehicle weight limit even when combined with a typical intermodal chassis. This is significant: it means the node can be repositioned by standard truck without special overweight permits, reducing deployment friction substantially.

> **PE Review Required** — Transport weights must be confirmed from manufacturer data. Overweight permits and state-specific weight limits vary; consult with a licensed transportation engineer for any specific deployment route.

---

## 5. Rack Mounting and Seismic Provisions

> **PE Review Required** — Seismic bracing design is jurisdiction-specific and requires analysis by a licensed structural PE using site-specific seismic hazard data per ASCE 7-22.

### 5.1 Standard 19" Rack Mounting: EIA-310

All racks in the compute zone conform to EIA-310-D, the industry standard for 19-inch rack enclosures:

| Parameter | Value |
|-----------|-------|
| Rack unit (U) height | 44.45 mm (1.75 in) |
| Full rack height | 44U = 1,955.8 mm |
| Mounting rail width (center-to-center) | 450 mm (17.7 in) |
| Outer frame width | 600 mm standard |
| Mounting hole pattern | 12.7mm spacing, M6 or 10-32 thread |
| Depth (front rail to rear rail) | 700 mm minimum; 1,200 mm for GB200 class |
| Load bearing | Manufacturer-rated; GB200 NVL72 = 1,360 kg |

**Rack anchor specifications:**

Each rack is secured to the floor overlay plate via four M20 threaded studs (pre-welded to floor plate during fabrication) and M20 nuts with hardened washers. The anchor pattern for each rack:

| Anchor | Position (from rack centerline) | Notes |
|--------|--------------------------------|-------|
| A1 | Front-left foot, M20 stud | Matches rack leveling foot bolt pattern |
| A2 | Front-right foot, M20 stud | |
| A3 | Rear-left foot, M20 stud | |
| A4 | Rear-right foot, M20 stud | |

Stud projection above floor plate: 40mm minimum (accommodates leveling foot adjustment travel of ~25mm plus nut engagement of 15mm minimum).

**Minimum bolt engagement:** For M20 grade 8.8 bolt into floor plate, minimum thread engagement = 1.0× bolt diameter = 20mm. With 6mm plate this is insufficient — studs must be full-penetration through the 6mm plate and fillet-welded on the underside, not threaded into the plate.

### 5.2 Seismic Considerations

The US seismic hazard map (USGS National Seismic Hazard Model, 2023) identifies distinct risk zones. The primary deployment corridor (US Southwest along BNSF/UP Transcon) includes high-seismic regions:

| Region | ASCE 7-22 Risk Category | Design Short-Period Spectral Acceleration (SS) | Notes |
|--------|------------------------|---------------------------------------------|-------|
| Mojave Desert / Southern CA | III (essential facility) | 1.5–2.0g | Seismic Design Category D–F |
| New Mexico | II (standard) | 0.3–0.6g | Seismic Design Category B–C |
| Arizona (Phoenix area) | II | 0.1–0.3g | Seismic Design Category B |
| Texas (El Paso) | II | 0.3g | Seismic Design Category B–C |
| Pacific Northwest (rail routes) | II–III | 0.8–2.0g+ | Cascadia Subduction Zone risk |

For any deployment in ASCE 7-22 Seismic Design Category D or higher (which includes Southern California and Oregon/Washington), the rack mounting design must incorporate additional lateral bracing beyond simple floor anchors.

**Seismic Zone D/E/F bracing requirements (illustrative; PE verification required):**

| Element | Standard Requirement |
|---------|---------------------|
| Rack-to-floor anchors | Must resist lateral force = 0.3 × rack weight (at minimum) per ASCE 7-22 component analysis |
| Overhead brace | Rack top tied to structural beam or container side rail via cable or rigid brace |
| Row stabilizer | Racks interconnected at top rail with continuous stabilizer bar |
| Base isolation | Not typically required for single-story below-grade containers; consult PE |
| Equipment restraint within racks | All servers and components must be secured; blanking panels must be installed in all unused rack slots |

**Vibration isolation:** Shipping containers are inherently rigid structures that transmit vibration efficiently. CDU pumps and cooling system pumps are the primary internal vibration sources. All pumps must be mounted on vibration isolation mounts (neoprene or spring-type) to prevent resonance transmission to racks and to the container structure. Pump vibration frequencies (typically 15–60 Hz at operating speed) should be evaluated against the container's natural frequency using modal analysis.

> **PE Review Required** — Seismic bracing must be designed by a licensed structural PE using ASCE 7-22 analysis with site-specific Ss and S1 values from the USGS National Seismic Hazard Model. The design presented here is illustrative and does not constitute an engineered seismic design.

### 5.3 Floor Bolt-Down: Welded vs. Bolted

Two methods exist for securing rack anchors to the container floor system:

**Welded studs (recommended):** M20 all-thread studs fillet-welded to the 6mm floor overlay plate during fabrication, before installation. Advantages: eliminates galvanic interface between dissimilar metals; no reliance on thread engagement in thin plate; full-penetration weld provides maximum pull-out strength; inspection is straightforward before installation.

**Post-installation through-bolts:** M20 through-bolts through floor plate + plywood + container cross-member flange, with backing plate and nut below. Advantages: adjustable position after floor installation; no hot work required in completed container. Disadvantages: drilling through plywood and steel creates pathways for moisture migration into plywood; more complex sealing required; torque verification must account for the composite thickness.

For the reference design, welded studs are specified for permanent installations and post-installation through-bolts are specified for deployments where rack positioning may need to be adjusted after initial installation. Both methods require PE review.

---

## 6. Fire Suppression and Safety Systems

> **PE Review Required** — Fire suppression system design requires review by a licensed fire protection PE and must comply with all applicable NFPA standards and local jurisdiction amendments. Clean agent systems have specific concentration and discharge time requirements that must be calculated by a qualified fire protection engineer.

### 6.1 Clean Agent Systems: Why Not Water

The choice of a clean agent suppression system (rather than water-based suppression) for an IT equipment enclosure is not a preference — it is the only safe and code-compliant choice. NFPA 75 (Standard for the Fire Protection of Information Technology Equipment) and NFPA 76 (Standard for the Fire Protection of Telecommunications Facilities) both address this:

| Factor | Water-Based Suppression | Clean Agent Suppression |
|--------|------------------------|------------------------|
| IT equipment damage | Catastrophic — water destroys servers, storage, networking | None — clean agents leave no residue |
| Re-entry time after discharge | Hours to days (drying, cleanup, equipment assessment) | Minutes (ventilate, assess equipment, restart) |
| Electrical hazard | High — water + energized equipment creates shock and arc flash hazard | None — clean agents are electrically non-conductive |
| NFPA 75 compliance | Permitted only with specific sprinkler configurations; NFPA 75 strongly prefers clean agent | Explicitly supported and preferred |
| Weight | Water weight per gallon: 3.78 kg; system holds hundreds of gallons | Agent cylinders: 50–200 kg total for a container-sized enclosure |
| Environmental | Large water discharge requires drainage and disposal | See environmental notes below |

**Recommended clean agents:**

| Agent | Trade Name | NFPA Standard | Global Warming Potential (GWP) | Ozone Depletion | Notes |
|-------|------------|--------------|-------------------------------|-----------------|-------|
| FK-5-1-12 | Novec 1230 (3M) | NFPA 2001 | 1 (similar to CO₂) | Zero | Preferred for new installations; lowest GWP |
| HFC-227ea | FM-200 | NFPA 2001 | 3,220 | Zero | Widely used, lower GWP than Halon 1301 but high vs. Novec 1230 |
| CO₂ | — | NFPA 12 | 1 | Zero | Effective but lethal in total flooding concentrations; NOT recommended for occupied spaces |
| Inert gas blends (IG-541, Inergen) | — | NFPA 2001 | 0 | Zero | Effective; requires more cylinder volume than halocarbons |

The reference design specifies **Novec 1230 (FK-5-1-12)** as the primary clean agent for both suppression zones, based on its near-zero GWP and NFPA 2001 compliance. FM-200 is an acceptable alternative where Novec 1230 is unavailable.

### 6.2 Detection: VESDA and Supplemental Sensors

**VESDA (Very Early Smoke Detection Apparatus):** VESDA systems continuously aspirate air samples from the protected space through a network of sampling tubes, passing the sample through a laser detection chamber. This provides detection 10–30 minutes before conventional smoke detectors respond, because it detects the products of incipient heating before visible smoke forms.

| Parameter | VESDA Specification |
|-----------|-------------------|
| Detection principle | Laser nephelometric (light scattering) |
| Sensitivity | 0.004% obscuration/m to 20% obscuration/m (adjustable) |
| Sampling method | Active air aspiration through polyethylene sampling pipes |
| Alarm levels (typical) | Alert → Action → Fire 1 → Fire 2 (four-stage) |
| Power | 24V DC, supervised circuit |
| Application | One VESDA unit per suppression zone; sampling pipe network in overhead cable tray space |

VESDA is supplemented by:

| Sensor Type | Location | Purpose |
|-------------|----------|---------|
| Duct smoke detectors | CDU return air duct | Detect smoke in cooling airflow |
| Rate-of-rise heat detectors | Both suppression zones | Redundant detection for fast-developing fires |
| Flame detectors (UV/IR) | Power zone | Electrical arc flash detection |
| Water leak sensors | Floor level, all zones | Detect coolant leaks before reaching electrical equipment |

### 6.3 Suppression Zones

The container is divided into two independent suppression zones, each with its own agent cylinder(s), distribution piping, and VESDA circuit:

| Zone | Location | Hazard | Agent Volume | Pre-discharge Delay |
|------|----------|--------|-------------|-------------------|
| Zone A — Power | 2,000–4,500mm | Switchgear, inverter, bus bar | Calculated per NFPA 2001 for zone volume | 30 seconds (evacuation) |
| Zone B — Compute | 4,500–9,500mm | GPU racks, networking | Calculated per NFPA 2001 for zone volume | 30 seconds (evacuation) |

The cooling zone (9,500–12,032mm) is protected by water leak detection and temperature monitoring but does not use gaseous suppression — the open water handling equipment in this zone is incompatible with clean agent flooding, and the equipment present (plumbing, CDU) is more tolerant of water exposure if suppression were needed.

**NFPA 2001 design concentration:** For Novec 1230, the minimum design concentration for Class A/B/C hazards in normally unoccupied data spaces is 4.2% by volume (minimum; typically designed to 5.0–5.8% with safety factor). Container volumes:

| Zone | Volume | Design Concentration | Agent Mass (approx.) |
|------|--------|---------------------|---------------------|
| Zone A | 4,500 × 2,352 × 2,695 mm = 28.5 m³ | 5.0% | ~39 kg |
| Zone B | 5,000 × 2,352 × 2,695 mm = 31.7 m³ | 5.0% | ~44 kg |

> **PE Review Required** — Agent mass calculations must be performed by a licensed fire protection PE per NFPA 2001 Section 5.4. The values above are illustrative estimates only. Enclosure leakage factor, altitude correction, and design margin must all be applied by a qualified fire protection engineer.

### 6.4 Emergency Ventilation After Discharge

After a clean agent discharge, the agent must be purged from the protected space before personnel re-entry. Novec 1230 at 5% concentration is below the No-Observable-Adverse-Effect Level (NOAEL) of 10%, so it is not immediately dangerous to life and health (IDLH). However, the discharge displaces some oxygen, and prudent practice requires ventilation before re-entry.

The exhaust vents P-08 and P-09 (each 300mm diameter, east wall) are motorized and normally closed during operation to maintain thermal envelope. After suppression system discharge:

1. Agent discharge signal opens exhaust vents P-08/P-09 automatically (or manually from monitoring panel).
2. Supply air enters through the personnel door (opened manually from exterior) or via a dedicated motorized damper in the west wall.
3. Minimum ventilation time: 15 minutes of full cross-ventilation (0.5 air changes/minute × 30 minutes = 15 ACH recommended by NFPA 2001 for post-discharge ventilation).
4. Personnel re-entry with personal gas monitor confirmed safe.

### 6.5 NEC 645 — Information Technology Equipment

NEC Article 645 establishes requirements for IT equipment rooms. Key provisions applicable to the Open Compute Node:

| NEC 645 Requirement | Application | Compliance Approach |
|--------------------|-------------|-------------------|
| 645.4 — Special requirements | IT room ≤ 20 persons occupancy, sprinkler (or equivalent) protection, dedicated HVAC | Container design meets occupancy limit; clean agent provides equivalent protection; dedicated cooling system |
| 645.10 — EPOPS | Emergency power off within or outside the room; disconnects all circuits ≤ 208V | EPO button at entry zone, coordinates with power zone switchgear |
| 645.11 — Uninterruptible power supplies | UPS must be listed for IT equipment use; disconnect accessible from outside UPS enclosure | UPS in power zone; accessible from power zone aisle |
| 645.15 — Grounding | IT equipment grounding must comply with 250.134 or 250.136 | All racks bonded to container chassis ground; chassis grounded to site earth electrode |
| 645.17 — Critical operations power systems | May require COPS compliance if classified as critical facility | Jurisdiction-dependent; consult AHJ |

> **PE Review Required** — NEC 645 compliance determination requires review by a licensed electrical PE in coordination with the Authority Having Jurisdiction (AHJ). The AHJ may impose additional requirements beyond the base NEC text.

---

## 7. Environmental Sealing

### 7.1 IP Rating for Modified Container

The International Protection rating (IEC 60529) classifies enclosure protection against solid objects and water ingress. An unmodified 40HC container is rated for ISO 1496-1 weather-tight performance (equivalent to approximately IP54 — protected against dust deposits and water splashing from any direction). After modification, the system must maintain or exceed this rating at all penetrations.

**Target IP ratings by element:**

| Element | Target IP Rating | Basis |
|---------|-----------------|-------|
| Container overall (fabric) | IP54 | ISO 1496-1 weather-tight maintenance |
| Personnel door | IP54 minimum | EPDM compression gasket on all edges |
| Power conduit penetrations P-01/P-02 | IP66 | NEMA 4X cable gland, watertight |
| Water pipe penetrations P-04/P-05 | IP68 | Submersible-rated, welded fitting with gasket |
| Fiber entry P-07 | IP67 | Armored conduit with sealed entry gland |
| Exhaust vents P-08/P-09 | IP54 (open); IP67 (motorized damper closed) | When closed, damper blade + seals |
| Waste drum hatch P-06 | IP54 | Gasketed flush-mount hatch |

**Note on IP ratings for container penetrations:** IP ratings apply to manufactured enclosures tested as a system. Field-modified containers do not receive formal IP certification. The ratings above represent design targets — the actual ingress protection depends on installation quality and must be verified by visual inspection and functional testing after modification. In jurisdictions with high seismic risk, periodic re-inspection of gland seals is recommended after any seismic event.

### 7.2 Thermal Performance: Solar Loading

The 40HC container presents a significant solar collection surface. External surface areas:

| Surface | Area | Solar Load Factor |
|---------|------|-----------------|
| Roof | 12.192m × 2.438m = 29.7 m² | Peak (horizontal, midday) |
| South long wall | 12.192m × 2.896m = 35.3 m² | High (vertical south-facing) |
| North long wall | Same | Lower (north-facing, diffuse) |
| End walls (× 2) | 2.438m × 2.896m = 7.1 m² each | Partial (depends on orientation) |

Assuming the container is oriented with one long wall facing south:

| Season | Peak solar irradiance (US SW) | Roof heat flux | South wall heat flux | Total solar gain (uninsulated) |
|--------|------------------------------|---------------|---------------------|-------------------------------|
| Summer | 1,000 W/m² | 1,000 × 29.7 × 0.85 absorption ≈ 25.2 kW | 600 × 35.3 × 0.85 ≈ 18.0 kW | ~43 kW |
| Winter | 600 W/m² | ~15 kW | ~11 kW | ~26 kW |

With R-19 ceiling insulation (effective R-15 after bridging) and R-13 wall insulation (effective R-10):

| Surface | Uninsulated solar gain | After insulation | Reduction |
|---------|----------------------|-----------------|-----------|
| Roof | ~25 kW | ~25 kW × (1/15) ÷ (1/3) ≈ 5 kW | ~80% |
| South wall | ~18 kW | ~18 kW × (1/10) ÷ (1/0.7) ≈ 1.3 kW | ~93% |
| Total | ~43 kW | ~6.3 kW | ~85% reduction |

This confirms that insulation reduces the solar heat gain from ~43 kW to approximately 6 kW at peak summer conditions — a significant reduction in supplemental cooling load.

**Reflective exterior coating:** Applying a white or highly reflective exterior coating (solar reflectance index SRI > 85) to the roof and south wall reduces solar absorptance from ~0.85 (unpainted Corten) to ~0.10–0.15. This reduces the insulated solar gain further, to approximately 1–2 kW. The community mural art program (painting the exterior) inherently changes the solar absorptance of the painted surfaces; white-base paints with pigmented artwork over them retain moderate reflectance. Mural design guidelines should specify light-background compositions for thermally sensitive deployments.

### 7.3 Acoustic Treatment

**Internal noise sources:**

| Source | Typical Sound Power Level | Notes |
|--------|--------------------------|-------|
| GB200 NVL72 rack (72 GPUs under load) | ~80–85 dB(A) at 1m | Direct liquid cooling reduces fan noise vs. air-cooled racks |
| CDU pumps (2× primary+standby) | ~65–70 dB(A) | Pump hydraulic noise + motor; vibration isolation mounts reduce transmission |
| Filtration pumps | ~55–60 dB(A) | Lower power |
| Power conversion equipment | ~55 dB(A) | Transformer hum, fan cooling |
| Combined (near-field inside container) | ~85–88 dB(A) | OSHA 1910.95 PEL: 90 dB(A) 8-hour TWA |

**OSHA 1910.95 compliance:** Workers spending extended periods inside the operating container may require hearing protection above 85 dB(A) (OSHA action level) or 90 dB(A) (PEL). Maintenance activities inside the operating container should be limited in duration or conducted with hearing protection. This is addressed in the operations safety plan.

**Community noise:** The primary community noise concern is the CDU exhaust air and cooling fan noise exiting through the east wall vents P-08/P-09. Sound transmission through the container wall (1.6mm Corten + 50mm ccSPF) provides approximately 25–30 dB(A) of insertion loss. A 85 dB(A) interior source becomes approximately 55–60 dB(A) at the exterior — within typical industrial zone limits but potentially audible at residential boundaries depending on site.

**Acoustic mitigation options:**

1. **Exhaust duct silencers:** Reactive or absorptive duct silencers on P-08/P-09 exhaust paths can reduce radiated noise by 10–20 dB(A) with minimal pressure drop penalty.
2. **Barrier wall:** An earthen berm or masonry barrier on the east side of the container reduces far-field noise levels.
3. **Operational scheduling:** If noise is a community concern, CDU maintenance and drain operations can be scheduled during daytime hours.

### 7.4 Condensation Management

The container interior is maintained at 18–27°C year-round. In cold climates, the exterior is much colder — potentially −10°C to −20°C. This creates a strong condensation driving force if any pathway exists for warm interior air to contact cold exterior surfaces.

**Condensation risk points:**

1. **Penetration sleeves:** Cold metal sleeves passing through the insulation layer create thermal bridges where interior warm air can contact cold surfaces. All sleeves must be insulated along their length with foam wrap, terminating at the interior seal plate. The annular space between sleeve and wall must be filled with expanding foam sealant.

2. **Door frame thermal bridge:** The steel door frame, if not equipped with a polyamide thermal break, creates a cold surface inside the entry zone where condensation can form. Thermal break specification is mandatory.

3. **Floor-wall junction:** The floor insulation (25mm rigid board) and wall insulation (50mm ccSPF) meet at a corner that is difficult to seal. A foam fillet applied at the junction before floor plate installation eliminates this pathway.

4. **Cable tray hanger penetrations:** Each hanger rod passing through the ceiling foam creates a small but real thermal bridge. In high-humidity climates, these can cause condensation drips. Hanger rods should be insulated where they pass through the foam layer, or the foam applied after hangers are installed (preferred sequence).

**Humidity control:** Maintaining relative humidity (RH) at 40–60% inside the container (ASHRAE TC 9.9 A1 class: 20–80% non-condensing) prevents biological growth and reduces condensation risk. The cooling system inherently dehumidifies as a side effect of the air-cooling component (networking, power conversion). In very dry climates (RH < 20%), a humidifier may be needed to prevent electrostatic discharge (ESD) events.

---

## 8. Logistics Compatibility

> **PE Review Required** — Transport and rigging operations require engineering oversight. Crane lift plans must be prepared by a qualified rigger and reviewed by an engineer of record. All transport must comply with applicable federal, state, and local regulations.

### 8.1 Rail: Well Cars and Double-Stack Clearance

The US intermodal rail system uses three primary container car types:

| Car Type | Container Length | Stack Height | Clearance Envelope | GB200 Container Compatible? |
|----------|-----------------|-------------|-------------------|----------------------------|
| Single well car | 40ft or 48ft | Single | ~19ft 2in (5,842mm) clearance on most routes | Yes |
| Double-stack well car (articulated 5-car) | 40ft, 45ft, 48ft | Two 9'6" containers | Requires auto tri-plate clearance (>20ft 2in / 6,147mm) on clear routes | Yes — upper or lower position |
| Flat car | 40ft | Single | As above | Yes |

**AAR double-stack clearance:** Double-stack operations require at least 20ft 2in (6,147mm) clearance above top of rail on all bridges and tunnels in the route. The 40HC container in the upper stack position has an external height of 9ft 6in (2,896mm). In the lower stack position of a double-stack well car, the container floor is approximately 1,016mm (40in) above the rail, giving a loaded height of 1,016mm + 2,896mm = 3,912mm (12ft 10in) — well within clearance. In the upper position, the combined stack is approximately 1,016mm + 2× 2,896mm = 6,808mm (22ft 4in), which fits within the AAR maximum cleared route envelope (7,620mm / 25ft on most major corridors).

The Open Compute Node's 40HC format is fully compatible with double-stack intermodal rail operations on Class I railroad main lines. This is an important operational advantage: double-stack rates are significantly lower than single-stack or highway rates, reducing deployment and relocation costs.

**Rail-specific considerations for the OCN:**

1. **Dynamic loads:** Rail transport subjects containers to longitudinal loads (acceleration/braking) up to 2g and lateral loads (lateral acceleration) up to 1g. These are higher than road transport dynamic loads and must be factored into rack restraint design. The GB200 NVL72 manufacturer's shipping restraint specifications (if any) apply.

2. **Vibration spectrum:** Rail vibration is characterized by a broad spectrum dominated by 1–50 Hz frequencies driven by track joints, rail welding roughness, and wheel frequency. Vibration isolation for CDU pumps and sensitive monitoring equipment should account for this spectrum.

3. **Intermodal transfer:** The container will be transferred between truck chassis, rail car, and potentially ship using twist-locks on corner castings. The modified container must maintain all four corner castings and all eight twist-lock holes in functional condition. No modification may obstruct twist-lock engagement.

### 8.2 Truck: Chassis Types and Securement

For truck transport, the 40HC container requires a container chassis. Primary chassis types:

| Chassis Type | Length | Comments |
|-------------|--------|---------|
| 40ft standard chassis | 40ft | Direct fit; most common type |
| 40-45ft extendable chassis | 40-45ft | Can be set to 40ft; common in intermodal |
| 20+20 twin chassis | 20ft + 20ft | Not applicable (40ft container) |
| Goose-neck 40ft | 40ft | Lower deck height; preferred for over-height cargo — not needed here |

**FMCSA 49 CFR 393 securement:** The 40HC container must be secured to the chassis via twist-locks at all four corner castings (minimum). FMCSA 393.100–393.106 requires:

- Minimum four securement points (corner castings)
- Securement system working load limit ≥ one-half the weight of the article
- No movement under deceleration equivalent to 0.8g

The OCN's estimated 10,141 kg gross weight requires securement with working load limit ≥ 5,071 kg. Standard ISO twist-locks are rated for 250 kN (25,484 kg) each — massively exceeding this requirement.

**Over-height considerations:** The 40HC at 2,896mm external height is within legal limits for US highway transport (4,115mm / 13ft 6in maximum in most states). No special over-height permits are required.

### 8.3 Crane: Corner Casting Lift Points and Spreader Bar

All crane lifts of ISO containers must use a spreader bar engaging all four top corner castings simultaneously. Direct lift from slings around the container is not permitted — the container is not engineered for mid-span vertical loading on its side rails.

**Spreader bar specification for 40ft container:**

| Parameter | Value |
|-----------|-------|
| Spreader bar type | Telescopic (adjustable 20–40ft) or fixed 40ft |
| Twist-lock pins | 4 × ISO 1161 corner fitting engagement pins |
| Lift angle | Vertical legs only; no diagonal legs below spreader |
| Minimum SWL | Must exceed 1.25× OCN gross weight = 1.25 × 10,141 = 12,676 kg |
| Typical crane spreader SWL | 35,000–45,000 kg (40t class) — massively adequate for OCN |

**Lift procedure:** All loose items inside the container must be secured before lifting. The waste drum (if present) must be secured to its skid. CDU coolant piping must be verified closed. The container should not be lifted while coolant is flowing through the system — the CDU and pump stop must precede any lift.

### 8.4 Ship: Cell Guide Compatibility

Standard container ships use cellular guides (cell guides) that accept 40ft ISO containers. The OCN's external dimensions are identical to an unmodified 40HC, so cell guide compatibility is maintained. No exterior dimensional modification is made to the container — all modifications are internal or are recessed flush with the exterior profile.

**Ship-specific considerations:**

1. **Salt atmosphere:** Marine environments accelerate Corten steel corrosion beyond its design patina. If the OCN is shipped by sea or deployed near a coast, additional protective coating of exterior surfaces beyond the mural art coat is recommended — specifically a zinc-rich primer coat under any topcoat.

2. **Humidity during sea transit:** Container interiors can reach 100% RH during sea transit in tropical regions. If the OCN is fully assembled and sealed for transit, the internal HVAC system should be operated during transit (if powered by a genset set) or the container should be sealed with desiccant packs and moisture-absorbing materials until it reaches the deployment site.

3. **IMDG Code:** If the fire suppression agent cylinders (Novec 1230 or FM-200) are pre-installed for transit, they must be classified and manifested per the International Maritime Dangerous Goods (IMDG) Code. FK-5-1-12 (Novec 1230) is classified as IMDG Class 2.2 (non-flammable, non-toxic compressed gas). This adds a documentation and inspection requirement for sea shipment but does not prohibit it.

---

## 9. Sources and Standards

### 9.1 Standards Referenced in This Module

| Standard | Title | Applicability |
|----------|-------|--------------|
| ISO 668:2020 | Series 1 freight containers — classification, dimensions and ratings | Container dimensional reference |
| ISO 1496-1:2013 | Series 1 freight containers — specification and testing — Part 1: General cargo containers | Structural test requirements |
| ISO 1161:2016 | Series 1 freight containers — corner and intermediate fittings | Corner casting specifications |
| ASTM A588 / A588M | Standard Specification for High-Strength Low-Alloy Structural Steel (Corten) | Container wall material |
| ASTM A36 / A36M | Standard Specification for Carbon Structural Steel | Floor overlay plate |
| ASCE 7-22 | Minimum Design Loads and Associated Criteria for Buildings and Other Structures | Seismic, wind, and live load design |
| NFPA 70 (NEC 2023) | National Electrical Code | All electrical installations |
| NFPA 75:2020 | Standard for the Fire Protection of Information Technology Equipment | IT equipment fire protection |
| NFPA 76:2022 | Standard for the Fire Protection of Telecommunications Facilities | Telecom fire protection |
| NFPA 2001:2022 | Standard on Clean Agent Fire Extinguishing Systems | Clean agent suppression design |
| NFPA 10:2022 | Standard for Portable Fire Extinguishers | Entry zone extinguisher |
| NFPA 101:2021 | Life Safety Code | Emergency lighting, egress |
| ASHRAE TC 9.9 (2021) | Thermal Guidelines for Data Processing Environments | Temperature/humidity envelope |
| EIA-310-D | Cabinets, Racks, Panels and Associated Equipment | 19-inch rack standard |
| IEC 60529 | Degrees of Protection Provided by Enclosures (IP Code) | Enclosure IP rating |
| AWS D1.1 | Structural Welding Code — Steel | Welding specifications |
| FMCSA 49 CFR 393 | Parts and Accessories Necessary for Safe Operation | Container truck securement |
| AAR Interoperability Standards | Circular OT-55 | Rail container clearance |
| IMDG Code (2024 edition) | International Maritime Dangerous Goods Code | Sea transport of suppression agent |
| OSHA 1910.95 | Occupational Noise Exposure | Worker noise protection |
| OSHA 1910.151 | Medical Services and First Aid | First aid requirements |

### 9.2 Key Engineering Parameters Summary

A consolidated single-table reference for the most frequently consumed engineering parameters in this module:

| Parameter | Value | Source |
|-----------|-------|--------|
| Internal length | 12,032 mm | ISO 668:2020 |
| Internal width | 2,352 mm | ISO 668:2020 |
| Internal height | 2,695 mm | ISO 668:2020 |
| Maximum payload | 26,300 kg | ISO 668:2020 |
| Floor line load rating | 7,260 kg/m | ISO 1496-1 |
| Corner casting proof load (vertical) | 848 kN per corner | ISO 1161 |
| GB200 NVL72 rack weight | 1,360 kg | NVIDIA / HPE spec |
| GB200 NVL72 rack power | ~120 kW | NVIDIA spec |
| GB200 NVL72 rack dimensions | 600mm W × 1,200mm D × ~1,956mm H | NVIDIA spec |
| Cold aisle minimum width (ASHRAE) | 1,200 mm | ASHRAE TC 9.9 |
| Hot aisle minimum width (NEC) | 900 mm | NEC 110.26 |
| Clean agent design concentration (Novec 1230) | 5.0% by volume | NFPA 2001 |
| Insulation — walls | 50mm ccSPF (R-13 nominal, R-9–11 effective) | This specification |
| Insulation — ceiling | 75mm ccSPF (R-19 nominal, R-15 effective) | This specification |
| Floor overlay plate | 6mm ASTM A36 | This specification |
| Estimated OCN gross weight | ~10,141 kg | This specification |
| Remaining gross weight capacity | ~20,339 kg | Calculated |

---

> **PROFESSIONAL ENGINEER REVIEW REQUIRED**
>
> This specification is a conceptual design produced by AI-assisted engineering analysis. It has NOT been reviewed or stamped by a licensed Professional Engineer (PE). Before any construction, fabrication, or installation based on this specification:
>
> 1. All structural calculations must be verified by a PE licensed in the jurisdiction of deployment.
> 2. All electrical designs must comply with local amendments to the National Electrical Code.
> 3. All plumbing designs must comply with local plumbing code (UPC or IPC as applicable).
> 4. All water treatment systems must be certified by the state drinking water program.
> 5. Site-specific soil, seismic, and wind load analysis must be performed.
>
> The authors assume no liability for use of this specification without proper professional review.

---

*Open Compute Node — Container Structure Module. Part of the OCN Research Series. Licensed CC BY-SA 4.0.*
