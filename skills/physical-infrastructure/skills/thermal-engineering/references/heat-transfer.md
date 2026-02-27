# Heat Transfer -- Deep Reference

*Thermal Engineering Skill -- Convection correlations, radiation theory, contact resistance*

---

## Dimensionless Numbers

Four dimensionless numbers govern convective heat transfer analysis:

| Number | Symbol | Formula | Physical Meaning |
|--------|--------|---------|-----------------|
| Reynolds | Re | rho v L / mu | Inertia forces / viscous forces |
| Nusselt | Nu | h L / k_fluid | Convective / conductive heat transfer |
| Prandtl | Pr | mu Cp / k_fluid | Momentum diffusivity / thermal diffusivity |
| Grashof | Gr | g beta DeltaT L^3 / nu^2 | Buoyancy forces / viscous forces |

**Prandtl number for common fluids (at 25C):**

| Fluid | Pr | Implication |
|-------|-----|------------|
| Liquid metals (Na, Hg) | 0.004-0.03 | Thermal boundary layer much thicker than velocity BL |
| Air | 0.71 | Comparable boundary layer thicknesses |
| Water | 6.9 | Velocity BL thicker than thermal BL |
| Engine oil | 900-2,000 | Thin thermal BL, conduction-dominated near surface |
| Glycol-water (50%) | 20-40 | Moderate convective enhancement |

**Rayleigh number:** Ra = Gr x Pr. Used for natural convection regime determination. Ra < 10^9: laminar natural convection. Ra > 10^9: turbulent natural convection.

## Forced Convection Correlations

### Internal Flow (Pipes and Ducts)

**Turbulent flow (Re > 10,000) -- Dittus-Boelter:**

```
Nu = 0.023 x Re^0.8 x Pr^n
```

- n = 0.4 when heating the fluid (T_wall > T_fluid)
- n = 0.3 when cooling the fluid (T_wall < T_fluid)
- Valid for: 0.6 < Pr < 160, Re > 10,000, L/D > 10

**Sieder-Tate correction (large viscosity variation):**

```
Nu = 0.027 x Re^0.8 x Pr^(1/3) x (mu_bulk / mu_wall)^0.14
```

Use when fluid viscosity changes significantly between bulk and wall temperatures (e.g., oil cooling).

**Laminar flow (Re < 2,300):**

| Boundary Condition | Nu (fully developed) |
|-------------------|---------------------|
| Constant wall temperature | 3.66 |
| Constant heat flux | 4.36 |

**Entry length effects:**

- Hydrodynamic entry length: L_h = 0.05 x Re x D
- Thermal entry length: L_t = 0.05 x Re x Pr x D
- In the entry region, local Nu is higher than fully developed values
- For short pipes (L/D < 60), use combined entry length correlation

### External Flow (Flat Plates, Cylinders)

**Flat plate, laminar (Re_x < 5 x 10^5):**

```
Nu_x = 0.332 x Re_x^0.5 x Pr^(1/3)   (local)
Nu_L = 0.664 x Re_L^0.5 x Pr^(1/3)   (average over length L)
```

**Flat plate, turbulent (Re_x > 5 x 10^5):**

```
Nu_x = 0.0296 x Re_x^0.8 x Pr^(1/3)   (local)
```

**Cylinder in crossflow (Churchill-Bernstein):**

```
Nu = 0.3 + (0.62 Re^0.5 Pr^(1/3)) / (1 + (0.4/Pr)^(2/3))^0.25 x (1 + (Re/282000)^(5/8))^(4/5)
```

Valid for Re x Pr > 0.2. Evaluate properties at film temperature T_film = (T_surface + T_fluid) / 2.

## Natural Convection

### Vertical Plates and Walls

**Churchill-Chu correlation (full range):**

```
Nu = ( 0.825 + 0.387 x Ra^(1/6) / (1 + (0.492/Pr)^(9/16))^(8/27) )^2
```

**Simplified for air (quick estimates):**

```
h = 1.42 x (DeltaT / L)^0.25  W/(m^2 K)    for laminar (Ra < 10^9)
h = 1.31 x DeltaT^(1/3)       W/(m^2 K)    for turbulent (Ra > 10^9)
```

### Empirical h Values for Common Configurations

| Configuration | h (W/(m^2 K)) | Condition |
|---------------|--------------|-----------|
| Vertical plate, air, DeltaT = 30C, L = 1 m | 5-8 | Laminar natural convection |
| Horizontal plate, hot face up, air | 6-12 | Buoyancy-assisted |
| Horizontal plate, hot face down, air | 2-5 | Buoyancy-opposed (poor) |
| Horizontal cylinder, D = 50 mm, air | 8-15 | Moderate DeltaT |
| Vertical plate, water, DeltaT = 10C | 200-600 | Water has high Pr |
| Enclosed air gap (vertical, 25 mm) | 5-10 | Effective resistance |

### Mixed Convection

When Re and Gr are of similar magnitude, both forced and natural convection contribute. Rule of thumb:

