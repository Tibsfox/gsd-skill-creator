# Liquefaction Hub Design — Site Selection, Facility Specifications, and Build Sequence

## What the Hub Does

The central hub receives crude helium (50-70% purity) from distributed sources via tube trailer (see Document 17 for sourcing and transport logistics), purifies it to Grade-A (99.999%) or Research Grade (99.9999%) using membrane and PSA technology (see Document 15 for equipment selection), optionally liquefies it to -269C (-452F), and distributes it to customers via cylinder, dewar, or ISO container. The hub is the physical heart of the co-op -- the shared infrastructure that no single member could afford alone but that all members benefit from collectively (see Document 19 for co-op governance and Document 22 for precedent models).

This document covers everything needed to go from "we have decided to build a hub" to "the hub is producing purified helium." It is written for three audiences: the engineer designing the facility, the banker evaluating the capital request, and the co-op board making site and budget decisions.

## Step-by-Step Build Sequence

### Phase 0: Pre-Decision Analysis (Month 0-2)

Before committing to a site or placing equipment orders, complete these prerequisites:

1. **Secure at least one crude helium supply agreement** (see Document 17, Step 4). Do not build a hub without confirmed feed stock. A signed letter of intent (LOI) with a crude supplier is the minimum; a signed supply agreement is preferred.

2. **Obtain budgetary equipment quotes** from at least two vendors for PSA and liquefier systems (see Document 15, Steps 2-4). You need firm pricing to build the capital budget.

3. **Confirm funding sources.** The financial model in Document 23 assumes a specific funding mix: CHIPS Act grant ($2M), WA ICAP grant ($500K), member equity ($1M), SBA loan ($1.5M), bank loan ($1.15M). At minimum, you need the grant applications submitted and a term sheet from a lender before committing to a site lease.

4. **Engage a process engineer** (or system integrator -- see Document 15, Step 5) to develop a preliminary process flow diagram (PFD) and utility requirements. This defines the building's power, water, and space requirements before you search for a site.

### Phase 1: Site Selection and Lease (Month 2-4)

#### Site Requirements

| Requirement | Specification | Why It Matters |
|-------------|--------------|---------------|
| Power | 200-500 kW connected load (3-phase, 480V) | Liquefier draws 100-200 kW alone. Inadequate power supply is the most common disqualifier for candidate sites. Upgrading utility service can cost $50K-$200K and add 3-6 months. Verify power availability BEFORE signing a lease. |
| Water | 5-20 GPM cooling water (closed-loop cooling tower preferred) | Compressors and liquefier require cooling. Closed-loop system minimizes water consumption (see Document 24 for environmental impact: net consumption under 500 gallons/day). |
| Zoning | Industrial (I-1, I-2, M-1, or equivalent in local jurisdiction) | Hazmat storage requires setbacks from property lines and occupied buildings per fire code. Residential or commercial zones will not permit this use. Verify zoning before any other evaluation. |
| Road access | Must accommodate tractor-trailers (53-foot tube trailers in, smaller delivery vehicles out) | Tube trailers require 75+ foot turning radius. The access road must be rated for 80,000 lb gross vehicle weight. Verify with a truck turning template on the site plan. |
| Proximity to I-5 | Within 10 miles | Efficient corridor distribution to customers in both directions (north to Seattle, south to Portland). Every mile off I-5 adds delivery cost. |
| Port proximity | Within 30 miles of Tacoma/Seattle ports | For export via ISO container to East Asia (see Document 20). Not critical if Phase 1 is domestic-only. |
| Lot size | 1-3 acres minimum | Building (5,000-15,000 sq ft) plus truck access drive, tube trailer staging area (space for 2-3 trailers), cylinder/dewar loading dock, employee parking, and setbacks. |
| Building | 5,000-15,000 sq ft, high-bay (minimum 20 ft clear height for equipment), concrete floor rated for heavy loads (250+ psf), adequate ventilation | Existing industrial building is preferred over new construction (faster, cheaper). Metal-frame industrial buildings are readily available along the I-5 corridor. |
| Seismic | Standard industrial construction per IBC seismic design category | The PNW is seismically active. Equipment anchorage and piping flexibility must accommodate seismic loading. This is standard engineering practice for the region, not an unusual requirement. |

#### Candidate Locations Along I-5

Evaluate these locations against the requirements above. Listed roughly north to south:

