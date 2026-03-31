# Financial Model -- Scenario Analysis

## Model Overview

This document presents the financial model for a Phase 1 helium cooperative operating a single purification and liquefaction hub in the I-5 corridor (Document 18), serving 5-10 customers (fabs, labs, universities per Documents 7 and 8), with crude helium sourced from US producers (Document 17). The model is designed to answer one question: **under what conditions does this operation make money, and under what conditions does it fail?**

Three scenarios are modeled in detail: Bull (crisis pricing persists 3+ years), Base (Qatar resumes in 18 months, prices normalize), and Bear (market collapse plus operational problems). Monthly cash flow projections for Year 1 are provided for all three scenarios. Sensitivity analysis identifies the variables that matter most.

The financial model connects directly to the capital costs and site requirements in Document 18 (hub design), the revenue assumptions from Document 20 (East Asian demand and pricing), the funding sources from Document 9 (economics) and Document 14 (CHIPS Act compliance), and the operating structure from Document 19 (co-op playbook).

## Capital Budget

| Item | Cost | Notes |
|------|------|-------|
| Hub facility (membrane + PSA + liquefier) | $4,000,000 | Per Document 18 small hub specification |
| Quality lab (GC, mass spec, moisture analysis) | $400,000 | Required for Grade-A and Research Grade certification |
| Cylinder/dewar fill station | $350,000 | Including high-pressure compressor and manifold |
| Recycling systems (2 units for fab customers) | $600,000 | Cryomech HRS units per Document 21 |
| Working capital (first 6 months crude purchases) | $500,000 | Per Document 17 sourcing costs at Wyoming pricing |
| Permitting, engineering, legal, co-op formation | $300,000 | Per Documents 14 and 19 regulatory and legal path |
| **Total Phase 1 Capital** | **$6,150,000** | |

### Capital Budget Sensitivity

The $6.15M budget assumes median vendor pricing and standard site preparation. Actual costs may vary:

| Variable | Low Case | Base Case | High Case |
|----------|----------|-----------|-----------|
| Hub equipment | $3.2M | $4.0M | $5.5M |
| Quality lab | $300K | $400K | $500K |
| Fill station | $250K | $350K | $500K |
| Recycling systems | $500K | $600K | $800K |
| Working capital | $400K | $500K | $700K |
| Soft costs | $200K | $300K | $500K |
| **Total** | **$4.85M** | **$6.15M** | **$8.5M** |

The low case assumes favorable vendor negotiations and an existing industrial building requiring minimal modification. The high case assumes premium equipment, new construction, and extended engineering. The funding mix below is sized for the base case; the high case would require approximately $2.35M in additional funding, most likely through a larger SBA or bank loan.

## Funding Mix

| Source | Amount | Terms | Probability | Timeline |
|--------|--------|-------|------------|----------|
| CHIPS Act supply chain grant | $2,000,000 | Grant (non-dilutive, no repayment) | Medium-High | 6-12 months from application |
| WA ICAP grant | $500,000 | Grant | Medium | 3-6 months |
| Member equity (5 founders x $200K) | $1,000,000 | Patronage equity, returned via revolving fund | High (within co-op control) | Month 1-3 |
| SBA 504 loan | $1,500,000 | 10-year, ~6% fixed | High | 2-4 months |
| Bank loan (equipment-secured) | $1,150,000 | 7-year, ~7% variable | High | 2-4 months |
| **Total** | **$6,150,000** | | | |

**Grant dependency analysis:** The base funding mix includes $2.5M in grants (CHIPS Act + ICAP). If both grants are received, the co-op's debt service is manageable at approximately $350K/year. If only one is received, debt increases by $500K-$2M, adding $60K-$240K/year in debt service. If neither grant is received, total debt rises to $5.15M and annual debt service approaches $700K -- still viable in Scenarios A and B but fatal in Scenario C.

**Recommendation:** Apply for all available grants (CHIPS Act, ICAP, USDA Rural Business if applicable per Document 9) but size the operation to survive with member equity plus commercial debt alone. Grant funding accelerates payback and enables expansion; it should not be required for survival.

## Revenue Model

### Product Lines (Detailed)

| Product | Unit | Normal Price | Crisis Price | Year 1 Monthly Volume | Year 1 Monthly Revenue (Base) |
|---------|------|-------------|-------------|----------------------|------------------------------|
| Grade-A gas (99.999%) | Liter equivalent | $30/L | $75/L | 5,000 L | $150K-$375K |
| Research Grade (99.9999%) | Liter | $100/L | $250/L | 500 L | $50K-$125K |
| Recycling service contracts | Monthly fee | $5K/mo | $8K/mo | 3 clients | $15K-$24K |
| Custom gas mixtures | Cylinder | $50-$200/cyl | $100-$400/cyl | 100 cyl | $10K-$20K |

