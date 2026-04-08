# Cloud Networking

> **Domain:** Cloud Infrastructure and Virtual Network Engineering
> **Module:** 6 -- VPC Design, Transit Connectivity, Private Endpoints, Hybrid Interconnect, and Multi-Cloud Networking
> **Through-line:** *The public internet was never designed for production workloads. Every cloud provider reinvented the network -- VPCs, security groups, transit gateways, private links -- because the fundamental problem hasn't changed since ARPANET: how do you connect systems that need to talk while keeping systems that shouldn't talk apart? The engineering discipline is the same whether you're wiring a campus or designing a VPC. What changes is the abstraction layer, the billing model, and the blast radius of a misconfiguration.*

---

## Table of Contents

1. [VPC Design Patterns](#1-vpc-design-patterns)
2. [CIDR Planning and IP Address Management](#2-cidr-planning-and-ip-address-management)
3. [Subnet Strategy](#3-subnet-strategy)
4. [Transit Gateways and Hub-Spoke Architecture](#4-transit-gateways-and-hub-spoke-architecture)
5. [Private Connectivity Services](#5-private-connectivity-services)
6. [Hybrid Connectivity](#6-hybrid-connectivity)
7. [Cloud Firewalls and Security Groups](#7-cloud-firewalls-and-security-groups)
8. [Service Mesh Networking](#8-service-mesh-networking)
9. [Container Networking](#9-container-networking)
10. [Cross-Cloud Networking](#10-cross-cloud-networking)
11. [Cloud Network Cost Optimization](#11-cloud-network-cost-optimization)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. VPC Design Patterns

A Virtual Private Cloud is the foundational network construct in every major cloud provider. It defines an isolated layer-3 network -- a broadcast domain with its own routing table, firewall rules, and IP address space. The terminology varies (AWS calls it VPC, Azure calls it VNet, GCP calls it VPC), but the concept is identical: a software-defined network boundary that isolates workloads from the rest of the cloud [1].

### Single-Account, Single-VPC

The simplest pattern. One AWS account or GCP project hosts a single VPC containing all workloads. Acceptable for prototypes and small teams but collapses under any real organizational complexity. The blast radius of a misconfiguration is the entire network. There is no administrative isolation between teams.

### Single-Account, Multi-VPC

Workloads separated into purpose-specific VPCs within one account: production, staging, development, shared services. Network isolation exists but administrative isolation does not -- any IAM principal with sufficient permissions in the account can modify any VPC. This pattern works for small organizations but creates governance challenges at scale.

### Multi-Account, Multi-VPC

The enterprise standard. Each AWS account (or Azure subscription, or GCP project) owns its VPCs. Organizational hierarchy maps to account hierarchy: a production account contains production VPCs, a security account contains centralized logging and inspection VPCs, a shared services account hosts DNS, directory services, and transit networking [1].

```
MULTI-ACCOUNT HUB-SPOKE NETWORK ARCHITECTURE
=====================================================================

  Management Account (Org Root)
  +---------------------------------------------------------------+
  | AWS Organizations / Azure Management Group / GCP Org Node     |
  | - Centralized billing                                         |
  | - Service Control Policies / Organization Policies            |
  +-----------------------------+---------------------------------+
                                |
          +---------------------+---------------------+
          |                     |                     |
  Network Account        Security Account      Workload Accounts
  +-----------------+  +------------------+   +------------------+
  | Transit GW      |  | GuardDuty/       |   | Prod VPC         |
  | Direct Connect  |  |   Security Hub   |   | 10.1.0.0/16      |
  | Shared DNS      |  | VPC Flow Log     |   +------------------+
  | VPN endpoints   |  |   aggregation    |   | Staging VPC      |
  | Inspection VPC  |  | CloudTrail       |   | 10.2.0.0/16      |
  | 10.0.0.0/16     |  | SIEM integration |   +------------------+
  +-----------------+  +------------------+   | Dev VPC          |
                                              | 10.3.0.0/16      |
                                              +------------------+
```

This pattern is prescribed by the AWS Well-Architected Framework, Azure Cloud Adoption Framework, and Google Cloud Architecture Framework. The key insight: account-level isolation provides an administrative boundary that VPC-level isolation alone cannot achieve [1].

### Multi-Account Terminology Across Providers

| Concept | AWS | Azure | GCP |
|---|---|---|---|
| Top-level container | Organization | Azure AD Tenant | Organization |
| Administrative unit | Account | Subscription | Project |
| Network boundary | VPC | Virtual Network (VNet) | VPC Network |
| Network grouping | None (use TGW) | Resource Group | Shared VPC Host Project |
| Policy hierarchy | SCPs + OUs | Management Groups | Organization Policies |

---

## 2. CIDR Planning and IP Address Management

CIDR planning is the single most consequential network design decision. An overlapping CIDR block between two VPCs prevents direct routing between them -- no peering, no transit gateway attachment, no VPN. Fixing it requires migrating workloads to a new VPC. The cost of getting this wrong is measured in weeks of migration work [2].

### RFC 1918 Address Space

| Block | Range | Size | Typical Use |
|---|---|---|---|
| 10.0.0.0/8 | 10.0.0.0 -- 10.255.255.255 | 16.7M addresses | Enterprise primary (largest space) |
| 172.16.0.0/12 | 172.16.0.0 -- 172.31.255.255 | 1M addresses | Secondary/overflow |
| 192.168.0.0/16 | 192.168.0.0 -- 192.168.255.255 | 65K addresses | Small deployments, labs |

### CIDR Allocation Strategy

A robust allocation scheme partitions the 10.0.0.0/8 space across organizational boundaries:

```
ENTERPRISE CIDR ALLOCATION SCHEME
=====================================================================

10.0.0.0/8 -- Organization Root
  |
  +-- 10.0.0.0/16 ........ Shared Services / Network Hub
  +-- 10.1.0.0/16 ........ Production Account A
  +-- 10.2.0.0/16 ........ Production Account B
  +-- 10.3.0.0/16 ........ Staging
  +-- 10.4.0.0/16 ........ Development
  +-- 10.5.0.0/16 ........ Security / Inspection
  +-- 10.10.0.0/16 ....... On-Premises DC1 (reserved, never cloud-allocated)
  +-- 10.11.0.0/16 ....... On-Premises DC2 (reserved, never cloud-allocated)
  +-- 10.100.0.0/16 ...... GCP Workloads
  +-- 10.200.0.0/16 ...... Azure Workloads
  +-- 10.240.0.0/16 ...... Partner/Vendor VPNs
```

AWS VPC IP Address Manager (IPAM) automates CIDR allocation and prevents overlaps across multiple accounts and regions. It enforces business rules -- minimum VPC size, maximum allocation per account, region-specific pools -- through organization-wide policies [2].

### Secondary CIDR Ranges

AWS allows up to five secondary CIDR blocks per VPC (expandable to 50). Azure VNets support multiple address spaces natively. GCP VPCs use subnet-based addressing rather than VPC-level CIDR, so each subnet can have its own range and subnets can span regions. The key optimization: use secondary, non-routable CIDR ranges (such as 100.64.0.0/10 -- the carrier-grade NAT range) for internal-only subnets like EKS pod networking, preserving routable RFC 1918 space for workloads that need cross-VPC connectivity [2].

---

## 3. Subnet Strategy

### Subnet Types

| Type | Purpose | Routing | AWS Default |
|---|---|---|---|
| Public | Load balancers, bastion hosts | Route to Internet Gateway | 0.0.0.0/0 -> igw |
| Private | Application servers, databases | Route to NAT Gateway | 0.0.0.0/0 -> nat-gw |
| Isolated | Data stores, compliance | No internet route | Local only + VPC endpoints |
| Transit | TGW/VPN attachments | Route to transit gateway | Provider-specific |

### Availability Zone Distribution

Every production subnet must exist in at least two availability zones. The standard pattern is three subnets per type per VPC (one per AZ in a three-AZ region), yielding 9-12 subnets for a typical production VPC:

```
VPC: 10.1.0.0/16 (Production)
  AZ-a                    AZ-b                    AZ-c
  +------------------+   +------------------+   +------------------+
  | Public           |   | Public           |   | Public           |
  | 10.1.0.0/24      |   | 10.1.1.0/24      |   | 10.1.2.0/24      |
  +------------------+   +------------------+   +------------------+
  | Private          |   | Private          |   | Private          |
  | 10.1.10.0/24     |   | 10.1.11.0/24     |   | 10.1.12.0/24     |
  +------------------+   +------------------+   +------------------+
  | Isolated         |   | Isolated         |   | Isolated         |
  | 10.1.20.0/24     |   | 10.1.21.0/24     |   | 10.1.22.0/24     |
  +------------------+   +------------------+   +------------------+
```

A common mistake: allocating /28 subnets (16 addresses, 11 usable on AWS after reserved addresses) and running out of IPs when auto-scaling triggers. Use /24 (256 addresses) minimum for workload subnets, /20 (4,096 addresses) for EKS pod subnets.

---

## 4. Transit Gateways and Hub-Spoke Architecture

When you have more than 3-5 VPCs that need to communicate, point-to-point peering creates a full mesh -- N*(N-1)/2 connections. Ten VPCs require 45 peering connections. A transit hub collapses this to N connections: one per VPC to the central hub [3].

### Provider Transit Solutions

| Feature | AWS Transit Gateway | Azure Virtual WAN | GCP NCC |
|---|---|---|---|
| Architecture | Regional hub, peered cross-region | Global managed hub-spoke | Global hub with spoke resources |
| Max attachments | 5,000 per TGW | 500 VNets per hub | 1,000 spokes per hub |
| Routing | Static + dynamic (BGP) | Auto-learning + BGP | Dynamic (BGP) |
| Cross-region | Inter-region TGW peering | Built-in global routing | Global by default |
| Inspection | Route to inspection VPC | Azure Firewall integration | Third-party NVA |
| Pricing model | Per-attachment + per-GB | Per-deployment unit | Per-spoke + per-GB |
| VPN integration | Site-to-site VPN attachment | Branch VPN integration | HA VPN spoke |
| SD-WAN support | Third-party via VPN | Native SD-WAN integration | Partner interconnect |

### AWS Transit Gateway

AWS Transit Gateway (TGW) acts as a regional network hub. VPCs, VPN connections, Direct Connect gateways, and peering connections to other TGWs all attach as spokes. Route tables control traffic flow between attachments, enabling segmentation -- production VPCs can reach shared services but not development VPCs [3].

A critical design decision: one TGW per region with inter-region peering, or separate TGWs for production and non-production. The former is simpler; the latter provides stronger blast radius isolation at the cost of more complex routing.

### Azure Virtual WAN

Azure Virtual WAN is a fully managed hub-spoke service. Unlike the traditional Azure hub-spoke pattern (where you deploy your own firewall and VPN gateway VMs in a hub VNet), Virtual WAN manages the hub infrastructure. It excels at branch connectivity -- hundreds of branch offices connecting via VPN -- and global transit routing. The tradeoff: Virtual WAN costs 300-500% more than manual hub-spoke for purely intra-Azure connectivity. Organizations with fewer than 50 VNets and no branch connectivity requirements should use traditional hub-spoke with Azure Firewall [4].

Azure's Virtual Network Routing Appliance (VNRA), entering public preview in 2025-2026, addresses the throughput limitations of Azure Firewall and VM-based NVAs in traditional hub-spoke topologies, potentially narrowing Virtual WAN's advantages [4].

### GCP Network Connectivity Center

GCP's Network Connectivity Center (NCC) takes a different approach from AWS and Azure. Because GCP VPCs are already global (subnets are regional, but the VPC spans all regions), NCC focuses on connecting VPC networks to each other and to on-premises networks. NCC provides transitivity -- all VPCs attached to an NCC hub can communicate without direct peering -- and linear scaling (adding a VPC requires one spoke, not N-1 peerings) [5].

NCC Gateway extends this with managed security service insertion, enabling third-party security service edge (SSE) providers to inspect traffic flowing through the hub.

---

## 5. Private Connectivity Services

Private connectivity eliminates public internet exposure for service-to-service communication. Instead of routing through the internet (even with TLS), traffic stays on the provider's backbone network using private IP addresses [6].

### Service Comparison

| Feature | AWS PrivateLink | Azure Private Link | GCP Private Service Connect |
|---|---|---|---|
| Consumer side | VPC Interface Endpoint | Private Endpoint | PSC Endpoint |
| Provider side | Endpoint Service (NLB) | Private Link Service | Service Attachment |
| DNS integration | Route 53 Private Hosted Zone | Azure Private DNS Zone | Service Directory |
| Cross-account | Yes | Cross-subscription, cross-tenant | Cross-project |
| Cross-region | Yes (as of 2024) | Yes | Yes |
| Bandwidth limit | NLB-dependent | No hard cap | No hard cap |
| Third-party support | Marketplace services | Partner services | Partner services |
| Pricing | $0.01/hr + $0.01/GB | $0.01/hr + $0.01/GB | $0.01/GB processed |

### AWS PrivateLink Architecture

```
PRIVATELINK -- CONSUMER-TO-PROVIDER CONNECTIVITY
=====================================================================

Consumer VPC (10.1.0.0/16)          Provider VPC (10.2.0.0/16)
+---------------------------+       +---------------------------+
|                           |       |                           |
|  Application              |       |  Network Load Balancer    |
|  +-------------+          |       |  +------------------+     |
|  | 10.1.10.50  |---+      |       |  | Targets:         |     |
|  +-------------+   |      |       |  | 10.2.10.10:443   |     |
|                     v      |       |  | 10.2.10.11:443   |     |
|  Interface Endpoint |      |       |  +--------+---------+     |
|  +-------------+   |      |       |           ^               |
|  | 10.1.10.99  |---+------+-------+-----------+               |
|  | (ENI in     |   AWS    |       |  Endpoint Service         |
|  |  consumer   |  Backbone|       |  (vpce-svc-xxxx)          |
|  |  subnet)    |          |       |                           |
|  +-------------+          |       +---------------------------+
|                           |
+---------------------------+
```

The consumer sees a private IP address in their own VPC. DNS resolution maps the service hostname to this private IP. Traffic never touches the internet. The provider's actual IP addresses and network topology are invisible to the consumer [6].

### GCP Private Service Connect

GCP PSC differs architecturally in that endpoints receive a globally unique private IP address from the consumer's VPC, and all ports allowed by the consumer's firewall configuration are accessible. PSC does not cap bandwidth for endpoints, making it particularly attractive for high-throughput integrations with services like Cloud Storage, Bigtable, and third-party partners (Elastic, MongoDB, Snowflake) [6].

---

## 6. Hybrid Connectivity

Hybrid connectivity bridges on-premises data centers and cloud networks over dedicated, private circuits rather than VPN tunnels over the public internet [7].

### Dedicated Interconnect Comparison

| Feature | AWS Direct Connect | Azure ExpressRoute | GCP Cloud Interconnect |
|---|---|---|---|
| Dedicated speeds | 1 Gbps, 10 Gbps, 100 Gbps | 50 Mbps -- 100 Gbps | 10 Gbps, 100 Gbps |
| Partner speeds | 50 Mbps -- 10 Gbps | 50 Mbps -- 10 Gbps | 50 Mbps -- 50 Gbps |
| Redundancy | Manual (order 2 connections) | Built-in (2 circuits per SKU) | Recommended 4 connections |
| SLA (with redundancy) | 99.99% | 99.95% (single) / 99.99% (dual) | 99.99% (4 connections) |
| Encryption | MACsec (100G), IPsec overlay | MACsec | MACsec, IPsec overlay |
| BGP requirement | Yes (private/public VIF) | Yes (private/Microsoft peering) | Yes |
| Global reach | Direct Connect Gateway | ExpressRoute Global Reach | Cloud Router global |
| Failover to VPN | Manual or automated via TGW | VPN as ExpressRoute backup | HA VPN fallback |

### Dedicated vs. Partner Interconnect

**Dedicated interconnect** requires physical cross-connects at a colocation facility where the cloud provider maintains equipment. The customer (or their colocation provider) runs fiber from their router cage to the cloud provider's cage. This is the highest-bandwidth, lowest-latency option but requires physical presence at a supported facility.

**Partner interconnect** (AWS Direct Connect via partners, Azure ExpressRoute via providers, GCP Partner Interconnect) uses a service provider as an intermediary. The provider maintains the physical connection to the cloud; the customer connects to the provider. Lower bandwidth ceiling but available at far more locations and without colocation requirements.

### Redundancy Design

A production hybrid connection requires at minimum two circuits, each terminating at a different physical location, to survive a single facility failure:

```
REDUNDANT HYBRID CONNECTIVITY
=====================================================================

On-Premises DC                                   Cloud Provider
+----------------+                                +----------------+
|                |     Circuit A (10 Gbps)        |                |
|  Core Router A +--------------------------------+ Colo Facility A|
|    (BGP AS     |     Diverse fiber path         |    (DX/ER/IC)  |
|     65000)     |                                |                |
|                |     Circuit B (10 Gbps)        |                |
|  Core Router B +--------------------------------+ Colo Facility B|
|                |     Diverse fiber path         |    (DX/ER/IC)  |
+----------------+                                +----------------+
                                                         |
                                                         v
                                                  +----------------+
                                                  | Transit GW /   |
                                                  | Virtual WAN /  |
                                                  | Cloud Router   |
                                                  +--------+-------+
                                                           |
                                              +------------+------------+
                                              |            |            |
                                          VPC Prod     VPC Staging   VPC Dev
```

The circuits should be on diverse fiber paths (different conduits, ideally different physical routes) and terminate at different colocation facilities. Azure's built-in redundancy (two circuits per ExpressRoute SKU) simplifies this; AWS and GCP require explicit provisioning of separate connections [7].

---

## 7. Cloud Firewalls and Security Groups

Cloud network security operates at multiple layers: instance-level, subnet-level, and VPC-level. Understanding which layer is stateful versus stateless, and where rules are evaluated, prevents both security gaps and accidental self-lockouts [8].

### Per-Provider Security Constructs

| Layer | AWS | Azure | GCP |
|---|---|---|---|
| Instance-level (stateful) | Security Groups | NSGs (on NIC) | Firewall rules (target tags/SA) |
| Subnet-level (stateless) | Network ACLs | NSGs (on subnet) | Firewall rules (network tags) |
| VPC-level (managed L4-L7) | AWS Network Firewall | Azure Firewall | Cloud Firewall (L7) |
| Flow logging | VPC Flow Logs | NSG Flow Logs | VPC Flow Logs |
| Rule evaluation | Permissive (allow-only SG, explicit NACL) | Priority-ordered | Priority-ordered |
| Default inbound | Deny all (SG), Allow all (NACL) | Deny all | Deny all (implied) |
| Default outbound | Allow all (SG), Allow all (NACL) | Allow all | Allow all (implied) |

### Stateful vs. Stateless

**AWS Security Groups** are stateful: if an inbound rule allows traffic on port 443, the return traffic on the ephemeral port is automatically permitted. No need to write an explicit outbound rule for the response. Network ACLs are stateless: every packet is evaluated independently against the rule table, so both inbound and outbound rules must be explicitly defined for a connection to work [8].

**Azure NSGs** are stateful and can be attached to either individual NICs or entire subnets (or both). When applied at both levels, traffic must pass both sets of rules. Priority numbers (100-4096) determine evaluation order, with lower numbers evaluated first.

**GCP Firewall Rules** are stateful and global within a VPC. They use target tags or service accounts rather than subnet association to determine which instances a rule applies to. This is architecturally different -- a single firewall rule can apply to instances across all subnets and all regions within the VPC.

### VPC Flow Logs

Flow logs capture metadata about network connections (source/destination IP, ports, protocol, bytes, action taken) and are the primary tool for network forensics, compliance auditing, and cost analysis. They do not capture packet payloads.

| Feature | AWS VPC Flow Logs | Azure NSG Flow Logs | GCP VPC Flow Logs |
|---|---|---|---|
| Granularity | ENI, subnet, or VPC | NSG level | Subnet level |
| Destination | CloudWatch Logs, S3, Kinesis | Storage Account, Log Analytics | Cloud Logging, BigQuery, Pub/Sub |
| Custom fields | Yes (v5 custom format) | Limited | Metadata annotations |
| Sampling | 1:1 (all packets logged) | Configurable | Configurable (0.0-1.0) |
| Cost driver | Log storage + ingestion | Storage + analytics | Log volume + storage |
| Latency | ~10 min aggregation | ~1-5 min | ~5 sec (real-time) |

---

## 8. Service Mesh Networking

A service mesh provides infrastructure-level networking capabilities -- mTLS, traffic management, observability -- for service-to-service communication within a Kubernetes cluster or across clusters. The mesh intercepts all network traffic between services, typically via sidecar proxies or kernel-level eBPF programs [9].

### Service Mesh Comparison

| Feature | Istio | Cilium | Linkerd |
|---|---|---|---|
| Data plane | Envoy sidecar or ambient | eBPF + optional Envoy | Linkerd2-proxy (Rust) |
| mTLS overhead | +166% latency (sidecar) | +99% latency | +33% latency |
| Architecture | Sidecar or ambient mesh | Kernel-level (eBPF) | Sidecar (ultralight) |
| Resource usage | High (25-50 GB extra at 500 svc) | Medium | Low |
| L7 policy | Full (HTTP, gRPC, TCP) | L3/L4 native, L7 via Envoy | HTTP, gRPC, TCP |
| Observability | Kiali, Jaeger, Prometheus | Hubble | Built-in dashboard |
| Multi-cluster | Yes (cross-network) | ClusterMesh | Multi-cluster |
| CNCF status | Graduated | Graduated | Graduated |
| Best for | Complex traffic mgmt, policy | High-throughput, security | Simplicity, small teams |

### Istio Architecture

Istio's control plane (istiod) programs the data plane proxies. In the traditional sidecar model, every pod gets an Envoy sidecar that intercepts all traffic. The newer ambient mesh mode eliminates sidecars entirely, using a per-node ztunnel proxy for L4 (mTLS, telemetry) and optional waypoint proxies for L7 (HTTP routing, authorization). Ambient mode reduces the mTLS latency overhead from 166% to 8% -- a transformational improvement [9].

### Cilium eBPF Networking

Cilium replaces iptables and sidecar proxies with eBPF programs compiled into the Linux kernel. For L3/L4 operations (connection tracking, load balancing, network policy), this is genuinely faster -- 40-60% reduction in network overhead reported in financial services and real-time data workloads. The limitation: eBPF cannot natively parse L7 protocols (HTTP headers, gRPC methods). When L7 visibility or policy is needed, Cilium falls back to Envoy, partially negating the eBPF advantage [9].

### Linkerd Ultralight

Linkerd's Rust-based proxy (linkerd2-proxy) is purpose-built for the sidecar use case. It starts in milliseconds, uses minimal memory (~10 MB per proxy), and provides mTLS, load balancing, retries, and observability. In benchmarks, Linkerd adds 5-10% latency over baseline -- the lowest of any mesh. The trade-off: fewer features than Istio (no traffic mirroring, limited traffic shifting) and no eBPF path [9].

---

## 9. Container Networking

Container Networking Interface (CNI) plugins provide pod-to-pod networking in Kubernetes. The CNI specification defines how a container runtime allocates network interfaces and IP addresses to pods. The plugin choice determines network topology, performance characteristics, security policy capabilities, and cloud integration depth [10].

### CNI Plugin Comparison

| Feature | Calico | Cilium | AWS VPC CNI | Azure CNI |
|---|---|---|---|---|
| Data plane | iptables or eBPF | eBPF | AWS ENI | Azure VNET |
| IP allocation | Calico IPAM (overlay) | Cilium IPAM | VPC subnet IPs | VNet subnet IPs |
| Pod IP routable | Only with BGP mode | Only with native routing | Yes (native VPC IPs) | Yes (native VNet IPs) |
| Network policy | Calico NetworkPolicy | CiliumNetworkPolicy | Via Calico addon | Azure Network Policy |
| Throughput | ~8.5 Gbps | ~9.2 Gbps | VPC line rate | VNet line rate |
| P99 latency | ~1.4 ms | ~0.8 ms | Near-native | Near-native |
| Windows support | Yes | No | No | Yes |
| Observability | Calico Enterprise | Hubble | CloudWatch | Azure Monitor |
| Best for | Multi-cloud, hybrid | Performance, security | EKS native | AKS native |

### AWS VPC CNI

The default CNI for Amazon EKS. Each pod receives a real IP address from the VPC subnet, making pods directly routable from anywhere in the VPC without overlay networking. The trade-off: IP address consumption. A c5.xlarge instance supports 15 ENIs x 15 IPs = 225 pod IPs maximum. In dense pod deployments, you exhaust the subnet's address space. Mitigations include prefix delegation mode (assigns /28 prefixes instead of individual IPs) and secondary CIDR ranges for pod networking [10].

A common production pattern: keep the VPC CNI for IPAM (pod IP allocation) and install Cilium in chaining mode for policy enforcement and Hubble observability.

### Azure CNI

Azure CNI allocates IP addresses from the VNet subnet to each pod, similar to AWS VPC CNI. Azure CNI Overlay mode (GA since 2023) uses an overlay network for pod IPs, conserving VNet address space while maintaining compatibility with Azure networking features. Azure CNI Powered by Cilium integrates Cilium's eBPF data plane directly into AKS, replacing kube-proxy and providing CiliumNetworkPolicy support.

---

## 10. Cross-Cloud Networking

Multi-cloud networking connects workloads running in different cloud providers. Native provider tools (TGW, Virtual WAN, NCC) stop at the provider boundary. Cross-cloud requires either VPN tunnels between providers, dedicated interconnect through a shared colocation facility, or a third-party networking platform [11].

### Approaches

| Method | Latency | Bandwidth | Complexity | Cost |
|---|---|---|---|---|
| IPsec VPN over internet | Variable, ~20-50 ms | ~1.25 Gbps per tunnel | Low | Low (VPN gateway fees) |
| Interconnect via colo | Low, ~1-5 ms | 10-100 Gbps | High (physical) | High (colo + circuits) |
| Megaport/Equinix Fabric | Low, ~2-10 ms | 1-100 Gbps | Medium (virtual) | Medium (port + data) |
| Aviatrix | Varies by underlay | Varies | Medium (software) | License + cloud costs |
| Alkira | Varies by underlay | Varies | Low (NaaS) | Higher (managed service) |

### Aviatrix

Aviatrix deploys a controller and gateway instances in each cloud provider. The gateways establish encrypted tunnels between clouds, forming an overlay network. The controller provides a single pane of glass for routing, security policies, and troubleshooting across AWS, Azure, GCP, and OCI. Aviatrix uses native cloud constructs (attaching to TGW, VNet peering) rather than replacing them, adding transit routing, segmentation, and encryption on top [11].

Aviatrix's strength is granular control: per-VPC firewall policies, distributed network analytics (CoPilot), and advanced troubleshooting (FlightPath). The cost is operational complexity -- deploying and maintaining gateway instances in every cloud account.

### Alkira

Alkira takes a network-as-a-service approach. Rather than deploying customer-managed gateways, Alkira operates a global backbone (Cloud Services Exchange) with points of presence in major cloud regions. Customers connect their VPCs, VNets, and on-premises networks to Alkira's backbone, which handles routing, segmentation, and security insertion [11].

The advantage is speed of deployment -- connecting a new cloud network takes minutes rather than hours. The disadvantage is cost (managed service premium) and dependency on Alkira's backbone for all inter-cloud traffic.

### Cloud-Neutral Interconnect Fabrics

Megaport, Equinix Fabric, and PacketFabric provide virtual cross-connects between cloud providers. A customer provisions a virtual circuit from their AWS Direct Connect to their Azure ExpressRoute through the fabric, without deploying any software. This approach works well when the primary need is raw bandwidth between two specific cloud regions, without complex routing or security requirements.

---

## 11. Cloud Network Cost Optimization

Cloud networking costs are notoriously opaque. The VPC itself is free; the charges hide in data transfer, NAT gateways, load balancers, VPN tunnels, and transit gateway attachments [12].

### Cost Components by Provider

| Component | AWS | Azure | GCP |
|---|---|---|---|
| VPC/VNet creation | Free | Free | Free |
| NAT Gateway | $0.045/hr + $0.045/GB | $0.045/hr + $0.045/GB | Free (Cloud NAT per-GB) |
| Egress (first 10 TB) | $0.09/GB | $0.087/GB | $0.12/GB |
| Cross-AZ transfer | $0.01/GB each way | Free (same region) | Free (same region) |
| VPC Peering transfer | $0.01/GB (cross-AZ) | Free (same region) | Free (same region) |
| Transit Gateway | $0.05/hr attach + $0.02/GB | Virtual WAN per-unit | NCC per-spoke + per-GB |
| Public IPv4 address | $0.005/hr ($3.60/mo) | Included (basic) | $0.004/hr |
| Interface Endpoint | $0.01/hr + $0.01/GB | $0.01/hr + $0.01/GB | $0.01/GB |

### NAT Gateway: The Silent Budget Killer

A single AWS NAT Gateway costs $32.40/month in hourly charges before processing any data. Add $0.045/GB processing on top of standard $0.09/GB egress, and the true cost of internet-bound traffic from a private subnet is $0.135/GB. If the NAT Gateway is in a different AZ from your compute, add another $0.02/GB for cross-AZ transfer [12].

AWS introduced Regional NAT Gateway in late 2025, which charges per-AZ per-hour based on actual traffic patterns. If your workload only uses two of three AZs, you only pay for two. This changes the economics for multi-AZ deployments.

### Optimization Strategies

**VPC Gateway Endpoints (free):** S3 and DynamoDB gateway endpoints eliminate both NAT Gateway processing fees and egress charges. For 1 TB/month of S3 access, this saves $138.24/month per NAT Gateway. This is the single highest-impact networking cost optimization according to the AWS Well-Architected Framework [12].

**Interface Endpoints over NAT:** For AWS services beyond S3 and DynamoDB, Interface Endpoints cost approximately 78% less than routing the same traffic through a NAT Gateway.

**Transit Gateway vs. VPC Peering:** VPC Peering has no hourly charge and costs ~$0.01/GB for data transfer. Transit Gateway charges $0.05/hr per attachment (~$36/month) plus $0.02/GB processing. For fewer than five VPCs with stable connectivity, peering is cheaper. Beyond ten VPCs, TGW's operational simplicity justifies the premium [3].

**Egress reduction:** CloudFront, Cloud CDN, and Azure CDN serve cached content at lower egress rates than direct compute egress. S3/GCS/Blob transfer to CDN edge is typically free or discounted. Compressing payloads (gzip, brotli) directly reduces per-GB charges.

### Cost Comparison: Transit Gateway vs. VPC Peering (10 VPCs, 1 TB/month each)

| | VPC Peering (full mesh) | Transit Gateway |
|---|---|---|
| Connections | 45 peering connections | 10 TGW attachments |
| Monthly attachment | $0 | $360 ($36 x 10) |
| Data processing (10 TB) | ~$100 (cross-AZ transfer) | ~$200 ($0.02/GB x 10 TB) |
| Operational cost | High (45 route tables) | Low (centralized routing) |
| **Total** | **~$100 + ops overhead** | **~$560 + ops savings** |

The TGW premium of $460/month is the price of centralized routing, traffic inspection, and operational simplicity. For most enterprises, this is trivial compared to the engineering time saved managing 45 peering connections.

---

## 12. Cross-References

### Related SNE Modules
- **Module 01 (Network Architecture):** VPC topologies are the cloud instantiation of campus and data center design principles
- **Module 02 (Routing):** BGP operations are critical for hybrid connectivity (Direct Connect, ExpressRoute, Cloud Interconnect all require BGP)
- **Module 03 (Automation):** Terraform, Pulumi, and CloudFormation automate VPC provisioning and transit gateway configuration
- **Module 04 (Traffic Engineering):** Cloud load balancers (ALB, Azure Application Gateway, GCP Cloud Load Balancing) operate within the VPC networking layer
- **Module 05 (Security):** Cloud firewalls, security groups, and NACLs are the cloud instantiation of firewall zones and microsegmentation
- **Module 07 (Observability):** VPC Flow Logs are the cloud equivalent of NetFlow/sFlow
- **Module 10 (Reliability):** Redundant hybrid connectivity design, multi-AZ subnet distribution

### Related PNW Research Series Projects
- **OPS (OpenStack):** Module 04 covers Neutron SDN -- the open-source equivalent of VPC networking
- **K8S (Kubernetes):** CNI plugins, service mesh, and pod networking integrate directly with cloud VPC constructs
- **TCP (TCP/IP Protocol):** The transport layer that all cloud networking abstracts
- **DNS (DNS Protocol):** Private DNS zones, Route 53, Cloud DNS -- resolving service names within and across VPCs
- **SOO (Systems Operations):** Operational playbooks for hybrid connectivity monitoring and failover
- **DRP (Disaster Recovery):** Multi-region VPC design and cross-region replication networking
- **CMH (Computational Mesh):** Overlay networking patterns for distributed compute

---

## 13. Sources

1. AWS. "Building a Scalable and Secure Multi-VPC AWS Network Infrastructure." docs.aws.amazon.com/whitepapers/latest/building-scalable-secure-multi-vpc-network-infrastructure/, 2024.
2. AWS. "VPC CIDR Blocks." docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html, 2024. See also: AWS Prescriptive Guidance, "Preserve Routable IP Space in Multi-Account VPC Designs."
3. AWS. "Transit Gateway Pricing." aws.amazon.com/transit-gateway/pricing/, 2025. See also: CloudZero, "AWS VPC Peering vs. Transit Gateway: Which to Choose" (2026); Ably, "VPC Peering vs Transit Gateway and Beyond" (2025).
4. Microsoft. "Hub-Spoke Network Topology That Uses Azure Virtual WAN." learn.microsoft.com/en-us/azure/architecture/networking/architecture/hub-spoke-virtual-wan-architecture, 2024. See also: Exodata, "Azure Landing Zone Networking: Hub-and-Spoke vs Virtual WAN" (2026); Cloudtrooper, "Which Azure Network Design Is Cheaper?" (2026).
5. Google Cloud. "NCC Overview." docs.cloud.google.com/network-connectivity/docs/network-connectivity-center/concepts/overview, 2025.
6. AWS. "What Is AWS PrivateLink?" docs.aws.amazon.com/vpc/latest/privatelink/what-is-privatelink.html, 2024. See also: Megaport, "Comparing Cloud Providers' Private Connectivity Options" (2025).
7. Megaport. "AWS vs Azure vs Google Cloud: A Comparison of Private Connectivity Options." megaport.com/blog/comparing-cloud-providers-private-connectivity/, 2025. See also: PhoenixNAP, "AWS Direct Connect vs. Azure ExpressRoute" (2025); Pluralsight, "Networking Services Compared: AWS vs Azure vs Google Cloud" (2025).
8. Tutorials Dojo. "Security Group vs NACL." tutorialsdojo.com/security-group-vs-nacl/, 2025. See also: Networkershome, "Cloud Firewalls -- AWS Security Groups, Azure NSG, GCP Firewall" (2025); Kentik, "Understanding the Differences Between Flow Logs on AWS and Azure" (2025).
9. Reintech. "Kubernetes Service Mesh Comparison 2026: Istio vs Linkerd vs Cilium." reintech.io/blog/kubernetes-service-mesh-comparison-2026-istio-linkerd-cilium, 2026. See also: arXiv:2411.02267, "Performance Comparison of Service Mesh Frameworks: the MTLS Test Case" (2024); LiveWyer, "Service Meshes Decoded" (2025); Buoyant, "Linkerd vs Cilium" (2025).
10. Tasrie IT Services. "Cilium vs Calico: We Run Both in Production" (2026). See also: Sanj.dev, "Kubernetes CNI Performance Comparison 2026" (2026); Dev.to, "Why Cilium Outperforms AWS VPC CNI" (2025); CECG, "Comparative Guide to Choosing Best CNI" (2025).
11. PeerSpot. "Alkira Cloud Services Exchange (CSX) vs Aviatrix" (2025). See also: Gartner Peer Insights, "Best Multicloud Networking Software" (2026); DCD, "Change Is Afoot in the World of Cloud Networking" (2025).
12. FirstPassLab. "The Hidden Networking Bill: How Egress, IPv4, and NAT Gateway Fees Are Crushing Cloud Budgets in 2026" (2026). See also: AWS, "Pricing for NAT Gateways" (2025); Cloudburn, "AWS NAT Gateway Pricing" (2026); nOps, "AWS NAT Gateway Costs and Ways to Reduce Them" (2025).

---

*Systems Network Engineering -- Module 6: Cloud Networking. The VPC is not a network diagram come to life. It is a billing model with routing tables attached. Engineer accordingly: every subnet, every gateway, every peering connection has both a packet-forwarding cost and a dollar cost. The discipline is optimizing both simultaneously.*
