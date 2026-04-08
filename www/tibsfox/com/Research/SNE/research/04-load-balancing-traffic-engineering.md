# Module 4: Load Balancing & Traffic Engineering

## Overview

Load balancing and traffic engineering occupy the critical junction between network architecture and application delivery. Where routing protocols determine how packets find paths through a network, traffic engineering determines which paths they should take -- and load balancing ensures that the endpoints receiving those packets can actually handle the volume. These are not luxuries bolted onto existing networks. They are the mechanisms that separate a network that works from a network that works under load, under failure, under geographic distribution, and under the relentless growth of traffic that defines modern infrastructure.

The distinction matters because the failure mode is different from most networking problems. A misconfigured route produces an immediate, diagnosable outage. Poor traffic engineering produces something worse: a network that works perfectly at 30% utilization and collapses unpredictably at 70%. The symptoms are intermittent latency spikes, mysterious connection resets, asymmetric load across supposedly identical servers, and capacity that exists on paper but cannot be reached in practice. These are the problems that traffic engineering solves, and they are problems that get harder -- not easier -- as networks grow.

This module maps the full landscape: from Layer 4 packet-level decisions to Layer 7 application-aware routing, from single-rack load balancers to global anycast networks spanning hundreds of cities, from classical DiffServ QoS to modern segment routing traffic engineering. The real-world systems that demonstrate these principles at scale -- Google's Maglev, Meta's Katran, Cloudflare's Unimog -- are examined not as case studies in abstraction but as concrete implementations whose design decisions illuminate the trade-offs that every network engineer faces.

---

## 1. Layer 4 vs Layer 7 Load Balancing

The most fundamental decision in load balancer selection is the layer at which it operates. This is not merely a feature checkbox -- it determines the performance ceiling, the failure modes, the operational complexity, and the class of routing decisions the balancer can make.

### 1.1 Layer 4 Load Balancing

A Layer 4 load balancer operates at the transport layer, making forwarding decisions based on IP addresses and TCP/UDP port numbers. It does not inspect the payload. It does not parse HTTP headers. It does not understand application semantics. This constraint is also its strength.

**How it works:** The load balancer receives a TCP SYN packet, selects a backend server using a configured algorithm (round-robin, weighted, hash-based), and either rewrites the destination IP (NAT mode) or encapsulates the packet for delivery (DSR/tunneling mode). All subsequent packets in that connection follow the same path -- the load balancer maintains a connection table mapping the 5-tuple (source IP, source port, destination IP, destination port, protocol) to a specific backend.

**Performance characteristics:** Because L4 load balancers do not need to terminate TCP connections or parse application data, they can process packets at line rate. A single commodity server running an optimized L4 balancer can saturate a 10 Gbps link with small packets. Google's Maglev achieves this by processing packets in userspace with kernel bypass, and Meta's Katran achieves it using XDP programs that intercept packets before they even reach the kernel networking stack.

**When to use L4:**

- High-throughput scenarios where every microsecond of latency matters
- TCP/UDP services that do not require content-aware routing (databases, game servers, DNS)
- The first tier of a multi-tier load balancing architecture, distributing to L7 balancers
- When Direct Server Return (DSR) is needed to keep return traffic off the balancer

**Limitations:** An L4 balancer cannot route based on HTTP path, hostname, cookie, or header. It cannot perform TLS termination (it can pass through TLS but cannot inspect the encrypted content). It cannot do content-based health checks beyond TCP connection success. It treats all traffic on a port identically.

### 1.2 Layer 7 Load Balancing

A Layer 7 load balancer terminates the client connection and establishes a separate connection to the backend. Between those two connections, it has full visibility into the application protocol -- HTTP headers, URI paths, query parameters, cookies, gRPC service names, WebSocket upgrade requests.

**How it works:** The client completes a TCP handshake and TLS negotiation with the load balancer (not the backend). The load balancer parses the request, applies routing rules, selects a backend, and proxies the request over a separate connection. This "split connection" model means the load balancer manages two distinct TCP state machines per request.

**Routing capabilities:**

| Routing Dimension | Example | Use Case |
|-------------------|---------|----------|
| Host header | `api.example.com` vs `www.example.com` | Multi-tenant routing |
| URI path | `/api/v2/users` vs `/static/images` | Microservice routing |
| HTTP method | `GET` vs `POST` | Read replica vs primary routing |
| Cookie/header | `session_id`, `X-Feature-Flag` | Sticky sessions, canary deployments |
| gRPC service | `UserService.GetProfile` | Service-level routing in gRPC mesh |
| Client certificate | mTLS identity | Zero-trust backend selection |

**Performance characteristics:** L7 load balancing is inherently more expensive than L4. Terminating TLS, parsing HTTP, and managing two connection pools per request consumes CPU and memory. A high-end L7 proxy handles tens of thousands of requests per second per core -- orders of magnitude less than an L4 balancer measured in packets per second. The trade-off is capability, not performance.

### 1.3 Comparison Matrix

