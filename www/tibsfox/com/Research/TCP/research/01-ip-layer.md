# IP Layer

> **Domain:** Internet Protocol Suite
> **Module:** 1 -- IPv4, IPv6, Addressing & Fragmentation
> **Through-line:** *IP is the universal datagram. It makes exactly one promise: best-effort delivery from source to destination across heterogeneous networks. Every other guarantee -- reliability, ordering, congestion response -- is someone else's job. That minimalism is why it works at planetary scale.*

---

## Table of Contents

1. [The Internet Layer](#1-the-internet-layer)
2. [IPv4 Header Format](#2-ipv4-header-format)
3. [IPv4 Addressing and CIDR](#3-ipv4-addressing-and-cidr)
4. [IPv6 Header Format](#4-ipv6-header-format)
5. [IPv6 Extension Headers](#5-ipv6-extension-headers)
6. [IPv6 Addressing](#6-ipv6-addressing)
7. [Fragmentation](#7-fragmentation)
8. [Path MTU Discovery](#8-path-mtu-discovery)
9. [ARP: Address Resolution Protocol](#9-arp-address-resolution-protocol)
10. [NDP: Neighbor Discovery Protocol](#10-ndp-neighbor-discovery-protocol)
11. [Dual-Stack Operation](#11-dual-stack-operation)
12. [Mesh Relevance](#12-mesh-relevance)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. The Internet Layer

The Internet layer sits between the link layer (Ethernet, Wi-Fi) and the transport layer (TCP, UDP). Its sole responsibility is moving datagrams from a source host to a destination host across one or more intermediate networks. RFC 1122 defines this as the "Internet layer" in the TCP/IP model, corresponding roughly to the Network layer (Layer 3) in the OSI reference model [1].

The Internet layer provides:

- **Addressing:** Globally unique (or locally scoped) addresses that identify endpoints
- **Routing:** Forwarding decisions at each hop based on destination address
- **Fragmentation:** Breaking datagrams too large for a link into smaller pieces
- **Error reporting:** ICMP messages when delivery fails

It explicitly does *not* provide reliability, ordering, or flow control. Those are transport-layer responsibilities. This separation is the founding insight of the TCP/IP architecture -- Postel's 1978 split that created IP as a distinct protocol from TCP [2].

```
THE INTERNET LAYER IN CONTEXT
================================================================

  TRANSPORT LAYER (TCP, UDP, QUIC)
         |
         | Segments / Datagrams
         v
  +----------------------------------------------+
  |            INTERNET LAYER                     |
  |                                               |
  |  IPv4 (RFC 791)     IPv6 (RFC 8200)          |
  |  +-------------+    +------------------+      |
  |  | 20-60 byte  |    | 40-byte fixed    |      |
  |  | header      |    | header + ext     |      |
  |  | Frag at     |    | Frag at source   |      |
  |  | any router  |    | only             |      |
  |  +-------------+    +------------------+      |
  |                                               |
  |  ARP (826)    NDP (4861)    ICMP (792/4443)  |
  +----------------------------------------------+
         |
         | Frames
         v
  LINK LAYER (Ethernet 802.3, Wi-Fi 802.11)
```

---

## 2. IPv4 Header Format

The IPv4 header is defined in RFC 791 (September 1981) and contains a minimum of 20 bytes (5 x 32-bit words) and a maximum of 60 bytes when options are present [3].

### Complete Field Table

| Field | Bits | Offset (bits) | Range | Description |
|---|---|---|---|---|
| Version | 4 | 0 | 4 | IP version number; always 4 for IPv4 |
| IHL (Header Length) | 4 | 4 | 5-15 | Header length in 32-bit words; min 5 (20 bytes), max 15 (60 bytes) |
| DSCP (formerly ToS) | 6 | 8 | 0-63 | Differentiated Services Code Point for QoS marking (RFC 2474) |
| ECN | 2 | 14 | 0-3 | Explicit Congestion Notification (RFC 3168): 00=Non-ECT, 01/10=ECT, 11=CE |
| Total Length | 16 | 16 | 20-65535 | Complete packet length in bytes including header and data |
| Identification | 16 | 32 | 0-65535 | Fragment group identifier; same value across all fragments of original datagram |
| Flags | 3 | 48 | -- | Bit 0: reserved (0); Bit 1: DF (Don't Fragment); Bit 2: MF (More Fragments) |
| Fragment Offset | 13 | 51 | 0-8191 | Offset of this fragment in 8-byte units within original datagram |
| TTL (Time to Live) | 8 | 64 | 0-255 | Hop count limit; decremented by each router; packet discarded at 0 |
| Protocol | 8 | 72 | 0-255 | Upper layer protocol: TCP=6, UDP=17, ICMP=1, OSPF=89 (IANA registry) |
| Header Checksum | 16 | 80 | -- | One's complement of one's complement sum of header words; recomputed at each hop |
| Source Address | 32 | 96 | -- | 32-bit IPv4 address of originating host |
| Destination Address | 32 | 128 | -- | 32-bit IPv4 address of destination host |
| Options | 0-320 | 160 | -- | Variable; must be padded to 32-bit boundary; includes Record Route, Timestamp, etc. |

### Wire Format

```
IPv4 HEADER -- BIT-LEVEL LAYOUT (RFC 791)
================================================================

 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|Version|  IHL  |   DSCP  |ECN|         Total Length            |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         Identification        |Flags|    Fragment Offset      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Time to Live |    Protocol   |       Header Checksum         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Source Address                          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Destination Address                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Options (if IHL > 5)                       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### Header Checksum Computation

The checksum covers the header only (not the payload). It is the 16-bit one's complement of the one's complement sum of all 16-bit words in the header, with the checksum field itself set to zero during computation. Because TTL changes at every hop, the checksum must be recomputed by every forwarding router -- one reason IPv6 eliminated it entirely [3].

### Key Behavioral Notes

- **IHL field:** When IHL = 5, the header is exactly 20 bytes with no options. Values 6-15 indicate options consuming 4 to 40 additional bytes. Any packet with IHL < 5 is malformed and must be dropped [3].
- **DF flag:** When set, routers must not fragment the packet. If the packet exceeds the link MTU, the router sends ICMP Type 3, Code 4 (Fragmentation Needed) back to the source. This is the mechanism underlying Path MTU Discovery [4].
- **TTL field:** Originally intended as a time-in-seconds counter, in practice every router decrements by exactly 1 regardless of processing time. Default values: Linux 64, Windows 128, macOS 64 [3].

---

## 3. IPv4 Addressing and CIDR

IPv4 addresses are 32 bits, written in dotted-decimal notation (e.g., 192.168.1.1). The original classful addressing scheme (Class A/B/C) was replaced by Classless Inter-Domain Routing (CIDR, RFC 4632) in 1993 to slow address exhaustion [5].

### CIDR Notation

CIDR notation appends a prefix length: `192.168.1.0/24` means the first 24 bits are the network prefix. The remaining 8 bits identify hosts within that network (254 usable addresses, excluding network and broadcast).

### Special Address Blocks

| Block | Purpose | RFC |
|---|---|---|
| 0.0.0.0/8 | "This network" | RFC 791 |
| 10.0.0.0/8 | Private (Class A) | RFC 1918 |
| 100.64.0.0/10 | Carrier-grade NAT | RFC 6598 |
| 127.0.0.0/8 | Loopback | RFC 1122 |
| 169.254.0.0/16 | Link-local (APIPA) | RFC 3927 |
| 172.16.0.0/12 | Private (Class B) | RFC 1918 |
| 192.168.0.0/16 | Private (Class C) | RFC 1918 |
| 224.0.0.0/4 | Multicast | RFC 5771 |
| 255.255.255.255/32 | Limited broadcast | RFC 919 |

### NAT and Address Exhaustion

Network Address Translation (RFC 3022) allows multiple hosts on a private network to share a single public IPv4 address. NAT has extended IPv4's usable lifetime well beyond original projections but introduces complications: it breaks the end-to-end principle, complicates peer-to-peer protocols, and creates state in the network path that can fail [6].

IANA exhausted its final /8 blocks on February 3, 2011. Regional Internet Registries have since exhausted their pools at varying dates (APNIC 2011, RIPE NCC 2012, LACNIC 2014, ARIN 2015, AFRINIC 2017) [7].

---

## 4. IPv6 Header Format

IPv6 (RFC 8200, July 2017, obsoleting RFC 2460) replaces the variable-length IPv4 header with a fixed 40-byte structure. Key design improvements include: no header checksum (error detection delegated to transport and link layers), no in-router fragmentation (sources use PMTUD), and a Flow Label field for QoS [8].

### Complete Field Table

| Field | Bits | Offset (bits) | Description |
|---|---|---|---|
| Version | 4 | 0 | Always 6 |
| Traffic Class | 8 | 4 | DSCP (6 bits) + ECN (2 bits); same semantics as IPv4 ToS/DSCP |
| Flow Label | 20 | 12 | Identifies a flow for QoS; allows routers to fast-path related packets without deep inspection |
| Payload Length | 16 | 32 | Length of everything after the 40-byte IPv6 header in bytes (max 65,535; Jumbogram option extends this) |
| Next Header | 8 | 48 | Identifies type of following header; same values as IPv4 Protocol field (TCP=6, UDP=17, ICMPv6=58) |
| Hop Limit | 8 | 56 | Equivalent to IPv4 TTL; decremented by 1 at each forwarding node |
| Source Address | 128 | 64 | 128-bit originating address |
| Destination Address | 128 | 192 | 128-bit destination address (may be intermediate node when Routing header is present) |

### Wire Format

```
IPv6 HEADER -- BIT-LEVEL LAYOUT (RFC 8200)
================================================================

 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|Version| Traffic Class |           Flow Label                  |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         Payload Length        |  Next Header  |   Hop Limit   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                                                               +
|                       Source Address                          |
+                       (128 bits)                              +
|                                                               |
+                                                               +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                                                               +
|                    Destination Address                        |
+                       (128 bits)                              +
|                                                               |
+                                                               +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### Design Rationale: What IPv6 Removed

IPv6 deliberately eliminated several IPv4 features:

- **Header checksum:** Removed because link-layer CRC and transport-layer checksums provide adequate error detection. Eliminating per-hop checksum recomputation reduces router processing overhead [8].
- **In-router fragmentation:** Routers never fragment IPv6 packets. Sources must use PMTUD to discover the path MTU. This simplifies router fast paths and avoids reassembly at intermediate nodes [8].
- **Options in the main header:** All optional functionality moved to extension headers, keeping the fixed header at exactly 40 bytes for efficient hardware parsing.

---

## 5. IPv6 Extension Headers

IPv6 extension headers chain via the Next Header field. Each extension header contains its own Next Header field pointing to the next header in the chain (or to the upper-layer protocol) [8].

### Extension Header Types

| Next Header Value | Name | Processed By | RFC | Purpose |
|---|---|---|---|---|
| 0 | Hop-by-Hop Options | Every node | RFC 8200 | Router Alert, Jumbogram. Must be first extension header if present. |
| 43 | Routing | Destination | RFC 8200 | Source routing. Type 0 deprecated by RFC 5095 due to amplification attacks. |
| 44 | Fragment | Destination | RFC 8200 | Source-initiated fragmentation only. Contains fragment offset and M flag. |
| 60 | Destination Options | Destination | RFC 8200 | Options processed only by the destination node. |
| 51 | Authentication Header | Destination | RFC 4302 | IPsec integrity and authentication. |
| 50 | ESP | Destination | RFC 4303 | IPsec encryption and optional authentication. |

### Processing Order

RFC 8200 Section 4.1 specifies the recommended processing order: IPv6 header, Hop-by-Hop, Destination (for first destination), Routing, Fragment, Authentication, ESP, Destination (for final destination), upper-layer header. Intermediate routers examine only the IPv6 header and Hop-by-Hop options; all other extension headers are processed by the destination [8].

> **SAFETY WARNING:** Extension header chains can be exploited for evasion. Some firewalls and middleboxes fail to parse deeply nested extension headers, allowing crafted packets to bypass security policies. RFC 7045 recommends that middleboxes be capable of parsing extension header chains [9].

---

## 6. IPv6 Addressing

IPv6 addresses are 128 bits, written as eight groups of four hexadecimal digits separated by colons (e.g., `2001:0db8:85a3:0000:0000:8a2e:0370:7334`). Leading zeros within a group may be omitted, and a single consecutive run of all-zero groups may be replaced with `::` [8].

### Address Types

| Type | Prefix | Example | Purpose |
|---|---|---|---|
| Global Unicast | 2000::/3 | 2001:db8::/32 | Routable on the public internet |
| Link-Local | fe80::/10 | fe80::1 | Single link only; mandatory on every interface |
| Unique Local | fc00::/7 | fd00::/8 | Private addressing (analogous to RFC 1918) |
| Multicast | ff00::/8 | ff02::1 | One-to-many delivery; replaces broadcast |
| Loopback | ::1/128 | ::1 | Localhost |
| Unspecified | ::/128 | :: | Absence of address (used during DHCP/SLAAC) |

### Interface Identifiers

The lower 64 bits of a global unicast address form the Interface ID. Three generation methods:

1. **Modified EUI-64:** Derived from MAC address (48-bit MAC expanded to 64 bits with FF:FE inserted; bit 7 flipped). Deprecated for privacy concerns (RFC 4941) [10].
2. **Stable OPAQUE IDs:** RFC 7217 generates stable but unpredictable Interface IDs using a hash of network prefix, interface name, and secret key.
3. **Temporary addresses:** RFC 4941 privacy extensions generate random, short-lived Interface IDs rotated periodically.

---

## 7. Fragmentation

### IPv4 Fragmentation

Any router along the path may fragment an IPv4 packet if it exceeds the outgoing link's MTU and the DF flag is not set. Fragments share the same Identification field value and are reassembled only at the destination [3].

- **Fragment Offset:** Measured in 8-byte units. A packet fragmented into two pieces: first fragment has MF=1 and offset=0; second has MF=0 and offset = (first fragment data length / 8).
- **Reassembly timeout:** RFC 1122 requires hosts to wait at least 60 seconds for all fragments before discarding incomplete reassembly buffers [1].
- **Minimum MTU:** 576 bytes for IPv4 (RFC 1122). Ethernet MTU is 1500 bytes.

### IPv6 Fragmentation

IPv6 does not allow routers to fragment packets. Only the source may fragment, using the Fragment extension header [8].

- **Minimum MTU:** 1280 bytes for IPv6. Any link supporting IPv6 must handle at least 1280-byte packets.
- **Fragment header:** 8 bytes containing Fragment Offset (13 bits, in 8-byte units), Reserved (2 bits), M flag (1 bit), and Identification (32 bits).
- **Recommendation:** RFC 8200 recommends that sources use Path MTU Discovery rather than fragmenting at minimum MTU, as fragmentation degrades performance and increases packet loss probability.

> **SAFETY WARNING:** IP fragmentation has been exploited in multiple attacks: the Ping of Death (oversized reassembled packet), teardrop attack (overlapping fragment offsets), and fragmentation-based firewall evasion (splitting header across fragments). These are documented for defensive understanding [11].

---

## 8. Path MTU Discovery

Path MTU Discovery (PMTUD) allows a source to determine the smallest MTU along the path to a destination without fragmenting packets.

### IPv4 PMTUD (RFC 1191)

1. Source sends packets with the DF (Don't Fragment) flag set
2. If a router encounters a link with smaller MTU than the packet size, it drops the packet and sends ICMP Type 3, Code 4 (Fragmentation Needed and Don't Fragment was Set) back to the source, including the next-hop MTU
3. Source reduces packet size to the reported MTU and retries
4. Process repeats until the packet reaches the destination [4]

### IPv6 PMTUD (RFC 8201)

1. Source sends packets at the link MTU
2. If a router encounters a smaller MTU, it sends ICMPv6 Type 2 (Packet Too Big) with the MTU value
3. Source reduces packet size accordingly [12]

### PMTUD Black Holes

PMTUD fails when ICMP messages are filtered by firewalls or middleboxes -- a "PMTUD black hole." Packets are silently dropped, and the source never receives the MTU feedback. RFC 4821 defines Packetization Layer PMTUD (PLPMTUD), which probes with increasingly smaller packets and infers MTU from successful delivery, avoiding reliance on ICMP [13].

---

## 9. ARP: Address Resolution Protocol

ARP (RFC 826) resolves IPv4 addresses to link-layer (MAC) addresses on a local network segment [14].

### ARP Operation

1. Host A needs to send to IPv4 address B on the same subnet
2. Host A broadcasts an ARP Request: "Who has IP B? Tell A."
3. Host B responds with a unicast ARP Reply: "IP B is at MAC xx:xx:xx:xx:xx:xx"
4. Host A caches the mapping (typical TTL: 20 minutes on Linux, 2 minutes on Windows)

### ARP Packet Format

| Field | Size | Description |
|---|---|---|
| Hardware Type | 16 bits | 1 = Ethernet |
| Protocol Type | 16 bits | 0x0800 = IPv4 |
| Hardware Addr Length | 8 bits | 6 (MAC address length) |
| Protocol Addr Length | 8 bits | 4 (IPv4 address length) |
| Operation | 16 bits | 1 = Request, 2 = Reply |
| Sender Hardware Addr | 48 bits | Sender's MAC address |
| Sender Protocol Addr | 32 bits | Sender's IPv4 address |
| Target Hardware Addr | 48 bits | Target's MAC (zero in request) |
| Target Protocol Addr | 32 bits | Target's IPv4 address |

### Gratuitous ARP

A gratuitous ARP is an ARP Reply sent without a preceding Request, or an ARP Request for the sender's own IP. Used for: duplicate address detection, updating caches after a NIC change, and VRRP/HSRP failover. Also exploitable for ARP spoofing/poisoning attacks where an attacker associates their MAC with another host's IP [14].

> **SAFETY WARNING:** ARP has no authentication mechanism. ARP spoofing allows man-in-the-middle attacks on local networks. Mitigations include Dynamic ARP Inspection (DAI), static ARP entries, and 802.1X port authentication. This is documented for defensive understanding only [14].

---

## 10. NDP: Neighbor Discovery Protocol

NDP (RFC 4861) replaces ARP for IPv6, providing address resolution plus several additional functions. NDP operates over ICMPv6 (protocol 58) [15].

### NDP Message Types

| ICMPv6 Type | Name | Purpose |
|---|---|---|
| 133 | Router Solicitation (RS) | Host requests router advertisements |
| 134 | Router Advertisement (RA) | Router announces prefixes, MTU, default gateway, flags |
| 135 | Neighbor Solicitation (NS) | Address resolution (replaces ARP Request) and DAD |
| 136 | Neighbor Advertisement (NA) | Address resolution reply (replaces ARP Reply) |
| 137 | Redirect | Router informs host of a better next-hop |

### Key Improvements Over ARP

- **No broadcast:** NDP uses solicited-node multicast (ff02::1:ffXX:XXXX) instead of broadcast, reducing processing load on all hosts
- **Router discovery:** Integrated into the same protocol (Router Solicitation/Advertisement)
- **SLAAC:** Stateless Address Autoconfiguration (RFC 4862) allows hosts to self-assign addresses from advertised prefixes without DHCP
- **DAD:** Duplicate Address Detection sends a Neighbor Solicitation for the tentative address before use
- **Redirect:** Routers can redirect hosts to better next-hops on the same link

### SLAAC Process

1. Host generates a link-local address (fe80:: + Interface ID)
2. Host performs DAD for the link-local address
3. Host sends Router Solicitation
4. Router responds with Router Advertisement containing prefix(es) and flags
5. Host generates global address(es) from prefix + Interface ID
6. Host performs DAD for each global address [16]

---

## 11. Dual-Stack Operation

Most production networks operate dual-stack, running IPv4 and IPv6 simultaneously on the same infrastructure. RFC 6540 recommends that ISPs provide native IPv6 connectivity alongside IPv4 [17].

### Dual-Stack Considerations

- **Happy Eyeballs (RFC 8305):** Clients attempt IPv6 and IPv4 connections in parallel, preferring whichever succeeds first with a small head start for IPv6 (250ms). Avoids long timeouts when one protocol is broken.
- **DNS:** Applications query for both AAAA (IPv6) and A (IPv4) records. DNS64 (RFC 6147) synthesizes AAAA records for IPv4-only destinations.
- **NAT64 (RFC 6146):** Translates between IPv6 and IPv4 at the network edge, allowing IPv6-only clients to reach IPv4-only servers.

### Adoption Statistics

As of 2025, Google reports approximately 45% of user traffic reaching their services over IPv6. Deployment varies dramatically by country: India exceeds 70%, the US exceeds 50%, while much of Africa and parts of Asia remain below 10% [18].

---

## 12. Mesh Relevance

The GSD Mesh Prototype's transport layer design benefits from IP layer understanding in several ways:

- **MTU awareness:** Mesh nodes must handle variable MTUs across heterogeneous links (Wi-Fi, Ethernet, cellular). PMTUD or PLPMTUD should be implemented to avoid fragmentation overhead.
- **IPv6 preference:** Mesh deployments benefit from IPv6's larger address space, integrated NDP, and SLAAC for zero-configuration node joining. Link-local addresses (fe80::/10) provide immediate connectivity without address assignment infrastructure.
- **Multicast:** IPv6 multicast (ff02::/16 link-local, ff05::/16 site-local) is more efficient than IPv4 broadcast for mesh discovery and group communication.
- **Extension headers:** Hop-by-Hop options can carry mesh routing metadata without modifying the core header.

---

## 13. Cross-References

> **Related:** [TCP Core](02-tcp-core.md) -- TCP segments are carried inside IP datagrams; the pseudo-header checksum references IP source/destination addresses. [Companion Protocols](04-companion-protocols.md) -- ICMP operates at the IP layer; UDP/DNS/DHCP rely on IP delivery. [Transport Evolution](05-transport-evolution.md) -- QUIC runs over UDP over IP; connection migration requires understanding of IP addressing.

**Series cross-references:**
- **DNS (DNS Protocol):** DNS queries resolve hostnames to IPv4 A records and IPv6 AAAA records
- **DHP (DHCP Protocol):** DHCP assigns IPv4 addresses and parameters; DHCPv6 complements SLAAC for IPv6
- **SYS (Systems Admin):** Network interface configuration, routing tables, firewall rules operate at the IP layer
- **K8S (Kubernetes):** Pod networking uses CIDR allocation; service mesh overlays build on IP routing
- **CMH (Comp. Mesh):** Mesh routing decisions depend on IP addressing and MTU constraints
- **RFC (RFC Archive):** Primary source for all IP standards and extensions

---

## 14. Sources

1. Braden, R. "Requirements for Internet Hosts -- Communication Layers." RFC 1122, IETF, October 1989. Status: Internet Standard (STD 3).
2. Postel, J. "DOD Standard Transmission Control Protocol." IEN 129, January 1980. (Historical context for TCP/IP split.)
3. Postel, J. "Internet Protocol." RFC 791, IETF, September 1981. Status: Internet Standard (STD 5).
4. Mogul, J. and Deering, S. "Path MTU Discovery." RFC 1191, IETF, November 1990.
5. Fuller, V. and Li, T. "Classless Inter-Domain Routing (CIDR): The Internet Address Assignment and Aggregation Plan." RFC 4632, IETF, August 2006.
6. Srisuresh, P. and Egevang, K. "Traditional IP Network Address Translator (Traditional NAT)." RFC 3022, IETF, January 2001.
7. IANA. "IPv4 Address Space Registry." Last updated 2025. Available at: https://www.iana.org/assignments/ipv4-address-space
8. Deering, S. and Hinden, R. "Internet Protocol, Version 6 (IPv6) Specification." RFC 8200, IETF, July 2017. Status: Internet Standard (STD 86).
9. Carpenter, B. and Jiang, S. "Transmission and Processing of IPv6 Extension Headers." RFC 7045, IETF, December 2013.
10. Narten, T., Draves, R., and Krishnan, S. "Privacy Extensions for Stateless Address Autoconfiguration in IPv6." RFC 4941, IETF, September 2007.
11. CERT. "IP Fragment Reassembly Vulnerabilities." Advisory CA-1997-28, December 1997.
12. McCann, J., Deering, S., Mogul, J., and Hinden, R. "Path MTU Discovery for IP version 6." RFC 8201, IETF, July 2017.
13. Mathis, M. and Heffner, J. "Packetization Layer Path MTU Discovery." RFC 4821, IETF, March 2007.
14. Plummer, D. "An Ethernet Address Resolution Protocol." RFC 826, IETF, November 1982. Status: Internet Standard (STD 37).
15. Narten, T., Nordmark, E., Simpson, W., and Soliman, H. "Neighbor Discovery for IP version 6 (IPv6)." RFC 4861, IETF, September 2007. Status: Draft Standard.
16. Thomson, S., Narten, T., and Jinmei, T. "IPv6 Stateless Address Autoconfiguration." RFC 4862, IETF, September 2007. Status: Draft Standard.
17. George, W., Donley, C., Liljenstolpe, C., and Howard, L. "IPv6 Support Required for All IP-Capable Nodes." RFC 6540, IETF, April 2012.
18. Google. "IPv6 Adoption Statistics." Available at: https://www.google.com/intl/en/ipv6/statistics.html (accessed March 2025).

---

*TCP/IP Protocol -- Module 1: IP Layer. The universal datagram: one promise, zero guarantees, planetary reach.*
