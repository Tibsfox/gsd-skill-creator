# Routing & Switching Operations

> **Domain:** Systems Network Engineering
> **Module:** 2 -- BGP, IGP, VLAN, VRF, MPLS, EVPN-VXLAN & SD-WAN
> **Through-line:** *A network's control plane is a distributed database that converges on a shared view of reachability. BGP is the slow, cautious diplomat negotiating between autonomous systems. OSPF and IS-IS are the town criers flooding news within one domain. MPLS is the postal service that stamps labels and forwards without looking inside. EVPN-VXLAN is the modern overlay that decouples where things are from how to reach them. The operational discipline is knowing which plane you are troubleshooting and which knob you are turning.*

---

## Table of Contents

1. [Control Plane vs Data Plane](#1-control-plane-vs-data-plane)
2. [BGP Operations](#2-bgp-operations)
3. [BGP Route Filtering](#3-bgp-route-filtering)
4. [BGP Communities and Traffic Engineering](#4-bgp-communities-and-traffic-engineering)
5. [Route Origin Validation: IRR and RPKI](#5-route-origin-validation-irr-and-rpki)
6. [OSPF Area Design](#6-ospf-area-design)
7. [IS-IS for Data Center](#7-is-is-for-data-center)
8. [IGP Comparison Table](#8-igp-comparison-table)
9. [VLAN Architecture](#9-vlan-architecture)
10. [VRF Segmentation](#10-vrf-segmentation)
11. [MPLS Fundamentals and L3VPN](#11-mpls-fundamentals-and-l3vpn)
12. [EVPN-VXLAN for Data Center Overlay](#12-evpn-vxlan-for-data-center-overlay)
13. [SD-WAN Overlay Engineering](#13-sd-wan-overlay-engineering)
14. [Operational Decision Matrix](#14-operational-decision-matrix)
15. [Cross-References](#15-cross-references)
16. [Sources](#16-sources)

---

## 1. Control Plane vs Data Plane

Every network device operates across three distinct planes, and conflating them is the root cause of most operational misunderstanding. The control plane builds the forwarding information base (FIB). The data plane moves packets using that FIB. The management plane is you, typing commands or pushing API calls.

```
THE THREE PLANES OF NETWORK OPERATION
================================================================

  MANAGEMENT PLANE
  +-------------------------------------------------+
  |  CLI / API / NMS / Ansible / NETCONF            |
  |  Human or automation configures policy           |
  |  Runs on general-purpose CPU                     |
  +-------------------------------------------------+
         |  Configuration
         v
  CONTROL PLANE
  +-------------------------------------------------+
  |  BGP / OSPF / IS-IS / STP / VRRP / BFD         |
  |  Routing protocols exchange reachability info     |
  |  Builds RIB -> compiles FIB                      |
  |  Runs on route processor (CPU)                   |
  +-------------------------------------------------+
         |  FIB / LFIB / MAC table
         v
  DATA PLANE (FORWARDING PLANE)
  +-------------------------------------------------+
  |  Packet lookup -> forward / drop / encapsulate   |
  |  ASIC / MEMORY / TCAM / NPU                     |
  |  Wire-speed, per-packet decisions                |
  |  No protocol intelligence, just table lookups    |
  +-------------------------------------------------+
```

### Operational Implications

**Control plane protection** is critical. A DDoS attack targeting the route processor (e.g., flooding BGP OPEN messages) can crash routing, even though the data plane ASICs are barely loaded. CoPP (Control Plane Policing) rate-limits traffic destined to the CPU, protecting protocol adjacencies [1].

**Data plane independence** means that when a control plane reconverges after a link failure, the data plane continues forwarding on stale FIB entries until updated. This is the basis of Graceful Restart (GR) and Non-Stop Forwarding (NSF) -- the data plane keeps working while the control plane reboots.

**Troubleshooting discipline:** When packets are being dropped, first determine which plane is failing. If `show ip route` shows the correct path but packets still drop, the problem is data plane (ACL, MTU, TCAM overflow). If the route is missing, the problem is control plane (adjacency, filtering, redistribution). If you cannot log in, the problem is management plane.

---

## 2. BGP Operations

BGP (Border Gateway Protocol) version 4 is the sole exterior gateway protocol of the Internet, specified in RFC 4271 (2006) with updates through RFC 9234 (2022) for route leak prevention. BGP is a path-vector protocol that makes policy decisions based on AS_PATH, communities, MED, and local preference rather than pure shortest-path calculation [2].

### eBGP Peering

External BGP peers reside in different autonomous systems. The default eBGP TTL is 1, meaning peers must be directly connected unless multihop is configured. eBGP modifies the AS_PATH on every advertisement, which provides natural loop prevention.

```
eBGP PEERING -- CISCO IOS-XE
================================================================

router bgp 65001
 bgp log-neighbor-changes
 neighbor 198.51.100.1 remote-as 65002
 neighbor 198.51.100.1 description Transit-Provider-Alpha
 neighbor 198.51.100.1 password 7 <encrypted>
 !
 address-family ipv4 unicast
  neighbor 198.51.100.1 activate
  neighbor 198.51.100.1 route-map TRANSIT-IN in
  neighbor 198.51.100.1 route-map TRANSIT-OUT out
  neighbor 198.51.100.1 prefix-list BOGONS in
  neighbor 198.51.100.1 maximum-prefix 750000 85
 exit-address-family
```

```
eBGP PEERING -- JUNIPER JUNOS
================================================================

protocols {
    bgp {
        group transit-alpha {
            type external;
            peer-as 65002;
            neighbor 198.51.100.1 {
                description "Transit Provider Alpha";
                authentication-key "$9$encrypted";
                import transit-in;
                export transit-out;
                prefix-limit {
                    maximum 750000;
                    teardown 85;
                }
            }
        }
    }
}
```

### iBGP and Route Reflectors

Internal BGP peers share the same AS number. iBGP has a critical rule: routes learned from one iBGP peer are never advertised to another iBGP peer. This prevents loops but requires a full mesh of iBGP sessions (N*(N-1)/2 peers), which does not scale. Route reflectors (RFC 4456) solve this by allowing a designated router to reflect routes to its clients [3].

```
iBGP WITH ROUTE REFLECTORS
================================================================

                     +----------+
                     |  RR-1    |  (route reflector)
                     |  AS 65001|
                     +----+-----+
                    /     |      \
                   /      |       \     RR-client sessions
                  /       |        \
          +------+  +-----+--+  +---+----+
          | PE-1 |  |  PE-2  |  | PE-3   |
          +------+  +--------+  +--------+
          Client     Client      Client

    RR reflects routes from one client to all other clients.
    Non-client peers still require full mesh among themselves.
    Two RR clusters recommended for redundancy.
```

### Looking Glasses and Route Servers

Looking glasses are public web interfaces that allow anyone to query a network's BGP table without direct access. Major ones include RIPE RIS (ris.ripe.net), RouteViews (routeviews.org), and Hurricane Electric (bgp.he.net). Route servers at Internet Exchange Points (IXPs) provide multilateral peering, reducing the number of bilateral eBGP sessions from O(n^2) to O(n) [4].

---

## 3. BGP Route Filtering

Route filtering is the primary mechanism for implementing BGP policy. Accepting all routes from all peers without filtering is the equivalent of running a mail server with no spam filter.

### Prefix Lists

Prefix lists match on network address and prefix length. They are evaluated sequentially with an implicit deny at the end.

```
PREFIX LIST FILTERING -- CISCO IOS
================================================================

! Accept only prefixes between /8 and /24 from transit
ip prefix-list TRANSIT-PREFIXES seq 5 permit 0.0.0.0/0 ge 8 le 24
!
! Deny RFC 1918 and bogon space
ip prefix-list BOGONS seq 5 deny 10.0.0.0/8 le 32
ip prefix-list BOGONS seq 10 deny 172.16.0.0/12 le 32
ip prefix-list BOGONS seq 15 deny 192.168.0.0/16 le 32
ip prefix-list BOGONS seq 20 deny 100.64.0.0/10 le 32
ip prefix-list BOGONS seq 25 deny 0.0.0.0/0
ip prefix-list BOGONS seq 30 deny 0.0.0.0/0 ge 25
ip prefix-list BOGONS seq 100 permit 0.0.0.0/0 le 32
```

### AS-Path Filters

AS-path access lists use regular expressions to match the AS_PATH attribute. They are essential for preventing route leaks and enforcing peer relationships.

```
AS-PATH FILTERING
================================================================

! Accept only routes originated by the peer (single AS in path)
ip as-path access-list 10 permit ^65002$
!
! Accept routes transiting through the peer
ip as-path access-list 20 permit ^65002_
!
! Deny routes with private AS numbers in the path
ip as-path access-list 30 deny _6451[2-9]_
ip as-path access-list 30 deny _6452[0-9]_
ip as-path access-list 30 deny _6453[0-5]_
ip as-path access-list 30 deny _65[0-9][0-9][0-9]_
ip as-path access-list 30 permit .*
```

### Filtering Best Practices

| Filter Type | Applied Where | Purpose |
|---|---|---|
| Prefix list (inbound) | All eBGP peers | Block bogons, too-specific prefixes, own prefixes |
| Prefix list (outbound) | All eBGP peers | Advertise only owned prefixes |
| AS-path filter (inbound) | Customer peers | Accept only customer-originated routes |
| AS-path filter (outbound) | Transit peers | Prevent becoming a transit for peers |
| Maximum prefix limit | All eBGP peers | Protect against route table explosion |
| ORF (Outbound Route Filtering) | Large peering | Push filters to the sender to reduce update volume |

---

## 4. BGP Communities and Traffic Engineering

BGP communities are transitive attributes that tag routes with metadata. They are the primary mechanism for signaling policy between ASes without direct configuration on the remote router. Three types exist: standard (RFC 1997), extended (RFC 4360), and large (RFC 8092) [5][6].

### Standard Communities (RFC 1997)

Standard communities are 32-bit values typically written as ASN:VALUE. Four well-known communities have globally defined behavior:

| Community | Value | Behavior |
|---|---|---|
| NO_EXPORT | 0xFFFFFF01 | Do not advertise to eBGP peers |
| NO_ADVERTISE | 0xFFFFFF02 | Do not advertise to any peer (iBGP or eBGP) |
| NO_EXPORT_SUBCONFED | 0xFFFFFF03 | Do not advertise outside the local confederation sub-AS |
| NOPEER | 0xFFFFFF04 | Do not advertise to bilateral peers (RFC 3765) |

RFC 8642 clarifies that well-known communities must not be stripped or modified by any BGP speaker, even in the absence of explicit policy.

### Large Communities (RFC 8092)

Large communities use a 96-bit format: GlobalAdmin:LocalData1:LocalData2, where the global administrator is a full 32-bit ASN. This solves the namespace collision problem that standard communities face with 32-bit ASNs, where the 16-bit ASN field in standard communities cannot represent ASNs above 65535.

### Traffic Engineering with Communities

Communities enable traffic engineering by signaling intent from the customer to the provider. Common patterns:

```
COMMUNITY-BASED TRAFFIC ENGINEERING
================================================================

! Provider AS 65001 defines action communities:
!   65001:100  = Announce to all peers
!   65001:200  = Announce to transit only
!   65001:300  = Announce to IXP peers only
!   65001:666  = Blackhole this prefix
!   65001:1nnn = Prepend 1x to peer ASN nnn
!   65001:2nnn = Prepend 2x to peer ASN nnn
!   65001:3nnn = Prepend 3x to peer ASN nnn
!   65001:9nnn = Do not announce to peer ASN nnn

! Customer sets community to prepend 2x toward AS 65010:
router bgp 65050
 route-map ANNOUNCE-TO-TRANSIT permit 10
  set community 65001:2010 additive
  match ip address prefix-list MY-PREFIXES
```

### Blackhole Communities

RTBH (Remotely Triggered Black Hole) routing uses communities to signal upstream providers to drop traffic destined for an attacked prefix. RFC 7999 defines the well-known blackhole community (BLACKHOLE, 65535:666). A customer advertises a /32 host route with this community, and the provider installs a null route, dropping attack traffic at the network edge rather than the victim [7].

---

## 5. Route Origin Validation: IRR and RPKI

Route origin validation answers one question: is this AS authorized to originate this prefix? Without it, any AS can announce any prefix, and BGP will happily propagate the hijack.

### Internet Routing Registry (IRR)

IRR databases (RADB, RIPE, ARIN, APNIC, AfriNIC) store route objects that declare which ASes may originate which prefixes. Operators query IRR to build prefix filters.

```
IRR ROUTE OBJECT
================================================================

route:       203.0.113.0/24
descr:       Example Network
origin:      AS65001
mnt-by:      MAINT-EXAMPLE
source:      RADB
```

The IRR system's weakness is that registration is voluntary, objects go stale, and some databases do not require proof of address ownership. This makes IRR necessary but insufficient.

### RPKI (Resource Public Key Infrastructure)

RPKI is the cryptographic successor to IRR. It uses X.509 certificates chained to the five Regional Internet Registries (RIRs) as trust anchors. A Route Origin Authorization (ROA) is a signed object that states: "prefix P of maximum length L is authorized to be originated by AS A" [8].

```
RPKI VALIDATION STATES
================================================================

  Route         ROA           Result
  -------       -------       --------
  203.0.113.0/24  AS65001/24  VALID    -- prefix and AS match ROA
  203.0.113.0/24  AS65099/24  INVALID  -- AS does not match ROA
  198.51.100.0/24 (no ROA)    UNKNOWN  -- no ROA exists for this prefix
  203.0.113.0/25  AS65001/24  INVALID  -- /25 exceeds maxLength /24
```

### ROV Deployment

Route Origin Validation (ROV) is the act of checking received BGP routes against RPKI data and acting on the result. As of early 2026, approximately 393,000 IPv4 and 86,000 IPv6 ROAs exist in the global RPKI system, covering roughly 40% of routed prefix-AS pairs. However, only about 12% of ASes perform full ROV with reject-invalid policy. The FCC now requires large US providers to file BGP security plans, including ROA coverage targets of 90% or higher [8].

```
RPKI ROV -- CISCO IOS-XE
================================================================

router bgp 65001
 bgp rpki server tcp 10.0.0.50 port 8282 refresh 300
 !
 address-family ipv4 unicast
  ! Drop RPKI-invalid routes
  neighbor 198.51.100.1 route-map RPKI-FILTER in
!
route-map RPKI-FILTER deny 10
 match rpki invalid
route-map RPKI-FILTER permit 20
 ! VALID and UNKNOWN both accepted; prefer VALID with higher local-pref
 set local-preference 200
 match rpki valid
route-map RPKI-FILTER permit 30
```

---

## 6. OSPF Area Design

OSPF (Open Shortest Path First) version 2 (RFC 2328 for IPv4) and version 3 (RFC 5340 for IPv6) is the most widely deployed IGP in enterprise networks. OSPF divides an autonomous system into areas to limit the scope of link-state flooding and SPF calculations. Area 0 (backbone) is mandatory and all other areas must connect to it, either directly or through virtual links [9].

### Area Types

| Area Type | Type 1/2 LSAs | Type 3 LSAs | Type 4/5 LSAs | Type 7 LSAs | Default Route | ASBR Allowed |
|---|---|---|---|---|---|---|
| Normal | Yes | Yes | Yes | No | Optional | Yes |
| Stub | Yes | Yes | No | No | Injected by ABR | No |
| Totally Stubby | Yes | No (default only) | No | No | Injected by ABR | No |
| NSSA | Yes | Yes | No | Yes (translated to Type 5 at ABR) | Optional | Yes (Type 7) |
| Totally NSSA | Yes | No (default only) | No | Yes (translated to Type 5 at ABR) | Injected by ABR | Yes (Type 7) |

### When to Use Each Area Type

**Stub areas** are appropriate for branch offices or remote sites with a single exit point. They filter external routes (Type 5 LSAs), replacing them with a default route from the ABR. This shrinks the LSDB and routing table on stub routers.

**Totally stubby areas** go further by also filtering inter-area summary routes (Type 3 LSAs). Only intra-area routes and a single default route remain. Use these for truly leaf sites that need no knowledge of the broader topology.

**NSSA (Not-So-Stubby Area)** solves a specific problem: you need stub-area benefits (no external routes from the core) but you also have a local ASBR that must redistribute external routes into OSPF. The ASBR generates Type 7 LSAs, which propagate within the NSSA. The ABR translates Type 7 to Type 5 for flooding into the rest of the OSPF domain [10].

**Virtual links** are a workaround, not a design pattern. They create a logical tunnel through a transit area to connect a discontiguous area to the backbone. The transit area must be a normal area (not stub or NSSA). If you find yourself needing a virtual link, reconsider the physical topology first.

```
OSPF AREA DESIGN -- CISCO IOS
================================================================

router ospf 1
 router-id 10.0.0.1
 !
 ! Area 0 -- backbone
 network 10.0.0.0 0.0.0.255 area 0
 !
 ! Area 10 -- stub (branch site, single exit)
 area 10 stub
 network 10.10.0.0 0.0.255.255 area 10
 !
 ! Area 20 -- NSSA (has local ASBR redistributing static)
 area 20 nssa default-information-originate
 network 10.20.0.0 0.0.255.255 area 20
 !
 ! Area 30 -- totally stubby (leaf site)
 area 30 stub no-summary
 network 10.30.0.0 0.0.255.255 area 30
```

---

## 7. IS-IS for Data Center

IS-IS (Intermediate System to Intermediate System) is an ISO link-state protocol (ISO 10589) adapted for IP routing in RFC 1195 and extended through numerous RFCs. While OSPF dominates enterprise networks, IS-IS has become the preferred IGP underlay for large-scale data center fabrics, particularly at hyperscaler and tier-1 service provider scale [11].

### Why IS-IS in the Data Center

**No area 0 requirement.** IS-IS has no mandatory backbone area. The "backbone" is simply the contiguous set of Level 2 routers. Areas are defined per-router (a router is in one area), not per-link (OSPF assigns areas to interfaces). This simplifies spine-leaf designs where every spine is L2 and every leaf is L1/L2 or L1.

**TLV extensibility.** IS-IS encodes all information as Type-Length-Value triplets, making it straightforward to add new capabilities without protocol changes. IPv6 support, traffic engineering extensions, and segment routing SIDs were all added as new TLVs without touching the core protocol.

**Wide metrics.** Original IS-IS metrics were 6-bit (0-63), far too narrow for modern networks. RFC 3784 defines wide metrics as 24-bit (0-16,777,215), enabling fine-grained traffic engineering. Wide metrics are mandatory in any modern IS-IS deployment.

**Protocol independence from IP.** IS-IS runs directly over Layer 2 (ISO CLNP), not over IP. This means IS-IS adjacencies form even when IP is misconfigured, which can be both an advantage (bootstrapping) and a risk (harder to filter).

### Level 1 / Level 2 Hierarchy

| Level | Scope | Equivalent OSPF Concept | DC Role |
|---|---|---|---|
| Level 1 (L1) | Intra-area routing within a single IS-IS area | OSPF intra-area routes | Leaf-to-spine within a pod |
| Level 2 (L2) | Inter-area routing across the IS-IS backbone | OSPF area 0 / inter-area | Spine-to-spine, super-spine |
| Level 1/2 (L1/L2) | Router participates in both levels | OSPF ABR | Spine routers connecting pods to backbone |

```
IS-IS SPINE-LEAF UNDERLAY -- ARISTA EOS
================================================================

router isis DC-FABRIC
   net 49.0001.0100.0000.0001.00
   is-type level-2-only
   !
   address-family ipv4 unicast
   !
   address-family ipv6 unicast
!
interface Ethernet1
   description to-leaf-1
   isis enable DC-FABRIC
   isis metric 10
   isis network point-to-point
!
! All links as point-to-point eliminates DIS election overhead.
! Level-2-only is standard for flat DC fabrics (no L1/L2 boundary).
! Wide metrics enabled by default on modern implementations.
```

### Data Center IS-IS Design Principles

1. **Use level-2-only** for flat spine-leaf fabrics. L1/L2 hierarchy adds complexity without benefit when the fabric is a single administrative domain.
2. **Point-to-point links everywhere.** Spine-leaf links are always point-to-point. Configuring them as such avoids DIS (Designated Intermediate System) election and reduces LSP flooding.
3. **BFD for sub-second failure detection.** IS-IS hello timers default to 10 seconds. BFD provides 50ms detection, critical for data center convergence targets.
4. **Overload bit for maintenance.** Setting the IS-IS overload bit (`set-overload-bit`) causes other routers to avoid transiting through this router, enabling graceful maintenance.

---

## 8. IGP Comparison Table

| Feature | OSPF v2/v3 | IS-IS | eBGP (as DC underlay) |
|---|---|---|---|
| Algorithm | Dijkstra SPF | Dijkstra SPF | Best path selection (not SPF) |
| Runs over | IP (protocol 89) | Layer 2 (ISO) | TCP port 179 |
| Area model | Per-interface | Per-router | No areas (AS-based) |
| Backbone requirement | Area 0 mandatory | L2 backbone (implicit) | None |
| Metric width | 16-bit (24-bit TE) | 24-bit (wide) | Multiple attributes |
| Authentication | MD5, SHA (RFC 5709) | HMAC-MD5, generic crypto | MD5, TCP-AO |
| IPv6 support | Separate protocol (OSPFv3) | TLV extension (same protocol) | Same protocol (AFI/SAFI) |
| Segment routing | Yes (OSPFv2/v3 extensions) | Yes (TLV extensions) | Not applicable (overlay) |
| Scaling limit (practical) | ~100 routers per area | ~100 routers per level | Thousands (no flooding) |
| Primary use case | Enterprise campus, mid-size DC | Large DC, SP core | Hyperscale DC underlay (RFC 7938) |

RFC 7938 documents the use of eBGP as the sole routing protocol for data center fabrics at hyperscale, eliminating IGP entirely. Each rack or leaf gets a unique private ASN, and eBGP sessions run on every spine-leaf link. This approach scales to thousands of switches because BGP has no flooding domain [12].

---

## 9. VLAN Architecture

VLANs (Virtual Local Area Networks, IEEE 802.1Q) segment a physical switch into multiple broadcast domains. The 12-bit VLAN ID field supports 4,094 usable VLANs (1-4094, with 0 and 4095 reserved).

### Access and Trunk Ports

| Port Mode | Function | Tagged Frames | Untagged Frames |
|---|---|---|---|
| Access | Connects end hosts | Strips tag, assigns to configured VLAN | Accepted, placed in port VLAN |
| Trunk | Connects switches | Passes all allowed VLANs with 802.1Q tag | Placed in native VLAN |

### Native VLAN Security

The native VLAN is the VLAN used for untagged frames on a trunk port. The default is VLAN 1. This creates a well-known attack vector: **VLAN hopping** via double-tagging (802.1Q-in-802.1Q). An attacker on an access port in VLAN 1 sends a frame with two 802.1Q tags. The first switch strips the outer tag (native VLAN), and the second switch forwards based on the inner tag, delivering the frame to a VLAN the attacker should not reach [13].

**Mitigation:**

```
NATIVE VLAN HARDENING -- CISCO IOS
================================================================

! 1. Change native VLAN to an unused VLAN
interface GigabitEthernet0/1
 switchport trunk native vlan 999
!
! 2. Tag native VLAN frames explicitly
vlan dot1q tag native
!
! 3. Prune all VLANs not needed on each trunk
interface GigabitEthernet0/1
 switchport trunk allowed vlan 10,20,30
!
! 4. Disable DTP negotiation
interface GigabitEthernet0/1
 switchport nonegotiate
!
! 5. Put unused ports in a black-hole VLAN and shut them down
interface range GigabitEthernet0/10-24
 switchport access vlan 998
 shutdown
```

### VLAN Pruning

VTP (VLAN Trunking Protocol) pruning or manual pruning with `switchport trunk allowed vlan` restricts which VLANs are carried on each trunk link. Without pruning, every broadcast, unknown unicast, and multicast frame floods across every trunk in the VTP domain, wasting bandwidth and violating the principle of least privilege.

---

## 10. VRF Segmentation

VRF (Virtual Routing and Forwarding) creates isolated routing instances on a single physical router. Each VRF maintains its own RIB, FIB, and set of interfaces. VRF-Lite is the basic form without MPLS; full VRF with MPLS enables L3VPN across a provider backbone [14].

### Multi-Tenancy Design

```
VRF SEGMENTATION -- MULTI-TENANT
================================================================

  Physical Router
  +------------------------------------------------+
  |                                                  |
  |  VRF: TENANT-A          VRF: TENANT-B           |
  |  +------------------+   +------------------+    |
  |  | RIB: 10.0.0.0/8  |   | RIB: 10.0.0.0/8 |    |
  |  | Interface: Gi0/1 |   | Interface: Gi0/2 |    |
  |  | Default via .1   |   | Default via .1   |    |
  |  +------------------+   +------------------+    |
  |                                                  |
  |  VRF: MANAGEMENT        Global routing table     |
  |  +------------------+   +------------------+    |
  |  | OOB management   |   | Internet/transit |    |
  |  | Interface: Gi0/0 |   | Interface: Gi0/3 |    |
  |  +------------------+   +------------------+    |
  +------------------------------------------------+

  Each VRF has completely independent routing.
  10.0.0.0/8 in TENANT-A is different from 10.0.0.0/8 in TENANT-B.
  Route leaking between VRFs requires explicit configuration.
```

```
VRF CONFIGURATION -- CISCO IOS-XE
================================================================

vrf definition TENANT-A
 rd 65001:100
 address-family ipv4
  route-target export 65001:100
  route-target import 65001:100
 exit-address-family
!
interface GigabitEthernet0/1
 vrf forwarding TENANT-A
 ip address 10.1.1.1 255.255.255.0
!
router bgp 65001
 address-family ipv4 vrf TENANT-A
  neighbor 10.1.1.2 remote-as 65100
  neighbor 10.1.1.2 activate
 exit-address-family
```

### VRF Use Cases

| Use Case | Implementation | Benefit |
|---|---|---|
| Multi-tenancy | Separate VRF per tenant | Overlapping IP space, isolation |
| Security zones | VRF per zone (DMZ, internal, guest) | Enforce traffic through firewall |
| Management OOB | Dedicated management VRF | Management traffic isolated from production |
| Shared services | Route leaking to a shared VRF | Centralized DNS, NTP, monitoring accessible by all tenants |
| Compliance | PCI/HIPAA scoped to a VRF | Audit scope reduced to specific VRF |

---

## 11. MPLS Fundamentals and L3VPN

MPLS (Multiprotocol Label Switching) inserts a 32-bit label header between the Layer 2 and Layer 3 headers. Label Distribution Protocol (LDP, RFC 5036) or RSVP-TE distributes labels. Routers perform label operations (push, swap, pop) rather than IP longest-prefix-match lookups, enabling traffic engineering and VPN services [15].

### Label Operations

```
MPLS LABEL STACK
================================================================

  +----------+-----------+-----------+----------+
  | L2 Header| MPLS Label| IP Header | Payload  |
  +----------+-----------+-----------+----------+
               |
               v
  +--------+---+----+---+---+
  | Label  | TC | S | TTL   |  32 bits total
  | 20 bit | 3b | 1 | 8 bit |
  +--------+----+---+-------+
  
  Label:  Switching identifier (0-1,048,575)
  TC:     Traffic Class (QoS, formerly EXP)
  S:      Bottom of Stack (1 = last label)
  TTL:    Time to live (decremented at each hop)

  Operations:
  PUSH  -- Ingress PE adds label(s) to packet
  SWAP  -- Transit P router swaps top label
  POP   -- Egress PE (or penultimate hop) removes label
```

### L3VPN Architecture (RFC 4364)

MPLS L3VPN allows a service provider to offer private IP routing to customers over a shared MPLS backbone. The architecture has three roles:

| Role | Device | Function |
|---|---|---|
| CE (Customer Edge) | Customer router | Peers with PE via eBGP, OSPF, or static |
| PE (Provider Edge) | Provider edge router | Maintains per-customer VRF, exchanges VPNv4 routes via MP-BGP |
| P (Provider) | Core router | Label switches only, no customer route knowledge |

**Route Distinguisher (RD)** is a 64-bit value prepended to customer IPv4 prefixes to create globally unique VPNv4 addresses. Format: ASN:NN or IP:NN. The RD's sole purpose is uniqueness; it does not affect route import/export.

**Route Target (RT)** is a BGP extended community that defines VPN membership. `route-target export` tags routes leaving a VRF. `route-target import` controls which tagged routes a VRF will accept. The RT is the policy mechanism; the RD is the uniqueness mechanism. They are frequently confused but serve entirely different purposes [16].

```
L3VPN DATA FLOW
================================================================

  Customer A               MPLS Backbone              Customer A
  Site 1                                               Site 2
  
  [CE1]---eBGP---[PE1]====MPLS=====[PE2]---eBGP---[CE2]
                   |                  |
  1. CE1 sends    2. PE1 imports     4. PE2 receives
     10.1.0.0/16     into VRF-A,       VPNv4 route,
     via eBGP        creates VPNv4     imports to VRF-A
                     100:1:10.1.0.0   (RT 65001:100)
                  3. PE1 advertises  5. PE2 advertises
                     VPNv4 to PE2       10.1.0.0/16 to
                     via MP-iBGP        CE2 via eBGP
                     with RT 65001:100
                     and two labels:
                     transport + VPN
```

---

## 12. EVPN-VXLAN for Data Center Overlay

EVPN (Ethernet VPN, RFC 7432) combined with VXLAN (RFC 7348) is the modern standard for data center network virtualization. EVPN provides a BGP-based control plane for MAC/IP learning and distribution, while VXLAN provides the data plane encapsulation. Together they replace the flood-and-learn behavior of traditional bridging with a control-plane-driven model [17][18].

### Why EVPN-VXLAN Replaced Flood-and-Learn

Traditional VXLAN (multicast-based or ingress replication) has no control plane. MAC addresses are learned by flooding, leading to unnecessary BUM (Broadcast, Unknown unicast, Multicast) traffic across the fabric. EVPN solves this by distributing MAC and IP information via MP-BGP, enabling:

- **Known unicast forwarding** without flooding
- **ARP/ND suppression** (the VTEP answers ARP requests from its BGP-learned table)
- **Multi-homing with active-active forwarding** (ESI-based, replacing MLAG)
- **Integrated routing and bridging (IRB)** in the overlay
- **Host mobility** (MAC moves detected and advertised via BGP)

### EVPN Route Types

| Type | Name | Purpose |
|---|---|---|
| 1 | Ethernet Auto-Discovery | Multi-homing, aliasing, mass withdrawal |
| 2 | MAC/IP Advertisement | MAC address learning, host IP binding |
| 3 | Inclusive Multicast | BUM traffic handling (ingress replication list) |
| 4 | Ethernet Segment | DF (Designated Forwarder) election for multi-homing |
| 5 | IP Prefix | L3 routing in overlay (inter-VNI, external) |

### VXLAN Encapsulation

```
VXLAN FRAME FORMAT
================================================================

  Outer Ethernet | Outer IP | Outer UDP | VXLAN Header | Original Frame
                              dst: 4789   VNI: 24 bits
                                          (16M segments)

  +----------+----------+----------+----------+----------+
  | Outer L2 | Outer IP | UDP 4789 | VXLAN Hdr| Inner L2 |  Inner Payload
  | 14 bytes | 20 bytes | 8 bytes  | 8 bytes  | 14 bytes |
  +----------+----------+----------+----------+----------+
                                    |
                                    +-> VNI maps to VLAN/bridge domain
                                        50 bytes overhead total
```

### Configuration Example

```
EVPN-VXLAN SPINE-LEAF -- ARISTA EOS
================================================================

! Leaf switch configuration
vlan 10
   name WEB-TIER
!
interface Vxlan1
   vxlan source-interface Loopback1
   vxlan udp-port 4789
   vxlan vlan 10 vni 10010
!
router bgp 65001
   neighbor SPINE peer group
   neighbor SPINE remote-as 65000
   neighbor SPINE send-community extended
   neighbor 10.0.0.1 peer group SPINE
   neighbor 10.0.0.2 peer group SPINE
   !
   vlan 10
      rd auto
      route-target both 10010:10010
      redistribute learned
   !
   address-family evpn
      neighbor SPINE activate
```

### EVPN-VXLAN vs MPLS L3VPN

| Dimension | EVPN-VXLAN | MPLS L3VPN |
|---|---|---|
| Primary domain | Data center overlay | WAN / service provider |
| Encapsulation | VXLAN (UDP 4789) | MPLS labels |
| Control plane | MP-BGP (EVPN AFI/SAFI) | MP-BGP (VPNv4/VPNv6) |
| L2 and L3 | Both (integrated bridging + routing) | L3 only (L2VPN is separate) |
| Multi-tenancy | VNI-based (24-bit, 16M segments) | VRF + RD/RT (label-based) |
| Underlay requirements | IP reachability (any IGP or eBGP) | MPLS LDP or RSVP-TE |
| Multi-homing | ESI with active-active (native) | CE dual-homing (limited active-active) |
| Standards maturity | RFC 7432 (2015), RFC 8365 (2018) | RFC 4364 (2006), highly mature |
| Interoperability | Good (open standards, multi-vendor) | Excellent (decades of deployment) |

---

## 13. SD-WAN Overlay Engineering

SD-WAN (Software-Defined Wide Area Network) separates the WAN control plane from the data plane, centralizing policy management while distributing forwarding across commodity internet links, MPLS, and LTE/5G. It is an overlay technology that creates encrypted tunnels over multiple underlay transports and steers traffic based on application awareness and real-time path quality [19].

### Architecture Components

All major SD-WAN platforms share a common architectural pattern with vendor-specific naming:

| Component | Cisco Catalyst SD-WAN | VMware VeloCloud | Fortinet SD-WAN |
|---|---|---|---|
| Orchestrator | vManage | VCO (Orchestrator) | FortiManager |
| Controller | vSmart | VCG (Gateway) | FortiManager |
| Edge device | vEdge / cEdge | VCE (Edge) | FortiGate |
| Underlay mgmt | vBond (zero-touch) | VCO activation | FortiZTP |
| Security | Integrated or Umbrella | Cloud Security Service | FortiGuard (native NGFW) |

### Vendor Comparison

| Feature | Cisco Catalyst SD-WAN | VMware VeloCloud | Fortinet SD-WAN |
|---|---|---|---|
| Security approach | Separate (Umbrella SASE) or integrated UTM | Partner-integrated, cloud-first | Native NGFW on every edge |
| Best for | Large enterprise with existing Cisco estate | Multi-cloud SaaS optimization | Security-first branch consolidation |
| Zero-trust | Segment-based, per-VPN | Application-based | Zone-based NGFW policies |
| Deployment model | On-prem controllers or cloud-hosted | Cloud-managed primarily | On-prem or FortiSASE |
| Transport independence | MPLS, Internet, LTE, satellite | MPLS, Internet, LTE | MPLS, Internet, LTE, 5G |
| Application awareness | DPI + Microsoft 365/SaaS optimization | DMPO (Dynamic Multi-Path Optimization) | DPI + application steering |
| Segmentation | VPN-based (VRF equivalent) | Segment-based profiles | VDOM + zone-based |
| Pricing model | Per-device subscription | Per-edge bandwidth tier | Per-device, bundled security |
| Strength | Scalability, enterprise features, segmentation | Cloud/SaaS performance, ease of use | Integrated security, total cost |
| Weakness | Complexity, licensing cost | Limited on-prem control, dependency on gateways | Less mature orchestration at scale |

### SD-WAN Traffic Steering

The defining operational capability of SD-WAN is application-aware routing. Unlike traditional WAN routing (choose the path with the lowest IGP metric or BGP local preference), SD-WAN measures real-time path characteristics -- latency, jitter, packet loss -- and steers applications to the transport that meets their SLA.

```
SD-WAN APPLICATION-AWARE ROUTING
================================================================

  Branch Office
  +------------------------------------------+
  |  SD-WAN Edge                              |
  |                                            |
  |  App Classification (DPI)                  |
  |  +-----------+  +-----------+  +--------+ |
  |  | Voice/RTP |  | O365/SaaS |  | Bulk   | |
  |  | Latency   |  | Loss      |  | Best   | |
  |  | <30ms     |  | <0.1%     |  | Effort | |
  |  +-----+-----+  +-----+-----+  +---+----+ |
  |        |              |             |       |
  +--------|--------------|-------------|-------+
           |              |             |
     +-----v---+    +-----v---+   +----v----+
     |  MPLS   |    | Internet|   | LTE/5G  |
     | Primary |    | Primary |   | Failover|
     | for VoIP|    | for SaaS|   | for all |
     +---------+    +---------+   +---------+

  SLA Policies:
  - Voice: Latency <30ms, jitter <10ms, loss <0.1%
    -> Prefer MPLS; failover to Internet if SLA violated
  - SaaS: Loss <0.5%, latency <100ms
    -> Prefer direct Internet (local breakout)
  - Bulk: Best effort
    -> Use cheapest available transport
```

---

## 14. Operational Decision Matrix

| Scenario | Recommended Protocol/Technology | Rationale |
|---|---|---|
| Enterprise campus core | OSPF | Mature, well-understood, sufficient scale for <100 routers per area |
| Large DC underlay (>500 switches) | eBGP (RFC 7938) | No flooding domain, scales with unique ASN per leaf |
| Medium DC underlay (<200 switches) | IS-IS (L2-only) or OSPF | Either works; IS-IS if SR is planned |
| DC overlay / network virtualization | EVPN-VXLAN | Standards-based, multi-vendor, replaces flood-and-learn |
| Service provider WAN VPN | MPLS L3VPN | Proven at scale, QoS via MPLS TC bits |
| Multi-site enterprise WAN | SD-WAN | Application-aware, multi-transport, centralized policy |
| Internet edge / peering | eBGP with RPKI ROV | Policy control, path selection, route security |
| Multi-tenant routing | VRF (Lite or MPLS-backed) | Isolation with overlapping address space support |
| Branch VLAN segmentation | 802.1Q with pruning | Standard, but migrating to micro-segmentation for new builds |

---

## 15. Cross-References

> **Related:** [Network Architecture & Design](01-network-architecture-design.md) -- spine-leaf and CLOS topologies that these routing protocols operate on. [Network Automation & NetDevOps](03-network-automation-netdevops.md) -- automating the configuration of BGP, OSPF, VLANs, and VRF with Ansible/NAPALM. [Load Balancing & Traffic Engineering](04-load-balancing-traffic-engineering.md) -- ECMP and segment routing build on the IGP foundations here. [Network Security Engineering](05-network-security-engineering.md) -- firewall zone design uses VRF segmentation, CoPP protects control plane. [Cloud Networking](06-cloud-networking.md) -- VPC routing, transit gateways, and hybrid connectivity extend these patterns into cloud. [Network Reliability & DR](10-network-reliability-dr.md) -- BFD, GR, NSF, and convergence engineering depend on understanding the control/data plane split.

**Series cross-references:**
- **TCP (TCP/IP Protocol):** TCP carries BGP sessions (port 179); BGP's reliability depends entirely on TCP's guaranteed delivery
- **DNS (DNS Protocol):** GSLB and GeoDNS are traffic engineering at the application layer, complementing BGP TE at the network layer
- **SYA (Systems Admin):** VLAN configuration, interface management, and routing table inspection are daily sysadmin operations
- **SOO (Systems Operations):** Change management and maintenance windows for routing protocol changes require operational discipline
- **K8S (Kubernetes):** Calico uses BGP for pod networking; Cilium uses VXLAN or Geneve for overlay; service mesh networking builds on these L3/L4 foundations
- **DRP (Disaster Recovery):** MPLS TE Fast Reroute, BGP graceful restart, and VRF-aware failover are DR mechanisms at the network layer
- **CMH (Computational Mesh):** Mesh overlay networking shares architectural DNA with EVPN-VXLAN's control-plane-driven forwarding model
- **RFC (RFC Archive):** BGP (RFC 4271), OSPF (RFC 2328), IS-IS (RFC 1195), MPLS (RFC 3031), EVPN (RFC 7432), VXLAN (RFC 7348)

---

## 16. Sources

1. Cisco Systems. "Control Plane Policing Implementation Best Practices." Cisco IOS-XE Configuration Guide.
2. Rekhter, Y., Li, T., and Hares, S. "A Border Gateway Protocol 4 (BGP-4)." RFC 4271, IETF, January 2006. Status: Draft Standard.
3. Bates, T., Chen, E., and Chandra, R. "BGP Route Reflection: An Alternative to Full Mesh Internal BGP (IBGP)." RFC 4456, IETF, April 2006.
4. University of Oregon. "RouteViews Project." routeviews.org. Active BGP data collection since 1997.
5. Chandra, R., Traina, P., and Li, T. "BGP Communities Attribute." RFC 1997, IETF, August 1996.
6. Heitz, J., Snijders, J., Patel, K., Bagdonas, I., and Hilliard, N. "BGP Large Communities Attribute." RFC 8092, IETF, February 2017.
7. King, T., Dietzel, C., Snijders, J., Doering, G., and Hankins, G. "BLACKHOLE Community." RFC 7999, IETF, October 2016.
8. Cloudflare Blog. "Helping Build a Safer Internet by Measuring BGP RPKI Route Origin Validation." blog.cloudflare.com. NIST RPKI Monitor. rpki-monitor.antd.nist.gov.
9. Moy, J. "OSPF Version 2." RFC 2328, IETF, April 1998. Status: Internet Standard.
10. Cisco Systems. "Configure the OSPF Not-So-Stubby Area (NSSA)." cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/6208-nssa.html.
11. International Organization for Standardization. "Information Technology -- Telecommunications and Information Exchange Between Systems -- Intermediate System to Intermediate System Intra-Domain Routeing Information Exchange Protocol." ISO 10589:2002. RFC 1195 (IP extensions).
12. Lapukhov, P., Premji, A., and Mitchell, J. "Use of BGP for Routing in Large-Scale Data Centers." RFC 7938, IETF, August 2016.
13. IEEE. "IEEE Standard for Local and Metropolitan Area Networks -- Bridges and Bridged Networks." IEEE 802.1Q-2022.
14. Cisco Systems. "VRF Configuration Guide." Cisco IOS-XE.
15. Rosen, E., Viswanathan, A., and Callon, R. "Multiprotocol Label Switching Architecture." RFC 3031, IETF, January 2001.
16. Rosen, E. and Rekhter, Y. "BGP/MPLS IP Virtual Private Networks (VPNs)." RFC 4364, IETF, February 2006. Status: Proposed Standard.
17. Sajassi, A., Aggarwal, R., Bitar, N., Isaac, A., Uttaro, J., Drake, J., and Henderickx, W. "BGP MPLS-Based Ethernet VPN." RFC 7432, IETF, February 2015.
18. Lasserre, M., Balus, F., Morin, T., Bitar, N., and Sajassi, A. "A Network Virtualization Overlay Solution Using Ethernet VPN (EVPN)." RFC 8365, IETF, March 2018.
19. MEF Forum. "SD-WAN Service Attributes and Services." MEF 70.1, January 2021.
20. Uttaro, J., Filsfils, C., Alcaide, J., and Decraene, B. "BGP Link-State." RFC 9552, IETF, December 2023.
21. Bush, R. and Austein, R. "The Resource Public Key Infrastructure (RPKI) to Router Protocol, Version 2." RFC 9286, IETF, June 2022.

---

*Systems Network Engineering -- Module 2: Routing & Switching Operations. The control plane converges. The data plane delivers. The operator understands which is which.*
