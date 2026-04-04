# PSA Equipment & Vendor Landscape — What to Buy, From Whom, and in What Order

## The Architecture: Two Stages in Series

A small-scale helium extraction system combines two technologies in series: a **membrane front-end** for bulk separation (enriching 0.5-5% feed gas to 50-80% helium) followed by a **PSA polishing unit** achieving 99.999% (Grade 5N) purity. This two-stage approach is more practical and cheaper than either technology alone. Attempting to reach 5N purity with membranes alone requires excessive staging and loses too much helium in the reject stream. Attempting to handle low-concentration feed gas with PSA alone requires oversized beds and dramatically higher capital costs. The membrane does the heavy lifting on volume; the PSA does the precision work on purity.

Understanding why this matters: the feed gas arriving at a co-op hub (see Document 17 for sourcing and transport) is 50-70% helium if sourced from primary producers, or as low as 0.5-5% if processing raw well gas at an extraction node. The equipment selection depends entirely on which part of the supply chain you are building.

## Step-by-Step Equipment Selection Pathway

### Step 1: Define Your Feed Gas Profile (Week 1-2)

Before contacting any vendor, you need three numbers:

1. **Feed gas helium concentration** (% by volume). Get this from the crude helium supplier's certificate of analysis, or from well gas assays if you are building an extraction node. See Document 4 for active producers who can provide this data.
2. **Feed gas flow rate** (SCFM or Nm3/hr). This determines equipment sizing. A 10-node co-op hub typically processes 100-500 SCFM of feed gas.
3. **Contaminant profile** (nitrogen, methane, CO2, moisture, hydrogen sulfide). Some contaminants poison membranes or foul PSA adsorbent beds. Hydrogen sulfide above 10 ppm requires upstream scrubbing before either technology.

**Decision tree:**
- If feed gas is already 50-70% helium (purchased crude from a primary producer): skip the membrane stage. Go directly to PSA polishing. This saves $200K-$400K and simplifies operations.
- If feed gas is 5-50% helium (partially enriched or high-grade well gas): a single membrane stage followed by PSA is the standard architecture.
- If feed gas is 0.5-5% helium (raw well gas or byproduct gas): you need a multi-stage membrane front-end before PSA. Capital costs increase significantly. Evaluate whether it is more economical to purchase crude helium at 50-70% than to build extraction equipment. See Document 23 for the financial model behind this decision.
- If feed gas is below 0.3% helium: not economically viable for extraction at any scale. See Document 16 for why PNW geology falls into this category.

### Step 2: Select the Membrane System (If Needed) (Week 2-4)

The membrane front-end is the first process stage. Hollow-fiber polyimide membranes exploit helium's small molecular size and high diffusivity to separate it from nitrogen, methane, and other bulk gases. Helium permeates through the membrane wall; bulk gases are rejected.

**Vendor options, ranked by relevance to co-op scale:**

**Evonik (SEPURAN Noble)** -- The leading membrane specifically optimized for helium separation.
- Product line: SEPURAN Noble hollow-fiber polyimide modules
- Available in standard 4-inch and 8-inch diameter housings
- Per-module cost: $5,000-$20,000
- Complete skid-mounted system (housing, interconnecting piping, instrumentation, controls): $100,000-$400,000
- Operating pressure: 150-600 psig feed
- Helium recovery per stage: 60-80%
- Advantage: modules are available through licensed system integrators, allowing competitive bidding on the skid fabrication
- Limitation: Evonik sells modules, not complete systems. You need a system integrator (see Step 5) to design and build the skid.
- Website: evonik.com/sepuran

**Air Liquide Advanced Separations (MEDAL)** -- The incumbent in industrial membrane gas separation.
- Product line: MEDAL He-Sep hollow-fiber polyimide modules
- Standard 4-inch and 8-inch diameter housings
- Single 8-inch module handles 50-200 SCFM feed gas at 150-600 psig
- Complete multi-stage skid: $200,000-$800,000
- Advantage: Air Liquide can provide turnkey systems including engineering, installation, and commissioning. They have deployed hundreds of membrane systems globally.
- Limitation: Air Liquide is also a helium competitor (they sell helium). Their membrane division operates independently, but some co-op members may prefer a vendor without a conflict of interest.
- Note: MEDAL membranes alone rarely achieve better than 90-95% helium. For 5N purity, PSA polishing is still required downstream.

