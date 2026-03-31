# Ten-Year Outlook -- Helium Supply and Demand (2026-2036)

## Purpose

This document projects helium supply and demand over the next decade, extending the crisis analysis of Document 05 and the financial model of Document 23 into a longer time horizon. Where earlier documents asked "what do we do now?", this one asks "what does the world look like in ten years, and does the cooperative model survive it?"

The projections here range from consensus forecasts (grounded in announced projects, signed contracts, and published roadmaps) to informed speculation (extrapolating from trends where data is thin). Each projection is labeled accordingly. Honest uncertainty is more useful than false precision.

## Demand Projections

### Semiconductor Fabrication

**Consensus:** Semiconductor helium demand will roughly double by 2035. IDTechEx projects global helium demand rising from approximately 6.0 Bcf to 8.5 Bcf by 2030, with semiconductors increasing their share of total consumption from approximately 20% to over 30%. The drivers are multiplicative: more fabs, more EUV layers per chip, and smaller nodes requiring tighter process control.

**The EUV multiplier.** Each generation of process node adds EUV lithography layers. At 3nm (TSMC N3, 2022), chips required approximately 20-25 EUV layers. At 2nm (TSMC N2, targeting 2025), that rises to 25-30. At the 1.4nm and eventual 1nm nodes expected by 2030-2033, industry projections suggest 35-50+ EUV layers per chip. Each layer requires helium purge through the ASML optical column. ASML's next-generation High-NA EUV scanners (EXE:5000 series) are larger, more complex, and consume more helium per exposure pass than current systems. Per-wafer helium consumption at 1nm could be 2-3x the consumption at 3nm.

**The fab buildout.** The CHIPS Act wave is adding at least 8-10 new leading-edge fabs in the US alone (Intel Ohio, TSMC Arizona Phases 1-3, Samsung Taylor, Micron Idaho/New York). Europe (Intel Magdeburg, TSMC Dresden), Japan (TSMC Kumamoto, Rapidus Hokkaido), and continued expansion in Taiwan, South Korea, and China add dozens more. Each fab consumes 50,000-150,000 SCF of helium per day at full production. The cumulative demand increase from fabs under construction as of 2026 is estimated at 1.0-2.5 Bcf per year by 2030.

**Projection (consensus):** Semiconductor helium demand grows from approximately 1.2 Bcf/year (2025) to 2.5-3.5 Bcf/year by 2035. This is the single largest demand driver and the most predictable, because fabs take 3-5 years to build and their helium requirements are known at the design stage.

### Quantum Computing

**Consensus:** The dilution refrigerator market is growing at 15-34% CAGR depending on the source, with the quantum computing segment projected to reach $193 million by 2031. As of 2026, approximately 300+ dilution refrigerators are deployed globally for quantum computing. By 2030, projections range from 1,000 to 3,000+ units, depending on how rapidly IBM, Google, Microsoft, Rigetti, IQM, and the Chinese programs scale.

**He-3 demand math.** Each dilution refrigerator contains 4-13 liters of He-3 (Document 11). At 2,000 units by 2030, the quantum computing sector alone would require 8,000-26,000 liters of He-3 for initial fills -- 30-100% of current estimated annual global He-3 production. At 5,000+ units by 2035, the constraint becomes binding: He-3 supply from tritium decay cannot scale to meet demand without new production pathways.

**He-4 demand from quantum.** Each refrigerator also requires 100-200 liters of ultra-high-purity He-4 (Grade 6.0). At 2,000 units, that is 200,000-400,000 liters of the highest-purity product -- small relative to total He-4 supply but concentrated in a product category with limited production capacity.

**Projection (consensus for He-4, speculative for He-3):** He-4 demand from quantum computing remains a small fraction of total demand (<2% by 2035). He-3 demand becomes the critical bottleneck for superconducting quantum computing scaling by 2028-2030, potentially forcing architectural shifts toward trapped-ion (IonQ), photonic (PsiQuantum), or other approaches that do not require millikelvin cooling.

### Fusion Energy

**Consensus timeline:** Commonwealth Fusion Systems' SPARC tokamak is in assembly as of early 2026, targeting first plasma in 2026-2027 and net energy demonstration by 2027-2028. ITER remains on track for first plasma around 2035. ARC (CFS's commercial design) targets grid power in the early 2030s.

