# Open Compute Node — Component Spec: Container Structure

**Component:** 04-container-structure.md
**Wave:** 0 (shared types) + 1A (structure)
**Model:** Opus (1A.1, 1A.2), Sonnet (1A.3)
**Dependencies:** None (this is the foundation)

---

## Mission

Produce the complete structural specification for modifying a standard 40ft High Cube ISO container into an AI compute node housing. This includes all container modifications, internal zone layout, rack mounting specifications, and dimensional constraints that all other components consume.

## Reference Data

**Container:** 40ft High Cube per ISO 668:2020 / ISO 1496-1:2013
- Internal: 12,032mm L × 2,352mm W × 2,695mm H
- Max payload: ~26,300 kg
- Floor load: 7,260 kg/m line load
- Material: Corten steel walls/roof, marine plywood floor (28mm)

## Deliverables

### D-04.1: Shared Dimensional Types

Define the canonical dimensional reference that ALL other specs consume:

```yaml
container:
  internal:
    length_mm: 12032
    width_mm: 2352
    height_mm: 2695
  
zones:
  entry:
    x_start: 0
    x_end: 2000
    purpose: "Access, fire suppression, monitoring"
  power:
    x_start: 2000
    x_end: 4500
    purpose: "PDU, battery (buffer), inverter, switchgear"
  compute:
    x_start: 4500
    x_end: 9500
    purpose: "Server racks, hot/cold aisle containment"
  cooling:
    x_start: 9500
    x_end: 12032
    purpose: "CDU, filtration, pumps, waste drum"

penetrations:
  south_wall:  # Wall facing external power source
    - type: "power_conduit"
      count: 2
      size_mm: 100
      height_mm: 500
    - type: "emergency_disconnect"
      count: 1
      height_mm: 1500
  north_wall:  # Wall facing water source/output
    - type: "water_intake"
      count: 1
      size_mm: 50
      height_mm: 300
    - type: "water_output"
      count: 1
      size_mm: 25
      height_mm: 300
    - type: "waste_access"
      count: 1
      size_mm: 600  # Door for drum removal
      height_mm: 800
  east_wall:  # Rear wall (original container doors replaced)
    - type: "fiber_entry"
      count: 1
      size_mm: 50
      height_mm: 2000
    - type: "exhaust_vent"
      count: 2
      size_mm: 300
      height_mm: 2200
  west_wall:  # Main access (original or replaced door)
    - type: "personnel_door"
      count: 1
      width_mm: 900
      height_mm: 2100
```

### D-04.2: Container Modification Specification

Document every physical modification to the ISO container:

1. **Floor reinforcement** — 6mm steel plate overlay in compute zone (5m × 2.35m), welded to container cross-members. Total floor load capacity in compute zone must support 2× GB200 racks (2,720 kg) plus cabinet weight with safety factor of 2.0.

2. **Wall penetrations** — As defined in penetrations spec above. Each penetration must include:
   - Weatherproof gland/seal
   - Fire-rated collar (2-hour minimum per NFPA 75)
   - Drip loop on external cable/pipe runs

3. **Insulation** — Closed-cell spray polyurethane foam:
   - Walls: 50mm (R-13)
   - Ceiling: 75mm (R-19)
   - Floor: 25mm rigid foam board under rack mounting plates
   - Vapor barrier on warm side

4. **Door replacement** — West wall original container doors replaced with:
   - Single personnel door (900mm × 2100mm)
   - Security lock (electronic, audit-logged)
   - Emergency release (interior panic bar)
   - Environmental seal (IP54 minimum)

5. **Cable management** — Ceiling-mounted cable tray:
   - 300mm wide, running east-to-west full length
   - Drop points at each rack position
   - Separation between power and data per NEC 300.3

6. **Hot/cold aisle containment** — Prefabricated containment panels:
   - Floor-to-ceiling in compute zone
   - Cold aisle width: 1,200mm
   - Hot aisle width: 900mm minimum

### D-04.3: Rack Layout Drawing (LaTeX)

Produce a dimensioned plan view showing:
- All four zones with boundaries
- Rack positions (center compute zone)
- Aisle widths
- Cable tray route
- Penetration locations
- Emergency egress path
- Fire suppression coverage zones

## Safety Requirements

- [ ] S-01: PE disclaimer on all specification pages
- [ ] S-06: Weight budget verified (total < 26,300 kg payload)
- [ ] Floor reinforcement calculation includes seismic safety factor
- [ ] Emergency egress path clear and marked (OSHA compliant)
- [ ] All penetrations fire-rated per NFPA 75

## Acceptance Criteria

1. All dimensions internally consistent and traceable to ISO 668
2. Weight budget has ≥30% margin remaining
3. All penetration locations avoid structural corner castings
4. Hot/cold aisle containment fits within compute zone dimensions
5. Emergency egress path is ≤15m to exit (container length is 12m, so inherently met)
6. LaTeX drawing compiles and dimensions are readable at A1 scale
