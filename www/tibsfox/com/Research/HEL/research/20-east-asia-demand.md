# East Asian Semiconductor Helium Demand — Quantified Market Analysis

## What This Document Establishes

This document quantifies the helium consumption of the East Asian semiconductor industry (Taiwan, South Korea, Japan), projects demand growth through 2030, and calculates the addressable market for a PNW cooperative helium supplier. It provides the demand-side foundation for the financial model in Document 23 and the justification for including liquefaction and port access in the hub design (Document 18).

**Caveat:** Fab-level helium consumption is proprietary. TSMC, Samsung, and SK Hynix do not publish helium usage figures. Numbers below are estimates synthesized from industry analyst reports (Kornbluth Helium Consulting, Edison Investment Research), gas supplier disclosures in annual reports and investor presentations, SEMI industry data, and conference presentations at Gasworld and CryoGas conferences. Ranges reflect genuine uncertainty, not imprecision. Where a single-point estimate would be misleading, we provide ranges.

## How Semiconductor Fabs Consume Helium

### Per-Fab Consumption at Leading Edge

A single leading-edge fab operating at the 3nm or 2nm process node consumes approximately:

- **200,000-400,000 liters** liquid helium equivalent per year
- **17,000-33,000 liters per month**
- **50-100 Mcf per month** (thousand cubic feet of gaseous helium)

The wide range reflects three variables: fab capacity utilization (a fully loaded fab at 90%+ utilization consumes more than one ramping at 50%), number of EUV lithography layers in the process flow (more EUV layers means more helium per wafer), and whether the fab produces logic or memory (logic fabs at leading edge use more EUV layers than most memory fabs, though EUV DRAM is closing this gap).

### Use Breakdown by Application

| Application | Share of Total Fab Helium | Technical Explanation | Trend |
|-------------|--------------------------|----------------------|-------|
| **EUV lithography purging and cooling** | 35-45% | EUV systems operate in vacuum with helium-purged optical paths. The EUV source (laser-produced plasma from tin droplets) requires helium for debris mitigation and optics cooling. Each EUV exposure tool (ASML NXE:3600D or newer) consumes helium continuously during operation. | Growing. Each node adds EUV layers: ~14 at 5nm, ~20 at 3nm, potentially 25+ at 2nm. High-NA EUV (ASML EXE:5000 series, deploying 2025-2027) may increase per-tool consumption further. |
| **Carrier gas (CVD/PVD/etch)** | 20-30% | Helium serves as an inert carrier gas in chemical vapor deposition, physical vapor deposition, and plasma etch chambers. It transports precursor chemicals without participating in reactions. | Stable. Mature application, incremental growth with fab capacity. |
| **Leak detection** | 10-15% | Helium mass spectrometry is the standard method for detecting vacuum leaks in process chambers, gas delivery systems, and load locks. Helium's small atomic radius allows it to permeate through the smallest cracks. | Stable. Essential for process integrity at every node. |
| **Wafer/chuck cooling** | 10-15% | During plasma etch and ion implantation, wafers are clamped to an electrostatic chuck. Helium is introduced between the wafer backside and the chuck surface to conduct heat away from the wafer. Helium's thermal conductivity (the highest of any gas) makes it uniquely suitable. | Stable to growing. Higher-power processes at advanced nodes increase cooling demand. |
| **Other (metrology, line purging)** | 5-10% | Gas delivery line purging, analytical instrument carrier gas, cleanroom tool purging between maintenance cycles. | Stable. |

**The critical insight:** EUV lithography is driving helium demand growth in semiconductors. Every node shrink adds EUV layers. The transition from DUV to EUV multiplied per-wafer helium consumption; the transition from standard EUV to High-NA EUV will increase it further. A 2nm fab with 25+ EUV layers uses substantially more helium than a 5nm fab with 14 EUV layers -- even at identical wafer throughput.

## East Asian Fab Count and Capacity (2025-2026)

### Taiwan (~12-15 Leading-Edge Fabs, 7nm and Below)

**TSMC** dominates Taiwan's leading-edge capacity. TSMC operates approximately 8-10 leading-edge fabs (7nm and below) across three campuses:

| Facility | Location | Node | Status (March 2026) |
|----------|----------|------|---------------------|
| Fab 18, Phases 1-6 | Tainan Science Park | 5nm / 3nm | Production (Phases 1-4 at 5nm, Phases 5-6 at 3nm) |
| Fab 20 | Hsinchu Science Park | 2nm (N2) | Construction / early ramp, pilot production 2025-2026 |
| Fab 22 | Kaohsiung Science Park | 2nm (N2) | Under construction |
| Existing logic fabs | Hsinchu, Taichung | 7nm / 5nm | Production |