| Property | Layer 4 | Layer 7 |
|----------|---------|---------|
| OSI layer | Transport (TCP/UDP) | Application (HTTP/gRPC/etc.) |
| Routing granularity | IP + port (5-tuple) | URL, headers, cookies, payload |
| TLS handling | Passthrough only | Full termination and re-encryption |
| Connection model | Single connection (forwarded) | Split connection (proxied) |
| Throughput ceiling | 10-100 Gbps per node | 10K-100K RPS per core |
| Latency overhead | Sub-millisecond (< 100 us typical) | 1-5 ms (TLS + parsing) |
| Health checking | TCP connect, UDP response | HTTP status, body content, gRPC health |
| Session persistence | Source IP hash | Cookie-based, header-based |
| Observability | Connection counts, bytes | Request rates, latency percentiles, error rates |
| Typical deployment | Edge/first-tier, database, DNS | API gateway, web frontend, microservice mesh |

### 1.4 The Two-Tier Pattern

Most production architectures use both layers in a two-tier topology:

```
Internet Traffic
       |
  [Anycast/BGP]
       |
  [L4 Load Balancer]    <-- Distributes across L7 pool, handles DDoS at packet level
       |
  [L7 Load Balancer]    <-- Content routing, TLS termination, canary, rate limiting
   /   |   \
[App] [App] [App]       <-- Application backends
```

The L4 tier provides raw throughput, DDoS resilience (it can drop malicious packets before they consume L7 resources), and horizontal scaling of the L7 tier. The L7 tier provides intelligent routing, observability, and application-aware health checking. This is exactly the architecture that Google, Meta, and Cloudflare use in production.

---

## 2. Hardware vs Software Load Balancers

### 2.1 Hardware Load Balancers

Hardware load balancers are purpose-built appliances with custom ASICs or FPGAs for packet processing. The two dominant vendors are F5 Networks (BIG-IP) and Citrix (ADC, formerly NetScaler).

**F5 BIG-IP:**

F5 BIG-IP is a full application delivery controller providing L4-L7 load balancing, SSL offload, WAF, and programmability via iRules (a Tcl-based scripting language). The hardware line uses custom FPGAs for SSL acceleration and packet processing. F5 has expanded into software (BIG-IP Virtual Edition) and SaaS (F5 Distributed Cloud), but the hardware appliance remains the core of its installed base in enterprise data centers.

**Citrix ADC (NetScaler):**

Citrix ADC provides similar functionality with a reputation for strong SSL performance and Citrix ecosystem integration. It uses a custom FreeBSD-derived OS and provides programmability through responder and rewrite policies. In the load balancer market segment, Citrix ADC holds approximately 7.7% market share versus F5 BIG-IP's 3.5%, though these numbers are complicated by the dominance of cloud-native solutions -- AWS Elastic Load Balancer alone commands over 66% of deployments.

**The decline of hardware LB:**

| Factor | Hardware | Software |
|--------|----------|---------|
| Cost per unit | $50K-$500K+ | $0 (open source) to $50K/yr (enterprise) |
| Scaling model | Vertical (buy bigger box) | Horizontal (add instances) |
| Provisioning time | Weeks (procurement + rack) | Minutes (container/VM) |
| Automation | Limited API, vendor-specific | Full API, infrastructure-as-code native |
| Failure domain | Single appliance | Distributed, no SPOF |
| Innovation cycle | 18-24 month hardware refresh | Continuous software releases |
| Cloud compatibility | None (physical only) | Native to any cloud |

The market trajectory is unmistakable. Cloud-native load balancers (AWS ALB/NLB, GCP Cloud Load Balancing, Azure Load Balancer) and open-source software load balancers have captured the growth segment. Hardware LB retains a role in legacy enterprise environments and regulated industries where appliance-based security certification matters, but no greenfield architecture should specify hardware load balancers in 2026.

### 2.2 Software Load Balancers

The software load balancer landscape has consolidated around four dominant projects, each with a distinct architectural philosophy.

**HAProxy:**

The gold standard for raw L4/L7 load balancing performance. HAProxy is a single-process, event-driven proxy that achieves extraordinary throughput through careful memory management and zero-copy techniques. It is the load balancer that other load balancers benchmark against. HAProxy consistently delivers 50,000+ requests per second in HTTP/1.1 benchmarks while consuming approximately 50 MB of memory. Its configuration language is declarative and specific to load balancing -- it does not try to be a web server or an API gateway. HAProxy Technologies offers an enterprise edition with a management API, WAF module, and commercial support.

**nginx:**

Originally a web server, nginx's reverse proxy and load balancing capabilities have made it the most widely deployed L7 proxy in the world. nginx provides the best balance of features for HTTP-centric workloads: mature HTTP/3 (QUIC) support since version 1.25.0, built-in caching, static file serving, and a familiar configuration syntax. It handles approximately 40,000+ RPS in benchmarks with ~80 MB memory consumption. F5 acquired nginx in 2019; the commercial nginx Plus adds dynamic reconfiguration, active health checks, and a dashboard. The community open-source version remains actively developed.

**Envoy Proxy:**

