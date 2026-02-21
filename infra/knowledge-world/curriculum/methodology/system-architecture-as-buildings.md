# System Architecture as Buildings

A methodology for teaching computing concepts through Minecraft spatial construction.

---

## 1. Introduction

### What This Is

This document is a methodology for creating guided builds in Minecraft that teach computing concepts through spatial construction. Every section here provides a reusable framework: the spatial metaphor system maps computing ideas to physical structures, the block palette ensures visual consistency, and the 9-step build creation process turns any computing concept into a walkable learning experience.

### Why Spatial Learning Works

Abstract computing concepts -- data pipelines, network topologies, database schemas -- become tangible when you can walk through them. A data pipeline is no longer a diagram on a whiteboard; it is a corridor you walk down, passing through rooms where you can see items being transformed. A bottleneck is no longer a word -- it is a room that is physically smaller than the others, where you can feel the constraint.

The core insight: **when you build a system with your hands, you understand it with your body.** The act of placing blocks forces you to make decisions about spatial relationships that mirror the architectural decisions in real software systems. How wide should this corridor be? That question maps directly to "how much bandwidth does this connection need?" How many doors should this room have? That maps to "how many interfaces does this service expose?"

### Who This Is For

- **Educators** who want to teach computing concepts through spatial construction
- **Curriculum designers** building guided experiences in Minecraft educational servers
- **Minecraft builders** who want their builds to teach something, not just look impressive
- **Learners** who want to understand why a build is structured the way it is

### Prerequisites

- Familiarity with Minecraft creative mode (placing blocks, signs, redstone basics)
- Basic understanding of Litematica (loading and placing schematics)
- No computing background required -- the builds teach the concepts

---

## 2. The Spatial Metaphor System

This is the core mapping between computing concepts and Minecraft structures. Every guided build in the curriculum uses this table as its foundation. When you see a room in a guided build, it represents a component. When you walk through a corridor, you are following data flow.

### Primary Metaphor Table

| Computing Concept | Minecraft Structure | Why This Works |
|---|---|---|
| Component / Service | Room or Building | Enclosed space = bounded responsibility. A room has walls that define what belongs inside it. |
| Data flow | Corridor or Path | Walking the path = following the data. You physically experience the journey data takes. |
| Interface / API | Door or Window | Access point between spaces. You can see through a window (read-only) or walk through a door (read-write). |
| Message / Request | Item in chest or Minecart | A tangible thing that moves. You can pick it up, carry it, put it somewhere else. |
| Processing | Redstone mechanism | Active transformation visible. Pistons move, lamps light up, comparators compare. |
| Queue / Buffer | Hopper chain | Items waiting to be processed. You can see the queue length by counting items in the hoppers. |
| Database / Storage | Library with lecterns | Persistent, queryable information. Lecterns hold written books you can read without removing. |
| Load balancer | Branching corridor | Choice point in the path. Two corridors diverge -- the load balancer picks one. |
| Firewall / Auth | Iron door with button | Controlled access. You cannot pass without explicit action (pressing the button). |
| Cache | Chest near entrance | Quick access to frequent items. Positioned for convenience, not permanence. |
| Network link | Path between buildings | Connection with travel time. The walk between buildings gives you a feel for network latency. |
| Bandwidth | Path width | Wider corridors = more capacity. A 1-wide path versus a 5-wide path is immediately obvious. |
| Latency | Path length | Longer corridors = more delay. A 5-block corridor versus a 50-block corridor feels different. |
| Server | Building | Self-contained service provider. Has its own walls, door, address (sign). |
| Client | Player character | The entity making requests. You walk to a building, open the door, interact with what's inside. |

### Extended Metaphor Table

These metaphors are used in intermediate and advanced builds.

