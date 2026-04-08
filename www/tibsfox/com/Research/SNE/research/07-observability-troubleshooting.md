# Network Observability & Troubleshooting

> **Domain:** Network Monitoring, Telemetry, Flow Analysis, and Diagnostic Methodology
> **Module:** 7 -- SNMP, Streaming Telemetry, Flow Analysis, Packet Capture, Performance Monitoring, Physical Layer, Systematic Troubleshooting
> **Through-line:** *A network that cannot be observed cannot be understood. A network that cannot be understood cannot be fixed. Observability is not a feature you bolt on after deployment -- it is the foundation upon which every operational decision rests. The difference between "the network is slow" and "there is 2.3% packet loss at hop 7 due to a CRC error storm on port Gi0/1" is the difference between guessing and engineering. SNMP gave us counters. Streaming telemetry gave us resolution. Flow analysis gave us context. Packet capture gave us truth. Together they form a layered observability architecture where each tool answers questions the others cannot.*

---

## Table of Contents

1. [SNMP: The Foundation of Network Monitoring](#1-snmp-the-foundation-of-network-monitoring)
2. [Streaming Telemetry: The Next Generation](#2-streaming-telemetry-the-next-generation)
3. [Flow Analysis: Who is Talking to Whom](#3-flow-analysis-who-is-talking-to-whom)
4. [Packet Capture Methodology](#4-packet-capture-methodology)
5. [Network Performance Monitoring](#5-network-performance-monitoring)
6. [Physical Layer Troubleshooting](#6-physical-layer-troubleshooting)
7. [Systematic Troubleshooting Methodology](#7-systematic-troubleshooting-methodology)
8. [MTR and Traceroute Interpretation](#8-mtr-and-traceroute-interpretation)
9. [DNS Troubleshooting](#9-dns-troubleshooting)
10. [Tool Comparison Tables](#10-tool-comparison-tables)
11. [Troubleshooting Flowcharts](#11-troubleshooting-flowcharts)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. SNMP: The Foundation of Network Monitoring

Simple Network Management Protocol remains the most widely deployed network monitoring protocol on Earth. Virtually every managed network device -- switch, router, firewall, UPS, printer, wireless controller -- supports SNMP. Three decades after its introduction, SNMP is not dying. It is being supplemented by streaming telemetry in high-performance environments, but for the vast majority of infrastructure, SNMP is the monitoring protocol [1].

### SNMP Architecture

```
SNMP MONITORING ARCHITECTURE
================================================================

  NMS (Network Management Station)              SNMP Agent
  +-------------------------+                   +------------------+
  | Polling engine          |  GET / GETNEXT    | MIB data store   |
  |  - scheduled polls      |------------------>| OID tree         |
  |  - trap receiver        |  RESPONSE         | Counter values   |
  |  - MIB browser          |<------------------|                  |
  |  - alerting rules       |                   | Trap generator   |
  +-------------------------+   TRAP / INFORM   |  - link up/down  |
          ^                  <---------------------|  - threshold     |
          |                                     |  - auth failure  |
          v                                     +------------------+
  +-------------------------+
  | Time-series database    |
  | - RRDtool / InfluxDB    |
  | - Prometheus             |
  | - retention policies    |
  +-------------------------+
          |
          v
  +-------------------------+
  | Visualization           |
  | - Grafana dashboards    |
  | - LibreNMS/Zabbix UI   |
  | - custom alerting       |
  +-------------------------+
```

### SNMPv2c vs SNMPv3: Security Model Comparison

The choice between SNMPv2c and SNMPv3 is fundamentally a security decision. SNMPv2c transmits community strings in cleartext -- anyone with a packet capture on the management VLAN can read the community string and then read or write any OID on every device that shares it. SNMPv3 introduces the User-based Security Model (USM) with per-user authentication and encryption [2].

| Feature | SNMPv2c | SNMPv3 |
|---|---|---|
| Authentication | Community string (cleartext) | Username + HMAC (MD5/SHA/SHA-256) |
| Encryption | None | DES, 3DES, AES-128/192/256 |
| Access control | Community-based (coarse) | View-Based Access Control Model (VACM) |
| Message integrity | None | HMAC per PDU |
| Replay protection | None | Engineered time windows |
| User granularity | All users share community | Per-user credentials and permissions |
| Performance | Lower CPU overhead | Higher CPU (encryption/decryption) |
| Configuration | Simple (one string) | Complex (users, auth, priv, contexts) |
| Adoption | Universal | Growing but not universal |

**SNMPv3 security levels:**

- **noAuthNoPriv** -- Username only, no authentication hash, no encryption. Rarely useful; equivalent to v2c with a longer string.
- **authNoPriv** -- Username + HMAC authentication. Prevents spoofing and tampering but data is visible on the wire.
- **authPriv** -- Username + HMAC + AES encryption. The only level suitable for production security requirements. Government and financial networks mandate this level.

### MIBs: The Object Identifier Tree

Management Information Bases define what can be monitored. The OID tree starts at `.1.3.6.1` (iso.org.dod.internet) and branches into standard MIBs (maintained by IETF) and enterprise MIBs (vendor-specific) [3].

**Essential standard MIBs:**

| MIB | OID Prefix | What It Monitors |
|---|---|---|
| IF-MIB | 1.3.6.1.2.1.2 | Interface counters: octets, errors, discards, speed, oper status |
| IP-MIB | 1.3.6.1.2.1.4 | IP forwarding, addresses, routing table |
| HOST-RESOURCES-MIB | 1.3.6.1.2.1.25 | CPU, memory, disk, running processes |
| ENTITY-MIB | 1.3.6.1.2.1.47 | Physical components, serial numbers, firmware |
| BGP4-MIB | 1.3.6.1.2.1.15 | BGP peer state, prefix counts, timers |
| LLDP-MIB | 1.0.8802.1.1.2 | Link Layer Discovery Protocol neighbor data |
| BRIDGE-MIB | 1.3.6.1.2.1.17 | MAC address table, STP state |

**Critical interface counters (IF-MIB):**

```
ifHCInOctets    (.1.3.6.1.2.1.31.1.1.1.6)   -- 64-bit input bytes
ifHCOutOctets   (.1.3.6.1.2.1.31.1.1.1.10)  -- 64-bit output bytes
ifInErrors      (.1.3.6.1.2.1.2.2.1.14)      -- input errors (CRC, runt, giant)
ifOutErrors     (.1.3.6.1.2.1.2.2.1.20)      -- output errors (collisions, late)
ifInDiscards    (.1.3.6.1.2.1.2.2.1.13)      -- input queue drops
ifOutDiscards   (.1.3.6.1.2.1.2.2.1.19)      -- output queue drops
ifOperStatus    (.1.3.6.1.2.1.2.2.1.8)       -- 1=up, 2=down, 3=testing
ifSpeed         (.1.3.6.1.2.1.2.2.1.5)       -- interface speed in bps
```

Always use the 64-bit HC (High Capacity) counters for interfaces above 100 Mbps. The 32-bit counters wrap in approximately 34 seconds on a saturated 10 Gbps link, producing meaningless delta calculations.

### Polling vs Traps

**Polling** is the NMS-initiated pull model. The NMS walks through OIDs on a schedule (typically every 5 minutes for standard metrics, 60 seconds for critical interfaces). Polling is deterministic -- you control the resolution and the data you collect. The trade-off is that events between polls are invisible.

**Traps** are device-initiated push notifications. When an interface goes down, a BGP session flaps, or a temperature threshold is exceeded, the device sends a trap immediately. Traps have no delivery guarantee in v2c (UDP, fire-and-forget). SNMPv3 INFORM messages add acknowledgment.

**Practical polling architecture:**

- Critical infrastructure (core switches, border routers): 60-second polling, trap-enabled
- Distribution layer: 300-second polling, trap-enabled
- Access layer: 300-second polling, traps for link state only
- Server infrastructure: 300-second polling via host agent (net-snmp)

### NMS Platform Comparison

| Platform | License | Strengths | Weaknesses | Best For |
|---|---|---|---|---|
| LibreNMS | GPL | Auto-discovery, 10,000+ device templates, clean UI, active community | No streaming telemetry, limited config mgmt | Network-centric shops wanting simplicity |
| Zabbix | GPL v2 | Enterprise features, extreme customization, agent-based + SNMP | Steep learning curve, complex templates | Large enterprises needing unified IT monitoring |
| PRTG | Commercial | Polished UI, sensor-based model, fast deployment | Cost scales with sensors ($1,750/500 sensors), Windows-only server | SMBs wanting all-in-one with minimal setup |
| Nagios/Icinga | GPL/GPL v2 | Mature ecosystem, extensive plugin library | Dated UI, configuration-heavy | Shops with Nagios expertise and existing investment |
| Observium | QPL/Commercial | Strong network focus, traffic accounting | Community edition limitations, slower development | ISP/carrier environments with billing needs |

---

## 2. Streaming Telemetry: The Next Generation

Streaming telemetry represents a fundamental architectural shift from pull to push. Instead of the NMS asking devices for data on a schedule, devices continuously stream structured data to collectors. The resolution jumps from minutes to seconds or sub-seconds. The data model shifts from flat OID trees to hierarchical YANG models. The encoding shifts from BER/ASN.1 to efficient Protobuf or JSON over gRPC [4].

### gNMI: gRPC Network Management Interface

gNMI is an OpenConfig-defined protocol that provides a unified interface for configuration management and streaming telemetry. It runs over gRPC (HTTP/2 + Protobuf), inheriting TLS encryption, bidirectional streaming, and modern authentication [5].

**gNMI operations:**

| Operation | Purpose | SNMP Equivalent |
|---|---|---|
| Get | Retrieve current state | SNMP GET |
| Set | Modify configuration (update, replace, delete) | SNMP SET |
| Subscribe | Stream data changes continuously | No direct equivalent (traps are event-only) |
| Capabilities | Discover supported models and encodings | sysDescr / sysObjectID |

**Subscribe modes -- the core innovation:**

```
gNMI SUBSCRIPTION MODES
================================================================

  STREAM (continuous telemetry)
  +--------+                    +----------+
  | Device | --- push every N ---> | Collector |
  +--------+    seconds            +----------+
  
  - sample: push at fixed interval (e.g., every 10 seconds)
  - on_change: push only when value changes (ideal for state)
  
  ONCE (snapshot)
  +--------+                    +----------+
  | Device | --- single dump ----> | Collector |
  +--------+                    +----------+
  
  POLL (collector-initiated, like SNMP but over gRPC)
  +--------+                    +----------+
  | Device | <-- request --------- | Collector |
  +--------+ --- response -------> +----------+
```

### Dial-In vs Dial-Out

**Dial-in** -- the collector initiates the gRPC connection to the device. The collector acts as the gRPC client. This is the gNMI standard model. Advantages: collector controls what data it receives, subscription management is centralized. Disadvantage: requires the collector to reach every device (firewall rules, NAT traversal).

**Dial-out** -- the device initiates the gRPC connection to the collector. The device acts as the gRPC client. This is a vendor extension (Cisco MDT, Juniper uses both). Advantages: devices behind NAT can push data outward, simpler firewall rules. Disadvantage: subscription configuration lives on each device, harder to manage at scale.

### The TIG Stack for Network Telemetry

The Telegraf-InfluxDB-Grafana (TIG) stack has emerged as the standard open-source pipeline for consuming streaming telemetry [6]:

```
NETWORK TELEMETRY PIPELINE (TIG STACK)
================================================================

  Network Devices                Telegraf               InfluxDB            Grafana
  +------------+                +----------+           +----------+       +----------+
  | Router     |--gNMI-------->|          |           |          |       |          |
  | Switch     |--SNMP-------->| Input    |           | Time-    |       | Dash-    |
  | Firewall   |--syslog------>| plugins  |---------->| series   |------>| boards   |
  | Server     |--NetFlow----->|          |           | storage  |       | Alerts   |
  | Wireless   |--streaming--->| Transform|           | Queries  |       | Panels   |
  +------------+                +----------+           +----------+       +----------+
                                  300+ input              Retention         100+
                                  plugins                 policies          data sources
```

**Telegraf network-relevant input plugins:**

- `inputs.snmp` -- SNMP polling with MIB translation
- `inputs.gnmi` -- gNMI streaming telemetry subscriber
- `inputs.cisco_telemetry_mdt` -- Cisco Model-Driven Telemetry
- `inputs.sflow` -- sFlow packet sampling
- `inputs.netflow` -- NetFlow/IPFIX flow collection
- `inputs.syslog` -- Syslog message ingestion
- `inputs.ping` -- ICMP probes for reachability
- `inputs.net_response` -- TCP/UDP port checks

### SNMP vs Streaming Telemetry: When to Use Each

| Dimension | SNMP | Streaming Telemetry |
|---|---|---|
| Data resolution | Minutes (typical 5-min polls) | Seconds to sub-seconds |
| Data model | OID tree (flat, vendor-specific MIBs) | YANG models (hierarchical, structured) |
| Transport | UDP (unreliable) | gRPC/HTTP2 (TLS, reliable) |
| Direction | Pull (NMS-initiated) | Push (device-initiated) |
| Encoding | BER/ASN.1 | Protobuf, JSON, CBOR |
| CPU impact on device | Per-poll processing | Continuous but predictable |
| Device support | Universal | Growing (Cisco IOS-XR/XE, Junos, Arista EOS, Nokia SR OS) |
| Ecosystem maturity | 30+ years | ~8 years |
| Monitoring platforms | All NMS platforms | TIG stack, Prometheus, Kafka pipelines |

**Practical recommendation:** Run both. SNMP provides the baseline monitoring that covers every device. Streaming telemetry provides high-resolution data for critical infrastructure where 5-minute polls miss transient events -- spine switches, border routers, WAN links, and anything where a 30-second microburst matters.

---

## 3. Flow Analysis: Who is Talking to Whom

SNMP and telemetry tell you how much traffic crosses an interface. Flow analysis tells you who generated that traffic, where it went, what protocol it used, and how long the conversation lasted. Flow data is the bridge between interface counters ("port is at 80% utilization") and actionable intelligence ("a single host is running a 7 Gbps backup across the WAN link during business hours") [7].

### Protocol Comparison

| Feature | NetFlow v5 | NetFlow v9 | IPFIX | sFlow |
|---|---|---|---|---|
| Standard | Cisco proprietary | Cisco (basis for IPFIX) | IETF RFC 7011 | RFC 3176 |
| Architecture | Fixed format | Template-based | Template-based | Packet sampling |
| Fields | Fixed 7-tuple | Configurable templates | Configurable + enterprise IEs | Full packet header sample |
| IPv6 | No | Yes | Yes | Yes |
| MPLS labels | No | Yes | Yes | Yes (in sample) |
| VLAN tags | No | Yes | Yes | Yes (in sample) |
| Sampling | Router-dependent | Configurable | Configurable | Always sampled |
| Bidirectional | No | Optional | Yes (biflow) | No |
| Transport | UDP | UDP | UDP or SCTP | UDP |
| State tracking | Stateful (flow cache) | Stateful | Stateful | Stateless |

### NetFlow: Stateful Flow Tracking

NetFlow maintains a flow cache on the network device. A flow is defined by a tuple of fields (source IP, destination IP, source port, destination port, protocol, ToS, input interface). The device tracks every active flow, accumulating byte and packet counts. When a flow expires (idle timeout, active timeout, or cache full), the device exports a flow record to the collector [7].

**NetFlow v5** uses a fixed record format: 48 bytes per flow, limited to IPv4, no MPLS, no VLAN. It remains widely deployed because of its simplicity and universal hardware support.

**NetFlow v9** introduced template-based records. The exporter first sends a template that defines the record format, then sends data records that reference the template. This allows arbitrary field combinations and future extensibility without protocol changes.

**IPFIX** (IP Flow Information Export) is the IETF standardization of NetFlow v9. It adds variable-length fields, enterprise-defined Information Elements (allowing vendor-specific extensions), SCTP transport for reliable delivery, and bidirectional flow support. IPFIX is the recommended standard for new deployments.

### sFlow: Stateless Packet Sampling

sFlow takes a fundamentally different approach. Instead of tracking stateful flow records on the device, sFlow randomly samples one packet out of every N packets (the sampling rate), copies the packet header (up to 128 bytes by default), and exports the sample immediately. The collector reconstructs traffic patterns from the statistical sample [8].

**Sampling rate guidance:**

| Link Speed | Recommended Rate | Rationale |
|---|---|---|
| 100 Mbps | 1:200 | Low volume, higher accuracy needed |
| 1 Gbps | 1:1000 | Standard enterprise |
| 10 Gbps | 1:2000-1:4000 | Balance accuracy with export volume |
| 40 Gbps | 1:4000-1:8000 | Reduce collector load |
| 100 Gbps | 1:8000-1:16000 | High volume environments |

**sFlow advantages:** Zero CPU impact on the data plane (sampling happens in hardware ASIC), stateless operation (no flow cache to overflow), immediate export (no timeout delays), full packet header capture (not just the 7-tuple).

**sFlow limitations:** Accuracy depends on sampling rate (low-volume flows may be missed entirely), not suitable for per-flow accounting or billing, statistical estimation introduces variance for small traffic volumes.

### Flow Collector Platforms

| Collector | Architecture | Strengths | Best For |
|---|---|---|---|
| Kentik | Cloud SaaS | Massive scale, ML-powered anomaly detection, BGP correlation | Large enterprises, ISPs, multi-cloud |
| ElastiFlow | Elasticsearch-based | Integrates with existing ELK stack, flexible queries | Shops with Elasticsearch investment |
| ntopng | Standalone + ClickHouse | Open-source, DPI, packet + flow in one tool, max 64 exporters | Small-to-medium deployments |
| PRTG Flow | Integrated with PRTG | Unified with device monitoring | PRTG shops wanting flow data |
| Scrutinizer (Plixer) | Appliance/VM | Forensic flow analysis, compliance reporting | Regulated environments |
| nfdump/nfsen | File-based | Lightweight, scriptable, NFDUMP format | Research, historical archives |

---

## 4. Packet Capture Methodology

Flow data tells you who talked to whom. Packet capture shows you exactly what was said. When SNMP counters show errors and flow data shows the affected traffic, packet capture provides the definitive evidence -- the actual bytes on the wire. Packet capture is the court of last resort in network troubleshooting [9].

### tcpdump: The Command-Line Standard

tcpdump uses Berkeley Packet Filter (BPF) syntax to express capture filters. BPF filters are compiled into kernel bytecode, meaning traffic that does not match the filter is never copied to userspace -- this is critical for performance on high-speed links.

**Essential tcpdump filters:**

```bash
# Capture all traffic to/from a specific host
tcpdump -i eth0 host 10.1.1.100

# Capture only TCP SYN packets (connection initiation)
tcpdump -i eth0 'tcp[tcpflags] & (tcp-syn) != 0'

# Capture DNS queries (UDP port 53)
tcpdump -i eth0 -n udp port 53

# Capture HTTP traffic (port 80 or 443)
tcpdump -i eth0 -n 'port 80 or port 443'

# Capture ICMP (ping, unreachable, TTL exceeded)
tcpdump -i eth0 icmp

# Capture packets with TCP RST flag (connection resets)
tcpdump -i eth0 'tcp[tcpflags] & (tcp-rst) != 0'

# Capture traffic on a specific VLAN
tcpdump -i eth0 vlan 100

# Capture only packets larger than 1400 bytes (MTU issues)
tcpdump -i eth0 'greater 1400'

# Capture BGP traffic (TCP port 179)
tcpdump -i eth0 -n tcp port 179

# Write to file for later analysis in Wireshark
tcpdump -i eth0 -w /tmp/capture.pcap -c 10000 host 10.1.1.100

# Rotate capture files (100MB each, keep 10)
tcpdump -i eth0 -w /tmp/capture.pcap -C 100 -W 10
```

**Critical tcpdump flags:**

| Flag | Purpose |
|---|---|
| `-i <interface>` | Capture interface (use `any` for all) |
| `-n` | No DNS resolution (prevents capture delays) |
| `-nn` | No DNS or port name resolution |
| `-w <file>` | Write raw packets to pcap file |
| `-r <file>` | Read from pcap file |
| `-c <count>` | Stop after N packets |
| `-s <snaplen>` | Capture N bytes per packet (0 = full packet) |
| `-v / -vv / -vvv` | Increasing verbosity |
| `-e` | Show link-layer headers (MAC addresses, VLAN tags) |
| `-X` | Show packet contents in hex and ASCII |
| `-A` | Show packet contents in ASCII only |

### Wireshark Display Filters

Wireshark display filters use a different syntax from tcpdump BPF filters. Display filters operate on decoded protocol fields and support comparison operators, logical operators, and protocol-specific field names.

**Essential Wireshark display filters:**

```
# TCP retransmissions (the first sign of trouble)
tcp.analysis.retransmission

# TCP zero window (receiver buffer full)
tcp.analysis.zero_window

# TCP RST (connection reset)
tcp.flags.reset == 1

# DNS queries only
dns.flags.response == 0

# HTTP response codes >= 400
http.response.code >= 400

# TLS handshake failures
tls.alert_message

# Slow TCP handshakes (SYN to SYN-ACK > 100ms)
tcp.analysis.initial_rtt > 0.1

# Packets with IP fragmentation
ip.flags.mf == 1 or ip.frag_offset > 0

# ICMP destination unreachable
icmp.type == 3

# Traffic from a specific subnet
ip.src == 10.1.0.0/16

# Exclude specific traffic (show everything except SSH)
not tcp.port == 22

# Combine filters
http.request.method == "POST" and ip.dst == 10.1.1.50
```

### Traffic Access: SPAN Ports, TAPs, and Packet Brokers

Before you can capture packets, you need access to the traffic. Three mechanisms exist, each with distinct characteristics [10]:

| Method | Mechanism | Fidelity | Performance Impact | Cost | Best For |
|---|---|---|---|---|---|
| SPAN port | Switch copies selected traffic to a designated port | Lossy under load (lowest forwarding priority) | Switch CPU overhead | Free (built into switch) | Ad hoc troubleshooting, low-volume monitoring |
| Network TAP | Passive hardware device inline on the cable | Full line rate, zero packet loss, exact copy | Zero (passive, no electronics in data path for passive TAPs) | $200-$2,000+ per link | Production monitoring, security, compliance |
| Packet broker | Aggregation device between TAPs/SPANs and tools | Full fidelity + filtering, deduplication, load balancing | None on production network | $10,000-$100,000+ | Large-scale monitoring architectures |

**SPAN port limitations that matter:**

- Oversubscription: a SPAN port mirroring a full-duplex 10G link needs 20 Gbps of capacity on a single port -- impossible. Packets get dropped silently.
- Priority: SPAN traffic has the lowest forwarding priority on the switch ASIC. Under congestion, mirrored packets are the first to be discarded.
- Timing: SPAN ports can alter inter-packet timing, making jitter and latency analysis unreliable.
- Resource consumption: SPAN sessions consume TCAM entries and switch CPU cycles.

**When to use TAPs:** Any link where packet loss in the capture is unacceptable -- security monitoring (IDS/IPS feed), compliance recording, production troubleshooting of intermittent issues, and any capture that will be used as evidence.

### Remote Packet Capture

When the problem device is in a remote data center, several options exist:

- **tcpdump over SSH:** `ssh user@remote "tcpdump -i eth0 -w - host 10.1.1.100" | wireshark -k -i -` -- streams remote capture directly into local Wireshark.
- **RSPAN/ERSPAN:** Remote SPAN extends mirrored traffic across VLANs (RSPAN) or GRE tunnels (ERSPAN) to a remote collector. ERSPAN encapsulates in GRE, allowing capture across L3 boundaries.
- **Packet broker remote tap:** Enterprise packet brokers (Gigamon, Keysight) support remote tap modules that tunnel captured traffic back to a central analysis cluster.

---

## 5. Network Performance Monitoring

Interface counters tell you utilization. Flow data tells you traffic composition. Performance monitoring tells you user experience. The three metrics that define network performance from the user's perspective are latency, jitter, and packet loss [11].

### The Three Pillars of Network Performance

**Latency** -- the time for a packet to travel from source to destination and back (RTT). Measured in milliseconds. For interactive applications (voice, video, trading), every millisecond matters. For voice calls, ITU G.114 recommends one-way latency below 150ms.

**Jitter** -- the variation in latency between consecutive packets. Measured as the standard deviation or interquartile range of delay. Jitter kills real-time applications because it causes buffer underruns (audio gaps, video freezes). VoIP systems typically tolerate up to 30ms of jitter before quality degrades.

**Packet loss** -- the percentage of packets that never arrive. Even 0.1% packet loss causes visible degradation in TCP throughput (every lost packet triggers retransmission and window reduction). For UDP applications (voice, video), lost packets mean lost data -- there is no retransmission.

### Synthetic Monitoring Platforms

| Platform | Type | Agents | Strength | Use Case |
|---|---|---|---|---|
| ThousandEyes (Cisco) | Cloud + on-prem agents | Cloud + enterprise | Deep path visualization, Internet outage detection, BGP route analysis | Multi-cloud, SaaS dependency monitoring |
| Catchpoint | Cloud + on-prem agents | 3,000+ global nodes | End-user experience, real-time BGP monitoring, remediation scoring | CDN/web performance, user-centric monitoring |
| Obkio | SaaS | Software agents | Network performance between sites, simple deployment | WAN/SD-WAN monitoring, site-to-site performance |
| Smokeping | Open-source | Self-hosted | Latency visualization over time, beautiful graphs, free | Budget-conscious shops, historical latency tracking |
| Perfsonar | Open-source | Federated mesh | Research/education networks, standardized testing | ISP peering, R&E networks, capacity testing |

**Synthetic monitoring architecture:**

```
SYNTHETIC MONITORING -- TEST TYPES
================================================================

  HTTP Transaction Test
  Agent --> DNS lookup --> TCP connect --> TLS handshake --> HTTP GET --> Response
  [measures each phase independently: DNS time, connect time, TLS time, TTFB, total]

  Network Path Trace
  Agent --> hop 1 --> hop 2 --> ... --> hop N --> destination
  [maps every router hop, measures per-hop latency, detects path changes]

  BGP Route Monitor
  Agent <-- BGP feed from route collectors
  [detects prefix hijacks, route leaks, AS path changes, origin flaps]

  VoIP/RTP Test
  Agent A <========> Agent B  (bidirectional UDP stream)
  [measures MOS score, latency, jitter, packet loss in both directions]

  DNS Test
  Agent --> recursive resolver --> authoritative chain --> response
  [measures resolution time, validates DNSSEC, detects delegation issues]
```

---

## 6. Physical Layer Troubleshooting

When the application team says "the network is slow" and every counter, flow record, and packet capture looks clean, the problem is often below Layer 3. Physical layer issues produce symptoms that masquerade as higher-layer problems -- intermittent connectivity that looks like routing flaps, packet loss that looks like congestion, and errors that appear randomly across multiple protocols [12].

### Cable Testing

**Copper (Cat5e/6/6a):**

| Test | What It Detects | Tool |
|---|---|---|
| Wire map | Miswires, opens, shorts, crossed pairs | Basic cable tester |
| Length | Cable too long (100m max for Cat6) | Time-Domain Reflectometer (TDR) |
| NEXT (Near-End Crosstalk) | Electromagnetic interference between pairs | Cable certifier (Fluke DSX) |
| Return loss | Signal reflection from impedance mismatches | Cable certifier |
| Alien crosstalk | Interference from adjacent cables in bundle | Cable certifier (Level V/VI) |
| PoE load test | Power delivery under load | PoE tester |

**Fiber optic:**

| Test | What It Detects | Tool |
|---|---|---|
| Optical power | Transmit/receive power in dBm | Optical power meter |
| Insertion loss | Total loss end-to-end | Light source + power meter (OLTS) |
| OTDR trace | Location and type of every event (splice, connector, break, bend) | OTDR |
| Visual fault | Breaks, macrobends, bad connectors | Visual fault locator (VFL, red laser) |

### SFP Diagnostics and Digital Optical Monitoring (DOM)

Modern SFP/SFP+/QSFP transceivers include Digital Optical Monitoring (DOM), also called Digital Diagnostic Monitoring (DDM). DOM provides real-time telemetry from the transceiver itself -- no external test equipment needed [12].

**DOM parameters:**

| Parameter | Normal Range (typical 10G-LR) | Warning Threshold | Alarm Condition |
|---|---|---|---|
| TX Power | -1 to -8 dBm | Below -8.2 dBm | Below -11.3 dBm (link budget exceeded) |
| RX Power | -1 to -14.4 dBm | Below -14.4 dBm | Below -15.4 dBm (receiver sensitivity limit) |
| Temperature | 0 to 70 C | Above 70 C | Above 75 C (thermal shutdown imminent) |
| Voltage | 3.13 to 3.47 V | Outside +/- 5% | Outside +/- 10% (power supply issue) |
| Bias current | 5 to 70 mA | Above 70 mA | Above 80 mA (laser degradation) |

**Reading DOM on network devices:**

```
! Cisco IOS/IOS-XE
show interfaces transceiver detail

! Arista EOS
show interfaces transceiver

! Junos
show interfaces diagnostics optics ge-0/0/0

! Linux (ethtool)
ethtool -m eth0
```

**DOM troubleshooting logic:** If TX power is normal but RX power is low, the problem is in the fiber path (dirty connector, bad splice, excessive bend, fiber break). If TX power is low, the SFP itself is failing (laser degradation). If both are normal but errors persist, check for wavelength mismatch (single-mode SFP in multi-mode fiber or vice versa) or distance exceed (signal attenuation beyond receiver sensitivity).

### OTDR Interpretation

An Optical Time-Domain Reflectometer sends light pulses into the fiber and measures backscattered reflections. The resulting trace shows distance on the X axis and signal level on the Y axis. Every event on the fiber appears as a feature on the trace [12]:

```
OTDR TRACE -- EVENT IDENTIFICATION
================================================================

  Signal
  Level
  (dB)
    |
    |____          ___
    |    \   /\   |   |         ___
    |     \_/  \__|   |________|   |
    |                              |___________
    |                                          |
    +-----|-----|------|------|-------|---------|---> Distance
          |     |      |      |       |         |
       Connector  Splice  Bend   Connector   Fiber end
       (reflection (loss   (loss   (reflection  (strong
        + loss)    only)   only)   + loss)      reflection)

  Reflective events: connectors, mechanical splices, fiber end, cracks
  Non-reflective events: fusion splices, macrobends, stress points
```

**Key OTDR specifications:**

- **Dynamic range:** Determines maximum testable fiber length (higher = longer reach)
- **Dead zone:** Minimum distance between resolvable events (shorter = better for short links)
- **Event dead zone:** Typically 0.8-3m (cannot resolve two connectors closer than this)
- **Pulse width:** Shorter pulses = better resolution but less range. Longer pulses = more range but wider dead zones

---

## 7. Systematic Troubleshooting Methodology

Network troubleshooting is not intuition -- it is methodology. Experienced engineers are faster not because they guess better, but because they follow systematic processes that eliminate possibilities efficiently. Two dominant methodologies exist, and skilled engineers use both depending on context [13].

### OSI Layer-by-Layer (Bottom-Up)

Start at Layer 1, verify each layer works before moving up. This is the safest methodology for unknown problems -- it ensures you do not waste time debugging application-layer issues when the cable is unplugged.

```
BOTTOM-UP TROUBLESHOOTING
================================================================

  Layer 1 (Physical)
  - Link light? (up/down, speed/duplex)
  - Cable test? (TDR/OTDR)
  - SFP DOM? (TX/RX power within range)
  - Interface errors? (CRC, runts, giants)
        |
        v (Layer 1 verified clean)
  Layer 2 (Data Link)
  - MAC address in CAM table?
  - VLAN membership correct?
  - STP state? (forwarding, not blocking/learning)
  - ARP resolution working? (arp -a, show arp)
  - 802.1X authenticated?
        |
        v (Layer 2 verified clean)
  Layer 3 (Network)
  - IP address/mask correct?
  - Default gateway reachable? (ping gateway)
  - Route to destination exists? (show ip route, ip route get)
  - ACL/firewall permitting traffic?
  - MTU correct? (ping with DF bit, various sizes)
        |
        v (Layer 3 verified clean)
  Layer 4 (Transport)
  - TCP handshake completing? (SYN -> SYN-ACK -> ACK)
  - Port open? (telnet/nc to port)
  - TCP window scaling working?
  - Connection resets? (RST packets)
        |
        v (Layer 4 verified clean)
  Layer 7 (Application)
  - DNS resolving correctly? (dig/nslookup)
  - TLS negotiating? (openssl s_client)
  - Application-specific logs?
  - Load balancer health checks passing?
```

### Divide-and-Conquer (Half-Split)

When the path between source and destination crosses many devices, testing every hop sequentially is inefficient. The half-split method tests the midpoint first, then recursively narrows. With N hops, this resolves in O(log N) tests instead of O(N) [13].

```
HALF-SPLIT METHOD
================================================================

  Source ----[A]----[B]----[C]----[D]----[E]---- Destination
                           ^
                     Test here first
                     
  If midpoint (C) works:
    Problem is between C and Destination
    Source ----[A]----[B]----[C]----[D]----[E]---- Destination
                                    ^
                              Test here next
                              
  If midpoint (C) fails:
    Problem is between Source and C
    Source ----[A]----[B]----[C]----[D]----[E]---- Destination
               ^
         Test here next
         
  Continue halving until the fault point is isolated.
```

### Spot-the-Difference Method

When something was working and now is not, the most efficient approach is to identify what changed. This is not guessing -- it is a systematic comparison of the working state versus the current state.

**Diff sources:**
- Configuration management: compare current config to last known good (RANCID, Oxidized, git)
- SNMP/telemetry: compare current counters to baseline (error rates, utilization, BGP peer counts)
- Route table: compare current routes to expected (show ip route, BGP looking glass)
- Syslogs: check for recent events (interface flaps, BGP session changes, OSPF adjacency drops)
- Change management: what changes were deployed in the last 24 hours?

---

## 8. MTR and Traceroute Interpretation

MTR (My Traceroute) combines traceroute and ping into a single tool that continuously probes every hop along the path, providing real-time statistics on packet loss and latency at each point. Interpreting MTR output correctly requires understanding its subtleties -- not all packet loss is real, not all latency spikes indicate problems [14].

### Reading MTR Output

```
HOST: source-server                Loss%   Snt   Last   Avg  Best  Wrst StDev
  1.|-- gateway.local               0.0%   100    0.4   0.5   0.3   1.2   0.1
  2.|-- isp-pe1.example.net         0.0%   100    3.2   3.1   2.8   4.5   0.3
  3.|-- core1.isp.net              15.0%   100   12.1  11.8  10.2  45.3   5.2
  4.|-- ix-peer.exchange.net        0.0%   100   15.3  15.1  14.8  18.2   0.5
  5.|-- cdn-edge.target.com         0.0%   100   16.2  16.0  15.5  19.1   0.6
```

**Key interpretation rules:**

1. **Packet loss at a single hop that does not continue downstream is NOT real packet loss.** In the example above, hop 3 shows 15% loss, but hops 4 and 5 show 0%. This means hop 3 is rate-limiting ICMP responses to MTR probes -- the actual transit traffic is flowing fine. ISP routers commonly deprioritize ICMP to protect the control plane.

2. **Packet loss that starts at a hop and continues on ALL subsequent hops IS real.** If hops 3, 4, and 5 all showed 15% loss, the problem is at or before hop 3.

3. **Latency increases that persist are meaningful. Latency spikes at a single hop are not.** If the average jumps from 15ms at hop 4 to 85ms at hop 5 and stays at 85ms for all remaining hops, there is congestion or distance at that link. If hop 3 shows 45ms but hop 4 returns to 15ms, the router at hop 3 is simply slow at generating ICMP TTL exceeded messages (a CPU-bound operation, not a forwarding-path issue).

4. **Always run MTR in both directions.** Asymmetric routing means the forward path and return path may traverse different routers. Loss on the return path appears as loss at the source, but the problem is actually on the reverse path. Ask the remote end to run MTR back toward you.

5. **Asterisks (***) do not always mean the hop is down.** Many routers are configured to not respond to ICMP at all. The absence of a response from a transit hop does not indicate a problem as long as subsequent hops respond normally.

### traceroute vs MTR vs Paris traceroute

| Tool | Method | Load Balancing Awareness | Statistics | Use Case |
|---|---|---|---|---|
| traceroute | Incrementing TTL, one probe set | No (may show false path changes) | Single snapshot | Quick path discovery |
| mtr | Continuous probes, real-time stats | No (same limitation) | Running average, loss%, jitter | Sustained monitoring |
| Paris traceroute | Constant flow ID per probe set | Yes (pins to single ECMP path) | Single snapshot per path | Accurate path in ECMP environments |
| dublin-traceroute | ECMP-aware, maps all paths | Yes (intentionally discovers all paths) | Multi-path view | Complete ECMP topology mapping |

---

## 9. DNS Troubleshooting

DNS is the most common single point of failure in application connectivity. "The network is down" is, more often than not, "DNS is broken." Systematic DNS troubleshooting requires understanding the resolution chain from stub resolver to recursive resolver to authoritative server, and having the tools to test each link independently [15].

### dig: The DNS Troubleshooting Standard

```bash
# Basic query -- A record
dig example.com A

# Query a specific nameserver directly
dig @8.8.8.8 example.com A

# Trace the full delegation chain (recursive from root)
dig +trace example.com A

# Short output (just the answer)
dig +short example.com A

# Show all sections (question, answer, authority, additional)
dig +noall +answer +authority +additional example.com A

# Check SOA for zone serial (useful for verifying zone transfers)
dig @ns1.example.com example.com SOA

# Query for NS records (who is authoritative?)
dig example.com NS

# Check DNSSEC validation
dig +dnssec example.com A

# Check specific record types
dig example.com MX       # Mail servers
dig example.com TXT      # SPF, DKIM, verification records
dig example.com AAAA     # IPv6 addresses
dig example.com CNAME    # Alias chains
dig _sip._tcp.example.com SRV  # Service records

# Reverse DNS lookup
dig -x 192.0.2.1

# Check EDNS Client Subnet (for GeoDNS debugging)
dig +subnet=203.0.113.0/24 @8.8.8.8 cdn.example.com A
```

### DNS Delegation Tracing

When a domain fails to resolve, the problem could be at any point in the delegation chain. Tracing walks the chain from the root servers down:

```
DNS DELEGATION CHAIN -- example.com
================================================================

  Root servers (.):
    "Who handles .com?"
    --> Referral to .com TLD servers
    
  .com TLD servers:
    "Who handles example.com?"
    --> Referral to ns1.example.com, ns2.example.com
    (This is the delegation -- the NS records in the .com zone)
    
  Authoritative servers (ns1.example.com):
    "What is the A record for example.com?"
    --> 93.184.216.34 (NOERROR, authoritative answer)
```

**Common DNS failure modes:**

| Symptom | dig Output | Likely Cause |
|---|---|---|
| SERVFAIL from recursive | Status: SERVFAIL | DNSSEC validation failure, or authoritative unreachable |
| NXDOMAIN | Status: NXDOMAIN | Domain does not exist, or delegation is broken |
| No answer section | NOERROR, empty answer | Record type does not exist, or CNAME chain broken |
| Timeout | Connection timed out | Firewall blocking UDP/53, nameserver down |
| Wrong IP returned | Answer with unexpected IP | DNS hijacking, stale cache, wrong zone file |
| Slow resolution | High query time in dig output | Recursive server overloaded, or authoritative slow |

### DNS Resolution Performance

```bash
# Measure resolution time
dig example.com | grep "Query time"
;; Query time: 23 msec

# Compare cached vs uncached (flush cache first on recursive)
# Linux systemd-resolved:
resolvectl flush-caches

# Test iterative resolution time (bypasses cache)
dig +trace +stats example.com A | grep "Query time"

# Test each authoritative server independently
dig @ns1.example.com example.com A +stats
dig @ns2.example.com example.com A +stats
```

---

## 10. Tool Comparison Tables

### Network Monitoring Platform Matrix

| Capability | LibreNMS | Zabbix | PRTG | Nagios | Datadog | ThousandEyes |
|---|---|---|---|---|---|---|
| SNMP polling | Excellent | Excellent | Excellent | Good (plugins) | Good (agent) | N/A |
| Auto-discovery | Excellent | Good | Good | Poor | Good | N/A |
| Streaming telemetry | None | Limited | None | None | Yes | N/A |
| Flow analysis | Built-in | Via plugin | Built-in | Via plugin | Yes | N/A |
| Synthetic monitoring | None | Web checks | HTTP sensor | Via plugins | Yes | Excellent |
| Path visualization | None | None | None | None | Limited | Excellent |
| Alert quality | Good | Excellent | Good | Good | Excellent | Excellent |
| API/automation | REST API | REST + RPC | REST API | Limited | Extensive | REST API |
| Cost | Free | Free | From $1,750 | Free | Per-host | Per-agent |
| Setup complexity | Low | High | Low | High | Medium | Low |

### Capture and Analysis Tool Matrix

| Tool | Packet Capture | Flow Analysis | Deep Inspection | Live Analysis | Offline Analysis | Platform |
|---|---|---|---|---|---|---|
| tcpdump | Yes | No | No | Yes | Yes (pcap) | Linux/macOS/BSD |
| Wireshark | Yes | No | Yes (protocol decoders) | Yes | Yes (pcap) | Cross-platform |
| tshark | Yes | No | Yes (like Wireshark, CLI) | Yes | Yes (pcap) | Cross-platform |
| ngrep | Yes (pattern match) | No | Partial | Yes | No | Linux/macOS |
| ntopng | Yes | Yes (NetFlow/sFlow/IPFIX) | Yes (nDPI) | Yes | Limited | Linux |
| Zeek (Bro) | Yes (metadata) | Yes (conn.log) | Yes (protocol analyzers) | Yes | Yes (logs) | Linux/macOS |

---

## 11. Troubleshooting Flowcharts

### "The Network is Slow" -- Universal Starting Point

```
USER REPORTS: "The network is slow"
================================================================

  1. Is it slow for one user or many?
     |
     +-- One user --> Check user's device, cable, switch port, VLAN
     |               (Layer 1-2 problem)
     |
     +-- Many users, one site --> Check uplink, WAN circuit
     |                           (capacity or routing problem)
     |
     +-- Many users, many sites --> Check core network, DNS, shared service
                                    (infrastructure-wide problem)

  2. Is it slow for one application or all applications?
     |
     +-- One application --> DNS for that app? Server health? Load balancer?
     |                      (application or service problem)
     |
     +-- All applications --> Network capacity? Routing? MTU?
                              (transport problem)

  3. When did it start?
     |
     +-- After a change --> Diff the change. Rollback and verify.
     |
     +-- Gradually --> Capacity exhaustion. Check utilization trends.
     |
     +-- Suddenly --> Hardware failure, routing event, DDoS.
                      Check syslogs, BGP, interface errors.
```

### Packet Loss Isolation

```
PACKET LOSS ISOLATION FLOWCHART
================================================================

  Start: ping destination, observe loss
         |
         v
  MTR to destination -- where does loss start?
         |
         +-- Loss at first hop (gateway)
         |   --> Check local cable, switch port errors, ARP
         |
         +-- Loss starts mid-path, continues to destination
         |   --> ISP/transit issue. Provide MTR evidence to NOC.
         |
         +-- Loss only at destination (not mid-path)
         |   --> Destination host issue: NIC, CPU, firewall, rate limit
         |
         +-- Loss only at one mid-path hop, destination is clean
             --> ICMP rate limiting on transit router (not real loss)
             
  Verify with bidirectional MTR and long-duration test (100+ probes)
```

---

## 12. Cross-References

- **Module 01 (Architecture & Design):** Observability architecture must match network topology -- monitoring VLANs, out-of-band management, collector placement
- **Module 02 (Routing & Switching):** BGP/OSPF state monitoring via SNMP, syslog correlation with routing events
- **Module 03 (Automation):** Automated remediation triggered by monitoring alerts, Ansible + SNMP integration
- **Module 05 (Security):** IDS/IPS feeds from TAPs and packet brokers, flow analysis for threat detection
- **Module 08 (Wireless):** Wireless controller telemetry, RF monitoring, client health metrics
- **Module 10 (Reliability & DR):** BFD for fast failure detection, monitoring as the foundation of SLA reporting
- **SNE/DNS (Module 09):** DNS-specific monitoring (query rate, cache hit ratio, DNSSEC validation)
- **SYA (Systems Administration):** Host-side monitoring (net-snmp, node_exporter, collectd)
- **SOO (Systems Operations):** Runbook integration, incident response workflows triggered by monitoring
- **TCP (Protocol Research):** TCP window analysis, retransmission patterns, congestion control interaction with monitoring

---

## 13. Sources

1. RFC 3416 -- SNMP Version 2 Protocol Operations. IETF, 2002. https://www.rfc-editor.org/rfc/rfc3416
2. RFC 3414 -- User-based Security Model for SNMPv3. IETF, 2002. https://www.rfc-editor.org/rfc/rfc3414
3. RFC 2863 -- The Interfaces Group MIB. IETF, 2000. https://www.rfc-editor.org/rfc/rfc2863
4. Cisco. "Data Center Telemetry and Network Automation Using gNMI and OpenConfig." White Paper C11-744191, 2024. https://www.cisco.com/c/en/us/products/collateral/switches/nexus-9000-series-switches/white-paper-c11-744191.html
5. OpenConfig. "gRPC Network Management Interface (gNMI) Specification." https://www.openconfig.net/docs/gnmi/gnmi-specification/
6. InfluxData. "Infrastructure Monitoring Basics with Telegraf, InfluxDB, and Grafana." https://www.influxdata.com/blog/infrastructure-monitoring-basics-telegraf-influxdb-grafana/
7. RFC 7011 -- Specification of the IP Flow Information Export (IPFIX) Protocol. IETF, 2013. https://www.rfc-editor.org/rfc/rfc7011
8. RFC 3176 -- InMon Corporation's sFlow: A Method for Monitoring Traffic in Switched and Routed Networks. IETF, 2001. https://www.rfc-editor.org/rfc/rfc3176
9. tcpdump Official Documentation. https://www.tcpdump.org/manpages/tcpdump.1.html
10. Gigamon. "To TAP or to SPAN." White Paper. https://www.gigamon.com/resources/resource-library/white-paper/to-tap-or-to-span.html
11. Cisco ThousandEyes Documentation. https://docs.thousandeyes.com/
12. Fluke Networks. "OTDR -- Optical Time Domain Reflectometer." https://www.flukenetworks.com/expertise/learn-about/otdr
13. APNIC Blog. "How to properly interpret a traceroute or MTR." March 2022. https://blog.apnic.net/2022/03/28/how-to-properly-interpret-a-traceroute-or-mtr/
14. DigitalOcean. "How To Use Traceroute and MTR to Diagnose Network Issues." https://www.digitalocean.com/community/tutorials/how-to-use-traceroute-and-mtr-to-diagnose-network-issues
15. ISC BIND 9 Administrator Reference Manual. https://bind9.readthedocs.io/