Purpose-built for service mesh and cloud-native architectures. Envoy was created at Lyft and donated to the CNCF, where it became the data plane for Istio, AWS App Mesh, and numerous service mesh implementations. Envoy's defining feature is its xDS (discovery service) API, which allows control planes to dynamically configure every aspect of the proxy without restarts or config reloads. This makes Envoy the standard choice for environments where routing rules change continuously -- Kubernetes service meshes, canary deployments, A/B testing frameworks. Envoy consumes more resources (~150 MB memory) and delivers slightly lower raw throughput (~35,000+ RPS) than HAProxy or nginx, but its programmability and observability (native distributed tracing, detailed metrics, access logging) are unmatched.

**Traefik:**

An automatic, cloud-native reverse proxy designed for container orchestration. Traefik watches Kubernetes, Docker, Consul, and other service registries and automatically configures routes as services appear and disappear. It trades raw performance for operational simplicity -- there is no configuration file to manage for dynamic services. Traefik is the default ingress proxy for many small-to-medium Kubernetes deployments and Docker Compose setups. Its enterprise edition (TraefikEE) adds high availability, distributed configuration, and advanced traffic management.

### 2.3 Software Load Balancer Decision Matrix

| Criterion | HAProxy | nginx | Envoy | Traefik |
|-----------|---------|-------|-------|---------|
| Peak throughput | Highest | High | Moderate | Moderate |
| Memory footprint | ~50 MB | ~80 MB | ~150 MB | ~100 MB |
| HTTP/3 (QUIC) | Experimental | Stable (1.25+) | Stable | Stable |
| Dynamic reconfiguration | Reload required | Reload required | xDS API (no restart) | Auto-discovery |
| Service mesh integration | Manual | Manual | Native (Istio, etc.) | Limited |
| Kubernetes native | Via Ingress controller | Via Ingress controller | Via Gateway API | Auto-discovery native |
| Distributed tracing | Plugin | Plugin | Native (Zipkin, Jaeger) | Plugin |
| Best for | High-perf L4/L7 | Web serving + LB | Service mesh, cloud-native | Container auto-routing |

---

## 3. Global Server Load Balancing (GSLB)

GSLB distributes traffic across geographically distributed data centers. Unlike local load balancing (which selects a server within a site), GSLB selects the site itself. The mechanism is almost always DNS-based: the GSLB system acts as the authoritative DNS server for the service's domain and returns different IP addresses based on the client's location, the health of each site, and configured policies.

### 3.1 GSLB Architectures

**F5 BIG-IP GTM (now BIG-IP DNS):**

F5's Global Traffic Manager operates as an intelligent DNS server that monitors the health and performance of backend pools across multiple data centers. It supports topology-based routing, round-robin, ratio, least connections, and QoS-based selection. GTM integrates tightly with local BIG-IP LTM instances for real-time health data. This is the traditional enterprise GSLB solution and remains common in organizations with existing F5 investments.

**AWS Route 53:**

Amazon's DNS service provides GSLB through routing policies:

| Policy | Mechanism | Use Case |
|--------|-----------|----------|
| Simple | Single record | No load balancing needed |
| Weighted | Percentage-based distribution | Canary deployments, gradual migration |
| Latency | Network latency measurement | Performance optimization |
| Failover | Health-check driven | Active/passive DR |
| Geolocation | Client geography (country/continent) | Compliance, localization |
| Geoproximity | Adjustable geographic bias | Fine-tuned traffic steering |
| Multivalue answer | Multiple healthy IPs | Simple DNS-level distribution |

Route 53 latency-based routing measures network latency between the client's resolver and each AWS region, returning the record for the region with the lowest latency. This is not geographic proximity -- a client in Portland, Oregon might be routed to us-west-2 (Oregon) or us-west-1 (N. California) depending on real network conditions, not straight-line distance.

**Other cloud GSLB:**

- **Azure Traffic Manager:** DNS-based, supports priority, weighted, performance, geographic, multivalue, and subnet routing
- **Google Cloud DNS:** Supports geolocation routing policies and weighted round-robin; integrates with Cloud Load Balancing for a combined GSLB + L7 solution
- **Cloudflare Load Balancing:** DNS-based with steering policies (off, random, hash, geo, dynamic latency), health monitoring, and automatic failover

### 3.2 GSLB Limitations

DNS-based GSLB has inherent limitations that network engineers must understand:

1. **TTL-bounded convergence:** When a site fails, the GSLB system changes the DNS response, but clients cache the old IP for the duration of the DNS TTL. Setting TTL to 30 seconds improves convergence but increases DNS query volume. Setting TTL to 300 seconds reduces query volume but means 5 minutes of potential downtime during failover.

2. **Resolver opacity:** The GSLB system sees the DNS resolver's IP, not the end client's IP. EDNS Client Subnet (ECS, RFC 7871) partially solves this by including the client's subnet in the DNS query, but not all resolvers support it.

3. **No connection awareness:** DNS returns an IP address before the client connects. The GSLB system cannot factor in current connection count, server CPU utilization, or response time at the moment of the DNS query -- only at the granularity of health check intervals.