| Location | Advantages | Considerations | Approximate Lease Rate (Industrial, 2026) |
|----------|-----------|---------------|------------------------------------------|
| **Smokey Point / Marysville, WA** | Central Welding fill plant already located here (industry cluster). Industrial zoning. Direct I-5 access. Snohomish County economic development support. | North of Seattle -- adds distance to Portland/Hillsboro customers. Farther from Port of Tacoma. | $0.65-$0.85/sq ft/month NNN |
| **Kent / Auburn, WA** | Heavy industrial zoning. Close to Port of Tacoma (15 mi). BNSF rail access (Kent intermodal). Large industrial labor pool. | Higher land costs. Traffic congestion on SR-167 and I-5 through south King County. | $0.90-$1.20/sq ft/month NNN |
| **Tumwater / Olympia, WA** | Mid-corridor position. Industrial land available and affordable. State capital (proximity to Dept of Commerce for grant programs, Dept of Ecology for permitting). | Smaller industrial labor pool than Seattle metro. Farther from both Seattle and Portland customer clusters. | $0.55-$0.75/sq ft/month NNN |
| **Centralia / Chehalis, WA** | Lowest land costs on the corridor. I-5 access. Equidistant between Seattle and Portland (~85 mi each). Industrial zoning available. Lewis County actively recruiting industrial tenants. | Small town. Limited labor pool for specialized positions. May need to recruit technicians from Tacoma or Portland metro. | $0.40-$0.60/sq ft/month NNN |
| **Portland industrial district (NW/NE Portland), OR** | Close to Silicon Forest (Hillsboro ~25 mi). Rail access (UP and BNSF). Large industrial market and labor pool. Proximity to OHSU and PSU research customers. | Oregon vs. Washington regulatory differences (Oregon DEQ vs. WA Ecology). Portland commercial tax environment. | $0.85-$1.15/sq ft/month NNN |
| **Hillsboro / Beaverton, OR** | Directly adjacent to Intel D1X -- maximum customer proximity. Technology cluster workforce. Washington County economic development. | Land costs near Intel campus are premium. Industrial-zoned land is scarce; most has been absorbed by semiconductor and technology companies. | $1.00-$1.40/sq ft/month NNN |
| **Wilsonville, OR** | I-5 access. Industrial zoning available. Midpoint between Portland and Salem. Good balance of access and cost. Existing industrial base (Mentor Graphics/Siemens, Xerox). | Smaller than Portland but well-connected. | $0.75-$0.95/sq ft/month NNN |

**Decision tree for site selection:**
- If the primary market is Intel D1X and Silicon Forest fabs: Hillsboro or Wilsonville. Proximity to the anchor customer reduces delivery cost and response time.
- If the primary market is export to East Asia: Kent/Auburn. Closest to Port of Tacoma.
- If minimizing capital cost is the priority: Centralia/Chehalis or Tumwater. Lowest lease rates and land costs.
- If balancing domestic distribution and export: Kent/Auburn or Tumwater. Mid-corridor with port access.
- If the co-op is based in Washington and wants WA state grant eligibility: any WA location. Oregon locations may not qualify for WA ICAP grants.

#### Site Evaluation Checklist

Visit each candidate site with the process engineer and verify:

- Electrical service: confirm available capacity with the local utility (Puget Sound Energy, Tacoma Power, PGE, Pacific Power). Request a letter of service confirming they can deliver 200-500 kW at 480V 3-phase to the site within the project timeline.
- Water service: confirm municipal water supply adequate for cooling tower makeup (1-5 GPM net). Most industrial sites have adequate water.
- Sewer: confirm connection or verify that cooling tower blowdown (small volume, non-hazardous) is acceptable to the local sewer authority.
- Truck access: drive a tractor-trailer around the site (or simulate with a turning template). Verify ingress, egress, trailer staging, and loading dock access.
- Zoning confirmation: obtain a written zoning verification from the local planning department confirming that helium purification and gas cylinder filling are permitted uses. Do not rely on verbal confirmation.
- Environmental baseline: review the site's environmental history (Phase I ESA). Industrial sites may have pre-existing contamination that could complicate permitting or create liability. Budget $3,000-$5,000 for a Phase I ESA.
- Seismic: verify the site is not in a liquefaction zone or landslide hazard area (available from WA DNR or DOGAMI for Oregon).