**Helium demand from fusion -- the counterintuitive finding.** D-T fusion reactors produce helium-4 as their primary reaction product (D + T -> He-4 + n + 17.6 MeV). A 500 MW fusion reactor would produce approximately 250 kg of He-4 per year as exhaust ash. This is a net helium source, not a sink. The cryogenic cooling systems for superconducting magnets do consume helium, but modern HTS (high-temperature superconducting) magnets used in SPARC and ARC operate at 20 K using cryocoolers rather than liquid helium baths, dramatically reducing helium consumption compared to older LTS designs like ITER's.

**D-He-3 fusion.** This would consume He-3 at roughly 100-150 kg per GW-year -- but D-He-3 fusion requires plasma temperatures 6x higher than D-T and is not expected to be commercially viable within the 10-year horizon. It is a second-generation fuel.

**Projection (consensus):** Fusion energy is a net neutral to modest net positive for helium supply within the 10-year horizon. The handful of demonstration reactors operating by 2035 will consume small amounts of He-4 for cooling but produce He-4 as reaction product. Fusion does not create a new helium demand crisis in this timeframe. The question becomes relevant in the 2040s if dozens of commercial reactors are deployed.

### Medical Imaging

**Consensus:** The global MRI installed base is approximately 60,000 units and growing at 3-5% annually, driven primarily by installations in China, India, Southeast Asia, and Sub-Saharan Africa. At historical rates, this adds 1,800-3,000 MRI systems per year. Each conventional system requires 1,500-2,000 liters of liquid helium for initial fill plus 500-1,500 liters per year for boil-off replenishment.

**The helium-free MRI revolution.** This is the most significant technology shift affecting helium demand in the 10-year outlook. As of early 2026:

- **Siemens Healthineers** received FDA clearance (January 2026) for the Magnetom Flow platform using just 0.7 liters of sealed liquid helium -- a 99.95% reduction from conventional systems requiring 1,500+ liters.
- **Philips** unveiled BlueSeal Horizon, a helium-free 3.0T MRI with 7 liters permanently sealed -- versus 1,500 liters in prior designs.
- **Fujifilm** demonstrated ZeroHelium MRI at ECR 2026, using copper-based cooling with zero liquid helium.
- The 1.5T helium-free MRI market was valued at $959 million in 2024, projected to reach $1.385 billion by 2031.

**Projection (consensus):** By 2030, the majority of new MRI installations worldwide will use sealed-helium or zero-helium designs. By 2035, new conventional open-bath MRI installations will be rare. However, the installed base of 60,000+ conventional MRI systems will continue requiring helium for replenishment through the 2030s and into the 2040s. MRI helium demand peaks around 2028-2030 and then enters structural decline. By 2036, annual MRI helium demand could be 40-60% below 2025 levels as the installed base turns over.

This is the most important demand-side development for the cooperative's long-term planning. MRI helium demand -- currently approximately 20-25% of global consumption -- will be structurally declining by the mid-2030s.

### Space Launch

**Consensus:** SpaceX alone launched 100+ missions in 2025. Blue Origin's New Glenn is operational. Global launch cadence is expected to reach 200-300 orbital missions per year by 2030. Each launch consumes 5,000-30,000 SCF of helium for tank pressurization, purging, and ground support. Annual space launch helium demand: approximately 50-100 MMcf by 2030.

**Projection (consensus):** Space launch helium demand grows modestly (3-5% CAGR) but remains a small fraction of total demand (<3%). Some launch providers are qualifying nitrogen or autogenous pressurization (using heated propellant vapors) as helium alternatives for non-critical systems, which may cap growth.

### Emerging Applications

**Speculative:** Helium may see new demand from:
- **Advanced air mobility (eVTOL):** Superconducting motors for electric vertical takeoff aircraft use cryogenic cooling. Small volumes per unit but potentially thousands of units by 2035.
- **Superconducting power transmission:** Pilot projects for superconducting power cables (AmpaCity in Germany, LIPA in New York) use liquid helium or liquid nitrogen cooling. Scaling to grid-level deployment would create meaningful demand, but widespread adoption is beyond the 10-year horizon.
- **Particle therapy (proton/carbon ion cancer treatment):** Superconducting cyclotrons use liquid helium. The global installed base is growing at 10-15% annually from a small base (~120 facilities in 2025).

**Projection (speculative):** Emerging applications add approximately 50-100 MMcf/year of demand by 2035 -- noticeable but not market-moving.

## Supply Projections

### Existing Major Sources

