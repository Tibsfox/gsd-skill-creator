# Heat Exchanger Engineering -- Deep Reference

*Thermal Engineering Skill -- LMTD correction factors, epsilon-NTU tables, fouling, U values*

---

## Heat Exchanger Types

### Selection Guide

| Type | Pressure Rating | U Range (W/(m^2 K)) | Cleanability | Best Application |
|------|----------------|---------------------|-------------|-----------------|
| Shell-and-tube | Up to 300 bar | 800-2,500 (water-water) | Mechanical cleaning possible | Industrial process, high pressure |
| Gasketed plate | Up to 25 bar | 3,000-8,000 (water-water) | Easy disassembly, full access | HVAC, CDU, moderate pressure |
| Brazed plate | Up to 40 bar | 3,000-8,000 | Not cleanable (brazed shut) | Compact, permanent installations |
| Welded plate | Up to 100 bar | 3,000-7,000 | Limited access | High pressure compact |
| Finned coil (air-water) | Up to 15 bar | 30-300 | Fin washing, coil cleaning | Air handling, dry coolers |
| Double pipe | Up to 300 bar | 500-2,000 | Inner tube removable | Small flows, high pressure |
| Spiral | Up to 25 bar | 1,000-4,000 | Self-cleaning flow pattern | Slurry, fouling fluids |

### CDU Heat Exchanger Selection

Most CDUs use gasketed or brazed plate heat exchangers:

- **Gasketed plate:** Preferred when cleaning access is needed (data center maintenance)
- **Brazed plate:** Preferred for compact size and higher pressure rating
- **Plate count:** Minimum 10 plates for good flow distribution; typical CDU has 20-60 plates
- **Material:** Stainless steel 316 plates, EPDM or Viton gaskets, stainless steel frame

## LMTD Correction Factor F

The correction factor F accounts for the departure from ideal counterflow. F = 1.0 for pure counterflow and decreases for less efficient flow arrangements.

### P and R Parameters

```
P = (t2 - t1) / (T1 - t1)    (tube-side temperature change / max possible)
R = (T1 - T2) / (t2 - t1)    (capacity rate ratio, shell-side/tube-side)
```

Where:
- T1, T2 = shell-side inlet and outlet temperatures
- t1, t2 = tube-side inlet and outlet temperatures

### F Values for Common Arrangements

**1 shell pass, 2 tube passes (most common shell-and-tube):**

| P \ R | 0.5 | 1.0 | 1.5 | 2.0 |
|-------|-----|-----|-----|-----|
| 0.1 | 0.99 | 0.99 | 0.98 | 0.97 |
| 0.2 | 0.98 | 0.96 | 0.94 | 0.91 |
| 0.3 | 0.96 | 0.92 | 0.87 | 0.80 |
| 0.4 | 0.93 | 0.87 | 0.78 | 0.65 |
| 0.5 | 0.90 | 0.80 | 0.64 | -- |
| 0.6 | 0.85 | 0.71 | -- | -- |

**Design rules:**
- F >= 0.75: acceptable design
- F < 0.75: consider adding shell passes or switching to counterflow
- F < 0.50: design is fundamentally poor; redesign required

**2 shell passes, 4 tube passes:** F values are higher (closer to 1.0) for the same P and R. Use when 1-shell-pass F is too low.

### Plate Heat Exchanger F Factor

Plate heat exchangers approximate true counterflow very closely:
- Single-pass counterflow: F = 0.95-1.0
- Multi-pass: F = 0.85-0.95
- Generally, F correction is not needed for plate HX preliminary sizing

## Epsilon-NTU Relationships (Full Table)

### Counterflow

```
epsilon = (1 - exp(-NTU(1 - Cr))) / (1 - Cr exp(-NTU(1 - Cr)))    Cr != 1
epsilon = NTU / (1 + NTU)                                           Cr = 1
```

### Parallel Flow

```
epsilon = (1 - exp(-NTU(1 + Cr))) / (1 + Cr)
```

Maximum effectiveness (at NTU -> infinity): epsilon_max = 1 / (1 + Cr). Parallel flow can never achieve epsilon > 0.5 when Cr = 1.

