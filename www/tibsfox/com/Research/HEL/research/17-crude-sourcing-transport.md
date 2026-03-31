# Crude Helium Sourcing & Transport Logistics — Route-by-Route Playbook

## The Supply Chain Spine

The corridor model requires crude helium (50-70% purity) transported from US and Canadian extraction sites to a PNW purification hub. This document maps the specific sources, routes, vehicles, costs, regulatory requirements, and decision sequence for building this supply chain from scratch.

The geological assessment in Document 16 confirms that the PNW will not produce its own crude helium. This is not a disadvantage -- it is a design constraint that simplifies the hub's input specification. Every load of crude helium arriving at the hub has a known composition, a certificate of analysis, and a contractual purity guarantee. This is more predictable than processing variable-quality well gas.

## Step 1: Identify and Qualify Crude Helium Suppliers (Month 1-3)

### Source Region Overview

| Region | Distance to Portland | Distance to Seattle | Key Producers | Status (March 2026) | Helium Purity Available |
|--------|---------------------|--------------------|----|----|----|
| Wyoming (Riley Ridge) | ~800 mi | ~900 mi | ExxonMobil (Shute Creek) | Operating at capacity | 50-70% (enriched crude) |
| Saskatchewan (SW Saskatchewan) | ~1,200 mi (to Seattle) | ~1,100 mi | North American Helium | Largest non-hydrocarbon producer globally | 50-99% (various grades) |
| Colorado (Las Animas County) | ~1,250 mi | ~1,350 mi | Blue Star Helium (Galactica project) | First sales January 2026, now 24/7 ops | 50-70% crude |
| Minnesota (Topaz project) | ~1,750 mi | ~1,650 mi | Pulsar Helium | Final engineering, FID 2026 | Up to 8.1% raw (will sell enriched crude) |
| Arizona (Holbrook Basin) | ~1,350 mi | ~1,450 mi | Altura Energy | Multi-well development, pipeline upgrades May 2026 | 50-70% crude |
| New Mexico | ~1,400 mi | ~1,500 mi | Desert Mountain Energy | Commercial production since late 2024 | 50-70% crude, direct tube trailer delivery |
| Montana (Sweetgrass Arch) | ~500 mi (to Seattle) | ~600 mi (to Portland) | Historic fields, no active primary producer | Prospective, not currently producing | Unknown |

### Supplier Contact and Qualification Sequence

**First priority (contact immediately):**

1. **North American Helium (Saskatchewan)** -- The largest non-hydrocarbon helium producer in the world. Already operating at scale. Can provide multiple grades. Cross-border logistics add complexity but the company has existing US customers and established customs procedures. Distance to Seattle (~1,100 mi) is competitive with Colorado. Website: northamericanhelium.com

2. **Desert Mountain Energy (New Mexico)** -- Already in commercial production. Already delivering via tube trailer to end-users. The fact that they have an operating direct-delivery business means they understand the logistics. Contact for pricing, minimum order quantities, and whether they can support PNW delivery routes. Website: desertmountainenergy.com

3. **Blue Star Helium (Colorado)** -- The Galactica project has been in 24/7 operations since the crisis. New producer, motivated to build customer relationships. Likely more flexible on contract terms than ExxonMobil. Website: bluestarhelium.com

**Second priority (contact within 30 days):**

4. **ExxonMobil (Wyoming -- Riley Ridge/Shute Creek)** -- Closest major source to PNW. However, ExxonMobil is a major corporation with existing long-term supply contracts. New customer onboarding may be slow. Crude helium from Shute Creek is typically sold to Linde, Air Liquide, and other gas majors for final purification. A co-op would need to negotiate a direct supply agreement, which may require meeting minimum volume commitments that are large relative to co-op scale. Worth pursuing but do not depend on it as the sole source.

5. **Altura Energy (Arizona)** -- Pipeline upgrades expected by May 2026 will bring three idle wells back online, increasing available supply. Contact after pipeline work is confirmed complete. Website: alturaenergy.com.au

**Third priority (monitor, contact when appropriate):**

