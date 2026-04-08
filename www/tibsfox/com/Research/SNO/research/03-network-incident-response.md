# Network Incident Response

> **Domain:** Network Outage Triage, Packet Loss Investigation, BGP Security, DDoS Mitigation, and War Room Operations
> **Module:** 3 -- Outage Triage Methodology, Packet Loss and Latency Investigation, BGP Hijack Detection, Cable Cut Procedures, DDoS Response, Spanning Tree Incidents, DNS Resolution Failures, War Room Operations
> **Through-line:** *Every network incident begins with the same question: is it us or is it them? The answer determines whether you open a carrier ticket or restart a daemon. Getting this wrong costs minutes when seconds matter. Network incident response is not heroics -- it is methodology. A structured triage separates signal from noise, isolates the fault domain in logarithmic time, and routes the incident to the team that can fix it. The best NOC engineers are not faster at typing commands. They are faster at eliminating possibilities. They know that a BGP withdrawal looks different from a fiber cut, that ICMP rate-limiting at a transit hop is not real packet loss, that a spanning tree reconvergence takes exactly 30 seconds in classic STP and something went wrong if it takes 31. This module covers the operational disciplines of network incident response: how to triage, how to investigate, how to escalate, and how to recover -- with the real-world incidents that prove why each discipline matters.*

---

## Table of Contents

