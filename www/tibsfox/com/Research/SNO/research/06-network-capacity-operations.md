# Module 6: Network Capacity Operations

## Overview

Network capacity operations is the discipline of measuring what you have, predicting when you will run out, and ensuring the replacement arrives before you do. It is not glamorous work. It does not produce the dopamine hit of deploying a new architecture or the urgency of incident response. But it is the work that determines whether the network can absorb the next wave of growth or whether it hits a cliff -- a sudden, catastrophic point where utilization exceeds capacity and everything degrades simultaneously. The organizations that treat capacity operations as a continuous, data-driven practice are the ones that never appear in outage postmortems with "unexpected traffic growth" listed as root cause.

The scope of capacity operations extends well beyond watching utilization graphs. It encompasses the financial mechanics of bandwidth billing, the logistics of circuit procurement, the politics of carrier relationships, the economics of peering and transit, and the forecasting models that translate historical trends into purchase orders. A network engineer who understands BGP but not 95th percentile billing will configure technically excellent peering sessions that cost three times what they should. An architect who designs a beautiful spine-leaf fabric but does not understand optics upgrade paths will discover that the next speed tier requires a forklift replacement of every switch. Capacity operations bridges the gap between network engineering and network economics.

This module covers the full lifecycle: measuring current capacity, planning upgrades, procuring circuits, managing carrier relationships, optimizing costs through peering and transit strategy, extending effective capacity through WAN optimization, and building the forecasting models that tie it all together. The thread connecting every section is that capacity is not a number -- it is a rate of change, and the job is to stay ahead of it.

---

## 1. Bandwidth Utilization Tracking

### 1.1 The 95th Percentile: How Networks Are Actually Billed

The 95th percentile billing method is the dominant model for transit and colocation bandwidth charges worldwide. Understanding its mechanics is not optional -- it directly determines what you pay and what optimization strategies are effective.

**How the calculation works:** The provider samples interface utilization every 5 minutes over a billing period (typically one calendar month). A 30-day month produces approximately 8,640 samples. These samples are sorted from highest to lowest. The top 5% (approximately 432 samples, representing roughly 36 hours of a 30-day month) are discarded. The next highest remaining sample becomes the billable rate in Mbps.

**What this means operationally:** You can sustain bursts above your committed rate for up to 36 hours per month without penalty. This accommodates legitimate traffic spikes -- software releases, viral content events, seasonal peaks. But it also means that sustained high utilization for more than 36 hours will shift your billing rate upward, sometimes dramatically.

**The sampling trap:** Because samples are taken at 5-minute intervals, a 4-minute burst that happens to span a sampling boundary may be captured at full intensity, while a 4-minute burst that falls entirely within one interval is averaged with the lower-traffic portions of that interval. This is not something to optimize around -- attempting to shape traffic to avoid sampling windows (sometimes called "95th percentile gaming") is a violation of most carrier agreements and will get your service terminated.

| Billing Model | How It Works | Best For | Risk |
|---------------|-------------|----------|------|
| 95th percentile (burstable) | Top 5% of samples discarded, billed on next highest | Variable traffic with legitimate spikes | Sustained growth silently increases bill |
| Committed rate (flat) | Fixed price for fixed bandwidth ceiling | Predictable, consistent utilization | Wasted money if utilization is low |
| Hybrid (commit + burst) | Base commit rate + overage charges above threshold | Known baseline with occasional spikes | Overage pricing often punitive |
| Per-GB transfer | Billed on total data transferred | Low-volume, bursty workloads (cloud egress) | Expensive at scale, unpredictable bills |

### 1.2 Utilization Trending and Interface Saturation

Raw utilization numbers are snapshots. Trends are what drive capacity decisions. The standard approach uses SNMP polling (or streaming telemetry via gNMI for modern platforms) to collect interface counters at regular intervals, then derives utilization as a percentage of interface speed.

**Alert thresholds for interface utilization:**