---

## 4. DNS-Based Load Balancing

Beyond GSLB, DNS itself serves as a load balancing mechanism through several techniques.

### 4.1 DNS Round-Robin

The simplest form: the authoritative DNS server returns multiple A/AAAA records for a hostname, cycling their order with each query. Client behavior is implementation-dependent -- most clients connect to the first IP in the list, so rotating the order distributes connections.

**Advantages:** Zero infrastructure required, works with any DNS server, no single point of failure.

**Disadvantages:** No health checking (dead servers remain in rotation until manually removed), no awareness of server load, unequal distribution due to client-side caching and resolver behavior.

### 4.2 Weighted DNS

Records are returned with different frequencies based on configured weights. A server with weight 70 appears in 70% of responses; a server with weight 30 appears in 30%. Route 53, Cloudflare, and PowerDNS all support this natively.

**Use case:** Gradual traffic migration between data centers. Set the old DC to weight 90 and the new DC to weight 10, monitor, then shift gradually. This is the DNS equivalent of a canary deployment.

### 4.3 GeoDNS

The authoritative server maps client resolver IPs (or EDNS Client Subnet) to geographic regions and returns region-specific records. A query from a European resolver gets a European server IP; an Asian query gets an Asian IP.

**Implementation options:**
- **PowerDNS with GeoIP backend:** Open source, uses MaxMind GeoIP databases
- **Cloudflare DNS:** Built-in geolocation steering
- **Route 53 geolocation routing:** Country and continent granularity
- **NS1:** Advanced traffic management with filter chains combining geo, cost, and performance data

---

## 5. Anycast Engineering

Anycast is the technique of announcing the same IP address from multiple physical locations using BGP. When a client sends a packet to an anycast address, the network's BGP routing delivers it to the topologically nearest announcement point. This is not a DNS trick -- it operates at the network layer, below application awareness.

### 5.1 How BGP Anycast Works

Each anycast site runs a BGP speaker that advertises the same IP prefix (e.g., `198.51.100.0/24`) to its upstream providers. The global BGP routing table converges to direct each source AS toward the nearest announcement. "Nearest" in BGP terms means fewest AS hops by default, though local preference, MED, and community-based policies modify this.

```
                    +-----------+
               +--> | Site: SJC | --> BGP: 198.51.100.0/24
               |    +-----------+
 Client (PDX) -+
               |    +-----------+
               +--> | Site: SEA | --> BGP: 198.51.100.0/24  <-- Selected (fewer hops)
                    +-----------+

                    +-----------+
 Client (LHR) ---> | Site: AMS | --> BGP: 198.51.100.0/24  <-- Selected (nearest)
                    +-----------+
```

### 5.2 Anycast for Stateless Protocols

Anycast works naturally with stateless protocols like DNS. A DNS query is a single request-response pair -- if a subsequent query goes to a different anycast site, the client does not notice. This is why all major public DNS resolvers (Cloudflare 1.1.1.1, Google 8.8.8.8, Quad9 9.9.9.9) use anycast. Cloudflare's anycast network spans 310+ cities, ensuring that DNS queries are answered by a nearby server regardless of the client's location.

### 5.3 Anycast for Stateful Protocols (TCP)

TCP is stateful -- packets belonging to a single connection must reach the same server. BGP route changes (caused by link failures, maintenance, or convergence events) can shift an anycast destination mid-connection, breaking TCP state. Solutions include:

1. **Connection tracking at the anycast site:** The L4 load balancer at each site (e.g., Maglev, Katran, Unimog) maintains connection tables. If a route fluctuation causes a packet to arrive at a site that did not originate the connection, the site can use consistent hashing to forward it to the correct backend, or it can use cross-site connection state sharing.

2. **ECMP stability:** Within a single anycast site, ECMP distributes packets across load balancer instances. Consistent hashing algorithms (like Maglev hashing) ensure that adding or removing a balancer instance disrupts minimal existing connections.

3. **Short-lived connections:** For HTTP/1.1 with keep-alive and HTTP/2, connections are relatively short-lived. The probability of a BGP route change during a single connection's lifetime is low. For long-lived connections (WebSockets, gRPC streams), the risk is higher and must be mitigated by application-level reconnection logic.

### 5.4 Cloudflare's Anycast Network

Cloudflare operates one of the largest anycast networks in the world. Every Cloudflare data center (310+ cities) announces the same IP ranges. This architecture provides:

- **DDoS absorption:** Attack traffic is distributed across all sites proportionally to the attacker's topological proximity, preventing volumetric concentration at any single point
- **Latency reduction:** Users connect to the nearest data center automatically, without DNS-based steering or GSLB
- **Operational simplicity:** No per-site IP addressing, no geographic DNS configuration, no failover logic -- BGP handles it

Cloudflare's Unimog load balancer operates at each site to distribute traffic across servers within the data center. Unimog is an XDP-based L4 load balancer that runs in the kernel's network driver, intercepting packets before they reach the kernel network stack. Unimog achieves uniform load distribution across heterogeneous server hardware and supports "soft-unicast" -- a technique where multiple servers share a single IPv4 address for egress traffic, with Unimog redirecting response packets to the correct physical server.

