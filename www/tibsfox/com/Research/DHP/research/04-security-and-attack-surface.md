# Security Architecture and Attack Surface

> **Domain:** Network Protocols -- Internet Infrastructure Layer
> **Module:** 4 -- DHCP Vulnerabilities, Attack Classes, Defensive Architectures, and RFC 3118 Analysis
> **Through-line:** *DHCP was designed for trusted networks -- and for thirty years, that trust has been simultaneously its greatest strength and its most dangerous assumption.* The protocol has no built-in authentication. Every field in every message is accepted at face value. The attack surface is not a bug; it is an architectural choice that traded security for simplicity and operational efficiency within the defended perimeter of a local network segment. Understanding this trade-off, and the layered defenses built around it, is essential for anyone deploying DHCP in environments where the perimeter may not hold.

---

## Table of Contents

1. [The Fundamental Trust Model](#1-the-fundamental-trust-model)
2. [Attack Class 1: Rogue DHCP Server](#2-attack-class-1-rogue-dhcp-server)
3. [Attack Class 2: DHCP Starvation](#3-attack-class-2-dhcp-starvation)
4. [Attack Class 3: Replay and Spoofing](#4-attack-class-3-replay-and-spoofing)
5. [The Attack Chain: Starvation to MITM](#5-the-attack-chain-starvation-to-mitm)
6. [Defense: DHCP Snooping](#6-defense-dhcp-snooping)
7. [Defense: Dynamic ARP Inspection](#7-defense-dynamic-arp-inspection)
8. [Defense: IP Source Guard](#8-defense-ip-source-guard)
9. [Defense: Port Security](#9-defense-port-security)
10. [Defense: VLAN ACLs and Network Segmentation](#10-defense-vlan-acls-and-network-segmentation)
11. [RFC 3118: Authentication for DHCP Messages](#11-rfc-3118-authentication-for-dhcp-messages)
12. [Why RFC 3118 Failed: A Protocol Design Lesson](#12-why-rfc-3118-failed-a-protocol-design-lesson)
13. [DHCP Snooping Binding Table Architecture](#13-dhcp-snooping-binding-table-architecture)
14. [Defense Deployment Architecture](#14-defense-deployment-architecture)
15. [Cross-References](#15-cross-references)
16. [Sources](#16-sources)

---

## 1. The Fundamental Trust Model

DHCP operates on implicit trust. There is no authentication, no encryption, no integrity verification in the base protocol (RFC 2131). All messages are cleartext UDP, either broadcast or unicast. Any device on the local Layer 2 segment can send and receive DHCP messages [1].

This is not an oversight. RFC 2131 was designed for networks where Layer 2 access implies authorization -- a campus LAN, a corporate office, a data center segment. The assumption is that physical or VLAN-level access control limits who can participate in the broadcast domain. The threat model is explicitly **insider threat**: someone with physical or logical access to the network segment [2].

The RFC 3118 analysis (Section 2, "Security Considerations") acknowledges: "DHCP is built directly on UDP and IP which are as yet inherently insecure." The protocol designers made a deliberate architectural choice to keep DHCP simple and universally deployable, deferring authentication to later extensions or lower-layer security mechanisms [2].

> **SAFETY WARNING:** All attack descriptions in this module are presented at the conceptual level for defensive understanding. No exploitation scripts, tool configurations, or proof-of-concept code are included. The purpose is to enable defenders to understand threat mechanisms and deploy appropriate countermeasures.

---

## 2. Attack Class 1: Rogue DHCP Server

A rogue DHCP server is an unauthorized device on the network that responds to DHCPDISCOVER broadcasts with forged DHCPOFFER messages [3].

**Mechanism:** Since DHCP clients typically accept the first OFFER received, a rogue server that responds faster than the legitimate server will configure clients with attacker-controlled parameters. The client has no way to distinguish a legitimate offer from a rogue one -- both use the same packet format and neither requires authentication [1].

**Attacker-controlled parameters via rogue server:**
- **Default Gateway (option 3):** All client traffic routed through attacker's machine, enabling full traffic interception (man-in-the-middle)
- **DNS Server (option 6):** All hostname resolution directed to attacker's DNS, enabling hostname hijacking and phishing redirection
- **Domain Name (option 15):** Client's DNS search domain can be set to attacker-controlled domain
- **Lease Time (option 51):** Short leases force frequent renewals, maintaining control; long leases persist the compromise

**Result:** A persistent man-in-the-middle position for all traffic from victimized clients. The attacker's machine acts as an invisible proxy between clients and the real network [3].

**Detection indicators:** Multiple DHCPOFFER messages for the same DHCPDISCOVER, offers from unexpected IP addresses, offers with unusual lease parameters or DNS/gateway settings [4].

---

## 3. Attack Class 2: DHCP Starvation

A DHCP starvation attack exhausts the server's address pool by sending continuous DHCPDISCOVER messages with spoofed (random) MAC addresses [3].

**Mechanism:** Each DHCPDISCOVER with a unique `chaddr` (MAC address) causes the server to reserve an IP address for the apparent client. By flooding DHCPDISCOVER messages with thousands of random MACs, the attacker depletes the entire address pool. Legitimate clients receive no offers because all addresses are allocated to non-existent clients [3].

**Why it works:** The DHCP server cannot verify that the MAC address in `chaddr` corresponds to a real hardware address. The server treats each unique MAC as a new client and allocates an address. The only limit is the size of the address pool [1].

**Scalability of the attack:** A /24 subnet has 254 usable addresses. At one spoofed DISCOVER per second, the pool is exhausted in under 5 minutes. At 100 per second (easily achievable from a single workstation), the pool is empty in seconds [3].

**Countermeasure dependency:** Port security (limiting the number of MAC addresses per switch port) is the primary defense, as DHCP snooping alone does not prevent clients from claiming multiple addresses [5].

---

## 4. Attack Class 3: Replay and Spoofing

Without message authentication, DHCP messages can be captured and replayed, or forged with spoofed source parameters [3].

**Replay attacks:** An attacker captures a legitimate DHCPREQUEST and replays it. If the `xid` matches an active transaction, the server may process it as valid, potentially interfering with lease state or causing the server to send an unexpected ACK/NAK [2].

**DHCPRELEASE spoofing:** An attacker crafts a DHCPRELEASE message with a victim's `chaddr` and `ciaddr`, unicast to the DHCP server. The server releases the victim's lease, causing the victim to lose its address at the next renewal attempt. The victim's traffic disrupts when the lease is not renewed [3].

**DHCPDECLINE spoofing:** Similar to RELEASE spoofing, but the attacker sends DHCPDECLINE for an address, causing the server to mark it as conflicted and remove it from the pool. Systematic DECLINE spoofing can gradually shrink the available pool [3].

**Transaction ID prediction:** If the `xid` generation is predictable (sequential, weakly random), an attacker can forge DHCPACK messages that the client accepts as legitimate. This requires the attacker to know or predict the `xid` before the legitimate server responds [2].

---

## 5. The Attack Chain: Starvation to MITM

The most effective DHCP attack is a two-stage chain [3]:

```
DHCP ATTACK CHAIN -- STARVATION TO MITM
================================================================

Stage 1: STARVATION
  Attacker floods DHCPDISCOVER with random MACs
  Legitimate DHCP server pool exhausted
  New clients get no response from legitimate server

Stage 2: ROGUE SERVER
  Attacker runs rogue DHCP server
  Only server with available addresses
  All new clients receive attacker's configuration:
    - Gateway = attacker's IP (MITM)
    - DNS = attacker's resolver (hijack)

Result: Full transparent interception of client traffic
  Client --> [Attacker/MITM] --> Real Gateway --> Internet
  Client <-- [Attacker/MITM] <-- Real Gateway <-- Internet

Detection difficulty: HIGH
  - Client sees normal network behavior
  - Traffic flows correctly (attacker forwards it)
  - Only network monitoring or DHCP snooping detects the rogue
```

This chain exploits the protocol's two architectural assumptions simultaneously: the server has no way to verify client identity (enabling starvation), and the client has no way to verify server identity (enabling rogue server acceptance) [3].

---

## 6. Defense: DHCP Snooping

DHCP snooping is a Layer 2 security feature implemented in managed switches that inspects all DHCP traffic and enforces trust policies [5].

**Architecture:**
- Switch ports are classified as **trusted** or **untrusted**
- Trusted ports: uplinks, DHCP server connections, inter-switch links
- Untrusted ports: client access ports (default for all access ports)

**Enforcement rules:**
- Untrusted ports may send DHCPDISCOVER, DHCPREQUEST, DHCPDECLINE, DHCPRELEASE, DHCPINFORM (client messages only)
- Untrusted ports are **blocked** from sending DHCPOFFER and DHCPACK (server messages)
- This prevents rogue DHCP servers on access ports from responding to clients

**Binding table:** DHCP snooping builds and maintains a binding table mapping (MAC address, IP address, switch port, VLAN, lease expiry) from observed DHCPACK messages. This table is used by Dynamic ARP Inspection and IP Source Guard [5].

**Rate limiting:** DHCP snooping can rate-limit DHCP messages per port, mitigating starvation attacks by limiting how quickly a single port can generate DHCP requests [5].

---

## 7. Defense: Dynamic ARP Inspection

Dynamic ARP Inspection (DAI) validates ARP packets against the DHCP snooping binding table [5].

**How it works:** When a device sends an ARP reply claiming to own an IP address, DAI checks whether the MAC-to-IP mapping matches the DHCP snooping binding table. If the ARP reply claims an IP address that DHCP did not assign to that MAC address, the ARP is dropped.

**Protection:** DAI prevents ARP spoofing attacks that are often used in conjunction with DHCP attacks. Even if an attacker obtains an address through a rogue server, DAI prevents them from ARP-spoofing the real gateway, limiting the effectiveness of MITM attacks [5].

**Dependency:** DAI requires DHCP snooping to be enabled because it relies on the snooping binding table as its source of truth. Without snooping, DAI has no reference data.

---

## 8. Defense: IP Source Guard

IP Source Guard (IPSG) uses the DHCP snooping binding table to filter IP traffic at the switch port level [5].

**How it works:** For each access port, IPSG allows only IP traffic with source addresses matching the DHCP snooping binding for that port. If a device sends a packet with a source IP that was not assigned to its port by DHCP, the packet is dropped.

**Protection:** IPSG prevents IP address spoofing from access ports. Even if an attacker statically configures a different IP address, the switch drops all traffic from that address because it does not match the DHCP binding [5].

**Deployment consideration:** IPSG can cause issues with statically configured devices (servers, printers) that do not use DHCP. These devices require manual binding table entries or exemption from IPSG enforcement.

---

## 9. Defense: Port Security

Port security limits the number of MAC addresses that can be seen on a single switch port [5].

**How it works:** The administrator configures a maximum number of MAC addresses per port (e.g., 1 or 2). When a new MAC address appears beyond the limit, the port can be configured to drop frames from the new MAC (restrict mode), send an SNMP trap (protect mode), or shut down the port entirely (shutdown mode) [5].

**Protection against starvation:** DHCP starvation requires thousands of spoofed MAC addresses from a single port. With port security limiting each port to 1-2 MACs, the attack is fundamentally constrained. The attacker can only claim 1-2 addresses per port rather than exhausting the entire pool [5].

**Deployment consideration:** Multi-device setups (IP phones with passthrough ports, wireless access points) require higher MAC limits, which reduces the defense's effectiveness on those specific ports.

---

## 10. Defense: VLAN ACLs and Network Segmentation

VLAN Access Control Lists (VACLs) and network segmentation provide additional defense layers [6].

**VLAN-based segmentation:** Placing DHCP servers on dedicated VLANs with controlled access limits the blast radius of attacks. A rogue server on VLAN 100 cannot respond to clients on VLAN 200 unless the relay agent is misconfigured.

**VACLs:** Applied to traffic within and between VLANs, VACLs can filter DHCP traffic patterns. For example, a VACL can block DHCPOFFER messages sourced from unexpected IP addresses, even on ports where snooping is not enabled.

**802.1X integration:** Port-based network access control (802.1X) authenticates devices before granting any network access, including the ability to send DHCP messages. This addresses the fundamental gap in DHCP's trust model: the device must prove its identity to the switch before the switch will forward its DHCP traffic. 802.1X is the closest widely-deployed equivalent to what RFC 3118 attempted at the protocol level [7].

---

## 11. RFC 3118: Authentication for DHCP Messages

RFC 3118 (Authentication for DHCP Messages, June 2001) defined an authentication option that adds a message authentication code (MAC) to DHCP packets [2].

**Architecture:**
- New option carrying: protocol version, algorithm identifier, replay detection method (RDM), replay detection value, authentication information (HMAC-MD5)
- **Delayed authentication mechanism:** Uses a shared secret (pre-shared key) between client and server
- The authentication information field contains an HMAC-MD5 hash computed over the entire DHCP message using the shared secret
- Replay detection uses a monotonically increasing counter or timestamp

**Authentication flow:**
1. Client includes authentication option in DHCPDISCOVER with its identity
2. Server validates client identity, computes HMAC-MD5 over DHCPOFFER, includes result in authentication option
3. Client verifies server's HMAC-MD5, computes its own over DHCPREQUEST
4. Server verifies client's HMAC-MD5 in final DHCPACK

**Limitation:** The initial DHCPDISCOVER cannot be authenticated by the server (the server does not yet know the client's identity). This creates a bootstrap problem: the first message is always unauthenticated [2].

---

## 12. Why RFC 3118 Failed: A Protocol Design Lesson

RFC 3118 was published in 2001 and has seen near-zero deployment in the subsequent 25 years. This failure is one of the most instructive protocol design lessons in the DHCP ecosystem [2][3].

**Key management problem:** RFC 3118 requires pre-shared secrets distributed to all DHCP clients before authentication can work. In an enterprise with 10,000 clients, this means distributing and managing 10,000 shared secrets -- before those clients can get an IP address. The bootstrapping is circular: DHCP provides network configuration, but the authentication requires configuration before DHCP can run [2].

**Scalability failure:** The shared-secret model does not scale. Per-client secrets require a key management infrastructure that is more complex than DHCP itself. Shared group secrets reduce security to the weakest member. Neither approach is operationally viable at scale [2].

**802.1X competition:** IEEE 802.1X (port-based network access control) solves the same trust problem at a lower network layer with a more robust architecture. 802.1X authenticates the device to the switch before it can participate in any protocol, including DHCP. By the time the DHCP exchange begins, the device has already been authenticated. This makes protocol-level DHCP authentication redundant in 802.1X environments [7].

**DHCP snooping adequacy:** Switch-based DHCP snooping, deployed widely from the mid-2000s onward, provided "good enough" security for most environments without requiring client-side changes. The defense shifted from protocol authentication to infrastructure enforcement [5].

**The lesson:** Authentication mechanisms that require pre-deployment configuration of the very thing they are trying to configure create unsolvable bootstrapping problems. The successful defenses (802.1X, DHCP snooping) work at a different layer of the stack, avoiding the circular dependency entirely.

```
RFC 3118 DEPLOYMENT TIMELINE
================================================================

2001  RFC 3118 published (IETF Standards Track)
2002  Minimal implementation in ISC DHCP; near-zero adoption
2003  DHCP snooping features appear in Cisco IOS
2004  802.1X adoption accelerates in enterprise
2007  Analysis: "numerous security vulnerabilities" in approach
2010  Industry consensus: switch-based defenses preferred
2020  RFC 3118 effectively obsolete in practice
2026  Still listed in IANA registry; zero known production deployments
```

---

## 13. DHCP Snooping Binding Table Architecture

The binding table is the keystone of switch-based DHCP defense. Its structure and lifecycle are critical to understanding the defense architecture [5].

| Field | Source | Purpose |
|-------|--------|---------|
| MAC Address | Extracted from `chaddr` in DHCPACK | Client identification |
| IP Address | Extracted from `yiaddr` in DHCPACK | Assigned IP |
| Switch Port | Port on which DHCPACK was observed heading to client | Physical location |
| VLAN | VLAN of the client port | Network segment |
| Lease Expiry | From option 51 in DHCPACK | Binding validity |

**Lifecycle:**
1. Entry created when DHCPACK passes through the switch toward a client port
2. Entry valid for the duration of the lease (tracked from option 51)
3. Entry removed when lease expires, DHCPRELEASE observed, or port link down
4. DAI and IPSG reference the table for packet validation

**Persistence:** Many switch implementations persist the binding table to flash storage, surviving switch reboots. Without persistence, a switch reboot causes all bindings to be lost, temporarily disabling DAI and IPSG until clients renew their leases [5].

**Scale considerations:** In a campus network with 10,000 devices, the binding table contains 10,000 entries. Each entry requires approximately 64 bytes of storage. The total memory footprint is modest (640 KB), but the table must be consulted for every ARP packet (DAI) and every IP packet (IPSG) on every untrusted port, making lookup performance critical. Hardware-based implementations using TCAM (Ternary Content-Addressable Memory) provide wire-speed lookups [5].

---

## 14. Defense Deployment Architecture

Deploying DHCP security requires layered configuration across the switching infrastructure. The defenses complement each other and should be deployed together for maximum protection [5][8].

```
DEFENSE DEPLOYMENT -- LAYERED ARCHITECTURE
================================================================

  ACCESS LAYER SWITCH
  +--------------------------------------------------+
  | Port 1 (untrusted - client)                       |
  |   - DHCP snooping: client msgs only              |
  |   - Port security: max 2 MACs                    |
  |   - DAI: validate ARP against binding table      |
  |   - IPSG: filter by DHCP binding                  |
  |                                                    |
  | Port 24 (trusted - uplink to distribution)        |
  |   - DHCP snooping: trust (allow server msgs)     |
  |   - No port security limit                        |
  |   - DAI: trust                                    |
  +--------------------------------------------------+

  DISTRIBUTION LAYER
  +--------------------------------------------------+
  | DHCP server on VLAN 100                           |
  | Client VLANs 200-210                              |
  | DHCP relay on inter-VLAN interface                |
  | VACL: block DHCPOFFER from non-server IPs         |
  +--------------------------------------------------+
```

**Deployment order matters:** DHCP snooping must be enabled first, because DAI and IPSG depend on the snooping binding table. Enabling DAI without snooping causes all ARP traffic to be dropped (no binding entries exist to validate against). The recommended deployment sequence is:

1. Enable DHCP snooping globally and per-VLAN
2. Configure trusted ports (uplinks, server connections)
3. Enable port security on access ports
4. Enable DAI per-VLAN
5. Enable IPSG per-port (access ports only)
6. Verify binding table population via `show ip dhcp snooping binding`

**Monitoring and alerting:** DHCP snooping generates Syslog messages and SNMP traps when violations occur (server messages from untrusted ports, rate limit exceeded). These events should feed into a SIEM or monitoring system for incident detection. A sudden spike in DHCP snooping violations on a specific port is a strong indicator of active attack [5][8].

**Virtualization environments:** VMware vSphere and Microsoft Hyper-V implement DHCP Guard at the virtual switch level. The hypervisor enforces the same trusted/untrusted port model on virtual NICs, preventing rogue DHCP servers from running inside virtual machines. This extends the defense perimeter from physical switches into the virtualization layer [10].

**Wireless networks:** In enterprise Wi-Fi deployments, the wireless controller typically acts as the Layer 2 termination point. DHCP snooping is configured on the controller, which inspects DHCP traffic from wireless clients before forwarding it to the wired network. The controller is the trust boundary for wireless DHCP traffic [15].

---

## 15. Cross-References

> **Related:** [Wire Format](01-wire-format-and-message-types.md) -- the chaddr field exploited in starvation attacks; giaddr as relay agent attack surface. [Options Catalog](02-options-catalog.md) -- options 3 and 6 that are the primary targets of rogue server attacks. [Lease Lifecycle](03-lease-lifecycle-and-state-machine.md) -- the unauthenticated state transitions that enable MITM. [DHCPv6](05-dhcpv6-and-modern-extensions.md) -- similar security challenges in the IPv6 context.

**Series cross-references:**
- **DNS (DNS Protocol):** DNS hijacking via rogue DHCP is the primary exploitation path for option 6 compromise
- **SYS (Systems Admin):** Deploying and monitoring DHCP snooping, DAI, IPSG on managed switches
- **K8S (Kubernetes):** Container network security intersects with DHCP trust at the bridge level
- **SAN (SANS Institute):** DHCP security assessment methodologies and audit checklists
- **CMH (Comp. Mesh):** Mesh network trust bootstrapping parallels DHCP's authentication challenge
- **MCF (Multi-Cluster Fed.):** Federated DHCP trust across multiple sites

---

## 16. Sources

1. Droms, R. "Dynamic Host Configuration Protocol." RFC 2131, IETF Standards Track, March 1997. Retrieved from rfc-editor.org.
2. Droms, R. and Arbaugh, W. "Authentication for DHCP Messages." RFC 3118, IETF Standards Track, June 2001. Retrieved from datatracker.ietf.org.
3. Abdulghaffar, A. et al. "An Analysis of DHCP Vulnerabilities, Attacks, and Countermeasures." IEEE, 2023. Retrieved from infotheory.ca.
4. Pentera. "Understanding and Preventing DHCP Spoofing Attacks." Security Research, November 2021.
5. Cisco Systems. "DHCP Snooping Design Guide." Configuration Guide, IOS XE, 2024.
6. Cisco Systems. "VLAN ACL (VACL) Configuration Guide." IOS XE, 2024.
7. IEEE 802.1X-2020. "IEEE Standard for Local and Metropolitan Area Networks -- Port-Based Network Access Control." IEEE Standards Association, 2020.
8. SANS Institute. "DHCP Security: Best Practices for Enterprise Deployments." GIAC Paper, 2019.
9. NIST SP 800-153. "Guidelines for Securing Wireless Local Area Networks (WLANs)." February 2012. Section on DHCP security.
10. Microsoft. "DHCP Guard in Hyper-V." Windows Server Documentation, 2023.
11. Droms, R. and Lemon, T. *The DHCP Handbook*. 2nd ed. Sams Publishing, 2003. Chapter 21: DHCP Security.
12. Stevens, W.R. *TCP/IP Illustrated, Volume 1: The Protocols*. Addison-Wesley, 1994.
13. IETF DHC Working Group. "Dynamic Host Configuration." Charter and working group documents. Retrieved from datatracker.ietf.org/wg/dhc.
14. Juniper Networks. "DHCP Snooping and DAI Configuration." Junos OS Documentation, 2024.
15. Aruba Networks. "DHCP Security Features in ArubaOS-CX." Technical White Paper, 2023.
16. Wikipedia. "Dynamic Host Configuration Protocol -- Security." Updated February 2026. Secondary reference for historical context.

---

*DHCP Protocol -- Module 4: Security Architecture and Attack Surface. The protocol that trusted everyone, and the infrastructure that learned to verify anyway.*