| Source | Current Output (est.) | 10-Year Trajectory | Risk |
|--------|----------------------|--------------------|----- |
| Qatar (Ras Laffan) | 0 (force majeure) | Resumes at 2.0-2.2 Bcf/year when Hormuz reopens; timing unknown | Geopolitical -- Hormuz remains a chokepoint |
| Riley Ridge / Shute Creek (Wyoming) | 1.4-1.5 Bcf/year | Stable for decades (80-year reserve at current extraction rate per ExxonMobil data). No expansion planned. | Single-point concentration risk. Production tied to CO2 demand. |
| Algeria (Skikda, Arzew) | 0.5-0.7 Bcf/year | Modest growth possible if new LNG trains include helium recovery | Infrastructure aging; political instability |
| Russia (Amur) | 0.3-0.5 Bcf/year (well below 60 MMcm/year design) | Uncertain. Second plant delayed. Sanctions limit Western market access. Russia is now 3rd largest producer (~13% of global supply in 2025) but output goes primarily to China. | Sanctions, technical problems, geopolitical isolation |

**Riley Ridge depletion:** At 1.4-1.5 Bcf/year extraction from approximately 49 Bcf of remaining reserves (as of the most recent published estimates), Riley Ridge has roughly 30-35 years of production at current rates -- not 80 years. The 80-year figure likely reflects the broader LaBarge field complex including unproven reserves. Within the 10-year horizon, Riley Ridge depletion is not a concern. Within the 20-year horizon, it becomes one.

### New Primary Projects -- Cumulative Supply Addition

| Project | Location | Expected Online | Estimated Annual Output | Confidence |
|---------|----------|----------------|------------------------|------------|
| North American Helium (expansion) | Saskatchewan + US | Operating now, scaling | 100-200 MMcf/year by 2028 | High (already producing) |
| Pulsar Topaz | Minnesota | 2028 (FID targeting Q3-Q4 2026) | 50-150 MMcf/year by 2030 | Medium-High |
| Desert Mountain + Altura | Arizona/New Mexico | Operating/2026 | 50-100 MMcf/year combined by 2028 | High (DME already producing) |
| Blue Star Galactica | Colorado | Operating | 20-50 MMcf/year | High |
| Amadeus Basin (multiple operators) | Central Australia | 2030-2032 earliest | 200-500 MMcf/year by 2033-2035 | Medium (remote, infrastructure-dependent) |
| South Australia (Gold Hydrogen et al.) | South Australia | 2029-2031 if 36.9% concentration confirmed | 50-200 MMcf/year | Low-Medium (extraordinary claims require verification) |
| Darwin vent stream recovery | Northern Territory | 2027-2028 | 20-50 MMcf/year | Medium (depends on commercial terms with Inpex) |
| Tanzania (Helium One, Rukwa Basin) | East Africa | 2028-2030 | 50-150 MMcf/year | Medium |
| **Total new primary supply** | | | **540-1,400 MMcf/year by 2030; 1,000-2,500 MMcf/year by 2035** | |

**Projection (consensus):** If all announced projects come online on schedule, new primary helium adds 0.5-1.4 Bcf/year by 2030 and 1.0-2.5 Bcf/year by 2035. Combined with existing production (Riley Ridge + Algeria + whatever fraction of Qatar and Russia is accessible), total global supply capacity reaches 4.5-6.0 Bcf/year by 2030 and 5.5-8.0 Bcf/year by 2035.

**The gap:** Against demand of 7.0-8.5 Bcf/year by 2030 and 8.0-10.0+ Bcf/year by 2035, the supply picture remains tight even with full project execution. The market is structurally short unless Qatar returns to full production AND most new projects deliver on schedule. Both conditions being met simultaneously is possible but not probable.

### Recycling as Supply

**Consensus:** If every major helium consumer (fabs, MRI facilities, research labs) implemented closed-loop recycling at 90-95% recovery, net demand would drop by approximately 30-40% -- equivalent to adding 2.0-2.5 Bcf/year of effective supply. The technology exists (Document 21). The economics are overwhelming at crisis pricing (Document 05). Adoption is accelerating but from a low base.

**Projection:** Recycling adoption reaches 40-50% of large consumers by 2030, 60-70% by 2035. Effective demand reduction: 0.8-1.5 Bcf/year by 2030, 1.5-2.5 Bcf/year by 2035. This is the single most impactful supply-side development -- larger than any individual new production project.

### Lunar He-3

Interlune has signed delivery contracts: Bluefors (up to 10,000 liters/year, 2028-2037), Maybell Quantum (thousands of liters/year, 2029-2035), and DOE Isotope Program (3 liters by 2029 as proof of concept). Interlune is developing a lunar excavator prototype under NASA contract, targeting a demonstration mission in 2027 and a pilot production plant by 2029.