6. **Pulsar Helium (Minnesota -- Topaz project)** -- Not yet in commercial production. Final investment decision targeted for 2026, with production expected 12-18 months after FID. The Topaz project has extraordinary helium concentrations (up to 8.1%), which means their crude will be premium quality. Establish contact now; negotiate supply when they reach production. Website: pulsarhelium.com

### What to Ask Each Supplier

When you contact these producers, you need specific information for equipment sizing (Document 15) and financial modeling (Document 23):

1. **Certificate of analysis for current production gas:** Helium percentage, nitrogen, methane, CO2, H2S, moisture, other trace gases. This determines whether your membrane front-end can handle the feed or needs pre-treatment.
2. **Available purity grades:** Can they supply 50%, 70%, 99%? Higher purity costs more per MCF but reduces your processing costs. The economic optimum depends on your equipment configuration.
3. **Minimum order quantity (MOQ):** How many MCF per load? How many loads per month minimum?
4. **Pricing:** Spot price per MCF and long-term contract price (1-year, 3-year, 5-year terms). Expect significant spread between spot and contract in the current crisis market.
5. **Delivery terms:** Do they deliver (FOB destination) or do you arrange transport (FOB origin)?
6. **Lead time for first delivery:** How quickly can they start supplying after contract execution?
7. **Force majeure and supply guarantee provisions:** What happens to your supply if they have production interruptions?

**Decision tree for supplier selection:**
- If budget allows only one supplier initially: North American Helium (proven scale, reliable operations, competitive distance to PNW)
- If seeking lowest transport cost: ExxonMobil Riley Ridge (~800 mi to Portland) or Montana Sweetgrass Arch sources (~500 mi to Seattle) if available
- If prioritizing supply diversity: contract with two suppliers in different regions (e.g., Wyoming + Saskatchewan, or Colorado + Saskatchewan) to avoid single-source dependency. Document 5 describes how single-source dependency caused the current crisis. Do not replicate that error at co-op scale.
- If seeking the highest-quality crude: Pulsar Helium Topaz (8.1% raw gas means their enriched crude will be exceptionally clean, reducing PSA wear and maintenance)

## Step 2: Select Transport Method (Month 2-4, Parallel with Supplier Qualification)

### High-Pressure Tube Trailers (Primary Method for Gaseous Helium)

The standard method for transporting crude and purified gaseous helium over road distances of 500-2,000 miles.

**Specifications:**
- Capacity: 180,000-250,000 SCF per trailer (~5,000-7,000 Nm3)
- Pressure: 2,400-3,600 psig (DOT 3AAX or 3T specification tubes)
- Tractor-trailer combination: Standard Class 8 truck (Freightliner Cascadia, Kenworth T680, etc.)
- Hazmat classification: DOT Division 2.2 (non-flammable gas)
- Speed: Highway speed. Approximately 500 miles per day with a single driver (11-hour driving limit per 49 CFR 395). Approximately 800 miles per day with team drivers.
- Trailer cost to own: $150,000-$250,000 per trailer (new). Used trailers available at $80,000-$150,000 but require DOT re-certification.
- Trailer lease: $3,000-$6,000 per month depending on term and condition

**Decision tree for trailer ownership:**
- If co-op expects 2+ loads per week from a single source: own a dedicated trailer and hire a contract driver. Amortized cost is lower than spot freight over 3+ years.
- If co-op expects 2-4 loads per month: lease a trailer or use a specialty gas hauler (see carrier selection below). The utilization rate does not justify ownership.
- If co-op is in Phase 1 pilot operations: use spot freight from a hazmat carrier. No capital outlay for transport equipment. Higher per-load cost but zero fixed commitment.

### ISO Containers (For Liquid Helium)

Used for long-distance transport and international export. Relevant if the hub includes a liquefier (see Document 15 for the liquefaction decision tree).

**Specifications:**
- Capacity: ~11,000 gallons (~41,000 liters) liquid helium per 40-foot ISO container
- Holding time: 35-48 days before boil-off venting begins (vacuum-jacketed super-insulation)
- Intermodal: truck, rail, or ship-compatible. The same container can move from truck chassis to railcar flatbed to container ship without transferring the liquid.
- Cost: $300,000-$500,000 per container (new). These are specialized vacuum-jacketed dewars, not standard shipping containers.
- Maintenance: annual vacuum integrity testing, valve recertification per DOT/IMDG

