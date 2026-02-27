# Solar PV Sizing — Deep Reference

*Power Systems Skill — NEC 690 provisions, string calculations, shading, interconnect*

## Module and String Sizing Calculations

### String Voltage Constraints

The number of modules per string is constrained by the inverter's input voltage window:

**Maximum modules per string:**
max_modules = floor(V_max_inverter / (V_oc_STC x T_correction_cold))

Where T_correction_cold adjusts Voc for minimum expected ambient temperature:
T_correction = 1 + (T_coeff_Voc x (T_min_ambient - 25))

Typical V_oc temperature coefficient: -0.003 to -0.004 per deg C (negative: voltage increases as temperature drops)

**Minimum modules per string:**
min_modules = ceil(V_min_mppt / (V_mp_STC x T_correction_hot))

Where T_correction_hot adjusts Vmp for maximum expected cell temperature:
T_correction = 1 + (T_coeff_Vmp x (T_max_cell - 25))

Maximum cell temperature: ambient + 25-30 deg C for roof-mount; ambient + 20 deg C for ground-mount with good airflow.

### String Sizing Decision Table

| Module Wattage | V_oc (STC) | V_mp (STC) | 1000V Inverter (max/min) | 1500V Inverter (max/min) |
|----------------|-----------|-----------|------------------------|------------------------|
| 330W (60-cell) | 40.5V | 33.5V | 22 / 14 modules | 33 / 20 modules |
| 400W (72-cell) | 49.2V | 41.0V | 18 / 11 modules | 27 / 17 modules |
| 450W (144 half-cut) | 52.1V | 43.2V | 17 / 11 modules | 26 / 16 modules |

*Note: Values assume -10 deg C minimum ambient (cold) and 65 deg C max cell temp (hot). Adjust for actual site conditions.*

### Inverter Selection

- **Central inverter:** 100-4000 kW; single unit per array section; lowest cost per watt; single point of failure
- **String inverter:** 3-100 kW; one per string or few strings; moderate cost; partial failure tolerance
- **Microinverter:** 250-500W; one per module; highest cost; maximum shade tolerance; module-level monitoring

**DC/AC ratio optimization:**
- Ratio < 1.0: inverter underutilized; poor economics
- Ratio 1.0-1.1: conservative; minimal clipping; for high-irradiance sites
- Ratio 1.1-1.25: optimal for most US sites; modest clipping at peak
- Ratio 1.25-1.35: aggressive; higher annual yield but more clipping at peak; economic in low-irradiance areas
- Ratio > 1.35: excessive clipping; diminishing returns; may void inverter warranty

## NEC 690 Critical Provisions

### 690.7 — Maximum System Voltage

| Application | Maximum Voltage | Notes |
|-------------|----------------|-------|
| Residential (one/two family) | 600V DC | Limits string length significantly |
| Commercial / industrial | 1000V DC | Standard for US commercial PV |
| Utility-scale | 1500V DC | Requires 1500V-rated equipment throughout |

Voltage calculated at lowest expected ambient temperature using V_oc temperature coefficient.

### 690.8 — Circuit Sizing Current

- PV source circuit current = I_sc x 1.25 (continuous current factor)
- Conductor ampacity >= I_sc x 1.25 x 1.25 = I_sc x 1.56 (NEC 690.8(B) with continuous current)
- OCPD rating >= I_sc x 1.25 but <= conductor ampacity
- String fuse sizing: typically 15A or 20A for residential modules

### 690.9 — Overcurrent Protection

- Overcurrent protection required within three conductor lengths of the PV source
- Series fuse in combiner box for each string
- If only two strings connect to an inverter, and inverter Isc rating exceeds 2x module Isc, series fuses may be omitted (per 690.9(A) exception)

### 690.11 — Arc-Fault Protection

- Required for PV systems operating at 80V DC or greater (2017 NEC and later)
- Listed DC arc-fault detection device on each string
- Module-level power electronics (MLPEs) with arc-fault detection satisfy this requirement
- Arc-fault detector must de-energize the faulted string within 2 seconds of detection

### 690.12 — Rapid Shutdown

**Requirement:** Conductors more than 1 foot from the array boundary must de-energize to <30V within 30 seconds of rapid shutdown initiation.

**Compliance options:**
1. **Module-level electronics (MLPEs):** Microinverters or DC power optimizers inherently comply — each module de-energizes independently
2. **String-level rapid shutdown transmitters (RSTs):** Signal-based; RST at the array sends shutdown signal to module-level shutdown devices via PLC or wireless
3. **Conductor routing:** If all DC conductors are within 1 foot of the array and AC disconnect is at the array, rapid shutdown at module level may not be required (pre-2017 NEC interpretation)

**Rapid Shutdown Initiator (RSI):** Located at the main service panel; when opened, triggers de-energization of all array conductors beyond the 1-foot boundary.

### 690.47 — Grounding

**Grounded PV systems:**
- One conductor of the PV source circuit is bonded to ground (typically negative)
- Ground fault protection (GFP) required: detects current on grounding conductor; opens the grounded conductor and stops the inverter

**Ungrounded PV systems:**
- Neither conductor bonded to ground
- Insulation monitoring required: continuously measures insulation resistance to ground
- If insulation resistance drops below threshold (typically 500 kohm per kV of system voltage), system alarms and may disconnect

### 690.56(B) — Service Entrance Marking

Mandatory permanent plaque at utility service entrance:

```
WARNING
SOLAR PHOTOVOLTAIC SYSTEM
IS CONNECTED TO THIS ELECTRICAL PANEL

TURN OFF AC BREAKER PANEL BEFORE
WORKING ON WIRING

PV SYSTEM RATED: _____ kW DC
```

## Shading Analysis

### Impact of Partial Shading

- **String topology (series-connected modules):** One shaded module reduces current through entire string; bypass diodes activate around shaded module but cause ~30% string power loss per shaded module
- **Parallel strings:** Only the affected string loses power; other strings unaffected
- **Module-level electronics (MLPEs):** Each module operates at individual maximum power point; shaded module produces less but does not affect others

### Shade Assessment Methods

- **Sun path diagram:** Plot obstructions on a sun path chart for the site latitude; determine hours of shading per month
- **Solar Pathfinder or Solmetric SunEye:** Field instruments that measure horizon obstructions and calculate shade penalty
- **PVsyst:** Full simulation software; models hourly irradiance with 3D obstruction model
- **PVWatts (NREL):** Free online tool; does not model shading but provides unshaded baseline for comparison

### Design Rules of Thumb

- Trees within 2x their height of the array: assess carefully
- Adjacent buildings: shadow length = building_height / tan(solar_altitude)
- Inter-row spacing for ground-mount: minimum 2x module height at winter solstice solar noon altitude
- Avoid placing modules where shading exceeds 10% of annual irradiance — marginal economics

## Performance Ratio and Yield

### Performance Ratio (PR)

PR = (AC energy output) / (in-plane irradiance x array area x module efficiency at STC)

| PR Range | Assessment | Typical Cause |
|----------|-----------|---------------|
| > 0.85 | Excellent | Well-designed, minimal shading, cool climate |
| 0.80-0.85 | Good | Standard commercial installation |
| 0.75-0.80 | Acceptable | Some shading, hot climate, soiling |
| 0.70-0.75 | Below average | Significant losses; investigate |
| < 0.70 | Poor | Major issue (shading, equipment failure, soiling) |

### Loss Factors

| Loss Category | Typical Range | Notes |
|---------------|--------------|-------|
| Temperature | 3-12% | Higher in hot climates; bifacial reduces |
| Shading | 0-10% | Site-dependent; MLPEs minimize |
| Soiling | 1-5% | Dust, bird droppings; washing schedule |
| Wiring (DC + AC) | 1-3% | Proper conductor sizing minimizes |
| Inverter clipping | 0-5% | Higher DC/AC ratio = more clipping |
| Inverter efficiency | 2-4% | Modern inverters 96-98.5% CEC weighted |
| Module mismatch | 0.5-2% | Manufacturing variation; sorted bins reduce |
| Degradation | 0.3-0.5%/yr | Typical crystalline silicon; first year higher |

### Annual Yield

Annual yield (kWh/kWp) = PSH x 365 x PR

Example: Phoenix, PSH = 6.0, PR = 0.82:
Yield = 6.0 x 365 x 0.82 = **1,796 kWh/kWp/year**

A 285 kWp array produces: 285 x 1,796 = **511,860 kWh/year**

## Utility Interconnect (IEEE 1547)

### Anti-Islanding

- **Requirement:** Inverter must detect loss of grid and disconnect within 2 seconds
- **Methods:** Frequency shift, voltage shift, impedance measurement
- **Verification:** UL 1741 certification includes anti-islanding testing
- **Smart inverters (IEEE 1547-2018):** Ride-through capabilities; do NOT disconnect during minor voltage/frequency excursions; helps grid stability

### Interconnect Application Process

1. Submit interconnect application to utility with system specs (kW, inverter make/model, single-line diagram)
2. Utility reviews against screening criteria (10% of minimum daytime load on feeder is common threshold)
3. If screening passes: proceed to inspection and permission to operate
4. If screening fails: supplemental review or system impact study required (can take months)
5. Inspection by utility and AHJ (Authority Having Jurisdiction)
6. Permission to Operate (PTO) issued — system may begin exporting

### Net Metering

- Varies by state and utility; check current policy before financial modeling
- Full retail rate credit (decreasing availability)
- Avoided cost rate (wholesale; significantly lower than retail)
- Time-of-use crediting (value varies by hour of export)
- Monthly netting vs annual netting vs instantaneous netting

## Financial Sizing Considerations

### Simple Metrics

- **Simple payback:** System_cost / (annual_kWh x electricity_rate + annual_demand_charge_savings)
- **LCOE:** Levelized cost of energy = total_lifetime_cost / total_lifetime_kWh
- **IRR:** Internal rate of return; should exceed cost of capital for project viability

### Federal and State Incentives (check current year)

- **ITC (Investment Tax Credit):** Federal tax credit on installed cost; percentage varies by year and project type
- **MACRS depreciation:** 5-year accelerated depreciation for commercial systems
- **State rebates:** Many states offer per-watt or per-kW rebates
- **SRECs:** Solar Renewable Energy Certificates; value varies by state market

### Data Center Considerations

- **24/7 load factor:** High self-consumption ratio (most generation consumed on-site); improves economics vs intermittent commercial loads
- **Rooftop area:** Data centers often have large flat roofs ideal for PV; check structural loading
- **Behind-the-meter:** Avoids delivery charges and transmission losses
- **PPA option:** Power Purchase Agreement allows third-party ownership; no upfront capital; fixed or escalating $/kWh rate

---
*Deep reference for Power Systems Skill — Solar PV sizing and NEC 690*
*Source: NFPA 70 (NEC 2023) Article 690, IEEE 1547-2018, UL 1741*