**Price rationale:** Grade-A pricing is benchmarked against current merchant market rates. The co-op prices at 10-20% below oligopoly pricing while maintaining healthy margins, because the cooperative structure eliminates shareholder profit extraction. Research Grade commands a 3x+ premium because achieving 99.9999% purity requires additional processing steps and quality certification that few small suppliers can provide. Recycling service contracts (Document 21) are priced to cover equipment amortization, maintenance, and a modest margin over 5-7 years.

**Volume rationale:** 5,000 L/month of Grade-A product is approximately 1% of the East Asian semiconductor TAM described in Document 20. This is conservative -- it represents serving 3-5 mid-sized customers in the I-5 corridor (Document 7) plus occasional spot sales. Growth to 10,000+ L/month by Year 3 is achievable if the co-op establishes reliability.

## Scenario A: Bull Case -- Crisis Pricing Holds 3+ Years

**Assumptions:** Qatar force majeure continues through 2028. Spot helium prices remain at $50-$100/L. Russian Amur plant continues underperforming. New global capacity does not materially arrive until 2029. Co-op launches on schedule with full grant funding.

### Annual Summary

| Year | Revenue | COGS | Gross Margin | Operating Exp | Debt Service | Net Income |
|------|---------|------|-------------|--------------|-------------|------------|
| 1 | $3,500,000 | $1,500,000 | $2,000,000 | $800,000 | $350,000 | $850,000 |
| 2 | $5,500,000 | $2,200,000 | $3,300,000 | $900,000 | $350,000 | $2,050,000 |
| 3 | $6,500,000 | $2,500,000 | $4,000,000 | $1,000,000 | $350,000 | $2,650,000 |

**Payback: 18-22 months on member equity.** Patronage dividends begin Year 2. Expansion capital (second hub or additional recycling systems) available Year 3. Cumulative 3-year net income: $5.55M. After member equity return and reserve contributions, approximately $3M available for expansion.

### Year 1 Monthly Cash Flow (Scenario A)

| Month | Revenue | Crude He | Electricity | Labor | Maintenance | Insurance | Debt Service | Net Cash | Cumulative |
|-------|---------|----------|------------|-------|-------------|-----------|-------------|----------|------------|
| 1 | $0 | $0 | $2K | $33K | $0 | $6K | $29K | -$70K | -$70K |
| 2 | $0 | $0 | $2K | $33K | $0 | $6K | $29K | -$70K | -$140K |
| 3 | $50K | $30K | $8K | $33K | $2K | $6K | $29K | -$58K | -$198K |
| 4 | $150K | $80K | $12K | $33K | $4K | $6K | $29K | -$14K | -$212K |
| 5 | $225K | $100K | $12K | $33K | $5K | $6K | $29K | $40K | -$172K |
| 6 | $275K | $110K | $12K | $33K | $5K | $6K | $29K | $80K | -$92K |
| 7 | $300K | $120K | $12K | $33K | $6K | $6K | $29K | $94K | $2K |
| 8 | $325K | $125K | $12K | $33K | $6K | $6K | $29K | $114K | $116K |
| 9 | $350K | $130K | $12K | $33K | $7K | $6K | $29K | $133K | $249K |
| 10 | $375K | $135K | $12K | $33K | $7K | $6K | $29K | $153K | $402K |
| 11 | $400K | $140K | $12K | $33K | $8K | $6K | $29K | $172K | $574K |
| 12 | $425K | $145K | $12K | $33K | $8K | $6K | $29K | $192K | $766K |
| **Total** | **$2,875K** | **$1,115K** | **$120K** | **$396K** | **$58K** | **$72K** | **$348K** | **$766K** | |

**Notes:** Months 1-2 are commissioning (equipment testing, no production). Month 3 is first output at reduced capacity. Full production capacity reached by Month 6-7. Revenue ramp assumes sequential customer onboarding -- each new customer adds approximately $50K-$75K/month in revenue. The $500K working capital reserve covers the negative cash flow period (Months 1-6).

## Scenario B: Base Case -- Qatar Resumes in 18 Months, Prices Normalize

