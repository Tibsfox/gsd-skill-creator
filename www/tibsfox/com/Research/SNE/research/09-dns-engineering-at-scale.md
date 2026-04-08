# DNS Engineering at Scale

> **Domain:** Authoritative & Recursive DNS Architecture, DNSSEC Operations, DNS-Based Service Discovery, and Hyperscale DNS Infrastructure
> **Module:** 9 -- DNS as Infrastructure, Control Plane, and Security Boundary
> **Through-line:** *Every packet on the internet begins with a DNS query. The system that resolves names into addresses is not a background service -- it is the first point of failure, the first point of attack, and the first lever of traffic control. DNS engineering is the discipline of making that invisible system reliable at scales where "reliable" means answering billions of queries per day with single-digit millisecond latency while withstanding sustained adversarial pressure. A misconfigured zone file can take down an enterprise. A botched DNSSEC key rotation can make a TLD unreachable. DNS engineering is where operational discipline meets protocol precision, and the margin for error is measured in minutes of global outage.*

---

## Table of Contents

1. [Authoritative DNS Architecture](#1-authoritative-dns-architecture)
2. [Authoritative Server Comparison](#2-authoritative-server-comparison)
3. [Recursive DNS Architecture](#3-recursive-dns-architecture)
4. [DNSSEC Operations](#4-dnssec-operations)
5. [NSEC vs. NSEC3: Authenticated Denial of Existence](#5-nsec-vs-nsec3-authenticated-denial-of-existence)
6. [DNS-Based Service Discovery](#6-dns-based-service-discovery)
7. [GeoDNS and Latency-Based Routing](#7-geodns-and-latency-based-routing)
8. [DNS as Control Plane](#8-dns-as-control-plane)
9. [DNS Security](#9-dns-security)
10. [DNS at Hyperscale](#10-dns-at-hyperscale)
11. [Operational Checklists](#11-operational-checklists)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Authoritative DNS Architecture

Authoritative DNS servers hold the ground truth for a zone. They do not recurse, do not cache answers from other servers, and do not guess. When a recursive resolver asks "what is the A record for www.example.com?", the authoritative server for example.com either has the answer or it does not. This simplicity is the source of both its reliability and its operational criticality [1].

### Hidden Primary Architecture

The hidden primary pattern separates the zone editing surface from the query-answering surface. The primary nameserver -- where zone data is authored and signed -- is not listed in the NS records of the zone and does not accept queries from the public internet. Only secondary servers, which receive zone data via transfer, are publicly visible [2].

```
HIDDEN PRIMARY DNS ARCHITECTURE
================================================================

  Hidden Primary (not in NS records)
  +-----------------------------------+
  | Zone authoring (manual or API)    |
  | DNSSEC signing (KSK + ZSK)       |
  | TSIG-authenticated zone transfer  |
  +--------+-----------+--------------+
           |           |
      AXFR/IXFR   AXFR/IXFR
      (TSIG)       (TSIG)
           |           |
  +--------+---+  +----+----------+
  | Secondary 1 |  | Secondary 2  |  <-- Listed in NS records
  | (NSD/Knot)  |  | (Cloudflare) |  <-- Answer public queries
  +-------------+  +--------------+
           |           |
    Anycast routing    Anycast routing
           |           |
  +--------+-----------+----------+
  |        Public Internet        |
  +-------------------------------+
```

Benefits:
- **Attack surface reduction** -- the primary server is unreachable from the internet; DDoS attacks against NS records hit only secondaries
- **Multi-provider resilience** -- secondaries can run different software (NSD, Knot, Cloudflare, Route 53) on different networks
- **Controlled change propagation** -- zone edits are staged on the hidden primary before transfer to production secondaries

### Zone Transfers: AXFR and IXFR

Zone transfers are the replication mechanism between primary and secondary nameservers. Two protocols exist [3]:

| Protocol | RFC | Mechanism | Use Case |
|---|---|---|---|
| AXFR | RFC 5936 | Full zone transfer -- every record transmitted | Initial sync, small zones, recovery after journal loss |
| IXFR | RFC 1995 | Incremental transfer -- only changes since a given serial | Large zones with frequent updates (e.g., CDN zones with millions of records) |

AXFR is simple and reliable: the secondary requests the entire zone, the primary sends it. For a zone with 10 records this is trivial. For a zone with 10 million records, AXFR becomes a significant network and CPU event. IXFR solves this by transferring only the difference between two serial numbers, maintained in journal files (.jnl) on the primary [4].

**Security controls for zone transfers:**

- **TSIG (RFC 8945)** -- Transaction SIGnature authentication using shared HMAC keys. Both primary and secondary must possess the same key. Every transfer message is authenticated.
- **ACLs** -- IP-based access control lists restricting which addresses can request transfers. Defense in depth -- TSIG authenticates, ACLs restrict.
- **TLS (XFR-over-TLS, RFC 9103)** -- Encrypts the transfer channel. Prevents passive eavesdropping of zone contents during transfer.

```
ZONE TRANSFER SECURITY -- LAYERED CONTROLS
================================================================

  Secondary (10.0.1.5) --> Primary (10.0.0.1)
       |
  [1]  ACL check: is 10.0.1.5 in allow-transfer list?
       |-- NO  --> REFUSED
       |-- YES --> continue
       |
  [2]  TSIG check: does request carry valid HMAC signature?
       |-- NO  --> NOTAUTH
       |-- YES --> continue
       |
  [3]  TLS (if configured): is connection encrypted?
       |-- Transfer proceeds over encrypted channel
       |
  [4]  Serial check: does secondary need AXFR or IXFR?
       |-- IXFR possible (journal exists) --> send delta
       |-- IXFR not possible --> fall back to AXFR
```

### NOTIFY and SOA Polling

Secondaries learn about zone changes through two mechanisms:

- **NOTIFY (RFC 1996)** -- The primary sends a UDP notification to all configured secondaries when the zone changes. The secondary then initiates a transfer.
- **SOA polling** -- Secondaries periodically query the primary's SOA record and compare the serial number. If the primary's serial is higher, the secondary initiates a transfer.

The SOA record's refresh, retry, and expire timers control polling behavior. A typical production configuration: refresh 3600 (1 hour), retry 900 (15 minutes), expire 604800 (1 week). If the secondary cannot reach the primary for the expire duration, it stops serving the zone -- a safety mechanism that prevents serving stale data indefinitely [5].

---

## 2. Authoritative Server Comparison

Four nameserver implementations dominate production authoritative DNS. Each occupies a distinct niche [6]:

| Server | Developer | Architecture | DNSSEC | Backend | Sweet Spot |
|---|---|---|---|---|---|
| BIND 9 | ISC | Monolithic, threaded | Full (inline signing) | Zone files, DLZ | Swiss Army knife -- authoritative + recursive + views + RPZ |
| NSD | NLnet Labs | Authoritative-only, pre-compiled zones | Full | Zone files (compiled to .db) | Maximum query throughput per watt, ccTLD/root operators |
| Knot DNS | CZ.NIC | Authoritative-only, multi-threaded | Full (on-the-fly signing) | Zone files, LMDB | High-performance authoritative with modern DNSSEC automation |
| PowerDNS Auth | PowerDNS | Authoritative, database-backed | Full | SQL (PostgreSQL, MySQL, SQLite), BIND files, LMDB, LDAP | Dynamic zones, REST API management, web UI (PowerAdmin) |

### Performance Characteristics

Benchmarking authoritative nameservers is deceptively complex because performance depends on zone size, query mix, DNSSEC overhead, and whether the test measures cached or cold responses. General observations from published benchmarks and operator reports [7]:

- **NSD** consistently delivers the highest queries-per-second for static zones because it pre-compiles zone data into an optimized binary format at load time. Memory usage is efficient. The tradeoff is that NSD is authoritative-only -- no recursion, no RPZ, no views.
- **Knot DNS** approaches NSD throughput with better DNSSEC automation. On-the-fly signing means zone data does not need to be pre-signed -- Knot signs responses as they leave. This simplifies key management at the cost of CPU during signing.
- **BIND 9** is the most feature-complete but carries legacy architectural weight. Recent versions (9.18+) improved threading and DNSSEC performance significantly. BIND remains the only single-binary solution that does authoritative, recursive, views, RPZ, and catalog zones.
- **PowerDNS** trades raw query performance for operational flexibility. SQL backends enable zone management through standard database tools, REST APIs, and web interfaces. For environments where zone data is generated programmatically (cloud platforms, hosting providers), PowerDNS is often the most practical choice.

### Selection Decision Tree

```
AUTHORITATIVE SERVER SELECTION
================================================================

  Is the zone static (rarely changes)?
  |-- YES: NSD or Knot DNS
  |         |-- Need maximum throughput? --> NSD
  |         |-- Need automated DNSSEC key management? --> Knot DNS
  |
  |-- NO: Zone changes frequently or is generated dynamically
           |-- Need SQL/API management? --> PowerDNS
           |-- Need views + RPZ + recursive in one binary? --> BIND
           |-- Need REST API with web UI? --> PowerDNS + PowerAdmin
```

---

## 3. Recursive DNS Architecture

Recursive resolvers do the work of traversing the DNS hierarchy on behalf of clients. A recursive resolver receives a query from a stub resolver (the client), walks from the root servers down through TLD servers to the authoritative server, caches the answer, and returns it to the client. Every millisecond of latency in this chain is multiplied by every user on the network [8].

### Resolver Comparison

| Resolver | Developer | Architecture | Standout Features |
|---|---|---|---|
| Unbound | NLnet Labs | Recursive-only, single-purpose | Minimal attack surface, DNSSEC validation, aggressive NSEC caching (RFC 8198) |
| CoreDNS | CNCF | Plugin-chained, middleware architecture | Kubernetes-native, extensible, gRPC/etcd backends |
| BIND 9 | ISC | Combined authoritative + recursive | Views, RPZ, split-horizon, single binary for everything |
| PowerDNS Recursor | PowerDNS | Recursive-only, Lua scripting | Programmable response modification, RPZ, scripted policy |

### Caching Hierarchy

Large networks deploy resolvers in a tiered caching hierarchy to reduce query latency and upstream load:

```
RECURSIVE DNS CACHING HIERARCHY
================================================================

  Client stub resolver
       |
  [L1] Local resolver (per-host or per-VLAN)
       |-- dnsmasq, systemd-resolved, or forwarding stub
       |-- Cache: small (256-1024 entries), short-lived
       |-- Purpose: deduplicate queries from local processes
       |
  [L2] Site/campus resolver (per-datacenter)
       |-- Unbound or BIND, DNSSEC-validating
       |-- Cache: large (100K-10M entries), TTL-governed
       |-- Purpose: serve 80-90% of queries from cache
       |
  [L3] Regional forwarding resolver (optional)
       |-- Aggregation point for multiple sites
       |-- Purpose: share cache across sites, reduce root/TLD load
       |
  [L4] Root / TLD / authoritative servers
       |-- Only reached on cache miss at all lower tiers
```

### Unbound Configuration Patterns

Unbound is the standard choice for dedicated recursive resolution. Key configuration patterns for production deployments [9]:

```
# /etc/unbound/unbound.conf -- production recursive resolver

server:
    interface: 0.0.0.0
    port: 53
    access-control: 10.0.0.0/8 allow
    access-control: 172.16.0.0/12 allow
    access-control: 192.168.0.0/16 allow

    # DNSSEC validation
    auto-trust-anchor-file: "/var/lib/unbound/root.key"
    val-clean-additional: yes

    # Performance tuning
    num-threads: 4
    msg-cache-slabs: 4
    rrset-cache-slabs: 4
    infra-cache-slabs: 4
    key-cache-slabs: 4
    msg-cache-size: 256m
    rrset-cache-size: 512m

    # Prefetch expiring records (serve stale + refresh)
    prefetch: yes
    serve-expired: yes
    serve-expired-ttl: 86400

    # Aggressive NSEC caching (RFC 8198)
    aggressive-nsec: yes

    # Minimize information leakage
    qname-minimisation: yes

    # Harden against cache poisoning
    harden-glue: yes
    harden-dnssec-stripped: yes
    use-caps-for-id: yes
```

**Prefetch and serve-expired** are the two most impactful production settings. Prefetch refreshes popular records before their TTL expires, ensuring cache hits for frequently accessed domains. Serve-expired returns stale cached answers when the authoritative server is unreachable, preventing total resolution failure during upstream outages [10].

---

## 4. DNSSEC Operations

DNSSEC adds cryptographic authentication to DNS responses. A validating resolver can verify that the answer it receives was actually published by the zone's authoritative server and was not tampered with in transit. DNSSEC does not encrypt queries or responses -- it provides authentication and integrity, not confidentiality [11].

### Key Hierarchy

```
DNSSEC KEY HIERARCHY
================================================================

  Root Zone (.)
  |-- KSK: RSA 2048 (trust anchor, published in resolvers)
  |-- ZSK: RSA 1024/2048 (signs root zone records)
  |
  |-- DS record for .com --> hash of .com's KSK
      |
      .com (Verisign)
      |-- KSK: ECDSA P-256 (Algorithm 13, migrated 2023)
      |-- ZSK: ECDSA P-256
      |
      |-- DS record for example.com --> hash of example.com's KSK
          |
          example.com
          |-- KSK: ECDSA P-256 (signs DNSKEY RRset)
          |-- ZSK: ECDSA P-256 (signs all other RRsets)
```

- **KSK (Key Signing Key)** -- Signs only the DNSKEY RRset. Its hash is published as a DS record in the parent zone. Rotated infrequently (1-3 years) because rotation requires coordinating with the parent zone operator.
- **ZSK (Zone Signing Key)** -- Signs all other records in the zone. Rotated frequently (30-90 days) because rotation is internal to the zone and requires no parent coordination.

### Algorithm Migration: RSA to ECDSA

The DNS ecosystem is migrating from RSA-based DNSSEC (Algorithms 5, 7, 8) to ECDSA (Algorithm 13, ECDSAP256SHA256). Verisign completed the migration for .com, .net, and .edu in late 2023. Multiple ccTLDs (.nl, .br, .cz, .ch, .fr, .at, .ie, .ph) have also migrated [12].

**Why migrate:**

| Property | RSA-2048 (Alg 8) | ECDSA P-256 (Alg 13) | Impact |
|---|---|---|---|
| Signature size | 256 bytes | 64 bytes | 4x smaller responses, reduced amplification |
| Key size | 256 bytes | 64 bytes | Smaller DNSKEY RRsets |
| Signing speed | Baseline | 10x faster | Lower CPU per signed response |
| Verification speed | Faster than ECDSA | Slightly slower | Marginal resolver impact |
| UDP fragmentation risk | Higher (large responses) | Lower | Fewer TCP fallbacks |

**Migration procedure (Algorithm rollover, RFC 6781):**

1. **Introduce new algorithm** -- Add ECDSA KSK and ZSK to the zone alongside existing RSA keys. Sign all records with both algorithms.
2. **Update DS record** -- Publish ECDSA DS record in the parent zone. Both RSA and ECDSA DS records coexist.
3. **Remove old algorithm** -- After sufficient propagation time (at least 2x the maximum TTL of the DS record), remove RSA keys and DS record.
4. **Verify** -- Use `delv`, `drill`, or `dnsviz.net` to confirm the chain of trust is intact with ECDSA only.

The dual-signing period must be long enough for all caches worldwide to expire their old DS records. Rushing this step causes validation failures for resolvers that still have the old DS cached but encounter responses signed only with the new algorithm [13].

### RRSIG Validity and Key Lifetime

NIST SP 800-81r3 (published March 2026) recommends:
- **ZSK signature validity:** 5-14 days
- **ZSK lifetime:** 1-3 months
- **KSK lifetime:** 1-3 years
- **HSM storage** for KSK private keys where practical
- **Algorithm preference:** ECDSA P-256 (Algorithm 13) or Ed25519 (Algorithm 15) over RSA

Short signature validity periods limit the window during which a compromised key can produce valid forgeries. The tradeoff is that signing infrastructure must be highly available -- if the signer is offline for longer than the signature validity period, the zone becomes BOGUS (validation failure) for DNSSEC-aware resolvers [14].

---

## 5. NSEC vs. NSEC3: Authenticated Denial of Existence

When a resolver queries for a name that does not exist, the authoritative server must prove non-existence cryptographically. Simply returning NXDOMAIN is insufficient because an attacker could forge that response. DNSSEC provides two mechanisms for authenticated denial of existence [15].

### NSEC (RFC 4034)

NSEC records form a sorted linked list of all names in the zone. Each NSEC record says "the next name after X is Y, and X has record types A, AAAA, MX." A resolver receiving an NSEC response can verify that no name exists between X and Y.

**Vulnerability: zone walking.** Because NSEC records link every name in sorted order, an attacker can iterate through the entire zone by repeatedly querying for names just past the last NSEC boundary. This enumerates all names in the zone -- a privacy and reconnaissance concern for zones that consider their record names sensitive.

### NSEC3 (RFC 5155)

NSEC3 replaces plaintext names with cryptographic hashes. The linked list connects hashed names rather than actual names, preventing trivial zone enumeration. An attacker can still walk the hashed chain but must brute-force the hash to recover the original name.

**NSEC3 parameters (RFC 9276 guidance):**
- **Hash algorithm:** SHA-1 (the only defined algorithm; this is acceptable because the hash is not used for security-critical authentication)
- **Iterations:** 0 (RFC 9276 explicitly recommends zero additional iterations; higher values waste CPU without meaningfully increasing security)
- **Salt:** Empty (RFC 9276 recommends no salt; salts were intended to prevent pre-computation but provide negligible benefit with zero iterations)

### Comparison and Current Recommendation

| Property | NSEC | NSEC3 |
|---|---|---|
| Zone enumeration | Trivially possible | Requires hash brute-forcing |
| CPU overhead | None (pre-generated) | Hashing per denial response |
| Troubleshooting | Simple (names visible in responses) | Complex (hashes are opaque) |
| Opt-out (unsigned delegations) | Not supported | Supported (reduces zone size for large TLDs) |
| NIST SP 800-81r3 recommendation | Preferred | Acceptable when zone enumeration is a concern |

**Current consensus (2026):** NSEC is preferred for most zones. The protection NSEC3 provides against zone walking is increasingly considered insufficient justification for its computational and debugging overhead. Zone walking was always possible through other means (certificate transparency logs, web crawlers, subdomain brute-forcing). NSEC3 opt-out remains valuable for large TLD zones with many unsigned delegations, where it significantly reduces zone size [16].

---

## 6. DNS-Based Service Discovery

DNS is the oldest and most universally supported service discovery mechanism. Modern service discovery systems build on standard DNS resource records -- particularly SRV and TXT -- to enable services to find each other without hardcoded addresses [17].

### SRV Records (RFC 2782)

```
_http._tcp.example.com.  300  IN  SRV  10 60 8080 web1.example.com.
_http._tcp.example.com.  300  IN  SRV  10 40 8080 web2.example.com.
_http._tcp.example.com.  300  IN  SRV  20  0 8080 web3.example.com.
```

- **Priority 10** targets receive traffic first; priority 20 is backup
- **Weight** distributes within a priority group: web1 gets 60% and web2 gets 40%
- **Port** is specified in the record -- no well-known port assumptions

### DNS-SD (RFC 6763)

DNS-Based Service Discovery extends SRV records with a browsing mechanism. Services register under a well-known naming convention:

```
_services._dns-sd._udp.example.com.  PTR  _http._tcp.example.com.
_http._tcp.example.com.              PTR  Web Server._http._tcp.example.com.
Web Server._http._tcp.example.com.   SRV  0 0 8080 web1.example.com.
Web Server._http._tcp.example.com.   TXT  "path=/api" "version=2.1"
```

This three-layer structure enables clients to discover what service types exist, enumerate instances of each type, and resolve each instance to an address and port with metadata. Apple's Bonjour (mDNS + DNS-SD) uses this pattern for local network discovery [18].

### Consul DNS Interface

HashiCorp Consul exposes its service catalog through a DNS interface, making service discovery available to any application that can resolve DNS names:

```
CONSUL DNS SERVICE DISCOVERY
================================================================

  Application queries:
    web.service.consul      --> A records for all healthy "web" instances
    web.service.dc1.consul  --> A records for "web" in datacenter dc1

  SRV queries:
    _web._tcp.service.consul --> SRV records with port numbers

  Health-aware:
    Consul returns only instances passing health checks.
    Unhealthy instances are removed from DNS responses
    within the health check interval.

  Tag filtering:
    primary.web.service.consul --> only "web" instances tagged "primary"
```

Consul DNS operates on port 8600 by default. Production deployments forward `.consul` queries from the system resolver (Unbound, dnsmasq, or systemd-resolved) to Consul's DNS interface [19].

### CoreDNS in Kubernetes

CoreDNS is the default cluster DNS in Kubernetes since version 1.13. It watches the Kubernetes API for Service and EndpointSlice changes and synthesizes DNS records automatically [20]:

```
COREDNS KUBERNETES SERVICE DISCOVERY
================================================================

  Service: my-app (namespace: production, ClusterIP: 10.96.0.50)

  DNS records created automatically:
    my-app.production.svc.cluster.local.      A    10.96.0.50
    my-app.production.svc.cluster.local.      SRV  0 100 8080 ...

  Headless Service (ClusterIP: None):
    my-app.production.svc.cluster.local.      A    10.244.1.5
    my-app.production.svc.cluster.local.      A    10.244.2.8
    (returns Pod IPs directly)

  Pod DNS:
    10-244-1-5.production.pod.cluster.local.  A    10.244.1.5

  CoreDNS Corefile:
    .:53 {
        kubernetes cluster.local in-addr.arpa ip6.arpa {
            pods insecure
            fallthrough in-addr.arpa ip6.arpa
        }
        forward . /etc/resolv.conf
        cache 30
        loop
        reload
        loadbalance
    }
```

CoreDNS scales horizontally. For large clusters (1000+ nodes), deploy multiple CoreDNS replicas behind a Service and enable the `autopath` plugin to reduce the number of search domain lookups per query from 4-5 to 1 [21].

---

## 7. GeoDNS and Latency-Based Routing

GeoDNS returns different answers based on the geographic location of the resolver (or client, via EDNS Client Subnet). This directs users to the nearest data center without requiring application-layer routing [22].

### How GeoDNS Works

```
GEODNS QUERY FLOW
================================================================

  User in Tokyo --> Resolver in Tokyo
       |
  [1]  Resolver queries authoritative server for www.example.com
  [2]  Authoritative server sees resolver IP is in AS block
       assigned to Japan (or uses EDNS Client Subnet)
  [3]  Server consults GeoIP database (MaxMind GeoLite2/GeoIP2)
  [4]  Returns A record pointing to Tokyo datacenter: 203.0.113.10
       (instead of default US datacenter: 198.51.100.10)
  [5]  TTL is typically short (60-300s) to handle mobility
```

### Platform Comparison

| Platform | Method | Granularity | Health Checks | Notable Feature |
|---|---|---|---|---|
| AWS Route 53 | Geolocation, latency-based, geoproximity | Country/continent/state, plus latency probes | TCP, HTTP, HTTPS | Latency-based uses actual RTT measurements, not GeoIP |
| NS1 | Filter chain (geo, ASN, latency, load) | Highly customizable via filter chain | Multiple protocols | Programmable DNS with Lua-like filter chains |
| PowerDNS GeoIP | GeoIP database backend | Country, continent, region | External (requires scripting) | Open-source, self-hosted, MaxMind integration |
| Cloudflare DNS | Load balancing + geo steering | Region pools | Active health checks | Integrated with CDN and DDoS protection |

### Latency-Based vs. Geographic Routing

Geographic routing assumes proximity equals low latency. This is often true but not always -- a user in Vancouver, Canada may have lower latency to a Seattle datacenter than to a Toronto datacenter despite being geographically closer to Toronto. Latency-based routing (Route 53's specialty) measures actual round-trip times from resolver locations to endpoints and routes based on the measurement, not the map [23].

**TTL considerations for GeoDNS:**
- Short TTLs (60-300s) allow quick failover but increase query volume to authoritative servers
- Long TTLs reduce authoritative load but delay failover and geo-steering changes
- Typical production TTL for GeoDNS: 60-120 seconds

---

## 8. DNS as Control Plane

DNS was designed to map names to addresses. In practice, it has become a lightweight control plane for traffic management, failover orchestration, and deployment strategies. This is not because DNS is ideal for these tasks -- it is because DNS is universally available, requires no client-side changes, and is cached at every layer of the stack [24].

### Traffic Steering Patterns

```
DNS TRAFFIC STEERING PATTERNS
================================================================

  [Weighted round-robin]
  www.example.com  A  198.51.100.10  (weight 70)
  www.example.com  A  203.0.113.20   (weight 30)
  --> 70% of resolvers cache the first IP, 30% cache the second

  [Active-passive failover]
  www.example.com  A  198.51.100.10  (primary, health-checked)
  www.example.com  A  203.0.113.20   (secondary, returned only on
                                      primary health check failure)

  [Blue-green deployment]
  Phase 1: www.example.com  CNAME  blue.example.com  (TTL 60)
  Phase 2: www.example.com  CNAME  green.example.com (TTL 60)
  --> Switch traffic by changing one CNAME record
  --> Rollback: revert the CNAME
  --> Risk: cached old CNAME persists for up to TTL seconds
```

### TTL Strategy for DNS-Based Control

TTL is the tension point in DNS control plane design. Low TTLs enable fast changes but increase load and latency. High TTLs reduce load but make changes slow to propagate [25].

| Scenario | Recommended TTL | Rationale |
|---|---|---|
| Static infrastructure | 3600-86400 (1h-24h) | Rarely changes, maximize caching |
| Active failover | 30-60 | Must propagate failure detection quickly |
| Blue-green deployment | 60-300 | Balance propagation speed vs. cache efficiency |
| GeoDNS with health checks | 60-120 | Frequent re-evaluation needed |
| Pre-migration cutover | Lower TTL 48h before migration, restore after | Drain caches before the change |

**The TTL lie:** Clients and intermediate resolvers do not always honor TTLs. Some resolvers impose minimum TTLs (30-60 seconds). Some client libraries cache DNS results independently of TTL. Java's `InetAddress` historically cached DNS results indefinitely unless configured otherwise. When designing DNS-based failover, assume actual propagation time is 2-5x the TTL [26].

### Limitations as Control Plane

DNS works as a control plane for coarse-grained, client-agnostic traffic distribution. It fails for:

- **Session affinity** -- DNS cannot pin a client to a backend across requests
- **Request-level routing** -- DNS resolves once per TTL, not per request
- **Canary deployments** -- Weighted DNS distributes by resolver cache, not by individual request; a 1% canary cannot be achieved via DNS
- **Instant failover** -- Cached answers persist until TTL expires regardless of backend health

For these use cases, combine DNS-based global load balancing (which data center to reach) with L7 load balancing at the data center edge (which backend to hit).

---

## 9. DNS Security

DNS was designed without authentication, encryption, or integrity checking. Every enhancement since has been a retrofit. The security landscape spans authentication (DNSSEC), encryption (DoH/DoT/DoQ), policy enforcement (RPZ), and DDoS mitigation [27].

### Encrypted DNS: DoH, DoT, and DoQ

| Protocol | Port | Transport | RFC | Client Support | Network Visibility |
|---|---|---|---|---|---|
| DNS over TLS (DoT) | 853 | TLS 1.3 | RFC 7858 | All major resolvers | Visible (distinct port) -- can be blocked |
| DNS over HTTPS (DoH) | 443 | HTTPS/2 or /3 | RFC 8484 | Browsers, OS resolvers, all major recursive resolvers | Invisible (blends with HTTPS) -- difficult to block |
| DNS over QUIC (DoQ) | 853 | QUIC | RFC 9250 | Emerging (AdGuard, NextDNS) | Newer, growing support |

**Enterprise deployment architecture for DoT/DoH:**

```
ENCRYPTED DNS DEPLOYMENT
================================================================

  Client (browser/OS)
       |
  [DoH/DoT] Encrypted to internal resolver
       |
  Internal recursive resolver (Unbound/BIND)
       |-- DNSSEC validation
       |-- RPZ policy enforcement
       |-- Logging and analytics
       |
  [DoT] Encrypted to upstream forwarder (optional)
       |
  Upstream resolver or direct recursion to authoritative servers
```

Enterprise networks that deploy DoH internally must ensure clients use the enterprise resolver rather than bypassing to public DoH providers (Google, Cloudflare). This is achieved through DHCP option configuration, Group Policy (Windows), MDM profiles (macOS/iOS), and network policy blocking external DoH endpoints [28].

The January 2025 US Executive Order mandated DNS encryption for federal systems. Microsoft added DoH resolver support to Windows Server 2025 DNS Server in February 2026. These regulatory and platform milestones are accelerating enterprise DoH/DoT adoption [29].

### Response Policy Zones (RPZ)

RPZ turns a recursive resolver into a DNS firewall. Zone data from threat intelligence feeds (Spamhaus, SURBL, or custom feeds) is loaded into the resolver. When a query matches a policy trigger, the resolver modifies the response according to the policy action [30].

```
RPZ ARCHITECTURE
================================================================

  Recursive Resolver (BIND, Unbound, PowerDNS Recursor)
       |
  RPZ zone loaded via:
  |-- Zone transfer (AXFR/IXFR) from threat intelligence provider
  |-- Local zone file (custom blocklist)
  |-- Multiple RPZ zones with priority ordering
       |
  Query: "malware-c2.evil.com" --> matches RPZ trigger
       |
  Policy actions:
  |-- NXDOMAIN: "domain does not exist"
  |-- NODATA: "domain exists but no records of this type"
  |-- CNAME redirect: send to walled garden / block page
  |-- PASSTHRU: explicitly allow (whitelist override)
  |-- DROP: silently discard query (no response)
```

**RPZ trigger types:**

| Trigger | Matches On | Example Use |
|---|---|---|
| QNAME | Queried domain name | Block known malware C2 domains |
| Client IP | Source IP of querying client | Quarantine compromised hosts |
| Response IP | IP address in the answer | Block resolution to known-bad IPs |
| NSDNAME | Authoritative nameserver name | Block all domains hosted on a malicious NS |
| NSIP | Authoritative nameserver IP | Block all domains served by a malicious NS IP |

RPZ is supported by BIND (since 9.8), PowerDNS Recursor, and Unbound (via rpz module). It is the most widely deployed DNS-layer threat mitigation mechanism in enterprise and ISP networks [31].

### DNS Amplification DDoS

DNS amplification exploits the asymmetry between query size and response size. An attacker sends a small query (~60 bytes) with a spoofed source IP (the victim's IP) to an open resolver. The resolver sends a large response (~3000-4000 bytes for DNSSEC-signed ANY queries) to the victim. Amplification factors of 50-70x are common [32].

**Mitigation strategies:**

- **Rate limiting (RRL)** on authoritative servers -- limits identical responses per second per source prefix
- **Disable open recursion** -- recursive resolvers must only serve configured client networks
- **Response size limits** -- minimize ANY responses (RFC 8482 recommends refusing ANY queries or returning minimal responses)
- **BCP38/BCP84** -- Source address validation at network edges prevents IP spoofing
- **Anycast absorption** -- distribute attack traffic across many PoPs, no single point absorbs full volume

### DNS Exfiltration Detection

DNS tunneling encodes data in DNS queries and responses (often in TXT or NULL records, or encoded in long subdomain labels). Detection signals include [33]:

- Unusually long domain names (>50 characters in subdomain labels)
- High query volume to a single uncommon domain
- High entropy in queried subdomains (base64/hex encoded data)
- TXT record queries to domains not associated with legitimate TXT use (SPF, DKIM, domain verification)
- Consistent query cadence suggesting automated exfiltration

Detection tools: passive DNS monitoring (Farsight DNSDB, Zeek DNS logs), entropy analysis on query logs, machine learning classifiers on query patterns.

---

## 10. DNS at Hyperscale

The largest DNS operations process trillions of queries daily across infrastructure spanning hundreds of cities. Their architectures share common patterns: anycast routing, massive horizontal scaling, custom implementations, and defense-in-depth against DDoS [34].

### Root Server Operations

The DNS root zone is served by 13 logical root server addresses (A through M), operated by 12 independent organizations. The 13-address limit exists because the original DNS response size limit (512 bytes for UDP) could fit exactly 13 NS records with their glue A records. With EDNS0 allowing larger responses, the limit is now convention rather than technical necessity [35].

As of late 2025, approximately **1,954 physical root server instances** exist worldwide, deployed via anycast. Each logical root address maps to dozens or hundreds of physical servers across multiple continents. The largest deployments:

| Root | Operator | Instances (approx.) | Notable |
|---|---|---|---|
| L-root | ICANN | 290+ | Largest single deployment |
| K-root | RIPE NCC | 100+ | Distributed across RIPE region |
| F-root | ISC | 300+ | Pioneer of anycast root deployment |
| J-root | Verisign | 200+ | Also operates A-root |

Root servers primarily answer with referrals -- "I do not have the answer, but the .com TLD servers are at these addresses." The root zone itself is small (~2MB), updated roughly twice daily by IANA, and signed with DNSSEC. Root server traffic is predominantly negative (NXDOMAIN for non-existent TLDs) and referral responses [36].

### Cloudflare 1.1.1.1

Cloudflare operates its public recursive resolver across **330+ cities** using its existing CDN anycast network. Key architectural characteristics [37]:

- **Anycast routing** -- Every data center in Cloudflare's network can answer 1.1.1.1 queries; BGP routing sends queries to the nearest PoP
- **Performance** -- Consistently ranked fastest public resolver by DNSPerf, with average response times under 10ms in most regions
- **Privacy by design** -- No logging of client IP addresses; independent audit by KPMG confirms compliance; query logs purged within 24 hours
- **DNSSEC validation** -- All responses are DNSSEC-validated
- **DoH and DoT** -- Full encrypted DNS support on launch (April 2018)
- **QNAME minimization** -- Reduces information leaked to authoritative servers during recursion

### Google Public DNS (8.8.8.8)

Google Public DNS is a custom-built recursive resolver handling over a trillion queries per day [38]:

- **Custom implementation** -- Does not use BIND, Unbound, or any standard DNS software; entirely custom-engineered
- **Prefetch** -- Proactively refreshes popular records before TTL expiry, ensuring near-zero latency for frequently queried domains
- **Case randomization (0x20 encoding)** -- Randomizes the case of query name letters as an additional anti-spoofing mechanism
- **Global anycast** -- Leverages Google's private backbone and edge PoPs worldwide
- **DNSSEC validation** -- Full validation with aggressive NSEC caching
- **DoH and DoT** -- Available at dns.google

### Architecture Pattern: Hyperscale Recursive Resolver

```
HYPERSCALE RECURSIVE RESOLVER ARCHITECTURE
================================================================

  Client query (UDP/TCP/DoH/DoT)
       |
  [Anycast edge PoP -- nearest city]
       |
  [Frontend] Connection handling, protocol termination
       |-- DoH: HTTPS termination, HTTP/2 multiplexing
       |-- DoT: TLS 1.3 termination
       |-- UDP/TCP: standard DNS protocol handling
       |
  [Cache layer] Distributed in-memory cache
       |-- Cache hit (80-95% of queries) --> immediate response
       |-- Cache miss --> recursive resolution
       |
  [Recursive engine] Full iterative resolution
       |-- DNSSEC validation
       |-- QNAME minimization
       |-- Prefetch for popular names
       |-- Rate limiting to authoritative servers
       |
  [Authoritative query] Root --> TLD --> Authoritative
       |-- Uses dedicated egress IPs for reputation
       |-- Connection reuse (TCP/TLS to authoritative servers)
       |
  [Response] Cached + returned to client
```

The cache hit ratio is the defining metric. At hyperscale, 85-95% of queries are served from cache, meaning the recursive engine handles only 5-15% of incoming query volume. This is what makes trillion-query-per-day operation feasible -- the vast majority of queries never leave the local PoP [39].

---

## 11. Operational Checklists

### Authoritative DNS Deployment Checklist

```
AUTHORITATIVE DNS -- OPERATIONAL READINESS
================================================================

  [ ] Hidden primary configured and not listed in NS records
  [ ] Minimum 2 secondary nameservers on different networks
  [ ] Zone transfers secured with TSIG and ACLs
  [ ] NOTIFY configured from primary to all secondaries
  [ ] SOA timers set: refresh 3600, retry 900, expire 604800
  [ ] DNSSEC enabled: KSK + ZSK generated, DS in parent zone
  [ ] Algorithm: ECDSA P-256 (Algorithm 13) or Ed25519 (15)
  [ ] ZSK rotation automated (30-90 day cycle)
  [ ] KSK rotation procedure documented and tested
  [ ] RRSIG validity: 7-14 days
  [ ] Monitoring: zone serial propagation, DNSSEC signature expiry
  [ ] Response rate limiting (RRL) enabled
  [ ] ANY query handling: refuse or minimal response (RFC 8482)
  [ ] Zone file version controlled in git
  [ ] Disaster recovery: zone file backups, key material escrow
```

### Recursive DNS Deployment Checklist

```
RECURSIVE DNS -- OPERATIONAL READINESS
================================================================

  [ ] Access control: only configured client networks can query
  [ ] Open recursion disabled (not answering arbitrary internet queries)
  [ ] DNSSEC validation enabled with auto-managed trust anchor
  [ ] Cache sizing: rrset-cache-size >= 2x msg-cache-size
  [ ] Prefetch enabled for popular records
  [ ] Serve-expired enabled with reasonable TTL (86400)
  [ ] QNAME minimization enabled
  [ ] RPZ threat feeds configured (if applicable)
  [ ] DoH/DoT endpoints configured (if client support exists)
  [ ] Monitoring: query rate, cache hit ratio, SERVFAIL rate
  [ ] Logging: query logging for security analysis (with retention policy)
  [ ] Redundancy: multiple resolver instances behind anycast or load balancer
  [ ] Upstream forwarder diversity (if forwarding, use multiple upstreams)
```

### DNSSEC Key Rotation Checklist

```
DNSSEC KEY ROTATION (ZSK) -- PROCEDURE
================================================================

  [ ] Generate new ZSK with same algorithm as current
  [ ] Pre-publish: add new DNSKEY to zone, wait for TTL propagation
  [ ] Activate: begin signing with new ZSK
  [ ] Old signatures still valid (within RRSIG validity window)
  [ ] Wait: RRSIG validity period + max cache TTL
  [ ] Remove: retire old ZSK from zone
  [ ] Verify: dig +dnssec, delv, or dnsviz.net shows clean chain
  [ ] Monitor: check for SERVFAIL spikes in resolver logs

  DNSSEC KEY ROTATION (KSK) -- PROCEDURE
  ================================================================

  [ ] Generate new KSK
  [ ] Double-KSK: publish both old and new DNSKEY records
  [ ] Submit new DS record to parent zone (registrar)
  [ ] Wait: parent DS TTL + old DS cache expiry
  [ ] Verify: both DS records resolve, chain validates with both
  [ ] Remove old KSK from zone
  [ ] Request removal of old DS from parent zone
  [ ] Verify: chain validates with new KSK/DS only
  [ ] Monitor for 48-72 hours for validation failures
```

---

## 12. Cross-References

> **Related:** [Network Architecture & Design](01-network-architecture-design.md) -- DNS infrastructure as a network service dependency. [Load Balancing & Traffic Engineering](04-load-balancing-traffic-engineering.md) -- DNS-based GSLB and anycast. [Network Security Engineering](05-network-security-engineering.md) -- DNS as attack vector and defense layer. [Cloud Networking](06-cloud-networking.md) -- cloud DNS services (Route 53, Cloud DNS, Azure DNS). [Network Reliability & DR](10-network-reliability-dr.md) -- DNS failover and anycast resilience.

**Series cross-references:**
- **DNS (DNS Protocol)** -- Protocol foundations (RFC 1034/1035, message format, resource record types). SNE Module 9 covers the engineering discipline; DNS covers the protocol itself.
- **TCP (TCP/IP Protocol)** -- DNS transport over TCP, DNS flag day, EDNS0 buffer sizes.
- **SYA (Systems Administration)** -- Resolver configuration, /etc/resolv.conf, systemd-resolved.
- **K8S (Kubernetes)** -- CoreDNS as cluster DNS, service discovery, headless services.
- **OPS (Cloud Operations)** -- Neutron DHCP/DNS integration, designate DNS-as-a-service.
- **SOO (Systems Operations)** -- DNS monitoring, incident response for DNS outages.
- **RFC (RFC Archive)** -- RFC 1034/1035 (DNS), RFC 4033-4035 (DNSSEC), RFC 8484 (DoH), RFC 7858 (DoT).
- **DRP (Disaster Recovery)** -- DNS failover patterns, zone backup, key escrow.

---

## 13. Sources

1. Albitz, P. and C. Liu. *DNS and BIND*. 5th ed. O'Reilly Media, 2006.
2. DN.org. "Hidden Primary Name Servers: Why and How." dn.org/hidden-primary-name-servers-why-and-how/, 2025.
3. IETF. "DNS Zone Transfer Protocol (AXFR)." RFC 5936, 2010.
4. ISC. "AXFR-style IXFR Explained." kb.isc.org/docs/axfr-style-ixfr-explained, 2024.
5. IETF. "Domain Names -- Concepts and Facilities." RFC 1034, 1987.
6. DN.org. "Evaluating the Strengths and Suitability of BIND, NSD, Knot DNS, and PowerDNS." dn.org, 2025.
7. Moura, G. et al. "Benchmarking Authoritative DNS Servers." ResearchGate, 2020.
8. NLnet Labs. "Unbound Documentation." nlnetlabs.nl/documentation/unbound/, 2025.
9. NLnet Labs. "Unbound Configuration." unbound.docs.nlnetlabs.nl/en/latest/, 2025.
10. IETF. "Aggressive Use of DNSSEC-Validated Cache." RFC 8198, 2017.
11. IETF. "DNS Security Introduction and Requirements." RFC 4033, 2005.
12. Verisign Blog. "Verisign Will Help Strengthen Security with DNSSEC Algorithm Update." blog.verisign.com/security/dnssec-algorithm-update/, 2023.
13. IETF. "DNSSEC Operational Practices, Version 2." RFC 6781, 2012.
14. NIST. "Secure Domain Name System (DNS) Deployment Guide." SP 800-81r3, March 2026.
15. DNS Institute. "Proof of Non-Existence (NSEC and NSEC3)." dnsinstitute.com/documentation/dnssec-guide/, 2024.
16. IETF. "Guidance for NSEC3 Parameter Settings." RFC 9276, 2022.
17. IETF. "A DNS RR for Specifying the Location of Services (DNS SRV)." RFC 2782, 2000.
18. IETF. "DNS-Based Service Discovery." RFC 6763, 2013.
19. HashiCorp. "Consul DNS Interface." developer.hashicorp.com/consul/docs/services/discovery/dns-overview, 2025.
20. Kubernetes Documentation. "Using CoreDNS for Service Discovery." kubernetes.io/docs/tasks/administer-cluster/coredns/, 2025.
21. CoreDNS Documentation. "Kubernetes Plugin." coredns.io/plugins/kubernetes/, 2025.
22. AWS Documentation. "Choosing a Routing Policy." docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html, 2025.
23. AWS Documentation. "Latency-Based Routing." docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-latency.html, 2025.
24. Cloudflare. "What Is Anycast DNS?" cloudflare.com/learning/dns/what-is-anycast-dns/, 2025.
25. Cloudflare. "DNS TTL." cloudflare.com/learning/dns/dns-records/dns-record-ttl/, 2025.
26. Sommese, R. et al. "Characterization of Anycast Adoption in the DNS Authoritative Infrastructure." PAM 2021.
27. Cloudflare. "DNS Security." cloudflare.com/learning/dns/dns-security/, 2025.
28. Calmops. "DNS Security and DoH/DoT Complete Guide 2026." calmops.com/network/dns-security-doh-dot-complete-guide/, 2026.
29. 4sysops. "Enable DoH in Windows Server 2025 DNS Server." 4sysops.com, February 2026.
30. ISC. "Response Policy Zones (RPZ)." isc.org/rpz/, 2025.
31. Spamhaus. "DNS Response Policy Zones." spamhaus.com/data-access/dns-response-policy-zones/, 2025.
32. IETF. "Providing Minimal-Sized Responses to DNS Queries That Have QTYPE=ANY." RFC 8482, 2019.
33. SANS Institute. "Detecting DNS Tunneling." sans.org/reading-room/, 2023.
34. ICANN. "Root Server System." icann.org/en/system/files/files/root-server-system-en.pdf, 2024.
35. Wikipedia. "Root Name Server." en.wikipedia.org/wiki/Root_name_server, updated December 2025.
36. APNIC Blog. "Measuring DNS Root Servers Under Change." blog.apnic.net/2025/02/26/, February 2025.
37. Cloudflare. "What is 1.1.1.1?" cloudflare.com/learning/dns/what-is-1.1.1.1/, 2025.
38. Google. "Public DNS." developers.google.com/speed/public-dns, 2025.
39. Google SRE Prodcast. "Google Public DNS with Wilmer van der Gaast and Andy Sykes." sre.google/prodcast/transcripts/sre-prodcast-03-08/, 2024.

---

*Systems Network Engineering -- Module 9: DNS Engineering at Scale. The system that maps names to numbers is the foundation beneath every other networked system. When DNS fails, nothing works. When DNS is slow, everything is slow. When DNS is compromised, trust is gone. DNS engineering is the discipline of ensuring none of these things happen -- and of recovering quickly when they do.*