| Threshold | Meaning | Action |
|-----------|---------|--------|
| 50% sustained | Planning threshold | Begin evaluating upgrade options |
| 70% sustained | Warning threshold | Initiate procurement process |
| 80% sustained | Critical threshold | Escalate to management, expedite upgrade |
| 90%+ sustained | Emergency | Traffic engineering mitigation, emergency circuit order |

These thresholds are not arbitrary. TCP throughput degrades non-linearly as link utilization increases because queuing delay increases exponentially near saturation. A link at 85% utilization does not have 15% headroom -- it has latency characteristics that may make it effectively unusable for latency-sensitive applications.

**What to measure:**

- **Per-interface utilization** in both directions (inbound and outbound are often asymmetric)
- **Per-VLAN or per-class utilization** where QoS is applied (aggregate may hide per-class saturation)
- **Error counters** (CRC errors, input errors, output drops) which increase before saturation is visible in utilization
- **Queue depths** on interfaces with QoS policies (queue drops indicate class-level saturation even when aggregate utilization appears acceptable)

### 1.3 Growth Projection Models

Capacity planning requires forecasting, and forecasting requires historical data and a model. The three standard approaches, in order of increasing sophistication:

**Linear extrapolation:** Plot utilization over time, fit a line, extend it forward. Simple, surprisingly effective for steady-state growth, and the right starting point. The weakness is that it assumes constant growth rate, which fails during business events (acquisition, product launch, migration).

**Exponential / compound growth:** Model utilization as growing at a constant percentage rate. More realistic for networks experiencing organic growth, where each month's traffic increase is proportional to the current traffic level. Internet traffic has historically grown at 25-30% annually for backbone networks, though individual enterprise circuits vary widely.

**Seasonal decomposition:** Separate the time series into trend, seasonal, and residual components. Essential for retail (holiday spikes), education (semester cycles), media (event-driven), and any organization with predictable periodic peaks. The trend component drives long-term planning; the seasonal component determines whether you need temporary burst capacity.

**Capacity cliff detection:** A capacity cliff occurs when an interface or circuit reaches its maximum speed and no incremental upgrade is available -- only a forklift replacement. The classic example: a 1G uplink that is approaching saturation cannot be upgraded to 1.5G. The next step is 10G, which requires different optics, possibly different cabling, and potentially a different switch. Capacity cliffs must be identified 6-12 months in advance because the procurement cycle for the replacement exceeds the time between "this is getting tight" and "this is saturated."

---

## 2. Upgrade Planning

### 2.1 Forklift Upgrade vs Incremental

The fundamental upgrade decision is whether to replace infrastructure entirely (forklift) or extend it incrementally (optics swap, line card addition, licensing upgrade).

| Factor | Forklift | Incremental |
|--------|----------|-------------|
| Capital cost | High (full hardware replacement) | Low to moderate (optics, line cards) |
| Disruption | Major (maintenance window, migration) | Minimal (hot-swap where supported) |
| Speed tier jump | Multiple generations (1G to 100G) | Single generation (10G to 25G) |
| Cabling impact | May require new fiber plant | Uses existing infrastructure |
| Operational complexity | High (new OS, new features, new bugs) | Low (same platform, known behavior) |
| When to choose | End-of-life, architecture change, 2+ speed tiers | Mid-lifecycle, single speed tier jump |

**The economic inflection point:** When the cost of maintaining and patching aging hardware exceeds 40-60% of the replacement cost annually, forklift replacement becomes cheaper even ignoring capability gains. This typically occurs at year 5-7 for enterprise switches and year 7-10 for core routers.

### 2.2 Optics Upgrade Path

The Ethernet speed roadmap defines the upgrade path for every network operator. Understanding it prevents architectural dead ends.

| Speed | Standard | Typical Optics | Reach (SMF) | Typical Deployment |
|-------|----------|-----------------|-------------|-------------------|
| 1 GbE | 802.3z | SFP (1000BASE-LX) | 10 km | Access layer, legacy |
| 10 GbE | 802.3ae | SFP+ (10GBASE-LR) | 10 km | Server uplinks, access aggregation |
| 25 GbE | 802.3by | SFP28 (25GBASE-LR) | 10 km | Server NICs, leaf-to-server |
| 40 GbE | 802.3ba | QSFP+ (40GBASE-LR4) | 10 km | Legacy spine links (being skipped) |
| 100 GbE | 802.3ck | QSFP28 (100GBASE-LR4) | 10 km | Spine-leaf uplinks, WAN |
| 400 GbE | 802.3bs | QSFP-DD / OSFP | 10 km | Spine, DCI, hyperscale leaf |
| 800 GbE | 802.3df | OSFP (8x100G) | 2-10 km | Hyperscale spine, AI fabric (2025-2026) |

