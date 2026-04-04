# Semiconductor Fabrication -- Requirements, Funding, and the Gas Supply Layer

## What a Fab Requires

A modern leading-edge semiconductor fabrication facility is among the most complex and expensive structures ever built. Intel's Fab 52 and Fab 62 in Chandler, Arizona -- announced in 2021 with a $20 billion budget that has since grown -- represent the current scale of investment. TSMC's first Arizona fab (Fab 21, Phase 1) carries a reported $12 billion price tag for a single facility producing 4nm-class chips. Samsung's Taylor, Texas fab is budgeted at $17 billion. These are not outliers; they are the new baseline.

### Infrastructure Requirements

A leading-edge fab requires simultaneous mastery of at least six infrastructure domains, any one of which can delay or halt production if compromised.

**Water.** A large fab consumes 2-4 million gallons of ultrapure water (UPW) per day. UPW must meet ASTM D5127 Type E-1.2 specifications: resistivity of 18.2 megohm-cm, total organic carbon below 1 ppb, dissolved oxygen below 1 ppb, particle count below 1 per liter at 0.05 microns. The water treatment plant that produces UPW is itself a major capital investment, typically $100-$200 million. Intel's Hillsboro operations draw from the Joint Water Commission, which sources from the Tualatin River watershed. Water supply reliability is a site-selection criterion that shapes the geography of semiconductor manufacturing.

**Power.** A leading-edge fab consumes 100-150 MW of continuous electrical power -- equivalent to a small city. TSMC's Arizona fab is expected to draw approximately 130 MW at full production. This power must be uninterrupted; even momentary voltage sags can destroy entire wafer lots worth millions of dollars. Fabs require dedicated substation connections with redundant feeds. The PNW's BPA-backed grid, fed by the Columbia River hydroelectric system, provides both the reliability and the cost structure that fabs require (see Document 07 for electricity rate comparisons).

**Gases.** This is where helium enters the picture, but helium is one of dozens of gases a fab requires. The full gas inventory of a modern fab includes:

| Gas | Purity | Function |
|-----|--------|----------|
| Helium (He) | 99.999%-99.9999% | Wafer cooling, leak detection, carrier gas, EUV lithography purge |
| Nitrogen (N2) | 99.9999% | Inert blanketing, purging, wafer transfer |
| Argon (Ar) | 99.9999% | Plasma etch sputtering gas |
| Hydrogen (H2) | 99.9999% | Annealing, epitaxial growth |
| Oxygen (O2) | 99.9999% | Thermal oxidation, plasma ashing |
| Silane (SiH4) | Electronic grade | Chemical vapor deposition of silicon |
| Tungsten hexafluoride (WF6) | Electronic grade | Tungsten metal deposition |
| Boron trichloride (BCl3) | Electronic grade | Plasma etch of aluminum |
| Carbon tetrafluoride (CF4) | Electronic grade | Plasma etch of silicon dioxide |
| Chlorine (Cl2) | Electronic grade | Plasma etch of polysilicon |

A major fab may use 30-50 different gases, each requiring dedicated supply lines, storage, delivery systems, and abatement (scrubbing of toxic exhaust). The gas infrastructure for a single fab -- piping, storage, valve manifolds, flow controllers, monitoring systems -- represents a $50-$100 million investment. Air Liquide's 2024 announcement of a $60 million investment in Phoenix specifically for gas supply infrastructure to semiconductor customers illustrates the scale. That investment was for augmenting supply to existing fabs, not building from scratch.

**Vibration isolation.** EUV lithography at the 3nm node operates at feature sizes of approximately 13.5nm half-pitch. At this scale, vibrations from passing trucks, nearby construction, or even foot traffic in adjacent rooms can blur patterns and destroy yields. Fabs are built on massive concrete plinths with active vibration isolation systems. Site selection eliminates proximity to airports, rail marshaling yards, quarries, and major highways. Intel's Hillsboro campus was selected in part because the Tualatin Valley's agricultural character provided a naturally low-vibration environment -- an advantage that increasing urbanization now threatens.

**Cleanroom.** A leading-edge fab operates ISO Class 1 cleanrooms (fewer than 10 particles per cubic meter at 0.1 microns). For reference, the ambient air in a typical office contains approximately 35 million particles per cubic meter at that size. Maintaining ISO Class 1 requires constant positive-pressure filtered airflow, personnel gowning protocols (bunny suits, gloves, face masks), material airlocks, and multi-level sub-fab infrastructure for routing pipes, cables, and chemical delivery systems below the production floor. Cleanroom construction costs $3,000-$5,000 per square foot.