### Phase 2: Permitting (Month 3-8, Overlapping with Equipment Procurement)

The regulatory path for a helium processing facility is straightforward. Helium is inert, non-toxic, non-flammable. The primary safety concern is oxygen displacement in enclosed spaces -- a standard industrial gas hazard with well-established protocols and engineering controls. See Document 14 for the complete regulatory landscape and Document 24 for the environmental impact assessment.

#### Permit Sequence (Washington State)

| Permit | Agency | Timeline | Cost | Notes |
|--------|--------|----------|------|-------|
| **SEPA Environmental Checklist** | Local lead agency (city or county) | 30-60 days | $500-$2,000 (filing fee) | Expected determination: DNS (Determination of Non-Significance). See Document 24 for anticipated checklist answers. |
| **Building permit** | Local building department | 4-12 weeks (plan review + issuance) | $5,000-$20,000 (based on project valuation) | Includes structural, electrical, mechanical, plumbing plan review. High-pressure gas storage requires fire marshal review. |
| **Fire marshal review** | Local fire marshal / fire district | Concurrent with building permit | Included in building permit | Review of compressed gas storage quantities, setbacks, emergency shutoff, oxygen monitoring, ventilation. Reference NFPA 55 (Compressed Gases and Cryogenic Fluids Storage). |
| **Air quality registration** | WA Dept of Ecology or local clean air agency (PSCAA, NWCAA, SWCAA depending on location) | 30-60 days | $500-$2,000 | Helium processing has no significant air emissions. May qualify for registration rather than full permit. De minimis emissions (cooling tower drift, emergency generator if diesel). |
| **Pressure vessel installation** | WA L&I (WAC 296-104) | 30-45 days | $200-$500 per vessel | All pressure vessels (tube banks, PSA vessels, storage tanks) require L&I inspection and registration. |
| **Business license** | State + local | 1-2 weeks | $100-$500 | Standard business license plus any local business tax registration. |
| **DOT registration** | FMCSA (if operating transport vehicles) | 2-4 weeks | ~$300 | Only if the co-op operates its own delivery trucks. Not required if using third-party carriers. |

#### Permit Sequence (Oregon)

| Permit | Agency | Timeline | Cost |
|--------|--------|----------|------|
| Land use review | Local planning department | 30-90 days | $1,000-$5,000 |
| Building permit | Local building department | 6-16 weeks | $5,000-$25,000 |
| Air quality | Oregon DEQ (OAR 340-200 through 340-268) | 30-60 days | $500-$3,000 |
| Pressure vessel | Oregon OSHA / DCBS | 30-45 days | Per-vessel fee |

**Total permitting timeline: 3-6 months** for a standard industrial gas processing facility. No federal permits are required for a processing-only facility (not extracting from the ground). This is a significant advantage of the corridor model -- the extraction permits (BLM, state oil and gas commissions) are the producers' responsibility, not the co-op's.

**Risk: permit delays.** Local permitting timelines are estimates. Some jurisdictions have significant backlogs. Mitigate by:
- Pre-application meetings with the planning department and fire marshal before filing
- Hiring a local permit expediter who knows the jurisdiction's process
- Filing SEPA checklist and building permit application simultaneously (SEPA can be processed concurrently with plan review in most jurisdictions)

### Phase 3: Equipment Procurement (Month 2-8, Parallel with Permitting)

**Order equipment at the same time you begin permitting.** Equipment lead times (24-40 weeks for PSA and liquefier per Document 15) are longer than the permitting timeline (3-6 months). If you wait for permits before ordering equipment, you add 6-10 months to the project.

| Equipment | When to Order | Lead Time | When It Arrives | Cost |
|-----------|--------------|-----------|----------------|------|
| Membrane separation system | Month 2-3 | 12-16 weeks | Month 5-7 | $200,000-$400,000 |
| PSA purification system | Month 2-3 | 24-36 weeks | Month 8-12 | $300,000-$1,000,000 |
| Liquefier | Month 2-3 | 24-40 weeks | Month 8-13 | $500,000-$2,000,000 |
| High-pressure gas storage (tube bank) | Month 4-5 | 8-12 weeks | Month 6-8 | $100,000-$200,000 |
| Liquid helium storage dewar (5,000 L) | Month 4-5 | 12-16 weeks | Month 7-9 | $150,000-$300,000 |
| Cylinder/dewar fill station | Month 5-6 | 8-12 weeks | Month 7-9 | $200,000-$500,000 |
| Quality lab equipment (GC, mass spec, moisture) | Month 6-7 | 4-8 weeks | Month 7-9 | $300,000-$500,000 |
| Control system (PLC/SCADA) | Month 4-6 | 8-12 weeks | Month 6-8 | $50,000-$150,000 |

