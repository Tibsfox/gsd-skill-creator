# Pipe Sizing -- Deep Reference

*Fluid Systems Skill -- Load on demand for derivations and full pipe tables*

---

## Darcy-Weisbach Derivation

The Darcy-Weisbach equation originates from dimensional analysis of energy loss per unit volume of fluid flowing through a pipe. The pressure drop is proportional to:

- The kinetic energy per unit volume (rho v^2 / 2)
- The pipe length-to-diameter ratio (L/D), representing surface area exposed to friction
- A dimensionless friction factor f, encoding surface roughness and flow regime

```
DeltaP = f x (L/D) x (rho v^2 / 2)
```

**Fanning vs Darcy friction factor:** The Darcy (Moody) friction factor f_D = 4 x f_F (Fanning). Always verify which convention is in use. This skill uses the Darcy friction factor throughout, which is standard in US engineering practice and the Moody diagram.

**Moody diagram structure:**

- X-axis: Reynolds number Re (log scale, 10^3 to 10^8)
- Y-axis: Darcy friction factor f (log scale, 0.008 to 0.1)
- Laminar region (Re < 2,300): single line, f = 64/Re, independent of roughness
- Transition zone (2,300 < Re < 4,000): unstable -- avoid designing in this region
- Turbulent region (Re > 4,000): family of curves parameterized by relative roughness epsilon/D
- Fully rough zone: at high Re, f depends only on epsilon/D (curves become horizontal)

**Laminar flow friction factor:**

```
f = 64 / Re     (exact analytical solution, Hagen-Poiseuille)
```

Valid only for Re < 2,300. Pressure drop is linear with velocity (not quadratic).

## Colebrook-White Equation

The implicit equation for turbulent friction factor in smooth and rough pipes:

```
1/sqrt(f) = -2 log( epsilon/(3.7D) + 2.51/(Re sqrt(f)) )
```

**Iterative solution:** Start with f = 0.02. Substitute into the right side to compute a new f. Repeat 3-4 times. Convergence is rapid for typical engineering Reynolds numbers.

**Step-by-step iteration example (2-inch steel pipe, Re = 100,000, epsilon/D = 0.001):**

```
Iteration 0: f = 0.02000
Iteration 1: 1/sqrt(f) = -2 log(0.001/3.7 + 2.51/(100000 x 0.1414)) = 6.493 -> f = 0.02371
Iteration 2: 1/sqrt(f) = -2 log(0.000270 + 0.0001629) = 6.417 -> f = 0.02429
Iteration 3: 1/sqrt(f) = -2 log(0.000270 + 0.0001611) = 6.413 -> f = 0.02432
Iteration 4: converged at f = 0.02432
```

### Swamee-Jain Explicit Approximation

Avoids iteration entirely with accuracy within 1% of Colebrook:

```
f = 0.25 / [ log( epsilon/(3.7D) + 5.74/Re^0.9 ) ]^2
```

Valid for: 10^-6 < epsilon/D < 10^-2, 5,000 < Re < 10^8

Use Swamee-Jain for rapid preliminary calculations. Use iterative Colebrook for final design verification.

## Full NPS Pipe Size Reference Table

Standard pipe sizes per ASME B36.10M. Dimensions in inches.

| NPS | OD (in) | Sch 40 ID (in) | Sch 40 Area (in^2) | Sch 80 ID (in) | Sch 80 Area (in^2) |
|-----|---------|----------------|---------------------|----------------|---------------------|
| 1/2 | 0.840 | 0.622 | 0.304 | 0.546 | 0.234 |
| 3/4 | 1.050 | 0.824 | 0.533 | 0.742 | 0.432 |
| 1 | 1.315 | 1.049 | 0.864 | 0.957 | 0.719 |
| 1-1/4 | 1.660 | 1.380 | 1.496 | 1.278 | 1.283 |
| 1-1/2 | 1.900 | 1.610 | 2.036 | 1.500 | 1.767 |
| 2 | 2.375 | 2.067 | 3.356 | 1.939 | 2.953 |
| 2-1/2 | 2.875 | 2.469 | 4.788 | 2.323 | 4.238 |
| 3 | 3.500 | 3.068 | 7.393 | 2.900 | 6.605 |
| 4 | 4.500 | 4.026 | 12.730 | 3.826 | 11.497 |
| 6 | 6.625 | 6.065 | 28.889 | 5.761 | 26.067 |
| 8 | 8.625 | 7.981 | 50.027 | 7.625 | 45.664 |
| 10 | 10.750 | 10.020 | 78.854 | 9.564 | 71.841 |
| 12 | 12.750 | 11.938 | 111.929 | 11.376 | 101.636 |

Note: Exact values available programmatically from engineering-constants.ts `getPipeSize()` function.

## Hazen-Williams Extended Guide

### Full C Factor Table

| Pipe Material | C Value | Age/Condition |
|---------------|---------|---------------|
| Copper | 150 | New |
| PEX | 150 | All ages |
| PVC | 150 | New |
| CPVC | 150 | New |
| Fiberglass (FRP) | 150 | New |
| Cement-lined ductile iron | 140 | New |
| New welded steel | 145 | New |
| New seamless steel | 140 | New |
| Cast iron | 130 | New |
| Galvanized steel | 120 | New |
| Concrete | 120-140 | Depends on finish |
| Corrugated steel | 60 | New |
| Old steel (10 years) | 110 | Moderate corrosion |
| Old steel (20+ years) | 100 | Significant corrosion |
| Old cast iron (40+ years) | 80-100 | Heavy tuberculation |