**Critical planning notes for 2025-2026:**

- **800G is the current frontier.** Volume deployment in hyperscale and neocloud environments is occurring now. Enterprise adoption is expected in 2027-2029 as costs normalize. Power consumption per module (14-20W) introduces new cooling and power budget constraints.
- **The 40G dead end.** 40 GbE was widely deployed but is now a stranded speed tier. The industry effectively skipped from 10G to 25G at the server edge and from 40G to 100G at the spine. Networks with heavy 40G investment face a forklift to reach 100G+.
- **Breakout cables are a bridging strategy.** A 100G QSFP28 port can be broken out to 4x25G using a breakout cable. A 400G QSFP-DD port can break out to 4x100G. This allows a higher-speed switch to connect to lower-speed endpoints without wasting ports, buying time during migration.
- **Fiber plant matters.** Single-mode fiber (SMF) installed for 1G will carry 400G. The fiber is the long-lived asset; the optics are the consumable. Organizations that installed multimode fiber (MMF) for short-reach 10G are hitting distance and speed ceilings and may need to recable -- the most disruptive and expensive upgrade possible.
- **1.6T and beyond.** The 1.6 Tbps optical module generation enters early deployment in 2026 for hyperscale AI fabric interconnects. Enterprise relevance is 2028+ at earliest.

### 2.3 Switch Lifecycle Planning

Network switches have a predictable lifecycle driven by vendor support milestones and technology evolution.

| Phase | Typical Timeline | Characteristics |
|-------|-----------------|-----------------|
| General Availability | Years 0-3 | Full vendor support, active feature development, security patches |
| End of Sale (EoS) | Year 3-5 | No new purchases, existing support continues, feature freeze |
| End of Software Maintenance | Year 5-7 | No new software releases, critical security patches only |
| End of Life (EoL) | Year 7-10 | No support of any kind, no patches, no RMA |
| Extended support (3rd party) | Year 7+ | Third-party maintenance available, no software updates |

**Planning rule:** Begin replacement planning at End of Sale, complete replacement before End of Software Maintenance. Running network equipment past End of Software Maintenance means running unpatched firmware with known vulnerabilities -- this is the network equivalent of running Windows XP on the internet.

---

## 3. Circuit Ordering and Provisioning

### 3.1 Lead Times by Circuit Type

The single most common capacity planning failure is underestimating provisioning lead times. A circuit that takes 90 days to deliver must be ordered 90 days before it is needed -- which means the capacity forecast must be accurate 90 days out plus whatever time the procurement and approval process requires internally.

| Circuit Type | Typical Lead Time | Factors That Extend It |
|-------------|-------------------|----------------------|
| Cross-connect (within colo) | 2-14 days | Colo provider backlog, fiber availability, LOA processing |
| Metro Ethernet (lit service) | 30-60 days | Last-mile construction, building access, permits |
| MPLS circuit | 30-90 days | Multi-site coordination, CPE delivery, carrier engineering |
| Wavelength / DWDM | 45-90 days | Spectrum availability, amplifier placement, path engineering |
| Dark fiber (metro) | 90-180 days | Route construction, permitting, splice scheduling |
| Dark fiber (long-haul) | 6-18 months | Right-of-way acquisition, construction, environmental review |
| Submarine cable (new build) | 3-5 years | Manufacturing, permitting, ship scheduling, landing stations |

**The cross-connect paradox:** Cross-connects are the simplest circuit type -- just a patch cable between two cages or cabinets in the same facility. Yet they routinely take 5-10 business days because colocation providers batch work orders, require Letters of Authorization (LOA) from both parties, and may have limited technician availability. Never assume a cross-connect is instant.

