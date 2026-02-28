# GSD Knowledge World -- Layout Design

## Overview

The GSD Knowledge World is a Minecraft Java Edition spatial environment where
information architecture becomes walkable. Six themed districts radiate outward
from a central Spawn Plaza in a hub-and-spoke layout. Each district represents
a domain of computing knowledge, and the spatial relationships between districts
encode conceptual relationships: walking from Hardware to Software crosses the
Bus Bridge, making the hardware-software boundary a physical journey.

Space encodes meaning. Color encodes identity. Distance encodes relationship.

Every district, pathway, color palette, and sign standard defined here is
consumed by Phases 187-190 as the foundational blueprint for building the
Knowledge World. Nothing gets built without a coordinate in this plan.

## World Map

```
                         North (negative Z)
                              |
                              |
    +-------------------+     |     +-------------------+
    |                   |     |     |                   |
    |     HARDWARE      |     |     |     SOFTWARE      |
    |   (Iron/Gray)     |     |     |   (Blue/Cyan)     |
    | -300,-250         |     |     | 100,-250          |
    |       to -100,-50 |     |     |       to 300,-50  |
    |                   |     |     |                   |
    |   Entrance:       |     |     |   Entrance:       |
    |   (-100, -150)    |     |     |   (100, -150)     |
    +--------+----------+     |     +----------+--------+
             |                |                |
             |  NIC Corridor  |  Bus Bridge    |  API Arch
             |                |   (x=0,z=-150) |
    +--------+----------+     |     +----------+--------+
    |                   |   SPAWN   |                   |
    |     NETWORK       |  PLAZA    |     CREATIVE      |
    |   (Green/Lime)    | (0,0)    |   (Magenta/Purple) |
    | -300,50           |  r=40     | 100,50            |
    |       to -100,250 |           |       to 300,250  |
    |                   |           |                   |
    |   Entrance:       |           |   Entrance:       |
    |   (-100, 150)     |           |   (100, 150)      |
    +--------+----------+           +----------+--------+
             |                                 |
             | Connection Path   Maker's Way   |
             |                                 |
    +--------+----------+     +----------+--------+
    |                   |     |                   |
    |    COMMUNITY      |     |     WORKSHOP      |
    |   (Orange/Warm)   |     |   (Red/Brown)     |
    | -200,260          |     | 10,260            |
    |       to 0,460    |     |       to 210,460  |
    |                   |     |                   |
    |   Entrance:       | Col-|   Entrance:       |
    |   (-100, 260)     | lab |   (100, 260)      |
    |                   | Com.|                   |
    +-------------------+-----+-------------------+

                         South (positive Z)

    West (negative X) <----- 0,0 -----> East (positive X)
```

## District Summary

| District   | Theme                          | Direction | Color Family     | Key Concepts                                   |
|------------|--------------------------------|-----------|------------------|-------------------------------------------------|
| Hardware   | Physical computing             | NW        | Iron/Gray        | Circuits, signals, memory, processors           |
| Software   | Abstract computing             | NE        | Blue/Cyan        | Algorithms, data structures, design patterns    |
| Network    | Connected computing            | WSW       | Green/Lime       | Protocols, servers, security, routing           |
| Creative   | Digital arts                   | ESE       | Magenta/Purple   | Pixel art, tracker music, demoscene             |
| Community  | Collaboration                  | SSW       | Orange/Warm      | Galleries, showcases, meeting spaces            |
| Workshop   | Hands-on building              | SSE       | Red/Brown        | Schematics, guided builds, practice             |

## Walking Distances (Spawn to District Entrance)

Player walking speed: ~4.317 blocks/second (no sprinting).
Maximum allowed: 518 blocks (2 minutes).

| District   | Entrance Coords    | Distance (blocks) | Walk Time (seconds) | Under Limit? |
|------------|--------------------|--------------------|---------------------|--------------|
| Hardware   | (-100, 64, -150)   | ~180               | ~42s                | Yes          |
| Software   | (100, 64, -150)    | ~180               | ~42s                | Yes          |
| Network    | (-100, 64, 150)    | ~180               | ~42s                | Yes          |
| Creative   | (100, 64, 150)     | ~180               | ~42s                | Yes          |
| Community  | (-100, 64, 260)    | ~279               | ~65s                | Yes          |
| Workshop   | (100, 64, 260)     | ~279               | ~65s                | Yes          |

