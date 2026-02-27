# Pump Selection -- Deep Reference

*Fluid Systems Skill -- Pump curves, NPSH, VFD sizing, affinity laws*

---

## Pump Types for Infrastructure

### Centrifugal Pumps (Most Common)

Centrifugal pumps convert rotational kinetic energy into fluid pressure via an impeller. Three sub-types:

| Type | Flow Pattern | Best For | Head Range |
|------|-------------|----------|-----------|
| Radial flow | Perpendicular to shaft | High head, moderate flow | 15-150 m |
| Axial flow | Parallel to shaft | High flow, low head | 1-15 m |
| Mixed flow | Combination | Medium head and flow | 5-50 m |

**Selection guide:** Centrifugal pumps are preferred for continuous flow above 10 GPM (0.63 L/s). They are the standard choice for HVAC, chilled water, condenser water, and data center cooling loops.

### Positive Displacement Pumps

| Type | Mechanism | Best For |
|------|-----------|----------|
| Diaphragm | Flexing membrane | Chemical dosing, precise metering |
| Gear | Meshing gears | Viscous fluids, oil systems |
| Peristaltic | Squeezed tubing | Sterile/clean applications |
| Piston/plunger | Reciprocating piston | Very high pressure (>1000 PSI) |

**When to use PD:** Precise flow metering (chemical treatment), highly viscous fluids (>100 cP), very high pressure requirements, or when flow rate must be independent of discharge pressure.

## Reading a Pump Curve

A pump curve (H-Q curve) is the manufacturer's performance chart. Understanding it is essential for pump selection.

### Axes and Curves

- **Primary X-axis:** Flow rate (GPM or m^3/h)
- **Primary Y-axis:** Total dynamic head (ft or m of water)
- **H-Q curve:** Head vs flow relationship -- always slopes downward left to right
- **Efficiency curve:** Pump efficiency (%) vs flow -- bell-shaped, peaks at BEP
- **Power curve:** Brake horsepower (BHP) or kW vs flow -- generally increases with flow
- **NPSH_required curve:** NPSH_R vs flow -- increases with flow (higher flow = more suction demand)

### Best Efficiency Point (BEP)

The BEP is where the pump operates at peak hydraulic efficiency. Design the system operating point within 70-120% of BEP flow.

| Operating Range | % of BEP Flow | Condition | Risk |
|----------------|--------------|-----------|------|
| Dead-head zone | 0-30% | Minimal flow, high recirculation | Overheating, seal damage |
| Unstable zone | 30-50% | Radial thrust imbalance | Bearing wear, vibration |
| Preferred range | 70-120% | Near BEP, stable operation | Optimal reliability |
| Runout zone | >120% | Excessive flow | Cavitation risk, motor overload |

**Rule of thumb:** If the system operating point falls below 50% BEP or above 120% BEP, select a different pump or impeller trim.

### Impeller Trimming

Manufacturers can machine the impeller to a smaller diameter to shift the H-Q curve downward. Affinity laws apply:

```
Q2/Q1 = D2/D1
H2/H1 = (D2/D1)^2
P2/P1 = (D2/D1)^3
```

Maximum trim is typically 75% of full diameter. Below that, efficiency drops significantly.

## Full NPSH Calculation

Net Positive Suction Head Available (NPSH_A) must exceed NPSH Required (NPSH_R) to prevent cavitation.

### NPSH_A Formula

```
NPSH_A = (P_abs / (rho x g)) + z_source - h_f_suction - (P_vapor / (rho x g))
```

| Variable | Definition | Units |
|----------|-----------|-------|
| P_abs | Absolute pressure at liquid surface | Pa |
| rho | Fluid density | kg/m^3 |
| g | Gravitational acceleration (9.81) | m/s^2 |
| z_source | Height of liquid surface above pump centerline (positive = above) | m |
| h_f_suction | Friction losses in suction piping | m |
| P_vapor | Vapor pressure of fluid at operating temperature | Pa |

### Vapor Pressure of Water

| Temperature (C) | P_vapor (kPa) | P_vapor (PSI) |
|----------------|--------------|--------------|
| 10 | 1.23 | 0.18 |
| 20 | 2.34 | 0.34 |
| 30 | 4.24 | 0.62 |
| 40 | 7.38 | 1.07 |
| 50 | 12.34 | 1.79 |
| 60 | 19.94 | 2.89 |
| 80 | 47.39 | 6.87 |
| 100 | 101.33 | 14.70 |

### Altitude Correction

Atmospheric pressure decreases with elevation. At sea level: P_atm = 101.325 kPa.

| Altitude (m) | P_atm (kPa) | Reduction |
|-------------|-------------|-----------|
| 0 (sea level) | 101.3 | -- |
| 500 | 95.5 | -5.8 |
| 1000 | 89.9 | -11.4 |
| 1500 | 84.6 | -16.7 |
| 2000 | 79.5 | -21.8 |

Every 1,000 m of elevation reduces NPSH_A by approximately 1.2 m of head.

### Safety Margins

