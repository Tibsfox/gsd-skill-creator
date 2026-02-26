---
title: "Educational Packs Index"
layer: applications
path: "applications/educational-packs.md"
summary: "Complete index of all educational packs produced by GSD skill-creator missions, with status, scope, and cross-references."
cross_references:
  - path: "index.md"
    relationship: "builds-on"
    description: "Referenced from the narrative spine"
  - path: "applications/index.md"
    relationship: "builds-on"
    description: "Part of the applications layer"
  - path: "principles/amiga-principle.md"
    relationship: "parallel"
    description: "Each pack is a specialized component in the ecosystem"
  - path: "principles/progressive-disclosure.md"
    relationship: "parallel"
    description: "Packs follow progressive disclosure in their design"
  - path: "foundations/complex-plane.md"
    relationship: "parallel"
    description: "Each pack occupies a position on the Complex Plane of Experience"
reading_levels:
  glance: "Index of all educational packs — shipped, in progress, and planned — produced by GSD skill-creator missions."
  scan:
    - "Electronics Educational Pack: shipped (v1.29), 15 modules, 77 labs"
    - "Foundational Knowledge Packs: shipped (v1.27), 35 subjects, pre-K through college"
    - "OpenStack Cloud (NASA SE Edition): shipped (v1.33), sysadmin guide, 46 runbooks"
    - "BBS, Amiga Creative Suite, Learn Kung Fu: vision complete, awaiting mission execution"
    - "Minecraft Knowledge World: shipped (v1.22), 30 phases"
created_by_phase: "v1.34-328"
last_verified: "2026-02-25"
---

# Educational Packs Index

Educational packs are domain-specific learning resources produced by GSD skill-creator
missions. Each pack teaches a subject area through hands-on building, following the
ecosystem's design principles: progressive disclosure, the AMIGA Principle of
composable specialized components, and humane flow that supports learners without
pressure or guilt. This index lists every educational pack in the ecosystem, from
shipped productions to vision-stage plans.


## Shipped Packs

These packs are complete and available. Each was produced by a full GSD mission with
planning, execution, and verification phases.


### Electronics Educational Pack

| Field | Detail |
|-------|--------|
| **Milestone** | v1.29 |
| **Status** | Shipped |
| **Scope** | Circuit design, embedded systems, signal processing |
| **Modules** | 15 |
| **Labs** | 77 |
| **Tests** | Part of the 10,707 project test suite |
| **LOC** | Approximately 29,000 |
| **Foundation** | Based on *The Art of Electronics* pedagogical approach |

The Electronics Educational Pack teaches circuit design through building. Learners work
with a Modified Nodal Analysis (MNA) solver that simulates real circuits, logic
simulators for digital design, and a safety warden that enforces safe practices
throughout. The 77 labs progress from basic resistor networks through operational
amplifiers, filters, and digital logic to embedded systems integration.