### 3.2 The Carrier Provisioning Process

Understanding the carrier's internal process explains why circuits take as long as they do and where to apply pressure.

1. **Order submission and validation** (1-3 days): The carrier verifies the order, checks address serviceability, and confirms pricing.
2. **Site survey** (5-15 days): For circuits requiring new construction or building entry. The carrier dispatches a technician to verify the physical path.
3. **Engineering and design** (5-20 days): The carrier's network engineering team designs the circuit path, assigns equipment and ports, and generates a work order.
4. **Construction / installation** (10-90 days): Physical work -- pulling fiber, installing equipment, splicing, testing. This is the longest and most variable phase.
5. **Testing and turn-up** (2-5 days): End-to-end testing, light-level verification, throughput testing, handoff to the customer.
6. **Customer acceptance** (1-3 days): The customer verifies the circuit meets specifications and signs the acceptance form, starting the billing clock.

**Expedite levers:** Carrier project managers respond to escalation, but the most effective lever is pre-positioning. Establish relationships with carrier sales engineers before you need circuits. Maintain a standing forecast of upcoming needs. Carriers will pre-engineer circuits for known future orders, collapsing the engineering phase.

---

## 4. ISP and Carrier Relationship Management

### 4.1 Multi-Carrier Strategy

Single-carrier dependency is a single point of failure at the organizational level. The standard practice is to maintain relationships with at least two transit providers and, where geography permits, ensure physical path diversity.

**Carrier diversity checklist:**

- **Different upstream providers.** Two carriers that both buy transit from the same Tier 1 provider are not diverse at the BGP level.
- **Different physical paths.** Two circuits entering the same building through the same conduit fail together when a backhoe hits that conduit.
- **Different last-mile technologies.** Fiber from one carrier, fixed wireless from another provides technology diversity in addition to path diversity.
- **Different contract terms.** Stagger contract end dates so you are never negotiating both circuits simultaneously from a position of dependency.

### 4.2 SLA Negotiation

Carrier SLAs are not marketing documents -- they are the contractual basis for service credits when the carrier fails. Negotiating them effectively requires understanding what the standard terms actually mean.

| SLA Component | Typical Standard | What to Negotiate For |
|---------------|-----------------|----------------------|
| Availability | 99.9% (8.76 hours downtime/year) | 99.99% for critical circuits (52.6 minutes/year) |
| Latency | "Best effort" or vague range | Specific RTT ceiling with measurement methodology |
| Packet loss | < 0.1% monthly average | < 0.01% with 5-minute measurement granularity |
| Jitter | Often absent | Specific ceiling for voice/video circuits |
| Mean Time to Repair (MTTR) | 4 hours | 2 hours for critical, with escalation timeline |
| Credit mechanism | Pro-rated monthly credit | Automatic credit, no claim required |
| Measurement | Carrier's own tools | Independent third-party measurement or customer-side |

**The credit trap:** Most carrier SLA credits cap at one month's recurring charge for the affected circuit. If a 4-hour outage costs your business $500,000 in lost revenue but the circuit costs $2,000/month, the maximum SLA credit is $2,000. SLA credits are not insurance. They are a financial incentive for the carrier to maintain service quality, not compensation for business losses.

### 4.3 Bill Auditing

Carrier billing errors are endemic. Studies consistently find that 7-12% of telecom invoices contain errors, almost always in the carrier's favor. A disciplined bill auditing practice recovers real money.

**Common billing errors:**

- Circuits that were disconnected but still being billed
- Incorrect circuit speed (billing for 10G when delivering 1G)
- Taxes applied to interstate circuits that should be tax-exempt
- Promotional pricing that reverted to list price without notice
- Duplicate charges for the same circuit under different identifiers

**Auditing practice:** Maintain an independent circuit inventory (in a CMDB or spreadsheet) with contract terms, committed rates, and billing details. Reconcile every invoice against this inventory monthly. Flag discrepancies immediately -- carriers have statute-of-limitations windows (typically 60-90 days) after which they will not issue retroactive credits.