**Assumptions:** Qatar resumes helium exports Q3 2027. Helium prices decline from crisis levels ($75/L) to near-normal ($30-$40/L) over 6 months. Co-op launches on schedule. CHIPS Act grant received; ICAP grant delayed or denied.

### Annual Summary

| Year | Revenue | COGS | Gross Margin | Operating Exp | Debt Service | Net Income |
|------|---------|------|-------------|--------------|-------------|------------|
| 1 | $3,500,000 | $1,500,000 | $2,000,000 | $800,000 | $350,000 | $850,000 |
| 2 | $2,700,000 | $1,800,000 | $900,000 | $900,000 | $350,000 | -$350,000 |
| 3 | $2,700,000 | $1,600,000 | $1,100,000 | $900,000 | $350,000 | -$150,000 |
| 4 | $3,000,000 | $1,600,000 | $1,400,000 | $950,000 | $350,000 | $100,000 |
| 5 | $3,200,000 | $1,650,000 | $1,550,000 | $950,000 | $350,000 | $250,000 |

**Payback: ~5 years on member equity.** Year 2 is the stress point: revenue drops as crisis pricing ends, but COGS stays elevated because crude helium suppliers have raised base prices. Year 3 sees COGS decline as the market normalizes, but the co-op operates at a loss. Years 4-5 show recovery as volume grows and the co-op's reputation for reliable supply attracts customers who experienced oligopoly supply failures.

**Survival mechanism:** The Year 1 surplus ($850K) provides a buffer for Years 2-3 losses ($500K combined). The co-op draws on reserves, defers patronage dividends, and maintains operations through the transition. This is where the cooperative governance advantage (Document 22, Mondragon resilience) becomes critical: members vote to accept reduced dividends rather than cutting operations.

### Year 1 Monthly Cash Flow (Scenario B)

Year 1 cash flow is identical to Scenario A because Qatar's force majeure is still active. The divergence occurs in Year 2. See the Scenario A monthly table above.

### Year 2 Monthly Cash Flow (Scenario B -- The Stress Year)

| Month | Revenue | Crude He | Electricity | Labor | Maintenance | Insurance | Debt Service | Net Cash | Cumulative |
|-------|---------|----------|------------|-------|-------------|-----------|-------------|----------|------------|
| 13 | $400K | $150K | $12K | $33K | $8K | $6K | $29K | $162K | $928K |
| 14 | $375K | $150K | $12K | $33K | $8K | $6K | $29K | $137K | $1,065K |
| 15 | $325K | $150K | $12K | $33K | $8K | $6K | $29K | $87K | $1,152K |
| 16 | $275K | $150K | $12K | $33K | $8K | $6K | $29K | $37K | $1,189K |
| 17 | $225K | $150K | $12K | $33K | $8K | $6K | $29K | -$13K | $1,176K |
| 18 | $200K | $150K | $12K | $33K | $8K | $6K | $29K | -$38K | $1,138K |
| 19 | $180K | $140K | $12K | $33K | $7K | $6K | $29K | -$47K | $1,091K |
| 20 | $175K | $135K | $12K | $33K | $7K | $6K | $29K | -$47K | $1,044K |
| 21 | $175K | $130K | $12K | $33K | $7K | $6K | $29K | -$42K | $1,002K |
| 22 | $180K | $130K | $12K | $33K | $7K | $6K | $29K | -$37K | $965K |
| 23 | $185K | $130K | $12K | $33K | $7K | $6K | $29K | -$32K | $933K |
| 24 | $190K | $130K | $12K | $33K | $7K | $6K | $29K | -$27K | $906K |
| **Total** | **$2,885K** | **$1,695K** | **$144K** | **$396K** | **$90K** | **$72K** | **$348K** | **$140K** | |

**Critical observation:** Even in the stress year, cumulative cash position never goes negative. The Year 1 surplus provides sufficient buffer. The co-op's monthly burn rate at minimum revenue (Months 19-24) is approximately $280K/month. At $175-190K/month revenue, the monthly deficit is $35-47K -- manageable for 6-12 months from reserves without additional capital calls.

**Revenue stabilization:** Revenue bottoms around $175K/month (Months 19-21) because the co-op's customer base shifts composition. Crisis customers (spot buyers paying premium prices) disappear as the market normalizes. But core customers -- recycling service contract holders (Document 21), Research Grade buyers, and committed co-op members -- remain. Research Grade helium at $100/L maintains premium pricing even as Grade-A drops to $30/L, because the 99.9999% purity market is less price-elastic.

## Scenario C: Bear Case -- Market Collapse + Operational Problems