See Document 15 for detailed vendor selection and specifications for each item.

### Phase 4: Building Preparation (Month 5-10)

Once permits are issued and the site is secured, prepare the building:

| Activity | Duration | Cost | Contractor Type |
|----------|----------|------|----------------|
| Demolition / clearing (if existing building requires modification) | 2-4 weeks | $20,000-$80,000 | General contractor |
| Concrete work (equipment pads, reinforced floors, truck apron) | 3-6 weeks | $50,000-$150,000 | Concrete contractor |
| Electrical upgrade (480V 3-phase service, distribution panel, conduit runs to equipment locations) | 4-8 weeks | $75,000-$200,000 | Licensed electrical contractor |
| Plumbing / water service (cooling tower piping, domestic water, drain) | 2-4 weeks | $30,000-$75,000 | Mechanical contractor |
| HVAC / ventilation (process area ventilation, oxygen monitoring system, lab HVAC) | 3-6 weeks | $50,000-$125,000 | HVAC contractor |
| Fire protection (sprinklers if required, gas detection, emergency shutoff) | 2-4 weeks | $30,000-$75,000 | Fire protection contractor |
| Process piping (high-pressure stainless steel between equipment skids) | 4-8 weeks | $75,000-$200,000 | Certified pipe fitter / process piping contractor |
| Truck access / paving / grading | 2-4 weeks | $30,000-$100,000 | Paving contractor |
| **Total building preparation** | **3-5 months** (activities overlap) | **$360,000-$1,005,000** | |

**Note on building preparation cost:** The range above assumes modifying an existing industrial building. New construction (steel building on slab) costs $100-$150 per square foot, or $500,000-$2,250,000 for a 5,000-15,000 sq ft building. Using an existing building saves $200,000-$1,000,000+ and 3-6 months of construction time.

### Phase 5: Equipment Installation and Commissioning (Month 8-14)

| Activity | Duration | Key Personnel |
|----------|----------|--------------|
| Equipment receiving and placement (crane/forklift) | 1-2 weeks per major skid | Rigging contractor, equipment vendor field service |
| Mechanical connections (process piping between skids) | 3-6 weeks | Process piping contractor, system integrator |
| Electrical connections (power to each skid, control wiring) | 2-4 weeks | Electrical contractor, control system integrator |
| Control system integration (PLC programming, SCADA configuration, alarm setup) | 2-4 weeks | Control system integrator |
| Pressure testing (hydrostatic test of all piping systems per ASME B31.3) | 1-2 weeks | Process piping contractor, L&I inspector |
| Leak testing (helium leak test of the entire system -- using the product gas as the test medium) | 1 week | System integrator |
| Utility startup (cooling tower, compressed air, ventilation) | 1 week | Facility staff + contractors |
| Process commissioning (introduce feed gas, verify purity at each stage, tune PSA cycle times) | 2-4 weeks | Equipment vendor field service + system integrator |
| Quality lab setup and calibration | 1-2 weeks | Lab equipment vendor, quality technician |
| Safety system verification (oxygen monitors, emergency shutoffs, fire detection) | 1 week | Fire marshal, safety engineer |
| **Total installation and commissioning** | **3-5 months** | |

**Critical milestone: first purified helium.** When the PSA system produces its first batch of 99.999% helium verified by the quality lab, the hub is operational. The liquefier may commission 2-4 weeks later (it has a longer startup procedure). Gas-phase product can be sold before the liquefier is operational.

### Phase 6: Steady-State Operations (Month 12-24 Onward)

The hub is now producing purified helium. Ongoing operations require:

**Staffing** (see Document 23 for the full staffing model):
- General Manager / Operations: 1 FTE
- Process Technician: 1 FTE
- Quality / Lab Technician: 0.5 FTE
- Delivery / Logistics: 0.5 FTE
- Bookkeeper: 0.25 FTE (part-time)
- Total: 3.25 FTE, approximately $390,000/year including benefits

**Ongoing costs** (monthly):

