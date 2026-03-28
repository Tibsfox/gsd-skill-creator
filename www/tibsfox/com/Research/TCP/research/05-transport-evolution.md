# Transport Evolution

> **Domain:** Internet Protocol Suite
> **Module:** 5 -- TLS 1.3, QUIC, HTTP/3 & Next-Generation Transport
> **Through-line:** *TCP's 40-year ossification made QUIC necessary. Middleboxes -- firewalls, NATs, load balancers -- learned to inspect and modify TCP headers, making any change to TCP's wire format practically impossible to deploy. QUIC's response was radical: encrypt everything, run in user space, and use UDP as a dumb pipe. The architecture lesson is universal: if your protocol's wire image is visible, it will be ossified by middleboxes. Design for encryption from day one.*

---

## Table of Contents

1. [Protocol Ossification](#1-protocol-ossification)
2. [TLS 1.3 over TCP](#2-tls-13-over-tcp)
3. [TLS 1.3 Handshake Mechanics](#3-tls-13-handshake-mechanics)
4. [QUIC: Design Principles](#4-quic-design-principles)
5. [QUIC Packet Format](#5-quic-packet-format)
6. [QUIC Handshake: 1-RTT and 0-RTT](#6-quic-handshake-1-rtt-and-0-rtt)
7. [Stream Multiplexing](#7-stream-multiplexing)
8. [Connection Migration](#8-connection-migration)
9. [QUIC Congestion Control](#9-quic-congestion-control)
10. [HTTP/3 and QPACK](#10-http3-and-qpack)
11. [TCP Fast Open and MPTCP](#11-tcp-fast-open-and-mptcp)
12. [Latency Comparison](#12-latency-comparison)
13. [Deployment Status](#13-deployment-status)
14. [TCP vs QUIC: Cross-Protocol Comparison](#14-tcp-vs-quic-cross-protocol-comparison)
15. [Mesh Relevance](#15-mesh-relevance)
16. [Cross-References](#16-cross-references)
17. [Sources](#17-sources)

---

## 1. Protocol Ossification

Protocol ossification occurs when network middleboxes (firewalls, NATs, intrusion detection systems, load balancers) learn to parse and depend on protocol header fields, making future changes to the protocol impossible to deploy even if the specification allows them [1].

### TCP Ossification Examples

- **TCP options:** New TCP options (beyond the well-known MSS, SACK, Timestamps, Window Scale) are frequently stripped or cause packet drops by middleboxes that do not recognize them.
- **TCP Fast Open:** SYN packets containing data are dropped by middleboxes that expect SYN to carry no payload, limiting TFO deployment [2].
- **ECN:** ECN-capable SYN packets were historically dropped by some middleboxes (improving but not resolved).
- **Reserved bits:** The 3 reserved bits in the TCP header cannot be repurposed because some middleboxes check that they are zero.

### QUIC's Anti-Ossification Strategy

QUIC encrypts nearly everything:

- All QUIC packets (except Initial packets and version negotiation) have encrypted headers and payloads
- QUIC header fields that are visible (connection ID, packet number format) are intentionally minimal
- Greasing: QUIC implementations send random values in reserved fields and unsupported frame types to prevent middleboxes from depending on specific patterns (RFC 8701) [1]

---

## 2. TLS 1.3 over TCP

TLS 1.3 (RFC 8446, August 2018) provides authentication, confidentiality, and integrity for data carried over TCP. It represents a major simplification and security improvement over TLS 1.2 [3].

### Key Changes from TLS 1.2

| Feature | TLS 1.2 | TLS 1.3 |
|---|---|---|
| Handshake RTTs | 2 RTT | 1 RTT (new), 0 RTT (resumed) |
| Key exchange | RSA, DHE, ECDHE | ECDHE/DHE only (forward secrecy mandatory) |
| Cipher suites | Many (including weak) | 5 AEAD-only suites |
| Compression | Supported (CRIME attack) | Removed |
| Renegotiation | Supported (vulnerabilities) | Removed |
| 0-RTT | Not available | PSK-based early data |
| Encryption starts | After handshake complete | Server encrypts from ServerHello onward |

### Mandatory Cipher Suites

TLS 1.3 supports only AEAD (Authenticated Encryption with Associated Data) cipher suites:

| Suite | Key Exchange | Encryption | Hash |
|---|---|---|---|
| TLS_AES_128_GCM_SHA256 | ECDHE/DHE | AES-128-GCM | SHA-256 |
| TLS_AES_256_GCM_SHA384 | ECDHE/DHE | AES-256-GCM | SHA-384 |
| TLS_CHACHA20_POLY1305_SHA256 | ECDHE/DHE | ChaCha20-Poly1305 | SHA-256 |
| TLS_AES_128_CCM_SHA256 | ECDHE/DHE | AES-128-CCM | SHA-256 |
| TLS_AES_128_CCM_8_SHA256 | ECDHE/DHE | AES-128-CCM-8 | SHA-256 |

---

## 3. TLS 1.3 Handshake Mechanics

### 1-RTT Handshake (New Connection)

```
TLS 1.3 HANDSHAKE -- 1-RTT (NEW CONNECTION)
================================================================

  CLIENT                                          SERVER
    |                                               |
    |  ClientHello                                  |
    |  + key_share (ECDHE public key)               |
    |  + supported_versions (TLS 1.3)               |
    |  + signature_algorithms                       |
    |---------------------------------------------->>|
    |                                               |
    |  ServerHello                                  |
    |  + key_share (ECDHE public key)               |
    |  {EncryptedExtensions}                        |
    |  {Certificate}                                |
    |  {CertificateVerify}                          |
    |  {Finished}                                   |
    |<<----------------------------------------------|
    |                                               |
    |  [Handshake keys derived]                     |
    |  {Finished}                                   |
    |  [Application Data] ------>>                  |
    |---------------------------------------------->>|
    |                                               |
    |  [1 RTT total before first application data]  |
```

The client sends its key share in ClientHello. The server responds with its key share, certificate, and Finished in a single flight. Both sides derive handshake keys after ServerHello. The client can send application data immediately after its Finished message -- total 1 RTT [3].

### 0-RTT Resumption

When a client has a Pre-Shared Key (PSK) from a previous session:

```
TLS 1.3 -- 0-RTT RESUMPTION
================================================================

  CLIENT                                          SERVER
    |                                               |
    |  ClientHello                                  |
    |  + pre_shared_key                             |
    |  + early_data                                 |
    |  [0-RTT Application Data] ---->>              |
    |---------------------------------------------->>|
    |                                               |
    |  ServerHello + ... + Finished                 |
    |<<----------------------------------------------|
    |                                               |
    |  {Finished}                                   |
    |  [1-RTT Application Data] ---->>              |
    |---------------------------------------------->>|
```

> **SAFETY WARNING:** 0-RTT data is not forward secret (it uses the PSK, which was established in a prior session). 0-RTT data is also replayable -- an attacker who captures the ClientHello can replay it to the server. Applications must ensure 0-RTT data is idempotent. RFC 8446 Section 8 documents these risks [3].

---

## 4. QUIC: Design Principles

QUIC (RFC 9000, May 2021) is a UDP-based transport protocol that integrates transport and security into a single protocol [4].

### Core Design Decisions

1. **UDP carrier:** QUIC packets are encapsulated in UDP datagrams. This bypasses kernel TCP stack ossification and allows QUIC to be updated in user space without kernel changes.

2. **Mandatory encryption:** All QUIC packets (except version negotiation and retry) are encrypted. TLS 1.3 is mandatory (RFC 9001). There is no unencrypted QUIC. This prevents middlebox interference with QUIC internals.

3. **Connection IDs:** Connections are identified by Connection IDs (variable length, up to 20 bytes), not by the 4-tuple (src IP, src port, dst IP, dst port). This enables connection migration without reconnection.

4. **Stream multiplexing:** Multiple independent, bidirectional streams within a single connection. Loss on one stream does not block others (no head-of-line blocking).

5. **Integrated handshake:** Transport and TLS 1.3 handshake are combined into a single 1-RTT exchange (0-RTT for resumed connections).

6. **User-space implementation:** QUIC runs as a library in user space, not as a kernel protocol. This allows rapid iteration and deployment without waiting for OS kernel updates.

```
QUIC ARCHITECTURE
================================================================

  APPLICATION (HTTP/3, DNS-over-QUIC)
         |
         | Streams (multiplexed, independent)
         v
  +----------------------------------------------+
  |                    QUIC                       |
  |                                               |
  |  Connection IDs    Stream Multiplexing        |
  |  Packet Numbers    Flow Control (per-stream)  |
  |  Loss Detection    Congestion Control         |
  |  TLS 1.3 (integrated, mandatory)             |
  |  Connection Migration                         |
  +----------------------------------------------+
         |
         | UDP datagrams (no state, no CC)
         v
  +----------------------------------------------+
  |            UDP (RFC 768)                      |
  +----------------------------------------------+
         |
         v
  IP (IPv4 / IPv6)
```

---

## 5. QUIC Packet Format

QUIC defines two header formats: Long Header (used during handshake) and Short Header (used after handshake, optimized for data transfer) [4].

### Long Header (Handshake Packets)

| Field | Bits | Description |
|---|---|---|
| Header Form | 1 | 1 = Long Header |
| Fixed Bit | 1 | 1 (for QUIC version 1) |
| Long Packet Type | 2 | 0=Initial, 1=0-RTT, 2=Handshake, 3=Retry |
| Type-Specific Bits | 4 | Reserved + Packet Number Length |
| Version | 32 | QUIC version (0x00000001 for QUIC v1) |
| DCID Length | 8 | Destination Connection ID length |
| Destination Connection ID | Variable | Up to 20 bytes |
| SCID Length | 8 | Source Connection ID length |
| Source Connection ID | Variable | Up to 20 bytes |
| Type-Specific Payload | Variable | Token (Initial), Packet Number, encrypted frames |

### Short Header (1-RTT Data Packets)

| Field | Bits | Description |
|---|---|---|
| Header Form | 1 | 0 = Short Header |
| Fixed Bit | 1 | 1 (for QUIC version 1) |
| Spin Bit | 1 | RTT measurement signal (toggles each RTT) |
| Reserved Bits | 2 | Protected (encrypted) to prevent ossification |
| Key Phase | 1 | Indicates which application key is in use |
| Packet Number Length | 2 | Encoded length of packet number (1-4 bytes) |
| Destination Connection ID | Variable | Length known from handshake; 0 bytes if omitted |
| Packet Number | 8-32 | Protected (encrypted); monotonically increasing |
| Payload | Variable | Encrypted QUIC frames |

### Packet Number Spaces

QUIC maintains three independent packet number spaces: Initial, Handshake, and Application Data. Each space has its own ACK tracking and loss detection. This separation prevents handshake packet loss from interfering with application data acknowledgment [4].

---

## 6. QUIC Handshake: 1-RTT and 0-RTT

### 1-RTT (New Connection)

```
QUIC 1-RTT HANDSHAKE
================================================================

  CLIENT                                          SERVER
    |                                               |
    |  Initial[0]: CRYPTO(ClientHello)              |
    |---------------------------------------------->>|
    |                                               |
    |  Initial[0]: CRYPTO(ServerHello)              |
    |  Handshake[0]: CRYPTO(EncExt, Cert, CV, Fin) |
    |<<----------------------------------------------|
    |                                               |
    |  [Client derives handshake + 1-RTT keys]      |
    |  Handshake[0]: CRYPTO(Finished)               |
    |  1-RTT[0]: STREAM(application data)           |
    |---------------------------------------------->>|
    |                                               |
    |  Total: 1 RTT before first application data   |
```

QUIC integrates the TLS 1.3 handshake with transport setup. The CRYPTO frame carries TLS handshake messages. After the first flight, both sides have 1-RTT keys and can exchange application data [4][5].

### 0-RTT (Resumed Connection)

```
QUIC 0-RTT RESUMPTION
================================================================

  CLIENT                                          SERVER
    |                                               |
    |  Initial[0]: CRYPTO(ClientHello + PSK)        |
    |  0-RTT[0]: STREAM(early application data)     |
    |---------------------------------------------->>|
    |                                               |
    |  Initial[0]: CRYPTO(ServerHello)              |
    |  Handshake[0]: CRYPTO(EncExt, Fin)            |
    |  1-RTT[0]: STREAM(response data)              |
    |<<----------------------------------------------|
    |                                               |
    |  Total: 0 RTT for early data                  |
```

0-RTT data is encrypted with a key derived from the PSK. The same replay and forward secrecy caveats as TLS 1.3 0-RTT apply (Section 3 warning) [4][5].

---

## 7. Stream Multiplexing

QUIC streams are lightweight, independent, bidirectional byte streams within a connection [4].

### Stream Types

| Stream Type | ID Format | Initiator | Direction |
|---|---|---|---|
| Client-initiated bidirectional | 0, 4, 8, ... | Client | Both directions |
| Server-initiated bidirectional | 1, 5, 9, ... | Server | Both directions |
| Client-initiated unidirectional | 2, 6, 10, ... | Client | Client to server only |
| Server-initiated unidirectional | 3, 7, 11, ... | Server | Server to client only |

### Head-of-Line Blocking Elimination

In TCP (and HTTP/2 over TCP), a single lost packet blocks delivery of all subsequent data on the connection, even if that data belongs to independent requests. This is "head-of-line (HoL) blocking" [6].

```
HEAD-OF-LINE BLOCKING COMPARISON
================================================================

  TCP (HTTP/2):
  Stream A: [pkt1][pkt2][pkt3] ───> [pkt1][LOST][blocked][blocked]
  Stream B: [pkt4][pkt5] ──────────> [blocked][blocked]
  Stream C: [pkt6] ────────────────> [blocked]
  (ALL streams blocked by single loss)

  QUIC (HTTP/3):
  Stream A: [pkt1][pkt2][pkt3] ───> [pkt1][LOST][waiting...]
  Stream B: [pkt4][pkt5] ──────────> [pkt4][pkt5] (delivered!)
  Stream C: [pkt6] ────────────────> [pkt6] (delivered!)
  (Only Stream A blocked; B and C proceed independently)
```

### Flow Control

QUIC provides flow control at two levels:

- **Stream-level:** Each stream has its own receive window (MAX_STREAM_DATA frame). A slow consumer on one stream does not block other streams.
- **Connection-level:** The total data across all streams is bounded by a connection-level window (MAX_DATA frame). This prevents a single connection from overwhelming the receiver's memory [4].

---

## 8. Connection Migration

QUIC connections are identified by Connection IDs, not by the IP/port 4-tuple. When a client's IP address changes (e.g., mobile handoff from Wi-Fi to cellular), the connection continues without interruption [4].

### Migration Process

1. Client detects network change (new IP address or port)
2. Client sends a PATH_CHALLENGE frame from the new address
3. Server responds with PATH_RESPONSE from the same address
4. Path validated; connection continues with new address
5. Server may issue new Connection IDs via NEW_CONNECTION_ID frame

### Security: Path Validation

Path validation prevents an attacker from redirecting traffic to a victim's address. The PATH_CHALLENGE contains a random 8-byte token; only a host that actually receives the challenge can send the correct PATH_RESPONSE [4].

### Comparison to TCP

TCP connections are defined by the 4-tuple (source IP, source port, destination IP, destination port). If any element changes, the connection is lost and must be re-established. Multipath TCP (MPTCP, RFC 8684) adds multi-path capability but requires kernel support and middlebox compatibility [7].

---

## 9. QUIC Congestion Control

QUIC implements its own congestion control, independent of kernel TCP. RFC 9002 specifies the default loss detection and congestion control mechanisms [8].

### Default Algorithm

RFC 9002 specifies a congestion control algorithm based on NewReno (RFC 6582) with QUIC-specific adaptations:

- Uses packet numbers (monotonically increasing, never reused) instead of TCP sequence numbers, eliminating retransmission ambiguity
- ACK frames carry explicit acknowledgment ranges (similar to SACK)
- Separate congestion state per path (relevant for connection migration)

### Pluggable Architecture

QUIC's user-space implementation enables pluggable congestion control. Implementations can use any algorithm:

| Implementation | Default CC | Alternatives |
|---|---|---|
| Google (Chromium) | CUBIC / BBR | BBRv2 |
| Cloudflare (quiche) | CUBIC | BBR, Reno |
| Facebook (mvfst) | BBR | CUBIC, Copa |
| Apple | CUBIC | -- |
| Microsoft (MsQuic) | CUBIC | BBR |

### Pacing

Most QUIC implementations pace packet transmission (spreading packets evenly over time) rather than sending in bursts. This reduces buffer bloat at bottleneck routers and improves fairness. BBR inherently paces; CUBIC implementations add pacing as an enhancement [8].

---

## 10. HTTP/3 and QPACK

### HTTP/3 (RFC 9114)

HTTP/3 is HTTP semantics over QUIC. It replaces TCP as the transport layer, gaining stream multiplexing, 0-RTT connection resumption, and HoL blocking elimination [9].

### Key Differences from HTTP/2

| Feature | HTTP/2 (over TCP) | HTTP/3 (over QUIC) |
|---|---|---|
| Transport | TCP + TLS 1.2/1.3 | QUIC (integrated TLS 1.3) |
| Multiplexing | Streams over single TCP connection | Independent QUIC streams |
| HoL blocking | Yes (TCP layer) | No (per-stream loss isolation) |
| Header compression | HPACK (stateful, ordered) | QPACK (adapted for unordered delivery) |
| Server push | Supported | Deprecated in RFC 9114 |
| Connection setup | 2-3 RTT (TCP + TLS) | 1 RTT (new) / 0 RTT (resumed) |

### QPACK (RFC 9204)

QPACK replaces HTTP/2's HPACK header compression for HTTP/3. HPACK requires headers to be decoded in order (because the dynamic table is updated by each header block). QUIC streams may arrive out of order, so QPACK separates the dynamic table updates into a dedicated unidirectional stream and allows header blocks to reference the table at a specific insert count [10].

### HTTP/3 Stream Types

| Stream | Direction | Purpose |
|---|---|---|
| Request stream | Bidirectional | One HTTP request-response per stream |
| Control stream | Unidirectional | Settings, GOAWAY, priority |
| QPACK encoder stream | Unidirectional | Dynamic table insert commands |
| QPACK decoder stream | Unidirectional | Table insert acknowledgments |

---

## 11. TCP Fast Open and MPTCP

### TCP Fast Open (RFC 7413)

TFO reduces TCP connection establishment latency by 1 RTT for repeat connections. See Module 02 Section 12 for details. Key limitation: middlebox interference has limited deployment. TFO does not address TCP's fundamental ossification problem [2].

### Multipath TCP (MPTCP, RFC 8684)

MPTCP allows a single TCP connection to use multiple network paths simultaneously, providing:

- **Redundancy:** If one path fails, the connection continues on remaining paths
- **Bandwidth aggregation:** Data can be spread across paths for higher throughput
- **Seamless handoff:** Mobile devices can transition between Wi-Fi and cellular

### MPTCP Architecture

```
MPTCP ARCHITECTURE
================================================================

  APPLICATION (sees single TCP connection)
         |
  +----------------------------------------------+
  |                    MPTCP                      |
  |                                               |
  |  Data Sequence Number (DSN) mapping           |
  |  Subflow management (MP_CAPABLE, MP_JOIN)     |
  |  Scheduler (round-robin, lowest-RTT, etc.)    |
  +----------------------------------------------+
         |                    |
   +-----------+        +-----------+
   | Subflow 1 |        | Subflow 2 |
   | (TCP conn |        | (TCP conn |
   |  via WiFi)|        |  via Cell)|
   +-----------+        +-----------+
         |                    |
        WiFi               Cellular
```

MPTCP is used by Apple for Siri and Maps traffic, and by Samsung for certain streaming services. Each MPTCP subflow appears as a regular TCP connection to the network, providing middlebox compatibility. However, MPTCP requires kernel support on both endpoints [7].

---

## 12. Latency Comparison

### New Connection Latency

| Protocol Stack | RTTs Before First Data | Notes |
|---|---|---|
| TCP only | 1 RTT | 3-way handshake |
| TCP + TLS 1.2 | 3 RTT | TCP handshake + 2 RTT TLS |
| TCP + TLS 1.3 | 2 RTT | TCP handshake + 1 RTT TLS |
| TCP + TLS 1.3 + TFO | 1 RTT | TFO eliminates TCP handshake RTT (repeat only) |
| QUIC (new) | 1 RTT | Integrated transport + TLS handshake |
| QUIC (resumed) | 0 RTT | 0-RTT early data with PSK |

### Quantitative Impact

On a 100ms RTT path:

- TCP + TLS 1.3: 200ms before first byte of application data
- QUIC (new): 100ms before first byte
- QUIC (resumed): 0ms additional latency (data in first packet)

For a typical web page load with 50+ resources from the same origin, the connection setup savings compound: QUIC's single connection with multiplexed streams avoids the serial dependency of TCP connection pool establishment [4][9].

---

## 13. Deployment Status

### QUIC Adoption (as of 2025)

- **Browser support:** Chrome, Firefox, Safari, Edge all support HTTP/3 over QUIC (>95% of global browser traffic)
- **Server support:** Approximately 34% of the top 10 million websites support HTTP/3 (W3Techs, 2024)
- **Traffic share:** QUIC carries approximately 7-10% of all web traffic globally (Google reports higher for their properties)
- **Major deployers:** Google (YouTube, Gmail, Maps, Search), Meta (Facebook, Instagram), Cloudflare, Akamai, Fastly

### TLS 1.3 Adoption

- Approximately 67% of HTTPS connections use TLS 1.3 as of 2025 (SSL Labs survey)
- TLS 1.2 remains widely supported as fallback
- TLS 1.0 and 1.1 have been deprecated by all major browsers since 2020

### IPv6 + QUIC

QUIC over IPv6 avoids IPv4 NAT complications. Connection migration works more naturally with IPv6's larger address space and lack of NAT state. The combination of QUIC + IPv6 represents the modern transport baseline [4].

---

## 14. TCP vs QUIC: Cross-Protocol Comparison

| Property | TCP + TLS 1.3 | QUIC |
|---|---|---|
| **Layer** | Kernel transport + user TLS | User-space transport + TLS |
| **Carrier** | IP directly | UDP over IP |
| **Connection setup** | 2 RTT (TCP + TLS) | 1 RTT (new) / 0 RTT (resumed) |
| **Encryption** | Optional (TLS separate) | Mandatory (TLS integrated) |
| **Multiplexing** | Single byte stream | Multiple independent streams |
| **HoL blocking** | Yes | No (per-stream isolation) |
| **Connection ID** | 4-tuple (IP:port pairs) | Connection IDs (migration-safe) |
| **Congestion control** | Kernel-implemented | User-space, pluggable |
| **Loss detection** | Cumulative ACK + SACK | Explicit ACK ranges, no ambiguity |
| **Flow control** | Connection-level only | Per-stream + connection-level |
| **Ossification risk** | High (40 years of middlebox) | Low (encrypted wire image) |
| **Kernel dependency** | Yes (kernel TCP stack) | No (user-space library) |
| **Deployment maturity** | 40+ years | ~5 years (RFC 9000: May 2021) |
| **Middlebox compatibility** | Full | Sometimes blocked (UDP 443 filtering) |
| **Debugging** | tcpdump reads plaintext headers | Requires qlog or endpoint logging |

---

## 15. Mesh Relevance

Transport evolution directly informs GSD Mesh Prototype design:

- **QUIC as mesh transport:** QUIC's connection migration, stream multiplexing, and mandatory encryption make it the strongest candidate for mesh node-to-node communication. Connection migration handles mobile mesh nodes transitioning between networks.
- **0-RTT for mesh reconnection:** Mesh nodes that frequently disconnect and reconnect benefit from QUIC's 0-RTT resumption.
- **Stream multiplexing for DACP:** DACP messages, control traffic, and bulk data can use separate QUIC streams within a single connection, avoiding head-of-line blocking between message types.
- **User-space deployment:** QUIC's user-space implementation allows mesh transport updates without kernel changes -- critical for heterogeneous mesh node operating systems.
- **Pluggable congestion control:** Mesh networks may need different congestion control on different link types (BBR for lossy wireless, CUBIC for wired backbone). QUIC's pluggable architecture supports this.
- **Anti-ossification lesson:** The mesh protocol should encrypt its wire image from day one to prevent future middlebox interference.

---

## 16. Cross-References

> **Related:** [IP Layer](01-ip-layer.md) -- QUIC runs over UDP over IP; connection migration requires understanding IP addressing. [TCP Core](02-tcp-core.md) -- QUIC reimplements TCP's reliability model with improvements (stream multiplexing, no HoL blocking). [Congestion Control](03-congestion-control.md) -- QUIC uses the same congestion control algorithms (CUBIC, BBR) with pluggable architecture. [Companion Protocols](04-companion-protocols.md) -- DNS-over-QUIC (DoQ) is a modern DNS transport; QUIC runs over UDP.

**Series cross-references:**
- **CMH (Comp. Mesh):** Mesh transport layer design strongly influenced by QUIC architecture
- **MCF (Multi-Cluster Fed.):** Cross-cluster communication benefits from QUIC connection migration
- **WPH (Weekly Phone):** Real-time communication latency improved by QUIC 0-RTT
- **SYS (Systems Admin):** QUIC deployment requires UDP port 443 access; firewall configuration
- **K8S (Kubernetes):** Service mesh proxies (Envoy) increasingly support QUIC/HTTP3
- **RFC (RFC Archive):** RFC 9000 (QUIC), RFC 9001 (QUIC-TLS), RFC 9114 (HTTP/3), RFC 8446 (TLS 1.3)

---

## 17. Sources

1. Thomson, M. "Version-Independent Properties of QUIC." RFC 8999, IETF, May 2021.
2. Cheng, Y., Chu, J., Radhakrishnan, S., and Jain, A. "TCP Fast Open." RFC 7413, IETF, December 2014.
3. Rescorla, E. "The Transport Layer Security (TLS) Protocol Version 1.3." RFC 8446, IETF, August 2018.
4. Iyengar, J. and Thomson, M. "QUIC: A UDP-Based Multiplexed and Secure Transport." RFC 9000, IETF, May 2021.
5. Thomson, M. and Turner, S. "Using TLS to Secure QUIC." RFC 9001, IETF, May 2021.
6. Chen, Y. et al. "RFC 9000 and its Siblings: An Overview of QUIC Standards." TU Munich, 2024.
7. Ford, A., Raiciu, C., Handley, M., Bonaventure, O., and Paasch, C. "TCP Extensions for Multipath Operation with Multiple Addresses." RFC 8684, IETF, March 2020.
8. Iyengar, J. and Swett, I. "QUIC Loss Detection and Congestion Control." RFC 9002, IETF, May 2021.
9. Bishop, M. "HTTP/3." RFC 9114, IETF, June 2022.
10. Krasic, C., Bishop, M., and Frindell, A. "QPACK: Field Compression for HTTP/3." RFC 9204, IETF, June 2022.
11. Cardwell, N. et al. "BBR: Congestion-Based Congestion Control." ACM Queue, vol. 14, no. 5, 2016.
12. Ha, S., Rhee, I., and Xu, L. "CUBIC for Fast Long-Distance Networks." RFC 8312, IETF, February 2018.
13. W3Techs. "Usage of HTTP/3 for websites." Available at: https://w3techs.com/technologies/details/ce-http3 (accessed March 2025).
14. Google. "QUIC, a multiplexed transport over UDP." Chromium Projects. Available at: https://www.chromium.org/quic
15. Langley, A. et al. "The QUIC Transport Protocol: Design and Internet-Scale Deployment." Proceedings of ACM SIGCOMM '17, pp. 183-196, 2017.
16. Eddy, W. "Transmission Control Protocol (TCP)." RFC 9293, IETF, August 2022.
17. Comer, D.E. *Internetworking with TCP/IP: Principles, Protocols, and Architecture.* 6th ed. Prentice Hall, 2015.

---

*TCP/IP Protocol -- Module 5: Transport Evolution. From ossification to encryption, from TCP's 40-year legacy to QUIC's radical redesign. Design for replaceability.*