---

## 5. Peering Operations

### 5.1 Internet Exchange Membership

An Internet Exchange Point (IXP or IX) is a physical location where networks interconnect to exchange traffic directly, bypassing transit providers. Joining an IX reduces transit costs, improves latency (shorter path), and increases resilience (more paths to destinations).

**The economics:** Transit costs $0.20-$2.00 per Mbps/month depending on volume and market. IX membership costs $500-$5,000/month for a port plus a one-time setup fee. If you exchange more than a few hundred Mbps with networks present at the IX, peering is cheaper than transit. For networks exchanging tens of gigabits, the savings are substantial -- often 50-80% reduction in transit spend for the peered traffic.

**Major IX points by region:**

| Region | Major IXPs | Participants | Peak Traffic |
|--------|-----------|--------------|-------------|
| Europe | DE-CIX Frankfurt, AMS-IX, LINX | 1,000+ / 900+ / 950+ | 14+ Tbps / 12+ Tbps / 8+ Tbps |
| North America | Equinix IX, SIX (Seattle), NYIIX | 300+ / 300+ / 200+ | Varies by location |
| Asia-Pacific | JPNAP, HKIX, Equinix IX Singapore | 200+ / 300+ / 200+ | Growing rapidly |

### 5.2 Bilateral vs Multilateral Peering

**Bilateral peering** is a direct BGP session between two networks. Each pair of networks establishes a separate session, negotiates terms individually, and manages the session independently. This gives maximum control -- you decide exactly who you peer with and can apply per-peer traffic engineering.

**Multilateral peering** uses an IX route server. Participants establish a single BGP session with the route server, which redistributes routes from all other participants who also peer with the route server. This dramatically reduces operational overhead -- one session instead of hundreds -- at the cost of granular control.

| Property | Bilateral | Multilateral (Route Server) |
|----------|-----------|----------------------------|
| BGP sessions to manage | One per peer (N sessions) | One per route server (typically 2) |
| Setup effort | Individual negotiation per peer | Single IX membership agreement |
| Traffic control | Full per-peer policy | Limited (community-based filtering) |
| Visibility | Full per-peer monitoring | Aggregated through route server |
| Best for | Large networks with specific peering requirements | Small/medium networks maximizing peer count |

**PeeringDB:** The global database where networks publish their peering information -- locations, traffic volumes, peering policy, technical contacts. Before requesting peering with any network, check PeeringDB first. It is the standard reference used by every peering coordinator in the industry.

### 5.3 Peering Policy Types

| Policy | Description | Typical Networks |
|--------|------------|-----------------|
| Open | Will peer with anyone who requests it, no prerequisites | Content networks, CDNs, smaller ISPs seeking reach |
| Selective | Will peer, but requires meeting specific criteria (minimum traffic, multiple locations, 24/7 NOC) | Mid-size transit providers, regional ISPs |
| Restrictive | Rarely peers; transit is the default relationship. Peering is the exception. | Tier 1 transit providers protecting transit revenue |

**Route server participation:** Most IX operators run route servers. Participating is nearly always beneficial for networks with an open or selective peering policy. The only reason to avoid route server participation is if you need strict control over which networks receive your routes -- and even then, route server communities allow per-peer filtering that provides adequate control for most use cases.

---

## 6. Transit Cost Optimization

### 6.1 Commit Levels and Pricing

Transit pricing is volume-based with significant discounts at higher commit levels. The relationship is not linear -- doubling your commit typically reduces per-Mbps cost by 20-30%.

| Commit Level | Approximate Cost (2025) | Notes |
|-------------|------------------------|-------|
| 100 Mbps | $1.50-$3.00/Mbps | Small business, low volume |
| 1 Gbps | $0.50-$1.50/Mbps | Mid-market, typical enterprise |
| 10 Gbps | $0.20-$0.80/Mbps | Large enterprise, content provider |
| 100 Gbps | $0.08-$0.30/Mbps | Major content network, hyperscale |