**Generon (Houston, TX)** -- A second-tier option with solid industrial gas membrane experience.
- Membrane systems for helium-specific gas separation
- Complete packaged skids: $150,000-$600,000
- Strength in Gulf Coast and midcontinent installations
- Worth requesting a quote as a competitive benchmark against Evonik and MEDAL

**Key membrane system specifications to request in your RFQ:**
- Helium recovery rate at specified feed composition and pressure
- Number of stages required to reach target enrichment (50-80%)
- Pressure drop across each stage
- Membrane replacement interval and cost
- Compressor requirements (feed gas must be compressed to membrane operating pressure)
- Utility requirements (power, cooling water)
- Footprint and weight (for building planning -- see Document 18)

### Step 3: Select the PSA System (Week 2-4, Parallel with Step 2)

Pressure Swing Adsorption is the polishing step that takes enriched helium (50-80% from membranes, or 50-70% from purchased crude) and purifies it to 99.999% (Grade-A) or 99.9999% (Research Grade). PSA works by pressurizing a bed of adsorbent material (carbon molecular sieve or zeolite) that preferentially adsorbs nitrogen, oxygen, and other impurities while allowing helium to pass through. When the bed is saturated, pressure is released (the "swing"), regenerating the adsorbent and releasing impurities to exhaust.

**Vendor options, ranked by relevance:**

**Chart Industries** -- The dominant vendor at small-to-mid scale. This is the first call for most co-op configurations.
- Product line: TITAN Helium PSA systems
- Skid-mounted, factory-tested, designed for remote or semi-attended operation
- Capacity range: 50-5,000 SCFH feed gas
- Small units (50-500 SCFH): $150,000-$500,000
- Large skids (1,000-5,000 SCFH): $1,000,000-$3,000,000
- Technology: Carbon molecular sieve (CMS) and zeolite beds in 2-bed or 4-bed configurations
- Recovery rate: 85-95% depending on feed composition and bed configuration
- Purity: 99.999% standard, 99.9999% available with additional polishing
- Lead time (early 2026): 24-36 weeks. Extended from pre-crisis 12-20 weeks due to demand surge.
- Chart also manufactures helium liquefiers (see Step 4), allowing a single-vendor solution for PSA + liquefaction.
- Website: chartindustries.com

**Guild Associates (Dublin, OH)** -- A smaller, specialized vendor with deep expertise at co-op scale.
- Small PSA systems for specialty gas purification including helium
- Capacity: 10-500 SCFM
- Price: $100,000-$500,000
- Strength: Guild has decades of experience with unusual feed gas compositions and non-standard applications. If your feed gas has an unusual contaminant profile, Guild is likely to have seen it before.
- Worth contacting directly alongside Chart for competitive bidding
- Website: guildassociates.com

**Parker Hannifin (formerly Balston/domnick hunter)** -- Entry-level option for proving concepts.
- Small membrane and PSA modules for lab and pilot scale
- Price: $50,000-$200,000
- Best for: a proof-of-concept installation or a small research lab that wants to purify helium in-house
- Not recommended for production-scale co-op hub operations
- Website: parker.com/gas-separation

**Decision tree for PSA vendor selection:**
- If your budget for the PSA stage alone is under $500K: Guild Associates or Parker (smaller systems, faster delivery, lower capital commitment)
- If your budget is $500K-$3M and you want a production-ready turnkey system: Chart Industries TITAN line
- If you need both PSA and liquefaction: Chart Industries (single vendor reduces integration risk)
- If your feed gas has unusual contaminants (H2S, high CO2, trace hydrocarbons): Contact Guild first. Their custom engineering for non-standard applications is their primary competitive advantage.

### Step 4: Decide on Liquefaction (Week 4-6)

Liquefaction is optional but transformative. Gaseous helium at high pressure is adequate for local cylinder delivery. Liquid helium at -269C (-452F) is required for long-distance transport, export to East Asia (see Document 20), MRI/NMR customers, and premium pricing. Liquefaction adds $500K-$5M to the capital budget but opens the highest-value market segments.

**Decision tree:**
- If your primary market is local cylinder delivery to fabs and labs within 100 miles: liquefaction may not be justified in Phase 1. Start with gas-phase operations and add liquefaction later when revenue supports it.
- If you plan to export liquid helium via ISO container to East Asia: liquefaction is essential from day one. See Document 20 for the demand analysis and Document 23 for the revenue model.
- If you plan to serve MRI/NMR facilities: these customers require liquid helium. Liquefaction is necessary for this market segment.
- If your co-op hub is Phase 1 of a multi-phase buildout (see Document 23, Scenario B): consider ordering the liquefier during Phase 1 construction even if it will not be commissioned until Phase 2. Lead times of 20-40 weeks mean the liquefier ordered today arrives when you need it.

