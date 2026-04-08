# M4: IP Address Management

**Module:** M4
**Title:** IP Address Management
**Type:** Operations / Engineering Reference
**Owner:** Network Operations Lead
**Lifecycle State:** Published
**Review Cadence:** Annual (or upon major tooling change)
**Audience:** Network Engineers, NOC Operators, IT Infrastructure Architects, Compliance Auditors
**Standards Refs:** RFC 1918, RFC 4291, RFC 5227, RFC 6598, RFC 6724, RFC 7084, RFC 8415, RFC 8683
**Version:** 1.0
**Last Reviewed:** 2026-04-08
**Next Review:** 2027-04-08

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Scope](#2-scope)
3. [IPAM Tools Landscape](#3-ipam-tools-landscape)
4. [DHCP Operations at Scale](#4-dhcp-operations-at-scale)
5. [IPv4 Exhaustion Strategies](#5-ipv4-exhaustion-strategies)
6. [IPv6 Transition Operations](#6-ipv6-transition-operations)
7. [Subnet Planning](#7-subnet-planning)
8. [DNS Integration with IPAM (DDI)](#8-dns-integration-with-ipam-ddi)
9. [IP Conflict Detection and Resolution](#9-ip-conflict-detection-and-resolution)
10. [Compliance Requirements for IP Tracking](#10-compliance-requirements-for-ip-tracking)
11. [Operational Procedures](#11-operational-procedures)
12. [Related Documents](#12-related-documents)
13. [Revision History](#13-revision-history)

---

## 1. Purpose

This module provides a comprehensive operational reference for IP Address Management across enterprise and service provider networks. It addresses the full lifecycle of IP address resources: allocation planning, assignment automation via DHCP, tracking through IPAM tools, integration with DNS services, IPv4 conservation and IPv6 transition strategies, conflict resolution, and compliance posture.

IP address management sits at the intersection of network engineering, operations, and governance. Poor IPAM practice leads to outages from address conflicts, compliance failures from missing audit trails, wasted address space from fragmented allocation, and operational friction from manual tracking in spreadsheets. This module codifies the tools, patterns, and operational discipline required to manage IP resources as first-class infrastructure assets.

---

## 2. Scope

This module covers:

- IPAM tool selection, deployment models, and feature comparison (NetBox, Nautobot, Infoblox, BlueCat, phpIPAM)
- DHCP server operations at scale including failover, relay agents, and reservation management
- IPv4 exhaustion mitigation: NAT strategies, CGNAT, address reclamation, market acquisition
- IPv6 transition mechanisms: dual-stack, NAT64/DNS64, 464XLAT, SLAAC vs DHCPv6
- Hierarchical subnet planning with VLSM and summarization
- DDI (DNS/DHCP/IPAM) unified operations and forward/reverse zone automation
- IP conflict detection, root cause analysis, and remediation
- Regulatory compliance requirements for IP address tracking and audit trails

This module does not cover:

- Layer 2 switching or VLAN trunking design (see M2: Network Change Operations)
- Firewall rule management tied to IP objects (see M7: Firewall & ACL Operations)
- VPN tunnel addressing and overlay networks (see M8: VPN & Remote Access)
- Physical network topology or cabling (see M9: Network Documentation & CMDB)

---

## 3. IPAM Tools Landscape

### 3.1 Tool Comparison Matrix

| Feature | NetBox | Nautobot | Infoblox NIOS | BlueCat Integrity | phpIPAM |
|---|---|---|---|---|---|
| **Type** | Open source DCIM/IPAM | Open source (NetBox fork) | Commercial DDI | Commercial DDI | Open source IPAM |
| **Current Version** | v4.5 (Jan 2026) | v2.x | NIOS 9.x / Universal DDI | 9.6 / Integrity X 25.1 | v1.7.4 |
| **License** | Apache 2.0 | Apache 2.0 | Proprietary (subscription) | Proprietary (subscription) | GPL v3 |
| **Backend** | Python/Django, PostgreSQL | Python/Django, PostgreSQL | Proprietary appliance | Proprietary appliance | PHP/MySQL |
| **API** | REST + GraphQL | REST + GraphQL | RESTful + WAPI | RESTful | REST |
| **IPv4/IPv6** | Full parity | Full parity | Full parity | Full parity | Full parity |
| **VRF Support** | Yes (with duplicate enforcement) | Yes | Yes (with views) | Yes | Yes |
| **DHCP Management** | No (IPAM only) | No (IPAM only) | Yes (integrated) | Yes (integrated) | No (IPAM only) |
| **DNS Management** | No (IPAM only) | No (IPAM only) | Yes (integrated) | Yes (integrated) | PowerDNS integration |
| **High Availability** | Application-level (DB replication) | Application-level | Grid architecture (native) | Hub-and-spoke (native) | Manual (DB replication) |
| **Scale** | Thousands of prefixes | Thousands of prefixes | Millions of objects, grid | 1000+ managed servers | Small-medium networks |
| **Automation** | Webhooks, custom scripts | Jobs, plugins, workflows | Ansible/Terraform modules | API-first, orchestration | Limited scripting |
| **Cost** | Free (self-hosted) | Free (self-hosted) | \$\$\$\$ (enterprise licensing) | \$\$\$\$ (enterprise licensing) | Free (self-hosted) |
| **Best For** | Infrastructure source of truth | Automation-heavy NetOps | Large enterprise DDI | Enterprise DDI with observability | Small teams, quick deployment |

### 3.2 NetBox (Open Source Standard)

NetBox is the de facto open source IPAM and data center infrastructure management platform. Originally developed at DigitalOcean by Jeremy Stretch, it is now maintained by NetBox Labs with an active community of contributors.

**Architecture:** Python/Django application backed by PostgreSQL. Deployable via Docker, bare-metal, or as NetBox Cloud (managed service from NetBox Labs). The REST API provides full CRUD operations on all object types with OpenAPI documentation. A complementary GraphQL API enables complex queries with field-level precision.

**IPAM Object Hierarchy:**

```
RIR (Regional Internet Registry)
  +-- Aggregate (allocated block, e.g., 10.0.0.0/8)
       +-- Prefix (subnet, e.g., 10.1.0.0/24)
            +-- IP Range (e.g., 10.1.0.100-10.1.0.200)
            +-- IP Address (e.g., 10.1.0.1/24)
```

Each prefix carries a status (Active, Reserved, Deprecated, Container) and can be assigned to a VRF. VRFs enforce uniqueness constraints independently -- a VRF configured for unique enforcement will reject duplicate prefixes, while a permissive VRF allows overlapping space for multi-tenant environments.

**Version 4.5 Key Features (January 2026):**
- Cable Profiles with many-to-many port mappings for structured cabling documentation
- Native user and group ownership model for objects
- Rebuilt API token system with scoped permissions
- MAC addresses as independent first-class objects
- VLAN translation policy modeling

**Integration Pattern:**
NetBox serves as the source of truth; operational systems (DHCP servers, DNS servers, firewalls) consume NetBox data through API synchronization. NetBox does not directly manage DHCP or DNS services -- it records the intended state, and external tools reconcile actual state. This separation is a deliberate architectural choice: NetBox is a planning and documentation system, not a control plane.

### 3.3 Nautobot (Automation-Focused Fork)

Nautobot was forked from NetBox in early 2021 by Network to Code to address perceived gaps in extensibility and automation capability. While it shares NetBox's core data model, it diverges in philosophy and architecture.

**Key Differentiators from NetBox:**
- **Job system:** First-class support for scheduled and on-demand automation jobs within the platform, replacing NetBox's simpler custom scripts
- **Plugin ecosystem (Apps):** Deeper plugin architecture allowing plugins to extend the data model, add views, register API endpoints, and hook into event processing
- **GraphQL:** Native GraphQL API (also now present in NetBox 4.x)
- **Git-backed data sources:** Configuration contexts and jobs can be stored in Git repositories, enabling GitOps workflows
- **Distributed job execution:** Support for Celery-based distributed task queues for large-scale automation

**When to Choose Nautobot Over NetBox:**
Select Nautobot when the primary use case is network automation orchestration rather than infrastructure documentation. Organizations that need to embed complex workflows (provisioning, compliance checks, remediation scripts) directly into their source of truth benefit from Nautobot's job system. However, this power comes with higher operational complexity: Nautobot requires Redis, Celery workers, and more careful capacity planning than a basic NetBox deployment.

### 3.4 Infoblox (Enterprise DDI)

Infoblox NIOS DDI is the market-leading commercial DDI platform for large enterprises. Its defining architectural feature is the Grid: a patented clustering technology that links diverse appliances (physical, virtual, cloud-hosted) into a unified management fabric.

**Grid Architecture:**
A Grid Master (or Grid Master Candidate for HA) serves as the central control point. Grid Members handle DNS/DHCP/IPAM workloads distributed across sites. Configuration changes propagate automatically through the Grid, ensuring consistency. Grid Members can operate independently during connectivity loss to the Grid Master, providing resilience for branch offices.

**IPAM Features:**
- Network discovery and automated device fingerprinting
- Real-time DHCP lease visibility with MAC-to-IP correlation
- Extensible attributes (custom metadata on any object)
- Smart folders for dynamic grouping of IP objects
- Role-based access control at the object level
- Terraform and Ansible integration modules for infrastructure-as-code workflows

**Universal DDI (2025 Evolution):**
Infoblox has introduced Universal DDI as a cloud-native complement to NIOS, offering SaaS-delivered DNS/DHCP/IPAM with Network Perspective views for utilization analysis across on-premises and cloud environments. This represents the vendor's strategy for hybrid infrastructure management without requiring on-premises appliance deployment.

### 3.5 BlueCat Integrity (DDI with Observability)

BlueCat Integrity positions itself as an enterprise DDI platform with strong observability and API-first design.

**Architecture:** Hub-and-spoke model where BlueCat Address Manager (BAM) serves as the central management hub and BlueCat DNS/DHCP Servers (BDDS) operate at distributed sites. A single BAM instance can manage over 1,000 BDDS appliances.

**Distinguishing Features:**
- **Integrity X (2025):** Real-time, always-on DDI metrics using native Prometheus-based telemetry. No polling delays or third-party plugins required. This addresses a long-standing gap where DDI health monitoring required separate tooling.
- **Phased upgrades:** N-2 release support allows staggered firmware updates across distributed infrastructure without service disruption.
- **API-first design:** RESTful APIs with OpenAPI specifications for full automation of DDI lifecycle operations.

### 3.6 phpIPAM (Lightweight)

phpIPAM is a PHP/MySQL application designed for organizations that need basic IP address management without the overhead of a full DDI platform or enterprise licensing costs.

**Strengths:** Rapid deployment (single LAMP/LEMP stack), intuitive web interface, subnet visualization with utilization heat maps, VLAN and VRF tracking, PowerDNS integration for basic DDI, REST API for automation, and active development (v1.7.4 as of November 2025).

**Limitations:** No native DHCP management, no built-in high availability, limited scalability for very large networks (tens of thousands of subnets), and a smaller plugin ecosystem compared to NetBox or Nautobot.

**Best Use Case:** Small to mid-size organizations migrating from spreadsheet-based IP tracking to a proper IPAM tool. phpIPAM provides immediate value with minimal operational overhead.

---

## 4. DHCP Operations at Scale

### 4.1 Server Platform Comparison

| Feature | ISC Kea | ISC DHCP (EOL) | Windows DHCP | Infoblox/BlueCat |
|---|---|---|---|---|
| **Status** | Active (v3.0.0 LTS, June 2025) | End of Life (2022) | Active (Server 2022+) | Active (commercial) |
| **Protocol** | DHCPv4 + DHCPv6 | DHCPv4 + DHCPv6 | DHCPv4 + DHCPv6 | DHCPv4 + DHCPv6 |
| **Config Backend** | JSON file, MySQL, PostgreSQL | Text file (dhcpd.conf) | Active Directory / MMC | Proprietary (appliance) |
| **Hot Reconfiguration** | Yes (API-driven, no restart) | No (requires restart) | Partial (some changes live) | Yes (Grid propagation) |
| **High Availability** | Hook-based HA (hot-standby, load-balancing) | Failover protocol (RFC draft) | Failover (split-scope, hot-standby) | Native Grid HA |
| **Performance** | Multi-threaded, high throughput | Single-threaded | Moderate | Appliance-optimized |
| **Hooks/Extensions** | C++ hook libraries (12+ open source in v3.0) | Limited scripting | PowerShell | Vendor extensions |
| **Management UI** | Stork (separate tool) | None | DHCP MMC / PowerShell | Integrated web UI |

### 4.2 ISC Kea: The Modern Standard

ISC DHCP reached end of life in 2022 and must not be used for new deployments. ISC Kea is its designated successor. Kea 3.0.0, released in June 2025, is the first Long-Term Support (LTS) release with a three-year support window.

**Critical Migration Note:** As of Kea 3.0.0, all hook libraries except RBAC and Configuration Backend are now open source, eliminating the previous distinction between free and premium features. This is a significant change from earlier versions where high-availability and RADIUS hooks required commercial support subscriptions.

**Key Operational Concepts:**

**Scopes and Shared Networks:** Kea organizes address pools within subnets. Multiple subnets serving the same physical link are grouped as shared networks -- essential for environments where a single broadcast domain requires multiple address ranges (common during network migrations or when expanding capacity without re-subnetting).

**Reservations:** Host reservations in Kea support identification by hardware address (MAC), DUID (DHCPv6), client-id, circuit-id, or flex-id. Reservations can be stored in the JSON configuration file or in a database backend (MySQL/PostgreSQL) for dynamic management via the Kea API.

**Failover (High Availability Hook):** Kea's HA hook supports three modes:
1. **Hot-standby:** One active server, one standby. Standby takes over on failure detection. Simple and predictable.
2. **Load-balancing:** Both servers actively serve leases, splitting the pool. Provides capacity scaling and redundancy simultaneously.
3. **Passive-backup:** Primary serves all leases, backup receives lease updates for cold failover. Suitable for disaster recovery topologies.

Lease synchronization between HA peers uses the Kea API over HTTPS, not a custom protocol. This means standard network monitoring and troubleshooting tools apply to the replication channel.

**Stork Management:** ISC Stork is a companion application that provides a web-based management interface for monitoring and configuring Kea servers. It aggregates lease data, subnet utilization metrics, and HA status across a fleet of Kea instances.

### 4.3 DHCP Relay Agents

In routed networks where DHCP clients and servers reside on different subnets, relay agents (IP helpers) forward DHCP broadcasts across layer 3 boundaries.

**Configuration Pattern (Cisco IOS):**
```
interface Vlan100
  ip address 10.1.100.1 255.255.255.0
  ip helper-address 10.255.0.10    ! Primary DHCP server
  ip helper-address 10.255.0.11    ! Secondary DHCP server
```

**Operational Concerns:**
- Each `ip helper-address` directive forwards broadcasts to the specified server. With HA pairs, configure both servers as helpers on every client-facing interface.
- Relay agents insert the Gateway IP Address (giaddr) field, which the DHCP server uses to select the correct scope. A missing or incorrect giaddr results in no available pool, producing silent DHCP failures that are difficult to diagnose without server-side logging.
- In multi-VRF environments, the relay agent must be VRF-aware, forwarding within the correct routing context. Misconfigured VRF relay is a common source of "DHCP not working on new VLAN" incidents.

### 4.4 Windows DHCP Server

Windows DHCP Server remains prevalent in Microsoft-centric enterprise environments, integrated with Active Directory for authorization and managed through the DHCP MMC snap-in or PowerShell.

**Failover Modes:**
- **Hot Standby:** One server handles all requests; partner takes over after Maximum Client Lead Time (MCLT) expires. Appropriate for hub-and-spoke topologies.
- **Load Sharing:** Both servers respond to requests with configurable percentage split (default 50/50). Better utilization of both servers but requires careful monitoring.

**Scale Consideration:** Windows DHCP supports split-scope and failover relationships but lacks the granular hook extensibility of Kea. For environments exceeding 500 scopes or requiring custom lease logic (MAC-based policy, RADIUS integration), Kea or commercial DDI solutions are more appropriate.

---

## 5. IPv4 Exhaustion Strategies

### 5.1 Current State of IPv4 Exhaustion

All five Regional Internet Registries (RIRs) have exhausted their general allocation pools. ARIN's free pool was depleted in September 2015. RIPE NCC made its final /22 allocation from the last /8 block in November 2019. Organizations requiring new IPv4 space must acquire it through the transfer market or implement conservation strategies.

### 5.2 NAT Overload (PAT)

Network Address Translation with Port Address Translation (NAT overload, also called NAPT) maps multiple internal RFC 1918 addresses to a single or small pool of public addresses using unique source port numbers.

**RFC 1918 Private Address Ranges:**

| Block | Range | CIDR | Addresses |
|---|---|---|---|
| 10.0.0.0/8 | 10.0.0.0 - 10.255.255.255 | /8 | 16,777,216 |
| 172.16.0.0/12 | 172.16.0.0 - 172.31.255.255 | /12 | 1,048,576 |
| 192.168.0.0/16 | 192.168.0.0 - 192.168.255.255 | /16 | 65,536 |

**Overlap Problems:** Mergers, acquisitions, and VPN interconnections frequently expose RFC 1918 overlap: two organizations both using 10.0.0.0/8 internally cannot route to each other without NAT translation at the boundary. Overlap resolution typically requires re-addressing one side (expensive, disruptive) or deploying twice-NAT (complex, application-breaking for protocols that embed IP addresses in payloads like SIP, FTP active mode, or IPsec without NAT-T).

### 5.3 Carrier-Grade NAT (CGNAT)

CGNAT (RFC 6598) introduces a NAT layer within the service provider network, translating subscriber addresses from the shared address space (100.64.0.0/10) to a pool of public IPv4 addresses.

**RFC 6598 Shared Address Space (100.64.0.0/10):**
- 4,194,304 addresses reserved for ISP-to-CPE links behind CGNAT
- Must not be used on the public Internet or leaked into BGP
- Explicitly not for end-user assignment -- exists solely for the SP-to-subscriber link segment

**Operational Problems with CGNAT:**
- **Port forwarding impossible:** Subscribers behind CGNAT cannot host inbound services. No amount of CPE configuration resolves this because the public IP is shared.
- **IP attribution failure:** Multiple subscribers share a single public IP. Law enforcement and abuse handling require port-level timestamp logs to identify individual subscribers. Without these logs, attribution is impossible.
- **Application breakage:** Protocols that assume a unique public IP (gaming, peer-to-peer, some VPN topologies, WebRTC STUN) fail or degrade behind CGNAT.
- **Geolocation inaccuracy:** IP-based geolocation maps to the CGNAT pool location, not the subscriber's actual location.
- **Session table exhaustion:** CGNAT devices must maintain state for every translated flow. High-bandwidth, many-connection users (BitTorrent, IoT fleets) can exhaust CGNAT session tables, affecting other subscribers sharing the same device.

### 5.4 Address Reclamation Audits

Before purchasing IPv4 space on the open market, organizations should audit their existing allocations for reclaimable addresses.

**Audit Methodology:**
1. **Export all allocated prefixes** from the IPAM system with utilization percentages
2. **Identify under-utilized subnets** (below 50% utilization for /24 and larger)
3. **Scan for dark space** -- allocated but with zero active hosts (ping sweep, ARP table analysis, DHCP lease review)
4. **Review legacy allocations** -- subnets assigned to decommissioned projects, test labs, or former acquisitions
5. **Analyze reservation waste** -- DHCP reservations for devices no longer on the network
6. **Check for over-provisioned subnets** -- a /22 (1,024 addresses) serving 50 hosts should be re-subnetted to a /26 (64 addresses)

**Expected Recovery:** In mature enterprises, address reclamation audits typically recover 15-30% of allocated IPv4 space through consolidation and cleanup.

### 5.5 IPv4 Market Pricing (2025-2026)

The IPv4 transfer market has experienced significant price volatility:

| Period | /24 Price (per IP) | /16 Price (per IP) | Trend |
|---|---|---|---|
| 2021 Peak | $50-60 | $45-55 | Rising sharply |
| 2023 | $35-45 | $25-35 | Plateau |
| Mid-2025 | $35-45 | Below $20 | Declining |
| Q1 2026 | $35-45 (small blocks) | $9-15 (large blocks) | Accelerating decline |

The price decline reflects growing IPv6 adoption reducing demand, cloud providers offering IPv6-only services at lower cost, and increased supply as organizations release unused legacy allocations. However, small blocks (/24) retain a premium because they are the minimum BGP-routable prefix size. Lease rates remain in the $0.30-0.50/IP/month range for ARIN and RIPE regions, with APNIC commanding higher rates ($0.60+/IP/month) due to regional supply constraints.

**Recommendation:** For organizations needing new IPv4 capacity, lease before purchasing. The declining market makes large purchases a depreciating asset. Invest capital in IPv6 deployment instead.

---

## 6. IPv6 Transition Operations

### 6.1 Transition Strategy Comparison

| Strategy | Mechanism | IPv4 Required | Complexity | Best For |
|---|---|---|---|---|
| **Dual-Stack** | Run IPv4 and IPv6 simultaneously | Yes (full) | Low | Gradual transition, broad compatibility |
| **NAT64 + DNS64** | Translate IPv6 to IPv4 at network edge | Yes (NAT pool only) | Medium | IPv6-primary networks accessing IPv4 resources |
| **464XLAT** | Client-side CLAT + network NAT64 | Yes (NAT pool only) | Medium-High | Mobile networks, IPv6-only with legacy app support |
| **DS-Lite** | IPv4-in-IPv6 tunnel to CGNAT | Yes (CGNAT pool) | High | ISP networks conserving IPv4 |
| **MAP-E / MAP-T** | Stateless IPv4-over-IPv6 | Yes (shared) | High | ISP scale without per-flow state |

### 6.2 Dual-Stack

Dual-stack is the simplest transition strategy: every device and interface runs both IPv4 and IPv6 concurrently. Routing protocols (OSPF/OSPFv3, EIGRP, BGP) advertise both address families. DNS returns both A and AAAA records, and clients prefer IPv6 per RFC 6724 source address selection rules.

**Operational Cost:** Dual-stack doubles the address management workload. Every subnet needs both an IPv4 allocation and an IPv6 allocation. DHCP infrastructure must serve both protocols. Firewall rules must be maintained in parallel. Monitoring must cover both stacks. This is the cost of backward compatibility.

**When Dual-Stack Ends:** The goal of dual-stack is to eventually disable IPv4. This is viable only when all critical services are reachable over IPv6 and all client devices support IPv6-only operation with NAT64 fallback.

### 6.3 NAT64 and DNS64

NAT64 translates IPv6 packets to IPv4 packets at a stateful translation device, enabling IPv6-only clients to reach IPv4-only servers. DNS64 synthesizes AAAA records for IPv4-only destinations by embedding the IPv4 address within a well-known IPv6 prefix (typically 64:ff9b::/96).

**How It Works:**
1. IPv6-only client queries DNS for `legacy-server.example.com`
2. DNS64 server queries upstream DNS and finds only an A record: `198.51.100.42`
3. DNS64 synthesizes an AAAA record: `64:ff9b::c633:642a` (198.51.100.42 embedded)
4. Client sends IPv6 packet to `64:ff9b::c633:642a`
5. NAT64 device translates to IPv4 packet destined to `198.51.100.42`

**Critical Limitation:** DNS64 requires hostname-based access. If an application connects to a literal IPv4 address (e.g., `https://172.16.21.12`), DNS64 is never invoked and the connection fails. This is where 464XLAT becomes necessary.

### 6.4 464XLAT (RFC 6877)

464XLAT addresses the literal IPv4 address problem by adding a Customer-side Translator (CLAT) on the client device. The CLAT performs stateless NAT46 translation: it takes IPv4 packets from legacy applications, wraps them in IPv6 using the NAT64 prefix, and sends them to the network-side NAT64 (PLAT) for final translation.

**Deployment Model:**
```
[Legacy IPv4 App] --> [CLAT on client] --> [IPv6-only network] --> [PLAT/NAT64] --> [IPv4 Internet]
```

Android, iOS, Windows 10+, and macOS all support CLAT natively, making 464XLAT the preferred mechanism for mobile and enterprise IPv6-only deployments where legacy application compatibility is required.

### 6.5 SLAAC vs DHCPv6

| Feature | SLAAC | Stateless DHCPv6 | Stateful DHCPv6 |
|---|---|---|---|
| **Address Assignment** | Auto (EUI-64 or privacy extensions) | Router provides prefix; options from DHCPv6 | DHCPv6 server assigns address |
| **DNS Configuration** | RDNSS option in RA (RFC 8106) | DHCPv6 provides DNS | DHCPv6 provides DNS |
| **Address Tracking** | None (no server-side log) | None (addresses self-generated) | Full lease log on server |
| **Prefix Delegation** | No | No | Yes (RFC 8415) |
| **Client Support** | Universal | Nearly universal | Android: not supported for address assignment |
| **Router Flags** | M=0, O=0 | M=0, O=1 | M=1 |
| **Enterprise Use** | IoT, simple networks | Moderate (SLAAC + DNS/NTP from DHCPv6) | Recommended for auditable environments |

**The Android Problem:** Android does not support DHCPv6 for address assignment. It relies exclusively on SLAAC. This forces enterprise networks to deploy SLAAC (or SLAAC + stateless DHCPv6 for DNS) on any network segment where Android devices are present. For environments requiring full address tracking, this creates a compliance gap that must be addressed through alternative monitoring (NDP snooping, flow analysis, or neighbor table polling).

**Enterprise Recommendation:** Deploy SLAAC with stateless DHCPv6 (M=0, O=1) as the baseline. Use RDNSS in Router Advertisements as a fallback for devices that do not support DHCPv6 options. For server networks and infrastructure segments (no Android devices), use stateful DHCPv6 for full address control and audit logging.

### 6.6 Prefix Delegation (PD)

IPv6 Prefix Delegation (RFC 8415, formerly RFC 3633) enables an upstream router or DHCPv6 server to delegate an entire prefix (commonly /48 or /56) to a downstream router, which then sub-allocates /64 subnets to its local interfaces.

**Common Delegation Hierarchy:**
```
ISP assigns:        2001:db8:abcd::/48    (to customer)
Customer delegates: 2001:db8:abcd:0100::/56  (to branch office)
Branch subnets:     2001:db8:abcd:0100::/64  (VLAN 100)
                    2001:db8:abcd:0101::/64  (VLAN 101)
                    ...
                    2001:db8:abcd:01ff::/64  (VLAN 255)
```

Prefix delegation automates downstream subnet provisioning, eliminating manual allocation for branch offices and reducing the IPAM operational burden.

---

## 7. Subnet Planning

### 7.1 Hierarchical Allocation Design

Effective subnet planning begins at the top of the address hierarchy and works downward, preserving summarization at every tier.

**Design Principles:**
1. **Allocate from the top down:** Assign large blocks to regions/sites first, then subdivide within each site
2. **Preserve contiguity:** Keep allocations within a site contiguous so they can be summarized in routing
3. **Leave growth room:** Do not allocate 100% of a parent block. Reserve at least 50% for future growth at each tier
4. **Align to bit boundaries:** Subnets should fall on natural binary boundaries for clean summarization

**Example: Enterprise IPv4 Allocation (10.0.0.0/8)**

```
10.0.0.0/8          Enterprise supernet
  10.0.0.0/11       Region: North America (2M addresses)
    10.0.0.0/14     Site: Seattle HQ (256K addresses)
      10.0.0.0/16   Campus: Main (65K addresses)
        10.0.0.0/22     Server VLAN block (1,024 addresses)
        10.0.4.0/22     User VLAN block (1,024 addresses)
        10.0.8.0/22     Voice VLAN block (1,024 addresses)
        10.0.12.0/22    Management VLAN block (1,024 addresses)
        10.0.16.0/20    Reserved for growth (4,096 addresses)
      10.1.0.0/16   Campus: Eastside (65K addresses)
    10.4.0.0/14     Site: Portland (256K addresses)
    10.8.0.0/13     Reserved for NA growth
  10.32.0.0/11      Region: Europe (2M addresses)
  10.64.0.0/10      Reserved for future regions
```

### 7.2 VLSM (Variable-Length Subnet Masking)

VLSM allows different subnets within the same address block to use different prefix lengths, matching subnet size to actual host requirements.

**Common Subnet Sizing:**

| Prefix | Hosts (usable) | Typical Use |
|---|---|---|
| /31 | 2 (point-to-point, RFC 3021) | Router-to-router links |
| /30 | 2 (traditional point-to-point) | Legacy router links |
| /28 | 14 | Small management VLANs |
| /27 | 30 | Department VLANs (small) |
| /26 | 62 | Department VLANs (medium) |
| /25 | 126 | Floor VLANs |
| /24 | 254 | Standard user VLAN |
| /23 | 510 | Large user VLAN |
| /22 | 1,022 | Wireless VLANs, large floors |

### 7.3 /31 for Point-to-Point Links (RFC 3021)

RFC 3021 permits /31 subnets on point-to-point links, eliminating the two-address waste (network and broadcast) of traditional /30 subnets. Both addresses in the /31 are usable as host addresses.

**Savings Example:** A network with 500 point-to-point router links:
- /30 subnets: 500 x 4 = 2,000 addresses consumed (1,000 wasted)
- /31 subnets: 500 x 2 = 1,000 addresses consumed (0 wasted)
- Recovery: 1,000 addresses (four /22 subnets)

All modern routing platforms (Cisco IOS/IOS-XE/NX-OS, Juniper Junos, Arista EOS) support /31 subnets. Use /31 for all new point-to-point links. Reserve /30 only for legacy devices that do not support RFC 3021.

### 7.4 Summarization-Friendly Design

The ultimate test of subnet planning quality is summarization: can the entire address space of a site be represented as a single route at the aggregation boundary?

**Good Design (summarizable):**
```
Site A: 10.0.0.0/16 (single summary to core)
  10.0.0.0/24 - VLAN 10
  10.0.1.0/24 - VLAN 20
  10.0.2.0/24 - VLAN 30
  10.0.3.0/24 - VLAN 40
```

**Bad Design (unsummarizable):**
```
Site A (scattered allocations):
  10.0.0.0/24   - VLAN 10
  10.5.7.0/24   - VLAN 20 (different /8 region)
  172.16.3.0/24 - VLAN 30 (different RFC 1918 block entirely)
  10.99.0.0/24  - VLAN 40 (distant from other allocations)
```

The bad design requires four separate routes at the aggregation boundary instead of one, bloating routing tables and making access control lists unwieldy.

---

## 8. DNS Integration with IPAM (DDI)

### 8.1 The DDI Model

DDI (DNS/DHCP/IPAM) unifies the three core network service databases into a single management plane. When a DHCP lease is granted, the IPAM record is updated and forward/reverse DNS records are created automatically. When a lease expires, the DNS records are cleaned up. This automation eliminates the manual record maintenance that causes stale DNS entries and PTR/A record mismatches.

### 8.2 Forward and Reverse Zone Automation

**Forward Zone (A/AAAA Records):**
When a DHCP client obtains a lease, the DDI system creates (or updates) an A record mapping the client's hostname to its assigned IP address. In DHCPv6 or SLAAC environments, AAAA records are created similarly.

**Reverse Zone (PTR Records):**
Simultaneously, a PTR record is created in the appropriate in-addr.arpa (IPv4) or ip6.arpa (IPv6) zone. PTR records are critical for mail server reputation (SPF/DKIM verification often includes reverse DNS checks), security forensics (mapping IPs to hostnames in logs), and operational troubleshooting.

**DDNS (Dynamic DNS) Without DDI:**
Organizations without commercial DDI can achieve similar automation using ISC Kea's DDNS update capability (kea-dhcp-ddns daemon) or Windows DHCP's built-in dynamic DNS update feature. These systems send RFC 2136 dynamic update messages to authoritative DNS servers (BIND, Windows DNS, Knot DNS) to create and delete records corresponding to lease events.

**Stale Record Cleanup:**
The most common failure mode in DDNS is stale records: a host is decommissioned or moves to a new IP, but its old DNS records persist. DDI platforms address this through lease-linked record lifecycle (records automatically deleted when leases expire) and scavenging intervals (periodic sweeps that remove records older than a configured threshold). Without DDI, configure DNS scavenging (Windows) or set TTLs low enough that stale records expire within an acceptable window.

### 8.3 DDI Product Comparison

| Capability | Infoblox NIOS | BlueCat Integrity | NetBox + Kea + BIND | phpIPAM + PowerDNS |
|---|---|---|---|---|
| Unified UI | Yes | Yes | No (separate tools) | Partial |
| Auto forward DNS | Yes | Yes | Via kea-dhcp-ddns | Manual/scripted |
| Auto reverse DNS | Yes | Yes | Via kea-dhcp-ddns | Manual/scripted |
| Lease-linked cleanup | Yes | Yes | Configurable | No |
| Conflict detection | Built-in | Built-in | External tooling | No |
| Multi-site sync | Grid architecture | Hub-and-spoke | Custom (API sync) | No |

---

## 9. IP Conflict Detection and Resolution

### 9.1 How IP Conflicts Occur

| Cause | Mechanism | Frequency |
|---|---|---|
| Static assignment overlap | Two devices manually assigned the same IP | Common |
| DHCP scope overlap | Two DHCP servers serving the same range | Occasional |
| Rogue DHCP server | Unauthorized device offering leases | Occasional |
| Stale DHCP reservation | Reservation points to an IP now used by another device | Common |
| VM cloning | Cloned VM retains donor's static IP | Common in virtualized environments |
| Network merger | Two networks with overlapping RFC 1918 space connected | During M&A |

### 9.2 Detection Methods

**IPv4 -- ARP-Based Detection:**
- **Gratuitous ARP:** A device broadcasts an ARP reply for its own IP at interface initialization. If another device has the same IP, it responds, indicating a conflict. However, gratuitous ARP is not a reliable detection mechanism -- it depends on the conflicting device being active and responsive at the exact moment of the broadcast.
- **ARP Probe (RFC 5227):** Before claiming an address, a device sends ARP probes (sender IP 0.0.0.0, target IP = desired address). If a response is received, the address is in use. More reliable than gratuitous ARP but only effective at address acquisition time.
- **ARP Table Monitoring:** Continuous monitoring of switch and router ARP tables for multiple MAC addresses claiming the same IP. This is the most reliable ongoing detection method.

**IPv6 -- Duplicate Address Detection (DAD):**
DAD is a mandatory part of IPv6 address configuration (RFC 4862). Before using any address, a node sends a Neighbor Solicitation for that address. If a Neighbor Advertisement is received, the address is a duplicate and must not be used. DAD runs automatically -- it is not optional in compliant IPv6 stacks.

**DHCP Lease Cross-Reference:**
DHCP servers can detect conflicts by checking whether an IP is already in their lease database before offering it. Kea's Ping Check hook library (open source since v3.0.0) actively pings an address before assignment, replicating a feature that was present in ISC DHCP.

**Dedicated Tools:**
- **ManageEngine OpUtils:** Automated network scanning with SNMP-based conflict detection across VLANs
- **IPwatchD:** Linux daemon that monitors ARP traffic and alerts on duplicate address events
- **IPAM platform alerts:** NetBox, Infoblox, and BlueCat all provide address conflict dashboards and automated alerting

### 9.3 Resolution Procedure

1. **Identify both devices:** Cross-reference the conflicting IP in ARP tables to find both MAC addresses. Look up MAC addresses in the IPAM system and/or switch port tables (MAC address table) to identify physical or virtual devices.
2. **Determine which assignment is authoritative:** Check the IPAM system for the intended assignment. The device matching the IPAM record keeps the address.
3. **Release the conflicting assignment:** If DHCP-assigned, release and renew the conflicting device's lease. If static, reconfigure the unauthorized device to DHCP or a different static address.
4. **Update IPAM records:** Ensure the resolved state matches the IPAM source of truth.
5. **Root-cause prevention:** Add the IP as a DHCP reservation (if it should be static) or add the subnet to a DHCP exclusion range (if it is statically assigned infrastructure).

---

## 10. Compliance Requirements for IP Tracking

### 10.1 Regulatory Framework Requirements

| Framework | Requirement | IP Tracking Implication | Log Retention |
|---|---|---|---|
| **PCI DSS 4.0** | Req 10: Log and monitor all access to network resources and cardholder data | Track IP-to-user associations for all systems in CDE scope | 12 months minimum |
| **HIPAA** | 164.312(b): Audit controls | Record IP assignments for systems accessing ePHI | 6 years |
| **SOX** | Section 302/404: Internal controls over financial reporting | IP-to-device mapping for systems processing financial data | 7 years |
| **GDPR** | Art. 30: Records of processing activities | IP addresses are personal data; track processing purpose | Duration of processing + retention period |
| **NIST 800-53** | AU-3: Content of Audit Records | Source/destination IP in all audit events | Per system categorization |

### 10.2 What an IP Audit Trail Must Contain

A compliant IP assignment log must record:

1. **IP address** assigned
2. **MAC address** of the receiving device
3. **Hostname** (if available via DHCP option 12 or DNS)
4. **Timestamp** of assignment (lease start) and release (lease end)
5. **DHCP server** that issued the lease (for multi-server environments)
6. **User identity** (if 802.1X or NAC provides user-to-device mapping)
7. **Subnet/VLAN** context

**Storage Requirements:** DHCP lease logs must be forwarded to a centralized log management system (SIEM) and retained for the longest applicable regulatory period. For environments subject to multiple frameworks, this is typically 7 years (SOX). Logs must be immutable -- stored in append-only or write-once storage to satisfy audit evidence requirements.

### 10.3 IPAM as Compliance Evidence

A well-maintained IPAM system serves as direct compliance evidence:

- **Asset inventory:** Maps IP addresses to devices, satisfying asset management controls (NIST CM-8, PCI Req 12.5.1)
- **Network segmentation verification:** Demonstrates that cardholder data environment (CDE) subnets are isolated from general-purpose networks (PCI Req 1.2)
- **Change documentation:** IPAM changelog provides evidence that IP allocation changes follow change management processes (NIST CM-3)
- **Scope reduction:** Accurate IP tracking helps auditors understand which systems are in-scope, reducing audit burden

---

## 11. Operational Procedures

### 11.1 New Subnet Request Workflow

1. Requestor submits ticket specifying: purpose, estimated host count, site/building, VLAN requirement, VRF context, IPv6 requirement
2. IPAM administrator allocates from the next available contiguous block within the site's assigned supernet
3. Prefix is created in IPAM with status "Reserved," associated VLAN, and description
4. Network engineer configures the subnet on router/switch interfaces, DHCP scope, and DNS zones
5. IPAM status updated to "Active"
6. Requestor validates connectivity
7. Ticket closed with IPAM record link

### 11.2 Periodic IPAM Hygiene Tasks

| Task | Frequency | Method |
|---|---|---|
| Utilization review | Monthly | Export subnet utilization report; flag subnets > 80% (growth risk) and < 20% (reclamation candidate) |
| Stale record cleanup | Monthly | Compare IPAM records against active ARP/ND tables; remove entries with no activity for 90+ days |
| DHCP lease database audit | Quarterly | Compare DHCP active leases against IPAM records; reconcile discrepancies |
| Reserved IP review | Quarterly | Verify all DHCP reservations are still needed; remove reservations for decommissioned devices |
| Subnet reclamation | Semi-annually | Identify unused or under-utilized subnets; consolidate and return space to free pool |
| Compliance log verification | Annually | Confirm DHCP lease logs are being forwarded to SIEM and retained per policy |

### 11.3 IP Address Request SLA

| Request Type | Target SLA | Notes |
|---|---|---|
| Single IP reservation | 4 hours | From DHCP pool or static assignment |
| New DHCP scope | 1 business day | Requires VLAN provisioning coordination |
| New subnet allocation | 2 business days | Requires routing and firewall changes |
| IPv6 prefix delegation | 2 business days | Requires router configuration |
| Address reclamation project | 2-4 weeks | Audit, notification, decommission cycle |

---

## 12. Related Documents

- **M1:** Network Monitoring & Alerting (IPAM system monitoring integration)
- **M2:** Network Change Operations (subnet provisioning change management)
- **M5:** Certificate & PKI Operations (IP-based certificate SANs)
- **M7:** Firewall & ACL Operations (IP object groups in firewall rules)
- **M9:** Network Documentation & CMDB (IPAM as CMDB data source)
- **M10:** Network Team & Vendor Management (IPAM tool vendor relationships)

---

## 13. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-04-08 | SNO Research Series | Initial publication |

---

*Systems Network Operations -- PNW Research Series -- Artemis II Mission Research*
