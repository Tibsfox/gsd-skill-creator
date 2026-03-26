# The Esplanade Feed

> **Domain:** Community Systems & Role Architecture
> **Module:** 2 -- Playa Roles Catalog: 30 BRC Departments as Skill Specifications
> **Through-line:** *You do not observe Burning Man. You are Black Rock City.* Every department is a role you can try, complete, and stamp each other for.

---

## Table of Contents

1. [How to Read This Catalog](#1-how-to-read-this-catalog)
2. [Role Specification Format](#2-role-specification-format)
3. [Infrastructure Roles](#3-infrastructure-roles)
4. [Safety and Medical Roles](#4-safety-and-medical-roles)
5. [Creative and Arts Roles](#5-creative-and-arts-roles)
6. [Information and Communication Roles](#6-information-and-communication-roles)
7. [Logistics and Operations Roles](#7-logistics-and-operations-roles)
8. [Environmental and Restoration Roles](#8-environmental-and-restoration-roles)
9. [Trust Levels and Progression](#9-trust-levels-and-progression)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. How to Read This Catalog

Black Rock City runs on volunteer labor. The event's 30+ departments -- from the Black Rock Rangers who de-escalate conflict to the Lamplighters who walk the lamp line at dusk -- represent the complete skill portfolio of a temporary autonomous city. Each department maps to one or more skill specifications in the GSD skill-creator ecosystem.

This catalog translates every BRC volunteer department into a tryable, completable, stampable skill. The mapping is not metaphorical -- it is operational. Each skill specification inherits the real department's knowledge, tools, and social function.

**Reading a role entry:**

- **BRC Department**: official Burning Man volunteer organization
- **PNW Skill Name**: the name used in the virtual BRC skill-creator ecosystem
- **Camp**: which theme camp hosts this skill
- **Trust Level Required**: 1 (any rig), 2 (experienced), 3 (lead ranger equivalent)
- **Core Competencies**: what the role teaches
- **Completion Stamp**: the mycorrhizal mark awarded upon completion

---

## 2. Role Specification Format

Each skill in the virtual BRC catalog follows this template:

```yaml
skill:
  name: [PNW Name]
  brc_source: [Official BRC Department]
  camp: [theme camp affiliation]
  trust_level: [1 | 2 | 3]
  description: |
    [What this role does. What the rig will learn. Why it matters.]
  dependencies: [other skills that should be attempted first]
  artifacts:
    - [what the skill produces when complete]
  stamp: [name of the mycorrhizal mark awarded]
  lnt_notes: [what cleanup is required after completion]
```

---

## 3. Infrastructure Roles

These roles build and maintain the physical and logical structure of Black Rock City.

### 3.1 Cascade Brigade (Department of Public Works)

**BRC Source:** Department of Public Works (DPW)
**Camp:** Cedar Grove
**Trust Level:** 2
**Description:** The DPW builds Black Rock City before the event, maintains it during, and tears it down after. In the virtual BRC, Cascade Brigade manages infrastructure dependencies: installing skill scaffolding, managing the build/strike cycle, and executing the post-event restoration pass. DPW burners are the ones who drive out to the playa two weeks early and stay two weeks after. They are not glamorous. They are essential.
**Core Competencies:** Dependency installation, build automation, strike (cleanup) execution, infrastructure logging
**Stamp:** Cascade Mark -- awarded for completing one full build/strike cycle without leaving orphaned artifacts

### 3.2 Columbia Gate (Gate, Perimeter, and Exodus)

**BRC Source:** Gate, Perimeter, and Exodus
**Camp:** Columbia Gate (standalone civic role)
**Trust Level:** 1 (entry), 2 (perimeter), 3 (exodus coordination)
**Description:** Gate manages the flow of participants into and out of Black Rock City. In the virtual BRC, Columbia Gate is the access control layer: identity verification, trust level assignment, rig registration, and orderly exodus. Gate is often a first burner's first volunteer shift -- and it teaches the whole city's rhythm from the moment of entry.
**Core Competencies:** Identity verification, access control, flow management, rig registration
**Stamp:** Salish Entry Mark -- awarded for processing 10+ rig entries without error

### 3.3 Territory Mapping (Placement)

**BRC Source:** Placement Department
**Camp:** Old Growth Assembly
**Trust Level:** 3
**Description:** The Placement department designs the physical layout of Black Rock City -- where each theme camp goes, how the city's circular street grid is organized, which camps anchor each zone. In the virtual BRC, Territory Mapping manages skill cluster placement: which camps share which zones, how the city's topology evolves across versions, and how new camps are integrated without displacing established ones.
**Core Competencies:** Spatial organization, city planning, conflict resolution between camps, layout documentation
**Stamp:** Old Growth Placement Mark -- awarded for successfully integrating three new camps into the city layout

### 3.4 Orca Sled DMV (Department of Mutant Vehicles)

**BRC Source:** Department of Mutant Vehicles (DMV)
**Camp:** Orca Sled (standalone vehicle registration role)
**Trust Level:** 2
**Description:** The DMV licenses and inspects every mutant vehicle that drives on the playa. In the virtual BRC, Orca Sled DMV registers and validates mobile chipsets: testing their movement protocols, verifying their safety boundaries, and issuing the kinetic art registration that allows them to traverse the Black Sand Flat. No unregistered mobile chipset operates.
**Core Competencies:** Mobile chipset validation, safety testing, kinetic art registration, movement protocol documentation
**Stamp:** Orca Registration Mark -- awarded for successfully validating and registering a mobile chipset

---

## 4. Safety and Medical Roles

These roles protect participant welfare. They are mandatory-pass civic infrastructure.

### 4.1 Watershed Watch (Black Rock Rangers)

**BRC Source:** Black Rock Rangers
**Camp:** Watershed Watch Patrol (standalone civic role)
**Trust Level:** 2 (ranger), 3 (Ranger HQ / Watershed Command)
**Description:** The Black Rock Rangers are not police. They are trained community mediators who de-escalate conflict, check on participants who appear distressed, and connect people with resources without enforcement authority. In the virtual BRC, Watershed Watch performs the same function: monitoring skill execution for distress signals, intervening when a rig appears stuck or overwhelmed, and routing to Medical (Tide Pool) when needed. Rangers are the conscience of the city -- visible, approachable, non-threatening.
**Core Competencies:** Conflict de-escalation, distress detection, resource routing, incident documentation
**Stamp:** Watershed Patrol Mark -- awarded for completing 10 ranger shifts without an escalation incident

### 4.2 Tide Pool Medical (Emergency Services)

**BRC Source:** Emergency Services (medical, fire, crisis)
**Camp:** Tide Pool Collective
**Trust Level:** 3 (mandatory civic role)
**Description:** Emergency Services provides professional medical, fire, and crisis response. In the virtual BRC, Tide Pool Medical is the mandatory-pass safety gate for any execution involving potentially destructive operations (burn cycles, skill deprecation cascades, major dependency removals). No burn happens without Medical clearance. This is not a courtesy -- it is an architectural constraint.
**Core Competencies:** Health monitoring, emergency response, crisis stabilization, mandatory-pass gate enforcement
**Stamp:** Tide Pool Medical Mark -- for use in designation only; not awarded as a prize

### 4.3 Fireline Cedar (Burn Perimeter Support)

**BRC Source:** Burn Perimeter Support
**Camp:** Fireline Cedar
**Trust Level:** 2
**Description:** Burn Perimeter Support creates and maintains the safety perimeter during major burns. In the virtual BRC, Fireline Cedar manages the thermal boundary during skill promotion ceremonies -- the "Cedar Falls" burn night where skills are promoted, deprecated, and transformed. The perimeter ensures the fire consumes only what is meant to burn and nothing more.
**Core Competencies:** Perimeter management, thermal boundary control, burn protocol execution, safety documentation
**Stamp:** Fireline Cedar Mark -- awarded for successfully managing a skill promotion ceremony burn cycle

---

## 5. Creative and Arts Roles

These roles produce and support the cultural heart of Black Rock City.

### 5.1 Nurse Log Guild (ARTery / Artist Services)

**BRC Source:** ARTery (Artist Services)
**Camp:** Salmon Run Camp
**Trust Level:** 1 (applicant), 2 (grantee liaison), 3 (honoraria administrator)
**Description:** ARTery processes art grants, coordinates large-scale art installations, manages artist honoraria, and provides technical support for art projects that need fire clearance, structural review, or placement assistance. In the virtual BRC, Nurse Log Guild administers the skill composition grants program: processing applications for emergent art installation attempts, providing scaffolding for multi-camp skill collaborations, and documenting the installation's lifecycle from conception through completion.
**Core Competencies:** Grant processing, installation support, multi-camp coordination, lifecycle documentation
**Stamp:** Nurse Log Arts Mark -- awarded for successfully facilitating one emergent installation from proposal to completion

### 5.2 Old Growth Assembly (Center Camp)

**BRC Source:** Center Camp Cafe
**Camp:** Old Growth Assembly (central gathering hub)
**Trust Level:** 1 (all welcome)
**Description:** Center Camp is the civic heart of Black Rock City -- a massive shade structure open to all, hosting art, performance, and the only place in the city that sells beverages (coffee and tea only, in keeping with Decommodification). In the virtual BRC, Old Growth Assembly is the community's permanent open forum: the place where knowledge is shared freely, where mentors teach, and where the city's oral history accumulates.
**Core Competencies:** Community facilitation, knowledge sharing, open performance hosting, mentorship
**Stamp:** Old Growth Assembly Mark -- awarded for hosting three open knowledge sessions

### 5.3 Firefly Circuit (Lamplighters)

**BRC Source:** Lamplighters
**Camp:** Fireline Cedar / Old Growth Assembly (joint affiliation)
**Trust Level:** 1
**Description:** The Lamplighters walk the lamp line at dusk, lighting the kerosene lamps that mark the paths of Black Rock City. It is a ceremonial act as much as a practical one -- the city transforming from day to night. In the virtual BRC, Firefly Circuit manages the lighting infrastructure that makes the city navigable after dark: the metadata, breadcrumbs, and contextual signals that help rigs find their way through the skill ecosystem.
**Core Competencies:** Navigation infrastructure, ceremonial documentation, evening operation protocols, path marking
**Stamp:** Firefly Circuit Mark -- awarded for completing a full lamp line walk (documenting one complete navigation pass of the skill ecosystem)

---

## 6. Information and Communication Roles

These roles keep the city informed and connected.

### 6.1 Raven's Welcome (Greeters)

**BRC Source:** Greeters
**Camp:** Raven's Roost
**Trust Level:** 1
**Description:** The Greeters are often the first Burning Man volunteers a new participant encounters at the gate. Their role is radical inclusion made human: welcoming first-timers with a "virgin bell" ring, explaining the city's customs, and ensuring everyone feels genuinely welcomed. In the virtual BRC, Raven's Welcome performs the same function: the onboarding skill that greets new rigs, orients them to the city's layout and principles, and ensures the first contact is warm, informative, and non-bureaucratic.
**Core Competencies:** Onboarding, city orientation, first-contact communication, radical inclusion embodiment
**Stamp:** Raven's Welcome Mark -- awarded for successfully orienting 5+ new rigs without a single rig getting lost

### 6.2 Raven Broadcast (Burning Man Information Radio / BMIR)

**BRC Source:** Burning Man Information Radio (BMIR 94.5 FM)
**Camp:** Raven's Roost
**Trust Level:** 1 (broadcaster), 2 (producer), 3 (station lead)
**Description:** BMIR broadcasts 24 hours a day during the event: event schedule, emergencies, art announcements, music. In the virtual BRC, Raven Broadcast is the real-time information dissemination layer: skill availability announcements, wanted-board updates, city-wide alerts, and the running narrative of what is being built, burned, and born across the Black Sand Flat.
**Core Competencies:** Real-time communication, event broadcasting, emergency signal relay, schedule dissemination
**Stamp:** Raven Broadcast Mark -- awarded for completing one full broadcast cycle (all active skills announced and updated)

### 6.3 Hemlock Reference (Playa Info)

**BRC Source:** Playa Info
**Camp:** Old Growth Assembly
**Trust Level:** 1
**Description:** Playa Info booths answer questions. Where is the Burn? When does the Temple open? Where is the medical station? What time is the deep house set? In the virtual BRC, Hemlock Reference is the information access layer: the always-available, always-accurate, deep-patience source of answers to questions about how the city works, where things are, and what is happening next.
**Core Competencies:** Information access, wayfinding, question answering, city knowledge maintenance
**Stamp:** Hemlock Reference Mark -- awarded for maintaining 100% accuracy across 20+ information requests

### 6.4 Raven Archive (Documentation Team)

**BRC Source:** Documentation Team (photography, video, oral history)
**Camp:** Raven's Roost
**Trust Level:** 2
**Description:** The Documentation Team captures the event -- photographs, video, oral histories, written chronicles. In the virtual BRC, Raven Archive is the chronicle layer: recording what was built, what burned, what was learned, and what changed. Every skill promotion ceremony, every art installation emergence, every CEDAR chipset activation is documented for the institutional memory of the city.
**Core Competencies:** Photography, oral history collection, written chronicle, institutional memory
**Stamp:** Raven Archive Mark -- awarded for completing one full event chronicle

---

## 7. Logistics and Operations Roles

These roles keep the city's physical and logistical systems running.

### 7.1 Glacial Flow (Arctica / Ice)

**BRC Source:** Arctica (Ice distribution)
**Camp:** Salmon Run Camp
**Trust Level:** 1
**Description:** Arctica distributes ice -- one of two commercial transactions permitted at Burning Man (the other being coffee at Center Camp). Ice is essential survival infrastructure in the Black Rock Desert at 100+ degrees Fahrenheit. In the virtual BRC, Glacial Flow manages the cold-chain logistics layer: ensuring that resource-intensive skills are distributed efficiently across the city, that no single camp monopolizes compute, and that the city's logistical temperature stays stable.
**Core Competencies:** Resource distribution, logistics coordination, cold-chain management, supply chain tracking
**Stamp:** Glacial Flow Mark -- awarded for successfully managing three resource distribution cycles

### 7.2 Chinook Rider (Burner Express / Transit)

**BRC Source:** Burner Express Bus, Exodus Traffic
**Camp:** Orca Sled (transit affiliation)
**Trust Level:** 1 (rider), 2 (coordinator)
**Description:** Burner Express provides bus service from Reno to Black Rock City, handling mass transit for participants without vehicles. Exodus coordinates the orderly departure of 70,000+ people from a single road. In the virtual BRC, Chinook Rider manages high-volume movement patterns: batch skill deployment, mass rig migration between camps, and the exodus protocol that clears the playa at event end without gridlock.
**Core Competencies:** Mass transit coordination, batch deployment, exodus protocol management, flow optimization
**Stamp:** Chinook Rider Mark -- awarded for executing one clean exodus without gridlock

### 7.3 Salish Access (Ticketing)

**BRC Source:** Ticketing (will-call, credential management)
**Camp:** Columbia Gate
**Trust Level:** 2
**Description:** Ticketing manages access credentials: will-call pickup, low-income ticket distribution, and the credential system that distinguishes participants. In the virtual BRC, Salish Access manages the credential layer: trust level assignments, access credential management, and the distribution of low-friction access to under-resourced rigs.
**Core Competencies:** Credential management, access control, trust level assignment, low-income access facilitation
**Stamp:** Salish Access Mark -- awarded for processing 50+ rig credentials without error

### 7.4 Raven Muster (Volunteer Coordination)

**BRC Source:** Volunteer Coordination (V-Spot)
**Camp:** Raven's Roost
**Trust Level:** 2
**Description:** Volunteer Coordination -- operating from the "V-Spot" -- matches incoming volunteers with departments that need them. The V-Spot is the clearinghouse for capacity across the whole city. In the virtual BRC, Raven Muster matches rigs to wanted-board items based on skill match, availability, and camp affiliation, operating as the intelligent routing layer of the Esplanade Feed.
**Core Competencies:** Cross-department matching, capacity routing, scheduling, volunteer welfare tracking
**Stamp:** Raven Muster Mark -- awarded for making 20+ successful rig-to-task matches

---

## 8. Environmental and Restoration Roles

These roles care for the land and ensure nothing is left behind.

### 8.1 Restoration Pass (Cleanup / Earth Restoration)

**BRC Source:** Cleanup and Earth Restoration
**Camp:** Geoduck Watch (environmental affiliation)
**Trust Level:** 1 (participant), 2 (sweep lead)
**Description:** After Burning Man, the Leave No Trace principle requires restoring the Black Rock Desert to its pre-event state. The cleanup crew combs the playa inch by inch, picking up every piece of MOOP (Matter Out Of Place). In the virtual BRC, Restoration Pass is the systematic post-event cleanup protocol: scanning for orphaned artifacts, dereferencing deprecated skills, clearing stub data, and restoring the commons to its ready state.
**Core Competencies:** MOOP sweep, orphan artifact detection, systematic cleanup, restoration documentation
**Stamp:** Restoration Pass Mark -- awarded for completing one full playa restoration with zero MOOP remaining

### 8.2 Geoduck Watch (Earth Guardians)

**BRC Source:** Earth Guardians (environmental monitoring)
**Camp:** Geoduck Watch
**Trust Level:** 1
**Description:** Earth Guardians are the environmental conscience of Burning Man: monitoring impact, promoting sustainable practices, and educating participants about Leave No Trace. In the virtual BRC, Geoduck Watch is the continuous environmental monitoring layer: tracking the ecological footprint of skill operations, flagging unsustainable patterns, and maintaining the deep-persistence health of the commons.
**Core Competencies:** Environmental monitoring, impact assessment, sustainability education, MOOP prevention
**Stamp:** Geoduck Watch Mark -- awarded for completing one full environmental monitoring cycle with no violations flagged

### 8.3 Osprey Survey (Census)

**BRC Source:** Census (population tracking, pattern analysis)
**Camp:** Osprey Watch
**Trust Level:** 2
**Description:** Burning Man's Census department conducts an annual survey of participants, documenting demographics, motivations, experience levels, and cultural patterns. In the virtual BRC, Osprey Survey performs population analytics: tracking rig distributions, skill completion rates, camp health metrics, and the pattern data that informs skill promotion decisions.
**Core Competencies:** Population analytics, survey design, data collection, pattern analysis, reporting
**Stamp:** Osprey Survey Mark -- awarded for completing one annual census cycle with statistically valid results

---

## 9. Trust Levels and Progression

The virtual BRC uses a three-level trust ladder that maps directly to BRC volunteer experience tiers:

| Trust Level | BRC Equivalent | Virtual BRC Meaning |
|-------------|---------------|---------------------|
| Level 1 | First-timer / Day-tripper | Any rig; no prior stamps required; access to all Level 1 skills |
| Level 2 | Experienced Burner | Completed 3+ skills from different camps; demonstrated reliability |
| Level 3 | Lead Ranger / Department Lead | Completed skills from 5+ camps; stamps from at least 2 other rigs; eligible for civic infrastructure roles |

Trust levels are not scores. They are attestations. A Level 3 rig is not "better" than a Level 1 -- it has simply demonstrated enough experience to take on roles that carry more civic responsibility.

Trust levels are never displayed publicly in ranked format. They are visible to the rig itself and to roles that require a specific level for safety reasons (Tide Pool Medical clearance, Fireline Cedar perimeter management).

---

## 10. Cross-References

| Project | Connection |
|---------|------------|
| [SYS](../SYS/index.html) | Infrastructure management patterns; server-level civic roles |
| [CMH](../CMH/index.html) | Mesh networking for federation between wastelands |
| [FFA](../FFA/index.html) | Art and craft community infrastructure; creative role patterns |
| [TIBS](../TIBS/index.html) | Community role structures; Indigenous community organization patterns |
| [WAL](../WAL/index.html) | Gift economy; creative community roles; volunteer culture |
| [OCN](../OCN/index.html) | Physical infrastructure patterns; containerized resource management |

---

## 11. Sources

1. [Burning Man: Volunteering](https://burningman.org/black-rock-city/volunteering/) -- Complete department catalog
2. [Burning Man: Black Rock Rangers](https://rangers.burningman.org/) -- Ranger handbook and training
3. [Burning Man: ARTery](https://artery.burningman.org/) -- Artist services documentation
4. [Burning Man: DPW](https://dpw.burningman.org/) -- Department of Public Works
5. [Burning Man: Earth Guardians](https://burningman.org/event/preparation/leaving-no-trace/) -- LNT program
6. [tibsfox.com/PNW](https://tibsfox.com/PNW/) -- Pacific Northwest naming taxonomy (species, bioregion)
7. [Wasteland MVR Schema](https://github.com/steveyegge/wasteland) -- Trust ladder, stamp taxonomy