**Tooling.** A leading-edge fab contains approximately 1,000-1,500 major process tools. An ASML Twinscan NXE:3800E EUV lithography system costs approximately $380 million per unit and weighs 180 tons. A fab may require 10-20 EUV scanners. Applied Materials, Lam Research, Tokyo Electron, and KLA supply the etch, deposition, and inspection tools that fill the remaining floor space. Total tooling cost for a leading-edge fab runs $5-$8 billion -- roughly half the total project budget.

### Timeline

The time from groundbreaking to volume production for a US fab averages 38-48 months -- significantly longer than the 18-24 months typical in Taiwan or South Korea. The differential reflects US permitting timelines (NEPA reviews, state environmental assessments, construction permits), labor availability (semiconductor-grade cleanroom construction requires specialized crews), and supply chain logistics for tool installation. Tooling and qualification add another 9-12 months after construction completes. A fab announced today will not produce revenue chips until 2029-2030.

This timeline matters for helium infrastructure planning. A regional helium supply capability built now will be operational in 12-18 months (see Document 09 for deployment timelines) -- well before any new fab announced under the CHIPS Act reaches production. Building helium infrastructure ahead of fab demand, rather than after it, is the strategic play.

## CHIPS and Science Act -- The Funding Landscape (Active as of March 2026)

The CHIPS and Science Act of 2022 (P.L. 117-167) represents the largest US government investment in semiconductor manufacturing since the Defense Production Act of 1950. Its scale and scope are frequently misunderstood. The Act is not a single grant program; it is a multi-layered funding architecture.

### Funding Streams

| Stream | Amount | Mechanism | Status (March 2026) |
|--------|--------|-----------|---------------------|
| Section 9902 Manufacturing Incentives | $39B | Grants + loans | Active -- major awards to Intel ($7.86B finalized late 2025), TSMC (up to $6.6B), Samsung (up to $6.4B), Micron (up to $6.1B), GlobalFoundries ($1.5B), Microchip Technology ($72M for Gresham, OR capacity doubling) announced |
| Section 9906 R&D Programs | $11B | NIST programs | NAPMP (prototyping), NIMC (metrology) launched |
| Section 9903 Workforce | $500M+ | NSF + DoL | Training programs active through 2027 |
| CHIPS for America Fund (loans) | $7.5B | Direct lending | Active for qualifying projects |
| Texas Semiconductor Innovation Fund | $948M | State appropriation | Active since June 2025 |
| Oregon CHIPS Act (SB 4) | $115M | State incentives (Oregon CHIPS program) | Active, focused on workforce and site readiness |

### The Gas Supply Provision -- Why This Matters

Section 9902(a)(2)(B) of the CHIPS Act explicitly includes "construction, expansion, or modernization of facilities and equipment" for "the semiconductor supply chain" among eligible uses of manufacturing incentive funds. The Commerce Department's implementing regulations (15 CFR Part 231, published February 2024) further specify that "materials and gas supply" are within scope.

This is not a theoretical eligibility argument. In its published guidance for CHIPS funding applications, the Commerce Department identifies "specialty chemicals and gases" as a priority area for supply chain resilience investments. A CHIPS Act application for a regional helium purification and distribution hub would be evaluated under the supply chain resilience criteria, which include:

1. **Domestic sourcing** -- Does the project reduce dependence on foreign supply?
2. **Redundancy** -- Does the project create alternative supply pathways?
3. **Proximity** -- Does the project serve domestic fabs directly?
4. **Speed** -- Can the project be operational within 24 months?
5. **Workforce** -- Does the project create skilled technical jobs?

A PNW helium cooperative (Document 19 for formation playbook, Document 07 for corridor geography) scores well on all five criteria. It reduces dependence on Qatari helium (currently offline per Document 05), creates a redundant supply node, serves Intel's D1X complex directly, can deploy modular equipment within 12-18 months, and creates cryogenic technician positions -- a workforce category the Act specifically targets.

The practical step is to contact the CHIPS Program Office (chipsgrants@nist.gov) to confirm eligibility before investing in a full application. The application itself requires a detailed financial plan (Document 23), workforce development commitment, environmental justice assessment (Document 24), and national security compliance (no expansion in countries of concern for 10 years per Section 9902(a)(5)(C)).

## Helium's Role in Semiconductor Fabrication -- Specific Use Cases

Helium serves four distinct functions in modern chip manufacturing, each tied to specific process steps and toolsets.