**Vendors:**

**Chart Industries (PHPK Engineering division)** -- Production-scale liquefiers.
- Capacity: 15 L/hr to 250+ L/hr
- Lab-scale (15 L/hr): approximately $500,000
- Production-scale (60-250 L/hr): $2,000,000-$5,000,000+
- Advantage: Chart builds both PSA and liquefier systems, simplifying integration
- Lead time: 20-40 weeks (early 2026)

**Cryomech (Syracuse, NY)** -- The leading manufacturer of small reliquefiers and recovery systems. Particularly relevant for the recycling service business line (see Document 21).
- LHeP-60: 60 L/day reliquefier, 11 kW input, $250,000-$350,000
- LHeP-120: 120 L/day, 19 kW, $350,000-$450,000
- HRS (Helium Recovery System): Complete gas bag + compressor + reliquefier package, $300,000-$600,000 installed
- Best for: recovery/recycling installations at customer sites (the FoxSilicon model of install-operate-maintain)
- Also suitable as a small-scale liquefier at the hub for modest liquid production
- Website: cryomech.com

**Quantum Design** -- Laboratory-scale liquefiers.
- ATL160: 22 L/day, $350,000-$500,000
- ATL260: 40 L/day, $450,000-$600,000
- Best for: research institutions and small labs wanting in-house liquefaction
- Not recommended for production-scale hub operations

**For reference only (above co-op scale):** Linde Engineering builds Helium Cold Box systems (cryogenic distillation + PSA hybrid) for major gas processing plants. Minimum 50 MMSCFD feed gas. $20M-$100M+ per installation. These are custom EPC (engineering, procurement, construction) projects requiring 3-5 years from contract to commissioning. This is what Linde and Air Liquide build for themselves -- it is not the co-op's competitive space.

### Step 5: Engage a System Integrator (Week 4-8)

Unless you are buying a complete turnkey system from Chart, you will need a system integrator to design the interconnections between membrane, PSA, liquefier, storage, and fill station. The system integrator handles:

- Process flow design (P&IDs -- piping and instrumentation diagrams)
- Control system integration (PLC/SCADA linking all subsystems)
- Utility connections (power, water, compressed air)
- Safety system design (oxygen depletion monitoring, pressure relief, emergency shutdown)
- Commissioning and start-up support

**Where to find system integrators:**
- Chart Industries can serve as integrator for their own equipment
- Specialty gas engineering firms: Waukesha-Pearce Industries, Air Gas Products, GENERON IGS
- Ask each equipment vendor for their recommended integrators -- they maintain lists of qualified firms
- PNW-specific: consult PNNL's industry liaison office for referrals to cryogenic engineering firms in the region

**Budget for system integration:** $100,000-$300,000 for engineering, not including equipment. This covers process design, control system programming, installation supervision, and commissioning support. Do not skip this step. Equipment vendors sell equipment; they do not guarantee that their equipment works together with another vendor's equipment. The system integrator is the insurance policy.

### Step 6: Place Orders and Manage Lead Times (Week 6-12)

**Critical path items and current lead times (early 2026):**

| System | Standard Lead Time | Crisis-Extended Lead Time | Pre-Crisis Baseline |
|--------|-------------------|--------------------------|-------------------|
| PSA skids (standard catalog) | 16-24 weeks | 24-36 weeks | 12-20 weeks |
| PSA skids (custom configuration) | 24-36 weeks | 36-52 weeks | 20-30 weeks |
| Membrane modules | 8-12 weeks | 12-16 weeks | 6-12 weeks |
| Membrane skid (complete) | 12-20 weeks | 16-24 weeks | 10-16 weeks |
| Cryogenic liquefiers | 16-24 weeks | 24-40 weeks | 16-24 weeks |
| Chart TITAN HPUs | 20-30 weeks | 28-40 weeks | 16-24 weeks |

Lead times are extended across the board due to crisis-driven demand. Every producer referenced in Document 4 is ordering equipment simultaneously, creating a supply chain bottleneck for the equipment manufacturers themselves.

