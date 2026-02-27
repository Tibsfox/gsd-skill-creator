# Data Center Efficiency Metrics -- Deep Reference

*Thermal Engineering Skill -- PUE measurement, TUE, WUE, CUE methodology*

---

## PUE Measurement Protocol (Green Grid)

### Measurement Boundary

PUE requires clear boundary definitions for both the numerator (total facility power) and denominator (IT equipment power).

**Total facility power** (measured at utility meter or ATS output):

| Include | Exclude |
|---------|---------|
| IT equipment (servers, storage, network) | Office space on shared meter |
| UPS and power distribution losses | Tenant/colocation customer loads (if separate meter) |
| Cooling (chillers, pumps, fans, towers) | Construction power |
| Lighting within data center boundary | External campus lighting |
| Security systems (CCTV, access control) | Non-data-center mechanical systems |
| Fire suppression power | |
| Generator/switchgear parasitic loads | |

**IT equipment power** (measured at PDU output or server input):

| Measurement Point | Accuracy | Ease |
|-------------------|----------|------|
| Utility meter minus non-IT submeters | Low (estimated) | Easy |
| UPS output (before PDU) | Medium | Moderate |
| PDU output (closest to IT) | High | Best for reporting |
| Server-level (BMC/IPMI) | Highest | Difficult at scale |

### Averaging Period

| Period | Use Case | Notes |
|--------|---------|-------|
| Instantaneous (1 min) | Troubleshooting, commissioning | Highly variable, not for reporting |
| Hourly | Trending, anomaly detection | Shows diurnal patterns |
| Monthly | Operational reporting | Captures seasonal variation |
| Annual | Benchmarking, regulatory reporting | Preferred by Green Grid, ASHRAE |

**Best practice:** Collect 15-minute interval data. Report annual average. Include measurement uncertainty (+/- 5% is typical for metered PUE).

### Common Measurement Pitfalls

- **Generator testing:** Generator runs add fuel-equivalent power but may not be metered electrically. Exclude test runs from PUE calculation or note as adjustment.
- **On-site solar:** Solar reduces utility meter reading, artificially lowering total facility power. Report PUE with and without solar offset for transparency.
- **Shared building loads:** If data center shares a building, submeter data center boundary loads. Estimating shared loads introduces error.
- **IT load changes:** PUE improves as IT load increases (fixed cooling overhead spread over more IT). Do not compare PUE between data centers at different utilizations without normalizing.

## PUE Categories and Partial PUE

### Partial PUE (pPUE) for Subsystem Benchmarking

The Green Grid defines partial PUE to isolate overhead contributions from individual subsystems:

```
pPUE_cooling = (P_IT + P_cooling) / P_IT
pPUE_UPS     = (P_IT + P_UPS_losses) / P_IT
pPUE_lighting = (P_IT + P_lighting) / P_IT
```

**Total PUE decomposition:**

```
PUE = 1 + (P_cooling + P_UPS_losses + P_lighting + P_other) / P_IT
    = 1 + overhead_cooling + overhead_UPS + overhead_lighting + overhead_other
```

### Typical pPUE Breakdown

| Subsystem | Overhead Contribution | % of Total Overhead |
|-----------|----------------------|---------------------|
| Cooling | 0.10-0.40 | 50-70% |
| UPS/power distribution | 0.03-0.10 | 15-25% |
| Lighting | 0.01-0.03 | 3-8% |
| Other (security, fire) | 0.01-0.02 | 2-5% |

Cooling is the largest overhead contributor in most facilities. Reducing cooling overhead has the greatest impact on PUE.

### PUE by Cooling Technology

| Technology | Typical pPUE_cooling | Notes |
|------------|---------------------|-------|
| Direct expansion (DX) CRAC | 1.30-1.50 | Least efficient, legacy |
| Chilled water CRAH | 1.15-1.30 | Standard modern |
| Water-side economizer | 1.05-1.15 | Moderate climate benefit |
| Air-side economizer | 1.03-1.10 | Cool/dry climate |
| Direct liquid cooling (DTC) | 1.02-1.08 | Minimal fan power |
| Immersion cooling | 1.01-1.05 | Near-zero air movement |

