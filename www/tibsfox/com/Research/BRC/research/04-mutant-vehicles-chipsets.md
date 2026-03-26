# Orca Sled and Raven Crawler

> **Domain:** Mobile Systems & Chipset Architecture
> **Module:** 4 -- Mutant Vehicles as Mobile Chipsets
> **Through-line:** *Not every participant anchors to a camp.* Some carry capability across the whole city. The mobile chipset is the Burning Man mutant vehicle: it moves, it carries, it traverses.

---

## Table of Contents

1. [The Mutant Vehicle as Mobile Chipset](#1-the-mutant-vehicle-as-mobile-chipset)
2. [Vehicle Classification System](#2-vehicle-classification-system)
3. [Orca Sled](#3-orca-sled)
4. [Raven Crawler](#4-raven-crawler)
5. [Osprey Dive](#5-osprey-dive)
6. [Chinook Rider](#6-chinook-rider)
7. [CEDAR Chipset Configuration](#7-cedar-chipset-configuration)
8. [Activation Profiles](#8-activation-profiles)
9. [Movement Protocol and DMV Registration](#9-movement-protocol-and-dmv-registration)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Mutant Vehicle as Mobile Chipset

Burning Man's mutant vehicles are art cars -- motorized structures that have been transformed into something other than a conventional automobile. They must be fundamentally altered so that the original form of the vehicle is unrecognizable, and they must serve as art in motion. They are the only vehicles permitted on the open playa beyond the streets of Black Rock City.

The key distinction: a theme camp is fixed. A mutant vehicle moves. While camps anchor their skills to a location, mutant vehicles carry their skills across the whole city -- they traverse multiple camps, pick up passengers from different theme camps, and deliver their capability wherever the wanted board demands.

In the virtual BRC, a mobile chipset is the equivalent: a skill configuration that is not anchored to a single camp but can be deployed across any wanted-board item. Where a fixed skill belongs to one camp and executes in one context, a mobile chipset traverses the city -- reading the Esplanade Feed, selecting work items, and delivering capability wherever needed.

**The analogy holds at every layer:**

| Burning Man Mutant Vehicle | GSD Mobile Chipset |
|---------------------------|-------------------|
| Fundamentally altered form | Specialized chip configuration |
| Must serve as art | Must produce emergent capability |
| Licensed by DMV | Registered in Orca Sled DMV |
| Permitted on open playa | Permitted to traverse any wanted-board zone |
| Carries passengers | Carries task context across camps |
| Fueled and maintained by crew | Sustained by CEDAR chip allocation |

---

## 2. Vehicle Classification System

Black Rock City's DMV classifies mutant vehicles by scale and operational characteristics. The virtual BRC uses the same classification for mobile chipsets:

| Class | BRC Scale | Virtual BRC Chipset Scale |
|-------|-----------|--------------------------|
| Personal Vehicle | 1-2 passengers | Single-chip mobile configuration |
| Small Art Car | 3-10 passengers | 2-3 chip mobile configuration |
| Large Art Car | 11-30 passengers | 4-6 chip mobile configuration |
| Theme Camp on Wheels | 30+ passengers | Full CEDAR fleet configuration |

The four named mobile chipsets in the virtual BRC span all four classes.

---

## 3. Orca Sled

**Class:** Large Art Car / 4-6 chip configuration
**PNW Source:** Orca (*Orcinus orca*) -- apex marine predator, social hunter, long-distance traverser
**Primary Function:** Mobile traversal, mutant vehicle registration, kinetic capability delivery

The orca hunts in coordinated pods across hundreds of miles of ocean. No single orca makes a kill alone -- the pod works in coordinated patterns, driving prey, positioning interceptors, and sharing the catch. The Orca Sled operates on the same principle: a coordinated set of chips moving across the playa in formation, each with a distinct role in the collective hunt.

**Chip Configuration:**

```yaml
orca_sled:
  chips:
    RAVEN: communication and navigation across the city
    SALMON: upstream problem-solving for complex wanted-board items
    ORCA: primary traversal engine (self-referential: the Orca chip drives the Orca Sled)
    GEODUCK: deep-persistence anchor when the Sled needs to pause and root
  operational_zone: open playa (any zone)
  primary_use: high-complexity multi-camp wanted-board items
  dmv_class: large_art_car
```

**When to Deploy Orca Sled:**
- Wanted-board items that span 3+ theme camps
- Work requiring both traversal (ORCA) and deep persistence (GEODUCK)
- Items where communication across the city is as important as the work itself

---

## 4. Raven Crawler

**Class:** Small Art Car / 2-3 chip configuration
**PNW Source:** Common raven (*Corvus corax*) -- aerial intelligence, rapid traversal, message carrying
**Primary Function:** Fast reconnaissance, wanted-board item identification, rapid-response deployment

The raven is the fastest thinker in the corvid family. It can solve multi-step problems, use tools, and navigate complex social environments. The Raven Crawler is the quick-response vehicle -- it traverses the playa rapidly, identifies where it is needed, and deploys with minimal overhead.

**Chip Configuration:**

```yaml
raven_crawler:
  chips:
    RAVEN: primary intelligence engine (self-referential: the Raven chip drives the Raven Crawler)
    SALMON: navigation and path-finding for complex routes
  operational_zone: esplanade and middle ring (high-traffic zones)
  primary_use: rapid reconnaissance, first-response deployment, information routing
  dmv_class: small_art_car
```

**When to Deploy Raven Crawler:**
- Wanted-board items requiring rapid response with low overhead
- Reconnaissance missions before deploying larger chipsets
- Information relay between camps where RAVEN's communication skills are the primary asset

---

## 5. Osprey Dive

**Class:** Personal Vehicle / single-chip or 2-chip configuration
**PNW Source:** Osprey (*Pandion haliaetus*) -- precision aerial hunter, high-altitude observation, pinpoint dive
**Primary Function:** Targeted data collection, high-precision observation, surgical extraction

The osprey soars at high altitude, locates its target through polarized vision that sees through water surface reflections, and dives with extraordinary precision -- achieving an 80% success rate on hunting dives. The Osprey Dive is the precision instrument: deployed for targeted data collection missions where broad traversal would be wasteful.

**Chip Configuration:**

```yaml
osprey_dive:
  chips:
    OSPREY: primary observation and analysis engine
  operational_zone: any zone (pinpoint deployment)
  primary_use: census operations, targeted observation, precision data collection
  dmv_class: personal_vehicle
```

**When to Deploy Osprey Dive:**
- Osprey Survey (Census) operations requiring precision data collection
- Targeted observation of a single wanted-board item
- Post-completion analysis to verify restoration

---

## 6. Chinook Rider

**Class:** Theme Camp on Wheels / full fleet configuration
**PNW Source:** Chinook salmon (*Oncorhynchus tshawytscha*) -- largest Pacific salmon, strongest swimmer, highest-value return
**Primary Function:** Mass transit, batch deployment, high-volume movement across the city

The Chinook is the largest of the Pacific salmon species -- the king salmon. Its return to freshwater rivers is the most dramatic and productive nutrient event in the PNW ecosystem. The Chinook Rider is the city's mass-transit chipset: not subtle, not fast, but capable of moving enormous volumes of work across long distances with maximum impact.

**Chip Configuration:**

```yaml
chinook_rider:
  chips:
    RAVEN: city-wide communication and routing
    SALMON: navigation and upstream pathfinding
    OSPREY: passenger census and flow monitoring
    CEDAR: structural stability for mass-transit loads
    TAHOMA: summit synthesis for high-stakes moves
    ORCA: traversal engine
    HEMLOCK: patience for slow-moving batch operations
    GEODUCK: deep persistence for long-haul deployments
  operational_zone: all zones (full playa access)
  primary_use: mass batch deployment, high-volume exodus, city-wide operations
  dmv_class: theme_camp_on_wheels
```

**When to Deploy Chinook Rider:**
- City-wide operations requiring all eight CEDAR chips
- Batch deployment of multiple wanted-board items simultaneously
- The annual Exodus -- orderly departure of all rigs at event end

---

## 7. CEDAR Chipset Configuration

The CEDAR chipset is the naming system from which all virtual BRC mobile chipsets draw their chip names. Each chip name comes from the Pacific Northwest bioregion taxonomy documented at tibsfox.com/PNW:

| Chip | PNW Source | Primary Role |
|------|-----------|--------------|
| RAVEN | Common raven (Corvus corax) | Communication, observation, message routing |
| SALMON | Chinook salmon (Oncorhynchus tshawytscha) | Navigation, upstream problem-solving, lifecycle management |
| OSPREY | Osprey (Pandion haliaetus) | Aerial observation, census, documentation |
| TAHOMA | Mt. Rainier / Tahoma (14,411 ft) | Summit synthesis, apex skill promotion engine |
| CEDAR | Western red cedar (Thuja plicata) | Structural stability, camp scaffolding, LNT |
| HEMLOCK | Western hemlock (Tsuga heterophylla) | Deep-time patience, dependency resolution |
| ORCA | Orca (Orcinus orca) | Mobile traversal, mutant-vehicle transport layer |
| GEODUCK | Geoduck (Panopea generosa) | Deep persistence, Dolt commons root system |

The chipset is named CEDAR after the most structurally important species in the Columbia Valley rainforest: the western red cedar, which provides both the physical architecture of the forest and the cultural architecture of the Coast Salish peoples.

**Naming source traceability:**

| Chip | Bioregion Source | tibsfox.com/PNW Module |
|------|-----------------|----------------------|
| RAVEN | Columbia Valley (COL) + widespread PNW | ECO, COL |
| SALMON | Columbia River system | ECO, SAL |
| OSPREY | Cascade Range (CAS) | CAS, AVI |
| TAHOMA | Cascade Range summit | CAS |
| CEDAR | Columbia Valley old-growth | COL |
| HEMLOCK | Columbia Valley old-growth | COL |
| ORCA | Salish Sea | ECO, MAM |
| GEODUCK | Salish Sea intertidal | ECO |

---

## 8. Activation Profiles

The CEDAR chipset defines four activation profiles, from minimal to maximum:

```yaml
activation_profiles:
  scout: [RAVEN, SALMON]
  # 2 chips: reconnaissance and navigation
  # Use for: initial wanted-board reconnaissance, rapid assessment

  patrol: [RAVEN, SALMON, OSPREY, CEDAR]
  # 4 chips: adds observation and structural stability
  # Use for: standard patrol operation, medium-complexity tasks

  squadron: [RAVEN, SALMON, OSPREY, CEDAR, TAHOMA, ORCA]
  # 6 chips: adds synthesis and traversal
  # Use for: complex multi-camp operations, skill promotion ceremonies

  fleet: [RAVEN, SALMON, OSPREY, CEDAR, TAHOMA, HEMLOCK, ORCA, GEODUCK]
  # 8 chips: full activation
  # Use for: city-wide operations, Exodus, major burn events
```

**Activation profile selection:**

The profile should match the complexity of the wanted-board item. Fleet activation for a simple two-skill task wastes capacity. Scout activation for a complex multi-camp installation leaves insufficient capability. The Orca Sled DMV registration process includes a capability assessment that recommends the appropriate profile.

---

## 9. Movement Protocol and DMV Registration

Every mobile chipset operating on the Black Sand Flat must be registered with the Orca Sled DMV. The registration process:

1. **Capability declaration:** the chipset declares its chips, operational zone, and primary use case
2. **Safety review:** Tide Pool Medical verifies that the chipset's movement protocol cannot cause collisions with fixed camps
3. **Art review:** the Nurse Log Guild verifies that the chipset serves as art -- that it produces emergent capability beyond what its chips do individually
4. **Playa clearance:** Cascade Brigade verifies that the chipset's infrastructure requirements are met
5. **DMV stamp:** the Orca Registration Mark is issued; the chipset is authorized to traverse the Black Sand Flat

**Movement Protocol Rules:**

- A mobile chipset must yield to fixed camps in their zone of operation
- No chipset may traverse the Tide Pool Collective or Fireline Cedar perimeter without clearance
- The Chinook Rider (full fleet) requires 24-hour advance notice before deployment
- All mobile chipsets must complete a Restoration Pass (LNT sweep) at the end of each traversal cycle

---

## 10. Cross-References

| Project | Connection |
|---------|------------|
| [SYS](../SYS/index.html) | Server fleet deployment patterns; chipset-to-server mapping |
| [CMH](../CMH/index.html) | Mesh networking traversal; mobile node protocols |
| [GSD2](../GSD2/index.html) | Chip-level execution model; CEDAR chipset in GSD-2 context |
| [WAL](../WAL/index.html) | Systematic transformation method; mobile execution strategy |
| [BCM](../BCM/index.html) | Engineering principles for mobile structure design |

---

## 11. Sources

1. [Burning Man: Department of Mutant Vehicles](https://survival.burningman.org/transportation/mutant-vehicles/) -- DMV rules and registration
2. [tibsfox.com/PNW/ECO](https://tibsfox.com/PNW/ECO/) -- Living Systems Taxonomy (orca, geoduck, salmon)
3. [tibsfox.com/PNW/CAS](https://tibsfox.com/PNW/CAS/) -- Cascade Range (tahoma, osprey)
4. [tibsfox.com/PNW/COL](https://tibsfox.com/PNW/COL/) -- Columbia Valley (cedar, hemlock, raven)
5. [tibsfox.com/PNW/AVI](https://tibsfox.com/PNW/AVI/) -- Wings of the PNW (osprey, raven behavioral)
6. [tibsfox.com/PNW/MAM](https://tibsfox.com/PNW/MAM/) -- Fur, Fin and Fang (orca behavioral)