### Crossflow (Both Fluids Unmixed)

```
epsilon = 1 - exp( (-NTU^0.22 / Cr) x (exp(-Cr x NTU^0.78) - 1) )
```

Approximate; accurate to within 3% for engineering purposes.

### Crossflow (One Fluid Mixed, One Unmixed)

**C_min mixed:**

```
epsilon = (1/Cr) x (1 - exp(-Cr x (1 - exp(-NTU))))
```

**C_min unmixed:**

```
epsilon = 1 - exp(-(1/Cr) x (1 - exp(-Cr x NTU)))
```

### Condenser or Evaporator (Cr = 0)

When one fluid undergoes phase change (condensation or boiling), its effective heat capacity is infinite, so C_r = 0:

```
epsilon = 1 - exp(-NTU)
```

This is the simplest case. At NTU = 1: epsilon = 0.632. At NTU = 3: epsilon = 0.950.

### NTU Quick-Reference (Counterflow, Selected Cr)

| Target epsilon | Cr = 0 | Cr = 0.25 | Cr = 0.50 | Cr = 0.75 | Cr = 1.0 |
|---------------|--------|-----------|-----------|-----------|----------|
| 0.50 | 0.69 | 0.78 | 0.90 | 1.06 | 1.00 |
| 0.60 | 0.92 | 1.04 | 1.22 | 1.49 | 1.50 |
| 0.70 | 1.20 | 1.40 | 1.69 | 2.17 | 2.33 |
| 0.80 | 1.61 | 1.92 | 2.45 | 3.45 | 4.00 |
| 0.85 | 1.90 | 2.32 | 3.10 | 4.78 | 5.67 |
| 0.90 | 2.30 | 2.90 | 4.16 | 7.33 | 9.00 |
| 0.95 | 3.00 | 3.99 | 6.51 | 15.4 | 19.0 |

**Observation:** High effectiveness (>0.85) requires dramatically more NTU (and thus more area) when Cr approaches 1. Counterflow is most efficient at high Cr.

## Overall Heat Transfer Coefficient U

### Derivation

The overall resistance includes all layers from hot fluid to cold fluid:

```
1/(U A) = 1/(h_i A_i) + R_fouling,i/A_i + R_wall + R_fouling,o/A_o + 1/(h_o A_o)
```

For thin-wall tubes where A_i approximately equals A_o:

```
1/U = 1/h_i + R_fouling,i + t_wall/k_wall + R_fouling,o + 1/h_o
```

### Fouling Resistance (TEMA Standards)

| Fluid | R_fouling (m^2 K/W) |
|-------|---------------------|
| Distilled water | 0.00009 |
| Treated cooling water | 0.0001 |
| City water (hard) | 0.0002 |
| River water | 0.0002-0.0005 |
| Seawater (below 50C) | 0.0001 |
| Seawater (above 50C) | 0.0002 |
| Steam condensate | 0.00009 |
| Refrigerant | 0.0002 |
| Light oil | 0.0002 |
| Heavy oil | 0.0005 |
| Glycol solutions | 0.0002 |
| Data center coolant (treated) | 0.0001 |

### Design U Values (Including Fouling)

| Application | Clean U (W/(m^2 K)) | Design U (W/(m^2 K)) | Fouling Penalty |
|-------------|---------------------|----------------------|----------------|
| Water-water plate HX | 5,000-8,000 | 3,000-5,000 | 30-40% |
| CDU (plate, treated water) | 4,000-6,000 | 2,500-4,000 | 25-35% |
| Water-water shell-and-tube | 1,500-3,000 | 800-2,000 | 30-45% |
| Steam-water shell-and-tube | 2,000-5,000 | 1,500-3,500 | 25-30% |
| Air-water coil (CRAH) | 50-200 | 30-150 | 25-40% |
| Air-air (recuperator) | 10-50 | 8-40 | 20-30% |

**Design practice:** Always use design U (with fouling) for sizing. Schedule cleaning when performance degrades to below design U.

## Plate Heat Exchanger Design

### Corrugation Angle Effect

