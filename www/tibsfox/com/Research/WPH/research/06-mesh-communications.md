# Mesh Communications

> **Domain:** Decentralized Network Architecture
> **Module:** 6 -- Networks Without Infrastructure
> **Through-line:** *Every telecommunications system in this series depends on infrastructure: central offices, cell towers, submarine cables, data centers. Mesh communications asks: what if the devices ARE the infrastructure? What if every phone is a relay, every laptop a router, every radio a repeater? The mesh network has no center, no single point of failure, no authority that can switch it off. When the earthquake drops the Cascadia fault and every cell tower loses backhaul, the mesh keeps talking -- because the mesh is just people with radios, and people with radios have always found each other.*

---

## Table of Contents

1. [Mesh Network Fundamentals](#1-mesh-network-fundamentals)
2. [Routing Protocols for Mesh Networks](#2-routing-protocols-for-mesh-networks)
3. [LoRa and Meshtastic](#3-lora-and-meshtastic)
4. [Wi-Fi Mesh: 802.11s](#4-wi-fi-mesh-80211s)
5. [Phone-to-Phone Direct Communication](#5-phone-to-phone-direct-communication)
6. [Delay-Tolerant Networking](#6-delay-tolerant-networking)
7. [Community Mesh Networks](#7-community-mesh-networks)
8. [Disaster Response Communications](#8-disaster-response-communications)
9. [Burning Man Mesh Deployments](#9-burning-man-mesh-deployments)
10. [PNW Mesh Initiatives](#10-pnw-mesh-initiatives)
11. [Future: Mesh-Native Device Architecture](#11-future-mesh-native-device-architecture)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Mesh Network Fundamentals

A mesh network is a network topology in which each node can relay data for other nodes, creating multiple redundant paths between any two endpoints [1]. Unlike centralized networks (star topology, hub-and-spoke), a mesh network has no single point of failure and can self-heal when nodes join or leave.

```
NETWORK TOPOLOGY COMPARISON
================================================================

  Star (Centralized):         Mesh (Decentralized):
      ┌───┐                     ● ─── ● ─── ●
      │Hub│                     │ ╲   │ ╱   │
      └─┬─┘                    │  ╲  │╱    │
       ╱│╲                     ● ─── ● ─── ●
      ╱ │ ╲                    │ ╱   │ ╲   │
     ●  ●  ●                   │╱    │  ╲  │
     │  │  │                   ● ─── ● ─── ●
     ●  ●  ●
                               Every node can route for others
  All traffic through hub      Multiple paths between any pair
  Hub failure = total failure  Node failure = reroute around it

  Full mesh: every node connected to every other
    Links = N(N-1)/2 (impractical at scale)

  Partial mesh: nodes connect to nearby neighbors
    Each node routes through intermediate hops
    Practical for wireless (radio range limits connections)
```

### Mesh Network Properties

- **Self-healing:** When a node fails, routes recalculate through surviving nodes [2].
- **Self-forming:** New nodes discover neighbors and integrate automatically.
- **Decentralized:** No single controller. Routing is distributed.
- **Scalable:** Adding nodes increases capacity and coverage simultaneously.
- **Latency:** Multiple hops add latency. Each hop adds 1-10 ms (depending on technology).
- **Throughput:** Shared medium means per-node throughput decreases as network grows (half-duplex constraint) [3].

---

## 2. Routing Protocols for Mesh Networks

Mesh routing protocols determine how packets find their way from source to destination through intermediate relay nodes [4].

### Proactive Protocols

Proactive protocols maintain routing tables continuously, so routes are immediately available when needed:

**OLSR (Optimized Link State Routing)**
- Each node periodically broadcasts its neighbor list
- Multipoint Relays (MPRs) reduce broadcast overhead
- Full topology map at every node
- Optimal for moderate-density networks with stable links
- RFC 3626 (OLSRv1), RFC 7181 (OLSRv2) [5]

**B.A.T.M.A.N. (Better Approach To Mobile Adhoc Networking)**
- Layer 2 (data link) routing -- operates below IP
- Nodes broadcast originator messages (OGM)
- Each node tracks best next-hop for each destination
- Simpler than OLSR, lower overhead
- Used in community mesh networks (Freifunk, Guifi.net) [6]

```
B.A.T.M.A.N. ROUTING -- OPERATION
================================================================

  Node A broadcasts OGM:
    "I am A, sequence 42, TTL=50"
         │
    ┌────┼────┐
    │    │    │
    v    v    v
    B    C    D     (neighbors receive OGM)
    │    │
    v    v
    E    F          (re-broadcast with decremented TTL)

  Node F builds routing table:
    Destination A: best next-hop = C (strongest signal path)
    Destination B: best next-hop = E
    ...

  When F wants to send to A:
    F → C → A (follow best next-hop chain)

  Self-healing: if C disappears, F detects missing OGMs,
  switches to alternate path (e.g., F → E → B → A)
```

### Reactive Protocols

Reactive protocols find routes only when needed (on-demand):

**AODV (Ad hoc On-Demand Distance Vector)**
- Route discovery: source floods Route Request (RREQ)
- Destination (or intermediate node with route) sends Route Reply (RREP)
- Routes cached until they expire or break
- Lower overhead than proactive when traffic is sparse
- RFC 3561 [7]

```
AODV ROUTE DISCOVERY
================================================================

  Source S wants to reach Destination D:

  Step 1: S broadcasts RREQ
    S → {A, B, C} → {E, F, G} → ... → D
    (flood propagation, each node records reverse path)

  Step 2: D sends RREP back along reverse path
    D → G → C → S
    (unicast, each node records forward path)

  Step 3: Data flows along discovered route
    S → C → G → D

  Route maintenance:
    - Nodes monitor link status to next hop
    - If link breaks: send RERR (Route Error) to source
    - Source initiates new RREQ
    - Active route repair: intermediate node can attempt local repair
```

### Protocol Comparison

| Property | OLSR | B.A.T.M.A.N. | AODV |
|----------|------|-------------|------|
| Type | Proactive | Proactive | Reactive |
| Layer | L3 (IP) | L2 (Ethernet) | L3 (IP) |
| Overhead | Medium-High | Low-Medium | Low (idle), High (burst) |
| Route latency | Instant | Instant | Discovery delay |
| Best for | Stable, moderate density | Community mesh | Sparse, mobile |
| Complexity | High | Low | Medium |

---

## 3. LoRa and Meshtastic

LoRa (Long Range) is a spread-spectrum modulation technique operating in sub-GHz ISM bands (915 MHz in North America, 868 MHz in Europe) that achieves multi-kilometer range at very low data rates [8].

### LoRa Physical Layer

```
LoRa MODULATION PARAMETERS
================================================================

  Frequency:    902-928 MHz (US ISM band)
  Modulation:   Chirp Spread Spectrum (CSS)
  Bandwidth:    125 kHz, 250 kHz, or 500 kHz
  Spreading Factor: SF7-SF12 (higher SF = longer range, lower rate)

  Data rates:
    SF7,  125 kHz BW:  5,470 bps  (shortest range)
    SF10, 125 kHz BW:    980 bps
    SF12, 125 kHz BW:    250 bps  (longest range)

  Range (typical):
    Urban:     1-5 km (with buildings, foliage)
    Suburban:  5-15 km
    Line-of-sight: 15-50+ km (documented)
    Record:    832 km (balloon-to-ground, extreme conditions)

  Power:
    Transmit: 20-30 dBm (100-1000 mW)
    Receive:  ~10 mA
    Sleep:    ~1 uA
    Battery life: months to years on coin cell

  Trade-off:
    Range ←────────────── SF ──────────────→ Speed
    Long range requires high SF = very low data rate
    Chat messages: OK (small text)
    Voice: impossible (insufficient bandwidth)
    Images: impractical at SF12
```

### Meshtastic

Meshtastic is an open-source firmware for LoRa radio modules that creates self-forming mesh networks for text messaging, GPS position sharing, and telemetry [9].

```
MESHTASTIC ARCHITECTURE
================================================================

  ┌──────────────────┐
  │  Smartphone App   │  (Bluetooth connection)
  │  (Android/iOS)    │
  └────────┬─────────┘
           │ BLE
  ┌────────┴─────────┐
  │  Meshtastic Node  │  (LoRa radio + ESP32/nRF52)
  │  (e.g., T-Beam,   │
  │   Heltec, RAK)    │
  └────────┬─────────┘
           │ LoRa radio
           │ (915 MHz, up to 5-15 km range)
           │
  ┌────────┴─────────┐     ┌──────────────────┐
  │  Meshtastic Node  │─────│  Meshtastic Node  │
  │  (relay)          │     │  (relay)          │
  └────────┬─────────┘     └────────┬─────────┘
           │                         │
  ┌────────┴─────────┐     ┌────────┴─────────┐
  │  Meshtastic Node  │     │  Meshtastic Node  │
  │  (endpoint)       │     │  (endpoint)       │
  └──────────────────┘     └──────────────────┘

  Features:
    - Text messaging (group and direct)
    - GPS position sharing
    - Telemetry (battery, environment sensors)
    - Store-and-forward (offline message delivery)
    - Encryption (AES-256 per channel)
    - No infrastructure required
    - ~$20-50 per node (off-the-shelf hardware)
```

Meshtastic has found particular adoption in:
- **Outdoor recreation:** Hikers, climbers, backcountry skiers in areas without cell service
- **Disaster preparedness:** Emergency communication when cellular fails
- **Events:** Burning Man, festivals, large gatherings
- **Rural communication:** Farms, ranches, remote communities

---

## 4. Wi-Fi Mesh: 802.11s

IEEE 802.11s (2011) standardized mesh networking at the Wi-Fi layer, enabling access points and stations to form self-configuring mesh networks [10].

```
802.11s MESH ARCHITECTURE
================================================================

  ┌─────────┐     ┌─────────┐     ┌─────────┐
  │  Mesh   │─────│  Mesh   │─────│  Mesh   │
  │  AP 1   │     │  AP 2   │     │  AP 3   │
  └────┬────┘     └────┬────┘     └────┬────┘
       │               │               │
    clients          clients          clients
    (STA)            (STA)            (STA)

  802.11s features:
    - HWMP (Hybrid Wireless Mesh Protocol): combines proactive
      tree-based routing with reactive on-demand discovery
    - Airtime link metric: considers data rate, frame error rate,
      and overhead to select best paths
    - Mesh peering: secure association between mesh nodes
    - Mesh gate: bridge to external networks (internet)

  Consumer mesh systems (NOT 802.11s, proprietary):
    - Google Nest WiFi, Amazon Eero, TP-Link Deco
    - Use proprietary mesh protocols over standard Wi-Fi
    - Designed for home coverage, not ad-hoc mesh
    - Require internet backhaul at one node
```

---

## 5. Phone-to-Phone Direct Communication

Modern smartphones have limited native mesh capabilities, but several technologies enable direct device-to-device communication [11].

### Available Technologies

```
PHONE-TO-PHONE COMMUNICATION OPTIONS
================================================================

  Bluetooth:
    Range: 10-100m (BLE 5.0: up to 400m LOS)
    Data rate: 1-2 Mbps (BLE: 125 kbps - 2 Mbps)
    Power: very low
    Mesh: Bluetooth Mesh (BLE 5.0+) -- up to 32,767 nodes
    Use: short-range messaging, IoT

  Wi-Fi Direct:
    Range: up to 200m
    Data rate: up to 250 Mbps
    Power: moderate
    Mesh: not native (application layer required)
    Use: file sharing, screen mirroring

  Wi-Fi Aware (NAN):
    Range: up to 100m
    Data rate: variable
    Power: low (passive scanning)
    Use: service discovery, proximity-based apps

  Apple AirDrop / Multipeer Connectivity:
    Range: ~10-30m (Bluetooth discovery + Wi-Fi Direct transfer)
    Proprietary to Apple ecosystem
    Use: file sharing

  Bridgefy / Briar / Signal (offline):
    Application-layer mesh over Bluetooth
    Range: limited by BLE range (~100m per hop)
    Use: protest communications, disaster messaging
```

### Sidelink: 3GPP Direct Communication

3GPP has standardized device-to-device (D2D) communication in LTE (ProSe) and 5G (NR Sidelink, PC5 interface) [12]:

```
5G NR SIDELINK (V2X / D2D)
================================================================

  Mode 1: Network-scheduled
    - Base station allocates sidelink resources
    - Requires network coverage

  Mode 2: Autonomous
    - Devices select their own resources
    - Works WITHOUT network coverage
    - Sensing-based resource selection
    - Designed for V2X (Vehicle-to-Everything)

  Specifications:
    Frequency: shared with uplink or dedicated band
    Range: 300-1000m (typical for V2X)
    Latency: < 10 ms
    Reliability: 99.999% (URLLC target)

  Applications:
    - Vehicle-to-vehicle (V2V) collision avoidance
    - Vehicle-to-infrastructure (V2I)
    - Public safety direct communication (MCPTT)
    - Potential: ad-hoc mesh networking
```

---

## 6. Delay-Tolerant Networking

Delay-Tolerant Networking (DTN) is designed for environments where end-to-end connectivity is intermittent or nonexistent [13]. DTN uses store-and-forward: nodes carry messages until they encounter another node that can bring the message closer to its destination.

```
DTN STORE-AND-FORWARD
================================================================

  Traditional networking (TCP/IP):
    Source ──────────────────────────→ Destination
    (requires continuous end-to-end path)

  DTN (Bundle Protocol):
    Source ──→ Relay A ──┐
                          │ (carries message for hours/days)
                          │
                          └──→ Relay B ──→ Destination
                               (eventually delivers)

  DTN protocol stack:
    Application
    Bundle Protocol (RFC 9171)
    Convergence Layer Adapter (TCP, UDP, Bluetooth, etc.)
    Transport / Link Layer

  Bundle Protocol features:
    - Custody transfer: intermediate nodes take responsibility
    - Fragmentation: bundles can be split across contacts
    - Late binding: destination resolved at delivery time
    - TTL: bundles expire after configurable lifetime
```

DTN is relevant for:
- **Disaster response:** Messages stored on phones and delivered when connectivity is restored
- **Rural/remote areas:** Vehicles carrying messages between disconnected communities
- **Censorship resistance:** Messages propagate through social proximity, not network infrastructure

> **SAFETY WARNING:** Mesh and DTN networks can be used to organize in environments where authorities have shut down internet and cellular service. This is both a humanitarian benefit (disaster response, political freedom) and a security concern (coordination of harmful activities). Network designs should include mechanisms for abuse reporting while preserving privacy for legitimate use [14].

---

## 7. Community Mesh Networks

Community mesh networks are citizen-built, community-owned network infrastructure projects [15].

### Notable Community Mesh Networks

```
COMMUNITY MESH NETWORKS -- WORLDWIDE
================================================================

  Guifi.net (Catalonia, Spain):
    - Largest community mesh in the world
    - ~37,000 nodes, ~65,000 km of links
    - Mix of Wi-Fi mesh and fiber
    - Non-profit foundation governance
    - Provides internet access to rural Catalonia

  NYC Mesh (New York City):
    - ~1,500 active nodes
    - Wi-Fi point-to-point and mesh links
    - Community-funded, volunteer-run
    - Supernode architecture: high-capacity backbone nodes
      on tall buildings, mesh distribution to neighborhoods

  Freifunk (Germany):
    - Federation of local mesh communities
    - ~50,000 nodes across Germany
    - Uses B.A.T.M.A.N. routing protocol
    - Motto: "Free networks everywhere"

  Althea (various US cities):
    - Incentivized mesh using cryptocurrency payments
    - Node operators earn tokens for relaying traffic
    - Market-based bandwidth allocation

  Detroit Community Technology Project:
    - Mesh network serving underserved Detroit neighborhoods
    - Community organizing + technical deployment
    - Digital equity focus
```

---

## 8. Disaster Response Communications

When infrastructure fails -- earthquake, hurricane, wildfire, tsunami -- mesh communications become critical [16].

### PNW Disaster Scenarios

```
PNW DISASTER COMMUNICATION SCENARIOS
================================================================

  Cascadia Subduction Zone Earthquake (M9.0+):
    - Estimated cellular tower survival: 30-50%
    - Fiber cuts: extensive (liquefaction, landslides)
    - Power outage: widespread, weeks to months in some areas
    - Backhaul failure: microwave towers may survive if
      structures intact, but no power
    - Mesh response: LoRa/Meshtastic for text, Wi-Fi mesh
      for data at community gathering points

  Wildfire evacuation:
    - Cell towers destroyed or power cut
    - Evacuation routes may have no coverage
    - Mesh: Meshtastic nodes placed along evacuation routes
    - Vehicle-mounted repeaters (mobile mesh relay)

  Tsunami (coastal OR/WA):
    - Cable landing stations at risk
    - Coastal cell towers destroyed
    - DTN: messages carried by evacuees inland
    - Satellite: Starlink/Iridium for emergency coordination

  Lahar (Mt. Rainier):
    - USGS lahar detection system uses radio telemetry
    - Cellular infrastructure in river valleys destroyed
    - Mesh: pre-deployed LoRa warning network
```

### Emergency Communication Standards

- **ARES/RACES:** Amateur Radio Emergency Service -- ham radio operators providing backup communication [17]
- **NIMS/ICS:** National Incident Management System communication requirements
- **FirstNet (Band 14):** Dedicated LTE band for first responders
- **GMRS:** General Mobile Radio Service -- license-free UHF radio, commonly used for community emergency communication

---

## 9. Burning Man Mesh Deployments

Black Rock City provides a unique proving ground for mesh communications: 80,000+ people in a desert with zero permanent infrastructure [18].

```
BURNING MAN MESH INFRASTRUCTURE
================================================================

  Challenges:
    - No commercial cellular service (limited satellite backhaul)
    - Extreme dust, heat (120°F), wind
    - 70,000+ potential users
    - 7-day deployment, total teardown (Leave No Trace)
    - Power: generator + solar only

  Deployed systems:
    - Burning Man Information Radio (BMIR 94.5 FM)
    - Wi-Fi mesh at some large camps
    - Meshtastic LoRa networks (growing since 2023)
    - Amateur radio repeaters (ham radio community)
    - Satellite uplinks (limited, shared)

  Meshtastic at Burning Man:
    - Pre-deployed relay nodes on art cars, tall structures
    - Camp-to-camp text messaging
    - GPS position sharing (find your friends in the dust)
    - No infrastructure dependency
    - Proven: 5-15 km range in flat desert terrain

  Proof of concept for:
    - Event-scale mesh communication
    - Infrastructure-free connectivity
    - Community self-organizing networks
    - Trust: who are you talking to? (encryption + identity)
```

> **Related:** [BRC (Black Rock City)](../BRC/index.html) for the virtual BRC research project. This is the physical communications layer that would support the virtual event infrastructure.

---

## 10. PNW Mesh Initiatives

The Pacific Northwest has active mesh networking communities driven by both urban tech culture and rural necessity [19].

### Seattle Mesh

Seattle has an emerging community mesh effort inspired by NYC Mesh, focused on connecting underserved neighborhoods and providing infrastructure-independent communication [20].

```
PNW MESH NETWORK INITIATIVES
================================================================

  Seattle Mesh:
    - Inspired by NYC Mesh model
    - Focus: digital equity in underserved neighborhoods
    - Technology: Wi-Fi point-to-point + mesh distribution
    - Status: early deployment (2023-present)

  Portland Mesh:
    - Community interest group
    - Meshtastic deployments in Portland metro
    - Emergency preparedness focus (Cascadia earthquake)

  PNW Meshtastic Community:
    - Active LoRa mesh network across Puget Sound region
    - Nodes on hills, tall buildings, mountain peaks
    - Coverage extends from Bellingham to Olympia
    - Growing: 100+ nodes deployed (est. 2025)

  Rural WA/OR Meshtastic:
    - Ranch-to-ranch communication in eastern WA/OR
    - Supplementing poor cellular coverage
    - Agricultural telemetry (water levels, weather)
    - Forest fire early warning (temperature sensors)

  San Juan Islands Mesh:
    - Island-to-island communication
    - LoRa links across water (excellent LOS)
    - Marine emergency communication supplement
```

### PNW Terrain Advantage for LoRa

The PNW's geography offers excellent LoRa mesh potential:
- **Puget Sound hilltops:** Line-of-sight across water to islands and peninsulas
- **Cascade foothills:** Elevated relay positions overlooking valleys
- **River valleys:** Long, clear corridors for signal propagation
- **Desert (eastern WA/OR):** Flat, dry terrain with minimal attenuation

---

## 11. Future: Mesh-Native Device Architecture

Current smartphones treat mesh communication as an afterthought -- an app running on top of Bluetooth or Wi-Fi. A mesh-native device would build mesh routing into the hardware and firmware layer [21].

```
MESH-NATIVE DEVICE ARCHITECTURE (CONCEPTUAL)
================================================================

  ┌─────────────────────────────────────────────┐
  │              APPLICATION LAYER               │
  │  Messaging, VoIP, file sharing, maps         │
  └────────────────────┬────────────────────────┘
                       │
  ┌────────────────────┴────────────────────────┐
  │              MESH ROUTING LAYER              │
  │  B.A.T.M.A.N. / AODV / custom protocol      │
  │  Store-and-forward (DTN)                     │
  │  Encryption (per-link + end-to-end)          │
  │  Identity (web-of-trust, not certificates)   │
  └────────────────────┬────────────────────────┘
                       │
  ┌────────────────────┴────────────────────────┐
  │              MULTI-RADIO LAYER               │
  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
  │  │ LoRa │ │ WiFi │ │ BLE  │ │ Cell │       │
  │  │915MHz│ │2.4/5 │ │Mesh  │ │Side- │       │
  │  │      │ │ GHz  │ │5.0   │ │link  │       │
  │  └──────┘ └──────┘ └──────┘ └──────┘       │
  │                                              │
  │  Adaptive radio selection:                   │
  │    LoRa: long range, low rate (text, GPS)    │
  │    WiFi: medium range, high rate (files, web)│
  │    BLE:  short range, low power (proximity)  │
  │    Cell: infrastructure fallback             │
  └──────────────────────────────────────────────┘

  Key design principles:
    1. Mesh-first: try peer-to-peer before infrastructure
    2. Multi-radio: use best available path automatically
    3. Store-and-forward: tolerate disconnection
    4. End-to-end encryption: mandatory, no opt-out
    5. Identity: web-of-trust (stamps, vouching) not CA
    6. Incentive: relay for others, earn relay credits
```

### Integration with Trust Systems

A mesh-native device needs a trust system that works without centralized certificate authorities. Web-of-trust models -- where users vouch for each other's identity through direct relationships -- are naturally suited to mesh networks because they mirror the network topology: you trust the people you can directly reach, and transitively trust those they vouch for [22].

> **Related:** [Telephone History](01-telephone-history-switching.md) for the centralized infrastructure model that mesh communications replaces. [Cellular Evolution](02-cellular-evolution-1g-5g.md) for 5G Sidelink as partial mesh. [VoIP & SIP](03-voip-sip-convergence.md) for voice-over-mesh implementation. [PNW Telecom Heritage](05-pnw-telecom-heritage.md) for rural areas where mesh fills coverage gaps.

---

## 12. Cross-References

- **CMH (Computational Mesh):** Mesh routing protocols directly applicable to compute mesh coordination
- **BRC (Black Rock City):** Burning Man mesh as proof-of-concept for event-scale mesh communication
- **PSS (PNW Signal Stack):** PNW mesh as complement to cellular and wireline signal infrastructure
- **SHE (Smart Home):** Home mesh (802.11s, BLE mesh) as foundation for smart home networking
- **SYS (Systems Admin):** Network administration of mesh infrastructure, monitoring, diagnostics
- **RBH (Radio History):** Amateur radio mesh (AREDN), shared spectrum heritage
- **LED (LED & Controllers):** LoRa/Meshtastic telemetry for LED installation control
- **FCC:** ISM band regulations, GMRS licensing, amateur radio mesh (Part 97)

---

## 13. Sources

1. Akyildiz, I.F. and Wang, X. "A Survey on Wireless Mesh Networks." *IEEE Communications Magazine* 43.9 (2005): S23-S30.
2. Draves, R., Padhye, J., and Zill, B. "Routing in Multi-Radio, Multi-Hop Wireless Mesh Networks." *ACM MobiCom '04,* 2004: 114-128.
3. Li, J., Blake, C., De Couto, D.S.J., Lee, H.I., and Morris, R. "Capacity of Ad Hoc Wireless Networks." *ACM MobiCom '01,* 2001: 61-69.
4. Abolhasan, M., Wysocki, T., and Dutkiewicz, E. "A Review of Routing Protocols for Mobile Ad Hoc Networks." *Ad Hoc Networks* 2.1 (2004): 1-22.
5. Clausen, T. and Jacquet, P. "Optimized Link State Routing Protocol (OLSR)." IETF RFC 3626, October 2003.
6. Neumann, A., Aichele, C., Lindner, M., and Wunderlich, S. "Better Approach To Mobile Ad-hoc Networking (B.A.T.M.A.N.)." IETF Internet-Draft, 2008. open-mesh.org.
7. Perkins, C., Belding-Royer, E., and Das, S. "Ad hoc On-Demand Distance Vector (AODV) Routing." IETF RFC 3561, July 2003.
8. Semtech Corporation. "LoRa Modulation Basics." Semtech AN1200.22, Revision 2, 2015.
9. Meshtastic. "Meshtastic Documentation." meshtastic.org, 2025.
10. IEEE 802.11s-2011, "Amendment 10: Mesh Networking."
11. Camps-Mur, D., Garcia-Saavedra, A., and Serrano, P. "Device-to-Device Communications with Wi-Fi Direct." *IEEE Wireless Communications* 20.3 (2013): 96-104.
12. 3GPP TS 38.300, "NR; Overall Description." Section on Sidelink communication.
13. Fall, K. "A Delay-Tolerant Network Architecture for Challenged Internets." *ACM SIGCOMM '03,* 2003: 27-34.
14. Brewer, E. et al. "The Case for Technology in Developing Regions." *IEEE Computer* 38.6 (2005): 25-38.
15. Baig, R. et al. "Guifi.net, a Crowdsourced Network Infrastructure Held in Common." *Computer Networks* 90 (2015): 150-165.
16. Nelson, C.B. "Emergency Communications When Infrastructure Fails." *IEEE Communications Magazine* 53.1 (2015): 36-43.
17. ARRL. "Amateur Radio Emergency Communication." ARRL Emergency Communication Handbook, 2022.
18. Black Rock City LLC. "Burning Man Communications." burningman.org.
19. Institute for Local Self-Reliance. "Community Networks in the Pacific Northwest." communitybroadbandnetworks.org, 2024.
20. SeattleMesh. "Seattle Mesh Community Network." seattlemesh.net, 2025.
21. Bahl, P. et al. "White Space Networking with Wi-Fi like Connectivity." *ACM SIGCOMM '09,* 2009: 27-38.
22. Zimmermann, P. "Web of Trust." *PGP User's Guide, Volume I,* MIT Press, 1994.
