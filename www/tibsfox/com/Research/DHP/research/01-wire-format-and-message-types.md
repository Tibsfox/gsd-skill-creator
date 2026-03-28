# Wire Format and Message Types

> **Domain:** Network Protocols -- Internet Infrastructure Layer
> **Module:** 1 -- DHCP Packet Structure, Field Layout, and Message Semantics
> **Through-line:** *Before a device has an identity -- before it knows its own IP address -- it broadcasts into the void: Who am I? Where am I? What are my parameters?* The DHCP wire format is 236 bytes of fixed header followed by a variable options field, and those bytes are the first conversation every networked device has with the infrastructure that will host it. Understanding the wire format is the prerequisite for everything else.

---

## Table of Contents

1. [DHCP Packet Architecture](#1-dhcp-packet-architecture)
2. [Fixed Header Field Layout](#2-fixed-header-field-layout)
3. [The op Field and BOOTP Heritage](#3-the-op-field-and-bootp-heritage)
4. [Transaction ID and Correlation](#4-transaction-id-and-correlation)
5. [Address Fields: ciaddr, yiaddr, siaddr, giaddr](#5-address-fields-ciaddr-yiaddr-siaddr-giaddr)
6. [Hardware Address and Padding](#6-hardware-address-and-padding)
7. [The sname and file Fields](#7-the-sname-and-file-fields)
8. [The Options Field and Magic Cookie](#8-the-options-field-and-magic-cookie)
9. [Message Types: The Eight DHCP Operations](#9-message-types-the-eight-dhcp-operations)
10. [The DORA Exchange](#10-the-dora-exchange)
11. [Transport Rules: UDP Ports, Broadcast, and Unicast](#11-transport-rules-udp-ports-broadcast-and-unicast)
12. [Minimum Packet Size and Padding](#12-minimum-packet-size-and-padding)
13. [Relay Agent Processing](#13-relay-agent-processing)
14. [Cross-References](#14-cross-references)
15. [Sources](#15-sources)

---

## 1. DHCP Packet Architecture

The Dynamic Host Configuration Protocol operates at the application layer of the TCP/IP stack, using UDP for transport. Every DHCP message -- whether a client discovering servers, a server offering an address, or a client releasing its lease -- shares a single, common packet format defined in RFC 2131 Section 2 [1].

The packet consists of two regions: a **fixed-format header** of exactly 236 bytes containing 15 named fields, followed by a **variable-length options field** that begins with a 4-byte magic cookie and contains Type-Length-Value encoded options. This dual structure reflects DHCP's heritage from BOOTP (RFC 951): the fixed header is backward-compatible with the original BOOTP format, while the options field extends the protocol's capability far beyond simple bootstrap configuration [2].

```
DHCP PACKET LAYOUT -- OVERVIEW
================================================================

Byte 0                                              Byte 235
+--------+--------+--------+--------+               +--------+
|   op   | htype  |  hlen  |  hops  |               |  file  |
+--------+--------+--------+--------+               +--------+
|           xid (4 bytes)           |               | (128B) |
+--------+--------+--------+--------+               +--------+
|   secs (2B)     |   flags (2B)   |
+--------+--------+--------+--------+    Byte 236+
|        ciaddr (4 bytes)           |    +-------------------+
+-----------------------------------+    | Magic Cookie (4B) |
|        yiaddr (4 bytes)           |    | 99.130.83.99      |
+-----------------------------------+    +-------------------+
|        siaddr (4 bytes)           |    | Option TLV...     |
+-----------------------------------+    | Option TLV...     |
|        giaddr (4 bytes)           |    | ...               |
+-----------------------------------+    | End (0xFF)        |
|        chaddr (16 bytes)          |    +-------------------+
+-----------------------------------+
|        sname (64 bytes)           |
+-----------------------------------+
|        file (128 bytes)           |
+-----------------------------------+

   FIXED HEADER: 236 bytes              OPTIONS: variable length
```

The total minimum DHCP message size is 576 bytes, as required by RFC 1122 for any IP datagram that a host must be capable of receiving [3]. Clients pad messages to this minimum if needed.

---

## 2. Fixed Header Field Layout

The 15 named fields of the DHCP fixed header occupy the first 236 bytes. All multi-byte fields are in network byte order (big-endian) [1].

| Field | Offset | Size | Description |
|-------|--------|------|-------------|
| op | 0 | 1 byte | Message opcode: 1 = BOOTREQUEST (client to server), 2 = BOOTREPLY (server to client) |
| htype | 1 | 1 byte | Hardware address type: 1 = 10 Mb Ethernet (per IANA ARP parameters registry) [4] |
| hlen | 2 | 1 byte | Hardware address length in bytes: 6 for Ethernet MAC addresses |
| hops | 3 | 1 byte | Relay agent hop count. Client sets to 0; each relay agent increments by 1 |
| xid | 4 | 4 bytes | Transaction ID: random 32-bit value set by client to match requests with replies |
| secs | 8 | 2 bytes | Seconds elapsed since client began address acquisition or renewal process |
| flags | 10 | 2 bytes | Flags field. Only bit 0 (MSB, broadcast flag) defined; remaining 15 bits reserved (MBZ) |
| ciaddr | 12 | 4 bytes | Client IP address. Filled only when client is in BOUND, RENEWING, or REBINDING state |
| yiaddr | 16 | 4 bytes | "Your" (client) IP address: the address being offered or acknowledged by the server |
| siaddr | 20 | 4 bytes | IP address of next server to use in bootstrap. Not the DHCP server identifier (that is option 54) |
| giaddr | 24 | 4 bytes | Relay agent IP address. Set by relay agent; server uses this to determine address pool selection |
| chaddr | 28 | 16 bytes | Client hardware address: MAC address padded with zeros to 16 bytes for Ethernet clients |
| sname | 44 | 64 bytes | Optional server host name, null-terminated string. May be overloaded with options (option 52) |
| file | 108 | 128 bytes | Boot file name, null-terminated. May be overloaded with options (option 52) |
| options | 236 | variable | Options field, beginning with 4-byte magic cookie (99.130.83.99), followed by TLV options |

The byte offsets are cumulative and form the canonical reference for parsing: `op` starts at byte 0, `xid` at byte 4, `ciaddr` at byte 12, `chaddr` at byte 28, `sname` at byte 44, `file` at byte 108, and `options` at byte 236 [1].

---

## 3. The op Field and BOOTP Heritage

The `op` field (byte 0) is a direct inheritance from BOOTP (RFC 951). It takes only two values: 1 (BOOTREQUEST) for messages from client to server, and 2 (BOOTREPLY) for messages from server to client [2]. Despite the existence of 8 distinct DHCP message types (encoded in option 53), the `op` field remains binary -- all client-originated messages (DISCOVER, REQUEST, DECLINE, RELEASE, INFORM) carry `op=1`, and all server-originated messages (OFFER, ACK, NAK) carry `op=2` [1].

This design choice illustrates the DHCP extension philosophy: new semantics were added through options rather than modifying the base header, preserving wire-level compatibility with BOOTP infrastructure that was already deployed when DHCP was standardized in 1993 (RFC 1531) and revised in 1997 (RFC 2131) [5].

---

## 4. Transaction ID and Correlation

The `xid` field (bytes 4-7) is a 32-bit random number chosen by the client and copied into all subsequent messages within a single transaction. The server echoes the same `xid` in its replies, allowing the client to correlate responses to its requests without any connection state [1].

The randomness of `xid` is security-relevant. If an attacker can predict the `xid` of an ongoing DHCP exchange, they can forge DHCPOFFER or DHCPACK messages that the client will accept. RFC 2131 specifies that `xid` should be a "random transaction identifier" but does not mandate a specific generation method. Implementations using sequential or weakly random `xid` values are vulnerable to injection attacks [6].

In multi-server environments where a client receives multiple OFFERs, the `xid` ensures that the client correctly associates each OFFER with its original DISCOVER broadcast. The same `xid` persists through the DISCOVER-OFFER-REQUEST-ACK (DORA) exchange, providing stateless correlation across all four messages [1].

---

## 5. Address Fields: ciaddr, yiaddr, siaddr, giaddr

The four IP address fields in the DHCP header serve distinct roles that encode the protocol's operational semantics:

**ciaddr (Client IP Address, bytes 12-15):** Only filled when the client already has a configured IP address and is in the BOUND, RENEWING, or REBINDING state. During initial acquisition (DISCOVER and first REQUEST), `ciaddr` is 0.0.0.0. During renewal, the client fills `ciaddr` with its current assigned address [1].

**yiaddr (Your IP Address, bytes 16-19):** The address being offered or confirmed by the server. In a DHCPOFFER, `yiaddr` contains the proposed address. In a DHCPACK, it contains the confirmed address. The distinction between `ciaddr` ("my current address") and `yiaddr` ("the address being given to me") is fundamental to the protocol's state transitions [1].

**siaddr (Server IP Address, bytes 20-23):** The IP address of the next server to use in bootstrap (e.g., a TFTP server for PXE booting). This is explicitly *not* the DHCP server identifier -- that role belongs to option 54. Confusion between `siaddr` and option 54 is a common implementation error documented in DHCP deployment guides [7].

**giaddr (Gateway IP Address, bytes 24-27):** Set exclusively by DHCP relay agents. When a relay agent forwards a client's broadcast DHCP message to a server on a different subnet, the relay fills `giaddr` with the IP address of the interface on which it received the client's message. The server uses `giaddr` to determine which IP address pool to allocate from -- a critical mechanism for multi-subnet deployments [1].

> **SAFETY WARNING:** The `giaddr` field is trusted without authentication by DHCP servers. A rogue relay agent or a crafted packet with a spoofed `giaddr` can cause the server to allocate addresses from the wrong pool, placing clients on incorrect subnets. DHCP snooping at the switch level is the primary defense against this vector [8].

---

## 6. Hardware Address and Padding

The `chaddr` field (bytes 28-43) is 16 bytes wide, accommodating hardware address types up to 16 bytes in length. For Ethernet clients (the vast majority), the 6-byte MAC address occupies bytes 28-33, and bytes 34-43 are zero-padded [1].

The `htype` field (byte 1) specifies the hardware address type per the IANA "ARP Parameters" registry: 1 for 10 Mb Ethernet, 6 for IEEE 802, and many others. The `hlen` field (byte 2) specifies the actual hardware address length, allowing the server to correctly interpret the meaningful portion of `chaddr` [4].

The 16-byte width of `chaddr` was a forward-looking design decision. While no common hardware address type exceeded 6 bytes when DHCP was standardized, the extra space accommodates potential future hardware types. Token Ring (8-byte addresses) and some Fibre Channel configurations use longer addresses, though these are rare in practice [9].

---

## 7. The sname and file Fields

The `sname` field (bytes 44-107, 64 bytes) optionally contains the hostname of the DHCP server, as a null-terminated ASCII string. The `file` field (bytes 108-235, 128 bytes) optionally contains the boot file path for network booting (PXE, BOOTP). Both fields are inherited from BOOTP [2].

When the 312-byte options field (236 + 312 = 548 bytes, fitting within the 576-byte minimum) is insufficient for all required options, either or both of these fields can be "overloaded" to carry additional options. Option 52 (Option Overload) signals this:

- Value 1: `file` field carries options
- Value 2: `sname` field carries options
- Value 3: Both fields carry options

When overloaded, the fields are parsed as additional TLV option sequences, with the same format as the main options field (but without a magic cookie prefix) [1].

---

## 8. The Options Field and Magic Cookie

The options field begins at byte 236 with a 4-byte **magic cookie**: the values 99, 130, 83, 99 (hexadecimal 63, 82, 53, 63). This 32-bit value identifies the options field as containing DHCP/BOOTP vendor extensions rather than other data. The magic cookie is defined in RFC 2132 Section 2 and traces back to RFC 1497 [10].

Following the magic cookie, options are encoded in Type-Length-Value (TLV) format: one byte for the option code (tag), one byte for the data length, followed by the data bytes. Two special options have no length or value: the Pad option (code 0) used for alignment, and the End option (code 255) marking the end of the options field [10].

```
OPTION ENCODING -- TLV FORMAT
================================================================

Standard option:
+------+--------+------- ... -------+
| Code |  Len   |   Data (Len bytes)|
| 1 B  |  1 B   |   Len bytes       |
+------+--------+------- ... -------+

Example: DHCP Message Type = DISCOVER
+------+------+------+
| 0x35 | 0x01 | 0x01 |
| (53) | (1)  | (1=DISCOVER) |
+------+------+------+

Pad option (code 0):       End option (code 255):
+------+                   +------+
| 0x00 |                   | 0xFF |
+------+                   +------+
  No length/value            No length/value
```

The options field size is nominally 312 bytes (576 - 236 - 28 bytes for IP+UDP headers), but can be larger if the client and server negotiate a larger maximum message size via option 57 [1].

---

## 9. Message Types: The Eight DHCP Operations

DHCP defines exactly eight message types, encoded in option 53 (DHCP Message Type). Every DHCP message must contain option 53 [1].

| Code | Message | op | Direction | Purpose |
|------|---------|----|-----------| --------|
| 1 | DHCPDISCOVER | 1 (REQ) | Client to server(s) | Client broadcasts to locate available DHCP servers. ciaddr=0, yiaddr=0. |
| 2 | DHCPOFFER | 2 (REPLY) | Server to client | Server offers a lease. yiaddr = proposed IP. Includes option 54 (server ID), option 51 (lease time). |
| 3 | DHCPREQUEST | 1 (REQ) | Client to server(s) | Client selects an offer (broadcast), renews lease (unicast to server), or rebinds (broadcast). |
| 4 | DHCPDECLINE | 1 (REQ) | Client to server | Client rejects offered address because ARP probe detected the address is already in use on the network. |
| 5 | DHCPACK | 2 (REPLY) | Server to client | Server acknowledges and confirms all lease parameters. This is the final authority for the client's configuration. |
| 6 | DHCPNAK | 2 (REPLY) | Server to client | Server refuses the request (address unavailable, lease expired, wrong subnet). Client must restart from INIT. |
| 7 | DHCPRELEASE | 1 (REQ) | Client to server | Client voluntarily relinquishes its lease. Server may return address to pool immediately. |
| 8 | DHCPINFORM | 1 (REQ) | Client to server | Client already has an IP, requests only other configuration parameters. No address assignment. Added in RFC 2131. |

Note that DHCPREQUEST serves three distinct roles depending on context: initial selection (broadcast, selecting one offer from multiple), renewal (unicast to the original server at T1), and rebinding (broadcast to any server at T2). The same message type, differentiated by the presence or absence of specific options and the unicast/broadcast choice [1].

---

## 10. The DORA Exchange

The normal DHCP address acquisition is a four-message exchange known as DORA: Discover, Offer, Request, Acknowledge.

```
DORA EXCHANGE -- COMPLETE FLOW
================================================================

CLIENT                                    SERVER(S)
  |                                          |
  |--[ DHCPDISCOVER ]----- broadcast ------->|
  |  src: 0.0.0.0:68                         |
  |  dst: 255.255.255.255:67                 |
  |  op=1, xid=random, ciaddr=0.0.0.0       |
  |  option 53 = 1 (DISCOVER)               |
  |  option 55 = [1,3,6,15,28,51...]         |  (parameter request list)
  |                                          |
  |<-[ DHCPOFFER ]--- unicast or bcast ------|
  |  op=2, xid=same                          |
  |  yiaddr = 192.168.1.100 (offered IP)     |
  |  option 53 = 2 (OFFER)                   |
  |  option 54 = server IP (server ID)       |
  |  option 51 = 86400 (lease time, 24h)     |
  |  option 1 = 255.255.255.0 (subnet mask)  |
  |  option 3 = 192.168.1.1 (router)         |
  |  option 6 = DNS server(s)                |
  |                                          |
  |--[ DHCPREQUEST ]------ broadcast ------->|
  |  op=1, xid=same, ciaddr=0.0.0.0         |
  |  option 53 = 3 (REQUEST)                 |
  |  option 54 = selected server ID          |
  |  option 50 = 192.168.1.100 (requested)   |
  |                                          |
  |<-[ DHCPACK ]---- unicast or bcast -------|
  |  op=2, xid=same                          |
  |  yiaddr = 192.168.1.100 (confirmed)      |
  |  All final configuration parameters      |
  |  option 58 = T1 (renewal timer)          |
  |  option 59 = T2 (rebinding timer)        |
  |                                          |
  [CLIENT NOW ENTERS BOUND STATE]
```

The REQUEST is still broadcast even though the client has selected a specific server. This is intentional: by broadcasting the REQUEST with the selected server's identifier in option 54, the client implicitly declines all other offers. Servers that see a REQUEST with another server's ID in option 54 know their offer was not selected and can return the offered address to their pool [1].

---

## 11. Transport Rules: UDP Ports, Broadcast, and Unicast

DHCP uses UDP port 67 (server) and UDP port 68 (client). These port numbers are shared with BOOTP for backward compatibility [1].

**Client-to-server messages during initial acquisition:**
- Source: 0.0.0.0:68 (client has no configured address)
- Destination: 255.255.255.255:67 (limited broadcast, does not cross routers)

**Server-to-client replies:**
- If the broadcast flag (bit 0 of the `flags` field) is set, the server must broadcast its reply
- If the broadcast flag is clear, the server may unicast to `yiaddr` using the MAC address in `chaddr`
- If `giaddr` is non-zero (relay agent present), the server unicasts to the relay agent on port 67

**Renewal messages (RENEWING state):**
- Unicast from client to original server's IP address (from option 54)
- Source: client's assigned IP:68, Destination: server's IP:67

**Rebinding messages (REBINDING state):**
- Broadcast (original server unreachable)
- Source: client's assigned IP:68, Destination: 255.255.255.255:67

The broadcast flag exists because some network implementations cannot receive unicast IP datagrams until the ARP table is populated. Older clients set this flag to ensure they receive the server's response; modern implementations typically leave it clear [1].

---

## 12. Minimum Packet Size and Padding

RFC 2131 requires that DHCP messages be at least 300 bytes long (the BOOTP minimum), and RFC 1122 requires IP hosts to accept datagrams of at least 576 bytes. DHCP implementations typically pad messages to 300 bytes at minimum, with many padding to 548 bytes (576 minus IP and UDP headers) for maximum compatibility [1][3].

Option 57 (Maximum DHCP Message Size) allows clients to advertise their willingness to accept larger messages. The minimum value for option 57 is 576 bytes. Without this option, servers must limit their responses to 576 bytes total (including IP and UDP headers), constraining the options that can be included [10].

For networks requiring large option payloads (enterprise environments with many configuration parameters), option 57 values of 1500 bytes (Ethernet MTU minus headers) are common.

---

## 13. Relay Agent Processing

In networks with multiple subnets, clients and DHCP servers are often on different broadcast domains. DHCP relay agents (also called BOOTP relay agents, configured on routers) bridge this gap [1].

When a relay agent receives a DHCPDISCOVER or DHCPREQUEST broadcast on a local interface:

1. It fills `giaddr` with the IP address of the interface on which the message was received
2. It increments the `hops` field by 1
3. It forwards the message as a unicast UDP packet to the configured DHCP server on port 67
4. When the server responds, the relay agent forwards the response back to the client

The `giaddr` value is critical for address pool selection. A server managing pools for multiple subnets examines `giaddr` to determine which pool to allocate from. Without `giaddr`, the server would have no way to know which subnet the client is on, since the client's source address is 0.0.0.0 [1].

Option 82 (Relay Agent Information, RFC 3046) extends relay agent functionality by allowing the relay to append sub-options identifying the circuit and remote endpoint. This enables per-port or per-subscriber address assignment in ISP access networks [11].

---

## 14. Cross-References

> **Related:** [Options Catalog](02-options-catalog.md) -- complete TLV option encoding that populates the options field described here. [Lease Lifecycle](03-lease-lifecycle-and-state-machine.md) -- the state machine that governs when each message type is sent and which fields are filled. [Security Architecture](04-security-and-attack-surface.md) -- how unauthenticated fields create the attack surface.

**Series cross-references:**
- **DNS (DNS Protocol):** DHCP option 6 delivers DNS server addresses; DNS dynamic update (RFC 2136) registers DHCP-assigned hostnames
- **SYS (Systems Admin):** DHCP server administration, pool management, lease monitoring
- **K8S (Kubernetes):** Container networking relies on DHCP or equivalent for pod IP assignment in bridge-mode networks
- **WPH (Weekly Phone):** Mobile device DHCP interactions on Wi-Fi join
- **MCF (Multi-Cluster Fed.):** Multi-site DHCP relay architectures for federated infrastructure
- **CMH (Comp. Mesh):** Mesh node bootstrap depends on DHCP for initial address acquisition
- **TCP (implied):** DHCP configures the parameters that TCP/IP requires to operate

---

## 15. Sources

1. Droms, R. "Dynamic Host Configuration Protocol." RFC 2131, IETF Standards Track, March 1997. Retrieved from rfc-editor.org.
2. Croft, W.J. and Gilmore, J. "Bootstrap Protocol (BOOTP)." RFC 951, September 1985. Retrieved from rfc-editor.org.
3. Braden, R., Ed. "Requirements for Internet Hosts -- Communication Layers." RFC 1122, IETF Standards Track, October 1989. Retrieved from rfc-editor.org.
4. IANA. "Address Resolution Protocol (ARP) Parameters." Registry updated 2025. Retrieved from iana.org/assignments/arp-parameters.
5. Droms, R. "Dynamic Host Configuration Protocol." RFC 1531, IETF Standards Track, October 1993. Retrieved from rfc-editor.org.
6. Abdulghaffar, A. et al. "An Analysis of DHCP Vulnerabilities, Attacks, and Countermeasures." IEEE, 2023. Retrieved from infotheory.ca.
7. Microsoft. "DHCP siaddr vs. Server Identifier (Option 54) Behavior." TechNet Documentation, 2019.
8. Cisco Systems. "DHCP Snooping Design Guide." Configuration Guide, IOS XE, 2024.
9. IEEE. "IEEE 802 Numbers." Standards Association, updated 2025.
10. Alexander, S. and Droms, R. "DHCP Options and BOOTP Vendor Extensions." RFC 2132, IETF Standards Track, March 1997. Retrieved from rfc-editor.org.
11. Patrick, M. "DHCP Relay Agent Information Option." RFC 3046, IETF Standards Track, January 2001. Retrieved from rfc-editor.org.
12. Wimer, W. "Clarifications and Extensions for the Bootstrap Protocol." RFC 1542, October 1993. Retrieved from rfc-editor.org.
13. Postel, J. "User Datagram Protocol." RFC 768, August 1980. Retrieved from rfc-editor.org.
14. IANA. "BOOTP Vendor Extensions and DHCP Options." Registry updated 2026-02-02. Retrieved from iana.org/assignments/bootp-dhcp-parameters.
15. Plummer, D. "An Ethernet Address Resolution Protocol." RFC 826, November 1982. Retrieved from rfc-editor.org.
16. Stevens, W.R. *TCP/IP Illustrated, Volume 1: The Protocols*. Addison-Wesley, 1994. Chapter 16: BOOTP.

---

*DHCP Protocol -- Module 1: Wire Format and Message Types. The 236-byte conversation that gives every device its identity.*