**Maximum walking time: ~65 seconds** (Community and Workshop districts),
well under the 2-minute (120-second) constraint.

## Connections (Inter-District Links)

Each connection encodes a conceptual relationship between adjacent districts:

| Connection             | Type     | Width | Concept                                        |
|------------------------|----------|-------|------------------------------------------------|
| The Bus Bridge         | Bridge   | 15    | Hardware-software boundary -- the system bus   |
| The NIC Corridor       | Corridor | 10    | Network interface -- hardware meets the network|
| The API Arch           | Archway  | 10    | Software powering creative tools               |
| The Collaboration Commons | Plaza | 20    | Community knowledge feeds workshop practice    |
| The Connection Path    | Path     | 8     | Networks enable community                      |
| The Maker's Way        | Path     | 8     | Creative vision drives hands-on building       |

## File Manifest

| File                           | Purpose                                           | Consumed By     |
|--------------------------------|---------------------------------------------------|-----------------|
| `world-master-plan.yaml`       | District coordinates, bounds, connections, layout  | Phases 187-190  |
| `district-palettes.yaml`       | Block palettes per district (walls, floors, trim)  | Phases 187-190  |
| `wayfinding-system.yaml`       | Paths, beacons, landmarks, entrance gates          | Phases 187-190  |
| `sign-standards.yaml`          | Sign formatting, color codes, templates            | Phases 187-190  |
| `README.md`                    | Human-readable overview (this file)                | Builders        |

## Design Rationale

### Why Hub-and-Spoke (Not Grid)?

A grid layout treats all districts as equal and unrelated. Hub-and-spoke
places the Spawn Plaza at the center, making it the natural starting point
and orientation anchor. From spawn, every district is visible (via beacon
beams) and reachable in under a minute. The radial layout also creates
natural inter-district adjacencies that encode conceptual relationships.

Grid layouts also create ambiguous directions -- "go north then east" vs
"go northeast." Hub-and-spoke gives each district a single direction from
center: "the blue beacon is Hardware, head that way."

### Why These Six Districts?

The six districts map to the GSD ecosystem's knowledge domains:

1. **Hardware** -- Physical computing fundamentals (the machine layer)
2. **Software** -- Abstract computing concepts (the logic layer)
3. **Network** -- Connected systems (the communication layer)
4. **Creative** -- Digital arts and heritage (the expression layer)
5. **Community** -- Collaboration spaces (the social layer)
6. **Workshop** -- Hands-on building (the practice layer)

These six cover the full stack from transistors to teamwork. The adjacency
pairs encode real relationships: Hardware-Software (system bus), Hardware-Network
(NIC), Software-Creative (APIs), Network-Community (connectivity), Creative-
Workshop (making), Community-Workshop (collaboration).

### Why These Colors?

Each color family was chosen for both distinctness and thematic resonance:

- **Iron/Gray** for Hardware -- industrial, metallic, like circuit boards
- **Blue/Cyan** for Software -- digital, clean, like IDE syntax highlighting
- **Green/Lime** for Network -- alive, flowing, like data in motion
- **Magenta/Purple** for Creative -- artistic, expressive, like the demoscene
- **Orange/Warm** for Community -- welcoming, social, like a gathering fire
- **Red/Brown** for Workshop -- workbench, crafting, like a maker's shop

No two color families are adjacent on the color wheel, ensuring instant
visual distinction even at a distance. The Spawn Plaza uses white/quartz
as a neutral hub that does not compete with any district's identity.

## Coordinate System Reference

Minecraft uses a right-handed coordinate system:

- **X axis:** East (+X) / West (-X)
- **Y axis:** Up (+Y) / Down (-Y) -- height
- **Z axis:** South (+Z) / North (-Z)
- **Ground level:** Y = 64 (sea level, flat world default)
- **Block scale:** 1 block = 1 meter (roughly)
- **Player height:** ~1.8 blocks
- **Walking speed:** ~4.317 blocks/second
- **Sprint speed:** ~5.612 blocks/second (not assumed in distance calculations)

All district bounds and entrance coordinates use the XZ plane at Y=64.
Buildings within districts may extend vertically (positive Y) as needed.
The Bus Bridge is elevated to Y=72 to create a visual landmark.

---
*Phase 186 -- World Layout Design*
*GSD Knowledge World v1.0*