TSMC has publicly disclosed helium recovery programs achieving over 80% recovery at some Fab 18 phases. This reduces but does not eliminate their need for external helium supply. Even with 80% recovery, a large fab complex consuming 2-4 million liters annually still needs 400,000-800,000 liters of fresh supply to replace the unrecovered fraction plus growth.

**UMC and other Taiwan fabs:** UMC operates trailing-edge and mid-range fabs (28nm and above) that consume less helium per wafer but still represent meaningful aggregate demand. Powerchip, Vanguard, and PSMC add additional capacity.

### South Korea (~8-10 Leading-Edge Fabs)

**Samsung Semiconductor** operates the largest integrated semiconductor complex in the world at Pyeongtaek:

| Facility | Location | Products | Status |
|----------|----------|----------|--------|
| Pyeongtaek P1 | Pyeongtaek, Gyeonggi | NAND, DRAM | Production |
| Pyeongtaek P2 | Pyeongtaek | Logic foundry (3nm GAA) | Production |
| Pyeongtaek P3 | Pyeongtaek | Advanced logic + memory | Ramping |
| Pyeongtaek P4 | Pyeongtaek | Next-generation | Under construction |
| Hwaseong | Hwaseong, Gyeonggi | Logic foundry, DRAM | Production |

Samsung has recovery programs operational at the Pyeongtaek campus, though recovery rates have not been publicly disclosed.

**SK Hynix** is Korea's second semiconductor manufacturer, focused on memory:

| Facility | Location | Products | Status |
|----------|----------|----------|--------|
| Icheon M16 | Icheon, Gyeonggi | DRAM (DDR5, HBM3E) | Production |
| Cheongju M15 | Cheongju, Chungbuk | NAND, DRAM packaging | Production |
| Yongin | Yongin, Gyeonggi | Next-generation DRAM | Under construction |

**EUV DRAM is a helium demand accelerator.** SK Hynix's transition to EUV-based DRAM (essential for DDR5 and HBM3E/HBM4) means memory fabs now consume helium at rates approaching logic fab levels. HBM (High Bandwidth Memory) for AI accelerators is particularly helium-intensive: each HBM stack uses EUV DRAM dies, and global HBM production is scaling aggressively to meet AI chip demand (NVIDIA H100/H200/B100 all use HBM).

### Japan (~2-3 Leading-Edge, Growing)

Japan is rebuilding its semiconductor manufacturing capability after decades of decline:

| Facility | Location | Node | Status |
|----------|----------|------|--------|
| TSMC JASM Fab 1 | Kumamoto | 12nm / 6nm | Operational (production started 2024) |
| TSMC JASM Fab 2 | Kumamoto | 6nm / advanced | Under construction |
| Rapidus | Chitose, Hokkaido | 2nm | Targeting 2027 pilot production |
| Kioxia/WD Yokkaichi | Yokkaichi, Mie | NAND | Production |
| Kioxia/WD Kitakami | Kitakami, Iwate | NAND | Production / expanding |

**Rapidus** is the most significant new entrant. A joint venture backed by the Japanese government (METI committed 920 billion yen / ~$6 billion), Toyota, Sony, NTT, and others, Rapidus aims to produce 2nm chips by 2027. If successful, Rapidus will be a major new helium consumer in the region.

**Kioxia/Western Digital** NAND operations are significant helium consumers (NAND uses helium in etch processes), though per-wafer consumption is lower than leading-edge logic.

**Total across three countries: approximately 25-30 leading-edge fabs operating or under construction, plus 15-20 trailing-edge and memory fabs with significant helium consumption.**

## Company-Level Demand Estimates

### TSMC

| Metric | Estimate | Basis |
|--------|----------|-------|
| Leading-edge fabs (7nm and below) | 8-10 | Public fab announcements and production disclosures |
| Estimated annual helium consumption | 2,000,000-4,000,000 liters LHe equivalent | 200K-400K L/fab/year x 8-10 fabs, partially offset by recovery |
| Recovery rate (where deployed) | 80%+ at some Fab 18 phases | TSMC ESG report disclosure |
| Net external supply requirement | 400,000-1,200,000 L/year | After recovery; depends on how many fabs have recovery installed |

### Samsung