### 1. EUV Lithography Purge Gas

Extreme ultraviolet lithography operates at a wavelength of 13.5nm. At this wavelength, virtually all gases -- including nitrogen and oxygen -- absorb the photons before they reach the wafer. The optical path from the EUV source (a tin-droplet laser-produced plasma) through the mirror optics to the wafer surface must be maintained in a helium environment because helium has the lowest EUV absorption of any practical gas. The ASML NXE:3800E purges its entire optical column with ultra-high purity helium (99.9999% or better).

Each EUV scanner consumes approximately 1,000-2,000 standard cubic feet of helium per day during operation. A fab with 15 EUV scanners running 24/7 consumes 15,000-30,000 SCF per day -- approximately 450,000-900,000 SCF per month -- for EUV alone. At crisis pricing of $450-$3,000 per Mcf (Document 05), this single application can cost $200,000-$2.7 million per month per fab. The economic incentive to implement helium recycling at EUV tools is overwhelming (see Document 21 for recycling system design).

### 2. Backside Wafer Cooling

During plasma etch and ion implantation, wafers are clamped to electrostatic chucks and bombarded with energetic ions. Without active cooling, wafer temperatures would rise to levels that destroy photoresist patterns and cause uncontrolled diffusion of dopant atoms. Helium is pumped into the microscopic gap between the wafer backside and the chuck surface at pressures of 5-15 Torr. Because helium has the highest thermal conductivity of any gas (0.152 W/m-K at 300K -- six times higher than nitrogen), it efficiently transfers heat from the wafer to the actively cooled chuck.

Every etch chamber and ion implanter in the fab uses helium backside cooling. A leading-edge fab may contain 200-300 etch chambers and 50-100 ion implanters. Helium consumption for cooling is lower per tool than for EUV purge, but the tool count makes aggregate consumption significant -- estimated at 100,000-200,000 SCF per month for a large fab.

### 3. Leak Detection

Helium mass spectrometer leak detection (HMSLD) exploits helium's combination of small atomic radius (31 pm), chemical inertness, and extremely low background concentration in ambient air (5.2 ppm). Vacuum systems throughout the fab -- deposition chambers, etch tools, transfer modules -- must maintain base pressures of 10^-7 to 10^-9 Torr. Even microscopic leaks compromise process integrity.

HMSLD works by spraying helium around external joints and connections while a mass spectrometer tuned to mass 4 monitors the system interior. Minimum detectable leak rates reach 10^-12 atm-cc/sec -- sensitive enough to detect a single atomic-scale crack. No alternative gas provides this combination of sensitivity, inertness, and low background. Helium consumption for leak testing is modest per event but continuous, as every tool undergoes periodic leak qualification.

### 4. Carrier Gas

Helium serves as a carrier gas for chemical vapor deposition (CVD) and atomic layer deposition (ALD) processes, transporting precursor chemicals from bubblers and vapor delivery systems to the deposition chamber. Its chemical inertness prevents unwanted reactions with precursors, and its low mass produces favorable gas dynamics in the delivery system.

## Closed-Loop Helium Recycling

The technology to recover and re-purify helium from fab exhaust streams exists and is proven. Companies including Linde Engineering, Air Liquide, Quantum Technology (a Chart Industries brand), and Cryomech manufacture on-site helium recovery systems.

### System Architecture

A closed-loop recycling system captures helium-rich exhaust from process tools, compresses it, removes contaminants (moisture, hydrocarbons, nitrogen) through molecular sieve and activated carbon beds, re-purifies to electronic grade via PSA or membrane separation, and returns it to the gas distribution manifold. Advanced systems include a cryocooler stage that re-liquefies recovered helium for storage.

### Economics

| Scenario | Monthly Helium Purchase (no recycling) | System Capital Cost | Monthly Purchase (with 90% recycling) | Annual Savings | Payback Period |
|----------|---------------------------------------|--------------------|-----------------------------------------|---------------|----------------|
| Large fab, crisis pricing ($75/L) | $750,000 | $3.5M | $75,000 | $8.1M | 5 months |
| Large fab, normalized pricing ($20/L) | $200,000 | $3.5M | $20,000 | $2.16M | 19 months |
| Medium fab, crisis pricing | $300,000 | $2.0M | $30,000 | $3.24M | 7 months |
| Medium fab, normalized pricing | $80,000 | $2.0M | $8,000 | $864,000 | 28 months |