| Computing Concept | Minecraft Structure | Why This Works |
|---|---|---|
| Parallel processing | Multiple identical rooms | Side-by-side rooms doing the same work. You can see parallelism as physical duplication. |
| Thread | Separate corridor from same room | Multiple paths leaving one component. Each corridor is an independent execution path. |
| Mutex / Lock | Single-door room | Only one player can enter at a time. The physical constraint enforces exclusivity. |
| Event bus | Redstone line running past rooms | A signal wire that any room can tap into. Observers detect the signal without blocking it. |
| Logging / Monitoring | Observatory tower | A high vantage point that overlooks the system. You can see activity without being part of it. |
| Health check | Daylight sensor | Constantly checking the state of the environment. Always on, always reporting. |
| Retry logic | Circular corridor | A path that loops back to the entrance if the exit is blocked. |
| Timeout | Redstone repeater with delay | A mechanism that waits a fixed amount of time before activating. |
| Rate limiting | Redstone clock on a door | The door only opens at regular intervals, regardless of how many players are waiting. |
| Dead letter queue | Room with no exit | A place where failed messages end up. You can visit to inspect them. |
| Service mesh | Covered corridor network | Enclosed paths connecting every building. The mesh is the infrastructure between services. |
| Container | Room within a room | An isolated space inside a larger building. Has its own walls but shares the building's foundation. |
| Orchestrator | Control room with buttons | A central room with levers and buttons that activate mechanisms in other rooms. |

### Using the Metaphor Table

When designing a new guided build:

1. **Identify the computing concepts** your build will teach
2. **Look up each concept** in the metaphor tables above
3. **Map the relationships** between concepts to spatial relationships between structures
4. **Verify the mapping** by asking: "If I change the Minecraft structure, does the computing meaning change in the same way?"

**Example -- Pipeline build:** A data pipeline has stages (rooms), flow (corridors), buffering (hopper chains), and error handling (branching corridors). The pipeline build from this curriculum uses: 5 rooms for stages, 4 corridors for flow, a hopper chain for buffering, and a branching corridor for error routing.

**Example -- Network build:** A network topology has servers (buildings), connections (paths), bandwidth (path width), and firewalls (iron doors). The network build uses: 3 buildings for servers, paths of varying width for connections, and iron doors with buttons for access control.

**Example -- Database build:** A database schema has tables (rooms), columns (chests with labels), relationships (doors between rooms), and indexes (sorted bookshelves). The database build uses: rooms sized proportionally to row count, doors sized to relationship cardinality, and bookshelves sorted by "indexed" column.

---

## 3. Block Palette Standards

Consistent material choices across all educational builds create visual language. When a learner sees stone brick, they know they are inside a processing component. When they see glazed terracotta with arrows, they know data is flowing.

### Core Materials

| Purpose | Primary Block | Variants | Rationale |
|---|---|---|---|
| Processing rooms (walls) | Stone Brick | Stone Brick Stairs, Stone Brick Slabs, Mossy Stone Brick | Solid, reliable, industrial -- processing is the backbone |
| Data corridors (floor) | Cyan Glazed Terracotta | Other directional glazed terracotta | Arrow patterns show flow direction inherently |
| Input/Output interfaces | Glass Block | Glass Pane, Tinted Glass | Transparent -- you can see in/out, representing API visibility |
| Control flow | Redstone Block | Redstone Repeater, Comparator, Redstone Torch | Active computation and signal propagation |
| Storage | Barrel, Chest | Bookshelf, Lectern, Ender Chest | Physical containers for data at rest |
| Signage | Oak Sign | Oak Wall Sign, Oak Hanging Sign | Readable, warm tone, consistent across builds |
| Foundations | Smooth Stone | Polished Andesite, Polished Diorite | Clean base layer, visually distinct from walls |
| Roofing | Dark Oak Slab | Spruce Slab, Dark Oak Stairs | Consistent ceiling treatment |

### Status Indicators

| Status | Block | Usage |
|---|---|---|
| Error / Failure | Red Concrete | Error handling rooms, dead letter queues |
| Warning / Degraded | Yellow Concrete | Buffer overflow indicators, timeout zones |
| Healthy / Success | Green Concrete | Output confirmation, health check OK |
| Inactive / Disabled | Gray Concrete | Disabled features, offline components |
| Highlight / Important | Gold Block | Key concept locations, "look here" indicators |

