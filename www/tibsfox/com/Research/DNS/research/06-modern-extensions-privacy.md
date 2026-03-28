# Modern Extensions & Privacy Stack

> **Domain:** Internet Protocol / DNS
> **Module:** 6 -- EDNS0, Encrypted Transport, and Privacy Mechanisms
> **Through-line:** *DNS was born plaintext. Every query and every response traveled the wire in the clear, readable by any network observer between client and resolver. For 30 years, this was accepted as the cost of simplicity. Then the Snowden disclosures demonstrated the scale of passive DNS surveillance, and the protocol community responded with a stack of privacy extensions: encrypted transport (DoT, DoH, DoQ), query minimization (QNAME), and architectural partitioning (ODoH). The original protocol didn't change. The layers above and below it did.*

---

## Table of Contents

1. [EDNS0: Extension Mechanisms for DNS](#1-edns0-extension-mechanisms-for-dns)
2. [OPT Record Wire Format](#2-opt-record-wire-format)
3. [EDNS0 Option Codes](#3-edns0-option-codes)
4. [DNS over TLS (DoT)](#4-dns-over-tls-dot)
5. [DNS over HTTPS (DoH)](#5-dns-over-https-doh)
6. [DNS over QUIC (DoQ)](#6-dns-over-quic-doq)
7. [Privacy Extension Comparison](#7-privacy-extension-comparison)
8. [QNAME Minimization](#8-qname-minimization)
9. [Oblivious DNS over HTTPS (ODoH)](#9-oblivious-dns-over-https-odoh)
10. [DNS Client Subnet (ECS)](#10-dns-client-subnet-ecs)
11. [Extended DNS Errors (EDE)](#11-extended-dns-errors-ede)
12. [DNS Cookies](#12-dns-cookies)
13. [Implementation Considerations](#13-implementation-considerations)
14. [Cross-References](#14-cross-references)
15. [Sources](#15-sources)

---

## 1. EDNS0: Extension Mechanisms for DNS

EDNS0 (Extension Mechanisms for DNS, version 0, RFC 6891) is the foundation of all modern DNS extensions. It extends the protocol through a pseudo-resource record (OPT, Type 41) placed in the additional section of DNS messages [1]:

**Key capabilities:**
- **Larger UDP messages:** Clients advertise their maximum UDP payload size, removing the 512-byte legacy constraint
- **Extended RCODE:** 8 additional bits beyond the 4-bit header RCODE field (12-bit total)
- **EDNS version:** Protocol version negotiation (currently only version 0 is defined)
- **DO bit:** "DNSSEC OK" -- client requests DNSSEC records in the response
- **Option codes:** Extensible key-value option mechanism for carrying extension data

EDNS0 is critical for DNSSEC: signed responses regularly exceed 512 bytes, and the DO bit is the only way for a resolver to signal DNSSEC support. Without EDNS0, DNSSEC cannot function [1][2].

---

## 2. OPT Record Wire Format

The OPT record repurposes standard RR fields for extension signaling [1]:

```
OPT PSEUDO-RR WIRE FORMAT
================================================================

NAME      : 0x00 (root domain -- always empty)
TYPE      : 41 (OPT)
CLASS     : Sender's UDP payload size (e.g., 4096)
TTL       : [Extended RCODE (8)] [EDNS Version (8)] [Flags (16)]
            -- Flags bit 15 = DO (DNSSEC OK)
RDLENGTH  : Length of options data
RDATA     : Sequence of option TLVs:
            +--+--+--+--+--+--+--+--+
            | OPTION-CODE   (16-bit) |
            | OPTION-LENGTH (16-bit) |
            | OPTION-DATA  (variable)|
            +--+--+--+--+--+--+--+--+
            ... repeated for each option
```

### Rules

- At most one OPT record per DNS message
- OPT must appear only in the additional section
- If a server does not support EDNS0, it returns FORMERR (RFC 6891 Section 7)
- The CLASS field value is interpreted as the sender's maximum UDP payload size, not as a DNS class
- Common UDP payload sizes: 1232 bytes (DNS Flag Day 2020 recommendation to avoid IP fragmentation), 4096 bytes (traditional default) [1][3]

---

## 3. EDNS0 Option Codes

The IANA-assigned EDNS0 option codes extend DNS with specific capabilities [1][4]:

| Code | Option | RFC | Purpose |
|------|--------|-----|---------|
| 3 | NSID | 5001 | Name Server Identifier -- returns unique server instance ID for diagnostics |
| 8 | ECS | 7871 | Client Subnet -- includes truncated client IP for CDN geolocation |
| 9 | EXPIRE | 7314 | Zone expiration timer -- secondary can learn when zone data expires |
| 10 | COOKIE | 7873 | DNS Cookies -- lightweight authentication to prevent source IP spoofing |
| 11 | TCP Keepalive | 7828 | Signals TCP connection reuse parameters |
| 12 | PADDING | 7830 | Adds padding bytes to prevent traffic analysis via message size |
| 15 | EDE | 8914 | Extended DNS Errors -- detailed error information beyond RCODE |

Each option is independently negotiated: a client includes the options it supports, and the server includes options it supports in the response. Unknown options are ignored (forward compatibility) [1].

---

## 4. DNS over TLS (DoT)

DoT (RFC 7858) encrypts DNS traffic using TLS, providing confidentiality between the stub resolver and the recursive resolver [5]:

### Protocol Details

| Property | Value |
|----------|-------|
| Port | 853 (dedicated) |
| Transport | TCP + TLS 1.2 or 1.3 |
| Wire format | Standard DNS message format with 2-byte TCP length prefix, inside TLS |
| Connection lifecycle | TLS handshake, then DNS queries/responses over the encrypted channel |
| Session resumption | TLS session tickets (RFC 5077) reduce handshake overhead for reconnections |
| Authentication | Server certificate verification (opportunistic or strict) |

### Advantages

- Clear separation: DNS traffic is identifiable by port 853, allowing network administrators to monitor and control it
- Network operators can enforce DNS policies by allowing/blocking port 853
- Simpler than DoH -- standard DNS wire format, just wrapped in TLS

### Disadvantages

- Dedicated port makes DoT traffic visible and blockable by network censors
- TCP+TLS adds latency (1-2 additional RTTs for initial connection)
- Connection setup overhead makes DoT less efficient for single queries

```
DoT CONNECTION FLOW
================================================================

Client                                  Resolver (port 853)
  |                                          |
  |--- TCP SYN ----                          |
  |--- TCP SYN/ACK                           |
  |--- TCP ACK ----                          |
  |                                          |
  |--- TLS ClientHello --->                  |
  |<-- TLS ServerHello ---                   |
  |<-- TLS Certificate ---                   |
  |<-- TLS Finished ------                   |
  |--- TLS Finished ------>                  |
  |                                          |
  |=== [encrypted DNS query] ====>           |
  |<=== [encrypted DNS response] ====        |
  |                                          |
  |  (connection reused for next query)      |
```

---

## 5. DNS over HTTPS (DoH)

DoH (RFC 8484) encapsulates DNS messages inside HTTPS requests, making DNS traffic indistinguishable from normal web traffic [6]:

### Protocol Details

| Property | Value |
|----------|-------|
| Port | 443 (standard HTTPS) |
| Transport | TCP + TLS 1.2/1.3 + HTTP/2 or HTTP/3 |
| MIME type | `application/dns-message` |
| Methods | GET (base64url-encoded query in URL) or POST (binary query in body) |
| Path | Resolver-specific (e.g., `https://dns.google/dns-query`) |
| Authentication | Standard HTTPS certificate verification |

### GET vs POST

```
DoH GET REQUEST
================================================================
GET /dns-query?dns=AAABAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB HTTP/2
Host: dns.google
Accept: application/dns-message

DoH POST REQUEST
================================================================
POST /dns-query HTTP/2
Host: dns.google
Content-Type: application/dns-message
Accept: application/dns-message

[binary DNS message body]
```

GET requests enable HTTP caching (the query is in the URL). POST requests avoid URL length limits and query logging in HTTP access logs [6].

### Advantages

- Indistinguishable from normal HTTPS traffic -- resistant to censorship and blocking
- Benefits from HTTP/2 multiplexing (multiple queries over a single connection)
- HTTP/3 (QUIC-based) provides 0-RTT connection resumption
- Integrates with existing web infrastructure (CDN caching, load balancing)

### Disadvantages

- **Centralization risk:** DoH concentrates DNS resolution at a few large providers (Google, Cloudflare, Quad9), bypassing local DNS policies
- Network administrators cannot inspect or filter DoH traffic without breaking TLS
- Increased complexity: HTTP/2 + TLS + DNS adds implementation surface
- Malware can use DoH for covert communication channels, evading DNS-based security monitoring [7]

---

## 6. DNS over QUIC (DoQ)

DoQ (RFC 9250) provides encrypted DNS transport using the QUIC protocol, combining the privacy of DoT with the performance of QUIC's 0-RTT handshake [8]:

### Protocol Details

| Property | Value |
|----------|-------|
| Port | 853 (same as DoT, but over UDP/QUIC) |
| Transport | QUIC (UDP-based, TLS 1.3 built-in) |
| Wire format | Standard DNS messages, one per QUIC stream |
| Connection lifecycle | QUIC handshake (0-RTT possible), then queries on independent streams |
| Multiplexing | Each query/response pair uses its own QUIC stream -- no head-of-line blocking |

### Advantages over DoT

- **Lower latency:** QUIC 0-RTT resumption allows queries on the first packet after reconnection
- **No head-of-line blocking:** Independent QUIC streams mean one slow response doesn't block others
- **Connection migration:** QUIC connections survive IP address changes (mobile device switching networks)
- **Built-in TLS 1.3:** No separate TLS handshake step

### Current Status

DoQ is the newest DNS privacy transport. Adoption is growing but significantly behind DoT and DoH. Key implementations: AdGuard DNS, NextDNS, Cloudflare (experimental), PowerDNS dnsdist [8].

---

## 7. Privacy Extension Comparison

| Protocol | Port | Transport | Encryption | Visibility | Latency | Censorship Resistance | RFC |
|----------|------|-----------|------------|------------|---------|----------------------|-----|
| Plain UDP | 53 | UDP | None | Fully visible | 1 RTT | None | 1035 |
| Plain TCP | 53 | TCP | None | Fully visible | 2+ RTT | None | 7766 |
| DoT | 853 | TCP+TLS | TLS 1.3 | Port 853 visible | 3+ RTT initial | Low (blockable by port) | 7858 |
| DoH | 443 | TCP+TLS+HTTP | TLS 1.3 | Hidden in HTTPS | 3+ RTT initial | High (looks like web) | 8484 |
| DoQ | 853 | QUIC | TLS 1.3 | Port 853/UDP visible | 1-2 RTT (0-RTT resume) | Low (blockable by port) | 9250 |
| ODoH | 443 | TCP+TLS+HTTP | TLS 1.3+proxy | Neither proxy nor resolver sees both IP and query | 4+ RTT | High | 9230 |

### Trade-off Analysis

The fundamental tension is between **user privacy** and **network operator visibility** [5][6][7]:

- **DoT** respects the network boundary: operators can see DNS traffic (by port) without reading it. They can enforce policies (allow/block DoT) without deep packet inspection.
- **DoH** crosses the network boundary: operators cannot distinguish DNS from web traffic. Users gain privacy; operators lose visibility and control.
- **DoQ** offers the best latency/privacy trade-off but shares DoT's port-blocking vulnerability.
- **ODoH** provides the strongest privacy guarantee at the cost of additional latency and architectural complexity.

---

## 8. QNAME Minimization

RFC 7816 addresses a privacy leak in the resolution process itself. Traditional resolution sends the full query name (`www.example.com`) to every server in the chain -- root, TLD, and authoritative. Servers that only need to delegate (root and TLD) receive information they don't need [9]:

```
TRADITIONAL vs QNAME MINIMIZED RESOLUTION
================================================================

Traditional (full QNAME to every server):
  Root server sees:     www.example.com IN A
  .com TLD server sees: www.example.com IN A
  Authoritative sees:   www.example.com IN A

QNAME Minimized:
  Root server sees:     com. IN NS    (only needs to know the TLD)
  .com TLD server sees: example.com. IN NS    (only needs the SLD)
  Authoritative sees:   www.example.com. IN A  (full query)
```

QNAME minimization substantially reduces information disclosure to infrastructure operators. The root servers, operated by 12 organizations in multiple countries, no longer learn what specific hostnames users are querying -- only which TLDs are being resolved [9].

### Deployment

- **Unbound:** Enabled by default since version 1.7.0 (2018)
- **Knot Resolver:** Enabled by default
- **BIND:** Available since 9.14, must be explicitly enabled
- **Cloudflare 1.1.1.1:** Enabled since launch
- **Google 8.8.8.8:** Enabled since 2019

---

## 9. Oblivious DNS over HTTPS (ODoH)

ODoH (RFC 9230) provides the strongest privacy guarantee by ensuring that neither the DNS resolver nor the network proxy can see both the client's IP address and the DNS query [10]:

```
ODoH ARCHITECTURE
================================================================

Client                  Proxy                   Resolver
  |                       |                        |
  | (knows query,         | (knows client IP,      | (knows query,
  |  doesn't know         |  doesn't know query)   |  doesn't know
  |  resolver)            |                        |  client IP)
  |                       |                        |
  |--- Encrypted query -->|--- Forward ----------->|
  |                       |                        |
  |<-- Encrypted resp ----|<-- Forward ------------|
  |                       |                        |
```

The client encrypts the DNS query using the resolver's public key (obtained via HTTPS SVCB record). The proxy forwards the opaque encrypted blob without being able to read it. The resolver decrypts and resolves the query but only sees the proxy's IP, not the client's [10].

ODoH is architecturally similar to Tor-style onion routing but optimized for the DNS use case with only one proxy hop and no circuit building [10].

---

## 10. DNS Client Subnet (ECS)

ECS (RFC 7871) allows a recursive resolver to include a truncated version of the client's IP address in EDNS0 queries to authoritative servers [11]:

### Purpose

Without ECS, authoritative servers that serve geographically distributed content (CDNs like Cloudflare, Akamai, Google) can only geolocate based on the *resolver's* IP -- which may be in a completely different location from the actual client. ECS provides the authoritative server with a client subnet (e.g., a /24 for IPv4 or /56 for IPv6) for more accurate geolocation [11].

### Privacy Concern

ECS leaks the client's approximate location to authoritative servers that the client never directly contacted. Privacy-focused resolvers handle this differently [11]:

- **Cloudflare 1.1.1.1:** Does not send ECS (uses its own anycast for geo-routing instead)
- **Google 8.8.8.8:** Sends ECS by default but allows opt-out
- **NextDNS:** Configurable per user
- **Quad9:** Does not send ECS

### ECS EDNS0 Option Format

```
ECS OPTION (EDNS0 Option Code 8)
================================================================

FAMILY         : 16-bit (1=IPv4, 2=IPv6)
SOURCE PREFIX  : 8-bit (e.g., 24 for /24 network)
SCOPE PREFIX   : 8-bit (set by authoritative in response)
ADDRESS        : truncated client IP (SOURCE PREFIX bits)

Example: Client is 198.51.100.42/32
  Resolver sends ECS: Family=1, Source=/24, Address=198.51.100.0
  Authoritative responds: Scope=/24 (answer is valid for this /24)
```

---

## 11. Extended DNS Errors (EDE)

RFC 8914 defines Extended DNS Errors, carried in EDNS0 option code 15, providing detailed error information beyond the coarse 4-bit RCODE [12]:

| Code | Meaning | Common Cause |
|------|---------|-------------|
| 0 | Other | Unspecified error |
| 1 | Unsupported DNSKEY Algorithm | DNSSEC uses an algorithm the resolver doesn't support |
| 2 | DNSSEC Bogus | DNSSEC validation failed |
| 3 | DNSSEC Indeterminate | Cannot determine DNSSEC status |
| 4 | DNSSEC Expired | RRSIG signature has expired |
| 5 | DNSSEC Expiring | RRSIG will expire soon |
| 6 | DNSSEC Key Tag Error | DNSKEY key tag mismatch |
| 7 | RRSIGs Missing | Expected RRSIG not present |
| 15 | Blocked | Domain blocked by resolver policy (e.g., malware filter) |
| 16 | Censored | Domain blocked by external directive |
| 17 | Filtered | Domain filtered per resolver configuration |
| 22 | No Reachable Authority | All authoritative servers are unreachable |
| 23 | Network Error | DNS query failed due to network error |

EDE is valuable for debugging DNSSEC failures (which normally return only SERVFAIL) and for transparency when resolvers block domains by policy [12].

---

## 12. DNS Cookies

DNS Cookies (RFC 7873) provide lightweight source IP verification to mitigate amplification attacks and cache poisoning without the overhead of full TSIG authentication [13]:

### How Cookies Work

1. **Client cookie:** Client generates a random value and includes it as an EDNS0 option (code 10) in the query
2. **Server cookie:** Server generates a cookie bound to the client's IP address and returns both cookies
3. **Subsequent queries:** Client includes both its cookie and the server cookie. Server verifies the server cookie was issued to that client IP.
4. **Spoofing prevention:** An attacker spoofing the client's IP cannot provide a valid server cookie, causing the server to reject or deprioritize the query

DNS Cookies require no pre-shared keys and add minimal overhead (32 bytes per query/response). They are a practical defense against off-path spoofing attacks that don't require full DNSSEC deployment [13].

---

## 13. Implementation Considerations

### Path MTU and Fragmentation

EDNS0 allows advertising large UDP payload sizes (up to 4096+ bytes), but IP fragmentation of large UDP packets is unreliable on many networks. DNS Flag Day 2020 recommends a maximum UDP payload size of 1232 bytes to avoid fragmentation on all but the most constrained paths. Responses exceeding this size should trigger TCP fallback [3][14].

### DoH and Enterprise Security

DoH bypasses enterprise DNS-based security controls (malware blocking, content filtering, data loss prevention). Enterprise networks increasingly deploy DoH interception or block known DoH resolver endpoints. The tension between individual privacy and organizational security is unresolved [7].

### Resolver Selection

The choice of recursive resolver has significant privacy implications [5][6]:
- **ISP resolver:** ISP can see all queries; subject to local data retention laws
- **Public resolver (Google, Cloudflare):** Shifts trust from ISP to resolver operator; subject to operator's privacy policy and jurisdiction
- **Self-hosted resolver:** Maximum privacy but requires operational expertise
- **DoH/DoT to self-hosted:** Encrypts last-mile but does not hide queries from the self-hosted resolver itself

---

## 14. Cross-References

> **Related:** [Wire Protocol](01-wire-protocol-message-format.md) -- OPT record placement and EDNS0 flag encoding; [Resource Records](02-resource-record-taxonomy.md) -- OPT pseudo-RR type specification; [Resolution](03-resolution-architecture.md) -- how QNAME minimization changes the resolution walk; [DNSSEC](05-dnssec.md) -- EDNS0 DO bit and DNSSEC interaction; [Zone Management](04-zone-management.md) -- EDNS0 in zone transfer contexts

**Related PNW Research Projects:**
- **PSS** -- PNW Signal Stack covers encrypted DNS as part of the network privacy layer
- **FCC** -- FCC Catalog covers the regulatory landscape affecting DNS privacy (net neutrality, lawful intercept)
- **CMH** -- Computational Mesh covers encrypted service discovery in distributed systems
- **SYS** -- Systems Administration covers DoT/DoH resolver deployment and configuration
- **RFC** -- RFC Archive covers the IETF standardization process for these extensions
- **WPH** -- Weekly Phone covers encrypted DNS for VoIP security
- **K8S** -- Kubernetes covers encrypted DNS for cluster security

---

## 15. Sources

1. RFC 6891 -- Extension Mechanisms for DNS (EDNS(0)) (Damas et al., 2013)
2. RFC 4035 -- Protocol Modifications for DNS Security Extensions (Arends et al., 2005)
3. DNS Flag Day 2020 -- https://dnsflagday.net/2020/
4. IANA EDNS0 Option Codes -- https://www.iana.org/assignments/dns-parameters
5. RFC 7858 -- Specification for DNS over Transport Layer Security (Hu et al., 2016)
6. RFC 8484 -- DNS Queries over HTTPS (DoH) (Hoffman and McManus, 2018)
7. NCSC (UK) -- "The risks of DNS over HTTPS" (2019)
8. RFC 9250 -- DNS over Dedicated QUIC Connections (Huitema et al., 2022)
9. RFC 7816 -- DNS Query Name Minimisation to Improve Privacy (Bortzmeyer, 2016)
10. RFC 9230 -- Oblivious DNS over HTTPS (Kinnear et al., 2022)
11. RFC 7871 -- Client Subnet in DNS Queries (Contavalli et al., 2016)
12. RFC 8914 -- Extended DNS Errors (Kumari et al., 2020)
13. RFC 7873 -- Domain Name System (DNS) Cookies (Eastlake and Andrews, 2016)
14. RFC 8085 -- UDP Usage Guidelines (Eggert et al., 2017)
15. RFC 7830 -- The EDNS(0) Padding Option (Mayrhofer, 2016)
16. RFC 5001 -- DNS Name Server Identifier (NSID) Option (Austein, 2007)
17. RFC 7828 -- The edns-tcp-keepalive EDNS0 Option (Wouters et al., 2016)
18. RFC 9499 -- DNS Terminology (Hoffman et al., 2024)
19. Google Public DNS DoH API -- https://developers.google.com/speed/public-dns/docs/doh
