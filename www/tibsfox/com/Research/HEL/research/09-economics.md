# Economics of Modular Helium Production

## The Central Economic Argument

The traditional model for helium production is a centralized mega-plant costing $500 million to $2 billion, requiring 3-5 years to build, and producing helium as a byproduct of natural gas processing. This model served the industry for decades when helium was cheap and abundant. It is now a liability. The March 2026 crisis (Document 05) has demonstrated that concentrated production creates concentrated risk -- and that the market has no shock absorber when a major source goes offline.

The alternative is modular: small, distributed production units that can be deployed in months rather than years, at costs measured in hundreds of thousands rather than hundreds of millions. This document analyzes the economics of the modular approach and identifies the specific conditions under which it is viable, profitable, and sustainable.

## Cost Structure -- Extraction Nodes

A modular helium extraction node is a self-contained unit deployed at a wellhead or gas processing facility. The unit separates helium from the mixed gas stream using membrane separation, pressure swing adsorption (PSA), or a combination of both. Document 15 provides detailed vendor specifications; here we focus on the economics.

### Entry-Level Systems (PSA, 90-95% Purity)

| Parameter | Value |
|-----------|-------|
| Capital cost | $50,000-$250,000 |
| Output | Crude helium (90-95% purity) |
| Throughput | 50-500 SCFH (standard cubic feet per hour) |
| Deployment time | 4-12 weeks from order to operation |
| Power requirement | 15-50 kW |
| Staffing | Part-time monitoring (can be remote) |
| Maintenance | Annual molecular sieve replacement ($5,000-$15,000) |

These units produce crude helium that requires further purification at a central hub before it meets industrial (5N, 99.999%) or research (6N, 99.9999%) specifications. The crude product is compressed into standard tube trailers (typically 2,400 PSI) and trucked to the hub. At 90-95% purity, the crude product is already 90-95 times more concentrated than typical wellhead gas, making transport economically efficient.

Vendors at this scale include Chart Industries (TITAN Helium line), Guild Associates (Dublin, OH), and Parker Hannifin (see Document 15 for complete vendor analysis including contact information, lead times, and pricing as of early 2026).

### Full Recovery + Purification Systems (99.999%)

| Parameter | Value |
|-----------|-------|
| Capital cost | $1.5M-$3.5M |
| Output | Grade-A helium (99.999% / 5N purity) |
| Throughput | 500-5,000 SCFH |
| Deployment time | 6-12 months |
| Power requirement | 50-200 kW |
| Staffing | 1-2 full-time technicians |
| Maintenance | Annual: $30,000-$75,000 (molecular sieves, membranes, compressor service) |

These units can produce helium ready for industrial use without a central hub. They are appropriate for deployment at high-concentration wellheads (above 2% helium) where the feed gas quality justifies the additional capital. The Pulsar Helium Topaz project in Minnesota, with feed concentrations up to 8.1% (Document 04), exemplifies a site where this scale makes sense.

### Medium-Scale Recovery Systems

| Parameter | Value |
|-----------|-------|
| Capital cost | $2M-$5M |
| Output | Grade-A (5N) or Research Grade (6N) helium |
| Throughput | 2,000-10,000 SCFH |
| Deployment time | 9-18 months |
| Power requirement | 200-500 kW |
| Staffing | 2-4 full-time technicians |
| Maintenance | Annual: $75,000-$150,000 |

This is the scale appropriate for a central hub in the I-5 corridor (Document 07), serving as the purification and liquefaction center for crude helium collected from multiple extraction nodes.

## Operating Economics -- The Electricity Variable

The single largest operating cost for helium processing is electricity. Cryogenic liquefaction alone requires approximately 700-800 kWh per metric ton of liquid helium. PSA purification adds 200-400 kWh per metric ton. Compression for tube trailer transport requires 100-200 kWh per trailer fill. Facility operations (HVAC, instrumentation, lighting, safety systems) add another 15-25% to the direct process energy total.

For a medium-scale hub processing 50,000 liters of liquid helium per month, total annual electricity consumption is approximately 600,000-800,000 kWh. The electricity cost varies dramatically by region:

| Region | Industrial Rate ($/kWh) | Annual Electricity Cost | 20-Year Cost |
|--------|------------------------|------------------------|-------------|
| PNW (WA/OR) | $0.06 (midpoint) | $42,000 | $840,000 |
| Gulf Coast (TX) | $0.085 | $59,500 | $1,190,000 |
| Southwest (AZ/NM) | $0.10 | $70,000 | $1,400,000 |
| Midwest (OH/IN) | $0.10 | $70,000 | $1,400,000 |
| Northeast (NY/MA) | $0.15 | $105,000 | $2,100,000 |