### District-Specific Palettes

When builds are placed within Knowledge World districts, they should incorporate the district color palette. Reference the world layout document (Phase 186) for district-specific color assignments. General guidelines:

- **Software District:** Blue/cyan tones (blue concrete, cyan terracotta)
- **Hardware District:** Orange/brown tones (orange concrete, terracotta)
- **Network District:** Green tones (green concrete, lime terracotta)
- **Creative District:** Purple/magenta tones (purple concrete, magenta terracotta)
- **Workshop District:** Neutral tones (white concrete, light gray concrete)

District palettes are accents -- the core materials (stone brick walls, glazed terracotta corridors) remain consistent across all builds.

---

## 4. Sign Formatting Conventions

Signs are the primary way guided builds communicate with learners. Consistent formatting makes signs predictable and readable.

### Minecraft Sign Constraints

- **Maximum characters per line:** 15 (this is a hard Minecraft limit)
- **Lines per sign:** 4
- **Placement:** Wall signs preferred for readability; standing signs for direction indicators
- **Text color:** Default (black on oak) for readability

### Sign Types

#### Title Signs

Used at room entrances and build start points.

```
Line 1: [Build Name]
Line 2: Section Name
Line 3: (empty)
Line 4: (empty)
```

Example:
```
[Pipeline]
Intake Room
```

#### Concept Signs

Used to explain computing concepts at relevant locations.

```
Line 1: CONCEPT NAME
Line 2: = MC Equivalent
Line 3: Brief explain-
Line 4: ation here
```

Example:
```
DATA BUFFER
= Hopper Chain
Items queue here
before processing
```

#### Direction Signs

Used at corridor junctions and decision points.

```
Line 1: --> Destination
Line 2: (distance hint)
Line 3: (empty)
Line 4: (empty)
```

Example:
```
--> Transform
Room 3 of 5
```

#### Step Signs

Used for guided build instructions.

```
Line 1: Step N of M
Line 2: Instruction
Line 3: continued if
Line 4: needed
```

Example:
```
Step 3 of 10
Build walls 5
blocks high with
stone brick
```

#### Question Signs

Used for self-check reflection points.

```
Line 1: ? THINK ?
Line 2: Question text
Line 3: continued if
Line 4: needed
```

Example:
```
? THINK ?
What happens if
this corridor
is blocked?
```

### Formatting Rules

1. **ALL CAPS** for concept names and section headers
2. **Title Case** for room names and destinations
3. **Sentence case** for instructions and explanations
4. **Arrows** (-->) for direction indicators
5. **Brackets** ([]) around build names in title signs
6. **Question marks** (? ?) framing self-check prompts
7. **Hyphenation** allowed when words exceed line length
8. **Abbreviations** accepted when space is tight (e.g., "proc" for "processing", "xform" for "transform")

---

## 5. Guided Build Template

This is the 9-step process for creating a new guided build. Follow these steps in order to transform any computing concept into a walkable Minecraft learning experience.

### Step 1: Identify the Computing Concept

Choose a concept that can be decomposed into spatial relationships. Good candidates have:

- **Multiple components** (rooms to build)
- **Connections between components** (corridors to walk)
- **Flow or sequence** (a path to follow)
- **Transformations** (something changes as it moves through the system)

**Good concepts:** Data pipelines, network topologies, database schemas, microservice architectures, compiler phases, HTTP request lifecycle, CI/CD pipelines.

**Poor concepts:** Single algorithms (no spatial decomposition), mathematical proofs (no flow), individual data structures (too small for a build -- combine with related concepts).

### Step 2: Map Concept Elements to the Spatial Metaphor Table

For each element of your chosen concept, find the corresponding Minecraft structure in the metaphor tables (Section 2). Create a mapping table specific to your build:

```markdown
| Concept Element | Metaphor | Minecraft Structure |
|---|---|---|
| [element 1] | [metaphor name] | [specific blocks/room/corridor] |
| [element 2] | [metaphor name] | [specific blocks/room/corridor] |
```

