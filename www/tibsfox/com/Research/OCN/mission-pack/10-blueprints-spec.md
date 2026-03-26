# Open Compute Node — Component Spec: Blueprints & Documentation

**Component:** 10-blueprints-spec.md
**Wave:** 3 (6 tasks)
**Model:** Opus (3.1, 3.2, 3.3, 3.6), Sonnet (3.4, 3.5)
**Dependencies:** ALL prior component specs (04-09)

---

## Mission

Produce the final LaTeX blueprint package: technical drawings, power diagrams, P&ID, rack layouts, Bill of Materials, and the integrated specification document. This is the primary deliverable — the document set that a Professional Engineer would review before approving construction.

## LaTeX Configuration

**Document Class:** Custom based on `article` with technical drawing support
**Engine:** XeLaTeX (Unicode support, TeX Gyre Pagella font)
**Packages Required:**
- `tikz` — Technical drawings (plan views, elevations, sections)
- `circuitikz` — Electrical single-line diagrams
- `pgfplots` — Data visualization (solar irradiance, power curves)
- `siunitx` — SI unit formatting
- `booktabs` — Professional tables
- `geometry` — Page layout (A1 for drawings, A4 for specs)
- `fancyhdr` — Headers with PE disclaimer
- `hyperref` — Cross-references

**Page Header (ALL pages):**
```
OPEN COMPUTE NODE v1.0 | CONCEPTUAL DESIGN — PE REVIEW REQUIRED | Page X of Y
```

## Deliverables

### D-10.1: Container Structure Drawings (`container-structure.tex`)
- **Sheet 1:** Plan view (top-down) — all zones, dimensions, penetrations
- **Sheet 2:** Longitudinal section (side view) — heights, cable trays, clearances
- **Sheet 3:** Cross sections (2: compute zone, cooling zone) — rack positions, aisles
- **Sheet 4:** Penetration detail views — each wall penetration at 1:5 scale
- **Sheet 5:** Floor reinforcement detail — steel plate, bolt pattern

### D-10.2: Power Single-Line Diagram (`power-sld.tex`)
- **Sheet 1:** System overview — solar → bus → BESS → container
- **Sheet 2:** Container internal power distribution — bus bar → rack PSUs → aux
- **Sheet 3:** Protection coordination — breakers, fuses, disconnects, grounding

### D-10.3: Cooling P&ID (`cooling-pid.tex`)
- **Sheet 1:** Primary cooling loop — CDU, manifolds, racks, instrumentation
- **Sheet 2:** Water filtration system — 5 stages, sensors, valves, waste
- **Sheet 3:** Secondary loop — heat exchanger, intake/output, controls

### D-10.4: Rack Layout Drawings (`rack-layout.tex`)
- **Sheet 1:** Rack elevation view — U positions, equipment placement
- **Sheet 2:** Cable routing diagram — power, data, cooling connections per rack
- **Sheet 3:** Network topology diagram — physical connections

### D-10.5: Bill of Materials (`bom.tex`)
Complete parts list organized by subsystem:

| Category | Contents |
|----------|----------|
| Container | ISO container, steel plate, insulation, doors, penetrations |
| Power | Solar panels, inverters, DC-DC converters, bus bar, wiring, BESS |
| Cooling | CDU, pumps, manifolds, hoses, fittings, coolant |
| Water | Filter housings, membranes, UV, sensors, piping, drum |
| Compute | GPU racks (reference), switches, fiber, cables |
| Environmental | Fire suppression, leak detection, sensors, access control |
| Site | Foundation materials, fencing, security cameras, lighting |

Each line item includes:
- Part description and specification
- Quantity
- Unit of measure
- Estimated unit cost (2025 USD)
- Supplier category (commodity/specialty)
- Lead time estimate

### D-10.6: Integrated Specification Document (`integrated-spec.tex`)
Single document compiling:
- Executive summary
- System overview with architecture diagram
- All subsystem specifications (summarized from component specs)
- Interface definitions
- Safety requirements matrix
- BOM summary
- Site requirements summary
- Maintenance schedule
- PE review disclaimer (full-page, first and last page)

## LaTeX Drawing Standards

**Dimensioning:**
- ISO 128 standard dimension lines
- All dimensions in millimeters (structural) or meters (site)
- Dual units where helpful (mm and inches for rack equipment)

**Line Weights:**
- Object outline: 0.5mm
- Dimension lines: 0.25mm
- Hidden lines: 0.25mm dashed
- Center lines: 0.25mm chain

**Scale Indicators:**
- Drawings include scale bar and notation
- Plan views: 1:50 or 1:25
- Detail views: 1:5 or 1:2
- Site plans: 1:500 or 1:200

## Acceptance Criteria

1. All LaTeX files compile without errors using XeLaTeX
2. All drawings have title blocks with document number, date, scale, PE disclaimer
3. BOM totals are internally consistent (quantities × unit costs = totals)
4. Integrated specification is self-contained (readable without other documents)
5. PE disclaimer appears on every page of every drawing
6. All cross-references between drawings are valid
7. Final PDF package compiles into single document with table of contents