**Assumptions:** Qatar resumes Q1 2027 AND Amur plant reaches capacity simultaneously, creating oversupply. Helium prices crash to $20-$25/L. Hub construction delayed 3 months by permitting. One major piece of equipment fails in Month 8, requiring 6 weeks of partial operation. CHIPS Act grant denied; only ICAP grant received. One founding member withdraws.

### Annual Summary

| Year | Revenue | COGS | Gross Margin | Operating Exp | Debt Service | Net Income |
|------|---------|------|-------------|--------------|-------------|------------|
| 1 | $2,000,000 | $1,200,000 | $800,000 | $800,000 | $440,000 | -$440,000 |
| 2 | $2,000,000 | $1,500,000 | $500,000 | $900,000 | $440,000 | -$840,000 |
| 3 | $2,200,000 | $1,400,000 | $800,000 | $850,000 | $440,000 | -$490,000 |

**Payback: 7+ years, if achievable.** The co-op burns cash in all three years. Cumulative loss: $1.77M. Without intervention, the co-op exhausts its reserves by mid-Year 2.

**Debt service note:** Without the CHIPS Act grant, the co-op carries $2M more in debt, increasing annual debt service from $350K to approximately $440K. This $90K/year difference is the margin between survival and failure in the bear case.

### Year 1 Monthly Cash Flow (Scenario C)

| Month | Revenue | Crude He | Electricity | Labor | Maintenance | Insurance | Debt Service | Net Cash | Cumulative |
|-------|---------|----------|------------|-------|-------------|-----------|-------------|----------|------------|
| 1 | $0 | $0 | $2K | $33K | $0 | $6K | $37K | -$78K | -$78K |
| 2 | $0 | $0 | $2K | $33K | $0 | $6K | $37K | -$78K | -$156K |
| 3 | $0 | $0 | $2K | $33K | $0 | $6K | $37K | -$78K | -$234K |
| 4 | $25K | $20K | $5K | $33K | $2K | $6K | $37K | -$78K | -$312K |
| 5 | $100K | $60K | $10K | $33K | $4K | $6K | $37K | -$50K | -$362K |
| 6 | $175K | $90K | $12K | $33K | $5K | $6K | $37K | -$8K | -$370K |
| 7 | $225K | $100K | $12K | $33K | $6K | $6K | $37K | $31K | -$339K |
| 8 | $100K | $80K | $8K | $33K | $15K | $6K | $37K | -$79K | -$418K |
| 9 | $150K | $90K | $10K | $33K | $8K | $6K | $37K | -$34K | -$452K |
| 10 | $250K | $110K | $12K | $33K | $7K | $6K | $37K | $45K | -$407K |
| 11 | $275K | $115K | $12K | $33K | $7K | $6K | $37K | $65K | -$342K |
| 12 | $300K | $120K | $12K | $33K | $7K | $6K | $37K | $85K | -$257K |
| **Total** | **$1,600K** | **$785K** | **$99K** | **$396K** | **$61K** | **$72K** | **$444K** | **-$257K** | |

**Notes:** Month 3 is an additional construction delay month. Month 8 reflects equipment failure -- revenue drops to 40% of capacity, maintenance costs spike for emergency repair, and crude helium purchases are reduced (but not eliminated because some product in the pipeline must still be processed). The $500K working capital reserve is drawn down to $243K by Year 1 end.

### Bear Case Survival Strategies

1. **Member capital call.** Co-op bylaws (Document 19) should authorize the board to make additional capital calls in emergencies. A $50K call per remaining member (4 members if one withdrew) generates $200K.

2. **Defer patronage dividends.** In the bear case, there are no dividends to defer. But the co-op can also defer equipment replacement reserves, buying 12-18 months of reduced capital outflow.

3. **Pivot to service-only.** If crude helium processing is uneconomic at $20/L, the co-op can temporarily shut down the purification hub and operate exclusively on recycling service contracts (Document 21). Three contracts at $5K/month generate $15K/month -- not enough to cover full operations, but enough to maintain the business entity and customer relationships until the market recovers.

4. **Renegotiate debt.** Equipment-secured loans can potentially be restructured with extended terms if the co-op demonstrates a viable path to recovery.

**The bear case is the argument for grant funding.** At $350K annual debt service (with CHIPS Act grant), the co-op survives the bear case with difficulty. At $440K annual debt service (without grant), the bear case is potentially fatal. The $90K/year difference -- which is the debt service on $2M over 10 years -- determines whether the co-op survives a worst-case scenario.

