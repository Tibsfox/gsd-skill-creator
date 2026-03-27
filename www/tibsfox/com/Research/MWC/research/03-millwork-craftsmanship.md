# Millwork Craftsmanship & Production Engineering

> **Domain:** Manufacturing Engineering & Quality Systems
> **Module:** 3 -- BOM-First CNC Production Methodology
> **Through-line:** *The bill of materials is the truth document. Everything upstream of the BOM is negotiation; everything downstream is execution.* Synsor's production methodology centered on one discipline: no unit goes to the shop floor without a complete, approved BOM. Every piece of material, every hardware item, every finish specification is enumerated before a single CNC program runs. The methodology is not proprietary -- it is standard lean manufacturing applied to architectural millwork with absolute rigor. The co-op reconstructs it.

---

## Table of Contents

1. [The BOM-First Principle](#1-the-bom-first-principle)
2. [SOW Intake to BOM Generation](#2-sow-intake-to-bom-generation)
3. [BOM Structure and Standards](#3-bom-structure-and-standards)
4. [CNC Programming Workflow](#4-cnc-programming-workflow)
5. [Material Procurement and JIT Scheduling](#5-material-procurement-and-jit-scheduling)
6. [Production Floor Operations](#6-production-floor-operations)
7. [The Finish Room: Quality Differentiator](#7-the-finish-room-quality-differentiator)
8. [AWI Quality Standards Compliance](#8-awi-quality-standards-compliance)
9. [Multi-Node Production Coordination](#9-multi-node-production-coordination)
10. [Lean Manufacturing in the Millwork Shop](#10-lean-manufacturing-in-the-millwork-shop)
11. [Equipment Specifications](#11-equipment-specifications)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The BOM-First Principle

The BOM (Bill of Materials) is the central artifact of precision millwork manufacturing. It is the complete enumeration of every component required to produce a finished unit: every piece of lumber, every sheet of plywood, every piece of hardware, every milliliter of finish. Nothing goes to the shop floor without a BOM. Nothing is ordered from a supplier without a BOM. Nothing is quoted to a client without a BOM.

This is not a suggestion. It is the core operational discipline that separates precision commercial millwork from job-shop woodworking. When Starbucks orders 200 identical espresso bar fixtures, the BOM is what guarantees that unit #200 is indistinguishable from unit #1. Without it, you get 200 units that are "close enough" -- and "close enough" fails AWI Custom grade inspection.

```
BOM-FIRST PRODUCTION FLOW
================================================================

  Client SOW ──> Engineering Review ──> BOM Generation
       |                                      |
       |   (nothing proceeds without          |
       |    approved BOM)                     v
       |                              BOM Approval Gate
       |                                      |
       +──────────────────────────────────────+
                                              |
       +──────────+──────────+──────────+─────+
       |          |          |          |
       v          v          v          v
   Material    CNC Prog   Finish    Hardware
   PO's        Generation  Spec     PO's
       |          |          |          |
       v          v          v          v
   Receiving   CNC Run    Spray     Assembly
       |          |        Booth        |
       +──────────+──────+──────+──────+
                         |
                         v
                  AWI Inspection
                         |
                         v
                  Packaging & Ship
```

### Why BOM-First Matters

1. **Cost accuracy.** The BOM contains every material and its quantity. Material cost is calculable before production begins. Bids are accurate, not estimated.
2. **Procurement efficiency.** Material purchase orders are generated directly from the BOM. No over-ordering, no emergency runs to the supplier.
3. **Quality consistency.** Every unit is built from the same BOM. Substitutions require a BOM revision and approval, not a shop floor judgment call.
4. **Multi-node compatibility.** When a 200-unit order is split across Node North and Node South, both nodes work from the same BOM. The product is identical because the instructions are identical.

---

## 2. SOW Intake to BOM Generation

The production workflow begins when a client provides a Scope of Work (SOW). The SOW may arrive as architectural drawings, a written specification, a sample unit, or a combination. Engineering's job is to convert the SOW into a BOM.

### SOW Intake Checklist

| Item | Required | Notes |
|------|----------|-------|
| Architectural drawings | Yes | Plan view, elevations, sections, details |
| Material specification | Yes | Species, grade, finish, hardware |
| AWI grade requirement | Yes | Economy, Custom, or Premium |
| FSC certification requirement | Yes | Required by most major clients |
| LEED compliance requirement | Conditional | If project is LEED-certified |
| Quantity | Yes | Number of identical units |
| Delivery schedule | Yes | Date and site address |
| Installation required | Conditional | White-glove install adds complexity |
| Sample unit approval | Conditional | Some clients require a sample before full run |

### Engineering Review Process

1. **Drawing review.** Verify that architectural drawings are complete and dimensioned. Flag missing dimensions or ambiguous details.
2. **Material selection.** Confirm species, grade, and source availability with the supply chain. Flag any species or grade not available from primary or backup suppliers.
3. **AWI grade assessment.** Determine whether the specified grade can be achieved with available materials and the current finish room capability.
4. **BOM generation.** Using CAD/CAM software (Vectric, Mastercam Wood, Cabinet Vision, or equivalent), generate a complete BOM from the drawings.
5. **Cost calculation.** Apply current material pricing from supplier accounts. Add labor hours by operation. Add overhead and margin.
6. **BOM approval.** Engineering lead reviews and approves the BOM. No production activity begins without an approved BOM.

> **SAFETY WARNING:** A BOM that omits OSHA-required safety specifications (finish room ventilation parameters, dust collection requirements for specific materials) is an incomplete BOM. Safety requirements are part of the manufacturing specification, not an afterthought.

---

## 3. BOM Structure and Standards

Each BOM line item follows the schema defined in the shared types (Module 00). The structure ensures that every downstream operation -- procurement, CNC programming, finishing, inspection -- can reference the same data.

### BOM Line Item Fields

```
BOM LINE ITEM STRUCTURE
================================================================

  item_id:           MWC-2026-001-A01    (project-line-item ID)
  description:       Side panel, left     (human-readable)
  material_species:  cherry               (wood species or "MDF", "plywood")
  material_grade:    FAS                  (lumber grade)
  fsc_required:      true                 (client FSC requirement)
  quantity:          200                  (units needed, this line)
  unit:              bd_ft                (board feet, sq ft, each)
  supplier_primary:  Emerson Hardwood     (primary source)
  supplier_backup:   Crosscut Hardwoods   (backup source)
  unit_cost:         $8.50/bd_ft          (current wholesale)
  cnc_program_ref:   CNC-001-A01.nc      (NC program file)
  finish_spec:       SW-Autumn Wheat      (Sherwin-Williams stain)
                     + Resisthane topcoat  (CARB-compliant)
  awi_grade:         Custom               (inspection standard)
```

### BOM Version Control

Every BOM has a version number. Version 1.0 is the initial approved BOM. Any change -- material substitution, dimension adjustment, finish change -- creates a new version (1.1, 1.2, etc.). Production runs only against the current approved version.

| Version | Change | Approval | Date |
|---------|--------|----------|------|
| 1.0 | Initial BOM | Engineering lead | 2026-04-01 |
| 1.1 | Cherry substituted for maple (client request) | Engineering lead + client | 2026-04-05 |
| 1.2 | Finish changed to SW-Ebony (client revision) | Engineering lead + finish room lead | 2026-04-08 |

The current production version is always clearly marked. Shop floor workers reference the current version only. Previous versions are archived for traceability.

---

## 4. CNC Programming Workflow

The CNC router is the primary production tool for architectural millwork. It converts BOM line items into physical parts through computer-controlled cutting, routing, profiling, and carving.

### Programming Sequence

1. **CAD import.** Import engineering drawings into CAD/CAM software. Each BOM line item that requires machining gets a corresponding CAD model.
2. **Toolpath generation.** Define cutting paths: profile cuts, pocket cuts, drilling, carving. Assign appropriate tools (straight bit, compression bit, ball-nose, V-bit).
3. **Feed and speed calculation.** Calculate feed rate and spindle speed for the material and tool combination. Cherry requires different parameters than MDF.
4. **Nesting optimization.** For sheet goods (plywood, MDF), optimize part layout on standard sheets (4x8 or 5x10) to minimize waste. Target: <15% waste on sheet goods.
5. **Dry run verification.** Run the CNC program on a test piece (scrap material of the same type) to verify dimensions and fit before the production run.
6. **Production release.** After dry run approval, the program is released for production. Program files are stored in version-controlled repository (same versioning as BOM).

### Software Recommendations

| Software | Use Case | Cost Range |
|----------|----------|------------|
| Vectric VCarve Pro / Aspire | 2D/3D CNC programming, panel nesting | $700 - $2,000 |
| Mastercam Wood | Full CAM suite for complex millwork | $5,000 - $15,000 |
| Cabinet Vision | Casework-specific design and CNC output | $5,000 - $10,000 |
| Alphacam | General woodworking CAM | $3,000 - $8,000 |
| Fusion 360 (Autodesk) | General CAD/CAM with CNC post-processors | $500/year |

For Node North's founding operations, Vectric Aspire or Cabinet Vision provides the best value for commercial casework. Mastercam Wood is the upgrade path for complex architectural millwork.

### CNC Program Library

Over time, the co-op builds a library of proven CNC programs -- the intellectual property of the network. These programs represent tested, inspected, production-ready toolpaths for common fixture components. The library is:

- Version-controlled (Git or equivalent)
- Accessible to all network nodes (via federation's shared engineering assets)
- Protected (not transferable outside the federation)
- Continuously improved (kaizen cycle applies to programs as well as physical processes)

---

## 5. Material Procurement and JIT Scheduling

Material procurement is BOM-driven. Purchase orders are generated directly from approved BOMs, not from estimates or historical averages.

### Procurement Workflow

1. **BOM approval triggers PO generation.** Each BOM line item with a material requirement generates a purchase order line for the primary supplier.
2. **Lead time check.** Verify lead time against production schedule. Standard hardwood lumber: 3-5 business days from Emerson Hardwood. Specialty species: 7-14 days. Sheet goods from OrePac: 1-3 days.
3. **FSC verification.** For FSC-required materials, confirm that the supplier can provide FSC-certified stock and CoC documentation.
4. **Order placement.** Purchase order sent to supplier with delivery date aligned to production start minus receiving/inspection buffer (typically 2 business days).
5. **Receiving inspection.** Material received, inspected for grade, species, and dimension. FSC documentation verified. Stored in staging area tagged by project and BOM version.

### Just-In-Time Principles

- **No speculative ordering.** Material is not ordered without a confirmed client SOW and approved BOM.
- **Minimum inventory buffer.** Maintain 2-week buffer of common sheet goods (MDF, birch plywood). All specialty materials are ordered per-project.
- **Delivery scheduling.** Schedule material delivery for production start date minus 2 days. Material sitting in the shop costs floor space and ties up capital.

### Waste Management

| Material Type | Target Waste % | Mitigation |
|---------------|---------------|-----------|
| Sheet goods (4x8) | <15% | CNC nesting optimization |
| Hardwood lumber | <20% | Proper rough milling, defect grading |
| Hardware | <1% | Count verification at receiving |
| Finish materials | <5% | Batch spraying, proper gun setup |

> **Related:** [Supply Chain Network](04-supply-chain-network.md) for full supplier map and account opening procedures

---

## 6. Production Floor Operations

The production floor follows the lean manufacturing principle of pull scheduling: work flows through the shop in a defined sequence, and each station pulls work from the previous station only when it has capacity.

### Production Sequence

| Stage | Operations | Equipment | Time/Unit (typical) |
|-------|-----------|-----------|-------------------|
| 1. Rough milling | Crosscut, rip, surface | Table saw, jointer, planer | 15-30 min |
| 2. CNC machining | Profile, pocket, drill, carve | CNC router | 20-60 min |
| 3. Edge treatment | Edge band, profile, sand | Edge bander, router table | 10-20 min |
| 4. Sanding | Surface prep for finish | Wide-belt sander, hand sand | 10-20 min |
| 5. Finishing | Stain, topcoat, dry | Spray booth, dry racks | 2-8 hours (batch) |
| 6. Assembly | Join components, install hardware | Assembly bench, pneumatic tools | 30-90 min |
| 7. Inspection | AWI grade check, punch list | Inspection station, calibrated tools | 15-30 min |
| 8. Packaging | Wrap, crate, label | Packing station | 10-20 min |

### Visual Management

Every production floor needs a status board visible to all workers. The board tracks:

- Active projects by client and BOM version
- Units in each production stage
- Units completed and inspected
- Units packaged and ready to ship
- Blocking issues (material shortage, equipment down, rework required)

This is a physical board, not a software dashboard. The physical artifact forces accountability and makes the production state legible to every person on the shop floor.

---

## 7. The Finish Room: Quality Differentiator

The finish room is where identical-unit rollouts succeed or fail. When a client orders 200 units that must be indistinguishable in color, sheen, and feel, the finish room is the quality gate that makes that possible.

### The Color Match Problem

Wood is a natural material. No two pieces of cherry, maple, or walnut are exactly the same color. Staining amplifies these differences. The finish room's job is to manage these differences so that the final product appears uniform to the client.

**Mitigation strategies:**

1. **Species selection.** Select material from the same supplier lot for each project. Color consistency within a lot is much tighter than across lots.
2. **Stain testing.** Test the stain on scrap from the actual production lot before running the full batch. Adjust stain formula if needed.
3. **Batch spraying.** Spray all units for a project in a single batch, in the same environmental conditions (temperature, humidity). Environmental variation changes stain absorption.
4. **Consistent technique.** Same spray gun setup, same distance, same passes, same overlap for every unit. This is a skill that takes years to develop at production speed.
5. **Color standard.** Keep a reference panel (sprayed from the approved sample) at the spray booth. Compare every unit against the reference under controlled lighting.

### Finish Room Protocol

```
FINISH ROOM PRODUCTION SEQUENCE
================================================================

  1. Surface preparation (sanding to 180-220 grit)
  2. Dust removal (compressed air + tack cloth)
  3. Stain application (spray or wipe, per spec)
  4. Flash-off (stain absorption and dry, 15-30 min)
  5. Sanding sealer (spray, light coat)
  6. Dry (2-4 hours depending on product and conditions)
  7. Scuff sand (320 grit, by hand)
  8. Topcoat 1 (spray, even coat)
  9. Dry (2-4 hours)
  10. Scuff sand (400 grit, light)
  11. Topcoat 2 (spray, final coat)
  12. Cure (24-48 hours before handling)
  13. Quality inspection (color, sheen, adhesion, defects)
```

> **SAFETY WARNING:** Finish room operations involve volatile organic compounds (VOCs), flammable materials, and atomized particles. OSHA 29 CFR 1910.94 requires downdraft or side-draft ventilation in spray rooms. All electrical equipment must be explosion-proof (NFPA 33). Personal protective equipment: NIOSH-approved organic vapor respirator, chemical-resistant gloves, coveralls. No exceptions.

### CARB Compliance

California Air Resources Board (CARB) regulations on VOC content in wood coatings are the de facto national standard for commercial millwork. Sherwin-Williams product lines that meet CARB ATCM requirements:

| Product | Application | CARB Compliant |
|---------|------------|---------------|
| Sherwin-Williams Catalyst | Conversion varnish topcoat | Yes |
| Sherwin-Williams Resisthane | Polyurethane topcoat | Yes |
| Sherwin-Williams BAC Wiping Stain | Wood stain | Yes |
| Sherwin-Williams Sher-Wood Sanding Sealer | Sealer | Yes |

---

## 8. AWI Quality Standards Compliance

The Architectural Woodwork Institute (AWI) Quality Standards Illustrated is the quality bible for commercial millwork. All inspection is against AWI grade criteria [1].

### Grade Comparison

| Criterion | Economy | Custom | Premium |
|-----------|---------|--------|---------|
| Joint tightness | Visible gaps acceptable | Tight joints, minor gaps ok | Hairline joints only |
| Color match | Not required | Reasonable match | Close match required |
| Surface defects | Minor defects acceptable | Minimal defects | No visible defects |
| Hardware alignment | Functional | Aligned, consistent | Precisely aligned |
| Finish quality | Functional coverage | Even, consistent | Flawless, uniform |
| Dimensional tolerance | +/- 1/8" | +/- 1/32" to 1/16" | +/- 1/64" to 1/32" |

### Inspection Protocol

Every unit is inspected before packaging. The inspection uses a standardized checklist:

1. **Dimensional check.** Verify critical dimensions against BOM specification. Use calibrated tape measure and/or digital caliper.
2. **Joint inspection.** Check all visible joints for gaps, misalignment, and glue squeeze-out.
3. **Surface inspection.** Check all visible surfaces for defects: scratches, dents, grain tear-out, stain bleed, finish runs.
4. **Hardware check.** Verify all hardware installed, aligned, and functional (doors open/close, drawers slide, locks engage).
5. **Finish check.** Compare against reference panel for color match. Check for sheen consistency, orange peel, fish-eyes, or other finish defects.
6. **Grade determination.** PASS at specified AWI grade, or FAIL with specific defect list for rework.

Units that fail inspection are reworked, not shipped. The rework is documented: what failed, what was done to correct it, and the re-inspection result. This documentation feeds the continuous improvement cycle.

---

## 9. Multi-Node Production Coordination

When a contract requires more units than a single node can produce within the delivery timeline, production is distributed across multiple network nodes. This is the federation's core value proposition -- it enables small shops to compete for large contracts.

### Split Protocol

1. **Capacity assessment.** Federation engineering determines total capacity across available nodes for the delivery window.
2. **Geographic allocation.** Units are assigned to the node closest to the delivery site(s) when possible, reducing shipping cost and transit damage risk.
3. **BOM distribution.** All nodes receive the identical BOM (same version, same specifications). There is no "node-specific" BOM.
4. **CNC program distribution.** All nodes receive the same CNC programs from the federation's program library.
5. **Material coordination.** Each node orders materials from the BOM's specified suppliers. FSC CoC documentation flows through the federation's certificate.
6. **Finish standard synchronization.** All nodes receive the same finish reference panel and finish specification. Cross-node finish consistency is verified by shipping sample units between nodes before the full production run.
7. **Inspection to single standard.** All nodes inspect to the same AWI grade checklist. The federation's quality team may conduct spot audits.

### The 200-Unit Scenario

A 200-unit Starbucks espresso bar fixture order split between Node North (120 units) and Node South (80 units):

| Step | Node North | Node South | Federation |
|------|-----------|-----------|-----------|
| BOM distribution | Receives BOM v1.2 | Receives BOM v1.2 | Distributes |
| Material ordering | 120 units of material from Emerson (Seattle) | 80 units of material from Emerson (Portland) | Verifies FSC CoC |
| CNC production | Runs CNC programs, 120 units | Runs CNC programs, 80 units | Program library |
| Finish calibration | Sprays 3 test units, sends to Federation | Sprays 3 test units, sends to Federation | Compares, approves |
| Full production | Sprays and assembles 120 | Sprays and assembles 80 | Spot audit |
| Inspection | AWI Custom inspection, 120 | AWI Custom inspection, 80 | Receives reports |
| Shipping | Ships to client locations | Ships to client locations | Coordinates schedule |

---

## 10. Lean Manufacturing in the Millwork Shop

Lean manufacturing is not a buzzword for the co-op -- it is the operational framework that makes a small shop competitive against larger, less disciplined operations. The specific lean principles applied to millwork [2]:

### 5S (Sort, Set, Shine, Standardize, Sustain)

In a woodworking shop, 5S is not just organizational hygiene -- it is safety. Sawdust accumulation is a fire hazard and a respiratory hazard (OSHA wood dust PEL: 5 mg/m3 for hardwood). A clean, organized shop is a safe shop.

| S | Japanese | English | Millwork Application |
|---|---------|---------|---------------------|
| 1 | Seiri | Sort | Remove unused tools, material scraps, obsolete jigs |
| 2 | Seiton | Set in order | Tool shadow boards, material staging by project, labeled bins |
| 3 | Seiso | Shine | Daily dust collection, weekly deep clean, finish room daily wipe |
| 4 | Seiketsu | Standardize | Written procedures for each workstation, posted at station |
| 5 | Shitsuke | Sustain | Weekly 5S audit (rotating responsibility among worker-owners) |

### Pull Scheduling

- No material is ordered without an approved BOM
- No unit goes to CNC without confirmed material in receiving
- No unit goes to finish room without completed CNC work and sanding
- No unit goes to assembly without completed finish and cured
- No unit goes to packaging without passed AWI inspection

### Kaizen Events

Quarterly improvement reviews involving all worker-owners. As co-op members, every worker has both the right and the responsibility to identify improvement opportunities. Agenda:

1. Review production metrics (units/week, rework rate, waste percentage)
2. Identify bottlenecks (where does work queue up?)
3. Propose improvements (tooling, process, scheduling)
4. Assign improvement actions (who, what, by when)
5. Review previous quarter's improvement actions (did they work?)

> **Related:** [Cooperative Economics](01-cooperative-economics.md) for governance integration with kaizen; [Workforce Development](05-workforce-development.md) for how apprentices participate in improvement cycles

---

## 11. Equipment Specifications

### Primary Equipment for Node North

| Equipment | Specification | Est. Cost | Lead Time |
|-----------|--------------|-----------|-----------|
| CNC Router | 5x10 table, 3-axis, ATC (8+ tool), vacuum hold-down | $150,000 - $250,000 | 12-16 weeks |
| Wide-Belt Sander | 43" or 52" capacity, 2-head (cross-belt + platen) | $30,000 - $60,000 | 4-8 weeks |
| Edge Bander | Hot-melt PUR, pre-mill, corner rounding | $20,000 - $40,000 | 4-8 weeks |
| Spray Booth | Downdraft, 14x10x8 minimum, OSHA 29 CFR 1910.94 compliant | $25,000 - $50,000 | 6-10 weeks |
| Ventilation System | Spray booth exhaust, dust collection (cyclone + cartridge) | $15,000 - $30,000 | 4-8 weeks |
| Air Compressor | Rotary screw, 15-25 HP, 80-gallon tank minimum | $5,000 - $15,000 | 2-4 weeks |
| Table Saw | 12" cabinet saw, sliding table attachment | $3,000 - $8,000 | 2-4 weeks |
| Jointer/Planer | 12-16" jointer, 20" planer (or combo) | $5,000 - $15,000 | 2-4 weeks |
| Assembly Tools | Pneumatic nailers, clamps, benches, hand tools | $5,000 - $10,000 | Immediate |

### CNC Router Selection Criteria

The CNC router is the single largest capital expenditure and the most critical production tool. Selection criteria:

- **Table size:** 5x10 preferred (handles full sheet goods plus oversized panels). 4x8 minimum.
- **Axis count:** 3-axis minimum for flat panel work. 4-axis adds rotary capability for columns and turnings. 5-axis for complex 3D millwork (future upgrade path).
- **Automatic Tool Changer (ATC):** 8-tool minimum. Allows multi-operation programs without manual tool changes.
- **Vacuum hold-down:** Zoned vacuum table for holding sheet goods and solid wood. Gasket system for irregular shapes.
- **Dust collection:** Integrated dust boot with 4" or 6" collection port connecting to shop-wide dust collection system.
- **Software compatibility:** Must accept standard G-code and be compatible with chosen CAD/CAM software.

---

## 12. Cross-References

> **Related:** [Cooperative Economics](01-cooperative-economics.md) -- how democratic governance interacts with production decisions. [PNW Timber Heritage](02-timber-heritage.md) -- the Synsor methodology being reconstructed. [Supply Chain Network](04-supply-chain-network.md) -- where the BOM's materials come from. [Client Pipeline](06-client-pipeline.md) -- the SOW intake that triggers the BOM. [Workforce Development](05-workforce-development.md) -- how apprentices learn the production methodology. [The Joinery Report](07-the-joinery-report.md) -- verification that the production model integrates with all other components.

**Cross-project connections:**

| Project | Connection |
|---------|-----------|
| **NND** (PNW Network Node Design) | Multi-node production coordination, distributed manufacturing |
| **BHM** (PNW Built Heritage & Manufacturing) | Manufacturing engineering principles, craft skill transmission |
| **BCM** (PNW Building & Construction) | Millwork installation in construction projects |
| **PPM** (PNW Project Management) | Production scheduling, multi-stakeholder coordination |

---

## 13. Sources

1. Architectural Woodwork Institute. "AWI Quality Standards Illustrated." Current edition. awinet.org
2. Liker, Jeffrey K. *The Toyota Way: 14 Management Principles from the World's Greatest Manufacturer.* McGraw-Hill, 2004. Lean manufacturing principles.
3. Synsor Corporation employee review (Indeed.com, 16-year employee). Production methodology description.
4. OSHA 29 CFR 1910.94 -- Ventilation. osha.gov/laws-regs/regulations/standardnumber/1910/1910.94
5. OSHA 29 CFR 1910.212 -- General Requirements for All Machines (machine guarding). osha.gov/laws-regs/regulations/standardnumber/1910/1910.212
6. OSHA 29 CFR 1910.1000 -- Air Contaminants (wood dust PEL). osha.gov/laws-regs/regulations/standardnumber/1910/1910.1000
7. National Fire Protection Association. NFPA 33: Standard for Spray Application Using Flammable or Combustible Materials. nfpa.org
8. Sherwin-Williams Industrial Wood Finishes. "Catalyst and Resisthane Product Lines." sherwin-williams.com/industrial
9. California Air Resources Board. "Airborne Toxic Control Measure for Wood Products Coatings." ww2.arb.ca.gov
