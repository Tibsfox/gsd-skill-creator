# NEC Conductor Sizing — Deep Reference

*Power Systems Skill — Full NEC Table 310.16 and correction factors*

## Full NEC Table 310.16 — Copper Conductors in Raceway (NEC 2023)

Allowable ampacities of insulated copper conductors rated 0-2000V, not more than three current-carrying conductors in raceway, ambient temperature 30 deg C (86 deg F).

### Copper Conductors

| AWG / kcmil | 60 deg C (TW, UF) | 75 deg C (THWN, XHHW) | 90 deg C (THWN-2, XHHW-2) |
|-------------|-------------------|----------------------|---------------------------|
| 14 | 15 | 20 | 25 |
| 12 | 20 | 25 | 30 |
| 10 | 30 | 35 | 40 |
| 8 | 40 | 50 | 55 |
| 6 | 55 | 65 | 75 |
| 4 | 70 | 85 | 95 |
| 3 | 85 | 100 | 115 |
| 2 | 95 | 115 | 130 |
| 1 | 110 | 130 | 150 |
| 1/0 | 125 | 150 | 170 |
| 2/0 | 145 | 175 | 195 |
| 3/0 | 165 | 200 | 225 |
| 4/0 | 195 | 230 | 260 |
| 250 kcmil | 215 | 255 | 290 |
| 300 kcmil | 240 | 285 | 320 |
| 350 kcmil | 260 | 310 | 350 |
| 400 kcmil | 280 | 335 | 380 |
| 500 kcmil | 320 | 380 | 430 |
| 600 kcmil | 355 | 420 | 475 |
| 700 kcmil | 385 | 460 | 520 |
| 750 kcmil | 400 | 475 | 535 |
| 800 kcmil | 410 | 490 | 555 |
| 900 kcmil | 435 | 520 | 585 |
| 1000 kcmil | 455 | 545 | 615 |

**Usage notes:**
- **75 deg C column** is standard for most commercial and industrial installations because equipment terminals are typically rated 60 deg C or 75 deg C
- **90 deg C column** may be used only for ampacity derating calculations (temperature and conduit fill corrections); final ampacity must not exceed the terminal temperature rating
- **60 deg C column** required when connected to equipment with 60 deg C terminals (common on small residential panels and breakers <= 100A)
- Same values available programmatically via `getAmpacity()` in engineering-constants.ts

### Aluminum Conductor Ampacity

Aluminum conductors carry approximately 80% of copper ampacity at the same temperature rating. Use aluminum when cost savings justify larger conduit and termination requirements.

| AWG / kcmil | 60 deg C | 75 deg C | 90 deg C |
|-------------|----------|----------|----------|
| 12 | 15 | 20 | 25 |
| 10 | 25 | 30 | 35 |
| 8 | 30 | 40 | 45 |
| 6 | 40 | 50 | 60 |
| 4 | 55 | 65 | 75 |
| 3 | 65 | 75 | 85 |
| 2 | 75 | 90 | 100 |
| 1 | 85 | 100 | 115 |
| 1/0 | 100 | 120 | 135 |
| 2/0 | 115 | 135 | 150 |
| 3/0 | 130 | 155 | 175 |
| 4/0 | 150 | 180 | 205 |
| 250 kcmil | 170 | 205 | 230 |
| 300 kcmil | 190 | 230 | 260 |
| 350 kcmil | 210 | 250 | 280 |
| 400 kcmil | 225 | 270 | 305 |
| 500 kcmil | 260 | 310 | 350 |
| 600 kcmil | 285 | 340 | 385 |
| 700 kcmil | 310 | 375 | 425 |
| 750 kcmil | 320 | 385 | 435 |
| 800 kcmil | 330 | 395 | 450 |
| 900 kcmil | 355 | 425 | 480 |
| 1000 kcmil | 375 | 445 | 500 |

**When to use aluminum:** Feeders >100A where cost savings justify larger conduit. Aluminum requires anti-oxidant compound on all terminations and larger wire size to match copper ampacity. Never use aluminum for branch circuits in data centers.

## Temperature Correction Factors (NEC Table 310.15(B)(1))

Apply when ambient temperature exceeds 30 deg C (86 deg F):

| Ambient Temp (deg C) | 60 deg C Insulation | 75 deg C Insulation | 90 deg C Insulation |
|-----------------------|--------------------|--------------------|---------------------|
| 21-25 | 1.08 | 1.05 | 1.04 |
| 26-30 | 1.00 | 1.00 | 1.00 |
| 31-35 | 0.91 | 0.94 | 0.96 |
| 36-40 | 0.82 | 0.87 | 0.91 |
| 41-45 | 0.71 | 0.82 | 0.87 |
| 46-50 | 0.58 | 0.75 | 0.82 |
| 51-55 | 0.41 | 0.67 | 0.76 |
| 56-60 | — | 0.58 | 0.71 |
| 61-65 | — | 0.47 | 0.65 |
| 66-70 | — | 0.33 | 0.58 |
| 71-75 | — | — | 0.50 |
| 76-80 | — | — | 0.41 |