**Risk mitigation for lead times:**
- Place orders before completing site preparation. Equipment lead time is longer than building construction in most cases. Order the PSA and liquefier the same month you sign the site lease (see Document 18 for the parallel timeline).
- Negotiate progress payments, not lump-sum prepayment. Standard terms: 30% at order, 30% at fabrication milestones, 30% at shipment, 10% retained until commissioning.
- Get firm delivery dates in writing with liquidated damages for delays exceeding 4 weeks. In the current seller's market this may be difficult to negotiate, but it establishes expectations.
- Identify backup vendors for each major component. If Chart cannot deliver a PSA skid in time, can Guild deliver an equivalent? If MEDAL membranes are backordered, can Evonik SEPURAN modules substitute?

## Recommended Architecture for a Co-op Hub

```
FEED GAS (0.5-5% He from extraction node,
          or 50-70% He from purchased crude)
       |
       v
  COMPRESSOR                      $50K-$150K
  (if feed pressure < membrane operating pressure)
       |
       v
  MEMBRANE FRONT-END              $200K-$400K
  (Evonik SEPURAN or MEDAL)
  Enriches to 50-80% He
  [Skip this stage if feed is already 50-70%]
       |
       v
  PSA POLISHING UNIT              $300K-$1M
  (Chart TITAN or Guild)
  Purifies to 99.999%
       |
       v
  LIQUEFIER (optional)            $500K-$5M
  (Chart PHPK or Cryomech)
  Cools to -269C for storage/transport
       |
       v
  STORAGE + FILL STATION          $250K-$700K
  (High-pressure tube bank + cylinder/dewar fill)
```

**Total system cost: $1M-$6M** depending on capacity, feed gas concentration, and whether liquefaction is included. See Document 23 for the financial model that sizes this investment against projected revenue.

## Power Consumption and Operating Costs

| System | Scale | Power Draw | Monthly kWh (24/7) | Monthly Cost at $0.07/kWh |
|--------|-------|-----------|--------------------|----|
| Feed compressor (100 SCFM) | Compression | 20-40 kW | 14,400-28,800 | $1,008-$2,016 |
| Membrane skid (100 SCFM) | Bulk separation | 15-30 kW | 10,800-21,600 | $756-$1,512 |
| PSA (500 SCFH product) | Polishing to 5N | 5-15 kW | 3,600-10,800 | $252-$756 |
| Cryomech LHeP-60 reliquefier | 60 L/day | 11 kW | 7,920 | $554 |
| Chart production liquefier | 100-500 L/day | 100-200 kW | 72,000-144,000 | $5,040-$10,080 |
| Combined pilot system (no liquefier) | Membrane + PSA | 40-85 kW | 28,800-61,200 | $2,016-$4,284 |
| Combined full system (with liquefier) | All stages | 150-300 kW | 108,000-216,000 | $7,560-$15,120 |

At PNW electricity rates ($0.06-$0.08/kWh), a complete membrane + PSA + liquefier system running 24/7 costs roughly $7,500-$15,000/month in electricity. At Southwest rates ($0.10-$0.12/kWh), the same system costs $11,000-$22,000/month. See Document 24 for the full environmental impact analysis including grid carbon intensity, and Document 18 for how power requirements factor into site selection.

## Maintenance Schedule and Lifecycle Costs

| Component | Interval | Cost per Event | Annual Budget |
|-----------|----------|---------------|--------------|
| PSA adsorbent beds (CMS/zeolite) | Replace every 5-8 years | $10,000-$50,000 per bed change | $2,000-$10,000 (amortized) |
| PSA switching valves | Overhaul every 2-3 years | $5,000-$15,000 | $2,500-$7,500 (amortized) |
| Membrane modules | Replace every 5-10 years | $5,000-$20,000 per module | $1,000-$4,000 (amortized) |
| Pre-treatment filters (coalescing, particulate) | Quarterly | $500-$2,000 per change | $2,000-$8,000 |
| Feed compressor oil/filters | Every 2,000-4,000 operating hours | $1,000-$3,000 | $3,000-$9,000 |
| Feed compressor major overhaul | 20,000-40,000 operating hours | $15,000-$30,000 | $4,000-$8,000 (amortized) |
| Cryogenic cold head (Gifford-McMahon cycle) | Annual preventive maintenance | $5,000-$10,000 | $5,000-$10,000 |
| Analytical instruments (GC, moisture analyzer) | Annual calibration | $2,000-$5,000 | $2,000-$5,000 |
| Control system software/PLC | As needed (patches, upgrades) | $1,000-$3,000 | $1,000-$3,000 |
| **Total annual maintenance budget** | | | **$22,500-$64,500** |

