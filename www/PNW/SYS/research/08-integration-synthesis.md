# Integration Synthesis

> **Module ID:** SRV-INTEG
> **Domain:** Cross-Module Synthesis
> **Through-line:** *Every system leaves a trail. The sysadmin reads the truth and stewards the resources.* This document traces that principle through all seven core modules, maps the connections between them, and bridges SYS to the wider PNW research series.

---

## Table of Contents

1. [The Through-Line](#1-the-through-line)
2. [Cross-Module Bridge Table](#2-cross-module-bridge-table)
3. [The Utility Stack](#3-the-utility-stack)
4. [The Anti-Waste Thread](#4-the-anti-waste-thread)
5. [Cross-Series References](#5-cross-series-references)
6. [The Proof of Concept](#6-the-proof-of-concept)
7. [Infrastructure Update Pattern](#7-infrastructure-update-pattern)
8. [The Seven Modules as One Stack](#8-the-seven-modules-as-one-stack)
9. [The Stewardship Model](#9-the-stewardship-model)
10. [Sources](#10-sources)

---

## 1. The Through-Line

Every system leaves a trail. This is not a metaphor. It is a technical fact.

A Linux server records every process start and stop in the process table. The kernel logs every OOM kill. systemd records every service lifecycle event in the journal. The filesystem stamps every file with creation, modification, and access times. The network stack records every connection in conntrack tables. The firewall logs every dropped packet. The audit subsystem records every privileged operation. The web server logs every request with timestamp, source, status, and bytes served.

The sysadmin who reads these trails sees reality. Not the reality the vendor promised, not the reality the monitoring dashboard summarizes, not the reality the user reports. The actual reality: what the machine did, when it did it, who asked it to, and what resources it consumed.

This is what connects all seven modules. They are not seven separate subjects. They are seven views of the same system, each reading a different trail:

| Module | What Trail It Reads | What It Reveals |
|--------|-------------------|-----------------|
| **Server Foundations** (01) | Process table, filesystem metadata, service state | What is running and whether it should be |
| **The Network** (02) | Packet headers, routing tables, DNS queries | What is flowing and where it came from |
| **The Logs** (03) | syslog, journald, access logs, audit records | What actually happened, timestamped and structured |
| **Process Forensics** (04) | CPU load, memory maps, disk I/O, open files | Why something is misbehaving right now |
| **Data Provenance** (05) | Timestamps, hashes, chain of custody | Whether data is what it claims to be |
| **Access & Bandwidth** (06) | Trust tiers, rate limits, resource consumption | Who is using how much and whether it is fair |
| **Security Operations** (07) | Intrusion logs, certificate state, hardening posture | Whether the boundary holds and what is testing it |

The through-line is the steward's perspective: the sysadmin is not a gatekeeper selling access. The sysadmin is a utility engineer maintaining infrastructure that serves its purpose. Every service running earns its place or gets disabled. Every packet allowed has a reason. Every log entry is evidence. Every resource has a cost, and the steward knows that cost.

### The Steward vs. The Gatekeeper

The distinction matters. A gatekeeper decides who gets in. A steward decides what runs well. The gatekeeper's incentive is to restrict. The steward's incentive is to maintain. The gatekeeper charges for access. The steward charges for usage. The gatekeeper controls the door. The steward maintains the plumbing.

In the utility model that runs through the Access & Bandwidth module, infrastructure is not a product. It is a service that works like water, power, or postal. You pay for what you consume. Nobody injects advertisements into your water supply. Nobody throttles your electricity to sell you a premium tier. The steward reads the meters, keeps the pressure right, and ensures fair distribution.

This distinction is why the SYS module exists as a separate research project in the PNW series. The other modules document what exists in the world -- forests, birds, physics, electronics. This module documents the infrastructure that connects them: the servers, networks, logs, and security that make information accessible. The sysadmin is the steward of that infrastructure, just as the forester is the steward of the forest.

---

## 2. Cross-Module Bridge Table

Every concept in the SYS module appears in at least two modules. The following table maps the most significant cross-module connections -- the places where understanding one module deepens understanding of another.

| # | Concept | Modules | Connection |
|---|---------|---------|------------|
| 1 | **Process lifecycle** | Server (01), Forensics (04), Logs (03) | Processes are defined in Server, diagnosed in Forensics, and recorded in Logs. A misbehaving process appears in all three: the unit file (01), the resource metrics (04), and the journal entries (03). |
| 2 | **systemd journal** | Server (01), Logs (03), Security (07) | systemd manages services (01), journald records their output (03), and audit events feed into security monitoring (07). The journal is the connective tissue. |
| 3 | **Firewall rules** | Network (02), Security (07), Access (06) | Firewalls filter traffic (02), enforce security policy (07), and implement trust-based access control (06). The same nftables ruleset serves all three purposes. |
| 4 | **Timestamps** | Provenance (05), Logs (03), Forensics (04) | NTP synchronization (05) ensures log timestamps are accurate (03), which enables forensic timeline reconstruction (04). Without synchronized time, cross-system correlation is impossible. |
| 5 | **Permission model** | Server (01), Security (07), Access (06) | Unix permissions are defined in Server (01), hardened in Security (07), and extended to trust-based resource allocation in Access (06). The principle of least privilege runs through all three. |
| 6 | **DNS resolution** | Network (02), Security (07), Provenance (05) | DNS maps names to addresses (02), DNSSEC validates that mapping (07), and DNS query logs provide provenance for what was resolved and when (05). |
| 7 | **Rate limiting** | Access (06), Network (02), Security (07) | Token bucket algorithms control bandwidth (06), QoS classifies traffic (02), and rate limiting prevents brute-force attacks (07). Three applications of the same mathematical model. |
| 8 | **Audit trails** | Logs (03), Provenance (05), Security (07) | The audit subsystem records events (03), chain of custody validates their integrity (05), and security operations use them for incident response (07). |
| 9 | **cgroups** | Server (01), Forensics (04), Access (06) | Control groups limit resources (01), diagnose resource contention (04), and enforce trust-tier bandwidth allocation (06). Containers use all three. |
| 10 | **TLS certificates** | Security (07), Network (02), Provenance (05) | Certificates authenticate servers (07), encrypt transport (02), and their chain of trust provides cryptographic provenance (05). |
| 11 | **File integrity** | Provenance (05), Security (07), Server (01) | Checksums verify data hasn't changed (05), AIDE monitors for unauthorized modifications (07), and filesystem metadata records when changes occurred (01). |
| 12 | **Structured logging** | Logs (03), Provenance (05), Forensics (04) | JSON-structured logs (03) enable machine-parseable provenance (05) and field-based forensic queries (04). Unstructured logs resist all three. |
| 13 | **SSH access** | Security (07), Server (01), Logs (03) | SSH provides encrypted remote access (07), connects to the server's user authentication system (01), and every connection attempt is logged (03). |
| 14 | **Disk I/O** | Forensics (04), Server (01), Logs (03) | iostat measures disk performance (04), filesystem choice affects I/O patterns (01), and log rotation prevents disk exhaustion (03). |
| 15 | **Container isolation** | Server (01), Forensics (04), Security (07) | Namespaces isolate processes (01), cgroup metrics diagnose container resource usage (04), and container security boundaries require hardening (07). |
| 16 | **Bandwidth as utility** | Access (06), Network (02), Security (07) | Trust-based allocation models bandwidth as utility (06), QoS implements priority on the wire (02), and throttling unknown traffic is a security defense (07). |
| 17 | **OOM killer** | Server (01), Forensics (04), Logs (03) | The kernel terminates processes when memory is exhausted (01), memory pressure metrics predict OOM events (04), and the OOM kill is logged with full process details (03). |
| 18 | **Log aggregation** | Logs (03), Network (02), Provenance (05) | Central log collection (03) requires network transport (02) and must preserve the integrity and ordering of events for provenance (05). |
| 19 | **Mesh networking** | Network (02), Access (06), Security (07) | Mesh topology provides resilient connectivity (02), every node must manage trust and bandwidth (06), and encrypted mesh overlays provide security (07). |
| 20 | **Backup and recovery** | Provenance (05), Server (01), Security (07) | Backup strategies preserve data (05), restore procedures rebuild servers (01), and encrypted backups protect against breach (07). |

---

## 3. The Utility Stack

The SYS module is built on a core analogy: compute infrastructure is a utility, like water, power, or postal service. The infrastructure already exists. The update is connecting what is already there.

| Utility | Physical Infrastructure | Digital Equivalent | SYS Module Coverage |
|---------|----------------------|-------------------|-------------------|
| **Water** | Pipes, treatment plants, reservoirs, meters | Data pipelines, log aggregation, flow control, rate metering | Logs (03): aggregation pipelines. Access (06): flow control, anti-waste. Network (02): packet flow, QoS. |
| **Power** | Wires, transformers, substations, circuit breakers | CPU cycles, power management, load balancing, circuit protection | Server (01): process scheduling, resource limits. Forensics (04): load monitoring, power consumption. Security (07): circuit breakers (rate limiting, fail2ban). |
| **Postal** | Routes, sorting facilities, addresses, tracking numbers | Network routing, DNS, IP addressing, packet tracking | Network (02): routing tables, DNS resolution, CIDR addressing. Provenance (05): chain of custody, delivery confirmation (checksums). Logs (03): delivery records (access logs). |
| **Compute** | Servers, storage, network fabric, cooling | All of the above, operating as a unified utility | All seven modules. The SYS atlas IS the compute utility manual. |

### The Infrastructure Already Exists

This is the key insight. We do not need to invent new infrastructure. The pipes are laid. The wires are run. The fiber is in the ground. The protocols are standardized. TCP/IP has been running the internet since the 1980s. DNS resolves billions of names per day. NTP synchronizes clocks across the planet. syslog has been recording events since before most current sysadmins were born.

The work is not building new infrastructure. The work is understanding the infrastructure that already exists, maintaining it, and connecting it differently. The same plumbing that delivers water can deliver hot water for heating. The same electrical panel that powers lights can charge a battery. The same network that delivers web pages can carry mesh traffic for a community. Same route, dual purpose.

### The Four Utility Properties

Every utility shares four properties that the SYS modules document:

1. **Metered usage** -- You pay for what you consume. Server resources are finite (01). Bandwidth has a cost (06). Storage fills up (05). The meter reads honestly.

2. **Universal access** -- Everyone on the grid gets service. The utility model does not discriminate by identity, only by usage. Trust tiers (06) set speed, not permission. Mesh networks (02) extend reach. Nobody is blocked -- they are metered.

3. **Maintained infrastructure** -- Utilities require continuous maintenance. Services need patching (01). Logs need rotation (03). Certificates expire (07). Backups need verification (05). The steward's work is never done.

4. **Transparent accounting** -- The meter is readable. Logs record what happened (03). Audit trails prove who did what (07). Provenance tracks where data came from (05). The accounting is public to the steward.

---

## 4. The Anti-Waste Thread

The anti-waste principle is the operational corollary of stewardship. If every resource has a cost, then waste is the enemy. Not theoretical waste -- measurable, quantifiable, addressable waste. Each module identifies what waste looks like in its domain and how to eliminate it.

### Module-by-Module Anti-Waste

**Module 01 -- Server Foundations: Disable unused services.**

Every running service consumes CPU cycles, memory, and attack surface. A default Linux installation starts services you may never need -- bluetooth, cups, avahi, ModemManager. The steward audits the service list (`systemctl list-unit-files --state=enabled`), disables what is not needed, and masks what should never start. A minimal server runs exactly what it needs and nothing more. The energy cost of idle services is real: CPU wake-ups, memory pages, open sockets, and file descriptors that could serve actual work.

**Module 02 -- The Network: Firewall blocks noise.**

Every unsolicited packet that reaches a server consumes bandwidth, CPU (to process the packet), and log storage (if logged). The firewall's job is not paranoia -- it is waste reduction. A properly configured nftables ruleset drops traffic that has no business arriving: broadcast storms, port scans, connection attempts to services that do not exist. The carrier paid to transport that packet. The server paid to receive it. The firewall ensures that cost is borne once, at the boundary, rather than propagated through the application stack.

**Module 03 -- The Logs: Quantify waste.**

Logs make waste visible. Access logs show how many requests came from bots versus humans. Auth logs show how many login attempts are brute-force versus legitimate. Transport logs show how much bandwidth went to serving 404 errors for paths that do not exist. The anti-waste pattern in logging is not "log less" -- it is "log enough to see the waste, then eliminate the source." Log rotation and retention policies prevent the logs themselves from becoming waste: keep what you will read, compress what you might need, delete what has expired.

**Module 04 -- Process Forensics: Identify misbehaving processes.**

A process that consumes 100% CPU is not necessarily broken -- it might be doing heavy computation. A process that consumes 100% CPU while the application is idle IS waste. Forensics provides the tools to distinguish: `top` shows who is using resources, `strace` shows what they are doing with those resources, `lsof` shows what files and sockets they have open. The steward investigates before killing. The diagnosis is: is this process earning its resource consumption? If not, it is waste.

**Module 05 -- Data Provenance: Do not hoard data.**

Storage has a cost -- electricity to spin the disks (or wear the flash cells), bandwidth to replicate, time to back up, risk to protect. The data lifecycle module documents explicit retention policies: keep data that has a purpose, archive data that might be needed, delete data that has expired. Every byte stored is a byte maintained. The steward does not hoard "just in case." The steward defines retention windows, enforces them, and can prove -- via provenance -- that deleted data was deleted on schedule and for documented reasons.

**Module 06 -- Access & Bandwidth: Throttle unknowns.**

The most direct anti-waste mechanism in the SYS module. Trust-based throttling does not block unknown traffic -- it makes unknown traffic too slow to be worth the sender's effort. A bot scraping at 150 bytes per second will receive data, but the cost of receiving it exceeds the value. The admin's bandwidth is preserved for trusted clients. The waste ratio metric (unknown requests / total requests as a percentage of bandwidth consumed) quantifies the effectiveness: a well-configured trust system pushes waste toward zero without blocking anyone.

**Module 07 -- Security Operations: Block at source.**

Security waste is the most expensive kind. A successful breach wastes not just CPU and bandwidth but the trust of every user on the system. The security module's anti-waste approach is defense in depth: harden the surface so attacks fail at the boundary (unused ports closed, SSH key-only, fail2ban banning repeat offenders). Every attack that fails at the firewall costs nothing beyond the firewall rule evaluation. Every attack that reaches the application costs orders of magnitude more to detect, investigate, and remediate.

### The Anti-Waste Stack

Reading the seven modules together, the anti-waste principle forms a stack:

```
Layer 7: Security     -- Block attacks at source, harden surface
Layer 6: Access       -- Throttle unknowns, meter trusted, full pipe for owner
Layer 5: Provenance   -- Retention policies, delete on schedule
Layer 4: Forensics    -- Diagnose waste in real-time, kill misbehavers
Layer 3: Logs         -- Quantify waste, make it visible, set alerts
Layer 2: Network      -- Firewall drops noise, QoS prioritizes signal
Layer 1: Server       -- Disable unused services, minimize attack surface
```

Each layer reinforces the others. A disabled service (Layer 1) generates no network traffic (Layer 2), produces no log noise (Layer 3), consumes no CPU (Layer 4), stores no data (Layer 5), needs no bandwidth allocation (Layer 6), and presents no attack surface (Layer 7). The steward who maintains all seven layers operates a system where every resource is intentional.

---

## 5. Cross-Series References

The SYS module does not exist in isolation. It connects to several other PNW research projects through shared technical concepts, protocols, and infrastructure patterns.

### SHE -- Smart Home & DIY Electronics

The Smart Home module covers IoT protocols, sensors, and home automation platforms that run on the infrastructure SYS describes.

| SYS Concept | SHE Connection | Details |
|-------------|---------------|---------|
| **MQTT protocol** | [SHE Module 3: Connectivity Protocols](../../SHE/research/03-connectivity-protocols.md) | MQTT brokers (Mosquitto) run on Linux servers (SYS 01), produce access logs (SYS 03), and require TLS encryption (SYS 07). The broker is infrastructure -- the sysadmin maintains it. |
| **Docker containers** | [SHE Module 4: Platforms & Software](../../SHE/research/04-platforms-software.md) | Home Assistant, Node-RED, and InfluxDB run as containers on home servers. Container isolation uses cgroups and namespaces (SYS 01), resource monitoring uses forensics tools (SYS 04), and container networking uses the same TCP/IP stack (SYS 02). |
| **InfluxDB + Grafana** | [SHE Module 4: Platforms & Software](../../SHE/research/04-platforms-software.md) | Time-series database for sensor data. Grafana dashboards visualize the same metrics that syslog and journald collect (SYS 03). The monitoring pipeline is the same whether you are watching server CPU or room temperature. |
| **VLAN segmentation** | [SHE Module 6: Safety & Standards](../../SHE/research/06-safety-standards.md) | IoT devices on separate VLANs per OWASP IoT Top 10. VLAN configuration is network administration (SYS 02). Trust boundaries between IoT and main network are access control (SYS 06). |
| **ESPHome / Home Assistant** | [SHE Module 5: Complete Projects](../../SHE/research/05-complete-projects.md) | ESP32 devices report to a central server. The server runs Linux, uses systemd services, logs to journald, and needs firewall rules. SYS covers every layer the smart home depends on. |

### LED -- LED Lighting & Controllers

The LED module covers electronics measurement, microcontroller programming, and industrial control that intersect with SYS through signal processing and infrastructure.

| SYS Concept | LED Connection | Details |
|-------------|---------------|---------|
| **Oscilloscope/Nyquist** | [LED Module 7: Oscilloscope Basics](../../LED/research/m7-oscilloscope-basics.md), [Nyquist Sampling](../../LED/research/m7-nyquist-sampling.md) | Signal measurement is data provenance for the physical world (SYS 05). The oscilloscope reads the trail that electrons leave. Nyquist's theorem governs sampling the same way log rotation governs retention: sample enough to reconstruct the signal, not more. |
| **PLC/Modbus** | [LED Module 8: PLC Ladder Logic](../../LED/research/m8-plc-ladder-logic.md), [Modbus Communication](../../LED/research/m8-modbus-communication.md) | Industrial control systems run on networks (SYS 02), require access control (SYS 06), and generate SCADA logs (SYS 03). Modbus/TCP uses the same TCP/IP stack. PLC security is sysadmin security applied to industrial equipment. |
| **Microcontroller networking** | [LED Module 2: Arduino LED Control](../../LED/research/m2-arduino-led-control.md) | ESP32 and RP2040 devices connect to WiFi networks configured by the sysadmin (SYS 02), assigned addresses by DHCP (SYS 02), and monitored through access logs (SYS 03). |

### BPS -- Bio-Physics Sensing Systems

The Bio-Physics module covers GPU signal processing, sensor fusion, and real-time monitoring -- all of which require server infrastructure.

| SYS Concept | BPS Connection | Details |
|-------------|---------------|---------|
| **GPU pipeline** | [BPS Module 7: GPU/ML Pipeline](../../BPS/research/07-gpu-ml-pipeline.md) | ORCA-SPOT and OrcaHello run on GPU servers. GPU resource management is process forensics (SYS 04). CUDA stream isolation is cgroup isolation (SYS 01). Training logs are structured logging (SYS 03). |
| **Sensor fusion** | [BPS Module 5: Signal Processing](../../BPS/research/05-signal-processing-analogues.md) | Multiple sensors producing concurrent data streams require time synchronization (SYS 05 -- NTP), log aggregation (SYS 03), and network transport (SYS 02). Sensor fusion is log correlation applied to physics. |
| **Real-time alerts** | [BPS Module 6: Interrelationships Atlas](../../BPS/research/06-interrelationships-atlas.md) | Species detection alerts (orca in shipping lane, salmon at dam) use the same monitoring infrastructure as server alerting: threshold, trigger, notify. Prometheus/Grafana serve both purposes. |
| **Telemetry** | [BPS Module 14: Radio Telemetry](../../BPS/research/14-radio-telemetry-coils.md) | Wildlife telemetry data requires network backhaul (SYS 02), data integrity verification (SYS 05), and access control to protect sensitive location data (SYS 06, 07). |

### BRC -- Virtual Black Rock City

The BRC module defines trust systems, mesh networking, and community infrastructure that directly implement SYS concepts.

| SYS Concept | BRC Connection | Details |
|-------------|---------------|---------|
| **Trust system** | BRC Trust Architecture | The 5-tier trust model in SYS Access (06) mirrors the BRC trust ladder. Both use relationship-based trust rather than credentials. Both allocate resources (bandwidth in SYS, camp privileges in BRC) based on trust level. |
| **Mesh networking** | BRC Mesh Infrastructure | BRC's physical mesh network at the playa uses the same mesh protocols documented in SYS Network (02): batman-adv, Meshtastic, Yggdrasil. The mesh IS the infrastructure -- every participant is a node. |
| **Community infrastructure** | BRC Camps & Civic Agents | BRC's camp infrastructure runs on servers maintained by sysadmins. The CEDAR chipset governs camp operations the way systemd governs services: declarative configuration, lifecycle management, logging. |
| **Privacy by design** | BRC Trust Relationships | Both SYS Security (07) and BRC enforce privacy by design. Trust relationships are private data. Character sheets are explicit consent. No PII ever committed. The security module's privacy principles are the BRC's operational reality. |

---

## 6. The Proof of Concept

The `poc/` directory contains a working Node.js server that demonstrates the core principles of the SYS research atlas in runnable code.

### What the PoC Implements

| Principle | Research Module | PoC Implementation |
|-----------|---------------|-------------------|
| **Trust-based access** | Access & Bandwidth (06) | 5-tier trust system: Owner (full pipe), Trusted (1 MB/s), Known (100 KB/s), Visitor (10 KB/s), Unknown (150 baud) |
| **Structured logging** | The Logs (03) | Every request logged as JSON with tier, bandwidth, bytes, response time. JSONL format, one object per line. |
| **Anti-waste metrics** | Access & Bandwidth (06), Logs (03) | Waste ratio calculated in real time: unknown requests as percentage of total bandwidth. Dashboard displays the metric. |
| **Rate limiting** | Access & Bandwidth (06), Network (02) | Real throttling via timed chunk streaming. Responses delivered at the tier's bytes-per-second rate. |
| **Monitoring dashboard** | The Logs (03), Forensics (04) | Terminal-themed dashboard at `/_dashboard` with tier breakdown, request distribution, and live access log. Auto-refreshes via JSON API. |
| **Zero dependencies** | Server Foundations (01) | Pure Node.js, no npm install. Uses only `node:` built-in modules. Demonstrates that infrastructure does not require a dependency tree. |
| **Configuration as code** | Server Foundations (01), Security (07) | `trust-config.json` defines tiers, client mappings, and bot patterns. Declarative, version-controllable, auditable. |

### What the PoC Proves

1. **Trust-based bandwidth allocation works.** Not as theory -- as running code. A bot hitting the server at 150 B/s will technically receive data, but the cost of scraping exceeds the value. A trusted friend gets full speed. The allocation reflects relationship, not credentials.

2. **Anti-waste is measurable.** The waste ratio metric provides a single number that answers: "How much of my server's work serves real users versus noise?" A well-configured system pushes this toward zero.

3. **Structured logging enables analysis.** Because every request is JSON, the access log is immediately grep-able, jq-parseable, and aggregation-ready. No regex required. The log format IS the analysis format.

4. **Zero dependencies is achievable.** The entire server is one file, 528 lines, using only Node.js built-in modules. This is the anti-waste principle applied to the software supply chain itself: do not install what you do not need.

### Files

| File | Lines | Purpose |
|------|-------|---------|
| `server.mjs` | 528 | HTTP server, routing, trust-based throttling, structured logging, metrics API |
| `dashboard.html` | 441 | Terminal-themed monitoring dashboard, auto-refreshing stats and live log |
| `trust-config.json` | 22 | Trust tier definitions, client-to-tier mappings, bot detection patterns |
| `README.md` | 157 | Documentation, quick start, configuration guide, design principles |

---

## 7. Infrastructure Update Pattern

The deepest insight in the SYS module is not about servers or networks. It is about how infrastructure changes.

### The Pattern

Infrastructure already exists. The pipes are in the ground. The wires run to the panel. The fiber reaches the neighborhood. The protocols are standardized and deployed. The update is not building new infrastructure. The update is connecting what is already there differently.

**Same route, dual purpose.**

### Physical Examples

**Solar panels + electrolysis + fuel cells = heat + clean water.**

A house already has electrical wiring and plumbing. Adding rooftop solar connects to the existing electrical panel. Excess electricity runs an electrolyzer (water in, hydrogen out) connected to the existing plumbing. The hydrogen feeds a fuel cell that produces electricity (back to the panel) and heat (into the existing hydronic system) and clean water (into the existing plumbing). Three utilities -- power, heat, water -- using infrastructure that is already installed. The update is the connections, not the pipes.

**Mesh networking over existing WiFi.**

Every house in a neighborhood already has a WiFi router. Installing mesh firmware (OpenWrt + batman-adv) on those routers creates a community mesh network using existing hardware. The same antenna that connects to the ISP can also peer with the neighbor's antenna. Same hardware, dual purpose. The mesh protocol is the software update, not a hardware installation.

**Server rack in the garage.**

A house already has electrical service (200A panel, probably), Ethernet wiring (or can add it), and an internet connection. A small server rack in the garage or utility closet turns existing residential infrastructure into a hosting facility. The same circuit that powers the dryer can power a server. The same Ethernet drop that feeds the TV can serve web traffic. The infrastructure exists. The sysadmin connects it.

### The SYS Module as Update Pattern

Each SYS module documents how to read and connect existing infrastructure:

| Module | Existing Infrastructure | Update Connection |
|--------|----------------------|-------------------|
| Server (01) | Linux is already installed on the machine | Learn to read its process table, filesystem, and service state |
| Network (02) | TCP/IP is already running on every connected device | Learn to configure routing, DNS, and firewall rules |
| Logs (03) | syslog and journald are already recording events | Learn to query, aggregate, and analyze what is already being logged |
| Forensics (04) | The kernel is already tracking CPU, memory, and I/O | Learn to read the metrics that are already being collected |
| Provenance (05) | Filesystems already record timestamps and metadata | Learn to use the provenance trail that already exists |
| Access (06) | The network already has bandwidth and the server already has resources | Learn to allocate them based on trust instead of first-come-first-served |
| Security (07) | SSH, TLS, and audit logging already exist in every Linux distribution | Learn to configure the security tools that are already installed |

The pattern is consistent: the infrastructure exists. The knowledge to use it is the update. The SYS module is the documentation of that knowledge.

### The Energy Equation

The infrastructure update pattern has a direct energy dimension, documented in the Data Provenance module (Section 9):

- Global data centers consumed 460 TWh in 2022, projected to reach 1,000 TWh by 2026
- A single home server (RTX 4060 Ti, 200W under load) costs approximately $175/year in electricity
- The same GPU that games can train ML models, process orca biosonar, render LED animations, and serve web traffic

The anti-waste principle applied to energy: do not run hardware that sits idle. Do not rent cloud resources for workloads that fit on hardware you already own. Do not cool a data center in Virginia when your garage in the PNW is naturally 15 degrees C. Same hardware, multiple purposes. Same route, dual use.

---

## 8. The Seven Modules as One Stack

Read together, the seven modules form a complete systems administration stack. Each module occupies a specific position in the stack, and the stack reads from hardware to policy:

```
+-----------------------------------------------------+
|  7. Security Operations                              |
|     Policy layer: who is allowed, what is hardened,  |
|     what is monitored, how to respond                |
+-----------------------------------------------------+
|  6. Access & Bandwidth                               |
|     Allocation layer: trust tiers, rate limits,      |
|     anti-waste metrics, utility model                |
+-----------------------------------------------------+
|  5. Data Provenance                                  |
|     Integrity layer: timestamps, hashes, chain of    |
|     custody, backup, retention, lifecycle            |
+-----------------------------------------------------+
|  4. Process Forensics                                |
|     Diagnosis layer: CPU, memory, disk, network,     |
|     strace, lsof, the diagnostic mindset             |
+-----------------------------------------------------+
|  3. The Logs                                         |
|     Record layer: syslog, journald, access logs,     |
|     structured logging, aggregation, analysis        |
+-----------------------------------------------------+
|  2. The Network                                      |
|     Transport layer: TCP/IP, DNS, DHCP, routing,     |
|     firewalls, mesh, the pipe                        |
+-----------------------------------------------------+
|  1. Server Foundations                                |
|     Infrastructure layer: Linux, processes,          |
|     filesystems, systemd, users, permissions         |
+-----------------------------------------------------+
```

This is not accidental. The modules were written to be read independently, but they form a coherent stack when read together. A request enters the network (02), reaches the server (01), is logged (03), consumes resources that can be diagnosed (04), leaves a provenance trail (05), is subject to trust-based allocation (06), and is governed by security policy (07).

The steward reads the whole stack. The specialist reads one module. Both are valid. The synthesis is that the stack is one system, not seven subjects.

---

## 9. The Stewardship Model

### What Stewardship Means in Practice

Stewardship is the operational philosophy of the SYS module. It is not an abstract value. It is a set of daily practices:

1. **Read the logs every day.** Not because something is broken. Because the logs tell you what the system is actually doing, and patterns emerge over time. The brute-force attempts. The 404 patterns. The slow queries. The disk usage trend.

2. **Disable what you do not use.** Every service, every open port, every running process either earns its place or gets removed. The audit is not paranoia -- it is hygiene.

3. **Patch on schedule.** Not "when I get around to it." On a schedule, with verification, with rollback capability. The vulnerability window between disclosure and patch is measurable, and the steward minimizes it.

4. **Back up and verify.** A backup that has never been tested is not a backup. It is a hope. The steward verifies restores on a schedule.

5. **Document decisions.** Why was this firewall rule added? Why is this service running? Why is this user in this group? The steward leaves a trail of decisions, not just a trail of configuration files.

6. **Meter honestly.** Resource consumption is visible, logged, and reported. The steward does not hide costs. The meter reads what the meter reads.

7. **Respond proportionally.** Not every security event is an emergency. Not every high CPU alert is a crisis. The steward assesses severity, investigates root cause, and responds based on evidence.

### The Steward's Tools

The seven modules equip the steward with specific tools for each practice:

| Practice | Tool | Module |
|----------|------|--------|
| Read logs | `journalctl`, `grep`, `jq`, Grafana/Loki | Logs (03) |
| Audit services | `systemctl list-unit-files`, `ss -tlnp` | Server (01) |
| Patch management | `apt`, `dnf`, `unattended-upgrades` | Server (01), Security (07) |
| Backup verification | `borg`, `restic`, test restore scripts | Provenance (05) |
| Decision documentation | Commit messages, runbooks, READMEs | All modules |
| Resource metering | `top`, `htop`, Prometheus, node_exporter | Forensics (04) |
| Incident response | Playbooks, timeline reconstruction, containment | Security (07), Logs (03) |

---

## 10. Sources

This synthesis draws on all sources cited in the seven core modules. See the consolidated [Bibliography](09-bibliography.md) for the complete source catalog with reliability ratings.

Key synthesis references:

| Source | Relevance |
|--------|-----------|
| Brendan Gregg, *Systems Performance*, 2nd ed. | The methodology that connects Forensics (04) to every other module -- USE method applied across the stack |
| Elinor Ostrom, *Governing the Commons* | The theoretical foundation for the utility/stewardship model in Access (06) |
| Susan Crawford, *Fiber* | The infrastructure-as-utility argument that runs through Access (06) and the infrastructure update pattern |
| RFC 5424 (Syslog Protocol) | The logging standard that connects Logs (03) to every module that generates events |
| NIST Cybersecurity Framework | The Identify/Protect/Detect/Respond/Recover framework that structures Security (07) |
| CIS Benchmarks | The hardening baselines referenced across Server (01) and Security (07) |
| POSIX.1-2017 | The standard that defines filesystem behavior referenced in Server (01) and Provenance (05) |

---

## The Through-Line, One Last Time

Every system leaves a trail. The server leaves process tables and filesystem metadata. The network leaves packet traces and routing tables. The logs collect every event. The forensics tools read every metric. Provenance chains prove what happened and when. Access control determines who gets how much. Security operations maintain the boundary.

The sysadmin reads all of it. Not because they are suspicious. Because that is what stewardship means: knowing what the system is doing, maintaining it so it runs well, and ensuring that every resource serves its purpose. Nothing runs that does not earn its place. Nothing is stored that is not needed. Nothing is allowed that is not intended.

The infrastructure already exists. The knowledge to use it is the update. The trail is right here.