| Application | Minimum NPSH_A - NPSH_R |
|-------------|------------------------|
| General service | >= 0.5 m |
| Critical cooling (data center) | >= 1.0 m |
| Hot water (>60C) | >= 1.5 m |
| Slurry or entrained gas | >= 2.0 m |

### Worked Example

**Scenario:** Pump taking chilled water from an open tank at 20C, sea level, pump 2 m below tank surface, 5 m of 3-inch suction pipe with 2 elbows.

```
P_abs = 101,325 Pa (open tank at sea level)
rho = 998 kg/m^3
P_vapor = 2,340 Pa (at 20C)

Pressure head = 101,325 / (998 x 9.81) = 10.34 m
z_source = +2.0 m (tank above pump)
h_f_suction = estimate 0.3 m (5m pipe + 2 elbows at moderate velocity)
Vapor head = 2,340 / (998 x 9.81) = 0.24 m

NPSH_A = 10.34 + 2.0 - 0.3 - 0.24 = 11.8 m
```

If pump NPSH_R = 3.0 m at design flow: margin = 11.8 - 3.0 = 8.8 m. Excellent.

## VFD Application

Variable Frequency Drives (VFDs) adjust pump speed to match system demand, providing dramatic energy savings on variable-flow systems.

### Affinity Law Energy Savings

| Speed Ratio (N2/N1) | Flow Ratio | Head Ratio | Power Ratio | Power Saved |
|---------------------|-----------|-----------|------------|-------------|
| 100% | 100% | 100% | 100% | 0% |
| 90% | 90% | 81% | 72.9% | 27.1% |
| 80% | 80% | 64% | 51.2% | 48.8% |
| 70% | 70% | 49% | 34.3% | 65.7% |
| 60% | 60% | 36% | 21.6% | 78.4% |
| 50% | 50% | 25% | 12.5% | 87.5% |

### VFD Sizing Checklist

- **Motor rated kW:** Size VFD to match motor nameplate at 100% speed, 100% load
- **Overload capacity:** Ensure VFD handles 110% load for 60 seconds (starting/transients)
- **Bypass contactor:** Required for critical systems -- allows direct-on-line operation if VFD fails
- **Harmonic filters:** 5th and 7th harmonic filters required for sensitive environments (medical, data center UPS)
- **Ambient temperature:** Ensure VFD enclosure ambient <= 40C; derate at higher temperatures
- **Cable length:** Maximum VFD-to-motor cable length per manufacturer spec (typically 100-300 m)

### Minimum Speed Limit

Do not operate centrifugal pumps below 30% speed:
- Below ~30%: insufficient cooling for motor bearings and mechanical seal
- Below ~20%: pump may not develop enough head to overcome static pressure
- Set VFD minimum frequency to correspond with minimum required flow

## Parallel and Series Pump Configurations

### Parallel Pumps

Two or more pumps with suction and discharge headers connected together.

**Effect:** Same head, additive flow. The combined pump curve is constructed by adding flow rates at each head value.

**Actual flow increase:** Less than double due to steepening system curve. A flat system curve (low static head, mostly friction) benefits most from parallel pumps.

**When to use:**
- Variable demand systems (VFD on each pump, lead-lag staging)
- High flow rate requirements beyond single-pump capacity
- Redundancy (N+1 with automatic switchover)

**Caution:** Parallel pumps must have closely matched H-Q curves. A weak pump running in parallel with a strong pump may be pushed to shutoff (zero flow through the weak pump).

### Series Pumps

One pump discharges into the suction of the next.

**Effect:** Same flow, additive head. Each pump contributes its head at the system flow rate.

**When to use:**
- High-head applications (tall buildings, distant loads)
- Booster stations on long pipelines
- When single pump cannot develop required head efficiently

**Caution:** Series pumps increase system pressure. Verify all piping and fittings between pumps are rated for the cumulative pressure.

## Pump Specification Checklist

For procurement and vendor quotation, provide:

| Parameter | Value Required | Source |
|-----------|---------------|--------|
| Design flow rate | GPM or m^3/h | System hydraulic calculation |
| Design total head | ft or m | System curve at design flow |
| Fluid type | Water, glycol %, etc. | Process requirements |
| Fluid temperature | C or F | Operating conditions |
| Specific gravity | dimensionless | Fluid data sheet |
| Solids content | % by weight, particle size | Process requirements |
| NPSH available | m or ft | Suction-side calculation |
| Motor efficiency class | IE3 minimum (IEC), NEMA Premium | Local energy code |
| Seal type | Mechanical (preferred), packed | Application requirements |
| Wetted material | Cast iron, bronze, 316 SS | Corrosion resistance needs |
| Connection size | Suction and discharge flanges | Pipe sizing |
| Electrical supply | Voltage, phase, frequency | Facility power |
| VFD required | Yes/No | Variable flow applications |
| Redundancy | Duty/standby, N+1, 2N | Criticality tier |
| Certifications | UL, CSA, ASME, API | Local code requirements |

---
*Pump Selection Deep Reference v1.0.0 -- Fluid Systems Skill*
*All outputs require verification by a licensed Professional Engineer.*