- Gr/Re^2 << 1: forced convection dominates
- Gr/Re^2 >> 1: natural convection dominates
- Gr/Re^2 ~ 1: mixed convection (combine effects)

## Radiation View Factors

### Blackbody Exchange

```
Q_12 = sigma x A1 x F12 x (T1^4 - T2^4)
```

F12 = view factor = fraction of radiation leaving surface 1 that reaches surface 2.

### Key View Factor Rules

**Reciprocity:** A1 x F12 = A2 x F21

**Enclosure summation:** For a surface i in an N-surface enclosure: sum(F_ij, j=1 to N) = 1

**Self-viewing:** F_ii = 0 for convex or flat surfaces. F_ii > 0 for concave surfaces.

### Common View Factors

| Geometry | F12 |
|----------|-----|
| Infinite parallel plates | 1.0 |
| Two equal parallel squares, side L, distance d; d/L = 0.5 | 0.42 |
| Two equal parallel squares, side L, distance d; d/L = 1.0 | 0.20 |
| Small surface to large enclosure | 1.0 (approximately) |
| Two perpendicular rectangles sharing edge | 0.1-0.3 (depends on aspect ratio) |

### Radiation Shields

Placing n radiation shields between two parallel plates reduces radiation by factor 1/(n+1), assuming all surfaces have the same emissivity.

```
Q_with_shields = Q_without_shields / (n + 1)
```

Application: multi-layer insulation (MLI) on cryogenic systems uses 10-30 layers of aluminized Mylar.

### Gray Body Exchange (Non-Blackbody)

For two gray surfaces forming an enclosure:

```
Q_12 = sigma (T1^4 - T2^4) / ( (1-epsilon1)/(epsilon1 A1) + 1/(A1 F12) + (1-epsilon2)/(epsilon2 A2) )
```

This is the standard "resistance network" for radiation, with three resistances in series.

## Contact and Interface Resistance

### Physics

Real surfaces have micro-asperities (peaks and valleys at microscopic scale). When two surfaces are pressed together, actual metal-to-metal contact occurs at only 1-2% of the nominal area. Heat transfer occurs through:

1. **Conduction through contact spots** (dominant for metals)
2. **Conduction through interstitial fluid** (air, TIM, grease)
3. **Radiation across gaps** (negligible at low temperatures)

### Contact Resistance Data

| Interface | R_contact (K cm^2/W) | Condition |
|-----------|---------------------|-----------|
| Steel-steel, bare | 0.5-5.0 | Surface finish dependent |
| Aluminum-aluminum, bare | 0.3-2.0 | Smoother than steel |
| Steel-steel, thermal grease | 0.1-0.5 | 10x improvement over bare |
| Aluminum, phase-change TIM | 0.05-0.2 | Melts and fills asperities |
| Copper, indium foil | 0.02-0.1 | Soft metal deforms to fill |
| Solder bond | 0.01-0.05 | Near-zero gap |

### Factors Affecting Contact Resistance

| Factor | Effect |
|--------|--------|
| Surface roughness (Ra) | Lower Ra = lower R_contact |
| Contact pressure | Higher pressure = more contact area = lower R |
| Hardness | Softer materials deform more = lower R |
| TIM conductivity | Higher k_TIM = lower R |
| Temperature | Mild effect; expansion can improve contact |

## Worked Example: Server Thermal Path

**Scenario:** 300W GPU die, junction to coolant at 30C

**Thermal path (series network):**

| Layer | Material | Thickness | Area | k or h | R (K/W) |
|-------|----------|-----------|------|--------|---------|
| Die spreading | Silicon | 0.5 mm | 8 cm^2 (die) | 150 W/(m K) | 0.0042 |
| TIM | Thermal paste | 0.05 mm | 8 cm^2 | 5 W/(m K) | 0.0125 |
| Cold plate wall | Copper | 2 mm | 25 cm^2 (plate) | 385 W/(m K) | 0.0021 |
| Cold plate to coolant | Water convection | - | 50 cm^2 (fins) | 5,000 W/(m^2 K) | 0.040 |

**Total thermal resistance:**

```
R_total = 0.0042 + 0.0125 + 0.0021 + 0.040 = 0.0588 K/W
```

**Junction temperature:**

```
T_junction = T_coolant + Q x R_total
           = 30 + 300 x 0.0588
           = 30 + 17.6
           = 47.6C
```

Well below TjMax of 95C. Margin: 47.4C.

**Temperature at each interface:**
- Die top: 47.6C (hottest)
- TIM outer face: 47.6 - 300 x 0.0042 = 46.3C
- Cold plate inner face: 46.3 - 300 x 0.0125 = 42.6C
- Cold plate outer face: 42.6 - 300 x 0.0021 = 41.9C
- Coolant: 30.0C

**Dominant resistance:** Cold plate to coolant convection (0.040 K/W = 68% of total). Improvement priority: increase fin area or flow velocity for the largest temperature reduction.

---
*Heat Transfer Deep Reference v1.0.0 -- Thermal Engineering Skill*
*All outputs require verification by a licensed Professional Engineer.*