**ISO containers are relevant for two scenarios:**
1. Receiving liquid helium from a supplier who has their own liquefaction (e.g., large-scale producers). Less likely for a co-op buyer.
2. Shipping liquid helium to export customers in East Asia via the Port of Tacoma. See Document 20 for the demand analysis and Document 7 for port logistics.

### Rail (BNSF and Union Pacific)

For regular, scheduled bulk deliveries, rail is significantly cheaper per ton-mile than truck. Both BNSF and Union Pacific serve all source regions and have intermodal terminals in the PNW.

**Specifications:**
- Transit time: 3-5 days from Colorado/Wyoming to Portland/Seattle (vs. 14-20 hours by truck)
- Cost advantage: approximately 40-60% cheaper per ton-mile than truck for distances over 500 miles
- Method: ISO containers on flatcars (intermodal) or dedicated tank cars
- Terminals: BNSF intermodal yards in Seattle/Tacoma (South Seattle) and Portland (Terminal 6 area). Union Pacific intermodal in Portland.
- Minimum shipment: typically one container or one carload (20-40 foot equivalent)
- Disadvantage: less flexible scheduling, terminal-to-terminal only (requires truck drayage for first and last mile from terminal to producer/hub)

**Decision tree for rail vs. truck:**
- For 1-2 loads per month at distances under 1,000 miles: truck is simpler and faster. Rail overhead does not justify the cost savings.
- For 4+ loads per month at distances over 1,000 miles: rail is substantially cheaper. A mature co-op sourcing from Colorado or Saskatchewan should use rail for baseline supply.
- For surge or emergency deliveries: always truck. Rail cannot respond quickly enough.
- **Recommended hybrid:** Rail for scheduled baseline supply (70-80% of volume). Truck for surge, emergency, and suppliers not located near rail infrastructure.

## Step 3: Map Specific Routes and Get Freight Quotes (Month 3-4)

### Wyoming to PNW (Shortest, Most Practical)

```
Riley Ridge, WY -> I-80 W -> I-84 W -> Portland, OR
~800 miles, ~14 hours driving (single driver, 2 days including rest)

Or: Riley Ridge, WY -> I-15 N -> I-90 W -> Seattle, WA
~900 miles, ~16 hours driving (single driver, 2 days)
```

- **Truck cost estimate:** $3,500-$5,000 per load (fuel + driver + equipment amortization + insurance)
- **Per-SCF transport cost:** ~$0.015-$0.025/SCF (at 200,000 SCF/trailer)
- **Round-trip time:** 3-4 days including loading/unloading
- **Frequency for a 10-node co-op:** approximately 2-4 loads per month
- **Route hazards:** I-84 through the Columbia River Gorge can close for ice/wind in winter (typically 1-3 times per season for 12-48 hours). I-90 over Snoqualmie Pass can close for avalanche control. Plan for 1-2 day delays during winter months.
- **Rail alternative:** BNSF serves Rock Springs, WY (near Riley Ridge) and has direct service to Seattle/Portland. Transit: 3-4 days. Cost: approximately 50% less per unit than truck.

### Colorado to PNW

```
Las Animas County, CO -> I-25 N -> I-80 W -> I-84 W -> Portland, OR
~1,250 miles, ~20 hours driving (single driver, 2-3 days)
```

- **Truck cost:** $5,000-$7,500 per load
- **Per-SCF:** ~$0.025-$0.035/SCF
- **Round-trip time:** 4-5 days
- **Route notes:** I-25 through Colorado and Wyoming is well-maintained. I-80 through Wyoming is exposed to high winds and winter storms. Budget for occasional 1-day weather delays November through March.
- **Rail alternative:** Union Pacific serves Trinidad, CO (near Las Animas County) with connections to Portland. Transit: 4-5 days. Intermodal recommended for regular shipments.

