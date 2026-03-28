# Resolution Architecture

> **Domain:** Internet Protocol / DNS
> **Module:** 3 -- The Resolution Stack
> **Through-line:** *DNS resolution is a tree walk disguised as a lookup table. The stub resolver asks a recursive resolver. The recursive resolver asks the root. The root says "I don't know, but the .com TLD does." The TLD says "I don't know, but example.com does." The authoritative server says "here is your answer." No single server knows everything. Every server knows who to ask next. That delegation chain -- that willingness to say "not me, try them" -- is what makes planetary-scale name resolution possible from 13 logical addresses.*

---

## Table of Contents

1. [Resolver Taxonomy](#1-resolver-taxonomy)
2. [The Full Resolution Walk](#2-the-full-resolution-walk)
3. [Referral Mechanics](#3-referral-mechanics)
4. [Glue Records and the Bailiwick Rule](#4-glue-records-and-the-bailiwick-rule)
5. [Caching and TTL Mechanics](#5-caching-and-ttl-mechanics)
6. [Negative Caching](#6-negative-caching)
7. [Root Server Infrastructure](#7-root-server-infrastructure)
8. [NXDOMAIN vs NODATA](#8-nxdomain-vs-nodata)
9. [CNAME Chain Resolution](#9-cname-chain-resolution)
10. [Implementation Traps](#10-implementation-traps)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Resolver Taxonomy

DNS defines four distinct resolver roles, each with specific behavioral requirements [1][2]:

### Stub Resolver

The stub resolver is the OS-level DNS client library (e.g., `getaddrinfo()` on POSIX, `DnsQuery` on Windows). It cannot follow referrals or perform iterative resolution. It sends recursive queries (RD=1) to a configured recursive resolver and accepts the final answer. Every application that resolves a domain name uses a stub resolver [1].

Configuration sources: `/etc/resolv.conf` (Linux/macOS), DHCP-assigned DNS servers, manual network settings. The stub resolver typically has a small local cache (nscd on Linux, mDNSResponder on macOS).

### Recursive Resolver (Full-Service)

The recursive resolver is the workhorse of DNS. It receives queries from stub resolvers and follows the delegation chain from root to authoritative, caching results along the way. Also called a "caching resolver" or "full-service resolver" [1][3]:

- Accepts recursive queries (RD=1) from clients
- Sends iterative queries (RD=0) to authoritative servers
- Maintains a cache keyed by (name, type, class) with TTL-based expiry
- Examples: Unbound, BIND (recursive mode), Knot Resolver, Google 8.8.8.8, Cloudflare 1.1.1.1

### Forwarding Resolver

A forwarding resolver passes queries to another recursive resolver rather than resolving them directly. Used for policy enforcement, caching at network edges, or VPN split-DNS configurations [4]:

- Accepts queries from local clients
- Forwards to an upstream recursive resolver (not the root)
- May cache results locally
- Examples: dnsmasq, systemd-resolved (forwarding mode), Pi-hole

### Authoritative Server

An authoritative server holds the zone file and answers queries for its zones definitively. It does not recurse and does not follow referrals. The AA bit is set in its responses [1]:

- Answers queries for zones it serves
- Returns referrals (NS records) for subzones it has delegated
- Never makes recursive queries on behalf of clients
- Examples: BIND (authoritative mode), PowerDNS Authoritative, NSD, AWS Route 53, Cloudflare DNS

```
RESOLVER HIERARCHY
================================================================

  Application
      |
      v
  [Stub Resolver]  (OS library, /etc/resolv.conf)
      |  recursive query (RD=1)
      v
  [Forwarding Resolver]  (optional: dnsmasq, Pi-hole)
      |  recursive query (RD=1)
      v
  [Recursive Resolver]  (8.8.8.8, 1.1.1.1, Unbound)
      |  iterative queries (RD=0)
      v
  [Root] -> [TLD] -> [Authoritative]
```

---

## 2. The Full Resolution Walk

A complete DNS resolution for `www.example.com` traverses the hierarchy from stub through root to authoritative [1][3]:

```
FULL RESOLUTION WALK: www.example.com IN A
================================================================

1. Browser calls getaddrinfo("www.example.com")

2. Stub resolver checks /etc/hosts, local cache
   -> Cache miss

3. Stub sends recursive query to configured resolver (e.g., 8.8.8.8)
   Query: www.example.com IN A, RD=1, ID=0xAB12

4. Recursive resolver checks its cache
   -> Cache miss; begins iterative resolution

5. Resolver -> Root server (one of a.root-servers.net through m.root-servers.net)
   Query: www.example.com IN A, RD=0 (iterative)
   Response: RCODE=NOERROR, AA=0
     AUTHORITY: com. NS a.gtld-servers.net. (+ more NS)
     ADDITIONAL: a.gtld-servers.net. A 192.5.6.30 (glue)

6. Resolver -> .com TLD server (a.gtld-servers.net)
   Query: www.example.com IN A, RD=0 (iterative)
   Response: RCODE=NOERROR, AA=0
     AUTHORITY: example.com. NS ns1.example.com. (+ more NS)
     ADDITIONAL: ns1.example.com. A 93.184.216.34 (glue)

7. Resolver -> example.com authoritative (ns1.example.com)
   Query: www.example.com IN A, RD=0 (iterative)
   Response: RCODE=NOERROR, AA=1
     ANSWER: www.example.com. 86400 IN A 93.184.216.34

8. Resolver caches: www.example.com A 93.184.216.34 TTL=86400

9. Resolver returns answer to stub resolver
   Response: RCODE=NOERROR, RA=1
     ANSWER: www.example.com. A 93.184.216.34

10. Browser connects to 93.184.216.34
```

This 10-step walk happens in approximately 50-200ms for a cold cache. With warm caches, the resolver may already have the TLD NS records cached, reducing the walk to 1-2 steps. Popular domains are resolved from cache in under 1ms [3][5].

---

## 3. Referral Mechanics

A referral response tells the resolver "I don't have the answer, but this other server does." Referrals have a specific signature [1][6]:

- **RCODE:** NOERROR (not an error -- the server successfully directed the query)
- **AA bit:** 0 (the server is not authoritative for the queried name)
- **Answer section:** Empty
- **Authority section:** NS records for the delegated zone
- **Additional section:** Glue A/AAAA records for the NS names

The resolver must distinguish three response types at each step:

| Response Type | RCODE | AA | Answer | Authority | Action |
|---------------|-------|----|--------|-----------|--------|
| Answer | NOERROR | 1 | Has RRs | May have SOA | Return to client |
| Referral | NOERROR | 0 | Empty | Has NS | Follow delegation |
| NXDOMAIN | NXDOMAIN | 1 | Empty | Has SOA | Return NXDOMAIN, cache negative |
| NODATA | NOERROR | 1 | Empty | Has SOA | Return empty, cache negative |

The distinction between NXDOMAIN (name does not exist at all) and NODATA (name exists but has no records of the requested type) is critical for correct caching behavior [7].

---

## 4. Glue Records and the Bailiwick Rule

### The Circular Dependency Problem

When a zone delegates to name servers whose names are *within* the delegated zone, a circular dependency arises. To resolve `ns1.example.com`, you need to query the `example.com` zone, but to find the `example.com` zone servers, you need the NS record pointing to `ns1.example.com`. Glue records break this cycle [1][6]:

```
GLUE RECORD EXAMPLE
================================================================

Parent zone (.com) contains:
  example.com.      NS    ns1.example.com.    <- delegation
  example.com.      NS    ns2.example.com.    <- delegation
  ns1.example.com.  A     198.51.100.1        <- glue (in parent!)
  ns2.example.com.  A     198.51.100.2        <- glue (in parent!)

These A records for ns1/ns2 are "glue" -- they exist in the parent
zone (.com) even though ns1.example.com is logically part of the
example.com zone. Without them, the resolver could never reach
the example.com servers.
```

Glue is only *required* when the NS target is within the delegated zone (in-bailiwick). If `example.com` delegates to `ns1.otherdomain.net`, no glue is needed because `ns1.otherdomain.net` can be resolved independently [6].

### The Bailiwick Rule

The bailiwick rule prevents cache poisoning via forged glue records. A resolver must not cache additional-section records for names that are outside the authority of the zone being queried [6][8]:

- Response from `.com` TLD server may include glue for `ns1.example.com` (in-bailiwick) -- accepted
- Response from `.com` TLD server includes an A record for `evil.attacker.com` -- out of bailiwick, **must be discarded**

This rule was a critical hardening step after early cache poisoning attacks demonstrated that unchecked additional-section records could redirect arbitrary names to attacker-controlled IPs [8].

---

## 5. Caching and TTL Mechanics

Caching is what makes DNS viable at scale. Without caching, every domain lookup would require a full root-to-authoritative walk -- approximately 100 billion such walks per day globally. With caching, the vast majority of queries are answered in microseconds from local cache [1][3][5]:

### TTL Rules

- Each cached RR has a TTL countdown timer. When TTL reaches 0, the entry expires and must be re-queried.
- TTL range: 0 (do not cache) to 2,147,483,647 seconds (~68 years). RFC 2181 clarifies TTL is unsigned 32-bit [6].
- Resolvers *must* decrement TTL values in cached records before returning them to clients. A record cached with TTL=3600 that has been cached for 600 seconds is returned with TTL=3000.
- Resolvers *may* cap maximum TTL (RFC 8767 recommends serving stale data rather than failing, with configurable behavior) [9].

### Typical TTL Values

| Use Case | TTL (seconds) | TTL (human) |
|----------|---------------|-------------|
| CDN / dynamic DNS | 30-300 | 30s - 5min |
| Standard A/AAAA records | 3600-86400 | 1hr - 1day |
| MX records | 3600-86400 | 1hr - 1day |
| NS records (zone delegation) | 86400-172800 | 1-2 days |
| Root zone NS records | 518400 | 6 days |
| SOA (negative cache) | 3600 | 1 hour |

---

## 6. Negative Caching

RFC 2308 defines how resolvers cache negative responses (NXDOMAIN and NODATA). Without negative caching, non-existent domains would generate repeated queries to authoritative servers [7]:

### Negative Cache TTL Calculation

The negative cache TTL is the **minimum** of:
1. The SOA MINIMUM field value
2. The SOA record's own TTL

This means the zone administrator controls how long negative answers are cached through two separate fields. The recommended cap is 10,800 seconds (3 hours) to prevent excessively long negative caching [7].

```
NEGATIVE CACHING EXAMPLE
================================================================

Query: nonexistent.example.com IN A
Response: RCODE=NXDOMAIN, AA=1
  AUTHORITY: example.com. 3600 IN SOA ns1.example.com. admin.example.com. (
             2026032701 86400 7200 3600000 3600 )

Negative TTL = min(SOA TTL=3600, SOA MINIMUM=3600) = 3600 seconds

For the next 3600 seconds, the resolver answers NXDOMAIN from cache
without querying the authoritative server.
```

---

## 7. Root Server Infrastructure

The root zone is served by 13 logical name server addresses, labeled A through M. These 13 addresses are maintained by 12 organizations spanning multiple countries [3][10]:

| Letter | Operator | IPv4 | Anycast Instances |
|--------|----------|------|-------------------|
| A | Verisign | 198.41.0.4 | Global |
| B | USC-ISI | 170.247.170.2 | Global |
| C | Cogent | 192.33.4.12 | Global |
| D | U of Maryland | 199.7.91.13 | Global |
| E | NASA Ames | 192.203.230.10 | Global |
| F | ISC | 192.5.5.241 | Global |
| G | US DoD | 192.112.36.4 | Global |
| H | US Army | 198.97.190.53 | Global |
| I | Netnod (Sweden) | 192.36.148.17 | Global |
| J | Verisign | 192.58.128.30 | Global |
| K | RIPE NCC | 193.0.14.129 | Global |
| L | ICANN | 199.7.83.42 | Global |
| M | WIDE (Japan) | 202.12.27.33 | Global |

Each logical address is served by many physical servers worldwide via **IP anycast**, resulting in over 1,600 physical root server instances globally. An anycast address is advertised by multiple physical servers in different locations; BGP routing directs each query to the nearest physical instance [10].

The root zone itself is small -- approximately 2,500 lines -- containing only NS and A/AAAA records for the ~1,500 TLD name servers. The entire root zone can be transferred via AXFR and is publicly available from ICANN [10][11].

### Why Exactly 13?

The original constraint was the 512-byte UDP message size limit from RFC 1035. A response containing 13 NS records with their A record glue fits within 512 bytes. With EDNS0, more could be carried, but changing the root server count would require updating every resolver's built-in hints file -- a coordination problem of planetary scale [3][10].

---

## 8. NXDOMAIN vs NODATA

Two negative response types that resolvers must distinguish [7]:

**NXDOMAIN** (RCODE 3): The queried name does not exist in the DNS namespace. The entire name is non-existent, regardless of record type. NXDOMAIN applies to the name itself, not to a specific type.

**NODATA** (RCODE 0 with empty answer): The name exists but has no records of the queried type. For example, `example.com` has A records but no AAAA records -- querying for AAAA returns NODATA, not NXDOMAIN.

```
NXDOMAIN vs NODATA
================================================================

Query: nonexistent.example.com IN A
Response: RCODE=3 (NXDOMAIN)
  -> This name does not exist at all
  -> Cache: "nonexistent.example.com does not exist" (for negative TTL)

Query: example.com IN AAAA  (when only A records exist)
Response: RCODE=0 (NOERROR), empty answer section
  -> Name exists, but no AAAA records
  -> Cache: "example.com has no AAAA" (for negative TTL)
```

Both are cached according to RFC 2308 negative caching rules, but they have different scoping: NXDOMAIN covers all types for the name; NODATA covers only the specific type queried [7].

---

## 9. CNAME Chain Resolution

When a resolver encounters a CNAME in the answer, it must restart the query for the canonical name. CNAME chains can involve multiple hops [1][6]:

```
CNAME CHAIN RESOLUTION
================================================================

Query: www.example.com IN A

Step 1: Authoritative returns CNAME
  www.example.com. CNAME cdn.provider.net.

Step 2: Resolver queries cdn.provider.net IN A
  cdn.provider.net. CNAME edge-us-west.provider.net.

Step 3: Resolver queries edge-us-west.provider.net IN A
  edge-us-west.provider.net. A 203.0.113.42

Final answer returned to client includes all three records:
  www.example.com.          CNAME  cdn.provider.net.
  cdn.provider.net.         CNAME  edge-us-west.provider.net.
  edge-us-west.provider.net.  A    203.0.113.42
```

Resolvers must enforce a maximum CNAME chain length (typically 8-16 hops) to prevent infinite loops caused by circular CNAMEs [6].

---

## 10. Implementation Traps

### Common Resolution Failures

- **Lame delegation:** NS records point to a server that is not configured to serve the zone. The server returns REFUSED or SERVFAIL. Resolvers must try alternate NS records [12].
- **CNAME loops:** `a.example.com CNAME b.example.com` and `b.example.com CNAME a.example.com` create an infinite loop. Enforce maximum chain depth [6].
- **Glue mismatch:** Parent zone has stale glue pointing to an old IP. The actual NS server has moved. Queries succeed via iterative resolution but fail for resolvers that trust the glue without verification.
- **DNSSEC time skew:** RRSIG records have explicit validity windows. If the resolver's clock is wrong by more than the signature validity period, all DNSSEC validation fails with SERVFAIL [13].
- **Aggressive NXDOMAIN caching:** RFC 8020 allows resolvers to synthesize NXDOMAIN for subdomains of a known-NXDOMAIN name. This can cause issues with dynamic DNS where child names are created after the parent was cached as NXDOMAIN [14].

> **SAFETY WARNING:** DNS resolution failures cascade. If a recursive resolver cannot reach the root servers (network partition, DDoS), it cannot resolve *any* domain whose cached records have expired. This is why resolver operators maintain locally cached copies of the root zone (RFC 8806) as a resilience measure [15].

---

## 11. Cross-References

> **Related:** [Wire Protocol](01-wire-protocol-message-format.md) -- message format for queries and responses; [Resource Records](02-resource-record-taxonomy.md) -- the record types returned in each section; [Zone Management](04-zone-management.md) -- how zones are populated and maintained; [DNSSEC](05-dnssec.md) -- how validation interacts with resolution; [Extensions](06-modern-extensions-privacy.md) -- DoT/DoH encrypted resolution paths

**Related PNW Research Projects:**
- **SYS** -- Systems Administration covers resolver deployment and operational monitoring
- **K8S** -- Kubernetes CoreDNS implements cluster-internal resolution with custom zone files
- **CMH** -- Computational Mesh covers DNS as the service discovery backbone
- **RFC** -- RFC Archive documents the standards behind resolution behavior
- **PSS** -- PNW Signal Stack covers DNS resolution as part of the network signal chain
- **FCC** -- FCC Catalog covers spectrum allocation underlying the physical network DNS traverses

---

## 12. Sources

1. RFC 1034 -- Domain Names: Concepts and Facilities (Mockapetris, 1987)
2. RFC 9499 -- DNS Terminology (Hoffman et al., 2024)
3. Cloudflare DNS Documentation -- https://developers.cloudflare.com/dns/
4. ISC BIND 9 Administrator Reference Manual, v9.21
5. APNIC Labs -- DNS Transit Time Measurements (2024)
6. RFC 2181 -- Clarifications to the DNS Specification (Elz and Bush, 1997)
7. RFC 2308 -- Negative Caching of DNS Queries (Andrews, 1998)
8. Kaminsky, D. -- "Black Ops 2008" (Black Hat USA, 2008)
9. RFC 8767 -- Serving Stale Data to Improve DNS Resiliency (Lawrence et al., 2020)
10. IANA Root Zone Database -- https://www.iana.org/domains/root/db
11. Root Zone File -- https://www.internic.net/domain/root.zone
12. RFC 1912 -- Common DNS Operational and Configuration Errors (Barr, 1996)
13. RFC 4035 -- Protocol Modifications for DNS Security Extensions (Arends et al., 2005)
14. RFC 8020 -- NXDOMAIN: There Really Is Nothing Underneath (Bortzmeyer and Huque, 2016)
15. RFC 8806 -- Running a Root Server Local to a Resolver (Kumari and Hoffman, 2020)
16. RFC 1035 -- Domain Names: Implementation and Specification (Mockapetris, 1987)
17. ICANN Root Server Technical Operations -- https://root-servers.org/
18. RFC 5452 -- Measures for Making DNS More Resilient against Forged Answers (Hubert and van Mook, 2009)