Budget approximately **$50,000/year** for maintenance on a full membrane + PSA + liquefier system. This is included in the operating expense projections in Document 23. Maintenance costs are modest relative to crude helium purchase costs ($1.2M-$2.2M/year) and labor ($390K/year).

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Equipment delivery delay (4+ weeks beyond contracted date) | High in current market | Delays first revenue. Each month of delay costs approximately $40K-$80K in fixed costs without revenue. | Order early. Identify backup vendors. Negotiate liquidated damages. See lead time discussion above. |
| Feed gas contamination (H2S, heavy hydrocarbons) | Medium | Poisons PSA adsorbent (permanent damage) or fouls membranes (accelerated degradation). Adsorbent replacement: $10K-$50K unplanned. | Require certificate of analysis from every crude helium delivery. Install inline H2S and hydrocarbon analyzers upstream of membrane stage. Reject non-conforming loads. |
| Single-vendor dependency | Medium | If Chart is sole supplier for PSA + liquefier and experiences production issues, entire project timeline shifts. | Qualify at least two vendors for each major subsystem during the RFQ phase (Step 3). Guild as backup for Chart PSA. Cryomech as backup for Chart liquefier. |
| Purity failure (product does not meet 99.999%) | Low | Cannot sell to semiconductor customers. Revenue stops until resolved. | Inline purity analyzers (GC) with automatic product diversion. Off-spec gas is recycled to the front-end, not sold. Build the quality lab (see Document 18) and test every batch before release. |
| Power interruption | Low in PNW (hydro grid is reliable) | Liquefier and PSA shut down. Liquid helium begins warming. Recovery takes hours. | UPS for control systems. Emergency generator for critical loads (PSA valves, safety systems). Liquid storage dewar has 24-48 hour hold time without active cooling. |
| Technology obsolescence | Very low over 10-year horizon | New separation technology displaces PSA or membranes. | PSA and membrane technology are mature (40+ years commercial). Evolutionary improvements are incremental, not disruptive. The risk is minimal. |

## First Call List: Sequence of Vendor Contacts

For someone starting today with $1M-$5M to deploy:

1. **Chart Industries** -- Contact TITAN Helium PSA sales and PHPK Engineering (liquefiers). Request budgetary quotes for both PSA and liquefier at your target capacity. Chart has the broadest product range at co-op scale and can offer integrated solutions. Ask for reference installations at similar scale.

2. **Guild Associates** -- Contact for competitive PSA quotes, especially if your feed gas has non-standard composition. Guild's engineering team will review your gas analysis and recommend a configuration. Use Guild's quote as a benchmark against Chart.

3. **Evonik** -- Contact SEPURAN Noble membrane module sales for front-end pricing. Ask for their list of licensed system integrators in North America who can build the complete membrane skid.

4. **Cryomech** -- Contact for reliquefier and recovery system pricing. Essential if the co-op plans to offer recycling installation services to fab customers (the fastest path to revenue per Document 21). Also useful as a small-scale liquefier for the hub.

5. **Air Liquide MEDAL** -- Contact as an alternative membrane supplier. Request pricing and delivery timeline for He-Sep modules and complete skid systems.

6. **System integrator** -- Contact after receiving budgetary quotes from equipment vendors. The integrator needs to know what equipment you are buying before they can design the interconnections.

**Timeline from first vendor contact to equipment on-site:** 9-15 months. This runs in parallel with site selection, permitting, and building preparation (see Document 18 for the coordinated timeline). The equipment procurement path and the site preparation path should start simultaneously -- neither should wait for the other.

## Cross-Reference Map

- **Document 4** (Global Production): Identifies the crude helium producers whose product will feed this equipment
- **Document 9** (Economics): ROI analysis for extraction nodes and hub configurations
- **Document 14** (Regulatory Landscape): Permits required for equipment installation and operation
- **Document 17** (Crude Sourcing): How the feed gas gets from source to hub
- **Document 18** (Hub Design): How this equipment fits into the physical facility
- **Document 21** (Recycling Deep Dive): Equipment for customer-site recycling installations
- **Document 23** (Financial Model): Capital budget allocation and revenue projections that size the equipment investment