---

## 6. Traffic Shaping and Quality of Service (QoS)

### 6.1 The DiffServ Model

Differentiated Services (DiffServ, RFC 2474/2475) is the dominant QoS architecture for IP networks. It replaces the earlier IntServ (Integrated Services) model, which required per-flow state at every router and did not scale.

DiffServ operates on traffic aggregates, not individual flows. Packets are marked with a 6-bit Differentiated Services Code Point (DSCP) in the IP header. Routers treat packets with the same DSCP value identically -- the per-hop behavior (PHB) is determined by the DSCP, not by per-flow state.

**Standard PHBs:**

| PHB | DSCP Value | Behavior | Typical Use |
|-----|------------|----------|-------------|
| Default (BE) | 0 | Best effort | Bulk data, web browsing |
| Expedited Forwarding (EF) | 46 | Low loss, low delay, low jitter | VoIP, real-time video |
| Assured Forwarding (AF) | AF11-AF43 | 4 classes x 3 drop precedences | Business applications, tiered service |
| Class Selector (CS) | CS0-CS7 | Backward compatibility with IP precedence | Legacy network integration |

### 6.2 Traffic Policing vs Traffic Shaping

These two mechanisms both enforce rate limits, but they behave differently when traffic exceeds the configured rate.

**Traffic policing** drops or re-marks packets that exceed the rate. It is stateless -- each packet is measured against the token bucket independently. Policing is applied at ingress (incoming traffic) because there is no buffer to hold excess packets before they enter the network.

**Traffic shaping** buffers packets that exceed the rate and transmits them later when the rate drops below the configured limit. Shaping smooths traffic bursts into a steady stream. It is applied at egress (outgoing traffic) because the shaper needs a buffer to hold delayed packets.

| Property | Policing | Shaping |
|----------|----------|---------|
| Action on excess | Drop or re-mark | Buffer and delay |
| Direction | Ingress or egress | Egress only |
| Latency impact | None (dropped) | Increased (buffered) |
| Buffer required | No | Yes |
| TCP behavior | Causes retransmissions | Smooths without retransmission |
| Use case | Service provider edge, access control | WAN edge, traffic smoothing |

**Practical guidance:** Use policing at the network edge to enforce contracted rates (e.g., a service provider limiting a customer to their purchased bandwidth). Use shaping on egress interfaces to smooth bursty traffic before it enters a WAN link, reducing TCP retransmissions and improving application performance.

### 6.3 Congestion Management

When an interface's output queue fills, the router must decide which packets to forward and which to drop. Three mechanisms address this:

1. **Tail drop:** The simplest algorithm -- when the queue is full, drop all arriving packets. This causes TCP global synchronization where many flows reduce their window simultaneously, then increase simultaneously, producing oscillating throughput.

2. **Weighted Random Early Detection (WRED):** Begins randomly dropping packets before the queue is full, with higher-priority traffic (lower DSCP drop precedence) dropped at a lower rate. This prevents global synchronization by causing individual flows to back off at different times.

3. **Priority queuing with weighted fair queuing:** Traffic is classified into queues. A strict priority queue (for EF traffic like voice) is always serviced first. Remaining bandwidth is shared among other queues using weighted fair queuing, where each class receives bandwidth proportional to its configured weight.

---

## 7. Equal-Cost Multipath (ECMP)

ECMP is the backbone of modern data center traffic distribution. When a routing protocol discovers multiple paths to the same destination with equal cost, ECMP installs all paths in the forwarding table and distributes traffic across them.

### 7.1 Hash-Based Forwarding

ECMP does not load-balance per-packet (which would cause out-of-order delivery and destroy TCP performance). Instead, it hashes specific packet header fields to select a next hop. All packets with the same hash map to the same path, ensuring per-flow consistency.

**Common hash inputs:**

| Hash Fields | Protocol | Granularity |
|-------------|----------|-------------|
| Src IP + Dst IP | L3 only | Coarse (one path per IP pair) |
| Src IP + Dst IP + Protocol + Src Port + Dst Port | L3+L4 (5-tuple) | Fine (one path per flow) |
| Inner headers (after decapsulation) | VXLAN/GRE/IPIP | Required for encapsulated traffic |

### 7.2 Hash Polarization

Hash polarization occurs when adjacent routers use the same hash algorithm with the same seed. The result: traffic that was "balanced" across 4 paths at hop N all maps to the same single path at hop N+1, because the same hash inputs produce the same output on both routers.

**Prevention:**
- **Unique hash seeds per router:** Most modern platforms (Arista, Cumulus/NVIDIA, Juniper) support configurable hash seeds. Directly connected routers should never share a seed.
- **Algorithm diversification:** Use different hash fields at different tiers of the network (e.g., 3-tuple at spine, 5-tuple at leaf).
- **Resilient hashing:** When a next hop is added or removed, only flows mapped to the changed hop are redistributed. Other flows maintain their existing path assignment, minimizing disruption.