**Verify the mapping:** For each row, ask "If I change the Minecraft structure, does the computing meaning change in the same way?" If widening a corridor does not change the conceptual meaning, the mapping may be wrong.

### Step 3: Sketch the Layout

Draw a top-down floor plan showing:

- Room positions and sizes (in blocks)
- Corridor connections and widths
- Door placements (interface locations)
- Sign positions (concept explanation points)
- Overall dimensions (total build footprint)

Use ASCII art in the guide document:

```
[Room A]--corridor-->[Room B]
  5x5      3-wide      7x7
```

**Size guidelines:**
- Small rooms: 5x5 interior (simple components)
- Medium rooms: 7x7 interior (complex processing)
- Large rooms: 9x9 or larger (major systems with internal structure)
- Corridors: 3 blocks wide minimum (comfortable walking)
- Ceiling height: 4 blocks (comfortable, allows signs on walls)

### Step 4: Define the Build Sequence

Determine the order in which the learner builds each part. The sequence should:

1. **Start with the most intuitive part** (usually the input or starting point)
2. **Follow the data flow direction** (build in the order data moves)
3. **Introduce one new concept per step** (do not overload)
4. **Alternate between building and explaining** (build a room, then learn what it represents)

### Step 5: Write Step-by-Step Instructions

For each build step, provide:

- **What to build:** Exact blocks, dimensions, and placement
- **What it represents:** The computing concept this structure maps to
- **Why it matters:** How this concept fits into the larger system

**Format each step as:**

```markdown
### Step N: [Action] (estimated time: X minutes)

**Build:** [specific construction instructions]

**Concept:** [computing concept explanation]

**Signs to place:**
- [sign location]: [sign text following formatting conventions]

**Self-check:** [optional reflection question]
```

### Step 6: Add Self-Check Questions

Place reflection questions at key milestones throughout the build. These questions should:

- **Test understanding**, not memorization ("What would happen if..." not "What is this called?")
- **Connect to the physical build** ("What happens if you remove this corridor?")
- **Introduce real-world parallels** ("This is similar to how X works in real systems")

Place 3-5 questions throughout a standard build. Use Question Signs (Section 4) for in-build questions and a dedicated Reflection section at the end.

### Step 7: Create Schematic Specification YAML

Write a YAML file following the format defined in Section 8. This file enables:

- Catalog integration (automated schematic library listings)
- Material estimation (block counts for resource planning)
- Dependency tracking (prerequisites between builds)

### Step 8: Playtest with Timing

Build the guided experience yourself and time each step.

**Timing targets:**
- Each build step: 3-5 minutes of active construction
- Total build steps: 8-12 (gives 24-60 minutes of building)
- Reading/orientation time: 5-10 minutes
- Final walkthrough: 5 minutes
- **Total target: 30-60 minutes**

If the build exceeds 60 minutes, split it into Part 1 and Part 2 with a natural breakpoint. Common split points: after the core system is built (Part 1 covers happy path), before advanced features (Part 2 covers error handling, optimization).

### Step 9: Capture as Litematica Schematics

Create two schematics for each guided build:

1. **Starter template** (`build-name-starter.litematic`): Foundation laid out with room outlines, corridor markers, and step signs. The learner builds on top of this.

2. **Completed reference** (`build-name-complete.litematic`): The fully built result with all rooms, corridors, redstone, signs, and decorations. For reference and self-checking.

Name schematics following the convention: `category-name-version.litematic` (e.g., `education-pipeline-v1.litematic`).

---

## 6. Timing Guidelines

### The 30-60 Minute Window

Every guided build must fit within 30-60 minutes for a focused learner in creative mode. This window is long enough to build something meaningful but short enough to complete in a single session.

### Time Budget Breakdown

| Activity | Time | Notes |
|---|---|---|
| Orientation (reading overview, understanding the concept) | 5-10 min | Learner reads intro, reviews floor plan |
| Build steps (8-12 steps at 3-5 min each) | 24-60 min | Active block placement and sign reading |
| Final walkthrough (walk the complete build, read all signs) | 5 min | Consolidation of learning |
| Reflection (answering self-check questions) | 5 min | Optional but recommended |
| **Total** | **30-60 min** | |