**Commit strategy:** The optimal commit level is the rate you will sustain at least 95% of the time. Under-committing means paying burst rates for predictable traffic. Over-committing means paying for bandwidth you do not use. The sweet spot is a commit at your sustained baseline with burst capacity for peaks -- and the 95th percentile billing model naturally accommodates this if the commit is sized correctly.

### 6.2 CDN Offload

A Content Delivery Network serves cacheable content from edge locations geographically close to end users. From a transit cost perspective, CDN offload moves traffic from expensive transit links to CDN infrastructure that is either cheaper per-bit or included in the CDN contract.

**Impact on transit spend:** If 70% of your outbound traffic is cacheable content (static assets, video, software downloads), CDN offload can reduce your transit bill by 50-70% for that traffic class. The CDN cost is typically lower than the transit cost for the same volume, producing net savings even before accounting for the latency improvement.

**Measuring offload effectiveness:**

- **Cache hit ratio:** Percentage of requests served from CDN cache versus origin. Target > 90% for static content.
- **Origin traffic reduction:** Measure origin server egress before and after CDN deployment. This is the transit savings metric.
- **Cost per GB comparison:** CDN cost per GB served versus transit cost per GB. CDN should be 30-60% cheaper.

### 6.3 Preventing 95th Percentile Abuse

Carriers monitor for traffic patterns that suggest deliberate manipulation of the 95th percentile calculation. Common red flags:

- Traffic that precisely stops just before reaching a threshold for exactly 36 hours per month
- Traffic shaping that creates artificial valleys at sampling boundaries
- Rapidly oscillating traffic patterns that do not correspond to application behavior

This is contract fraud. Do not do it. The legitimate approach to managing your 95th percentile is to understand your traffic patterns, size your commit appropriately, and use CDN offload to reduce origin traffic honestly.

---

## 7. WAN Optimization

### 7.1 SD-WAN Bandwidth Aggregation

SD-WAN aggregates multiple WAN links -- MPLS, broadband, LTE/5G -- into a single logical transport, distributing traffic across all available paths based on application requirements and real-time link quality.

**How aggregation works:** Unlike traditional active/passive WAN designs where the backup link sits idle until failover, SD-WAN actively uses all links simultaneously. A 100 Mbps MPLS circuit plus a 500 Mbps broadband circuit yields up to 600 Mbps aggregate throughput for bulk transfers, with the SD-WAN controller distributing packets or flows across both links.

**Application-aware routing:** The SD-WAN controller classifies traffic by application (via deep packet inspection or DNS-based identification) and routes each application over the link that best meets its requirements:

| Application Type | Requirements | Preferred Path |
|-----------------|-------------|---------------|
| Voice (VoIP, UC) | Low latency, low jitter, low loss | MPLS or best-quality broadband |
| Video conferencing | Moderate latency tolerance, sustained bandwidth | MPLS or broadband with FEC |
| Business SaaS (ERP, CRM) | Reliability, moderate latency tolerance | MPLS with broadband failover |
| Web browsing, email | Tolerant of latency variation | Cheapest available path |
| Bulk transfer (backup, replication) | Throughput, tolerant of latency | Broadband, aggregated across links |

**The SASE convergence:** By 2026, Gartner estimates that 60% of new SD-WAN purchases are part of a single-vendor Secure Access Service Edge (SASE) offering that combines SD-WAN with cloud security (CASB, SWG, ZTNA). This integration simplifies procurement and management but introduces vendor lock-in at the WAN + security layer. Evaluate carefully whether the operational simplicity is worth the dependency.

### 7.2 Last-Mile Quality Management

The last mile -- the connection between the nearest provider point-of-presence and the customer site -- is where most WAN quality problems originate. SD-WAN provides visibility into last-mile quality through continuous measurement of latency, jitter, and packet loss on each link, but it cannot fix a fundamentally degraded last-mile connection. When SD-WAN monitoring reveals persistent last-mile quality issues, the solution is carrier escalation or circuit replacement, not more software.

---

## 8. Capacity Planning Models

### 8.1 The Capacity Planning Cycle

Capacity planning is not a one-time analysis. It is a recurring operational cycle:

1. **Measure** (continuous): Collect utilization data from all interfaces, circuits, and peering sessions.
2. **Analyze** (monthly): Review trends, identify approaching thresholds, flag anomalies.
3. **Forecast** (quarterly): Project utilization forward 6-12 months using trend analysis and business input (planned projects, acquisitions, migrations).
4. **Plan** (quarterly): Identify required upgrades, estimate costs, initiate procurement for items with long lead times.
5. **Execute** (as needed): Deploy upgrades, activate circuits, implement capacity expansions.
6. **Validate** (post-deployment): Confirm that the upgrade resolved the capacity constraint and recalibrate the forecast.

### 8.2 Growth Rate Extrapolation

The simplest and most reliable starting point. Take 12-24 months of historical utilization data, calculate the compound monthly growth rate, and project forward.

**Formula:** If utilization grew from 2 Gbps to 3.5 Gbps over 12 months, the compound monthly growth rate is (3.5/2)^(1/12) - 1 = 4.7% per month. At this rate, utilization will reach 5.25 Gbps in 6 months and 7.9 Gbps in 12 months.

**When it breaks down:** Linear or exponential extrapolation fails when the growth rate itself changes -- during business events (acquisition doubling traffic overnight), technology shifts (migration to cloud increasing WAN traffic while reducing data center traffic), or market changes (competitor failure driving customer influx). The model must be supplemented with business intelligence.

### 8.3 Capacity Cliff Detection

A capacity cliff occurs when the next available speed tier requires infrastructure replacement rather than incremental upgrade. Detecting these cliffs early is critical because the lead time for the replacement exceeds the lead time for incremental upgrades.

**Common capacity cliffs:**

| Current Speed | Next Increment | Cliff? | Why |
|--------------|----------------|--------|-----|
| 1G (SFP) | 10G (SFP+) | Yes | Different optic, possibly different switch |
| 10G (SFP+) | 25G (SFP28) | Mild | Same form factor if switch supports it |
| 25G (SFP28) | 100G (QSFP28) | Yes | Different form factor, different switch port |
| 100G (QSFP28) | 400G (QSFP-DD/OSFP) | Yes | Different form factor, new switch generation |
| LAG (4x10G) | 100G single | Often yes | Different switch, different optics |

**Detection method:** For each interface or circuit, record its maximum speed and the next available speed tier. Calculate the date at which current growth will exhaust the current speed. If the time between "growth hits current maximum" and "today" is less than the procurement lead time for the next tier, you are already behind.

### 8.4 Seasonal Pattern Recognition

Many networks exhibit repeating patterns that must be factored into capacity planning:

- **Retail:** Holiday season (November-December) can produce 3-5x normal traffic. Black Friday / Cyber Monday produce single-day spikes of 10-20x.
- **Education:** Semester start/end produces step-function changes. Summer may be 40-60% of school-year utilization.
- **Media/entertainment:** Major streaming events (live sports, series premieres) produce predictable spikes.
- **Enterprise:** End-of-quarter business processing, monthly batch cycles, annual audit seasons.

**The planning implication:** Size infrastructure for the seasonal peak, not the annual average. A circuit that is 50% utilized on average but 95% utilized during peak season needs an upgrade -- the average is irrelevant.

---

## 9. Upgrade Decision Framework

When utilization triggers a capacity review, the following framework provides a structured decision process.

### 9.1 Decision Matrix

| Scenario | Recommended Approach | Lead Time | Cost Range |
|----------|---------------------|-----------|------------|
| Interface at 70%, same switch supports higher speed | Optics upgrade (e.g., 10G to 25G SFP28) | Days to weeks | $100-$1,000 per optic |
| Interface at 70%, switch does not support higher speed | Switch replacement + optics | 4-12 weeks | $5,000-$50,000 per switch |
| WAN circuit at 70%, same carrier offers upgrade | Circuit upgrade (bandwidth increase) | 2-4 weeks | Incremental MRC increase |
| WAN circuit at 70%, carrier at maximum on path | New circuit from different carrier | 30-90 days | New MRC + NRC |
| Transit at 70%, peering available for major sources | IX membership + peering sessions | 2-6 weeks | $500-$5,000/month port fee |
| Transit costs growing faster than traffic | CDN offload for cacheable content | 1-4 weeks | CDN contract (often cheaper) |
| Multiple branch sites approaching limits simultaneously | SD-WAN with broadband augmentation | 4-8 weeks | SD-WAN licensing + broadband circuits |