At crisis pricing, the payback period for a recycling system is measured in months. At normalized pricing, it is still under three years -- well within the capital planning horizon of any semiconductor manufacturer. The March 2026 crisis (Document 05) has turned a "should-do" into an "emergency procurement" for fabs that lack recycling capability.

Document 21 provides a detailed engineering analysis of recycling system design, vendor options, and integration with fab gas distribution systems.

## The PNW Fab Landscape

### Intel -- The Anchor Customer

Intel's Oregon operations are not merely large; they are strategically unique. Hillsboro is where Intel develops its manufacturing processes. The D1X fab -- opened in phases with Mod 1 (2013), Mod 2 (2015), and Mod 3 (approximately 2021) -- is where Intel 4, Intel 3, and Intel 20A/18A process nodes are brought from R&D to pilot production before being transferred to high-volume manufacturing sites in Chandler (Arizona), Leixlip (Ireland), and Kiryat Gat (Israel).

This development role means Oregon's helium needs are skewed toward the highest purity specifications. Research-grade (6N, 99.9999%) helium commands a significant premium over industrial-grade (5N, 99.999%) and is harder to source during shortages because fewer purification facilities can achieve 6N consistently. A regional hub capable of producing 6N helium would serve Intel's most demanding need.

Intel received $7.86 billion in direct CHIPS Act funding (finalized late 2025), the largest single award. While the bulk of this funding targets the Ohio mega-fab complex (Fabs 52 and 62), Intel's Oregon operations benefit from the company's overall supply chain investment, and Oregon-specific state incentives ($115 million from the Oregon CHIPS program) further support the ecosystem.

### The Broader Cluster

| Facility | Location | Helium Relevance |
|----------|----------|-----------------|
| Intel D1X | Hillsboro, OR | Primary consumer -- EUV development, highest purity needs |
| Lattice Semiconductor | Hillsboro, OR (HQ) | FPGA design -- fabless, but tests on-site |
| Microchip Technology | Gresham, OR | Specialty analog and embedded -- $72M CHIPS Act grant to double chip capacity, ~600 new jobs expected |
| Siemens EDA | Wilsonville, OR | EDA software -- no direct helium consumption |
| Applied Materials | Portland area | Equipment provider -- helium in demo/service tools |
| Lam Research | Tualatin, OR | Equipment provider -- helium in etch tool demos |
| OHSU | Portland | MRI, cryogenics -- medical helium consumer |
| Oregon State | Corvallis | Materials research -- cryogenic helium consumer |

See Document 13 for the comprehensive Silicon Forest ecosystem analysis.

## The Gap -- And What to Do About It

The PNW semiconductor ecosystem has every layer except upstream helium infrastructure.

| Layer | Status |
|-------|--------|
| World-class fabs | Present (Intel D1X) |
| Equipment ecosystem | Present (Applied Materials, Lam, ASML service) |
| Academic pipeline | Present (OSU, PSU, OIT) |
| Distribution network | Present (Airgas, Linde, Central Welding) |
| CHIPS Act funding | Available (explicit supply chain provisions) |
| Local helium purification | **Missing** |
| Closed-loop helium recycling | **Missing** (at fab level) |
| Regional helium storage/buffer | **Missing** |
| R&D-grade gas blending | **Missing** |
| Supply chain redundancy | **Missing** |

Filling these gaps requires a specific sequence of actions:

1. **Immediate (0-6 months):** Deploy closed-loop recycling systems at Intel D1X and any other fab with significant helium consumption. The ROI at crisis pricing makes this an emergency measure. Document 21 provides the technical specification; Document 15 identifies the vendors.

2. **Near-term (6-18 months):** Establish a regional purification hub, likely in the Portland-Hillsboro corridor or the Centralia-Chehalis industrial zone (Document 07 for siting analysis). Begin with a membrane + PSA system capable of producing 5N helium from crude feedstock purchased from US primary producers (Document 17 for crude sourcing and transport).

3. **Medium-term (18-36 months):** Add liquefaction capability to the hub (Document 18 for liquefaction hub design). Begin export operations through NWSA. Expand to 6N research-grade production.

4. **Ongoing:** Apply for CHIPS Act supply chain resilience funding. Form a cooperative structure to share capital and risk (Document 19). Integrate with the broader I-5 corridor distribution network (Document 07).

The semiconductor industry has spent the past five years learning that concentrated supply chains are fragile. The March 2026 helium crisis is teaching the same lesson about gases. The PNW has the customers, the infrastructure, and the funding pathways. What it lacks is someone willing to build the upstream.
