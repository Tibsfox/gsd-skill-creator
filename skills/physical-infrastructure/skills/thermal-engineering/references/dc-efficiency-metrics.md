# Data Center Efficiency Metrics -- Deep Reference

*Thermal Engineering Skill -- PUE measurement, TUE, WUE, CUE methodology*

---

## PUE Measurement Protocol (Green Grid)

### Measurement Boundary

The Green Grid defines PUE measurement at three levels of precision:

| Level | IT Power Measurement Point | Total Power Measurement Point | Accuracy |
|-------|---------------------------|-------------------------------|----------|
| Level 1 (basic) | UPS output | Utility meter | +/- 10-15% |
| Level 2 (standard) | PDU output | Utility meter + sub-meters | +/- 5-10% |
| Level 3 (advanced) | Server-level metering | Full sub-metering per system | +/- 2-5% |

**IT Power measurement:**
- Level 1: UPS output power (includes UPS-to-rack distribution losses in IT term)
- Level 2: PDU output power (more accurate, excludes branch circuit losses)
- Level 3: Sum of individual server/network/storage power draw

**Total Facility Power measurement:**
- Everything on the data center utility meter
- Includes: IT, cooling, UPS, lighting, security, fire suppression controls, generator transfer switches
- Excludes: office space, cafeteria, parking (if on same meter, subtract via sub-metering)

### Averaging Period

| Period | Use Case | Notes |
|--------|---------|-------|
| Instantaneous | Troubleshooting, commissioning | Misleading for reporting (varies with outdoor temp, IT load) |
| 15-minute intervals | Trending, optimization | Good granularity for identifying efficiency patterns |
| Monthly average | Seasonal analysis | Shows economizer impact across seasons |
| Annual average | Official reporting | Gold standard; accounts for all seasonal variation |

**Reporting:** Always report annual average PUE. Instantaneous PUE on a cool night with low IT load can be deceptively low.

### Boundary Disputes

**On-site solar generation:**
- Green Grid recommendation: do not subtract solar from total facility power for PUE calculation
- Solar reduces CUE (carbon), not PUE (efficiency)
- Rationale: PUE measures infrastructure efficiency, not energy source

**Generator fuel:**
- During utility outage, use generator output as total facility power
- Generator efficiency losses are upstream of the data center boundary

**Shared building:**
- Sub-meter data center loads separately
- Allocate shared services (fire suppression, security) proportionally by floor area

## PUE Categories and Partial PUE

The Green Grid defines partial PUE (pPUE) for subsystem benchmarking:

### Partial PUE by Subsystem

```
pPUE_cooling = (P_IT + P_cooling) / P_IT
pPUE_UPS     = (P_IT + P_UPS_losses) / P_IT
pPUE_lighting = (P_IT + P_lighting) / P_IT
pPUE_other   = (P_IT + P_other) / P_IT
```

**Relationship:**

```
PUE = 1 + (pPUE_cooling - 1) + (pPUE_UPS - 1) + (pPUE_lighting - 1) + (pPUE_other - 1)
```

### Typical pPUE Breakdown

| Subsystem | pPUE Contribution | % of Overhead | Improvement Opportunity |
|-----------|------------------|---------------|------------------------|
| Cooling | 0.15-0.60 | 50-70% | Economizer, raise setpoints, containment |
| UPS | 0.03-0.08 | 10-20% | Higher-efficiency UPS, eco-mode |
| Power distribution | 0.02-0.05 | 5-12% | Higher voltage (480V), fewer transformations |
| Lighting | 0.01-0.02 | 2-5% | LED, occupancy sensors |
| Other | 0.01-0.03 | 3-8% | Security, fire suppression, CCTV |

**Priority:** Cooling is always the largest overhead component. Target cooling efficiency first.

### PUE Improvement Strategies