**Honest assessment:** Lunar He-3 extraction is an extraordinary engineering challenge. Mining and heating lunar regolith to 700 degrees C in vacuum, collecting trace outgassed He-3 at 10-50 ppb concentration, and returning it to Earth at a cost competitive with $2,000-3,500/liter terrestrial prices -- all of this must work. The signed contracts are real. The technology is unproven at scale.

**Projection (speculative):** Small demonstration quantities (single-digit to tens of liters) of lunar He-3 reach Earth by 2029-2030. Commercially meaningful supply (thousands of liters/year) is possible by 2032-2035 if the pilot plant succeeds. Lunar He-3 does not meaningfully affect the He-4 market at all -- it addresses only the He-3 constraint for quantum computing and neutron detection. Within the 10-year horizon, lunar He-3 is a supplement to terrestrial tritium-decay production, not a replacement.

## Technology Changes

### Helium-Free MRI

This is happening now, not in the future. Siemens (0.7 liters sealed), Philips (7 liters sealed), and Fujifilm (zero liters) have all brought helium-free or near-helium-free MRI systems to market in 2025-2026. The transition will take 10-15 years to fully turn over the installed base, but the trajectory is unambiguous: MRI ceases to be a major helium demand category by the mid-2030s.

**Impact:** Removes approximately 1.0-1.5 Bcf/year of demand by 2036 (combined effect of zero-helium new installations and declining replenishment of the aging conventional fleet). This is the largest demand reduction in helium history.

### Alternative Neutron Detectors

PNNL's boron-lined proportional tubes (Document 11) have been qualified for new radiation portal monitor deployments since the mid-2010s. They do not fully replace He-3 -- sensitivity is 28% lower per tube, requiring larger detector arrays -- but they reduce incremental He-3 demand for nuclear security. The existing installed base of He-3 detectors continues requiring refills.

**Impact:** Modest. He-3 demand from neutron detection stabilizes rather than grows. Not a game-changer for the He-3 constraint.

### Hydrogen as Carrier Gas

Hydrogen can replace helium as carrier gas in gas chromatography (laboratory analytical instruments). In semiconductor fabrication, hydrogen cannot replace helium for EUV purge, backside wafer cooling, or leak detection -- the physics does not permit it. Helium's unique combination of thermal conductivity, chemical inertness, EUV transparency, and small atomic radius has no substitute for these applications.

**Impact on fab demand:** Negligible. The applications where helium is used in fabs are the applications where it is irreplaceable.

### Dry Cryocoolers

Pulse-tube and Gifford-McMahon cryocoolers can cool superconducting magnets without a liquid helium bath. This technology is already in the helium-free MRI systems described above. For laboratory superconducting magnets (NMR, research MRI, condensed matter physics), the transition from liquid helium baths to cryocooler-based sealed systems is underway. For dilution refrigerators, cryocoolers handle the pre-cooling stages (300K to 4K) but the final cooling to millikelvin temperatures still requires the He-3/He-4 mixture.

**Impact:** Accelerates the MRI demand reduction. Does not affect the He-3 constraint for quantum computing.

## Geopolitical Scenarios

### Strait of Hormuz: Prolonged Instability

If the Strait remains effectively closed or unreliable for a decade, Qatar's 2.0+ Bcf/year of helium stays off the Western market. This is already partially priced in. The consequence is that the supply gap persists at 1.5-2.5 Bcf/year through the early 2030s, forcing continued crisis-level pricing and aggressive development of alternative sources. Under this scenario, every primary helium project currently in development reaches maximum investment urgency.

**Co-op impact:** Prolonged crisis pricing is the bull case (Document 23, Scenario A). The cooperative thrives.

### China Controls Both Rare Earth and Helium

Russia's Amur plant output increasingly flows to China under long-term Gazprom contracts. If China also secures preferential access to Australian helium (through investment in Amadeus Basin or South Australian projects), it could control 25-30% of global helium supply accessible to non-Western markets. Combined with China's existing dominance in rare earth processing, this creates a dual chokepoint for advanced semiconductor manufacturing.

**Probability:** Medium. China is already the largest customer for Russian pipeline gas and is actively investing in Australian mining.

**Co-op impact:** Strengthens the case for domestic US production and processing. CHIPS Act supply chain provisions become more politically important.

### US-Taiwan Semiconductor Decoupling