Over a 20-year facility life, the PNW electricity advantage versus a Northeast location is $1.26 million -- on electricity alone. When factored into margin calculations, this advantage is decisive. At a processing margin of $5-$10 per liter, the PNW electricity savings represents 8,400-16,800 liters worth of margin -- the equivalent of adding a free month of production to every year of operation.

The BPA priority firm power rate for industrial customers is particularly attractive: $38.20/MWh ($0.038/kWh) in fiscal year 2025, with rate adjustments governed by a public process and historically tracking inflation. This is not a promotional rate -- it reflects the fully amortized cost of the federal Columbia River hydroelectric system. It is as close to a permanent structural advantage as exists in the US energy landscape.

## ROI Analysis at March 2026 Crisis Prices

### For Helium Consumers: Closed-Loop Recycling

The most immediate economic action available to any helium consumer is installing a closed-loop recycling system. The arithmetic is simple: at crisis pricing, the cost of helium lost to venting vastly exceeds the cost of capturing and re-purifying it.

| Scenario | Monthly External Purchase (No Recycling) | System Capital Cost | Monthly External Purchase (With 90% Recycling) | Monthly Savings | Payback Period |
|----------|------------------------------------------|--------------------|-------------------------------------------------|----------------|----------------|
| Large fab, crisis pricing ($75/L) | $750,000 | $3.5M | $75,000 | $675,000 | **5.2 months** |
| Large fab, normalized pricing ($20/L) | $200,000 | $3.5M | $20,000 | $180,000 | **19.4 months** |
| Medium fab, crisis pricing ($75/L) | $300,000 | $2.0M | $30,000 | $270,000 | **7.4 months** |
| Medium fab, normalized pricing ($20/L) | $80,000 | $2.0M | $8,000 | $72,000 | **27.8 months** |
| Research lab, crisis pricing | $50,000 | $500K | $5,000 | $45,000 | **11.1 months** |
| Research lab, normalized pricing | $15,000 | $500K | $1,500 | $13,500 | **37 months** |

At crisis pricing, every scenario achieves payback in under 12 months. At normalized pricing, payback extends to 20-37 months -- still well within the 5-7 year capital planning horizon of semiconductor manufacturers and research institutions. The key insight is that recycling systems are economically justified at any helium price above approximately $10 per liter. The crisis makes the case urgent; the fundamentals make it permanent.

Document 21 provides the engineering specifications for recycling systems. Document 15 identifies vendors. The constraint is not technology or economics -- it is procurement lead time. Chart Industries' TITAN Helium systems are currently quoted at 24-36 week lead times (extended from 12-20 weeks pre-crisis) due to surge demand. Ordering now is the appropriate action.

### For Helium Producers: Extraction Node Economics

The producer-side economics depend on three variables: feed gas helium concentration, capital cost per unit, and the prevailing helium price. At March 2026 crisis spot prices ($450-$3,000 per Mcf for Grade-A helium), the math is dramatically favorable for any feed concentration above 0.3%.

| Feed Gas Concentration | Unit Cost | Monthly Crude Output (Mcf) | Monthly Revenue (at $1,000/Mcf spot) | Annual Revenue | Simple IRR |
|-----------------------|-----------|---------------------------|--------------------------------------|---------------|-----------|
| 0.3% (marginal) | $100K-$250K | 5-15 Mcf | $5,000-$15,000 | $60,000-$180,000 | 24-72% |
| 0.5% (viable) | $100K-$250K | 10-30 Mcf | $10,000-$30,000 | $120,000-$360,000 | 48-144% |
| 0.75% (good) | $150K-$350K | 20-50 Mcf | $20,000-$50,000 | $240,000-$600,000 | 69-171% |
| 2.0% (excellent) | $250K-$500K | 80-200 Mcf | $80,000-$200,000 | $960,000-$2.4M | 192-480% |
| 8.1% (Topaz project) | $1.5M-$3.5M | 500-1,500 Mcf | $500,000-$1.5M | $6M-$18M | 171-514% |

These returns are extraordinary by any industrial standard. Even the most conservative scenario -- 0.3% feed gas at the low end of revenue estimates -- yields a 24% annual return on a $250K investment. At the high end, the numbers become almost absurd, which is itself a signal: crisis pricing this extreme creates a gold-rush dynamic where speed to market matters more than optimization.

