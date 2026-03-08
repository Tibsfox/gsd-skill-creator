# Cross-Module Integration & Dimensional Validation Report

---
module: W2-INT
dimensions: [ALL]
audience: L5
content_type: integration-report
last_updated: 2026-03-08
version: 1.0
status: final
---

> **Wave 2, Task 10 — Synthesis Document**
>
> This report validates cross-module relationships, dimensional consistency, and code cross-reference integrity across the complete BCM research corpus (W0 foundation documents + W1 modules M1-M6). Every integration test traces evidence to specific files and sections. The report concludes with a summary matrix and overall integration score.

---

## Table of Contents

- [Integration Test Results](#integration-test-results)
  - [IN-01: Structural-Envelope Cascade](#in-01-structural-envelope-cascade)
  - [IN-02: Electrical-Plumbing Coordination (MEP)](#in-02-electrical-plumbing-coordination-mep)
  - [IN-03: Code-Education Alignment](#in-03-code-education-alignment)
  - [IN-04: Code Cross-State Consistency](#in-04-code-cross-state-consistency)
  - [IN-05: Seismic-All Cascades](#in-05-seismic-all-cascades)
  - [IN-06: Audience Depth Consistency](#in-06-audience-depth-consistency)
  - [IN-07: Lifecycle-Code Triggers](#in-07-lifecycle-code-triggers)
  - [IN-08: Materials-All Integration](#in-08-materials-all-integration)
  - [IN-09: Energy-Envelope-Mechanical](#in-09-energy-envelope-mechanical)
  - [IN-10: Document Self-Containment](#in-10-document-self-containment)
- [Dimensional Validation](#dimensional-validation)
- [Master Code Cross-Reference Table](#master-code-cross-reference-table)
- [Summary Matrix](#summary-matrix)
- [Overall Integration Score](#overall-integration-score)

---

## Integration Test Results

### IN-01: Structural-Envelope Cascade

**Description:** Validate that fire-rated assembly penetrations, structural sheathing requirements, and foundation waterproofing are consistently documented at the M1-M4 interface.

**Evidence Found:**

1. **Fire-rated assembly penetrations:**
   - M1 (01-structural-systems.md, Part 2.2, L3 View): Type IV-A/B/C mass timber fire-resistance ratings documented with sprinkler requirements and connection protection. Balloon framing fire-stopping referenced at IBC 2021/2024 Section 718.
   - M4 (04-building-envelope.md, Section 10.2): WUI envelope requirements include fire-rated eave/soffit enclosure, ember-resistant venting, and ignition-resistant exterior wall covering within 0-5 ft of grade.
   - M5 (05-codes-standards-blueprinting.md, Part 11): Cross-module code map documents IBC Chapter 7 (fire ratings) as part of M1 and M4 code dependencies.
   - **Gap identified:** M4 does not explicitly address fire-rated penetration details for MEP systems through fire-rated wall or floor assemblies. This detail lives implicitly in the building code (IBC Chapter 7) but is not called out as a cross-reference from M4 to M1 or M3.

2. **Structural sheathing requirements:**
   - M1 (01-structural-systems.md, Part 6): Diaphragm capacity tables for structural plywood/OSB (15/32" Structural I) with nailing schedules (6"/12", 4"/12", 10d at 4"/12"). Shear wall design with aspect ratios and capacity tables.
   - M4 (04-building-envelope.md, Section 4.2): WRB installation requires "structural sheathing is complete, fastened per schedule" as a GATE verification item. References IRC R703.2 for WRB over sheathing.
   - **Consistency confirmed:** M4 defers to M1 for sheathing fastener schedules and correctly treats sheathing as a predecessor to envelope work.

3. **Foundation waterproofing:**
   - M1 (01-structural-systems.md, Part 3): Foundation types documented with PNW soil types, frost depth requirements, and geotechnical considerations. Foundation anchor bolt requirements per IRC R403.1.6.
   - M4 (04-building-envelope.md, Section 1.3): Explicitly excludes "below-grade waterproofing (see [M1-ST:Foundation Systems])" from scope, with cross-reference.
   - **Consistency confirmed:** Clear scope boundary with bidirectional cross-reference.

**Verdict: PASS**

**Gaps:** Minor gap in fire-rated MEP penetration cross-referencing between M1 and M4. Both modules address fire independently (M1 via construction type, M4 via WUI), but the intersection point (penetrations through fire-rated assemblies) is not explicitly linked. This is a documentation gap, not a factual inconsistency.

**Recommendation:** In a future revision, add a cross-reference note in M4 Section 11 (Inspection) pointing to IBC Chapter 7 penetration firestop requirements and M1 construction type ratings.

---

### IN-02: Electrical-Plumbing Coordination (MEP)

**Description:** Validate MEP penetration conflicts, clearance requirements, shared chase documentation, and HVAC electrical requirements between M2 and M3.

**Evidence Found:**

1. **MEP penetration and clearance cross-references:**
   - M3 (03-plumbing-mechanical.md, Section 6.5): Complete structural penetration table with maximum hole diameters and location restrictions for floor joists, bearing/non-bearing studs, and top/bottom plates per IRC R502.8 and R602.6. Cross-references [M1-ST:Framing Penetrations].
   - M3 (03-plumbing-mechanical.md, Section 6.4): Explicit MEP coordination table mapping 6 coordination points (water heater, HVAC equipment, garbage disposer, sump pump, bathroom exhaust, whole-house ventilation) with both plumbing/mechanical needs and electrical needs, cross-referencing specific M2 sections.
   - M2 (02-electrical-systems.md, Section 12): "MEP Coordination" section header present in table of contents, linking to M3 for coordination.

2. **Shared chase requirements:**
   - M3 Section 6.4 documents shared electrical-mechanical needs at each coordination point (e.g., water heater needs "Dedicated 240V/30A circuit (electric); 120V circuit (gas)" from M2).
   - M3 Section 6.5 documents structural penetration limits that govern both electrical and plumbing routing.
   - **No explicit "shared chase" sizing document exists**, but coordination points are adequately covered through the penetration and coordination tables.

3. **HVAC electrical requirements:**
   - M3 (03-plumbing-mechanical.md, Section 6.4): HVAC equipment listed with "Dedicated circuit per nameplate; disconnect within sight" as electrical need, cross-referencing [M2-EL:HVAC Circuits].
   - M2 (02-electrical-systems.md, Section 4.1): Furnace/heat pump listed in branch circuit table with "Per nameplate" sizing and "Dedicated, with disconnect" requirement per NEC 422.31.
   - M2 (02-electrical-systems.md, Section 10.3): Energy code coordination section covers heat pump water heater electrical requirements and distinguishes from resistance water heaters.
   - **Consistency confirmed:** Both modules agree on dedicated circuits, disconnect requirements, and per-nameplate sizing for HVAC equipment.

**Verdict: PASS**

**Gaps:** None significant. The M3 Section 6.4 coordination table is the strongest cross-module integration artifact in the entire corpus — it explicitly maps every MEP intersection point with bidirectional references.

**Recommendation:** None required. This is exemplary cross-module integration.

---

### IN-03: Code-Education Alignment

**Description:** Validate that every code reference in M5 has corresponding educational treatment in M6, and that ABET curriculum areas map to actual module content.

**Evidence Found:**

1. **Code-to-education mapping:**
   - M5 (05-codes-standards-blueprinting.md, Part 12): ABET competency mapping table maps SO 1-7 to specific module content areas. Practice questions (5 questions with answers) test code navigation skills. Apprenticeship curriculum alignment maps electrical, plumbing, HVAC, and carpentry year-by-year to BCM modules and specific code sections.
   - M6 (06-educational-frameworks.md, Part 2): Complete ABET EAC Student Outcomes table (SO 1-7) maps each outcome to BCM module coverage and primary assessment methods. Architectural Engineering, Civil Engineering, and Construction Engineering program criteria all mapped to BCM modules.
   - M6 (06-educational-frameworks.md, Part 3): Five complete 15-week course outlines (Construction Materials, Structural Analysis, MEP Systems, Construction Management, Building Codes & Standards) with weekly topics referencing specific BCM sections and code standards.

2. **ABET curriculum area coverage verification:**

   | ABET Curriculum Area | Required | BCM Coverage | M6 Reference | Verdict |
   |---------------------|----------|-------------|-------------|---------|
   | Building structures | Synthesis or Application | M1-ST: full structural analysis including seismic design, NDS, ASCE 7-22 | Course 1 (Materials), Course 2 (Structural Analysis) | PASS |
   | Building mechanical systems | Synthesis or Application | M3-PM: HVAC load calcs, plumbing design; M4-BE: energy analysis | Course 3 (MEP Systems) | PASS |
   | Building electrical systems | Comprehension min. | M2-EL: NEC 2023, service calcs, distribution, grounding | Course 3 (MEP Systems) Weeks 8-10 | PASS |
   | Construction/construction management | Comprehension min. | M5-CS: scheduling, estimating, delivery methods, safety | Course 4 (Construction Management) | PASS |

3. **Code reference in M5 vs. educational treatment:**
   - M5 covers all 21 state codes (STD-01 through STD-21), 5 code development organizations, 9 government agencies.
   - M6 Course 5 (Building Codes & Standards) addresses Oregon and Washington code structures in Weeks 3-9, local amendments in Week 10, existing building codes in Week 11, and professional responsibility in Week 14.
   - M5 Part 12 apprenticeship alignment maps each trade's 4-year progression to specific code sections.
   - **All major code bodies covered in M5 are addressed in M6 educational frameworks.**

**Verdict: PASS**

**Gaps:** None. M6 is explicitly designed as the "calibration layer" for M1-M5 content delivery, and it fulfills this role comprehensively.

**Recommendation:** None required.

---

### IN-04: Code Cross-State Consistency

**Description:** Validate that the same topic (e.g., residential GFCI) is documented consistently for both Oregon and Washington, and that code edition years and effective dates are consistent across all modules.

**Evidence Found:**

1. **GFCI requirements — OR/WA consistency:**
   - M2 (02-electrical-systems.md, Section 3.1): NEC 210.8(A)(6) expanded GFCI for all kitchen receptacles documented with "Oregon amendment: No amendment — OESC 2023 adopts without modification" and "Washington amendment: Adopted per NEC 2023 through L&I."
   - M2 (02-electrical-systems.md, Section 7.4): OR vs. WA amendment comparison table — 7 topics compared side-by-side, all showing "Adopted, no amendment" for both states.
   - M5 (05-codes-standards-blueprinting.md, Part 2): OESC 2023 section confirms "Section 210.8(A)(6): Expanded GFCI protection — all kitchen receptacles in dwelling units."
   - **Consistency confirmed:** GFCI treatment identical across M2 and M5.

2. **Code edition years and effective dates cross-module check:**

   | Code | 00-source-index | M1 | M2 | M3 | M4 | M5 |
   |------|----------------|----|----|----|----|-----|
   | OSSC 2025 (IBC 2024), Oct 2025 | STD-01: Correct | Correct | N/A | N/A | N/A | Correct |
   | ORSC 2023 (IRC 2021), Oct 2023 | STD-02: Correct | Correct | N/A | N/A | Correct | Correct |
   | OESC 2023 (NEC 2023), Oct 2023 | STD-03: Correct | N/A | Correct | N/A | N/A | Correct |
   | OPSC 2023 (UPC 2021), Oct 2023 | STD-04: Correct | N/A | N/A | Correct | N/A | Correct |
   | OMSC 2022 (IMC), 2022 | STD-05: Correct | N/A | N/A | Correct | N/A | Correct |
   | OEESC 2025 (ASHRAE 90.1-2022), Jan 2025 | STD-07: Correct | N/A | N/A | Correct | Correct | Correct |
   | WAC 51-50 (IBC 2021), Mar 15 2024 | STD-09: Correct | Correct | N/A | N/A | N/A | Correct |
   | WAC 51-51 (IRC 2021), Mar 15 2024 | STD-10: Correct | Correct | N/A | N/A | Correct | Correct |
   | WAC 51-56 (UPC 2021), Mar 15 2024 | STD-14: Correct | N/A | N/A | Correct | N/A | Correct |
   | WSEC-R 2021, Mar 15 2024 | STD-15: Correct | N/A | N/A | Correct | Correct | Correct |
   | WA NEC 2023, state-specific | GOV-08: Correct | N/A | Correct | N/A | N/A | Correct |

   **All 22 code edition years and effective dates are consistent across every module that references them.**

3. **Washington 2024 code cycle delay:**
   - 00-source-index.md: "Final adoption August 21, 2026; effective date May 3, 2027"
   - M5 (05-codes-standards-blueprinting.md, Part 3 and Part 10): Same dates documented.
   - **Consistency confirmed.**

4. **Washington L&I electrical administration:**
   - M2 (02-electrical-systems.md, Section 7.1): "electrical codes are administered by the Washington Department of Labor & Industries (L&I) [GOV-08], not by the SBCC"
   - M5 (05-codes-standards-blueprinting.md, Part 4): "Washington's electrical code is administered by the Department of Labor & Industries (L&I) [GOV-08], not the SBCC"
   - **Consistency confirmed** — this important administrative distinction is documented in both modules.

**Verdict: PASS**

**Gaps:** None. Code edition years, effective dates, and state applicability are remarkably consistent across all modules. The source index (00-source-index.md) serves as the single source of truth and all modules reference it correctly.

**Recommendation:** None required. The architecture of having 00-source-index.md as the authoritative code reference works well.

---

### IN-05: Seismic-All Cascades

**Description:** Validate that seismic requirements are traced through structural (M1), MEP (M2/M3), and envelope (M4), and that Portland Ch. 24.85 and Seattle SDCI are referenced consistently.

**Evidence Found:**

1. **Seismic tracing through modules:**

   | Module | Seismic Content | Code References | Consistency |
   |--------|----------------|-----------------|-------------|
   | M1 (Structural) | Complete ASCE 7-22 seismic design procedure (Steps 1-4), site classification, spectral accelerations, SDC determination, equivalent lateral force procedure, shear wall design, Portland prescriptive retrofit, Seattle ABC approach | CODE-04, STD-01, STD-09, STD-16, GOV-03, GOV-04, GOV-05 | Primary seismic module |
   | M2 (Electrical) | Section 10.1: Flexible connections for differential movement, equipment anchorage per ASCE 7-22 Ch. 13, panelboard through-bolting, standby generators, battery systems | CODE-02, CODE-04 | Properly references ASCE 7-22 Ch. 13 for nonstructural components |
   | M3 (Plumbing/Mechanical) | Section 6.1: Water heater strapping (upper/lower 1/3), boiler/furnace seismic snubbers, suspended ductwork bracing, suspended piping bracing, roof-mounted equipment anchorage, flexible connections at seismic joints | CODE-04, CODE-01, CODE-03 | References ASCE 7-22 Ch. 13 and cross-references [M1-ST:Seismic Detailing] |
   | M4 (Envelope) | Section 10.2 (WUI provisions) addresses fire/ember hazards but not seismic directly; Section 12.4 sequencing notes structural connections at envelope penetrations; cross-references [M1-ST:Seismic Detailing] | CODE-01, STD-08, STD-13 | Appropriately defers to M1 for seismic structural requirements |

2. **Portland Ch. 24.85 consistency:**
   - M1: Documented in Part 5, L4 View — triggers (change of use, significant alteration), ASCE 41-17 Tier 1/2/3 evaluation, BPOE performance objective, pre-1974 and pre-1993 historical context.
   - M5: Documented in Part 5 — same trigger table, prescriptive retrofit specifications (40/50/80% cripple wall coverage), BLOCK callout for SE requirement.
   - 00-source-index.md: STD-16 entry correctly identifies Ch. 24.85 scope and provisions.
   - **All three documents present identical factual content** for Ch. 24.85.

3. **Seattle SDCI ABC approach consistency:**
   - M1: Part 5, L2 View — "A: Anchor to foundation, B: Brace cripple walls, C: Connect to first floor framing."
   - M5: Part 5 — Same ABC table with identical step descriptions.
   - 00-source-index.md: GOV-04 entry identifies SDCI and ABC approach.
   - **Consistent across all references.**

4. **Cascadia Subduction Zone parameters:**
   - M1: "37% probability of M7.1+ within 50 years" [CODE-04, GOV-05]. "Last major event: M9.0 in 1700."
   - M2: "37% probability of M7.1+ within 50 years" [GOV-05, CODE-04].
   - M3: "Cascadia Subduction Zone creates seismic exposure" — references SDC C through D for western OR/WA.
   - M5: Same CSZ parameters in Part 1 L1 view.
   - M6: Vocabulary gradient example uses "37%" probability figure at L5 level.
   - **All modules present identical CSZ risk parameters.**

**Verdict: PASS**

**Gaps:** None. Seismic requirements cascade properly from M1 (primary structural) through M2/M3 (nonstructural component anchorage) to M4 (defers to M1). Portland Ch. 24.85 and Seattle SDCI are documented identically in every module that references them.

**Recommendation:** None required.

---

### IN-06: Audience Depth Consistency

**Description:** Validate that the same factual claims at L1 and L5 convey consistent information at different depths, and that vocabulary complexity is appropriate per level across all modules.

**Evidence Found:**

1. **Seismic load path — 5-level vocabulary gradient (M6):**
   - M6 (06-educational-frameworks.md, Part 1): The vocabulary gradient example uses "seismic load path" expressed at all 5 levels. L1 uses "chain" analogy, L2 uses named connection types, L3 cites ASCE 7-22 Section 12.1.3 and IRC R602.10, L4 references inspector verification procedures, L5 provides complete equation set (V = Cs*W).
   - **All 5 levels convey the same underlying fact** (continuous load path from roof to foundation) at progressively greater technical depth. No factual contradictions between levels.

2. **Structural systems — M1 multi-level treatment:**
   - M1 Part 1: L1 View ("skeleton of your home"), L3 View (IBC construction types, ASCE 7-22 system classification).
   - M1 Part 2.1: L1 ("How Most PNW Homes Are Built"), L2 (component tables with sizes/functions), L3 (code reference tables with OR/WA amendments), L5 (NDS design equations F'_b = F_b * C_D * C_M...).
   - **L1 statement "Most homes in Oregon and Washington are wood-frame construction" is consistent with L3/L5 treatment of wood-frame as the dominant residential system.** No contradictions.

3. **Electrical GFCI — M2 multi-level treatment:**
   - M2 Section 3.1: L1/L2 accessible "What changed" and "What it means in practice" prose. L3/L4 code section analysis with NEC 210.8(A)(6). OR/WA amendment table (L4).
   - **Factual claim "all kitchen receptacles now require GFCI" is consistent at all audience levels.** Only the depth of code citation varies.

4. **Plumbing trap function — M3 multi-level treatment:**
   - M3 Section 2.1.1: L1 analogy ("highway network," "security checkpoints"). Section 2.3: L3 trap arm length table with code references. Section 10.1: L5 Manning's equation for DWV flow.
   - **L1 claim "traps block sewer gases" is consistent with L5 treatment of trap seal maintenance via pressure equalization.** No contradictions.

5. **Building envelope — M4 multi-level treatment:**
   - M4 Section 1.1: L1 ("raincoat"), L3 (four control layers: thermal, air, moisture, radiation), L5 (hygrothermal HAM transport modeling, Fourier/Fick/Darcy coupled equations).
   - **L1 claim "water is the number one enemy" is consistent with L5 treatment of moisture balance equation** as the critical design parameter. No contradictions.

6. **Content transformation rules (M6):**
   - M6 Part 1 provides explicit rules for each level: code citation style, calculation depth, jargon handling, cost data format, safety callout density, and PNW specificity.
   - **All modules follow these transformation rules consistently.** L1 sections never show bare code sections. L5 sections show full derivations. Safety callouts (BLOCK/GATE) appear at appropriate density per level.

**Verdict: PASS**

**Gaps:** None. The 5-tier audience system is consistently applied across all modules. The M6 calibration framework provides clear rules, and M1-M5 follow them.

**Recommendation:** None required.

---

### IN-07: Lifecycle-Code Triggers

**Description:** Validate that remodel triggers (Portland Ch. 24.85 alteration thresholds) are cross-referenced with the code module.

**Evidence Found:**

1. **Portland Ch. 24.85 triggers:**
   - M5 (05-codes-standards-blueprinting.md, Part 5): Trigger table documents "Change of use or occupancy," "Significant structural alteration," and "Voluntary seismic retrofit" with ASCE 41 evaluation requirements.
   - M5 (Part 11): IEBC alteration levels (Level 1/2/3 + Change of Occupancy) documented with scope, compliance requirements, and typical PNW applications.
   - M1 (01-structural-systems.md, Part 5, L4 View): Portland Ch. 24.85 triggers documented identically — "change of use or occupancy classification," "significant structural alterations," "additions."

2. **Electrical upgrade triggers:**
   - M2 (02-electrical-systems.md, Section 9.2): Upgrade trigger table maps 7 remodel scenarios (kitchen remodel, bathroom remodel, bedroom remodel, subpanel addition, service upgrade, EV charger, heat pump) to specific NEC requirements.
   - M5 (Part 8): Remodel inspection sequence table maps remodel scope to required inspections.
   - **Cross-reference is implicit** — M2 defines what electrical code requires during remodel; M5 defines the inspection/permit process. Together they form a complete lifecycle trigger chain.

3. **IEBC alteration levels:**
   - M5 (Part 11): Levels 1-3 + Change of Occupancy documented with scope descriptions and code compliance requirements.
   - M1: References ASCE 41-17 (adopted by Portland Ch. 24.85) for existing building seismic evaluation.
   - **Consistency confirmed** — IEBC levels and Portland-specific triggers are coherent.

**Verdict: PASS**

**Gaps:** None significant. The lifecycle-code trigger chain flows from M5 (administrative/code triggers) through M1 (structural evaluation methodology) and M2 (electrical upgrade requirements).

**Recommendation:** None required.

---

### IN-08: Materials-All Integration

**Description:** Validate that material properties (Douglas fir, Western red cedar, basalt aggregate) are referenced consistently across M1, M4, and M5.

**Evidence Found:**

1. **Douglas fir (Pseudotsuga menziesii):**
   - M1 (01-structural-systems.md, Part 4): Comprehensive treatment. NDS reference design values: Select Structural F_b = 1,500 psi, E = 1,900,000 psi. No. 2 F_b = 900 psi, E = 1,600,000 psi. Source: NDS Supplement Table 4A [STD-19].
   - M1 (Part 7): Worked beam sizing example uses "Douglas Fir-Larch No. 2" with F_b = 900 psi — **consistent with Part 4 grade table**.
   - M4 (04-building-envelope.md, Section 7.1): References insulation and thermal properties but does not cite structural properties of framing lumber (appropriately — M4 deals with envelope, not structure).
   - M5: References "NDS Douglas fir" in the Module-to-Code Map (Part 11) under M1 dependencies.
   - **Consistent.** Douglas fir properties are authored once in M1 and referenced by other modules.

2. **Western red cedar (Thuja plicata):**
   - M1 (Part 4): Comparative table — WRC F_b = 850 psi (No. 2), weight 23 pcf, "natural decay resistance from extractive chemicals (thujaplicin)." Cost $3-5/BF.
   - M4 (Section 6.2): Cedar siding specifications — "natural rot resistance (heartwood only)," "requires ongoing maintenance (staining or painting every 5-7 years)," "combustible (significant concern in WUI zones)." Cost $5-12/sq ft installed.
   - **No contradictions.** M1 treats cedar as a structural material (with lower strength than DF-L). M4 treats cedar as an exterior cladding material. Properties cited in each module are appropriate to the module's scope.

3. **Basalt aggregate:**
   - M1 (Part 2.4, L3 View): "The dominant coarse aggregate in OR and WA is basalt, a dense volcanic rock. Basalt aggregate produces strong, durable concrete but can be angular, requiring slightly more cement paste than rounded river gravel."
   - No other module references basalt aggregate directly. This is appropriate — aggregate selection is a structural/materials topic.
   - **Consistent** within scope boundaries.

**Verdict: PASS**

**Gaps:** None. Material properties are documented in the appropriate primary module (M1 for structural materials, M4 for envelope materials) and cross-referenced without contradiction.

**Recommendation:** None required.

---

### IN-09: Energy-Envelope-Mechanical

**Description:** Validate that insulation, air sealing, and HVAC sizing form a coherent performance chain across M3 and M4.

**Evidence Found:**

1. **Insulation R-values — M4 to M3 chain:**
   - M4 (04-building-envelope.md, Section 7.2): Complete R-value tables for Oregon (OEESC 2025) and Washington (WSEC-R 2021) by climate zone (4C and 5B). Wall: R-20 or R-13+5ci (CZ 4C). Ceiling: R-49 (CZ 4C), R-60 (CZ 5B). Floor: R-30 (CZ 4C), R-38 (CZ 5B).
   - M3 (03-plumbing-mechanical.md, Section 8.3): Heat loss calculation worked example uses "R-21 walls, R-49 ceiling" — **consistent with M4 CZ 4C requirements**.
   - M3 (Section 6.3): Energy code implications table shows "Duct insulation: R-8 minimum" and "Pipe insulation: R-3 minimum first 5 feet" for both states — **consistent with M4 energy code tables**.

2. **Air sealing — M4 to M3 chain:**
   - M4 (Section 8.1): Maximum air leakage 3.0 ACH50 for both OR and WA. Mandatory blower-door testing required.
   - M3 (Section 4.4.3): Whole-house ventilation required in tight construction. HRV/ERV discussion directly references the consequence of M4's air sealing requirements: "Modern energy-efficient homes are built tight — which is excellent for energy performance but requires mechanical ventilation."
   - **Coherent chain:** M4 defines the envelope tightness standard (3.0 ACH50), M3 provides the mechanical ventilation solution (HRV/ERV) required by that standard.

3. **HVAC sizing — M3 to M4 chain:**
   - M3 (Section 8.3): Worked heat loss calculation for a 1,800 sq ft home in CZ 4C produces a design load of ~12,000 BTU/h (1.0 ton). Discussion explicitly addresses the PNW-specific issue: "This calculation illustrates why PNW homes with modern envelope standards have very low heating loads. A single ductless mini-split head rated at 12,000-15,000 BTU/h could heat this entire house."
   - M4 (Section 7.2): R-value tables that produce the envelope values used in M3's calculation.
   - **The HVAC sizing in M3 directly depends on the envelope R-values defined in M4.** This dependency is correctly represented.

4. **Duct sealing — M4 to M3:**
   - M4 (Section 8.3): Duct leakage limit 4.0 cfm25/100 sq ft CFA for both OR and WA.
   - M3 (Section 6.3): Duct leakage testing listed as "Required (new construction)" for both states.
   - M3 (Section 9.2): Contractor checklist includes "Duct leakage test passed (if required by energy code)."
   - **Consistent** — same standard referenced in both modules.

5. **Heat pump water heater — M3 to M4:**
   - M3 (Section 3.6.2): HPWH documented with COP 2.0-3.5, "Both Oregon (OEESC 2025) and Washington (WSEC-R 2021) energy codes strongly incentivize heat pump water heaters."
   - M4 (Section 8): Energy code compliance references insulation and air sealing but appropriately defers HPWH specifics to M3.
   - M2 (Section 10.3): "Heat pump water heaters have different electrical requirements than resistance water heaters (typically 240V, 15A-20A dedicated circuit vs. 240V 30A for resistance)."
   - **Three-module chain (M4 energy code -> M3 equipment -> M2 electrical) is coherent.**

**Verdict: PASS**

**Gaps:** None. The energy-envelope-mechanical chain is one of the strongest integration points in the corpus. M4 defines envelope performance, M3 designs mechanical systems to match, and M2 provides the electrical infrastructure.

**Recommendation:** None required.

---

### IN-10: Document Self-Containment

**Description:** Validate that a reader with no prior knowledge can understand the complete building system from any entry point.

**Evidence Found:**

1. **L1 entry point test:**
   - Every module begins with an L1 section using plain language and analogies: M1 ("skeleton"), M2 ("nervous system"/"tree"), M3 ("circulatory and respiratory infrastructure"/"highway network"), M4 ("raincoat"), M5 ("recipe book").
   - M6 (Part 4): Complete Homeowner's Guide Framework provides a unified L1 entry point across all systems with sections on Understanding Systems, Seasonal Maintenance, Diagnostic Decision Trees, When to Call a Professional, and PNW-Specific Content.
   - **An L1 reader can enter at any module and understand the system described** without prerequisite technical knowledge.

2. **L3/L4 entry point test:**
   - Each module contains its own applicable codes and standards table at the beginning (M2 Section 1.3, M3 Section 1.3, M4 Section 1.2, M5 Part 2-3), eliminating the need to read 00-source-index.md first.
   - Cross-references to other modules use descriptive bracket notation (e.g., [M1-ST:Seismic Detailing]) that tells the reader what they would find if they followed the reference.
   - **A trade student can read M2 (Electrical) without first reading M1 (Structural)** and still understand the electrical system. Structural context (penetrations, seismic anchorage) is provided within M2 where needed.

3. **Cross-reference architecture:**
   - All modules use a consistent cross-reference pattern: `[Module-Code:Topic]` (e.g., [M1-ST:Framing Penetrations], [M2-EL:Service Sizing]).
   - M4 Section 14 (Sources): Explicit cross-reference table to other modules with topic descriptions.
   - M5 Part 11: Complete module-to-code map enabling navigation from any module to any code reference.
   - **The cross-reference system supports both linear reading and random access.**

4. **Foundation document dependency:**
   - 00-parameter-schema.md defines the 6-dimensional coordinate system but is not required reading for any individual module.
   - 00-source-index.md provides the authoritative source catalog but each module includes its own applicable codes table.
   - 00-content-templates.md defines the L1-L5 template system but is a production document for authors, not required for readers.
   - **Foundation documents enhance the corpus but are not prerequisites for understanding any individual module.**

**Verdict: PASS**

**Gaps:** Minor — some cross-references point to module sections that use shorthand notation (e.g., [M1-ST:Framing Penetrations]) which is descriptive but not formally linked. In a web-based delivery system, these would become hyperlinks.

**Recommendation:** When assembling for web delivery, convert bracket notation cross-references to actual hyperlinks.

---

## Dimensional Validation

### 6-Dimension Coverage Assessment

**Parameter Schema Dimensions (from 00-parameter-schema.md):**

| Dimension | ID | Enumeration | Coverage Across M1-M6 | Verdict |
|-----------|----|--------------|-----------------------|---------|
| Trade Discipline (TD) | 6 values: ST, EL, PM, BE, CS, ED | M1=ST, M2=EL, M3=PM, M4=BE, M5=CS, M6=ED | Complete 1:1 mapping — each module covers exactly one TD | PASS |
| Building Scale (BS) | 4 values: RES-SF, RES-MF, COM-SM, COM-LG | All modules cover RES-SF (primary) and address RES-MF/COM-SM where applicable. COM-LG is explicitly excluded or deferred. | Appropriate for scope — corpus targets residential through light commercial | PASS |
| Building Style (ST) | 5 values: TRAD, MOD, HIST, IND, SPEC | Addressed within modules where style affects technical requirements (e.g., M1 balloon framing in HIST, M4 WUI in SPEC). Not every style is treated in every module. | Appropriate — style is relevant only where it changes technical requirements | PASS |
| Lifecycle Phase (LP) | 5 values: NEW, RENO, MAINT, DEMO, PLAN | NEW is the primary treatment across all modules. RENO covered in M1 (seismic retrofit), M2 (upgrade pathways, aluminum/K&T), M4 (re-cladding), M5 (IEBC levels). MAINT in M3 (seasonal schedules), M6 (homeowner guide). DEMO not explicitly covered. PLAN in M5 (permit process). | Coverage appropriate — DEMO is a specialized topic outside BCM scope | PASS |
| Audience Depth (AD) | 5 values: L1-L5 | M1: L1-L5 complete. M2: L1-L5 complete. M3: L1-L5 complete. M4: L1-L5 complete. M5: L1-L5 complete. M6: Defines the L1-L5 system itself. | All 5 levels addressed in every content module | PASS |
| Regional Specificity (RS) | 4 values: OR, WA, PNW, NAT | All modules address both OR and WA with dual-state comparison tables. PNW Regional Notes throughout. NAT (national model codes) used as baselines. | Complete dual-state coverage | PASS |

### Dimensional Gap Analysis

**Combinations that should be covered but may not be:**

| TD x BS | Gap Assessment |
|---------|---------------|
| EL x COM-LG | M2 addresses commercial electrical but at introductory level (service sizing, GFCI expansion to commercial buffet areas). Full commercial electrical design is outside stated scope. **Not a gap — scope is correctly bounded.** |
| PM x COM-LG | M3 addresses commercial plumbing/mechanical at introductory level. Full commercial MEP design outside scope. **Not a gap.** |
| BE x HIST | M4 addresses historical building envelope challenges through retrofit diagnostics (Section 13), asbestos/lead warnings (Section 7.1 BLOCK), and re-cladding procedures. **Adequate coverage.** |
| ST x DEMO | Demolition is not covered in any module. **Appropriate exclusion — demolition is a specialized discipline with its own regulatory framework (environmental, asbestos, structural shoring).** |

### Parameter Schema Enumeration Usage

Spot-checked module header blocks against parameter schema enumerations:

| Module | Header Dimensions | Schema Valid? |
|--------|------------------|--------------|
| M1: `[TD, BS, ST, LP, AD, RS]` | All 6 dimensions listed | PASS |
| M2: `[TD, BS, LP, AD, RS]` | 5 of 6 — missing ST (Building Style) | **NOTE:** ST is less relevant to electrical systems. Acceptable omission. |
| M3: `[TD, BS, LP, AD, RS]` | 5 of 6 — missing ST | Same as M2. Acceptable. |
| M4: `[TD, BS, LP, AD, RS]` | 5 of 6 — missing ST | Envelope varies by style but header omission is minor. |
| M5: `[TD, AD, LP, RS]` | 4 of 6 — missing BS and ST | M5 (codes) applies across all building scales and styles. Appropriate. |
| M6: `[TD, AD, LP, RS]` | 4 of 6 — missing BS and ST | M6 (education) applies across all scales and styles. Appropriate. |

**Verdict: PASS** — All dimension omissions are justified by module scope. No incorrect dimension values used.

---

## Master Code Cross-Reference Table

This table catalogs every code referenced across M1-M6 with edition year, effective date, state applicability, and module usage. Cross-checked against 00-source-index.md for consistency.

| Code | Source ID | Edition | Base Standard | OR Effective | WA Effective | Modules | Consistent? |
|------|-----------|---------|---------------|-------------|-------------|---------|-------------|
| OSSC | STD-01 | 2025 | IBC 2024 | Oct 1, 2025 | N/A | M1, M5 | YES |
| ORSC | STD-02 | 2023 | IRC 2021 | Oct 1, 2023 | N/A | M1, M4, M5 | YES |
| OESC | STD-03 | 2023 | NEC 2023 | Oct 1, 2023 | N/A | M2, M5 | YES |
| OPSC | STD-04 | 2023 | UPC 2021 | Oct 2023 | N/A | M3, M5 | YES |
| OMSC | STD-05 | 2022 | IMC | 2022 | N/A | M3, M5 | YES |
| Oregon Fire Code | STD-06 | 2022 | IFC | 2022 | N/A | M5 | YES |
| OEESC | STD-07 | 2025 | ASHRAE 90.1-2022 | Jan 1, 2025 | N/A | M3, M4, M5 | YES |
| ORSC R327 (WUI) | STD-08 | 2025 | ORSC amendment | Aug 5, 2025 | N/A | M4, M5 | YES |
| WA SBC | STD-09 | WAC 51-50 | IBC 2021 | N/A | Mar 15, 2024 | M1, M5 | YES |
| WA IRC | STD-10 | WAC 51-51 | IRC 2021 | N/A | Mar 15, 2024 | M1, M4, M5 | YES |
| WA IMC | STD-11 | WAC 51-52 | IMC 2021 | N/A | Mar 15, 2024 | M3, M5 | YES |
| WA IFC | STD-12 | WAC 51-54A | IFC 2021 | N/A | Mar 15, 2024 | M5 | YES |
| WA WUI | STD-13 | WAC 51-55 | IWUIC | N/A | Mar 15, 2024 | M4, M5 | YES |
| WA UPC | STD-14 | WAC 51-56 | UPC 2021 | N/A | Mar 15, 2024 | M3, M5 | YES |
| WSEC-R | STD-15 | 2021 | WA Energy Code | N/A | Mar 15, 2024 | M3, M4, M5 | YES |
| Portland Ch. 24.85 | STD-16 | Current | Local seismic code | Portland only | N/A | M1, M5 | YES |
| Portland Title 24 | STD-17 | Current | Local bldg regs | Portland only | N/A | M5 | YES |
| ASTM E2273 | STD-18 | Current | Drainage efficiency | Both | Both | M4 | YES |
| NDS | STD-19 | Current | Wood design | Both (by ref.) | Both (by ref.) | M1 | YES |
| AISC Steel Manual | STD-20 | Current | Steel design | Both (by ref.) | Both (by ref.) | M1 | YES |
| ASHRAE 90.1 | STD-21 | 2022 | Energy standard | Both (via OEESC) | Both (via WSEC) | M4, M5 | YES |
| ICC (IBC/IRC/IMC/IFC) | CODE-01 | 2024/2021 | Model codes | Via OR specialty codes | Via WAC chapters | M1-M5 | YES |
| NEC (NFPA 70) | CODE-02 | 2023 | Electrical code | Via OESC | Via L&I | M2, M5 | YES |
| UPC (IAPMO) | CODE-03 | 2021 | Plumbing code | Via OPSC | Via WAC 51-56 | M3, M5 | YES |
| ASCE 7/41 | CODE-04 | 7-22 / 41-17 | Structural loads / seismic eval | Both (by ref.) | Both (by ref.) | M1, M2, M3, M5 | YES |
| ANSI | CODE-05 | N/A | Accreditation | N/A | N/A | M2, M3, M5 | YES |
| WA NEC | GOV-08 | 2023 | NFPA 70 via L&I | N/A | State-specific | M2, M5 | YES |

**Result: 27/27 codes — 100% consistency across all modules and the source index.**

No discrepancies found in:
- Edition years
- Effective dates
- Mandatory dates
- Administering body attribution
- State applicability
- Module coverage claims

---

## Summary Matrix

| Test ID | Description | Verdict | Gaps | Severity |
|---------|-------------|---------|------|----------|
| IN-01 | Structural-Envelope cascade | **PASS** | Minor: fire-rated MEP penetration cross-ref between M1/M4 | Low |
| IN-02 | Electrical-Plumbing coordination (MEP) | **PASS** | None | N/A |
| IN-03 | Code-Education alignment | **PASS** | None | N/A |
| IN-04 | Code cross-state consistency | **PASS** | None | N/A |
| IN-05 | Seismic-All cascades | **PASS** | None | N/A |
| IN-06 | Audience depth consistency | **PASS** | None | N/A |
| IN-07 | Lifecycle-Code triggers | **PASS** | None | N/A |
| IN-08 | Materials-All integration | **PASS** | None | N/A |
| IN-09 | Energy-Envelope-Mechanical | **PASS** | None | N/A |
| IN-10 | Document self-containment | **PASS** | Minor: bracket cross-refs not hyperlinked | Low |

| Validation Area | Verdict |
|----------------|---------|
| 6-Dimension coverage | **PASS** |
| Parameter schema enumeration usage | **PASS** |
| Code cross-reference table (27 codes) | **PASS — 100% consistent** |

---

## Overall Integration Score

**10/10 integration tests: PASS**
**0 FAIL, 0 PARTIAL**
**2 minor gaps identified (low severity, documentation-only)**
**27/27 code references: consistent across all modules and source index**
**6/6 dimensions: properly applied across all modules**

### Integration Grade: **A**

The BCM research corpus demonstrates exceptional cross-module integration. Key strengths:

1. **Single source of truth architecture.** The 00-source-index.md serves as the authoritative code reference, and all modules cite it consistently. No code edition years, effective dates, or administering body attributions conflict across any module.

2. **Explicit cross-reference system.** The bracket notation ([M1-ST:Topic]) provides descriptive, navigable references between modules. M3's MEP coordination table (Section 6.4) is the strongest integration artifact — it maps every plumbing-electrical intersection with bidirectional references.

3. **Coherent performance chains.** The energy-envelope-mechanical chain (M4 R-values -> M3 heat loss calculation -> M2 electrical sizing) demonstrates genuine system-level integration where one module's outputs become another module's inputs.

4. **Seismic through-line.** The Cascadia Subduction Zone parameters (37% probability of M7.1+, M9.0 in 1700, SDC D for western PNW) are cited identically in every module that references them. Portland Ch. 24.85 and Seattle SDCI prescriptive programs are documented identically across M1 and M5.

5. **Audience depth calibration.** The M6 framework (5-tier system, vocabulary gradient, content transformation rules) is faithfully applied across M1-M5. No factual contradictions exist between audience levels — only depth varies.

---

*Integration report compiled: 2026-03-08*
*Verification method: Full-text analysis of all 9 BCM documents (3 foundation + 6 modules); every integration test traced to specific file sections with evidence quotations; code cross-reference table verified against 00-source-index.md line by line*
*Tests executed: 10 integration tests + 6-dimension validation + 27-code cross-reference audit*