### Saskatchewan to PNW

```
Swift Current, SK -> Border crossing (Regway/Portal) -> I-15 S through Montana -> I-90 W -> Seattle, WA
~1,100 miles, ~18 hours driving (2-3 days including border crossing)
```

- **Additional requirement:** US-Canada customs clearance. Helium is not a controlled substance and is not subject to export controls in either direction (see Document 14). However, customs declaration is required for every crossing. Budget $200-$500 per crossing for customs brokerage fees.
- **Truck cost:** $5,000-$7,000 per load plus customs brokerage (~$200-$500)
- **Per-SCF:** ~$0.025-$0.035/SCF
- **Border crossing logistics:** The Regway (SK) / Scobey (MT) crossing is a small port of entry with limited hours. The larger Port of Sweetgrass (AB/MT, I-15) is 24-hour and handles more commercial traffic. Route via Sweetgrass adds approximately 100 miles but eliminates border-hour constraints.
- **Customs documentation required:** Commercial Invoice, Bill of Lading, NAFTA/CUSMA Certificate of Origin (for duty-free treatment under USMCA), Canadian Export Declaration (if value exceeds CAD $2,000), US Customs Entry (CBP Form 7501)
- **Customs broker recommendation:** Retain a licensed customs broker in the border region (Livingston International operates on the MT/SK border crossings) to handle paperwork. Monthly retainer plus per-crossing fees are standard.

### Minnesota to PNW (Longest Route)

```
Topaz project area, MN -> I-94 W -> I-90 W -> Seattle, WA
~1,650 miles, ~25 hours driving (3 days minimum)
```

- **Truck cost:** $7,000-$10,000 per load
- **Per-SCF:** ~$0.035-$0.050/SCF
- **Rail advantage is greatest on this route:** BNSF northern corridor runs from Minneapolis through Montana to Seattle. Transit 4-5 days at approximately 50-55% less cost per unit than truck.
- **Note:** The Topaz project is not yet in production. This route becomes relevant when Pulsar reaches commercial operations (estimated 2027-2028).

### Arizona/New Mexico to PNW

```
Holbrook, AZ -> I-40 W -> I-15 N -> I-84 W -> Portland, OR
~1,350 miles, ~22 hours driving (2-3 days)
```

- **Truck cost:** $6,000-$8,500 per load
- **Per-SCF:** ~$0.030-$0.042/SCF
- **Route notes:** The longest segment (I-40 through Arizona and I-15 through Nevada/Utah) is well-maintained and rarely closes for weather. Less winter disruption risk than northern routes.

## Step 4: Negotiate Supply Agreements (Month 3-6)

**Negotiate supply agreements before building the hub.** This is the single most important sequencing decision in the project. Securing feed stock before committing to $4M-$6M in capital equipment (see Document 23) reduces the primary financial risk: building a hub with no crude to process.

### Contract Structure Options

**Take-or-pay contract:** The co-op commits to purchasing a minimum volume per month. The supplier guarantees that volume is available. If the co-op takes less than the minimum, it still pays for the minimum. This is the standard structure for industrial gas supply.
- Recommended minimum commitment: 100,000-200,000 SCF/month (approximately 1 tube trailer load per month)
- Typical term: 1-3 years initially, with renewal options
- Advantage: locks in supply at a known price during the crisis
- Risk: if the co-op's hub construction is delayed, it pays for crude helium it cannot process. Mitigate with a start-date clause tied to hub commissioning.

**Spot purchase:** Buy individual loads as needed without a volume commitment. Higher per-MCF price (typically 15-30% premium over contract), but maximum flexibility.
- Recommended for: Phase 1 pilot operations before the hub is fully commissioned. Buy a few loads to test the process flow and verify equipment performance.

**Hybrid:** Take-or-pay base volume at contract price plus spot purchases for incremental demand.
- Recommended for: steady-state operations where base demand is predictable but seasonal or surge demand is variable.

### Key Contract Terms to Negotiate