### Step Count Math

- **Beginner builds** (30-40 min): 8-10 steps, simpler rooms (5x5), shorter corridors
- **Intermediate builds** (40-50 min): 10-12 steps, mixed room sizes, redstone mechanisms
- **Advanced builds** (50-60 min): 12 steps, larger rooms, complex redstone, multiple paths

### When Builds Are Too Long

If playtesting shows a build exceeds 60 minutes:

1. **First check:** Are any steps unnecessary? Can you combine steps without losing concepts?
2. **If still too long:** Split into Part 1 (core system, 30-40 min) and Part 2 (advanced features, 20-30 min)
3. **Natural split points:** After the "happy path" works, before error handling; after basic structure, before optimization; after core rooms, before extension rooms

### When Builds Are Too Short

If a build is under 30 minutes:

1. **Add depth:** More detailed construction (interior decoration, redstone mechanisms)
2. **Add breadth:** Additional rooms or paths that teach related concepts
3. **Add reflection:** More self-check questions, comparison exercises
4. **Consider merging** with a related build into a single, richer experience

---

## 7. Assessment Integration

### Embedded Assessment

Learning verification happens during the build, not after it. Assessment is woven into the construction process through three mechanisms.

#### Self-Check Questions

Placed at milestones throughout the build using Question Signs.

**Question types:**
- **Consequence questions:** "What would happen if this corridor were blocked?" (tests understanding of data flow)
- **Comparison questions:** "Why is Room 3 bigger than Room 2?" (tests understanding of resource allocation)
- **Transfer questions:** "What real-world system works like this?" (tests ability to connect spatial experience to computing)
- **Design questions:** "How would you add a sixth processing stage?" (tests ability to extend the system)

**Placement:** One question every 2-3 build steps. Do not overload. The building itself is the primary learning activity.

#### "What Breaks If..." Scenarios

After the build is complete, propose modification scenarios:

- "Remove the corridor between Room 2 and Room 3. What can no longer communicate?"
- "Make the corridor to Room 5 only 1 block wide. What happens to throughput?"
- "Block the door on the error-handling room. Where do failed items go?"

These scenarios develop system thinking -- understanding how changes propagate through interconnected components.

#### Comparison Exercises

For intermediate and advanced learners:

- "Build the same pipeline but with parallel processing (two Transform rooms). How does behavior change?"
- "Redesign the network topology with a different server arrangement. What trade-offs appear?"
- "Add an index (sorted bookshelf) to the database. How does query speed change conceptually?"

### Real-World Connections

Every guided build must include a "Real-World Connections" section that maps the spatial experience to actual systems:

- Name specific technologies (Apache Kafka, PostgreSQL, Kubernetes)
- Show the architectural diagram equivalent
- Explain how the Minecraft build maps to the real-world system
- Include at least 3 real-world examples per build

---

## 8. Schematic Specification Format

Every guided build includes a YAML specification file that enables catalog integration, material planning, and dependency tracking.

### YAML Structure

```yaml
name: build-name
category: education
subcategory: guided-build
concept: "Primary computing concept taught"
difficulty: beginner|intermediate|advanced
estimated_time_minutes: 30-60
district: software|hardware|network|creative|workshop
coordinates:
  origin: "District-relative or absolute coordinates"
  dimensions: "WxHxD blocks"
prerequisites:
  - "Prerequisite 1 (skill or prior build)"
learning_objectives:
  - "Objective 1: what the learner will understand"
  - "Objective 2: what the learner will be able to do"
  - "Objective 3: what connection will be made"
schematics:
  - name: category-name-starter.litematic
    description: "Starting template with foundation and markers"
    blocks_approx: 500-1000
  - name: category-name-complete.litematic
    description: "Completed build with all structures and signs"
    blocks_approx: 1500-3000
materials:
  walls: "block_name, block_name"
  corridors: "block_name"
  processing: "block_name, block_name"
  storage: "block_name, block_name"
  signage: "block_name, block_name"
  glass: "block_name"
build_steps: 8-12
tags:
  - tag1
  - tag2
```

