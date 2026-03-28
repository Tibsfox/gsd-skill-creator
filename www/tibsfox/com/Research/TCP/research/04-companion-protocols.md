# Companion Protocols

> **Domain:** Internet Protocol Suite
> **Module:** 4 -- UDP, ICMP, DNS, DHCP & Supporting Infrastructure
> **Through-line:** *TCP gets the headlines, but the Internet runs on its supporting cast. UDP carries DNS queries in 8 bytes of overhead. ICMP tells you why your packets died. DHCP gives your laptop an address before you've opened a browser. ARP maps the last mile from IP to Ethernet. None of these protocols are optional. Remove any one and the network stops functioning within minutes.*

---

## Table of Contents

1. [The Supporting Stack](#1-the-supporting-stack)
2. [UDP: User Datagram Protocol](#2-udp-user-datagram-protocol)
3. [UDP Applications and Use Cases](#3-udp-applications-and-use-cases)
4. [ICMP: Internet Control Message Protocol](#4-icmp-internet-control-message-protocol)
5. [ICMPv6](#5-icmpv6)
6. [Traceroute and Ping Mechanics](#6-traceroute-and-ping-mechanics)
7. [ARP: Address Resolution Protocol](#7-arp-address-resolution-protocol)
8. [DNS: Domain Name System](#8-dns-domain-name-system)
9. [DNS Query Format](#9-dns-query-format)
10. [Modern DNS: DoH, DoT, DoQ](#10-modern-dns-doh-dot-doq)
11. [DHCP: Dynamic Host Configuration Protocol](#11-dhcp-dynamic-host-configuration-protocol)
12. [DHCPv6 and SLAAC](#12-dhcpv6-and-slaac)
13. [Mesh Relevance](#13-mesh-relevance)
14. [Cross-References](#14-cross-references)
15. [Sources](#15-sources)

---

## 1. The Supporting Stack

The TCP/IP suite depends on several companion protocols that provide essential infrastructure services. These protocols operate at the Internet and Transport layers but serve fundamentally different purposes than TCP's reliable byte-stream delivery [1].

```
COMPANION PROTOCOL MAP
================================================================

  TRANSPORT LAYER
  +-------------------+-------------------+
  | UDP (RFC 768)     | TCP (RFC 9293)    |
  | Connectionless    | Connection-orient |
  | 8-byte header     | 20-60 byte header |
  | Best-effort       | Reliable, ordered |
  +-------------------+-------------------+
         |                     |
         v                     v
  INTERNET LAYER
  +-------------------------------------------+
  | IPv4 (RFC 791) / IPv6 (RFC 8200)         |
  |                                           |
  | ICMP (RFC 792)   ICMPv6 (RFC 4443)      |
  | Error reporting   + NDP (RFC 4861)       |
  |                                           |
  | ARP (RFC 826) -- IPv4 only               |
  +-------------------------------------------+

  APPLICATION-LAYER SERVICES (over UDP and TCP)
  +-------------------------------------------+
  | DNS (RFC 1035) -- UDP:53 / TCP:53        |
  | DHCP (RFC 2131) -- UDP:67/68             |
  | NTP (RFC 5905) -- UDP:123                |
  +-------------------------------------------+
```

---

## 2. UDP: User Datagram Protocol

UDP (RFC 768, August 1980) is the simplest transport protocol in the TCP/IP suite. It provides a minimal service: multiplexing (via port numbers) and optional integrity checking (via checksum). No connection state, no retransmission, no ordering, no flow control [2].

### Header Format

| Field | Bits | Description |
|---|---|---|
| Source Port | 16 | Originating port (0-65535); optional -- may be zero if no reply expected |
| Destination Port | 16 | Destination port (0-65535) |
| Length | 16 | Total datagram length in bytes (header + data); minimum 8 bytes |
| Checksum | 16 | Covers pseudo-header + header + data; optional for IPv4, mandatory for IPv6 |

### Wire Format

```
UDP HEADER -- 8 BYTES (RFC 768)
================================================================

 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |       Destination Port        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|            Length              |           Checksum            |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### Checksum Computation

The UDP checksum covers a pseudo-header (same construction as TCP: source IP, destination IP, protocol number, UDP length) plus the entire UDP datagram. For IPv4, the checksum is optional; a zero value means "no checksum computed." For IPv6, the checksum is mandatory because IPv6 has no IP-layer header checksum [2][3].

### UDP vs TCP Comparison

| Property | UDP | TCP |
|---|---|---|
| Header size | 8 bytes | 20-60 bytes |
| Connection state | None | Per-connection TCB |
| Reliability | None | Full (ACK, retransmit) |
| Ordering | None | Strict byte ordering |
| Flow control | None | Sliding window |
| Congestion control | None | AIMD/CUBIC/BBR |
| Message boundaries | Preserved | Byte stream (no boundaries) |
| Latency | Minimal (no handshake) | 1 RTT handshake minimum |

---

## 3. UDP Applications and Use Cases

UDP's lack of overhead makes it the transport of choice for applications that need low latency, can tolerate loss, or implement their own reliability:

| Application | Port | Why UDP |
|---|---|---|
| DNS | 53 | Low-latency name resolution; single request-response; retransmit at application layer |
| DHCP | 67/68 | Bootstrap -- client has no IP address yet; broadcast discovery |
| NTP | 123 | Time synchronization requires low, predictable latency |
| VoIP (RTP) | Dynamic | Real-time; retransmission would arrive too late to be useful |
| Gaming | Various | Low-latency state updates; stale data is worse than lost data |
| QUIC | 443 | UDP as carrier for user-space transport protocol |
| TFTP | 69 | Simple file transfer; own reliability layer |
| mDNS | 5353 | Local service discovery (Bonjour, Avahi) |
| SNMP | 161/162 | Network management; simple query-response |

### UDP and NAT

UDP "connections" through NAT require NAT binding maintenance. Most NATs expire UDP bindings after 30-60 seconds of inactivity. Applications maintain bindings via keepalive packets. STUN/TURN/ICE protocols (used by WebRTC) solve NAT traversal for UDP-based real-time communication [4].

---

## 4. ICMP: Internet Control Message Protocol

ICMP (RFC 792, September 1981) provides error reporting and diagnostic functions at the Internet layer. ICMP messages are carried inside IP datagrams (Protocol = 1) but are not a transport protocol -- they are part of IP's control plane [5].

### ICMP Message Types (IPv4)

| Type | Code | Name | Purpose |
|---|---|---|---|
| 0 | 0 | Echo Reply | Ping response |
| 3 | 0 | Network Unreachable | No route to destination network |
| 3 | 1 | Host Unreachable | Route exists but host unreachable |
| 3 | 2 | Protocol Unreachable | Destination does not support protocol |
| 3 | 3 | Port Unreachable | Destination port not listening (UDP only) |
| 3 | 4 | Fragmentation Needed | Packet too large, DF set; includes next-hop MTU (PMTUD) |
| 3 | 13 | Communication Administratively Prohibited | Firewall blocked |
| 4 | 0 | Source Quench | Obsolete congestion signal (deprecated by RFC 6633) |
| 5 | 0-3 | Redirect | Router informs host of better route |
| 8 | 0 | Echo Request | Ping request |
| 11 | 0 | Time Exceeded -- TTL | TTL expired in transit (traceroute mechanism) |
| 11 | 1 | Time Exceeded -- Reassembly | Fragment reassembly timeout |
| 12 | 0 | Parameter Problem | IP header field error |

### ICMP Packet Format

ICMP messages share a common header: Type (8 bits), Code (8 bits), Checksum (16 bits), followed by type-specific data. For error messages (Types 3, 4, 5, 11, 12), the data includes the IP header + first 8 bytes of the original datagram that triggered the error -- enough to identify the transport protocol and ports [5].

> **SAFETY WARNING:** ICMP can be exploited for network reconnaissance (ping sweeps, traceroute mapping), covert channels (data in ICMP payloads), and denial-of-service (ICMP flood, Smurf attack). Rate limiting ICMP is standard practice. Documented for defensive understanding only [5].

---

## 5. ICMPv6

ICMPv6 (RFC 4443) serves the same error reporting and diagnostic functions as ICMPv4, plus additional responsibilities that were separate protocols in IPv4: neighbor discovery (replacing ARP), router discovery, and multicast management [6].

### ICMPv6 Message Types

| Type | Name | Purpose |
|---|---|---|
| 1 | Destination Unreachable | Equivalent to ICMP Type 3 |
| 2 | Packet Too Big | Includes MTU; used for IPv6 PMTUD |
| 3 | Time Exceeded | Hop Limit expired; reassembly timeout |
| 4 | Parameter Problem | Header field error |
| 128 | Echo Request | Ping |
| 129 | Echo Reply | Ping response |
| 133 | Router Solicitation | Host requests router advertisements |
| 134 | Router Advertisement | Router announces prefixes, MTU, flags |
| 135 | Neighbor Solicitation | Address resolution + DAD |
| 136 | Neighbor Advertisement | Address resolution reply |
| 137 | Redirect | Better next-hop notification |
| 143 | Multicast Listener Report v2 | MLDv2 group membership |

### ICMPv6 is Mandatory

Unlike ICMP for IPv4, ICMPv6 must not be blocked entirely. Packet Too Big (Type 2) is required for PMTUD (IPv6 has no in-router fragmentation). Neighbor Solicitation/Advertisement (Types 135/136) are required for address resolution. Firewalls that block all ICMPv6 break IPv6 networking [6].

---

## 6. Traceroute and Ping Mechanics

### Ping

Ping sends an ICMP Echo Request (Type 8) and waits for an Echo Reply (Type 0). The payload typically includes a timestamp for RTT measurement and a sequence number for loss detection. Ping measures reachability, RTT, and packet loss rate [5].

### Traceroute

Traceroute discovers the path between source and destination by sending packets with incrementally increasing TTL values [7]:

```
TRACEROUTE OPERATION
================================================================

  Source sends packet with TTL=1
    --> First router decrements TTL to 0
    --> First router sends ICMP Time Exceeded (Type 11)
    --> Source records Router 1 address and RTT

  Source sends packet with TTL=2
    --> Second router sends ICMP Time Exceeded
    --> Source records Router 2 address and RTT

  ... continues until:
    --> Destination reached (ICMP Port Unreachable for UDP,
        Echo Reply for ICMP, or TCP SYN-ACK)
    --> Maximum TTL reached (typically 30)
```

Traceroute implementations vary: Unix uses UDP to high-numbered ports; Windows `tracert` uses ICMP Echo Request; `tcptraceroute` uses TCP SYN to detect firewalls that block ICMP/UDP but allow TCP [7].

---

## 7. ARP: Address Resolution Protocol

ARP (RFC 826) resolves IPv4 addresses to link-layer (MAC) addresses. See Module 01 for detailed ARP mechanics. Key points for this module [8]:

- ARP operates only on IPv4 local network segments
- ARP has no authentication; susceptible to spoofing
- ARP cache entries expire (typically 20 min on Linux, 2 min on Windows)
- Gratuitous ARP is used for duplicate address detection and failover
- IPv6 replaces ARP entirely with NDP (ICMPv6 Types 135/136)

### Proxy ARP

Proxy ARP (RFC 1027) allows a router to answer ARP requests on behalf of hosts on another subnet, making multiple subnets appear as a single network. While useful in specific scenarios, it masks network topology and can create security and debugging complications [8].

---

## 8. DNS: Domain Name System

DNS (RFC 1035, November 1987) is the Internet's distributed naming system, mapping human-readable domain names to IP addresses and other records [9].

### DNS Architecture

DNS uses a hierarchical, distributed database structure:

```
DNS HIERARCHY
================================================================

  [Root Zone (.)]
       |
  +----+----+----+----+
  |    |    |    |    |
 .com .net .org .io  .dev   (Top-Level Domains)
  |    |    |
 example   ietf            (Second-Level Domains)
  |
 www                        (Hostnames / Subdomains)
```

### Record Types

| Type | Value | Purpose | Example |
|---|---|---|---|
| A | 1 | IPv4 address | example.com -> 93.184.216.34 |
| AAAA | 28 | IPv6 address | example.com -> 2606:2800:220:1:... |
| CNAME | 5 | Canonical name (alias) | www.example.com -> example.com |
| MX | 15 | Mail exchange | example.com -> mail.example.com, priority 10 |
| NS | 2 | Name server | example.com -> ns1.example.com |
| SOA | 6 | Start of authority | Zone serial, refresh, retry, expire, TTL |
| TXT | 16 | Arbitrary text | SPF, DKIM, DMARC records |
| SRV | 33 | Service locator | _sip._tcp.example.com -> sipserver:5060 |
| PTR | 12 | Reverse lookup | 34.216.184.93.in-addr.arpa -> example.com |
| CAA | 257 | Certificate authority authorization | Which CAs may issue certs |

### Resolution Process

1. Application calls `getaddrinfo()` or similar resolver function
2. Stub resolver checks local cache; if miss, queries configured recursive resolver
3. Recursive resolver queries root server for TLD NS
4. Recursive resolver queries TLD server for domain NS
5. Recursive resolver queries authoritative server for record
6. Response cached at each level according to TTL values
7. Typically 4 queries for cold cache; 0-1 for warm cache [9]

---

## 9. DNS Query Format

DNS messages use a fixed 12-byte header followed by variable-length sections [9].

### Header Format

| Field | Bits | Description |
|---|---|---|
| ID | 16 | Transaction identifier; response must match request ID |
| QR | 1 | Query (0) or Response (1) |
| OPCODE | 4 | Standard query (0), Inverse query (1, obsolete), Status (2) |
| AA | 1 | Authoritative Answer -- set by authoritative server |
| TC | 1 | Truncated -- response exceeded 512 bytes (UDP); retry over TCP |
| RD | 1 | Recursion Desired -- client requests recursive resolution |
| RA | 1 | Recursion Available -- server supports recursion |
| Z | 3 | Reserved (must be zero) |
| RCODE | 4 | Response code: 0=No Error, 1=Format Error, 2=Server Failure, 3=NXDOMAIN |
| QDCOUNT | 16 | Number of questions |
| ANCOUNT | 16 | Number of answer records |
| NSCOUNT | 16 | Number of authority records |
| ARCOUNT | 16 | Number of additional records |

### DNS Transport

- **UDP port 53:** Default for queries. UDP responses limited to 512 bytes without EDNS0 (RFC 6891 extends to typically 4096 bytes).
- **TCP port 53:** Used when UDP response is truncated (TC=1), for zone transfers (AXFR/IXFR), and increasingly for regular queries (RFC 7766).
- **DNS-over-TLS (DoT, RFC 7858):** TCP port 853. Encrypts DNS queries to prevent eavesdropping.
- **DNS-over-HTTPS (DoH, RFC 8484):** HTTPS port 443. Encrypts DNS queries and blends with web traffic.
- **DNS-over-QUIC (DoQ, RFC 9250):** QUIC port 853. Encrypted, lower latency than DoT [10].

---

## 10. Modern DNS: DoH, DoT, DoQ

### DNS-over-TLS (DoT, RFC 7858)

DoT wraps standard DNS queries in a TLS 1.2/1.3 session on TCP port 853. Advantages: encrypted queries prevent ISP/network snooping. Disadvantages: easily blocked (dedicated port 853 is identifiable), adds TLS handshake latency [10].

### DNS-over-HTTPS (DoH, RFC 8484)

DoH sends DNS queries as HTTP POST or GET requests to a standard HTTPS endpoint (e.g., `https://dns.cloudflare.com/dns-query`). Advantages: indistinguishable from regular HTTPS traffic, difficult to block without blocking all HTTPS. Disadvantages: centralizes DNS with DoH providers, complicates enterprise network management [10].

### DNS-over-QUIC (DoQ, RFC 9250)

DoQ carries DNS queries over QUIC on port 853. Advantages: encrypted with lower latency than DoT (QUIC 0-RTT resumption), multiplexed streams avoid head-of-line blocking for concurrent queries. Deployment is early but growing [10].

### DNSSEC

DNSSEC (RFC 4033-4035) adds cryptographic signatures to DNS records, allowing resolvers to verify that responses have not been tampered with. DNSSEC does not encrypt queries (that is DoH/DoT/DoQ's role) -- it authenticates responses. Adoption: approximately 30% of domains are DNSSEC-signed as of 2025, but only a fraction of resolvers perform validation [11].

---

## 11. DHCP: Dynamic Host Configuration Protocol

DHCP (RFC 2131, March 1997) automatically assigns IP addresses and network configuration parameters to hosts on a network [12].

### DORA: Four-Step Lease Process

```
DHCP LEASE LIFECYCLE
================================================================

  CLIENT (no IP)                           SERVER (pool)
       |                                       |
  1.   | DHCPDISCOVER (broadcast)              |
       |-------------------------------------->>|
       |                                       |
  2.   |               DHCPOFFER (unicast)     |
       |<<--------------------------------------|
       |    (IP offer + lease time + options)   |
       |                                       |
  3.   | DHCPREQUEST (broadcast)               |
       |-------------------------------------->>|
       |    (selects this server's offer)       |
       |                                       |
  4.   |               DHCPACK (unicast)       |
       |<<--------------------------------------|
       |    (confirms lease + full config)      |
       |                                       |
```

### DHCP Options (Selected)

| Option | Code | Description |
|---|---|---|
| Subnet Mask | 1 | Network mask for the assigned address |
| Router | 3 | Default gateway IP address(es) |
| DNS Servers | 6 | Recursive DNS server IP address(es) |
| Domain Name | 15 | DNS domain name for the client |
| Lease Time | 51 | Duration of the IP address lease in seconds |
| DHCP Server | 54 | IP address of the DHCP server |
| Renewal Time (T1) | 58 | Time until client should attempt renewal (default: 50% of lease) |
| Rebinding Time (T2) | 59 | Time until client broadcasts renewal (default: 87.5% of lease) |

### Lease Renewal

At T1 (50% of lease), the client unicasts DHCPREQUEST to the assigning server. If no response by T2 (87.5%), the client broadcasts DHCPREQUEST to any server. If the lease expires without renewal, the client releases the address and returns to DISCOVER [12].

### DHCP Security

DHCP has no built-in authentication. Rogue DHCP servers can assign malicious DNS servers or gateways. Mitigations: DHCP snooping on managed switches (only trusted ports may send DHCP offers), 802.1X port authentication [12].

> **SAFETY WARNING:** Rogue DHCP servers are a common local network attack vector. DHCP snooping should be enabled on managed switches. Documented for defensive understanding only.

---

## 12. DHCPv6 and SLAAC

IPv6 provides two address configuration mechanisms [13]:

### SLAAC (Stateless Address Autoconfiguration, RFC 4862)

- Host generates link-local address from prefix fe80::/10 + Interface ID
- Host performs DAD (Duplicate Address Detection) via NDP
- Router Advertisements provide global prefix(es)
- Host generates global address(es) from advertised prefix + Interface ID
- No server needed; fully stateless

### DHCPv6 (RFC 8415)

- Stateful: assigns specific IPv6 addresses from a pool (like DHCPv4)
- Stateless (RFC 3736): provides DNS servers, domain names, and other options without assigning addresses (used alongside SLAAC)
- Uses UDP ports 546 (client) and 547 (server)
- Four-message exchange: Solicit, Advertise, Request, Reply

### Which to Use

| Mechanism | Address Assignment | DNS/Options | Server Required |
|---|---|---|---|
| SLAAC only | Yes (from RA prefix) | Via RA (RDNSS option, RFC 8106) | No (router only) |
| SLAAC + Stateless DHCPv6 | Yes (from RA prefix) | Via DHCPv6 | DHCPv6 server |
| Stateful DHCPv6 | Yes (from DHCPv6 pool) | Via DHCPv6 | DHCPv6 server |

---

## 13. Mesh Relevance

Companion protocols are foundational for GSD Mesh:

- **UDP as transport:** QUIC (the likely mesh transport) runs over UDP. Understanding UDP's lack of congestion control and the responsibility this places on QUIC is essential.
- **DNS for mesh discovery:** Mesh nodes can use mDNS (RFC 6762) or DNS-SD (RFC 6763) for zero-configuration service discovery on local networks. Multicast DNS on port 5353 eliminates the need for a centralized DNS server.
- **DHCP for mesh bootstrapping:** New mesh nodes need IP addresses before they can participate. SLAAC provides zero-configuration addressing for IPv6 mesh networks.
- **ICMP for mesh health:** Ping and traceroute diagnostics are essential for mesh debugging. ICMPv6 Packet Too Big messages are required for PMTUD on mesh links.
- **NDP for mesh neighbor detection:** IPv6 NDP provides built-in neighbor discovery, replacing the need for custom mesh discovery protocols.

---

## 14. Cross-References

> **Related:** [IP Layer](01-ip-layer.md) -- ICMP operates at the IP layer; ARP/NDP resolve IP to MAC addresses. [TCP Core](02-tcp-core.md) -- TCP uses port numbers for multiplexing, same as UDP; ICMP Port Unreachable indicates no listener. [Transport Evolution](05-transport-evolution.md) -- QUIC runs over UDP; DNS-over-QUIC is a new DNS transport.

**Series cross-references:**
- **DNS (DNS Protocol):** Dedicated deep-dive into DNS architecture, DNSSEC, and operational practices
- **DHP (DHCP Protocol):** Dedicated deep-dive into DHCP mechanics, relay agents, and failover
- **SYS (Systems Admin):** `dig`, `nslookup`, `dhclient`, `arp -a`, `ip neigh` for diagnostics
- **K8S (Kubernetes):** CoreDNS provides cluster DNS; kube-proxy uses IPVS/iptables for service routing
- **CMH (Comp. Mesh):** Mesh discovery uses mDNS/DNS-SD; mesh bootstrapping uses SLAAC
- **RFC (RFC Archive):** RFC 768 (UDP), RFC 792 (ICMP), RFC 1035 (DNS), RFC 2131 (DHCP)

---

## 15. Sources

1. Braden, R. "Requirements for Internet Hosts -- Communication Layers." RFC 1122, IETF, October 1989.
2. Postel, J. "User Datagram Protocol." RFC 768, IETF, August 1980. Status: Internet Standard.
3. Deering, S. and Hinden, R. "Internet Protocol, Version 6 (IPv6) Specification." RFC 8200, IETF, July 2017.
4. Rosenberg, J. et al. "Session Traversal Utilities for NAT (STUN)." RFC 5389, IETF, October 2008.
5. Postel, J. "Internet Control Message Protocol." RFC 792, IETF, September 1981. Status: Internet Standard (STD 5).
6. Conta, A., Deering, S., and Gupta, M. "Internet Control Message Protocol (ICMPv6) for the Internet Protocol Version 6 (IPv6) Specification." RFC 4443, IETF, March 2006. Status: Internet Standard (STD 89).
7. Jacobson, V. "traceroute(8)." BSD Unix manual page, 1988.
8. Plummer, D. "An Ethernet Address Resolution Protocol." RFC 826, IETF, November 1982. Status: Internet Standard (STD 37).
9. Mockapetris, P. "Domain Names -- Implementation and Specification." RFC 1035, IETF, November 1987. Status: Internet Standard (STD 13).
10. Huitema, C., Dickinson, S., and Mankin, A. "DNS over Dedicated QUIC Connections." RFC 9250, IETF, May 2022.
11. Arends, R., Austein, R., Larson, M., Massey, D., and Rose, S. "DNS Security Introduction and Requirements." RFC 4033, IETF, March 2005.
12. Droms, R. "Dynamic Host Configuration Protocol." RFC 2131, IETF, March 1997. Status: Draft Standard.
13. Thomson, S., Narten, T., and Jinmei, T. "IPv6 Stateless Address Autoconfiguration." RFC 4862, IETF, September 2007.
14. Hu, Z. et al. "Specification for DNS over Transport Layer Security (TLS)." RFC 7858, IETF, May 2016.
15. Hoffman, P. and McManus, P. "DNS Queries over HTTPS (DoH)." RFC 8484, IETF, October 2018.
16. Damas, J., Graff, M., and Vixie, P. "Extension Mechanisms for DNS (EDNS(0))." RFC 6891, IETF, April 2013.
17. Narten, T., Nordmark, E., Simpson, W., and Soliman, H. "Neighbor Discovery for IP version 6 (IPv6)." RFC 4861, IETF, September 2007.
18. Cheshire, S. and Krochmal, M. "Multicast DNS." RFC 6762, IETF, February 2013.

---

*TCP/IP Protocol -- Module 4: Companion Protocols. The supporting cast that makes the headliners possible.*