| Term | What to Push For | Why |
|------|-----------------|-----|
| Price escalation clause | Tie to published index (CPI or PPI for industrial gases) rather than supplier discretion | Predictable cost basis for financial model |
| Quality guarantee | Minimum helium purity and maximum contaminant levels per load, with right of rejection | Protects equipment from contamination damage (see Document 15 risk analysis) |
| Force majeure | Narrow definition. Exclude "market conditions" and "equipment maintenance" from FM. Require notice period. | Prevents supplier from invoking FM for routine production issues |
| Delivery schedule | Fixed delivery windows (e.g., every 2nd and 4th Tuesday) rather than "best efforts" | Allows hub to schedule processing runs and staff shifts |
| Volume flexibility | +/- 20% of base volume without penalty | Accommodates demand fluctuations without triggering take-or-pay penalties |
| Term and renewal | 1-year initial term with auto-renewal unless 90-day notice. Longer terms (3-5 years) for price lock. | Balances flexibility with price certainty |

### Legal Review

Have a business attorney review every supply agreement before execution. Key areas for legal review:
- Liability allocation for contaminated product
- Insurance requirements (both parties should carry commercial general liability and environmental liability)
- Dispute resolution (arbitration is standard for industrial gas contracts)
- Assignment provisions (can the co-op assign the contract if it restructures or merges?)
- Governing law (choose a jurisdiction where the co-op operates -- Washington or Oregon)

See Document 14 for the regulatory framework that governs these transactions and Document 19 for how supply agreements fit into the co-op governance structure.

## Cost Model: Monthly Hub Feed

Assuming a co-op hub processing 500,000 SCF/month of crude helium at 60% purity (enough to produce approximately 300,000-350,000 SCF of Grade-A helium at 85-95% PSA recovery):

| Source | Loads/Month | Transport Cost/Month | Crude He Cost/Month (@$200/MCF) | Total Monthly Feed Cost |
|--------|------------|---------------------|-----|-----|
| Wyoming (sole source) | 2-3 | $7,000-$15,000 | $100,000 | $107,000-$115,000 |
| Saskatchewan (sole source) | 2-3 | $10,000-$21,000 | $100,000 | $110,000-$121,000 |
| Colorado (sole source) | 2-3 | $10,000-$22,500 | $100,000 | $110,000-$122,500 |
| Diversified (WY 60% + SK 40%) | 2-3 | $8,000-$18,000 | $100,000 | $108,000-$118,000 |

**Crude helium purchase price is the dominant cost.** Transport adds only 7-18% on top. This means the supply agreement price matters far more than the transport route. Negotiate hard on crude price; be flexible on transport logistics.

See Document 23 for how these feed costs flow into the full financial model and sensitivity analysis.

## Carrier Requirements and Selection

### Regulatory Requirements for Carriers

Any carrier transporting helium must comply with:

| Requirement | Regulation | Detail |
|-------------|-----------|--------|
| DOT Hazmat registration | 49 CFR 107, Subpart G | Carrier must register with PHMSA as a hazmat transporter |
| CDL with hazmat endorsement | 49 CFR 383 | Every driver must hold a Commercial Driver's License with H endorsement (requires TSA background check) |
| DOT-specification equipment | 49 CFR 178 | Tube trailers must be DOT-3AAX or DOT-3T specification, with current hydrostatic test certification |
| Shipping papers | 49 CFR 172.200 | Each load requires shipping papers identifying UN 1046 (Helium, compressed) or UN 1963 (Helium, refrigerated liquid), hazard class, packing group, and emergency response information |
| Placards | 49 CFR 172.500 | Green diamond (non-flammable gas) on all four sides of the trailer |
| Driver training | 49 CFR 172.704 | Hazmat-specific training including security awareness, every 3 years |

### Finding Qualified Carriers

The routes between helium source regions and the PNW are well-traveled for industrial gases. Existing carriers include:

- **Specialty gas haulers:** Companies like Airgas (an Air Liquide subsidiary), Matheson Tri-Gas, and regional specialty gas distributors operate tube trailer fleets on these routes. They may be willing to haul crude helium as backhaul or incremental freight.
- **General hazmat carriers:** Carriers with DOT hazmat registration and tube trailer equipment. Search the FMCSA Carrier Search database (safer.fmcsa.dot.gov) for carriers authorized for Hazmat, operating in the origin and destination states.
- **Owner-operators with hazmat authority:** Independent truckers with their own tube trailers. Found through freight broker networks (DAT, Convoy, Echo Global Logistics).
- **BNSF and Union Pacific intermodal:** For rail shipments, contact the railroad's industrial products division. Both railroads actively solicit hazmat intermodal business. BNSF: bnsf.com/ship. UP: up.com/shippers.

**Recommended approach:**
1. Get freight quotes from 3-5 carriers for each route
2. Evaluate on price, transit time, reliability (on-time percentage), and equipment condition
3. Select a primary carrier and a backup for each route
4. Negotiate a rate agreement (monthly or quarterly rates) rather than spot pricing for each load

## Timeline and Dependencies

| Month | Activity | Dependencies | Deliverable |
|-------|----------|-------------|-------------|
| 1-2 | Contact all suppliers on priority list. Request COAs and pricing. | None | Supplier qualification matrix with pricing, purity, MOQ |
| 2-3 | Get freight quotes for all routes. Evaluate truck vs. rail. | Supplier locations confirmed | Transport cost matrix by route and method |
| 3-4 | Negotiate supply agreement with primary supplier. | Pricing and COA review complete | Draft supply agreement for legal review |
| 4-5 | Engage customs broker if Saskatchewan source selected. | Supplier selection | Customs procedures documented |
| 4-6 | Execute supply agreement. Coordinate delivery schedule with hub construction timeline (see Document 18). | Legal review complete, hub site secured | Signed supply contract |
| 6-8 | Receive first test load at hub for equipment commissioning. | Hub receiving bay and membrane/PSA installed (see Document 18 timeline) | First crude helium on-site |

**Critical dependency:** The supply agreement should be signed no later than Month 6 of the overall project. Equipment orders (Document 15) should be placed at Month 2-3. The hub lease (Document 18) should be signed at Month 2-4. All three workstreams -- supply, equipment, site -- must progress in parallel.

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Primary supplier production interruption | Medium | Hub runs out of feed stock within 2-4 weeks (depends on buffer inventory) | Contract with two suppliers in different regions. Maintain 2-week crude helium buffer in tube bank storage at hub. |
| Transport disruption (weather, road closure) | Medium (winter) | Delayed delivery, 1-3 days | Maintain buffer inventory. Use alternative routes (I-84 vs. I-90). Schedule deliveries with weather margin in winter. |
| Crude helium quality below specification | Low | Equipment damage (if H2S present) or reduced recovery rate | Require COA per load. Install inline analyzers. Reject non-conforming loads per contract terms. |
| Crude helium price spike (crisis deepens) | Medium | Feed costs increase, squeezing margins | Lock in long-term contract pricing. Include price cap provisions in contracts. See Document 23 for sensitivity to crude price changes. |
| Cross-border customs delay (Saskatchewan) | Low | 1-2 day delay at border | Use experienced customs broker. Pre-file customs entries. Use 24-hour border crossing (Sweetgrass/Coutts). |
| Single carrier dependency | Medium | If carrier has equipment breakdown or driver shortage, delivery is missed | Qualify two carriers per route. Maintain relationship with backup carrier through occasional loads. |

## Cross-Reference Map

- **Document 4** (Global Production): Detailed profiles of each producer referenced here
- **Document 5** (Market Crisis): Why supply diversification is essential
- **Document 7** (I-5 Corridor): Where the crude arrives and how it enters the distribution network
- **Document 9** (Economics): How transport costs affect ROI at various scales
- **Document 14** (Regulatory Landscape): DOT, customs, and hazmat regulations governing transport
- **Document 15** (PSA Equipment): Equipment that processes the crude helium once it arrives
- **Document 16** (PNW Geology): Why crude must be sourced externally
- **Document 18** (Hub Design): Receiving bay and facility design for accepting tube trailer deliveries
- **Document 23** (Financial Model): How crude helium costs and transport costs flow into the P&L
