# From Rooftop Unit to Industrial Furnace

> **Domain:** Commercial & Industrial Scale
> **Module:** 3 -- Commercial Buildings, Industrial Process Heat, and Data Centers
> **Through-line:** *A heat pump rooftop unit replacing a gas-fired RTU achieves over 40% combined heating and cooling energy savings with customer payback under 2 years. That is not a future projection. That is current, measured performance.*

---

## Table of Contents

1. [Commercial Building Electrification](#1-commercial-building-electrification)
2. [Building Automation and Grid Integration](#2-building-automation-and-grid-integration)
3. [Industrial Heat Pumps](#3-industrial-heat-pumps)
4. [Data Center Waste Heat Recovery](#4-data-center-waste-heat-recovery)
5. [The Electrification Phasing Strategy](#5-the-electrification-phasing-strategy)
6. [Cross-References](#6-cross-references)
7. [Sources](#7-sources)

---

## 1. Commercial Building Electrification

U.S. commercial buildings account for 16% of national greenhouse gas emissions. NREL/DOE research found that heat pump rooftop units (HP-RTUs) replacing gas-fired RTUs achieved over 40% combined heating and cooling energy savings with customer payback under 2 years [1][2].

### 1.1 Cold-Climate Commercial Performance

Cold-climate commercial heat pump RTUs with electric resistance backup delivered supply air temperatures above 38C (100F), meeting comfort requirements across climate zones tested. The performance data eliminates the common objection that heat pumps cannot maintain comfort in commercial buildings during cold weather [1].

### 1.2 Technology Options by Building Size

| Building Type | Primary Technology | Key Consideration |
|--------------|-------------------|-------------------|
| Small business (<500m2) | HP-RTU, ductless mini-split | Part-time occupancy; demand-controlled ventilation |
| Mid-size office (500-5000m2) | VAV with electric reheat, chilled beams | BACnet/BAS integration; zone control |
| Large campus | District ground-source HP fields | Central plant vs. distributed; waste heat exchange |
| Skyscrapers | Double-skin facades, ice storage | Curtain wall performance; peak load management |

---

## 2. Building Automation and Grid Integration

Building automation systems (BACnet, LON, Modbus) are essential for managing the increased electrical load from electrification [2]:

- **Demand-controlled ventilation** -- CO2 sensors modulate fresh air based on occupancy
- **Optimal start/stop** -- Machine learning predicts thermal mass behavior, pre-conditioning before occupancy
- **Economizer control** -- Free cooling when outdoor conditions permit
- **Demand response** -- Load shedding and shifting in response to grid signals
- **Time-of-use optimization** -- Thermal storage charged during off-peak rates

These systems transform the building from a passive energy consumer into an active grid participant.

---

## 3. Industrial Heat Pumps

The IEA World Energy Outlook 2025 identifies industrial heat pumps as a crucial enabler of industrial decarbonization [3].

### 3.1 The Temperature Ladder

| Temperature Range | Technology | Applications | Status |
|------------------|-----------|--------------|--------|
| Below 100C | Standard industrial heat pumps | Food processing, drying, pasteurization | Commercial |
| 100-200C | High-temperature HP (CO2 transcritical, cascade) | Chemicals, textiles, pulp/paper | Emerging commercial |
| 200-500C | Electric arc, induction, microwave/RF | Steel, metals, ceramics | Industrial scale |
| Above 500C | Electric arc furnaces, plasma | Heavy industry, cement | Established (steel) |

### 3.2 Market Trajectory

The share of electricity in global industrial heat consumption is projected to rise from 4% (2024) to 12% (2030), driven primarily by non-energy-intensive industries adopting heat pumps for process heat below 200C [3].

### 3.3 Key Metric

Industrial heat pumps provide process heat using one-third to one-fifth of the energy required by conventional boilers. At a COP of 3-5, each unit of electricity produces 3-5 units of thermal energy, versus 0.85-0.95 units from a gas boiler (accounting for flue losses).

---

## 4. Data Center Waste Heat Recovery

Modern data centers reject enormous quantities of low-grade waste heat (typically 30-50C supply water). This waste heat is a resource, not a problem [4]:

### 4.1 District Heating Integration

Scandinavian countries already capture data center waste heat via heat pumps to serve residential and commercial buildings. This is a direct implementation of the gradient interception model: computation's thermal exhaust becomes a community heating source.

### 4.2 The Economics

A data center that pays to reject heat through cooling towers can instead sell that heat to a district heating network. The data center's cooling cost drops. The district heating network's fuel cost drops. Both sides benefit because the gradient was already there -- the heat pump merely intercepts it.

---

## 5. The Electrification Phasing Strategy

RMI research found that climate-appropriate technology bundles are essential [5]:

### 5.1 Recommended Phasing

| Phase | Target | Technology | Payback |
|-------|--------|-----------|---------|
| 1 | End-of-life RTUs | Heat pump RTUs | <2 years |
| 2 | Domestic hot water | Heat pump water heaters | 2-4 years |
| 3 | Space heating boilers | Hydronic heat pumps | 5-8 years |
| 4 | Process loads | Industrial heat pumps | Variable |

### 5.2 Climate-Appropriate Bundles

| Climate | Bundle |
|---------|--------|
| Cold (Washington DC, Chicago) | Energy-recovery ventilation + HP-RTU + enhanced envelope |
| Moderate (Seattle) | Fully electric HP-RTU + standard envelope |
| Hot/sunny (Las Vegas) | Solar arrays powering heat pumps + PDRC integration |

### 5.3 Infrastructure Planning

At each phase: assess electrical infrastructure and upgrade transformers, switchgear, and distribution as needed. The electrical panel upgrade from 200A to 400A service is often the single largest barrier to commercial electrification.

---

## 6. Cross-References

| Project | Connection |
|---------|------------|
| [BCM](../BCM/index.html) | Building construction; commercial envelope performance; structural thermal design |
| [SHE](../SHE/index.html) | Building automation systems; sensor networks; smart controls |
| [THE](../THE/index.html) | Thermal energy transfer; heat exchanger design |
| [SYS](../SYS/index.html) | Systems administration; data center thermal management; infrastructure |

---

## 7. Sources

1. NREL/DOE, "Overview of Building Electrification," NREL/TP-5500-88309.
2. BOMA International, "Electrification in Commercial Buildings," 2023.
3. IEA, "World Energy Outlook 2025," industrial heat pump analysis.
4. Building Decarbonization Coalition, "Electrification of Commercial and Residential Buildings."
5. RMI, "Climate-Appropriate Electrification Bundles," commercial building analysis.
