# NEC Load Calculations — Deep Reference

*Power Systems Skill — NEC Article 220 methodology and demand factor tables*

## NEC 220 Article Structure

NEC Article 220 provides four calculation methods for determining electrical service load:

1. **General Method (220.10-220.12):** Default for all occupancy types. Sum connected loads, apply demand factors by load category. Used for new construction and most commercial/industrial.
2. **Optional for Dwellings (220.82-220.85):** Simplified residential method. Total nameplate x demand factor tables for dwelling units.
3. **Optional for Existing Dwellings (220.86-220.88):** Based on measured maximum demand. Best when 12+ months of billing data exists. Also applicable to existing commercial (220.87).
4. **Optional for Multifamily (220.84):** Demand factors for multiple dwelling units sharing a service.

Most commercial and industrial projects, including data centers, use the **General Method** augmented by Article 430 (motors) and Article 625 (EV charging) where applicable.

## General Method Demand Factors

### NEC Table 220.42 — Lighting Demand Factors

| Type of Occupancy | First kVA at 100% | Next kVA at 35% | Remainder at 25% |
|-------------------|--------------------|------------------|-------------------|
| Dwelling units | 3 kVA | 117 kVA | Balance |
| Hospitals | All at 40% | — | — |
| Hotels/motels (no cooking) | 20 kVA at 50% | 80 kVA at 40% | Balance at 30% |
| Warehouses (storage) | 12.5 kVA at 100% | Balance at 50% | — |
| All others | 100% | — | — |

**Interpretation:** Demand factors reflect the statistical improbability that all lighting operates simultaneously. A 200 kVA dwelling lighting load calculates as: 3 + (117 x 0.35) + (80 x 0.25) = 3 + 40.95 + 20 = 63.95 kVA demand.

### Receptacle Loads (220.14, 220.44)

- General-use receptacles: 180 VA per outlet (NEC 220.14(I))
- Multi-outlet assemblies: 180 VA per 1.5 feet (fixed use) or per 5 feet (non-fixed)
- Demand factor for receptacles exceeding 10 kVA: first 10 kVA at 100%, remainder at 50%
- Fixed multi-outlet strips in data centers (bench power): count full nameplate

### Kitchen Equipment (220.56)

| Number of Units | Demand Factor |
|-----------------|---------------|
| 1-2 | 100% |
| 3 | 90% |
| 4 | 80% |
| 5 | 70% |
| 6+ | 65% |

Applies to thermostatic-controlled equipment in commercial kitchens. Useful for office buildings with cafeteria facilities.

## Motor Load Calculations (NEC 430.24)

**Rules:**
1. Identify the largest motor in the installation (highest full-load current from NEC Table 430.250)
2. Largest motor FLC x 125%
3. All remaining motors at 100% of their FLC
4. Sum for total motor load contribution

**HVAC rule (NEC 220.60):** When both heating and cooling exist, use only the larger of the two — they do not operate simultaneously in the same zone. Exception: if design uses simultaneous heating and cooling (heat recovery chillers), include both.

**Continuous loads (NEC 210.20, 215.2):** Any load expected to operate for 3+ hours continuously must be multiplied by 125% for conductor and overcurrent device sizing. Most data center IT loads and lighting qualify as continuous.

## Data Center Load Calculation Worksheet

Use this worksheet for any data center or server room:

| Step | Description | Formula | Value |
|------|-------------|---------|-------|
| 1 | IT load | rack_count x avg_kW_per_rack x diversity_factor | ___ kW |
| 2 | Diversity factor | 0.7 (conservative) to 0.9 (high-density uniform) | ___ |
| 3 | UPS losses | IT_load x 0.03 to 0.08 (depends on UPS efficiency) | ___ kW |
| 4 | PDU losses | IT_load x 0.01 to 0.02 | ___ kW |
| 5 | Cooling load | IT_load x (PUE_target - 1.0 - UPS_loss% - PDU_loss%) | ___ kW |
| 6 | Lighting | Floor_area_sqft x 1.2 W/sqft / 1000 | ___ kW |
| 7 | Miscellaneous | Fire alarm, security, BMS, elevators | ___ kW |
| 8 | **Subtotal** | Sum of steps 1 + 3 + 4 + 5 + 6 + 7 | ___ kW |
| 9 | **Design service** | Subtotal x 1.25 (NEC 230.42) | ___ kW |
| 10 | **Service kVA** | Design_service_kW / power_factor (0.85-0.95) | ___ kVA |

**PUE impact on service sizing:** For a 1 MW IT load, PUE 1.2 requires ~1.5 MW service, while PUE 1.6 requires ~2.0 MW service — a 500 kW difference in infrastructure capacity driven entirely by mechanical efficiency.

## Service Entrance Sizing (NEC 230.42)

**Minimum service conductor ampacity:** Must be adequate for the calculated load after all demand factors are applied.

- All continuous loads (>3 hours operation) count at 125% for conductor sizing (NEC 215.2)
- Service overcurrent protection per NEC 230.90: one to six disconnects
- Service entrance conductors: minimum #8 AWG copper for residential; calculated by load for commercial

**Panel directory requirements:**
- Every circuit must be legibly identified (NEC 408.4)
- Circuit directory must identify panelboard location in multi-panel installations
- Spare breaker positions should be noted for future capacity

## Worked Example: 50-Rack Data Center

**Given:** 50 racks, 10 kW average per rack, diversity factor 0.8, target PUE 1.3, 480V 3-phase service.

| Step | Calculation | Result |
|------|------------|--------|
| IT load | 50 x 10 kW x 0.8 | 400 kW |
| UPS losses (5%) | 400 x 0.05 | 20 kW |
| PDU losses (1.5%) | 400 x 0.015 | 6 kW |
| Cooling | 400 x (1.3 - 1.0 - 0.05 - 0.015) = 400 x 0.235 | 94 kW |
| Lighting (5,000 sqft) | 5,000 x 1.2 / 1000 | 6 kW |
| Miscellaneous | Estimate | 10 kW |
| **Subtotal** | | **536 kW** |
| **Design service (x 1.25)** | 536 x 1.25 | **670 kW** |
| **Service kVA (PF 0.9)** | 670 / 0.9 | **744 kVA** |
| **Service amps (480V 3-phase)** | 744,000 / (480 x 1.732) | **895 A** |

**Conductor selection:** 895A at 480V 3-phase requires paralleled conductors. Two sets of 500 kcmil copper (380A each at 75 deg C) provide 760A — insufficient. Three sets of 350 kcmil (310A each) provide 930A — adequate with margin. Use 3 sets of 350 kcmil THWN-2 copper in three separate conduits.

**Service disconnect:** 1000A main breaker (next standard size above 895A).

---
*Deep reference for Power Systems Skill — NEC Article 220 methodology*
*Source: NFPA 70 (NEC 2023)*