| Category | Monthly Cost | Annual Cost |
|----------|-------------|------------|
| Crude helium purchases | $80,000-$120,000 | $960,000-$1,440,000 |
| Electricity | $8,000-$15,000 | $96,000-$180,000 |
| Labor | $32,500 | $390,000 |
| Maintenance (amortized) | $4,000-$5,500 | $48,000-$66,000 |
| Insurance (general liability + property + environmental) | $3,000-$5,000 | $36,000-$60,000 |
| Debt service (SBA + bank loan) | $25,000-$30,000 | $300,000-$360,000 |
| Miscellaneous (consumables, travel, professional services) | $3,000-$5,000 | $36,000-$60,000 |
| **Total monthly operating cost** | **$155,500-$213,000** | **$1,866,000-$2,556,000** |

See Document 23 for the full revenue model and scenario analysis showing profitability at both crisis and normalized helium prices.

## Facility Layout

```
+-------------------------------------------------------------+
|                    CO-OP HELIUM HUB                          |
|                                                              |
|  RECEIVING             PROCESSING            STORAGE         |
|  +------------+       +----------------+    +-----------+    |
|  | Tube       |       | Membrane       |    | High-P    |    |
|  | trailer    |------>| separation     |--->| gas       |    |
|  | bay        |       | (50->80% He)   |    | storage   |    |
|  | (2 bays,   |       +-------+--------+    | (tube     |    |
|  |  drive-    |               |             | bank)     |    |
|  |  through)  |       +-------v--------+    +-----------+    |
|  +------------+       | PSA            |                     |
|                       | purification   |    +-----------+    |
|  QUALITY LAB          | (80->99.999%)  |--->| Liquid    |    |
|  +------------+       +-------+--------+    | He        |    |
|  | GC/MS      |               |             | storage   |    |
|  | Moisture   |       +-------v--------+    | (5,000L   |    |
|  | O2 analyzer|       | Liquefier      |    |  dewar)   |    |
|  | Purity     |       | (-269C)        |    +-----------+    |
|  | testing    |       +-------+--------+                     |
|  +------------+               |             DISPATCH         |
|                               |             +-----------+    |
|  UTILITIES                    +------------>| Cylinder  |    |
|  +------------+                             | fill      |    |
|  | 480V main  |                             | station   |    |
|  | Cooling    |                             | Loading   |    |
|  | tower      |                             | dock      |    |
|  | Comp air   |                             +-----------+    |
|  +------------+                                              |
|                                                              |
|  OFFICE / CONTROL ROOM        EMPLOYEE AREA                  |
|  +------------+               +-----------+                  |
|  | SCADA      |               | Breakroom |                  |
|  | Monitoring |               | Lockers   |                  |
|  | Records    |               | Parking   |                  |
|  +------------+               +-----------+                  |
|                                                              |
|  Footprint: 5,000-15,000 sq ft indoor                       |
|  Lot: 1-3 acres (building + truck access + trailer staging)  |
+-------------------------------------------------------------+
```

## Capital Cost Summary

### Small Hub (100 L/day liquid output, ~3,000 SCF/day Grade-A gas equivalent)

| Component | Cost Range | Notes |
|-----------|-----------|-------|
| Membrane separation system | $200,000-$400,000 | Evonik SEPURAN or MEDAL modules + skid |
| PSA purification (99.999%) | $300,000-$1,000,000 | Chart TITAN or Guild Associates |
| Liquefier | $500,000-$2,000,000 | Chart PHPK or Cryomech |
| High-pressure gas storage (tube bank) | $100,000-$200,000 | 4-8 tube bundles, buffer capacity |
| Liquid helium storage dewar (5,000 L) | $150,000-$300,000 | Vacuum-jacketed, low boil-off |
| Cylinder/dewar fill station | $200,000-$500,000 | High-pressure cylinder fill + LHe transfer |
| Quality lab (GC, mass spec, moisture analyzer) | $300,000-$500,000 | Grade-A and Research Grade certification |
| Building/site improvements | $360,000-$1,005,000 | Per Phase 4 estimate above |
| Utilities (electrical service upgrade, cooling tower) | $100,000-$275,000 | Depends on existing site infrastructure |
| Permitting, engineering, system integration | $200,000-$450,000 | Per Phase 2 and Document 15 Step 5 |
| Working capital (6 months crude helium + operating) | $500,000-$750,000 | Per Document 23 |
| Contingency (10%) | $290,000-$730,000 | Standard for industrial construction |
| **Total Phase 1 Capital** | **$3,200,000-$8,110,000** | |