### 9.2 The Cost Comparison

| Upgrade Path | CapEx | Monthly OpEx | Effective Cost/Gbps/Month | Disruption |
|-------------|-------|-------------|---------------------------|------------|
| 10G to 25G optics swap | $200-$800 | No change | Negligible (one-time) | Minutes (hot-swap) |
| 1G to 10G switch + optics | $5,000-$15,000 | No change | $50-$150 (amortized over 5 years) | Hours (maintenance window) |
| 10G to 100G spine upgrade | $20,000-$80,000 | No change | $30-$130 (amortized) | Hours per switch |
| New 10G metro Ethernet | $0-$2,000 NRC | $500-$2,000 | $50-$200 | None (new circuit) |
| IX port (10G) + peering | $1,000-$5,000 NRC | $500-$3,000 | $5-$30 (for peered traffic) | None (additive) |
| CDN deployment | $0 (SaaS) | $0.01-$0.05/GB | Varies with volume | None (overlay) |

### 9.3 The Three Questions for Every Capacity Decision

1. **What is the lead time?** If the procurement and deployment timeline exceeds the time until saturation, the decision is already late. This is the first question because it determines urgency.

2. **What is the cliff?** Is this an incremental upgrade (optics swap, bandwidth increase) or a forklift (switch replacement, new carrier, fiber plant rebuild)? Cliffs require earlier action and larger budgets.

3. **What is the growth trajectory after this upgrade?** An upgrade that buys 6 months of headroom is a band-aid. An upgrade that buys 3-5 years of headroom is a strategic investment. Always calculate when the upgraded capacity will itself be exhausted, and compare the per-year cost of the short-term fix versus the long-term investment.

---

## Sources and References

- Auvik, "95th Percentile Bandwidth Metering Explained"
- Noction, "95th Percentile and Other Bandwidth Metering Methods"
- Stackscale, "What's the 95th Percentile Billing Method?"
- Wikipedia, "Burstable Billing"
- Ethernet Alliance, "2025 Ethernet Roadmap" and "2026 Ethernet Roadmap"
- Vitex, "400G to 800G: The Ultimate Data Center Migration Guide"
- Network-Switch.com, "400G vs 800G Ethernet in 2026: Data Center Trends & Upgrade Roadmap"
- Introl, "Fiber Optics for Data Centers: State of the Art in 2025"
- Enterprise Storage Forum, "Forklift vs. Incremental Upgrade -- Weighing All the Factors"
- Evernex, "Life Cycle of a Cisco Switch: Guide and Upgrade Tips"
- FS.com, "Upgrading Data Center Networks: When to Upgrade from 100G to 400G/800G Switches"
- Lightyear, "WAN Connectivity Pricing Guide: P2P, MPLS, Dark Fiber and More"
- Lightyear, "MPLS vs Dark Fiber: Enterprise Network Solutions"
- PeeringDB (https://www.peeringdb.com)
- Megaport, "Bilateral and Multilateral Peering: What's the Difference?"
- Peering Toolbox, "Peering Policies"
- Dr. Peering, "Internet Service Providers and Peering: Peering Policy"
- WeHaveServers, "Bandwidth Commit vs Burstable Billing: How to Save Money"
- IO River, "What Is CDN Offload? Limits and Cost Optimization"
- Jimber, "SD-WAN Explained: The Complete Guide for 2026"
- SageNet, "How SD-WAN Improves Network Performance"
- Coeos Solutions, "How SD-WAN Helps with Bandwidth Aggregation"
- PAESSLER (PRTG), "Network Capacity Planning Guide: Essential Tools and Monitoring Strategies"
- Meter, "Network Capacity Planning: 7 Best Practices to Follow"
- Microsoft Azure Well-Architected Framework, "Architecture Strategies for Capacity Planning"
