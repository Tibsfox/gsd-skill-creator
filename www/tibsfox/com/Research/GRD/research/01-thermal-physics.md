# The Same Equation

> **Domain:** Thermal Physics Fundamentals
> **Module:** 1 -- Heat Transfer, Heat Pumps, and Radiative Cooling
> **Through-line:** *Every thermal system on Earth -- and off it -- solves the same differential equation. A gradient exists between where heat is and where it should be. Something mediates the flow. The engineering is choosing what mediates and how fast. The only thing that changes across scales is the boundary conditions.*

---

## Table of Contents

1. [The Gradient Interception Model](#1-the-gradient-interception-model)
2. [Heat Pump Thermodynamics](#2-heat-pump-thermodynamics)
3. [COP and the Cold-Climate Challenge](#3-cop-and-the-cold-climate-challenge)
4. [Radiative Cooling Physics](#4-radiative-cooling-physics)
5. [Thermal Storage Technologies](#5-thermal-storage-technologies)
6. [The Scale Architecture](#6-the-scale-architecture)
7. [Cross-References](#7-cross-references)
8. [Sources](#8-sources)

---

## 1. The Gradient Interception Model

The electric alternative to combustion does not manufacture a gradient. It *intercepts* one [1]:

- A **heat pump** does not create heat. It moves heat that already exists in ambient air, ground, or water, using electricity to do the thermodynamic lifting.
- A **radiative cooling surface** does not consume energy to reject heat. It exploits the 297-kelvin gradient between the Earth's surface and the 3-kelvin cosmic microwave background, radiating thermal energy through the atmospheric transparency window at 8-13 micrometres.
- A **Peltier junction** moves heat across a semiconductor boundary using electron flow, not flame.

The transition from combustion to interception is not merely a fuel swap. It is a change in the relationship between human habitation and the thermodynamic environment -- from adversarial (burn fuel to fight the gradient) to cooperative (use electricity to ride the gradient that already exists).

---

## 2. Heat Pump Thermodynamics

Heat pumps currently available operate at 3 to 5 times the energy efficiency of natural gas boilers, according to the IEA's Future of Heat Pumps report [2].

### 2.1 Coefficient of Performance (COP)

COP is the ratio of thermal energy delivered to electrical energy consumed:

| Ambient Temperature | Air-Source COP | Ground-Source COP |
|--------------------|----------------|-------------------|
| Above 5C (41F) | 3.0-4.0 | 3.5-5.0 |
| 0C to 5C (32-41F) | 2.5-3.5 | 3.0-4.5 |
| -10C to 0C (14-32F) | 1.5-2.5 | 3.0-4.0 |
| Below -18C (0F) | 1.0-1.5 | 2.5-3.5 |

Ground-source systems maintain higher COPs because soil temperature remains relatively stable (8-15C year-round at depth).

### 2.2 Variable-Speed Inverter Compressors

The most significant recent efficiency advance: inverter-driven compressors that modulate continuously, matching output to load. Unlike single-speed units that cycle on/off, inverters eliminate cycling losses, reduce temperature swings, and improve seasonal COP by 15-30% [2].

---

## 3. COP and the Cold-Climate Challenge

COP degrades with falling ambient temperature. At 0F (-18C), air-source heat pump efficiency approaches resistive heating (COP near 1.0). Solutions [2][3]:

### 3.1 Cold-Climate Air-Source Heat Pumps (ccASHP)

Enhanced vapor injection (EVI) compressor technology maintains useful COP of 1.5-2.0 at temperatures as low as -15F. These units are rated for cold-climate operation and include defrost cycles for frost management.

### 3.2 Cascade Systems

CO2 transcritical cycles on the low-temperature side paired with conventional refrigerant on the high side extend useful operation to -25C and below. The cascade approach uses each refrigerant in its optimal temperature range.

### 3.3 Dual-Fuel Transitional

Heat pump as primary heating down to a switchover point (typically 25-35F), with existing gas furnace as backup below that temperature. Planned sunset date for the gas equipment.

---

## 4. Radiative Cooling Physics

Passive daytime radiative cooling (PDRC) exploits the atmospheric transparency window between 8 and 13 micrometres, through which thermal infrared radiation escapes directly to outer space (approximately 3K) [4][5]:

### 4.1 Performance Data

| Study/Product | Cooling Power | Solar Reflectance | Notes |
|--------------|---------------|-------------------|-------|
| Stanford 2014 (photonic structure) | Sub-ambient under direct sun | >97% | First demonstration |
| Purdue ultra-white paint (BaSO4) | 4.5C below ambient | 98.1% | Commercial potential |
| SkyCool Systems (CEC pilot) | 6C below ambient (fluid) | High | Roof panels, 10%+ condenser savings |
| Metamaterial films | 30-100 W/m2 | Variable | Laboratory to pilot stage |

### 4.2 The Theoretical Maximum

For a surface with ideal spectral properties (perfect solar reflection, perfect emission in the atmospheric window), theoretical cooling power is approximately 100-150 W/m2. Current commercial systems achieve 30-60% of this theoretical maximum.

---

## 5. Thermal Storage Technologies

| Technology | Temperature Range | Round-Trip Efficiency | Application |
|-----------|-------------------|----------------------|-------------|
| Sensible (water tanks) | 20-90C | 80-95% | Domestic hot water, building heat |
| Phase-change materials (PCM) | 20-60C (paraffin), higher (salt hydrate) | 70-90% | Building envelope, cold storage |
| Thermochemical | 100-500C | 50-70% | Industrial process heat |
| Seasonal borehole | Annual cycle | 50-70% | District heating (Danish systems) |
| Seasonal aquifer | Annual cycle | 60-80% | Large-scale community heating |

Seasonal thermal energy storage -- borehole, aquifer, and pit systems -- stores summer excess heat underground for winter use. Danish district heating systems have demonstrated 50-70% round-trip efficiency with seasonal borehole storage [6].

---

## 6. The Scale Architecture

Every node in the Gradient Engine contains the same three-part analysis [1]:

```
[Current fossil system] --> [Electric replacement] --> [Transition pathway]
[Passive thermal]       --> [Active electric]      --> [Hybrid optimal]

SCALES:
  Micro (wearables, EVs, trains, aircraft, submarines)
  Residential (single-family through high-rise)
  Commercial (small business through skyscrapers)
  Industrial (process heat to 200C+)
  Vessels (ships, offshore, mobile structures)
  Space (LEO, deep space, lunar/Mars)

THROUGH-LINE: Same dQ/dt equation, different boundary conditions
```

---

## 7. Cross-References

| Project | Connection |
|---------|------------|
| [BPS](../BPS/index.html) | Signal processing applied to thermal data; biological thermoregulation |
| [THE](../THE/index.html) | Thermal gradients; energy transfer fundamentals |
| [CAS](../CAS/index.html) | Elevation-dependent temperature gradients; alpine thermal challenges |
| [ECO](../ECO/index.html) | Ecological thermal gradients; species temperature tolerance ranges |
| [MPC](../MPC/index.html) | Mathematical computation of COP curves; optimization of thermal systems |

---

## 8. Sources

1. The Gradient Engine Mission Package (GSD, March 11, 2026).
2. IEA, "The Future of Heat Pumps," World Energy Outlook special report.
3. IEA, "Global Energy Review 2025," heat pump deployment data.
4. Zhao et al. (2025). "Progress in passive daytime radiative cooling." *Carbon Future*, 2(1).
5. California Energy Commission, "Radiative Sky Cooling-Enabled Efficiency Improvements," CEC-500-2025-002.
6. Danish Energy Agency, "District Heating and Seasonal Thermal Storage."