### Conversion to Darcy-Weisbach

For comparison purposes, the Hazen-Williams head loss can be equated to Darcy-Weisbach at a specific velocity to find an equivalent friction factor. However, the exponents differ (HW uses v^1.85, DW uses v^2), so equivalence is only approximate at the design point.

### Limitations

- Valid only for water (specific gravity ~1.0, viscosity ~1 cP)
- Turbulent flow only (Re > 4,000)
- Circular pipe cross-sections only
- Temperature range: 0-25C (viscosity assumptions break down outside this range)
- Not valid for: glycol solutions, oils, chemicals, compressed gases, slurries
- For non-water fluids, always use Darcy-Weisbach

## Minor Loss Coefficients (K Values)

Alternative to equivalent length method for complex fittings. Head loss from minor losses:

```
h_L = K x v^2 / (2g)
```

Or in pressure units:

```
DeltaP = K x rho x v^2 / 2
```

### K Values Table

| Fitting/Component | K Value | Notes |
|--------------------|---------|-------|
| Sharp-edged entrance | 0.50 | Pipe entering from tank |
| Well-rounded entrance | 0.04 | Bell-mouth or rounded |
| Re-entrant entrance | 0.80 | Pipe protruding into tank |
| Exit (all types) | 1.00 | Kinetic energy fully lost |
| 90 degree standard elbow | 0.90 | |
| 90 degree long-radius elbow | 0.60 | |
| 45 degree elbow | 0.40 | |
| Tee (branch flow) | 1.80 | |
| Tee (straight through) | 0.40 | |
| Gate valve (fully open) | 0.20 | |
| Globe valve (fully open) | 10.0 | |
| Ball valve (fully open) | 0.05 | |
| Check valve (swing) | 2.00 | |
| Butterfly valve (fully open) | 0.30 | |

### Sudden Expansion

```
K = (1 - A1/A2)^2
```

Where A1 is the smaller upstream area and A2 is the larger downstream area.

### Sudden Contraction

```
K = 0.5 x (1 - A2/A1)     (for A2/A1 < 0.76)
K = (1 - A2/A1)^2 x 0.42  (for A2/A1 >= 0.76)
```

## Worked Example: Data Center Cooling Loop Sizing

**Design parameters:**
- Heat load: 400 kW (10 racks at 40 kW each)
- Supply/return temperatures: 20C / 30C (DeltaT = 10C)
- Pipe material: copper (epsilon = 0.0000015 m, C = 150)
- Maximum velocity: 6 ft/s (1.83 m/s) for main header
- Loop length: 100 m with 8 x 90-degree elbows, 4 x tees (branch), 2 x gate valves

### Step 1: Flow Rate

```
Q = 400 / (998 x 4.182 x 10) = 400 / 41,736 = 0.00958 m^3/s = 9.58 L/s = 151.9 GPM
```

### Step 2: Minimum Pipe Diameter

```
A_min = Q / v_max = 0.00958 / 1.83 = 0.005235 m^2
D_min = sqrt(4A / pi) = sqrt(4 x 0.005235 / 3.14159) = 0.0816 m = 3.21 inches
```

Select NPS 4" Schedule 40 (ID = 4.026 in = 0.1023 m, A = 0.008213 m^2).

### Step 3: Actual Velocity

```
v = Q / A = 0.00958 / 0.008213 = 1.17 m/s = 3.83 ft/s  (within 2-6 ft/s range)
```

### Step 4: Reynolds Number

Water at 20C: mu = 0.001002 Pa.s

```
Re = 998 x 1.17 x 0.1023 / 0.001002 = 119,400  (turbulent)
```

### Step 5: Friction Factor (Swamee-Jain)

```
epsilon/D = 0.0000015 / 0.1023 = 0.0000147

f = 0.25 / [log(0.0000147/3.7 + 5.74/119400^0.9)]^2
  = 0.25 / [log(0.00000397 + 0.0000886)]^2
  = 0.25 / [log(0.0000926)]^2
  = 0.25 / [-4.034]^2
  = 0.25 / 16.27
  = 0.01537
```

### Step 6: Straight Pipe Pressure Drop

```
DeltaP_pipe = f x (L/D) x (rho v^2 / 2)
            = 0.01537 x (100/0.1023) x (998 x 1.17^2 / 2)
            = 0.01537 x 977.5 x 683.3
            = 10,264 Pa = 10.3 kPa = 1.49 PSI
```

### Step 7: Fitting Losses (Equivalent Length)

```
8 x 90-degree elbows: 8 x 30D = 240D
4 x tees (branch):    4 x 60D = 240D
2 x gate valves:      2 x 8D  = 16D
Total equivalent:     496D = 496 x 0.1023 = 50.7 m
```

Fitting pressure drop:

```
DeltaP_fittings = 0.01537 x (50.7/0.1023) x 683.3 = 5,200 Pa = 5.2 kPa = 0.75 PSI
```

### Step 8: Total System Pressure Drop

```
DeltaP_total = 10.3 + 5.2 + equipment losses (from vendor, est. 30-50 kPa for CDU + chiller)
             = 15.5 kPa pipe + 40 kPa equipment
             = 55.5 kPa = 8.0 PSI
```

Well within 150 PSI data center safety class limit. Pump must provide at least 55.5 kPa at 9.58 L/s (152 GPM) design flow.

---
*Pipe Sizing Deep Reference v1.0.0 -- Fluid Systems Skill*
*All outputs require verification by a licensed Professional Engineer.*
