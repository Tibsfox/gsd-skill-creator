---
name: pie-thermal-engineering
version: 1.0.0
description: "Thermal engineering for infrastructure: heat transfer (conduction, convection, radiation), cooling load analysis for data centers, heat exchanger sizing via LMTD and e-NTU, PUE/TUE/WUE efficiency metrics, and airflow management patterns. Activates for thermal analysis, data center cooling design, heat exchanger sizing, efficiency calculations, and airflow management."
user-invocable: true
allowed-tools: Read Grep Glob Bash
metadata:
  extensions:
    gsd-skill-creator:
      version: 1
      createdAt: "2026-02-26"
      triggers:
        intents:
          - "heat transfer"
          - "thermal"
          - "conduction"
          - "convection"
          - "radiation"
          - "cooling load"
          - "heat exchanger"
          - "LMTD"
          - "NTU"
          - "PUE"
          - "TUE"
          - "WUE"
          - "airflow"
          - "hot aisle"
          - "cold aisle"
          - "data center cooling"
          - "BTU"
        contexts:
          - "data center thermal analysis"
          - "infrastructure cooling design"
          - "thermal system optimization"
applies_to:
  - skills/physical-infrastructure/**
  - "*.calc"
---

# Thermal Engineering Skill

## At a Glance

Calculate heat transfer, size heat exchangers, and analyze data center thermal performance for infrastructure engineering.

**Activation:** InfrastructureRequest type='thermal', any heat exchanger sizing request, PUE/WUE calculation, airflow management design, or cooling load analysis.

**Key capabilities:**

- Three-mode heat transfer analysis (conduction, convection, radiation) with material property tables
- Thermal resistance networks using electrical circuit analogy
- Data center cooling load breakdown (IT + UPS + lighting + fan/pump + envelope)
- Heat exchanger sizing via LMTD and epsilon-NTU methods
- PUE, TUE, WUE, CUE efficiency metric calculations with target benchmarks
- Airflow management: hot/cold aisle layout, containment systems, raised-floor design

**Integration:** Works in tandem with pie-fluid-systems -- the fluid skill sizes cooling loop pipes and pumps; this skill quantifies the heat and determines exchanger performance.

> ENGINEERING DISCLAIMER: All calculations must be verified by a licensed Professional Engineer before use in construction or installation. HVAC and mechanical codes (ASHRAE 90.1, IMC) impose requirements not captured here. User assumes all responsibility for verification.

**Quick routing:** Heat transfer modes -- see Heat Transfer Fundamentals. Thermal resistance -- see Thermal Resistance Networks. Cooling load -- see Data Center Cooling Load. Heat exchanger sizing -- see Heat Exchanger Sizing. PUE/WUE metrics -- see Efficiency Metrics. Airflow design -- see Airflow Management.

---

## Heat Transfer Fundamentals

### Conduction -- Fourier's Law

Heat transfer through a solid material by molecular vibration, without bulk fluid movement.

```
q = -k x A x (dT/dx)
```

| Variable | Definition | Units |
|----------|-----------|-------|
| q | Heat flow rate | W |
| k | Thermal conductivity | W/(m K) |
| A | Cross-sectional area perpendicular to heat flow | m^2 |
| dT/dx | Temperature gradient | K/m |

**Thermal resistance (conduction):** R_cond = L / (k x A) -- analogous to electrical resistance R = rho L / A

**Thermal conductivity k values:**

| Material | k (W/(m K)) | Application |
|----------|------------|-------------|
| Copper | 385 | Heat sinks, cold plates |
| Aluminum | 205 | Enclosures, fins, cold plates |
| Carbon steel | 50 | Structural, pressure piping |
| Stainless steel 304 | 16 | Corrosion-resistant piping |
| Concrete | 1.4 | Building structure |
| Gypsum board | 0.16 | Wall construction |
| Mineral wool | 0.04 | Pipe insulation |
| Polyurethane foam | 0.025 | Refrigeration insulation |
| Thermal paste (TIM) | 1-8 | CPU/GPU mounting |

### Convection -- Newton's Law of Cooling

Heat transfer between a solid surface and a moving fluid (gas or liquid).

```
q = h x A x (T_surface - T_fluid)
```

| Variable | Definition | Units |
|----------|-----------|-------|
| q | Heat flow rate | W |
| h | Convective heat transfer coefficient | W/(m^2 K) |
| A | Surface area in contact with fluid | m^2 |

**Thermal resistance (convection):** R_conv = 1 / (h x A)

**Convective coefficient h reference values:**

| Flow Type | Medium | h (W/(m^2 K)) |
|-----------|--------|---------------|
| Natural convection | Air | 5-25 |
| Forced convection | Air | 25-250 |
| Forced convection | Water (low velocity) | 500-2,000 |
| Forced convection | Water (high velocity) | 2,000-10,000 |
| Boiling | Water | 3,000-60,000 |
| Condensing | Steam | 5,000-100,000 |

For convection correlations (Nusselt number, Re, Pr relationships) -- @references/heat-transfer.md

### Radiation -- Stefan-Boltzmann Law

Heat transfer via electromagnetic radiation. No medium required.

```
q = epsilon x sigma x A x (T1^4 - T2^4)
```

| Variable | Definition | Value |
|----------|-----------|-------|
| sigma | Stefan-Boltzmann constant | 5.67 x 10^-8 W/(m^2 K^4) |
| epsilon | Surface emissivity | 0 (perfect reflector) to 1 (blackbody) |

**CRITICAL:** Temperatures MUST be in Kelvin (K = C + 273.15) for radiation calculations.

**Emissivity values:**

| Surface | epsilon |
|---------|---------|
| Blackbody (theoretical) | 1.00 |
| Painted steel | 0.90 |
| Glass | 0.90 |
| Oxidized copper | 0.70 |
| Anodized aluminum | 0.80 |
| Polished aluminum | 0.04 |
| Polished stainless steel | 0.10 |

**When radiation matters:** Significant at high temperatures (>200C), large temperature differentials, or vacuum/low-pressure environments. Usually negligible for data center operating temperatures (20-45C); important for outdoor equipment exposed to solar radiation.

For radiation view factors and multi-surface enclosure analysis -- @references/heat-transfer.md

---

## Thermal Resistance Networks

The electrical analogy provides a powerful framework for analyzing complex heat flow paths.

### Analogy

| Thermal Domain | Electrical Domain |
|---------------|------------------|
| Heat flow q (W) | Current I (A) |
| Temperature difference DeltaT (K) | Voltage V (V) |
| Thermal resistance R (K/W) | Electrical resistance R (Ohm) |
| Heat capacity (J/K) | Capacitance (F) |

### Series Network (Heat Path Stack)

When heat must pass through multiple layers in sequence:

```
R_total = R1 + R2 + R3 + ...
q = (T_hot - T_cold) / R_total
```

**Example: Server die to coolant**

```
Total R = R_die-spreading + R_TIM + R_cold-plate-wall + R_cold-plate-convection

R_die    = t_die / (k_silicon x A_die)
R_TIM    = t_TIM / (k_TIM x A_TIM)
R_wall   = t_wall / (k_copper x A_plate)
R_conv   = 1 / (h_coolant x A_internal)
```

Temperature rise: DeltaT_junction = q x R_total. Check against CPU TjMax (typically 95-105C).

### Parallel Network (Multiple Heat Paths)

When heat can take multiple simultaneous paths:

```
1/R_total = 1/R1 + 1/R2 + 1/R3
```

Use when heat splits between paths: fins parallel to base, simultaneous air cooling and liquid cooling. The path with lowest resistance carries the most heat.

### Contact/Interface Resistance

Real surfaces have micro-asperities; actual contact area is only 1-2% of nominal area.

```
R_contact = 1 / (h_c x A)
```

Thermal interface material (TIM) specific resistance values:

| TIM Type | R (K cm^2/W) |
|----------|-------------|
| Thermal grease | 0.1-0.5 |
| Phase-change material | 0.05-0.2 |
| Thermal pad | 0.5-3.0 |
| Indium foil | 0.02-0.1 |
| Solder bond | 0.01-0.05 |

Reduce contact resistance by: smoother surfaces, higher clamping force, high-conductivity TIM.

### Mathematical Connection

Heat flow against a temperature gradient:

```
q = -k nabla T    (Fourier's law in 3D)
```

This is the same mathematical structure as gradient descent in machine learning:

```
theta_{n+1} = theta_n - alpha nabla L(theta)
```

Both describe movement opposing the direction of increasing potential. Parameters move against the loss gradient; heat flows against the temperature gradient. The student who has trained neural network weights already understands the physics of heat conduction.

For thermal network examples and contact resistance data -- @references/heat-transfer.md

---

## Data Center Cooling Load

### Load Components

**IT equipment load** (dominant term, typically 60-80% of total):

```
Q_IT = sum(server_TDP) x diversity_factor
     = rack_count x avg_density_kW x utilization
```

- Diversity factor: 0.7-0.9 (servers rarely run at nameplate continuously)
- Maximum demand method (NEC 220.87 adapted): measured 15-min peak x 1.25

**Lighting:**
- LED: 10-20 W/m^2
- 100% converts to heat (add directly to cooling load)

**UPS losses:**

| UPS Type | At 50% Load | At 100% Load |
|----------|------------|-------------|
| Online double-conversion (VRLA) | 4-6% | 2-3% |
| Online double-conversion (Li-ion) | 1.5-2% | 1-2% |
| Line-interactive | 2-3% | 1-2% |

**Fan/pump power:**
- CRAC/CRAH fans: typically 5-15% of served IT load
- Chilled water pumps: typically 1-3% of IT load
- CDU pumps: typically 1-2% of served rack load

**Envelope loads** (usually <5% for well-insulated interior data halls):
- Solar gain through walls/roof: Q = U x A x CLTD (cooling load temperature difference)
- CLTD depends on orientation, time of day, climate; typically 5-15C for insulated walls
- Interior data halls (no exterior walls): envelope load approximately zero

### Total Cooling Load Calculation

```
Q_cooling = Q_IT x (1 + UPS_loss_fraction) + Q_lighting + Q_fans + Q_envelope
```

Add 15-20% safety margin for future expansion.

### Per-Rack Cooling Approach

| Average Rack Density | Era / Context | Recommended Cooling |
|---------------------|---------------|-------------------|
| 2-5 kW/rack | 2000s legacy | Raised-floor CRAC/CRAH |
| 5-10 kW/rack | 2010s standard | Raised-floor with containment |
| 10-15 kW/rack | Modern enterprise | In-row cooling or rear-door HX |
| 15-30 kW/rack | High-performance | Rear-door HX or in-row CDU |
| 30-50 kW/rack | AI/GPU training | Direct liquid cooling (DTC, CDU required) |
| 50-100+ kW/rack | Dense AI/GPU | Full DTC per ASHRAE TC 9.9 W3-W5 |

---

## Heat Exchanger Sizing

### LMTD Method

Use when both inlet AND outlet temperatures are known (rating existing equipment).

```
Q = U x A x F x LMTD
```

**Log Mean Temperature Difference:**

```
LMTD = (DeltaT1 - DeltaT2) / ln(DeltaT1 / DeltaT2)
```

**For counterflow:**
- DeltaT1 = T_hot,in - T_cold,out
- DeltaT2 = T_hot,out - T_cold,in

**For parallel flow:**
- DeltaT1 = T_hot,in - T_cold,in
- DeltaT2 = T_hot,out - T_cold,out

**F = LMTD correction factor:** 1.0 for pure counterflow; 0.7-0.95 for shell-and-tube or crossflow arrangements.

**Required area:**

```
A = Q / (U x F x LMTD)
```

**Typical overall heat transfer coefficient U:**

| Application | U (W/(m^2 K)) |
|-------------|--------------|
| Water-to-water plate HX | 3,000-8,000 |
| CDU (server-side) | 1,000-3,000 |
| Water-to-air coil (CRAH) | 30-300 |
| Shell-and-tube (water-water) | 800-2,500 |
| Finned tube (air cooler) | 20-80 |

### Epsilon-NTU Method

Preferred when only inlet temperatures are known (sizing new equipment).

**Effectiveness:**

```
epsilon = Q_actual / Q_max = Q_actual / (C_min x (T_hot,in - T_cold,in))
```

**Number of Transfer Units:**

```
NTU = U x A / C_min
```

**Heat capacity rates:**

```
C_hot = m_dot_hot x Cp_hot    (W/K)
C_cold = m_dot_cold x Cp_cold  (W/K)
C_min = smaller of the two
C_r = C_min / C_max
```

**Counterflow effectiveness:**

```
epsilon = (1 - e^(-NTU(1-Cr))) / (1 - Cr x e^(-NTU(1-Cr)))    for Cr != 1
epsilon = NTU / (1 + NTU)                                       for Cr = 1
```

**Design process:**
1. Choose target effectiveness (typically 0.7-0.85 for cost-effective design)
2. Calculate C_min, C_r from flow rates and fluid properties
3. Solve for required NTU from epsilon-NTU relationship
4. Calculate required area: A = NTU x C_min / U

### When to Use Each Method

| Situation | Recommended Method |
|-----------|-------------------|
| Rating existing equipment (all temps known) | LMTD |
| Sizing new equipment (only inlet temps known) | epsilon-NTU |
| Quick check on performance change | epsilon-NTU |
| Multi-pass shell-and-tube design | LMTD with F correction |

For LMTD correction factor charts and epsilon-NTU tables for all flow arrangements -- @references/heat-exchangers.md

---

## Efficiency Metrics

### PUE -- Power Usage Effectiveness

```
PUE = Total Facility Power / IT Equipment Power
```

- **Total includes:** IT, UPS losses, cooling (chillers, towers, pumps, fans), lighting, power conditioning, security
- **Total excludes:** Non-data-center loads on same utility meter
- **Measurement:** Annual average preferred (not instantaneous snapshots)

**PUE benchmarks:**

| PUE | Overhead % | Typical Configuration |
|-----|-----------|----------------------|
| 1.03 | 3% | Hyperscale, outdoor/direct air cooling |
| 1.1 | 10% | Modern enterprise, water-side economizer |
| 1.2 | 20% | Typical new build, air-side economizer |
| 1.5 | 50% | Older facilities, legacy cooling |
| 2.0 | 100% | Very old/inefficient facilities |

### TUE -- Total Usage Effectiveness

```
TUE = IT Equipment Energy / (Total Energy - Energy Reused Externally)
```

Accounts for heat recovery (district heating, absorption cooling, aquifer thermal storage):

```
TUE = PUE x (1 - reuse_fraction)
```

- TUE <= PUE always; equality holds when no heat is reused
- TUE < 1.0 is achievable when heat recovery exceeds cooling overhead
- Example: PUE = 1.3, heat recovery = 25% of total energy => TUE = 1.3 x 0.75 = 0.975

### WUE -- Water Usage Effectiveness

```
WUE = Annual Site Water Usage (L) / Annual IT Equipment Energy (kWh)
```

**Water sources:** Cooling tower evaporation (~90% of water use), humidifiers, chiller heat rejection (if wet-cooled)

**WUE targets:**

| WUE (L/kWh) | Rating | Configuration |
|-------------|--------|---------------|
| 0 | Zero water | Air-cooled, no tower |
| <1.0 | World-class | Minimal evaporative cooling |
| 1.0-2.0 | Good | Moderate tower use |
| 2.0-3.0 | Average | Standard tower cooling |
| >3.0 | Investigate | Excessive water consumption |

**Trade-off:** Evaporative cooling reduces PUE (less compressor energy) but increases WUE (more water).

### CUE -- Carbon Usage Effectiveness

```
CUE = Annual Total CO2 Emissions (kg) / Annual IT Energy (kWh)
CUE = PUE x grid_carbon_intensity (kg CO2/kWh)
```

**Grid carbon intensity by region:**

| Region | kg CO2/kWh | Primary Source |
|--------|-----------|---------------|
| Norway | 0.024 | Hydroelectric |
| France | 0.085 | Nuclear |
| EU average | 0.28 | Mixed |
| US average | 0.39 | Mixed |
| Coal-heavy grids | 0.82+ | Coal/gas |

For PUE measurement methodology (Green Grid Annex A), TUE derivation, and WUE water budget -- @references/dc-efficiency-metrics.md

---

## Airflow Management

### Hot/Cold Aisle Layout

Servers are oriented so front air intakes face into the cold aisle and rear exhausts face into the hot aisle.

- **Cold aisle supply:** 15-27C (ASHRAE A-class), delivered from raised-floor tiles or overhead diffusers
- **Hot aisle return:** 35-45C, returned to CRAC/CRAH inlets
- **Never allow recirculation:** Hot exhaust air must not short-circuit back to cold aisle intakes

### Containment Systems

| Type | Description | PUE Improvement | Preferred When |
|------|-------------|----------------|----------------|
| Cold aisle containment (CAC) | Physical barriers + ceiling panels enclose cold aisle | 0.1-0.2 reduction | Easier retrofit to existing halls |
| Hot aisle containment (HAC) | Physical barriers enclose hot aisle; ducts to CRAC | 0.15-0.25 reduction | New build, highest efficiency |
| Full containment | Both CAC + HAC with separated airstreams | 0.2-0.3 reduction | New high-density builds |
| Chimney cabinet | Per-rack exhaust duct to ceiling plenum | 0.1-0.15 reduction | Single-rack solutions |

**Containment is the single highest-ROI efficiency improvement** for most existing data centers.

### Raised-Floor Airflow

Supply air is delivered from an under-floor plenum through perforated tiles into the cold aisle.

| Parameter | Recommended Value |
|-----------|------------------|
| Plenum height | 18-24 in (minimum 12 in) |
| Tile airflow | 150-500 CFM per tile at 0.05 in WG |
| Plenum pressure | 0.05-0.10 in water gauge |

**Tile placement rules:**
- Cold aisle only -- never place perforated tiles in hot aisles or under power equipment
- Higher-perforation tiles in front of highest-density racks
- Solid tiles under cable trays and between rows

**Blanking panels:** Fill ALL empty rack U-spaces with blanking panels to prevent hot air recirculation. This is the highest-ROI single action for airflow management -- zero capital cost, immediate measurable PUE improvement.

### Economizer Modes

| Mode | Mechanism | Water Use | Best Climate |
|------|-----------|-----------|-------------|
| Air-side (direct) | Outdoor air when T_outdoor < T_setpoint | Zero | Cool/dry climates |
| Water-side (indirect) | Cooling tower when T_wetbulb allows free cooling | Moderate | Temperate climates |
| Evaporative (adiabatic) | Pre-cool supply air via evaporation | High | Hot/dry climates |
| Hybrid | Air-side + evaporative assist | Variable | Wide range |

**Air-side economizer:** Requires air filtration (MERV 11-13 minimum). Humidity control needed to stay within ASHRAE recommended range (20-80% RH). Zero water use makes this the preferred option for WUE optimization.

**Water-side economizer:** Cooling tower provides free cooling when wet-bulb temperature is sufficiently below chilled water supply setpoint. Typical switchover: wet-bulb < supply setpoint - 3C.

---

## Reference Documents

| Reference | When to Read | Coverage |
|-----------|-------------|----------|
| @references/heat-transfer.md | Convection correlations, radiation view factors, contact resistance | Deep heat transfer theory |
| @references/heat-exchangers.md | LMTD F-factor charts, epsilon-NTU tables, fouling factors, U values | Heat exchanger engineering |
| @references/dc-efficiency-metrics.md | PUE measurement protocol, TUE derivation, WUE water budget | Data center KPI methodology |

---
*Thermal Engineering Skill v1.0.0 -- Physical Infrastructure Engineering Pack*
*Phase 435-02 | References: ASHRAE 90.1, ASHRAE TC 9.9, Green Grid WP#32, ASHRAE Fundamentals 2021*
*All outputs require verification by a licensed Professional Engineer.*