### Medium Hub (500 L/day liquid output)

Scale up processing equipment, add redundancy (second PSA train for maintenance without shutdown), larger storage, more fill station capacity:
- **Total: $8,000,000-$18,000,000**
- Unlikely for Phase 1. A co-op would build small, prove the model, then expand.

**Decision tree for hub sizing:**
- If total available capital is $3M-$5M: build a small hub without liquefaction. Gas-phase operations only. Add liquefier in Phase 2 when revenue supports it. This reduces capital requirements by $500K-$2M.
- If total available capital is $5M-$8M: build a small hub with liquefaction from day one. This is the recommended configuration in Document 23.
- If total available capital exceeds $8M: consider a medium hub, but only if customer demand is confirmed. Overcapacity is worse than under-capacity -- the co-op can expand faster than it can shrink.

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Equipment delivery delay | High (crisis-driven demand) | 2-6 month schedule extension. Each month of delay costs $40K-$80K in fixed costs without revenue. | Order equipment early (Month 2-3). Identify backup vendors. Include liquidated damages in purchase orders. |
| Construction cost overrun | Medium | 10-20% overrun is common for first-of-kind industrial installations | Include 10% contingency in budget. Use fixed-price contracts where possible. Hire experienced industrial construction manager. |
| Permitting delay | Low-Medium | 1-3 month delay. Mostly affects building preparation timeline, not equipment procurement. | Pre-application meetings. Hire local permit expediter. File early. |
| Power supply inadequate | Low (if verified during site selection) | Cannot operate liquefier at rated capacity | Verify power availability in writing from utility BEFORE signing lease. Budget for utility service upgrade if needed. |
| Customer demand does not materialize | Low (during crisis) | Hub operates below capacity. Revenue shortfall vs. projections. | Secure customer LOIs before or during construction. The crisis creates demand urgency -- fabs need supply NOW. See Document 20 for demand quantification. |
| Equipment malfunction during commissioning | Medium | 2-8 week delay while vendor resolves | Include vendor field service during commissioning (standard with most equipment purchases). Budget for 2 weeks of contingency in commissioning schedule. |
| Interest rate increase on variable-rate debt | Low-Medium | Increases monthly debt service | Use fixed-rate loans where possible. SBA loans are typically fixed rate. |

## Timeline Summary: Site Selection to First Output

| Phase | Month | Activities | Key Milestone |
|-------|-------|-----------|--------------|
| 0 | 0-2 | Supply agreements, equipment quotes, funding confirmation | Go/no-go decision |
| 1 | 2-4 | Site selection, lease negotiation, site evaluation | Lease signed |
| 2 | 3-8 | Permitting (SEPA, building, fire, air) | Building permit issued |
| 3 | 2-8 | Equipment procurement (orders placed Month 2-3) | Equipment shipped |
| 4 | 5-10 | Building preparation (concrete, electrical, piping, HVAC) | Building ready for equipment |
| 5 | 8-14 | Equipment installation and commissioning | First purified helium produced |
| 6 | 12-14+ | Steady-state operations | First customer delivery |

**Overall timeline: 12-18 months from go-decision to first purified helium output.** This assumes parallel execution of permitting, equipment procurement, and building preparation. Sequential execution (waiting for each phase to complete before starting the next) would extend the timeline to 24-30 months.

## Cross-Reference Map

- **Document 7** (I-5 Corridor): Strategic context for hub location along the corridor
- **Document 9** (Economics): ROI analysis at various scales
- **Document 14** (Regulatory Landscape): Complete regulatory framework for permitting
- **Document 15** (PSA Equipment): Detailed equipment specifications, vendors, and procurement
- **Document 17** (Crude Sourcing): How feed stock reaches the hub
- **Document 19** (Co-op Playbook): How the hub is governed as shared cooperative infrastructure
- **Document 20** (East Asia Demand): Export market that justifies liquefaction and port proximity
- **Document 21** (Recycling Deep Dive): Customer-site recycling as a complementary revenue stream
- **Document 23** (Financial Model): Capital budget, revenue projections, and scenario analysis
- **Document 24** (Environmental Impact): SEPA checklist answers and community benefit analysis