## Sensitivity Analysis

### Impact on Year 2 Net Income (Base Case)

| Variable | Change | Impact on Net Income | Explanation |
|----------|--------|---------------------|-------------|
| Helium selling price | +/- $10/L | +/- $660K | Price x annual volume (66,000 L); dominant variable |
| Helium selling price | +/- $20/L | +/- $1,320K | At -$20/L from base, co-op crosses into loss territory |
| Crude helium cost | +/- 20% | +/- $360K | Crude is ~60% of COGS |
| Sales volume | +/- 20% | +/- $540K | Revenue impact partially offset by variable COGS savings |
| Electricity cost | +/- $0.02/kWh | +/- $42K | Relatively minor at hub scale |
| Equipment downtime | 1 month | -$300K | Lost revenue + ongoing fixed costs |
| Staffing | +1 FTE | -$100K | Including benefits at 30% |
| Interest rate | +/- 2% | +/- $53K | On combined $2.65M in loans |

**Key finding: helium selling price is the dominant variable.** A $20/L swing in selling price has 3x the impact of a 20% change in crude costs and 30x the impact of electricity pricing. This is why the scenario analysis focuses primarily on price trajectories.

### Breakeven Analysis

| Metric | Value | Notes |
|--------|-------|-------|
| Breakeven helium price (Grade-A) | ~$22/L equivalent | Below pre-crisis normal ($25-$35/L) |
| Breakeven monthly volume | ~3,500 L equivalent | 70% of Year 1 target capacity |
| Breakeven customer count | ~5 regular accounts | Mix of Grade-A, Research Grade, and service contracts |
| Minimum viable annual revenue | ~$2.5M | Covers all COGS + operating expenses + debt service |

**The breakeven price of $22/L is critical.** It means the co-op is viable at any helium price above $22/L -- which includes all but the most extreme bear-case pricing. Pre-crisis normal pricing ($25-$35/L) keeps the co-op in positive territory, though with thin margins. Crisis pricing ($50-$100/L) generates substantial surplus. The co-op does not require crisis pricing to survive -- it requires crisis pricing to thrive and expand quickly.

### NPV Analysis (10-Year Horizon, 8% Discount Rate)

| Scenario | NPV of Cash Flows | NPV Net of Investment | IRR |
|----------|-------------------|----------------------|-----|
| A (Bull) | $12.8M | $6.7M | 42% |
| B (Base) | $4.2M | -$1.9M at Year 5; +$2.1M at Year 10 | 11% |
| C (Bear) | -$1.2M | -$7.4M | Negative |

**Interpretation:** Scenario A is an exceptional investment. Scenario B is a viable long-term investment that requires patience through Years 2-3. Scenario C destroys value and should be avoided through conservative operational sizing and maximum grant funding.

**Probability-weighted NPV:** Assigning subjective probabilities of 30% (A), 50% (B), 20% (C):

Weighted NPV = (0.30 x $6.7M) + (0.50 x -$1.9M) + (0.20 x -$7.4M) = $2.01M - $0.95M - $1.48M = **-$0.42M at Year 5**
Weighted NPV at Year 10 = (0.30 x $6.7M) + (0.50 x $2.1M) + (0.20 x -$7.4M) = **$1.58M**

The probability-weighted NPV is negative at Year 5 but positive at Year 10. This is a long-term cooperative investment, not a short-term speculation. The cooperative structure (patient capital, member commitment, no quarterly earnings pressure) is specifically suited to this return profile. A venture-capital-funded startup with the same financials would likely not attract investment. A cooperative with committed members can sustain the timeline.

## Cash Flow Waterfall (Scenario B -- Base Case, Steady State Year 4)

```
Revenue                              $3,000,000
  Grade-A gas (80% of volume)        $2,000,000
  Research Grade (8% of volume)        $600,000
  Recycling service contracts          $240,000
  Custom gas mixtures                  $160,000

Less: Cost of Goods Sold            ($1,600,000)
  Crude helium purchases            ($1,000,000)
  Electricity (hub operations)        ($145,000)
  Cylinder/dewar consumables          ($100,000)
  Quality testing materials            ($55,000)
  Transport (crude to hub)            ($200,000)
  Delivery (hub to customer)          ($100,000)

GROSS MARGIN                         $1,400,000  (46.7%)

Less: Operating Expenses              ($950,000)
  Labor (3.25 FTE + benefits)         ($390,000)
  Facility lease/mortgage             ($180,000)
  Insurance                            ($75,000)
  Professional services (CPA, legal)   ($60,000)
  Marketing and member relations       ($30,000)
  Office and IT                        ($25,000)
  Equipment replacement reserve       ($150,000)
  Contingency (5% of revenue)          ($40,000)

Less: Debt Service                    ($350,000)
  SBA loan ($1.5M at 6%, 10yr)       ($200,000)
  Bank loan ($1.15M at 7%, 7yr)      ($150,000)

OPERATING SURPLUS                      $100,000

Distribution:
  Patronage dividends (50%)            ($50,000)  -> to members
  Retained by co-op (50%)             ($50,000)  -> expansion fund
```

