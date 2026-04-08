# Network Reliability & Disaster Recovery

> **Domain:** Systems Network Engineering
> **Module:** 10 -- Keeping Packets Flowing When Everything Fails
> **Through-line:** *A network is only as reliable as the assumptions you failed to test. Every cable can be cut, every switch can crash, every BGP session can flap. Network reliability engineering is not about preventing failure -- that is impossible. It is about designing systems where failure is contained, detected in milliseconds, and recovered from before users notice. The five-nines target of 99.999% availability permits 5 minutes and 15 seconds of downtime per year. Achieving that number requires redundancy at every layer (device, link, path, site), sub-second failure detection through BFD, pre-computed repair paths, and a testing culture that pulls cables on purpose.*

---

## Table of Contents

1. [Redundancy Design Principles](#1-redundancy-design-principles)
2. [The Availability Nines Table](#2-the-availability-nines-table)
3. [Convergence Time Engineering](#3-convergence-time-engineering)
4. [BFD -- Bidirectional Forwarding Detection](#4-bfd----bidirectional-forwarding-detection)
5. [Graceful Restart and Non-Stop Forwarding](#5-graceful-restart-and-non-stop-forwarding)
6. [Network DR Testing](#6-network-dr-testing)
7. [Submarine Cable Resilience](#7-submarine-cable-resilience)
8. [MTTR and Spare Parts Strategy](#8-mttr-and-spare-parts-strategy)
9. [Network Redundancy Anti-Patterns](#9-network-redundancy-anti-patterns)
10. [Real-World Architectures](#10-real-world-architectures)
11. [Availability Calculations and Design Patterns](#11-availability-calculations-and-design-patterns)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Redundancy Design Principles

Network redundancy operates at four distinct layers. Designing for only one while neglecting the others creates an illusion of reliability that collapses under real-world failure conditions.

### 1.1 The Four Redundancy Layers

| Layer | Protects Against | Example | Failure Mode Without It |
|-------|------------------|---------|------------------------|
| **Device** | Hardware failure (PSU, supervisor, line card) | Dual supervisors, stacked switches, redundant PSU | Single switch failure takes down a floor |
| **Link** | Cable cut, transceiver failure, port failure | Dual-homed connections, LAG bundles, diverse fiber | One cable cut severs connectivity |
| **Path** | Routing failure, congestion, intermediate device failure | ECMP, multiple IGP paths, BGP multipath | Traffic black-holed when intermediate router fails |
| **Site** | Facility-level disaster (power, fire, flood) | Geographically separated DCs, multi-region | Entire site loss takes down all services |

### 1.2 Dual-Homed Connections

Dual-homing connects a device or site to two independent upstream points. No single cable cut or upstream device failure should isolate the downstream device. Three requirements for effective dual-homing:

- **Diverse physical paths.** The two uplinks must not share conduit, duct bank, or building entry point. Two cables in the same trench are one backhoe away from simultaneous failure. The industry term is "diverse path routing" -- the paths must be physically separated at every point along the route.
- **Independent upstream devices.** Connecting both uplinks to the same upstream switch provides link redundancy but not device redundancy. True dual-homing terminates on different switches, ideally in different racks or rooms.
- **Active-active preferred.** Active-standby wastes half the purchased bandwidth and introduces failover delay. Modern designs use ECMP or MC-LAG (multi-chassis link aggregation) to keep both paths forwarding simultaneously.

### 1.3 NSPOF Analysis and Redundancy Models

The No Single Point of Failure analysis reviews every component in the path between endpoints. For each: "If this fails, does traffic still flow?" Three redundancy models define spare capacity: **N+1** (one additional unit beyond what is needed -- cost-efficient), **N+N** (equal spares -- allows maintenance plus one unplanned failure), and **2N** (completely independent parallel system -- gold standard for financial and carrier networks).

---

## 2. The Availability Nines Table

| Availability | Downtime/Year | Downtime/Month | Downtime/Week | Common Name |
|-------------|---------------|----------------|---------------|-------------|
| 99% | 3d 15h 36m | 7h 18m | 1h 41m | Two nines |
| 99.9% | 8h 46m | 43m 50s | 10m 5s | Three nines |
| 99.95% | 4h 23m | 21m 55s | 5m 2s | Three and a half |
| 99.99% | 52m 36s | 4m 23s | 1m 1s | Four nines |
| 99.999% | 5m 15s | 26.3s | 6.0s | Five nines |
| 99.9999% | 31.5s | 2.6s | 0.6s | Six nines |

**Three nines (99.9%)** -- Achievable with basic redundancy and manual failover. A single 8-hour outage consumes the annual budget. Most small business networks operate here. This is the SLA floor for cloud providers on individual VMs.

**Four nines (99.99%)** -- Requires automated failover, redundant paths, proactive monitoring. Enterprise data center target. A single 5-minute BGP convergence event repeated 10 times consumes the entire budget.

**Five nines (99.999%)** -- 5 minutes 15 seconds per year. A single 30-second failover consumes 10% of the annual budget. Requires sub-second detection (BFD), pre-computed backup paths, hitless upgrades, rigorous change management. Carrier-grade and financial network target.

**Six nines (99.9999%)** -- 31.5 seconds per year. Requires fully redundant 2N architectures with independent failure domains. Telecom switching target (NEBS Level 3). Theoretical for most network designs.

Each additional nine roughly doubles infrastructure cost. Most organizations find their economic optimum between 99.95% and 99.99%.

---

## 3. Convergence Time Engineering

Convergence time is the interval between a failure occurring and all routers having updated forwarding tables to route around it. During convergence, packets destined for the failed path are dropped. Detection dominates the timeline.

```
FAILURE --> [Detection] --> [Notification] --> [Computation] --> [FIB Update]
             ~50ms-40s       ~1-5s              ~10ms-1s          ~10ms
```

Without BFD, OSPF detection takes 40 seconds (4x 10-second hello). BGP takes 180 seconds (3x 60-second keepalive).

### 3.1 OSPF Convergence Tuning

| Phase | Default | Tuned | Mechanism |
|-------|---------|-------|-----------|
| Detection | 40s | 50ms | BFD replaces hello-based detection |
| LSA generation | 5s wait | 0ms initial, 50ms incremental | `timers throttle lsa` |
| SPF computation | 5s wait | 50ms initial, 200ms incremental | `timers throttle spf` |
| FIB update | Immediate | Immediate | Hardware-dependent |

```
router ospf 1
 timers throttle lsa 0 50 5000
 timers throttle spf 50 200 5000
 timers pacing flood 10
```

The throttle parameters follow the pattern `(initial-delay, incremental-delay, max-delay)`. The initial SPF runs 50ms after the first LSA arrives. If additional LSAs arrive during computation, subsequent SPF runs are delayed by 200ms increments, up to a 5-second maximum. This prevents SPF storms during large-scale failures while still allowing sub-second convergence for single-link failures.

### 3.2 BGP Convergence Tuning

BGP was designed for policy, not speed. Key mechanisms: **BFD** (reduces detection from 180s to 50ms), **BGP Prefix Independent Convergence (PIC)** (pre-installs backup paths in FIB -- sub-second data plane failover even while BGP control plane reconverges), and **BGP Add-Path** (advertises multiple paths per prefix, giving downstream routers pre-installed backups). Real-world implementations have demonstrated 72ms end-to-end convergence with these techniques combined [15].

### 3.3 IP Fast Reroute and Loop-Free Alternates

IPFRR (RFC 5286) pre-computes loop-free alternate next hops. When a link fails, the router immediately redirects without waiting for IGP convergence -- only a FIB swap is needed, taking approximately 10ms. Remote LFA (RFC 7490) tunnels to a repair node when no direct LFA exists. Topology-Independent LFA (TI-LFA) uses Segment Routing to steer traffic along the post-convergence path, eliminating the tunnel requirement and providing 100% coverage for any topology. Combined with BFD at 50ms detection, total failover reaches approximately 60ms.

---

## 4. BFD -- Bidirectional Forwarding Detection

BFD (RFC 5880) is a lightweight, protocol-independent mechanism for detecting forwarding path failures, operating in the data plane. It detects failures in as little as 50 milliseconds -- roughly 800 times faster than default OSPF timers.

Each endpoint sends periodic BFD control packets. Missing a configurable number (the detect multiplier) declares the session down and notifies all registered clients (OSPF, BGP, IS-IS, static routes, MPLS).

```
Transmit interval:   50ms      Detection time: 50ms x 3 = 150ms
Detect multiplier:   3         Aggressive:     10ms x 3 = 30ms (hardware-assisted)
```

**Asynchronous mode** (standard): periodic packets, session down on missed multiplier. This is the mode used in virtually all production deployments. **Demand mode** (rare): polling-based, reduces bandwidth but increases detection time. **Echo function**: packets looped by remote endpoint, tests the complete forwarding path including line cards and ASICs rather than just the control plane.

| Protocol | BFD RFC | Replaces | Improvement |
|----------|---------|----------|-------------|
| OSPF | RFC 5882 | 40s dead timer | 40s to 150ms |
| BGP | RFC 5882 | 180s hold timer | 180s to 150ms |
| IS-IS | RFC 5882 | 30s hello | 30s to 150ms |
| Static routes | Vendor-specific | No detection | Infinite to 150ms |
| MPLS LSP | RFC 5884 | No detection | Infinite to 150ms |

**Configuration example (Cisco IOS-XE for OSPF):**

```
interface GigabitEthernet0/0
 bfd interval 50 min_rx 50 multiplier 3

router ospf 1
 bfd all-interfaces
```

**Multihop BFD** (RFC 5883) extends detection across multiple L3 hops for eBGP multihop sessions where peers are not directly connected. Uses UDP port 4784 (vs. 3784 for single-hop) and requires explicit source/destination address configuration. The limitation is that it cannot distinguish between failure of the remote endpoint and failure of an intermediate hop.

---

## 5. Graceful Restart and Non-Stop Forwarding

When a router's control plane restarts (software upgrade, process crash, supervisor switchover), the data plane can continue forwarding using the last-known routing table -- if GR is configured. Without GR, a control plane restart triggers adjacency drops, route withdrawal, traffic rerouting or black-holing, and a full reconvergence cycle taking 30 seconds to several minutes.

### 5.1 OSPF Graceful Restart (RFC 3623)

The restarting router sends a Grace-LSA (Type 9 opaque LSA) to neighbors before restarting, containing a grace period (60-180s) and restart reason (planned or unplanned). Neighbors enter **helper mode**: they continue advertising the restarting router's links as up, continue forwarding to it, and skip SPF for its topology changes. They exit helper mode when the grace period expires, topology changes elsewhere, or the router signals completion. Result: zero packet loss during the restart.

### 5.2 BGP Graceful Restart (RFC 4724)

When the TCP session drops, the receiving speaker marks routes as "stale" but keeps them for the configured restart time (default 120s). The restarting speaker re-establishes the session and sends an End-of-RIB marker when it has re-advertised all routes. Stale routes not refreshed are then deleted. GR is safe only when the network is stable during restart -- primarily a planned maintenance mechanism. If the network topology changes during the restart period, stale routes may be incorrect.

### 5.3 NSF with Stateful Switchover

On chassis routers with redundant supervisors, NSF pairs with SSO. The standby maintains a synchronized copy of interface status, protocol adjacencies, ACLs, and QoS policies. On failure: standby takes over (0.5-3 seconds), data plane continues forwarding with existing FIB, new active supervisor initiates graceful restart for all protocols. The entire event is invisible to transit traffic.

---

## 6. Network DR Testing

A redundancy design is only as reliable as the last time it was tested. Networks that have never experienced a failure will fail in unexpected ways when one eventually occurs.

### 6.1 Failover Drills

| Drill Type | Tests | Expected Result |
|------------|-------|-----------------|
| **Cable pull** | Link redundancy | BFD detects <200ms, traffic shifts, near-zero loss |
| **Device reboot** | Device redundancy, GR/NSF | SSO/NSF maintains forwarding, <1s impact |
| **Circuit failover** | WAN path redundancy | BGP reconverges to backup, shifts within BFD time |
| **Site failover** | Site redundancy | GSLB redirects users, data replication current |
| **Control plane crash** | NSF/GR | Forwarding continues, GR rebuilds state, <3s impact |

The **cable-pull test** is the most fundamental DR test: physically remove a cable from a running production port and measure detection time, reroute time, packet loss, and restoration time. It is an unambiguous, instantaneous, Layer 1 failure with no graceful shutdown or protocol notification. If the network cannot survive a cable pull cleanly, it cannot survive anything more complex.

### 6.2 Chaos Engineering for Networks

Controlled failure injection in production to discover weaknesses before uncontrolled failures do. Network chaos experiments include: link failure injection via SDN controllers or router APIs, BGP session teardown to verify backup path activation, latency injection using `tc` on Linux or policy-map on Cisco, packet loss injection to simulate gray failures (degraded but not dead circuits -- harder to detect than hard failures and often more damaging), DNS failure simulation, and full site blackhole to test GSLB failover.

**Tools:** `tc` (Linux traffic control), Gremlin (commercial chaos platform), Toxiproxy (Shopify, TCP-level proxy), GNS3/EVE-NG (pre-production simulation), Batfish (offline config analysis).

**Game days** exercise the human response alongside the technical: on-call escalation, communication, decision-making. A failure scenario unknown to the on-call team, real-time monitoring, and post-exercise review with timeline reconstruction.

---

## 7. Submarine Cable Resilience

Over 95% of intercontinental data traverses submarine cables. As of 2025, TeleGeography documents 570 in-service systems with 1,712 landing points, plus 81 planned [13].

### 7.1 Geographic Chokepoints

| Chokepoint | Cables | Primary Risk |
|------------|--------|-------------|
| Strait of Malacca | 20+ | Shipping, anchoring, seismic |
| Bab el-Mandeb / Red Sea | 12-16 | Conflict, shipping, anchor drags |
| English Channel | 30+ | Fishing trawlers, dense shipping |
| Strait of Luzon | 15+ | Typhoons, seismic, submarine landslides |
| Mediterranean | 20+ | Fishing, anchoring, seismic zones |

Route diversity is critical. An organization relying on a single cable system between two continents has a single point of failure at the intercontinental layer. Best practice requires contracts with carriers using at least two physically diverse cable systems, landing at different stations, preferably transiting different geographic chokepoints.

### 7.2 Notable Cable Cuts

**Tonga 2022:** The Hunga Tonga volcanic eruption on January 15, 2022 shredded the 827 km Tonga Cable across approximately 50 km with 4-5 distinct breaks. The eruption's pyroclastic flows and debris currents destroyed the cable beyond simple repair. Tonga lost all international internet for days; satellite provided only kilobit-per-second speeds through Inmarsat BGAN terminals. The volcanic ash plume initially blocked even satellite communications. Full repair took five weeks. Lesson: single-cable island nations face existential connectivity risk [16].

**Red Sea 2024:** Four major cables (AAE-1, Seacom/TGN-EA, EIG) severed in February 2024 by the dragging anchor of MV Rubymar, a cargo ship sunk by a Houthi anti-ship missile. An estimated 25% of data traffic between Asia and Europe was disrupted -- the Red Sea carries 16 cable systems connecting these continents. Repair took nearly six months because Houthi-controlled waters prevented repair ship access. Alcatel Submarine Networks declared force majeure, and the 2Africa Pearls cable extension was indefinitely delayed. Lesson: route diversity must account for political stability, not just geography [17].

**Other significant events:** Taiwan earthquakes (2006, 2023) severed Luzon Strait cables via undersea landslides. Egypt anchor drags (2008) disrupted 70% of India's internet connectivity. Svalbard cable cut (2022) highlighted sabotage vulnerability of single-cable routes.

---

## 8. MTTR and Spare Parts Strategy

| Component | Target MTTR | Spare Strategy |
|-----------|-------------|----------------|
| Transceiver (SFP/QSFP) | 15 min | On-site, 10-20% spares per site |
| Line card | 30 min | On-site for critical chassis |
| Power supply | 30 min | On-site (spare for the spare) |
| Chassis/switch | 2-4 hours | Pre-staged warm spare or 4-hour RMA |
| WAN circuit | 4-24 hours | Diverse backup (always active) |
| Submarine cable | 2-6 weeks | Route diversity via different system |

**RMA tiers:** NBD (24-48h, included with support), 4-hour (15-25% of hardware cost per year), 2-hour (25-40%), on-site sparing (one-time hardware cost). For a $50K spine switch, buying a cold spare achieves 15-minute swap vs. 4-hour RMA wait and pays for itself in four years of avoided RMA fees.

**Spare management discipline:** Spares must run the same firmware as production (quarterly updates), carry a baseline configuration template, and undergo periodic power-on testing (quarterly) to catch dead capacitors or failed flash storage.

**Availability formula:** `A = MTBF / (MTBF + MTTR)`. With MTBF of 50,000 hours and MTTR of 4 hours (RMA): 99.992%. Same device with on-site spare (MTTR 15 min): 99.9995%. Reducing MTTR has far larger impact on availability than increasing MTBF.

---

## 9. Network Redundancy Anti-Patterns

**Fate sharing:** Two "redundant" components sharing a hidden common dependency. Both WAN circuits using the same last-mile fiber. Both DNS servers on the same hypervisor. Both power supplies on the same UPS. Prevention: trace the full dependency chain for each redundant element -- if they converge at any point, they fate-share.

**Asymmetric routing:** Outbound via Path A, return via Path B. Stateful devices (firewalls, NAT gateways) see half the conversation and drop traffic. Prevention: symmetric routing policies (local-preference, MED, AS-path prepending), stateful session synchronization between redundant firewalls, or asymmetry-tolerant stateless ACLs.

**Split-brain:** Both units in a redundant pair believe they are active. Causes duplicate IP addresses, conflicting route advertisements, data corruption. Happens when the heartbeat link fails and each unit assumes the other is dead. Prevention: dedicated out-of-band heartbeat links, multiple heartbeat mechanisms, quorum with a third witness node, fencing mechanisms.

**Hidden dependencies:** Network devices depending on DNS for their management interface (if DNS fails, you cannot SSH to fix DNS). RADIUS/TACACS over the managed network (network failure locks operators out). NTP dependencies for certificate validation on routing protocol authentication. Prevention: out-of-band management network independent of the production data plane.

**Convergence oscillation:** A flapping link causing repeated failover/failback, each a convergence event with packet loss. A link that flaps 100 times per hour causes 100 convergence events. Prevention: BFD dampening, interface dampening, route dampening, and root cause repair of the underlying issue (bad transceiver, marginal fiber, software bug).

---

## 10. Real-World Architectures

### 10.1 Google B4 WAN

Private SD-WAN connecting Google data centers globally (SIGCOMM 2013, updated 2018). Centralized traffic engineering with a global TE server recomputes flows on failure within seconds. Hierarchical control plane ("B4 and After") partitions into domains for fault isolation -- a controller failure affects only its domain. Runs links near 100% utilization because centralized TE redistributes instantly (traditional networks keep 30-40% headroom). Merchant silicon switches with OpenFlow enable commodity sparing and rapid replacement. Orion (NSDI 2021) is the next-generation SDN platform, a modular microservice architecture with a publish-subscribe database running both Jupiter (data center) and B4 (WAN) networks [10][11][12].

### 10.2 Cloudflare Backbone

330+ cities, 120+ countries, 300+ Tbps capacity as of 2024. Every Cloudflare IP announced from every data center via BGP anycast -- BGP convergence IS the failover mechanism. When a data center fails, its BGP announcements withdraw and traffic shifts to the next nearest location automatically. Each site is locally autonomous and processes all services independently, eliminating hidden dependencies on central control. During the AAE-1 Red Sea cable disruption, Cloudflare's diverse backbone paths maintained flat round-trip times while third-party transit providers experienced severe congestion. Backbone capacity has grown 500% since 2021 [14].

### 10.3 AWS Network Architecture

Minimum three AZs per Region, each with independent power, cooling, and networking. AZs separated up to 100 km but connected by redundant dedicated metro fiber with sub-2ms round-trip latency, enabling synchronous database replication (RPO=0). Nine million kilometers of fiber globally. All inter-AZ traffic encrypted via hardware-accelerated encryption. 38 Regions and 120+ AZs as of 2025, with each new Region maintaining the minimum three-AZ redundancy model [15].

---

## 11. Availability Calculations and Design Patterns

### 11.1 Series and Parallel Availability

**Series** (all must work): `A_total = A1 x A2 x A3`. Ten components at 99.9% each: `0.999^10 = 99.0%`. Every component in the path degrades total availability.

**Parallel** (any must work): `A_total = 1 - (1 - A1)(1 - A2)`. Two at 99%: `1 - 0.01^2 = 99.99%`. Two individually mediocre components in parallel achieve excellent availability. This is why redundancy is the primary tool for availability improvement -- more effective than increasing individual component reliability.

**Compound calculation:** A campus path through a single access switch (99.95%), redundant distribution pair (each 99.95%, parallel = 99.999975%), redundant core pair (each 99.99%, parallel = 99.99999%), and dual WAN circuits (each 99.9%, parallel = 99.9999%) yields: `0.9995 x 0.99999975 x 0.9999999 x 0.999999 = 99.95%`. The single non-redundant access switch dominates overall availability.

### 11.2 Design Patterns

**Active-active ECMP:** Both paths forward simultaneously using hash-based flow distribution. Sub-second failover -- surviving paths absorb traffic immediately. Full bandwidth utilization. Requires session synchronization if stateful devices are in the path.

**Active-standby (VRRP/HSRP):** One device active, one monitoring. On failure, standby assumes the virtual IP. Simple, no asymmetric routing. Wastes 50% capacity, 1-3 second failover (tunable lower with BFD).

**Anycast:** Same IP from multiple locations via BGP. Clients routed to nearest instance. Global distribution, automatic geographic failover. Excellent for DNS and CDN. Not suitable for long-lived stateful TCP sessions.

**Spine-leaf fabric:** Every leaf to every spine, deterministic one-hop latency through spine layer. N+1 spine design tolerates any single spine failure. No spanning tree. Linear scale-out.

**Stretched cluster:** Active-active data centers with Layer 2 extension via EVPN-VXLAN. Near-zero RTO for site failure. Complex, with split-brain risk if the inter-site link fails. Requires careful failure domain design.

---

## 12. Cross-References

| Module | Relationship |
|--------|-------------|
| [01. Architecture & Design](01-network-architecture-design.md) | Redundancy applied to topologies |
| [02. Routing & Switching](02-routing-switching-operations.md) | BGP/OSPF operations underpinning convergence |
| [04. Traffic Engineering](04-load-balancing-traffic-engineering.md) | ECMP, anycast, GSLB as redundancy mechanisms |
| [05. Security Engineering](05-network-security-engineering.md) | Firewall HA, DDoS mitigation |
| [06. Cloud Networking](06-cloud-networking.md) | AWS AZs, transit gateways, cloud-native redundancy |
| [07. Observability](07-observability-troubleshooting.md) | Monitoring that detects failures and measures convergence |
| DRP (Disaster Recovery Planning) | Broader DR framework; this module covers the network layer |
| TCP (Protocol) | TCP behavior during failover: RST, retransmit, connection migration |
| FEC (Forward Error Correction) | Physical layer resilience complementing network layer redundancy |

---

## 13. Sources

1. RFC 5880 -- Bidirectional Forwarding Detection (BFD), Katz & Ward, IETF, 2010
2. RFC 5882 -- Generic Application of BFD, Katz & Ward, IETF, 2010
3. RFC 5883 -- BFD for Multihop Paths, Katz & Ward, IETF, 2010
4. RFC 5884 -- BFD for MPLS LSPs, Aggarwal et al., IETF, 2010
5. RFC 3623 -- Graceful OSPF Restart, Moy et al., IETF, 2003
6. RFC 4724 -- Graceful Restart Mechanism for BGP, Sangli et al., IETF, 2007
7. RFC 5286 -- IP Fast Reroute: Loop-Free Alternates, Atlas & Zinin, IETF, 2008
8. RFC 7490 -- Remote LFA Fast Reroute, Bryant et al., IETF, 2015
9. Cisco IOS-XE Configuration Guide -- BFD, OSPF NSF, BGP Graceful Restart
10. Jain et al., "B4: Experience with a Globally-Deployed Software Defined WAN," SIGCOMM 2013
11. Jain et al., "B4 and After," SIGCOMM 2018
12. Ferguson et al., "Orion: Google's SDN Control Plane," NSDI 2021
13. TeleGeography Submarine Cable Map, 2025 -- 570 in-service systems, 1,712 landings
14. "The Backbone Behind Cloudflare's Connectivity Cloud," Cloudflare Blog, July 2024
15. "Building Resilience: Inside AWS's Nine Million Kilometers of Fiber," AWS Blog, 2024
16. "Tonga's Likely Lengthy Internet Outage," Cloudflare Blog, January 2022
17. Washington Post, "Three Red Sea underwater data cables have been cut," March 2024
18. Arista EOS 4.35.2F -- BFD Documentation
19. Juniper TechLibrary -- BFD Configuration, Graceful Restart
20. Splunk, "What Is Five 9s in Availability Metrics?"