The critical caveat is that crisis pricing is temporary. When Qatar resumes production (timeline uncertain as of March 2026), spot prices will moderate. The question is whether operations established during the crisis remain viable at normalized prices.

### Post-Crisis Viability

At normalized helium pricing ($150-$250 per Mcf for Grade-A, the approximate range from 2019-2024), the economics shift but do not collapse:

| Feed Gas Concentration | Unit Cost | Monthly Revenue (at $200/Mcf normalized) | Annual Revenue | Simple IRR |
|-----------------------|-----------|------------------------------------------|---------------|-----------|
| 0.3% | $100K-$250K | $1,000-$3,000 | $12,000-$36,000 | 5-14% |
| 0.5% | $100K-$250K | $2,000-$6,000 | $24,000-$72,000 | 10-29% |
| 0.75% | $150K-$350K | $4,000-$10,000 | $48,000-$120,000 | 14-34% |
| 2.0% | $250K-$500K | $16,000-$40,000 | $192,000-$480,000 | 38-96% |

At normalized prices, the 0.3% concentration level becomes marginal (5-14% IRR -- viable but not compelling). Above 0.5%, returns remain strong enough to sustain operations. Above 0.75%, returns are attractive by any industrial benchmark. The strategic implication: invest during the crisis to capture extraordinary returns, but site extraction nodes at locations with feed concentrations above 0.5% to ensure long-term viability.

## The "Ten Units vs. One Plant" Comparison

This comparison crystallizes the modular thesis.

| Dimension | One Traditional Plant | Ten Modular Units |
|-----------|----------------------|-------------------|
| Total investment | $500M-$2B | $2.5M-$5M |
| Time to first revenue | 3-5 years | 4-12 months |
| Geographic risk | Single point of failure | Distributed across 10 sites |
| Regulatory risk | Single complex permitting process | 10 simple permits |
| Technology risk | Custom engineering | Off-the-shelf equipment |
| Scaling model | Step function (build another plant) | Linear (add another unit) |
| Output efficiency | Higher per-unit efficiency | Lower per-unit, but starts producing immediately |
| Financing | Project finance, corporate balance sheet | Equipment loans, grants, cooperative capital |
| Market adaptability | Locked into one product slate | Each unit can target different purity/market |
| Failure mode | Catastrophic (entire output lost) | Graceful (one unit fails, nine continue) |

The traditional plant wins on unit economics -- a large cryogenic plant produces helium at a lower per-unit cost than a small PSA system. But the modular approach wins on every other dimension: speed, risk, capital efficiency, financing accessibility, and market adaptability. In a crisis where time-to-market is the binding constraint, the modular approach is unambiguously superior.

The comparison is not academic. Blue Star Helium's Galactica project in Colorado (Document 04) went from drilling to first helium sales in under two years using modular extraction equipment. Gazprom's Amur plant -- the traditional mega-project approach -- has been under construction since 2015 and still has not reached design capacity as of March 2026, eleven years later.

## Funding Landscape (March 2026)

### Federal Sources

| Source | Type | Amount Available | Relevance to Helium | Application Pathway |
|--------|------|-----------------|---------------------|---------------------|
| CHIPS Act supply chain grants | Grants | Billions remaining | Explicitly includes gas supply layers (Document 08) | NIST CHIPS Program Office (chipsgrants@nist.gov) |
| DOE Industrial Efficiency Programs | Grants + loans | Varies by cycle | Cryogenic efficiency, waste heat recovery | EERE Office of Industrial Applications |
| DOE Hydrogen and Fuel Cell R&D | Research grants | $100M+ annually | SMR-helium integration, cryogenic systems | DOE Hydrogen Program (cross-applicable) |
| NSF Workforce Development | Training grants | $500M+ via CHIPS | Cryogenic technician training | NSF Advanced Technological Education (ATE) |
| USDA Rural Development | Loans + grants | Varies | Rural extraction node siting | USDA Business & Industry loan guarantee |
| SBA 7(a) Loans | Guaranteed loans | Up to $5M | Equipment financing for small operations | Any SBA-approved lender |
| EDA Build Back Better | Grants | Regional competitions | Cluster development, supply chain resilience | Economic Development Administration |

### Washington State Sources

