# The Flexible Ceiling and the Firm Floor

> **Domain:** Grid Architecture & Portfolio Design
> **Module:** 4 -- Grid Integration: Hydro + Geothermal Portfolio
> **Through-line:** *Geothermal provides the always-on floor. Hydroelectric provides the flexible ceiling.* Together, they form a portfolio that no single resource can match -- firm enough for data center SLAs, flexible enough for grid stability.

---

## Table of Contents

1. [The Complementary Characteristics](#1-the-complementary-characteristics)
2. [Seasonal Complementarity Modeling](#2-seasonal-complementarity-modeling)
3. [Ancillary Services and Hydroelectric Flexibility](#3-ancillary-services-and-hydroelectric-flexibility)
4. [The Spring Oversupply Problem](#4-the-spring-oversupply-problem)
5. [Islanding Capability for Cascadia Resilience](#5-islanding-capability-for-cascadia-resilience)
6. [Western Energy Imbalance Market](#6-western-energy-imbalance-market)
7. [Portfolio Design Principles](#7-portfolio-design-principles)
8. [Data Center SLAs and Firm Clean Power](#8-data-center-slas-and-firm-clean-power)
9. [Cross-References](#9-cross-references)
10. [Sources](#10-sources)

---

## 1. The Complementary Characteristics

No two generation resources are perfectly complementary. But the hydro + geothermal pairing comes closer than any other combination currently available for the Pacific Northwest corridor:

| Characteristic | Hydroelectric | Geothermal (EGS) |
|---------------|--------------|------------------|
| Capacity factor | 30-45% (seasonal) | 80-95% (baseload) |
| Dispatch speed | Seconds to minutes | Slow (hours for full ramp) |
| Weather dependence | High (drought, snowpack) | None |
| Seasonal variation | Major (summer deficit) | Minimal |
| Carbon intensity | Near-zero | Near-zero |
| Ancillary services | Excellent | Limited |
| Capital cost | Sunk (existing dams) | High (drilling) |
| Fuel cost | Zero (water) | Zero (earth heat) |
| Technology risk | Low (mature) | Medium (EGS maturing) |

**The portfolio logic:** Each resource's weaknesses are the other's strengths:
- Geothermal is always on when hydro is in summer drought
- Hydroelectric is fast-dispatch when geothermal cannot ramp
- Geothermal frees hydro from baseload duty, making hydro available for peak dispatch
- Hydroelectric provides the ancillary services that geothermal cannot

Together, they provide what neither can provide alone: **clean, firm, flexible power with near-100% availability**.

---

## 2. Seasonal Complementarity Modeling

The seasonal mismatch between PNW hydroelectric generation and electricity demand is the core problem the hydro+geo portfolio solves:

**Hydro generation pattern:**
- Peak generation: late spring / early summer (snowmelt)
- Low generation: late summer / early fall (low river flows)
- Moderate: winter (steady but reduced)

**Electricity demand pattern:**
- Peak demand: summer (cooling loads, agricultural irrigation)
- Secondary peak: winter (heating loads)
- Low demand: spring (mild weather)

**The gap:**
- Spring: hydro peaks, demand is low → oversupply
- Summer: demand peaks, hydro is low → deficit
- Winter: hydro is moderate, demand is moderate → approximate balance

**How geothermal fills the gap:**
- Geothermal baseload is constant year-round -- same output in August as in April
- During summer drought when hydro underperforms, geothermal provides the 24/7 floor
- This allows the grid to cover summer peak demand without relying solely on expensive gas peakers

**Quantitative illustration (hypothetical 500 MW portfolio):**
- 400 MW geothermal baseload (always on, 80% capacity factor = 320 MW avg)
- 100 MW hydro flexible capacity (deployed when and where needed)
- Combined result: 320 MW firm baseload + 100 MW flexible peak = 420 MW average, 100 MW dispatchable

vs. 500 MW hydro alone:
- Summer: may produce 150 MW average (drought conditions)
- Winter: may produce 400 MW average
- No firm commitment possible

---

## 3. Ancillary Services and Hydroelectric Flexibility

Ancillary services are the grid support functions beyond simple energy delivery that keep the power system stable:

**Frequency regulation:** When generation and load are imbalanced, frequency deviates from 60 Hz. Fast-response generators provide automatic generation control (AGC) to correct imbalances in seconds. Hydroelectric turbines can ramp from zero to full output in 60-90 seconds -- making them the premier frequency regulation resource in the PNW.

**Spinning reserve:** Capacity available within 10 minutes to replace a lost generator. Hydro provides this at near-zero cost -- a generator spinning at reduced output can increase output rapidly.

**Voltage support:** Reactive power management for transmission line stability. Large hydro generators provide reactive power (VARs) that maintain transmission voltage profiles.

**The portfolio implication:** Geothermal does not provide fast-response ancillary services -- its ramp rate is too slow. But if geothermal handles the baseload function (constant 80% output, 24/7), hydro is freed from baseload duty and can dedicate its flexibility entirely to ancillary services.

This is the key insight: **a baseload geothermal resource makes the hydro fleet more valuable, not less**. The dam is worth more as a flexible peaker + ancillary service provider than as a baseload generator. Geothermal doesn't compete with hydro. It upgrades it.

---

## 4. The Spring Oversupply Problem

BPA's spring oversupply occurs when:
- High snowmelt river flows require high water discharge (dam operators cannot simply "store" water indefinitely -- reservoir levels must be managed)
- PNW wind generation is strong in spring
- Regional electricity demand is moderate (mild weather)
- California is not importing heavily (their own renewables are strong in spring)

**The result:** Generation exceeds load on the BPA system, forcing BPA to implement the Oversupply Management Protocol (OMP). Under OMP:
- Non-dispatchable generation (wind, solar) is curtailed first
- If curtailment is insufficient, BPA spills water at dams (turbines bypassed, flow over spillways)
- Spilling exceeds water quality standards for dissolved gas, harming fish

**Geothermal as partial solution:**
If baseload geothermal replaces some current gas or coal baseload on the regional grid:
- During spring oversupply, geothermal CAN be curtailed (it runs at 80-90% capacity factor, has margin to reduce)
- Geothermal curtailment is not harmful (unlike water quality impacts of dam spill)
- The net effect: geothermal absorbs some of the spring surplus that hydro currently must spill

This is not a perfect solution -- spring oversupply is partly a transmission problem -- but it reduces the frequency and severity of spring curtailment events.

---

## 5. Islanding Capability for Cascadia Resilience

The Cascadia Subduction Zone will rupture. When it does, it will disrupt Pacific Northwest transmission infrastructure significantly. The question is not whether -- it is how to maintain electricity supply to critical infrastructure during the days or weeks when the bulk power system is recovering.

**Islanding:** An electrical island is a portion of the grid that can operate independently when disconnected from the main grid. To island successfully, a local area needs:
1. Enough local generation to supply local load
2. Black-start capability (ability to restart generation after a complete outage)
3. Voltage and frequency regulation within the island
4. Protection systems that prevent unsafe conditions during islanded operation

**Hydro + geothermal as island anchor:**
- Grand Coulee Dam has black-start capability (can restart without external power)
- Geothermal provides steady baseload that doesn't depend on weather
- The combination can anchor an electrical island covering Okanogan, Grant, and Douglas counties -- a significant portion of eastern Washington

**The data center resilience angle:** A data center with on-site or local geothermal generation + hydro backup achieves a resilience tier that no wind or solar dependent facility can match. During a Cascadia event, the Electric City data center island (BPA hydro + Cascade geothermal) could continue operating at reduced capacity while the surrounding grid recovers.

---

## 6. Western Energy Imbalance Market

BPA participates in the Western Energy Imbalance Market (WEIM), operated by CAISO. The WEIM:
- Balances load and generation across participating utilities in real time
- Uses a 5-minute dispatch interval
- Enables resources in one utility's territory to serve load in another's

**Portfolio implications for Fox:**
- Excess spring hydro can be sold into California via the WEIM rather than spilled
- Geothermal baseload can provide firm capacity contracts to California utilities needing firm clean resources
- The Fox corridor's clean firm portfolio is more valuable in the WEIM than in a bilateral market alone

**Future market expansion:** FERC has encouraged development of a full Day-Ahead Market (DAM) for the western grid. If a western DAM emerges, BPA's and Fox's geothermal assets become price-setters during peak demand periods -- commanding premium prices for firm clean capacity that wind and solar cannot provide.

---

## 7. Portfolio Design Principles

Based on the PNW context and the Fox corridor's specific geography:

**Principle 1: Geothermal as baseload, hydro as peak**
Never use flexible hydro for baseload duty when geothermal can provide it. Baseload duty wastes hydro's most valuable characteristic (ramp speed) on work that slow-response resources can do.

**Principle 2: Size geothermal to cover summer minimum load**
The right size for geothermal baseload is the load that must be served during late-summer drought years when hydro is at minimum. This ensures the portfolio has firm generation equal to minimum load even in worst-case drought conditions.

**Principle 3: Size hydro to cover peak minus geothermal**
The remaining peak capacity requirement is covered by flexible hydro dispatch. Geothermal handles the floor; hydro handles the difference between the floor and the peak.

**Principle 4: Retain ancillary service headroom**
The portfolio must allocate a portion of hydro capacity to ancillary services at all times -- not just during peak demand. Frequency regulation is needed 24/7, not just at peak.

**Principle 5: Plan for Cascadia**
Every portfolio design decision should be tested against the question: "what happens to this portfolio if the bulk power system goes down for 2 weeks?" If the answer is "the data center goes dark," the portfolio design is incomplete.

---

## 8. Data Center SLAs and Firm Clean Power

Data center operators selling to AI companies, cloud providers, and financial institutions face strict uptime requirements:

| Data Center Tier | Availability | Annual Downtime Budget |
|-----------------|-------------|----------------------|
| Tier II | 99.741% | 22 hours/year |
| Tier III | 99.982% | ~1.6 hours/year |
| Tier IV | 99.9999% | ~26 minutes/year |

AI training runs can take weeks. A power interruption in hour 200 of a 300-hour training run does not just cause lost productivity -- it destroys the run and may corrupt model checkpoints.

**The firm power premium:** Data centers willing to pay a premium for firm clean power (guaranteed generation regardless of weather) command higher colocation prices. A Tier III data center at Electric City powered by hydro+geo firm clean can justify premium pricing that a wind-dependent data center cannot.

**Comparison to alternatives:**
- Nuclear (Three Mile Island restart for Microsoft): 10+ year construction, complex regulatory process
- Natural gas (ExxonMobil data center power): carbon-intensive, subject to gas price volatility
- Hydro alone: firm in wet years, unreliable in drought years
- Hydro + geothermal: firm in all weather conditions, clean, corridor-local

OpenAI CEO Sam Altman's 2025 Senate testimony: "AI costs will converge to energy costs. AI abundance will be limited by energy abundance." The Fox corridor's answer to this constraint is the clean firm energy portfolio -- not grid-scale intermittent renewables, but the complement of flexible hydro and always-on geothermal.

---

## 9. Cross-References

| Project | Connection |
|---------|------------|
| [THE](../THE/index.html) | Thermal energy conversion; heat pump integration with geothermal |
| [EMG](../EMG/index.html) | Grid-scale generator and inverter technology |
| [OCN](../OCN/index.html) | Data center power requirements; containerized compute energy |
| [NND](../NND/index.html) | Corridor energy grid integration |
| [GRD](../GRD/index.html) | Grid optimization and dispatch algorithms |
| [ROF](../ROF/index.html) | Ring of Fire energy trade; Pacific Rim grid connections |

---

## 10. Sources

1. [NWPCC: Ninth Power Plan](https://www.nwcouncil.org/reports/ninth-power-plan) -- Regional resource adequacy and flexibility
2. [BPA: Hydropower Impact](https://www.bpa.gov/energy-and-services/power/hydropower-impact) -- Ancillary services documentation
3. [BPA: Oversupply Management Protocol](https://www.bpa.gov/energy-and-services/power/oversupply-management) -- Spring surplus management
4. [Utility Dive: Snake River Dams](https://www.utilitydive.com/) -- Replacement cost analysis
5. [Center for Public Enterprise: Geothermal vs alternatives](https://publicenterprise.org/) -- Cost comparison
6. [CAISO: Western Energy Imbalance Market](https://www.caiso.com/market/Pages/WEIM/) -- Market structure
7. [Fervo Energy: Data center power whitepaper](https://fervoenergy.com/) -- July 2025 firm clean power thesis