**Data center applications:** Hot aisle containment can reach 40-45 deg C. Cables routed through the hot aisle require 0.87 correction factor for 75 deg C insulation. Route cables through cold aisle or overhead trays outside containment when possible to avoid derating.

**Using 90 deg C column for derating:** If ambient is 50 deg C and you have 90 deg C rated wire, ampacity is the 90 deg C column value x 0.82. However, if the terminal is rated 75 deg C, the final ampacity cannot exceed the 75 deg C column value. The 90 deg C rating gives you "room" for corrections.

## Conduit Fill Correction (NEC Table 310.15(C)(1))

Apply when more than three current-carrying conductors are in a single raceway:

| Number of Current-Carrying Conductors | Correction Factor |
|---------------------------------------|-------------------|
| 1-3 | 1.00 |
| 4-6 | 0.80 |
| 7-9 | 0.70 |
| 10-20 | 0.50 |
| 21-30 | 0.45 |
| 31-40 | 0.40 |
| 41+ | 0.35 |

**Counting rules:**
- Neutral conductors that carry only unbalanced load are NOT counted (NEC 310.15(E))
- Exception: neutral on 3-phase, 4-wire wye with nonlinear loads IS counted (harmonics on neutral)
- Equipment grounding conductors are NOT counted
- Spare conductors pulled into conduit but not terminated are NOT counted

**Combined correction example:** 8 AWG copper in conduit with 8 conductors at 45 deg C ambient:
- Base ampacity (75 deg C): 50A
- Temperature correction: x 0.82
- Conduit fill correction: x 0.70
- Derated ampacity: 50 x 0.82 x 0.70 = **28.7A**

## Voltage Drop Calculations

### Conductor Resistance (NEC Chapter 9, Table 9)

Resistance of copper conductors at 75 deg C, effective Z at 0.85 PF, in steel conduit:

| Wire Size | DC Resistance (ohm/1000ft) | AC Impedance (ohm/1000ft) |
|-----------|--------------------------|--------------------------|
| 14 AWG | 3.14 | 3.14 |
| 12 AWG | 1.98 | 1.98 |
| 10 AWG | 1.24 | 1.24 |
| 8 AWG | 0.778 | 0.78 |
| 6 AWG | 0.491 | 0.49 |
| 4 AWG | 0.308 | 0.31 |
| 3 AWG | 0.245 | 0.25 |
| 2 AWG | 0.194 | 0.20 |
| 1 AWG | 0.154 | 0.16 |
| 1/0 AWG | 0.122 | 0.13 |
| 2/0 AWG | 0.0967 | 0.10 |
| 3/0 AWG | 0.0766 | 0.082 |
| 4/0 AWG | 0.0608 | 0.067 |
| 250 kcmil | 0.0515 | 0.057 |
| 300 kcmil | 0.0429 | 0.049 |
| 350 kcmil | 0.0367 | 0.043 |
| 400 kcmil | 0.0321 | 0.038 |
| 500 kcmil | 0.0258 | 0.032 |

### Voltage Drop Formulas

**Single-phase:**
V_drop = (2 x L_ft x I_A x R_per_1000ft) / 1000

**Three-phase:**
V_drop = (1.732 x L_ft x I_A x R_per_1000ft) / 1000

**Percentage:**
V_drop_% = (V_drop / V_source) x 100

### Worked Example

**Given:** 200A load at 480V 3-phase, 200-foot feeder run.

**Step 1:** Select conductor for ampacity — 200A requires 4/0 AWG copper (230A at 75 deg C).

**Step 2:** Calculate voltage drop — V_drop = (1.732 x 200 x 200 x 0.067) / 1000 = 4.64V

**Step 3:** Percentage — 4.64 / 480 = 0.97% (well within 3% limit)

**Step 4:** If the run were 600 feet — V_drop = (1.732 x 200 x 600 x 0.067) / 1000 = 13.9V = 2.9% (borderline; upsize to 250 kcmil or 300 kcmil for margin)

## Parallel Conductors (NEC 310.10(H))

When single conductors cannot carry the required load, parallel conductors are permitted:

**Rules:**
- Minimum size: 1/0 AWG per conductor in each parallel set
- Same length for all conductors in the parallel set
- Same conductor material (all copper or all aluminum)
- Same ampacity rating (same insulation type)
- Same raceway type per conductor set
- Terminate at same point — use parallel lug kits

**Sizing example:** 800A load requires ampacity that exceeds single conductor capability.
- Two parallel sets of 500 kcmil (380A each at 75 deg C) = 760A — insufficient
- Two parallel sets of 600 kcmil (420A each) = 840A — adequate
- Or three parallel sets of 350 kcmil (310A each) = 930A — adequate with better conduit fill

**Benefits:** Easier installation (lighter individual conductors), better heat dissipation per conductor, flexibility in routing through existing penetrations.

---
*Deep reference for Power Systems Skill — NEC Table 310.16 conductor sizing*
*Source: NFPA 70 (NEC 2023), Chapter 9 Table 9*