## Staffing Model

| Role | FTE | Annual Cost (with benefits) | Responsibilities |
|------|-----|---------------------------|-----------------|
| General Manager / Operations | 1.0 | $156,000 | Day-to-day operations, customer relations, board liaison, safety compliance |
| Process Technician | 1.0 | $104,000 | Hub equipment operation, crude receiving, product filling, maintenance |
| Quality / Lab Technician | 0.5 | $52,000 | GC/mass spec analysis, purity certification, records management |
| Delivery / Logistics | 0.5 | $45,500 | Cylinder/dewar delivery, crude helium receiving, inventory management |
| Bookkeeper (part-time) | 0.25 | $32,500 | Accounts payable/receivable, payroll, financial reporting |
| **Total** | **3.25** | **$390,000** | |

**Board of directors:** Unpaid governance, per cooperative norms. Board members are compensated only for meeting expenses and travel. Board meets monthly during Year 1, quarterly thereafter.

**Scaling:** Year 2+ may require an additional process technician ($104K) if volume exceeds 7,500 L/month. Year 3+ may require a dedicated sales/business development role ($130K) if the co-op pursues export customers via the Port of Tacoma (Document 7).

## Key Financial Decisions

### Decision 1: Lease vs. Buy Facility

| Factor | Lease | Buy |
|--------|-------|-----|
| Upfront cost | $0 (first/last/security ~$50K) | $800K-$1.5M (down payment on industrial property) |
| Monthly cost | $8K-$15K | $10K-$18K (mortgage, higher but building equity) |
| Flexibility | Can relocate if market shifts | Locked to location |
| Long-term cost | Higher (no equity) | Lower (building equity, eventual ownership) |
| **Recommendation** | **Year 1-3** | **Year 4+ if operations prove viable** |

### Decision 2: Equipment Purchase vs. Lease-to-Own

| Factor | Purchase | Lease-to-Own |
|--------|----------|-------------|
| Upfront cost | Full capital outlay | 20-30% down, monthly payments |
| Total cost (7 years) | Lower (no financing premium) | Higher (implicit interest rate 8-12%) |
| Tax treatment | Depreciation (MACRS 7-year) | Lease payments deductible |
| Flexibility | Co-op owns equipment outright | Return option if business fails |
| **Recommendation** | **If grant funding received** | **If grant funding denied (preserves cash)** |

### Decision 3: Pricing Strategy -- Market Rate vs. Cost-Plus

| Strategy | Pro | Con | When |
|----------|-----|-----|------|
| Market rate (match oligopoly pricing) | Maximum revenue during crisis | Members may feel they are not benefiting from co-op | Year 1 (build reserves) |
| Cost-plus-margin (cooperative pricing) | Members get below-market prices; builds loyalty | Lower revenue, slower reserve accumulation | Year 2+ (once reserves adequate) |
| Hybrid (market rate to non-members, cost-plus to members) | Maximizes revenue while rewarding membership | Complexity, potential resentment from non-member customers | **Recommended approach** |

## The Bottom Line

The financial model works across Scenarios A and B. Scenario C is survivable with grant funding and aggressive cost management. The cooperative structure -- patient capital, member commitment, democratic governance, no shareholder extraction -- is specifically suited to the return profile: modest returns in normal times, exceptional returns during crises, and survival tools (capital calls, deferred dividends, inter-cooperation) during downturns.

The probability-weighted 10-year NPV of $1.58M on a $6.15M investment is not a venture-capital return. It is a cooperative return: steady, community-benefiting, and resilient. The members do not get rich. They get reliable helium supply at below-market prices, patronage dividends proportional to usage, and the knowledge that their supply chain does not depend on the Strait of Hormuz or a corporate board meeting in Munich.

The question is not whether the numbers work. They do, in two of three scenarios and arguably in all three with proper grant funding. The question, as Document 19 concludes, is whether five people are willing to put in the work to make it happen.