## TUE Full Derivation

### Concept

Total Usage Effectiveness accounts for energy reuse -- heat exported from the data center for external beneficial use.

```
TUE = E_IT / (E_total - E_reused)
```

Where:
- E_IT = annual IT equipment energy consumption (kWh)
- E_total = annual total facility energy consumption (kWh)
- E_reused = annual energy exported for external reuse (kWh)

### Relationship to PUE

```
PUE = E_total / E_IT
TUE = E_IT / (E_total - E_reused) = 1 / (PUE - E_reused/E_IT)
```

Or equivalently:

```
TUE = PUE x (1 - reuse_fraction)
```

Where reuse_fraction = E_reused / E_total.

### Reuse Energy Sources

| Source | Typical Temperature | Reuse Application |
|--------|-------------------|-------------------|
| Server exhaust air | 35-45C | Preheating office ventilation |
| CDU return water | 40-55C | District heating (with boost) |
| Hot water cooling (W5) | >55C | District heating (direct) |
| Condenser heat rejection | 30-40C | Greenhouse heating, aquaculture |
| Absorption chiller input | >80C (requires boost) | Chilled water generation |

### TUE Examples

| Scenario | PUE | Reuse % | TUE | Notes |
|----------|-----|---------|-----|-------|
| No heat recovery | 1.30 | 0% | 1.30 | TUE = PUE |
| Moderate district heating | 1.25 | 15% | 1.06 | Nordic climate typical |
| Aggressive heat recovery | 1.20 | 30% | 0.84 | TUE < 1 is possible |
| Hyperscale with full recovery | 1.10 | 40% | 0.66 | Theoretical best case |

TUE < 1.0 means the data center delivers more useful energy (IT processing + exported heat) than it consumes. This is the goal for sustainable data center operations.

## WUE Annual Calculation

### Water Sources in Data Center Operations

| Source | Typical Consumption | % of Total |
|--------|-------------------|------------|
| Cooling tower evaporation | 1.5-3.0 L per kWh rejected | 70-90% |
| Cooling tower blowdown | 0.3-1.0 L per kWh rejected | 10-20% |
| Humidifier makeup | 0.1-0.5 L per kWh IT (climate dependent) | 5-15% |
| Evaporative pre-cooling | 0.5-2.0 L per kWh IT (hot climates) | 0-30% |
| Domestic/cleaning | Negligible | <1% |

### Monthly Water Budget Method

For each month m:

```
W_tower(m) = Q_rejected(m) x evaporation_rate(m) x hours(m)
W_blowdown(m) = W_tower(m) / (cycles_of_concentration - 1)
W_humidifier(m) = makeup_rate(m) x hours_needed(m)
W_total(m) = W_tower(m) + W_blowdown(m) + W_humidifier(m)
```

Annual WUE:

```
WUE = sum(W_total(m) for m=1..12) / sum(E_IT(m) for m=1..12)
```

### Cooling Tower Evaporation Rate

```
evaporation_rate (L/hr) = Q_rejected (kW) x 3,600 / (h_fg x 1,000)
```

Where h_fg = latent heat of vaporization (approximately 2,260 kJ/kg at 40C).

Simplified: approximately 1.5 L per kWh of heat rejected.

### Cycles of Concentration

Cooling tower blowdown is controlled by the cycles of concentration (CoC):

```
blowdown_rate = evaporation_rate / (CoC - 1)
```

| CoC | Blowdown % of Evaporation | Water Savings |
|-----|--------------------------|---------------|
| 3 | 50% | Baseline |
| 5 | 25% | Moderate |
| 7 | 17% | Good |
| 10 | 11% | Very good (requires water treatment) |

Higher CoC reduces water consumption but increases mineral concentration, requiring better water treatment to prevent scaling.

### WUE Reduction Strategies