### Required Fields

- `name`: Kebab-case identifier (e.g., `visualize-a-pipeline`)
- `category`: Always `education` for guided builds
- `subcategory`: Always `guided-build` for this curriculum
- `concept`: Human-readable concept name
- `difficulty`: One of `beginner`, `intermediate`, `advanced`
- `estimated_time_minutes`: Integer within 30-60 range
- `learning_objectives`: At least 3 objectives
- `schematics`: At least 2 entries (starter + complete)
- `build_steps`: Integer matching the guide's step count

### Optional Fields

- `district`: Which Knowledge World district this build belongs in
- `coordinates`: Placement location (may be TBD during planning)
- `prerequisites`: Prior builds or skills needed
- `materials`: Block palette for resource planning
- `tags`: Searchable keywords for catalog filtering

### Integration with Schematic Catalog

The schematic specification file is the source of truth for catalog entries. When builds are captured as `.litematic` files, the catalog (`infra/knowledge-world/schematics/catalog.yaml`) references these spec files for metadata. The flow is:

1. Create guided build guide (`.md`)
2. Create schematic specification (`.yaml`)
3. Build in Minecraft and capture as `.litematic`
4. Register in catalog referencing the spec YAML

---

## 9. Creating Your First Guided Build

This section walks through the methodology using the "Visualize a Pipeline" build as a worked example. Follow along to see how each step of the process produces a concrete result.

### Worked Example: Visualize a Pipeline

**Step 1 -- Identify the concept:** Data pipelines. Good candidate because it has multiple stages (rooms), directional flow (corridors), transformation (processing changes data), and buffering (queues between stages).

**Step 2 -- Map to metaphors:**

| Pipeline Element | Metaphor | Minecraft Structure |
|---|---|---|
| Processing stage | Component/Service | 5x5 stone brick room |
| Data flow | Data flow | 3-wide glazed terracotta corridor |
| Input data | Message/Request | Items in chest |
| Transformation | Processing | Crafting table + redstone |
| Buffer | Queue/Buffer | Hopper chain |
| Error routing | Load balancer | Branching corridor |
| Output | Component/Service | 5x5 room with comparator |

**Step 3 -- Sketch the layout:**
```
[Intake]-->[Validate]-->[Transform]-->[Enrich]-->[Output]
  5x5        5x5          7x7         5x5        5x5
     3-wide     3-wide      3-wide      3-wide
```
Total footprint: approximately 50x15x8 blocks.

**Step 4 -- Define build sequence:** Follow the data flow left to right. Build Intake first (the starting point), then each room and corridor in order. End with the walkthrough.

**Step 5 -- Write instructions:** 10 steps, each with "Build/Concept/Signs" format. See the Visualize a Pipeline guided build for the full implementation.

**Step 6 -- Add self-check questions:** 5 questions embedded at Steps 3, 4, 6, 9, and 10. Plus 5 reflection questions at the end.

**Step 7 -- Create schematic spec:** YAML file with education category, 5 learning objectives, 2 schematics (starter + complete).

**Step 8 -- Playtest timing:** Target 35 minutes for a beginner. 10 steps at 3-4 minutes each.

**Step 9 -- Capture schematics:** `education-pipeline-starter.litematic` and `education-pipeline-complete.litematic`.

### Checklist for New Builds

Before publishing a new guided build, verify:

- [ ] All rooms use the correct block palette (Section 3)
- [ ] All signs follow formatting conventions (Section 4)
- [ ] Every room has at least one concept sign explaining what it represents
- [ ] The build follows data flow direction (left to right or clearly signed)
- [ ] 3-5 self-check questions are embedded at milestones
- [ ] The build fits within 30-60 minutes (playtested)
- [ ] Schematic specification YAML is complete and valid
- [ ] "Real-World Connections" section names at least 3 specific technologies
- [ ] An educator unfamiliar with the concept could follow the guide
- [ ] A Minecraft builder unfamiliar with computing could follow the guide

