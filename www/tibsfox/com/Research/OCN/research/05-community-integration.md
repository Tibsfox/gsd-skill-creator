# Community Integration and the Art Program

> **Domain:** Community Systems & Social Design
> **Module:** 5 -- Open Compute Node: Compute Allocation, Community Services, and the Mural Art Program
> **Through-line:** *The mural is designed by local schoolchildren before the container leaves the factory — which means the community is already invested before the first computation runs. The art program is not a feature added to the infrastructure. It is the infrastructure's introduction to the people it will serve.*

---

## Table of Contents

1. [The Community Return Model](#1-the-community-return-model)
2. [Community Compute Allocation Architecture](#2-community-compute-allocation-architecture)
3. [Network Isolation and Privacy](#3-network-isolation-and-privacy)
4. [Service Offerings](#4-service-offerings)
5. [Community Governance](#5-community-governance)
6. [Clean Water Distribution](#6-clean-water-distribution)
7. [The Mural Art Program](#7-the-mural-art-program)
8. [Technical Paint Specifications](#8-technical-paint-specifications)
9. [The Community Partner Relationship](#9-the-community-partner-relationship)
10. [Maintenance and Operations](#10-maintenance-and-operations)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Community Return Model

The Open Compute Node does not extract from the communities it occupies. It gives back in four specific, measurable ways:

| Return | What It Provides | Recipient |
|--------|-----------------|-----------|
| **Clean water** | Continuous potable water output (EPA 40 CFR 141 compliant) | Community at large (library, school, municipal) |
| **Free compute** | Minimum 10% of total capacity, 24/7, no charge | Library, school, or municipal partner |
| **Community art** | Container exterior designed by local schoolchildren | Permanent visual marker; community pride |
| **Clean energy surplus** | Excess solar generation during low-compute periods | Local grid (where interconnection is feasible) |

The model is intentional: these are not charitable add-ons to a data center. They are design requirements built into the system from the start. A node that doesn't give back is a failed deployment.

---

## 2. Community Compute Allocation Architecture

### 2.1 Capacity Reservation

| Parameter | Specification |
|-----------|---------------|
| Minimum reservation | 10% of total compute capacity |
| Enforcement | Architecturally enforced (hardware resource allocation, not policy-only) |
| Availability | 24/7, same uptime SLA as primary compute operations |
| Reference capacity | ~72 PFLOPS FP4 inference (10% of 720 PFLOPS per NVL72 rack) |
| Reduction conditions | Community allocation is NEVER reduced below 10% for commercial workloads |

**Architectural enforcement:** The 10% community allocation is implemented as a dedicated virtual GPU (vGPU) resource pool, not a soft scheduling priority. Commercial workloads cannot access community-allocated resources regardless of commercial demand. The allocation is a hard partition in the hardware scheduler.

### 2.2 Access Architecture

```
Community Partner Building ←── Fiber or Point-to-Point Wireless ──→ Container

   Library terminals (thin client)    ┐
   School computer lab (net access)   ├── Community VLAN (isolated)
   Municipal office (research access) ┘
   Public WiFi (rate-limited)         ─── Rate-limited segment
```

Community access arrives on a dedicated VLAN (VLAN 30) that has no routing path to the primary compute infrastructure (VLAN 20). This is not a firewall configuration — it is a physical network architecture. The community cannot reach the compute workloads regardless of any software misconfiguration.

---

## 3. Network Isolation and Privacy

Community users interact only with the community-allocated compute segment. The following guarantees apply:

| Guarantee | Implementation |
|-----------|---------------|
| No access to primary compute | VLAN isolation with default-deny inter-VLAN routing |
| No user identification | No login required for standard community access |
| No individual tracking | System logs aggregate usage only (no per-session, no per-user) |
| No data collection | Community workloads run on isolated resources; no telemetry to external parties |
| Anonymous usage reporting | Only aggregate metrics (total hours, categories of use) reported to advisory board |

**Privacy principle:** The community compute allocation operates like a public library — the infrastructure is available, no identification is required, and no record is kept of who used it or what they accessed.

---

## 4. Service Offerings

The community allocation is general-purpose compute. The community advisory board determines which services to offer. Examples:

| Service | Use Case | Technical Implementation |
|---------|----------|-------------------------|
| AI inference API | Local models for education, translation, accessibility | REST API on community VLAN |
| General-purpose compute | Science projects, student data analysis, research | Batch job submission portal |
| Web hosting | Community websites, local government | Web server on community VLAN |
| Educational platform | LMS hosting, digital library systems | Application hosting |
| Video transcoding | Archiving local history recordings | GPU-accelerated processing jobs |
| Climate/agriculture data | Local weather models, crop planning tools | Scientific computing workloads |

The community advisory board selects services based on local needs. A rural New Mexico town near an agricultural irrigation district will have different priorities than a small Arizona town with a tribal college. The system accommodates both.

---

## 5. Community Governance

### 5.1 Advisory Board Structure

| Role | Description |
|------|-------------|
| Library representative | Manages library terminal access and usage |
| School district representative | Coordinates educational applications and student access |
| Municipal representative | Represents city/county government access needs |
| Community member (at-large) | Non-institutional community voice; elected annually |
| Node operator liaison | Technical contact; provides usage reports; no voting authority |

**Governance principles:**
- Community advisory board selects service priorities, not the node operator
- No commercial use of community allocation — community time is community time
- Equal capacity sharing among partner institutions (library, school, municipal)
- Annual review of service offerings and usage patterns

### 5.2 Usage Dashboard

- Web-based dashboard, accessible to all advisory board members
- Displays: total community compute hours, service category breakdown, water output volume
- Data is anonymous and aggregate — no individual user data ever displayed
- Available at the community partner location and remotely via browser
- Updated in real time; 12-month history retained

---

## 6. Clean Water Distribution

### 6.1 Output Specification

Water leaving the container's output port meets EPA 40 CFR Part 141 (National Primary Drinking Water Regulations):

| Parameter | EPA Limit | OCN Target |
|-----------|-----------|-----------|
| Total coliform | Zero (public systems) | Zero (UV + RO) |
| pH | 6.5-8.5 | 7.0-7.5 (post mineral rebalancing) |
| Total dissolved solids | No federal limit (500 mg/L advisory) | <100 mg/L (post-RO) |
| Lead | 15 ppb action level | <1 ppb (post-RO membrane) |
| Nitrates | 10 mg/L | Dependent on input; RO reduces significantly |
| Turbidity | 1 NTU (combined filter effluent) | <0.1 NTU (post-RO) |

### 6.2 Community Water Distribution

The node operator pipes potable water to the nearest community partner building (library, school, or municipal building) or to a public distribution point (spigot, fill station). The community partner determines the final distribution method.

**Flow rate:** 5-20 GPM output (7,200-28,800 gallons/day) — adequate for a small community drinking water supplement or emergency supply.

**Automated quality monitoring:** If any sensor reading (TDS, pH, UV transmittance) falls outside acceptable range, the output valve closes automatically and an alert is sent. No degraded water reaches the distribution point. The system fails safely.

---

## 7. The Mural Art Program

### 7.1 The Canvas

The container offers approximately 96m² of exterior wall surface on the two long sides — the largest permanent public art surface in many small towns. This canvas is treated as a community gift, not a branding opportunity.

| Surface | Dimensions | Use |
|---------|-----------|-----|
| South long wall | ~12m × 2.5m ≈ 30 m² | Primary mural canvas |
| North long wall | ~12m × 2.5m ≈ 30 m² | Secondary canvas |
| East end wall | ~2.4m × 2.5m ≈ 6 m² | Partial (avoid penetration areas) |
| West end wall | ~2.4m × 2.5m ≈ 6 m² | Partial (door and conduit areas excluded) |
| Roof | N/A | Solar panels and equipment; excluded from canvas |

### 7.2 Design Process

| Step | Activity | Duration |
|------|----------|---------|
| 1 | Community announcement via partner institutions | Week 1 |
| 2 | Open call for designs (schools, local artists, community groups) | Weeks 2-4 |
| 3 | Public exhibition of finalist designs at partner institution | Week 5 |
| 4 | Community vote (open to all community members, any age) | Week 6 |
| 5 | Selected design professionally digitized and scaled to container dimensions | Weeks 7-8 |
| 6 | Professional mural painting at manufacturing facility | During final factory phase |
| 7 | UV-protective clear coat applied | At factory |
| 8 | Artist attribution plaque mounted near design (before container ships) | At factory |

**Key principle:** The mural is painted at the factory, not on-site. The community sees the completed art when the container arrives — which means the community's design is already on the container when it first drives through town. The container arrives already belonging to the community.

### 7.3 Design Guidelines

| Guideline | Rationale |
|-----------|-----------|
| Celebrate local culture, landscape, science, or art | The design should be specific to the community — not generic |
| No political or religious content | Community consensus must be achievable for all residents |
| No corporate logos or advertising | The container is community infrastructure, not commercial signage |
| Include education/knowledge themes where natural | Consistent with the node's educational mission |
| Artist retains copyright | The community's artist retains their intellectual property |
| Artist grants perpetual display license | Allows display for the life of the container |
| Attribution plaque on container | The artist's name is permanently associated with the installation |

---

## 8. Technical Paint Specifications

Paint must survive Southwest outdoor conditions: UV intensity, temperature cycling, dust, and occasional precipitation for 7-10 years without significant degradation.

| Layer | Material | Purpose |
|-------|----------|---------|
| Surface preparation | Sandblasting to white metal (SSPC-SP 5) | Remove mill scale, rust, old coatings |
| Primer | 2-part marine epoxy primer, 3-4 mils DFT | Corrosion protection; adhesion base |
| White base coat | Exterior-grade polyurethane, 2 mils DFT | Consistent background for artwork |
| Art layer | Marine enamel or exterior acrylic, per design | Artwork reproduction |
| Clear coat | 2K polyurethane with UV stabilizer, 3-4 mils DFT | UV and weathering protection |
| **Expected durability** | 7-10 years in Southwest conditions | Aligned with major hardware upgrade cycle (5-7 years) |

**Color gamut:** Marine enamel systems support wide color gamut. Community designs should be provided as high-resolution vector files or 300+ DPI raster files to ensure accurate reproduction at container scale.

---

## 9. The Community Partner Relationship

### 9.1 Formalization

Before deployment, the node operator and the community partner (library, school district, or municipality) execute a Memorandum of Understanding (MOU) covering:

- Duration of service (minimum 5 years recommended)
- Community compute capacity allocation (minimum 10%, may be higher)
- Water distribution responsibility (who maintains the distribution point)
- Advisory board structure and meeting schedule
- Maintenance access rights (monthly visit, 24-hour notice standard)
- Cost to community: zero. No fees for compute, water, or art program.

### 9.2 What the Community Partner Provides

| Contribution | Description |
|-------------|-------------|
| Land access (for deployment) | Access to adjacent land for solar array (typically 2-3 acres) |
| Site liaison | Local contact for maintenance coordination |
| Community engagement | Facilitation of mural design process and advisory board |
| Monthly waste drum swap | Optional: community may provide logistics for drum exchange |

The community partner provides access and engagement. The node operator provides capital, equipment, and operations. The community receives compute, water, and art.

---

## 10. Maintenance and Operations

### 10.1 Monthly Maintenance Visit

| Task | Duration |
|------|---------|
| Waste drum swap | 30 minutes |
| Filter inspection (Stage 1 replacement if needed) | 30 minutes |
| Water quality test (on-site verification) | 15 minutes |
| Visual inspection (all systems) | 30 minutes |
| Security camera and access log review | 15 minutes |
| **Total monthly visit** | **~2 hours** |

### 10.2 Annual Maintenance

| Task | Interval |
|------|---------|
| Carbon filter replacement (Stage 2) | 6 months |
| Mineral rebalancing bed replacement (Stage 5) | 6 months |
| UV lamp replacement (Stage 4) | 12 months |
| Cooling loop coolant analysis and top-off | 12 months |
| RO membrane inspection | 24-36 months |
| Complete electrical inspection | 24 months |

### 10.3 Hardware Lifecycle

- GPU rack upgrade cycle: 5-7 years (aligns with mural refresh)
- Container structural: designed for 20+ year service life
- Filtration system: modular replacement of individual stages
- Solar panels: 25-year warranty typical; progressive efficiency degradation

---

## 11. Cross-References

| Project | Connection |
|---------|------------|
| [OCN Module 01](01-vision-architecture.md) | Vision that establishes the community return as a design requirement |
| [OCN Module 04](04-container-power-cooling.md) | Network architecture and water output system that enable community services |
| [OCN Module 03](03-deployment-logistics.md) | Site selection process that identifies and formalizes community partnerships |
| [NND](../NND/index.html) | New New Deal: the community compute program as economic development and digital equity infrastructure |
| [SYS](../SYS/index.html) | Systems administration for the community compute services and monitoring dashboard |
| [BRC](../BRC/index.html) | Community gift economy — the free compute model echoes Burning Man's gifting principle |
| [FFA](../FFA/index.html) | Community art program parallels the creative community gallery model |
| [ACC](../ACC/index.html) | MOU and community partnership formalization involves contract and compliance considerations |

---

## 12. Sources

1. EPA 40 CFR Part 141 — National Primary Drinking Water Regulations
2. EPA Office of Groundwater and Drinking Water — Public water system technology
3. NVIDIA Corporation — GB200 NVL72 virtual GPU (vGPU) specifications
4. American Library Association — Digital equity in rural library services
5. USDA Rural Development — Rural broadband and digital equity programs
6. Institute of Museum and Library Services — Community technology access programs
7. SBA (Small Business Administration) — Rural community economic development resources
8. DOE Grid Modernization — Community solar and distributed energy programs

> **PROFESSIONAL ENGINEER REVIEW REQUIRED**
> This specification is a conceptual design produced by AI-assisted engineering analysis. Water treatment systems described in this module must be reviewed and certified by the applicable state drinking water program before community distribution. All electrical and plumbing installations must be verified by licensed professionals.