### 7.3 Flow Pinning and Elephant Flows

ECMP distributes traffic evenly when flows are numerous and small. A single large flow (an "elephant flow" -- a database replication stream, a backup job, a video transfer) can saturate one ECMP path while others sit idle.

**Detection and mitigation:**
- **Flowlet-based switching:** Instead of pinning per-flow, pin per-flowlet (a burst of packets within a flow separated by idle gaps). When a gap occurs, re-hash to a potentially different path. This exploits the fact that TCP sends data in bursts due to congestion window dynamics.
- **Weighted ECMP:** Assign different weights to paths based on observed utilization. Overloaded paths receive less traffic.
- **Adaptive load balancing (ALB):** Some switches (Arista, Broadcom Memory-Cells and Dynamic Load Balancing) detect elephant flows in hardware and re-pin them to underutilized paths.

---

## 8. Segment Routing Traffic Engineering (SR-TE)

Segment Routing is the most significant evolution in WAN traffic engineering since MPLS-TE. It encodes the packet's path as an ordered list of instructions -- segments -- in the packet header itself. The network forwards the packet by processing segments one at a time, without per-flow state at intermediate routers.

### 8.1 SR-MPLS

In SR-MPLS, segments are encoded as MPLS labels. Each label identifies either a node (a node SID that routes to a specific router) or an adjacency (an adjacency SID that forces the packet through a specific link). The source router pushes a stack of labels; each intermediate router pops the top label and forwards based on the next.

**Advantage over RSVP-TE:** RSVP-TE requires per-tunnel state at every router along the path. For N tunnels through M routers, the state is O(N x M). SR-MPLS pushes all forwarding instructions into the packet header -- intermediate routers maintain zero per-tunnel state. This eliminates the scaling wall that made RSVP-TE unmanageable in large networks.

### 8.2 SRv6

SRv6 encodes segments as IPv6 addresses in a Segment Routing Header (SRH). Each segment is a 128-bit IPv6 address that identifies a function at a specific node -- forward, decapsulate, apply a VPN context, or invoke a custom network function.

**The micro-SID (uSID) optimization:** A full SRH with multiple 128-bit addresses adds significant overhead. uSID compresses segments into 16-bit or 32-bit identifiers packed within a single 128-bit container, reducing header overhead while retaining SRv6's programmability. The FRRouting 10.5 release (2025) added support for multiple uSID locators, the F4816 format, and coexistence of SRv6 uSID with MPLS within the same VRF.

**2025-2026 developments:**

| Development | Significance |
|-------------|-------------|
| AI backend traffic engineering (Alibaba, Cisco, Microsoft, NVIDIA) | SRv6 enables deterministic path placement for GPU workloads |
| SONiC integration | SRv6 in open-source switch OS for data center use cases |
| EANTC multi-vendor interop (174 test combinations, 19 vendors) | SR-MPLS and SRv6 maturing as multi-vendor standards |
| FRRouting 10.5 uSID enhancements | Open-source routing suite gaining production SRv6 capabilities |

### 8.3 SR-TE vs Classical MPLS-TE

| Property | RSVP-TE | SR-MPLS TE | SRv6 TE |
|----------|---------|------------|---------|
| Per-flow state at transit | Yes (O(N x M)) | No | No |
| Signaling protocol | RSVP-TE | None (IGP extensions) | None (IGP extensions) |
| Header overhead | Single MPLS label | Label stack (variable) | SRH with IPv6 addresses |
| Fast reroute | Facility backup (slow) | TI-LFA (< 50 ms) | TI-LFA (< 50 ms) |
| SDN controller integration | Complex (stateful PCE) | Natural (stateless) | Natural (stateless) |
| Multi-domain | Difficult | Binding SIDs | Native (IPv6 reachability) |

---

## 9. CDN Integration as Traffic Engineering

Content Delivery Networks are, at their core, traffic engineering systems. A CDN's primary function is to place content close to users and direct user requests to the nearest cached copy. This is traffic engineering operating at the application layer with global scope.

### 9.1 CDN Traffic Steering Mechanisms

| Mechanism | How It Works | Latency Impact |
|-----------|-------------|----------------|
| DNS-based steering | CDN authoritative DNS returns the nearest edge IP | One RTT for DNS resolution |
| Anycast | Edge servers share IP addresses via BGP | Zero additional latency (routing-level) |
| HTTP redirect | Origin responds with 302 to nearest edge URL | One additional RTT |
| Client-side selection | JavaScript/app selects edge based on latency probes | Requires initial measurement |

### 9.2 The Modern CDN Architecture

Modern CDNs have evolved beyond simple caching into programmable edge computing platforms:

**Akamai** operates 4,100+ points of presence and remains the largest CDN by traffic volume. Its EdgeWorkers platform allows custom JavaScript logic at the edge, transforming the CDN from a passive cache into an active request processing layer. Akamai's density of edge servers reduces regional congestion during flash crowds (Black Friday, live events, game launches).