The pack sits at a position on the [Complex Plane of Experience](foundations/complex-plane.md)
with high real-axis content (formal circuit analysis, Kirchhoff's laws, nodal equations)
and significant imaginary-axis content (designing filters that shape sound, choosing
component values for musical tones). It draws directly on Layer 3 (trigonometry) and
Layer 4 (vector calculus) of the
[eight-layer progression](foundations/eight-layer-progression.md) for AC analysis and
signal processing.


### Foundational Knowledge Packs

| Field | Detail |
|-------|--------|
| **Milestone** | v1.27 |
| **Status** | Shipped |
| **Scope** | 35 subjects spanning pre-K through college |
| **Plans** | 79 |
| **Tests** | Part of the 10,032 test suite at time of shipping |
| **LOC** | Approximately 23,600 |

The Foundational Knowledge Packs provide a broad educational foundation across 35
subject areas. Subjects span the full range of the Complex Plane of Experience, from
primarily analytical (mathematics, logic, computer science) through integrated
(science, engineering, history) to primarily creative (art, music, creative writing).

The pack demonstrates the AMIGA Principle at scale: 35 specialized subject modules,
each focused on its domain, composed through shared infrastructure, consistent
pedagogical patterns, and cross-subject references. No single module tries to teach
everything. The composition of 35 focused modules teaches more effectively than a
single monolithic curriculum could.


### OpenStack Cloud (NASA SE Edition)

| Field | Detail |
|-------|--------|
| **Milestone** | v1.33 |
| **Status** | Shipped |
| **Scope** | Cloud infrastructure, NASA Systems Engineering methodology |
| **Documentation** | 72 pages: sysadmin guide, operations manual, 46 runbooks |
| **Vision** | `gsd-cloud-ops-curriculum-vision.md` |

The OpenStack Cloud pack teaches cloud infrastructure operations through the lens of
NASA Systems Engineering methodology. It includes a complete systems administrator
guide, an operations manual for day-to-day management, a reference library, and 46
runbooks covering specific operational scenarios from deployment to disaster recovery.

This pack was the final mission before v1.34 (the current documentation ecosystem
milestone). The lessons learned from v1.33's execution directly inform the documentation
structure, template extraction, and improvement cycle being built in the current
milestone.

Full documentation is available at
[tibsfox.com/Tibsfox/gsd-skill-creator/docs/specialized-systems/openstack-cloud/](https://tibsfox.com/Tibsfox/gsd-skill-creator/docs/specialized-systems/openstack-cloud/).


### Minecraft Knowledge World

| Field | Detail |
|-------|--------|
| **Milestone** | v1.22 |
| **Status** | Shipped |
| **Scope** | Educational content delivered through Minecraft world design |
| **Phases** | 30 |
| **Plans** | 37 |
| **Commits** | 108 |
| **Requirements** | 73 |

The Minecraft Knowledge World translates educational content into spatial, explorable
experiences within Minecraft. Rather than presenting information as text to read, it
embeds learning in world design that players discover through exploration. This pack
sits high on the imaginary axis of the Complex Plane of Experience, prioritizing
spatial intuition and exploratory learning over linear instruction.


## Vision-Stage Packs

These packs have completed vision documents and are ready for mission execution. Each
vision document defines scope, pedagogy, and success criteria. The packs await
prioritization in a future milestone.


### BBS Educational Pack

| Field | Detail |
|-------|--------|
| **Status** | Vision complete |
| **Vision** | `gsd-bbs-educational-pack-vision.md` |
| **Scope** | Networking, protocols, security, BBS culture |

The BBS Educational Pack teaches networking fundamentals through the lens of bulletin
board system culture and technology. By building and operating a BBS, learners encounter
TCP/IP networking, serial protocols, terminal emulation, file transfer protocols, and
security principles in their original context. The historical framing provides narrative
motivation that pure networking courses often lack.


### Amiga Creative Suite

| Field | Detail |
|-------|--------|
| **Status** | Vision complete |
| **Vision** | `gsd-amiga-creative-suite-vision.md` |
| **Scope** | Computing fundamentals through creative applications |

The Amiga Creative Suite teaches computing fundamentals through the creative
applications that defined the Amiga platform: graphics, audio, animation, and
multimedia. Learners discover hardware architecture (custom chips, bitplanes, DMA)
by building creative tools, following the same discovery path that made the original
Amiga community so technically literate. This pack is a direct expression of the
[AMIGA Principle](principles/amiga-principle.md) — it teaches the principle by
recreating the experience that inspired it.


### Learn Kung Fu Pack

| Field | Detail |
|-------|--------|
| **Status** | Vision complete |
| **Vision** | `gsd-learn-kung-fu-pack-vision.md` |
| **Scope** | Martial arts, mindfulness, discipline, physical practice |

The Learn Kung Fu Pack extends the ecosystem beyond technical subjects into physical
practice and mindfulness. It teaches martial arts principles (structure, breath,
movement patterns) alongside the discipline and focus that carry over into all forms
of practice. This pack sits furthest along the imaginary axis of any planned pack,
emphasizing embodied knowledge and intuitive response. The teaching reference document
(`gsd-learn-kung-fu-teaching-reference.md`) provides the pedagogical framework.


## Pack Landscape

The following table summarizes all educational packs with their position on the
Complex Plane of Experience and their relationship to the eight-layer mathematical
progression.

| Pack | Status | Real Axis | Imaginary Axis | Math Layers |
|------|--------|-----------|----------------|-------------|
| Electronics | Shipped (v1.29) | High | Moderate | 1, 2, 3, 4 |
| Foundational Knowledge | Shipped (v1.27) | Full range | Full range | All |
| OpenStack Cloud | Shipped (v1.33) | High | Low | 5, 7 |
| Minecraft Knowledge World | Shipped (v1.22) | Moderate | High | Varies |
| BBS Educational | Vision | High | Moderate | 7 |
| Amiga Creative Suite | Vision | Moderate | High | 1, 3, 8 |
| Learn Kung Fu | Vision | Low | High | 1 |

This distribution is intentional. The ecosystem covers the full Complex Plane of
Experience, with shipped packs anchoring the high real-axis region (electronics, cloud
operations) and vision-stage packs extending into the high imaginary-axis region
(creative computing, physical practice). As packs are built, the ecosystem becomes a
more complete map of human capability.


## How Packs Connect

Each educational pack is a specialized component in the ecosystem. The
[AMIGA Principle](principles/amiga-principle.md) explains why they are separate
rather than merged into a single curriculum: specialized components composed through
shared patterns produce better results than monolithic alternatives.

The shared patterns include: [progressive disclosure](principles/progressive-disclosure.md)
at every level (each pack supports glance, scan, and read engagement),
[humane flow](principles/humane-flow.md) in all learner interactions (no guilt, no
pressure, no streak mechanics), and consistent pedagogical structure (learn by building,
proof before assertion, concepts introduced only when prerequisites are established).

Packs that share mathematical foundations cross-reference each other. The Electronics
Educational Pack and the Foundational Knowledge Packs both teach trigonometry, but from
different angles: electronics teaches it through AC circuit analysis while foundational
knowledge teaches it as a mathematical subject. A learner who encounters trigonometry
in one pack can deepen their understanding in the other.


## Go Deeper

For the design philosophy that shapes all educational packs:
[The AMIGA Principle](principles/amiga-principle.md).

For the mathematical foundations that packs draw on:
[Eight-Layer Progression](foundations/eight-layer-progression.md).

For the framework that produces these packs:
[Agentic Programming](principles/agentic-programming.md) and the
[Skills-and-Agents report](https://tibsfox.com/Skills-and-Agents/).