| Metric | Estimate | Basis |
|--------|----------|-------|
| Leading-edge fabs (logic + memory) | 6-8 | Pyeongtaek + Hwaseong campuses |
| Estimated annual helium consumption | 1,500,000-3,000,000 liters LHe equivalent | Includes both logic foundry and DRAM/NAND operations |
| Net external supply requirement | 600,000-1,500,000 L/year | Less aggressive recovery deployment than TSMC based on available disclosures |

### SK Hynix

| Metric | Estimate | Basis |
|--------|----------|-------|
| Fabs (memory, EUV-enabled) | 3-5 | Icheon + Cheongju + Yongin (construction) |
| Estimated annual helium consumption | 500,000-1,500,000 liters LHe equivalent | Growing rapidly due to EUV DRAM and HBM scaling |
| Net external supply requirement | 300,000-900,000 L/year | Recovery programs in early deployment |

### Adjacent Market: Helium-Filled Hard Drives

Seagate and Western Digital use helium-filled hard drives (helium's lower density vs. air reduces internal turbulence, enabling more platters per drive):
- Single drive: approximately 0.3-0.5 liters of helium
- Global HDD helium consumption: approximately 10-15 million liters per year
- Approximately 60% of helium HDD manufacturing is in Thailand, China, and Malaysia (not in the three primary target countries)
- The remaining 40% is in the target region (Japan HDD operations) and the US

This is an adjacent market that a PNW corridor could partially serve, but it is not the primary target. HDD demand is declining long-term as solid-state drives replace hard drives in enterprise storage. Semiconductor helium demand is growing. The co-op should focus on the growing market.

## Total Addressable Market (TAM)

### Semiconductor Helium Only (Taiwan + South Korea + Japan)

| Metric | Conservative | Mid-Range | Aggressive |
|--------|-------------|-----------|-----------|
| Annual volume (liters LHe equiv) | 6,000,000 | 8,000,000 | 10,000,000 |
| Value at normal contract prices ($25-35/L) | $150,000,000 | $240,000,000 | $350,000,000 |
| Value at crisis prices ($50-100/L) | $300,000,000 | $600,000,000 | $1,000,000,000 |

### Including HDD and Broader Industrial (Broader East Asia)

| Metric | Value |
|--------|-------|
| Additional HDD volume | 10,000,000-15,000,000 L/year |
| Additional HDD value | $100,000,000-$150,000,000/year at normal prices |
| Broader industrial (quantum computing, research labs, medical) | $50,000,000-$100,000,000/year |
| **Combined TAM (normal pricing)** | **$300,000,000-$600,000,000/year** |
| **Combined TAM (crisis pricing)** | **$450,000,000-$1,250,000,000/year** |

### Global Context

Global helium consumption is approximately 6 billion cubic feet per year (roughly 170 million liquid liter equivalent). East Asian semiconductor + HDD + industrial represents roughly 10-15% of global demand -- and growing faster than the overall market. The semiconductor fraction alone is growing at 8-12% CAGR while the overall helium market grows at 3-4% CAGR. Semiconductors are taking an increasing share of global helium supply.

## Demand Growth Projection Through 2030

Industry consensus sources: Kornbluth Helium Consulting (Phil Kornbluth is the most cited independent helium analyst), Edison Investment Research (publishes periodic helium market reports), SEMI (semiconductor industry association quarterly reports), and company disclosures in earnings calls and investor presentations.

**Semiconductor-grade helium CAGR: 8-12% through 2030**, driven by:

1. **EUV layer count increase per node.** N3 (TSMC 3nm): ~20 EUV layers. N2 (2nm): potentially 25+ EUV layers. A20 (Samsung 2nm GAA): similar. Each additional EUV layer adds helium consumption per wafer pass.

2. **High-NA EUV deployment (2025-2028).** ASML's EXE:5000 series uses a 0.55 NA optics system that may change helium consumption patterns. Per-tool consumption data is not yet public. If per-tool consumption increases, this accelerates demand; if High-NA reduces the number of multipatterning passes needed, the net effect on helium demand depends on the balance between per-pass and total-passes changes.

3. **New fab construction.** TSMC is building in Arizona (2 fabs), Japan (2 fabs), and Germany (1 fab). Samsung is expanding in Taylor, TX (1-2 fabs). Intel is building in Ohio, Arizona, and Germany. Each new fab adds 200,000-400,000 L/year of helium demand regardless of location.

4. **HBM production scaling.** AI chip demand (NVIDIA, AMD, custom silicon for hyperscalers) is driving explosive growth in High Bandwidth Memory. SK Hynix, Samsung, and Micron are all expanding HBM capacity. Each HBM stack uses multiple EUV DRAM dies. SK Hynix's Yongin fab (under construction) is dedicated to next-generation HBM.

5. **Quantum computing facility buildout.** Dilution refrigerators for superconducting quantum computers (IBM, Google, Rigetti) use Helium-3 and Helium-4. While the total volume is small compared to semiconductor fabs, the price premium for research-grade and He-3 helium is extreme. A co-op producing Research Grade (99.9999%) helium can serve this niche at high margins.

**Projection:**

| Year | East Asia Semiconductor Helium Demand (L LHe equiv) | Growth from 2025 |
|------|-----------------------------------------------------|-----------------|
| 2025 | ~8,000,000 | Baseline |
| 2026 | ~9,000,000 | +12% (crisis acceleration of recovery investments, but new fabs ramping) |
| 2027 | ~10,000,000 | +25% (Rapidus pilot, TSMC N2 volume, HBM expansion) |
| 2028 | ~11,500,000 | +44% (High-NA EUV deployment, Yongin ramp) |
| 2029 | ~13,000,000 | +63% (all major fabs at or near capacity) |
| 2030 | ~14,500,000 | +81% (next node cycle begins, quantum computing growth) |

These projections assume no major supply disruption beyond the current crisis and no fundamental technology change that eliminates helium use in semiconductors. Both are reasonable assumptions through 2030.

## What a PNW Corridor Could Realistically Capture

A new, small-scale cooperative supplier will not displace Linde, Air Liquide, or Air Products. Those companies have decades-long relationships, on-site gas supply agreements, and massive infrastructure. The co-op's market position is different: **a reliable, diversified, redundant alternative source** for customers who just learned the hard way that depending on a single supply chain is catastrophic.

### Market Entry Strategy

**Step 1: Domestic PNW customers (Year 1-2).** Serve Intel D1X (Hillsboro), OHSU, OSU, PSU, and other PNW research institutions and small fabs. These are within 100 miles of candidate hub locations (see Document 18). Delivery is by truck, no export logistics required. This is the revenue base during hub ramp-up.

**Step 2: US West Coast expansion (Year 2-3).** Serve semiconductor and research customers in the San Francisco Bay Area, Sacramento, and Southern California via truck or rail from the PNW hub. The I-5 corridor extends the co-op's reach south.

**Step 3: East Asian export (Year 2-4).** Ship liquid helium via ISO container from Port of Tacoma/NWSA to East Asian ports. Transit time: 15-25 days (well within the 35-48 day ISO container holding window). Target customers: TSMC supply chain managers looking for supply diversification, Samsung procurement (which has publicly stated interest in supply chain resilience), Japanese fabs (Rapidus, JASM) with emerging demand and limited local supply (Australia's Darwin plant closed in 2023).

### Realistic Market Capture Scenarios

| Scenario | Annual Volume | Annual Revenue (Normal Pricing) | Annual Revenue (Crisis Pricing) | What It Requires |
|----------|-------------|------|------|------|
| **0.5% of East Asian semiconductor TAM** | 40,000-50,000 L | $1,000,000-$1,750,000 | $2,000,000-$5,000,000 | 1-2 contract customers, small hub, gas-phase delivery |
| **1% of TAM** | 80,000-100,000 L | $2,000,000-$3,500,000 | $4,000,000-$10,000,000 | 3-5 contract customers, hub with liquefaction, ISO container export |
| **2% of TAM** | 160,000-200,000 L | $4,000,000-$7,000,000 | $8,000,000-$20,000,000 | 5-10 contract customers, expanded hub capacity, dedicated export logistics |

Even 0.5% of the East Asian semiconductor market represents a viable business for a cooperative operating at the scale described in Documents 18 and 23. The co-op does not need to be big. It needs to be reliable, high-quality, and present when the alternatives are not.

### Competitive Positioning

| Advantage | Why It Matters to East Asian Buyers |
|-----------|--------------------------------------|
| **Supply diversification** | After the March 2026 crisis, every major fab procurement team is under mandate to diversify helium sources. A PNW co-op is geographically and geopolitically independent from Qatar, Russia, and the Midcontinent oligopoly. |
| **West Coast port access** | Port of Tacoma to Kaohsiung: 15-20 days. Port of Tacoma to Busan: 12-16 days. Port of Tacoma to Tokyo/Yokohama: 10-14 days. These are competitive transit times. See Document 7 for port details. |
| **Quality certification** | Semiconductor fabs require Grade-A (99.999%) with documented purity verification. The co-op's quality lab (Document 18) provides batch-level certificates of analysis. This is table stakes, not a differentiator -- but the absence of quality certification is an absolute disqualifier. |
| **Reliability of cooperative structure** | A co-op does not have shareholder pressure to maximize short-term margins. It can offer stable, predictable pricing to long-term customers. For a fab procurement manager, price stability is worth more than price minimization. |
| **PNW clean energy** | Helium purified with hydroelectric power has a lower carbon footprint than helium processed with fossil fuel electricity (see Document 24). For ESG-conscious companies (TSMC, Samsung, and SK Hynix all publish sustainability reports), this is a meaningful procurement consideration. |

### Risks to Market Entry

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Incumbent gas suppliers lock customers into long-term exclusivity | Medium | Cannot access major fab customers | Target fab customers with expiring contracts or no current long-term agreement. Offer trial volumes. Position as supplementary/emergency supply, not primary replacement. |
| Crisis resolves quickly (Qatar resumes within 12 months) | Low-Medium | Pricing normalizes, urgency to diversify fades | The co-op's financial model (Document 23, Scenario B) shows viability at normalized prices. Customer relationships built during the crisis persist after it. Structural vulnerability does not go away when the immediate crisis ends. |
| Australian production scales and captures East Asian market | Medium (3-5 year horizon) | Australian helium is closer to East Asian customers than PNW helium | Australia has massive potential reserves (Amadeus Basin, see Document 4) but development timelines are 3-5+ years. The PNW co-op's advantage is speed to market. Establish customer relationships before Australian supply scales. |
| Quality failure damages co-op reputation | Low | Loss of customer confidence, potentially permanent | Invest in quality lab from day one (Document 18). Implement batch testing before release. Carry product liability insurance. See Document 15 for inline purity monitoring. |
| Shipping logistics failure (ISO container breach, boil-off loss) | Low | Financial loss on one shipment, potential customer impact | Use experienced cryogenic logistics providers. Insure each shipment. Maintain buffer inventory at the hub. Ship with adequate margin before holding time expiration. |

## Decision Framework for Export Timing

**Should the co-op build export capability in Phase 1 or Phase 2?**

| Factor | Phase 1 (Build Now) | Phase 2 (Add Later) |
|--------|--------------------|--------------------|
| Capital cost | Higher ($500K-$2M for liquefier) | Deferred, funded by Phase 1 revenue |
| Revenue opportunity | Access to $150M-$350M East Asian TAM from day one | Domestic-only market ($5M-$20M PNW TAM) in Phase 1 |
| Complexity | Liquefaction + ISO container logistics + customs | Gas-phase operations only |
| Risk | More capital at risk before proving domestic market | Misses export window if crisis resolves before Phase 2 |
| Hub design implication | Must include liquefier space, dewar storage, ISO loading in initial design (Document 18) | Can retrofit, but retrofitting is 20-40% more expensive than building it in |

**Recommendation based on the financial model (Document 23):** If the co-op secures CHIPS Act funding ($2M+), build liquefaction in Phase 1. The grant reduces the capital risk, and the export market is the co-op's strongest long-term revenue source. If the co-op proceeds without grant funding (member equity + debt only), defer liquefaction to Phase 2 and focus Phase 1 on domestic gas-phase sales to build revenue. Even without liquefaction, the hub can sell compressed gas to PNW customers and generate sufficient revenue for Phase 2 investment (Document 23, Scenario B).

## Cross-Reference Map

- **Document 4** (Global Production): Where helium comes from globally, including Australian projects that could compete for East Asian market share
- **Document 5** (Market Crisis): The demand shock driving East Asian procurement diversification
- **Document 7** (I-5 Corridor): Port of Tacoma access and shipping routes to East Asia
- **Document 8** (Semiconductor Fabs): How fabs use helium, why consumption is growing
- **Document 9** (Economics): ROI at various price levels and market capture rates
- **Document 15** (PSA Equipment): Equipment that produces the Grade-A helium required by semiconductor customers
- **Document 17** (Crude Sourcing): How the PNW hub gets its feed stock (independent of the East Asian market it serves)
- **Document 18** (Hub Design): Facility specifications including liquefaction and ISO container loading
- **Document 21** (Recycling Deep Dive): Recycling as a service offering to East Asian fabs (install-operate-maintain model)
- **Document 23** (Financial Model): How East Asian export revenue flows into the financial projections and scenario analysis
- **Document 24** (Environmental Impact): Clean energy advantage for ESG-conscious East Asian customers
