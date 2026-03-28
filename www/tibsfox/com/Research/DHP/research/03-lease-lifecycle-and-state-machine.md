# Lease Lifecycle and State Machine

> **Domain:** Network Protocols -- Internet Infrastructure Layer
> **Module:** 3 -- Address Allocation, Client State Machine, Timer Semantics, and Retransmission
> **Through-line:** *A DHCP lease is provisional trust with a timer.* The client borrows an identity from the server, and that identity expires unless renewed. The state machine that governs this lifecycle -- INIT through BOUND through RENEWING through REBINDING and potentially back to INIT -- is a study in graceful degradation. Each state transition represents a change in the client's relationship to the network: from stranger, to offered guest, to confirmed participant, to worried tenant, to desperate broadcaster, to evicted and starting over.

---

## Table of Contents

1. [Address Allocation Mechanisms](#1-address-allocation-mechanisms)
2. [The Client State Machine](#2-the-client-state-machine)
3. [INIT State: The Beginning](#3-init-state-the-beginning)
4. [SELECTING State: Evaluating Offers](#4-selecting-state-evaluating-offers)
5. [REQUESTING State: Confirming the Choice](#5-requesting-state-confirming-the-choice)
6. [BOUND State: Normal Operation](#6-bound-state-normal-operation)
7. [RENEWING State: The T1 Timer](#7-renewing-state-the-t1-timer)
8. [REBINDING State: The T2 Timer](#8-rebinding-state-the-t2-timer)
9. [INIT-REBOOT and REBOOTING States](#9-init-reboot-and-rebooting-states)
10. [Timer Semantics: T1, T2, and Lease Expiry](#10-timer-semantics-t1-t2-and-lease-expiry)
11. [Retransmission Algorithms](#11-retransmission-algorithms)
12. [ARP Conflict Detection](#12-arp-conflict-detection)
13. [Lease Release and Decline](#13-lease-release-and-decline)
14. [Server-Side Lease Management](#14-server-side-lease-management)
15. [Cross-References](#15-cross-references)
16. [Sources](#16-sources)

---

## 1. Address Allocation Mechanisms

RFC 2131 defines three mechanisms for IP address allocation [1]:

**Automatic Allocation:** The DHCP server assigns a permanent IP address to the client. The lease time is effectively infinite (option 51 = 0xFFFFFFFF). The address is never reclaimed unless the client explicitly releases it or the administrator intervenes. Useful for servers and infrastructure devices that need stable addresses without manual configuration.

**Dynamic Allocation:** The server assigns an IP address for a limited time period (the lease). When the lease expires, the address returns to the available pool and may be reassigned to a different client. This is the most common mechanism, enabling address reuse in networks where the client population exceeds the available address space. A /24 network (254 usable addresses) can serve thousands of transient devices through dynamic allocation with appropriate lease times [1].

**Manual Allocation (Static Mapping):** An administrator configures a specific IP address for a specific client identifier (usually MAC address). The DHCP server communicates this pre-assigned address to the client through the normal DORA exchange. From the client's perspective, the process is identical to dynamic allocation. The server simply consults a static mapping table instead of an available pool [1].

```
ALLOCATION MECHANISM COMPARISON
================================================================

Mechanism     | Lease Duration  | Address Reuse | Use Case
--------------+-----------------+---------------+-------------------
Automatic     | Infinite        | No            | Stable devices
Dynamic       | Time-limited    | Yes           | General clients
Manual        | Configured      | No (reserved) | Specific devices
```

Most enterprise deployments use dynamic allocation as the default, with manual allocation (reservations) for servers, printers, and infrastructure devices that other systems reference by IP address.

---

## 2. The Client State Machine

The DHCP client state machine has eight defined states. Transitions between states are triggered by message receipt, timer expiry, or user action. The state machine is defined in RFC 2131 Section 4.4 [1].

```
DHCP CLIENT STATE MACHINE -- COMPLETE
================================================================

                 +--------+
   Power on ---->|  INIT  |<----------+----------+
                 +---+----+           |          |
                     |                |          |
           Send DHCPDISCOVER          |          |
           (broadcast)                |          |
                     v                |          |
                +-----------+         |          |
                | SELECTING |         |          |
                +-----+-----+         |          |
                      |               |          |
            Select offer              |          |
            Send DHCPREQUEST          |          |
            (broadcast)               |          |
                      v               |          |
                +------------+        |          |
                | REQUESTING |        |          |
                +-----+------+        |          |
                      |               |          |
             DHCPACK + ARP OK         |          |
                      v               |          |
                  +-------+           |          |
      +---------->| BOUND |           |          |
      |           +---+---+           |          |
      |               |               |          |
      |          T1 fires              |          |
      |               v               |          |
      |          +----------+          |          |
      |   ACK--->| RENEWING |  NAK---->+          |
      |          +----+-----+                     |
      |               |                           |
      |          T2 fires                         |
      |               v                           |
      |          +-----------+                    |
      +---ACK----| REBINDING |  NAK/Expire------->+
                 +-----------+


  REBOOT PATH (separate from main flow):

                 +-------------+
   Reboot with-->| INIT-REBOOT |
   saved addr    +------+------+
                        |
              Send DHCPREQUEST
              (broadcast, option 50 = old IP)
                        v
                 +----------+
                 | REBOOTING|---ACK---> BOUND
                 +----+-----+
                      |
                    NAK-------> INIT
```

Each state has defined entry conditions, allowed messages, and exit transitions. The machine is entirely deterministic given the same inputs [1].

---

## 3. INIT State: The Beginning

The INIT state is the starting point for all new DHCP clients and for clients whose leases have expired without renewal. In INIT, the client has no configured IP address [1].

**Actions in INIT:**
1. Client sets `ciaddr` to 0.0.0.0
2. Client generates a random `xid`
3. Client sends DHCPDISCOVER as a broadcast (src 0.0.0.0:68, dst 255.255.255.255:67)
4. Client may include option 50 (Requested IP Address) if it has a preferred address
5. Client includes option 55 (Parameter Request List) with desired configuration parameters

**Retransmission in INIT:** If no DHCPOFFER is received, the client retransmits DHCPDISCOVER with exponential backoff: initial delay randomized around 1 second (per RFC 2131: base 4 seconds with random factor, though most implementations use shorter intervals), doubling each retry (2, 4, 8, 16, 32 seconds, capped at 64 seconds). The client should attempt at least four retransmissions before giving up or entering a dormant state [1][2].

**Transition:** Receipt of one or more DHCPOFFERs triggers transition to SELECTING.

---

## 4. SELECTING State: Evaluating Offers

In the SELECTING state, the client collects DHCPOFFER messages from one or more servers and chooses the best one [1].

**Selection Criteria:**
- The client waits a short period (typically 1-2 seconds) to collect multiple offers
- If the client has a preferred address (from a previous lease), it prefers offers containing that address
- The client may evaluate offers based on lease time, included options, or implementation-specific criteria
- In practice, most clients accept the first offer received

**Actions after selection:**
1. Client sends DHCPREQUEST as a broadcast
2. The REQUEST includes option 54 (Server Identifier) naming the selected server
3. The REQUEST includes option 50 (Requested IP Address) with the offered address
4. Because the REQUEST is broadcast, all servers see it -- servers not selected know to release their offered address

**Transition:** Sending the DHCPREQUEST moves the client to REQUESTING.

---

## 5. REQUESTING State: Confirming the Choice

In REQUESTING, the client has sent a DHCPREQUEST and awaits the server's response [1].

**Possible responses:**

**DHCPACK:** The server confirms the lease. The client records all parameters (IP address, subnet mask, gateway, DNS servers, lease time, T1, T2). The client should perform an ARP probe for the assigned address before using it. Transition to BOUND.

**DHCPNAK:** The server rejects the request (address no longer available, wrong subnet, etc.). The client must abandon the address and restart from INIT.

**No response:** The client retransmits the DHCPREQUEST. After several failed attempts (implementation-dependent, typically 4-5), the client returns to INIT and restarts with DHCPDISCOVER.

**ARP conflict:** If the ARP probe reveals the assigned address is already in use, the client sends a DHCPDECLINE to the server and returns to INIT. The server marks the conflicting address as unavailable [1].

---

## 6. BOUND State: Normal Operation

BOUND is the steady state. The client has a confirmed IP address and all configuration parameters. Normal IP communication proceeds [1].

**Active timers in BOUND:**
- T1 (Renewal Timer): Typically 50% of lease duration
- T2 (Rebinding Timer): Typically 87.5% of lease duration
- Lease expiry: 100% of lease duration

The client operates normally until T1 fires, then transitions to RENEWING.

**Key principle:** The client must not use the assigned address after the lease expires. If neither renewal nor rebinding succeeds before lease expiry, the client must deconfigure the address and return to INIT [1].

---

## 7. RENEWING State: The T1 Timer

When T1 fires (at 50% of the lease duration by default), the client enters RENEWING and attempts to extend its lease with the original server [1].

**Actions in RENEWING:**
1. Client sends DHCPREQUEST as a **unicast** to the original DHCP server (identified by option 54 from the original ACK)
2. The `ciaddr` field contains the client's current IP address (the client is in BOUND, so it has one)
3. The client does NOT include option 54 (Server Identifier) or option 50 (Requested IP) in renewal requests

**Responses:**

**DHCPACK:** Lease renewed. Client resets T1 and T2 from the new lease start time. Returns to BOUND.

**DHCPNAK:** Server explicitly refuses renewal. Client must deconfigure address and return to INIT.

**No response:** Client retransmits with linear backoff until T2 fires. When T2 fires, transition to REBINDING.

The unicast renewal is a key optimization: it generates no broadcast traffic and requires no relay agent involvement, reducing network load during routine lease maintenance [1].

---

## 8. REBINDING State: The T2 Timer

When T2 fires (at 87.5% of the lease duration by default), the original server has not responded to renewal attempts. The client enters REBINDING and broadcasts to any available server [1].

**Actions in REBINDING:**
1. Client sends DHCPREQUEST as a **broadcast** (src: client IP:68, dst: 255.255.255.255:67)
2. `ciaddr` contains the client's current IP address
3. Any DHCP server on the network may respond

**Responses:**

**DHCPACK (from any server):** Lease renewed under the responding server. Client resets all timers and returns to BOUND. The responding server becomes the new "original server" for future renewals.

**DHCPNAK:** Client deconfigures and returns to INIT.

**No response (lease expires):** The client must immediately deconfigure the IP address, cease all IP communication, and return to INIT. The lease has expired; the address may be reassigned to another client [1].

```
LEASE TIMELINE -- NORMAL LIFECYCLE
================================================================

Lease Start                                         Lease End
    |                                                    |
    |---- T1 (50%) ----|---- T2 (87.5%) ----|--- Exp ---|
    |                   |                    |           |
    |    BOUND          |    RENEWING        | REBINDING |
    |    (normal)       |    (unicast        | (broadcast|
    |                   |     to server)     |  to any)  |
    |                   |                    |           |

Example: 24-hour lease (86400 seconds)
  T1 fires at: 12 hours (43200s)
  T2 fires at: 21 hours (75600s)
  Lease expires at: 24 hours (86400s)
  Renewal window: 12 hours of unicast attempts
  Rebinding window: 3 hours of broadcast attempts
```

---

## 9. INIT-REBOOT and REBOOTING States

When a client reboots (power cycle or OS restart) with a previously assigned address stored in persistent configuration, it can skip the full DORA exchange and attempt to reclaim its old address directly [1].

**INIT-REBOOT actions:**
1. Client sends DHCPREQUEST as a **broadcast**
2. Option 50 (Requested IP Address) contains the previously assigned address
3. `ciaddr` is 0.0.0.0 (the client is not yet authorized to use the address)
4. No option 54 (Server Identifier) -- the client may not remember which server assigned the lease

**Transition to REBOOTING:** After sending the request, the client enters REBOOTING and waits.

**Responses in REBOOTING:**

**DHCPACK:** The server confirms the old address is still valid. Client enters BOUND with refreshed parameters.

**DHCPNAK:** The old address is no longer valid (client moved to a different subnet, lease expired, address reassigned). Client must return to INIT and perform full DORA.

**No response:** If no server responds (all original servers unreachable), the client may continue using the address for a limited time (implementation-dependent) or return to INIT. RFC 2131 recommends that clients return to INIT after a reasonable timeout [1].

This fast-path reboot optimization reduces DHCP traffic and accelerates network reconnection after planned reboots or brief power interruptions.

---

## 10. Timer Semantics: T1, T2, and Lease Expiry

The three lease timers form a cascading fallback mechanism [1]:

| Timer | Default | Option Code | State Entered | Communication Mode |
|-------|---------|-------------|---------------|-------------------|
| T1 (Renewal) | 50% of lease | Option 58 | RENEWING | Unicast to original server |
| T2 (Rebinding) | 87.5% of lease | Option 59 | REBINDING | Broadcast to any server |
| Lease Expiry | 100% of lease | Option 51 | INIT | Address deconfigured |

**Default calculation (RFC 2131, Section 4.4.5):**
- T1 = 0.5 * lease_time
- T2 = 0.875 * lease_time (7/8)

These defaults apply when the server omits options 58 and 59. Servers may override defaults by including these options with custom values, subject to the constraint: T1 < T2 < lease_time [1].

**Timer reset on renewal:** When the client receives a DHCPACK in RENEWING or REBINDING, both T1 and T2 reset relative to the new lease start time. The new lease duration may differ from the original if the server chooses to offer a different lease time [1].

**Jitter:** RFC 2131 recommends randomizing timer values slightly to prevent synchronized renewal storms. If many clients received leases at the same time (e.g., after a server restart), their T1 timers would all fire simultaneously. Adding a small random offset (e.g., +/- 1% of lease time) distributes renewal traffic [1].

**Infinite lease (option 51 = 0xFFFFFFFF):** When the lease time is set to the maximum 32-bit value, it is interpreted as infinite. No timers are set, and the client remains in BOUND indefinitely. The address is never automatically reclaimed [1].

---

## 11. Retransmission Algorithms

Different states use different retransmission strategies [1][2]:

**INIT (DHCPDISCOVER retransmission):**
- First retransmission: random delay between 0 and 4 seconds (implementations vary; some use 1s)
- Subsequent retransmissions: exponential backoff doubling each time
- Sequence: ~1s, 2s, 4s, 8s, 16s, 32s (capped at 64 seconds)
- Total attempts: implementation-dependent, typically 4-5

**SELECTING (waiting for DHCPOFFER):**
- Client typically waits 1-2 seconds to collect multiple offers
- If no offers arrive, returns to INIT retransmission schedule

**REQUESTING (DHCPREQUEST retransmission):**
- Similar exponential backoff to INIT
- After 4-5 failures: return to INIT and restart with DISCOVER

**RENEWING (unicast DHCPREQUEST retransmission):**
- Retransmit at half the remaining time until T2
- Example with 24h lease: retransmit at T1+6h, T1+9h, T1+10.5h... until T2
- This halving strategy ensures attempts become more frequent as T2 approaches

**REBINDING (broadcast DHCPREQUEST retransmission):**
- Retransmit at half the remaining time until lease expiry
- Same halving strategy as RENEWING
- Final retransmission may occur seconds before lease expiry

```
RETRANSMISSION TIMING -- RENEWING/REBINDING HALVING
================================================================

24-hour lease example:
  T1 = 12h, T2 = 21h, Expiry = 24h

  RENEWING attempts (unicast to server):
    12:00 -- first renewal attempt
    16:30 -- retry (half of 9h remaining = 4.5h)
    18:45 -- retry (half of 4.5h)
    19:52 -- retry
    20:26 -- retry
    20:43 -- last unicast attempt before T2

  REBINDING attempts (broadcast):
    21:00 -- first rebind attempt
    22:30 -- retry (half of 3h remaining)
    23:15 -- retry
    23:37 -- retry
    23:49 -- retry
    23:55 -- final attempt before expiry
    24:00 -- lease expires, address deconfigured
```

---

## 12. ARP Conflict Detection

Before using a newly assigned address, the client should perform ARP conflict detection (also called ARP probing) to verify the address is not already in use on the local network [1][3].

**Procedure:**
1. Client sends an ARP Request with sender IP = 0.0.0.0 and target IP = the assigned address
2. If any host responds (indicating it owns that address), a conflict exists
3. The client sends DHCPDECLINE to the server
4. The server marks the address as unavailable (typically for a configurable hold-down period)
5. The client returns to INIT and restarts the DORA process

RFC 5227 (IPv4 Address Conflict Detection) formalizes this procedure with specific timing: send 3 ARP probes at 1-second intervals, wait 2 seconds, then claim the address if no response [3].

ARP conflict detection protects against two scenarios: a server that has an incorrect view of its address pool (e.g., after crash recovery), and manual address configuration that conflicts with the server's pool.

---

## 13. Lease Release and Decline

**DHCPRELEASE:** When a client no longer needs its address (e.g., shutting down, disconnecting from network), it may send a DHCPRELEASE message to the server. The server can immediately return the address to the available pool. DHCPRELEASE is unicast to the server and is purely optional -- many clients simply let their leases expire naturally [1].

**DHCPDECLINE:** When ARP conflict detection reveals the offered address is already in use, the client sends DHCPDECLINE to inform the server. The server should mark the address as temporarily unavailable to prevent offering it again. The client returns to INIT [1].

Neither DHCPRELEASE nor DHCPDECLINE expect a server response. They are informational notifications sent as a courtesy. If the message is lost, the server eventually reclaims the address when the lease expires [1].

---

## 14. Server-Side Lease Management

While RFC 2131 focuses primarily on client behavior, servers maintain their own state [1]:

**Lease database:** Servers maintain a persistent mapping of (client-identifier, IP address, lease expiry time, assigned parameters). This database survives server restarts, enabling lease continuity. ISC DHCP uses a text-based lease file; modern implementations (Kea) use SQL databases [4].

**Address pool management:** Each scope (subnet) has a pool of addresses available for dynamic allocation. The server tracks which addresses are offered (but not yet committed), which are committed (DHCPACK sent), which are expired, and which are reserved (manual allocation) [1].

**Grace period:** Many servers implement a grace period after lease expiry before returning the address to the pool. This prevents address reuse during brief network interruptions where the client intends to renew but is temporarily unreachable.

**Ping-before-offer:** Some servers (ISC DHCP, Cisco IOS) can ICMP ping an address before offering it. If the address responds, it is marked as in-use (conflict) and not offered. This catches addresses that are statically configured on devices not participating in DHCP [4].

---

## 15. Cross-References

> **Related:** [Wire Format](01-wire-format-and-message-types.md) -- the ciaddr/yiaddr fields that encode lease state in the packet. [Options Catalog](02-options-catalog.md) -- options 50, 51, 53, 54, 58, 59 that control lease negotiation. [Security Architecture](04-security-and-attack-surface.md) -- how the unauthenticated state machine enables attack vectors.

**Series cross-references:**
- **DNS (DNS Protocol):** DNS dynamic update (RFC 2136) can be triggered by DHCP lease events
- **SYS (Systems Admin):** Lease monitoring, pool utilization alerts, server failover configuration
- **K8S (Kubernetes):** Container lease management in bridge-mode networking
- **CMH (Comp. Mesh):** Mesh node address lifecycle, lease duration considerations for mobile nodes
- **WPH (Weekly Phone):** Mobile device roaming between APs triggers INIT-REBOOT fast path
- **MCF (Multi-Cluster Fed.):** Cross-site lease coordination in federated infrastructure

---

## 16. Sources

1. Droms, R. "Dynamic Host Configuration Protocol." RFC 2131, IETF Standards Track, March 1997. Retrieved from rfc-editor.org.
2. LwIP Project. "DHCP State Machine Documentation." DeepWiki / stm32duino, October 2025.
3. Cheshire, S. "IPv4 Address Conflict Detection." RFC 5227, IETF Standards Track, July 2008. Retrieved from rfc-editor.org.
4. Internet Systems Consortium. "Kea DHCP Server Documentation." Version 2.6, 2025. Retrieved from isc.org.
5. Alexander, S. and Droms, R. "DHCP Options and BOOTP Vendor Extensions." RFC 2132, IETF Standards Track, March 1997. Retrieved from rfc-editor.org.
6. Droms, R. and Lemon, T. *The DHCP Handbook*. 2nd ed. Sams Publishing, 2003.
7. Wimer, W. "Clarifications and Extensions for the Bootstrap Protocol." RFC 1542, October 1993. Retrieved from rfc-editor.org.
8. Stevens, W.R. *TCP/IP Illustrated, Volume 1: The Protocols*. Addison-Wesley, 1994. Chapter 16.
9. Braden, R., Ed. "Requirements for Internet Hosts -- Communication Layers." RFC 1122, IETF Standards Track, October 1989. Retrieved from rfc-editor.org.
10. Microsoft. "DHCP Client State Machine Implementation." Windows Network Architecture Documentation, 2023.
11. Cisco Systems. "Configuring DHCP Failover." IOS XE Configuration Guide, 2024.
12. Plummer, D. "An Ethernet Address Resolution Protocol." RFC 826, November 1982. Retrieved from rfc-editor.org.
13. Abdulghaffar, A. et al. "An Analysis of DHCP Vulnerabilities, Attacks, and Countermeasures." IEEE, 2023. Retrieved from infotheory.ca.
14. IANA. "BOOTP Vendor Extensions and DHCP Options." Registry updated 2026-02-02. Retrieved from iana.org/assignments/bootp-dhcp-parameters.
15. ISC. "ISC DHCP Server Documentation." Open source reference implementation. Retrieved from isc.org.
16. Mrugalski, T. et al. "Dynamic Host Configuration Protocol for IPv6 (DHCPv6)." RFC 8415, IETF Standards Track, November 2018. Retrieved from rfc-editor.org.

---

*DHCP Protocol -- Module 3: Lease Lifecycle and State Machine. Eight states, three timers, and the deterministic choreography that keeps the Internet addressed.*
