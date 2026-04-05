# Nuclear Supply Chain and IoT Security

> **Domain:** Infrastructure Security & Safety-Critical Systems
> **Module:** 12 -- NRC Regulatory + Multi-Unit Risk + Emergency Preparedness + IoT Security
> **Through-line:** *Trust chain integrity requires continuous verification at every tier, visibility into dependencies below your direct supplier, architectural enforcement where human processes are insufficient, and cultural commitment where technical controls have gaps.*
> **Source:** NRC RIC 2026 (3 panels) + IoT Security Foundation (2 talks), ~320 minutes total
> **Rosetta Clusters:** Infrastructure (primary), Science, Business, Energy

---

## Table of Contents

1. [Nuclear Supply Chain Bottlenecks](#1-nuclear-supply-chain-bottlenecks)
2. [Multi-Unit Probabilistic Risk Assessment](#2-multi-unit-probabilistic-risk-assessment)
3. [Emergency Preparedness in Concurrent Hazards](#3-emergency-preparedness-in-concurrent-hazards)
4. [IoT Multi-Domain Security](#4-iot-multi-domain-security)
5. [Medical IoT Security](#5-medical-iot-security)
6. [Supply Chain Integrity = Trust Chain Integrity](#6-supply-chain-trust-chain-synthesis)
7. [Numbers](#7-numbers)
8. [Study Topics](#8-study-topics)
9. [DIY Sessions](#9-diy-sessions)
10. [Cross-Cluster Connections](#10-cross-cluster-connections)
11. [Sources](#11-sources)

---

## 1. Nuclear Supply Chain Bottlenecks

The NRC RIC 2026 panel on supply chain resilience revealed severe constraints for the nuclear renaissance:

### Critical Findings

- **Limited manufacturing capacity is the #1 bottleneck** -- audience poll overwhelmingly selected this over QA requirements, workforce qualification, or raw materials
- **80% of nuclear sites worldwide are multi-unit** but the supply chain was built for single-unit-at-a-time construction; ~60 active large nuclear projects competing for the same few Western suppliers
- **Tier 2 and Tier 3 suppliers are the critical gap** -- many possess technical capability but lack nuclear QA experience
- **Domestic US manufacturing severely constrained:** pipe spool fabrication ~80% utilized, valves >75% global capacity, pump lead times ~130 weeks, electrical switchgear >200 weeks

### Key Industrial Players

| Organization | Role | Key Fact |
|-------------|------|----------|
| **Doosan Enerbility** | Heavy forgings | 4.5 sq km Changwon facility; 34 reactor vessels, 124 steam generators delivered globally |
| **Bechtel** | EPC | 70+ years nuclear, 80%+ of US fleet |
| **Westinghouse** | AP-1000 | Qualified 6 Polish suppliers to NQA-1 |
| **Fermi America** | Private nuclear campus | 11-GW campus in Amarillo, TX; 4 AP-1000 + 4 SMRs for hyperscalers |
| **ASME** | Standards body | ~6,900 certificate holders worldwide |

### The NQA-1 vs. ISO 9001 Problem

ISO 9001 and NQA-1 are not equivalent without nuclear-specific experience and culture. The standards read differently and a supplier cannot simply substitute one for the other. ASME's Quality Program for Suppliers (QPS) creates a graded on-ramp pathway.

> "The nuclear industry has a reputation of being overbudget and late. We have to change that reputation and it starts with the supply base." -- Shawn Jones, Westinghouse

---

## 2. Multi-Unit Probabilistic Risk Assessment

80% of global nuclear sites are multi-unit, yet safety assessment has historically operated with a "one reactor at a time" mindset. Fukushima demonstrated the consequences.

### Key Findings

- **Multi-unit risk is not the product of single-unit risks** -- it arises from shared systems, shared structures, shared human resources, and correlated external hazards
- **Positive interactions must also be modeled** -- a less-affected unit can cross-tie systems to support a distressed sister unit
- **External hazards (especially seismic) can be the biggest contributor** -- but this is design-specific
- **No fundamental difference between "multi-unit" and "multi-module" PRA** -- framework applies to SMR deployments

### EPRI Coupling Spectrum

| Coupling Level | Characteristics | Analysis Depth |
|---------------|----------------|----------------|
| **Tightly coupled** | Shared containment, shared control rooms | Maximum -- CANDU 4-unit case study |
| **Moderately coupled** | Adjacent containments, shared cooling | Significant |
| **Loosely coupled** | Co-located but separate systems | Standard multi-unit adjustment |
| **Uncoupled** | Independent sites | Single-unit PRA sufficient |

> "It's not about taking the cut sets from unit 1 and unit 2 and simply putting them together. It's about looking for the interactions." -- Mark Wishart, EPRI

---

## 3. Emergency Preparedness in Concurrent Hazards

### Core Principles

- **Emergency preparedness lives in relationships, not binders** -- decades of coordination between Dwayne Arnold Energy Center and Iowa communities meant no public panic when cooling towers collapsed during the 2020 derecho
- **Radiological emergencies never occur in isolation** -- they overlay storms, wildfires, pandemics, infrastructure collapse
- **Fukushima's lesson: evacuation itself can be lethal** -- relocating medically fragile populations may exceed the radiological risk being avoided
- **COVID dose threshold adjustment:** Iowa and Connecticut raised evacuation thresholds for long-term care from 0.01 Sv to 0.5 Sv, balancing radiological vs. infectious disease mortality

### The 3 C's Framework

| Principle | Description |
|-----------|-------------|
| **Coordination** | Structural alignment across agencies and jurisdictions |
| **Communication** | Clear, timely information flow to all stakeholders |
| **Collaboration** | The most important -- active joint planning and response |

> "Emergency preparedness is not something that lives in a binder or a regulation. It lives in relationships." -- Dr. Angela Leak

---

## 4. IoT Multi-Domain Security

### The Challenge: 5-20 Billion Devices

Three words define the IoT security problem: **consumers, ecosystems, and sheep** (herd mentality of vendor lock-in).

- **Static certification conflicts with dynamic IoT** -- consumers expect continuously updated services
- **Vendor lock-in through proprietary security creates polarizations** that exclude participants and reduce innovation
- **Edge devices face unique multi-domain challenges** -- shared memory between CPU, GPU, and communications engines needs hardware-enforced isolation

### Hardware Virtualization for IoT

The prpl Foundation's open-source framework uses hardware virtualization to create isolated secure domains per function:

| Platform | Container Capacity |
|---------|-------------------|
| Microcontrollers (PIC32MZF) | 4-8 containers |
| Application processors | Up to 200+ containers |

Example: Home gateway with separate domains for core connectivity, public Wi-Fi hotspot, and locally deployed services -- all isolated through hardware.

---

## 5. Medical IoT Security

### The CIA Triad Reordered

In medical IoT, the traditional IT security prioritization is reversed:

| Priority | Principle | Rationale |
|----------|-----------|-----------|
| 1 | **Integrity** | If a patient's A-positive blood type is changed to type O, consequences are immediate and potentially fatal |
| 2 | **Availability** | Medical devices must be operational when needed |
| 3 | **Confidentiality** | Privacy matters but is secondary to patient safety |

### Attack Surface

- Devices increasingly both **measure AND actuate** -- sensors read pulse, oxygen; future devices change heart rate, adjust insulin
- Poor device security allows **lateral movement** into hospital networks
- The **Rumsfeld pacemaker anecdote:** when he had his pacemaker implanted, they switched off the Wi-Fi

> "Cyber security awareness in hospitals is actually way behind a number of industry sectors. It's almost a call to arms." -- Caroline Revett, KPMG

---

## 6. Supply Chain = Trust Chain Synthesis

The deepest thread connecting all five sources is the isomorphism between supply chain integrity and trust chain integrity.

### The Pattern Across Domains

| Domain | Trust Chain Problem | Trust Chain Solution |
|--------|--------------------|--------------------|
| **Nuclear supply chain** | 7 valve suppliers from same casting vendor = hidden sole source | Visibility into every tier; ASME QPS on-ramp |
| **Multi-unit risk** | Single-unit PRA assumes cross-tie from sister unit | Multi-unit PRA with correlated hazard modeling |
| **Emergency preparedness** | Decades of relationship-building = trust chain that holds under stress | Continuous maintenance, not certification |
| **IoT multi-domain** | Compromised public hotspot accessing core communications | Hardware-enforced domain isolation |
| **Medical IoT** | Sensor to phone to cloud to hospital to treatment | Integrity verification at every stage |

**The unifying principle:** Trust chain integrity requires continuous verification at every tier, visibility into dependencies below your direct supplier, architectural enforcement where human processes are insufficient, and cultural commitment where technical controls have gaps.

---

## 7. Numbers

| Metric | Value | Context |
|--------|-------|---------|
| Global multi-unit nuclear sites | ~80% of all sites | IAEA |
| US pipe spool fab utilization | ~80% | Bechtel |
| Electrical switchgear lead times | >200 weeks | Bechtel |
| Pump lead times | ~130 weeks | Bechtel |
| ASME certificate holders | ~6,900 worldwide | ASME |
| Doosan reactor vessels | 34 delivered globally | Doosan |
| Doosan steam generators | 124 delivered globally | Doosan |
| IAEA multi-unit PSA experts | 40+ from 13 states | IAEA |
| Fermi America campus | 11 GW planned | 4 AP-1000 + 4 SMRs |
| IoT devices globally | 5-20 billion | IoT Security Foundation |
| COVID evacuation threshold | 0.01 Sv -> 0.5 Sv | Iowa/Connecticut adjustment |
| Hardware containers (MCU) | 4-8 per chip | prpl Foundation |
| Hardware containers (AP) | Up to 200+ | prpl Foundation |
| Craft workers for 2-unit nuclear | ~2,400 avg, 4,000+ peak | Bechtel |

---

## 8. Study Topics

1. **Multi-Unit Probabilistic Risk Assessment** -- IAEA Safety Report 110, EPRI framework, coupling spectrum
2. **Nuclear Supply Chain Graded Qualification** -- ASME QPS vs. NQA-1 vs. ISO 9001 pathways
3. **Hardware Virtualization for IoT Security** -- Domain isolation on SoCs using hardware-enforced containers
4. **Risk-Informed Emergency Preparedness** -- Graded EPZ sizing, dose thresholds, all-hazards integration
5. **Medical Device Integrity as Safety-Critical Design** -- CIA triad reordering, sensor-to-actuator attack chains
6. **Nuclear Safety Culture in Diluted Supply Chains** -- Quality consciousness in nuclear-naive manufacturers
7. **Long-Lead Item Procurement Strategy** -- Phase-zero contracts, owner-at-risk early procurement
8. **Seismic Correlation Modeling for Co-Located Units** -- Partial correlations, inter-unit CCFs
9. **Consumer Trust and IoT Adoption** -- Security demonstrations vs. consumer confidence
10. **Fukushima Lessons for Emergency Response** -- Balancing radiological risk against displacement trauma

---

## 9. DIY Sessions

### Session 1: Supply Chain Trust Mapping (90 min)

Map a multi-tier supply chain for a hypothetical AP-1000 component. Identify single points of failure at each tier. Assign trust levels per ASME QPS criteria. Compute effective redundancy.

**Deliverable:** Tiered supply chain diagram with trust annotations and bottleneck identification.

### Session 2: Multi-Domain Security on Raspberry Pi (120 min)

Using Docker containers as proxy for hardware virtualization, build a multi-domain IoT gateway:
1. Sensor data collection domain
2. Public-facing API domain
3. Actuator control domain

Demonstrate that a compromise in domain 2 cannot access domain 3.

### Session 3: Risk-Informed Decision Table (60 min)

Build a decision matrix for a nuclear emergency overlaying pandemic AND severe weather. Use the Iowa derecho case. Map protective action options against all three hazard types. Identify conflicts and resolution strategies.

---

## 10. Cross-Cluster Connections

### Nuclear to Trust System Governance

| NRC Concept | Trust System Mapping |
|-------------|---------------------|
| ASME QPS graded qualification | Trust levels: untrusted -> verified -> trusted mirrors QPS two-stage audit |
| NQA-1 vs ISO 9001 | Trust boundary enforcement: ISO alone does not grant nuclear trust level |
| Multi-unit PRA coupling | Inter-agent coupling in Gastown convoy model |
| Risk-informed protective action | Adaptive trust thresholds adjusting based on environment |
| Nuclear safety culture | Culture as implicit trust layer that standards cannot capture |

### IoT to MCP Trust Boundaries

| IoT Concept | MCP/Harness Mapping |
|-------------|---------------------|
| Hardware virtualization isolation | MCP server isolation: each tool in own trust domain |
| Static cert vs. dynamic security | Harness integrity as continuous property, not one-time check |
| Medical integrity > confidentiality | Agent correctness more dangerous than intermediate state leaks |
| Consumer trust and adoption | User trust in Claude Code: friction too high = users bypass safeguards |
| Devices as lateral movement vectors | Compromised MCP server as pivot point |

### Regulatory Stack

```
NRC 10 CFR 50 / 10 CFR 52
    |
    +-- Appendix B (Quality Assurance)
    |       +-- NQA-1 (ASME nuclear quality assurance)
    |
    +-- ASME BPVC Section III (nuclear construction)
    |
    +-- SECY-25-0074 (expedited construction guidance)
    +-- NEI 25-05 (long-lead item procurement)
```

---

## 11. Sources

- NRC RIC 2026, T4: "Strengthening the Nuclear Supply Chain" (~91 min)
- NRC RIC 2026, T2: "Multi-Unit Risk: Are We Ready?" (~88 min)
- NRC RIC 2026, T7: "Rolling into the Future of Emergency Preparedness" (~89 min)
- IoT Security Foundation, "Mind the Gaps: Multi-Domain Heterogeneous Solutions" (~23 min)
- IoT Security Foundation, "Security in the Medical Internet of Things" (~18 min)
- IAEA Safety Report 110 (multi-unit PSA, 2023)

---

*Artemis II Research Division -- Nuclear Supply Chain and IoT Security analysis, Session 8. v1.49 PNW Research Series.*