If geopolitical tensions force TSMC to accelerate capacity migration from Taiwan to Arizona, Japan, and Germany, the geographic distribution of helium demand shifts but total demand stays constant or grows. Arizona fabs would source helium primarily from Riley Ridge and the new southwestern US primary producers (Desert Mountain, Altura, NAH Utah operations). PNW demand from Intel Oregon remains stable regardless.

**Co-op impact:** Neutral to slightly positive. Domestic fab capacity growth increases domestic helium demand, strengthening the case for US-based supply infrastructure.

### Arctic Helium

Russia and Canada both have potential helium-bearing formations in Arctic regions. Climate change is improving accessibility (longer ice-free seasons, thawing permafrost exposing previously inaccessible geology). However, Arctic helium development faces extreme infrastructure costs, environmental sensitivity, and regulatory complexity. No Arctic helium project is in active development.

**Projection:** Not meaningful within the 10-year horizon. Possible exploration activity in the 2030s; production in the 2040s at earliest.

## Price Trajectory

### He-4

| Period | Price Range ($/Mcf) | Price Range ($/L liquid) | Basis |
|--------|---------------------|-------------------------|-------|
| 2026 (current crisis) | $450-$3,000 | $50-$100+ | Document 05 |
| 2027-2028 | $300-$800 | $35-$75 | Assumes some Qatar recovery or new supply partially offsets |
| 2029-2030 | $200-$500 | $25-$50 | New primary projects reaching meaningful output |
| 2031-2035 | $150-$400 | $20-$40 | New normal -- structurally higher than pre-crisis but below peak |
| 2036+ | $150-$350 | $18-$35 | MRI demand declining offsets semiconductor growth |

**Key finding:** Helium will never return to pre-2020 pricing ($75-$150/Mcf). The Federal Helium Reserve is gone. The era of subsidized, artificially cheap helium is over. The "new normal" is 2-3x the historical baseline. This is not a crisis -- it is a permanent structural adjustment.

### He-3

| Period | Price Range ($/liter STP) | Driver |
|--------|--------------------------|--------|
| 2026 | $3,000-$5,000 | Crisis + quantum demand surge |
| 2027-2029 | $2,500-$4,000 | Supply constrained by tritium decay rate |
| 2030-2032 | $2,000-$5,000 (wide range) | Depends on whether lunar He-3 delivers |
| 2033-2035 | $1,500-$3,000 if lunar supply works; $4,000-$8,000 if not | Binary outcome |

He-3 pricing is uniquely uncertain because it depends on Interlune delivering an unprecedented technology. If lunar He-3 works at scale, it could increase global supply by an order of magnitude and bring prices down. If it fails, He-3 becomes the binding constraint on superconducting quantum computing.

## Implications for the PNW Cooperative

### Is the Co-op Viable in 2036?

**Yes, but the business mix shifts.** The co-op's Year 1-3 revenue is dominated by crisis pricing on Grade-A and Research Grade helium (Document 23). By 2036, the revenue model must reflect:

1. **MRI replenishment is declining.** The hospital/university customer segment shrinks as helium-free MRI replaces the installed base. Co-op should not build long-term capacity around MRI demand.

2. **Semiconductor demand is growing.** Intel Oregon's helium needs grow with each process node. New PNW fab construction (possible, given CHIPS Act incentives and the region's advantages) would add customers. This is the co-op's core growth market.

3. **Recycling services become the anchor.** As helium prices settle at the "new normal" ($20-$40/L), the co-op's recycling service contracts (Document 21) provide steady, price-insensitive revenue. Every fab customer needs recycling regardless of helium price. This is the subscription business within the cooperative.

4. **Research Grade is the margin product.** 99.9999% purity helium commands 3x+ premiums and serves quantum computing, university research, and advanced fab development. Few competitors can produce it consistently. This is where the co-op earns its margin.

### Ten-Year Strategic Plan (Outline)

**Years 1-3 (2026-2029): Establish and survive.**
- Launch hub, onboard 5-10 customers, build reputation for reliability
- Install recycling systems at anchor customers (Intel, OHSU, UW)
- Achieve breakeven by Month 18-24
- Apply for CHIPS Act funding; secure grant if possible

**Years 3-5 (2029-2031): Expand services.**
- Add Research Grade (6N) purification capability if not in Phase 1
- Develop He-3 handling and distribution capability (small volumes, high margin)
- Expand recycling service customer base to 10-20 accounts
- Evaluate second hub location (Tacoma for port access, or Portland for Intel proximity)

