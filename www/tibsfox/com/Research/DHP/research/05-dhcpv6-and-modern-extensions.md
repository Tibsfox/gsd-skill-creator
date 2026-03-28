# DHCPv6 and Modern Extensions

> **Domain:** Network Protocols -- Internet Infrastructure Layer
> **Module:** 5 -- RFC 8415 Architecture, DUID Types, Identity Associations, SLAAC Coexistence, and DHCPv4/v6 Comparative Analysis
> **Through-line:** *DHCPv6 is not DHCPv4 ported to IPv6 -- it is a ground-up redesign that learned from twenty years of DHCPv4 deployment.* Different ports, different client identifiers, multicast instead of broadcast, prefix delegation as a first-class operation, and a 16-bit option space that will not run out in our lifetimes. The architectural divergence between the two protocols is a map of everything the Internet learned about address configuration between 1997 and 2018. Understanding both protocols side by side is essential for any dual-stack deployment.

---

## Table of Contents

1. [DHCPv6 Architecture Overview](#1-dhcpv6-architecture-overview)
2. [The SARR Exchange](#2-the-sarr-exchange)
3. [Transport and Addressing](#3-transport-and-addressing)
4. [DUID: DHCP Unique Identifier](#4-duid-dhcp-unique-identifier)
5. [Identity Associations: IA_NA, IA_TA, IA_PD](#5-identity-associations-ia_na-ia_ta-ia_pd)
6. [Stateful vs Stateless DHCPv6](#6-stateful-vs-stateless-dhcpv6)
7. [SLAAC and DHCPv6 Coexistence](#7-slaac-and-dhcpv6-coexistence)
8. [DHCPv6 Message Types](#8-dhcpv6-message-types)
9. [DHCPv6 Option Architecture](#9-dhcpv6-option-architecture)
10. [Prefix Delegation (IA_PD)](#10-prefix-delegation-ia_pd)
11. [Relay Agent Architecture](#11-relay-agent-architecture)
12. [DHCPv4 vs DHCPv6 Comparative Matrix](#12-dhcpv4-vs-dhcpv6-comparative-matrix)
13. [Security Considerations in DHCPv6](#13-security-considerations-in-dhcpv6)
14. [Cross-References](#14-cross-references)
15. [Sources](#15-sources)

---

## 1. DHCPv6 Architecture Overview

DHCPv6 is defined by RFC 8415 (November 2018), which consolidates and obsoletes seven previous RFCs: RFC 3315 (original DHCPv6, 2003), RFC 3633 (prefix delegation), RFC 3736 (stateless DHCPv6), RFC 4242, RFC 7083, RFC 7283, and RFC 7550 [1].

The protocol serves the same fundamental purpose as DHCPv4 -- automated host configuration -- but is architecturally distinct in nearly every detail. The key design changes reflect lessons learned from two decades of DHCPv4 deployment and the fundamentally different addressing architecture of IPv6 [1].

**Key architectural differences from DHCPv4:**
- **Multicast instead of broadcast:** DHCPv6 clients send to multicast groups, not broadcast addresses. This reduces unnecessary processing on non-server devices.
- **DUID instead of MAC:** Client identity is a DHCP Unique Identifier (DUID), which can persist across hardware changes, unlike the MAC-based `chaddr` of DHCPv4.
- **Multiple addresses per interface:** IPv6 interfaces routinely have multiple addresses (link-local, global, temporary). DHCPv6 handles this through Identity Associations (IAs) that can contain multiple address bindings.
- **Prefix delegation:** DHCPv6 can delegate entire IPv6 prefixes to requesting routers, enabling hierarchical address management. DHCPv4 has no equivalent.
- **Coexistence with SLAAC:** DHCPv6 is designed to work alongside Stateless Address Autoconfiguration (SLAAC), with Router Advertisements controlling which mechanism is used.

```
DHCPv6 PROTOCOL STACK
================================================================

  +-----------------------------+
  |     DHCPv6 Application      |
  |  SOLICIT/ADVERTISE/REQUEST  |
  |  /REPLY/RENEW/REBIND/etc.  |
  +-----------------------------+
  |          UDP                |
  |  Client: port 546           |
  |  Server: port 547           |
  +-----------------------------+
  |          IPv6               |
  |  Link-local source addr     |
  |  Multicast destination      |
  |    ff02::1:2 (link-local)   |
  |    ff05::1:3 (site-local)   |
  +-----------------------------+
```

---

## 2. The SARR Exchange

The normal DHCPv6 address acquisition is a four-message exchange: SOLICIT, ADVERTISE, REQUEST, REPLY (SARR) -- directly analogous to DHCPv4's DORA [1].

```
DHCPv6 SARR EXCHANGE -- STANDARD FLOW
================================================================

CLIENT                                    SERVER(S)
  |                                          |
  |--[ SOLICIT ]--- multicast ff02::1:2 --->|
  |  src: link-local addr                    |
  |  dst: ff02::1:2 (All_DHCP_Relay_Agents_and_Servers)
  |  UDP src:546, dst:547                    |
  |  Transaction ID = random 24-bit         |
  |  Client DUID                            |
  |  IA_NA (request non-temporary addr)      |
  |                                          |
  |<-[ ADVERTISE ]--- unicast --------------|
  |  Server DUID                             |
  |  Client DUID (echoed)                    |
  |  IA_NA with offered address + lifetime   |
  |  Preference option (0-255)               |
  |                                          |
  |--[ REQUEST ]---- multicast ff02::1:2 -->|
  |  Client DUID + Server DUID (selected)    |
  |  IA_NA with requested address            |
  |                                          |
  |<-[ REPLY ]------ unicast ---------------|
  |  Confirmed IA_NA with final lifetimes   |
  |  All requested configuration options     |
  |                                          |
  [CLIENT ADDRESS BINDING ACTIVE]


RAPID COMMIT (2-message exchange):

CLIENT                                    SERVER
  |                                          |
  |--[ SOLICIT + Rapid Commit option ]----->|
  |                                          |
  |<-[ REPLY + Rapid Commit option ]--------|
  |  Complete configuration in one round trip|
```

The Rapid Commit option (option 14) enables a two-message exchange when both client and server support it. The client includes the Rapid Commit option in SOLICIT, and the server responds directly with REPLY (skipping ADVERTISE and REQUEST). This halves the number of messages and is useful in environments where only one DHCPv6 server is present [1].

---

## 3. Transport and Addressing

DHCPv6 uses UDP on ports distinct from DHCPv4 [1]:

| Parameter | DHCPv4 | DHCPv6 |
|-----------|--------|--------|
| Client port | 68 | 546 |
| Server port | 67 | 547 |
| Discovery mechanism | Broadcast (255.255.255.255) | Multicast (ff02::1:2) |

**Multicast addresses used by DHCPv6:**

| Address | Scope | Name | Purpose |
|---------|-------|------|---------|
| ff02::1:2 | Link-local | All_DHCP_Relay_Agents_and_Servers | Client SOLICIT/REQUEST destination |
| ff05::1:3 | Site-local | All_DHCP_Servers | Relay agent forwards to all servers in site |

**Why multicast instead of broadcast:** IPv6 eliminated the broadcast address entirely. All "one-to-many" communication in IPv6 uses multicast with specific group addresses. This is more efficient because switches can use MLD (Multicast Listener Discovery) snooping to forward multicast only to ports with interested listeners, rather than flooding all ports as with broadcast [1].

**Link-local source addressing:** DHCPv6 clients always have a link-local address (fe80::/10) available without any configuration -- it is derived automatically from the interface identifier. This means the client can communicate with the DHCPv6 server without first obtaining a global address, eliminating the "src=0.0.0.0" workaround used in DHCPv4 [1].

---

## 4. DUID: DHCP Unique Identifier

DHCPv6 identifies clients and servers using DUIDs rather than MAC addresses. A DUID is a variable-length opaque identifier that persists across reboots and, in some types, across hardware changes [1].

| Type | Name | Construction | Use Case |
|------|------|-------------|----------|
| 1 | DUID-LLT | Link-layer address + time of first generation | Most common. Generated once, persisted. Hardware changes require new DUID. |
| 2 | DUID-EN | IANA Enterprise Number + vendor-defined identifier | Vendor-specific. Used by equipment with enterprise-registered identities. |
| 3 | DUID-LL | Link-layer address only | For devices without a stable clock (cannot generate DUID-LLT). |
| 4 | DUID-UUID | 128-bit UUID from firmware/platform (RFC 6355) | Used by UEFI firmware and virtual machines with platform-assigned UUIDs. |

**DUID-LLT (Type 1)** is the default recommended type. It is generated the first time the DHCPv6 client initializes, using the current time and the link-layer address of any interface on the device. Once generated, it is stored persistently and reused across reboots. The time component ensures uniqueness even if a replacement network card has the same MAC address as a previous device [1].

**DUID vs. chaddr:** DHCPv4's `chaddr` (client hardware address) ties the client identity to a specific network interface. If a device replaces its network card, it appears as a new client. DHCPv6's DUID is device-level, not interface-level, providing stable identity across hardware changes. This is particularly important for virtual machines that may migrate between hosts with different virtual NICs [1].

```
DUID FORMAT -- TYPE 1 (DUID-LLT)
================================================================

+------+------+------+------+------+------+------+------+-- ... --+
| Type (2B)   | HW Type(2B) | Time (4 bytes)            | LL addr |
| 0x0001      | 0x0001      | Seconds since 2000-01-01  | (var)   |
+------+------+------+------+------+------+------+------+-- ... --+

Example: Ethernet DUID-LLT generated at 2026-03-27T00:00:00Z
  Type: 0x0001
  HW Type: 0x0001 (Ethernet)
  Time: 0x31236E00 (seconds since 2000-01-01 00:00:00 UTC)
  Link-layer: 00:1A:2B:3C:4D:5E (6 bytes)
  Total DUID length: 14 bytes
```

---

## 5. Identity Associations: IA_NA, IA_TA, IA_PD

DHCPv6 uses Identity Associations (IAs) to manage address and prefix bindings. Each IA is identified by an IAID (a 32-bit value) and can contain multiple bindings [1].

**IA_NA (Non-Temporary Addresses):** The standard mechanism for assigning IPv6 global unicast addresses. Each IA_NA has T1 and T2 renewal/rebinding timers (analogous to DHCPv4). Multiple addresses can be bound within a single IA_NA. Used for all normal address assignment [1].

**IA_TA (Temporary Addresses):** Short-lived addresses for privacy (per RFC 4941, "Privacy Extensions for Stateless Address Autoconfiguration in IPv6"). IA_TA addresses are not renewed; when they expire, the client requests new temporary addresses. Used to prevent long-term tracking of devices by their IPv6 addresses [1][2].

**IA_PD (Prefix Delegation):** An entire IPv6 prefix (e.g., /48, /56, /60) is delegated to a requesting router, which then sub-allocates to its downstream networks. IA_PD is a first-class DHCPv6 feature with no DHCPv4 equivalent. It is the standard mechanism for ISP customer premise equipment (CPE) to receive their delegated address space [1].

```
IDENTITY ASSOCIATION TYPES
================================================================

IA_NA (Non-Temporary Address):
  Client requests: "Give me a global IPv6 address"
  Server assigns: 2001:db8::100/128 with lifetime
  T1/T2 timers govern renewal (same semantics as DHCPv4)

IA_TA (Temporary Address):
  Client requests: "Give me a privacy address"
  Server assigns: 2001:db8::a1b2:c3d4/128 with short lifetime
  No renewal -- client requests new temporary address when expired

IA_PD (Prefix Delegation):
  Router requests: "Give me a prefix to sub-allocate"
  Server delegates: 2001:db8:1234::/48
  Router creates: 2001:db8:1234:1::/64 for LAN 1
                  2001:db8:1234:2::/64 for LAN 2
                  2001:db8:1234:3::/64 for LAN 3
  T1/T2 timers govern prefix renewal
```

---

## 6. Stateful vs Stateless DHCPv6

DHCPv6 operates in two modes [1]:

**Stateful DHCPv6:** The server assigns addresses (IA_NA/IA_TA) and/or prefixes (IA_PD) and maintains state (lease bindings). This is the full equivalent of DHCPv4 dynamic allocation. The server tracks which addresses are assigned to which clients and manages lease expiry [1].

**Stateless DHCPv6 (Information-Request):** The client already has an IPv6 address (obtained via SLAAC) and only needs other configuration parameters -- typically DNS servers (option 23), domain search list (option 24), NTP servers, etc. The server does not assign addresses and maintains no per-client state. The client sends an INFORMATION-REQUEST message, and the server replies with the requested parameters [1].

Stateless DHCPv6 is common in enterprise deployments where SLAAC handles address assignment and DHCPv6 handles DNS configuration. This combination is simpler to deploy than full stateful DHCPv6 and avoids the need for a DHCPv6 lease database [1].

**Mode selection:** The Router Advertisement (RA) message from the network's router controls which mode clients use:
- RA with M flag set (Managed Address Configuration): Clients use stateful DHCPv6 for addresses
- RA with O flag set (Other Configuration): Clients use stateless DHCPv6 for non-address parameters
- RA with both M and O: Clients use stateful DHCPv6 for everything
- RA with neither: Clients use only SLAAC (no DHCPv6)

---

## 7. SLAAC and DHCPv6 Coexistence

Stateless Address Autoconfiguration (SLAAC, RFC 4862) and DHCPv6 are complementary mechanisms, not competitors. Their coexistence model is a key architectural difference from IPv4, where DHCP is the sole automated configuration mechanism [3].

**SLAAC provides:**
- Global IPv6 address (derived from prefix in Router Advertisement + interface identifier)
- Default gateway (from the router sending the RA)
- On-link prefix information

**SLAAC does NOT provide:**
- DNS server addresses (until RFC 8106 RDNSS, which adds DNS to RAs but has limited adoption)
- Domain search lists
- NTP servers
- Any other configuration parameter beyond basic addressing

**DHCPv6 fills the gap:** In SLAAC-only environments, DHCPv6 in stateless mode provides DNS and other parameters. The combination of SLAAC (for addresses and gateway) plus stateless DHCPv6 (for DNS) is the most common enterprise IPv6 deployment model [3].

```
COEXISTENCE MODELS
================================================================

Model 1: SLAAC Only (M=0, O=0)
  Address: SLAAC (prefix from RA + EUI-64 or random)
  Gateway: From RA
  DNS: From RA (RDNSS option, RFC 8106) if available
  Limitation: DNS delivery via RA has limited client support

Model 2: SLAAC + Stateless DHCPv6 (M=0, O=1)  [MOST COMMON]
  Address: SLAAC
  Gateway: From RA
  DNS: From DHCPv6 stateless (Information-Request)
  Best of both: simple addressing, reliable DNS delivery

Model 3: Stateful DHCPv6 Only (M=1, O=1)
  Address: From DHCPv6 (IA_NA)
  Gateway: From RA (still needed -- DHCPv6 does NOT assign gateways)
  DNS: From DHCPv6
  Note: DHCPv6 NEVER provides default gateway -- always from RA

Model 4: SLAAC + Stateful DHCPv6 (M=1, O=1, SLAAC also active)
  Address: Both SLAAC and DHCPv6 addresses on same interface
  Multiple addresses: normal in IPv6
  Used when both SLAAC privacy addresses and DHCPv6 stable addresses needed
```

**Critical note:** DHCPv6 does not provide a default gateway option. In all deployment models, the default gateway comes from Router Advertisements. This is a fundamental architectural difference from DHCPv4, where option 3 (Router) is one of the most important DHCP options [1].

---

## 8. DHCPv6 Message Types

DHCPv6 defines 13 message types, significantly more than DHCPv4's 8 [1]:

| Type | Name | Direction | Purpose |
|------|------|-----------|---------|
| 1 | SOLICIT | Client to server | Locate DHCPv6 servers (equivalent to DHCPv4 DISCOVER) |
| 2 | ADVERTISE | Server to client | Response to SOLICIT (equivalent to DHCPv4 OFFER) |
| 3 | REQUEST | Client to server | Request addresses/prefixes from specific server |
| 4 | CONFIRM | Client to server | Verify address still appropriate for current link after reconnect |
| 5 | RENEW | Client to server | Extend lifetimes with the same server (equivalent to DHCPv4 RENEWING) |
| 6 | REBIND | Client to server | Extend lifetimes with any server (equivalent to DHCPv4 REBINDING) |
| 7 | REPLY | Server to client | Response to REQUEST, CONFIRM, RENEW, REBIND, RELEASE, DECLINE |
| 8 | RELEASE | Client to server | Voluntarily relinquish address/prefix |
| 9 | DECLINE | Client to server | Report assigned address is already in use |
| 10 | RECONFIGURE | Server to client | **Server-initiated.** Tells client to re-request configuration. No DHCPv4 equivalent. |
| 11 | INFORMATION-REQUEST | Client to server | Request configuration parameters only (stateless mode) |
| 12 | RELAY-FORW | Relay to server | Relay agent forwards client message to server |
| 13 | RELAY-REPL | Server to relay | Server sends reply via relay agent to client |

The RECONFIGURE message (type 10) is unique to DHCPv6. It allows a server to push configuration changes to clients without waiting for lease renewal. The client that receives RECONFIGURE must then send a RENEW, REBIND, or INFORMATION-REQUEST to get the updated parameters. RECONFIGURE requires authentication (Reconfigure Key, option 136) to prevent abuse [1].

---

## 9. DHCPv6 Option Architecture

DHCPv6 options use a **16-bit** code space (0-65535), compared to DHCPv4's 8-bit space (0-255). Each option has a 2-byte code and a 2-byte length, followed by variable-length data [1].

```
DHCPv6 OPTION FORMAT
================================================================

+------+------+------+------+------+-- ... --+------+
| Option Code (2 bytes)     | Length (2 bytes)       |
+------+------+------+------+------+-- ... --+------+
| Option Data (Length bytes)                          |
+------+------+------+------+------+-- ... --+------+

Compared to DHCPv4:
  DHCPv4: 1-byte code + 1-byte length = 256 codes, 255-byte max data
  DHCPv6: 2-byte code + 2-byte length = 65536 codes, 65535-byte max data
```

**Key DHCPv6 options:**

| Code | Name | Purpose |
|------|------|---------|
| 1 | Client Identifier | Client's DUID |
| 2 | Server Identifier | Server's DUID |
| 3 | IA_NA | Non-temporary address Identity Association |
| 4 | IA_TA | Temporary address Identity Association |
| 5 | IA Address | Individual address within an IA |
| 6 | Option Request (ORO) | Client's list of requested options (equivalent to DHCPv4 option 55) |
| 7 | Preference | Server preference value (0-255); client prefers higher values |
| 13 | Status Code | Success/failure indication with human-readable message |
| 14 | Rapid Commit | Enables 2-message exchange |
| 23 | DNS Recursive Name Server | DNS server addresses (equivalent to DHCPv4 option 6) |
| 24 | Domain Search List | DNS search domains (equivalent to DHCPv4 option 119) |
| 25 | IA_PD | Prefix Delegation Identity Association |
| 26 | IA Prefix | Individual prefix within an IA_PD |
| 136 | Reconfigure Accept | Client indicates willingness to accept RECONFIGURE |

---

## 10. Prefix Delegation (IA_PD)

Prefix delegation is DHCPv6's most significant feature addition over DHCPv4. It allows a requesting router (typically a customer premises equipment device) to receive an entire IPv6 prefix from the DHCPv6 server, which it then sub-allocates to its downstream networks [1].

**Typical ISP deployment:**
1. ISP assigns /48 to customer site via DHCPv6 IA_PD
2. Customer CPE router receives the /48
3. CPE creates /64 subnets for each LAN segment from the delegated /48
4. End devices on each LAN use SLAAC with the /64 prefix from the CPE's Router Advertisements

```
PREFIX DELEGATION -- ISP TO CUSTOMER
================================================================

ISP DHCPv6 Server
  |
  | Delegates: 2001:db8:abcd::/48
  v
Customer CPE Router (DHCPv6-PD client)
  |
  |-- LAN 1: 2001:db8:abcd:0001::/64 (RA to end devices)
  |-- LAN 2: 2001:db8:abcd:0002::/64 (RA to end devices)
  |-- LAN 3: 2001:db8:abcd:0003::/64 (RA to end devices)
  |-- WiFi:  2001:db8:abcd:0100::/64 (RA to end devices)
  |-- IoT:   2001:db8:abcd:0200::/64 (RA to end devices)
  |
  | Available subnets: 65,536 /64s from a single /48 delegation
```

**Prefix lifetimes:** Delegated prefixes have preferred and valid lifetimes, like individual addresses. The CPE must renew the delegation before the preferred lifetime expires. If the prefix changes (ISP reassigns), the CPE must update all downstream RAs with the new prefix [1].

**Cascading delegation:** A router that receives a prefix can further sub-delegate to downstream routers. A CPE with a /48 can delegate /56s to building routers, which delegate /64s to floor switches. This hierarchical model scales to campus and enterprise deployments [1].

---

## 11. Relay Agent Architecture

DHCPv6 relay agents operate differently from DHCPv4 relay agents [1]:

**DHCPv4 relay:** Modifies the original DHCP packet by setting `giaddr` and incrementing `hops`. The server sees a modified version of the client's packet.

**DHCPv6 relay:** Encapsulates the entire client message inside a RELAY-FORW (Relay-Forward, type 12) message. The original client message is preserved intact in a Relay Message option (option 9). The relay adds its own addressing information (link-address, peer-address) as fields in the RELAY-FORW header. Servers respond with RELAY-REPL (Relay-Reply, type 13), which the relay unwraps and forwards to the client [1].

This encapsulation approach is cleaner than DHCPv4's field modification: the original client message is never altered, and multiple relay hops produce nested RELAY-FORW messages that can be unwrapped in order [1].

```
DHCPv6 RELAY ENCAPSULATION
================================================================

Client SOLICIT message:
  [SOLICIT | Client DUID | IA_NA | options...]

Relay agent wraps it:
  [RELAY-FORW | hop-count=1 | link-addr | peer-addr |
    Option 9 (Relay Message):
      [SOLICIT | Client DUID | IA_NA | options...]
  ]

Server unwraps, processes, responds:
  [RELAY-REPL | hop-count=1 |
    Option 9 (Relay Message):
      [REPLY | Server DUID | Client DUID | IA_NA | options...]
  ]

Relay agent unwraps, forwards REPLY to client.
```

---

## 12. DHCPv4 vs DHCPv6 Comparative Matrix

| Feature | DHCPv4 (RFC 2131) | DHCPv6 (RFC 8415) |
|---------|-------------------|-------------------|
| Transport | UDP ports 67/68 | UDP ports 546/547 |
| Discovery | Broadcast (255.255.255.255) | Multicast (ff02::1:2) |
| Client identity | MAC address in chaddr (16 bytes) | DUID (variable length, device-level) |
| Exchange | DORA (4 messages) | SARR (4 messages) or Rapid Commit (2 messages) |
| Address types | Single IP per lease | IA_NA (non-temporary), IA_TA (temporary) |
| Prefix delegation | Not supported | IA_PD, first-class feature |
| Option code space | 8-bit (0-255) | 16-bit (0-65535) |
| Option header | 1B code + 1B length | 2B code + 2B length |
| Stateless mode | DHCPINFORM only | Full stateless mode (INFORMATION-REQUEST) |
| Auto-config complement | No equivalent | Coexists with SLAAC |
| Default gateway | Option 3 (Router) | NOT provided; always from Router Advertisements |
| Relay agent mechanism | giaddr field modification | RELAY-FORW/RELAY-REPL encapsulation |
| Server reconfigure | Not supported | RECONFIGURE message (type 10) |
| Confirm on reconnect | Not supported | CONFIRM message (type 4) |
| Authentication | RFC 3118 (rare) | Reconfigure Key (option 136); same fundamental challenges |
| Message types | 8 | 13 |
| Minimum packet size | 576 bytes (RFC 1122) | No minimum specified; UDP+IPv6 headers sufficient |
| Bootstrap address | 0.0.0.0 (no source address) | Link-local address (always available) |

---

## 13. Security Considerations in DHCPv6

DHCPv6 faces similar security challenges as DHCPv4, with some differences [1][4]:

**Rogue server attacks:** Still possible. Any device on the link-local scope can respond to SOLICIT messages. DHCPv6 Guard (equivalent to DHCP snooping) is the primary defense, filtering unauthorized ADVERTISE and REPLY messages at the switch [4].

**Starvation attacks:** Harder to execute because DHCPv6 uses DUIDs rather than MAC addresses for client identification. However, an attacker generating random DUIDs can still exhaust the server's address pool. The 128-bit IPv6 address space makes pool exhaustion less impactful in many scenarios (a /64 has 2^64 addresses) [4].

**RECONFIGURE abuse:** The RECONFIGURE message could be forged to disrupt client configurations. RFC 8415 addresses this with the Reconfigure Key (option 136), which authenticates RECONFIGURE messages. Unlike RFC 3118, this is limited to a single message type and is more practical to deploy [1].

**RA Guard:** Router Advertisement Guard (RA Guard) prevents rogue Router Advertisements, which could be used to redirect clients to a malicious DHCPv6 server by setting the M and O flags. RA Guard is deployed at the switch level, similar to DHCP snooping [4].

**Secure DHCPv6 (RFC 3315bis):** RFC 8415 includes improved security considerations over the original RFC 3315, but the fundamental challenge remains: authenticating DHCP messages at scale requires key distribution that is itself a bootstrapping problem [1].

---

## 14. Cross-References

> **Related:** [Wire Format](01-wire-format-and-message-types.md) -- DHCPv4 packet structure for side-by-side comparison. [Options Catalog](02-options-catalog.md) -- DHCPv4's 8-bit option space that DHCPv6 expanded to 16-bit. [Lease Lifecycle](03-lease-lifecycle-and-state-machine.md) -- timer semantics shared between DHCPv4 and DHCPv6 IA_NA. [Security Architecture](04-security-and-attack-surface.md) -- defense mechanisms that apply to both protocol versions.

**Series cross-references:**
- **DNS (DNS Protocol):** DHCPv6 option 23 provides DNS servers; RDNSS in Router Advertisements is an alternative
- **SYS (Systems Admin):** Dual-stack DHCP server management, DHCPv6 prefix delegation monitoring
- **K8S (Kubernetes):** IPv6 pod networking, dual-stack service configuration
- **CMH (Comp. Mesh):** IPv6 mesh addressing, prefix delegation for mesh subnets
- **MCF (Multi-Cluster Fed.):** Cross-site IPv6 prefix management via federated DHCPv6-PD
- **TCP (implied):** IPv6 addressing configured by DHCPv6 underlies all TCP connections

---

## 15. Sources

1. Mrugalski, T. et al. "Dynamic Host Configuration Protocol for IPv6 (DHCPv6)." RFC 8415, IETF Standards Track, November 2018. Retrieved from datatracker.ietf.org.
2. Narten, T., Draves, R. and Krishnan, S. "Privacy Extensions for Stateless Address Autoconfiguration in IPv6." RFC 4941, IETF Standards Track, September 2007. Retrieved from rfc-editor.org.
3. Thomson, S., Narten, T. and Jinmei, T. "IPv6 Stateless Address Autoconfiguration." RFC 4862, IETF Standards Track, September 2007. Retrieved from rfc-editor.org.
4. Cisco Systems. "IPv6 First-Hop Security Configuration Guide." IOS XE, 2024.
5. Droms, R. "Dynamic Host Configuration Protocol." RFC 2131, IETF Standards Track, March 1997. Retrieved from rfc-editor.org.
6. Infoblox IPv6 CoE. "DHCP and DHCPv6: Options Differences." Technical comparison, July 2024.
7. Hinden, R. and Deering, S. "IP Version 6 Addressing Architecture." RFC 4291, IETF Standards Track, February 2006. Retrieved from rfc-editor.org.
8. Jeong, J. et al. "IPv6 Router Advertisement Options for DNS Configuration." RFC 8106, IETF Standards Track, March 2017. Retrieved from rfc-editor.org.
9. Troan, O. and Droms, R. "IPv6 Prefix Options for Dynamic Host Configuration Protocol (DHCP) version 6." RFC 3633, IETF Standards Track, December 2003. Retrieved from rfc-editor.org.
10. Droms, R. "Stateless Dynamic Host Configuration Protocol (DHCP) Service for IPv6." RFC 3736, IETF Standards Track, April 2004. Retrieved from rfc-editor.org.
11. Wikipedia. "DHCPv6." Updated March 2026. Secondary reference for architecture overview.
12. Internet Systems Consortium. "Kea DHCP Server -- DHCPv6 Guide." Version 2.6, 2025. Retrieved from isc.org.
13. IANA. "Dynamic Host Configuration Protocol for IPv6 (DHCPv6) Parameters." Registry. Retrieved from iana.org/assignments/dhcpv6-parameters.
14. Narten, T. et al. "Neighbor Discovery for IP version 6 (IPv6)." RFC 4861, IETF Standards Track, September 2007. Retrieved from rfc-editor.org.
15. Stenberg, M. "IPv6 Home Networking Architecture Principles." RFC 7368, IETF Informational, October 2014. Retrieved from rfc-editor.org.
16. Abdulghaffar, A. et al. "An Analysis of DHCP Vulnerabilities, Attacks, and Countermeasures." IEEE, 2023. Retrieved from infotheory.ca.

---

*DHCP Protocol -- Module 5: DHCPv6 and Modern Extensions. Twenty years of learning, encoded in a protocol that replaced broadcast with multicast, MAC with DUID, and single addresses with prefix delegation.*