---

## Appendix A: Block ID Quick Reference

For schematic tools and command blocks, these are the exact Minecraft block IDs used in the palette:

```
# Walls
minecraft:stone_bricks
minecraft:stone_brick_stairs
minecraft:stone_brick_slab
minecraft:mossy_stone_bricks

# Corridors
minecraft:cyan_glazed_terracotta
minecraft:light_blue_glazed_terracotta
minecraft:blue_glazed_terracotta

# Glass
minecraft:glass
minecraft:glass_pane
minecraft:tinted_glass

# Redstone
minecraft:redstone_block
minecraft:redstone_lamp
minecraft:repeater
minecraft:comparator
minecraft:observer
minecraft:piston
minecraft:sticky_piston
minecraft:redstone_torch

# Storage
minecraft:chest
minecraft:barrel
minecraft:hopper
minecraft:bookshelf
minecraft:lectern
minecraft:ender_chest

# Signs
minecraft:oak_sign
minecraft:oak_wall_sign
minecraft:oak_hanging_sign

# Status indicators
minecraft:red_concrete
minecraft:yellow_concrete
minecraft:green_concrete
minecraft:gray_concrete
minecraft:gold_block

# Foundations
minecraft:smooth_stone
minecraft:polished_andesite
minecraft:polished_diorite

# Roofing
minecraft:dark_oak_slab
minecraft:spruce_slab
minecraft:dark_oak_stairs
```

---

## Appendix B: Curriculum Builds Reference

The following guided builds are developed as part of this curriculum. Each demonstrates the methodology in practice.

### Visualize a Pipeline (Beginner)
- **Concept:** Data pipelines and stream processing
- **Structure:** 5 rooms (stages) connected by corridors (data flow)
- **Key metaphors:** Room = stage, corridor = flow, hopper = buffer, branching corridor = error routing
- **Time:** 30-45 minutes
- **District:** Software District

### Build a Network Topology (Intermediate)
- **Concept:** Network architecture, client-server communication
- **Structure:** 3+ buildings (servers) connected by paths (network links) of varying width (bandwidth)
- **Key metaphors:** Building = server, path = network link, path width = bandwidth, iron door = firewall
- **Time:** 40-50 minutes
- **District:** Network District

### Design a Database Schema (Intermediate)
- **Concept:** Relational databases, tables, relationships, queries
- **Structure:** Rooms (tables) with chests (rows), doors sized by relationship cardinality
- **Key metaphors:** Room = table, chest = row, door = relationship, bookshelf = index
- **Time:** 40-50 minutes
- **District:** Software District

---

## Appendix C: Frequently Asked Questions

**Q: Can I use different blocks than the palette?**
A: The palette ensures consistency across all educational builds. If you need a block not in the palette, propose it for inclusion rather than deviating -- other builds will benefit from the addition.

**Q: What if a concept does not fit the spatial metaphor system?**
A: Not every computing concept maps well to spatial construction. Good candidates have components, connections, and flow. If a concept is purely mathematical or algorithmic without spatial relationships, consider pairing it with a concept that does map spatially.

**Q: Can builds be longer than 60 minutes?**
A: Split into parts. A two-part build (Part 1: 35 min, Part 2: 30 min) is better than one 65-minute build where learners lose focus.

**Q: How do I handle concepts that need real-time interaction?**
A: Redstone mechanisms provide limited real-time behavior (signal propagation, clocks, state machines). For concepts requiring true real-time interaction, design the build as a static model with signs explaining the dynamic behavior.

**Q: Should builds work in survival mode?**
A: No. All builds are designed for creative mode. Survival mode adds resource gathering overhead that distracts from learning. The Knowledge World is an educational environment, not a gameplay experience.

---

*This methodology is part of the Knowledge World Educational Curriculum.*
*Reference: Phase 189 -- Educational Curriculum, GSD Skill Creator v1.22*