| Angle | Heat Transfer | Pressure Drop | When to Use |
|-------|--------------|---------------|-------------|
| Low (27-30 deg) | Lower h | Lower DeltaP | Large DeltaT, pressure-limited |
| Medium (45 deg) | Moderate | Moderate | General purpose |
| High (60-63 deg) | Higher h | Higher DeltaP | Small DeltaT, area-limited |

Mixed plates (low + high angle in alternating pattern) provide intermediate performance.

### Design Parameters

| Parameter | Typical Range | Notes |
|-----------|--------------|-------|
| Port-to-port velocity | 0.1-0.3 m/s | Higher = better distribution |
| Channel velocity | 0.2-0.8 m/s | Balance h vs DeltaP |
| Plate spacing | 2-5 mm | Depends on corrugation depth |
| Plate thickness | 0.4-0.6 mm | Stainless steel standard |
| Plate area | 0.02-2.0 m^2 per plate | Depends on frame size |

### Plate Count Estimation

```
N_plates = A_required / A_per_plate + 2 (end plates)
```

Minimum: 10 plates for good flow distribution. Below 10 plates, velocity maldistribution reduces effective U by 10-20%.

## Sizing Worked Example

**Scenario:** CDU sizing for 40 kW GPU rack

**Given:**
- Facility water: 20C supply, 28C return (DeltaT = 8C)
- Server loop: 45C supply, 35C return (DeltaT = 10C)
- Heat load: 40 kW
- Target effectiveness: 0.80

### Step 1: Flow Rates

Facility side:
```
m_dot_fac = Q / (Cp x DeltaT) = 40,000 / (4,182 x 8) = 1.196 kg/s
```

Server side:
```
m_dot_srv = Q / (Cp x DeltaT) = 40,000 / (4,182 x 10) = 0.957 kg/s
```

### Step 2: Heat Capacity Rates

```
C_fac = 1.196 x 4,182 = 5,002 W/K
C_srv = 0.957 x 4,182 = 4,002 W/K

C_min = 4,002 W/K (server side)
C_max = 5,002 W/K (facility side)
C_r = 4,002 / 5,002 = 0.80
```

### Step 3: Verify Effectiveness

```
Q_max = C_min x (T_hot,in - T_cold,in) = 4,002 x (45 - 20) = 100,050 W
epsilon = Q / Q_max = 40,000 / 100,050 = 0.40
```

Note: epsilon = 0.40 is achievable (lower than our 0.80 target). The given temperatures already define the required effectiveness.

### Step 4: NTU from Epsilon-NTU (Counterflow)

```
epsilon = (1 - exp(-NTU(1 - Cr))) / (1 - Cr exp(-NTU(1 - Cr)))
0.40 = (1 - exp(-NTU x 0.20)) / (1 - 0.80 exp(-NTU x 0.20))
```

Solving iteratively: NTU = 0.55

### Step 5: Required Area

Using design U = 3,500 W/(m^2 K) for plate HX with treated water:

```
A = NTU x C_min / U = 0.55 x 4,002 / 3,500 = 0.629 m^2
```

### Step 6: Plate Count

Using 0.04 m^2 plates:

```
N = 0.629 / 0.04 + 2 = 15.7 + 2 = 18 plates (round up)
```

18 plates provides good flow distribution (above 10-plate minimum).

### Step 7: LMTD Cross-Check

```
DeltaT1 = T_hot,in - T_cold,out = 45 - 28 = 17C
DeltaT2 = T_hot,out - T_cold,in = 35 - 20 = 15C
LMTD = (17 - 15) / ln(17/15) = 2 / 0.1254 = 15.9C

A = Q / (U x F x LMTD) = 40,000 / (3,500 x 1.0 x 15.9) = 0.719 m^2
```

Close agreement (0.629 vs 0.719 m^2). Difference due to F assumption and rounding. Use the larger value for conservative design: 0.72 m^2, giving 20 plates.

---
*Heat Exchanger Engineering Deep Reference v1.0.0 -- Thermal Engineering Skill*
*All outputs require verification by a licensed Professional Engineer.*