1. [Network Outage Triage Methodology](#1-network-outage-triage-methodology)
2. [Packet Loss Investigation](#2-packet-loss-investigation)
3. [Latency Investigation](#3-latency-investigation)
4. [BGP Hijack Detection and Response](#4-bgp-hijack-detection-and-response)
5. [Cable Cut Procedures](#5-cable-cut-procedures)
6. [DDoS Response](#6-ddos-response)
7. [Spanning Tree Incidents](#7-spanning-tree-incidents)
8. [DNS Resolution Failures](#8-dns-resolution-failures)
9. [Network War Room Operations](#9-network-war-room-operations)
10. [Real-World Incidents](#10-real-world-incidents)
11. [Triage Flowcharts](#11-triage-flowcharts)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Network Outage Triage Methodology

The first sixty seconds of a network outage determine its trajectory. A disciplined triage methodology prevents the two most expensive mistakes in incident response: chasing the wrong problem and escalating to the wrong team. Every outage can be decomposed along three axes, and answering these three questions in order is the fastest path to isolation [1].

### The Three-Axis Triage

**Axis 1: Is it us or upstream?**

This is the single most important question. If your upstream provider's fiber is cut, no amount of debugging your own routers will help. If your router has a bad line card, no amount of calling the carrier will help. The distinction determines who acts.

```
AXIS 1: US OR UPSTREAM?
================================================================

  Check your own infrastructure first (30 seconds):
  
  1. Can you reach your own gateway?
     ping <default-gateway>
     |
     +-- NO  --> Local problem. Check interface, cable, switch port.
     |
     +-- YES --> Continue to step 2
     
  2. Can you reach the next hop beyond your gateway?
     traceroute -m 3 <known-external-ip>
     |
     +-- Fails at hop 1-2 --> Your edge device or uplink
     |
     +-- Fails at hop 3+  --> Upstream problem. Open carrier ticket.
     
  3. Cross-check with out-of-band monitoring:
     - Check carrier status page
     - Check looking glass from carrier's perspective
     - Check @<carrier>status on social media
     - SMS/call from your phone (not on the affected network)
```

**Axis 2: Single device or widespread?**

A single device failure is a hardware or configuration problem. A widespread failure is a routing, DNS, or infrastructure problem. The scope determines the response team and the urgency.

```
AXIS 2: SCOPE OF IMPACT
================================================================

  1. Is it one device?
     - One host cannot reach the internet
     - One switch port is down
     - One server is unreachable
     --> Local troubleshooting: cable, NIC, port config, VLAN
     
  2. Is it one site?
     - All users at one location are affected
     - All devices behind one uplink are affected
     --> Uplink failure, routing issue, or WAN circuit problem
     
  3. Is it one service?
     - Web works, but email does not
     - External sites work, but one SaaS provider does not
     --> DNS, application, or specific path problem
     
  4. Is it everything?
     - All sites, all services, all users
     --> Core infrastructure: BGP, DNS, DHCP, or backbone failure
```

**Axis 3: Control plane or data plane?**

This distinction is critical and often overlooked. The control plane builds the forwarding table (BGP, OSPF, STP, ARP). The data plane forwards packets according to that table. A control plane failure means routes are wrong or missing. A data plane failure means the route is correct but packets are being dropped or corrupted in transit [2].

```
AXIS 3: CONTROL PLANE vs DATA PLANE
================================================================

  CONTROL PLANE SYMPTOMS:
  - Routes appear/disappear in routing table
  - BGP sessions flapping (syslog: BGP-5-ADJCHANGE)
  - OSPF adjacencies dropping (syslog: OSPF-5-ADJCHG)
  - Routing loops (TTL exceeded, packets bouncing)
  - ARP table incomplete (no MAC for destination)
  - STP reconvergence (topology change notifications)
  - "No route to host" errors
  
  Verification:
    show ip route <destination>       # Is the route present?
    show ip bgp summary               # Are BGP peers established?
    show ip ospf neighbor              # Are OSPF adjacencies full?
    show spanning-tree summary         # Any topology changes?
  
  DATA PLANE SYMPTOMS:
  - Route exists, but packets are dropped
  - Interface error counters incrementing (CRC, input errors)
  - High packet loss with correct routing
  - Packets forwarded but corrupted
  - QoS drops (tail drop, WRED)
  - Hardware forwarding table full (TCAM exhaustion)
  
  Verification:
    show interfaces <int>              # Error counters
    show platform hardware fed <x>     # TCAM utilization
    show policy-map interface <int>    # QoS drops
    show controllers <int>            # Hardware-level errors
```

### Triage Timing Targets

| Phase | Target | What Happens |
|---|---|---|
| Detection to acknowledgment | < 5 minutes | Monitoring alert fires, on-call acknowledges |
| Acknowledgment to triage | < 15 minutes | Three-axis assessment complete |
| Triage to escalation | < 5 minutes | Correct team engaged, bridge opened |
| Escalation to mitigation | Varies | Depends on fault domain |
| Mitigation to resolution | Varies | Root cause fixed, not just worked around |
| Resolution to postmortem | < 72 hours | Incident report written, reviewed |

---

## 2. Packet Loss Investigation

Packet loss is the most common network complaint and the most frequently misdiagnosed. The critical skill is determining *where* in the path the loss occurs and *why*. Packet loss has distinct signatures depending on its cause, and each cause requires a different remediation [3].

### Interface Error Counters

Every network interface maintains counters that record errors at the physical and data-link layers. These counters are the first place to look when investigating packet loss, because they tell you whether the problem is physical (bad cable, bad SFP, electromagnetic interference) or logical (buffer overflow, QoS drops, MTU mismatch).

**Error counter taxonomy:**

| Counter | What It Means | Common Cause | Severity |
|---|---|---|---|
| **CRC errors** | Frame check sequence failed -- bits changed in transit | Bad cable, bad SFP, EMI, duplex mismatch | HIGH -- data corruption |
| **Runts** | Frame smaller than 64 bytes (minimum Ethernet frame) | Collision (half duplex), bad NIC, cable fault | HIGH -- indicates physical layer problem |
| **Giants** | Frame larger than interface MTU | MTU mismatch, jumbo frames on non-jumbo link | MEDIUM -- usually misconfiguration |
| **Input errors** | Aggregate of CRC + runts + other input-side errors | Various physical layer issues | HIGH -- must decompose |
| **Output errors** | Frames that could not be transmitted | Interface congestion, speed mismatch | MEDIUM -- check queue drops |
| **Collisions** | Frames collided during transmission | Half duplex (should not exist on full duplex) | HIGH if unexpected -- duplex mismatch |
| **Late collisions** | Collision detected after first 64 bytes sent | Cable too long, duplex mismatch, bad NIC | CRITICAL -- almost always duplex mismatch |
| **Input queue drops** | Packets dropped because input queue is full | CPU overload processing control plane traffic | HIGH -- indicates device under stress |
| **Output queue drops** | Packets dropped because output queue is full | Interface congestion, traffic exceeds capacity | MEDIUM -- normal under load, tune QoS |
| **Ignored** | Packets dropped because input buffer is full | Sustained high traffic, small buffer allocation | HIGH -- needs buffer tuning or capacity upgrade |
| **Overrun** | Hardware receive buffer overflow | Traffic burst exceeds hardware capacity | HIGH -- hardware limitation |

**Reading interface counters:**

```
! Cisco IOS/IOS-XE
show interfaces GigabitEthernet0/1
  5 minute input rate 450000000 bits/sec, 37000 packets/sec
  5 minute output rate 320000000 bits/sec, 28000 packets/sec
     0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored
     0 output errors, 0 collisions, 0 interface resets

! Arista EOS
show interfaces Ethernet1 counters errors

! Junos
show interfaces ge-0/0/0 extensive | match error

! Linux
ip -s link show eth0
ethtool -S eth0 | grep -i error
```

**Critical interpretation rule:** Error counters are cumulative since the last clear. A counter showing 47 CRC errors means nothing without context. You need the *rate*. Clear the counters (`clear counters <interface>`), wait a known interval, then check again. If 47 CRC errors accumulated in 5 minutes, that is a serious problem. If they accumulated over 6 months, it is noise.

### Traceroute and MTR for Loss Isolation

MTR (My Traceroute) is the primary tool for isolating where in the path packet loss occurs. It combines traceroute's hop-by-hop path discovery with sustained ping statistics, providing loss percentage, average latency, jitter, and worst-case latency at every hop [4].

```
HOST: source                           Loss%   Snt   Last   Avg  Best  Wrst StDev
  1.|-- 10.0.0.1 (gateway)             0.0%   200    0.3   0.4   0.2   1.1   0.1
  2.|-- isp-pe.example.net             0.0%   200    2.8   3.0   2.5   5.2   0.4
  3.|-- core-rtr.isp.net              22.5%   200   11.4  12.1  10.8  48.2   6.3
  4.|-- ix-peer.exchange.net           0.0%   200   14.9  15.2  14.5  18.1   0.5
  5.|-- edge.destination.com           0.0%   200   16.1  16.4  15.8  19.3   0.6
```

**The five rules of MTR interpretation:**

1. **Loss at a single hop that does not persist downstream is NOT real packet loss.** Hop 3 above shows 22.5% loss, but hops 4 and 5 show 0%. The router at hop 3 is rate-limiting ICMP TTL-exceeded messages. Transit traffic is flowing fine. ISP core routers deprioritize ICMP to protect the control plane CPU.

2. **Loss that begins at a hop and persists through all subsequent hops IS real packet loss.** If hops 3, 4, and 5 all showed 22.5%, the problem is at or before hop 3.

3. **Always run MTR in both directions.** Internet routing is asymmetric. The return path may traverse entirely different routers. Loss on the return path appears as loss at the source but cannot be diagnosed from a unidirectional test. Ask the remote end to run MTR back toward you.

4. **Use sufficient probes.** 10 probes is statistically meaningless. Run at least 100 probes (`mtr -c 200`) over several minutes. Brief micro-bursts of loss require sustained observation to detect.

5. **Asterisks do not mean failure.** Many transit routers are configured to silently drop ICMP. Missing hops in the trace do not indicate a problem as long as subsequent hops respond normally.

### Where Packet Loss Occurs: The Taxonomy

```
PACKET LOSS LOCATION MAP
================================================================

  Source --> [NIC] --> [Switch port] --> [Uplink] --> [WAN] --> [Destination]
     |         |           |              |           |            |
     |     NIC errors   Port errors    Uplink      Carrier     Remote
     |     driver bug   VLAN mismatch  congestion  fiber cut   host issue
     |     MTU issue    STP blocking   QoS drops   BGP issue   firewall
     |                  duplex issue   TCAM full   congestion   rate limit
     
  Layer 1: CRC, runts, giants     --> Physical problem
  Layer 2: STP blocking, VLAN     --> Switching problem
  Layer 3: Routing, ACL, TCAM     --> Forwarding problem
  Layer 4: Firewall, NAT, QoS     --> Policy problem
```

---

## 3. Latency Investigation

Latency has three components: propagation delay (speed of light in fiber), serialization delay (time to clock bits onto the wire), and queuing delay (time spent waiting in buffers). The first two are fixed by physics and link speed. The third is variable and is where latency problems almost always live [5].

### Per-Hop Latency Analysis

```
HOST: source                           Loss%   Snt   Last   Avg  Best  Wrst StDev
  1.|-- gateway.local                   0.0%   200    0.4   0.5   0.3   1.2   0.1
  2.|-- isp-pe.example.net              0.0%   200    3.1   3.2   2.8   4.5   0.3
  3.|-- core.isp-west.net               0.0%   200   12.3  12.5  11.8  15.2   0.5
  4.|-- core.isp-east.net               0.0%   200   42.1  42.5  41.8  45.3   0.6
  5.|-- edge.destination.com            0.0%   200   43.2  43.5  42.9  46.1   0.5
```

**Interpretation:** The jump from 12.5ms at hop 3 to 42.5ms at hop 4 represents a 30ms increase. This is consistent with a transcontinental fiber path (speed of light in fiber is approximately 200,000 km/s, or roughly 5ms per 1,000km). A 30ms jump suggests approximately 6,000km of fiber -- consistent with US west coast to east coast. This is physics, not a problem.

**What IS a problem:** If hop 3 to hop 4 normally shows 30ms but today shows 90ms, the extra 60ms is queuing delay -- congestion on that link. Compare to historical baseline.

### Bufferbloat Detection

Bufferbloat occurs when network equipment has excessively large buffers that absorb bursts without dropping packets, but introduce enormous queuing delay. The symptom is that latency increases dramatically under load while packet loss remains near zero -- the opposite of what classical congestion management expects [6].

**Detection methodology:**

```
BUFFERBLOAT DETECTION
================================================================

  1. Measure baseline latency (no load):
     ping -c 50 <destination>
     Record: avg latency, jitter
     
  2. Saturate the link (create load):
     iperf3 -c <destination> -t 30    (TCP, saturate downstream)
     
  3. Measure latency DURING load (simultaneously):
     ping -c 50 <destination>
     Record: avg latency, jitter
     
  4. Compare:
     Baseline: 15ms avg, 2ms jitter
     Under load: 15ms avg, 3ms jitter  --> No bufferbloat (good)
     Under load: 350ms avg, 80ms jitter --> Severe bufferbloat
     
  Rule of thumb:
    - < 5ms increase under load: Excellent (AQM working)
    - 5-30ms increase: Acceptable
    - 30-100ms increase: Moderate bufferbloat
    - > 100ms increase: Severe bufferbloat -- needs AQM
```

**Dedicated test tools:**

| Tool | Method | What It Measures |
|---|---|---|
| Waveform bufferbloat test | Browser-based, concurrent up/down + latency | Latency under load, grades A-F |
| flent (RRUL test) | CLI, Realtime Response Under Load | Per-flow latency, bandwidth, CDF plots |
| DSLReports speed test | Browser-based (now limited availability) | Bandwidth + bufferbloat grade |
| irtt | CLI, isochronous round-trip time | Precise latency measurement under controlled load |

**Remediation:** Active Queue Management (AQM). Modern solutions include fq_codel (fair queuing with controlled delay) and CAKE (Common Applications Kept Enhanced). Both are available in Linux and OpenWrt. CAKE is the current state of the art -- it combines AQM, flow isolation, and traffic shaping into a single queuing discipline [6].

### QoS Misconfiguration Symptoms

QoS misconfiguration is a common source of latency and jitter problems that does not show up as packet loss until queues are full. The symptoms are subtle: voice calls sound robotic, video freezes momentarily, interactive SSH sessions feel sluggish, but bulk transfers work fine.

```
QoS MISCONFIGURATION CHECKLIST
================================================================

  1. Are DSCP markings being preserved across the path?
     - Some transit providers strip or remark DSCP to 0
     - Test: capture at ingress and egress, compare DSCP values
     
  2. Is the correct traffic being matched?
     - show policy-map interface <int>
     - Check: does the "match" criteria actually match the traffic?
     - Common mistake: matching on port 5060 (SIP) but not
       on the RTP media ports (dynamic range 10000-20000)
     
  3. Are queues actually servicing traffic?
     - show policy-map interface <int>
     - Check: queue drops vs packets serviced ratio
     - If priority queue has drops, bandwidth allocation is wrong
     
  4. Is shaping rate correct?
     - If you shape to 100 Mbps but the circuit is 50 Mbps,
       packets pass the shaper and hit the carrier's policer,
       which drops without regard to DSCP priority
     - Shape to SLIGHTLY below contracted rate (e.g., 48 Mbps)
     
  5. Is the policer on the right interface?
     - Input vs output matters
     - Common mistake: policy applied to wrong direction
```

---

## 4. BGP Hijack Detection and Response

A BGP hijack occurs when an autonomous system originates a prefix it does not own, causing some or all of the Internet to route traffic for that prefix to the hijacker instead of the legitimate owner. BGP has no built-in authentication of origin -- any AS can announce any prefix, and its neighbors will accept it by default. This is the fundamental vulnerability that RPKI and ROV are designed to address [7].

### How BGP Hijacks Work

```
BGP HIJACK MECHANICS
================================================================

  Normal state:
  AS64500 (legitimate owner) announces 203.0.113.0/24
  All Internet traffic for 203.0.113.0/24 reaches AS64500
  
  Hijack (origin hijack):
  AS66666 (attacker) announces 203.0.113.0/24
  Some ASes prefer AS66666's route (shorter AS path, closer peer)
  Traffic is split -- some reaches AS64500, some goes to AS66666
  
  Hijack (more-specific prefix):
  AS66666 announces 203.0.113.0/25 and 203.0.113.128/25
  Longest prefix match ALWAYS wins in BGP
  ALL traffic now goes to AS66666 (most devastating variant)
  
  Route leak (accidental hijack):
  AS64501 (transit customer) receives 203.0.113.0/24 from AS64500
  AS64501 accidentally re-announces it to AS64502 (another provider)
  AS64502 propagates it globally
  Traffic takes suboptimal path through AS64501
```

### Detection Tools and Monitoring

**RPKI and Route Origin Validation (ROV):**

RPKI (Resource Public Key Infrastructure) allows IP prefix holders to cryptographically sign Route Origin Authorizations (ROAs) that specify which ASes are authorized to originate their prefixes. Routers performing ROV check incoming BGP announcements against the RPKI database and can reject or deprioritize announcements that violate the ROA [8].

| RPKI State | Meaning | Recommended Action |
|---|---|---|
| Valid | ROA exists, announcement matches | Accept (prefer) |
| Invalid | ROA exists, announcement does NOT match | Reject or deprioritize |
| Not Found | No ROA exists for this prefix | Accept (default) |

**BGP Route Collectors and Looking Glasses:**

| Resource | URL | What It Provides |
|---|---|---|
| RIPE RIS (Routing Information Service) | stat.ripe.net | BGP updates, AS path history, BGPlay visualization |
| RouteViews (University of Oregon) | routeviews.org | Multi-vantage-point BGP data, MRT dumps |
| Cloudflare Radar | radar.cloudflare.com/routing | Real-time BGP hijack detection, RPKI validation |
| BGPStream (CAIDA) | bgpstream.com | Real-time and historical BGP data API |
| Hurricane Electric BGP Toolkit | bgp.he.net | AS info, prefix lookup, looking glass |
| MANRS Observatory | observatory.manrs.org | Routing security metrics per AS |
| BGPalerter | github.com/nttgin/BGPalerter | Self-hosted real-time monitoring for your prefixes |

**BGPalerter** is particularly valuable for network operators. It is a pre-configured, self-hosted monitoring tool that watches your prefixes in real-time and alerts on visibility loss, RPKI invalid announcements, hijacks, and ROA misconfiguration. It requires minimal configuration -- provide your prefixes and ASN, and it begins monitoring immediately via public route collector feeds [9].

### Incident Response for Hijacked Prefixes

```
BGP HIJACK RESPONSE PROCEDURE
================================================================

  DETECTION (T+0):
  Alert from BGPalerter, Cloudflare Radar, or customer reports
  
  CONFIRMATION (T+0 to T+5 min):
  1. Check RIPE RIS/BGPlay: is another AS originating your prefix?
  2. Check RouteViews looking glass: from how many vantage points?
  3. Verify your own BGP: are you still announcing the prefix?
  4. Check RPKI: is the hijacker's announcement RPKI-invalid?
     (If your ROA is in place, ROV-enabled networks reject it)
  
  MITIGATION (T+5 to T+30 min):
  5. If possible, announce more-specific prefixes:
     If you announce /24, announce two /25s
     (Only if your RIR allocation allows and ROAs cover them)
  6. Contact the offending AS directly (NOC contact via PeeringDB)
  7. Contact your upstream transit providers:
     - Ask them to filter the hijacker's announcement
     - Provide evidence (BGPlay screenshots, looking glass output)
  8. Report to your RIR (RIPE, ARIN, APNIC, etc.)
  
  ESCALATION (T+30 min to T+2 hours):
  9. If the hijacker is unresponsive:
     - Contact the hijacker's upstream providers
     - File abuse reports with transit providers
     - Engage your RIR's security response team
  10. Post to network operator mailing lists (NANOG, RIPE NCC)
  
  PREVENTION (post-incident):
  11. If you do not have ROAs: create them NOW
  12. Deploy BGPalerter or equivalent for continuous monitoring
  13. Set max-prefix limits on all BGP sessions
  14. Implement prefix filters on all customer BGP sessions
```

### RPKI Deployment Status

As of 2025, RPKI ROV deployment has reached significant but not universal coverage. Major networks including Cloudflare, Google, Amazon, Microsoft, AT&T, NTT, and many European and Asian carriers now perform ROV. However, the ecosystem still has gaps. A "stealthy" hijack can evade detection when the victim's ROV-enabled neighbors correctly reject the invalid announcement (so the victim's control plane looks normal), but traffic is silently rerouted through legacy non-ROV networks along the data plane path [10].

ASPA (AS Provider Authorization) is an emerging standard that extends RPKI protection to address route leaks in addition to origin hijacks. ASPA allows an AS to publish its authorized upstream providers to the RPKI, enabling ASes along the path to verify that BGP announcements follow valley-free routing rules [11].

---

## 5. Cable Cut Procedures

Fiber cuts are the most common cause of major network outages. A single backhoe in the wrong place can sever dozens of fibers carrying terabits of traffic. Responding to a cable cut requires immediate traffic rerouting, carrier coordination, and customer communication -- simultaneously [12].

### Carrier Escalation Timeline

```
CABLE CUT RESPONSE TIMELINE
================================================================

  T+0:      Monitoring alerts fire. Multiple circuits drop simultaneously.
            Interface counters show light loss (RX power drops to -inf dBm).
            BGP sessions drop on affected circuits.
            
  T+2 min:  Confirm cable cut vs equipment failure:
            - Multiple circuits on same path fail simultaneously = cut
            - Single circuit fails = equipment or SFP failure
            - Check carrier status page and social media
            
  T+5 min:  Open carrier trouble ticket (HIGHEST SEVERITY):
            - Circuit IDs affected
            - Time of failure
            - Monitoring evidence (interface status, light levels)
            - Request ETR (estimated time to repair)
            
  T+10 min: Activate traffic rerouting:
            - BGP: announce prefixes through alternate transit
            - MPLS: TE tunnel re-optimization
            - SD-WAN: automatic failover should have occurred
            - Verify failover is working (test from external vantage)
            
  T+15 min: Customer communication (first update):
            - "We have identified a carrier fiber cut affecting..."
            - "Traffic has been rerouted to diverse paths..."
            - "We are working with <carrier> for repair timeline..."
            
  T+30 min: Get ETR from carrier. Typical repair timelines:
            - Underground metro: 4-12 hours
            - Long-haul buried: 8-24 hours
            - Aerial (pole-mounted): 2-8 hours
            - Submarine cable: 5-14 DAYS
            
  T+1 hr:   Second customer update with ETR
  
  T+2 hr:   Escalate within carrier if no ETR received
             Contact carrier account manager (not just NOC)
             
  Ongoing:  Hourly updates to customers until resolved
            Monitor backup paths for capacity saturation
            Prepare for primary path restoration and failback
```

### Diversity Verification

A cable cut only causes an outage if your traffic has no alternate path. Diversity verification confirms that your "diverse" circuits actually traverse physically separate paths -- a claim that carriers sometimes make loosely.

```
DIVERSITY VERIFICATION CHECKLIST
================================================================

  1. Physical path diversity:
     - Do the two circuits enter the building through different conduits?
     - Do they traverse different street-level paths?
     - Do they use different carrier vaults and manholes?
     - Are they on different ring segments (if ring topology)?
     
  2. Carrier diversity:
     - Different carriers? (True diversity)
     - Same carrier, different fiber? (Usually diverse, verify)
     - Same carrier, "diverse" but same conduit? (NOT diverse)
     
  3. Building entry diversity:
     - Different building entry points?
     - Different riser paths inside the building?
     - Different meet-me rooms (in colo)?
     
  4. Route diversity proof:
     - Request carrier's KMZ/KML files showing physical path
     - Overlay on map -- look for points where paths converge
     - Single points of convergence = single points of failure
     
  5. Long-haul diversity:
     - Railroad right-of-way: many carriers share the same route
     - Two "diverse" carriers may follow the same railroad for 200 miles
     - True long-haul diversity requires different geographic corridors
```

### Traffic Rerouting During a Cut

When a primary circuit fails, traffic must reroute automatically or be manually redirected. The mechanism depends on the network architecture:

| Technology | Reroute Mechanism | Convergence Time | Operator Action |
|---|---|---|---|
| BGP (multi-homed) | Withdraw route, prefer alternate next-hop | 30-90 seconds (default timers) | Verify alternate path has capacity |
| BGP (with BFD) | BFD detects failure in ms, triggers BGP withdraw | 1-3 seconds | Ensure BFD is configured on all critical peers |
| MPLS TE (FRR) | Fast Reroute to pre-computed backup tunnel | 50ms | Pre-configure backup tunnels |
| SD-WAN | Automatic failover to secondary transport | 1-10 seconds | Verify SLA-based path selection is active |
| OSPF/IS-IS | SPF recalculation | 1-5 seconds (with tuned timers) | None -- automatic |
| Static routes (floating) | Higher-metric static route activates | Immediate on link failure | Crude but reliable for simple topologies |

---

## 6. DDoS Response

A Distributed Denial of Service attack overwhelms the target's network capacity, compute resources, or both. The response must happen faster than the attack can saturate the infrastructure, which means pre-positioning mitigation capabilities before an attack occurs. Trying to deploy DDoS mitigation during an active attack is like buying insurance while the house is on fire [13].

### Attack Classification

```
DDoS ATTACK TAXONOMY
================================================================

  VOLUMETRIC (Layer 3-4):
  - Goal: Saturate bandwidth (fill the pipe)
  - Methods: UDP flood, DNS amplification, NTP amplification,
             memcached amplification, SSDP reflection
  - Scale: 100 Gbps to 3+ Tbps
  - Detection: Interface utilization spikes, flow data shows
               massive inbound traffic from many sources
  - Mitigation: Upstream scrubbing, blackhole routing
  
  PROTOCOL (Layer 3-4):
  - Goal: Exhaust device state tables
  - Methods: SYN flood, ACK flood, fragmentation attacks
  - Scale: Millions of packets/sec
  - Detection: Connection table exhaustion, high PPS with low BPS,
               firewall/LB state table full
  - Mitigation: SYN cookies, rate limiting, scrubbing
  
  APPLICATION (Layer 7):
  - Goal: Exhaust application resources
  - Methods: HTTP floods, Slowloris, DNS query floods,
             API abuse, credential stuffing
  - Scale: Thousands of requests/sec (low bandwidth)
  - Detection: Application response time increases, error rates
               spike, CPU/memory exhaustion on servers
  - Mitigation: WAF rules, rate limiting, CAPTCHA, behavioral analysis
```

### Mitigation Procedures

**Remotely Triggered Blackhole Routing (RTBH):**

RTBH is the nuclear option -- it drops ALL traffic to the targeted IP address, including legitimate traffic. Use it when the attack threatens collateral damage to other services sharing the same network infrastructure. RTBH is implemented by advertising the attacked IP to your upstream providers with a blackhole community, causing them to null-route traffic destined for that IP before it enters your network [14].

```
RTBH ACTIVATION
================================================================

  1. Identify attacked destination IP (from flow data, interface stats)
  
  2. On your trigger router, create a host route with the
     blackhole next-hop and community:
     
     ip route 203.0.113.50/32 192.0.2.1 tag 666
     
     route-map BLACKHOLE permit 10
       match tag 666
       set community <upstream-ASN>:666
       set ip next-hop 192.0.2.1
     
     (192.0.2.1 is pointed at null0 on all routers)
     
  3. Redistribute this route into BGP toward your upstream:
     Upstream provider recognizes the blackhole community
     and null-routes the prefix at their edge
     
  4. Attack traffic is dropped upstream before it enters your network
  
  5. IMPORTANT: Only blackhole the ATTACKED IP, not your entire prefix
     Blackholing a /24 when only one /32 is attacked causes a
     self-inflicted denial of service
  
  6. Monitor: once attack subsides, REMOVE the blackhole route
     Test incrementally -- remove and watch for attack resumption
```

**Scrubbing Center Activation:**

Scrubbing centers (Cloudflare Magic Transit, Akamai Prolexic, AWS Shield Advanced, Radware) inspect traffic in real-time, filter attack traffic, and forward only clean traffic to your network. Unlike blackhole routing, scrubbing preserves legitimate traffic [15].

```
SCRUBBING CENTER ACTIVATION
================================================================

  PRE-POSITIONED (always-on):
  - Traffic always flows through scrubbing center
  - No activation delay
  - Higher cost, minimal additional latency
  - Best for frequently targeted organizations
  
  ON-DEMAND (activated during attack):
  1. Detect attack (monitoring, flow analysis, NOC)
  2. Contact scrubbing provider or activate via API/portal
  3. Redirect traffic to scrubbing center:
     - BGP: Provider announces your prefix from their AS
       (more-specific or with shorter AS path)
     - DNS: Change authoritative records to point to scrubbing IPs
     - GRE/IPsec tunnel: Clean traffic tunneled back to you
  4. Activation time: 5-15 minutes (BGP propagation)
  5. Verify clean traffic is arriving, attack traffic is being dropped
  
  HYBRID (common in practice):
  - Always-on for DNS and web (Cloudflare, Akamai)
  - On-demand for network layer (transit scrubbing)
  - Volumetric attacks handled at network edge
  - Application attacks handled at WAF/CDN layer
```

### Upstream Coordination

DDoS mitigation often requires coordination with upstream providers, Internet exchanges, and sometimes law enforcement. Establish these relationships before an attack.

| Contact | When to Engage | What They Can Do |
|---|---|---|
| **Transit provider NOC** | Volumetric attack exceeding your capacity | Apply upstream ACLs, blackhole, rate limit |
| **IX (Internet Exchange)** | Attack traffic arriving via peering | Block specific source ASes at the IX fabric |
| **Colocation provider** | Physical infrastructure at risk (power, cooling) | Cross-connect changes, emergency capacity |
| **Scrubbing provider** | On-demand activation needed | Begin scrubbing, provide attack forensics |
| **Law enforcement (FBI IC3, NCA)** | Extortion (ransom DDoS), data theft | Investigation, takedown of C2 infrastructure |
| **ISACs (sector-specific)** | Coordinated attacks against your sector | Shared intelligence, collective defense |

---

## 7. Spanning Tree Incidents

Spanning tree incidents are among the most destructive network events because they affect the Layer 2 foundation that everything else relies on. A spanning tree loop can bring down an entire campus network in seconds by creating a broadcast storm that saturates all links, overwhelms switch CPUs, and makes the network completely unusable [16].

### How STP Loops Form

```
STP LOOP FORMATION
================================================================

  Normal operation (STP converged):
  
  Root Bridge (SW1) -- priority 4096
       |            \
       |             \
     [SW2]          [SW3]
       |    blocked    |
       +------X--------+    <-- STP blocks one path to prevent loop
       
  Loop trigger scenarios:
  
  1. Rogue switch connected with lower priority:
     User plugs in unmanaged switch with default priority (32768)
     --> If it has lower bridge ID, it claims root
     --> All ports reconverge, 30-50 second outage (classic STP)
     --> With RSTP: 1-6 seconds, but still disruptive
     
  2. Unidirectional link failure:
     BPDUs stop flowing in one direction (bad cable, bad SFP)
     Switch thinks root bridge is gone
     Blocked port transitions to forwarding
     Both paths now forward --> LOOP
     
  3. BPDU not received (CPU overload):
     Switch CPU is overwhelmed (broadcast storm, control plane attack)
     BPDUs are not processed in time
     Max-age timer expires (20 seconds)
     Blocked ports transition to forwarding --> LOOP INTENSIFIES
```

### Loop Detection and Response

**Symptoms of a spanning tree loop:**

- Interface utilization jumps to 100% on multiple ports simultaneously
- CPU on all switches in the broadcast domain spikes to 100%
- MAC address table flapping (same MAC seen on multiple ports)
- Broadcast storm -- syslog flooded with messages
- Network becomes completely unresponsive
- Switch management interfaces unreachable

**Emergency response:**

```
STP LOOP EMERGENCY RESPONSE
================================================================

  1. IDENTIFY the loop physically:
     - Which switches have 100% CPU and saturated uplinks?
     - Check port LED activity -- looped ports blink frantically
     - show spanning-tree summary -- look for topology changes
     - show mac address-table -- look for MAC flapping
     
  2. BREAK the loop immediately:
     - Shut down the suspected looped port: shutdown
     - If you cannot identify the port, shut down all
       non-essential access ports on the affected switch
     - Monitor: does CPU drop? Does traffic normalize?
     
  3. FIND ROOT CAUSE:
     - show spanning-tree root -- who is root bridge?
     - Is it the INTENDED root bridge?
     - show spanning-tree detail -- look for topology change counters
     - Check for unauthorized switches (LLDP/CDP neighbors)
     
  4. PREVENT RECURRENCE:
     - BPDU Guard on all access ports (err-disable on BPDU receipt)
     - Root Guard on all ports where root should never be learned
     - Loop Guard on all non-designated ports
     - Set explicit root bridge priority (4096 for primary, 8192 for secondary)
```

### STP Protection Features

| Feature | What It Does | Where to Apply | Failure Mode |
|---|---|---|---|
| **BPDU Guard** | Err-disables port if BPDU received | Access ports (with PortFast) | Port shuts down (safe) |
| **Root Guard** | Prevents port from becoming root port | Ports facing non-root switches | Port goes to root-inconsistent (blocking) |
| **Loop Guard** | Prevents blocked port from transitioning to forwarding on BPDU loss | Non-designated ports | Port goes to loop-inconsistent (blocking) |
| **UDLD (Unidirectional Link Detection)** | Detects and disables unidirectional links | Fiber uplinks | Err-disables port |
| **Storm Control** | Rate-limits broadcast/multicast/unicast floods | All ports | Drops excess frames or shuts port |
| **PortFast** | Skips STP listening/learning, goes straight to forwarding | Access ports ONLY | Immediate forwarding (loop risk if misapplied) |

**Critical rule:** BPDU Guard and PortFast must always be deployed together on access ports. PortFast without BPDU Guard creates a loop vulnerability -- if someone plugs a switch into a PortFast port, it bypasses STP and immediately creates a potential loop. BPDU Guard ensures that if a BPDU is received on a PortFast port (indicating a switch, not an end device), the port is shut down.

---

## 8. DNS Resolution Failures

DNS is the single most common root cause of "the network is down" reports that are not actually network problems. When DNS fails, every application that depends on name resolution fails -- web, email, API calls, service discovery, certificate validation, authentication (Kerberos, LDAP). The network is working perfectly, but nothing can find anything [17].

### Recursive vs Authoritative Diagnosis

The critical first step is determining whether the failure is in the recursive resolver (your side) or the authoritative server (their side). These are fundamentally different problems with different owners.

```
DNS FAILURE DIAGNOSIS
================================================================

  Step 1: Test with your recursive resolver (system default):
    dig example.com A
    --> SERVFAIL? Timeout? NXDOMAIN? Wrong answer?
    
  Step 2: Test with a public recursive resolver:
    dig @8.8.8.8 example.com A
    dig @1.1.1.1 example.com A
    |
    +-- Works with public resolver, fails with yours:
    |   YOUR recursive resolver is broken
    |   --> Check resolver service health (named, unbound, PowerDNS recursor)
    |   --> Check resolver's upstream connectivity
    |   --> Check resolver's cache (poisoned? stale?)
    |   --> Check firewall allowing UDP/TCP 53 outbound from resolver
    |
    +-- Fails with public resolver too:
    |   The AUTHORITATIVE side is broken
    |   --> Continue to step 3
    |
    +-- Works with public resolver AND yours:
        Intermittent issue or already resolved
        --> Check TTLs, caching behavior
    
  Step 3: Query authoritative servers directly:
    dig +trace example.com A
    (Walks from root -> TLD -> authoritative)
    |
    +-- Referral to authoritative servers works,
    |   but authoritative servers do not respond:
    |   --> Authoritative servers are down or unreachable
    |   --> Contact domain owner / DNS provider
    |
    +-- Referral chain is broken at TLD level:
    |   --> Delegation is wrong (NS records at registrar)
    |   --> Domain expired
    |   --> Registrar issue
    |
    +-- Authoritative returns wrong answer:
        --> Zone file error
        --> DNS hijack (check DNSSEC, compare with historical data)
```

### Common DNS Failure Modes

| Failure | Symptom | Root Cause | Resolution |
|---|---|---|---|
| SERVFAIL | Recursive returns SERVFAIL | DNSSEC validation failure, authoritative timeout | Check DNSSEC chain, check authoritative availability |
| NXDOMAIN | Domain not found | Expired domain, broken delegation, typo | Check registrar, check NS records at TLD |
| Timeout | No response | Firewall blocking DNS, resolver overloaded, authoritative down | Check firewall rules, check resolver health |
| Wrong IP | Resolves to unexpected address | DNS hijack, stale cache, misconfigured zone | Flush cache, check authoritative zone, check DNSSEC |
| Slow resolution | 2-5 second delays | Resolver overloaded, authoritative slow, TCP fallback | Check resolver metrics, check authoritative response time |
| Partial failure | Some records resolve, others don't | Zone transfer failure (secondary out of date), missing records | Check SOA serial, compare primary and secondary |

### DNSSEC Failure Investigation

DNSSEC failures present as SERVFAIL at the recursive resolver because the resolver validates the cryptographic chain and rejects invalid responses. The user sees a complete failure, but the DNS data exists -- it just fails validation.

```bash
# Check if DNSSEC is the problem:
# Query with validation (normal):
dig @8.8.8.8 example.com A
# --> SERVFAIL

# Query without validation (bypass DNSSEC):
dig @8.8.8.8 +cd example.com A
# --> Returns answer (the data is there, but DNSSEC invalid)

# If +cd returns an answer but normal query fails:
# DNSSEC chain is broken somewhere

# Trace the DNSSEC chain:
dig +trace +dnssec example.com A
# Look for: missing RRSIG, expired signatures, DS/DNSKEY mismatch

# Visual validation:
# Use dnsviz.net -- it renders the full DNSSEC chain graphically
```

---

## 9. Network War Room Operations

When a major network incident escalates beyond a single engineer's ability to resolve, you open a war room (sometimes called a bridge call or incident bridge). The war room is a coordinated response structure where multiple teams work in parallel under a single incident commander [18].

### Who to Call

```
NETWORK INCIDENT ESCALATION MATRIX
================================================================

  YOUR ORGANIZATION:
  +-- NOC (Network Operations Center)
  |   First responder. Triage, initial diagnosis, standard runbooks.
  |   Escalates to engineering when runbook exhausted.
  |
  +-- Network Engineering
  |   Deep technical expertise. Routing, switching, protocol analysis.
  |   Owns complex troubleshooting and configuration changes.
  |
  +-- Security Operations (if suspected attack)
  |   DDoS, hijack, breach. Forensics and threat intelligence.
  |
  +-- Application / SRE teams
      Determine application impact. Activate app-level failover.
      Provide customer-facing communication content.

  EXTERNAL:
  +-- Carrier / ISP NOC
  |   Circuit failures, backbone issues, BGP problems upstream.
  |   Dial the number on the circuit order. Use circuit ID, not
  |   account number. Carrier NOCs respond to circuit IDs.
  |
  +-- Internet Exchange (IX) NOC
  |   Peering port issues, IX fabric problems.
  |   Contact via IX member portal or emergency number.
  |
  +-- Colocation Provider NOC
  |   Power, cooling, physical access, cross-connect issues.
  |   Usually 24/7 phone + portal.
  |
  +-- DNS Provider
  |   If using external DNS (Cloudflare, Route53, NS1, Dyn).
  |   Check their status page first, then open ticket.
  |
  +-- DDoS Scrubbing Provider
  |   Activate on-demand scrubbing. Provide attack details.
  |   Pre-established relationship required (cannot onboard during attack).
  |
  +-- Hardware Vendor TAC
      Cisco TAC, Juniper JTAC, Arista TAC.
      Severity 1 for production-down. Provide show tech output.
```

### War Room Structure

```
WAR ROOM ROLES
================================================================

  INCIDENT COMMANDER (IC):
  - Owns the incident. Makes decisions. Controls the bridge.
  - Does NOT troubleshoot. Coordinates others.
  - Tracks timeline, assigns tasks, manages escalations.
  
  SCRIBE:
  - Documents everything: timeline, actions, findings, decisions.
  - Maintains the incident channel (Slack, Teams) with timestamped updates.
  - Produces the postmortem timeline after resolution.
  
  TECHNICAL LEAD (per domain):
  - Network engineer for network issues
  - Systems engineer for server/application issues
  - Security engineer for security incidents
  - Each lead troubleshoots their domain and reports to IC.
  
  COMMUNICATIONS LEAD:
  - Drafts customer-facing updates
  - Posts to status page
  - Coordinates with support team for customer escalations
  - IC approves communications before they go out.
  
  LIAISON (for external parties):
  - On the phone with the carrier NOC
  - Relaying information between carrier and IC
  - Tracking carrier ticket numbers and ETRs
```

### War Room Discipline

1. **One conversation at a time.** The IC controls the bridge. Side conversations go to side channels.
2. **State your name before speaking.** "This is Sarah from network engineering. I found..."
3. **Report findings, not theories.** "Interface Gi0/1 shows 45,000 CRC errors in the last 10 minutes" not "I think the cable is bad."
4. **IC asks for updates on a cadence.** Every 15 minutes: "Network team, what is your current status?"
5. **Document everything.** The scribe captures every action, finding, and decision with timestamps.
6. **Postmortem within 72 hours.** The war room is not over when the incident is resolved. It is over when the postmortem is complete.

---

## 10. Real-World Incidents

### Facebook DNS Outage -- October 4, 2021

**Duration:** Approximately 6 hours (15:39 UTC to ~21:05 UTC)

**Impact:** Facebook, Instagram, WhatsApp, Messenger, and Oculus services globally unavailable. Facebook's internal tools also failed, preventing engineers from diagnosing the problem remotely.

**Root cause:** During routine maintenance, a command intended to assess global backbone capacity inadvertently disconnected all of Facebook's data centers from each other and from the Internet. The backbone is the network that connects Facebook's globally distributed data centers. When the backbone went down, Facebook's DNS servers -- which were still operational -- detected that they could no longer reach the data centers and automatically withdrew their BGP route announcements [19].

**Cascade mechanism:**

```
FACEBOOK OCTOBER 2021 -- CASCADE
================================================================

  1. Maintenance command disconnects backbone
     (intended: assess capacity; actual: withdrew all backbone routes)
     
  2. Data centers become isolated from each other
     
  3. DNS servers detect they cannot reach data centers
     DNS servers are designed to withdraw BGP if backends are unreachable
     (safety feature to prevent serving stale/wrong data)
     
  4. DNS servers withdraw BGP announcements for their own IP prefixes
     The DNS servers at 129.134.30.0/23 and 185.89.218.0/23 disappear
     
  5. The rest of the Internet cannot resolve facebook.com, instagram.com, etc.
     Not because DNS is broken -- because DNS IPs are UNREACHABLE
     
  6. Recovery requires physical access to data center equipment
     Remote management tools also depended on Facebook's internal DNS
     Engineers had to physically travel to data centers
     Access control systems partially depended on Facebook infrastructure
```

**Lessons learned:**
- DNS servers should not automatically withdraw BGP advertisements without human confirmation
- Out-of-band management must not depend on the infrastructure it manages
- Physical access procedures must not depend on network-connected systems
- A single automation system should not have the ability to disconnect all backbone links simultaneously
- BGP withdrawal as a safety mechanism can make recovery harder than the original failure

### CenturyLink/Level 3 Flowspec Incident -- August 30, 2020

**Duration:** Approximately 5 hours (10:00 UTC to ~15:30 UTC)

**Impact:** CenturyLink/Level 3 is one of the largest Tier 1 ISPs globally. The outage affected their entire network and cascaded to thousands of downstream networks, impacting Amazon, Cloudflare, Twitter, Xbox Live, Hulu, Discord, Reddit, Steam, and many others. Approximately 3.5% of all global Internet traffic was affected [20].

**Root cause:** A BGP Flowspec rule -- intended to block unwanted traffic for a specific customer -- was implemented with wildcard matching instead of being scoped to the specific IP address. Flowspec is a BGP extension that allows distributing traffic filtering rules via BGP updates. The misconfigured flowspec rule propagated across CenturyLink's entire internal network, causing BGP sessions to flap network-wide.

```
CENTURYLINK AUGUST 2020 -- FLOWSPEC CASCADE
================================================================

  1. Operator creates flowspec rule to block traffic for customer
     INTENDED: Block traffic to specific IP 203.0.113.50
     ACTUAL: Wildcard match -- blocks traffic matching broad criteria
     
  2. Flowspec rule propagates via iBGP to all CenturyLink routers
     (Flowspec rules are distributed like BGP routes)
     
  3. Routers begin dropping traffic matching the wildcard rule
     Legitimate traffic dropped across the backbone
     
  4. BGP sessions begin flapping as routers lose connectivity
     BGP update volume spikes from ~1.5 MB to >26 MB per 15 minutes
     
  5. Cascading failure: route flapping causes convergence storms
     Every BGP peer of CenturyLink sees route withdrawals and updates
     Downstream networks lose routes to CenturyLink-connected destinations
     
  6. Recovery: NOC deploys global config change to block the
     offending flowspec announcement
     BGP sessions re-establish and routes reconverge
```

**Lessons learned:**
- Flowspec rules must be validated before deployment (peer review, staging)
- Flowspec should have scope limiters (max prefix impact, community-based distribution control)
- A single operator command should not be able to affect the entire backbone
- BGP update rate monitoring should trigger automated circuit breakers
- Tier 1 outages have asymmetric impact -- they affect thousands of downstream networks

### Cloudflare 1.1.1.1 BGP Hijack -- June 2019

**Duration:** Approximately 2 hours for the hijack component

**Impact:** Cloudflare's public DNS resolver at 1.1.1.1 was unreachable from portions of the Internet due to a combination of a BGP origin hijack and a route leak.

**Root cause:** Two simultaneous issues compounded each other. Eletronet S.A. (AS267613, a Brazilian ISP) began announcing 1.1.1.1/32 -- a more-specific prefix than Cloudflare's 1.1.1.0/24. Because BGP always prefers the most-specific prefix (longest prefix match), networks that received this announcement routed 1.1.1.1 traffic to Eletronet instead of Cloudflare. Separately, a misconfiguration at Allegheny Technologies (AS396531) in Pennsylvania leaked Cloudflare routes to Verizon, which propagated them further [21].

**Lessons learned:**
- RPKI with ROV would have prevented this -- 1.1.1.0/24 has a valid ROA for Cloudflare's AS
- More-specific prefix hijacks (/32 vs /24) are devastating because longest-match always wins
- Operators should filter announcements more specific than /24 in IPv4 (most networks do)
- Multiple simultaneous routing anomalies compound each other unpredictably
- Public infrastructure (1.1.1.1 DNS) must be monitored from diverse external vantage points

### Common Patterns Across Major Incidents

| Pattern | Facebook 2021 | CenturyLink 2020 | Cloudflare 2019 |
|---|---|---|---|
| Single human action triggered cascade | Yes (maintenance cmd) | Yes (flowspec rule) | Yes (misconfig) |
| Automation amplified the failure | Yes (DNS withdrew BGP) | Yes (flowspec via iBGP) | Yes (BGP propagation) |
| Recovery was harder than expected | Yes (locked out of systems) | Yes (global config change) | Yes (required external coordination) |
| Impacted far beyond direct customers | Yes (WhatsApp global) | Yes (3.5% of Internet) | Yes (DNS for millions) |
| Prevention existed but was not deployed | Partial (no safeguard on backbone cmd) | Yes (flowspec validation) | Yes (RPKI/ROV, prefix filtering) |

---

## 11. Triage Flowcharts

### Master Triage: "Something is Wrong with the Network"

```
MASTER NETWORK TRIAGE FLOWCHART
================================================================

  REPORT: "Something is wrong with the network"
  |
  v
  1. How many users/devices are affected?
  |
  +-- ONE user/device
  |   --> Is it one application or all?
  |       +-- One app --> DNS? Firewall rule? App server down?
  |       +-- All apps --> Cable? Switch port? VLAN? DHCP?
  |
  +-- MULTIPLE users, ONE site
  |   --> Check uplink from site to core
  |       +-- Uplink down? --> Cable cut? SFP? Switch failure?
  |       +-- Uplink up? --> Routing issue? VLAN trunk? STP?
  |
  +-- MULTIPLE users, MULTIPLE sites
  |   --> Core infrastructure problem
  |       +-- Can internal sites reach each other? 
  |       |   +-- NO --> Core routing, backbone, STP loop
  |       |   +-- YES --> External connectivity (BGP, transit, DNS)
  |       |
  |       +-- Check BGP: show ip bgp summary
  |       |   +-- Peers down --> Upstream failure, carrier issue
  |       |   +-- Peers up, routes missing --> Route filtering, hijack
  |       |
  |       +-- Check DNS: dig @your-resolver example.com
  |           +-- Timeout --> Resolver down, firewall, upstream DNS
  |           +-- SERVFAIL --> DNSSEC, authoritative failure
  |           +-- Works --> Not a DNS problem, continue Layer 3-4
  |
  +-- EVERYTHING is down
      --> Total infrastructure failure
          +-- Power? (check UPS, generator)
          +-- Core switch/router? (console access, check status)
          +-- STP loop? (check for broadcast storm symptoms)
          +-- BGP/routing? (all external routes withdrawn?)
```

### BGP Incident Triage

```
BGP INCIDENT TRIAGE
================================================================

  ALERT: BGP peer state change / route withdrawal / hijack detection
  |
  v
  1. Which BGP sessions are affected?
  |
  +-- Single peer
  |   --> Interface down? (show interface)
  |       +-- YES --> Physical layer: cable, SFP, carrier circuit
  |       +-- NO  --> BGP config? Authentication? Prefix limit exceeded?
  |           show ip bgp neighbor <peer> | include state|error|reset
  |
  +-- Multiple peers
  |   --> All on same physical link?
  |       +-- YES --> Link/card failure
  |       +-- NO  --> Control plane issue (CPU, memory, process crash)
  |           show processes cpu sorted | head 10
  |           show memory summary
  |
  +-- All peers
      --> Total BGP failure
          +-- BGP process running? (show ip bgp summary)
          +-- CPU overload? (route leak causing convergence storm?)
          +-- Configuration change? (show archive log config all)
          +-- Upstream event? (check RIPE RIS, carrier status)
  
  2. Is your prefix being hijacked?
  |
  +-- Check: stat.ripe.net/widget/routing-status#<your-prefix>
  +-- Check: bgp.he.net (AS report for your ASN)
  +-- Check: BGPalerter alerts
  |
  +-- YES, hijack detected:
  |   --> Follow BGP Hijack Response Procedure (Section 4)
  |
  +-- NO, your prefix is correctly originated:
      --> The issue is reachability FROM external networks TO you
      --> Check upstream BGP sessions, transit provider status
```

### Packet Loss Triage

```
PACKET LOSS TRIAGE
================================================================

  SYMPTOM: Packet loss detected (monitoring, user report, MTR)
  |
  v
  1. Run MTR to destination (both directions, 200 probes):
     mtr -rwbzc 200 <destination>
  |
  +-- Loss at first hop (your gateway)
  |   --> Layer 1-2 problem on YOUR side
  |       Check: cable, switch port errors, duplex, VLAN
  |       show interfaces <port> | include error|CRC|runt
  |
  +-- Loss starts mid-path, persists to destination
  |   --> Transit/ISP problem
  |       Identify the hop where loss begins
  |       Determine the carrier for that hop (reverse DNS, whois)
  |       Open ticket with carrier, provide MTR evidence
  |
  +-- Loss at one mid-path hop only (destination is clean)
  |   --> ICMP rate limiting (NOT real packet loss)
  |       Verify: destination shows 0% loss
  |       Action: None -- this is normal ISP router behavior
  |
  +-- Loss only at destination
  |   --> Destination host problem
  |       Check: host NIC, host firewall, host CPU, rate limiting
  |       Verify with different protocols (TCP vs ICMP vs UDP)
  |
  +-- Intermittent loss (appears and disappears)
      --> Run extended MTR (1000+ probes over 30+ minutes)
      --> Correlate with time of day (congestion patterns)
      --> Check interface error counters for incrementing CRC/errors
      --> Check for micro-loops during routing convergence
```

---

## 12. Cross-References

- **Module 01 (Monitoring & Alerting):** Alerting systems must be tuned to detect the incident patterns described here -- BGP peer state changes, interface error rate thresholds, bandwidth utilization spikes, DNS resolution failures
- **Module 02 (Change Operations):** Many incidents are caused by changes. The change control process must include pre-change verification, rollback procedures, and post-change monitoring to catch incidents early
- **Module 05 (Certificate & PKI):** Certificate expiration can look like a network incident -- TLS handshake failures produce "connection refused" symptoms that get reported as "network down"
- **Module 07 (Firewall & ACL):** Firewall rule changes are a common cause of single-service outages. ACL audit logs are essential during triage to determine if a recent change caused the problem
- **Module 09 (Documentation & CMDB):** Accurate documentation of carrier circuits, diversity paths, and escalation contacts is critical during a war room. Outdated documentation delays resolution
- **Module 10 (Team & Vendor Management):** Carrier escalation procedures, vendor TAC contacts, and NOC staffing directly support the war room operations described here
- **SNE Module 02 (Routing & Switching):** BGP, OSPF, and STP protocol mechanics underpin the control-plane diagnosis in this module
- **SNE Module 07 (Observability):** MTR interpretation, interface error counter analysis, and DNS troubleshooting are shared between operations and engineering
- **SNE Module 10 (Reliability & DR):** BFD, ECMP, and fast-reroute mechanisms are the first line of automated incident response
- **RCA (Root Cause Analysis):** Post-incident analysis methodology. Every incident described here should produce an RCA document
- **DRP (Disaster Recovery):** Cable cut procedures and total infrastructure failure overlap with DR planning

---

## 13. Sources

1. Cisco. "Troubleshoot STP Problems and Related Design Considerations." Document ID 10556. https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/10556-16.html
2. Cisco. "Troubleshoot STP Issues on Catalyst Switches." Document ID 28943. https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/28943-170.html
3. Cisco. "Interface Counters and Error Counters." Configuration Guide. https://www.cisco.com/c/en/us/support/docs/routers/10000-series-routers/26gillaume-interface-errors.html
4. APNIC Blog. "How to properly interpret a traceroute or MTR." March 2022. https://blog.apnic.net/2022/03/28/how-to-properly-interpret-a-traceroute-or-mtr/
5. DigitalOcean. "How To Use Traceroute and MTR to Diagnose Network Issues." https://www.digitalocean.com/community/tutorials/how-to-use-traceroute-and-mtr-to-diagnose-network-issues
6. Bufferbloat.net. "Tests for Bufferbloat." https://www.bufferbloat.net/projects/bloat/wiki/Tests_for_Bufferbloat/
7. Cloudflare. "Cloudflare Radar's new BGP origin hijack detection system." Blog Post. https://blog.cloudflare.com/bgp-hijack-detection/
8. RFC 6810 -- The Resource Public Key Infrastructure (RPKI) to Router Protocol. IETF, 2013. https://www.rfc-editor.org/rfc/rfc6810
9. NTT. "BGPalerter: BGP and RPKI monitoring tool." GitHub. https://github.com/nttgin/BGPalerter
10. APNIC Blog. "Understanding stealthy BGP hijacking risk in the ROV era." October 2025. https://blog.apnic.net/2025/10/16/understanding-stealthy-bgp-hijacking-risk-in-the-rov-era/
11. NDSS Symposium. "Securing BGP ASAP: ASPA and other Post-ROV Defenses." 2025. https://www.ndss-symposium.org/wp-content/uploads/2025-675-paper.pdf
12. Equinix. "Remotely Triggered Black Hole Services." Product Documentation. https://docs.equinix.com/internet-exchange/ix-rtbh-guide/
13. FastNetMon. "BGP Blackhole Automation for DDoS Mitigation." 2026. https://fastnetmon.com/2026/01/06/bgp-blackhole-automation-for-ddos-mitigation/
14. Akamai. "What Is Blackhole (RTBH) Routing?" Glossary. https://www.akamai.com/glossary/what-is-blackhole-routing
15. Cloudflare. "Magic Transit: DDoS Protection for Networks." https://www.cloudflare.com/magic-transit/
16. Cisco. "Spanning Tree Loop Troubleshooting and Safeguards." Community Knowledge Base. https://community.cisco.com/t5/networking-knowledge-base/spanning-tree-loop-troubleshooting-and-safeguards/ta-p/3115040
17. ISC. BIND 9 Administrator Reference Manual. https://bind9.readthedocs.io/
18. Juniper Networks. "BPDU Protection for Spanning-Tree Protocols." Junos OS Documentation. https://www.juniper.net/documentation/us/en/software/junos/stp-l2/topics/topic-map/spanning-tree-bpdu-protection.html
19. Meta Engineering. "More details about the October 4 outage." October 5, 2021. https://engineering.fb.com/2021/10/05/networking-traffic/outage-details/
20. Cloudflare Blog. "August 30th 2020: Analysis of CenturyLink/Level(3) outage." August 30, 2020. https://blog.cloudflare.com/analysis-of-todays-centurylink-level-3-outage/
21. Cloudflare Community. "Incident: Route Leak Impacting Cloudflare." June 2019. https://community.cloudflare.com/t/incident-route-leak-impacting-cloudflare/93732
22. University of Oregon. "RouteViews Project." https://www.routeviews.org/routeviews/
23. RIPE NCC. "RIS Tools and Web Interfaces." https://www.ripe.net/analyse/archived-projects/ris-tools-web-interfaces/
24. NIST. "NIST Releases Test Tools to Accelerate Adoption of Emerging Route Leak Mitigation Standards." August 2025. https://www.nist.gov/news-events/news/2025/08/nist-releases-test-tools-accelerate-adoption-emerging-route-leak-mitigation
25. Cloudflare Blog. "Understanding how Facebook disappeared from the Internet." October 2021. https://blog.cloudflare.com/october-2021-facebook-outage/
26. ThousandEyes. "CenturyLink / Level 3 Outage Analysis." August 2020. https://blog.thousandeyes.com/centurylink-level-3-outage-analysis/
