---
id: SNE-08-wireless-edge-networking
title: "Module 8: Wireless & Edge Networking"
type: reference
owner: Systems Network Engineering Mission
lifecycle_state: Published
review_cadence: Annual
audience: [network_engineer, wireless_engineer, iot_architect, infrastructure_lead, site_reliability_engineer]
framework_refs: [ieee-802.11be, ieee-802.11ax, ieee-802.15.4, 3gpp-release-17, fcc-part-96, wi-fi-alliance, lorawan-alliance, csa-matter]
scope: "Wi-Fi 6E/7 engineering, RF site surveys, controller architectures, IoT networking protocols, 5G private networks, edge compute networking, and wireless security"
purpose: "Provide engineers with a comprehensive reference for designing, deploying, and operating wireless and edge networks across enterprise, industrial, and IoT domains"
version: "1.0"
last_reviewed: "2026-04-08"
next_review: "2027-04-08"
---

# Module 8: Wireless & Edge Networking

## Table of Contents

1. [Introduction](#1-introduction)
2. [RF Fundamentals for Engineers](#2-rf-fundamentals-for-engineers)
3. [Wi-Fi 6E and the 6 GHz Band](#3-wi-fi-6e-and-the-6-ghz-band)
4. [Wi-Fi 7 (802.11be) Engineering](#4-wi-fi-7-80211be-engineering)
5. [Site Surveys and RF Planning](#5-site-surveys-and-rf-planning)
6. [Wireless Controller Architectures](#6-wireless-controller-architectures)
7. [Wi-Fi Security Evolution](#7-wi-fi-security-evolution)
8. [IoT Networking Protocols](#8-iot-networking-protocols)
9. [5G Private Networks and CBRS](#9-5g-private-networks-and-cbrs)
10. [Edge Compute Networking](#10-edge-compute-networking)
11. [RF Planning Guidelines](#11-rf-planning-guidelines)
12. [Source Index and Citations](#12-source-index-and-citations)

---

## 1. Introduction

Wireless networking has become the primary access layer for most enterprise, campus, and industrial environments. The wired port that once defined a desk is now secondary to the radio signal that blankets a floor. This shift has elevated wireless engineering from a convenience feature to a critical infrastructure discipline, one where a 3 dB miscalculation in transmit power or a misunderstood channel plan can render an entire floor of a building unusable during peak hours.

This module covers wireless and edge networking from the RF physics layer through application-level edge compute. It is structured for the engineer who needs to design a campus wireless network, deploy IoT sensors across a warehouse, evaluate whether a private 5G network makes sense for a manufacturing floor, or understand why edge compute matters for latency-sensitive workloads. The emphasis throughout is on engineering decisions: what to measure, what to choose, what to avoid.

The wireless landscape has shifted dramatically since 2020. The FCC's release of the 6 GHz band for unlicensed use in April 2020 effectively doubled the available Wi-Fi spectrum. Wi-Fi 6E (802.11ax in 6 GHz) brought that spectrum to market, and Wi-Fi 7 (802.11be, finalized July 2025) introduced 320 MHz channels and multi-link operation. Simultaneously, the IoT protocol space has consolidated around Thread and Matter for consumer devices while LoRaWAN dominates long-range, low-power industrial sensing. Private 5G networks using CBRS spectrum have matured from proof-of-concept to production deployments, with over 420,000 CBRS radios operating across the United States by early 2026.

**What this module covers:**

- RF measurement fundamentals that every wireless engineer must internalize
- Wi-Fi 6E/7 specifications, channel planning, and practical throughput expectations
- Site survey methodology and tooling for predictive and validation surveys
- Controller architecture decisions across on-premises, cloud-managed, and controllerless models
- WPA3, SAE, OWE, and certificate-based enterprise authentication
- IoT protocol comparison across range, power, data rate, and mesh topology
- CBRS spectrum access, private 5G deployment, and Open RAN architecture
- Edge compute platforms from MEC to Cloudflare Workers

**What this module does not cover:**

- Detailed antenna design or RF propagation modeling mathematics (covered in electromagnetic engineering references)
- Cellular carrier network operations (public 5G, LTE core network engineering)
- Satellite communications (covered in the Space cluster)

---

## 2. RF Fundamentals for Engineers

Before discussing any wireless technology, an engineer must have fluency in the measurement units and physical phenomena that govern radio communication. These are not abstract concepts. Every decision in wireless design, from access point placement to channel width selection, traces back to these fundamentals.

### 2.1 Core RF Measurements

| Measurement | Unit | What It Means | Typical Values | Engineering Impact |
|-------------|------|---------------|----------------|-------------------|
| Transmit Power | dBm | Power output of the radio, measured in decibels relative to 1 milliwatt | AP: 15-30 dBm; Client: 12-18 dBm | Determines maximum coverage radius; higher is not always better |
| RSSI | dBm | Received Signal Strength Indicator, the power level of the received signal | -30 dBm (excellent) to -80 dBm (marginal) | Primary metric for coverage maps; must be interpreted alongside noise |
| Noise Floor | dBm | Background electromagnetic noise at the receiver | -90 to -95 dBm (typical indoor) | Sets the lower bound of useful signal reception |
| SNR | dB | Signal-to-Noise Ratio, the gap between signal and noise | 25+ dB (good); 15-25 dB (marginal); <15 dB (poor) | Determines achievable data rate at a given location |
| Channel Utilization | % | Percentage of airtime consumed by transmissions on a channel | <40% (healthy); 40-70% (congested); >70% (degraded) | The most underappreciated metric in wireless design |
| Retry Rate | % | Percentage of frames that required retransmission | <10% (normal); >20% (problematic) | Indicates interference, hidden node problems, or marginal coverage |

### 2.2 The Decibel Scale

The decibel is a logarithmic ratio. Engineers who think in linear terms will make consistent errors in wireless design. The essential rules:

- **+3 dB = double the power.** Going from 20 dBm to 23 dBm doubles the radiated power.
- **-3 dB = half the power.** Every 3 dB of path loss halves the received signal.
- **+10 dB = 10x the power.** A 10 dBm signal is 10 milliwatts; a 20 dBm signal is 100 milliwatts.
- **0 dBm = 1 milliwatt.** This is the reference point for all dBm measurements.

A common error is to treat RSSI as a linear quality metric. An RSSI of -70 dBm is not "twice as good" as -80 dBm. It is 10 dB better, which means the signal is 10 times stronger. This logarithmic relationship is why small changes in AP placement (moving an AP 2 meters) can produce dramatic changes in coverage quality.

### 2.3 Co-Channel Interference

Co-channel interference (CCI) occurs when multiple access points transmit on the same channel within range of each other. Unlike adjacent-channel interference (which can be mitigated with channel separation), CCI is a fundamental contention problem. When two APs share a channel, their clients must time-share the airtime using CSMA/CA (Carrier Sense Multiple Access with Collision Avoidance). The result is that each AP effectively gets half the airtime, regardless of how strong the signal is.

The engineering rule: a CCI signal must be at least 19-25 dB below the serving AP's signal at the client location. If a neighboring AP on the same channel produces a signal of -67 dBm at a client, the serving AP must produce at least -48 dBm to -42 dBm at that same location for clean operation. This constraint drives the entire channel planning discipline.

### 2.4 Free Space Path Loss

The inverse square law governs signal attenuation in free space. The formula for free space path loss (FSPL) in dB:

```
FSPL (dB) = 20 * log10(d) + 20 * log10(f) + 32.44
```

Where `d` is distance in kilometers and `f` is frequency in MHz. At 5 GHz, a signal loses approximately 6 dB every time the distance doubles. At 6 GHz, the loss is approximately 1.6 dB greater than at 5 GHz for the same distance, which means 6 GHz coverage cells are inherently smaller. This is both a challenge (more APs needed for coverage) and an advantage (greater frequency reuse, less CCI).

Material attenuation adds to free space loss. Typical values:

| Material | Attenuation (dB) at 5 GHz | Attenuation (dB) at 6 GHz |
|----------|---------------------------|---------------------------|
| Drywall (interior) | 3-5 | 4-6 |
| Glass (standard) | 4-8 | 5-10 |
| Concrete (reinforced) | 15-25 | 18-30 |
| Brick | 10-15 | 12-18 |
| Metal (elevator doors, filing cabinets) | 20-40+ | 20-40+ |
| Human body | 3-5 | 4-6 |

---

## 3. Wi-Fi 6E and the 6 GHz Band

Wi-Fi 6E extends 802.11ax into the 6 GHz band (5.925-7.125 GHz), adding up to 1,200 MHz of new spectrum. This is the largest expansion of unlicensed Wi-Fi spectrum since the original 802.11 standard. In the United States, the FCC opened the full 1,200 MHz in April 2020. The European Union allocated 480 MHz (5.945-6.425 GHz). Other regions vary.

### 3.1 Operating Classes in 6 GHz

The 6 GHz band introduces two regulatory power classes that did not exist in 2.4 GHz or 5 GHz:

| Power Class | Max EIRP | Max PSD | Indoor/Outdoor | AFC Required | Channels Available (US) |
|-------------|----------|---------|-----------------|--------------|------------------------|
| Low Power Indoor (LPI) | 30 dBm (1W) | 5 dBm/MHz | Indoor only | No | 59 x 20 MHz, 29 x 40 MHz, 14 x 80 MHz, 7 x 160 MHz, 3 x 320 MHz |
| Standard Power (SP) | 36 dBm (4W) | 23 dBm/MHz | Indoor and outdoor | Yes | Varies by AFC determination; U-NII-5 and U-NII-7 bands |

**Automated Frequency Coordination (AFC)** is the regulatory mechanism that enables standard power operation. AFC systems query a database of incumbent 6 GHz users (primarily fixed microwave links and satellite earth stations) and determine which channels are available at a given GPS location. The FCC approved multiple AFC system operators in 2024, and by 2026, AFC workflows are integrated into major controller platforms (Cisco Catalyst 9800, Aruba Central, Meraki). Standard power deployments are now operationally viable for campus and outdoor environments.

### 3.2 Channel Planning in 6 GHz

The 6 GHz band provides clean spectrum with no legacy device contention. Unlike 5 GHz, where radar detection (DFS) and legacy 802.11a/n devices consume airtime, 6 GHz is exclusively Wi-Fi 6E and Wi-Fi 7.

**20 MHz channels:** 59 channels (US). Useful for high-density deployments where capacity matters more than per-client throughput.

**80 MHz channels:** 14 channels. The practical sweet spot for most enterprise deployments, offering 600-800 Mbps per client with 2x2 MIMO.

**160 MHz channels:** 7 channels. Viable for moderate-density environments where clients support 160 MHz.

**320 MHz channels (Wi-Fi 7 only):** 3 channels in LPI mode (US). Only 1 channel available in Standard Power mode (US), 2 in Canada. Provides maximum throughput but severely limits frequency reuse.

---

## 4. Wi-Fi 7 (802.11be) Engineering

IEEE 802.11be was published on 22 July 2025 as the formal standard behind the Wi-Fi Alliance's "Wi-Fi 7" certification program. The Wi-Fi Alliance began certifying Wi-Fi 7 devices in early 2024 based on draft specifications. As of 2026, enterprise-grade Wi-Fi 7 access points are available from all major vendors.

### 4.1 Key Technical Enhancements

| Feature | Wi-Fi 6/6E (802.11ax) | Wi-Fi 7 (802.11be) | Engineering Impact |
|---------|----------------------|--------------------|--------------------|
| Max Channel Width | 160 MHz | 320 MHz | 2x throughput per channel; fewer reuse channels |
| Modulation | 1024-QAM (10 bits/symbol) | 4096-QAM (12 bits/symbol) | ~20% higher data rate; requires SNR > 38 dB |
| Multi-Link Operation | None | Simultaneous multi-band | Aggregated throughput; latency reduction; seamless failover |
| Max PHY Rate (theory) | 9.6 Gbps | 46.1 Gbps | Real-world: 2-5 Gbps per client achievable |
| OFDMA | Uplink + Downlink | Enhanced MU Resource Units | Better dense-client scheduling |
| Preamble Puncturing | Limited (802.11ax-2024) | Full 320 MHz with punctured sub-channels | Use 320 MHz even when sub-channels have interference |
| MIMO | 8x8 MU-MIMO | 16x16 MU-MIMO | Theoretical; enterprise APs typically ship 4x4 or 8x8 |

### 4.2 Multi-Link Operation (MLO)

MLO is the defining feature of Wi-Fi 7. It allows a single logical connection between an AP and a client to span multiple bands (2.4 GHz, 5 GHz, 6 GHz) or multiple channels within a band simultaneously.

**Simultaneous Transmit and Receive (STR):** The client transmits on one link while receiving on another. This is the ideal mode but requires sufficient antenna isolation between radios. Most Wi-Fi 7 enterprise APs support STR across all three bands.

**Enhanced Multi-Link Single Radio (eMLSR):** The client listens on multiple links but transmits on only one at a time, switching dynamically based on channel conditions. This is the practical mode for battery-powered clients (phones, laptops) where running three radios simultaneously would drain the battery.

**Non-Simultaneous Transmit and Receive (NSTR):** Fallback mode for devices with insufficient isolation. One link at a time, selected dynamically. Better than single-link but no aggregation.

MLO's primary engineering value is not raw throughput aggregation (though that helps) but latency reduction and reliability. If the 5 GHz link experiences a burst of interference, traffic seamlessly shifts to the 6 GHz link within microseconds, without reassociation. For latency-sensitive applications (voice, video conferencing, real-time telemetry), this eliminates the multi-second disruption that band steering caused in previous generations.

### 4.3 4096-QAM: The SNR Tax

4096-QAM encodes 12 bits per symbol, compared to 10 bits for 1024-QAM. The theoretical throughput improvement is 20%. However, 4096-QAM requires an SNR of approximately 38-40 dB to operate reliably. In practical terms, this means the client must be within a few meters of the AP with a clear line of sight. At typical office distances (8-15 meters through drywall), SNR rarely exceeds 30-35 dB, and the AP will negotiate down to 1024-QAM or 256-QAM.

4096-QAM is an optional Wi-Fi 7 certification feature. Its engineering impact is marginal for most deployments. The real throughput gains in Wi-Fi 7 come from 320 MHz channels and MLO, not modulation improvements.

### 4.4 Theoretical vs. Practical Throughput

The chasm between theoretical maximum and real-world throughput is wider in wireless than in any other networking domain:

| Configuration | Theoretical Max | Realistic Single-Client | Dense Environment (50+ clients) |
|---------------|-----------------|------------------------|---------------------------------|
| Wi-Fi 6, 80 MHz, 2x2 | 1.2 Gbps | 500-700 Mbps | 50-150 Mbps per client |
| Wi-Fi 6E, 160 MHz, 2x2 | 2.4 Gbps | 1.0-1.5 Gbps | 80-200 Mbps per client |
| Wi-Fi 7, 320 MHz, 2x2 | 5.76 Gbps | 2.0-3.5 Gbps | 100-300 Mbps per client |
| Wi-Fi 7, 320 MHz, 4x4 MLO | 11.5 Gbps | 3.0-5.0 Gbps | 150-400 Mbps per client |

The factors that reduce theoretical to practical include: protocol overhead (20-30%), medium contention (CSMA/CA), retransmissions, management frame traffic, client capability asymmetry (not all clients support 320 MHz or 4x4 MIMO), and environmental interference.

---

## 5. Site Surveys and RF Planning

A wireless network is only as good as the RF environment it operates in. Site surveys are the process of measuring, modeling, or predicting that environment to inform AP placement, channel assignment, and power levels.

### 5.1 Survey Types

| Survey Type | When to Use | What You Get | Accuracy | Cost |
|-------------|-------------|-------------|----------|------|
| Predictive (virtual) | Pre-construction, new builds, budget estimation | Simulated heatmaps from floor plans and material properties | Medium (dependent on accurate material attenuation data) | Low |
| AP-on-a-stick | Pre-deployment validation, existing buildings | Measured heatmaps from a temporary AP walked through the space | High | Medium |
| Post-deployment validation | After AP installation, during commissioning | Measured heatmaps confirming design meets requirements | Highest | Medium-High |
| Continuous monitoring | Production environments | Ongoing RF quality metrics from deployed APs | Real-time but AP-perspective only | Included in controller licensing |

### 5.2 Survey Tooling

**Ekahau AI Pro** (formerly Ekahau Site Survey) is the market leader for enterprise Wi-Fi site surveys. It provides predictive modeling, AP-on-a-stick survey workflows, and post-deployment validation in a single platform. Ekahau's Sidekick 2 hardware provides a dedicated dual-band survey radio that measures signal strength, noise, and interference without relying on the laptop's Wi-Fi adapter. As of 2026, Ekahau AI Pro includes AI-assisted AP auto-placement and channel planning.

**iBwave Unity** is the platform of choice for large venue, stadium, and in-building DAS (Distributed Antenna System) design. iBwave excels at 3D modeling, making it superior to Ekahau for multi-floor buildings, atriums, and complex architectural geometries. iBwave Unity also supports cellular (LTE, 5G) planning alongside Wi-Fi, which is essential for venues deploying converged wireless infrastructure.

| Capability | Ekahau AI Pro | iBwave Unity |
|------------|---------------|-------------|
| Predictive modeling | Strong (2D, basic 3D) | Strong (full 3D, multi-floor) |
| AP-on-a-stick survey | Excellent (Sidekick 2 hardware) | Limited (software-focused) |
| Spectrum analysis | Integrated via Sidekick 2 | Requires external analyzer |
| Cellular planning | No | Yes (LTE, 5G, DAS) |
| Team collaboration | Real-time cloud collaboration | Real-time cloud collaboration |
| Vendor AP libraries | Extensive (all major vendors) | Extensive (all major vendors) |
| Price point | ~$5,000-8,000/year (subscription) | ~$4,000-12,000/year (varies by modules) |
| Best for | Campus, office, warehouse Wi-Fi | Stadium, multi-floor, converged wireless |

### 5.3 Interference Sources

A comprehensive site survey identifies not just Wi-Fi signals but all sources of RF interference:

| Source | Frequency | Impact | Detection |
|--------|-----------|--------|-----------|
| Microwave ovens | 2.45 GHz | Severe on 2.4 GHz channels 6-11 | Spectrum analyzer; intermittent broadband noise |
| Bluetooth | 2.4 GHz (FHSS) | Low-moderate on 2.4 GHz | Spectrum analyzer; frequency hopping signature |
| Radar (DFS) | 5 GHz (5.25-5.725 GHz) | Forces channel evacuation | AP DFS event logs |
| Baby monitors (analog) | 2.4 GHz | Severe, continuous carrier | Spectrum analyzer |
| Wireless cameras | 2.4/5 GHz | Moderate-severe, continuous | Spectrum analyzer |
| Cordless phones (DECT) | 1.9 GHz | None on Wi-Fi bands | N/A |
| Fluorescent lighting | Broadband EMI | Low, raises noise floor | Noise floor measurement with lights on vs. off |
| USB 3.0 cables/hubs | 2.4 GHz | Moderate, raises noise floor 10-20 dB | Spectrum analyzer; correlates with USB 3.0 activity |

---

## 6. Wireless Controller Architectures

The controller is the management plane of a wireless network. It handles AP provisioning, channel and power assignment, client roaming, security policy enforcement, and monitoring. The architecture decision, on-premises versus cloud-managed versus controllerless, has operational, cost, and security implications.

### 6.1 Architecture Comparison

| Architecture | Examples | Control Plane | Data Plane | Internet Dependency | Best For |
|--------------|----------|---------------|------------|---------------------|----------|
| On-premises controller | Cisco Catalyst 9800, Aruba Mobility Controller | Local appliance or VM | Local (tunneled or bridged) | None (fully air-gapped capable) | Regulated industries, high-security, air-gapped networks |
| Cloud-managed | Cisco Meraki, Juniper Mist, Aruba Central, ExtremeCloud IQ | Vendor cloud | Local (APs bridge/route directly) | Required for management; data stays local | Multi-site enterprises, MSPs, organizations with thin IT staff |
| Controllerless (autonomous) | Aruba Instant (virtual controller), Ruckus Unleashed | Elected master AP | Local (APs bridge directly) | None | Small sites, branch offices, <50 AP deployments |

### 6.2 Vendor Landscape (2026)

**Cisco Catalyst 9800** is the on-premises controller for Cisco's enterprise wireless portfolio. It runs on physical appliances (9800-40, 9800-80, 9800-L), virtual machines (9800-CL), or embedded in Catalyst 9000 switches. The 9800 series replaced the legacy AireOS controllers (5520, 8540) and uses IOS-XE as its operating system. Cisco's "Catalyst" branded APs (C-series) work exclusively with the 9800 controller, while "CW" branded APs can be managed by either the 9800 or Meraki cloud.

**Cisco Meraki** is the dominant cloud-managed wireless platform by installed base. Meraki's value proposition is simplicity: zero-touch provisioning, centralized dashboard, and integrated security features (content filtering, intrusion detection, Bluetooth scanning). The tradeoff is vendor lock-in through subscription licensing. If the Meraki license expires, management access is lost (APs continue forwarding traffic with last-known config but cannot be reconfigured).

**Juniper Mist** (now under HPE following the Juniper acquisition) is the strongest AI-driven wireless platform. Mist's Marvis Virtual Network Assistant uses machine learning to identify root causes of wireless problems ("Marvis Actions"), correlate client experience metrics across the RF, wired, and WAN domains, and automate remediation. Gartner named Juniper a Leader in the 2025 Magic Quadrant for Enterprise Wired and Wireless LAN Infrastructure. Mist's API-first architecture makes it the preferred platform for organizations with strong NetDevOps practices.

**Aruba (HPE)** offers both on-premises (Aruba Mobility Controllers) and cloud-managed (Aruba Central) options. The HPE acquisition of Juniper in 2024 created an unusual situation: HPE now owns both Aruba and Juniper Mist, two competing wireless platforms. As of 2026, HPE has not announced platform consolidation, and both product lines continue to receive investment.

---

## 7. Wi-Fi Security Evolution

### 7.1 WPA3 and Its Components

WPA3, ratified by the Wi-Fi Alliance in 2018, is mandatory for all Wi-Fi 6E devices operating in the 6 GHz band and for Wi-Fi 7 certification. WPA3 comprises several distinct security mechanisms:

| Mechanism | WPA3 Mode | What It Does | Replaces |
|-----------|-----------|-------------|----------|
| SAE (Simultaneous Authentication of Equals) | WPA3-Personal | Replaces PSK 4-way handshake with a zero-knowledge proof; immune to offline dictionary attacks | WPA2-Personal (PSK) |
| OWE (Opportunistic Wireless Encryption) | Wi-Fi Enhanced Open | Encrypts open network traffic using Diffie-Hellman key exchange; no password required | Unencrypted open networks |
| 802.1X with GCMP-256 | WPA3-Enterprise | Standard enterprise authentication with AES-256 encryption | WPA2-Enterprise (AES-128) |
| 192-bit Security Suite | WPA3-Enterprise 192-bit | CNSA-grade security; requires EAP-TLS with certificates; GCMP-256 + BIP-GMAC-256 | No direct predecessor |
| PMF (Protected Management Frames) | All WPA3 modes | Encrypts management frames (deauth, disassociation); prevents deauthentication attacks | Optional in WPA2 |

### 7.2 Enterprise Authentication: EAP-TLS

WPA3-Enterprise 192-bit mode exclusively requires EAP-TLS, which uses X.509 certificates on both the client and the RADIUS server. This eliminates passwords entirely from the authentication flow but introduces certificate lifecycle management complexity:

- A certificate authority (CA) must issue, distribute, and revoke client certificates
- Certificate enrollment can use SCEP, EST, or MDM-based provisioning
- Certificate expiration requires proactive renewal workflows
- RADIUS infrastructure (FreeRADIUS, Cisco ISE, Aruba ClearPass, Microsoft NPS) must validate certificate chains

For organizations that cannot deploy certificates to all devices, WPA3-Enterprise (without the 192-bit suite) supports EAP-PEAP/MSCHAPv2 and EAP-TTLS, which use server-side certificates with client-side username/password. This is the pragmatic choice for most enterprise deployments in 2026.

### 7.3 Deployment Reality

A 2026 analysis from CWNP (Certified Wireless Network Professional) found that the gap between WPA3 specification and deployment reality remains significant. True WPA3-Enterprise (with Suite B ciphers and GCMP) is fully supported on Apple devices and Android, but Windows and Linux support remains "transitional WPA3" with Management Frame Protection enabled but without Suite B cipher negotiation. For mixed-OS environments, WPA3-Enterprise transition mode (which accepts both WPA2 and WPA3 clients) is the practical deployment choice.

---

## 8. IoT Networking Protocols

IoT devices have fundamentally different networking requirements than laptops and phones. They transmit small amounts of data infrequently, must operate on battery power for years, and often need mesh networking to cover large physical areas. Wi-Fi is poorly suited for most IoT use cases due to its high power consumption and association overhead.

### 8.1 Protocol Comparison

| Protocol | Frequency | Range (Typical) | Max Data Rate | Power Profile | Topology | IP-Native | Max Nodes | Best For |
|----------|-----------|-----------------|---------------|---------------|----------|-----------|-----------|----------|
| Zigbee (802.15.4) | 2.4 GHz | 10-100 m | 250 kbps | Very low (years on coin cell) | Mesh | No (requires gateway) | 65,000 | Lighting, sensors, building automation |
| Z-Wave (800/900 series) | 908.42 MHz (US) | 30-100 m | 100 kbps (Long Range: 200 kbps) | Very low | Mesh | No (requires hub) | 232 | Home automation, security |
| Thread (802.15.4) | 2.4 GHz | 10-100 m | 250 kbps | Very low (2-3x Zigbee battery life) | Mesh | Yes (IPv6 native) | 250+ (scalable) | Smart home, Matter transport |
| Matter (application layer) | Over Thread, Wi-Fi, Ethernet | Depends on transport | Depends on transport | Depends on transport | Defined by transport | Yes | N/A (application layer) | Multi-vendor smart home interoperability |
| LoRaWAN | Sub-GHz (915 MHz US, 868 MHz EU) | 1-5 km (urban), 10-15 km (rural) | 0.3-27 kbps | Extremely low (2+ years) | Star (via gateways) | No (requires network server) | Thousands per gateway | Agriculture, asset tracking, environmental monitoring |
| BLE Mesh (Bluetooth 5.x) | 2.4 GHz | 10-100 m (per hop) | 2 Mbps (BLE 5.0) | Low-moderate | Mesh (managed flood) | No (requires proxy) | 32,767 | Lighting, indoor positioning, wearables |
| NB-IoT (3GPP) | Licensed cellular bands | 1-10 km | 250 kbps DL, 250 kbps UL | Very low (10+ years) | Star (cellular) | Yes | Carrier-managed | Metering, agriculture, smart city |

### 8.2 Thread and Matter: The Convergence Path

Thread is a networking protocol; Matter is an application protocol. Thread provides the IPv6 mesh transport layer, and Matter defines what devices say to each other over that transport. Matter can also run over Wi-Fi and Ethernet, but Thread is its native mesh transport for battery-powered devices.

Matter version 1.4 (current as of 2026) supports device types including lights, switches, sensors, locks, thermostats, media players, and window coverings. Matter is backed by Apple, Google, Amazon, Samsung, and over 600 member companies in the Connectivity Standards Alliance (CSA). The practical state of Matter in 2026 is improving rapidly: Thread 1.4 addressed many early stability issues, and device manufacturers are releasing more reliable implementations. However, for production-critical IoT deployments (building automation, industrial sensing), Zigbee's two decades of proven reliability and massive installed base of billions of devices remains the safer choice.

### 8.3 LoRaWAN for Long-Range Industrial IoT

LoRaWAN occupies a unique position: it trades data rate for range and battery life. A single LoRaWAN gateway can cover several square kilometers and support thousands of end devices. The data rates (0.3-27 kbps depending on spreading factor) are sufficient for sensor telemetry (temperature, humidity, vibration, water level) but entirely inadequate for rich data (images, audio, video).

LoRaWAN's three device classes balance latency against power consumption:

| Class | Behavior | Latency | Battery Life | Use Case |
|-------|----------|---------|-------------|----------|
| Class A | Opens two short receive windows after each uplink | Seconds to hours (depends on uplink interval) | Maximum (years) | Environmental sensors, asset trackers |
| Class B | Scheduled receive windows synced to beacon | Deterministic (configurable) | Good | Actuators with moderate latency tolerance |
| Class C | Continuously listening | Near real-time | Poor (mains-powered) | Streetlights, industrial controllers |

---

## 9. 5G Private Networks and CBRS

Private 5G networks allow enterprises to deploy their own cellular infrastructure using shared or licensed spectrum, without depending on a mobile carrier. In the United States, the Citizens Broadband Radio Service (CBRS) in the 3.5 GHz band (3550-3700 MHz) is the primary mechanism for private 5G deployment.

### 9.1 CBRS Three-Tier Spectrum Access

| Tier | Access Type | Spectrum | Protection Level | Cost | Use Case |
|------|------------|----------|-----------------|------|----------|
| Incumbent | Federal (Navy radar), Fixed Satellite | Full band | Highest (all others must defer) | N/A | Government/military |
| Priority Access License (PAL) | Auctioned by FCC, 10 MHz blocks, county-based | 3550-3650 MHz (100 MHz) | Protected from GAA interference | $1,000-$100,000+ per license per county | Enterprise campus, healthcare, critical manufacturing |
| General Authorized Access (GAA) | Open to anyone, no license required | 3550-3700 MHz (150 MHz) | None (must accept interference from tiers above) | Free (equipment + SAS subscription) | Warehouse, temporary deployments, testing |

All CBRS devices must operate under the control of a Spectrum Access System (SAS), which dynamically allocates spectrum to avoid interference with incumbent users. CBRS 2.0 (introduced 2025) extended uninterrupted commercial operations from 78% to 97% of US landmass and introduced a 24-hour heartbeat interval, replacing the previous 240-second requirement. This dramatically improves resilience for always-on industrial use cases.

### 9.2 Open RAN Architecture

Open RAN (O-RAN) disaggregates the traditional monolithic base station into modular, multi-vendor components:

| Component | Function | Traditional | Open RAN |
|-----------|----------|-------------|----------|
| Radio Unit (RU) | RF transmission/reception | Proprietary, integrated | O-RAN compliant, multi-vendor |
| Distributed Unit (DU) | Real-time L1/L2 processing | Proprietary, integrated | COTS server + software |
| Centralized Unit (CU) | Non-real-time L3/PDCP | Proprietary, integrated | COTS server + software |
| RAN Intelligent Controller (RIC) | AI/ML optimization | N/A | O-RAN specified, open APIs |

Open RAN's promise is vendor diversity and cost reduction. Its reality in 2026 is mixed: integration complexity remains high, and most private 5G deployments still use single-vendor solutions (Nokia, Ericsson, Samsung, or JMA Wireless) for production reliability. Open RAN is maturing in the carrier space but has limited traction in enterprise private networks.

### 9.3 Private 5G vs. Wi-Fi 6E/7 Decision Framework

| Factor | Private 5G (CBRS) | Wi-Fi 6E/7 |
|--------|--------------------|-------------|
| Spectrum | Licensed/shared (CBRS); interference protection | Unlicensed; no interference protection |
| Coverage per AP | 200-500 m (indoor), 1+ km (outdoor) | 15-30 m (typical indoor at 6 GHz) |
| Latency | <10 ms (URLLC profile) | 5-20 ms (typical), variable under load |
| Handoff | Carrier-grade (sub-ms) | Varies (802.11r: ~50 ms; MLO: microseconds) |
| Client ecosystem | Limited; requires SIM/eSIM; purpose-built devices | Ubiquitous; every laptop, phone, tablet |
| Cost | High ($50K-500K+ for small campus) | Low-moderate ($5K-50K for same coverage) |
| Best for | Warehouses (AGV/AMR control), manufacturing (PLC connectivity), outdoor campus, mission-critical IoT | Office, education, retail, healthcare (clinical), general connectivity |

The decision is not either/or. Many large campuses deploy Wi-Fi for general connectivity and private 5G for specific operational technology (OT) workloads that require deterministic latency and seamless mobility.

---

## 10. Edge Compute Networking

Edge computing places compute resources closer to the data source or end user, reducing latency and bandwidth consumption. The "edge" exists at multiple tiers, each with different latency profiles and use cases.

### 10.1 Edge Compute Tiers

| Tier | Location | Latency to User | Examples | Use Cases |
|------|----------|-----------------|----------|-----------|
| Device edge | On the device itself | <1 ms | Smartphone ML inference, industrial PLC | Real-time control, privacy-sensitive inference |
| On-premises edge | Customer site (server room, factory floor) | 1-5 ms | NVIDIA EGX, AWS Outposts, Azure Stack Edge | Video analytics, manufacturing QC, AR/VR rendering |
| Network edge (MEC) | Telecom CO or cell tower | 5-20 ms | AWS Wavelength, Google Distributed Cloud Edge | Autonomous vehicles, connected factories, game streaming |
| CDN edge / Compute edge | PoP locations worldwide | 10-50 ms | Cloudflare Workers, Deno Deploy, Vercel Edge, Fastly Compute | API routing, authentication, personalization, A/B testing |
| Regional cloud | Cloud region | 20-100 ms | AWS us-west-2, GCP us-west1 | General compute, databases, batch processing |

### 10.2 CDN Edge Compute Platforms

The CDN edge compute tier has seen explosive growth. Edge function adoption grew 287% year-over-year in 2025, with 56% of new applications using at least one edge function.

| Platform | Runtime | Cold Start | Global PoPs | Pricing Model | Differentiator |
|----------|---------|------------|-------------|---------------|----------------|
| Cloudflare Workers | V8 Isolates | <1 ms | 330+ | Pay per request ($0.50/M) | Largest edge network; Workers AI for inference; KV, R2, D1 storage |
| Deno Deploy | V8 + Wasm | <1 ms | 35+ regions | Free tier; usage-based | Wasm-first strategy; TypeScript native; Deno KV |
| Vercel Edge Functions | V8 Isolates (via Cloudflare) | <1 ms | Cloudflare network | Included in Vercel plans | Next.js integration; middleware pattern |
| Fastly Compute | Wasm (Wasmtime) | ~1 ms | 90+ PoPs | Usage-based | Wasm-first; strongest for custom logic at CDN layer |
| AWS Lambda@Edge | Node.js/Python | 50-200 ms | CloudFront PoPs | Per request + duration | AWS ecosystem integration; CloudFront triggers |

The architectural pattern emerging in 2026 is a three-tier hybrid: edge functions for authentication, redirects, geo-routing, and personalization; containers (Kubernetes, ECS) for application logic and business rules; serverless functions for background tasks, webhooks, and event processing.

### 10.3 Multi-Access Edge Computing (MEC)

MEC (defined by ETSI) places compute at the telecom network edge, typically at the base station or central office. The key advantage over CDN edge is sub-10ms latency and integration with the cellular network's QoS mechanisms.

MEC adoption in 2025-2026 is driven by specific use cases where CDN edge latency (10-50 ms) is insufficient: autonomous vehicle coordination (requires <5 ms), robotic control in manufacturing (requires <10 ms), and augmented reality overlay (requires <20 ms with consistent jitter). For web applications and APIs, CDN edge compute has proven sufficient, and MEC remains a niche technology outside telecom and OT environments.

---

## 11. RF Planning Guidelines

### 11.1 Design Targets by Environment

| Environment | RSSI Target | SNR Target | Channel Width | AP Density | Channel Reuse Distance |
|-------------|-------------|------------|---------------|------------|----------------------|
| Open office | -65 dBm | 25 dB | 40-80 MHz (5/6 GHz) | 1 AP per 2,500-3,500 sq ft | 3-cell pattern minimum |
| High-density (auditorium, conference) | -60 dBm | 30 dB | 20-40 MHz | 1 AP per 1,000-1,500 sq ft | Reduce TX power, maximize channel diversity |
| Warehouse | -70 dBm | 20 dB | 80 MHz | 1 AP per 5,000-10,000 sq ft (varies with racking) | Directional antennas, mount above rack height |
| Hospital | -65 dBm | 25 dB | 40-80 MHz | 1 AP per 2,000-3,000 sq ft | Avoid DFS channels (medical equipment interference) |
| Manufacturing floor | -67 dBm | 22 dB | 40 MHz | Varies (metal, moving equipment) | Industrial-rated APs, external antennas |
| Outdoor campus | -70 dBm | 20 dB | 80-160 MHz | Sector antennas, directional design | Point-to-multipoint with sector coverage |

### 11.2 Common Design Rules

**Power balancing:** The AP's transmit power should be set so that the weakest client can be heard at the AP with the same quality that the client hears the AP. An AP transmitting at 23 dBm while a phone transmits at 14 dBm creates a 9 dB asymmetry. The client can hear the AP fine, but the AP cannot hear the client's responses at the cell edge. Reduce AP power to match client capability plus any receive sensitivity advantage the AP has (typically 3-5 dB).

**Minimum of three non-overlapping channels:** Any channel plan must provide at least three non-overlapping channels in the deployed band. In 2.4 GHz, this means channels 1, 6, and 11 only (no channel 3, 8, or other partial-overlap schemes). In 5/6 GHz with 80 MHz channels, this is easily achievable.

**Design for 5/6 GHz, tolerate 2.4 GHz:** Modern wireless designs use 5 GHz and 6 GHz as the primary bands. 2.4 GHz provides fallback connectivity for legacy devices (IoT sensors, older printers) but should not be the design target. Reduce 2.4 GHz AP power to minimize coverage overlap.

**Measure channel utilization, not just signal strength:** A location can have excellent signal strength (-55 dBm) and still deliver poor performance if channel utilization exceeds 70%. The fix for high channel utilization is more channels (wider band, smaller channel widths) or more APs on different channels, not higher transmit power.

**Account for attenuation asymmetry:** A reinforced concrete elevator shaft that attenuates the signal by 25 dB in one direction will also attenuate it by 25 dB in the other direction. But a glass conference room wall (5 dB attenuation) that seems transparent to signal in a survey might cause problems when 20 people sit in the room, each adding 3-5 dB of body attenuation and generating interference from their own devices.

---

## 12. Source Index and Citations

### Standards and Specifications

- **ieee-802.11be:** IEEE 802.11be-2024 (published July 2025), *Enhancements for Extremely High Throughput (EHT)*, IEEE Standards Association.

- **ieee-802.11ax:** IEEE 802.11ax-2021, *Enhancements for High Efficiency WLAN*, IEEE Standards Association.

- **ieee-802.15.4:** IEEE 802.15.4-2020, *Low-Rate Wireless Personal Area Networks*, IEEE Standards Association.

- **3gpp-r17:** 3GPP Release 17 (2022), *5G NR specifications including URLLC and private network profiles*.

- **fcc-part-96:** FCC Part 96 — Citizens Broadband Radio Service, 47 CFR Part 96.

- **wi-fi-alliance-wpa3:** Wi-Fi Alliance, *WPA3 Specification*, version 3.3, 2024. https://www.wi-fi.org/discover-wi-fi/security

### Vendor and Industry Sources

- **cisco-wifi7-dg:** Cisco, *Wi-Fi 7 and the Growing Future of Wireless Design Guide*, 2025. https://www.cisco.com/c/en/us/products/collateral/networking/wireless/wifi7-future-of-wireless-dg.html

- **cisco-wpa3-dg:** Cisco, *WPA3 Deployment Guide*, Catalyst 9800 Technical Reference, 2025. https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/technical-reference/wpa3-dg.html

- **meraki-wifi7:** Cisco Meraki, *Wi-Fi 7 (802.11be) Technical Guide*, Meraki Documentation, 2025. https://documentation.meraki.com/Wireless

- **meraki-afc:** Cisco Meraki, *Automatic Frequency Coordination*, Meraki Documentation, 2025. https://documentation.meraki.com/Wireless/Design_and_Configure/Deployment_Guides/Automatic_Frequency_Coordination

- **cisco-afc-faq:** Cisco, *Automated Frequency Coordination (AFC) FAQ*, 2025. https://www.cisco.com/c/en/us/products/collateral/networking/wireless/access-points/automated-frequency-coordination-faq.html

- **aruba-wifi7:** Aruba (HPE), *Wi-Fi 7 Features and Benefits*, TechDocs, 2025. https://arubanetworking.hpe.com/techdocs/aos/wifi-design-deploy/generations/wifi7/feature-benefit/

- **intel-wifi7:** Intel, *What Is Wi-Fi 7?*, Intel Product Documentation, 2025. https://www.intel.com/content/www/us/en/products/docs/wireless/wi-fi-7.html

- **cisco-6e-wp:** Cisco, *Wi-Fi 6E: The Next Great Chapter in Wi-Fi White Paper*, 2023. https://www.cisco.com/c/en/us/solutions/collateral/enterprise-networks/802-11ax-solution/nb-06-wi-fi-6e-wp-cte-en.html

### Research and Analysis

- **cbrs-market:** SNS Telecom, *LTE & 5G NR-Based CBRS Networks*, 2025. https://www.snstelecom.com/cbrs

- **cbrs-deployments:** Netmanias, *Private 5G/4G Network Deployments in the US (CBRS Spectrum)*, 2025. https://www.netmanias.com/en/post/oneshot/16155

- **cbrs-evolution:** RCR Wireless, *5G CBRS Evolution with Advanced Spectrum Sharing*, August 2025. https://www.rcrwireless.com/20250806/5g/5g-cbrs-spectrum

- **wpa3-reality:** RCR Wireless, *WPA3: Why Wi-Fi Security Is More Nuanced Than You Think*, February 2026. https://www.rcrwireless.com/20260212/analyst-angle/wpa3-wi-fi-security

- **mec-latency:** WitanWorld, *Beyond the Cloud: Reducing Latency with Multi-Access Edge Computing in 2026*, February 2026. https://witanworld.com/article/2026/02/27/beyond-the-cloud-reducing-latency-with-multi-access-edge-computing-in-2026

- **edge-adoption:** Apex Logic, *The Edge Effect: Serverless and Deployment Redefined in 2026*, 2026. https://www.apex-logic.net/news/the-edge-effect-serverless-and-deployment-redefined-in-2026

- **gartner-2025:** Gartner, *Magic Quadrant for Enterprise Wired and Wireless LAN Infrastructure*, 2025. https://www.gartner.com/reviews/market/enterprise-wired-wireless-lan-access-infrastructure

- **arxiv-wifi7:** Lopez-Raventos et al., *IEEE 802.11be Wi-Fi 7: Feature Summary and Performance Evaluation*, arXiv:2309.15951v3, 2024. https://arxiv.org/html/2309.15951v3

---

*[PENDING REVIEW] -- This module has been generated and requires human review gate before transitioning from Published to fully verified status.*

*Document ID: SNE-08-wireless-edge-networking | Version: 1.0 | Owner: Systems Network Engineering Mission | Last Reviewed: 2026-04-08 | Next Review: 2027-04-08*