**Fastly** takes an engineering-led approach with its Compute platform (formerly Compute@Edge), running compiled Wasm modules at the edge with sub-millisecond cold starts. Fastly achieves the lowest mean network latency among North American and European CDNs (17 ms average TTFB). Its Varnish-derived caching engine gives operators granular control over cache behavior through VCL (Varnish Configuration Language) and its successor Compute.

**Cloudflare** leverages its anycast network to serve CDN traffic from the same infrastructure that handles its DNS, DDoS, and zero-trust products. Every Cloudflare server in every data center can cache content -- there is no distinction between "edge" and "origin" tiers within the network. Workers (V8 isolates) provide programmable edge compute.

---

## 10. Real-World Systems

### 10.1 Google Maglev

Maglev is Google's network load balancer, in production since 2008 and documented in a USENIX NSDI 2016 paper. It is a distributed L4 load balancer running on commodity Linux servers.

**Architecture:** Network routers distribute packets to Maglev machines via ECMP. Each Maglev machine matches packets to services and selects backends using consistent hashing. The Maglev hash algorithm is specifically designed for this purpose: it provides both good distribution (even load across backends) and minimal disruption (adding or removing a backend reassigns only 1/N of existing connections, where N is the number of backends).

**Key design decisions:**
- **Kernel bypass:** Maglev takes full ownership of the NIC, bypassing the Linux kernel network stack entirely. This eliminates per-packet system call overhead and allows packet processing at line rate.
- **Connection tracking + consistent hashing:** The connection table provides fast lookup for existing connections. For new connections, the Maglev hash provides consistent backend selection that survives the addition or removal of Maglev instances in the ECMP pool.
- **No special hardware:** Maglev runs on the same commodity servers as any other Google service. Capacity scales by adding servers, not by buying bigger appliances.

**Performance:** A single Maglev machine saturates a 10 Gbps link with small packets. Google runs Maglev at every edge PoP, providing the first-tier L4 load balancing for all Google Cloud external Network Load Balancers.

### 10.2 Meta (Facebook) Katran

Katran is Meta's second-generation L4 load balancer, open-sourced in 2018. It replaced a first-generation IPVS-based system.

**Architecture:** Katran is an XDP/BPF program that attaches to the NIC driver. Packets are processed before reaching the Linux kernel network stack -- even before netfilter, conntrack, or the routing table. This is the earliest possible interception point in the Linux packet path.

**Key design decisions:**
- **XDP + BPF:** By using the kernel's BPF virtual machine attached at the XDP hook, Katran avoids kernel bypass entirely (unlike Maglev's DPDK approach). This means it coexists with the normal Linux networking stack -- the server can simultaneously run Katran for load balancing and use the kernel stack for management traffic.
- **Lockless, per-CPU maps:** Katran's BPF program uses per-CPU data structures, eliminating lock contention. Performance scales linearly with the number of NIC receive queues.
- **DSR with IPIP encapsulation:** Katran forwards packets to backends using IP-in-IP encapsulation in Direct Server Return mode. The backend decapsulates and responds directly to the client, keeping return traffic off the load balancer.
- **Maglev hashing:** Katran uses an extended version of Google's Maglev consistent hash for backend selection, providing the same minimal-disruption properties during backend pool changes.

### 10.3 Cloudflare Unimog

Unimog is Cloudflare's intra-data-center L4 load balancer, deployed across all 310+ Cloudflare locations.

**Architecture:** Like Katran, Unimog uses XDP/BPF for packet processing. Its distinctive contribution is the "soft-unicast" technique: multiple servers in a data center share a single IPv4 address for outgoing traffic. When response packets return to the data center (addressed to the shared IP), Unimog's XDP program on each server inspects the packet and either processes it locally (if it belongs to a connection on this server) or forwards it to the correct server via a lightweight encapsulation. This enables Cloudflare to share scarce IPv4 address space across servers without traditional NAT.

**Results:** Unimog deployment produced dramatically more uniform load distribution across servers in production data centers. Before Unimog, ECMP alone resulted in uneven load due to hash collisions, heterogeneous server hardware, and varying per-connection resource costs. Unimog's load-aware distribution compensates for these factors.

### 10.4 Comparison of Hyperscaler L4 Load Balancers

| Property | Google Maglev | Meta Katran | Cloudflare Unimog |
|----------|---------------|-------------|-------------------|
| Year deployed | 2008 | 2018 | 2020 |
| Open source | No (paper only) | Yes (GitHub) | No (blog post) |
| Packet interception | DPDK (kernel bypass) | XDP (in-kernel) | XDP (in-kernel) |
| Forwarding mode | GRE/IPIP to GFE | IPIP DSR | XDP redirect + encap |
| Hash algorithm | Maglev consistent hash | Extended Maglev hash | Custom consistent hash |
| Connection tracking | Yes (hash table) | Yes (BPF maps) | Yes (BPF maps) |
| Scaling unit | Commodity server | Commodity server | Existing edge server |
| Unique innovation | Consistent hash algorithm | Lockless per-CPU BPF | Soft-unicast IP sharing |

---

## 11. Traffic Flow Diagrams

### 11.1 Two-Tier Load Balancing with Anycast

