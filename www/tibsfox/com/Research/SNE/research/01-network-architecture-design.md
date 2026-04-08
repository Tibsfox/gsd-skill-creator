# Network Architecture & Design

> **Domain:** Systems Network Engineering
> **Module:** 1 -- Architecture, Topology, and Capacity Planning
> **Through-line:** *Every packet traverses a topology that someone designed. The difference between a network that scales and one that collapses under load is not the equipment -- it is the architecture. Campus hierarchies, data center fabrics, WAN overlays, and cloud interconnects each solve the same fundamental problem: how to move data between endpoints with predictable latency, sufficient bandwidth, and graceful failure modes. The engineering discipline is in choosing the right topology for the traffic pattern, the right oversubscription ratio for the budget, and the right vendor ecosystem for the operational team.*

---

## Table of Contents

1. [Foundations: Why Topology Matters](#1-foundations-why-topology-matters)
2. [Campus Network Design](#2-campus-network-design)
3. [Data Center Fabrics](#3-data-center-fabrics)
4. [The CLOS Topology](#4-the-clos-topology)
5. [WAN Design](#5-wan-design)
6. [Cloud-Integrated Topologies](#6-cloud-integrated-topologies)
7. [Capacity Planning](#7-capacity-planning)
8. [Hyperscaler Case Studies](#8-hyperscaler-case-studies)
9. [Greenfield vs Brownfield](#9-greenfield-vs-brownfield)
10. [Topology Comparison Matrix](#10-topology-comparison-matrix)
11. [Design Decision Matrix](#11-design-decision-matrix)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Foundations: Why Topology Matters

Network architecture is the discipline of selecting, sizing, and interconnecting network devices to meet application requirements. The topology -- the geometric arrangement of nodes and links -- determines everything downstream: latency bounds, failure domains, capacity scaling, and operational complexity. A topology that matches the traffic pattern performs well. A topology that fights the traffic pattern creates bottlenecks, asymmetric paths, and cascading failures.

Three principles govern all modern network architecture:

**Hierarchy reduces complexity.** Flat networks are simple to draw but impossible to troubleshoot at scale. Hierarchical designs create layers of abstraction -- access, distribution, core -- where each layer has a defined role, a bounded failure domain, and clear scaling rules. The Cisco campus reference architecture formalized this in the 1990s. It remains the dominant model for enterprise LANs.

**East-west traffic demands fat fabrics.** Traditional north-south architectures (client to server, through a core) assumed most traffic entered and exited the data center. Virtualization, microservices, and distributed storage inverted this. Modern data centers generate 70-80% of their traffic between servers in the same facility. Spine-leaf fabrics exist specifically to provide non-blocking east-west bandwidth.

**Overlay decouples logical from physical.** SD-WAN, EVPN-VXLAN, and cloud networking all share the same insight: the logical topology that applications see does not need to match the physical topology that cables create. Overlays enable policy-driven forwarding, multi-tenancy, and topology abstraction. The cost is encapsulation overhead and operational complexity in the control plane.

---

## 2. Campus Network Design

### The Three-Tier Model

The Cisco campus reference architecture defines three hierarchical layers, each with a distinct function [1][2]:

```
                    +-----------+
                    |   CORE    |  High-speed backbone
                    +-----------+  L3 routing, no policy
                   /      |      \
          +-------+  +-------+  +-------+
          | DIST  |  | DIST  |  | DIST  |  Aggregation
          +-------+  +-------+  +-------+  Policy, filtering, QoS
          /   |   \
    +----+ +----+ +----+
    |ACC | |ACC | |ACC |   Access layer
    +----+ +----+ +----+   End-user connectivity
```

**Access layer.** The connection point for end devices -- workstations, phones, wireless access points, printers. Access switches provide port security (802.1X), VLAN assignment, PoE for wireless APs and IP phones, and basic QoS marking. The access layer is where users meet the network. Design decisions here determine port density, PoE budget, and uplink bandwidth to the distribution layer. Typical campus access switches provide 24 or 48 ports of 1GbE with 1-2 uplinks of 10GbE or 25GbE to the distribution layer.

**Distribution layer.** The policy enforcement point. Distribution switches aggregate traffic from multiple access switches, apply access control lists, perform inter-VLAN routing, implement QoS policies, and define the boundary between Layer 2 (access) and Layer 3 (core). The distribution layer is where routing protocols run, where redundancy is implemented via HSRP/VRRP, and where traffic summarization reduces the routing table size visible to the core. Each distribution block -- a pair of distribution switches and their connected access switches -- forms an independent failure domain.

**Core layer.** The high-speed transport backbone. The core connects distribution blocks to each other and to external resources (data center, WAN edge, internet edge). The core's design imperative is speed and availability -- no packet filtering, no policy application, no complex access lists. Every CPU cycle at the core is dedicated to forwarding. Core switches are typically chassis-based platforms (Cisco Catalyst 9600, Arista 7800R) with 100GbE or 400GbE interfaces and redundant supervisors.

### Collapsed Core

For campuses with fewer than 1,000 users and no more than three distribution blocks, the core and distribution layers can be combined into a single "collapsed core" layer [2]. This reduces hardware cost and management complexity at the expense of scalability. The collapsed core switch performs both aggregation/policy and high-speed transport. This is the default choice for single-building deployments, small branch offices, and campus environments that do not need geographic separation between distribution blocks.

The decision to separate the core is driven by two factors: the number of distribution blocks (three or more requires a dedicated core) and geographic distance (multiple buildings require a physical core backbone to avoid costly fiber runs between distribution switches).

### Modern Campus: Cisco SD-Access

Cisco's current campus architecture overlays SD-Access on top of the physical three-tier or collapsed-core topology. SD-Access uses VXLAN tunnels between fabric edge nodes (access switches), fabric border nodes (WAN/DC edge), and a control plane based on LISP (Locator/ID Separation Protocol). Cisco DNA Center serves as the centralized controller. The physical hierarchy remains -- spine-leaf or three-tier -- but the logical topology is abstracted into virtual networks (VNs) and scalable groups. This is Cisco's intent-based networking architecture for the campus, and it is the direction all new Cisco campus deployments are moving toward.

---

## 3. Data Center Fabrics

### Spine-Leaf Architecture

The spine-leaf topology is the dominant data center network architecture. Every leaf switch connects to every spine switch. There are no direct links between spine switches, and no direct links between leaf switches. This creates a two-tier CLOS fabric with predictable latency: every server-to-server path traverses exactly one leaf, one spine, and one leaf -- three hops, always [3][4].

```
        S1      S2      S3      S4        Spine layer
       /|\ \   /|\ \   /|\ \   /|\ \     (no cross-links)
      / | \  X  | \  X  | \  X  | \
     /  |  \/  \|  \/  \|  \/  \|  \
    L1  L2  L3  L4  L5  L6  L7  L8       Leaf layer
    ||  ||  ||  ||  ||  ||  ||  ||        (server connections)
   svr svr svr svr svr svr svr svr
```

**Why spine-leaf dominates:**

- **Predictable latency.** Every path is the same length: leaf-spine-leaf. No variable-hop paths. No spanning tree convergence. ECMP (Equal-Cost Multi-Path) load balances across all spine switches simultaneously.
- **Horizontal scaling.** Adding a new leaf switch adds server ports without changing the spine layer. Adding a new spine switch adds bisection bandwidth without changing the leaf layer. The two scaling axes are independent.
- **Failure isolation.** Losing a single spine switch reduces total bisection bandwidth by 1/N (where N is the number of spines) but does not disconnect any leaf. Losing a single leaf disconnects only the servers attached to that leaf.

### Cisco ACI (Application Centric Infrastructure)

Cisco ACI is an SDN platform built on Nexus 9000 series spine-leaf hardware [5]. The fabric is controlled by the Application Policy Infrastructure Controller (APIC) -- a cluster of three or more controllers that define policy in terms of application profiles, endpoint groups (EPGs), and contracts (access rules between EPGs). The physical topology is spine-leaf, but the operational model is policy-driven: administrators define which applications can communicate, and the APIC programs the hardware forwarding tables accordingly.

ACI fabric specifications: minimum deployment is 2 spine + 2 leaf + 3 APIC. Maximum scale is 500 leaf switches per fabric. Starting from ACI release 4.1, multi-tier leaf topologies are supported, allowing a Tier 2 leaf layer beneath the standard leaf layer for vertical expansion -- useful for connecting legacy devices or extending the fabric to adjacent rooms without running fiber back to the spine.

### Arista EVPN-VXLAN

Arista's approach to the data center fabric uses the same spine-leaf physical topology but with an open, standards-based overlay: EVPN (Ethernet VPN) as the control plane and VXLAN (Virtual Extensible LAN) as the data plane [6]. EVPN distributes MAC and IP reachability information via BGP, enabling multi-tenancy, Layer 2 extension across Layer 3 boundaries, and distributed anycast gateways. Each leaf switch acts as a VTEP (VXLAN Tunnel Endpoint), encapsulating and decapsulating VXLAN frames.

Arista's Validated Designs (AVD) provide a reference architecture for Layer 3 leaf-spine with EVPN-VXLAN, including symmetric IRB (Integrated Routing and Bridging) for combined L2/L3 forwarding, MLAG (Multi-Chassis Link Aggregation) for leaf-level redundancy, and integration with automation tools like Ansible and Arista's AVD collection for configuration generation and deployment.

The key architectural difference: Cisco ACI is a proprietary policy model with vendor lock-in to Nexus hardware and APIC controllers. Arista EVPN-VXLAN uses IETF standards (RFC 7432, RFC 8365) and can interoperate with switches from multiple vendors. The tradeoff is that ACI provides a more opinionated, integrated management experience, while EVPN-VXLAN provides flexibility and vendor independence at the cost of more operational complexity in stitching together the control plane, automation, and monitoring.

---

## 4. The CLOS Topology

### History and Theory

Charles Clos published "A Study of Non-Blocking Switching Networks" in the Bell System Technical Journal in 1953 [7]. Working at Bell Laboratories, Clos solved a specific telephone switching problem: how to interconnect a large number of input lines to a large number of output lines using smaller, cheaper crossbar switches arranged in stages, rather than a single enormous crossbar. The key insight was that a multi-stage arrangement of small switches could be made non-blocking -- guaranteeing that any idle input can be connected to any idle output without rearranging existing connections -- if the middle stage has enough switches.

For a three-stage CLOS network with n inputs per ingress switch, n outputs per egress switch, and m middle-stage switches, the network is **strictly non-blocking** when:

```
m >= 2n - 1
```

This means the middle stage needs roughly twice as many switches as there are ports per edge switch. In a data center context, this translates directly to the number of spine switches relative to the port count of each leaf switch.

### Fat-Tree Topology

The fat-tree, introduced by Charles Leiserson at MIT in 1985, is a specialization of the CLOS topology for computer interconnects [8]. The defining characteristic is that link bandwidth increases (gets "fatter") as you move toward the root of the tree, eliminating the bandwidth bottleneck that afflicts simple tree topologies. Al-Fares, Loukissas, and Vahdat formalized the k-port fat-tree for data centers in their 2008 SIGCOMM paper, "A Scalable, Commodity Datacenter Network Architecture" [9].

For a fat-tree built from k-port switches with L levels:

| Parameter | Formula | Example (k=48, L=3) |
|-----------|---------|---------------------|
| Host ports per leaf | k/2 | 24 |
| Uplink ports per leaf | k/2 | 24 |
| Number of spine switches | (k/2)^2 | 576 |
| Number of leaf switches | k^2/2 | 1,152 |
| Maximum hosts | k^3/4 | 27,648 |
| Bisection bandwidth | k^3/4 * link_speed | 27,648 * 10G = 276 Tb/s |

The fat-tree provides full bisection bandwidth -- 1:1 oversubscription -- when fully populated. In practice, operators deploy fewer spine switches to save cost, accepting controlled oversubscription (2:1, 3:1, or 4:1) based on traffic analysis.

### Three-Stage vs Five-Stage CLOS

A two-tier spine-leaf is a three-stage CLOS (ingress leaf, spine, egress leaf). When the number of leaf switches exceeds the port count of the spine switches, the fabric must add a "super-spine" layer, creating a five-stage CLOS:

```
         Super-Spine
        /     |     \
    Spine   Spine   Spine        (pod-level spines)
    / | \   / | \   / | \
   L  L  L L  L  L L  L  L      (leaf switches)
```

Each group of leaf + spine switches forms a "pod." The super-spine connects pods. This is how hyperscaler fabrics scale beyond the port count of individual switches. Google's Jupiter and Meta's F16 both use multi-stage CLOS topologies with pod-level aggregation and cross-pod interconnection layers.

---

## 5. WAN Design

### Hub-and-Spoke

The simplest WAN topology connects all remote sites (spokes) to a central hub. All inter-site traffic transits the hub. This is cost-effective for small deployments (fewer than 20 sites) where most traffic flows between branch and data center rather than between branches [10].

**Advantages:** Centralized security inspection, simple routing, minimal circuit cost (N-1 links for N sites). **Disadvantages:** Hub is a single point of failure, all traffic hairpins through the hub adding latency, hub bandwidth is the bottleneck for inter-branch communication.

### Full Mesh

Every site connects directly to every other site. This provides optimal latency (one-hop between any pair) and maximum redundancy. The cost is link count: a full mesh of N sites requires N*(N-1)/2 links. For 10 sites, this is 45 links. For 50 sites, 1,225 links. Full mesh is practical only for small numbers of critical sites -- typically the core backbone connecting 3-8 major data centers or regional hubs [10].

### Partial Mesh and DMVPN

Partial mesh connects high-traffic site pairs directly while using a hub for low-traffic pairs. This balances cost against performance. Cisco's Dynamic Multipoint VPN (DMVPN) automates this: a hub-and-spoke VPN baseline is established, and when two spokes need to communicate directly, DMVPN dynamically builds a spoke-to-spoke tunnel on demand [11]. The tunnel tears down after a period of inactivity. This gives the cost structure of hub-and-spoke with the latency characteristics of mesh for active flows.

### SD-WAN Overlay

SD-WAN decouples the logical WAN topology from the physical transport. The overlay control plane (centralized controller) builds tunnels across any available underlay -- MPLS, broadband internet, LTE/5G -- and steers traffic based on application policy. The physical circuits become commoditized transport; the intelligence moves to software [12].

Cisco Catalyst SD-WAN (formerly Viptela) uses four components: the SD-WAN Manager (centralized GUI and configuration), the SD-WAN Controller (control plane, distributes routes via OMP -- Overlay Management Protocol), the SD-WAN Validator (authenticates and orchestrates edge device connections), and the WAN Edge routers (data plane at each site).

VMware VeloCloud (now Broadcom SD-WAN) takes a cloud-first approach with gateway nodes at cloud on-ramps. The key architectural difference is that VeloCloud gateways are deployed at cloud exchange points, providing optimized paths to SaaS applications without requiring dedicated circuits.

**WAN Topology Comparison:**

| Topology | Links (N sites) | Latency | Redundancy | Cost | Use Case |
|----------|-----------------|---------|------------|------|----------|
| Hub-and-Spoke | N-1 | High (hairpin) | Low (hub SPOF) | Low | < 20 sites, centralized apps |
| Full Mesh | N*(N-1)/2 | Optimal | Maximum | Very high | 3-8 backbone sites |
| Partial Mesh | Variable | Mixed | Medium | Medium | Regional hubs + branches |
| DMVPN | N-1 base + dynamic | Low for active flows | Medium | Low-medium | Branch-heavy, VPN |
| SD-WAN | Transport-agnostic | Policy-driven | High | Medium | Modern enterprise WAN |

---

## 6. Cloud-Integrated Topologies

### Hybrid Cloud Connectivity

Connecting on-premises networks to cloud providers requires dedicated circuits that bypass the public internet. The three major providers offer similar services with different names [13][14]:

| Provider | Dedicated Circuit | Bandwidth | Peering Model |
|----------|------------------|-----------|---------------|
| AWS | Direct Connect | 1-100 Gbps | Private/Public VIF at Direct Connect location |
| Azure | ExpressRoute | 50 Mbps-100 Gbps | Private/Microsoft peering via partner circuit |
| Google Cloud | Cloud Interconnect | 10-200 Gbps | Dedicated or Partner interconnect |

Each service establishes BGP peering between the customer's edge router and the cloud provider's edge at a colocation facility. The customer advertises on-premises prefixes; the cloud provider advertises VPC/VNet routes. Traffic flows over the dedicated circuit rather than the public internet, providing predictable latency, consistent bandwidth, and private addressing.

### Multi-Cloud Interconnect

Connecting two cloud providers to each other adds complexity. Three architectural patterns exist [13]:

**Pattern 1: On-premises hub.** Both cloud providers connect via dedicated circuits to the customer's data center, which routes between them. This uses existing infrastructure but hairpins all cross-cloud traffic through the customer's WAN. Latency equals the sum of both circuit latencies plus on-premises forwarding.

**Pattern 2: Cloud exchange.** A third-party provider (Equinix Cloud Exchange, Megaport, PacketFabric) terminates both cloud circuits at a shared exchange point. Cross-cloud traffic routes through the exchange fabric. This eliminates the on-premises hairpin and provides a purpose-built interconnection point. Equinix operates exchanges in 70+ metros worldwide.

**Pattern 3: Direct cloud-to-cloud.** AWS and Azure (and increasingly Google Cloud) support direct peering between their networks at shared colocation facilities. AWS Interconnect (launched 2024) enables direct private connectivity from AWS to Azure, Google Cloud, and Oracle Cloud without requiring customer-owned hardware at the exchange point.

### Transit Gateway and Hub-Spoke in the Cloud

Within a single cloud provider, the hub-spoke pattern reappears. AWS Transit Gateway connects multiple VPCs through a central hub, enabling shared services (DNS, security inspection, egress filtering) without building full mesh VPC peering. Azure Virtual WAN provides equivalent functionality with automatic spoke-to-spoke routing via Microsoft's backbone. Google Cloud uses Network Connectivity Center as the hub for both cloud and on-premises spokes.

The pattern is consistent across all three providers: a centralized transit resource that aggregates routing, applies policy, and forwards between connected networks. This is the cloud equivalent of the campus distribution layer -- an aggregation and policy point between access (individual VPCs/workloads) and core (internet, cross-region, cross-cloud).

---

## 7. Capacity Planning

### Oversubscription Ratios

Oversubscription is the ratio of total downstream (access-facing) bandwidth to total upstream bandwidth at any aggregation point. A 48-port leaf switch with 48 x 25GbE server ports (1,200 Gbps downstream) and 6 x 100GbE uplinks (600 Gbps upstream) has a 2:1 oversubscription ratio [15].

**Industry-standard oversubscription ratios:**

| Network Tier | Ratio | Rationale |
|--------------|-------|-----------|
| Campus access-to-distribution | 20:1 | User endpoints are bursty, low average utilization |
| Campus distribution-to-core | 4:1 | Aggregated traffic is smoother, predictable |
| DC leaf-to-spine (general) | 3:1 | Standard for mixed workloads |
| DC leaf-to-spine (storage) | 1.5:1 or 1:1 | Storage traffic is sustained, latency-sensitive |
| DC leaf-to-spine (HPC/AI) | 1:1 | Non-blocking required for collective operations |
| WAN access circuit | 10:1-20:1 | WAN bandwidth is expensive |

The critical insight: oversubscription is not a fixed number -- it is a design parameter driven by traffic analysis. A data center running mostly stateless web servers can tolerate 3:1 because individual servers burst but the aggregate is smooth. A data center running distributed training on GPU clusters requires 1:1 because all-reduce operations create synchronized, full-bandwidth traffic patterns that cannot tolerate contention.

### Bandwidth Modeling

Capacity planning starts with traffic matrix analysis: for each pair of endpoints (or groups of endpoints), what is the expected bandwidth demand? The traffic matrix drives topology selection, link sizing, and oversubscription decisions.

**Step 1: Measure.** Collect NetFlow/sFlow data from existing switches to build a baseline traffic matrix. Identify the top talkers, the dominant flow patterns (north-south vs east-west), and the peak-to-average ratio.

**Step 2: Project.** Estimate growth based on application roadmap, user growth, and infrastructure expansion. Network capacity should be planned for 3-5 years, with headroom for burst absorption. A common planning target is 50-60% average utilization at peak, leaving 40-50% headroom for bursts and growth.

**Step 3: Size.** Map the projected traffic matrix to topology options. Calculate oversubscription ratios at each aggregation point. Verify that no link or node is a bottleneck. Iterate: if the initial topology creates hotspots, add spine switches (data center) or redistribute aggregation (campus) to rebalance.

**Step 4: Validate.** Model failure scenarios. When a spine switch fails, does the remaining capacity still meet demand? When a WAN circuit fails, does the backup path handle the load? Capacity planning must account for N-1 (single failure) and sometimes N-2 (double failure) scenarios.

### Bill of Materials Considerations

Network equipment procurement involves four cost categories:

| Category | Typical Split | Key Variables |
|----------|--------------|---------------|
| Hardware (switches, routers) | 40-50% | Port density, forwarding capacity, PoE budget |
| Optics (transceivers, cables) | 20-30% | Distance, speed, single-mode vs multi-mode |
| Software (licenses, subscriptions) | 15-25% | Feature licensing, SDN controller seats |
| Installation and cabling | 5-15% | Structured cabling, fiber runs, rack space |

Optics cost is frequently underestimated. A 100GbE QSFP28 transceiver costs $50-200 depending on reach and vendor. A 400GbE QSFP-DD transceiver costs $200-1,000. In a spine-leaf fabric with 32 spine switches and 128 leaf switches, the optic count is 32 * 128 * 2 (one on each end) = 8,192 transceivers. At $150 each, that is $1.2M in optics alone. Third-party optics from vendors like FS.com or Finisar/II-VI can reduce this by 50-70%, but compatibility validation is required.

---

## 8. Hyperscaler Case Studies

### Google Jupiter

Jupiter is Google's data center network fabric, now in its fifth generation. The architecture has evolved from a standard CLOS topology to a hybrid direct-connect + optical circuit switching design [16][17][18].

**Generation timeline and capabilities:**

| Generation | Year | Bisection BW | Key Innovation |
|-----------|------|-------------|----------------|
| Firehose (1st gen) | ~2004 | ~100 Gbps | First in-house DC network |
| Watchtower (2nd gen) | ~2008 | ~10 Tbps | Merchant silicon adoption |
| Saturn (3rd gen) | ~2012 | ~100 Tbps | Software-defined networking |
| Jupiter (4th gen) | 2015 | 1.3 Pbps | CLOS topology at scale, centralized TE |
| Jupiter Evolving (5th gen) | 2022-present | 13 Pbps | OCS, direct-connect, Orion SDN |

The current Jupiter fabric introduces three architectural shifts that represent the state of the art in data center networking:

**Optical Circuit Switching (OCS).** MEMS-based optical circuit switches dynamically reconfigure physical connectivity between aggregation blocks. Instead of fixed fiber connections between pods, OCS allows the fabric to rewire itself based on traffic demand. This enables a direct-connect topology where aggregation blocks can be connected to any other block without transiting a fixed spine layer.

**Orion SDN.** Google's centralized SDN controller, deployed in production since 2016, programs forwarding rules across the entire fabric. Orion enables traffic engineering at fabric scale -- shifting flows between paths based on real-time utilization and demand. This is the control plane that makes OCS useful: without centralized traffic engineering, dynamic topology reconfiguration would create routing instability.

**Direct-connect topology.** Jupiter Evolving moved from a strict CLOS hierarchy to a direct-connect model where aggregation blocks peer with each other through OCS. This reduces hop count for intra-block traffic and enables non-uniform bandwidth allocation -- blocks that need more bandwidth between them get more optical circuits.

The result: 5x higher speed and capacity, 30% reduction in capex, 41% reduction in power, 10% reduction in flow completion time, 30% throughput improvement, and 50x less downtime compared to the best previous-generation alternatives [17].

### Meta F16

Meta's F16 fabric, introduced in 2019, uses 16 single-chip spine planes of 128-port 100GbE switches (Minipack platform, built with Edgecore based on Meta's open-compute designs) [19]. The naming convention is straightforward: F4 used 4 fabric planes, F16 uses 16. F16 delivers four times the capacity of F4 without requiring 400GbE optics -- it achieves scale through switch count rather than port speed.

**Regional interconnection with HGRID.** F16 spine switches connect directly to Meta's HGRID regional backbone, flattening the regional network. A Meta campus typically contains six data center buildings, each with its own F16 fabric. HGRID connects all six fabrics into a single regional network with petabit-scale east-west bandwidth. This eliminates the traditional data center interconnect (DCI) tier -- fabric spine switches *are* the regional backbone edge.

The architectural insight from Meta's design: you can scale bandwidth by adding more parallel forwarding planes rather than by increasing individual link speed. This avoids the power and cost penalties of leading-edge optics and uses proven, commodity 100GbE technology.

### Microsoft SWAN

SWAN (Software-driven Wide Area Network) is Microsoft's inter-datacenter WAN, deployed since 2013 and now carrying over 90% of traffic between Microsoft datacenters across 280,000+ km of optical fiber and 150+ points of presence [20][21].

SWAN's architecture separates the WAN into three tiers of traffic: interactive (latency-sensitive, highest priority), elastic (throughput-sensitive, medium priority -- bulk data replication), and background (best-effort, lowest priority). A centralized controller allocates bandwidth to each service class based on demand and priority, then programs label-switched paths across the WAN routers.

**Key innovations:**

- **Congestion-free network updates.** When the controller reprograms forwarding paths, it uses a multi-step update procedure with reserved scratch capacity to guarantee that no link is overloaded during the transition. This avoids the packet loss and congestion that result from naive in-place reconfiguration.
- **Near-optimal utilization.** SWAN carries 60% more traffic than traditional MPLS traffic engineering and comes within 2% of the theoretical optimum. This translates directly to reduced WAN circuit spend.
- **OneWAN unification.** In 2023, Microsoft published "OneWAN is better than two" at NSDI, describing the unification of their previously split WAN architectures (one for cloud, one for corporate) into a single shared fabric, further improving utilization.

---

## 9. Greenfield vs Brownfield

The decision framework for new network deployments vs upgrades to existing infrastructure involves five dimensions [22]:

| Dimension | Greenfield | Brownfield |
|-----------|------------|------------|
| **Cost profile** | High upfront, low ongoing | Lower upfront, higher ongoing (tech debt) |
| **Timeline** | 6-18 months | 2-6 months |
| **Risk** | Integration risk (new=untested) | Compatibility risk (new+old=fragile) |
| **Architecture freedom** | Full -- choose optimal topology | Constrained by existing cabling, power, space |
| **Operational impact** | None during build (parallel) | Migration windows, phased cutover |

### When to Go Greenfield

- The existing network is end-of-life and unsupported
- Traffic patterns have fundamentally changed (north-south to east-west)
- The topology cannot scale further (e.g., three-tier DC needs spine-leaf)
- A new building, campus, or data center is being built
- The operational team can support a parallel environment during transition

### When to Go Brownfield

- The existing topology is fundamentally sound but needs capacity
- Vendor relationships and operational skills are invested
- Budget constraints prevent full replacement
- Uptime requirements preclude extended migration windows
- The existing cable plant can be reused

### The Hybrid Approach

Most real-world deployments are hybrid: brownfield in the existing core (upgrade line cards, add capacity) with greenfield at the edge (new spine-leaf fabric for a new workload tier, new SD-WAN overlay on existing circuits). The key discipline is defining a clean architectural boundary between old and new -- a demarcation point where the brownfield network hands off to the greenfield deployment with well-defined interfaces and routing adjacencies.

---

## 10. Topology Comparison Matrix

| Topology | Scale (endpoints) | Latency | Oversubscription | Failure Impact | Complexity | Cost |
|----------|-------------------|---------|-------------------|----------------|------------|------|
| Three-tier campus | 200-50,000 | 3-5 hops variable | 20:1 access, 4:1 dist | Layer-dependent | Medium | Medium |
| Collapsed core | 50-1,000 | 2-3 hops | 20:1 access | Broader blast radius | Low | Low |
| Spine-leaf (2-tier) | 100-10,000 servers | 3 hops fixed | 1:1 to 4:1 tunable | Proportional spine loss | Medium | Medium-high |
| 5-stage CLOS | 10,000-100,000+ | 5 hops fixed | 1:1 to 3:1 | Pod-isolated | High | High |
| Hub-and-spoke WAN | 2-50 sites | High (hairpin) | N/A | Hub = total failure | Low | Low |
| Full mesh WAN | 3-8 sites | Optimal (1 hop) | N/A | Graceful (one link) | High | Very high |
| SD-WAN overlay | 10-10,000 sites | Policy-driven | Transport-dependent | Transport-diverse | Medium | Medium |
| Cloud transit hub | 2-100 VPCs | Cloud-native | Cloud-managed | Hub = partition | Low | Usage-based |

---

## 11. Design Decision Matrix

When selecting a network architecture, the decision depends on the interaction of five primary variables. This matrix maps common scenarios to recommended topologies:

| Scenario | Traffic Pattern | Scale | Budget | Recommended Topology |
|----------|----------------|-------|--------|---------------------|
| Single-building campus | North-south | < 500 users | Moderate | Collapsed core |
| Multi-building campus | North-south | 500-5,000 | Adequate | Three-tier with L3 distribution |
| Large campus | Mixed | 5,000+ | Enterprise | Three-tier with SD-Access overlay |
| New data center, general compute | 70% east-west | < 5,000 servers | Standard | 2-tier spine-leaf, 3:1 oversubscription |
| Data center, AI/HPC workloads | Burst east-west | Any | Performance-first | 2-tier spine-leaf, 1:1 non-blocking |
| Hyperscale data center | All-to-all | 50,000+ servers | Scale economics | 5-stage CLOS with OCS |
| Small WAN (< 20 sites) | Branch-to-DC | Regional | Limited | Hub-and-spoke + SD-WAN |
| Enterprise WAN (20-200 sites) | Mixed | National | Moderate | SD-WAN, dual-hub, partial mesh |
| Backbone WAN (3-8 DCs) | DC-to-DC replication | Global | Large | Full mesh + TE |
| Hybrid cloud | Cloud + on-prem | Variable | Usage-based | Direct Connect/ExpressRoute + Transit GW |
| Multi-cloud | Cross-cloud | Variable | Premium | Cloud exchange (Equinix/Megaport) |

### The Oversubscription Decision Tree

```
Is the workload latency-sensitive and bandwidth-intensive?
  YES → Is it synchronized (AI collective, parallel storage)?
    YES → 1:1 non-blocking fabric (no oversubscription)
    NO  → 1.5:1 to 2:1 (storage, database clusters)
  NO  → Is the traffic pattern predictable?
    YES → 3:1 (web servers, microservices)
    NO  → 2:1 to 3:1 with monitoring and scaling plan
```

---

## 12. Cross-References

- **Module 02 (Routing & Switching Operations):** BGP, OSPF, EVPN control plane details for the fabrics described here
- **Module 03 (Network Automation):** NAPALM, Nornir, Ansible for deploying and managing these topologies
- **Module 04 (Traffic Engineering):** ECMP, segment routing, and traffic shaping across spine-leaf and WAN fabrics
- **Module 06 (Cloud Networking):** VPC design, transit gateway, and service mesh details for cloud-integrated topologies
- **Module 10 (Network Reliability):** Redundancy design, convergence time, and failure modes for the architectures above
- **SNE cross-series:** TCP (transport fundamentals), DNS (naming infrastructure), K8S (container networking overlay), DRP (disaster recovery planning)

---

## 13. Sources

1. Cisco Campus LAN and Wireless LAN Design Guide. Cisco Design Zone. https://www.cisco.com/c/en/us/td/docs/solutions/CVD/Campus/cisco-campus-lan-wlan-design-guide.html
2. Cisco Enterprise Campus 3.0 Architecture: Overview and Framework. https://www.cisco.com/c/en/us/td/docs/solutions/Enterprise/Campus/campover.html
3. "What Is Spine-Leaf Architecture?" TechTarget. https://www.techtarget.com/searchdatacenter/definition/Leaf-spine
4. "Spine and Leaf Architecture 101." Corning. https://www.corning.com/data-center/worldwide/en/home/solutions/spine-and-leaf-architecture-101.html
5. Cisco Application Centric Infrastructure Design Guide. https://www.cisco.com/c/en/us/td/docs/dcn/whitepapers/cisco-application-centric-infrastructure-design-guide.html
6. Arista EVPN VXLAN Design Guide and CI Workshop. https://labguides.testdrive.arista.com/2025.1/automation/ci_avd_l3ls/overview/
7. Clos, C. "A Study of Non-Blocking Switching Networks." Bell System Technical Journal, 1953.
8. Leiserson, C.E. "Fat-trees: Universal networks for hardware-efficient supercomputing." IEEE Transactions on Computers, 1985.
9. Al-Fares, M., Loukissas, A., Vahdat, A. "A Scalable, Commodity Datacenter Network Architecture." ACM SIGCOMM 2008. https://saubhik.github.io/papers/html/alfares2008fattree.html
10. "Hub-and-Spoke in Modern WANs: Still Relevant in 2025?" Network Journey. https://networkjourney.com/hub-and-spoke-in-modern-wans-still-relevant-in-2025-ccnp-enterprise/
11. Cisco Dynamic Multipoint VPN Data Sheet. https://www.cisco.com/c/en/us/products/collateral/security/dynamic-multipoint-vpn-dmvpn/data_sheet_c78-468520.html
12. Cisco Catalyst SD-WAN Design Guide. https://www.cisco.com/c/en/us/td/docs/solutions/CVD/SDWAN/cisco-sdwan-design-guide.html
13. "Designing private network connectivity between AWS and Microsoft Azure." AWS Blog. https://aws.amazon.com/blogs/modernizing-with-aws/designing-private-network-connectivity-aws-azure/
14. "Patterns for connecting other cloud service providers with Google Cloud." Google Cloud Architecture Center. https://cloud.google.com/architecture/patterns-for-connecting-other-csps-with-gcp
15. "Oversubscription in Networking." Noction. https://www.noction.com/blog/oversubscription-in-networking
16. "Jupiter Rising: A Decade of Clos Topologies and Centralized Control." ACM SIGCOMM 2015. https://conferences.sigcomm.org/sigcomm/2015/pdf/papers/p183.pdf
17. "Jupiter Evolving: Transforming Google's Datacenter Network via Optical Circuit Switches and Software-Defined Networking." ACM SIGCOMM 2022. https://dl.acm.org/doi/10.1145/3544216.3544265
18. "Jupiter now scales to 13 Petabits per second." Google Cloud Blog. https://cloud.google.com/blog/products/networking/speed-scale-reliability-25-years-of-data-center-networking
19. "Reinventing our data center network with F16, Minipack." Meta Engineering Blog. https://engineering.fb.com/2019/03/14/data-center-engineering/f16-minipack/
20. Hong, C-Y. et al. "Achieving High Utilization with Software-Driven WAN." ACM SIGCOMM 2013. https://conferences.sigcomm.org/sigcomm/2013/papers/sigcomm/p15.pdf
21. "Born in the research lab a decade ago, SWAN continues to accelerate networking in the Microsoft Cloud." Microsoft Research. https://www.microsoft.com/en-us/research/blog/born-in-the-research-lab-a-decade-ago-swan-continues-to-accelerate-networking-in-the-microsoft-cloud/
22. "Greenfield vs Brownfield Data Centers: The Strategic Decision." Pure Storage. https://blog.purestorage.com/purely-technical/greenfield-vs-brownfield-data-centers/