| Strategy | PUE Reduction | Capital Cost | Payback |
|----------|--------------|-------------|---------|
| Blanking panels + sealing | 0.05-0.10 | Very low | <6 months |
| Hot/cold aisle containment | 0.10-0.20 | Low-moderate | 6-18 months |
| Raise cold aisle setpoint (to 27C) | 0.05-0.10 | Zero | Immediate |
| Water-side economizer | 0.10-0.30 | Moderate | 1-3 years |
| Air-side economizer | 0.15-0.40 | Moderate | 1-2 years |
| Direct liquid cooling (DTC) | 0.10-0.25 | High | 2-4 years |
| High-efficiency UPS (eco-mode) | 0.02-0.04 | Low | 1-2 years |

## TUE Full Derivation

### Definition

Total Usage Effectiveness accounts for energy reused externally (heat recovery):

```
TUE = IT_energy / (Total_energy - Reused_energy)
```

Alternatively:

```
TUE = PUE x (1 - reuse_fraction)
```

Where reuse_fraction = Reused_energy / Total_energy.

### Forms of Energy Reuse

| Reuse Method | Temperature Required | Typical Recovery % | Application |
|-------------|---------------------|-------------------|-------------|
| District heating | >55C return water | 10-40% of total | Nordic climates, campus settings |
| Absorption chilling | >80C (double-effect) | 5-15% | Converting waste heat to cooling |
| Aquifer thermal storage | >30C | 10-25% | Seasonal storage for heating |
| Swimming pool heating | >30C | 2-5% | Community integration |
| Snow melting | >25C | 1-3% | Winter climates, parking, walkways |

### TUE Calculation Example

**Scenario:** Data center, PUE = 1.30, annual total energy = 10,000 MWh, heat recovery to district heating = 2,500 MWh

```
Reuse_fraction = 2,500 / 10,000 = 0.25
TUE = 1.30 x (1 - 0.25) = 1.30 x 0.75 = 0.975
```

TUE < 1.0 means the data center provides more useful energy (IT + heat) than it consumes from the grid. This is achievable with W4/W5 water class and district heating integration.

### TUE < 1.0 Interpretation

When TUE < 1.0, the data center is a net energy contributor to the community. This reframes the data center from "energy consumer" to "heat source" -- a significant narrative shift for sustainability reporting.

**Conditions for TUE < 1.0:**
- PUE < 1.5 (reasonable infrastructure efficiency)
- Heat recovery > 1/3 of total energy
- Practical only with W4/W5 water class (return water hot enough for district heating)

## WUE Annual Calculation

### Monthly Water Budget

For each month, calculate water consumption from each source:

**Cooling tower evaporation:**

```
V_evap (L/month) = Q_rejected (kW) x hours x 3.6 / (h_fg x rho_water)
```

Where h_fg = latent heat of vaporization (2,260 kJ/kg at 100C, but evaporation occurs at lower temperatures; use 2,400 kJ/kg at 30C).

Simplified: approximately 1.5 L/kWh of heat rejected for a standard cooling tower.

**Humidifier consumption:**

```
V_humid (L/month) = humidifier_capacity (L/h) x operating_hours
```

Operating hours depend on climate and air-side economizer use. Desert climates: 2,000-4,000 hr/yr. Humid climates: 500-1,000 hr/yr.

**Blowdown (cooling tower):**

```
V_blowdown = V_evap / (cycles_of_concentration - 1)
```

Typical cycles of concentration: 3-5 (higher = less blowdown = less water). Limited by water chemistry (scaling, corrosion).

### Annual WUE Calculation

```
WUE = (V_evap_annual + V_humid_annual + V_blowdown_annual) / IT_energy_annual
```

Units: L/kWh (note: some references use gallons/kWh -- specify units explicitly).

### WUE Reduction Strategies

| Strategy | WUE Reduction | Trade-off |
|----------|--------------|-----------|
| Air-side economizer (eliminate tower) | 100% reduction | Requires filtration, humidity control |
| Higher cycles of concentration | 20-40% blowdown reduction | Water treatment cost increases |
| Increase condenser water setpoint | 10-20% evaporation reduction | Chiller works harder (PUE may increase) |
| Dry cooler for shoulder seasons | 30-50% seasonal reduction | Capital cost for additional equipment |
| Water-free cooling (adiabatic pre-cool) | Variable | Different water consumption profile |