```
                          Internet
                             |
                    [BGP Anycast Routing]
                    /        |        \
              +---------+ +--------+ +--------+
              | PoP-SEA | | PoP-DFW| | PoP-IAD|    Anycast PoPs
              +---------+ +--------+ +--------+
                  |            |          |
              [L4 LB]     [L4 LB]    [L4 LB]       Maglev/Katran/Unimog
              /    \       /    \      /    \
          [L7 LB] [L7]  [L7] [L7]  [L7] [L7]      Envoy/nginx
          / | \                                      
       [App][App][App]                               Backends
```

### 11.2 GSLB with Regional Failover

```
 Client DNS Query: app.example.com
        |
 [GSLB Authoritative DNS]
    |           |           |
 Health OK?  Health OK?  Health FAIL
    |           |           |
  US-West     EU-West    AP-South (withdrawn)
  10.1.0.1    10.2.0.1   
    |           |
 [Regional LB] [Regional LB]
    |           |
 [App Pool]   [App Pool]
```

### 11.3 ECMP in a Spine-Leaf Fabric

```
          [Spine-1] ---- [Spine-2] ---- [Spine-3]
          / | \ \        / | \ \        / | \ \
         /  |  \ \      /  |  \ \      /  |  \ \
  [Leaf-1] [Leaf-2] [Leaf-3] [Leaf-4]
   | | |    | | |    | | |    | | |
  Servers  Servers  Servers  Servers

  Flow A: Leaf-1 -> Spine-2 -> Leaf-3  (hash = 0x7A -> Spine-2)
  Flow B: Leaf-1 -> Spine-1 -> Leaf-3  (hash = 0x3F -> Spine-1)
  Flow C: Leaf-1 -> Spine-3 -> Leaf-3  (hash = 0xB2 -> Spine-3)
  
  Each flow consistently uses one path. Aggregate traffic is distributed.
```

### 11.4 Segment Routing Path Selection

```
  Source: Router A (Seattle)
  Destination: Router F (New York)
  
  Without SR-TE: IGP shortest path
  A -> B -> D -> F  (3 hops, congested link B-D)
  
  With SR-TE: Explicit segment list [A, C, E, F]
  A -> C -> E -> F  (3 hops, avoids congested B-D)
  
  Packet header at A:
  [IPv6 | SRH: Seg[2]=C, Seg[1]=E, Seg[0]=F | Payload]
  
  At C: pop segment, forward to E
  At E: pop segment, forward to F
  At F: process payload (all segments consumed)
```

---

## 12. Decision Framework

### When to Use What

| Scenario | Recommended Approach |
|----------|---------------------|
| Single data center, < 10K RPS | nginx or HAProxy, L7 |
| Single data center, > 100K RPS | L4 (IPVS or Katran) + L7 (Envoy) two-tier |
| Multi-region, active-active | GSLB (Route 53 latency) + per-region L4/L7 |
| Global latency-sensitive (DNS, CDN) | BGP anycast + per-PoP L4 |
| Kubernetes microservices | Envoy (via Istio/Cilium Gateway API) |
| WAN traffic optimization | SR-MPLS or SRv6 TE with SDN controller |
| Legacy enterprise with F5 | Migrate to software LB on next hardware refresh |
| Real-time media (voice/video) | DiffServ EF marking + priority queuing + shaping |

### The Three Questions

Every load balancing and traffic engineering decision reduces to three questions:

1. **What layer?** Can the routing decision be made from IP + port alone (L4), or does it require application awareness (L7)?
2. **What scope?** Is traffic distributed within a rack, within a data center, across regions, or globally?
3. **What failure mode?** When something breaks -- a server, a link, a site -- how quickly must traffic shift, and how much disruption is acceptable?

The answers to these questions determine the architecture. The technologies described in this module are the tools for implementing that architecture. The art of traffic engineering is matching the right tools to the right scope at the right layer, and understanding that the answer is almost always "multiple layers, working together."

---

## Sources and References

- Google, "Maglev: A Fast and Reliable Software Network Load Balancer," USENIX NSDI 2016
- Meta Engineering, "Open-sourcing Katran, a scalable network load balancer," 2018
- Cloudflare Blog, "Unimog -- Cloudflare's edge load balancer," 2020
- Cisco, "Compare Traffic Policy and Traffic Shape to Limit Bandwidth"
- Juniper Networks, "ECMP Flow-Based Forwarding"
- NVIDIA/Cumulus Linux, "Equal Cost Multipath Load Sharing -- Hardware ECMP"
- Segment-Routing.net, "SRv6 Conference Paris, March 2025"
- Cisco Live 2025, "Introduction to Segment Routing and SRv6" (BRKMPL-1207)
- RFC 2474/2475, Differentiated Services Architecture
- RFC 7871, Client Subnet in DNS Queries (EDNS Client Subnet)
- RFC 8986, Segment Routing over IPv6 (SRv6) Network Programming
- AWS Documentation, "Amazon Route 53 Routing Policies"
- Noction, "BGP Anycast Best Practices and Configurations"