| Strategy | WUE Impact | PUE Impact | Trade-off |
|----------|-----------|-----------|-----------|
| Air-side economizer | Eliminates tower water | May increase fan power | Air filtration needed |
| Dry cooler (no tower) | Zero water | Higher approach temp | Works in cool climates |
| Higher CoC | 20-40% reduction | None | Better water treatment |
| Increased tower efficiency | 10-20% reduction | None | Larger tower investment |
| Waterless humidification | Eliminates humidifier water | Minor | Higher capital cost |

## Benchmarking and Industry Data

### PUE by Facility Type (Industry Surveys)

| Facility Type | Median PUE | 25th Percentile | 75th Percentile |
|--------------|-----------|-----------------|-----------------|
| Enterprise on-premises | 1.80 | 1.50 | 2.10 |
| Colocation (multi-tenant) | 1.55 | 1.35 | 1.80 |
| Cloud hyperscaler | 1.12 | 1.08 | 1.18 |
| New build (2023+) | 1.25 | 1.10 | 1.40 |
| Top performers (published) | 1.06 | 1.03 | 1.10 |

Source: Uptime Institute annual survey data, compiled across multiple years.

### Regional Variation

Climate significantly affects achievable PUE:

| Climate Zone | Free Cooling Hours | Best Achievable PUE | WUE Impact |
|-------------|-------------------|--------------------|-----------| 
| Nordic (Stockholm, Helsinki) | 7,000+ | 1.03-1.08 | Low (minimal tower) |
| Maritime (London, Amsterdam) | 5,000-6,000 | 1.06-1.12 | Low-moderate |
| Continental (Chicago, Frankfurt) | 3,000-5,000 | 1.10-1.20 | Moderate |
| Subtropical (Singapore, Miami) | <500 | 1.20-1.40 | High (year-round tower) |
| Arid (Phoenix, Dubai) | 2,000-4,000 | 1.10-1.25 | Very high (evaporative) |

### Certification and Reporting Standards

| Standard | Focus | Key Metric |
|----------|-------|-----------|
| EPA Energy Star for Data Centers | Energy efficiency | PUE benchmark vs national database |
| EU Code of Conduct (JRC) | Best practices | PUE target by tier |
| EN 50600 | Data center infrastructure | PUE, availability, security |
| ASHRAE 90.4 | Energy standard for data centers | Mechanical PUE budget |
| ISO 30134 | KPI for data centers | PUE, REF, WUE, CUE, GEC |

## Carbon-Optimal Operation

### Time-Varying CUE Calculation

Grid carbon intensity varies by hour based on generation mix. Carbon-aware operation shifts workloads to low-carbon periods.

```
CUE = sum(P_total(t) x CI(t) x dt) / sum(P_IT(t) x dt)
```

Where CI(t) = grid carbon intensity at time t (kg CO2/kWh).

### Carbon-Aware Strategies

| Strategy | CUE Reduction | Complexity | Notes |
|----------|--------------|-----------|-------|
| Renewable energy PPA | 30-90% | Medium | Depends on % of load covered |
| Time-shifting batch workloads | 10-30% | High | Requires workload flexibility |
| Geographic workload routing | 15-40% | Very high | Multi-site infrastructure |
| On-site solar/wind | 10-50% | Medium | Weather dependent, space needed |
| Grid carbon API integration | 5-15% | Low | Marginal gain, easy to implement |

### Renewable Energy Accounting

| Method | Description | Additionality |
|--------|-------------|---------------|
| Unbundled RECs | Purchase certificates, not tied to specific generation | Low |
| Bundled PPAs | Contract with specific renewable project | High |
| On-site generation | Solar/wind at data center | Highest |
| 24/7 carbon-free matching | Hour-by-hour matching of consumption to clean generation | Highest |

24/7 carbon-free energy matching (pioneered by Google) is the gold standard. It ensures that for every hour of operation, equivalent clean energy was generated, rather than relying on annual averages that mask dirty-grid hours.

---
*Data Center Efficiency Metrics Deep Reference v1.0.0 -- Thermal Engineering Skill*
*All outputs require verification by a licensed Professional Engineer.*