## Benchmarking and Industry Data

### PUE by Facility Type

| Facility Type | Average PUE | Range |
|--------------|-------------|-------|
| Hyperscale cloud (Google, Meta, Microsoft) | 1.10-1.12 | 1.06-1.20 |
| Large enterprise (Fortune 500) | 1.40-1.60 | 1.20-2.00 |
| Colocation (Tier III) | 1.30-1.50 | 1.15-1.80 |
| Small/medium enterprise | 1.80-2.20 | 1.40-3.00 |
| Legacy (>15 years old) | 2.00-2.50 | 1.80-3.50 |

### PUE by Uptime Institute Tier

| Tier | Typical PUE | Redundancy | Uptime Target |
|------|-------------|-----------|---------------|
| Tier I | 2.0+ | N (no redundancy) | 99.671% |
| Tier II | 1.8 | N+1 | 99.741% |
| Tier III | 1.5 | N+1, dual path | 99.982% |
| Tier IV | 1.4 | 2N+1, fault tolerant | 99.995% |

**Observation:** Higher tiers historically meant higher PUE (more redundant equipment running at partial load). Modern Tier III/IV designs achieve 1.2-1.3 with advanced cooling and VFD optimization.

### Industry Targets and Standards

| Standard/Program | PUE Target | Scope |
|-----------------|-----------|-------|
| EU Code of Conduct (new builds) | < 1.30 | European Union |
| EPA Energy Star for Data Centers | Top 25% benchmark | United States |
| Singapore BCA Green Mark | < 1.40 (Platinum) | Singapore |
| LEED v4 (data center credit) | Demonstrate improvement | Global |
| Open Compute Project | < 1.10 (design target) | Industry consortium |

## Carbon-Optimal Operation

### Time-Varying Carbon Intensity

Grid carbon intensity varies by hour due to renewable generation, demand patterns, and dispatch order:

```
CUE = sum(P_total(t) x CI(t), t=0..T) / sum(P_IT(t), t=0..T)
```

Where CI(t) = grid carbon intensity at time t (kg CO2/kWh).

### Carbon-Aware Scheduling

Shift deferrable workloads (batch processing, model training, backups) to low-carbon hours:

| Grid Condition | CI Typical | Strategy |
|---------------|-----------|----------|
| High renewables (midday solar, windy nights) | 0.05-0.15 | Schedule batch jobs |
| Shoulder periods | 0.20-0.40 | Normal operation |
| Peak demand (gas peakers) | 0.50-0.80 | Defer non-critical loads |
| Coal-heavy hours | 0.80+ | Maximum deferral |

### Carbon Reduction Hierarchy

1. **Reduce PUE** (less total energy for same IT) -- infrastructure efficiency
2. **Green energy procurement** (PPAs, RECs) -- supply decarbonization
3. **Carbon-aware scheduling** -- temporal load shifting
4. **On-site generation** (solar, fuel cells) -- local clean generation
5. **Heat recovery** (reduce community fossil heat) -- system-level impact

### Renewable Energy Accounting

| Method | Carbon Impact | Cost | Credibility |
|--------|--------------|------|------------|
| Behind-the-meter solar | Direct reduction | High upfront, low LCOE | Highest (physical connection) |
| Power Purchase Agreement (PPA) | Contractual claim | Market rate | High (additionality) |
| Renewable Energy Certificate (REC) | Market claim | Low | Moderate (may not be additional) |
| Carbon offsets | Compensatory | Variable | Low-moderate (quality varies) |

**Best practice:** Prioritize behind-the-meter and PPA. Use RECs as supplement. Minimize reliance on offsets.

---
*Data Center Efficiency Metrics Deep Reference v1.0.0 -- Thermal Engineering Skill*
*All outputs require verification by a licensed Professional Engineer.*