| Source | Type | Amount | Relevance | Contact |
|--------|------|--------|-----------|---------|
| Innovation Cluster Accelerator (ICAP) | Grants | Competitive | Multi-business collaboration solving industrial bottlenecks -- directly applicable to cooperative model | WA Dept of Commerce |
| Clean Energy Fund | Grants + loans | $100M+ allocated | Cryogenic efficiency, industrial decarbonization | WA Dept of Commerce, Clean Energy Office |
| Rural County Tax Credits | Tax incentives | Varies | Reduced B&O tax for facilities in rural counties (Lewis County hub siting) | DOR |
| Cascadia CleanTech Accelerator | Bridge funding + mentoring | Small grants | Cryogenic efficiency, recycling innovation | CCA program office |

### Oregon Sources

| Source | Type | Amount | Relevance | Contact |
|--------|------|--------|-----------|---------|
| Oregon Business Development Fund (OBDF) | Low-interest loans + grants | Rolling | Industrial site readiness -- piping, storage, infrastructure | Business Oregon |
| Oregon CHIPS Act (SB 4) | Incentives | $190M total | Semiconductor supply chain specific | Business Oregon |
| Oregon RAIN | Incubator + mentoring | Small grants | Business development for early-stage ventures | Regional accelerator network |
| Strategic Investment Program (SIP) | Property tax abatement | Varies | For investments >$100M -- Intel-scale, but smaller projects may qualify under amended rules | County assessors |

### Practical Funding Strategy

The optimal approach stacks multiple sources:

1. **CHIPS Act supply chain grant** for core hub infrastructure (purification, liquefaction) -- target $2-$3M
2. **WA ICAP or OR OBDF** for site preparation and specialized infrastructure -- target $300K-$500K
3. **SBA 7(a) loan** for equipment not covered by grants -- up to $5M at favorable terms
4. **Cooperative member capital contributions** for working capital and crude helium procurement -- $500K-$1M from 5-10 members at $50K-$100K each
5. **NSF ATE grant** for cryogenic technician training program in partnership with a community college (Clark College in Vancouver, WA or PCC in Portland are natural partners) -- $100K-$300K

Total capital stack: $3.2M-$9.8M from five sources, with no single source bearing more than 40% of the total. This diversified funding approach mirrors the distributed production philosophy: no single point of failure. Document 23 provides the detailed financial model for a 10-node virtual plant with one hub.

## The Economic Window

The March 2026 crisis creates a time-bounded window of opportunity where the economics of modular helium production are extraordinarily favorable.

**Window opened:** March 2, 2026 (Qatar force majeure declaration, Document 05)

**Peak opportunity:** March 2026 through approximately Q4 2026. During this period, crisis pricing ($450-$3,000/Mcf spot) generates IRRs of 50-500% on modular extraction equipment, and government funding programs (CHIPS Act, state innovation grants) are actively soliciting applications.

**Window narrows:** When any of the following occur -- Qatar resumes helium exports through the Strait of Hormuz, Gazprom's Amur plant reaches design capacity (60 Mcm/year), or fast-track projects in Tanzania (Helium One's Rukwa project, targeted 2027 production) and South Africa (Renergen's Virginia project, Phase 1 commissioning 2024) scale to significant output.

**Window closes:** When normalized supply meets or exceeds demand, likely 2028-2030 at earliest. Even after the window closes, crisis-era investments remain viable at normalized prices (as shown in the post-crisis viability analysis above) because capital is already deployed, customer relationships are established, and the structural case for distributed supply remains valid regardless of price level.

### What Happens After the Window?

Operations established during the crisis remain viable because:

1. **Capital is sunk and amortizing.** A $250K PSA unit depreciated over 7 years costs $36K/year in capital recovery. At normalized pricing and 0.5% feed concentration, annual revenue of $24K-$72K covers depreciation with margin.

2. **Recycling economics are permanently favorable.** Closed-loop systems justified at crisis pricing remain justified at any price above $10/L. The installed base of recycling systems will not be removed when prices normalize.

3. **Customer relationships have switching costs.** A fab that establishes a relationship with a regional helium supplier during a crisis -- and experiences reliable, responsive, high-purity supply -- does not switch back to a distant corporate distributor when prices normalize. The value of supply security is priced into the relationship.

4. **Semiconductor demand grows structurally.** Global semiconductor revenue is projected to exceed $1 trillion annually by 2030 (SIA forecast). Every new fab, every new EUV scanner, every new etch chamber increases helium demand. The demand side of the equation does not depend on crisis pricing.

5. **The structural argument for distributed supply is independent of price.** Document 12 traces five helium shortages in twenty years. The frequency is increasing and the severity is worsening. Any customer who has experienced supply disruption understands the value of supply chain diversity. That understanding does not evaporate when prices fall.

The crisis accelerates the economics. The fundamentals sustain them. The window is open now.