**Years 5-8 (2031-2034): Technology transition.**
- Shift revenue mix away from MRI replenishment toward fab and research customers
- Invest in sealed-system servicing capability (the new MRI designs still need periodic maintenance, just not helium replenishment)
- If Amadeus Basin or other Pacific-facing projects come online, establish crude helium sourcing agreements for import through Port of Tacoma
- Explore He-3 distribution partnerships with Interlune (both headquartered in Seattle)

**Years 8-10 (2034-2036): Mature cooperative.**
- Revenue mix: 50%+ semiconductor, 20-25% recycling services, 15-20% research/quantum, <10% medical
- Second hub operational or in planning
- Member base expanded from 5 founding members to 15-25
- Patronage dividends flowing; member equity being returned via revolving fund

### When to Think About Lunar He-3

**Now, but as a relationship, not an investment.** Interlune is headquartered in Seattle. The co-op should establish a relationship early -- attend Interlune's public events, understand their timeline, and position the co-op as a potential regional distribution partner for terrestrial He-3 delivery. The co-op should not invest capital in lunar He-3 infrastructure until Interlune demonstrates successful extraction (expected 2029-2030 at earliest). If the demonstration succeeds, the co-op should be first in line to discuss Pacific Northwest distribution rights.

### Technology Transitions to Prepare For

1. **Helium-free MRI:** Already happening. Plan for declining MRI customer revenue starting Year 3-4. Do not panic -- the installed base declines slowly.

2. **Recycling becoming standard:** Good for the co-op. As recycling becomes expected rather than exceptional, the co-op's recycling service contracts become the floor revenue, not the ceiling.

3. **He-3 scarcity:** If the co-op can handle, store, and distribute He-3, it has a high-margin product line that grows with quantum computing. Investment: a small cryogenic isotope storage and metering system ($200K-$500K). Revenue potential: significant, because He-3 at $2,000-$5,000/liter means even small volumes generate real margin.

4. **Sealed-system MRI service:** The new helium-free MRI systems still need cryogenic engineering support -- just not helium replenishment. Pivot the MRI customer relationship from "helium supplier" to "cryogenic service provider."

## Summary of Projections

| Category | 2026 | 2030 | 2036 | Confidence |
|----------|------|------|------|------------|
| Global He-4 demand | ~6.2 Bcf/yr | 7.0-8.5 Bcf/yr | 8.0-10.0 Bcf/yr | High (demand drivers well-characterized) |
| Global He-4 supply (excl. Qatar) | ~4.0 Bcf/yr | 4.5-6.0 Bcf/yr | 5.5-8.0 Bcf/yr | Medium (depends on project execution) |
| Supply gap (if Qatar offline) | ~2.0 Bcf/yr | 1.0-2.5 Bcf/yr | 0-2.0 Bcf/yr | Medium |
| He-4 price ($/L liquid) | $50-$100 | $25-$50 | $18-$35 | Medium |
| He-3 price ($/L STP) | $3,000-$5,000 | $2,000-$5,000 | $1,500-$8,000 (binary) | Low (depends on Interlune) |
| MRI helium demand | Peak | Declining | -40-60% from peak | High |
| Semiconductor helium demand | Growing fast | ~2.5x 2025 levels | ~3-4x 2025 levels | High |
| Dilution refrigerators deployed | ~300 | 1,000-3,000 | 5,000-15,000 | Medium |
| Recycling adoption (large consumers) | ~15% | 40-50% | 60-70% | Medium |
| Lunar He-3 (meaningful supply) | No | Demonstration only | Possible (100s-1000s L/yr) | Low |

## The Bottom Line

The helium market in 2036 will look fundamentally different from 2026. MRI demand declines. Semiconductor demand doubles or triples. Recycling becomes standard practice. New primary sources partially replace Qatar's dominance. Prices settle at a permanent new normal -- higher than the pre-crisis era but lower than the current crisis.

For the cooperative, the strategic takeaway is straightforward: the business model works, but the customer mix must evolve. A co-op that builds its identity around semiconductor supply, recycling services, and Research Grade purity -- rather than MRI replenishment -- has a durable competitive position for decades. The PNW's structural advantages (cheap hydroelectric power, Intel proximity, port access, Interlune proximity) do not diminish over the 10-year horizon. They strengthen as domestic semiconductor capacity grows under the CHIPS Act.

The helium market is entering a decade of structural transformation. The organizations that build infrastructure during this transformation -- not before it starts, not after it concludes -- will operate the supply chain that the next generation of technology depends on.

That was the argument of Document 05. It remains the argument ten years out.
