# Product Architecture

> **Domain:** AI-Powered Manufacturing Inspection
> **Module:** 2 -- Synsor Corp
> **Through-line:** *A turnkey system in a box: camera, edge computer, lighting, bracket, software, dashboard. Minutes to deploy, edge-first inference, and the deliberate choice to be hardware-flexible rather than hardware-locked.*

---

## Table of Contents

1. [The Turnkey Thesis](#1-the-turnkey-thesis)
2. [Hardware Components](#2-hardware-components)
3. [Software Architecture](#3-software-architecture)
4. [Edge-First Design](#4-edge-first-design)
5. [Deployment Model](#5-deployment-model)
6. [Target Verticals](#6-target-verticals)
7. [Hardware Flexibility Strategy](#7-hardware-flexibility-strategy)
8. [Operator Dashboard](#8-operator-dashboard)
9. [System Integration Points](#9-system-integration-points)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Turnkey Thesis

Synsor.ai's product strategy centers on a single architectural bet: that manufacturing quality inspection can be delivered as a turnkey system requiring minimal customer IT infrastructure changes and deploying in minutes rather than months. This is a deliberate competitive positioning against incumbent AOI (Automated Optical Inspection) vendors whose systems typically require weeks of integration, custom camera calibration, and significant IT infrastructure modifications [1][2].

The turnkey approach trades customization depth for deployment speed. A Cognex or Keyence system can be tuned to sub-pixel precision for specific inspection tasks; Synsor's system aims to deliver useful anomaly detection from a standardized kit that a production line operator can install without a systems integrator. This is a different market: not the tier-1 automotive OEM with a dedicated quality engineering team, but the mid-market manufacturer running batch production who currently relies on periodic human visual inspection [1][2].

---

## 2. Hardware Components

The physical system comprises four components delivered as an integrated kit:

| Component | Function | Notes |
|-----------|----------|-------|
| **Camera** | Industrial-grade imaging for batch production capture | Supports both proprietary and third-party cameras |
| **Edge Computer** | On-premise compute unit running deep learning inference | Self-contained; no cloud dependency |
| **Lighting** | Controlled illumination for consistent image quality | Critical for model accuracy; eliminates ambient variation |
| **Mounting Bracket** | Physical integration with production line | Designed for rapid installation without line modification |

The lighting component is often overlooked in AI vision discussions but is architecturally critical. Deep learning models trained on images captured under controlled illumination will produce unreliable results under variable factory lighting. By including standardized lighting in the kit, Synsor controls one of the most significant sources of inference noise [1][2].

The mounting bracket design reflects the turnkey philosophy: it must attach to existing production line structures without requiring custom fabrication or line stoppage for installation. This is a mechanical engineering constraint that directly affects go-to-market speed [2].

---

## 3. Software Architecture

The software comprises two distinct layers:

### 3.1 Background Intelligence Layer

The background layer handles the core AI workload:

- **Deep learning inference:** Anomaly detection model classifying each captured image against trained patterns
- **Feature compression:** Patent-protected technique for extracting and compressing image features into temporal representations (see [Module 03: Patent Landscape](03-patent-landscape.md))
- **Temporal trend analysis:** The core innovation -- detecting gradual quality degradation across production runs by analyzing compressed feature sequences over time
- **Alert generation:** Producing actionable alerts when trend analysis indicates process drift toward failure thresholds

This layer runs entirely on the edge compute unit, with no cloud dependency for real-time inference [1][3].

### 3.2 Customer-Facing UI Layer

The operator-facing layer provides:

- System control and monitoring
- Real-time anomaly alerts
- Historical trend visualization
- Root cause indicators
- Predictive maintenance integration hooks

The UI is designed for manufacturing operators, not data scientists. The information hierarchy prioritizes actionable alerts over raw model outputs [1][2].

---

## 4. Edge-First Design

The decision to run inference on-premise on the edge compute unit rather than in the cloud is architecturally motivated by four constraints:

**Latency.** Production lines operate at speeds where cloud round-trip latency (50-200ms typical) is unacceptable for real-time quality gating. Inline inspection must complete within the production cycle time, which for high-speed batch production can be sub-second [1].

**Bandwidth.** Industrial cameras at production speeds generate data rates that exceed practical WAN bandwidth for continuous streaming. A single industrial camera capturing at 30fps with 5MP resolution generates approximately 450MB/s of raw image data -- far beyond typical factory internet connections [1].

**Data sovereignty.** German manufacturing data is subject to GDPR and sector-specific regulations. Many German manufacturers view cloud processing of production data as a compliance risk, particularly when the cloud provider is a US-headquartered hyperscaler. Edge processing keeps data on-premise by default [1][4].

**Reliability.** Factory internet connectivity varies widely. Edge systems operate independently of network state, ensuring that inspection continues during network outages. For a quality inspection system, any gap in coverage represents potential undetected defects [1].

---

## 5. Deployment Model

The deployment sequence reflects the turnkey philosophy:

1. **Physical installation:** Mount bracket, camera, and lighting on existing production line structure
2. **Edge computer placement:** Position edge compute unit near the camera (wired connection)
3. **Network connection:** Connect to factory LAN for dashboard access (optional; system operates independently)
4. **Initial calibration:** Brief setup period where the system captures baseline images of acceptable production
5. **Model training:** System learns normal production patterns (duration depends on product complexity and production speed)
6. **Active monitoring:** Real-time anomaly detection and trend analysis begins

The claimed deployment time of "minutes" likely refers to the physical installation (steps 1-3); the full system including calibration and model training would require hours to days depending on the production environment [1][2].

---

## 6. Target Verticals

Synsor targets batch and series production environments across five verticals:

| Vertical | Inspection Need | Complexity |
|----------|----------------|------------|
| **Plastics** | Surface defects, dimensional drift, color consistency | Medium |
| **Metal/sheet metal** | Surface finish, tool wear indicators, dimensional accuracy | High |
| **Food** | Packaging integrity, contamination detection, label accuracy | High (regulatory) |
| **Cosmetics** | Container defects, fill level, label placement | Medium |
| **Packaging** | Seal integrity, print quality, dimensional compliance | Medium |

The common thread across these verticals is batch production: repetitive manufacturing of similar items where visual quality inspection is currently performed by human operators or periodic sampling. These are environments where a camera watching every item and detecting trends represents a step function improvement over sampling-based quality control [1][2].

---

## 7. Hardware Flexibility Strategy

Synsor supports integration with both proprietary and third-party cameras. This is a strategic decision with several implications:

**Reduces lock-in risk for customers.** Manufacturers who have already invested in camera infrastructure can potentially integrate Synsor's software and edge compute without replacing their existing cameras. This lowers the total cost of adoption and removes a common sales objection [1][2].

**Expands addressable market.** By not requiring proprietary hardware, Synsor can address installations where another camera vendor's hardware is already in place -- a significantly larger market than greenfield installations only [2].

**Increases integration complexity.** Supporting multiple camera hardware interfaces requires additional software engineering effort and introduces variance in image quality, resolution, and capture timing that the AI model must accommodate [2].

---

## 8. Operator Dashboard

The operator dashboard serves as the human interface to the AI system. Its design reflects the target user: a production line operator or quality supervisor, not a data scientist or ML engineer.

Key dashboard capabilities:

- **Real-time anomaly alerts:** Immediate notification when the system detects anomalies exceeding configured thresholds
- **Historical trend visualization:** Charts showing quality metrics over time, enabling operators to see process drift patterns
- **Root cause indicators:** When anomaly trends correlate with known failure modes, the dashboard surfaces potential root causes
- **Predictive maintenance hooks:** Integration points for connecting quality trend data to maintenance scheduling systems

The dashboard architecture follows the Denise chip pattern in the GSD ecosystem: a display and analysis layer that renders insight from raw I/O data (see [Module 07: PNW & Connections](07-pnw-connections.md)) [1][3].

---

## 9. System Integration Points

The turnkey system connects to the broader factory IT environment through several integration points:

- **Factory LAN:** Dashboard access for operators and quality supervisors
- **MES integration:** Manufacturing Execution System data exchange for production context
- **ERP hooks:** Enterprise resource planning integration for quality data reporting
- **Predictive maintenance systems:** Trend data feeding maintenance scheduling platforms
- **Alert systems:** Email, SMS, or factory alert system integration for anomaly notifications

These integration points are optional -- the system operates standalone for core inspection functionality -- but essential for enterprise deployment where quality data must flow into existing manufacturing IT infrastructure [1][2].

---

## 10. Cross-References

| Project | Connection |
|---------|------------|
| [BPS](../BPS/index.html) | Bio-physics sensing -- sensor hardware, signal acquisition, edge compute patterns |
| [SHE](../SHE/index.html) | Smart home -- IoT device deployment, sensor integration, edge processing |
| [LED](../LED/index.html) | LED & controllers -- controlled illumination engineering, optical sensing |
| [SYS](../SYS/index.html) | Systems administration -- edge computing infrastructure, network architecture |
| [GSD2](../GSD2/index.html) | GSD architecture -- Denise display chip pattern, event dispatcher integration |
| [BCM](../BCM/index.html) | Building construction -- turnkey deployment model, installation standards |

---

## 11. Sources

1. [Munich Startup: Synsor.ai](https://www.munich-startup.de/startups/synsor-ai/) -- Product description and deployment model
2. [EU-Startups: Synsor.ai](https://www.eu-startups.com/) -- Directory listing, product overview
3. [LinkedIn: synsor.ai](https://www.linkedin.com/company/synsor-ai/) -- Product announcements, patent news
4. [Startbase: Synsor.ai GmbH](https://www.startbase.com/profile/synsor-ai) -- Product description
