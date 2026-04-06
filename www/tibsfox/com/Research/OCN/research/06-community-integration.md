# Community Integration: Infrastructure That Gives Back

> **Domain:** Social Impact & Community Systems Architecture
> **Module:** 6 -- Open Compute Node: The Community Dimension, Social Return, and the Politics of Infrastructure
> **Through-line:** *The difference between a data center and a community asset is not size. It is intent. The Open Compute Node was designed from the first line of its specification to return more than it takes — in clean water, in free compute, in jobs, in public art, and in the harder-to-measure currency of dignity: the statement that a small town is worth serious infrastructure. That is what makes this more than a data center. It is infrastructure that gives back.*

---

> **PROFESSIONAL ENGINEER REVIEW REQUIRED**
>
> Water treatment systems, electrical distribution, and community network infrastructure described in this module must be reviewed and certified by the applicable state drinking water program and licensed professionals in the jurisdiction of deployment before any operational community distribution begins. Economic projections are estimates based on publicly available data and are provided for planning purposes only.

---

## Table of Contents

1. [The Case for Community-Centered Infrastructure](#1-the-case-for-community-centered-infrastructure)
2. [Community Compute Allocation: Architecture and Enforcement](#2-community-compute-allocation-architecture-and-enforcement)
3. [Network Architecture: Segmentation, VLAN Isolation, and Access Control](#3-network-architecture-segmentation-vlan-isolation-and-access-control)
4. [Capacity Management and Service Delivery](#4-capacity-management-and-service-delivery)
5. [Community Use Cases](#5-community-use-cases)
6. [The Mural Art Program: Corten Steel as Community Canvas](#6-the-mural-art-program-corten-steel-as-community-canvas)
7. [Environmental Return Metrics](#7-environmental-return-metrics)
8. [Community Engagement Process](#8-community-engagement-process)
9. [Economic Impact: Jobs, Training, and Digital Equity](#9-economic-impact-jobs-training-and-digital-equity)
10. [Comparison to Existing Community Compute Programs](#10-comparison-to-existing-community-compute-programs)
11. [What Makes This Different](#11-what-makes-this-different)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Case for Community-Centered Infrastructure

Every major technology infrastructure buildout of the past thirty years followed the same pattern: capital concentration in metropolitan areas, extraction of value from rural and underserved communities, and a steady widening of the gap between those with compute access and those without. The railroads extracted timber and ore and left behind company towns. The interstate highways destroyed neighborhoods in cities and bypassed small towns. The internet buildout of the 1990s ran fiber through railroad rights-of-way — but the communities along those rights-of-way could not afford to connect to it.

The AI infrastructure buildout is following the same pattern at accelerating speed. NVIDIA's GB200 NVL72 racks — the current frontier of AI compute — exist in a small number of hyperscaler facilities in Northern Virginia, Phoenix, and the Pacific Northwest. Access to this compute is priced for large enterprises. The community of Deming, New Mexico, population 14,000, through which both Union Pacific and BNSF rail lines pass and which receives 6.3 kWh/m²/day of solar irradiance, has no meaningful access to AI compute infrastructure.

The Open Compute Node addresses this structural problem not through charity but through architecture. The community return is not an add-on feature. It is a design constraint — as fundamental to the specification as the cooling loop or the power budget. A node that does not give back has failed to meet its specification.

### 1.1 What Infrastructure Debt Looks Like

The communities targeted for Open Compute Node deployment share a common profile:

| Characteristic | Typical Value | Data Source |
|----------------|--------------|-------------|
| Population | 1,000 – 25,000 | US Census |
| Broadband access (25/3 Mbps) | 60–75% of households | FCC Broadband Map 2023 |
| Library internet terminals per capita | 0.4–1.2 per 1,000 residents | IMLS Public Libraries Survey |
| Distance to nearest university computing lab | 50–200 miles | Author calculation |
| Per-capita income | $15,000–$28,000 | US Census ACS 5-year |
| Digital skills training access | Minimal; often no local provider | NTIA Digital Equity Survey |

These are not abstract statistics. They describe the experience of a high school student trying to run a machine learning project for a science fair, or a rancher trying to use a crop yield prediction tool, or a small business owner trying to access an AI translation service for customer correspondence in Spanish and English. The infrastructure debt is measured in missed opportunities that compound annually.

### 1.2 The Net-Positive Design Requirement

The Open Compute Node specification establishes four mandatory community returns:

| Return Category | Minimum Specification | Measurement |
|----------------|----------------------|-------------|
| Free compute | 10% of total capacity, architecturally enforced | PFLOPS-hours delivered per month |
| Clean water | EPA 40 CFR Part 141 compliant, continuous output | Gallons per day delivered |
| Community art | One permanent mural per deployment | Visual; attribution plaque installed |
| Clean energy surplus | Excess solar returned to grid during low-compute periods | kWh returned per month |

Each of these is quantifiable. Each is contractually committed in the Memorandum of Understanding between the node operator and the community partner before a single panel is installed. The community's return is guaranteed at the same level as the operator's compute lease — it is not a goodwill gesture, it is a performance obligation.

---

## 2. Community Compute Allocation: Architecture and Enforcement

### 2.1 The 10% Minimum: Hard Partition, Not Policy

The most important architectural decision in the community compute system is the choice to enforce the 10% allocation as a hardware partition rather than a software scheduling policy.

Software scheduling policies fail under load. When a commercial client submits a large training job at 2:00 AM and community compute is nominally idle, a policy-based scheduler faces constant pressure to borrow from the idle community allocation. Operators rationalize this as "making use of spare capacity." The community allocation erodes. Within twelve months, the "10% allocation" becomes a theoretical commitment that never materializes during peak demand — precisely when community users are most likely to want compute access for school projects, climate analysis, or digital government services.

The OCN design eliminates this failure mode by partitioning at the hardware level:

| Enforcement Layer | Mechanism | Commercial Override? |
|------------------|-----------|---------------------|
| vGPU partition | NVIDIA MIG (Multi-Instance GPU) or vGPU resource pool — community allocation carved as fixed partition | No |
| Network | Community VLAN physically isolated; no routing path to commercial compute regardless of software state | No |
| Power | Community compute segment on dedicated PDU branch; not part of commercial load shedding sequence | No |
| SLA | MOU specifies 10% minimum; operator monitoring system generates alert if community availability drops below threshold | Contractual |

For the GB200 NVL72 reference configuration (720 PFLOPS FP4 per rack, 2 racks = 1,440 PFLOPS total), the 10% community allocation provides:

| Metric | Value |
|--------|-------|
| Community PFLOPS (FP4 inference) | 144 PFLOPS |
| Community GPU memory (shared pool) | ~1.38 TB HBM3e |
| Concurrent inference requests (LLM, 70B param) | ~12–18 simultaneous sessions |
| Student data analysis jobs (concurrent) | 50–100 (CPU-class workloads) |
| Community compute hours per month | 720 hours (continuous) |

For reference: a 2024-era university research cluster serving 500 graduate students typically provides 100–200 PFLOPS of aggregate GPU compute. The community allocation from a single OCN exceeds that.

### 2.2 Scaling and Overflow

The 10% is a floor, not a ceiling. Community allocation can be increased by mutual agreement between the operator and the advisory board. During periods when commercial workloads are low — nights, weekends, periods between contracts — excess capacity can be offered to the community pool on an opportunistic basis, provided:

1. The base 10% hard partition is never compromised
2. Opportunistic access is clearly labeled as non-guaranteed
3. The advisory board is notified of opportunistic allocation via the usage dashboard in real time

The design anticipates a "burst capacity" model: guaranteed 10%, with typical realized delivery of 15–25% during normal commercial utilization patterns.

---

## 3. Network Architecture: Segmentation, VLAN Isolation, and Access Control

### 3.1 Physical Isolation Principle

The community network does not share routing infrastructure with the commercial compute network. This is not a firewall rule that can be misconfigured. It is a physical separation:

```
External Internet
      │
      ├── Commercial Uplink (VLAN 20)
      │     └── Commercial compute racks
      │           └── Tenant workloads (isolated per-tenant)
      │
      └── Community Uplink (VLAN 30)
            └── Community vGPU pool
                  └── Community services (API, web hosting, compute)
                        └── Fiber/wireless to community partner building
```

VLAN 30 (community) has no inter-VLAN routing to VLAN 20 (commercial). There is no firewall rule allowing traffic from VLAN 30 to reach VLAN 20. The routing table on the community switch does not contain routes to the commercial subnet. Physical network separation at the switch level ensures that even a complete software failure of the firewall does not expose commercial workloads to community users.

### 3.2 VLAN Architecture

| VLAN | ID | Subnet | Purpose | Routing |
|------|----|--------|---------|---------|
| Management | 10 | 10.0.10.0/24 | Operator DCIM, BMCs, monitoring | Internal only; no internet |
| Commercial | 20 | 10.0.20.0/24 | Commercial compute tenant networks | Internet via commercial uplink |
| Community | 30 | 10.0.30.0/24 | Community services, public access | Internet via community uplink |
| Water/Environmental | 40 | 10.0.40.0/24 | Water quality sensors, environmental monitoring | Internal to management VLAN only |
| Storage | 50 | 10.0.50.0/24 | NVMe-oF storage fabric | Internal only |

### 3.3 Community Access Architecture

The community partner building — typically a library, school, or municipal office within one mile of the container — connects to the community VLAN via one of three methods:

| Connection Type | Use Case | Bandwidth | Notes |
|----------------|----------|-----------|-------|
| Dark fiber (preferred) | Partner building within 1,000m | 10 Gbps+ | Lowest latency; highest reliability |
| Single-mode fiber (installed) | Partner building 0.5–2 miles | 10 Gbps | Requires trenching or conduit; best for permanent deployment |
| Licensed point-to-point wireless | Partner building 0.1–5 miles | 1–10 Gbps | No trench required; good for initial deployment |
| Unlicensed wireless (fallback) | Short range, <500m | 300 Mbps–1 Gbps | 802.11ax or 60GHz; suitable for temporary or low-demand use |

Within the community partner building, standard 802.11ax (Wi-Fi 6) access points or wired Ethernet drops connect individual terminals to the community VLAN. The network architecture at the building end is intentionally simple: plug in, get compute.

### 3.4 Access Control and Privacy

The community access model is modeled on a public library: open access, no identification required for standard use.

| Policy | Implementation | Rationale |
|--------|---------------|-----------|
| No mandatory login | Public endpoints on VLAN 30 require no credentials for standard compute access | Digital equity — login barriers exclude low-literacy and undocumented users |
| Optional login for persistent storage | Users may create accounts to save project state across sessions | Voluntary; account creation requires only a name (no real-name requirement) |
| No individual session logging | Session logs record resource usage aggregates only; no per-session IP or user tracking | Privacy by design; cannot be compelled to produce records that don't exist |
| Rate limiting | Per-IP rate limiting prevents single users from monopolizing community allocation | Fairness mechanism; does not require user identification |
| Content filtering | Basic DNS-level filtering (malware domains, known CSAM domains) | Safety requirement; not used for censorship or monitoring |
| No behavioral analytics | No usage profiling, no recommendation systems, no tracking pixels | Infrastructure, not a platform |

The privacy model is explicit: the community compute system is designed to leave no records that could later be subpoenaed, demanded by law enforcement, or used to discriminate against users. This is not a theoretical concern. In communities along the US-Mexico border where many OCN deployment targets are located, immigrant community members face real risks from data collection. The system's privacy architecture must be trustworthy regardless of who holds political power at any given time.

---

## 4. Capacity Management and Service Delivery

### 4.1 Workload Types and Scheduling

Community compute workloads fall into three categories with different scheduling requirements:

| Workload Type | Examples | Latency Sensitivity | Scheduling Model |
|--------------|----------|--------------------|--------------------|
| Interactive inference | AI assistant, translation, accessibility tools | High (<500ms) | Reserved capacity; pre-empts batch |
| Interactive compute | Data analysis, web apps, educational platforms | Medium (1–30s) | Fair-share queue with priority for educational hours |
| Batch compute | Long-running analysis, video transcoding, archival | Low (hours acceptable) | Backfill scheduling; uses surplus capacity |

The community VLAN exposes three service endpoints:

1. **Inference API** (REST, OpenAI-compatible interface): Serves locally-hosted open-source models. Default model: a quantized 7B–13B parameter LLM appropriate for educational use. Advisory board selects models; operator updates on advisory board request. No API key required from within VLAN 30.

2. **Compute portal** (web interface): Browser-based access to Jupyter-equivalent notebooks, batch job submission, and file storage. No installation required on community terminals. The portal runs on community VLAN infrastructure; data stays on-site.

3. **Hosted services** (web hosting, LMS, digital library): Applications hosted on behalf of the community partner institutions. A library's digital card catalog, a school's learning management system, a municipal public records portal — all hosted on community allocation at no cost.

### 4.2 Capacity Planning and Advisory Board Control

The advisory board reviews capacity utilization quarterly and can redirect community allocation between the three service categories. Rebalancing is implemented by the node operator within 30 days of an advisory board resolution.

| Metric | Reported Monthly | Target |
|--------|-----------------|--------|
| Community PFLOPS-hours utilized | Aggregate | >50% utilization (idle capacity = unexploited community benefit) |
| Interactive API availability | Percentage uptime | >99% |
| Mean inference latency | 95th percentile | <2 seconds for 7B model |
| Batch job queue depth | Average jobs waiting | <10 jobs per day |
| Water output volume | Gallons per day | Per flow rate specification |

---

## 5. Community Use Cases

### 5.1 Library Compute Terminals

Public libraries in small towns serve as the primary technology access point for community members who do not have home computers or reliable internet. The American Library Association's 2023 Digital Equity Survey found that rural libraries average 3.2 public internet terminals per location, with typical terminal age of 6.2 years and average internet speeds of 18 Mbps — below the FCC's 25/3 Mbps broadband threshold.

An OCN community compute allocation transforms a library terminal from a basic web browser into a computational workstation without replacing any hardware. The terminal connects to the community VLAN (over the library's existing network or a new point-to-point wireless link to the container). The browser-based compute portal gives the terminal access to:

- GPU-accelerated AI inference for document processing, translation, and research assistance
- Jupyter-equivalent notebooks for data analysis projects
- Video transcoding for digitizing local history recordings
- Full-resolution image processing for archival and accessibility

**Quantified impact example:** A library in Lordsburg, New Mexico (population 2,600) currently has four terminals with 15 Mbps internet. Post-OCN: four terminals with direct compute access to 144 PFLOPS FP4. A student who previously could not run a neural network model locally — because their home computer had no GPU and cloud API costs were prohibitive — can now run models equivalent to a research university workstation from the library's existing chairs and keyboards.

### 5.2 School STEM Programs

K-12 STEM education in rural areas is constrained by two factors: teacher availability and compute access. Rural schools in New Mexico, Arizona, and west Texas face teacher shortages in STEM subjects that have persisted for decades. Online curriculum can partially compensate, but most online STEM curriculum that involves data analysis, machine learning, or computational science assumes internet-connected cloud compute — which is expensive and often inaccessible.

The OCN community VLAN enables a different model:

| Application | Tool Chain | Infrastructure Required |
|------------|------------|-------------------------|
| Machine learning (beginner) | Teachable Machine, fast.ai | Browser + community inference API |
| Data science | Jupyter, pandas, matplotlib | Compute portal (no local install) |
| Climate and weather modeling | Regional NWM data + student analysis | Batch compute + local data mirror |
| Astronomy | Image stacking, period analysis | Batch compute + data portal |
| Programming (introductory) | Browser IDE with instant execution | Compute portal |

A single OCN can support an entire school district's STEM computing needs from one community allocation. The compute portal is accessible from any school building on the community VLAN — not just the library. A biology class analyzing local species data, a physics class simulating projectile motion, and a computer science class training a simple neural network can all run simultaneously within the community allocation.

**Case projection:** A rural school district with 1,200 students, previously unable to offer AP Computer Science due to lack of computing infrastructure, gains access to ~144 PFLOPS of compute within their district network. The College Board's AP Computer Science A curriculum requires a Java development environment; the OCN compute portal hosts this without any installation on school computers. The barrier to offering the course drops to zero.

### 5.3 Local Business AI Access

Small businesses in rural communities face a paradox: the AI tools most likely to benefit their operations — translation, customer service automation, document processing, inventory optimization — are commercially available from major providers, but the pricing models assume enterprise scale. A three-person landscaping company that invoices in English and communicates with Spanish-speaking clients in both languages could benefit enormously from AI translation assistance, but paying $20–$100 per month for an API subscription is a significant operating expense at their margin.

The OCN community VLAN's inference API changes this calculation. The API is free to use from within the community VLAN. For local businesses within range of the community wireless network — or connected via the community partner building — the following use cases are available at zero marginal cost:

| Business Type | Use Case | Model Type |
|--------------|----------|-----------|
| Agriculture/ranching | Crop yield prediction, disease identification | Vision + tabular models |
| Retail | Inventory demand forecasting, customer inquiry response | Time-series + LLM |
| Restaurant/food service | Translation of menus, customer communication | LLM (multilingual) |
| Legal/tax services | Document summarization, form completion assistance | LLM + document processing |
| Healthcare (non-clinical) | Administrative documentation, translation | LLM (HIPAA notice required) |
| Construction | Materials estimation from photos, bid document processing | Vision + LLM |

**Digital equity implication:** The communities where OCN deployment is targeted have per-capita incomes that place enterprise-priced AI tools out of reach for most small businesses. Free access to open-source models running locally — with no data leaving the community — levels a playing field that was being actively tilted against rural small businesses by the pricing structures of major AI providers.

### 5.4 Maker Space and Prototyping Support

Maker spaces have emerged in some rural communities, often hosted by libraries or community colleges, as access points for fabrication tools (3D printers, laser cutters, CNC equipment). These spaces consistently identify compute as a limiting resource: generative design, simulation, CAM path planning, and machine learning-assisted quality control all require GPU compute that consumer hardware cannot economically provide.

An OCN community allocation creates compute infrastructure for a virtual maker space even where no physical facility exists. Key applications:

- **Generative design** (FreeCAD, Fusion 360 equivalent): GPU-accelerated topology optimization for custom parts
- **Electronics simulation** (SPICE, KiCad DRC): Circuit simulation for local electronics projects
- **3D model processing**: Photogrammetry (structure-from-motion), mesh optimization for printing
- **CAM path planning**: GPU-accelerated toolpath generation for CNC operations

For agricultural communities specifically — where custom equipment fabrication is a survival skill — the ability to design, simulate, and validate a part before committing material is a direct economic benefit.

### 5.5 Agricultural Data Analysis

Agriculture in the Southwest is water-constrained, weather-dependent, and increasingly data-intensive. The USDA's Farm Service Agency collects and publishes extensive agricultural data, but the analytical tools to extract value from that data — spatial analysis, weather correlation, yield modeling — require compute that most small farms cannot access.

The OCN is physically located in agricultural regions by design: the deployment targeting criteria weight non-potable water availability, which correlates directly with irrigation infrastructure and agricultural activity. This means the community compute allocation is available precisely where agricultural data analysis is most needed.

| Application | Data Source | Compute Profile |
|-------------|------------|----------------|
| Crop water use modeling | AZMET, CoAgMet, AgriMet weather stations | Time-series analysis, medium compute |
| Pest and disease pressure mapping | USDA-NASS, state agricultural departments | Geospatial + ML classification |
| Irrigation schedule optimization | Soil moisture sensors + weather forecasts | Optimization, low-medium compute |
| Market price analysis | USDA AMS livestock and grain reports | Time-series, low compute |
| Yield prediction | Historical yield + weather correlation | ML regression, medium compute |
| Water rights optimization | State water rights databases | Linear programming, low compute |

A farmer with 500 acres under irrigation in eastern New Mexico, using free community compute to run a crop water use model calibrated to local AZMET data, can reduce water application by an estimated 10–15% annually without yield loss — based on USDA irrigation efficiency research. At current water pricing in New Mexico ($0.50–$2.00 per acre-foot from irrigation districts, plus energy costs for pumping), the savings are material.

---

## 6. The Mural Art Program: Corten Steel as Community Canvas

### 6.1 Why the Mural Matters

A shipping container is not inherently beautiful. It is functional, industrial, and by default signals extraction — something is being taken out of here, or put in, for someone else's benefit. The mural art program addresses this signal directly. The container arrives already bearing the community's own art, made by the community's own artists, before a single computation is sold. The mural is not decoration. It is the container's first act in the community.

This matters for reasons that are simultaneously psychological, political, and practical. Psychologically: communities that have been repeatedly subjected to extractive infrastructure develop justified skepticism toward any new industrial installation. A mural designed by local schoolchildren before the container ships is a credible signal that the relationship is different. Politically: local zoning and permitting for industrial installations is significantly easier when the community is already invested in the project's success. Practically: a container that looks like it belongs to the community experiences dramatically less vandalism and encroachment than one that looks like corporate infrastructure.

### 6.2 The Container as Canvas: Material Science

The OCN container is made from Corten steel (ASTM A588 or equivalent weathering steel), which presents specific challenges and opportunities for exterior art.

**Corten steel properties relevant to painting:**
- Surface develops a controlled rust patina (magnetite, FeOOH) over 2–5 years
- Patina layer provides corrosion resistance but is incompatible with direct paint adhesion
- Factory-fresh containers may have mill scale (iron oxide scale from hot rolling) or existing primer
- Surface temperature extremes in Southwest deployment: -10°C to +80°C (container surface in direct sun)
- Thermal cycling coefficient: 12 µm/m/°C for steel; paint system must accommodate significant expansion/contraction

### 6.3 Panel Preparation: Surface Treatment Specification

| Step | Process | Standard | Notes |
|------|---------|----------|-------|
| Initial assessment | Visual inspection; magnetic thickness gauge for existing coatings | SSPC-VIS 1 | Identify existing primer, rust, mill scale |
| Blast cleaning | Dry abrasive blasting to white metal | SSPC-SP 5 / NACE No. 1 | Removes all existing coatings, rust, mill scale; creates anchor profile of 50–75 µm |
| Anchor profile verification | Surface profile gauge measurement | ASTM D4417 | Confirm 2–3 mil (50–75 µm) profile |
| Solvent cleaning | Wipe-down with MEK or approved solvent | SSPC-SP 1 | Remove dust, oil, fingerprints after blasting |
| Prime coat (within 4 hours of blasting) | 2-part marine epoxy primer, e.g. Sherwin-Williams Macropoxy 646 | SSPC-PS 13.01 | Apply 3–4 mils DFT; recoat window 4–16 hours |
| Intermediate coat | High-build epoxy, e.g. Sherwin-Williams DTM Epoxy | SSPC-PS 13.01 | 4–6 mils DFT; improves build and chemical resistance |
| Base coat (art ground) | Exterior polyurethane, white, e.g. Sherwin-Williams Tile-Clad HS | — | 2 mils DFT; provides consistent white ground for artwork reproduction |

**Critical note on Corten compatibility:** If the owner specifies that the container's unpainted portions should develop the characteristic Corten patina, painted surfaces must extend 25–50mm beyond the art boundary to prevent runoff staining. Corten rust runoff is visually distinctive (orange-brown streaks) and will discolor art if the transition zone is not planned.

### 6.4 Paint Specifications for Southwest UV Conditions

The Southwest deployment environment subjects exterior paint to conditions more aggressive than virtually any other US climate: UV index regularly exceeding 11 (extreme), surface temperatures reaching 80°C in summer, rapid temperature cycling at dawn and dusk, and low humidity that accelerates certain failure modes.

| Layer | Recommended Products | DFT | UV Performance | Temperature Range |
|-------|---------------------|-----|----------------|-------------------|
| Primer | Carboline Carboguard 890, Sherwin-Williams Macropoxy 646 | 3–4 mils | Excellent adhesion; UV-stable | -40°C to +120°C |
| Art paint | Sherwin-Williams Sher-Cryl HPA or Matthews Paint Acrylic Urethane | 2–4 mils (multiple coats per color) | Good UV resistance; wide color gamut | -30°C to +100°C |
| Clear coat | 2K polyurethane with UV absorber + HALS (Hindered Amine Light Stabilizer), e.g. PPG Deltron DC5000 | 3–4 mils | Designed for automotive exterior use; 10+ year UV stability | -40°C to +120°C |

**HALS chemistry note:** Hindered amine light stabilizers do not absorb UV (that is the role of the UV absorber additives), but they interrupt the radical chain reaction that UV-initiated oxidation causes in the polymer matrix. The combination of UV absorber + HALS in a 2K polyurethane clear coat is the current state of practice for outdoor decorative coatings in extreme UV environments. Expected service life under Southwest conditions: 8–12 years before significant color fade requires re-coating.

**Color considerations:** Darker colors absorb more heat and accelerate thermal cycling stress on the paint system. Community designs incorporating large areas of dark pigment (deep navy, black, dark red) should use formulations specifically rated for high-surface-temperature applications. The Matthews Paint acrylic urethane line has been tested to 300°F (149°C) surface temperature — sufficient for Southwest container exterior applications.

### 6.5 Community Design Process

The design process is structured to maximize genuine community ownership while remaining manageable within the container's manufacturing timeline:

| Phase | Duration | Activity | Who Is Involved |
|-------|----------|----------|----------------|
| Announcement | Week 1 | Partner institutions (library, school, community center) announce open call | Advisory board + partner staff |
| Design period | Weeks 2–5 | Open call: schools receive art program materials; local artists notified; community groups invited | All community members; K-12 art programs prioritized |
| Submission review | Week 6 | Advisory board reviews submissions for guideline compliance; selects 3–5 finalists | Advisory board |
| Public exhibition | Week 7 | Finalist designs displayed at library/community center; public commentary period | All community members |
| Vote | Week 8 | Open vote; any community member may participate; no age minimum | All community members |
| Digitization and scaling | Weeks 9–10 | Selected design professionally digitized; scaled to container dimensions; color matched to available marine/industrial paint systems | Professional art services (contracted by operator) |
| Factory painting | During final assembly | Design applied at manufacturing facility by professional muralists | Professional muralists (factory-based) |
| Clear coat and plaque | Before shipping | UV-protective clear coat applied; artist attribution plaque fabricated and mounted | Factory |
| Delivery | Day of arrival | Container arrives with mural already complete | Community sees the mural for the first time when the container arrives |

**Design guidelines (qualitative):**

The guidelines are minimal by design. Heavy restrictions on community art produce generic, institutional-looking results that undermine the program's purpose. The constraints that do exist are consensus-based and practical:

- Celebrate local culture, landscape, natural history, science, or community identity
- Avoid content that requires political or religious consensus (no campaign imagery, no denominational religious symbols)
- No corporate logos, commercial marks, or advertising content of any kind
- Include reference to knowledge, discovery, or education where it fits naturally with the design
- Artist retains copyright in their work; grants perpetual irrevocable display license to the operator for the life of the container
- Artist attribution plaque mounted on container exterior within 60cm of the art boundary; plaque specifies artist name, age (if minor, with guardian consent), and year

### 6.6 Refresh Cycle

The mural refresh cycle is aligned with the major hardware upgrade cycle (5–7 years), which requires the container to be returned to the factory or a qualified maintenance facility. At that point:

1. Advisory board initiates a new design competition
2. Existing mural is photographed and archived (digital preservation)
3. Surface is re-prepared (overcoat or blast-back depending on condition)
4. New mural is applied at the factory during the hardware upgrade visit

The original mural exists in the community's records as a permanent artifact even after the physical container has been re-painted. Over a container's 20-year service life, three to four different community murals will be applied and archived.

---

## 7. Environmental Return Metrics

### 7.1 Clean Water: Gallons Per Day

The cooling and water system specification (OCN Module 03) establishes a flow rate range of 5–20 GPM depending on compute load and input water quality. Translating to daily output:

| Flow Scenario | GPM | Gallons/Day | Liters/Day | Community Equivalent |
|--------------|-----|------------|-----------|---------------------|
| Minimum (low load, conservative) | 5 GPM | 7,200 gal/day | 27,255 L/day | ~480 people's daily drinking water (EPA: 0.5 gal/day drinking water per person) |
| Nominal (reference design) | 10 GPM | 14,400 gal/day | 54,510 L/day | ~960 people's daily drinking water |
| Maximum (full load, clean input) | 20 GPM | 28,800 gal/day | 109,020 L/day | ~1,920 people's daily drinking water |
| **Annual nominal output** | — | **5,256,000 gal/year** | **19.9 million L/year** | — |

For context: the town of Deming, New Mexico (population 14,000) uses approximately 1.3 million gallons of water per day from its municipal system. A single OCN operating at nominal flow provides approximately 1.1% of Deming's total municipal water demand — delivered as EPA-compliant potable water from an agricultural runoff input that previously provided no direct community benefit.

In a genuine water-scarce scenario (contamination event, infrastructure failure, drought restriction), the OCN's 14,400 gallons per day becomes emergency drinking water for approximately 960 people for immediate needs. This is not the primary use case, but it establishes the node as redundant water infrastructure — a form of community resilience that conventional data centers never provide.

**Water quality monitoring metrics reported monthly:**
- Total dissolved solids (TDS) at output: target <100 mg/L
- pH at output: target 7.0–7.5
- Turbidity at output: target <0.1 NTU
- Total coliform at output: target zero
- Monthly gallons delivered to community distribution point
- Number of automated shutoff events (quality failures resulting in valve close)

### 7.2 kWh of Excess Solar Returned to Grid

The OCN power system (OCN Module 02) specifies 607 kW nameplate solar with 2,000–4,000 kWh BESS for the reference GB200 NVL72 dual-rack configuration. The 150 kW continuous operational load draws from the solar array during daylight hours, with BESS bridging overnight gaps.

Excess solar generation occurs when:
- Daytime solar generation exceeds facility load + BESS charging rate
- BESS is fully charged before end of peak solar window
- Commercial workload is running below capacity (reducing compute draw)

**Conservative excess calculation:**

| Parameter | Value | Basis |
|-----------|-------|-------|
| Southwest solar capacity factor | 24.7% | NREL TMY3 (Tucson/Albuquerque) |
| Annual generation at 607 kW nameplate | 1,312 MWh/year | 607 kW × 8,760 hr × 24.7% |
| Annual facility consumption (150 kW continuous) | 1,314 MWh/year | 150 kW × 8,760 hr |
| Net balance before excess export | ~0 MWh/year (near-balanced design) | — |

This near-balanced design means excess export is an opportunistic benefit, not a guaranteed primary output. During periods of reduced commercial load (nights, weekends, maintenance windows), or when upgraded solar capacity is installed, significant excess becomes available.

| Scenario | Commercial Load | Excess Monthly | Annual Export |
|----------|----------------|---------------|---------------|
| 50% commercial utilization, full solar | ~75 kW draw | ~180 MWh/month | ~2,160 MWh/year |
| Full commercial load, 10% compute idle | 135 kW draw | ~15 MWh/month | ~180 MWh/year |
| Weekend / maintenance (24 hrs off, 2×/month) | 0 kW | ~216 kWh/event | ~5 MWh/year |

At US average residential electricity price ($0.16/kWh), 2,160 MWh of annual export represents $345,600 in grid electricity equivalent — a real community economic benefit when grid interconnection is established.

### 7.3 CO2 Avoided

**Avoided emissions from renewable-only operation:**

A conventional data center providing equivalent compute (1,440 PFLOPS FP4 from grid power) would draw from the US average grid mix. Using EPA eGRID 2023 national average emissions factor of 0.386 kg CO2/kWh:

| Scenario | Annual kWh | CO2 at Grid Average | CO2 at OCN (solar) | CO2 Avoided |
|----------|-----------|-------------------|-------------------|------------|
| Reference facility (150 kW continuous) | 1,314,000 kWh | 507,204 kg CO2/yr | ~0 (solar) | **507 tonnes CO2/year** |

For Southwest regional grids (WECC, SPS), the emissions factor is closer to 0.291 kg CO2/kWh (WECC 2023 average), yielding approximately 382 tonnes CO2/year avoided.

**Avoided emissions from water treatment displacement:**

Conventional water treatment for municipal supply consumes approximately 1.5 kWh per 1,000 gallons treated and distributed (EPRI 2002, updated by AWWA 2017). For 5,256,000 gallons/year at nominal flow:

| Metric | Value |
|--------|-------|
| Energy equivalent of displaced water treatment | 7,884 kWh/year |
| CO2 equivalent at grid average (0.386 kg/kWh) | 3.04 tonnes CO2/year |
| Total additional avoided emissions | ~3 tonnes CO2/year |

**Combined CO2 avoided per node per year: approximately 385–510 tonnes CO2**, depending on regional grid mix. At 10 deployed nodes, avoided emissions exceed 3,850–5,100 tonnes CO2/year — equivalent to removing 835–1,100 passenger cars from the road annually.

---

## 8. Community Engagement Process

### 8.1 Pre-Deployment Consultation

The OCN deployment process requires a genuine community consultation before any site preparation begins. This is not a public comment period appended to a permit application. It is a structured engagement that can result in the deployment not proceeding if community consensus is not achieved.

| Phase | Activities | Duration | Decision Point |
|-------|-----------|----------|---------------|
| Initial contact | Operator contacts library director, school superintendent, or mayor; describes project; requests introductory meeting | Week 1 | Stakeholder agrees to learn more |
| Stakeholder briefing | Operator presents to community leadership; Q&A; initial assessment of interest | Weeks 2–3 | Community leadership endorses moving to public process |
| Public informational sessions | Two to three open community meetings; project described; questions answered; concerns documented | Weeks 4–6 | Attendance and feedback assessment |
| Advisory board formation | Community identifies five-member advisory board (library, school, municipal, at-large, youth representative) | Week 7 | Advisory board constituted |
| MOU negotiation | Advisory board and operator negotiate terms; community allocation, water access, art program, land access | Weeks 8–10 | MOU executed (or process ends) |
| Site selection | Advisory board participates in final site selection within the agreed area | Weeks 11–12 | Site confirmed |
| Mural program launch | Advisory board announces design competition | Week 13 | Design process begins |

If at any point the community does not want the deployment — if the public meetings reveal strong opposition, if the advisory board cannot be constituted, if MOU terms cannot be agreed — the operator withdraws. The model requires community consent, not community tolerance.

**Language access:** In communities where Spanish, Navajo, Zuni, or other languages are widely spoken, all consultation materials are provided in the relevant language(s). Meetings are conducted bilingually where needed. This is a logistical requirement, not an optional enhancement — communities where significant portions of the population cannot participate in English-only processes cannot give meaningful informed consent.

### 8.2 Ongoing Advisory Board

The advisory board is the community's primary governance mechanism for the deployed node. It is not an advisory body in the weak sense — a group that receives presentations and provides non-binding comments. It has real decision authority over:

| Decision Domain | Advisory Board Authority |
|----------------|------------------------|
| Community compute service mix | Full authority; operator implements within 30 days |
| Community compute capacity increase (above 10% minimum) | Authority to request; operator may agree to increase |
| Water distribution point and method | Full authority over community-side distribution |
| Mural design selection | Full authority; operator executes |
| Community access policies (who qualifies, hours of access) | Full authority |
| New community partner additions | Authority to recommend; operator approves capacity |
| Public reporting | Authority to request any aggregate metric at any time |

Advisory board meetings occur quarterly as a minimum. The board may call special meetings at any time. The operator's liaison attends but does not vote. Minutes are published publicly on the community partner's website or physical bulletin board within 14 days of each meeting.

### 8.3 Impact Reporting

The operator provides a public annual impact report for each deployed node. The report is written for a general community audience — no technical jargon, clear metrics, honest assessment of what worked and what didn't.

**Annual impact report required contents:**

| Section | Contents |
|---------|---------|
| Community compute delivered | PFLOPS-hours utilized, by service category; comparison to prior year |
| Clean water delivered | Gallons, by month; water quality compliance record; any shutoff events and cause |
| Community art | Current mural, artist biography, design story |
| Energy | Solar generation, community allocation energy use, grid export (if applicable) |
| Economic activity | Local jobs supported, training completions, estimated business value generated |
| Advisory board activity | Meetings held, decisions made, community concerns addressed |
| Outlook | Planned changes, upcoming hardware cycles, any community-requested improvements |

The report is delivered in print to the library and school, published on the community partner's digital channels, and submitted to the relevant county or tribal government office.

---

## 9. Economic Impact: Jobs, Training, and Digital Equity

### 9.1 Local Jobs for Maintenance

Each OCN deployment creates ongoing local employment. The maintenance model is designed to maximize local hiring rather than dispatching technicians from a central facility.

| Role | Hours/Month | Local Hiring? | Qualifications |
|------|------------|--------------|----------------|
| Monthly maintenance technician | ~4–8 hours/month (site visit) | Preferred; training provided | Training program completion (see 9.2); valid driver's license |
| Water quality monitoring assistant | ~2 hours/month | Preferred | Basic water quality test training (40 hours) |
| Advisory board coordinator | ~4 hours/month | Required | Community member; no technical requirement |
| Network support (community terminals) | ~2–4 hours/month | Preferred | CompTIA Network+ or equivalent |

For a single node: 3–5 local part-time positions, totaling approximately 12–20 hours per month. At $20–$30/hour (appropriate for technical work in Southwest rural communities), this represents $2,880–$7,200 per month in local wages — $34,560–$86,400 annually per node.

For 10 deployed nodes across the Southwest corridor: $345,600–$864,000 in annual local wages. These are not construction jobs that end when the container is installed. They are ongoing maintenance and coordination roles for the life of the node.

### 9.2 Training Programs

The OCN operator is required by the MOU to offer a training program for local maintenance technicians. The training program is developed in partnership with a local community college or vocational training provider where one exists within 50 miles of the deployment site.

**Core Maintenance Technician Training Curriculum (80 hours):**

| Module | Hours | Content |
|--------|-------|---------|
| Data center fundamentals | 16 hours | Power systems, cooling concepts, rack safety |
| Water systems operation | 16 hours | Filtration stages, quality testing, waste drum handling (DOT 49 CFR) |
| Network fundamentals | 16 hours | VLAN concepts, cable management, basic troubleshooting |
| Safety and emergency procedures | 16 hours | Electrical safety, fire suppression, emergency shutdown |
| Practical skills assessment | 16 hours | Supervised site visit; competency demonstration |

Graduates receive a completion certificate recognized by the OCN operator network. The curriculum is published openly (CC BY-SA 4.0) and is designed to be adoptable by any community college.

**Pathway to broader certification:** The training program is designed to credit toward CompTIA A+, Network+, and Server+ certifications. Students who complete the OCN maintenance program have covered significant portions of the CompTIA A+ objectives for hardware and networking — a credential recognized industry-wide.

### 9.3 Digital Equity Metrics

Digital equity is difficult to measure with a single metric. The OCN tracks a battery of indicators that together describe whether the community's access to digital tools is actually improving:

| Metric | Measurement Method | Target |
|--------|------------------|--------|
| Community compute access hours | Dashboard (aggregate) | >100 hours/month utilized |
| New digital skills training completions | Partner institution records | Positive trend year-over-year |
| Library terminal usage | Library transaction records | Positive trend year-over-year |
| Student projects submitted using OCN compute | School district records | Increase after deployment |
| Small business AI tool adoption | Advisory board survey | Tracked qualitatively |
| Local government digital services hosted | Count of hosted services | Positive trend |
| Reported barriers to access | Advisory board surveys | Decreasing trend |

These metrics are reported in the annual impact report. They are also submitted to the USDA Rural Development office, the Institute of Museum and Library Services, and any state broadband office in the deployment state — providing data for federal digital equity reporting and potentially supporting future federal funding.

---

## 10. Comparison to Existing Community Compute Programs

### 10.1 NYC LinkNYC

LinkNYC replaced New York City's payphone infrastructure with 1,800+ "Link" kiosks across the five boroughs, providing free gigabit Wi-Fi, free phone calls, device charging, and a public information display. The program is operated by Intersection (a subsidiary of Alphabet) under a franchise agreement with the city.

| Dimension | NYC LinkNYC | Open Compute Node |
|-----------|------------|------------------|
| Scale | 1,800 kiosks; metropolitan | 1 container per community; rural/small town |
| Compute access | Wi-Fi only; no compute | Full GPU compute allocation |
| Data privacy | Kiosk interaction data collected; facial detection capability raised concerns | No PII collection; no session logging |
| Funding model | Advertising revenue from kiosk displays; city received $12.4M in first 5 years | Operator commercial compute revenue; community access free in perpetuity per MOU |
| Community control | City agency oversight; minimal community governance | Community advisory board with decision authority |
| Environmental return | None | Clean water + solar excess |
| Geographic reach | Urban; high-density | Rural; underserved regions |
| Art program | Kiosk design uniform; no local art | Community-designed mural per deployment |

**Key lesson from LinkNYC:** The advertising-based funding model created inherent tension between community service and data monetization. The OCN avoids this by funding community returns from commercial compute revenue — the community's return is not contingent on their willingness to be advertised to.

### 10.2 Detroit Community Networks

Detroit has been a test case for community-owned broadband infrastructure, driven by the Equitable Internet Initiative (EII) and Detroit Digital Justice Coalition. The EII's approach — community ownership, neighborhood-level administration, digital skills training embedded in access programs — provides important precedents for OCN community governance.

| Dimension | Detroit Community Networks | Open Compute Node |
|-----------|--------------------------|------------------|
| Governance | Community-owned cooperative model | Community advisory board; operator retains ownership |
| Technical model | Wireless mesh networks; citizen-operated nodes | Container compute with community allocation |
| Scale | Neighborhood-level; hundreds of households | Community-level; thousands of residents |
| Sustainability | Grant-dependent; ongoing fundraising pressure | Operator commercial revenue; community access zero-cost by design |
| Training | Digital literacy embedded in program | Maintenance training + digital skills through compute access |
| Broadband vs. compute | Broadband access (connection) | Compute access + broadband via fiber to partner |

**Key lesson from Detroit:** The cooperative ownership model creates the strongest possible community alignment but also the highest sustainability risk (grant dependency). The OCN's model — operator ownership + enforceable community allocation — trades some governance purity for long-term sustainability. The MOU's minimum 10% hard partition provides community protection without requiring community ownership of infrastructure they may not have capacity to maintain.

### 10.3 Tribal Broadband Initiatives

Tribal nations in the Southwest face the most severe digital equity gaps in the United States. The FCC's 2022 Broadband Progress Report found that 25% of people on tribal lands lack access to fixed broadband, compared to 4% of urban Americans. Several tribal nations have pursued their own broadband infrastructure — the Navajo Nation's fiber network, the Cheyenne River Sioux Tribe's community broadband initiative, the Mashpee Wampanoag Tribe's project — with varying degrees of success.

| Dimension | Tribal Broadband Initiatives | Open Compute Node (tribal deployment) |
|-----------|-----------------------------|---------------------------------|
| Sovereignty | Tribal-owned and operated | Operator-owned; advisory board includes tribal representation; MOU governed by tribal law if on tribal land |
| Funding | USDA ReConnect, FCC BEAD, tribal government funds | Operator capital + commercial revenue |
| Infrastructure | Fiber, tower, and wireless on tribal rights-of-way | Container + solar on tribal land (with tribal land access agreement) |
| Compute | Broadband access to cloud services | On-premise GPU compute; data stays on tribal land |
| Data sovereignty | Data transmitted to cloud providers off tribal land | Workloads run locally; no data leaves tribal land for compute purposes |
| Cultural content | Varies | Mural program can celebrate tribal language, artwork, history |

**The data sovereignty dimension is particularly significant for tribal deployments.** The OCN's on-premise compute model means that a tribal nation running language preservation software, cultural archive systems, or natural resource management tools does so without their data transiting to AWS, Azure, or GCP infrastructure. For nations with active data sovereignty policies — and many do — this is the difference between a usable and an unusable system.

**Key lesson from tribal broadband:** Regulatory complexity (tribal land, BIA oversight, state vs. tribal jurisdiction) makes deployment more complex in tribal contexts, but the need is greatest there. OCN deployments on or near tribal land should involve tribal counsel from the earliest stages of consultation, and MOU terms should be reviewed by tribal legal staff to ensure compliance with tribal law and sovereignty protections.

---

## 11. What Makes This Different

The community programs described in Section 10 — LinkNYC, Detroit community networks, tribal broadband — each represent genuine attempts to bring digital infrastructure to underserved communities. Each has made real contributions. Each also illustrates the limits of approaches that are either too dependent on advertising revenue (LinkNYC), too grant-dependent for sustainability (Detroit), or too narrowly scoped to broadband access without compute (all three).

The Open Compute Node is different on several dimensions simultaneously:

**It is self-sustaining.** The commercial compute revenue funds the operations. The community returns are structured as a hard allocation, not a charitable contribution from surplus. There is no grant dependency, no advertising model, no municipal budget line. The community's 10% allocation exists as long as the node operates — which is 20+ years.

**It provides actual compute, not just connectivity.** Connectivity without compute is a window. You can see what exists but cannot interact with it at the level of creation. A community with gigabit broadband but no local GPU compute can access Netflix faster — but still cannot train a model, run a climate simulation, or process a year's worth of agricultural sensor data without paying for cloud compute they likely cannot afford. The OCN provides the compute, not just the pipe.

**It returns physical environmental benefits.** No other community compute program returns clean water. The water return is not a feature of the compute infrastructure — it is a consequence of doing the cooling system right. The cooling loop needs water; the community needs clean water; the filtration system bridges the two. Infrastructure that cleans water as a side effect of its primary function is genuinely novel. Data centers have been consuming water for cooling for fifty years. This one produces it.

**It carries the community's art.** The mural program sounds like a small thing. It is not. The first visual impression of infrastructure shapes how communities relate to it for its entire lifetime. A container that arrives already wearing the community's own art — designed by children who will grow up in its presence, voted on by the community at large — begins its life as a community asset. That is the right starting point for infrastructure that will be in service for twenty years.

**The community dimension is the design constraint.** In every other modular data center or community technology program, community benefit is a secondary consideration that gets added after the primary technical and financial design is complete. In the OCN, the community allocation, the water return, and the art program are in the specification from line one. They constrain the design. They are success criteria. A node that doesn't give back is a failed deployment.

That is the through-line: this is not a data center with a community program attached. It is community infrastructure that happens to do compute.

---

## 12. Cross-References

| Project | Connection |
|---------|------------|
| [OCN Module 01](01-vision-architecture.md) | Vision and architecture that establish the community return as a design requirement |
| [OCN Module 03](03-deployment-logistics.md) | Site selection process that identifies community partners before deployment |
| [OCN Module 04](04-compute-systems.md) | Network architecture and vGPU partitioning that enforce the 10% community allocation |
| [OCN Module 05](05-community-integration.md) | Component specification for community compute and mural art program |
| [OCN Module 03 — Cooling/Water](03-cooling-water-systems.md) | Water filtration specification that delivers the clean water return |
| [NND](../NND/index.html) | New New Deal: rail corridor deployment as economic development infrastructure |
| [BRC](../BRC/index.html) | Community gift economy — the free compute model echoes gifting culture principles |
| [SYS](../SYS/index.html) | Systems administration for community compute services and monitoring dashboard |

---

## 13. Sources

1. EPA 40 CFR Part 141 — National Primary Drinking Water Regulations (EPA Office of Water, 2023)
2. FCC Broadband Progress Report 2022 — Status of broadband deployment on tribal lands and rural areas
3. American Library Association — Digital Equity in Rural Library Services Survey 2023
4. USDA Rural Development — ReConnect Program: rural broadband and digital equity investment reports
5. Institute of Museum and Library Services — Public Libraries Survey (2022 edition)
6. NTIA — Digital Equity Act Programs and State Digital Equity Plans (2023)
7. NYC Department of Information Technology and Telecommunications — LinkNYC Program Franchise Agreement and Annual Report
8. Equitable Internet Initiative (Detroit Digital Justice Coalition) — Community Network Operations and Impact Reports
9. Navajo Nation Division of Transportation — Tribal Broadband Infrastructure Program documentation
10. NREL — Annual Technology Baseline (ATB) 2024: Solar PV capacity factors and LCOE
11. EPA eGRID 2023 — National and regional electricity generation emissions factors
12. EPRI / AWWA — Water and Wastewater Energy Management: Best Practices Handbook (2017 update)
13. NVIDIA Corporation — Multi-Instance GPU (MIG) User Guide for H100 and Hopper-generation GPUs
14. SSPC (Society for Protective Coatings) — SSPC-SP 5: White Metal Blast Cleaning surface preparation standard
15. Sherwin-Williams Industrial Coatings — Macropoxy 646 and Tile-Clad HS technical data sheets
16. PPG Aerospace / PPG Protective & Marine Coatings — Deltron DC5000 clear coat technical data sheet
17. USDA National Agricultural Statistics Service — Irrigation Water Use Survey (2023)
18. USDA NASS / USDA AMS — Agricultural data portals for crop management and market analysis
19. CompTIA — A+, Network+, and Server+ certification objectives (2024 objectives)
20. DOE / LBNL — United States Data Center Energy Usage Report (Shehabi et al., 2016; updated 2024)
21. SBA (Small Business Administration) — Rural Business Development Grant Program and digital equity resources
22. Tribal Broadband Connectivity Program — USDA and FCC tribal broadband deployment documentation

---

> **PROFESSIONAL ENGINEER REVIEW REQUIRED**
> This specification is a conceptual design produced by AI-assisted engineering analysis. It has NOT been reviewed or stamped by a licensed Professional Engineer (PE). Water treatment systems described in this module must be reviewed and certified by the applicable state drinking water program and a PE licensed in water treatment before any community distribution. Community network deployments must comply with local telecommunications regulations. Economic projections are estimates and should not be relied upon as financial advice. The authors assume no liability for use of this specification without proper professional review.
